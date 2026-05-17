import Database from 'better-sqlite3';
import { DatabaseManager } from '../main/database/connection';
import { runMigrations } from '../main/database/migrations';

describe('Database Operations', () => {
  let db: Database.Database;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');
    runMigrations(db);
    
    dbManager = new DatabaseManager();
    // Mock the database path to use in-memory
    (dbManager as any).dbPath = ':memory:';
    (dbManager as any).db = db;
    dbManager.prepareStatements();
  });

  afterEach(() => {
    db.close();
  });

  describe('Items Operations', () => {
    it('should create item successfully', () => {
      const itemData = {
        brand: 'Test Brand',
        style_code: 'TS001',
        item_description: 'Test Item',
        mrp: 100,
        gst_percentage: 18,
        category: 'Test Category'
      };

      const result = db.prepare(`
        INSERT INTO items (
          brand, style_code, item_description, mrp, gst_percentage, category
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        itemData.brand,
        itemData.style_code,
        itemData.item_description,
        itemData.mrp,
        itemData.gst_percentage,
        itemData.category
      );

      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeDefined();
    });

    it('should find item by barcode', () => {
      // Insert test item
      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, barcode, mrp, gst_percentage)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Test Brand', 'TS001', 'Test Item', '1234567890', 100, 18);

      const findItemByBarcode = dbManager.getStatement('findItemByBarcode');
      const item = findItemByBarcode?.get('1234567890');

      expect(item).toBeDefined();
      expect(item?.brand).toBe('Test Brand');
      expect(item?.barcode).toBe('1234567890');
    });

    it('should search items by description', () => {
      // Insert test items
      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage)
        VALUES (?, ?, ?, ?, ?)
      `).run('Brand A', 'TS001', 'Test Shirt', 100, 18);

      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage)
        VALUES (?, ?, ?, ?, ?)
      `).run('Brand B', 'TS002', 'Test Pants', 200, 18);

      const searchItems = dbManager.getStatement('searchItems');
      const items = searchItems?.all('%Test%', '%Test%', '%Test%');

      expect(items).toHaveLength(2);
    });

    it('should update item stock', () => {
      // Insert test item
      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage, current_stock)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Test Brand', 'TS001', 'Test Item', 100, 18, 10);

      const updateItemStock = dbManager.getStatement('updateItemStock');
      updateItemStock?.run(5, 1);

      const item = db.prepare('SELECT current_stock FROM items WHERE id = ?').get(1);
      expect(item?.current_stock).toBe(5);
    });
  });

  describe('Customer Operations', () => {
    it('should create customer successfully', () => {
      const customerData = {
        mobile: '9876543210',
        name: 'Test Customer',
        email: 'test@example.com',
        customer_type: 'RETAIL'
      };

      const result = db.prepare(`
        INSERT INTO customers (mobile, name, email, customer_type)
        VALUES (?, ?, ?, ?)
      `).run(
        customerData.mobile,
        customerData.name,
        customerData.email,
        customerData.customer_type
      );

      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeDefined();
    });

    it('should find customer by mobile', () => {
      // Insert test customer
      db.prepare(`
        INSERT INTO customers (mobile, name, customer_type)
        VALUES (?, ?, ?)
      `).run('9876543210', 'Test Customer', 'RETAIL');

      const findCustomerByMobile = dbManager.getStatement('findCustomerByMobile');
      const customer = findCustomerByMobile?.get('9876543210');

      expect(customer).toBeDefined();
      expect(customer?.name).toBe('Test Customer');
      expect(customer?.mobile).toBe('9876543210');
    });

    it('should create customer with children', () => {
      // Insert customer
      const customerResult = db.prepare(`
        INSERT INTO customers (mobile, name, customer_type)
        VALUES (?, ?, ?)
      `).run('9876543210', 'Test Customer', 'RETAIL');

      const customerId = customerResult.lastInsertRowid;

      // Insert children
      db.prepare(`
        INSERT INTO customer_children (customer_id, child_name, date_of_birth, child_order)
        VALUES (?, ?, ?, ?)
      `).run(customerId, 'Child 1', '2020-01-01', 1);

      db.prepare(`
        INSERT INTO customer_children (customer_id, child_name, date_of_birth, child_order)
        VALUES (?, ?, ?, ?)
      `).run(customerId, 'Child 2', '2022-01-01', 2);

      const children = db.prepare(`
        SELECT * FROM customer_children WHERE customer_id = ? ORDER BY child_order
      `).all(customerId);

      expect(children).toHaveLength(2);
      expect(children[0].child_name).toBe('Child 1');
      expect(children[1].child_name).toBe('Child 2');
    });
  });

  describe('Sales Operations', () => {
    it('should create sale transaction', () => {
      // Insert test item and customer
      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage, current_stock)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Test Brand', 'TS001', 'Test Item', 100, 18, 10);

      db.prepare(`
        INSERT INTO customers (mobile, name, customer_type)
        VALUES (?, ?, ?)
      `).run('9876543210', 'Test Customer', 'RETAIL');

      // Create sale
      const saleResult = db.prepare(`
        INSERT INTO sales (
          invoice_number, invoice_date, customer_id, customer_name, customer_mobile,
          subtotal, discount_amount, tax_amount, total_amount, paid_amount,
          payment_mode, transaction_type, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'INV-001',
        new Date().toISOString(),
        1,
        'Test Customer',
        '9876543210',
        100,
        0,
        18,
        118,
        118,
        'CASH',
        'SALES',
        'COMPLETED',
        1
      );

      expect(saleResult.changes).toBe(1);
      expect(saleResult.lastInsertRowid).toBeDefined();
    });

    it('should create sale with items', () => {
      // Insert test data
      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage, current_stock)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Test Brand', 'TS001', 'Test Item', 100, 18, 10);

      db.prepare(`
        INSERT INTO customers (mobile, name, customer_type)
        VALUES (?, ?, ?)
      `).run('9876543210', 'Test Customer', 'RETAIL');

      // Create sale
      const saleResult = db.prepare(`
        INSERT INTO sales (
          invoice_number, invoice_date, customer_id, customer_name, customer_mobile,
          subtotal, discount_amount, tax_amount, total_amount, paid_amount,
          payment_mode, transaction_type, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'INV-001',
        new Date().toISOString(),
        1,
        'Test Customer',
        '9876543210',
        100,
        0,
        18,
        118,
        118,
        'CASH',
        'SALES',
        'COMPLETED',
        1
      );

      const saleId = saleResult.lastInsertRowid;

      // Create sale item
      const saleItemResult = db.prepare(`
        INSERT INTO sales_items (
          sales_id, item_id, barcode, item_name, quantity, unit_price,
          discount_percent, discount_amount, tax_percent, tax_amount, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        saleId,
        1,
        '1234567890',
        'Test Item',
        1,
        100,
        0,
        0,
        18,
        18,
        118
      );

      expect(saleItemResult.changes).toBe(1);

      // Verify sale items
      const saleItems = db.prepare(`
        SELECT * FROM sales_items WHERE sales_id = ?
      `).all(saleId);

      expect(saleItems).toHaveLength(1);
      expect(saleItems[0].item_name).toBe('Test Item');
    });
  });

  describe('Transaction Management', () => {
    it('should handle transaction rollback on error', () => {
      db.prepare(`
        INSERT INTO items (brand, style_code, item_description, barcode, mrp, gst_percentage)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Existing Brand', 'EX001', 'Existing Item', '1234567890', 100, 18);

      const transaction = db.transaction((data: any) => {
        // Insert item
        db.prepare(`
          INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage)
          VALUES (?, ?, ?, ?, ?)
        `).run(data.brand, data.style_code, data.item_description, data.mrp, data.gst_percentage);

        // This should cause an error due to duplicate barcode
        db.prepare(`
          INSERT INTO items (brand, style_code, item_description, barcode, mrp, gst_percentage)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(data.brand, data.style_code, data.item_description, data.barcode, data.mrp, data.gst_percentage);
      });

      expect(() => {
        transaction({
          brand: 'Test Brand',
          style_code: 'TS001',
          item_description: 'Test Item',
          mrp: 100,
          gst_percentage: 18,
          barcode: '1234567890'
        });
      }).toThrow();

      // Verify no items were inserted due to rollback
      const items = db.prepare('SELECT COUNT(*) as count FROM items').get();
      expect(items?.count).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of items efficiently', () => {
      const insertItem = db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const startTime = Date.now();

      // Insert 1000 items
      for (let i = 0; i < 1000; i++) {
        insertItem.run(
          `Brand ${i}`,
          `ST${i.toString().padStart(3, '0')}`,
          `Item ${i}`,
          100 + i,
          18,
          'Test Category'
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second

      const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
      expect(count?.count).toBe(1000);
    });

    it('should search items efficiently with indexes', () => {
      // Insert test items
      const insertItem = db.prepare(`
        INSERT INTO items (brand, style_code, item_description, mrp, gst_percentage, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < 100; i++) {
        insertItem.run(
          `Brand ${i}`,
          `ST${i.toString().padStart(3, '0')}`,
          `Item ${i}`,
          100 + i,
          18,
          'Test Category'
        );
      }

      const startTime = Date.now();
      const searchItems = db.prepare(`
        SELECT * FROM items 
        WHERE item_description LIKE ? 
        AND is_active = 1 
        LIMIT 10
      `);
      const results = searchItems.all('%Item 5%');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(results.length).toBeGreaterThan(0);
    });
  });
});