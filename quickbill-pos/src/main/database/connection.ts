import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import { runMigrations } from './migrations';

export class DatabaseManager {
  private db: Database.Database;
  private readonly dbPath: string;
  public statements: Record<string, Database.Statement> = {};

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'quickbill.db');
  }

  connect(): void {
    this.db = new Database(this.dbPath, {
      verbose: console.log,
      fileMustExist: false
    });
    
    this.optimizeSettings();
    runMigrations(this.db);
    this.prepareStatements();
  }

  private optimizeSettings(): void {
    // Enable WAL mode for concurrent access
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('wal_autocheckpoint = 1000');
    
    // Performance optimizations
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 268435456'); // 256MB memory map
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('page_size = 4096');
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Analyze tables periodically
    this.db.exec('ANALYZE');
  }

  prepareStatements(): void {
    this.statements = {
      // Item queries
      findItemByBarcode: this.db.prepare(
        'SELECT * FROM items WHERE barcode = ? AND is_active = 1'
      ),
      searchItems: this.db.prepare(
        `SELECT * FROM items 
         WHERE (barcode LIKE ? OR item_description LIKE ? OR brand LIKE ?)
         AND is_active = 1 
         LIMIT 50`
      ),
      findItemById: this.db.prepare(
        'SELECT * FROM items WHERE id = ? AND is_active = 1'
      ),
      updateItemStock: this.db.prepare(
        'UPDATE items SET current_stock = current_stock - ? WHERE id = ?'
      ),
      getItemsByCategory: this.db.prepare(
        'SELECT * FROM items WHERE category = ? AND is_active = 1 LIMIT 100'
      ),

      // Customer queries
      findCustomerByMobile: this.db.prepare(
        'SELECT * FROM customers WHERE mobile = ? AND is_active = 1'
      ),
      searchCustomers: this.db.prepare(
        'SELECT * FROM customers WHERE (mobile LIKE ? OR name LIKE ?) AND is_active = 1 LIMIT 50'
      ),
      findCustomerById: this.db.prepare(
        'SELECT * FROM customers WHERE id = ? AND is_active = 1'
      ),
      updateCustomerBalance: this.db.prepare(
        'UPDATE customers SET current_balance = current_balance + ? WHERE id = ?'
      ),

      // Sales queries
      createSale: this.db.prepare(`
        INSERT INTO sales (
          invoice_number, invoice_date, customer_id, customer_name, customer_mobile,
          subtotal, discount_amount, tax_amount, round_off, total_amount,
          paid_amount, balance_amount, payment_mode, transaction_type, status,
          salesman_id, terminal_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      createSaleItem: this.db.prepare(`
        INSERT INTO sales_items (
          sales_id, item_id, barcode, item_name, quantity, unit_price,
          discount_percent, discount_amount, tax_percent, tax_amount, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      getSaleById: this.db.prepare(
        'SELECT * FROM sales WHERE id = ?'
      ),
      getSaleItems: this.db.prepare(
        'SELECT * FROM sales_items WHERE sales_id = ?'
      ),
      getSalesByDate: this.db.prepare(
        'SELECT * FROM sales WHERE DATE(invoice_date) = ? ORDER BY invoice_date DESC'
      ),

      // Company config
      getCompanyConfig: this.db.prepare(
        'SELECT * FROM company_config WHERE id = 1'
      ),
      updateCompanyConfig: this.db.prepare(`
        UPDATE company_config SET 
          company_name = ?, address = ?, gst_number = ?, phone = ?, email = ?,
          invoice_prefix = ?, current_invoice_number = ?, fiscal_year_start = ?,
          currency_symbol = ?, date_format = ?, time_zone = ?
        WHERE id = 1
      `)
    };
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  getStatement(name: string): Database.Statement | undefined {
    return this.statements[name];
  }

  async backup(): Promise<void> {
    const backupPath = path.join(
      app.getPath('userData'),
      'backups',
      `backup_${Date.now()}.db`
    );
    
    // Ensure backup directory exists
    const fs = require('fs');
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    await this.db.backup(backupPath);
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}