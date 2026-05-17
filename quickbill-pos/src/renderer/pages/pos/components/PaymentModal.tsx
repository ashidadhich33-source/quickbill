import React, { useState, useEffect } from 'react';
import {
  Modal, Input, Button, Space, Form, InputNumber, Radio, message, Divider
} from 'antd';
import { CreditCardOutlined, DollarOutlined, MobileOutlined } from '@ant-design/icons';

interface PaymentData {
  mode: string;
  amount: number;
  reference?: string;
  notes?: string;
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  total: number;
  onPayment: (paymentData: PaymentData) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  total,
  onPayment
}) => {
  const [form] = Form.useForm();
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [returnAmount, setReturnAmount] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      setReceivedAmount(total);
      setReturnAmount(0);
      form.setFieldsValue({
        mode: 'CASH',
        amount: total,
        received: total
      });
    }
  }, [visible, total, form]);

  const handleModeChange = (e: any) => {
    const mode = e.target.value;
    setPaymentMode(mode);
    form.setFieldsValue({ mode });
    
    if (mode === 'CASH') {
      setReceivedAmount(total);
      setReturnAmount(0);
    } else {
      setReceivedAmount(total);
      setReturnAmount(0);
    }
  };

  const handleReceivedChange = (value: number | null) => {
    const received = value || 0;
    setReceivedAmount(received);
    setReturnAmount(Math.max(0, received - total));
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const paymentData: PaymentData = {
        mode: values.mode,
        amount: values.amount,
        reference: values.reference,
        notes: values.notes
      };
      
      onPayment(paymentData);
    });
  };

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount);
    setReturnAmount(Math.max(0, amount - total));
    form.setFieldsValue({ received: amount });
  };

  const paymentModes = [
    { value: 'CASH', label: 'Cash', icon: <DollarOutlined /> },
    { value: 'CARD', label: 'Card', icon: <CreditCardOutlined /> },
    { value: 'UPI', label: 'UPI', icon: <MobileOutlined /> },
    { value: 'CREDIT', label: 'Credit', icon: <CreditCardOutlined /> },
  ];

  return (
    <Modal
      title="Payment"
      open={visible}
      onCancel={onClose}
      width={500}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={receivedAmount < total && paymentMode !== 'CREDIT'}
        >
          Process Payment
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          mode: 'CASH',
          amount: total,
          received: total
        }}
      >
        <Form.Item label="Total Amount">
          <InputNumber
            value={total}
            disabled
            style={{ width: '100%' }}
            prefix="₹"
            formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        </Form.Item>

        <Form.Item
          name="mode"
          label="Payment Mode"
          rules={[{ required: true, message: 'Please select payment mode' }]}
        >
          <Radio.Group onChange={handleModeChange}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {paymentModes.map(mode => (
                <Radio key={mode.value} value={mode.value}>
                  <Space>
                    {mode.icon}
                    {mode.label}
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>

        {paymentMode === 'CASH' && (
          <>
            <Form.Item
              name="received"
              label="Amount Received"
              rules={[{ required: true, message: 'Please enter received amount' }]}
            >
              <InputNumber
                value={receivedAmount}
                onChange={handleReceivedChange}
                style={{ width: '100%' }}
                prefix="₹"
                formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/₹\s?|(,*)/g, '') || 0)}
              />
            </Form.Item>

            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button onClick={() => handleQuickAmount(total)}>
                  Exact
                </Button>
                <Button onClick={() => handleQuickAmount(Math.ceil(total / 100) * 100)}>
                  Round Up
                </Button>
                <Button onClick={() => handleQuickAmount(total + 100)}>
                  +100
                </Button>
                <Button onClick={() => handleQuickAmount(total + 500)}>
                  +500
                </Button>
              </Space>
            </div>

            {returnAmount > 0 && (
              <Form.Item label="Return Amount">
                <InputNumber
                  value={returnAmount}
                  disabled
                  style={{ width: '100%' }}
                  prefix="₹"
                  formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            )}
          </>
        )}

        {(paymentMode === 'CARD' || paymentMode === 'UPI') && (
          <Form.Item
            name="reference"
            label="Reference Number"
            rules={[{ required: true, message: 'Please enter reference number' }]}
          >
            <Input placeholder="Enter transaction reference" />
          </Form.Item>
        )}

        {paymentMode === 'CREDIT' && (
          <div style={{ 
            padding: 16, 
            background: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: 6,
            marginBottom: 16
          }}>
            <p style={{ margin: 0, color: '#d46b08' }}>
              <strong>Credit Sale:</strong> Amount will be added to customer&apos;s account balance.
            </p>
          </div>
        )}

        <Form.Item
          name="notes"
          label="Notes (Optional)"
        >
          <Input.TextArea
            rows={3}
            placeholder="Add any payment notes..."
          />
        </Form.Item>

        <Divider />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 16px',
          background: '#f5f5f5',
          borderRadius: 6
        }}>
          <span><strong>Total:</strong></span>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
            ₹{total.toFixed(2)}
          </span>
        </div>

        {paymentMode === 'CASH' && receivedAmount >= total && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 16px',
            background: '#f6ffed',
            borderRadius: 6,
            marginTop: 8
          }}>
            <span><strong>Return:</strong></span>
            <span style={{ fontSize: 16, color: '#52c41a' }}>
              ₹{returnAmount.toFixed(2)}
            </span>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default PaymentModal;