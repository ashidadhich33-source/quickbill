import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';

export function setupCustomersHandlers(dbManager: DatabaseManager): void {
  // Find customer by mobile
  ipcMain.handle('customers:findByMobile', async (event, mobile) => {
    try {
      const findCustomerByMobile = dbManager.getStatement('findCustomerByMobile');
      if (!findCustomerByMobile) {
        throw new Error('Required database statement not prepared');
      }

      const customer = findCustomerByMobile.get(mobile);
      return { success: true, data: customer };
    } catch (error) {
      console.error('Error finding customer by mobile:', error);
      return { success: false, error: error.message };
    }
  });

  // Find customer by ID
  ipcMain.handle('customers:findById', async (event, customerId) => {
    try {
      const findCustomerById = dbManager.getStatement('findCustomerById');
      if (!findCustomerById) {
        throw new Error('Required database statement not prepared');
      }

      const customer = findCustomerById.get(customerId);
      return { success: true, data: customer };
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      return { success: false, error: error.message };
    }
  });

  // Search customers
  ipcMain.handle('customers:search', async (event, searchTerm) => {
    try {
      const searchCustomers = dbManager.getStatement('searchCustomers');
      if (!searchCustomers) {
        throw new Error('Required database statement not prepared');
      }

      const searchPattern = `%${searchTerm}%`;
      const customers = searchCustomers.all(searchPattern, searchPattern);
      return { success: true, data: customers };
    } catch (error) {
      console.error('Error searching customers:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new customer
  ipcMain.handle('customers:create', async (event, customerData) => {
    try {
      const db = dbManager.getDatabase();
      const insertCustomer = db.prepare(`
        INSERT INTO customers (
          mobile, name, email, address, city, state, pincode,
          gst_number, credit_limit, current_balance, loyalty_points, customer_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertCustomer.run(
        customerData.mobile,
        customerData.name,
        customerData.email || null,
        customerData.address || null,
        customerData.city || null,
        customerData.state || null,
        customerData.pincode || null,
        customerData.gst_number || null,
        customerData.credit_limit || 0,
        customerData.current_balance || 0,
        customerData.loyalty_points || 0,
        customerData.customer_type || 'RETAIL'
      );

      // Add children if provided
      if (customerData.children && customerData.children.length > 0) {
        const insertChild = db.prepare(`
          INSERT INTO customer_children (customer_id, child_name, date_of_birth, child_order)
          VALUES (?, ?, ?, ?)
        `);

        for (let i = 0; i < customerData.children.length; i++) {
          const child = customerData.children[i];
          insertChild.run(
            result.lastInsertRowid,
            child.name,
            child.date_of_birth,
            i + 1
          );
        }
      }

      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: error.message };
    }
  });

  // Update customer
  ipcMain.handle('customers:update', async (event, customerId, customerData) => {
    try {
      const db = dbManager.getDatabase();
      const updateCustomer = db.prepare(`
        UPDATE customers SET 
          name = ?, email = ?, address = ?, city = ?, state = ?,
          pincode = ?, gst_number = ?, credit_limit = ?, customer_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateCustomer.run(
        customerData.name,
        customerData.email || null,
        customerData.address || null,
        customerData.city || null,
        customerData.state || null,
        customerData.pincode || null,
        customerData.gst_number || null,
        customerData.credit_limit || 0,
        customerData.customer_type || 'RETAIL',
        customerId
      );

      // Update children if provided
      if (customerData.children) {
        // Delete existing children
        const deleteChildren = db.prepare('DELETE FROM customer_children WHERE customer_id = ?');
        deleteChildren.run(customerId);

        // Insert new children
        if (customerData.children.length > 0) {
          const insertChild = db.prepare(`
            INSERT INTO customer_children (customer_id, child_name, date_of_birth, child_order)
            VALUES (?, ?, ?, ?)
          `);

          for (let i = 0; i < customerData.children.length; i++) {
            const child = customerData.children[i];
            insertChild.run(
              customerId,
              child.name,
              child.date_of_birth,
              i + 1
            );
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete customer (soft delete)
  ipcMain.handle('customers:delete', async (event, customerId) => {
    try {
      const db = dbManager.getDatabase();
      const deleteCustomer = db.prepare('UPDATE customers SET is_active = 0 WHERE id = ?');
      deleteCustomer.run(customerId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: error.message };
    }
  });

  // Update customer balance
  ipcMain.handle('customers:updateBalance', async (event, customerId, amount) => {
    try {
      const updateCustomerBalance = dbManager.getStatement('updateCustomerBalance');
      if (!updateCustomerBalance) {
        throw new Error('Required database statement not prepared');
      }

      updateCustomerBalance.run(amount, customerId);
      return { success: true };
    } catch (error) {
      console.error('Error updating customer balance:', error);
      return { success: false, error: error.message };
    }
  });

  // Update loyalty points
  ipcMain.handle('customers:updatePoints', async (event, customerId, points) => {
    try {
      const db = dbManager.getDatabase();
      const updatePoints = db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?');
      updatePoints.run(points, customerId);
      return { success: true };
    } catch (error) {
      console.error('Error updating loyalty points:', error);
      return { success: false, error: error.message };
    }
  });

  // Get customer with children
  ipcMain.handle('customers:getWithChildren', async (event, customerId) => {
    try {
      const db = dbManager.getDatabase();
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
      
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const children = db.prepare(`
        SELECT * FROM customer_children 
        WHERE customer_id = ? 
        ORDER BY child_order
      `).all(customerId);

      return { success: true, data: { ...customer, children } };
    } catch (error) {
      console.error('Error getting customer with children:', error);
      return { success: false, error: error.message };
    }
  });

  // Get customer purchase history
  ipcMain.handle('customers:getPurchaseHistory', async (event, customerId, limit = 50) => {
    try {
      const db = dbManager.getDatabase();
      const history = db.prepare(`
        SELECT 
          s.id,
          s.invoice_number,
          s.invoice_date,
          s.total_amount,
          s.payment_mode,
          s.status
        FROM sales s
        WHERE s.customer_id = ?
        ORDER BY s.invoice_date DESC
        LIMIT ?
      `).all(customerId, limit);

      return { success: true, data: history };
    } catch (error) {
      console.error('Error getting customer purchase history:', error);
      return { success: false, error: error.message };
    }
  });

  // Get customer statistics
  ipcMain.handle('customers:getStatistics', async (event, customerId) => {
    try {
      const db = dbManager.getDatabase();
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_visits,
          SUM(total_amount) as total_spent,
          AVG(total_amount) as avg_bill_value,
          MIN(invoice_date) as first_visit,
          MAX(invoice_date) as last_visit
        FROM sales 
        WHERE customer_id = ? AND status = 'COMPLETED'
      `).get(customerId);

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting customer statistics:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all customers
  ipcMain.handle('customers:getAll', async (event, limit = 100, offset = 0) => {
    try {
      const db = dbManager.getDatabase();
      const customers = db.prepare(`
        SELECT * FROM customers 
        WHERE is_active = 1 
        ORDER BY name 
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM customers WHERE is_active = 1').get().count;

      return { success: true, data: { customers, total } };
    } catch (error) {
      console.error('Error getting all customers:', error);
      return { success: false, error: error.message };
    }
  });

  // Import customers from CSV
  ipcMain.handle('customers:importFromCSV', async (event, csvPath) => {
    try {
      const { BackupManager } = require('../database/backup');
      const backupManager = new BackupManager(dbManager);
      await backupManager.importFromCSV('customers', csvPath);
      return { success: true };
    } catch (error) {
      console.error('Error importing customers from CSV:', error);
      return { success: false, error: error.message };
    }
  });

  // Export customers to CSV
  ipcMain.handle('customers:exportToCSV', async (event, outputPath) => {
    try {
      const { BackupManager } = require('../database/backup');
      const backupManager = new BackupManager(dbManager);
      await backupManager.exportToCSV('customers', outputPath);
      return { success: true };
    } catch (error) {
      console.error('Error exporting customers to CSV:', error);
      return { success: false, error: error.message };
    }
  });
}