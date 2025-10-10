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
  Steps
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined
} from '@ant-design/icons';
import { PurchaseOrder, PurchaseOrderFormData, Supplier, Item, APIResponse, PaginatedResponse } from '../../../shared/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const PurchaseOrdersScreen: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [form] = Form.useForm();

  // Load purchase orders
  const loadPurchaseOrders = async (page = 1, pageSize = 10, search = '', status = '') => {
    setLoading(true);
    try {
      const response: APIResponse<PaginatedResponse<PurchaseOrder>> = await window.electronAPI.getAllPurchaseOrders(
        page,
        pageSize,
        search,
        status
      );
      
      if (response.success && response.data) {
        setPurchaseOrders(response.data.data);
        setPagination({
          current: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total
        });
      } else {
        message.error(response.error || 'Failed to load purchase orders');
      }
    } catch (error) {
      message.error('Error loading purchase orders');
      console.error('Error loading purchase orders:', error);
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

  // Load items for dropdown
  const loadItems = async () => {
    try {
      const response: APIResponse<Item[]> = await window.electronAPI.searchItems('');
      if (response.success && response.data) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadItems();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadPurchaseOrders(1, pagination.pageSize, value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    loadPurchaseOrders(1, pagination.pageSize, searchTerm, value);
  };

  const handleTableChange = (pagination: any) => {
    loadPurchaseOrders(pagination.current, pagination.pageSize, searchTerm, statusFilter);
  };

  const handleAdd = () => {
    setEditingPO(null);
    form.resetFields();
    form.setFieldsValue({
      items: [{ item_id: null, quantity: 1, unit_price: 0, discount_percent: 0 }]
    });
    setIsModalVisible(true);
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    form.setFieldsValue({
      supplier_id: po.supplier_id,
      expected_delivery_date: po.expected_delivery_date,
      notes: po.notes,
      items: po.items || []
    });
    setIsModalVisible(true);
  };

  const handleApprove = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.approvePurchaseOrder(id);
      if (response.success) {
        message.success('Purchase order approved successfully');
        loadPurchaseOrders(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to approve purchase order');
      }
    } catch (error) {
      message.error('Error approving purchase order');
      console.error('Error approving purchase order:', error);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.cancelPurchaseOrder(id);
      if (response.success) {
        message.success('Purchase order cancelled successfully');
        loadPurchaseOrders(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to cancel purchase order');
      }
    } catch (error) {
      message.error('Error cancelling purchase order');
      console.error('Error cancelling purchase order:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.deletePurchaseOrder(id);
      if (response.success) {
        message.success('Purchase order deleted successfully');
        loadPurchaseOrders(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to delete purchase order');
      }
    } catch (error) {
      message.error('Error deleting purchase order');
      console.error('Error deleting purchase order:', error);
    }
  };

  const handleSubmit = async (values: PurchaseOrderFormData) => {
    try {
      let response: APIResponse<PurchaseOrder>;
      
      if (editingPO) {
        response = await window.electronAPI.updatePurchaseOrder(editingPO.id, values);
      } else {
        response = await window.electronAPI.createPurchaseOrder(values);
      }
      
      if (response.success) {
        message.success(`Purchase order ${editingPO ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        loadPurchaseOrders(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || `Failed to ${editingPO ? 'update' : 'create'} purchase order`);
      }
    } catch (error) {
      message.error(`Error ${editingPO ? 'updating' : 'creating'} purchase order`);
      console.error(`Error ${editingPO ? 'updating' : 'creating'} purchase order:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'DRAFT': 'default',
      'PENDING_APPROVAL': 'processing',
      'APPROVED': 'success',
      'SENT': 'blue',
      'PARTIALLY_RECEIVED': 'warning',
      'FULLY_RECEIVED': 'green',
      'CANCELLED': 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'po_number',
      key: 'po_number',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'po_date',
      key: 'po_date',
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
      title: 'Expected Delivery',
      dataIndex: 'expected_delivery_date',
      key: 'expected_delivery_date',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: PurchaseOrder) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          {record.status === 'DRAFT' && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
              />
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                size="small"
              />
            </>
          )}
          {record.status === 'APPROVED' && (
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={() => {/* Handle send */}}
              size="small"
            />
          )}
          {(record.status === 'DRAFT' || record.status === 'PENDING_APPROVAL') && (
            <Popconfirm
              title="Are you sure you want to cancel this purchase order?"
              onConfirm={() => handleCancel(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<CloseOutlined />}
                size="small"
              />
            </Popconfirm>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Are you sure you want to delete this purchase order?"
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
          )}
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
              Purchase Orders
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Search purchase orders..."
                style={{ width: 300 }}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="Filter by status"
                style={{ width: 150 }}
                allowClear
                onChange={handleStatusFilter}
              >
                <Option value="DRAFT">Draft</Option>
                <Option value="PENDING_APPROVAL">Pending Approval</Option>
                <Option value="APPROVED">Approved</Option>
                <Option value="SENT">Sent</Option>
                <Option value="PARTIALLY_RECEIVED">Partially Received</Option>
                <Option value="FULLY_RECEIVED">Fully Received</Option>
                <Option value="CANCELLED">Cancelled</Option>
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                New Purchase Order
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={purchaseOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} purchase orders`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier_id"
                label="Supplier"
                rules={[{ required: true, message: 'Please select supplier' }]}
              >
                <Select placeholder="Select supplier">
                  {suppliers.map(supplier => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.company_name} ({supplier.supplier_code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expected_delivery_date"
                label="Expected Delivery Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Divider>Items</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }}>
                    <Row gutter={8}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'item_id']}
                          label="Item"
                          rules={[{ required: true, message: 'Please select item' }]}
                        >
                          <Select placeholder="Select item">
                            {items.map(item => (
                              <Option key={item.id} value={item.id}>
                                {item.brand} - {item.item_description}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Please enter quantity' }]}
                        >
                          <Input type="number" min={0} step={0.001} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unit_price']}
                          label="Unit Price"
                          rules={[{ required: true, message: 'Please enter unit price' }]}
                        >
                          <Input type="number" min={0} step={0.01} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'discount_percent']}
                          label="Discount %"
                        >
                          <Input type="number" min={0} max={100} step={0.01} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Button
                          type="text"
                          danger
                          onClick={() => remove(name)}
                          style={{ marginTop: 30 }}
                        >
                          Remove
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPO ? 'Update' : 'Create'} Purchase Order
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseOrdersScreen;