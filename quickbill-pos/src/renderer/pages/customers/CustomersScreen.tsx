import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, message, Modal, Form,
  InputNumber, Select, Row, Col, Statistic, Typography, Tabs, DatePicker
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ImportOutlined, ExportOutlined, UserOutlined, PhoneOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
  created_at: string;
  children?: Array<{
    name: string;
    date_of_birth: string;
  }>;
}

const CustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.searchCustomers(searchTerm);
      if (result.success) {
        setCustomers(result.data || []);
      } else {
        message.error('Error loading customers');
      }
    } catch (error) {
      message.error('Error loading customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCustomers();
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: `Are you sure you want to delete "${customer.name}"?`,
      icon: <UserOutlined />,
      onOk: async () => {
        try {
          const result = await window.electronAPI.deleteCustomer(customer.id);
          if (result.success) {
            message.success('Customer deleted successfully');
            loadCustomers();
          } else {
            message.error('Error deleting customer');
          }
        } catch (error) {
          message.error('Error deleting customer');
        }
      },
    });
  };

  const handleSaveCustomer = async (values: any) => {
    try {
      let result;
      if (editingCustomer) {
        result = await window.electronAPI.updateCustomer(editingCustomer.id, values);
      } else {
        result = await window.electronAPI.createCustomer(values);
      }

      if (result.success) {
        message.success(`Customer ${editingCustomer ? 'updated' : 'created'} successfully`);
        setShowCustomerModal(false);
        loadCustomers();
      } else {
        message.error(`Error ${editingCustomer ? 'updating' : 'creating'} customer`);
      }
    } catch (error) {
      message.error(`Error ${editingCustomer ? 'updating' : 'creating'} customer`);
    }
  };

  const handleImport = async () => {
    try {
      const selectedFile = await window.electronAPI.selectFile([
        { name: 'CSV Files', extensions: ['csv'] }
      ]);

      if (!selectedFile.success || !selectedFile.data) {
        return;
      }

      const result = await window.electronAPI.importCustomersFromCSV(selectedFile.data);
      if (result.success) {
        message.success('Customers imported successfully');
        loadCustomers();
      } else {
        message.error(result.error || 'Error importing customers');
      }
    } catch (error) {
      message.error('Error importing customers');
    }
  };

  const handleExport = async () => {
    try {
      const result = await window.electronAPI.exportCustomersToCSV('customers_export.csv');
      if (result.success) {
        message.success('Customers exported successfully');
      } else {
        message.error('Error exporting customers');
      }
    } catch (error) {
      message.error('Error exporting customers');
    }
  };

  const getFilteredCustomers = () => {
    let filtered = customers;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customer_type === typeFilter);
    }

    return filtered;
  };

  const getStatistics = () => {
    const totalCustomers = customers.length;
    const retailCustomers = customers.filter(c => c.customer_type === 'RETAIL').length;
    const wholesaleCustomers = customers.filter(c => c.customer_type === 'WHOLESALE').length;
    const totalCredit = customers.reduce((sum, customer) => sum + customer.current_balance, 0);
    const totalPoints = customers.reduce((sum, customer) => sum + customer.loyalty_points, 0);

    return { totalCustomers, retailCustomers, wholesaleCustomers, totalCredit, totalPoints };
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a: Customer, b: Customer) => a.name.localeCompare(b.name),
      render: (name: string, record: Customer) => (
        <div>
          <div><strong>{name}</strong></div>
          <small style={{ color: '#666' }}>{record.mobile}</small>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: 'Type',
      dataIndex: 'customer_type',
      key: 'customer_type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'RETAIL' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'current_balance',
      key: 'current_balance',
      width: 100,
      render: (balance: number) => (
        <span style={{ color: balance < 0 ? 'red' : 'green' }}>
          ₹{balance.toFixed(2)}
        </span>
      ),
      sorter: (a: Customer, b: Customer) => a.current_balance - b.current_balance,
    },
    {
      title: 'Points',
      dataIndex: 'loyalty_points',
      key: 'loyalty_points',
      width: 80,
      render: (points: number) => (
        <Tag color="orange">{points}</Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Customer, b: Customer) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
          />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCustomer(record)}
          />
        </Space>
      ),
    },
  ];

  const statistics = getStatistics();
  const filteredCustomers = getFilteredCustomers();

  const tabItems = [
    {
      key: 'all',
      label: 'All Customers',
      children: (
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} customers`,
          }}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'retail',
      label: 'Retail Customers',
      children: (
        <Table
          columns={columns}
          dataSource={filteredCustomers.filter(c => c.customer_type === 'RETAIL')}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'wholesale',
      label: 'Wholesale Customers',
      children: (
        <Table
          columns={columns}
          dataSource={filteredCustomers.filter(c => c.customer_type === 'WHOLESALE')}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      ),
    },
  ];

  return (
    <div className="customer-screen">
      <div className="customer-header">
        <Title level={3} style={{ margin: 0 }}>Customer Management</Title>
        <Space>
          <Button icon={<ImportOutlined />} onClick={handleImport}>
            Import
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Export
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCustomer}>
            Add Customer
          </Button>
        </Space>
      </div>

      <div className="customer-content">
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Customers" value={statistics.totalCustomers} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Retail Customers" 
                value={statistics.retailCustomers} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Wholesale Customers" 
                value={statistics.wholesaleCustomers} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Total Credit" 
                value={statistics.totalCredit} 
                prefix="₹"
                formatter={(value) => value.toLocaleString()}
                valueStyle={{ color: statistics.totalCredit < 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="customer-filters">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Customer Type"
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">All Types</Option>
                <Option value="RETAIL">Retail</Option>
                <Option value="WHOLESALE">Wholesale</Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker style={{ width: '100%' }} />
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={handleSearch}>
                Search
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Customers Table */}
        <Card className="customer-table">
          <Tabs items={tabItems} />
        </Card>
      </div>

      {/* Customer Modal */}
      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Create Customer'}
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveCustomer}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mobile"
                label="Mobile"
                rules={[
                  { required: true, message: 'Please enter mobile number' },
                  { pattern: /^[6-9]\d{9}$/, message: 'Please enter valid mobile number' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customer_type" label="Type">
                <Select>
                  <Option value="RETAIL">Retail</Option>
                  <Option value="WHOLESALE">Wholesale</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="credit_limit" label="Credit Limit">
                <InputNumber style={{ width: '100%' }} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loyalty_points" label="Loyalty Points">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersScreen;