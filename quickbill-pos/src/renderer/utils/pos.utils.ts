export interface POSCatalogItem {
  id: number;
  brand?: string;
  style_code?: string;
  item_description?: string;
  size?: string | null;
  shade?: string | null;
  barcode?: string | null;
  mrp: number;
  gst_percentage: number;
  current_stock?: number;
}

export interface CartItem {
  id: number;
  itemId: number;
  barcode: string;
  brand: string;
  styleCode: string;
  itemName: string;
  itemDescription: string;
  size: string;
  shade: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  taxableAmount: number;
  total: number;
}

export interface CustomerSummary {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  current_balance: number;
  loyalty_points: number;
  customer_type: string;
}

export interface POSTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export interface SaleLineItem {
  itemId: number;
  barcode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  taxableAmount: number;
  total: number;
}

export interface SalePayload {
  customer: CustomerSummary | null;
  items: SaleLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
}

export const roundCurrency = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100;

export const calculateInclusiveGSTLine = (
  sellingPrice: number,
  quantity: number,
  discountPercent: number,
  gstPercent: number
) => {
  const grossAmount = sellingPrice * quantity;
  const discountAmount = roundCurrency((grossAmount * discountPercent) / 100);
  const total = roundCurrency(grossAmount - discountAmount);
  const taxableAmount = gstPercent > 0
    ? roundCurrency(total / (1 + gstPercent / 100))
    : total;
  const gstAmount = roundCurrency(total - taxableAmount);

  return {
    discountAmount,
    taxableAmount,
    gstAmount,
    total,
  };
};

export const createCartItemFromCatalogItem = (
  item: POSCatalogItem,
  quantity: number = 1
): Omit<CartItem, 'id'> => {
  const sellingPrice = Number(item.mrp) || 0;
  const gstPercent = Number(item.gst_percentage) || 0;
  const calculation = calculateInclusiveGSTLine(sellingPrice, quantity, 0, gstPercent);
  const itemName = item.item_description || `${item.brand || ''} ${item.style_code || ''}`.trim() || 'Unknown Item';

  return {
    itemId: item.id,
    barcode: item.barcode || '',
    brand: item.brand || '',
    styleCode: item.style_code || '',
    itemName,
    itemDescription: itemName,
    size: item.size || '',
    shade: item.shade || '',
    quantity,
    mrp: sellingPrice,
    sellingPrice,
    unitPrice: sellingPrice,
    discountPercent: 0,
    discountAmount: calculation.discountAmount,
    gstPercent,
    gstAmount: calculation.gstAmount,
    taxableAmount: calculation.taxableAmount,
    total: calculation.total,
  };
};

export const recalculateCartItem = (
  item: CartItem,
  changes: Partial<Pick<CartItem, 'quantity' | 'sellingPrice' | 'discountPercent'>> = {}
): CartItem => {
  const updated = {
    ...item,
    ...changes,
  };
  const calculation = calculateInclusiveGSTLine(
    Number(updated.sellingPrice) || 0,
    Number(updated.quantity) || 0,
    Number(updated.discountPercent) || 0,
    Number(updated.gstPercent) || 0
  );

  return {
    ...updated,
    unitPrice: Number(updated.sellingPrice) || 0,
    discountAmount: calculation.discountAmount,
    taxableAmount: calculation.taxableAmount,
    gstAmount: calculation.gstAmount,
    total: calculation.total,
  };
};

export const calculateCartTotals = (
  cart: CartItem[],
  billDiscount: number,
  billDiscountType: 'percent' | 'amount'
): POSTotals => {
  const itemGrossSubtotal = roundCurrency(cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0));
  const itemDiscount = roundCurrency(cart.reduce((sum, item) => sum + item.discountAmount, 0));
  const itemNetTotal = roundCurrency(cart.reduce((sum, item) => sum + item.total, 0));

  let billDiscountAmount = 0;
  if (billDiscount > 0) {
    billDiscountAmount = billDiscountType === 'percent'
      ? roundCurrency((itemNetTotal * billDiscount) / 100)
      : roundCurrency(Math.min(billDiscount, itemNetTotal));
  }

  const discount = roundCurrency(itemDiscount + billDiscountAmount);
  const total = roundCurrency(itemNetTotal - billDiscountAmount);
  const tax = total > 0 && itemNetTotal > 0
    ? roundCurrency(cart.reduce((sum, item) => sum + item.gstAmount, 0) * (total / itemNetTotal))
    : 0;
  const taxable = roundCurrency(total - tax);

  return {
    subtotal: itemGrossSubtotal,
    discount,
    taxable,
    tax,
    total,
  };
};

export const buildSalePayload = ({
  cart,
  customer,
  totals,
  paymentMode,
  receivedAmount,
}: {
  cart: CartItem[];
  customer: CustomerSummary | null;
  totals: POSTotals;
  paymentMode: string;
  receivedAmount: number;
}): SalePayload => {
  const paidAmount = paymentMode === 'CREDIT'
    ? roundCurrency(receivedAmount || 0)
    : roundCurrency(receivedAmount || totals.total);

  return {
    customer,
    items: cart.map((item) => ({
      itemId: item.itemId,
      barcode: item.barcode,
      itemName: item.itemName || item.itemDescription,
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.sellingPrice,
      discountPercent: item.discountPercent,
      discountAmount: item.discountAmount,
      gstPercent: item.gstPercent,
      gstAmount: item.gstAmount,
      taxableAmount: item.taxableAmount,
      total: item.total,
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    paidAmount,
    balanceAmount: roundCurrency(Math.max(0, totals.total - paidAmount)),
    paymentMode,
  };
};
