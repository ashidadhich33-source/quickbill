import { ipcMain, app, systemPreferences } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export function setupSystemHandlers(): void {
  // Get system information
  ipcMain.handle('system:info', async () => {
    try {
      const info = {
        platform: os.platform(),
        arch: os.arch(),
        version: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        uptime: os.uptime(),
        hostname: os.hostname(),
        userInfo: os.userInfo(),
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome
      };
      
      return { success: true, data: info };
    } catch (error) {
      console.error('Error getting system info:', error);
      return { success: false, error: error.message };
    }
  });

  // Get disk space
  ipcMain.handle('system:diskSpace', async () => {
    try {
      const drives: any[] = [];
      
      if (os.platform() === 'win32') {
        // Windows - get all drives
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
          const lines = stdout.split('\n').filter(line => line.trim());
          
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 3) {
              const caption = parts[0];
              const freeSpace = parseInt(parts[1]) || 0;
              const totalSpace = parseInt(parts[2]) || 0;
              
              drives.push({
                drive: caption,
                free: freeSpace,
                total: totalSpace,
                used: totalSpace - freeSpace
              });
            }
          }
        } catch (err) {
          // Fallback for Windows
          drives.push({
            drive: 'C:',
            free: 0,
            total: 0,
            used: 0
          });
        }
      } else {
        // Unix-like systems
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          const { stdout } = await execAsync('df -h');
          const lines = stdout.split('\n').slice(1);
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
              const filesystem = parts[0];
              const total = parts[1];
              const used = parts[2];
              const available = parts[3];
              const mountpoint = parts[5] || '/';
              
              drives.push({
                drive: mountpoint,
                filesystem,
                total,
                used,
                free: available
              });
            }
          }
        } catch (err) {
          // Fallback
          drives.push({
            drive: '/',
            free: '0',
            total: '0',
            used: '0'
          });
        }
      }
      
      return { success: true, data: drives };
    } catch (error) {
      console.error('Error getting disk space:', error);
      return { success: false, error: error.message };
    }
  });

  // Get memory usage
  ipcMain.handle('system:memoryUsage', async () => {
    try {
      const usage = process.memoryUsage();
      const systemMemory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      };
      
      const memoryInfo = {
        process: {
          rss: usage.rss,
          heapTotal: usage.heapTotal,
          heapUsed: usage.heapUsed,
          external: usage.external,
          arrayBuffers: usage.arrayBuffers
        },
        system: systemMemory,
        percentage: {
          process: (usage.rss / os.totalmem()) * 100,
          system: (systemMemory.used / systemMemory.total) * 100
        }
      };
      
      return { success: true, data: memoryInfo };
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return { success: false, error: error.message };
    }
  });

  // Get CPU usage
  ipcMain.handle('system:cpuUsage', async () => {
    try {
      const cpus = os.cpus();
      const cpuInfo = {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0,
        usage: cpus.map(cpu => ({
          user: cpu.times.user,
          nice: cpu.times.nice,
          sys: cpu.times.sys,
          idle: cpu.times.idle,
          irq: cpu.times.irq
        }))
      };
      
      return { success: true, data: cpuInfo };
    } catch (error) {
      console.error('Error getting CPU usage:', error);
      return { success: false, error: error.message };
    }
  });

  // Get network interfaces
  ipcMain.handle('system:networkInterfaces', async () => {
    try {
      const interfaces = os.networkInterfaces() as Record<string, any[] | undefined>;
      const networkInfo: any[] = [];
      
      for (const [name, addresses] of Object.entries(interfaces)) {
        if (addresses) {
          for (const address of addresses) {
            networkInfo.push({
              name,
              address: address.address,
              family: address.family,
              internal: address.internal,
              mac: address.mac
            });
          }
        }
      }
      
      return { success: true, data: networkInfo };
    } catch (error) {
      console.error('Error getting network interfaces:', error);
      return { success: false, error: error.message };
    }
  });

  // Get app data directory size
  ipcMain.handle('system:appDataSize', async () => {
    try {
      const appDataPath = app.getPath('userData');
      const size = await getDirectorySize(appDataPath);
      
      return { success: true, data: { path: appDataPath, size } };
    } catch (error) {
      console.error('Error getting app data size:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear app data
  ipcMain.handle('system:clearAppData', async () => {
    try {
      const appDataPath = app.getPath('userData');
      const files = fs.readdirSync(appDataPath);
      
      for (const file of files) {
        const filePath = path.join(appDataPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
      
      return { success: true, message: 'App data cleared successfully' };
    } catch (error) {
      console.error('Error clearing app data:', error);
      return { success: false, error: error.message };
    }
  });

  // Get system preferences
  ipcMain.handle('system:getPreferences', async () => {
    try {
      const preferences = {
        darkMode: systemPreferences.isDarkMode(),
        highContrast: systemPreferences.isHighContrast(),
        reducedMotion: systemPreferences.isInvertedColorScheme(),
        accentColor: systemPreferences.getAccentColor(),
        systemColor: systemPreferences.getSystemColor('window')
      };
      
      return { success: true, data: preferences };
    } catch (error) {
      console.error('Error getting system preferences:', error);
      return { success: false, error: error.message };
    }
  });

  // Log error
  ipcMain.handle('system:logError', async (event, errorData) => {
    try {
      const logPath = path.join(app.getPath('userData'), 'logs', 'error.log');
      const logDir = path.dirname(logPath);
      
      // Ensure log directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...errorData
      };
      
      // Append to error log file
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Client Error:', logEntry);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error logging client error:', error);
      return { success: false, error: error.message };
    }
  });
}

// Helper function to get directory size
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stat.size;
      }
    }
  } catch (error) {
    console.error('Error calculating directory size:', error);
  }
  
  return totalSize;
}