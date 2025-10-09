import { generateInvoiceNumber } from '../database/queries';

export interface InvoiceData {
  invoiceNumber: string;
  companyInfo: {
    name: string;
    address: string;
    gstNumber: string;
    phone: string;
    email: string;
  };
  customerInfo: {
    name: string;
    mobile: string;
    address?: string;
    gstNumber?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gstPercent: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  paymentInfo: {
    mode: string;
    paidAmount: number;
    balance: number;
  };
  invoiceDate: string;
  salesman: string;
  terminal: string;
}

export class InvoiceGenerator {
  private companyInfo: any;

  constructor(companyInfo: any) {
    this.companyInfo = companyInfo;
  }

  generateInvoiceNumber(): string {
    return generateInvoiceNumber(
      this.companyInfo.invoice_prefix,
      this.companyInfo.current_invoice_number
    );
  }

  generateInvoiceHTML(invoiceData: InvoiceData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoiceData.invoiceNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            color: #333;
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
        .gst-breakdown {
            margin-top: 10px;
            font-size: 10px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${this.companyInfo.company_name}</div>
        <div class="company-details">
            ${this.companyInfo.address}<br>
            ${this.companyInfo.phone ? `Phone: ${this.companyInfo.phone}` : ''}
            ${this.companyInfo.email ? ` | Email: ${this.companyInfo.email}` : ''}<br>
            ${this.companyInfo.gst_number ? `GST: ${this.companyInfo.gst_number}` : ''}
        </div>
    </div>

    <div class="invoice-info">
        <div class="invoice-details">
            <strong>Invoice No:</strong> ${invoiceData.invoiceNumber}<br>
            <strong>Date:</strong> ${invoiceData.invoiceDate}<br>
            <strong>Salesman:</strong> ${invoiceData.salesman}<br>
            <strong>Terminal:</strong> ${invoiceData.terminal}
        </div>
        <div class="customer-details">
            <strong>Bill To:</strong><br>
            ${invoiceData.customerInfo.name}<br>
            ${invoiceData.customerInfo.mobile}<br>
            ${invoiceData.customerInfo.address || ''}<br>
            ${invoiceData.customerInfo.gstNumber ? `GST: ${invoiceData.customerInfo.gstNumber}` : ''}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Disc%</th>
                <th>GST%</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${invoiceData.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="number">${this.formatCurrency(item.unitPrice)}</td>
                    <td class="number">${item.discount}%</td>
                    <td class="number">${item.gstPercent}%</td>
                    <td class="number">${this.formatCurrency(item.total)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">${this.formatCurrency(invoiceData.totals.subtotal)}</td>
            </tr>
            <tr>
                <td class="label">Discount:</td>
                <td class="amount">${this.formatCurrency(invoiceData.totals.discount)}</td>
            </tr>
            <tr>
                <td class="label">Taxable Amount:</td>
                <td class="amount">${this.formatCurrency(invoiceData.totals.taxable)}</td>
            </tr>
            ${invoiceData.totals.cgst > 0 ? `
                <tr>
                    <td class="label">CGST (9%):</td>
                    <td class="amount">${this.formatCurrency(invoiceData.totals.cgst)}</td>
                </tr>
            ` : ''}
            ${invoiceData.totals.sgst > 0 ? `
                <tr>
                    <td class="label">SGST (9%):</td>
                    <td class="amount">${this.formatCurrency(invoiceData.totals.sgst)}</td>
                </tr>
            ` : ''}
            ${invoiceData.totals.igst > 0 ? `
                <tr>
                    <td class="label">IGST (18%):</td>
                    <td class="amount">${this.formatCurrency(invoiceData.totals.igst)}</td>
                </tr>
            ` : ''}
            <tr class="total-row">
                <td class="label">TOTAL:</td>
                <td class="amount">${this.formatCurrency(invoiceData.totals.total)}</td>
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

  private formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  generateReceiptHTML(invoiceData: InvoiceData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt ${invoiceData.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 10px;
            width: 300px;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
        }
        .company-name {
            font-weight: bold;
            font-size: 14px;
        }
        .items {
            margin: 10px 0;
        }
        .item {
            margin: 5px 0;
            font-size: 11px;
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
        }
        .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${this.companyInfo.company_name}</div>
        <div>${this.companyInfo.address}</div>
        <div>${invoiceData.invoiceNumber} | ${invoiceData.invoiceDate}</div>
    </div>

    <div class="items">
        ${invoiceData.items.map(item => `
            <div class="item">
                <div>${item.name}</div>
                <div style="display: flex; justify-content: space-between;">
                    <span>${item.quantity} x ${this.formatCurrency(item.unitPrice)}</span>
                    <span>${this.formatCurrency(item.total)}</span>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="totals">
        <div class="total-line">
            <span>Subtotal:</span>
            <span>${this.formatCurrency(invoiceData.totals.subtotal)}</span>
        </div>
        <div class="total-line">
            <span>Discount:</span>
            <span>${this.formatCurrency(invoiceData.totals.discount)}</span>
        </div>
        <div class="total-line">
            <span>Tax:</span>
            <span>${this.formatCurrency(invoiceData.totals.cgst + invoiceData.totals.sgst + invoiceData.totals.igst)}</span>
        </div>
        <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>${this.formatCurrency(invoiceData.totals.total)}</span>
        </div>
    </div>

    <div class="footer">
        <div>Payment: ${invoiceData.paymentInfo.mode}</div>
        <div>Thank you!</div>
    </div>
</body>
</html>`;
  }
}