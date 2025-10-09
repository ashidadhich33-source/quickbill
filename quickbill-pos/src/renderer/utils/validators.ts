import { z } from 'zod';

// Item validation schema
export const ItemSchema = z.object({
  brand: z.string().min(1, 'Brand is required').max(100, 'Brand name too long'),
  style_code: z.string().min(1, 'Style code is required').max(50, 'Style code too long'),
  item_description: z.string().min(1, 'Description is required'),
  size: z.string().max(20, 'Size too long').optional(),
  shade: z.string().max(50, 'Shade too long').optional(),
  barcode: z.string().max(20, 'Barcode too long').optional(),
  ean_code: z.string().max(20, 'EAN code too long').optional(),
  mrp: z.number().min(0, 'MRP must be positive'),
  gst_percentage: z.number().min(0, 'GST percentage must be positive').max(100, 'GST percentage too high'),
  base_rate: z.number().min(0, 'Base rate must be positive').optional(),
  purchase_rate: z.number().min(0, 'Purchase rate must be positive').optional(),
  gender: z.string().max(20, 'Gender too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  sub_category: z.string().max(100, 'Sub-category too long').optional(),
  hsn_code: z.string().max(10, 'HSN code too long').optional(),
  season: z.string().max(50, 'Season too long').optional(),
  current_stock: z.number().min(0, 'Stock cannot be negative').optional(),
  min_stock: z.number().min(0, 'Min stock cannot be negative').optional(),
  max_stock: z.number().min(0, 'Max stock cannot be negative').optional(),
});

// Customer validation schema
export const CustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  email: z.string().email('Invalid email').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(50, 'City name too long').optional(),
  state: z.string().max(50, 'State name too long').optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional(),
  credit_limit: z.number().min(0, 'Credit limit cannot be negative').optional(),
  customer_type: z.enum(['RETAIL', 'WHOLESALE']).optional(),
  children: z.array(z.object({
    name: z.string().min(1, 'Child name is required'),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  })).max(3, 'Maximum 3 children allowed').optional(),
});

// Sale validation schema
export const SaleSchema = z.object({
  customer_id: z.number().optional(),
  items: z.array(z.object({
    item_id: z.number(),
    quantity: z.number().min(0.001, 'Quantity must be positive'),
    selling_price: z.number().min(0, 'Price must be positive'),
    discount_percent: z.number().min(0).max(100, 'Discount must be between 0-100'),
  })).min(1, 'At least one item required'),
  payment_mode: z.enum(['CASH', 'CARD', 'UPI', 'CREDIT']),
  received_amount: z.number().min(0, 'Received amount cannot be negative'),
  bill_discount: z.number().min(0, 'Bill discount cannot be negative').optional(),
  bill_discount_type: z.enum(['percent', 'amount']).optional(),
});

// Barcode validation
export const BarcodeSchema = z.string()
  .min(8, 'Barcode too short')
  .max(20, 'Barcode too long')
  .regex(/^[0-9]+$/, 'Barcode must contain only numbers');

// Mobile number validation
export const MobileSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Invalid mobile number');

// Email validation
export const EmailSchema = z.string()
  .email('Invalid email format');

// GST number validation
export const GSTSchema = z.string()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number');

// Helper functions
export const validateItem = (data: any) => {
  return ItemSchema.safeParse(data);
};

export const validateCustomer = (data: any) => {
  return CustomerSchema.safeParse(data);
};

export const validateSale = (data: any) => {
  return SaleSchema.safeParse(data);
};

export const validateBarcode = (barcode: string) => {
  return BarcodeSchema.safeParse(barcode);
};

export const validateMobile = (mobile: string) => {
  return MobileSchema.safeParse(mobile);
};

export const validateEmail = (email: string) => {
  return EmailSchema.safeParse(email);
};

export const validateGST = (gst: string) => {
  return GSTSchema.safeParse(gst);
};