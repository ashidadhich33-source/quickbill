import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { PurchaseReceipt, PurchaseReceiptFormData, PurchaseReceiptItem, APIResponse, PaginatedResponse } from '../../shared/types';

export function registerPurchaseReceiptHandlers(dbManager: DatabaseManager): void {
  // Get all purchase receipts with pagination
  ipcMain.handle('purchase-receipts:getAll', async (event, page = 1, pageSize = 50, searchTerm = '', status = '') => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE 1=1';
      let params: any[] = [];
      
      if (searchTerm) {
        whereClause += ' AND (receipt_number LIKE ? OR supplier_name LIKE ? OR supplier_invoice_number LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      const purchaseReceipts = db.prepare(`
        SELECT * FROM purchase_receipts 
        ${whereClause}
        ORDER BY receipt_date DESC, id DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM purchase_receipts 
        ${whereClause}
      `).get(...params) as { count: number };
      
      return {
        success: true,
        data: {
          data: purchaseReceipts,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<PurchaseReceipt>>;
    } catch (error) {
      console.error('Error getting purchase receipts:', error);
      return { success: false, error: error.message };
    }
  });

  // Get purchase receipt by ID with items
  ipcMain.handle('purchase-receipts:getById', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      const purchaseReceipt = db.prepare('SELECT * FROM purchase_receipts WHERE id = ?').get(id) as PurchaseReceipt;
      
      if (!purchaseReceipt) {
        return { success: false, error: 'Purchase receipt not found' };
      }
      
      const items = db.prepare(`
        SELECT pri.*, i.brand, i.item_description, i.barcode, i.hsn_code
        FROM purchase_receipt_items pri
        LEFT JOIN items i ON pri.item_id = i.id
        WHERE pri.receipt_id = ?
        ORDER BY pri.id
      `).all(id) as PurchaseReceiptItem[];
      
      return { success: true, data: { ...purchaseReceipt, items } };
    } catch (error) {
      console.error('Error getting purchase receipt:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new purchase receipt
  ipcMain.handle('purchase-receipts:create', async (event, receiptData: PurchaseReceiptFormData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Generate receipt number
      const config = db.prepare('SELECT * FROM company_config WHERE id = 1').get();
      const receiptNumber = `PR${config.current_invoice_number.toString().padStart(6, '0')}`;
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Get supplier name
        const supplier = db.prepare('SELECT company_name FROM suppliers WHERE id = ?').get(receiptData.supplier_id);
        if (!supplier) {
          throw new Error('Supplier not found');
        }
        
        // Create purchase receipt
        const receiptResult = db.prepare(`
          INSERT INTO purchase_receipts (
            receipt_number, receipt_date, po_id, supplier_id, supplier_name,
            supplier_invoice_number, supplier_invoice_date, subtotal, discount_amount,
            tax_amount, total_amount, status, notes, received_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          receiptNumber,
          new Date().toISOString().split('T')[0],
          receiptData.po_id || null,
          receiptData.supplier_id,
          supplier.company_name,
          receiptData.supplier_invoice_number || null,
          receiptData.supplier_invoice_date || null,
          0, 0, 0, 0, // Will be calculated
          'RECEIVED',
          receiptData.notes || null,
          1 // TODO: Get from session
        );
        
        const receiptId = receiptResult.lastInsertRowid;
        
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        
        // Add items and update inventory
        for (const item of receiptData.items) {
          const itemDetails = db.prepare('SELECT * FROM items WHERE id = ?').get(item.item_id);
          if (!itemDetails) {
            throw new Error(`Item with ID ${item.item_id} not found`);
          }
          
          const discountAmount = (item.unit_price * item.quantity * (item.discount_percent || 0)) / 100;
          const taxableAmount = (item.unit_price * item.quantity) - discountAmount;
          const taxAmount = (taxableAmount * itemDetails.gst_percentage) / 100;
          const totalAmount = taxableAmount + taxAmount;
          
          subtotal += item.unit_price * item.quantity;
          totalTax += taxAmount;
          
          // Insert receipt item
          db.prepare(`
            INSERT INTO purchase_receipt_items (
              receipt_id, po_item_id, item_id, item_name, quantity, unit_price,
              discount_percent, discount_amount, tax_percent, tax_amount, total_amount,
              batch_number, expiry_date, condition_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            receiptId,
            item.po_item_id || null,
            item.item_id,
            `${itemDetails.brand} - ${itemDetails.item_description}`,
            item.quantity,
            item.unit_price,
            item.discount_percent || 0,
            discountAmount,
            itemDetails.gst_percentage,
            taxAmount,
            totalAmount,
            item.batch_number || null,
            item.expiry_date || null,
            item.condition_status || 'GOOD'
          );
          
          // Update inventory
          if (item.condition_status !== 'DAMAGED') {
            db.prepare(`
              UPDATE items 
              SET current_stock = current_stock + ?, 
                  purchase_rate = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(item.quantity, item.unit_price, item.item_id);
          }
          
          // Update PO item received quantity if linked to PO
          if (item.po_item_id) {
            db.prepare(`
              UPDATE purchase_order_items 
              SET received_quantity = received_quantity + ?,
                  pending_quantity = pending_quantity - ?
              WHERE id = ?
            `).run(item.quantity, item.quantity, item.po_item_id);
          }
        }
        
        const totalAmount = subtotal + totalTax;
        
        // Update receipt totals
        db.prepare(`
          UPDATE purchase_receipts 
          SET subtotal = ?, tax_amount = ?, total_amount = ?
          WHERE id = ?
        `).run(subtotal, totalTax, totalAmount, receiptId);
        
        // Update PO status if linked
        if (receiptData.po_id) {
          const poItems = db.prepare(`
            SELECT COUNT(*) as total, SUM(CASE WHEN pending_quantity = 0 THEN 1 ELSE 0 END) as received
            FROM purchase_order_items 
            WHERE po_id = ?
          `).get(receiptData.po_id) as { total: number; received: number };
          
          let newStatus = 'PARTIALLY_RECEIVED';
          if (poItems.received === poItems.total) {
            newStatus = 'FULLY_RECEIVED';
          }
          
          db.prepare('UPDATE purchase_orders SET status = ? WHERE id = ?').run(newStatus, receiptData.po_id);
        }
        
        // Update invoice number
        db.prepare('UPDATE company_config SET current_invoice_number = current_invoice_number + 1').run();
        
        return receiptId;
      });
      
      const receiptId = transaction();
      
      // Get the created receipt with items
      const purchaseReceipt = db.prepare(`
        SELECT pr.*, pri.*, i.brand, i.item_description, i.barcode
        FROM purchase_receipts pr
        LEFT JOIN purchase_receipt_items pri ON pr.id = pri.receipt_id
        LEFT JOIN items i ON pri.item_id = i.id
        WHERE pr.id = ?
      `).all(receiptId);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RECEIPT_CREATED', 1, `Created receipt: ${receiptNumber}`);
      
      return { success: true, data: purchaseReceipt };
    } catch (error) {
      console.error('Error creating purchase receipt:', error);
      return { success: false, error: error.message };
    }
  });

  // Verify purchase receipt
  ipcMain.handle('purchase-receipts:verify', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const receipt = db.prepare('SELECT * FROM purchase_receipts WHERE id = ?').get(id) as PurchaseReceipt;
      if (!receipt) {
        return { success: false, error: 'Purchase receipt not found' };
      }
      
      if (receipt.status !== 'RECEIVED') {
        return { success: false, error: 'Only received receipts can be verified' };
      }
      
      db.prepare(`
        UPDATE purchase_receipts 
        SET status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RECEIPT_VERIFIED', 1, `Verified receipt: ${receipt.receipt_number}`);
      
      return { success: true, message: 'Purchase receipt verified successfully' };
    } catch (error) {
      console.error('Error verifying purchase receipt:', error);
      return { success: false, error: error.message };
    }
  });

  // Reject purchase receipt
  ipcMain.handle('purchase-receipts:reject', async (event, id: number, reason: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const receipt = db.prepare('SELECT * FROM purchase_receipts WHERE id = ?').get(id) as PurchaseReceipt;
      if (!receipt) {
        return { success: false, error: 'Purchase receipt not found' };
      }
      
      if (receipt.status === 'VERIFIED') {
        return { success: false, error: 'Cannot reject verified receipt' };
      }
      
      // Start transaction to reverse inventory updates
      const transaction = db.transaction(() => {
        // Get receipt items
        const items = db.prepare(`
          SELECT item_id, quantity, condition_status
          FROM purchase_receipt_items 
          WHERE receipt_id = ?
        `).all(id);
        
        // Reverse inventory updates
        for (const item of items) {
          if (item.condition_status !== 'DAMAGED') {
            db.prepare(`
              UPDATE items 
              SET current_stock = current_stock - ?
              WHERE id = ?
            `).run(item.quantity, item.item_id);
          }
        }
        
        // Update receipt status
        db.prepare(`
          UPDATE purchase_receipts 
          SET status = 'REJECTED', notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reason, id);
      });
      
      transaction();
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RECEIPT_REJECTED', 1, `Rejected receipt: ${receipt.receipt_number} - ${reason}`);
      
      return { success: true, message: 'Purchase receipt rejected successfully' };
    } catch (error) {
      console.error('Error rejecting purchase receipt:', error);
      return { success: false, error: error.message };
    }
  });

  // Get receipts by supplier
  ipcMain.handle('purchase-receipts:getBySupplier', async (event, supplierId: number, page = 1, pageSize = 50) => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      const receipts = db.prepare(`
        SELECT * FROM purchase_receipts 
        WHERE supplier_id = ?
        ORDER BY receipt_date DESC
        LIMIT ? OFFSET ?
      `).all(supplierId, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM purchase_receipts 
        WHERE supplier_id = ?
      `).get(supplierId) as { count: number };
      
      return {
        success: true,
        data: {
          data: receipts,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<PurchaseReceipt>>;
    } catch (error) {
      console.error('Error getting receipts by supplier:', error);
      return { success: false, error: error.message };
    }
  });
}