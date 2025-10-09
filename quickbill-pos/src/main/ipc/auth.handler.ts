import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';
import { AuthService } from '../utils/auth.service';

export function setupAuthHandlers(dbManager: DatabaseManager): void {
  const authService = new AuthService(dbManager);

  // Login
  ipcMain.handle('auth:login', async (event, credentials) => {
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.user) {
        // Log login action
        await authService.logUserAction(result.user.id, 'LOGIN', 'User logged in');
      }
      
      return result;
    } catch (error) {
      console.error('Login handler error:', error);
      return { success: false, error: 'Login failed' };
    }
  });

  // Logout
  ipcMain.handle('auth:logout', async (event, sessionToken) => {
    try {
      const result = await authService.logout(sessionToken);
      return result;
    } catch (error) {
      console.error('Logout handler error:', error);
      return { success: false, error: 'Logout failed' };
    }
  });

  // Validate session
  ipcMain.handle('auth:validateSession', async (event, sessionToken) => {
    try {
      const result = await authService.validateSession(sessionToken);
      return result;
    } catch (error) {
      console.error('Validate session handler error:', error);
      return { success: false, error: 'Session validation failed' };
    }
  });

  // Create user
  ipcMain.handle('auth:createUser', async (event, userData) => {
    try {
      const result = await authService.createUser(userData);
      
      if (result.success && result.user) {
        // Log user creation
        await authService.logUserAction(result.user.id, 'CREATE_USER', `Created user: ${userData.username}`);
      }
      
      return result;
    } catch (error) {
      console.error('Create user handler error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  });

  // Update user
  ipcMain.handle('auth:updateUser', async (event, userId, updates) => {
    try {
      const result = await authService.updateUser(userId, updates);
      
      if (result.success) {
        // Log user update
        await authService.logUserAction(userId, 'UPDATE_USER', `Updated user: ${userId}`);
      }
      
      return result;
    } catch (error) {
      console.error('Update user handler error:', error);
      return { success: false, error: 'Failed to update user' };
    }
  });

  // Change password
  ipcMain.handle('auth:changePassword', async (event, userId, currentPassword, newPassword) => {
    try {
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      
      if (result.success) {
        // Log password change
        await authService.logUserAction(userId, 'CHANGE_PASSWORD', 'Password changed');
      }
      
      return result;
    } catch (error) {
      console.error('Change password handler error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  });

  // Get all users
  ipcMain.handle('auth:getAllUsers', async (event) => {
    try {
      const result = await authService.getAllUsers();
      return result;
    } catch (error) {
      console.error('Get all users handler error:', error);
      return { success: false, error: 'Failed to get users' };
    }
  });

  // Get user by ID
  ipcMain.handle('auth:getUserById', async (event, userId) => {
    try {
      const db = dbManager.getDatabase();
      const user = db.prepare(`
        SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at
        FROM users WHERE id = ?
      `).get(userId);
      
      return { success: true, data: user };
    } catch (error) {
      console.error('Get user by ID handler error:', error);
      return { success: false, error: 'Failed to get user' };
    }
  });

  // Delete user (soft delete)
  ipcMain.handle('auth:deleteUser', async (event, userId) => {
    try {
      const db = dbManager.getDatabase();
      db.prepare(`
        UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(userId);
      
      // Log user deletion
      await authService.logUserAction(userId, 'DELETE_USER', `Soft deleted user: ${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Delete user handler error:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  });

  // Get audit logs
  ipcMain.handle('auth:getAuditLogs', async (event, limit = 100, offset = 0) => {
    try {
      const db = dbManager.getDatabase();
      const logs = db.prepare(`
        SELECT a.*, u.username, u.full_name
        FROM audit_log a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.timestamp DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      
      const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count;
      
      return { success: true, data: { logs, total } };
    } catch (error) {
      console.error('Get audit logs handler error:', error);
      return { success: false, error: 'Failed to get audit logs' };
    }
  });
}