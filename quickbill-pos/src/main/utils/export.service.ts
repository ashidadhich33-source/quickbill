import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as Papa from 'papaparse';

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

export class ExportService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(app.getPath('documents'), 'QuickBill Exports');
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async exportItems(items: any[], options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || `items_export_${Date.now()}`;
      const filePath = path.join(this.outputDir, `${filename}.${options.format}`);

      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(items, filePath, options);
        case 'json':
          return await this.exportToJSON(items, filePath, options);
        case 'excel':
          return await this.exportToExcel(items, filePath, options);
        case 'pdf':
          return await this.exportToPDF(items, filePath, options, 'Items');
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export items error:', error);
      return { success: false, error: error.message };
    }
  }

  async exportCustomers(customers: any[], options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || `customers_export_${Date.now()}`;
      const filePath = path.join(this.outputDir, `${filename}.${options.format}`);

      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(customers, filePath, options);
        case 'json':
          return await this.exportToJSON(customers, filePath, options);
        case 'excel':
          return await this.exportToExcel(customers, filePath, options);
        case 'pdf':
          return await this.exportToPDF(customers, filePath, options, 'Customers');
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export customers error:', error);
      return { success: false, error: error.message };
    }
  }

  async exportSales(sales: any[], options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || `sales_export_${Date.now()}`;
      const filePath = path.join(this.outputDir, `${filename}.${options.format}`);

      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(sales, filePath, options);
        case 'json':
          return await this.exportToJSON(sales, filePath, options);
        case 'excel':
          return await this.exportToExcel(sales, filePath, options);
        case 'pdf':
          return await this.exportToPDF(sales, filePath, options, 'Sales');
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export sales error:', error);
      return { success: false, error: error.message };
    }
  }

  async exportReturns(returns: any[], options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || `returns_export_${Date.now()}`;
      const filePath = path.join(this.outputDir, `${filename}.${options.format}`);

      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(returns, filePath, options);
        case 'json':
          return await this.exportToJSON(returns, filePath, options);
        case 'excel':
          return await this.exportToExcel(returns, filePath, options);
        case 'pdf':
          return await this.exportToPDF(returns, filePath, options, 'Returns');
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export returns error:', error);
      return { success: false, error: error.message };
    }
  }

  async exportReports(reportData: any[], options: ExportOptions, reportType: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const filename = options.filename || `${reportType.toLowerCase()}_report_${Date.now()}`;
      const filePath = path.join(this.outputDir, `${filename}.${options.format}`);

      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(reportData, filePath, options);
        case 'json':
          return await this.exportToJSON(reportData, filePath, options);
        case 'excel':
          return await this.exportToExcel(reportData, filePath, options);
        case 'pdf':
          return await this.exportToPDF(reportData, filePath, options, reportType);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export reports error:', error);
      return { success: false, error: error.message };
    }
  }

  private async exportToCSV(data: any[], filePath: string, options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const csv = Papa.unparse(data, {
        header: options.includeHeaders !== false,
        delimiter: ',',
        quotes: true,
        quoteChar: '"',
        escapeChar: '"'
      });

      fs.writeFileSync(filePath, csv, 'utf8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async exportToJSON(data: any[], filePath: string, options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        data: data,
        filters: options.filters || {},
        dateRange: options.dateRange || {}
      };

      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async exportToExcel(data: any[], filePath: string, options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // For Excel export, we'll use CSV format with .xlsx extension
      // In a real implementation, you would use a library like 'xlsx'
      const csv = Papa.unparse(data, {
        header: options.includeHeaders !== false,
        delimiter: ',',
        quotes: true,
        quoteChar: '"',
        escapeChar: '"'
      });

      // Convert CSV to Excel-like format (simplified)
      const excelContent = this.convertCSVToExcel(csv);
      fs.writeFileSync(filePath, excelContent, 'utf8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async exportToPDF(data: any[], filePath: string, options: ExportOptions, title: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Generate HTML content for PDF
      const htmlContent = this.generatePDFHTML(data, title, options);
      
      // For now, save as HTML file
      // In a real implementation, you would use a library like 'puppeteer' or 'html-pdf'
      const htmlPath = filePath.replace('.pdf', '.html');
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');
      
      return { success: true, filePath: htmlPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private convertCSVToExcel(csv: string): string {
    // Simplified Excel conversion
    // In a real implementation, use the 'xlsx' library
    return csv;
  }

  private generatePDFHTML(data: any[], title: string, options: ExportOptions): string {
    const currentDate = new Date().toLocaleString();
    const totalRecords = data.length;

    let tableRows = '';
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      tableRows += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      
      data.forEach(row => {
        tableRows += '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>';
      });
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title} Export Report</h1>
        <p>Generated on: ${currentDate}</p>
    </div>
    
    <div class="info">
        <p><strong>Total Records:</strong> ${totalRecords}</p>
        ${options.dateRange ? `<p><strong>Date Range:</strong> ${options.dateRange.start} to ${options.dateRange.end}</p>` : ''}
    </div>
    
    <table>
        ${tableRows}
    </table>
    
    <div class="footer">
        <p>Generated by QuickBill POS System</p>
    </div>
</body>
</html>`;
  }

  async getExportHistory(): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const files = fs.readdirSync(this.outputDir)
        .filter(file => file.endsWith('.csv') || file.endsWith('.json') || file.endsWith('.xlsx') || file.endsWith('.html'))
        .map(file => ({
          name: file,
          path: path.join(this.outputDir, file),
          size: fs.statSync(path.join(this.outputDir, file)).size,
          created: fs.statSync(path.join(this.outputDir, file)).birthtime
        }))
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return { success: true, files };
    } catch (error) {
      console.error('Get export history error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteExportFile(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filePath = path.join(this.outputDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      console.error('Delete export file error:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupOldExports(daysOld: number = 30): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const files = fs.readdirSync(this.outputDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      files.forEach(file => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        if (stats.birthtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Cleanup old exports error:', error);
      return { success: false, error: error.message };
    }
  }
}