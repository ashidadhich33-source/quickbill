import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { SupplierPayment, SupplierPaymentFormData, APIResponse, PaginatedResponse } from '../../shared/types';

export function registerSupplierPaymentHandlers(dbManager: DatabaseManager): void {
  // Get all supplier payments with pagination
  ipcMain.handle('supplier-payments:getAll', async (event, page = 1, pageSize = 50, searchTerm = '') => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      if (searchTerm) {
        whereClause += ' AND (payment_number LIKE ? OR supplier_name LIKE ? OR reference_number LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      const payments = db.prepare(`
        SELECT * FROM supplier_payments 
        ${whereClause}
        ORDER BY payment_date DESC, id DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM supplier_payments 
        ${whereClause}
      `).get(...params) as { count: number };
      
      return {
        success: true,
        data: {
          data: payments,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<SupplierPayment>>;
    } catch (error) {
      console.error('Error getting supplier payments:', error);
      return { success: false, error: error.message };
    }
  });

  // Get supplier payment by ID
  ipcMain.handle('supplier-payments:getById', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      const payment = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id) as SupplierPayment;
      
      if (!payment) {
        return { success: false, error: 'Supplier payment not found' };
      }
      
      return { success: true, data: payment };
    } catch (error) {
      console.error('Error getting supplier payment:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new supplier payment
  ipcMain.handle('supplier-payments:create', async (event, paymentData: SupplierPaymentFormData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Generate payment number
      const config = db.prepare('SELECT * FROM company_config WHERE id = 1').get();
      const paymentNumber = `PAY${config.current_invoice_number.toString().padStart(6, '0')}`;
      
      // Get supplier name
      const supplier = db.prepare('SELECT company_name FROM suppliers WHERE id = ?').get(paymentData.supplier_id);
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Create payment
        const result = db.prepare(`
          INSERT INTO supplier_payments (
            payment_number, payment_date, supplier_id, supplier_name, amount,
            payment_mode, reference_number, notes, receipt_ids, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          paymentNumber,
          new Date().toISOString().split('T')[0],
          paymentData.supplier_id,
          supplier.company_name,
          paymentData.amount,
          paymentData.payment_mode,
          paymentData.reference_number || null,
          paymentData.notes || null,
          paymentData.receipt_ids ? paymentData.receipt_ids.join(',') : null,
          1 // TODO: Get from session
        );
        
        const paymentId = result.lastInsertRowid;
        
        // Update supplier balance
        db.prepare(`
          UPDATE suppliers 
          SET current_balance = current_balance - ?
          WHERE id = ?
        `).run(paymentData.amount, paymentData.supplier_id);
        
        // Update invoice number
        db.prepare('UPDATE company_config SET current_invoice_number = current_invoice_number + 1').run();
        
        return paymentId;
      });
      
      const paymentId = transaction();
      
      // Get the created payment
      const payment = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(paymentId) as SupplierPayment;
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('SUPPLIER_PAYMENT_CREATED', 1, `Created payment: ${paymentNumber} for ${supplier.company_name}`);
      
      return { success: true, data: payment };
    } catch (error) {
      console.error('Error creating supplier payment:', error);
      return { success: false, error: error.message };
    }
  });

  // Get payments by supplier
  ipcMain.handle('supplier-payments:getBySupplier', async (event, supplierId: number, page = 1, pageSize = 50) => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      const payments = db.prepare(`
        SELECT * FROM supplier_payments 
        WHERE supplier_id = ?
        ORDER BY payment_date DESC
        LIMIT ? OFFSET ?
      `).all(supplierId, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM supplier_payments 
        WHERE supplier_id = ?
      `).get(supplierId) as { count: number };
      
      return {
        success: true,
        data: {
          data: payments,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<SupplierPayment>>;
    } catch (error) {
      console.error('Error getting payments by supplier:', error);
      return { success: false, error: error.message };
    }
  });

  // Get supplier outstanding balance
  ipcMain.handle('supplier-payments:getOutstandingBalance', async (event, supplierId: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId);
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      
      // Get outstanding receipts
      const outstandingReceipts = db.prepare(`
        SELECT 
          pr.id,
          pr.receipt_number,
          pr.receipt_date,
          pr.total_amount,
          pr.supplier_invoice_number,
          pr.supplier_invoice_date
        FROM purchase_receipts pr
        WHERE pr.supplier_id = ? 
          AND pr.status IN ('RECEIVED', 'VERIFIED')
        ORDER BY pr.receipt_date ASC
      `).all(supplierId);
      
      // Get total payments
      const totalPayments = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM supplier_payments 
        WHERE supplier_id = ?
      `).get(supplierId) as { total: number };
      
      // Calculate outstanding amount
      const totalOutstanding = outstandingReceipts.reduce((sum, receipt) => sum + receipt.total_amount, 0);
      const currentBalance = totalOutstanding - totalPayments.total;
      
      return {
        success: true,
        data: {
          supplier_id: supplierId,
          supplier_name: supplier.company_name,
          credit_limit: supplier.credit_limit,
          current_balance: currentBalance,
          total_outstanding: totalOutstanding,
          total_payments: totalPayments.total,
          outstanding_receipts: outstandingReceipts
        }
      };
    } catch (error) {
      console.error('Error getting outstanding balance:', error);
      return { success: false, error: error.message };
    }
  });

  // Get payment summary by date range
  ipcMain.handle('supplier-payments:getSummary', async (event, startDate: string, endDate: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const summary = db.prepare(`
        SELECT 
          payment_mode,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM supplier_payments 
        WHERE payment_date BETWEEN ? AND ?
        GROUP BY payment_mode
        ORDER BY total_amount DESC
      `).all(startDate, endDate);
      
      const totalPayments = db.prepare(`
        SELECT 
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM supplier_payments 
        WHERE payment_date BETWEEN ? AND ?
      `).get(startDate, endDate);
      
      return {
        success: true,
        data: {
          summary,
          total: totalPayments
        }
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete supplier payment (only if recent)
  ipcMain.handle('supplier-payments:delete', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const payment = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id) as SupplierPayment;
      if (!payment) {
        return { success: false, error: 'Supplier payment not found' };
      }
      
      // Check if payment is recent (within 24 hours)
      const paymentDate = new Date(payment.payment_date);
      const now = new Date();
      const hoursDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return { success: false, error: 'Can only delete payments made within 24 hours' };
      }
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Reverse supplier balance update
        db.prepare(`
          UPDATE suppliers 
          SET current_balance = current_balance + ?
          WHERE id = ?
        `).run(payment.amount, payment.supplier_id);
        
        // Delete payment
        db.prepare('DELETE FROM supplier_payments WHERE id = ?').run(id);
      });
      
      transaction();
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('SUPPLIER_PAYMENT_DELETED', 1, `Deleted payment: ${payment.payment_number}`);
      
      return { success: true, message: 'Supplier payment deleted successfully' };
    } catch (error) {
      console.error('Error deleting supplier payment:', error);
      return { success: false, error: error.message };
    }
  });
}