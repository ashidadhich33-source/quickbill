import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { PurchaseReturn, PurchaseReturnFormData, APIResponse, PaginatedResponse } from '../../shared/types';

export function registerPurchaseReturnHandlers(dbManager: DatabaseManager): void {
  // Get all purchase returns with pagination
  ipcMain.handle('purchase-returns:getAll', async (event, page = 1, pageSize = 50, searchTerm = '', status = '') => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      if (searchTerm) {
        whereClause += ' AND (return_number LIKE ? OR supplier_name LIKE ? OR reason LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      const purchaseReturns = db.prepare(`
        SELECT * FROM purchase_returns 
        ${whereClause}
        ORDER BY return_date DESC, id DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM purchase_returns 
        ${whereClause}
      `).get(...params) as { count: number };
      
      return {
        success: true,
        data: {
          data: purchaseReturns,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<PurchaseReturn>>;
    } catch (error) {
      console.error('Error getting purchase returns:', error);
      return { success: false, error: error.message };
    }
  });

  // Get purchase return by ID with items
  ipcMain.handle('purchase-returns:getById', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      const purchaseReturn = db.prepare('SELECT * FROM purchase_returns WHERE id = ?').get(id) as PurchaseReturn;
      
      if (!purchaseReturn) {
        return { success: false, error: 'Purchase return not found' };
      }
      
      const items = db.prepare(`
        SELECT pri.*, i.brand, i.item_description, i.barcode, i.hsn_code
        FROM purchase_return_items pri
        LEFT JOIN items i ON pri.item_id = i.id
        WHERE pri.return_id = ?
        ORDER BY pri.id
      `).all(id);
      
      return { success: true, data: { ...purchaseReturn, items } };
    } catch (error) {
      console.error('Error getting purchase return:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new purchase return
  ipcMain.handle('purchase-returns:create', async (event, returnData: PurchaseReturnFormData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Generate return number
      const config = db.prepare('SELECT * FROM company_config WHERE id = 1').get();
      const returnNumber = `PR${config.current_invoice_number.toString().padStart(6, '0')}`;
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Get receipt details
        const receipt = db.prepare(`
          SELECT pr.*, s.company_name 
          FROM purchase_receipts pr
          LEFT JOIN suppliers s ON pr.supplier_id = s.id
          WHERE pr.id = ?
        `).get(returnData.receipt_id);
        
        if (!receipt) {
          throw new Error('Purchase receipt not found');
        }
        
        // Create purchase return
        const returnResult = db.prepare(`
          INSERT INTO purchase_returns (
            return_number, return_date, receipt_id, supplier_id, supplier_name,
            reason, subtotal, tax_amount, total_amount, status, notes, processed_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          returnNumber,
          new Date().toISOString().split('T')[0],
          returnData.receipt_id,
          receipt.supplier_id,
          receipt.company_name,
          returnData.reason,
          0, 0, 0, // Will be calculated
          'PENDING',
          returnData.notes || null,
          1 // TODO: Get from session
        );
        
        const returnId = returnResult.lastInsertRowid;
        
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        
        // Add items and update inventory
        for (const item of returnData.items) {
          const receiptItem = db.prepare(`
            SELECT pri.*, i.gst_percentage
            FROM purchase_receipt_items pri
            LEFT JOIN items i ON pri.item_id = i.id
            WHERE pri.id = ?
          `).get(item.receipt_item_id);
          
          if (!receiptItem) {
            throw new Error(`Receipt item with ID ${item.receipt_item_id} not found`);
          }
          
          const taxableAmount = item.quantity * receiptItem.unit_price;
          const taxAmount = (taxableAmount * receiptItem.gst_percentage) / 100;
          const totalAmount = taxableAmount + taxAmount;
          
          subtotal += taxableAmount;
          totalTax += taxAmount;
          
          // Insert return item
          db.prepare(`
            INSERT INTO purchase_return_items (
              return_id, receipt_item_id, item_id, item_name, quantity, unit_price,
              tax_percent, tax_amount, total_amount, return_reason, condition_status,
              batch_number, expiry_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            returnId,
            item.receipt_item_id,
            receiptItem.item_id,
            receiptItem.item_name,
            item.quantity,
            receiptItem.unit_price,
            receiptItem.gst_percentage,
            taxAmount,
            totalAmount,
            item.return_reason,
            item.condition_status,
            receiptItem.batch_number,
            receiptItem.expiry_date
          );
          
          // Update inventory (reduce stock)
          db.prepare(`
            UPDATE items 
            SET current_stock = current_stock - ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.quantity, receiptItem.item_id);
        }
        
        const totalAmount = subtotal + totalTax;
        
        // Update return totals
        db.prepare(`
          UPDATE purchase_returns 
          SET subtotal = ?, tax_amount = ?, total_amount = ?
          WHERE id = ?
        `).run(subtotal, totalTax, totalAmount, returnId);
        
        // Update invoice number
        db.prepare('UPDATE company_config SET current_invoice_number = current_invoice_number + 1').run();
        
        return returnId;
      });
      
      const returnId = transaction();
      
      // Get the created return with items
      const purchaseReturn = db.prepare(`
        SELECT pr.*, pri.*, i.brand, i.item_description, i.barcode
        FROM purchase_returns pr
        LEFT JOIN purchase_return_items pri ON pr.id = pri.return_id
        LEFT JOIN items i ON pri.item_id = i.id
        WHERE pr.id = ?
      `).all(returnId);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RETURN_CREATED', 1, `Created return: ${returnNumber}`);
      
      return { success: true, data: purchaseReturn };
    } catch (error) {
      console.error('Error creating purchase return:', error);
      return { success: false, error: error.message };
    }
  });

  // Approve purchase return
  ipcMain.handle('purchase-returns:approve', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const returnRecord = db.prepare('SELECT * FROM purchase_returns WHERE id = ?').get(id) as PurchaseReturn;
      if (!returnRecord) {
        return { success: false, error: 'Purchase return not found' };
      }
      
      if (returnRecord.status !== 'PENDING') {
        return { success: false, error: 'Only pending returns can be approved' };
      }
      
      db.prepare(`
        UPDATE purchase_returns 
        SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RETURN_APPROVED', 1, `Approved return: ${returnRecord.return_number}`);
      
      return { success: true, message: 'Purchase return approved successfully' };
    } catch (error) {
      console.error('Error approving purchase return:', error);
      return { success: false, error: error.message };
    }
  });

  // Reject purchase return
  ipcMain.handle('purchase-returns:reject', async (event, id: number, reason: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const returnRecord = db.prepare('SELECT * FROM purchase_returns WHERE id = ?').get(id) as PurchaseReturn;
      if (!returnRecord) {
        return { success: false, error: 'Purchase return not found' };
      }
      
      if (returnRecord.status !== 'PENDING') {
        return { success: false, error: 'Only pending returns can be rejected' };
      }
      
      // Start transaction to reverse inventory updates
      const transaction = db.transaction(() => {
        // Get return items
        const items = db.prepare(`
          SELECT item_id, quantity
          FROM purchase_return_items 
          WHERE return_id = ?
        `).all(id);
        
        // Reverse inventory updates (add back stock)
        for (const item of items) {
          db.prepare(`
            UPDATE items 
            SET current_stock = current_stock + ?
            WHERE id = ?
          `).run(item.quantity, item.item_id);
        }
        
        // Update return status
        db.prepare(`
          UPDATE purchase_returns 
          SET status = 'REJECTED', notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reason, id);
      });
      
      transaction();
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RETURN_REJECTED', 1, `Rejected return: ${returnRecord.return_number} - ${reason}`);
      
      return { success: true, message: 'Purchase return rejected successfully' };
    } catch (error) {
      console.error('Error rejecting purchase return:', error);
      return { success: false, error: error.message };
    }
  });

  // Process purchase return (final step)
  ipcMain.handle('purchase-returns:process', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const returnRecord = db.prepare('SELECT * FROM purchase_returns WHERE id = ?').get(id) as PurchaseReturn;
      if (!returnRecord) {
        return { success: false, error: 'Purchase return not found' };
      }
      
      if (returnRecord.status !== 'APPROVED') {
        return { success: false, error: 'Only approved returns can be processed' };
      }
      
      db.prepare(`
        UPDATE purchase_returns 
        SET status = 'PROCESSED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_RETURN_PROCESSED', 1, `Processed return: ${returnRecord.return_number}`);
      
      return { success: true, message: 'Purchase return processed successfully' };
    } catch (error) {
      console.error('Error processing purchase return:', error);
      return { success: false, error: error.message };
    }
  });

  // Get returns by supplier
  ipcMain.handle('purchase-returns:getBySupplier', async (event, supplierId: number, page = 1, pageSize = 50) => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      const returns = db.prepare(`
        SELECT * FROM purchase_returns 
        WHERE supplier_id = ?
        ORDER BY return_date DESC
        LIMIT ? OFFSET ?
      `).all(supplierId, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM purchase_returns 
        WHERE supplier_id = ?
      `).get(supplierId) as { count: number };
      
      return {
        success: true,
        data: {
          data: returns,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<PurchaseReturn>>;
    } catch (error) {
      console.error('Error getting returns by supplier:', error);
      return { success: false, error: error.message };
    }
  });

  // Get available receipts for return
  ipcMain.handle('purchase-returns:getAvailableReceipts', async (event, supplierId?: number) => {
    try {
      const db = dbManager.getDatabase();
      
      let whereClause = 'WHERE pr.status IN (?, ?)';
      let params: any[] = ['RECEIVED', 'VERIFIED'];
      
      if (supplierId) {
        whereClause += ' AND pr.supplier_id = ?';
        params.push(supplierId);
      }
      
      const receipts = db.prepare(`
        SELECT 
          pr.id,
          pr.receipt_number,
          pr.receipt_date,
          pr.supplier_name,
          pr.total_amount,
          COUNT(pri.id) as item_count
        FROM purchase_receipts pr
        LEFT JOIN purchase_receipt_items pri ON pr.id = pri.receipt_id
        ${whereClause}
        GROUP BY pr.id
        ORDER BY pr.receipt_date DESC
      `).all(...params);
      
      return { success: true, data: receipts };
    } catch (error) {
      console.error('Error getting available receipts:', error);
      return { success: false, error: error.message };
    }
  });

  // Get receipt items for return
  ipcMain.handle('purchase-returns:getReceiptItems', async (event, receiptId: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const items = db.prepare(`
        SELECT 
          pri.id as receipt_item_id,
          pri.item_id,
          pri.item_name,
          pri.quantity as received_quantity,
          pri.unit_price,
          pri.tax_percent,
          pri.batch_number,
          pri.expiry_date,
          i.brand,
          i.item_description,
          i.barcode
        FROM purchase_receipt_items pri
        LEFT JOIN items i ON pri.item_id = i.id
        WHERE pri.receipt_id = ?
        ORDER BY pri.id
      `).all(receiptId);
      
      return { success: true, data: items };
    } catch (error) {
      console.error('Error getting receipt items:', error);
      return { success: false, error: error.message };
    }
  });
}