import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CartItem, CustomerSummary, POSTotals } from '../utils/pos.utils';
import { calculateCartTotals, recalculateCartItem } from '../utils/pos.utils';

interface POSState {
  cart: CartItem[];
  customer: CustomerSummary | null;
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
  heldBills: Array<{
    holdId: string;
    createdAt: string;
    expiresAt: string;
    cashierName: string;
  }>;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateDiscount: (id: number, discountPercent: number) => void;
  updateSellingPrice: (id: number, price: number) => void;
  clearCart: () => void;
  setCustomer: (customer: CustomerSummary | null) => void;
  setPaymentMode: (mode: string) => void;
  setReceivedAmount: (amount: number) => void;
  setBillDiscount: (discount: number, type: 'percent' | 'amount') => void;
  calculateTotals: () => POSTotals;
  holdBill: () => string;
  recallBill: (id: string) => void;
  getHoldBills: () => Array<{ id: string; data: any; timestamp: string }>;
  clearHoldBill: (id: string) => void;
  loadHeldBills: () => Promise<void>;
  deleteHeldBill: (holdId: string) => Promise<void>;
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
      heldBills: [],

      addToCart: (item) => {
        const existingItem = get().cart.find(
          (cartItem) => cartItem.itemId === item.itemId
        );

        if (existingItem) {
          get().updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
        } else {
          const newItem: CartItem = recalculateCartItem({
            ...item,
            id: cartItemId++,
          });
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
              ? recalculateCartItem(item, { quantity })
              : item
          ),
        }));
      },

      updateDiscount: (id, discountPercent) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === id) {
              return recalculateCartItem(item, { discountPercent });
            }
            return item;
          }),
        }));
      },

      updateSellingPrice: (id, price) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === id) {
              return recalculateCartItem(item, { sellingPrice: price });
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
          billDiscountType: 'percent',
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
        return calculateCartTotals(cart, billDiscount, billDiscountType);
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

      loadHeldBills: async () => {
        try {
          const result = await window.electronAPI.getHeldBills();
          if (result.success) {
            set({ heldBills: result.data || [] });
          }
        } catch (error) {
          console.error('Error loading held bills:', error);
        }
      },

      deleteHeldBill: async (holdId) => {
        try {
          const result = await window.electronAPI.deleteHeldBill(holdId);
          if (result.success) {
            set((state) => ({
              heldBills: state.heldBills.filter((bill) => bill.holdId !== holdId),
            }));
          }
        } catch (error) {
          console.error('Error deleting held bill:', error);
        }
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