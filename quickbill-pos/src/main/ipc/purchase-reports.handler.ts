import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { APIResponse } from '../../shared/types';

export function registerPurchaseReportHandlers(dbManager: DatabaseManager): void {
  // Purchase summary report
  ipcMain.handle('purchase-reports:getSummary', async (event, startDate: string, endDate: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const summary = db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(SUM(tax_amount), 0) as total_tax,
          COALESCE(SUM(discount_amount), 0) as total_discount
        FROM purchase_orders 
        WHERE po_date BETWEEN ? AND ?
      `).get(startDate, endDate);
      
      const receipts = db.prepare(`
        SELECT 
          COUNT(*) as total_receipts,
          COALESCE(SUM(total_amount), 0) as total_received_amount
        FROM purchase_receipts 
        WHERE receipt_date BETWEEN ? AND ?
      `).get(startDate, endDate);
      
      const returns = db.prepare(`
        SELECT 
          COUNT(*) as total_returns,
          COALESCE(SUM(total_amount), 0) as total_return_amount
        FROM purchase_returns 
        WHERE return_date BETWEEN ? AND ?
      `).get(startDate, endDate);
      
      const payments = db.prepare(`
        SELECT 
          COUNT(*) as total_payments,
          COALESCE(SUM(amount), 0) as total_payment_amount
        FROM supplier_payments 
        WHERE payment_date BETWEEN ? AND ?
      `).get(startDate, endDate);
      
      return {
        success: true,
        data: {
          orders: summary,
          receipts,
          returns,
          payments
        }
      };
    } catch (error) {
      console.error('Error getting purchase summary:', error);
      return { success: false, error: error.message };
    }
  });

  // Top suppliers report
  ipcMain.handle('purchase-reports:getTopSuppliers', async (event, startDate: string, endDate: string, limit = 10) => {
    try {
      const db = dbManager.getDatabase();
      
      const topSuppliers = db.prepare(`
        SELECT 
          s.id,
          s.company_name,
          s.supplier_code,
          COUNT(po.id) as order_count,
          COALESCE(SUM(po.total_amount), 0) as total_amount,
          COALESCE(SUM(pr.total_amount), 0) as received_amount,
          COALESCE(SUM(sp.amount), 0) as paid_amount,
          s.current_balance
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
          AND po.po_date BETWEEN ? AND ?
        LEFT JOIN purchase_receipts pr ON s.id = pr.supplier_id 
          AND pr.receipt_date BETWEEN ? AND ?
        LEFT JOIN supplier_payments sp ON s.id = sp.supplier_id 
          AND sp.payment_date BETWEEN ? AND ?
        WHERE s.is_active = 1
        GROUP BY s.id, s.company_name, s.supplier_code, s.current_balance
        HAVING total_amount > 0
        ORDER BY total_amount DESC
        LIMIT ?
      `).all(startDate, endDate, startDate, endDate, startDate, endDate, limit);
      
      return { success: true, data: topSuppliers };
    } catch (error) {
      console.error('Error getting top suppliers:', error);
      return { success: false, error: error.message };
    }
  });

  // Purchase order status report
  ipcMain.handle('purchase-reports:getOrderStatus', async (event, startDate: string, endDate: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const statusReport = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total_amount
        FROM purchase_orders 
        WHERE po_date BETWEEN ? AND ?
        GROUP BY status
        ORDER BY count DESC
      `).all(startDate, endDate);
      
      return { success: true, data: statusReport };
    } catch (error) {
      console.error('Error getting order status report:', error);
      return { success: false, error: error.message };
    }
  });

  // Monthly purchase trends
  ipcMain.handle('purchase-reports:getMonthlyTrends', async (event, year: number) => {
    try {
      const db = dbManager.getDatabase();
      
      const trends = db.prepare(`
        SELECT 
          strftime('%m', po_date) as month,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as total_amount
        FROM purchase_orders 
        WHERE strftime('%Y', po_date) = ?
        GROUP BY strftime('%m', po_date)
        ORDER BY month
      `).all(year.toString());
      
      return { success: true, data: trends };
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      return { success: false, error: error.message };
    }
  });

  // Supplier outstanding balances
  ipcMain.handle('purchase-reports:getOutstandingBalances', async (event) => {
    try {
      const db = dbManager.getDatabase();
      
      const outstanding = db.prepare(`
        SELECT 
          s.id,
          s.company_name,
          s.supplier_code,
          s.credit_limit,
          s.current_balance,
          COALESCE(SUM(pr.total_amount), 0) as total_receipts,
          COALESCE(SUM(sp.amount), 0) as total_payments,
          (COALESCE(SUM(pr.total_amount), 0) - COALESCE(SUM(sp.amount), 0)) as outstanding_amount
        FROM suppliers s
        LEFT JOIN purchase_receipts pr ON s.id = pr.supplier_id 
          AND pr.status IN ('RECEIVED', 'VERIFIED')
        LEFT JOIN supplier_payments sp ON s.id = sp.supplier_id
        WHERE s.is_active = 1
        GROUP BY s.id, s.company_name, s.supplier_code, s.credit_limit, s.current_balance
        HAVING outstanding_amount > 0
        ORDER BY outstanding_amount DESC
      `).all();
      
      return { success: true, data: outstanding };
    } catch (error) {
      console.error('Error getting outstanding balances:', error);
      return { success: false, error: error.message };
    }
  });

  // Purchase vs sales analysis
  ipcMain.handle('purchase-reports:getPurchaseVsSales', async (event, startDate: string, endDate: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const purchaseData = db.prepare(`
        SELECT 
          strftime('%Y-%m', po_date) as month,
          COALESCE(SUM(total_amount), 0) as purchase_amount
        FROM purchase_orders 
        WHERE po_date BETWEEN ? AND ?
        GROUP BY strftime('%Y-%m', po_date)
        ORDER BY month
      `).all(startDate, endDate);
      
      const salesData = db.prepare(`
        SELECT 
          strftime('%Y-%m', invoice_date) as month,
          COALESCE(SUM(total_amount), 0) as sales_amount
        FROM sales 
        WHERE invoice_date BETWEEN ? AND ?
        GROUP BY strftime('%Y-%m', invoice_date)
        ORDER BY month
      `).all(startDate, endDate);
      
      return {
        success: true,
        data: {
          purchases: purchaseData,
          sales: salesData
        }
      };
    } catch (error) {
      console.error('Error getting purchase vs sales analysis:', error);
      return { success: false, error: error.message };
    }
  });

  // Item-wise purchase analysis
  ipcMain.handle('purchase-reports:getItemWiseAnalysis', async (event, startDate: string, endDate: string, limit = 20) => {
    try {
      const db = dbManager.getDatabase();
      
      const itemAnalysis = db.prepare(`
        SELECT 
          i.id,
          i.brand,
          i.item_description,
          i.barcode,
          COUNT(DISTINCT po.id) as order_count,
          COALESCE(SUM(poi.quantity), 0) as total_quantity,
          COALESCE(SUM(poi.total_amount), 0) as total_amount,
          COALESCE(AVG(poi.unit_price), 0) as avg_price,
          COALESCE(SUM(pri.quantity), 0) as received_quantity,
          COALESCE(SUM(prr.quantity), 0) as returned_quantity
        FROM items i
        LEFT JOIN purchase_order_items poi ON i.id = poi.item_id
        LEFT JOIN purchase_orders po ON poi.po_id = po.id 
          AND po.po_date BETWEEN ? AND ?
        LEFT JOIN purchase_receipt_items pri ON poi.item_id = pri.item_id
        LEFT JOIN purchase_receipts pr ON pri.receipt_id = pr.id 
          AND pr.receipt_date BETWEEN ? AND ?
        LEFT JOIN purchase_return_items prr ON pri.item_id = prr.item_id
        LEFT JOIN purchase_returns prt ON prr.return_id = prt.id 
          AND prt.return_date BETWEEN ? AND ?
        WHERE i.is_active = 1
        GROUP BY i.id, i.brand, i.item_description, i.barcode
        HAVING total_amount > 0
        ORDER BY total_amount DESC
        LIMIT ?
      `).all(startDate, endDate, startDate, endDate, startDate, endDate, limit);
      
      return { success: true, data: itemAnalysis };
    } catch (error) {
      console.error('Error getting item-wise analysis:', error);
      return { success: false, error: error.message };
    }
  });

  // Purchase return analysis
  ipcMain.handle('purchase-reports:getReturnAnalysis', async (event, startDate: string, endDate: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const returnAnalysis = db.prepare(`
        SELECT 
          pr.return_reason,
          COUNT(*) as count,
          COALESCE(SUM(pri.total_amount), 0) as total_amount
        FROM purchase_return_items pri
        LEFT JOIN purchase_returns pr ON pri.return_id = pr.id
        WHERE pr.return_date BETWEEN ? AND ?
        GROUP BY pr.return_reason
        ORDER BY count DESC
      `).all(startDate, endDate);
      
      const supplierReturns = db.prepare(`
        SELECT 
          s.company_name,
          COUNT(pr.id) as return_count,
          COALESCE(SUM(pr.total_amount), 0) as total_return_amount
        FROM purchase_returns pr
        LEFT JOIN suppliers s ON pr.supplier_id = s.id
        WHERE pr.return_date BETWEEN ? AND ?
        GROUP BY s.id, s.company_name
        ORDER BY total_return_amount DESC
      `).all(startDate, endDate);
      
      return {
        success: true,
        data: {
          byReason: returnAnalysis,
          bySupplier: supplierReturns
        }
      };
    } catch (error) {
      console.error('Error getting return analysis:', error);
      return { success: false, error: error.message };
    }
  });

  // Payment analysis
  ipcMain.handle('purchase-reports:getPaymentAnalysis', async (event, startDate: string, endDate: string) => {
    try {
      const db = dbManager.getDatabase();
      
      const paymentModes = db.prepare(`
        SELECT 
          payment_mode,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM supplier_payments 
        WHERE payment_date BETWEEN ? AND ?
        GROUP BY payment_mode
        ORDER BY total_amount DESC
      `).all(startDate, endDate);
      
      const monthlyPayments = db.prepare(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          COUNT(*) as payment_count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM supplier_payments 
        WHERE payment_date BETWEEN ? AND ?
        GROUP BY strftime('%Y-%m', payment_date)
        ORDER BY month
      `).all(startDate, endDate);
      
      return {
        success: true,
        data: {
          byMode: paymentModes,
          monthly: monthlyPayments
        }
      };
    } catch (error) {
      console.error('Error getting payment analysis:', error);
      return { success: false, error: error.message };
    }
  });
}