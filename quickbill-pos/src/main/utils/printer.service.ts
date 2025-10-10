import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface PrinterConfig {
  name: string;
  paperSize: string;
  copies: number;
  orientation: 'portrait' | 'landscape';
}

export interface ReceiptData {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName?: string;
  customerMobile?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: string;
  receivedAmount: number;
  returnAmount: number;
  cashier: string;
  terminal: string;
}

export class PrinterService {
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  async printReceipt(receiptData: ReceiptData, config?: Partial<PrinterConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const printerConfig: PrinterConfig = {
        name: config?.name || 'default',
        paperSize: config?.paperSize || 'A4',
        copies: config?.copies || 1,
        orientation: config?.orientation || 'portrait',
        ...config
      };

      // Generate receipt HTML
      const receiptHTML = this.generateReceiptHTML(receiptData);
      
      // Create a temporary HTML file
      const tempDir = path.join(require('os').tmpdir(), 'quickbill-receipts');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `receipt-${Date.now()}.html`);
      fs.writeFileSync(tempFile, receiptHTML);

      // Open the receipt in a new window for printing
      const printWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await printWindow.loadFile(tempFile);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Print the receipt
      const printOptions = {
        silent: true,
        printBackground: true,
        color: false,
        margin: {
          marginType: 'none'
        },
        scaleFactor: 100,
        pageSize: {
          width: 226.77, // 80mm in points
          height: 1000
        }
      };

      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (success) {
          console.log('Receipt printed successfully');
        } else {
          console.error('Print failed:', failureReason);
        }
        
