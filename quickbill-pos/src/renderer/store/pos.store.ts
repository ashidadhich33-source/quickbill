import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
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

interface Customer {
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

interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface POSState {
  cart: CartItem[];
  customer: Customer | null;
  paymentMode: string;
  receivedAmount: number;
  returnAmount: number;
  billDiscount: number;
  billDiscountType: 'percent' | 'amount';
  holdBills: Array<{
    id: string;
    data: any;
    timestamp: string;
  }>;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateDiscount: (id: number, discountPercent: number) => void;
  updateSellingPrice: (id: number, price: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setPaymentMode: (mode: string) => void;
  setReceivedAmount: (amount: number) => void;
  setBillDiscount: (discount: number, type: 'percent' | 'amount') => void;
  calculateTotals: () => Totals;
  holdBill: () => void;
  recallBill: (id: string) => void;
  getHoldBills: () => Array<{ id: string; data: any; timestamp: string }>;
  clearHoldBill: (id: string) => void;
}

let cartItemId = 1;

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      paymentMode: 'CASH',
      receivedAmount: 0,
      returnAmount: 0,
      billDiscount: 0,
      billDiscountType: 'percent',
      holdBills: [],

      addToCart: (item) => {
        const existingItem = get().cart.find(
          (cartItem) => cartItem.barcode === item.barcode
        );

        if (existingItem) {
          get().updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
        } else {
          const newItem: CartItem = {
            ...item,
            id: cartItemId++,
          };
          set((state) => ({
            cart: [...state.cart, newItem],
          }));
        }
      },

      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity,
                  discountAmount: (item.sellingPrice * quantity * item.discountPercent) / 100,
                  gstAmount: ((item.sellingPrice * quantity - (item.sellingPrice * quantity * item.discountPercent) / 100) * item.gstPercent) / 100,
                  total: item.sellingPrice * quantity - (item.sellingPrice * quantity * item.discountPercent) / 100 + ((item.sellingPrice * quantity - (item.sellingPrice * quantity * item.discountPercent) / 100) * item.gstPercent) / 100,
                }
              : item
          ),
        }));
      },

      updateDiscount: (id, discountPercent) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === id) {
              const discountAmount = (item.sellingPrice * item.quantity * discountPercent) / 100;
              const taxableAmount = item.sellingPrice * item.quantity - discountAmount;
              const gstAmount = (taxableAmount * item.gstPercent) / 100;
              const total = taxableAmount + gstAmount;

              return {
                ...item,
                discountPercent,
                discountAmount,
                gstAmount,
                total,
              };
            }
            return item;
          }),
        }));
      },

      updateSellingPrice: (id, price) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === id) {
              const discountAmount = (price * item.quantity * item.discountPercent) / 100;
              const taxableAmount = price * item.quantity - discountAmount;
              const gstAmount = (taxableAmount * item.gstPercent) / 100;
              const total = taxableAmount + gstAmount;

              return {
                ...item,
                sellingPrice: price,
                discountAmount,
                gstAmount,
                total,
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () => {
        set({
          cart: [],
          customer: null,
          paymentMode: 'CASH',
          receivedAmount: 0,
          returnAmount: 0,
          billDiscount: 0,
        });
      },

      setCustomer: (customer) => {
        set({ customer });
      },

      setPaymentMode: (mode) => {
        set({ paymentMode: mode });
      },

      setReceivedAmount: (amount) => {
        const totals = get().calculateTotals();
        set({
          receivedAmount: amount,
          returnAmount: Math.max(0, amount - totals.total),
        });
      },

      setBillDiscount: (discount, type) => {
        set({
          billDiscount: discount,
          billDiscountType: type,
        });
      },

      calculateTotals: () => {
        const { cart, billDiscount, billDiscountType } = get();
        
        const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        let discount = 0;
        if (billDiscount > 0) {
          if (billDiscountType === 'percent') {
            discount = (subtotal * billDiscount) / 100;
          } else {
            discount = billDiscount;
          }
        }
        
        const taxableAmount = subtotal - discount;
        const tax = cart.reduce((sum, item) => sum + item.gstAmount, 0);
        const total = taxableAmount;

        return {
          subtotal,
          discount,
          tax,
          total,
        };
      },

      holdBill: () => {
        const { cart, customer, paymentMode, receivedAmount, billDiscount, billDiscountType } = get();
        const totals = get().calculateTotals();
        
        const billData = {
          cart,
          customer,
          paymentMode,
          receivedAmount,
          billDiscount,
          billDiscountType,
          totals,
          timestamp: new Date().toISOString(),
        };

        const holdId = `hold_${Date.now()}`;
        
        set((state) => ({
          holdBills: [...state.holdBills, { id: holdId, data: billData, timestamp: new Date().toISOString() }],
        }));

        return holdId;
      },

      recallBill: (id) => {
        const holdBill = get().holdBills.find((bill) => bill.id === id);
        if (holdBill) {
          const { cart, customer, paymentMode, receivedAmount, billDiscount, billDiscountType } = holdBill.data;
          
          set({
            cart,
            customer,
            paymentMode,
            receivedAmount,
            billDiscount,
            billDiscountType,
          });
        }
      },

      getHoldBills: () => {
        return get().holdBills;
      },

      clearHoldBill: (id) => {
        set((state) => ({
          holdBills: state.holdBills.filter((bill) => bill.id !== id),
        }));
      },
    }),
    {
      name: 'quickbill-pos-storage',
      partialize: (state) => ({
        cart: state.cart,
        customer: state.customer,
        paymentMode: state.paymentMode,
        receivedAmount: state.receivedAmount,
        returnAmount: state.returnAmount,
        billDiscount: state.billDiscount,
        billDiscountType: state.billDiscountType,
        holdBills: state.holdBills,
      }),
    }
  )
);