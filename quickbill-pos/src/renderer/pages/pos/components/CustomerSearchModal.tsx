import React, { useState, useEffect } from 'react';
import {
  Modal, Input, Table, Button, Space, Tag, message, Spin, Empty, Tabs
} from 'antd';
import { SearchOutlined, UserAddOutlined, EditOutlined } from '@ant-design/icons';

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
  children?: Array<{
    name: string;
    date_of_birth: string;
  }>;
}

interface CustomerSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  visible,
  onClose,
  onSelectCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    if (visible) {
      loadCustomers();
    }
  }, [visible]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.searchCustomers(searchTerm || '');
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

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
  };

  const handleCreateCustomer = () => {
    // Open customer creation form
    message.info('Customer creation form coming soon');
  };

  const handleEditCustomer = (customer: Customer) => {
    // Open customer edit form
    message.info('Customer edit form coming soon');
  };

  const searchColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a: Customer, b: Customer) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 120,
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
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleSelectCustomer(record)}
          >
            Select
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
          />
        </Space>
      ),
    },
  ];

  const recentColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 120,
    },
    {
      title: 'Last Visit',
      dataIndex: 'last_visit',
      key: 'last_visit',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Total Spent',
      dataIndex: 'total_spent',
      key: 'total_spent',
      width: 100,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: Customer) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSelectCustomer(record)}
        >
          Select
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const tabItems = [
    {
      key: 'search',
      label: 'Search Customers',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Search by name or mobile"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
              <Button type="primary" onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </Space.Compact>
          </div>

          <Spin spinning={loading}>
            <Table
              columns={searchColumns}
              dataSource={customers}
              rowKey="id"
              rowSelection={rowSelection}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} customers`,
              }}
              scroll={{ y: 300 }}
              onRow={(record) => ({
                onDoubleClick: () => handleSelectCustomer(record),
              })}
              locale={{
                emptyText: (
                  <Empty
                    description="No customers found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Spin>
        </div>
      ),
    },
    {
      key: 'recent',
      label: 'Recent Customers',
      children: (
        <div>
          <Spin spinning={loading}>
            <Table
              columns={recentColumns}
              dataSource={customers.slice(0, 10)} // Show recent 10
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
              onRow={(record) => ({
                onDoubleClick: () => handleSelectCustomer(record),
              })}
              locale={{
                emptyText: (
                  <Empty
                    description="No recent customers"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Spin>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Customer Search"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleCreateCustomer}
        >
          Create New
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
};

export default CustomerSearchModal;