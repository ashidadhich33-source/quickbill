export interface GSTCalculation {
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface GSTSettings {
  businessState: string;
  customerState?: string;
  gstRates: {
    [key: string]: number;
  };
}

export class GSTCalculator {
  private settings: GSTSettings;

  constructor(settings: GSTSettings) {
    this.settings = settings;
  }

  calculateGST(
    amount: number, 
    rate: number, 
    inclusive: boolean = true,
    customerState?: string
  ): GSTCalculation {
    const gstType = this.determineGSTType(customerState || this.settings.customerState);
    
    if (inclusive) {
      const baseAmount = amount / (1 + rate / 100);
      const gstAmount = amount - baseAmount;
      
      if (gstType === 'CGST_SGST') {
        return {
          baseAmount: this.roundAmount(baseAmount),
          cgst: this.roundAmount(gstAmount / 2),
          sgst: this.roundAmount(gstAmount / 2),
          igst: 0,
          total: amount
        };
      } else {
        return {
          baseAmount: this.roundAmount(baseAmount),
          cgst: 0,
          sgst: 0,
          igst: this.roundAmount(gstAmount),
          total: amount
        };
      }
    } else {
      const gstAmount = (amount * rate) / 100;
      
      if (gstType === 'CGST_SGST') {
        return {
          baseAmount: amount,
          cgst: this.roundAmount(gstAmount / 2),
          sgst: this.roundAmount(gstAmount / 2),
          igst: 0,
          total: this.roundAmount(amount + gstAmount)
        };
      } else {
        return {
          baseAmount: amount,
          cgst: 0,
          sgst: 0,
          igst: this.roundAmount(gstAmount),
          total: this.roundAmount(amount + gstAmount)
        };
      }
    }
  }

  determineGSTType(customerState?: string): 'CGST_SGST' | 'IGST' {
    if (!customerState || customerState === this.settings.businessState) {
      return 'CGST_SGST';
    }
    return 'IGST';
  }

  roundOff(amount: number): number {
    return Math.round(amount);
  }

  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  // Calculate GST for multiple items
  calculateBulkGST(
    items: Array<{
      amount: number;
      rate: number;
      inclusive: boolean;
    }>,
    customerState?: string
  ): {
    items: Array<GSTCalculation & { originalAmount: number }>;
    totals: {
      totalBaseAmount: number;
      totalCGST: number;
      totalSGST: number;
      totalIGST: number;
      totalAmount: number;
    };
  } {
    const itemCalculations = items.map(item => {
      const calculation = this.calculateGST(
        item.amount, 
        item.rate, 
        item.inclusive, 
        customerState
      );
      return {
        ...calculation,
        originalAmount: item.amount
      };
    });

    const totals = itemCalculations.reduce(
      (acc, item) => ({
        totalBaseAmount: acc.totalBaseAmount + item.baseAmount,
        totalCGST: acc.totalCGST + item.cgst,
        totalSGST: acc.totalSGST + item.sgst,
        totalIGST: acc.totalIGST + item.igst,
        totalAmount: acc.totalAmount + item.total
      }),
      {
        totalBaseAmount: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        totalAmount: 0
      }
    );

    return {
      items: itemCalculations,
      totals: {
        totalBaseAmount: this.roundAmount(totals.totalBaseAmount),
        totalCGST: this.roundAmount(totals.totalCGST),
        totalSGST: this.roundAmount(totals.totalSGST),
        totalIGST: this.roundAmount(totals.totalIGST),
        totalAmount: this.roundAmount(totals.totalAmount)
      }
    };
  }

  // Get GST rate for a specific HSN code
  getGSTRate(hsnCode: string): number {
    // This would typically look up from a GST rate table
    // For now, return default rates based on HSN code patterns
    const code = parseInt(hsnCode.substring(0, 2));
    
    if (code >= 1 && code <= 5) return 0;    // Agricultural products
    if (code >= 6 && code <= 14) return 5;   // Food items
    if (code >= 15 && code <= 24) return 12; // Processed food
    if (code >= 25 && code <= 27) return 18; // Minerals
    if (code >= 28 && code <= 38) return 18; // Chemicals
    if (code >= 39 && code <= 40) return 18; // Plastics
    if (code >= 41 && code <= 43) return 18; // Leather
    if (code >= 44 && code <= 46) return 18; // Wood
    if (code >= 47 && code <= 49) return 18; // Paper
    if (code >= 50 && code <= 63) return 18; // Textiles
    if (code >= 64 && code <= 67) return 18; // Footwear
    if (code >= 68 && code <= 70) return 18; // Stone/Glass
    if (code >= 71 && code <= 71) return 3;  // Precious metals
    if (code >= 72 && code <= 83) return 18; // Metals
    if (code >= 84 && code <= 85) return 18; // Machinery
    if (code >= 86 && code <= 89) return 18; // Transport
    if (code >= 90 && code <= 92) return 18; // Instruments
    if (code >= 93 && code <= 93) return 18; // Arms
    if (code >= 94 && code <= 96) return 18; // Miscellaneous
    if (code >= 97 && code <= 97) return 18; // Art/Collectibles
    
    return 18; // Default rate
  }

  // Validate GST number
  validateGSTNumber(gstNumber: string): boolean {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  // Extract state code from GST number
  getStateFromGST(gstNumber: string): string {
    if (!this.validateGSTNumber(gstNumber)) {
      throw new Error('Invalid GST number');
    }
    
    const stateCode = gstNumber.substring(0, 2);
    const stateMap: { [key: string]: string } = {
      '01': 'Jammu and Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '11': 'Sikkim',
      '12': 'Arunachal Pradesh',
      '13': 'Nagaland',
      '14': 'Manipur',
      '15': 'Mizoram',
      '16': 'Tripura',
      '17': 'Meghalaya',
      '18': 'Assam',
      '19': 'West Bengal',
      '20': 'Jharkhand',
      '21': 'Odisha',
      '22': 'Chhattisgarh',
      '23': 'Madhya Pradesh',
      '24': 'Gujarat',
      '25': 'Daman and Diu',
      '26': 'Dadra and Nagar Haveli',
      '27': 'Maharashtra',
      '28': 'Andhra Pradesh',
      '29': 'Karnataka',
      '30': 'Goa',
      '31': 'Lakshadweep',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '34': 'Puducherry',
      '35': 'Andaman and Nicobar Islands',
      '36': 'Telangana',
      '37': 'Andhra Pradesh'
    };
    
    return stateMap[stateCode] || 'Unknown';
  }

  // Generate GST report
  generateGSTReport(
    sales: Array<{
      date: string;
      items: Array<{
        hsnCode: string;
        taxableAmount: number;
        cgst: number;
        sgst: number;
        igst: number;
      }>;
    }>
  ): {
    summary: {
      totalTaxableAmount: number;
      totalCGST: number;
      totalSGST: number;
      totalIGST: number;
      totalTax: number;
    };
    hsnWise: Array<{
      hsnCode: string;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      rate: number;
    }>;
  } {
    const hsnMap: { [key: string]: any } = {};
    let totalTaxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!hsnMap[item.hsnCode]) {
          hsnMap[item.hsnCode] = {
            hsnCode: item.hsnCode,
            taxableAmount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            rate: this.getGSTRate(item.hsnCode)
          };
        }

        hsnMap[item.hsnCode].taxableAmount += item.taxableAmount;
        hsnMap[item.hsnCode].cgst += item.cgst;
        hsnMap[item.hsnCode].sgst += item.sgst;
        hsnMap[item.hsnCode].igst += item.igst;

        totalTaxableAmount += item.taxableAmount;
        totalCGST += item.cgst;
        totalSGST += item.sgst;
        totalIGST += item.igst;
      });
    });

    return {
      summary: {
        totalTaxableAmount: this.roundAmount(totalTaxableAmount),
        totalCGST: this.roundAmount(totalCGST),
        totalSGST: this.roundAmount(totalSGST),
        totalIGST: this.roundAmount(totalIGST),
        totalTax: this.roundAmount(totalCGST + totalSGST + totalIGST)
      },
      hsnWise: Object.values(hsnMap).map((item: any) => ({
        ...item,
        taxableAmount: this.roundAmount(item.taxableAmount),
        cgst: this.roundAmount(item.cgst),
        sgst: this.roundAmount(item.sgst),
        igst: this.roundAmount(item.igst)
      }))
    };
  }
}