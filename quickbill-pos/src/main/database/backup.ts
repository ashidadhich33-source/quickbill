import * as path from 'path';
import { app } from 'electron';
import { DatabaseManager } from './connection';
import * as fs from 'fs';

export class BackupManager {
  private dbManager: DatabaseManager;
  private readonly backupDir: string;
  private readonly maxBackups: number = 7;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup_${timestamp}.db`);
    
    try {
      await this.dbManager.backup();
      console.log(`Backup created: ${backupPath}`);
      
      // Clean old backups
      this.cleanOldBackups();
      
      return backupPath;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  private cleanOldBackups(): void {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the most recent backups
      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log(`Deleted old backup: ${file.name}`);
          } catch (error) {
            console.error(`Failed to delete backup ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  getBackupList(): Array<{ name: string; path: string; size: number; mtime: Date }> {
    try {
      return fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            mtime: stats.mtime
          };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    } catch (error) {
      console.error('Error getting backup list:', error);
      return [];
    }
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      // Close current database
      this.dbManager.close();

      // Copy backup to current database location
      const currentDbPath = this.dbManager.getDatabase().name;
      fs.copyFileSync(backupPath, currentDbPath);

      // Reconnect to database
      this.dbManager.connect();

      console.log(`Database restored from: ${backupPath}`);
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  scheduleBackups(): void {
    // Schedule daily backup at 9 PM
    const cron = require('node-cron');
    
    cron.schedule('0 21 * * *', async () => {
      try {
        await this.createBackup();
        console.log('Scheduled backup completed');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });

    console.log('Backup scheduler started - daily at 9 PM');
  }

  async exportToCSV(tableName: string, outputPath: string): Promise<void> {
    try {
      const db = this.dbManager.getDatabase();
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
      
      if (rows.length === 0) {
        throw new Error(`No data found in table: ${tableName}`);
      }

      // Convert to CSV
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      fs.writeFileSync(outputPath, csvContent, 'utf8');
      console.log(`CSV export completed: ${outputPath}`);
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }

  async importFromCSV(tableName: string, csvPath: string): Promise<void> {
    try {
      const Papa = require('papaparse');
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      
      const { data, errors } = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      if (errors.length > 0) {
        console.error('CSV parse errors:', errors);
        throw new Error('CSV parsing failed');
      }

      if (data.length === 0) {
        throw new Error('No data found in CSV file');
      }

      // Get table schema
      const db = this.dbManager.getDatabase();
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columns = tableInfo.map(col => col.name);

      // Prepare insert statement
      const placeholders = columns.map(() => '?').join(', ');
      const insert = db.prepare(`INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`);

      // Insert data in transaction
      const insertMany = db.transaction((items: any[]) => {
        for (const item of items) {
          const values = columns.map(col => item[col] || null);
          insert.run(values);
        }
      });

      insertMany(data);
      console.log(`CSV import completed: ${data.length} records imported to ${tableName}`);
    } catch (error) {
      console.error('CSV import failed:', error);
      throw error;
    }
  }
}