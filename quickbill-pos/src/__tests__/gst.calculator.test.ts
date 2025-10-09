import { GSTCalculator } from '../main/utils/gst.calculator';

describe('GSTCalculator', () => {
  let gstCalculator: GSTCalculator;

  beforeEach(() => {
    gstCalculator = new GSTCalculator({
      businessState: 'Maharashtra',
      gstRates: {
        '0': 0,
        '5': 5,
        '12': 12,
        '18': 18,
        '28': 28
      }
    });
  });

  describe('calculateGST', () => {
    it('should calculate inclusive GST correctly for same state (CGST+SGST)', () => {
      const result = gstCalculator.calculateGST(118, 18, true, 'Maharashtra');
      
      expect(result.baseAmount).toBe(100);
      expect(result.cgst).toBe(9);
      expect(result.sgst).toBe(9);
      expect(result.igst).toBe(0);
      expect(result.total).toBe(118);
    });

    it('should calculate inclusive GST correctly for different state (IGST)', () => {
      const result = gstCalculator.calculateGST(118, 18, true, 'Karnataka');
      
      expect(result.baseAmount).toBe(100);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(18);
      expect(result.total).toBe(118);
    });

    it('should calculate exclusive GST correctly for same state', () => {
      const result = gstCalculator.calculateGST(100, 18, false, 'Maharashtra');
      
      expect(result.baseAmount).toBe(100);
      expect(result.cgst).toBe(9);
      expect(result.sgst).toBe(9);
      expect(result.igst).toBe(0);
      expect(result.total).toBe(118);
    });

    it('should calculate exclusive GST correctly for different state', () => {
      const result = gstCalculator.calculateGST(100, 18, false, 'Karnataka');
      
      expect(result.baseAmount).toBe(100);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(18);
      expect(result.total).toBe(118);
    });

    it('should handle zero GST rate', () => {
      const result = gstCalculator.calculateGST(100, 0, true);
      
      expect(result.baseAmount).toBe(100);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(0);
      expect(result.total).toBe(100);
    });

    it('should round amounts correctly', () => {
      const result = gstCalculator.calculateGST(100.50, 18, true);
      
      expect(result.baseAmount).toBe(85.17);
      expect(result.cgst).toBe(7.67);
      expect(result.sgst).toBe(7.67);
      expect(result.igst).toBe(0);
      expect(result.total).toBe(100.50);
    });
  });

  describe('determineGSTType', () => {
    it('should return CGST_SGST for same state', () => {
      const result = gstCalculator.determineGSTType('Maharashtra');
      expect(result).toBe('CGST_SGST');
    });

    it('should return IGST for different state', () => {
      const result = gstCalculator.determineGSTType('Karnataka');
      expect(result).toBe('IGST');
    });

    it('should return CGST_SGST when no customer state provided', () => {
      const result = gstCalculator.determineGSTType();
      expect(result).toBe('CGST_SGST');
    });
  });

  describe('calculateBulkGST', () => {
    it('should calculate GST for multiple items correctly', () => {
      const items = [
        { amount: 100, rate: 18, inclusive: true },
        { amount: 200, rate: 12, inclusive: true },
        { amount: 50, rate: 5, inclusive: true }
      ];

      const result = gstCalculator.calculateBulkGST(items, 'Maharashtra');

      expect(result.items).toHaveLength(3);
      expect(result.totals.totalBaseAmount).toBe(350);
      expect(result.totals.totalCGST).toBe(22.5);
      expect(result.totals.totalSGST).toBe(22.5);
      expect(result.totals.totalIGST).toBe(0);
      expect(result.totals.totalAmount).toBe(395);
    });
  });

  describe('getGSTRate', () => {
    it('should return correct GST rate for HSN codes', () => {
      expect(gstCalculator.getGSTRate('0101')).toBe(0);   // Agricultural
      expect(gstCalculator.getGSTRate('0601')).toBe(5);   // Food items
      expect(gstCalculator.getGSTRate('1501')).toBe(12);  // Processed food
      expect(gstCalculator.getGSTRate('2501')).toBe(18);  // Minerals
      expect(gstCalculator.getGSTRate('7101')).toBe(3);   // Precious metals
      expect(gstCalculator.getGSTRate('9999')).toBe(18);  // Default
    });
  });

  describe('validateGSTNumber', () => {
    it('should validate correct GST numbers', () => {
      expect(gstCalculator.validateGSTNumber('27AAPFU0939F1ZV')).toBe(true);
      expect(gstCalculator.validateGSTNumber('29ABCDE1234F1Z5')).toBe(true);
    });

    it('should reject invalid GST numbers', () => {
      expect(gstCalculator.validateGSTNumber('123456789')).toBe(false);
      expect(gstCalculator.validateGSTNumber('27AAPFU0939F1Z')).toBe(false);
      expect(gstCalculator.validateGSTNumber('')).toBe(false);
    });
  });

  describe('getStateFromGST', () => {
    it('should extract state from GST number', () => {
      expect(gstCalculator.getStateFromGST('27AAPFU0939F1ZV')).toBe('Maharashtra');
      expect(gstCalculator.getStateFromGST('29ABCDE1234F1Z5')).toBe('Karnataka');
    });

    it('should throw error for invalid GST number', () => {
      expect(() => gstCalculator.getStateFromGST('123456789')).toThrow('Invalid GST number');
    });
  });

  describe('generateGSTReport', () => {
    it('should generate GST report correctly', () => {
      const sales = [
        {
          date: '2024-01-01',
          items: [
            { hsnCode: '6109', taxableAmount: 100, cgst: 9, sgst: 9, igst: 0 },
            { hsnCode: '6109', taxableAmount: 200, cgst: 18, sgst: 18, igst: 0 }
          ]
        }
      ];

      const result = gstCalculator.generateGSTReport(sales);

      expect(result.summary.totalTaxableAmount).toBe(300);
      expect(result.summary.totalCGST).toBe(27);
      expect(result.summary.totalSGST).toBe(27);
      expect(result.summary.totalIGST).toBe(0);
      expect(result.summary.totalTax).toBe(54);
      expect(result.hsnWise).toHaveLength(1);
      expect(result.hsnWise[0].hsnCode).toBe('6109');
    });
  });

  describe('roundOff', () => {
    it('should round off amounts correctly', () => {
      expect(gstCalculator.roundOff(100.4)).toBe(100);
      expect(gstCalculator.roundOff(100.5)).toBe(101);
      expect(gstCalculator.roundOff(100.6)).toBe(101);
    });
  });
});