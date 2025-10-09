import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Input, Button, Table, Card, Row, Col, Space, Modal,
  message, Divider, Tag, InputNumber, Select, Statistic, Typography
} from 'antd';
import {
  SearchOutlined, UserAddOutlined, DeleteOutlined,
  PrinterOutlined, SaveOutlined, CloseOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { usePOSStore } from '../../store/pos.store';
import { useHotkeys } from '../../hooks/useHotkeys';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import ItemSearchModal from './components/ItemSearchModal';
import CustomerSearchModal from './components/CustomerSearchModal';
import PaymentModal from './components/PaymentModal';
import './POSScreen.css';

const { Title, Text } = Typography;

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

const POSScreen: React.FC = () => {
  const {
    cart,
    customer,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateDiscount,
    setCustomer,
    clearCart,
    calculateTotals
  } = usePOSStore();

  const [searchValue, setSearchValue] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);

  const searchInputRef = useRef<any>(null);
  const totals = calculateTotals();

  // Barcode Scanner Hook
  useBarcodeScanner((barcode: string) => {
    handleBarcodeScanned(barcode);
  });

  // Keyboard Shortcuts
  useHotkeys({
    'F2': () => clearCart(),
    'F3': () => setShowItemSearch(true),
    'F4': () => setShowCustomerSearch(true),
    'F5': () => applyBillDiscount(),
    'F6': () => showCustomerHistory(),
    'F7': () => holdBill(),
    'F8': () => recallBill(),
    'F9': () => setShowPayment(true),
    'F10': () => saveBill(),
    'Escape': () => cancelOperation(),
    'Delete': () => removeSelectedItem(),
    'Enter': () => processEnter()
  });

  // Auto-focus on search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [cart]);

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const result = await window.electronAPI.findItemByBarcode(barcode);
      if (result.success && result.data) {
        const item = result.data;
        const existingItem = cart.find(i => i.barcode === barcode);
        
        if (existingItem) {
          updateQuantity(existingItem.id, existingItem.quantity + 1);
        } else {
          addToCart({
            ...item,
            quantity: 1,
            sellingPrice: item.mrp,
            discountPercent: 0,
            discountAmount: 0,
            gstAmount: (item.mrp * item.gst_percentage) / 100,
            total: item.mrp
          });
        }
        message.success(`Added: ${item.item_description}`);
      } else {
        message.error('Item not found');
      }
    } catch (error) {
      message.error('Error scanning item');
    }
    setSearchValue('');
  };

  const handleQuickCategory = async (category: string) => {
    try {
      const result = await window.electronAPI.getItemsByCategory(category);
      if (result.success) {
        setShowItemSearch(true);
        // Pass filtered items to modal
      }
    } catch (error) {
      message.error('Error loading category items');
    }
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity > 0) {
      updateQuantity(itemId, quantity);
    }
  };

  const handleDiscountChange = (itemId: number, discount: number) => {
    if (discount >= 0 && discount <= 100) {
      updateDiscount(itemId, discount);
    }
  };

  const saveBill = async () => {
    if (cart.length === 0) {
      message.warning('Cart is empty');
      return;
    }

    try {
      const billData = {
        customer: customer,
        items: cart,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paymentMode: paymentMode,
        paidAmount: receivedAmount || totals.total
      };

      const result = await window.electronAPI.saveSale(billData);
      if (result.success) {
        message.success(`Bill saved: ${result.invoiceNumber}`);
        printBill(result.invoiceNumber);
        clearCart();
        setCustomer(null);
        setReceivedAmount(0);
      }
    } catch (error) {
      message.error('Error saving bill');
    }
  };

  const printBill = async (invoiceNumber: string) => {
    try {
      await window.electronAPI.printInvoice(invoiceNumber);
    } catch (error) {
      message.error('Error printing bill');
    }
  };

  const applyBillDiscount = () => {
    // Implementation for bill-level discount
    message.info('Bill discount feature coming soon');
  };

  const showCustomerHistory = () => {
    if (customer) {
      message.info(`Customer history for ${customer.name}`);
    } else {
      message.warning('No customer selected');
    }
  };

  const holdBill = () => {
    message.info('Bill hold feature coming soon');
  };

  const recallBill = () => {
    message.info('Bill recall feature coming soon');
  };

  const cancelOperation = () => {
    setShowItemSearch(false);
    setShowCustomerSearch(false);
    setShowPayment(false);
    setSelectedRow(null);
  };

  const removeSelectedItem = () => {
    if (selectedRow !== null) {
      removeFromCart(selectedRow);
      setSelectedRow(null);
    }
  };

  const processEnter = () => {
    if (searchValue.trim()) {
      handleBarcodeScanned(searchValue.trim());
    }
  };

  // Cart Table Columns
  const columns = [
    {
      title: '#',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Item',
      dataIndex: 'itemDescription',
      render: (text: string, record: CartItem) => (
        <div>
          <div><strong>{record.brand} - {text}</strong></div>
          <small>Size: {record.size} | Shade: {record.shade}</small>
        </div>
      )
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      width: 120
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      width: 80,
      render: (qty: number, record: CartItem) => (
        <InputNumber
          min={1}
          value={qty}
          onChange={(value) => handleQuantityChange(record.id, value || 1)}
          onKeyPress={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      width: 100,
      render: (price: number) => `₹${price.toFixed(2)}`
    },
    {
      title: 'Disc%',
      dataIndex: 'discountPercent',
      width: 80,
      render: (discount: number, record: CartItem) => (
        <InputNumber
          min={0}
          max={100}
          value={discount}
          onChange={(value) => handleDiscountChange(record.id, value || 0)}
          onKeyPress={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: 'Total',
      dataIndex: 'total',
      width: 100,
      render: (total: number) => `₹${total.toFixed(2)}`
    },
    {
      title: 'Action',
      width: 60,
      render: (_: any, record: CartItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
        />
      )
    }
  ];

  return (
    <div className="pos-screen">
      {/* Header */}
      <div className="pos-header">
        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            QuickBill POS
          </Title>
        </div>
        <div>
          <Space>
            <Text style={{ color: 'white' }}>Cashier: Admin</Text>
            <Text style={{ color: 'white' }}>|</Text>
            <Text style={{ color: 'white' }}>Terminal: POS-01</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="pos-content">
        <div className="pos-main">
          {/* Left Section */}
          <div className="pos-left">
            {/* Search Section */}
            <Card title="Item Search/Scan" className="search-section">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={searchInputRef}
                  placeholder="Barcode/SKU/Name"
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={processEnter}
                />
                <Button type="primary" onClick={() => setShowItemSearch(true)}>
                  Search
                </Button>
              </Space.Compact>

              <div className="quick-keys">
                <Button className="quick-key-btn" onClick={() => handleQuickCategory('SHIRTS')}>
                  👔 SHIRTS
                </Button>
                <Button className="quick-key-btn" onClick={() => handleQuickCategory('JEANS')}>
                  👖 JEANS
                </Button>
                <Button className="quick-key-btn" onClick={() => handleQuickCategory('DRESS')}>
                  👗 DRESS
                </Button>
                <Button className="quick-key-btn" onClick={() => handleQuickCategory('SHOES')}>
                  👟 SHOES
                </Button>
                <Button className="quick-key-btn" onClick={() => handleQuickCategory('ACCESSORIES')}>
                  🎒 ACCESSORIES
                </Button>
              </div>
            </Card>

            {/* Cart Section */}
            <Card 
              title={`Cart Items (${cart.length})`} 
              className="cart-section"
              extra={
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setShowItemSearch(true)}
                >
                  Add Items
                </Button>
              }
            >
              <div className="cart-table">
                <Table
                  columns={columns}
                  dataSource={cart}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                  onRow={(record) => ({
                    onClick: () => setSelectedRow(record.id),
                    className: selectedRow === record.id ? 'selected-row' : ''
                  })}
                />
              </div>
            </Card>
          </div>

          {/* Right Section */}
          <div className="pos-right">
            {/* Customer Section */}
            <Card title="Customer Info" className="search-section">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Mobile/Name"
                  prefix="📱"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                <Button type="primary" onClick={() => setShowCustomerSearch(true)}>
                  Search
                </Button>
                <Button icon={<UserAddOutlined />} onClick={() => setShowCustomerSearch(true)}>
                  New
                </Button>
              </Space.Compact>

              {customer && (
                <div style={{ marginTop: 15 }}>
                  <div><strong>Name:</strong> {customer.name}</div>
                  <div><strong>Mobile:</strong> {customer.mobile}</div>
                  <div><strong>Points:</strong> {customer.loyalty_points || 0}</div>
                  <div><strong>Credit:</strong> ₹{(customer.current_balance || 0).toFixed(2)}</div>
                </div>
              )}
            </Card>

            {/* Bill Summary */}
            <Card title="Bill Summary" className="bill-summary">
              <div className="bill-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Discount:</span>
                  <span>₹{totals.discount.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Taxable:</span>
                  <span>₹{(totals.subtotal - totals.discount).toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>CGST (9%):</span>
                  <span>₹{(totals.tax / 2).toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>SGST (9%):</span>
                  <span>₹{(totals.tax / 2).toFixed(2)}</span>
                </div>
                <Divider />
                <div className="total-line total-final">
                  <span>TOTAL:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Payment Section */}
            <Card title="Payment & Actions" className="payment-section">
              <div className="payment-modes">
                <Button
                  className={`payment-mode-btn ${paymentMode === 'CASH' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('CASH')}
                >
                  💵 CASH
                </Button>
                <Button
                  className={`payment-mode-btn ${paymentMode === 'CARD' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('CARD')}
                >
                  💳 CARD
                </Button>
                <Button
                  className={`payment-mode-btn ${paymentMode === 'UPI' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('UPI')}
                >
                  📱 UPI
                </Button>
                <Button
                  className={`payment-mode-btn ${paymentMode === 'CREDIT' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('CREDIT')}
                >
                  CREDIT
                </Button>
              </div>

              <div style={{ marginBottom: 15 }}>
                <Text>Received: </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter amount"
                  value={receivedAmount}
                  onChange={(value) => setReceivedAmount(value || 0)}
                />
                {receivedAmount > 0 && (
                  <div style={{ marginTop: 5, textAlign: 'right' }}>
                    <Text>Return: ₹{(receivedAmount - totals.total).toFixed(2)}</Text>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <Button className="action-btn" onClick={applyBillDiscount}>
                  F5 DISCOUNT
                </Button>
                <Button className="action-btn" onClick={showCustomerHistory}>
                  F6 HISTORY
                </Button>
                <Button className="action-btn" onClick={holdBill}>
                  F7 HOLD
                </Button>
                <Button className="action-btn" onClick={recallBill}>
                  F8 RECALL
                </Button>
                <Button className="action-btn" type="primary" onClick={saveBill}>
                  F10 SAVE
                </Button>
                <Button className="action-btn" danger onClick={clearCart}>
                  ESC CANCEL
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>Ready</span>
        </div>
        <div>
          <span>Last Bill: #INV-2024-001234</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>Today's Sale: ₹45,230</span>
        </div>
      </div>

      {/* Modals */}
      <ItemSearchModal
        visible={showItemSearch}
        onClose={() => setShowItemSearch(false)}
        onSelectItem={(item) => {
          addToCart({
            ...item,
            quantity: 1,
            sellingPrice: item.mrp,
            discountPercent: 0,
            discountAmount: 0,
            gstAmount: (item.mrp * item.gst_percentage) / 100,
            total: item.mrp
          });
          setShowItemSearch(false);
        }}
      />

      <CustomerSearchModal
        visible={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelectCustomer={(customer) => {
          setCustomer(customer);
          setShowCustomerSearch(false);
        }}
      />

      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        total={totals.total}
        onPayment={(paymentData) => {
          // Handle payment
          setShowPayment(false);
        }}
      />
    </div>
  );
};

export default POSScreen;