import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CartItem, CustomerSummary, POSTotals } from '../utils/pos.utils';
import { calculateCartTotals, recalculateCartItem } from '../utils/pos.utils';

interface HeldBillSummary {
  holdId: string;
  createdAt: string;
  expiresAt: string;
  cashierName: string;
}

interface HeldBillSnapshot {
  cart: CartItem[];
  customer: CustomerSummary | null;
  paymentMode: string;
  receivedAmount: number;
  billDiscount: number;
  billDiscountType: 'percent' | 'amount';
  totals: POSTotals;
  timestamp: string;
}

interface POSState {
  cart: CartItem[];
  customer: CustomerSummary | null;
  paymentMode: string;
  receivedAmount: number;
  returnAmount: number;
  billDiscount: number;
  billDiscountType: 'percent' | 'amount';
  heldBills: HeldBillSummary[];
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
  holdBill: () => Promise<string>;
  recallBill: (holdId: string) => Promise<void>;
  loadHeldBills: () => Promise<void>;
  deleteHeldBill: (holdId: string) => Promise<void>;
}

let cartItemId = 1;

const normalizeHeldBillSummary = (bill: any): HeldBillSummary => ({
  holdId: String(bill.holdId ?? bill.hold_id ?? bill.id ?? ''),
  createdAt: bill.createdAt ?? bill.created_at ?? bill.timestamp ?? '',
  expiresAt: bill.expiresAt ?? bill.expires_at ?? '',
  cashierName: bill.cashierName ?? bill.cashier_name ?? '',
});

const buildHeldBillSnapshot = (state: POSState): HeldBillSnapshot => ({
  cart: state.cart,
  customer: state.customer,
  paymentMode: state.paymentMode,
  receivedAmount: state.receivedAmount,
  billDiscount: state.billDiscount,
  billDiscountType: state.billDiscountType,
  totals: state.calculateTotals(),
  timestamp: new Date().toISOString(),
});

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

      holdBill: async () => {
        const result = await window.electronAPI.holdBill(buildHeldBillSnapshot(get()));

        if (!result.success || !result.data?.holdId) {
          throw new Error(result.error || 'Error holding bill');
        }

        await get().loadHeldBills();
        return result.data.holdId;
      },

      recallBill: async (holdId) => {
        const result = await window.electronAPI.recallBill(holdId);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Error recalling held bill');
        }

        const { cart, customer, paymentMode, receivedAmount, billDiscount, billDiscountType } = result.data as HeldBillSnapshot;
        const recalledCart = cart || [];
        const recalledReceivedAmount = receivedAmount || 0;
        const recalledBillDiscount = billDiscount || 0;
        const recalledBillDiscountType = billDiscountType || 'percent';
        const recalledTotals = calculateCartTotals(
          recalledCart,
          recalledBillDiscount,
          recalledBillDiscountType
        );

        set({
          cart: recalledCart,
          customer: customer || null,
          paymentMode: paymentMode || 'CASH',
          receivedAmount: recalledReceivedAmount,
          returnAmount: Math.max(0, recalledReceivedAmount - recalledTotals.total),
          billDiscount: recalledBillDiscount,
          billDiscountType: recalledBillDiscountType,
        });
      },

      loadHeldBills: async () => {
        const result = await window.electronAPI.getHeldBills();
        if (!result.success) {
          throw new Error(result.error || 'Error loading held bills');
        }

        set({ heldBills: (result.data || []).map(normalizeHeldBillSummary).filter((bill: HeldBillSummary) => bill.holdId) });
      },

      deleteHeldBill: async (holdId) => {
        const result = await window.electronAPI.deleteHeldBill(holdId);
        if (!result.success) {
          throw new Error(result.error || 'Error deleting held bill');
        }

        set((state) => ({
          heldBills: state.heldBills.filter((bill) => bill.holdId !== holdId),
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
      }),
    }
  )
);
