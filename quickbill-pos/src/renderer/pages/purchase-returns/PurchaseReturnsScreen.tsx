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
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { PurchaseReturn, PurchaseReturnFormData, APIResponse, PaginatedResponse } from '../../../shared/types';

const { Title, Text } = Typography;
const { Option } = Select;

const PurchaseReturnsScreen: React.FC = () => {
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [availableReceipts, setAvailableReceipts] = useState<any[]>([]);
  const [receiptItems, setReceiptItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReturn, setEditingReturn] = useState<PurchaseReturn | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Load purchase returns
  const loadPurchaseReturns = async (page = 1, pageSize = 10, search = '', status = '') => {
    setLoading(true);
    try {
      const response: APIResponse<PaginatedResponse<PurchaseReturn>> = await window.electronAPI.getAllPurchaseReturns(
        page,
        pageSize,
        search,
        status
      );
      
      if (response.success && response.data) {
        setPurchaseReturns(response.data.data);
        setPagination({
          current: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total
        });
      } else {
        message.error(response.error || 'Failed to load purchase returns');
      }
    } catch (error) {
      message.error('Error loading purchase returns');
      console.error('Error loading purchase returns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load available receipts
  const loadAvailableReceipts = async () => {
    try {
      const response: APIResponse = await window.electronAPI.getAvailableReceiptsForReturn();
      if (response.success && response.data) {
        setAvailableReceipts(response.data);
      }
    } catch (error) {
      console.error('Error loading available receipts:', error);
    }
  };

  // Load receipt items
  const loadReceiptItems = async (receiptId: number) => {
    try {
      const response: APIResponse = await window.electronAPI.getReceiptItemsForReturn(receiptId);
      if (response.success && response.data) {
        setReceiptItems(response.data);
      }
    } catch (error) {
      console.error('Error loading receipt items:', error);
    }
  };

  useEffect(() => {
    loadPurchaseReturns();
    loadAvailableReceipts();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    loadPurchaseReturns(1, pagination.pageSize, value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    loadPurchaseReturns(1, pagination.pageSize, searchTerm, value);
  };

  const handleTableChange = (pagination: any) => {
    loadPurchaseReturns(pagination.current, pagination.pageSize, searchTerm, statusFilter);
  };

  const handleAdd = () => {
    setEditingReturn(null);
    setSelectedReceipt(null);
    setReceiptItems([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (returnRecord: PurchaseReturn) => {
    setEditingReturn(returnRecord);
    form.setFieldsValue(returnRecord);
    setIsModalVisible(true);
  };

  const handleApprove = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.approvePurchaseReturn(id);
      if (response.success) {
        message.success('Purchase return approved successfully');
        loadPurchaseReturns(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to approve purchase return');
      }
    } catch (error) {
      message.error('Error approving purchase return');
      console.error('Error approving purchase return:', error);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      const response: APIResponse = await window.electronAPI.rejectPurchaseReturn(id, reason);
      if (response.success) {
        message.success('Purchase return rejected successfully');
        loadPurchaseReturns(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to reject purchase return');
      }
    } catch (error) {
      message.error('Error rejecting purchase return');
      console.error('Error rejecting purchase return:', error);
    }
  };

  const handleProcess = async (id: number) => {
    try {
      const response: APIResponse = await window.electronAPI.processPurchaseReturn(id);
      if (response.success) {
        message.success('Purchase return processed successfully');
        loadPurchaseReturns(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to process purchase return');
      }
    } catch (error) {
      message.error('Error processing purchase return');
      console.error('Error processing purchase return:', error);
    }
  };

  const handleReceiptChange = (receiptId: number) => {
    setSelectedReceipt(receiptId);
    loadReceiptItems(receiptId);
  };

  const handleSubmit = async (values: PurchaseReturnFormData) => {
    try {
      const response: APIResponse<PurchaseReturn> = await window.electronAPI.createPurchaseReturn(values);
      
      if (response.success) {
        message.success('Purchase return created successfully');
        setIsModalVisible(false);
        loadPurchaseReturns(pagination.current, pagination.pageSize, searchTerm, statusFilter);
      } else {
        message.error(response.error || 'Failed to create purchase return');
      }
    } catch (error) {
      message.error('Error creating purchase return');
      console.error('Error creating purchase return:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PENDING': 'processing',
      'APPROVED': 'success',
      'REJECTED': 'error',
      'PROCESSED': 'blue'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Return Number',
      dataIndex: 'return_number',
      key: 'return_number',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'return_date',
      key: 'return_date',
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
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      render: (reason: string) => (
        <Text ellipsis={{ tooltip: reason }}>{reason}</Text>
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
      render: (record: PurchaseReturn) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          {record.status === 'PENDING' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                size="small"
              />
              <Popconfirm
                title="Reject Purchase Return"
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
          {record.status === 'APPROVED' && (
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={() => handleProcess(record.id)}
              size="small"
            />
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
              Purchase Returns
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Search purchase returns..."
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
                <Option value="PENDING">Pending</Option>
                <Option value="APPROVED">Approved</Option>
                <Option value="REJECTED">Rejected</Option>
                <Option value="PROCESSED">Processed</Option>
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                New Return
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={purchaseReturns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} purchase returns`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Create Purchase Return"
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
          <Form.Item
            name="receipt_id"
            label="Purchase Receipt"
            rules={[{ required: true, message: 'Please select purchase receipt' }]}
          >
            <Select 
              placeholder="Select purchase receipt"
              onChange={handleReceiptChange}
              showSearch
              optionFilterProp="children"
            >
              {availableReceipts.map(receipt => (
                <Option key={receipt.id} value={receipt.id}>
                  {receipt.receipt_number} - {receipt.supplier_name} (₹{receipt.total_amount.toFixed(2)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Return Reason"
            rules={[{ required: true, message: 'Please enter return reason' }]}
          >
            <Input.TextArea rows={3} placeholder="Reason for return..." />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>

          {selectedReceipt && receiptItems.length > 0 && (
            <>
              <Divider>Items to Return</Divider>
              <Alert
                message="Select items to return"
                description="Choose the items and quantities you want to return from this receipt."
                type="info"
                style={{ marginBottom: 16 }}
              />
              
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {receiptItems.map((item, index) => (
                      <Card key={item.receipt_item_id} size="small" style={{ marginBottom: 8 }}>
                        <Row gutter={8} align="middle">
                          <Col span={8}>
                            <Text strong>{item.brand} - {item.item_description}</Text>
                            <div>
                              <Text type="secondary">
                                Received: {item.received_quantity} | Price: ₹{item.unit_price}
                              </Text>
                            </div>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              name={[index, 'receipt_item_id']}
                              initialValue={item.receipt_item_id}
                              hidden
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name={[index, 'quantity']}
                              label="Return Qty"
                              rules={[
                                { required: true, message: 'Please enter quantity' },
                                { 
                                  validator: (_, value) => {
                                    if (value && value > item.received_quantity) {
                                      return Promise.reject('Cannot return more than received');
                                    }
                                    return Promise.resolve();
                                  }
                                }
                              ]}
                            >
                              <Input 
                                type="number" 
                                min={0} 
                                max={item.received_quantity}
                                step={0.001}
                                placeholder="0"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              name={[index, 'return_reason']}
                              label="Reason"
                              rules={[{ required: true, message: 'Please select reason' }]}
                            >
                              <Select placeholder="Select reason">
                                <Option value="DAMAGED">Damaged</Option>
                                <Option value="DEFECTIVE">Defective</Option>
                                <Option value="WRONG_ITEM">Wrong Item</Option>
                                <Option value="EXPIRED">Expired</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              name={[index, 'condition_status']}
                              label="Condition"
                              initialValue="DAMAGED"
                            >
                              <Select>
                                <Option value="DAMAGED">Damaged</Option>
                                <Option value="DEFECTIVE">Defective</Option>
                                <Option value="WRONG_ITEM">Wrong Item</Option>
                                <Option value="EXPIRED">Expired</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Button
                              type="text"
                              onClick={() => {
                                const currentItems = form.getFieldValue('items') || [];
                                const newItems = currentItems.filter((_: any, i: number) => i !== index);
                                form.setFieldsValue({ items: newItems });
                              }}
                              style={{ marginTop: 30 }}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </>
                )}
              </Form.List>
            </>
          )}

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Return
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseReturnsScreen;