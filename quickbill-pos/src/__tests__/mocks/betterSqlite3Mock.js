class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.lower = this.sql.toLowerCase();
  }

  run(...params) {
    if (this.lower.startsWith('insert into items')) {
      const row = this.db.buildRow(this.sql, params);
      if (row.barcode && this.db.tables.items.some((item) => item.barcode === row.barcode)) {
        throw new Error('UNIQUE constraint failed: items.barcode');
      }
      return this.db.insert('items', row);
    }
    if (this.lower.startsWith('insert into customers')) {
      return this.db.insert('customers', this.db.buildRow(this.sql, params));
    }
    if (this.lower.startsWith('insert into customer_children')) {
      return this.db.insert('customer_children', this.db.buildRow(this.sql, params));
    }
    if (this.lower.startsWith('insert into users')) {
      return this.db.insert('users', this.db.buildRow(this.sql, params));
    }
    if (this.lower.startsWith('insert into sales_items')) {
      return this.db.insert('sales_items', this.db.buildRow(this.sql, params));
    }
    if (this.lower.startsWith('insert into sales')) {
      return this.db.insert('sales', this.db.buildRow(this.sql, params));
    }
    if (this.lower.startsWith('update items set current_stock = current_stock -')) {
      const [quantity, id] = params;
      const item = this.db.tables.items.find((row) => row.id === id);
      if (item) item.current_stock = (item.current_stock || 0) - quantity;
      return { changes: item ? 1 : 0, lastInsertRowid: 0 };
    }
    return { changes: 1, lastInsertRowid: 0 };
  }

  get(...params) {
    if (this.lower.includes('select count(*) as count from items')) {
      return { count: this.db.tables.items.length };
    }
    if (this.lower.includes('select count(*) as count from users')) {
      return { count: this.db.tables.users.length };
    }
    if (this.lower.includes('select current_stock from items where id')) {
      const item = this.db.tables.items.find((row) => row.id === params[0]);
      return item ? { current_stock: item.current_stock } : undefined;
    }
    if (this.lower.includes('from items where barcode')) {
      return this.db.tables.items.find((row) => row.barcode === params[0] && row.is_active !== 0);
    }
    if (this.lower.includes('from customers where mobile')) {
      return this.db.tables.customers.find((row) => row.mobile === params[0] && row.is_active !== 0);
    }
    if (this.lower.includes('from company_config')) {
      return { id: 1, invoice_prefix: 'INV', current_invoice_number: 1 };
    }
    return this.all(...params)[0];
  }

  all(...params) {
    if (this.lower.includes('from items') && this.lower.includes('like')) {
      const terms = params.map((param) => String(param).replace(/%/g, '').toLowerCase()).filter(Boolean);
      return this.db.tables.items.filter((item) => {
        const haystack = `${item.barcode || ''} ${item.item_description || ''} ${item.brand || ''}`.toLowerCase();
        return item.is_active !== 0 && terms.some((term) => haystack.includes(term));
      }).slice(0, this.lower.includes('limit 10') ? 10 : 50);
    }
    if (this.lower.includes('from customer_children')) {
      return this.db.tables.customer_children
        .filter((row) => row.customer_id === params[0])
        .sort((a, b) => (a.child_order || 0) - (b.child_order || 0));
    }
    if (this.lower.includes('from sales_items')) {
      return this.db.tables.sales_items.filter((row) => row.sales_id === params[0]);
    }
    if (this.lower.includes('from sales')) {
      return this.db.tables.sales;
    }
    if (this.lower.includes('from customers')) {
      return this.db.tables.customers;
    }
    if (this.lower.includes('from items')) {
      return this.db.tables.items;
    }
    return [];
  }
}

class FakeDatabase {
  constructor() {
    this.tables = {
      items: [],
      customers: [],
      customer_children: [],
      sales: [],
      sales_items: [],
      users: [],
    };
    this.ids = {
      items: 1,
      customers: 1,
      customer_children: 1,
      sales: 1,
      sales_items: 1,
      users: 1,
    };
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }

  exec() {}
  pragma() {}
  close() {}
  backup() { return Promise.resolve(); }

  transaction(callback) {
    return (...args) => {
      const snapshot = JSON.parse(JSON.stringify({ tables: this.tables, ids: this.ids }));
      try {
        return callback(...args);
      } catch (error) {
        this.tables = snapshot.tables;
        this.ids = snapshot.ids;
        throw error;
      }
    };
  }

  insert(table, row) {
    const id = this.ids[table]++;
    const record = { id, is_active: 1, ...row };
    this.tables[table].push(record);
    return { changes: 1, lastInsertRowid: id };
  }

  buildRow(sql, params) {
    const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    const columns = columnsMatch
      ? columnsMatch[1].split(',').map((column) => column.trim())
      : [];
    return columns.reduce((row, column, index) => {
      row[column] = params[index];
      return row;
    }, {});
  }
}

module.exports = FakeDatabase;
module.exports.default = FakeDatabase;
