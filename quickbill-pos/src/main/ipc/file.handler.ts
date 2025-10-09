import { ipcMain, dialog, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export function setupFileHandlers(): void {
  // Select file
  ipcMain.handle('file:select', async (event, filters) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: filters || [
          { name: 'All Files', extensions: ['*'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'Text Files', extensions: ['txt'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, data: result.filePaths[0] };
      } else {
        return { success: false, error: 'No file selected' };
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      return { success: false, error: error.message };
    }
  });

  // Select multiple files
  ipcMain.handle('file:selectMultiple', async (event, filters) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: filters || [
          { name: 'All Files', extensions: ['*'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, data: result.filePaths };
      } else {
        return { success: false, error: 'No files selected' };
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      return { success: false, error: error.message };
    }
  });

  // Save file
  ipcMain.handle('file:save', async (event, data, filename) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data);
        return { success: true, data: result.filePath };
      } else {
        return { success: false, error: 'Save cancelled' };
      }
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: error.message };
    }
  });

  // Open file
  ipcMain.handle('file:open', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return { success: true, data };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      console.error('Error opening file:', error);
      return { success: false, error: error.message };
    }
  });

  // Read file as buffer
  ipcMain.handle('file:readBuffer', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        return { success: true, data: buffer };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      console.error('Error reading file buffer:', error);
      return { success: false, error: error.message };
    }
  });

  // Write file
  ipcMain.handle('file:write', async (event, filePath, data) => {
    try {
      fs.writeFileSync(filePath, data);
      return { success: true };
    } catch (error) {
      console.error('Error writing file:', error);
      return { success: false, error: error.message };
    }
  });

  // Check if file exists
  ipcMain.handle('file:exists', async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      return { success: true, data: exists };
    } catch (error) {
      console.error('Error checking file existence:', error);
      return { success: false, error: error.message };
    }
  });

  // Get file stats
  ipcMain.handle('file:stats', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          success: true,
          data: {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime
          }
        };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      console.error('Error getting file stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Create directory
  ipcMain.handle('file:createDirectory', async (event, dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return { success: true };
    } catch (error) {
      console.error('Error creating directory:', error);
      return { success: false, error: error.message };
    }
  });

  // List directory contents
  ipcMain.handle('file:listDirectory', async (event, dirPath) => {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const fileList = files.map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime
          };
        });
        return { success: true, data: fileList };
      } else {
        return { success: false, error: 'Directory not found' };
      }
    } catch (error) {
      console.error('Error listing directory:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete file
  ipcMain.handle('file:delete', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        return { success: true };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  });

  // Copy file
  ipcMain.handle('file:copy', async (event, sourcePath, destPath) => {
    try {
      fs.copyFileSync(sourcePath, destPath);
      return { success: true };
    } catch (error) {
      console.error('Error copying file:', error);
      return { success: false, error: error.message };
    }
  });

  // Move file
  ipcMain.handle('file:move', async (event, sourcePath, destPath) => {
    try {
      fs.renameSync(sourcePath, destPath);
      return { success: true };
    } catch (error) {
      console.error('Error moving file:', error);
      return { success: false, error: error.message };
    }
  });

  // Show file in explorer/finder
  ipcMain.handle('file:showInFolder', async (event, filePath) => {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error showing file in folder:', error);
      return { success: false, error: error.message };
    }
  });

  // Open file with default application
  ipcMain.handle('file:openWithDefault', async (event, filePath) => {
    try {
      shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error opening file with default app:', error);
      return { success: false, error: error.message };
    }
  });

  // Get file extension
  ipcMain.handle('file:getExtension', async (event, filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      return { success: true, data: ext };
    } catch (error) {
      console.error('Error getting file extension:', error);
      return { success: false, error: error.message };
    }
  });

  // Get file name without extension
  ipcMain.handle('file:getNameWithoutExtension', async (event, filePath) => {
    try {
      const name = path.basename(filePath, path.extname(filePath));
      return { success: true, data: name };
    } catch (error) {
      console.error('Error getting file name without extension:', error);
      return { success: false, error: error.message };
    }
  });
}