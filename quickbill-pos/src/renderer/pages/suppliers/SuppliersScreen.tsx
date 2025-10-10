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
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { Supplier, SupplierFormData, APIResponse, PaginatedResponse } from '../../../shared/types';

const { Title, Text } = Typography;
const { Option } = Select;

const SuppliersScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

  // Load suppliers
  const loadSuppliers = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true);
    try {
      const response: APIResponse<PaginatedResponse<Supplier>> = await window.electronAPI.getAllSuppliers(
        page,
        pageSize,
        search
      );
      
      if (response.success && response.data) {
        setSuppliers(response.data.data);
        setPagination({
          current: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total
        });
      } else {
        message.error(response.error || 'Failed to load suppliers');
      }
    } catch (error) {
      message.error('Error loading suppliers');
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadSuppliers(1, pagination.pageSize, value);
  };

  const handleTableChange = (pagination: any) => {
    loadSuppliers(pagination.current, pagination.pageSize, searchTerm);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.deleteSupplier(id);
      if (response.success) {
        message.success('Supplier deleted successfully');
        loadSuppliers(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error(response.error || 'Failed to delete supplier');
      }
    } catch (error) {
      message.error('Error deleting supplier');
      console.error('Error deleting supplier:', error);
    }
  };

  const handleSubmit = async (values: SupplierFormData) => {
    try {
      let response: APIResponse<Supplier>;
      
      if (editingSupplier) {
        response = await window.electronAPI.updateSupplier(editingSupplier.id, values);
      } else {
        response = await window.electronAPI.createSupplier(values);
      }
      
      if (response.success) {
        message.success(`Supplier ${editingSupplier ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        loadSuppliers(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error(response.error || `Failed to ${editingSupplier ? 'update' : 'create'} supplier`);
      }
    } catch (error) {
      message.error(`Error ${editingSupplier ? 'updating' : 'creating'} supplier`);
      console.error(`Error ${editingSupplier ? 'updating' : 'creating'} supplier:`, error);
    }
  };

  const columns = [
    {
      title: 'Supplier Code',
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 120,
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
      render: (text: string, record: Supplier) => (
        <div>
          <Text strong>{text}</Text>
          {record.contact_person && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Contact: {record.contact_person}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      width: 200,
      render: (record: Supplier) => (
        <div>
          {record.phone && (
            <div>
              <PhoneOutlined /> {record.phone}
            </div>
          )}
          {record.email && (
            <div>
              <MailOutlined /> {record.email}
            </div>
          )}
          {record.mobile && (
            <div>
              <PhoneOutlined /> {record.mobile}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (record: Supplier) => (
        <div>
          {record.city && <div>{record.city}</div>}
          {record.state && <div>{record.state}</div>}
          {record.pincode && <div>{record.pincode}</div>}
        </div>
      ),
    },
    {
      title: 'Balance',
      key: 'balance',
      width: 120,
      render: (record: Supplier) => (
        <div>
          <Text type={record.current_balance > 0 ? 'danger' : 'success'}>
            ₹{record.current_balance.toFixed(2)}
          </Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Limit: ₹{record.credit_limit.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Terms',
      dataIndex: 'payment_terms',
      key: 'payment_terms',
      width: 100,
      render: (terms: number) => `${terms} days`,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Supplier) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
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
              Supplier Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Search suppliers..."
                style={{ width: 300 }}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Supplier
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} suppliers`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier_code"
                label="Supplier Code"
                rules={[{ required: true, message: 'Please enter supplier code' }]}
              >
                <Input placeholder="SUP001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="ABC Suppliers Pvt Ltd" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_person"
                label="Contact Person"
              >
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input placeholder="contact@abcsuppliers.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="Phone"
              >
                <Input placeholder="+91-1234567890" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="mobile"
                label="Mobile"
              >
                <Input placeholder="+91-9876543210" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gst_number"
                label="GST Number"
              >
                <Input placeholder="29ABCDE1234F1Z5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={2} placeholder="Complete address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input placeholder="Mumbai" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State"
              >
                <Input placeholder="Maharashtra" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pincode"
                label="Pincode"
              >
                <Input placeholder="400001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pan_number"
                label="PAN Number"
              >
                <Input placeholder="ABCDE1234F" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_terms"
                label="Payment Terms (Days)"
                initialValue={30}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="credit_limit"
                label="Credit Limit (₹)"
                initialValue={0}
              >
                <Input type="number" min={0} step={0.01} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSupplier ? 'Update' : 'Create'} Supplier
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SuppliersScreen;