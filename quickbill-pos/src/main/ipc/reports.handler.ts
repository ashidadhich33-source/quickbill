import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';

export function setupReportsHandlers(dbManager: DatabaseManager): void {
  // Get sales summary
  ipcMain.handle('reports:getSalesSummary', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      const summary = db.prepare(`
        SELECT 
          DATE(invoice_date) as date,
          COUNT(*) as total_bills,
          SUM(subtotal) as subtotal,
          SUM(discount_amount) as total_discount,
          SUM(tax_amount) as total_tax,
          SUM(total_amount) as total_sales
        FROM sales 
        WHERE DATE(invoice_date) BETWEEN ? AND ?
        GROUP BY DATE(invoice_date)
        ORDER BY date
      `).all(startDate, endDate);

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error getting sales summary:', error);
      return { success: false, error: error.message };
    }
  });

  // Get top items
  ipcMain.handle('reports:getTopItems', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      const topItems = db.prepare(`
        SELECT 
          si.item_id,
          i.brand,
          i.item_description,
          SUM(si.quantity) as total_quantity,
          SUM(si.total_amount) as total_sales,
          COUNT(DISTINCT s.id) as bill_count
        FROM sales_items si
        JOIN items i ON si.item_id = i.id
        JOIN sales s ON si.sales_id = s.id
        WHERE DATE(s.invoice_date) BETWEEN ? AND ?
        GROUP BY si.item_id, i.brand, i.item_description
        ORDER BY total_sales DESC
        LIMIT 20
      `).all(startDate, endDate);

      return { success: true, data: topItems };
    } catch (error) {
      console.error('Error getting top items:', error);
      return { success: false, error: error.message };
    }
  });

  // Get customer analysis
  ipcMain.handle('reports:getCustomerAnalysis', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      const analysis = db.prepare(`
        SELECT 
          c.id,
          c.name,
          c.mobile,
          COUNT(s.id) as total_visits,
          SUM(s.total_amount) as total_spent,
          AVG(s.total_amount) as avg_bill_value,
          MAX(s.invoice_date) as last_visit
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        WHERE s.invoice_date BETWEEN ? AND ? OR s.invoice_date IS NULL
        GROUP BY c.id, c.name, c.mobile
        ORDER BY total_spent DESC
      `).all(startDate, endDate);

      return { success: true, data: analysis };
    } catch (error) {
      console.error('Error getting customer analysis:', error);
      return { success: false, error: error.message };
    }
  });

  // Get GST report
  ipcMain.handle('reports:getGSTReport', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      
      // Get summary
      const summary = db.prepare(`
        SELECT 
          SUM(subtotal - discount_amount) as totalTaxableAmount,
          SUM(tax_amount) as totalTax,
          SUM(CASE WHEN tax_amount > 0 THEN (tax_amount / 2) ELSE 0 END) as totalCGST,
          SUM(CASE WHEN tax_amount > 0 THEN (tax_amount / 2) ELSE 0 END) as totalSGST,
          0 as totalIGST
        FROM sales 
        WHERE DATE(invoice_date) BETWEEN ? AND ?
      `).get(startDate, endDate);

      // Get HSN-wise breakdown
      const hsnWise = db.prepare(`
        SELECT 
          i.hsn_code,
          SUM(si.total_amount - si.discount_amount) as taxableAmount,
          SUM(si.tax_amount / 2) as cgst,
          SUM(si.tax_amount / 2) as sgst,
          0 as igst,
          i.gst_percentage as rate
        FROM sales_items si
        JOIN items i ON si.item_id = i.id
        JOIN sales s ON si.sales_id = s.id
        WHERE DATE(s.invoice_date) BETWEEN ? AND ?
        GROUP BY i.hsn_code, i.gst_percentage
        ORDER BY taxableAmount DESC
      `).all(startDate, endDate);

      const report = {
        summary: {
          totalTaxableAmount: summary.totalTaxableAmount || 0,
          totalCGST: summary.totalCGST || 0,
          totalSGST: summary.totalSGST || 0,
          totalIGST: summary.totalIGST || 0,
          totalTax: summary.totalTax || 0
        },
        hsnWise
      };

      return { success: true, data: report };
    } catch (error) {
      console.error('Error getting GST report:', error);
      return { success: false, error: error.message };
    }
  });

  // Get inventory report
  ipcMain.handle('reports:getInventoryReport', async (event, startDate, endDate) => {
    try {
      const db = dbManager.getDatabase();
      
      // Low stock items
      const lowStock = db.prepare(`
        SELECT * FROM items 
        WHERE current_stock <= min_stock AND is_active = 1
        ORDER BY (current_stock - min_stock) ASC
      `).all();

      // Out of stock items
      const outOfStock = db.prepare(`
        SELECT * FROM items 
        WHERE current_stock = 0 AND is_active = 1
        ORDER BY brand, item_description
      `).all();

      // Category-wise stock value
      const categoryStock = db.prepare(`
        SELECT 
          category,
          COUNT(*) as item_count,
          SUM(current_stock) as total_stock,
          SUM(current_stock * mrp) as total_value
        FROM items 
        WHERE is_active = 1 AND category IS NOT NULL
        GROUP BY category
        ORDER BY total_value DESC
      `).all();

      const report = {
        lowStock,
        outOfStock,
        categoryStock,
        summary: {
          totalItems: db.prepare('SELECT COUNT(*) as count FROM items WHERE is_active = 1').get().count,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          totalValue: db.prepare('SELECT SUM(current_stock * mrp) as value FROM items WHERE is_active = 1').get().value || 0
        }
      };

      return { success: true, data: report };
    } catch (error) {
      console.error('Error getting inventory report:', error);
      return { success: false, error: error.message };
    }
  });

  // Export report to CSV
  ipcMain.handle('reports:exportToCSV', async (event, reportType, data, filename) => {
    try {
      const { BackupManager } = require('../database/backup');
      const backupManager = new BackupManager(dbManager);
      
      // Create temporary CSV file
      const csvPath = `temp_${filename}`;
      await backupManager.exportToCSV(reportType, csvPath);
      
      return { success: true, data: csvPath };
    } catch (error) {
      console.error('Error exporting report to CSV:', error);
      return { success: false, error: error.message };
    }
  });
}