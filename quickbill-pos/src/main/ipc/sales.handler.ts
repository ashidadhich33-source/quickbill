import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { generateInvoiceNumber, calculateGST, roundOff } from '../database/queries';

// Helper function to create sale
async function createSale(dbManager: DatabaseManager, saleData: any) {
  try {
    const db = dbManager.getDatabase();
    const createSale = dbManager.getStatement('createSale');
    const createSaleItem = dbManager.getStatement('createSaleItem');
    const updateItemStock = dbManager.getStatement('updateItemStock');
    const updateCustomerBalance = dbManager.getStatement('updateCustomerBalance');
    const getConfig = dbManager.getStatement('getCompanyConfig');
    const updateInvoiceNumber = dbManager.getStatement('updateCompanyConfig');

    if (!createSale || !createSaleItem || !updateItemStock || !getConfig || !updateInvoiceNumber) {
      throw new Error('Required database statements not prepared');
    }

    // Get company config for invoice number
    const config = getConfig.get() as any;
    const invoiceNumber = generateInvoiceNumber(config.invoice_prefix, config.current_invoice_number);

    // Start transaction
    const transaction = db.transaction((data: any) => {
      // Validate stock for all items
      for (const item of data.items) {
        const stockCheck = db.prepare('SELECT current_stock FROM items WHERE id = ?').get(item.itemId);
        if (!stockCheck || stockCheck.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.itemName}`);
        }
      }

      // Create sale record
      const saleId = createSale.run(
        invoiceNumber,
        new Date().toISOString(),
        data.customer?.id || null,
        data.customer?.name || null,
        data.customer?.mobile || null,
        data.subtotal,
        data.discount || 0,
        data.tax || 0,
        data.roundOff || 0,
        data.total,
        data.paidAmount || data.total,
        data.balanceAmount || 0,
        data.paymentMode || 'CASH',
        'SALES',
        'COMPLETED',
        data.salesmanId || null,
        data.terminalId || 'POS-01',
        data.createdBy || 1
      ).lastInsertRowid;

      // Create sale items and update stock
      for (const item of data.items) {
        createSaleItem.run(
          saleId,
          item.itemId,
          item.barcode,
          item.itemName,
          item.quantity,
          item.unitPrice,
          item.discountPercent || 0,
          item.discountAmount || 0,
          item.gstPercent || 0,
          item.gstAmount || 0,
          item.total
        );

        // Update stock
        updateItemStock.run(item.quantity, item.itemId);
      }

      // Update customer balance if credit sale
      if (data.paymentMode === 'CREDIT' && data.customer?.id) {
        updateCustomerBalance.run(data.total, data.customer.id);
      }

      // Update invoice number
      updateInvoiceNumber.run(
        config.company_name,
        config.address,
        config.gst_number,
        config.phone,
        config.email,
        config.invoice_prefix,
        config.current_invoice_number + 1,
        config.fiscal_year_start,
        config.currency_symbol,
        config.date_format,
        config.time_zone
      );

      return { success: true, saleId, invoiceNumber };
    });

    const result = transaction(saleData);
    return result;
  } catch (error) {
    console.error('Error creating sale:', error);
    return { success: false, error: error.message };
  }
}

export function setupSalesHandlers(dbManager: DatabaseManager): void {
  // Create new sale
  ipcMain.handle('sales:create', async (event, saleData) => {
    return createSale(dbManager, saleData);
  });

  // Save sale (alias for create)
  ipcMain.handle('sales:save', async (event, saleData) => {
    return createSale(dbManager, saleData);
  });

  // Get sale by ID
  ipcMain.handle('sales:getById', async (event, saleId) => {
    try {
      const getSale = dbManager.getStatement('getSaleById');
      const getSaleItems = dbManager.getStatement('getSaleItems');

      if (!getSale || !getSaleItems) {
        throw new Error('Required database statements not prepared');
      }

      const sale = getSale.get(saleId);
      if (!sale) {
        return { success: false, error: 'Sale not found' };
      }

      const items = getSaleItems.all(saleId);
      return { success: true, data: { ...sale, items } };
    } catch (error) {
      console.error('Error getting sale:', error);
      return { success: false, error: error.message };
    }
  });

  // Get sales by date
  ipcMain.handle('sales:getByDate', async (event, date) => {
    try {
      const getSalesByDate = dbManager.getStatement('getSalesByDate');
      if (!getSalesByDate) {
        throw new Error('Required database statement not prepared');
      }

      const sales = getSalesByDate.all(date);
      return { success: true, data: sales };
    } catch (error) {
      console.error('Error getting sales by date:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all sales
  ipcMain.handle('sales:getAll', async (event, limit = 100, offset = 0) => {
    try {
      const db = dbManager.getDatabase();
      const sales = db.prepare(`
        SELECT * FROM sales 
        ORDER BY invoice_date DESC 
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;

      return { success: true, data: { sales, total } };
    } catch (error) {
      console.error('Error getting all sales:', error);
      return { success: false, error: error.message };
    }
  });

  // Get daily summary
  ipcMain.handle('sales:getDailySummary', async (event, date) => {
    try {
      const db = dbManager.getDatabase();
      const summary = db.prepare(`
        SELECT 
          DATE(invoice_date) as date,
          COUNT(*) as total_bills,
          SUM(total_amount) as total_sales,
          SUM(tax_amount) as total_tax,
          SUM(discount_amount) as total_discount
        FROM sales 
        WHERE DATE(invoice_date) = ?
        GROUP BY DATE(invoice_date)
      `).get(date);

      return { success: true, data: summary || { date, total_bills: 0, total_sales: 0, total_tax: 0, total_discount: 0 } };
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return { success: false, error: error.message };
    }
  });

  // Calculate GST
  ipcMain.handle('sales:calculateGST', async (event, amount, rate, inclusive = true) => {
    try {
      const gst = calculateGST(amount, rate, inclusive);
      return { success: true, data: gst };
    } catch (error) {
      console.error('Error calculating GST:', error);
      return { success: false, error: error.message };
    }
  });

  // Round off amount
  ipcMain.handle('sales:roundOff', async (event, amount) => {
    try {
      const rounded = roundOff(amount);
      return { success: true, data: rounded };
    } catch (error) {
      console.error('Error rounding off amount:', error);
      return { success: false, error: error.message };
    }
  });

  // Print invoice
  ipcMain.handle('sales:printInvoice', async (event, invoiceNumber) => {
    try {
      // Get sale data
      const getSale = dbManager.getStatement('getSaleById');
      const getSaleItems = dbManager.getStatement('getSaleItems');
      const getConfig = dbManager.getStatement('getCompanyConfig');

      if (!getSale || !getSaleItems || !getConfig) {
        throw new Error('Required database statements not prepared');
      }

      const sale = getSale.get(invoiceNumber);
      if (!sale) {
        return { success: false, error: 'Invoice not found' };
      }

      const items = getSaleItems.all(sale.id);
      const config = getConfig.get();

      // Format receipt data
      const receiptData = {
        companyName: config.company_name,
        address: config.address,
        phone: config.phone,
        email: config.email,
        gstNumber: config.gst_number,
        invoiceNumber: sale.invoice_number,
        date: new Date(sale.invoice_date).toLocaleDateString(),
        time: new Date(sale.invoice_date).toLocaleTimeString(),
        customerName: sale.customer_name,
        customerMobile: sale.customer_mobile,
        items: items.map(item => ({
          name: item.item_name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total_amount
        })),
        subtotal: sale.subtotal,
        discount: sale.discount_amount,
        tax: sale.tax_amount,
        total: sale.total_amount,
        paymentMode: sale.payment_mode,
        receivedAmount: sale.paid_amount,
        returnAmount: sale.balance_amount,
        cashier: 'Admin', // This should come from user context
        terminal: sale.terminal_id || 'POS-01'
      };

      // Use the printer service
      const { PrinterService } = require('../utils/printer.service');
      const printerService = new PrinterService(require('electron').BrowserWindow.getFocusedWindow());
      
      const result = await printerService.printReceipt(receiptData);
      return result;
    } catch (error) {
      console.error('Error printing invoice:', error);
      return { success: false, error: error.message };
    }
  });

  // Hold bill
  ipcMain.handle('sales:holdBill', async (event, billData) => {
    try {
      const db = dbManager.getDatabase();
      
      // Generate unique hold ID
      const holdId = `HOLD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Set expiration time (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Store bill data in holds table
      const result = db.prepare(`
        INSERT INTO holds (hold_id, hold_data, user_id, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(
        holdId,
        JSON.stringify(billData),
        billData.userId || 1, // Default to admin user
        expiresAt
      );
      
      console.log('Bill held:', holdId);
      return { success: true, data: { holdId, expiresAt } };
    } catch (error) {
      console.error('Error holding bill:', error);
      return { success: false, error: error.message };
    }
  });

  // Recall bill
  ipcMain.handle('sales:recallBill', async (event, holdId) => {
    try {
      const db = dbManager.getDatabase();
      
      // Retrieve held bill data
      const hold = db.prepare(`
        SELECT hold_data, expires_at FROM holds 
        WHERE hold_id = ? AND expires_at > CURRENT_TIMESTAMP
      `).get(holdId);
      
      if (!hold) {
        return { success: false, error: 'Hold not found or expired' };
      }
      
      const billData = JSON.parse(hold.hold_data);
      console.log('Recalling bill:', holdId);
      return { success: true, data: billData };
    } catch (error) {
      console.error('Error recalling bill:', error);
      return { success: false, error: error.message };
    }
  });

  // Get held bills
  ipcMain.handle('sales:getHeldBills', async (event) => {
    try {
      const db = dbManager.getDatabase();
      
      const holds = db.prepare(`
        SELECT h.hold_id, h.created_at, h.expires_at, u.full_name as cashier_name
        FROM holds h
        JOIN users u ON h.user_id = u.id
        WHERE h.expires_at > CURRENT_TIMESTAMP
        ORDER BY h.created_at DESC
      `).all();
      
      return { success: true, data: holds };
    } catch (error) {
      console.error('Error getting held bills:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete held bill
  ipcMain.handle('sales:deleteHeldBill', async (event, holdId) => {
    try {
      const db = dbManager.getDatabase();
      
      db.prepare('DELETE FROM holds WHERE hold_id = ?').run(holdId);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting held bill:', error);
      return { success: false, error: error.message };
    }
  });
}