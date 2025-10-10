import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { generateInvoiceNumber } from '../database/queries';

export function setupReturnsHandlers(dbManager: DatabaseManager): void {
  // Create sales return
  ipcMain.handle('returns:create', async (event, returnData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Generate return number
      const returnNumber = `RET-${Date.now()}`;
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Create return record
        const returnResult = db.prepare(`
          INSERT INTO sales_returns (
            return_number, original_sale_id, return_date, customer_id,
            customer_name, customer_mobile, reason, return_amount,
            refund_amount, refund_mode, status, processed_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          returnNumber,
          returnData.originalSaleId,
          new Date().toISOString(),
          returnData.customerId,
          returnData.customerName,
          returnData.customerMobile,
          returnData.reason,
          returnData.returnAmount,
          returnData.refundAmount,
          returnData.refundMode || 'CASH',
          'COMPLETED',
          returnData.processedBy || 1
        );

        const returnId = returnResult.lastInsertRowid;

        // Create return items
        for (const item of returnData.items) {
          db.prepare(`
            INSERT INTO sales_return_items (
              return_id, original_item_id, item_id, barcode,
              item_name, quantity, unit_price, return_reason,
              condition_status, refund_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            returnId,
            item.originalItemId,
            item.itemId,
            item.barcode,
            item.itemName,
            item.quantity,
            item.unitPrice,
            item.returnReason,
            item.conditionStatus || 'GOOD',
            item.refundAmount
          );

          // Update item stock
          db.prepare(`
            UPDATE items SET current_stock = current_stock + ? WHERE id = ?
          `).run(item.quantity, item.itemId);
        }

        // Update customer balance if applicable
        if (returnData.customerId && returnData.refundMode === 'CREDIT') {
          db.prepare(`
            UPDATE customers SET current_balance = current_balance + ? WHERE id = ?
          `).run(returnData.refundAmount, returnData.customerId);
        }

        return { returnId, returnNumber };
      });

      const result = transaction();

      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating sales return:', error);
      return { success: false, error: error.message };
    }
  });

  // Get sales return by ID
  ipcMain.handle('returns:getById', async (event, returnId) => {
    try {
      const db = dbManager.getDatabase();
      
      const returnRecord = db.prepare(`
        SELECT sr.*, s.invoice_number as original_invoice_number
        FROM sales_returns sr
        JOIN sales s ON sr.original_sale_id = s.id
        WHERE sr.id = ?
      `).get(returnId);

      if (!returnRecord) {
        return { success: false, error: 'Return not found' };
      }

      const returnItems = db.prepare(`
        SELECT sri.*, i.brand, i.item_description
        FROM sales_return_items sri
        JOIN items i ON sri.item_id = i.id
        WHERE sri.return_id = ?
      `).all(returnId);

      return { 
        success: true, 
        data: { ...returnRecord, items: returnItems } 
      };
    } catch (error) {
      console.error('Error getting sales return:', error);
      return { success: false, error: error.message };
    }
  });

  // Get sales returns by date range
  ipcMain.handle('returns:getByDateRange', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      
      const returns = db.prepare(`
        SELECT sr.*, s.invoice_number as original_invoice_number,
               u.full_name as processed_by_name
        FROM sales_returns sr
        JOIN sales s ON sr.original_sale_id = s.id
        LEFT JOIN users u ON sr.processed_by = u.id
        WHERE DATE(sr.return_date) BETWEEN ? AND ?
        ORDER BY sr.return_date DESC
      `).all(startDate, endDate);

      return { success: true, data: returns };
    } catch (error) {
      console.error('Error getting sales returns:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all sales returns with pagination
  ipcMain.handle('returns:getAll', async (event, limit = 50, offset = 0) => {
    try {
      const db = dbManager.getDatabase();
      
      const returns = db.prepare(`
        SELECT sr.*, s.invoice_number as original_invoice_number,
               u.full_name as processed_by_name
        FROM sales_returns sr
        JOIN sales s ON sr.original_sale_id = s.id
        LEFT JOIN users u ON sr.processed_by = u.id
        ORDER BY sr.return_date DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM sales_returns').get().count;

      return { success: true, data: { returns, total } };
    } catch (error) {
      console.error('Error getting all sales returns:', error);
      return { success: false, error: error.message };
    }
  });

  // Get return statistics
  ipcMain.handle('returns:getStatistics', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_returns,
          SUM(return_amount) as total_return_amount,
          SUM(refund_amount) as total_refund_amount,
          AVG(return_amount) as avg_return_amount
        FROM sales_returns
        WHERE DATE(return_date) BETWEEN ? AND ?
      `).get(startDate, endDate);

      const returnsByReason = db.prepare(`
        SELECT reason, COUNT(*) as count, SUM(return_amount) as amount
        FROM sales_returns
        WHERE DATE(return_date) BETWEEN ? AND ?
        GROUP BY reason
        ORDER BY count DESC
      `).all(startDate, endDate);

      const returnsByMode = db.prepare(`
        SELECT refund_mode, COUNT(*) as count, SUM(refund_amount) as amount
        FROM sales_returns
        WHERE DATE(return_date) BETWEEN ? AND ?
        GROUP BY refund_mode
        ORDER BY count DESC
      `).all(startDate, endDate);

      return { 
        success: true, 
        data: { 
          stats, 
          returnsByReason, 
          returnsByMode 
        } 
      };
    } catch (error) {
      console.error('Error getting return statistics:', error);
      return { success: false, error: error.message };
    }
  });

  // Get original sale for return
  ipcMain.handle('returns:getOriginalSale', async (event, saleId) => {
    try {
      const db = dbManager.getDatabase();
      
      const sale = db.prepare(`
        SELECT s.*, c.name as customer_name, c.mobile as customer_mobile
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `).get(saleId);

      if (!sale) {
        return { success: false, error: 'Sale not found' };
      }

      const saleItems = db.prepare(`
        SELECT si.*, i.brand, i.item_description, i.current_stock
        FROM sales_items si
        JOIN items i ON si.item_id = i.id
        WHERE si.sales_id = ?
      `).all(saleId);

      return { 
        success: true, 
        data: { ...sale, items: saleItems } 
      };
    } catch (error) {
      console.error('Error getting original sale:', error);
      return { success: false, error: error.message };
    }
  });

  // Update return status
  ipcMain.handle('returns:updateStatus', async (event, returnId, status) => {
    try {
      const db = dbManager.getDatabase();
      
      db.prepare(`
        UPDATE sales_returns SET status = ? WHERE id = ?
      `).run(status, returnId);

      return { success: true };
    } catch (error) {
      console.error('Error updating return status:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete return (soft delete by updating status)
  ipcMain.handle('returns:delete', async (event, returnId) => {
    try {
      const db = dbManager.getDatabase();
      
      // Get return items to reverse stock updates
      const returnItems = db.prepare(`
        SELECT item_id, quantity FROM sales_return_items WHERE return_id = ?
      `).all(returnId);

      // Reverse stock updates
      for (const item of returnItems) {
        db.prepare(`
          UPDATE items SET current_stock = current_stock - ? WHERE id = ?
        `).run(item.quantity, item.item_id);
      }

      // Update return status to CANCELLED
      db.prepare(`
        UPDATE sales_returns SET status = 'CANCELLED' WHERE id = ?
      `).run(returnId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting return:', error);
      return { success: false, error: error.message };
    }
  });

  // Get return items for a specific return
  ipcMain.handle('returns:getItems', async (event, returnId) => {
    try {
      const db = dbManager.getDatabase();
      
      const items = db.prepare(`
        SELECT sri.*, i.brand, i.item_description, i.current_stock
        FROM sales_return_items sri
        JOIN items i ON sri.item_id = i.id
        WHERE sri.return_id = ?
      `).all(returnId);

      return { success: true, data: items };
    } catch (error) {
      console.error('Error getting return items:', error);
      return { success: false, error: error.message };
    }
  });
}