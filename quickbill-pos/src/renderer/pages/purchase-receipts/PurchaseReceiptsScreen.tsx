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
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { PurchaseReceipt, PurchaseReceiptFormData, Supplier, Item, APIResponse, PaginatedResponse } from '../../../shared/types';

const { Title, Text } = Typography;
const { Option } = Select;

const PurchaseReceiptsScreen: React.FC = () => {
  const [purchaseReceipts, setPurchaseReceipts] = useState<PurchaseReceipt[]>([]);
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
  const [editingReceipt, setEditingReceipt] = useState<PurchaseReceipt | null>(null);
  const [form] = Form.useForm();

  // Load purchase receipts
  const loadPurchaseReceipts = async (page = 1, pageSize = 10, search = '', status = '') => {
    setLoading(true);
    try {
      const response: APIResponse<PaginatedResponse<PurchaseReceipt>> = await window.electronAPI.getAllPurchaseReceipts(
        page,
        pageSize,
        search,
        status
      );
      
      if (response.success && response.data) {
        setPurchaseReceipts(response.data.data);
        setPagination({
          current: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total
        });
      } else {
        message.error(response.error || 'Failed to load purchase receipts');
      }
    } catch (error) {
      message.error('Error loading purchase receipts');
      console.error('Error loading purchase receipts:', error);
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
    loadPurchaseReceipts();
    loadSuppliers();
    loadItems();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadPurchaseReceipts(1, pagination.pageSize, value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    loadPurchaseReceipts(1, pagination.pageSize, searchTerm, value);
  };

  const handleTableChange = (pagination: any) => {
    loadPurchaseReceipts(pagination.current, pagination.pageSize, searchTerm, statusFilter);
  };

  const handleAdd = () => {
    setEditingReceipt(null);
    form.resetFields();
    form.setFieldsValue({
      items: [{ item_id: null, quantity: 1, unit_price: 0, discount_percent: 0, condition_status: 'GOOD' }]
    });
    setIsModalVisible(true);
  };

  const handleEdit = (receipt: PurchaseReceipt) => {
    setEditingReceipt(receipt);
    form.setFieldsValue({
      supplier_id: receipt.supplier_id,
      supplier_invoice_number: receipt.supplier_invoice_number,
      supplier_invoice_date: receipt.supplier_invoice_date,
      notes: receipt.notes,
      items: receipt.items || []
    });
    setIsModalVisible(true);
  };

  const handleVerify = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.verifyPurchaseReceipt(id);
      if (response.success) {
        message.success('Purchase receipt verified successfully');
        loadPurchaseReceipts(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to verify purchase receipt');
      }
    } catch (error) {
      message.error('Error verifying purchase receipt');
      console.error('Error verifying purchase receipt:', error);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      const response: APIResponse = await window.electronAPI.rejectPurchaseReceipt(id, reason);
      if (response.success) {
        message.success('Purchase receipt rejected successfully');
        loadPurchaseReceipts(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to reject purchase receipt');
      }
    } catch (error) {
      message.error('Error rejecting purchase receipt');
      console.error('Error rejecting purchase receipt:', error);
    }
  };

  const handleSubmit = async (values: PurchaseReceiptFormData) => {
    try {
      const response: APIResponse<PurchaseReceipt> = await window.electronAPI.createPurchaseReceipt(values);
      
      if (response.success) {
        message.success('Purchase receipt created successfully');
        setIsModalVisible(false);
        loadPurchaseReceipts(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to create purchase receipt');
      }
    } catch (error) {
      message.error('Error creating purchase receipt');
      console.error('Error creating purchase receipt:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'RECEIVED': 'processing',
      'VERIFIED': 'success',
      'REJECTED': 'error'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Receipt Number',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'receipt_date',
      key: 'receipt_date',
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
      title: 'Supplier Invoice',
      key: 'supplier_invoice',
      width: 150,
      render: (record: PurchaseReceipt) => (
        <div>
          {record.supplier_invoice_number && (
            <div>
              <Text strong>{record.supplier_invoice_number}</Text>
            </div>
          )}
          {record.supplier_invoice_date && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(record.supplier_invoice_date).toLocaleDateString()}
              </Text>
            </div>
          )}
        </div>
      ),
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
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: PurchaseReceipt) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          {record.status === 'RECEIVED' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleVerify(record.id)}
                size="small"
              />
              <Popconfirm
                title="Reject Purchase Receipt"
                description="Please provide a reason for rejection:"
                onConfirm={(e) => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) {
                    handleReject(record.id, reason);
                  }
                }}
                okText="Reject"
                cancelText="Cancel"
              >
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  size="small"
                />
              </Popconfirm>
            </>
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
              Purchase Receipts
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Search purchase receipts..."
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
                <Option value="RECEIVED">Received</Option>
                <Option value="VERIFIED">Verified</Option>
                <Option value="REJECTED">Rejected</Option>
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                New Receipt
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={purchaseReceipts}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} purchase receipts`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Create Purchase Receipt"
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
                name="po_id"
                label="Purchase Order (Optional)"
              >
                <Select placeholder="Select purchase order" allowClear>
                  {/* TODO: Load purchase orders */}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier_invoice_number"
                label="Supplier Invoice Number"
              >
                <Input placeholder="INV-2024-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplier_invoice_date"
                label="Supplier Invoice Date"
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

          <Divider>Items Received</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }}>
                    <Row gutter={8}>
                      <Col span={6}>
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
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'discount_percent']}
                          label="Discount %"
                        >
                          <Input type="number" min={0} max={100} step={0.01} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'condition_status']}
                          label="Condition"
                        >
                          <Select>
                            <Option value="GOOD">Good</Option>
                            <Option value="DAMAGED">Damaged</Option>
                            <Option value="EXPIRED">Expired</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'batch_number']}
                          label="Batch Number"
                        >
                          <Input placeholder="BATCH001" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={8}>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'expiry_date']}
                          label="Expiry Date"
                        >
                          <DatePicker style={{ width: '100%' }} />
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
                Create Receipt
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseReceiptsScreen;