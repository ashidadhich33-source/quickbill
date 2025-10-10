import { ipcMain } from 'electron';
import { EncryptionService } from '../utils/encryption.service';

let encryptionService: EncryptionService | null = null;

export function setupEncryptionHandlers(): void {
  encryptionService = new EncryptionService();

  // Encrypt text
  ipcMain.handle('encryption:encrypt', async (event, text, password) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const encrypted = encryptionService.encrypt(text, password);
      return { success: true, data: encrypted };
    } catch (error) {
      console.error('Encrypt handler error:', error);
      return { success: false, error: 'Failed to encrypt data' };
    }
  });

  // Decrypt text
  ipcMain.handle('encryption:decrypt', async (event, encryptedData, password) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const decrypted = encryptionService.decrypt(encryptedData, password);
      return { success: true, data: decrypted };
    } catch (error) {
      console.error('Decrypt handler error:', error);
      return { success: false, error: 'Failed to decrypt data' };
    }
  });

  // Encrypt sensitive field
  ipcMain.handle('encryption:encryptField', async (event, value, fieldName) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const encrypted = encryptionService.encryptSensitiveField(value, fieldName);
      return { success: true, data: encrypted };
    } catch (error) {
      console.error('Encrypt field handler error:', error);
      return { success: false, error: 'Failed to encrypt field' };
    }
  });

  // Decrypt sensitive field
  ipcMain.handle('encryption:decryptField', async (event, encryptedValue, fieldName) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const decrypted = encryptionService.decryptSensitiveField(encryptedValue, fieldName);
      return { success: true, data: decrypted };
    } catch (error) {
      console.error('Decrypt field handler error:', error);
      return { success: false, error: 'Failed to decrypt field' };
    }
  });

  // Hash password
  ipcMain.handle('encryption:hashPassword', async (event, password) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const hashed = encryptionService.hashPassword(password);
      return { success: true, data: hashed };
    } catch (error) {
      console.error('Hash password handler error:', error);
      return { success: false, error: 'Failed to hash password' };
    }
  });

  // Verify password
  ipcMain.handle('encryption:verifyPassword', async (event, password, hashedPassword) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const isValid = encryptionService.verifyPassword(password, hashedPassword);
      return { success: true, data: isValid };
    } catch (error) {
      console.error('Verify password handler error:', error);
      return { success: false, error: 'Failed to verify password' };
    }
  });

  // Generate secure token
  ipcMain.handle('encryption:generateToken', async (event, length) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const token = encryptionService.generateSecureToken(length);
      return { success: true, data: token };
    } catch (error) {
      console.error('Generate token handler error:', error);
      return { success: false, error: 'Failed to generate token' };
    }
  });

  // Generate secure ID
  ipcMain.handle('encryption:generateId', async (event) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const id = encryptionService.generateSecureId();
      return { success: true, data: id };
    } catch (error) {
      console.error('Generate ID handler error:', error);
      return { success: false, error: 'Failed to generate ID' };
    }
  });

  // Encrypt file
  ipcMain.handle('encryption:encryptFile', async (event, filePath, outputPath, password) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      await encryptionService.encryptFile(filePath, outputPath, password);
      return { success: true };
    } catch (error) {
      console.error('Encrypt file handler error:', error);
      return { success: false, error: 'Failed to encrypt file' };
    }
  });

  // Decrypt file
  ipcMain.handle('encryption:decryptFile', async (event, filePath, outputPath, password) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      await encryptionService.decryptFile(filePath, outputPath, password);
      return { success: true };
    } catch (error) {
      console.error('Decrypt file handler error:', error);
      return { success: false, error: 'Failed to decrypt file' };
    }
  });

  // Get encryption status
  ipcMain.handle('encryption:getStatus', async (event) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      const status = encryptionService.getEncryptionStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('Get encryption status handler error:', error);
      return { success: false, error: 'Failed to get encryption status' };
    }
  });

  // Rotate encryption key
  ipcMain.handle('encryption:rotateKey', async (event, newPassword) => {
    try {
      if (!encryptionService) {
        return { success: false, error: 'Encryption service not initialized' };
      }

      await encryptionService.rotateKey(newPassword);
      return { success: true };
    } catch (error) {
      console.error('Rotate key handler error:', error);
      return { success: false, error: 'Failed to rotate encryption key' };
    }
  });
}