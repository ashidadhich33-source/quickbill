// Currency formatting
export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  return `${currency}${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Number formatting
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Date formatting
export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  const d = new Date(date);
  
  if (format === 'DD/MM/YYYY') {
    return d.toLocaleDateString('en-GB');
  } else if (format === 'MM/DD/YYYY') {
    return d.toLocaleDateString('en-US');
  } else if (format === 'YYYY-MM-DD') {
    return d.toISOString().split('T')[0];
  } else if (format === 'DD-MM-YYYY') {
    return d.toLocaleDateString('en-GB').replace(/\//g, '-');
  }
  
  return d.toLocaleDateString();
};

// Time formatting
export const formatTime = (date: string | Date, format: string = '12h'): string => {
  const d = new Date(date);
  
  if (format === '12h') {
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else {
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
};

// DateTime formatting
export const formatDateTime = (date: string | Date, dateFormat: string = 'DD/MM/YYYY', timeFormat: string = '12h'): string => {
  return `${formatDate(date, dateFormat)} ${formatTime(date, timeFormat)}`;
};

// Phone number formatting
export const formatPhone = (phone: string): string => {
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

// GST number formatting
export const formatGST = (gst: string): string => {
  if (gst.length === 15) {
    return `${gst.slice(0, 2)}${gst.slice(2, 7)}${gst.slice(7, 11)}${gst.slice(11, 12)}${gst.slice(12, 13)}${gst.slice(13, 14)}${gst.slice(14)}`;
  }
  return gst;
};

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Invoice number formatting
export const formatInvoiceNumber = (prefix: string, number: number): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const invoiceNum = String(number).padStart(6, '0');
  return `${prefix}-${year}${month}-${invoiceNum}`;
};

// Barcode formatting
export const formatBarcode = (barcode: string): string => {
  // Add spaces every 4 digits for better readability
  return barcode.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// Address formatting
export const formatAddress = (address: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}): string => {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Truncate text
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Format name (Title Case)
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Format mobile number with country code
export const formatMobileWithCountryCode = (mobile: string, countryCode: string = '+91'): string => {
  if (mobile.startsWith('+')) return mobile;
  return `${countryCode} ${mobile}`;
};

// Format HSN code
export const formatHSN = (hsn: string): string => {
  if (hsn.length >= 4) {
    return `${hsn.slice(0, 4)} ${hsn.slice(4)}`;
  }
  return hsn;
};

// Format stock status
export const formatStockStatus = (current: number, min: number, max: number): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  text: string;
  color: string;
} => {
  if (current === 0) {
    return { status: 'out_of_stock', text: 'Out of Stock', color: 'red' };
  } else if (current <= min) {
    return { status: 'low_stock', text: 'Low Stock', color: 'orange' };
  } else if (current >= max) {
    return { status: 'overstock', text: 'Overstock', color: 'blue' };
  } else {
    return { status: 'in_stock', text: 'In Stock', color: 'green' };
  }
};

// Format customer type
export const formatCustomerType = (type: string): {
  text: string;
  color: string;
} => {
  switch (type) {
    case 'RETAIL':
      return { text: 'Retail', color: 'blue' };
    case 'WHOLESALE':
      return { text: 'Wholesale', color: 'green' };
    default:
      return { text: type, color: 'default' };
  }
};

// Format payment mode
export const formatPaymentMode = (mode: string): {
  text: string;
  icon: string;
  color: string;
} => {
  switch (mode) {
    case 'CASH':
      return { text: 'Cash', icon: '💵', color: 'green' };
    case 'CARD':
      return { text: 'Card', icon: '💳', color: 'blue' };
    case 'UPI':
      return { text: 'UPI', icon: '📱', color: 'purple' };
    case 'CREDIT':
      return { text: 'Credit', icon: '📋', color: 'orange' };
    default:
      return { text: mode, icon: '💰', color: 'default' };
  }
};