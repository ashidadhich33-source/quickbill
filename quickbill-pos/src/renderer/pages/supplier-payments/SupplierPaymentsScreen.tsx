import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Tag,
  Popconfirm,
  Typography,
  Divider,
  Select,
  DatePicker,
  Statistic,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  DollarOutlined,
  CreditCardOutlined,
  BankOutlined
} from '@ant-design/icons';
import { SupplierPayment, SupplierPaymentFormData, Supplier, APIResponse, PaginatedResponse } from '../../../shared/types';

const { Title, Text } = Typography;
const { Option } = Select;

const SupplierPaymentsScreen: React.FC = () => {
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<any>(null);
  const [form] = Form.useForm();

  // Load supplier payments
  const loadSupplierPayments = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true);
    try {
      const response: APIResponse<PaginatedResponse<SupplierPayment>> = await window.electronAPI.getAllSupplierPayments(
        page,
        pageSize,
        search
      );
      
      if (response.success && response.data) {
        setSupplierPayments(response.data.data);
        setPagination({
          current: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total
        });
      } else {
        message.error(response.error || 'Failed to load supplier payments');
      }
    } catch (error) {
      message.error('Error loading supplier payments');
      console.error('Error loading supplier payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers for dropdown
  const loadSuppliers = async () => {
    try {
      const response: APIResponse<Supplier[]> = await window.electronAPI.getSuppliersForSelection();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Load outstanding balance for selected supplier
  const loadOutstandingBalance = async (supplierId: number) => {
    try {
      const response: APIResponse = await window.electronAPI.getSupplierOutstandingBalance(supplierId);
      if (response.success && response.data) {
        setOutstandingBalance(response.data);
      }
    } catch (error) {
      console.error('Error loading outstanding balance:', error);
    }
  };

  useEffect(() => {
    loadSupplierPayments();
    loadSuppliers();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadSupplierPayments(1, pagination.pageSize, value);
  };

  const handleTableChange = (pagination: any) => {
    loadSupplierPayments(pagination.current, pagination.pageSize, searchTerm);
  };

  const handleAdd = () => {
    setEditingPayment(null);
    setSelectedSupplier(null);
    setOutstandingBalance(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (payment: SupplierPayment) => {
    setEditingPayment(payment);
    setSelectedSupplier(payment.supplier_id);
    form.setFieldsValue(payment);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.deleteSupplierPayment(id);
      if (response.success) {
        message.success('Supplier payment deleted successfully');
        loadSupplierPayments(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error(response.error || 'Failed to delete supplier payment');
      }
    } catch (error) {
      message.error('Error deleting supplier payment');
      console.error('Error deleting supplier payment:', error);
    }
  };

  const handleSupplierChange = (supplierId: number) => {
    setSelectedSupplier(supplierId);
    loadOutstandingBalance(supplierId);
  };

  const handleSubmit = async (values: SupplierPaymentFormData) => {
    try {
      const response: APIResponse<SupplierPayment> = await window.electronAPI.createSupplierPayment(values);
      
      if (response.success) {
        message.success('Supplier payment created successfully');
        setIsModalVisible(false);
        loadSupplierPayments(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error(response.error || 'Failed to create supplier payment');
      }
    } catch (error) {
      message.error('Error creating supplier payment');
      console.error('Error creating supplier payment:', error);
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'CASH': <DollarOutlined />,
      'CARD': <CreditCardOutlined />,
      'BANK_TRANSFER': <BankOutlined />,
      'CHEQUE': <BankOutlined />,
      'UPI': <CreditCardOutlined />
    };
    return icons[mode] || <DollarOutlined />;
  };

  const getPaymentModeColor = (mode: string) => {
    const colors: { [key: string]: string } = {
      'CASH': 'green',
      'CARD': 'blue',
      'BANK_TRANSFER': 'purple',
      'CHEQUE': 'orange',
      'UPI': 'cyan'
    };
    return colors[mode] || 'default';
  };

  const columns = [
    {
      title: 'Payment Number',
      dataIndex: 'payment_number',
      key: 'payment_number',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 200,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Payment Mode',
      dataIndex: 'payment_mode',
      key: 'payment_mode',
      width: 120,
      render: (mode: string) => (
        <Tag color={getPaymentModeColor(mode)} icon={getPaymentModeIcon(mode)}>
          {mode.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'reference_number',
      key: 'reference_number',
      width: 120,
      render: (ref: string) => ref || '-',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (notes: string) => notes ? (
        <Text ellipsis={{ tooltip: notes }}>{notes}</Text>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (record: SupplierPayment) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this payment?"
            description="This action cannot be undone and will affect supplier balance."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Supplier Payments
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Search payments..."
                style={{ width: 300 }}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                New Payment
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={supplierPayments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} payments`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Create Supplier Payment"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="supplier_id"
            label="Supplier"
            rules={[{ required: true, message: 'Please select supplier' }]}
          >
            <Select 
              placeholder="Select supplier"
              onChange={handleSupplierChange}
              showSearch
              optionFilterProp="children"
            >
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.company_name} ({supplier.supplier_code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {outstandingBalance && (
            <Alert
              message="Outstanding Balance Information"
              description={
                <div>
                  <p><strong>Current Balance:</strong> ₹{outstandingBalance.current_balance.toFixed(2)}</p>
                  <p><strong>Total Outstanding:</strong> ₹{outstandingBalance.total_outstanding.toFixed(2)}</p>
                  <p><strong>Credit Limit:</strong> ₹{outstandingBalance.credit_limit.toFixed(2)}</p>
                </div>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Payment Amount (₹)"
                rules={[{ required: true, message: 'Please enter payment amount' }]}
              >
                <Input type="number" min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_mode"
                label="Payment Mode"
                rules={[{ required: true, message: 'Please select payment mode' }]}
              >
                <Select placeholder="Select payment mode">
                  <Option value="CASH">Cash</Option>
                  <Option value="CARD">Card</Option>
                  <Option value="BANK_TRANSFER">Bank Transfer</Option>
                  <Option value="CHEQUE">Cheque</Option>
                  <Option value="UPI">UPI</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reference_number"
            label="Reference Number"
          >
            <Input placeholder="Transaction/Cheque number" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Payment
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierPaymentsScreen;