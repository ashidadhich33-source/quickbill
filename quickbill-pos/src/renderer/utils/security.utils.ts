import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization utilities
export class SecurityUtils {
  // Sanitize HTML content
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Sanitize text input
  static sanitizeText(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .trim();
  }

  // Sanitize SQL input (basic protection)
  static sanitizeSQL(input: string): string {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(;|\||&)/g
    ];

    let sanitized = input;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized.trim();
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.toLowerCase().trim();
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  // Validate and sanitize phone number
  static sanitizePhone(phone: string): string {
    const phoneRegex = /^[6-9]\d{9}$/;
    const sanitized = phone.replace(/\D/g, ''); // Remove non-digits
    
    if (!phoneRegex.test(sanitized)) {
      throw new Error('Invalid phone number format');
    }
    
    return sanitized;
  }

  // Validate and sanitize GST number
  static sanitizeGST(gst: string): string {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const sanitized = gst.toUpperCase().trim();
    
    if (!gstRegex.test(sanitized)) {
      throw new Error('Invalid GST number format');
    }
    
    return sanitized;
  }

  // Sanitize file name
  static sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 255); // Limit length
  }

  // Validate file type
  static validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  // Validate file size
  static validateFileSize(size: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  // Escape special characters for display
  static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (key: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key)!;
      
      // Remove old requests
      const validRequests = userRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      
      return true; // Request allowed
    };
  }
}

// Enhanced validation schemas
export const SecuritySchemas = {
  // Item validation with security
  Item: z.object({
    brand: z.string()
      .min(1, 'Brand is required')
      .max(100, 'Brand name too long')
      .transform(val => SecurityUtils.sanitizeText(val)),
    
    style_code: z.string()
      .min(1, 'Style code is required')
      .max(50, 'Style code too long')
      .transform(val => SecurityUtils.sanitizeText(val)),
    
    item_description: z.string()
      .min(1, 'Description is required')
      .max(500, 'Description too long')
      .transform(val => SecurityUtils.sanitizeText(val)),
    
    barcode: z.string()
      .max(20, 'Barcode too long')
      .regex(/^[0-9]+$/, 'Barcode must contain only numbers')
      .optional(),
    
    mrp: z.number()
      .min(0, 'MRP must be positive')
      .max(999999.99, 'MRP too high'),
    
    gst_percentage: z.number()
      .min(0, 'GST percentage must be positive')
      .max(100, 'GST percentage too high'),
    
    category: z.string()
      .max(100, 'Category too long')
      .transform(val => SecurityUtils.sanitizeText(val))
      .optional(),
    
    hsn_code: z.string()
      .max(10, 'HSN code too long')
      .regex(/^[0-9]+$/, 'HSN code must contain only numbers')
      .optional()
  }),

  // Customer validation with security
  Customer: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name too long')
      .transform(val => SecurityUtils.sanitizeText(val)),
    
    mobile: z.string()
      .regex(/^[6-9]\d{9}$/, 'Invalid mobile number')
      .transform(val => SecurityUtils.sanitizePhone(val)),
    
    email: z.string()
      .email('Invalid email format')
      .transform(val => SecurityUtils.sanitizeEmail(val))
      .optional(),
    
    address: z.string()
      .max(500, 'Address too long')
      .transform(val => SecurityUtils.sanitizeText(val))
      .optional(),
    
    city: z.string()
      .max(50, 'City name too long')
      .transform(val => SecurityUtils.sanitizeText(val))
      .optional(),
    
    state: z.string()
      .max(50, 'State name too long')
      .transform(val => SecurityUtils.sanitizeText(val))
      .optional(),
    
    pincode: z.string()
      .regex(/^\d{6}$/, 'Invalid pincode')
      .optional(),
    
    gst_number: z.string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
      .transform(val => SecurityUtils.sanitizeGST(val))
      .optional()
  }),

  // Sale validation with security
  Sale: z.object({
    customer_id: z.number().optional(),
    
    items: z.array(z.object({
      item_id: z.number(),
      quantity: z.number().min(0.001, 'Quantity must be positive'),
      selling_price: z.number().min(0, 'Price must be positive'),
      discount_percent: z.number().min(0).max(100, 'Discount must be between 0-100')
    })).min(1, 'At least one item required'),
    
    payment_mode: z.enum(['CASH', 'CARD', 'UPI', 'CREDIT']),
    
    received_amount: z.number().min(0, 'Received amount cannot be negative'),
    
    bill_discount: z.number().min(0, 'Bill discount cannot be negative').optional(),
    
    bill_discount_type: z.enum(['percent', 'amount']).optional()
  }),

  // File upload validation
  FileUpload: z.object({
    filename: z.string()
      .min(1, 'Filename is required')
      .transform(val => SecurityUtils.sanitizeFileName(val)),
    
    size: z.number()
      .min(1, 'File size must be greater than 0')
      .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    
    type: z.string()
      .refine(val => SecurityUtils.validateFileType(val, ['csv', 'xlsx', 'json']), 
        'Invalid file type. Only CSV, XLSX, and JSON files are allowed')
  })
};

// Input validation middleware
export function createInputValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: boolean; data?: T; error?: string } => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: error.errors.map(e => e.message).join(', ') 
        };
      }
      return { success: false, error: 'Validation failed' };
    }
  };
}

// XSS protection
export function preventXSS(input: string): string {
  return SecurityUtils.escapeHtml(SecurityUtils.sanitizeText(input));
}

// SQL injection protection
export function preventSQLInjection(input: string): string {
  return SecurityUtils.sanitizeSQL(input);
}

// CSRF protection token
export function generateCSRFToken(): string {
  return SecurityUtils.generateSecureToken(32);
}

// Validate CSRF token
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken && token.length === 32;
}

// Content Security Policy helper
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}