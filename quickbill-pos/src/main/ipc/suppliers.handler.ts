import { ipcMain } from 'electron';
import { dbManager } from '../database/connection';
import { Supplier, SupplierFormData, APIResponse, PaginatedResponse } from '../../shared/types';

export function registerSupplierHandlers(): void {
  // Get all suppliers with pagination
  ipcMain.handle('suppliers:getAll', async (event, page = 1, pageSize = 50, searchTerm = '') => {
    try {
      const db = dbManager.getDatabase();
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE is_active = 1';
      let params: any[] = [];
      
      if (searchTerm) {
        whereClause += ' AND (company_name LIKE ? OR supplier_code LIKE ? OR contact_person LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params = [searchPattern, searchPattern, searchPattern];
      }
      
      const suppliers = db.prepare(`
        SELECT * FROM suppliers 
        ${whereClause}
        ORDER BY company_name ASC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM suppliers 
        ${whereClause}
      `).get(...params) as { count: number };
      
      return {
        success: true,
        data: {
          data: suppliers,
          total: totalCount.count,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount.count / pageSize)
        }
      } as APIResponse<PaginatedResponse<Supplier>>;
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return { success: false, error: error.message };
    }
  });

  // Get supplier by ID
  ipcMain.handle('suppliers:getById', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
      
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      
      return { success: true, data: supplier };
    } catch (error) {
      console.error('Error getting supplier:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new supplier
  ipcMain.handle('suppliers:create', async (event, supplierData: SupplierFormData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Check if supplier code already exists
      const existingSupplier = db.prepare('SELECT id FROM suppliers WHERE supplier_code = ?').get(supplierData.supplier_code);
      if (existingSupplier) {
        return { success: false, error: 'Supplier code already exists' };
      }
      
      const result = db.prepare(`
        INSERT INTO suppliers (
          supplier_code, company_name, contact_person, email, phone, mobile,
          address, city, state, pincode, gst_number, pan_number,
          payment_terms, credit_limit, current_balance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        supplierData.supplier_code,
        supplierData.company_name,
        supplierData.contact_person || null,
        supplierData.email || null,
        supplierData.phone || null,
        supplierData.mobile || null,
        supplierData.address || null,
        supplierData.city || null,
        supplierData.state || null,
        supplierData.pincode || null,
        supplierData.gst_number || null,
        supplierData.pan_number || null,
        supplierData.payment_terms || 30,
        supplierData.credit_limit || 0,
        0
      );
      
      const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid) as Supplier;
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('SUPPLIER_CREATED', 1, `Created supplier: ${supplierData.company_name}`);
      
      return { success: true, data: newSupplier };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { success: false, error: error.message };
    }
  });

  // Update supplier
  ipcMain.handle('suppliers:update', async (event, id: number, supplierData: Partial<SupplierFormData>) => {
    try {
      const db = dbManager.getDatabase();
      
      // Check if supplier exists
      const existingSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
      if (!existingSupplier) {
        return { success: false, error: 'Supplier not found' };
      }
      
      // Check if supplier code is being changed and if it already exists
      if (supplierData.supplier_code && supplierData.supplier_code !== existingSupplier.supplier_code) {
        const codeExists = db.prepare('SELECT id FROM suppliers WHERE supplier_code = ? AND id != ?').get(supplierData.supplier_code, id);
        if (codeExists) {
          return { success: false, error: 'Supplier code already exists' };
        }
      }
      
      const updateFields = [];
      const values = [];
      
      Object.entries(supplierData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      db.prepare(`
        UPDATE suppliers 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...values);
      
      const updatedSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('SUPPLIER_UPDATED', 1, `Updated supplier: ${updatedSupplier.company_name}`);
      
      return { success: true, data: updatedSupplier };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete supplier (soft delete)
  ipcMain.handle('suppliers:delete', async (event, id: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      
      // Check if supplier has any purchase orders
      const hasOrders = db.prepare('SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?').get(id) as { count: number };
      if (hasOrders.count > 0) {
        return { success: false, error: 'Cannot delete supplier with existing purchase orders' };
      }
      
      db.prepare('UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      
      // Log the action
      db.prepare(`
        INSERT INTO audit_log (action, user_id, details)
        VALUES (?, ?, ?)
      `).run('SUPPLIER_DELETED', 1, `Deleted supplier: ${supplier.company_name}`);
      
      return { success: true, message: 'Supplier deleted successfully' };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return { success: false, error: error.message };
    }
  });

  // Get supplier balance
  ipcMain.handle('suppliers:getBalance', async (event, supplierId: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId) as Supplier;
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      
      // Calculate outstanding amount from purchase receipts
      const outstandingReceipts = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM purchase_receipts 
        WHERE supplier_id = ? AND status = 'RECEIVED'
      `).get(supplierId) as { total: number };
      
      // Calculate total payments made
      const totalPayments = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM supplier_payments 
        WHERE supplier_id = ?
      `).get(supplierId) as { total: number };
      
      const currentBalance = outstandingReceipts.total - totalPayments.total;
      
      // Update supplier's current balance
      db.prepare('UPDATE suppliers SET current_balance = ? WHERE id = ?').run(currentBalance, supplierId);
      
      return {
        success: true,
        data: {
          supplier_id: supplierId,
          supplier_name: supplier.company_name,
          credit_limit: supplier.credit_limit,
          current_balance: currentBalance,
          outstanding_amount: outstandingReceipts.total,
          total_payments: totalPayments.total
        }
      };
    } catch (error) {
      console.error('Error getting supplier balance:', error);
      return { success: false, error: error.message };
    }
  });

  // Get suppliers for dropdown/selection
  ipcMain.handle('suppliers:getForSelection', async (event) => {
    try {
      const db = dbManager.getDatabase();
      const suppliers = db.prepare(`
        SELECT id, supplier_code, company_name, current_balance
        FROM suppliers 
        WHERE is_active = 1
        ORDER BY company_name ASC
      `).all();
      
      return { success: true, data: suppliers };
    } catch (error) {
      console.error('Error getting suppliers for selection:', error);
      return { success: false, error: error.message };
    }
  });
}