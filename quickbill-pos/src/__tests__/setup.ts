// Test setup file
import 'jest';

// Mock Electron APIs for testing
global.window = {
  electronAPI: {
    // Mock all the electron API methods
    getVersion: jest.fn(() => Promise.resolve('1.0.0')),
    quit: jest.fn(() => Promise.resolve()),
    minimize: jest.fn(() => Promise.resolve()),
    maximize: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    
    // Items API
    findItemByBarcode: jest.fn(() => Promise.resolve({ success: true, data: null })),
    findItemById: jest.fn(() => Promise.resolve({ success: true, data: null })),
    searchItems: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getItemsByCategory: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    createItem: jest.fn(() => Promise.resolve({ success: true, data: { id: 1 } })),
    updateItem: jest.fn(() => Promise.resolve({ success: true })),
    deleteItem: jest.fn(() => Promise.resolve({ success: true })),
    updateItemStock: jest.fn(() => Promise.resolve({ success: true })),
    getLowStockItems: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getOutOfStockItems: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getCategories: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getSubCategories: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    importItemsFromCSV: jest.fn(() => Promise.resolve({ success: true })),
    exportItemsToCSV: jest.fn(() => Promise.resolve({ success: true })),
    
    // Customers API
    findCustomerByMobile: jest.fn(() => Promise.resolve({ success: true, data: null })),
    findCustomerById: jest.fn(() => Promise.resolve({ success: true, data: null })),
    searchCustomers: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    createCustomer: jest.fn(() => Promise.resolve({ success: true, data: { id: 1 } })),
    updateCustomer: jest.fn(() => Promise.resolve({ success: true })),
    deleteCustomer: jest.fn(() => Promise.resolve({ success: true })),
    updateCustomerBalance: jest.fn(() => Promise.resolve({ success: true })),
    updateCustomerPoints: jest.fn(() => Promise.resolve({ success: true })),
    getCustomerWithChildren: jest.fn(() => Promise.resolve({ success: true, data: null })),
    getCustomerPurchaseHistory: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getCustomerStatistics: jest.fn(() => Promise.resolve({ success: true, data: null })),
    getAllCustomers: jest.fn(() => Promise.resolve({ success: true, data: { customers: [], total: 0 } })),
    importCustomersFromCSV: jest.fn(() => Promise.resolve({ success: true })),
    exportCustomersToCSV: jest.fn(() => Promise.resolve({ success: true })),
    
    // Sales API
    createSale: jest.fn(() => Promise.resolve({ success: true, data: { id: 1, invoiceNumber: 'INV-001' } })),
    saveSale: jest.fn(() => Promise.resolve({ success: true, data: { id: 1, invoiceNumber: 'INV-001' } })),
    getSaleById: jest.fn(() => Promise.resolve({ success: true, data: null })),
    getSalesByDate: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getAllSales: jest.fn(() => Promise.resolve({ success: true, data: { sales: [], total: 0 } })),
    getDailySummary: jest.fn(() => Promise.resolve({ success: true, data: null })),
    calculateGST: jest.fn(() => Promise.resolve({ success: true, data: { baseAmount: 100, cgst: 9, sgst: 9, igst: 0, total: 118 } })),
    roundOff: jest.fn(() => Promise.resolve({ success: true, data: 100 })),
    printInvoice: jest.fn(() => Promise.resolve({ success: true })),
    holdBill: jest.fn(() => Promise.resolve({ success: true, data: { id: 'hold_1' } })),
    recallBill: jest.fn(() => Promise.resolve({ success: true, data: null })),
    
    // Reports API
    getSalesSummary: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getTopItems: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getCustomerAnalysis: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getGSTReport: jest.fn(() => Promise.resolve({ success: true, data: null })),
    
    // Database API
    executeQuery: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    executeTransaction: jest.fn(() => Promise.resolve({ success: true })),
    
    // Backup API
    createBackup: jest.fn(() => Promise.resolve({ success: true })),
    restoreFromBackup: jest.fn(() => Promise.resolve({ success: true })),
    getBackupList: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    scheduleBackups: jest.fn(() => Promise.resolve({ success: true })),
    
    // File operations
    selectFile: jest.fn(() => Promise.resolve({ success: true, data: null })),
    saveFile: jest.fn(() => Promise.resolve({ success: true })),
    openFile: jest.fn(() => Promise.resolve({ success: true })),
    
    // System info
    getSystemInfo: jest.fn(() => Promise.resolve({ success: true, data: {} })),
    getDiskSpace: jest.fn(() => Promise.resolve({ success: true, data: {} })),
    getMemoryUsage: jest.fn(() => Promise.resolve({ success: true, data: {} })),
    
    // Event listeners
    onMenuAction: jest.fn(),
    onBarcodeScanned: jest.fn(),
    onDatabaseError: jest.fn(),
    onBackupComplete: jest.fn(),
    removeAllListeners: jest.fn(),
    removeListener: jest.fn()
  }
} as any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};