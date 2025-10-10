import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { DatabaseManager } from '../database/connection';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export class AuthService {
  private dbManager: DatabaseManager;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; session?: Session; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      // Find user by username
      const user = db.prepare(`
        SELECT id, username, email, password_hash, full_name, role, is_active, last_login, created_at, updated_at
        FROM users 
        WHERE username = ? AND is_active = 1
      `).get(credentials.username) as User & { password_hash: string };

      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Generate session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();

      // Create session
      const sessionResult = db.prepare(`
        INSERT INTO user_sessions (user_id, session_token, expires_at)
        VALUES (?, ?, ?)
      `).run(user.id, sessionToken, expiresAt);

      // Update last login
      db.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
      `).run(user.id);

      // Clean up expired sessions
      this.cleanupExpiredSessions();

      const session: Session = {
        id: sessionResult.lastInsertRowid,
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      };

      // Remove password_hash from user object
      const { password_hash, ...userWithoutPassword } = user;

      return { 
        success: true, 
        user: userWithoutPassword as User, 
        session 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async logout(sessionToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      db.prepare(`
        DELETE FROM user_sessions WHERE session_token = ?
      `).run(sessionToken);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async validateSession(sessionToken: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      const session = db.prepare(`
        SELECT s.*, u.id, u.username, u.email, u.full_name, u.role, u.is_active, u.last_login, u.created_at, u.updated_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
      `).get(sessionToken) as Session & User;

      if (!session) {
        return { success: false, error: 'Invalid or expired session' };
      }

      // Remove session-specific fields
      const { id, user_id, session_token, expires_at, created_at, ...user } = session;

      return { success: true, user: user as User };
    } catch (error) {
      console.error('Session validation error:', error);
      return { success: false, error: 'Session validation failed' };
    }
  }

  async createUser(userData: {
    username: string;
    email?: string;
    password: string;
    full_name: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      // Check if username already exists
      const existingUser = db.prepare(`
        SELECT id FROM users WHERE username = ? OR email = ?
      `).get(userData.username, userData.email);

      if (existingUser) {
        return { success: false, error: 'Username or email already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userData.username,
        userData.email || null,
        hashedPassword,
        userData.full_name,
        userData.role
      );

      const user: User = {
        id: result.lastInsertRowid,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return { success: true, user };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async updateUser(userId: number, updates: Partial<{
    email: string;
    full_name: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER';
    is_active: boolean;
  }>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(updates);
      values.push(userId);

      db.prepare(`
        UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(...values);

      // Get updated user
      const user = db.prepare(`
        SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at
        FROM users WHERE id = ?
      `).get(userId) as User;

      return { success: true, user };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      // Get current password hash
      const user = db.prepare(`
        SELECT password_hash FROM users WHERE id = ?
      `).get(userId) as { password_hash: string };

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      db.prepare(`
        UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(hashedPassword, userId);

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  async getAllUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      const db = this.dbManager.getDatabase();
      
      const users = db.prepare(`
        SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `).all() as User[];

      return { success: true, users };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, error: 'Failed to get users' };
    }
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private cleanupExpiredSessions(): void {
    try {
      const db = this.dbManager.getDatabase();
      db.prepare(`
        DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP
      `).run();
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
    }
  }

  async logUserAction(userId: number, action: string, details?: string): Promise<void> {
    try {
      const db = this.dbManager.getDatabase();
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, ?, ?)
      `).run(userId, action, details || null);
    } catch (error) {
      console.error('Log user action error:', error);
    }
  }
}