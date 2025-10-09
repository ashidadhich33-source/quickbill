import { ipcMain } from 'electron';
import { DatabaseManager } from '../database/connection';

export function setupItemsHandlers(dbManager: DatabaseManager): void {
  // Find item by barcode
  ipcMain.handle('items:findByBarcode', async (event, barcode) => {
    try {
      const findItemByBarcode = dbManager.getStatement('findItemByBarcode');
      if (!findItemByBarcode) {
        throw new Error('Required database statement not prepared');
      }

      const item = findItemByBarcode.get(barcode);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error finding item by barcode:', error);
      return { success: false, error: error.message };
    }
  });

  // Find item by ID
  ipcMain.handle('items:findById', async (event, itemId) => {
    try {
      const findItemById = dbManager.getStatement('findItemById');
      if (!findItemById) {
        throw new Error('Required database statement not prepared');
      }

      const item = findItemById.get(itemId);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error finding item by ID:', error);
      return { success: false, error: error.message };
    }
  });

  // Search items
  ipcMain.handle('items:search', async (event, searchTerm) => {
    try {
      const searchItems = dbManager.getStatement('searchItems');
      if (!searchItems) {
        throw new Error('Required database statement not prepared');
      }

      const searchPattern = `%${searchTerm}%`;
      const items = searchItems.all(searchPattern, searchPattern, searchPattern);
      return { success: true, data: items };
    } catch (error) {
      console.error('Error searching items:', error);
      return { success: false, error: error.message };
    }
  });

  // Get items by category
  ipcMain.handle('items:getByCategory', async (event, category) => {
    try {
      const getItemsByCategory = dbManager.getStatement('getItemsByCategory');
      if (!getItemsByCategory) {
        throw new Error('Required database statement not prepared');
      }

      const items = getItemsByCategory.all(category);
      return { success: true, data: items };
    } catch (error) {
      console.error('Error getting items by category:', error);
      return { success: false, error: error.message };
    }
  });

  // Create new item
  ipcMain.handle('items:create', async (event, itemData) => {
    try {
      const db = dbManager.getDatabase();
      const insertItem = db.prepare(`
        INSERT INTO items (
          brand, style_code, item_description, size, shade, barcode, ean_code,
          mrp, gst_percentage, base_rate, purchase_rate, gender, category,
          sub_category, hsn_code, season, current_stock, min_stock, max_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertItem.run(
        itemData.brand,
        itemData.style_code,
        itemData.item_description,
        itemData.size || null,
        itemData.shade || null,
        itemData.barcode || null,
        itemData.ean_code || null,
        itemData.mrp,
        itemData.gst_percentage,
        itemData.base_rate || null,
        itemData.purchase_rate || null,
        itemData.gender || null,
        itemData.category || null,
        itemData.sub_category || null,
        itemData.hsn_code || null,
        itemData.season || null,
        itemData.current_stock || 0,
        itemData.min_stock || 0,
        itemData.max_stock || 0
      );

      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      console.error('Error creating item:', error);
      return { success: false, error: error.message };
    }
  });

  // Update item
  ipcMain.handle('items:update', async (event, itemId, itemData) => {
    try {
      const db = dbManager.getDatabase();
      const updateItem = db.prepare(`
        UPDATE items SET 
          brand = ?, style_code = ?, item_description = ?, size = ?, shade = ?,
          barcode = ?, ean_code = ?, mrp = ?, gst_percentage = ?, base_rate = ?,
          purchase_rate = ?, gender = ?, category = ?, sub_category = ?,
          hsn_code = ?, season = ?, current_stock = ?, min_stock = ?, max_stock = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateItem.run(
        itemData.brand,
        itemData.style_code,
        itemData.item_description,
        itemData.size || null,
        itemData.shade || null,
        itemData.barcode || null,
        itemData.ean_code || null,
        itemData.mrp,
        itemData.gst_percentage,
        itemData.base_rate || null,
        itemData.purchase_rate || null,
        itemData.gender || null,
        itemData.category || null,
        itemData.sub_category || null,
        itemData.hsn_code || null,
        itemData.season || null,
        itemData.current_stock || 0,
        itemData.min_stock || 0,
        itemData.max_stock || 0,
        itemId
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating item:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete item (soft delete)
  ipcMain.handle('items:delete', async (event, itemId) => {
    try {
      const db = dbManager.getDatabase();
      const deleteItem = db.prepare('UPDATE items SET is_active = 0 WHERE id = ?');
      deleteItem.run(itemId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, error: error.message };
    }
  });

  // Update stock
  ipcMain.handle('items:updateStock', async (event, itemId, quantity) => {
    try {
      const updateItemStock = dbManager.getStatement('updateItemStock');
      if (!updateItemStock) {
        throw new Error('Required database statement not prepared');
      }

      updateItemStock.run(quantity, itemId);
      return { success: true };
    } catch (error) {
      console.error('Error updating stock:', error);
      return { success: false, error: error.message };
    }
  });

  // Get low stock items
  ipcMain.handle('items:getLowStock', async (event) => {
    try {
      const db = dbManager.getDatabase();
      const lowStockItems = db.prepare(`
        SELECT * FROM items 
        WHERE current_stock <= min_stock AND is_active = 1
        ORDER BY (current_stock - min_stock) ASC
      `).all();

      return { success: true, data: lowStockItems };
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return { success: false, error: error.message };
    }
  });

  // Get out of stock items
  ipcMain.handle('items:getOutOfStock', async (event) => {
    try {
      const db = dbManager.getDatabase();
      const outOfStockItems = db.prepare(`
        SELECT * FROM items 
        WHERE current_stock = 0 AND is_active = 1
        ORDER BY brand, item_description
      `).all();

      return { success: true, data: outOfStockItems };
    } catch (error) {
      console.error('Error getting out of stock items:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all categories
  ipcMain.handle('items:getCategories', async (event) => {
    try {
      const db = dbManager.getDatabase();
      const categories = db.prepare(`
        SELECT DISTINCT category 
        FROM items 
        WHERE category IS NOT NULL AND is_active = 1
        ORDER BY category
      `).all();

      return { success: true, data: categories.map(c => c.category) };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all subcategories
  ipcMain.handle('items:getSubCategories', async (event, category) => {
    try {
      const db = dbManager.getDatabase();
      const subCategories = db.prepare(`
        SELECT DISTINCT sub_category 
        FROM items 
        WHERE category = ? AND sub_category IS NOT NULL AND is_active = 1
        ORDER BY sub_category
      `).all(category);

      return { success: true, data: subCategories.map(sc => sc.sub_category) };
    } catch (error) {
      console.error('Error getting subcategories:', error);
      return { success: false, error: error.message };
    }
  });

  // Import items from CSV
  ipcMain.handle('items:importFromCSV', async (event, csvPath) => {
    try {
      const { BackupManager } = require('../database/backup');
      const backupManager = new BackupManager(dbManager);
      await backupManager.importFromCSV('items', csvPath);
      return { success: true };
    } catch (error) {
      console.error('Error importing items from CSV:', error);
      return { success: false, error: error.message };
    }
  });

  // Export items to CSV
  ipcMain.handle('items:exportToCSV', async (event, outputPath) => {
    try {
      const { BackupManager } = require('../database/backup');
      const backupManager = new BackupManager(dbManager);
      await backupManager.exportToCSV('items', outputPath);
      return { success: true };
    } catch (error) {
      console.error('Error exporting items to CSV:', error);
      return { success: false, error: error.message };
    }
  });
}