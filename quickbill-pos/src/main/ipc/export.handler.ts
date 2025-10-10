import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { ExportService } from '../utils/export.service';

let exportService: ExportService | null = null;

export function setupExportHandlers(dbManager: DatabaseManager): void {
  exportService = new ExportService();

  // Export items
  ipcMain.handle('export:items', async (event, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      // Get items from database
      const db = dbManager.getDatabase();
      let query = 'SELECT * FROM items WHERE is_active = 1';
      const params: any[] = [];

      if (options.filters) {
        if (options.filters.category) {
          query += ' AND category = ?';
          params.push(options.filters.category);
        }
        if (options.filters.brand) {
          query += ' AND brand = ?';
          params.push(options.filters.brand);
        }
        if (options.filters.stockFilter === 'low') {
          query += ' AND current_stock <= min_stock';
        } else if (options.filters.stockFilter === 'out') {
          query += ' AND current_stock = 0';
        }
      }

      query += ' ORDER BY brand, item_description';

      const items = db.prepare(query).all(...params);
      const result = await exportService.exportItems(items, options);
      return result;
    } catch (error) {
      console.error('Export items handler error:', error);
      return { success: false, error: 'Failed to export items' };
    }
  });

  // Export customers
  ipcMain.handle('export:customers', async (event, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      // Get customers from database
      const db = dbManager.getDatabase();
      let query = 'SELECT * FROM customers WHERE is_active = 1';
      const params: any[] = [];

      if (options.filters) {
        if (options.filters.customerType) {
          query += ' AND customer_type = ?';
          params.push(options.filters.customerType);
        }
        if (options.filters.city) {
          query += ' AND city = ?';
          params.push(options.filters.city);
        }
      }

      query += ' ORDER BY name';

      const customers = db.prepare(query).all(...params);
      const result = await exportService.exportCustomers(customers, options);
      return result;
    } catch (error) {
      console.error('Export customers handler error:', error);
      return { success: false, error: 'Failed to export customers' };
    }
  });

  // Export sales
  ipcMain.handle('export:sales', async (event, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      // Get sales from database
      const db = dbManager.getDatabase();
      let query = `
        SELECT s.*, c.name as customer_name, c.mobile as customer_mobile
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (options.dateRange) {
        query += ' AND DATE(s.invoice_date) BETWEEN ? AND ?';
        params.push(options.dateRange.start, options.dateRange.end);
      }

      if (options.filters) {
        if (options.filters.paymentMode) {
          query += ' AND s.payment_mode = ?';
          params.push(options.filters.paymentMode);
        }
        if (options.filters.status) {
          query += ' AND s.status = ?';
          params.push(options.filters.status);
        }
      }

      query += ' ORDER BY s.invoice_date DESC';

      const sales = db.prepare(query).all(...params);
      const result = await exportService.exportSales(sales, options);
      return result;
    } catch (error) {
      console.error('Export sales handler error:', error);
      return { success: false, error: 'Failed to export sales' };
    }
  });

  // Export returns
  ipcMain.handle('export:returns', async (event, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      // Get returns from database
      const db = dbManager.getDatabase();
      let query = `
        SELECT sr.*, s.invoice_number as original_invoice_number,
               u.full_name as processed_by_name
        FROM sales_returns sr
        JOIN sales s ON sr.original_sale_id = s.id
        LEFT JOIN users u ON sr.processed_by = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (options.dateRange) {
        query += ' AND DATE(sr.return_date) BETWEEN ? AND ?';
        params.push(options.dateRange.start, options.dateRange.end);
      }

      if (options.filters) {
        if (options.filters.status) {
          query += ' AND sr.status = ?';
          params.push(options.filters.status);
        }
        if (options.filters.refundMode) {
          query += ' AND sr.refund_mode = ?';
          params.push(options.filters.refundMode);
        }
      }

      query += ' ORDER BY sr.return_date DESC';

      const returns = db.prepare(query).all(...params);
      const result = await exportService.exportReturns(returns, options);
      return result;
    } catch (error) {
      console.error('Export returns handler error:', error);
      return { success: false, error: 'Failed to export returns' };
    }
  });

  // Export reports
  ipcMain.handle('export:reports', async (event, reportType, reportData, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const result = await exportService.exportReports(reportData, options, reportType);
      return result;
    } catch (error) {
      console.error('Export reports handler error:', error);
      return { success: false, error: 'Failed to export reports' };
    }
  });

  // Get export history
  ipcMain.handle('export:getHistory', async (event) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const result = await exportService.getExportHistory();
      return result;
    } catch (error) {
      console.error('Get export history handler error:', error);
      return { success: false, error: 'Failed to get export history' };
    }
  });

  // Delete export file
  ipcMain.handle('export:deleteFile', async (event, filename) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const result = await exportService.deleteExportFile(filename);
      return result;
    } catch (error) {
      console.error('Delete export file handler error:', error);
      return { success: false, error: 'Failed to delete export file' };
    }
  });

  // Cleanup old exports
  ipcMain.handle('export:cleanup', async (event, daysOld = 30) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const result = await exportService.cleanupOldExports(daysOld);
      return result;
    } catch (error) {
      console.error('Cleanup exports handler error:', error);
      return { success: false, error: 'Failed to cleanup old exports' };
    }
  });

  // Export sales summary report
  ipcMain.handle('export:salesSummary', async (event, startDate, endDate, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const db = dbManager.getDatabase();
      const salesSummary = db.prepare(`
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

      const result = await exportService.exportReports(salesSummary, options, 'Sales Summary');
      return result;
    } catch (error) {
      console.error('Export sales summary handler error:', error);
      return { success: false, error: 'Failed to export sales summary' };
    }
  });

  // Export GST report
  ipcMain.handle('export:gstReport', async (event, startDate, endDate, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const db = dbManager.getDatabase();
      const gstReport = db.prepare(`
        SELECT 
          i.hsn_code,
          SUM(si.quantity) as total_quantity,
          SUM(si.total_amount) as total_amount,
          SUM(si.tax_amount) as total_tax,
          i.gst_percentage
        FROM sales_items si
        JOIN items i ON si.item_id = i.id
        JOIN sales s ON si.sales_id = s.id
        WHERE DATE(s.invoice_date) BETWEEN ? AND ?
        GROUP BY i.hsn_code, i.gst_percentage
        ORDER BY total_amount DESC
      `).all(startDate, endDate);

      const result = await exportService.exportReports(gstReport, options, 'GST Report');
      return result;
    } catch (error) {
      console.error('Export GST report handler error:', error);
      return { success: false, error: 'Failed to export GST report' };
    }
  });

  // Export inventory report
  ipcMain.handle('export:inventoryReport', async (event, options) => {
    try {
      if (!exportService) {
        return { success: false, error: 'Export service not initialized' };
      }

      const db = dbManager.getDatabase();
      let query = `
        SELECT 
          brand,
          style_code,
          item_description,
          category,
          sub_category,
          current_stock,
          min_stock,
          max_stock,
          mrp,
          gst_percentage,
          CASE 
            WHEN current_stock = 0 THEN 'Out of Stock'
            WHEN current_stock <= min_stock THEN 'Low Stock'
            ELSE 'In Stock'
          END as stock_status
        FROM items 
        WHERE is_active = 1
      `;
      const params: any[] = [];

      if (options.filters) {
        if (options.filters.category) {
          query += ' AND category = ?';
          params.push(options.filters.category);
        }
        if (options.filters.stockFilter === 'low') {
          query += ' AND current_stock <= min_stock';
        } else if (options.filters.stockFilter === 'out') {
          query += ' AND current_stock = 0';
        }
      }

      query += ' ORDER BY brand, item_description';

      const inventory = db.prepare(query).all(...params);
      const result = await exportService.exportReports(inventory, options, 'Inventory Report');
      return result;
    } catch (error) {
      console.error('Export inventory report handler error:', error);
      return { success: false, error: 'Failed to export inventory report' };
    }
  });
}