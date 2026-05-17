import { ipcMain, BrowserWindow } from 'electron';
import { DatabaseManager } from '../../main/database/connection';
import { setupSalesHandlers } from '../../main/ipc/sales.handler';
import { setupItemsHandlers } from '../../main/ipc/items.handler';
import { setupCustomersHandlers } from '../../main/ipc/customers.handler';
import { setupAuthHandlers } from '../../main/ipc/auth.handler';
import { setupReportsHandlers } from '../../main/ipc/reports.handler';
import { setupSystemHandlers } from '../../main/ipc/system.handler';
import { setupFileHandlers } from '../../main/ipc/file.handler';
import { setupPrinterHandlers } from '../../main/ipc/printer.handler';
import { setupEncryptionHandlers } from '../../main/ipc/encryption.handler';

// Mock Electron modules
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  BrowserWindow: jest.fn(),
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
  },
  systemPreferences: {
    isDarkMode: jest.fn(() => false),
    isHighContrast: jest.fn(() => false),
    isInvertedColorScheme: jest.fn(() => false),
    getAccentColor: jest.fn(() => '#0078d4'),
    getSystemColor: jest.fn(() => '#ffffff'),
  },
}));

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: jest.fn(() => ({
      run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
      get: jest.fn(() => ({ id: 1, name: 'Test Item' })),
      all: jest.fn(() => [{ id: 1, name: 'Test Item' }]),
    })),
    exec: jest.fn(),
    close: jest.fn(),
    backup: jest.fn(),
  };
  return jest.fn(() => mockDb);
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => 'mock file content'),
  appendFileSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
}));

// Mock path
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn((...args) => args.join('/')),
    dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
    resolve: jest.fn((...args) => args.join('/')),
  };
});

// Mock os
jest.mock('os', () => ({
  platform: jest.fn(() => 'win32'),
  arch: jest.fn(() => 'x64'),
  release: jest.fn(() => '10.0.19041'),
  totalmem: jest.fn(() => 8589934592),
  freemem: jest.fn(() => 4294967296),
  cpus: jest.fn(() => [{ model: 'Intel Core i7', speed: 2400 }]),
  uptime: jest.fn(() => 3600),
  hostname: jest.fn(() => 'test-machine'),
  userInfo: jest.fn(() => ({ username: 'testuser' })),
  networkInterfaces: jest.fn(() => ({})),
}));