        // Clean up
        printWindow.close();
        fs.unlinkSync(tempFile);
      });

      return { success: true };
    } catch (error) {
      console.error('Print receipt error:', error);
      return { success: false, error: error.message };
    }
  }

  async printInvoice(invoiceData: ReceiptData, config?: Partial<PrinterConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const printerConfig: PrinterConfig = {
        name: config?.name || 'default',
        paperSize: config?.paperSize || 'A4',
        copies: config?.copies || 1,
        orientation: config?.orientation || 'portrait',
        ...config
      };

      // Generate invoice HTML
      const invoiceHTML = this.generateInvoiceHTML(invoiceData);
      
      // Create a temporary HTML file
      const tempDir = path.join(require('os').tmpdir(), 'quickbill-invoices');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `invoice-${Date.now()}.html`);
      fs.writeFileSync(tempFile, invoiceHTML);

      // Open the invoice in a new window for printing
      const printWindow = new BrowserWindow({
        width: 800,
        height: 1000,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await printWindow.loadFile(tempFile);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Print the invoice
      const printOptions = {
        silent: true,
        printBackground: true,
        color: true,
        margin: {
          marginType: 'printableArea'
        },
        scaleFactor: 100
      };

      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (success) {
          console.log('Invoice printed successfully');
        } else {
          console.error('Print failed:', failureReason);
        }
        
        // Clean up
        printWindow.close();
        fs.unlinkSync(tempFile);
      });

      return { success: true };
    } catch (error) {
      console.error('Print invoice error:', error);
      return { success: false, error: error.message };
    }
  }

  private generateReceiptHTML(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt ${data.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 10px;
            width: 80mm;
            color: #000;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }
        .company-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .company-details {
            font-size: 10px;
            line-height: 1.2;
        }
        .invoice-info {
            margin: 10px 0;
            text-align: center;
        }
        .invoice-number {
            font-weight: bold;
            font-size: 14px;
        }
        .date-time {
            font-size: 10px;
            margin-top: 5px;
        }
        .customer-info {
            margin: 10px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 5px 0;
        }
        .items {
            margin: 10px 0;
        }
        .item {
            margin: 3px 0;
            font-size: 11px;
        }
        .item-name {
            font-weight: bold;
        }
        .item-details {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
        }
        .totals {
            border-top: 1px dashed #000;
            margin-top: 10px;
            padding-top: 5px;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
        }
        .total-final {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 14px;
        }
        .payment-info {
            margin: 10px 0;
            text-align: center;
            font-size: 11px;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
        }
        .thank-you {
            font-weight: bold;
            margin-bottom: 5px;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${data.companyName}</div>
        <div class="company-details">
            ${data.address}<br>
            ${data.phone ? `Phone: ${data.phone}` : ''}<br>
            ${data.email ? `Email: ${data.email}` : ''}<br>
            ${data.gstNumber ? `GST: ${data.gstNumber}` : ''}
        </div>
    </div>

    <div class="invoice-info">
        <div class="invoice-number">RECEIPT #${data.invoiceNumber}</div>
        <div class="date-time">
            ${data.date} | ${data.time}
        </div>
    </div>

    ${data.customerName ? `
    <div class="customer-info">
        <strong>Customer:</strong> ${data.customerName}<br>
        ${data.customerMobile ? `<strong>Mobile:</strong> ${data.customerMobile}` : ''}
    </div>
    ` : ''}

    <div class="items">
        ${data.items.map(item => `
            <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                    <span>${item.quantity} x ₹${item.price.toFixed(2)}</span>
                    <span>₹${item.total.toFixed(2)}</span>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="totals">
        <div class="total-line">
            <span>Subtotal:</span>
            <span>₹${data.subtotal.toFixed(2)}</span>
        </div>
        ${data.discount > 0 ? `
        <div class="total-line">
            <span>Discount:</span>
            <span>-₹${data.discount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-line">
            <span>Tax:</span>
            <span>₹${data.tax.toFixed(2)}</span>
        </div>
        <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>₹${data.total.toFixed(2)}</span>
        </div>
    </div>

    <div class="payment-info">
        <div><strong>Payment:</strong> ${data.paymentMode}</div>
        ${data.paymentMode === 'CASH' ? `
        <div><strong>Received:</strong> ₹${data.receivedAmount.toFixed(2)}</div>
        <div><strong>Return:</strong> ₹${data.returnAmount.toFixed(2)}</div>
        ` : ''}
    </div>

    <div class="footer">
        <div class="thank-you">Thank you for your business!</div>
        <div>Cashier: ${data.cashier}</div>
        <div>Terminal: ${data.terminal}</div>
        <div>This is a computer generated receipt</div>
    </div>
</body>
</html>`;
  }

  private generateInvoiceHTML(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${data.invoiceNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            color: #333;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .company-details {
            font-size: 14px;
            line-height: 1.4;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .invoice-details {
            flex: 1;
        }
        .customer-details {
            flex: 1;
            text-align: right;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .items-table .number {
            text-align: right;
        }
        .totals {
            margin-left: auto;
            width: 300px;
        }
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals td {
            padding: 4px 8px;
            border: none;
        }
        .totals .label {
            text-align: right;
            font-weight: bold;
        }
        .totals .amount {
            text-align: right;
        }
        .total-row {
            border-top: 2px solid #333;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${data.companyName}</div>
        <div class="company-details">
            ${data.address}<br>
            ${data.phone ? `Phone: ${data.phone}` : ''}
            ${data.email ? ` | Email: ${data.email}` : ''}<br>
            ${data.gstNumber ? `GST: ${data.gstNumber}` : ''}
        </div>
    </div>

    <div class="invoice-info">
        <div class="invoice-details">
            <strong>Invoice No:</strong> ${data.invoiceNumber}<br>
            <strong>Date:</strong> ${data.date}<br>
            <strong>Time:</strong> ${data.time}<br>
            <strong>Cashier:</strong> ${data.cashier}<br>
            <strong>Terminal:</strong> ${data.terminal}
        </div>
        ${data.customerName ? `
        <div class="customer-details">
            <strong>Bill To:</strong><br>
            ${data.customerName}<br>
            ${data.customerMobile || ''}
        </div>
        ` : ''}
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="number">₹${item.price.toFixed(2)}</td>
                    <td class="number">₹${item.total.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">₹${data.subtotal.toFixed(2)}</td>
            </tr>
            ${data.discount > 0 ? `
            <tr>
                <td class="label">Discount:</td>
                <td class="amount">₹${data.discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
                <td class="label">Tax:</td>
                <td class="amount">₹${data.tax.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td class="label">TOTAL:</td>
                <td class="amount">₹${data.total.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer generated invoice.</p>
    </div>
</body>
</html>`;
  }

  async getAvailablePrinters(): Promise<{ success: boolean; printers?: string[]; error?: string }> {
    try {
      // This would typically use a native printer library
      // For now, we'll return a mock list
      const printers = [
        'Microsoft Print to PDF',
        'Microsoft XPS Document Writer',
        'HP LaserJet Pro',
        'Canon PIXMA',
        'Epson TM-T20'
      ];
      
      return { success: true, printers };
    } catch (error) {
      console.error('Get printers error:', error);
      return { success: false, error: error.message };
    }
  }
}