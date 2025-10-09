// Database query constants and helper functions
export const QUERIES = {
  // Item queries
  ITEMS: {
    FIND_BY_BARCODE: 'SELECT * FROM items WHERE barcode = ? AND is_active = 1',
    FIND_BY_ID: 'SELECT * FROM items WHERE id = ? AND is_active = 1',
    SEARCH: `SELECT * FROM items 
             WHERE (barcode LIKE ? OR item_description LIKE ? OR brand LIKE ?)
             AND is_active = 1 
             ORDER BY brand, item_description
             LIMIT 50`,
    BY_CATEGORY: 'SELECT * FROM items WHERE category = ? AND is_active = 1 ORDER BY brand, item_description LIMIT 100',
    UPDATE_STOCK: 'UPDATE items SET current_stock = current_stock - ? WHERE id = ?',
    LOW_STOCK: 'SELECT * FROM items WHERE current_stock <= min_stock AND is_active = 1',
    OUT_OF_STOCK: 'SELECT * FROM items WHERE current_stock = 0 AND is_active = 1'
  },

  // Customer queries
  CUSTOMERS: {
    FIND_BY_MOBILE: 'SELECT * FROM customers WHERE mobile = ? AND is_active = 1',
    FIND_BY_ID: 'SELECT * FROM customers WHERE id = ? AND is_active = 1',
    SEARCH: `SELECT * FROM customers 
             WHERE (mobile LIKE ? OR name LIKE ?) 
             AND is_active = 1 
             ORDER BY name
             LIMIT 50`,
    CREATE: `INSERT INTO customers (
               mobile, name, email, address, city, state, pincode,
               gst_number, credit_limit, current_balance, loyalty_points,
               customer_type
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    UPDATE: `UPDATE customers SET 
               name = ?, email = ?, address = ?, city = ?, state = ?,
               pincode = ?, gst_number = ?, credit_limit = ?, customer_type = ?
             WHERE id = ?`,
    UPDATE_BALANCE: 'UPDATE customers SET current_balance = current_balance + ? WHERE id = ?',
    UPDATE_POINTS: 'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?'
  },

  // Sales queries
  SALES: {
    CREATE: `INSERT INTO sales (
               invoice_number, invoice_date, customer_id, customer_name, customer_mobile,
               subtotal, discount_amount, tax_amount, round_off, total_amount,
               paid_amount, balance_amount, payment_mode, transaction_type, status,
               salesman_id, terminal_id, created_by
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    CREATE_ITEM: `INSERT INTO sales_items (
                    sales_id, item_id, barcode, item_name, quantity, unit_price,
                    discount_percent, discount_amount, tax_percent, tax_amount, total_amount
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    FIND_BY_ID: 'SELECT * FROM sales WHERE id = ?',
    FIND_BY_INVOICE: 'SELECT * FROM sales WHERE invoice_number = ?',
    FIND_ITEMS: 'SELECT * FROM sales_items WHERE sales_id = ?',
    BY_DATE: 'SELECT * FROM sales WHERE DATE(invoice_date) = ? ORDER BY invoice_date DESC',
    BY_DATE_RANGE: `SELECT * FROM sales 
                    WHERE DATE(invoice_date) BETWEEN ? AND ? 
                    ORDER BY invoice_date DESC`,
    BY_CUSTOMER: 'SELECT * FROM sales WHERE customer_id = ? ORDER BY invoice_date DESC',
    DAILY_SUMMARY: `SELECT 
                      DATE(invoice_date) as date,
                      COUNT(*) as total_bills,
                      SUM(total_amount) as total_sales,
                      SUM(tax_amount) as total_tax,
                      SUM(discount_amount) as total_discount
                    FROM sales 
                    WHERE DATE(invoice_date) = ?
                    GROUP BY DATE(invoice_date)`
  },

  // Company config queries
  CONFIG: {
    GET: 'SELECT * FROM company_config WHERE id = 1',
    UPDATE: `UPDATE company_config SET 
               company_name = ?, address = ?, gst_number = ?, phone = ?, email = ?,
               invoice_prefix = ?, current_invoice_number = ?, fiscal_year_start = ?,
               currency_symbol = ?, date_format = ?, time_zone = ?
             WHERE id = 1`,
    UPDATE_INVOICE_NUMBER: 'UPDATE company_config SET current_invoice_number = ? WHERE id = 1'
  },

  // Reports queries
  REPORTS: {
    SALES_SUMMARY: `SELECT 
                      DATE(invoice_date) as date,
                      COUNT(*) as total_bills,
                      SUM(subtotal) as subtotal,
                      SUM(discount_amount) as total_discount,
                      SUM(tax_amount) as total_tax,
                      SUM(total_amount) as total_sales
                    FROM sales 
                    WHERE DATE(invoice_date) BETWEEN ? AND ?
                    GROUP BY DATE(invoice_date)
                    ORDER BY date`,
    
    TOP_ITEMS: `SELECT 
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
                LIMIT 20`,
    
    CUSTOMER_ANALYSIS: `SELECT 
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
                        ORDER BY total_spent DESC`
  }
};

// Helper function to generate invoice number
export function generateInvoiceNumber(prefix: string, currentNumber: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const number = String(currentNumber).padStart(6, '0');
  return `${prefix}-${year}${month}-${number}`;
}

// Helper function to calculate GST
export function calculateGST(amount: number, rate: number, inclusive: boolean = true) {
  if (inclusive) {
    const baseAmount = amount / (1 + rate / 100);
    const gstAmount = amount - baseAmount;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      igst: 0,
      total: amount
    };
  } else {
    const gstAmount = (amount * rate) / 100;
    return {
      baseAmount: amount,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      igst: 0,
      total: Math.round((amount + gstAmount) * 100) / 100
    };
  }
}

// Helper function to round off amount
export function roundOff(amount: number): number {
  return Math.round(amount);
}