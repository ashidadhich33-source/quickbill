import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  // Create items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand VARCHAR(100) NOT NULL,
      style_code VARCHAR(50) NOT NULL,
      item_description TEXT NOT NULL,
      size VARCHAR(20),
      shade VARCHAR(50),
      barcode VARCHAR(20) UNIQUE,
      ean_code VARCHAR(20),
      mrp DECIMAL(10, 2) NOT NULL,
      gst_percentage DECIMAL(5, 2) NOT NULL,
      base_rate DECIMAL(10, 2),
      purchase_rate DECIMAL(10, 2),
      gender VARCHAR(20),
      category VARCHAR(100),
      sub_category VARCHAR(100),
      hsn_code VARCHAR(10),
      season VARCHAR(50),
      current_stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      max_stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(brand, style_code, size, shade)
    )
  `);

  // Create customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile VARCHAR(15) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      address TEXT,
      city VARCHAR(50),
      state VARCHAR(50),
      pincode VARCHAR(10),
      gst_number VARCHAR(20),
      credit_limit DECIMAL(10, 2) DEFAULT 0,
      current_balance DECIMAL(10, 2) DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      customer_type VARCHAR(20) DEFAULT 'RETAIL',
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create customer children table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      child_name VARCHAR(100),
      date_of_birth DATE,
      child_order INTEGER CHECK (child_order IN (1, 2, 3)),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      UNIQUE(customer_id, child_order)
    )
  `);

  // Create sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number VARCHAR(30) UNIQUE NOT NULL,
      invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      customer_id INTEGER,
      customer_name VARCHAR(100),
      customer_mobile VARCHAR(15),
      subtotal DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_amount DECIMAL(10, 2) NOT NULL,
      round_off DECIMAL(5, 2) DEFAULT 0,
      total_amount DECIMAL(12, 2) NOT NULL,
      paid_amount DECIMAL(12, 2) DEFAULT 0,
      balance_amount DECIMAL(12, 2) DEFAULT 0,
      payment_mode VARCHAR(20),
      transaction_type VARCHAR(20) DEFAULT 'SALES',
      status VARCHAR(20) DEFAULT 'COMPLETED',
      salesman_id INTEGER,
      terminal_id VARCHAR(20),
      sync_status BOOLEAN DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Create sales_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      barcode VARCHAR(20),
      item_name TEXT NOT NULL,
      quantity DECIMAL(10, 3) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      discount_percent DECIMAL(5, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_percent DECIMAL(5, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      FOREIGN KEY (sales_id) REFERENCES sales(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  // Create company_config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS company_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      company_name VARCHAR(200) NOT NULL,
      address TEXT,
      gst_number VARCHAR(20),
      phone VARCHAR(50),
      email VARCHAR(100),
      invoice_prefix VARCHAR(10),
      current_invoice_number INTEGER DEFAULT 1,
      fiscal_year_start DATE,
      currency_symbol VARCHAR(5) DEFAULT '₹',
      date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
      time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata'
    )
  `);

  // Create user_permissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module VARCHAR(50) NOT NULL,
      can_create BOOLEAN DEFAULT 0,
      can_read BOOLEAN DEFAULT 1,
      can_update BOOLEAN DEFAULT 0,
      can_delete BOOLEAN DEFAULT 0,
      UNIQUE(user_id, module)
    )
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'CASHIER',
      is_active BOOLEAN DEFAULT 1,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create holds table for bill hold/recall
  db.exec(`
    CREATE TABLE IF NOT EXISTS holds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hold_id VARCHAR(50) UNIQUE NOT NULL,
      hold_data TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create sales_returns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number VARCHAR(30) UNIQUE NOT NULL,
      original_sale_id INTEGER NOT NULL,
      return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      customer_id INTEGER,
      customer_name VARCHAR(100),
      customer_mobile VARCHAR(15),
      reason TEXT,
      return_amount DECIMAL(12, 2) NOT NULL,
      refund_amount DECIMAL(12, 2) NOT NULL,
      refund_mode VARCHAR(20) DEFAULT 'CASH',
      status VARCHAR(20) DEFAULT 'COMPLETED',
      processed_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_sale_id) REFERENCES sales(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    )
  `);

  // Create sales_return_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL,
      original_item_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      barcode VARCHAR(20),
      item_name TEXT NOT NULL,
      quantity DECIMAL(10, 3) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      return_reason TEXT,
      condition_status VARCHAR(20) DEFAULT 'GOOD',
      refund_amount DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (return_id) REFERENCES sales_returns(id),
      FOREIGN KEY (original_item_id) REFERENCES sales_items(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  // Create suppliers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_code VARCHAR(20) UNIQUE NOT NULL,
      company_name VARCHAR(200) NOT NULL,
      contact_person VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      mobile VARCHAR(15),
      address TEXT,
      city VARCHAR(50),
      state VARCHAR(50),
      pincode VARCHAR(10),
      gst_number VARCHAR(20),
      pan_number VARCHAR(20),
      payment_terms INTEGER DEFAULT 30,
      credit_limit DECIMAL(12, 2) DEFAULT 0,
      current_balance DECIMAL(12, 2) DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create purchase_orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number VARCHAR(30) UNIQUE NOT NULL,
      po_date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      supplier_name VARCHAR(200) NOT NULL,
      expected_delivery_date DATE,
      subtotal DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'DRAFT',
      notes TEXT,
      created_by INTEGER NOT NULL,
      approved_by INTEGER,
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // Create purchase_order_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity DECIMAL(10, 3) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      discount_percent DECIMAL(5, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_percent DECIMAL(5, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      received_quantity DECIMAL(10, 3) DEFAULT 0,
      pending_quantity DECIMAL(10, 3) NOT NULL,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  // Create purchase_receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number VARCHAR(30) UNIQUE NOT NULL,
      receipt_date DATE NOT NULL,
      po_id INTEGER,
      supplier_id INTEGER NOT NULL,
      supplier_name VARCHAR(200) NOT NULL,
      supplier_invoice_number VARCHAR(50),
      supplier_invoice_date DATE,
      subtotal DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'RECEIVED',
      notes TEXT,
      received_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (received_by) REFERENCES users(id)
    )
  `);

  // Create purchase_receipt_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      po_item_id INTEGER,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity DECIMAL(10, 3) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      discount_percent DECIMAL(5, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_percent DECIMAL(5, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      batch_number VARCHAR(50),
      expiry_date DATE,
      condition_status VARCHAR(20) DEFAULT 'GOOD',
      FOREIGN KEY (receipt_id) REFERENCES purchase_receipts(id),
      FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  // Create supplier_payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number VARCHAR(30) UNIQUE NOT NULL,
      payment_date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      supplier_name VARCHAR(200) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      payment_mode VARCHAR(20) NOT NULL,
      reference_number VARCHAR(50),
      notes TEXT,
      receipt_ids TEXT,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create audit_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action VARCHAR(100) NOT NULL,
      user_id INTEGER NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes for performance
  createIndexes(db);

  // Insert default company config if not exists
  const configExists = db.prepare('SELECT COUNT(*) as count FROM company_config').get() as { count: number };
  if (configExists.count === 0) {
    db.prepare(`
      INSERT INTO company_config (
        company_name, address, gst_number, phone, email,
        invoice_prefix, current_invoice_number, fiscal_year_start,
        currency_symbol, date_format, time_zone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'QuickBill POS', '', '', '', '',
      'INV', 1, '2024-04-01',
      '₹', 'DD/MM/YYYY', 'Asia/Kolkata'
    );
  }

  // Insert default admin user if not exists
  const userExists = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userExists.count === 0) {
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.prepare(`
      INSERT INTO users (
        username, email, password_hash, full_name, role
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      'admin',
      'admin@quickbill.com',
      hashedPassword,
      'Administrator',
      'ADMIN'
    );
  }
}

function createIndexes(db: Database.Database): void {
  // Items indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_ean ON items(ean_code)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_brand_style ON items(brand, style_code)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_search ON items(item_description)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category, sub_category)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active)');

  // Customer indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active)');

  // Sales indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(invoice_date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_items_sales ON sales_items(sales_id)');

  // User indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_holds_hold_id ON holds(hold_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_holds_user ON holds(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_holds_expires ON holds(expires_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_returns_number ON sales_returns(return_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_returns_sale ON sales_returns(original_sale_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns(customer_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON sales_returns(return_date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_return_items_item ON sales_return_items(item_id)');
  
  // Supplier indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(company_name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active)');
  
  // Purchase Order indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(po_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(po_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item ON purchase_order_items(item_id)');
  
  // Purchase Receipt indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_receipts_number ON purchase_receipts(receipt_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_receipts_supplier ON purchase_receipts(supplier_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_receipts_date ON purchase_receipts(receipt_date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_receipts_po ON purchase_receipts(po_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_receipt ON purchase_receipt_items(receipt_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_item ON purchase_receipt_items(item_id)');
  
  // Supplier Payment indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_supplier_payments_number ON supplier_payments(payment_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date)');
}