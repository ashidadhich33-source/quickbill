import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { DatabaseManager } from './database/connection';
import { setupSalesHandlers } from './ipc/sales.handler';
import { setupItemsHandlers } from './ipc/items.handler';
import { setupCustomersHandlers } from './ipc/customers.handler';
import { setupReportsHandlers } from './ipc/reports.handler';
import { setupSystemHandlers } from './ipc/system.handler';
import { setupFileHandlers } from './ipc/file.handler';
import { setupAuthHandlers } from './ipc/auth.handler';
import { setupPrinterHandlers } from './ipc/printer.handler';
import { setupEncryptionHandlers } from './ipc/encryption.handler';
import { setupReturnsHandlers } from './ipc/returns.handler';
import { setupExportHandlers } from './ipc/export.handler';

class QuickBillApp {
  private mainWindow: BrowserWindow | null = null;
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = new DatabaseManager();
  }

  async initialize(): Promise<void> {
    // Initialize database
    this.dbManager.connect();
    this.dbManager.prepareStatements();

    // Setup IPC handlers
    this.setupIpcHandlers();
    
    // Setup additional handlers
    setupAuthHandlers(this.dbManager);
    setupReportsHandlers(this.dbManager);
    setupReturnsHandlers(this.dbManager);
    setupExportHandlers(this.dbManager);
    setupSystemHandlers();
    setupFileHandlers();
    setupEncryptionHandlers();

    // Create main window
    await this.createMainWindow();

    // Setup printer handlers after main window is created
    if (this.mainWindow) {
      setupPrinterHandlers(this.mainWindow);
    }

    // Setup application menu
    this.setupMenu();
  }

  private async createMainWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../preload/index.js')
      },
      icon: path.join(__dirname, '../../resources/icon.png'),
      titleBarStyle: 'default',
      show: false
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIpcHandlers(): void {
    setupSalesHandlers(this.dbManager);
    setupItemsHandlers(this.dbManager);
    setupCustomersHandlers(this.dbManager);

    // App control handlers
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:quit', () => {
      app.quit();
    });

    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Sale',
            accelerator: 'F2',
            click: () => {
              this.mainWindow?.webContents.send('menu:newSale');
            }
          },
          {
            label: 'Search Item',
            accelerator: 'F3',
            click: () => {
              this.mainWindow?.webContents.send('menu:searchItem');
            }
          },
          { type: 'separator' },
          {
            label: 'Print',
            accelerator: 'CmdOrCtrl+P',
            click: () => {
              this.mainWindow?.webContents.send('menu:print');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Keyboard Shortcuts',
            click: () => {
              this.mainWindow?.webContents.send('menu:showShortcuts');
            }
          },
          {
            label: 'About QuickBill POS',
            click: () => {
              this.mainWindow?.webContents.send('menu:showAbout');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// App event handlers
app.whenReady().then(async () => {
  const quickBillApp = new QuickBillApp();
  await quickBillApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const quickBillApp = new QuickBillApp();
    await quickBillApp.initialize();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});