import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderItem, APIResponse, PaginatedResponse } from '../../shared/types';

export function registerPurchaseOrderHandlers(dbManager: DatabaseManager): void {
  // Get all purchase orders with pagination
  ipcMain.handle('purchase-orders:getAll', async (event, page = 1, pageSize = 50, searchTerm = '', status = '') => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      if (searchTerm) {
        whereClause += ' AND (po_number LIKE ? OR supplier_name LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      const purchaseOrders = db.prepare(`
        SELECT * FROM purchase_orders 
        ${whereClause}
        ORDER BY po_date DESC, id DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM purchase_orders 
        ${whereClause}
      `).get(...params) as { count: number };
      
      return {
        success: true,
        data: {
          data: purchaseOrders,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<PurchaseOrder>>;
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return { success: false, error: error.message };
    }
  });

  // Get purchase order by ID with items
  ipcMain.handle('purchase-orders:getById', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      const purchaseOrder = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as PurchaseOrder;
      
      if (!purchaseOrder) {
        return { success: false, error: 'Purchase order not found' };
      }
      
      const items = db.prepare(`
        SELECT poi.*, i.brand, i.item_description, i.barcode, i.hsn_code
        FROM purchase_order_items poi
        LEFT JOIN items i ON poi.item_id = i.id
        WHERE poi.po_id = ?
        ORDER BY poi.id
      `).all(id) as PurchaseOrderItem[];
      
      return { success: true, data: { ...purchaseOrder, items } };
    } catch (error) {
      console.error('Error getting purchase order:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new purchase order
  ipcMain.handle('purchase-orders:create', async (event, poData: PurchaseOrderFormData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Generate PO number
      const config = db.prepare('SELECT * FROM company_config WHERE id = 1').get();
      const poNumber = `PO${config.current_invoice_number.toString().padStart(6, '0')}`;
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Create purchase order
        const poResult = db.prepare(`
          INSERT INTO purchase_orders (
            po_number, po_date, supplier_id, supplier_name, expected_delivery_date,
            subtotal, discount_amount, tax_amount, total_amount, status, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          poNumber,
          new Date().toISOString().split('T')[0],
          poData.supplier_id,
          '', // Will be updated with supplier name
          poData.expected_delivery_date || null,
          0, 0, 0, 0, // Will be calculated
          'DRAFT',
          poData.notes || null,
          1 // TODO: Get from session
        );
        
        const poId = poResult.lastInsertRowid;
        
        // Get supplier name
        const supplier = db.prepare('SELECT company_name FROM suppliers WHERE id = ?').get(poData.supplier_id);
        if (!supplier) {
          throw new Error('Supplier not found');
        }
        
        // Update supplier name in PO
        db.prepare('UPDATE purchase_orders SET supplier_name = ? WHERE id = ?').run(supplier.company_name, poId);
        
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        
        // Add items
        for (const item of poData.items) {
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
          
          db.prepare(`
            INSERT INTO purchase_order_items (
              po_id, item_id, item_name, quantity, unit_price, discount_percent,
              discount_amount, tax_percent, tax_amount, total_amount, pending_quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            poId,
            item.item_id,
            `${itemDetails.brand} - ${itemDetails.item_description}`,
            item.quantity,
            item.unit_price,
            item.discount_percent || 0,
            discountAmount,
            itemDetails.gst_percentage,
            taxAmount,
            totalAmount,
            item.quantity
          );
        }
        
        const totalAmount = subtotal + totalTax;
        
        // Update PO totals
        db.prepare(`
          UPDATE purchase_orders 
          SET subtotal = ?, tax_amount = ?, total_amount = ?
          WHERE id = ?
        `).run(subtotal, totalTax, totalAmount, poId);
        
        // Update invoice number
        db.prepare('UPDATE company_config SET current_invoice_number = current_invoice_number + 1').run();
        
        return poId;
      });
      
      const poId = transaction();
      
      // Get the created PO with items
      const purchaseOrder = db.prepare(`
        SELECT po.*, poi.*, i.brand, i.item_description, i.barcode
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
        LEFT JOIN items i ON poi.item_id = i.id
        WHERE po.id = ?
      `).all(poId);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_ORDER_CREATED', 1, `Created PO: ${poNumber}`);
      
      return { success: true, data: purchaseOrder };
    } catch (error) {
      console.error('Error creating purchase order:', error);
      return { success: false, error: error.message };
    }
  });

  // Update purchase order
  ipcMain.handle('purchase-orders:update', async (event, id: number, poData: Partial<PurchaseOrderFormData>) => {
    try {
      const db = dbManager.getDatabase();
      
      const existingPO = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as PurchaseOrder;
      if (!existingPO) {
        return { success: false, error: 'Purchase order not found' };
      }
      
      if (existingPO.status !== 'DRAFT') {
        return { success: false, error: 'Can only update draft purchase orders' };
      }
      
      // Update basic fields
      if (poData.expected_delivery_date !== undefined) {
        db.prepare('UPDATE purchase_orders SET expected_delivery_date = ? WHERE id = ?').run(poData.expected_delivery_date, id);
      }
      
      if (poData.notes !== undefined) {
        db.prepare('UPDATE purchase_orders SET notes = ? WHERE id = ?').run(poData.notes, id);
      }
      
      // Update items if provided
      if (poData.items) {
        // Delete existing items
        db.prepare('DELETE FROM purchase_order_items WHERE po_id = ?').run(id);
        
        // Add new items
        let subtotal = 0;
        let totalTax = 0;
        
        for (const item of poData.items) {
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
          
          db.prepare(`
            INSERT INTO purchase_order_items (
              po_id, item_id, item_name, quantity, unit_price, discount_percent,
              discount_amount, tax_percent, tax_amount, total_amount, pending_quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            item.item_id,
            `${itemDetails.brand} - ${itemDetails.item_description}`,
            item.quantity,
            item.unit_price,
            item.discount_percent || 0,
            discountAmount,
            itemDetails.gst_percentage,
            taxAmount,
            totalAmount,
            item.quantity
          );
        }
        
        const totalAmount = subtotal + totalTax;
        
        // Update PO totals
        db.prepare(`
          UPDATE purchase_orders 
          SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(subtotal, totalTax, totalAmount, id);
      }
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_ORDER_UPDATED', 1, `Updated PO: ${existingPO.po_number}`);
      
      return { success: true, message: 'Purchase order updated successfully' };
    } catch (error) {
      console.error('Error updating purchase order:', error);
      return { success: false, error: error.message };
    }
  });

  // Approve purchase order
  ipcMain.handle('purchase-orders:approve', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as PurchaseOrder;
      if (!po) {
        return { success: false, error: 'Purchase order not found' };
      }
      
      if (po.status !== 'DRAFT') {
        return { success: false, error: 'Only draft purchase orders can be approved' };
      }
      
      db.prepare(`
        UPDATE purchase_orders 
        SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(1, id); // TODO: Get from session
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_ORDER_APPROVED', 1, `Approved PO: ${po.po_number}`);
      
      return { success: true, message: 'Purchase order approved successfully' };
    } catch (error) {
      console.error('Error approving purchase order:', error);
      return { success: false, error: error.message };
    }
  });

  // Cancel purchase order
  ipcMain.handle('purchase-orders:cancel', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as PurchaseOrder;
      if (!po) {
        return { success: false, error: 'Purchase order not found' };
      }
      
      if (po.status === 'CANCELLED') {
        return { success: false, error: 'Purchase order is already cancelled' };
      }
      
      if (po.status === 'FULLY_RECEIVED') {
        return { success: false, error: 'Cannot cancel fully received purchase order' };
      }
      
      db.prepare(`
        UPDATE purchase_orders 
        SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_ORDER_CANCELLED', 1, `Cancelled PO: ${po.po_number}`);
      
      return { success: true, message: 'Purchase order cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete purchase order (only if draft)
  ipcMain.handle('purchase-orders:delete', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as PurchaseOrder;
      if (!po) {
        return { success: false, error: 'Purchase order not found' };
      }
      
      if (po.status !== 'DRAFT') {
        return { success: false, error: 'Can only delete draft purchase orders' };
      }
      
      // Delete items first
      db.prepare('DELETE FROM purchase_order_items WHERE po_id = ?').run(id);
      
      // Delete PO
      db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(id);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('PURCHASE_ORDER_DELETED', 1, `Deleted PO: ${po.po_number}`);
      
      return { success: true, message: 'Purchase order deleted successfully' };
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      return { success: false, error: error.message };
    }
  });
}