import { ipcMain, BrowserWindow } from 'electron';
import { PrinterService } from '../utils/printer.service';

let printerService: PrinterService | null = null;

export function setupPrinterHandlers(mainWindow: BrowserWindow): void {
  printerService = new PrinterService(mainWindow);

  // Print receipt
  ipcMain.handle('printer:printReceipt', async (event, receiptData, config) => {
    try {
      if (!printerService) {
        return { success: false, error: 'Printer service not initialized' };
      }

      const result = await printerService.printReceipt(receiptData, config);
      return result;
    } catch (error) {
      console.error('Print receipt handler error:', error);
      return { success: false, error: 'Failed to print receipt' };
    }
  });

  // Print invoice
  ipcMain.handle('printer:printInvoice', async (event, invoiceData, config) => {
    try {
      if (!printerService) {
        return { success: false, error: 'Printer service not initialized' };
      }

      const result = await printerService.printInvoice(invoiceData, config);
      return result;
    } catch (error) {
      console.error('Print invoice handler error:', error);
      return { success: false, error: 'Failed to print invoice' };
    }
  });

  // Get available printers
  ipcMain.handle('printer:getAvailablePrinters', async (event) => {
    try {
      if (!printerService) {
        return { success: false, error: 'Printer service not initialized' };
      }

      const result = await printerService.getAvailablePrinters();
      return result;
    } catch (error) {
      console.error('Get printers handler error:', error);
      return { success: false, error: 'Failed to get printers' };
    }
  });

  // Test printer
  ipcMain.handle('printer:testPrint', async (event, printerName) => {
    try {
      if (!printerService) {
        return { success: false, error: 'Printer service not initialized' };
      }

      const testData = {
        companyName: 'QuickBill POS',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@quickbill.com',
        gstNumber: '27AAPFU0939F1ZV',
        invoiceNumber: 'TEST-001',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            price: 100,
            total: 100
          }
        ],
        subtotal: 100,
        discount: 0,
        tax: 18,
        total: 118,
        paymentMode: 'CASH',
        receivedAmount: 118,
        returnAmount: 0,
        cashier: 'Test User',
        terminal: 'POS-01'
      };

      const result = await printerService.printReceipt(testData, { name: printerName });
      return result;
    } catch (error) {
      console.error('Test print handler error:', error);
      return { success: false, error: 'Failed to test print' };
    }
  });
}