import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App control
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  quit: () => ipcRenderer.invoke('app:quit'),
  
  // Window control
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Items API
  findItemByBarcode: (barcode: string) => ipcRenderer.invoke('items:findByBarcode', barcode),
  findItemById: (id: number) => ipcRenderer.invoke('items:findById', id),
  searchItems: (searchTerm: string) => ipcRenderer.invoke('items:search', searchTerm),
  getItemsByCategory: (category: string) => ipcRenderer.invoke('items:getByCategory', category),
  createItem: (itemData: any) => ipcRenderer.invoke('items:create', itemData),
  updateItem: (id: number, itemData: any) => ipcRenderer.invoke('items:update', id, itemData),
  deleteItem: (id: number) => ipcRenderer.invoke('items:delete', id),
  updateItemStock: (id: number, quantity: number) => ipcRenderer.invoke('items:updateStock', id, quantity),
  getLowStockItems: () => ipcRenderer.invoke('items:getLowStock'),
  getOutOfStockItems: () => ipcRenderer.invoke('items:getOutOfStock'),
  getCategories: () => ipcRenderer.invoke('items:getCategories'),
  getSubCategories: (category: string) => ipcRenderer.invoke('items:getSubCategories', category),
  importItemsFromCSV: (csvPath: string) => ipcRenderer.invoke('items:importFromCSV', csvPath),
  exportItemsToCSV: (outputPath: string) => ipcRenderer.invoke('items:exportToCSV', outputPath),

  // Customers API
  findCustomerByMobile: (mobile: string) => ipcRenderer.invoke('customers:findByMobile', mobile),
  findCustomerById: (id: number) => ipcRenderer.invoke('customers:findById', id),
  searchCustomers: (searchTerm: string) => ipcRenderer.invoke('customers:search', searchTerm),
  createCustomer: (customerData: any) => ipcRenderer.invoke('customers:create', customerData),
  updateCustomer: (id: number, customerData: any) => ipcRenderer.invoke('customers:update', id, customerData),
  deleteCustomer: (id: number) => ipcRenderer.invoke('customers:delete', id),
  updateCustomerBalance: (id: number, amount: number) => ipcRenderer.invoke('customers:updateBalance', id, amount),
  updateCustomerPoints: (id: number, points: number) => ipcRenderer.invoke('customers:updatePoints', id, points),
  getCustomerWithChildren: (id: number) => ipcRenderer.invoke('customers:getWithChildren', id),
  getCustomerPurchaseHistory: (id: number, limit?: number) => ipcRenderer.invoke('customers:getPurchaseHistory', id, limit),
  getCustomerStatistics: (id: number) => ipcRenderer.invoke('customers:getStatistics', id),
  getAllCustomers: (limit?: number, offset?: number) => ipcRenderer.invoke('customers:getAll', limit, offset),
  importCustomersFromCSV: (csvPath: string) => ipcRenderer.invoke('customers:importFromCSV', csvPath),
  exportCustomersToCSV: (outputPath: string) => ipcRenderer.invoke('customers:exportToCSV', outputPath),

  // Sales API
  createSale: (saleData: any) => ipcRenderer.invoke('sales:create', saleData),
  saveSale: (saleData: any) => ipcRenderer.invoke('sales:save', saleData),
  getSaleById: (id: number) => ipcRenderer.invoke('sales:getById', id),
  getSalesByDate: (date: string) => ipcRenderer.invoke('sales:getByDate', date),
  getAllSales: (limit?: number, offset?: number) => ipcRenderer.invoke('sales:getAll', limit, offset),
  getDailySummary: (date: string) => ipcRenderer.invoke('sales:getDailySummary', date),
  calculateGST: (amount: number, rate: number, inclusive?: boolean) => 
    ipcRenderer.invoke('sales:calculateGST', amount, rate, inclusive),
  roundOff: (amount: number) => ipcRenderer.invoke('sales:roundOff', amount),
  printInvoice: (invoiceNumber: string) => ipcRenderer.invoke('sales:printInvoice', invoiceNumber),
  holdBill: (billData: any) => ipcRenderer.invoke('sales:holdBill', billData),
  recallBill: (holdId: string) => ipcRenderer.invoke('sales:recallBill', holdId),
  getHeldBills: () => ipcRenderer.invoke('sales:getHeldBills'),
  deleteHeldBill: (holdId: string) => ipcRenderer.invoke('sales:deleteHeldBill', holdId),

  // Reports API
  getSalesSummary: (startDate: string, endDate: string) => 
    ipcRenderer.invoke('reports:getSalesSummary', startDate, endDate),
  getTopItems: (startDate: string, endDate: string) => 
    ipcRenderer.invoke('reports:getTopItems', startDate, endDate),
  getCustomerAnalysis: (startDate: string, endDate: string) => 
    ipcRenderer.invoke('reports:getCustomerAnalysis', startDate, endDate),
  getGSTReport: (startDate: string, endDate: string) => 
    ipcRenderer.invoke('reports:getGSTReport', startDate, endDate),

  // Database API
  executeQuery: (query: string, params?: any[]) => ipcRenderer.invoke('database:executeQuery', query, params),
  executeTransaction: (queries: Array<{ query: string; params?: any[] }>) => 
    ipcRenderer.invoke('database:executeTransaction', queries),

  // Backup API
  createBackup: () => ipcRenderer.invoke('backup:create'),
  restoreFromBackup: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath),
  getBackupList: () => ipcRenderer.invoke('backup:list'),
  scheduleBackups: () => ipcRenderer.invoke('backup:schedule'),

  // File operations
  selectFile: (filters: any) => ipcRenderer.invoke('file:select', filters),
  saveFile: (data: any, filename: string) => ipcRenderer.invoke('file:save', data, filename),
  openFile: (filePath: string) => ipcRenderer.invoke('file:open', filePath),

  // System info
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  getDiskSpace: () => ipcRenderer.invoke('system:diskSpace'),
  getMemoryUsage: () => ipcRenderer.invoke('system:memoryUsage'),

  // Event listeners
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu:action', (event, action) => callback(action));
  },
  onBarcodeScanned: (callback: (barcode: string) => void) => {
    ipcRenderer.on('barcode:scanned', (event, barcode) => callback(barcode));
  },
  onDatabaseError: (callback: (error: string) => void) => {
    ipcRenderer.on('database:error', (event, error) => callback(error));
  },
  onBackupComplete: (callback: (success: boolean, message: string) => void) => {
    ipcRenderer.on('backup:complete', (event, success, message) => callback(success, message));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  removeListener: (channel: string, callback: Function) => ipcRenderer.removeListener(channel, callback),

  // Error logging
  logError: (errorData: any) => ipcRenderer.invoke('system:logError', errorData),

  // Authentication API
  login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
  logout: (sessionToken: string) => ipcRenderer.invoke('auth:logout', sessionToken),
  validateSession: (sessionToken: string) => ipcRenderer.invoke('auth:validateSession', sessionToken),
  createUser: (userData: any) => ipcRenderer.invoke('auth:createUser', userData),
  updateUser: (userId: number, updates: any) => ipcRenderer.invoke('auth:updateUser', userId, updates),
  changePassword: (userId: number, currentPassword: string, newPassword: string) => 
    ipcRenderer.invoke('auth:changePassword', userId, currentPassword, newPassword),
  getAllUsers: () => ipcRenderer.invoke('auth:getAllUsers'),
  getUserById: (userId: number) => ipcRenderer.invoke('auth:getUserById', userId),
  deleteUser: (userId: number) => ipcRenderer.invoke('auth:deleteUser', userId),
  getAuditLogs: (limit?: number, offset?: number) => ipcRenderer.invoke('auth:getAuditLogs', limit, offset),

  // Printer API
  printReceipt: (receiptData: any, config?: any) => ipcRenderer.invoke('printer:printReceipt', receiptData, config),
  printInvoice: (invoiceData: any, config?: any) => ipcRenderer.invoke('printer:printInvoice', invoiceData, config),
  getAvailablePrinters: () => ipcRenderer.invoke('printer:getAvailablePrinters'),
  testPrint: (printerName: string) => ipcRenderer.invoke('printer:testPrint', printerName),

  // Encryption API
  encrypt: (text: string, password?: string) => ipcRenderer.invoke('encryption:encrypt', text, password),
  decrypt: (encryptedData: string, password?: string) => ipcRenderer.invoke('encryption:decrypt', encryptedData, password),
  encryptField: (value: string, fieldName: string) => ipcRenderer.invoke('encryption:encryptField', value, fieldName),
  decryptField: (encryptedValue: string, fieldName: string) => ipcRenderer.invoke('encryption:decryptField', encryptedValue, fieldName),
  hashPassword: (password: string) => ipcRenderer.invoke('encryption:hashPassword', password),
  verifyPassword: (password: string, hashedPassword: string) => ipcRenderer.invoke('encryption:verifyPassword', password, hashedPassword),
  generateToken: (length?: number) => ipcRenderer.invoke('encryption:generateToken', length),
  generateId: () => ipcRenderer.invoke('encryption:generateId'),
  encryptFile: (filePath: string, outputPath: string, password?: string) => ipcRenderer.invoke('encryption:encryptFile', filePath, outputPath, password),
  decryptFile: (filePath: string, outputPath: string, password?: string) => ipcRenderer.invoke('encryption:decryptFile', filePath, outputPath, password),
  getEncryptionStatus: () => ipcRenderer.invoke('encryption:getStatus'),
  rotateKey: (newPassword?: string) => ipcRenderer.invoke('encryption:rotateKey', newPassword),

  // Returns API
  createReturn: (returnData: any) => ipcRenderer.invoke('returns:create', returnData),
  getReturnById: (returnId: number) => ipcRenderer.invoke('returns:getById', returnId),
  getReturnsByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('returns:getByDateRange', startDate, endDate),
  getAllReturns: (limit?: number, offset?: number) => ipcRenderer.invoke('returns:getAll', limit, offset),
  getReturnStatistics: (startDate: string, endDate: string) => ipcRenderer.invoke('returns:getStatistics', startDate, endDate),
  getOriginalSale: (saleId: number) => ipcRenderer.invoke('returns:getOriginalSale', saleId),
  updateReturnStatus: (returnId: number, status: string) => ipcRenderer.invoke('returns:updateStatus', returnId, status),
  deleteReturn: (returnId: number) => ipcRenderer.invoke('returns:delete', returnId),
  getReturnItems: (returnId: number) => ipcRenderer.invoke('returns:getItems', returnId),

  // Export API
  exportItems: (options: any) => ipcRenderer.invoke('export:items', options),
  exportCustomers: (options: any) => ipcRenderer.invoke('export:customers', options),
  exportSales: (options: any) => ipcRenderer.invoke('export:sales', options),
  exportReturns: (options: any) => ipcRenderer.invoke('export:returns', options),
  exportReports: (reportType: string, reportData: any[], options: any) => 
    ipcRenderer.invoke('export:reports', reportType, reportData, options),
  exportSalesSummary: (startDate: string, endDate: string, options: any) => 
    ipcRenderer.invoke('export:salesSummary', startDate, endDate, options),
  exportGSTReport: (startDate: string, endDate: string, options: any) => 
    ipcRenderer.invoke('export:gstReport', startDate, endDate, options),
  exportInventoryReport: (options: any) => ipcRenderer.invoke('export:inventoryReport', options),
  getExportHistory: () => ipcRenderer.invoke('export:getHistory'),
  deleteExportFile: (filename: string) => ipcRenderer.invoke('export:deleteFile', filename),
  cleanupExports: (daysOld?: number) => ipcRenderer.invoke('export:cleanup', daysOld),

  // Suppliers API
  getAllSuppliers: (page?: number, pageSize?: number, searchTerm?: string) => 
    ipcRenderer.invoke('suppliers:getAll', page, pageSize, searchTerm),
  getSupplierById: (id: number) => ipcRenderer.invoke('suppliers:getById', id),
  createSupplier: (supplierData: any) => ipcRenderer.invoke('suppliers:create', supplierData),
  updateSupplier: (id: number, supplierData: any) => ipcRenderer.invoke('suppliers:update', id, supplierData),
  deleteSupplier: (id: number) => ipcRenderer.invoke('suppliers:delete', id),
  getSupplierBalance: (supplierId: number) => ipcRenderer.invoke('suppliers:getBalance', supplierId),
  getSuppliersForSelection: () => ipcRenderer.invoke('suppliers:getForSelection'),

  // Purchase Orders API
  getAllPurchaseOrders: (page?: number, pageSize?: number, searchTerm?: string, status?: string) => 
    ipcRenderer.invoke('purchase-orders:getAll', page, pageSize, searchTerm, status),
  getPurchaseOrderById: (id: number) => ipcRenderer.invoke('purchase-orders:getById', id),
  createPurchaseOrder: (poData: any) => ipcRenderer.invoke('purchase-orders:create', poData),
  updatePurchaseOrder: (id: number, poData: any) => ipcRenderer.invoke('purchase-orders:update', id, poData),
  approvePurchaseOrder: (id: number) => ipcRenderer.invoke('purchase-orders:approve', id),
  cancelPurchaseOrder: (id: number) => ipcRenderer.invoke('purchase-orders:cancel', id),
  deletePurchaseOrder: (id: number) => ipcRenderer.invoke('purchase-orders:delete', id),

  // Purchase Receipts API
  getAllPurchaseReceipts: (page?: number, pageSize?: number, searchTerm?: string, status?: string) => 
    ipcRenderer.invoke('purchase-receipts:getAll', page, pageSize, searchTerm, status),
  getPurchaseReceiptById: (id: number) => ipcRenderer.invoke('purchase-receipts:getById', id),
  createPurchaseReceipt: (receiptData: any) => ipcRenderer.invoke('purchase-receipts:create', receiptData),
  verifyPurchaseReceipt: (id: number) => ipcRenderer.invoke('purchase-receipts:verify', id),
  rejectPurchaseReceipt: (id: number, reason: string) => ipcRenderer.invoke('purchase-receipts:reject', id, reason),
  getPurchaseReceiptsBySupplier: (supplierId: number, page?: number, pageSize?: number) => 
    ipcRenderer.invoke('purchase-receipts:getBySupplier', supplierId, page, pageSize),

  // Supplier Payments API
  getAllSupplierPayments: (page?: number, pageSize?: number, searchTerm?: string) => 
    ipcRenderer.invoke('supplier-payments:getAll', page, pageSize, searchTerm),
  getSupplierPaymentById: (id: number) => ipcRenderer.invoke('supplier-payments:getById', id),
  createSupplierPayment: (paymentData: any) => ipcRenderer.invoke('supplier-payments:create', paymentData),
  getSupplierPaymentsBySupplier: (supplierId: number, page?: number, pageSize?: number) => 
    ipcRenderer.invoke('supplier-payments:getBySupplier', supplierId, page, pageSize),
  getSupplierOutstandingBalance: (supplierId: number) => ipcRenderer.invoke('supplier-payments:getOutstandingBalance', supplierId),
  getSupplierPaymentSummary: (startDate: string, endDate: string) => 
    ipcRenderer.invoke('supplier-payments:getSummary', startDate, endDate),
  deleteSupplierPayment: (id: number) => ipcRenderer.invoke('supplier-payments:delete', id),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // App control
      getVersion: () => Promise<string>;
      quit: () => Promise<void>;
      
      // Window control
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;

      // Items API
      findItemByBarcode: (barcode: string) => Promise<any>;
      findItemById: (id: number) => Promise<any>;
      searchItems: (searchTerm: string) => Promise<any>;
      getItemsByCategory: (category: string) => Promise<any>;
      createItem: (itemData: any) => Promise<any>;
      updateItem: (id: number, itemData: any) => Promise<any>;
      deleteItem: (id: number) => Promise<any>;
      updateItemStock: (id: number, quantity: number) => Promise<any>;
      getLowStockItems: () => Promise<any>;
      getOutOfStockItems: () => Promise<any>;
      getCategories: () => Promise<any>;
      getSubCategories: (category: string) => Promise<any>;
      importItemsFromCSV: (csvPath: string) => Promise<any>;
      exportItemsToCSV: (outputPath: string) => Promise<any>;

      // Customers API
      findCustomerByMobile: (mobile: string) => Promise<any>;
      findCustomerById: (id: number) => Promise<any>;
      searchCustomers: (searchTerm: string) => Promise<any>;
      createCustomer: (customerData: any) => Promise<any>;
      updateCustomer: (id: number, customerData: any) => Promise<any>;
      deleteCustomer: (id: number) => Promise<any>;
      updateCustomerBalance: (id: number, amount: number) => Promise<any>;
      updateCustomerPoints: (id: number, points: number) => Promise<any>;
      getCustomerWithChildren: (id: number) => Promise<any>;
      getCustomerPurchaseHistory: (id: number, limit?: number) => Promise<any>;
      getCustomerStatistics: (id: number) => Promise<any>;
      getAllCustomers: (limit?: number, offset?: number) => Promise<any>;
      importCustomersFromCSV: (csvPath: string) => Promise<any>;
      exportCustomersToCSV: (outputPath: string) => Promise<any>;

      // Sales API
      createSale: (saleData: any) => Promise<any>;
      saveSale: (saleData: any) => Promise<any>;
      getSaleById: (id: number) => Promise<any>;
      getSalesByDate: (date: string) => Promise<any>;
      getAllSales: (limit?: number, offset?: number) => Promise<any>;
      getDailySummary: (date: string) => Promise<any>;
      calculateGST: (amount: number, rate: number, inclusive?: boolean) => Promise<any>;
      roundOff: (amount: number) => Promise<any>;
      printInvoice: (invoiceNumber: string) => Promise<any>;
      holdBill: (billData: any) => Promise<any>;
      recallBill: (holdId: string) => Promise<any>;

      // Reports API
      getSalesSummary: (startDate: string, endDate: string) => Promise<any>;
      getTopItems: (startDate: string, endDate: string) => Promise<any>;
      getCustomerAnalysis: (startDate: string, endDate: string) => Promise<any>;
      getGSTReport: (startDate: string, endDate: string) => Promise<any>;

      // Database API
      executeQuery: (query: string, params?: any[]) => Promise<any>;
      executeTransaction: (queries: Array<{ query: string; params?: any[] }>) => Promise<any>;

      // Backup API
      createBackup: () => Promise<any>;
      restoreFromBackup: (backupPath: string) => Promise<any>;
      getBackupList: () => Promise<any>;
      scheduleBackups: () => Promise<any>;

      // File operations
      selectFile: (filters: any) => Promise<any>;
      saveFile: (data: any, filename: string) => Promise<any>;
      openFile: (filePath: string) => Promise<any>;

      // System info
      getSystemInfo: () => Promise<any>;
      getDiskSpace: () => Promise<any>;
      getMemoryUsage: () => Promise<any>;

      // Event listeners
      onMenuAction: (callback: (action: string) => void) => void;
      onBarcodeScanned: (callback: (barcode: string) => void) => void;
      onDatabaseError: (callback: (error: string) => void) => void;
      onBackupComplete: (callback: (success: boolean, message: string) => void) => void;

      // Remove listeners
      removeAllListeners: (channel: string) => void;
      removeListener: (channel: string, callback: Function) => void;

      // Suppliers API
      getAllSuppliers: (page?: number, pageSize?: number, searchTerm?: string) => Promise<any>;
      getSupplierById: (id: number) => Promise<any>;
      createSupplier: (supplierData: any) => Promise<any>;
      updateSupplier: (id: number, supplierData: any) => Promise<any>;
      deleteSupplier: (id: number) => Promise<any>;
      getSupplierBalance: (supplierId: number) => Promise<any>;
      getSuppliersForSelection: () => Promise<any>;

      // Purchase Orders API
      getAllPurchaseOrders: (page?: number, pageSize?: number, searchTerm?: string, status?: string) => Promise<any>;
      getPurchaseOrderById: (id: number) => Promise<any>;
      createPurchaseOrder: (poData: any) => Promise<any>;
      updatePurchaseOrder: (id: number, poData: any) => Promise<any>;
      approvePurchaseOrder: (id: number) => Promise<any>;
      cancelPurchaseOrder: (id: number) => Promise<any>;
      deletePurchaseOrder: (id: number) => Promise<any>;

      // Purchase Receipts API
      getAllPurchaseReceipts: (page?: number, pageSize?: number, searchTerm?: string, status?: string) => Promise<any>;
      getPurchaseReceiptById: (id: number) => Promise<any>;
      createPurchaseReceipt: (receiptData: any) => Promise<any>;
      verifyPurchaseReceipt: (id: number) => Promise<any>;
      rejectPurchaseReceipt: (id: number, reason: string) => Promise<any>;
      getPurchaseReceiptsBySupplier: (supplierId: number, page?: number, pageSize?: number) => Promise<any>;

      // Supplier Payments API
      getAllSupplierPayments: (page?: number, pageSize?: number, searchTerm?: string) => Promise<any>;
      getSupplierPaymentById: (id: number) => Promise<any>;
      createSupplierPayment: (paymentData: any) => Promise<any>;
      getSupplierPaymentsBySupplier: (supplierId: number, page?: number, pageSize?: number) => Promise<any>;
      getSupplierOutstandingBalance: (supplierId: number) => Promise<any>;
      getSupplierPaymentSummary: (startDate: string, endDate: string) => Promise<any>;
      deleteSupplierPayment: (id: number) => Promise<any>;
    };
  }
}