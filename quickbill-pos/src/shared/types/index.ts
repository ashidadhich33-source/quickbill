// Database Types
export interface Item {
  id: number;
  brand: string;
  style_code: string;
  item_description: string;
  size?: string;
  shade?: string;
  barcode?: string;
  ean_code?: string;
  mrp: number;
  gst_percentage: number;
  base_rate?: number;
  purchase_rate?: number;
  gender?: string;
  category?: string;
  sub_category?: string;
  hsn_code?: string;
  season?: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  mobile: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  credit_limit: number;
  current_balance: number;
  loyalty_points: number;
  customer_type: 'RETAIL' | 'WHOLESALE';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: CustomerChild[];
}

export interface CustomerChild {
  id: number;
  customer_id: number;
  child_name: string;
  date_of_birth: string;
  child_order: 1 | 2 | 3;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
  payment_terms: number;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  po_date: string;
  supplier_id: number;
  supplier_name: string;
  expected_delivery_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';
  notes?: string;
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  received_quantity: number;
  pending_quantity: number;
}

export interface PurchaseReceipt {
  id: number;
  receipt_number: string;
  receipt_date: string;
  po_id?: number;
  supplier_id: number;
  supplier_name: string;
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'RECEIVED' | 'VERIFIED' | 'REJECTED';
  notes?: string;
  received_by: number;
  created_at: string;
  updated_at: string;
  items?: PurchaseReceiptItem[];
}

export interface PurchaseReceiptItem {
  id: number;
  receipt_id: number;
  po_item_id?: number;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  batch_number?: string;
  expiry_date?: string;
  condition_status: 'GOOD' | 'DAMAGED' | 'EXPIRED';
}

export interface SupplierPayment {
  id: number;
  payment_number: string;
  payment_date: string;
  supplier_id: number;
  supplier_name: string;
  amount: number;
  payment_mode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD';
  reference_number?: string;
  notes?: string;
  receipt_ids?: string;
  created_by: number;
  created_at: string;
}

export interface Sale {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_id?: number;
  customer_name?: string;
  customer_mobile?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  round_off: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
  transaction_type: 'SALES' | 'RETURN';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  salesman_id?: number;
  terminal_id?: string;
  sync_status: boolean;
  created_by: number;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  sales_id: number;
  item_id: number;
  barcode?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
}

export interface CompanyConfig {
  id: number;
  company_name: string;
  address?: string;
  gst_number?: string;
  phone?: string;
  email?: string;
  invoice_prefix: string;
  current_invoice_number: number;
  fiscal_year_start?: string;
  currency_symbol: string;
  date_format: string;
  time_zone: string;
}

export interface UserPermission {
  id: number;
  user_id: number;
  module: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface AuditLog {
  id: number;
  action: string;
  user_id: number;
  details?: string;
  timestamp: string;
}

// POS Types
export interface CartItem {
  id: number;
  itemId: number;
  barcode: string;
  brand: string;
  itemDescription: string;
  size: string;
  shade: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

export interface POSTransaction {
  customer?: Customer;
  items: CartItem[];
  payment: PaymentInfo;
  totals: TransactionTotals;
}

export interface PaymentInfo {
  mode: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
  amount: number;
  receivedAmount?: number;
  returnAmount?: number;
  reference?: string;
  notes?: string;
}

export interface TransactionTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  roundOff?: number;
}

export interface GSTCalculation {
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Report Types
export interface SalesSummary {
  date: string;
  total_bills: number;
  total_sales: number;
  total_tax: number;
  total_discount: number;
}

export interface TopItem {
  item_id: number;
  brand: string;
  item_description: string;
  total_quantity: number;
  total_sales: number;
  bill_count: number;
}

export interface CustomerAnalysis {
  id: number;
  name: string;
  mobile: string;
  total_visits: number;
  total_spent: number;
  avg_bill_value: number;
  last_visit: string;
}

export interface GSTReport {
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
}

// Form Types
export interface ItemFormData {
  brand: string;
  style_code: string;
  item_description: string;
  size?: string;
  shade?: string;
  barcode?: string;
  ean_code?: string;
  mrp: number;
  gst_percentage: number;
  base_rate?: number;
  purchase_rate?: number;
  gender?: string;
  category?: string;
  sub_category?: string;
  hsn_code?: string;
  season?: string;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
}

export interface CustomerFormData {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  credit_limit?: number;
  customer_type?: 'RETAIL' | 'WHOLESALE';
  children?: Array<{
    name: string;
    date_of_birth: string;
  }>;
}

export interface SupplierFormData {
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
  payment_terms?: number;
  credit_limit?: number;
}

export interface PurchaseOrderFormData {
  supplier_id: number;
  expected_delivery_date?: string;
  notes?: string;
  items: Array<{
    item_id: number;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
  }>;
}

export interface PurchaseReceiptFormData {
  po_id?: number;
  supplier_id: number;
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;
  notes?: string;
  items: Array<{
    po_item_id?: number;
    item_id: number;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    batch_number?: string;
    expiry_date?: string;
    condition_status?: 'GOOD' | 'DAMAGED' | 'EXPIRED';
  }>;
}

export interface SupplierPaymentFormData {
  supplier_id: number;
  amount: number;
  payment_mode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD';
  reference_number?: string;
  notes?: string;
  receipt_ids?: number[];
}

// Search and Filter Types
export interface SearchFilters {
  searchTerm?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  dateRange?: {
    start: string;
    end: string;
  };
  customerType?: 'all' | 'RETAIL' | 'WHOLESALE';
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  printerSettings: {
    enabled: boolean;
    name: string;
    paperSize: string;
  };
  barcodeScanner: {
    enabled: boolean;
    debounceTime: number;
  };
  notifications: {
    lowStock: boolean;
    newCustomer: boolean;
    dailyReport: boolean;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Event Types
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;