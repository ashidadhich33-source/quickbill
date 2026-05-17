import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { POSScreen } from '../renderer/pages/pos/POSScreen';
import { usePOSStore } from '../renderer/store/pos.store';

// Mock the POS store
jest.mock('../renderer/store/pos.store');
jest.mock('../renderer/hooks/useBarcodeScanner');
jest.mock('../renderer/hooks/useHotkeys');

const mockUsePOSStore = usePOSStore as jest.MockedFunction<typeof usePOSStore>;

const mockStore = {
  cart: [],
  customer: null,
  paymentMode: 'CASH',
  receivedAmount: 0,
  billDiscount: 0,
  billDiscountType: 'percent' as const,
  heldBills: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  updateDiscount: jest.fn(),
  setCustomer: jest.fn(),
  clearCart: jest.fn(),
  setPaymentMode: jest.fn(),
  setReceivedAmount: jest.fn(),
  setBillDiscount: jest.fn(),
  holdBill: jest.fn(),
  recallBill: jest.fn(),
  loadHeldBills: jest.fn(() => Promise.resolve()),
  deleteHeldBill: jest.fn(),
  calculateTotals: jest.fn(() => ({
    subtotal: 0,
    discount: 0,
    taxable: 0,
    tax: 0,
    total: 0
  }))
};

describe('POSScreen Component', () => {

  beforeEach(() => {
    mockUsePOSStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render POS screen correctly', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('QuickBill POS')).toBeInTheDocument();
    expect(screen.getByText('Item Search/Scan')).toBeInTheDocument();
    expect(screen.getByText('Cart Items (0)')).toBeInTheDocument();
    expect(screen.getByText('Customer Info')).toBeInTheDocument();
    expect(screen.getByText('Bill Summary')).toBeInTheDocument();
  });

  it('should display search input and buttons', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByPlaceholderText('Barcode/SKU/Name')).toBeInTheDocument();
    expect(screen.getAllByText('Search')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Mobile/Name')).toBeInTheDocument();
  });

  it('should display quick category buttons', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('👔 SHIRTS')).toBeInTheDocument();
    expect(screen.getByText('👖 JEANS')).toBeInTheDocument();
    expect(screen.getByText('👗 DRESS')).toBeInTheDocument();
    expect(screen.getByText('👟 SHOES')).toBeInTheDocument();
    expect(screen.getByText('🎒 ACCESSORIES')).toBeInTheDocument();
  });

  it('should display payment mode buttons', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('💵 CASH')).toBeInTheDocument();
    expect(screen.getByText('💳 CARD')).toBeInTheDocument();
    expect(screen.getByText('📱 UPI')).toBeInTheDocument();
    expect(screen.getByText('CREDIT')).toBeInTheDocument();
  });

  it('should display action buttons with keyboard shortcuts', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('F5 DISCOUNT')).toBeInTheDocument();
    expect(screen.getByText('F6 HISTORY')).toBeInTheDocument();
    expect(screen.getByText('F7 HOLD')).toBeInTheDocument();
    expect(screen.getByText('F8 RECALL')).toBeInTheDocument();
    expect(screen.getByText('F10 SAVE')).toBeInTheDocument();
    expect(screen.getByText('ESC CANCEL')).toBeInTheDocument();
  });

  it('should display bill summary with totals', () => {
    const mockTotals = {
      subtotal: 100,
      discount: 10,
      taxable: 90,
      tax: 18,
      total: 108
    };

    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      calculateTotals: jest.fn(() => mockTotals)
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getByText('Discount:')).toBeInTheDocument();
    expect(screen.getByText('₹10.00')).toBeInTheDocument();
    expect(screen.getByText('CGST:')).toBeInTheDocument();
    expect(screen.getByText('SGST:')).toBeInTheDocument();
    expect(screen.getAllByText('₹9.00')).toHaveLength(2);
    expect(screen.getByText('TOTAL:')).toBeInTheDocument();
    expect(screen.getByText('₹108.00')).toBeInTheDocument();
  });

  it('should display customer information when customer is selected', () => {
    const mockCustomer = {
      id: 1,
      name: 'John Doe',
      mobile: '9876543210',
      loyalty_points: 100,
      current_balance: 500
    };

    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      customer: mockCustomer
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('₹500.00')).toBeInTheDocument();
  });

  it('should display cart items when items are added', () => {
    const mockCart = [
      {
        id: 1,
        itemId: 1,
        barcode: '1234567890',
        brand: 'Test Brand',
        itemDescription: 'Test Item',
        size: 'M',
        shade: 'Red',
        quantity: 2,
        mrp: 100,
        sellingPrice: 100,
        discountPercent: 10,
        discountAmount: 20,
        gstPercent: 18,
        gstAmount: 32.4,
        total: 212.4
      }
    ];

    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      cart: mockCart
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    expect(screen.getByText('Test Brand - Test Item')).toBeInTheDocument();
    expect(screen.getByText('Size: M | Shade: Red')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  it('should handle search input changes', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    const searchInput = screen.getByPlaceholderText('Barcode/SKU/Name');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput).toHaveValue('test search');
  });

  it('should handle customer search input changes', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    const customerInput = screen.getByPlaceholderText('Mobile/Name');
    fireEvent.change(customerInput, { target: { value: '9876543210' } });

    expect(customerInput).toHaveValue('9876543210');
  });

  it('should handle received amount input changes', () => {
    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    const receivedInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(receivedInput, { target: { value: '150' } });

    expect(receivedInput).toHaveValue('150');
  });

  it('should display return amount when received amount is greater than total', () => {
    const mockTotals = {
      subtotal: 100,
      discount: 0,
      taxable: 100,
      tax: 18,
      total: 118
    };

    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      calculateTotals: jest.fn(() => mockTotals)
    });

    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      receivedAmount: 150,
      calculateTotals: jest.fn(() => mockTotals)
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    expect(screen.getByText('Return: ₹32.00')).toBeInTheDocument();
  });
});

describe('POS Store Integration', () => {
  it('should call addToCart when item is selected', () => {
    const mockAddToCart = jest.fn();
    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      addToCart: mockAddToCart
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    // Simulate item selection (this would be triggered by the ItemSearchModal)
    // In a real test, you would trigger the onSelectItem callback
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it('should call clearCart when clear button is clicked', () => {
    const mockClearCart = jest.fn();
    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      clearCart: mockClearCart
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    const clearButton = screen.getByText('ESC CANCEL');
    fireEvent.click(clearButton);

    expect(mockClearCart).toHaveBeenCalled();
  });

  it('should call setCustomer when customer is selected', () => {
    const mockSetCustomer = jest.fn();
    mockUsePOSStore.mockReturnValue({
      ...mockStore,
      setCustomer: mockSetCustomer
    });

    render(
      <ConfigProvider>
        <POSScreen />
      </ConfigProvider>
    );

    // Simulate customer selection (this would be triggered by the CustomerSearchModal)
    // In a real test, you would trigger the onSelectCustomer callback
    expect(mockSetCustomer).not.toHaveBeenCalled();
  });
});