describe('IPC Handlers Integration Tests', () => {
  let mockDbManager: DatabaseManager;
  let mockMainWindow: BrowserWindow;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock database manager
    mockDbManager = new DatabaseManager();
    
    // Create mock main window
    mockMainWindow = {
      webContents: {
        print: jest.fn(),
        send: jest.fn(),
      },
    } as any;

    // Setup all handlers
    setupSalesHandlers(mockDbManager);
    setupItemsHandlers(mockDbManager);
    setupCustomersHandlers(mockDbManager);
    setupAuthHandlers(mockDbManager);
    setupReportsHandlers(mockDbManager);
    setupSystemHandlers();
    setupFileHandlers();
    setupPrinterHandlers(mockMainWindow);
    setupEncryptionHandlers();
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });

  describe('Sales Handlers', () => {
    it('should handle createSale IPC call', async () => {
      const mockEvent = {};
      const saleData = {
        customer_id: 1,
        items: [{ item_id: 1, quantity: 2, selling_price: 100 }],
        payment_mode: 'CASH',
        received_amount: 200,
      };

      // Mock the database response
      const mockStatement = {
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
        get: jest.fn(() => ({ id: 1, invoice_number: 'INV-001' })),
        all: jest.fn(() => []),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);
      mockDbManager.getDatabase = jest.fn(() => ({
        prepare: jest.fn(() => mockStatement),
        transaction: jest.fn((callback) => callback()),
      }));

      // Simulate IPC call
      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'sales:create')[1];
      
      const result = await handler(mockEvent, saleData);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('invoiceNumber');
    });

    it('should handle getSalesByDate IPC call', async () => {
      const mockEvent = {};
      const date = '2024-01-01';

      const mockStatement = {
        all: jest.fn(() => [
          { id: 1, invoice_number: 'INV-001', total_amount: 100 },
          { id: 2, invoice_number: 'INV-002', total_amount: 200 },
        ]),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'sales:getByDate')[1];
      
      const result = await handler(mockEvent, date);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Items Handlers', () => {
    it('should handle searchItems IPC call', async () => {
      const mockEvent = {};
      const searchTerm = 'test item';

      const mockStatement = {
        all: jest.fn(() => [
          { id: 1, brand: 'Test Brand', item_description: 'Test Item' },
        ]),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'items:search')[1];
      
      const result = await handler(mockEvent, searchTerm);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle createItem IPC call', async () => {
      const mockEvent = {};
      const itemData = {
        brand: 'Test Brand',
        style_code: 'TS001',
        item_description: 'Test Item',
        mrp: 100,
        gst_percentage: 18,
      };

      const mockStatement = {
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'items:create')[1];
      
      const result = await handler(mockEvent, itemData);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    });
  });

  describe('Customers Handlers', () => {
    it('should handle createCustomer IPC call', async () => {
      const mockEvent = {};
      const customerData = {
        name: 'Test Customer',
        mobile: '9876543210',
        email: 'test@example.com',
      };

      const mockStatement = {
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'customers:create')[1];
      
      const result = await handler(mockEvent, customerData);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    });

    it('should handle searchCustomers IPC call', async () => {
      const mockEvent = {};
      const searchTerm = 'test customer';

      const mockStatement = {
        all: jest.fn(() => [
          { id: 1, name: 'Test Customer', mobile: '9876543210' },
        ]),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'customers:search')[1];
      
      const result = await handler(mockEvent, searchTerm);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('Auth Handlers', () => {
    it('should handle login IPC call', async () => {
      const mockEvent = {};
      const credentials = {
        username: 'admin',
        password: 'admin123',
      };

      const mockStatement = {
        get: jest.fn(() => ({
          id: 1,
          username: 'admin',
          password_hash: '$2b$10$hashedpassword',
          full_name: 'Administrator',
          role: 'ADMIN',
        })),
        run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      // Mock bcrypt
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'auth:login')[1];
      
      const result = await handler(mockEvent, credentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty('id');
      expect(result.session).toHaveProperty('session_token');
    });

    it('should handle validateSession IPC call', async () => {
      const mockEvent = {};
      const sessionToken = 'valid-session-token';

      const mockStatement = {
        get: jest.fn(() => ({
          id: 1,
          username: 'admin',
          full_name: 'Administrator',
          role: 'ADMIN',
        })),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'auth:validateSession')[1];
      
      const result = await handler(mockEvent, sessionToken);
      
      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty('id');
    });
  });

  describe('Reports Handlers', () => {
    it('should handle getSalesSummary IPC call', async () => {
      const mockEvent = {};
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockStatement = {
        all: jest.fn(() => [
          { date: '2024-01-01', total_bills: 10, total_sales: 1000 },
          { date: '2024-01-02', total_bills: 15, total_sales: 1500 },
        ]),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'reports:getSalesSummary')[1];
      
      const result = await handler(mockEvent, startDate, endDate);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle getTopItems IPC call', async () => {
      const mockEvent = {};
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockStatement = {
        all: jest.fn(() => [
          { item_id: 1, brand: 'Test Brand', total_quantity: 100, total_sales: 10000 },
        ]),
      };
      
      mockDbManager.getStatement = jest.fn(() => mockStatement);

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'reports:getTopItems')[1];
      
      const result = await handler(mockEvent, startDate, endDate);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('System Handlers', () => {
    it('should handle getSystemInfo IPC call', async () => {
      const mockEvent = {};

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'system:info')[1];
      
      const result = await handler(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('platform');
      expect(result.data).toHaveProperty('arch');
      expect(result.data).toHaveProperty('totalMemory');
    });

    it('should handle getMemoryUsage IPC call', async () => {
      const mockEvent = {};

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'system:memoryUsage')[1];
      
      const result = await handler(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('process');
      expect(result.data).toHaveProperty('system');
    });
  });

  describe('Printer Handlers', () => {
    it('should handle printReceipt IPC call', async () => {
      const mockEvent = {};
      const receiptData = {
        companyName: 'Test Company',
        invoiceNumber: 'INV-001',
        total: 100,
        items: [],
      };

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'printer:printReceipt')[1];
      
      const result = await handler(mockEvent, receiptData);
      
      expect(result.success).toBe(true);
    });

    it('should handle getAvailablePrinters IPC call', async () => {
      const mockEvent = {};

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'printer:getAvailablePrinters')[1];
      
      const result = await handler(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.printers).toBeDefined();
    });
  });

  describe('Encryption Handlers', () => {
    it('should handle encrypt IPC call', async () => {
      const mockEvent = {};
      const text = 'sensitive data';
      const password = 'test-password';

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'encryption:encrypt')[1];
      
      const result = await handler(mockEvent, text, password);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle decrypt IPC call', async () => {
      const mockEvent = {};
      const encryptedData = '{"encrypted":"data","iv":"iv","tag":"tag"}';
      const password = 'test-password';

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'encryption:decrypt')[1];
      
      const result = await handler(mockEvent, encryptedData, password);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle hashPassword IPC call', async () => {
      const mockEvent = {};
      const password = 'test-password';

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'encryption:hashPassword')[1];
      
      const result = await handler(mockEvent, password);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain(':');
    });

    it('should handle verifyPassword IPC call', async () => {
      const mockEvent = {};
      const password = 'test-password';
      const hashedPassword = 'salt:hash';

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'encryption:verifyPassword')[1];
      
      const result = await handler(mockEvent, password, hashedPassword);
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockEvent = {};
      const saleData = {};

      // Mock database error
      mockDbManager.getStatement = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'sales:create')[1];
      
      const result = await handler(mockEvent, saleData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle invalid input gracefully', async () => {
      const mockEvent = {};
      const invalidData = null;

      const handler = (ipcMain.handle as jest.Mock).mock.calls
        .find(call => call[0] === 'items:create')[1];
      
      const result = await handler(mockEvent, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Handler Registration', () => {
    it('should register all required IPC handlers', () => {
      const registeredHandlers = (ipcMain.handle as jest.Mock).mock.calls.map(call => call[0]);
      
      // Sales handlers
      expect(registeredHandlers).toContain('sales:create');
      expect(registeredHandlers).toContain('sales:getByDate');
      expect(registeredHandlers).toContain('sales:printInvoice');
      expect(registeredHandlers).toContain('sales:holdBill');
      expect(registeredHandlers).toContain('sales:recallBill');
      
      // Items handlers
      expect(registeredHandlers).toContain('items:search');
      expect(registeredHandlers).toContain('items:create');
      expect(registeredHandlers).toContain('items:findByBarcode');
      
      // Customers handlers
      expect(registeredHandlers).toContain('customers:create');
      expect(registeredHandlers).toContain('customers:search');
      
      // Auth handlers
      expect(registeredHandlers).toContain('auth:login');
      expect(registeredHandlers).toContain('auth:logout');
      expect(registeredHandlers).toContain('auth:validateSession');
      
      // Reports handlers
      expect(registeredHandlers).toContain('reports:getSalesSummary');
      expect(registeredHandlers).toContain('reports:getTopItems');
      
      // System handlers
      expect(registeredHandlers).toContain('system:info');
      expect(registeredHandlers).toContain('system:memoryUsage');
      
      // Printer handlers
      expect(registeredHandlers).toContain('printer:printReceipt');
      expect(registeredHandlers).toContain('printer:getAvailablePrinters');
      
      // Encryption handlers
      expect(registeredHandlers).toContain('encryption:encrypt');
      expect(registeredHandlers).toContain('encryption:decrypt');
      expect(registeredHandlers).toContain('encryption:hashPassword');
    });
  });
});