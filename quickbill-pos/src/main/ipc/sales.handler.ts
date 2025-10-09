import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { generateInvoiceNumber, calculateGST, roundOff } from '../database/queries';

export function setupSalesHandlers(dbManager: DatabaseManager): void {
  // Create new sale
  ipcMain.handle('sales:create', async (event, saleData) => {
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
      // This would integrate with printer
      console.log(`Printing invoice: ${invoiceNumber}`);
      return { success: true };
    } catch (error) {
      console.error('Error printing invoice:', error);
      return { success: false, error: error.message };
    }
  });

  // Hold bill
  ipcMain.handle('sales:holdBill', async (event, billData) => {
    try {
      // Store bill data temporarily (could use a separate table or file)
      const holdData = {
        id: Date.now(),
        data: billData,
        timestamp: new Date().toISOString()
      };
      
      // In a real implementation, you'd store this in a holds table
      console.log('Bill held:', holdData);
      return { success: true, data: holdData };
    } catch (error) {
      console.error('Error holding bill:', error);
      return { success: false, error: error.message };
    }
  });

  // Recall bill
  ipcMain.handle('sales:recallBill', async (event, holdId) => {
    try {
      // Retrieve held bill data
      // In a real implementation, you'd fetch from holds table
      console.log('Recalling bill:', holdId);
      return { success: true, data: null };
    } catch (error) {
      console.error('Error recalling bill:', error);
      return { success: false, error: error.message };
    }
  });
}