import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, message, Modal, Form,
  InputNumber, Select, Row, Col, Statistic, Typography, Tabs,
  DatePicker, Divider, Descriptions, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined,
  UndoOutlined, ExclamationCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import PaginatedTable from '../../components/common/PaginatedTable';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReturnItem {
  id: number;
  originalItemId: number;
  itemId: number;
  barcode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  returnReason: string;
  conditionStatus: 'GOOD' | 'DAMAGED' | 'DEFECTIVE';
  refundAmount: number;
  brand: string;
  itemDescription: string;
}

interface SalesReturn {
  id: number;
  returnNumber: string;
  originalSaleId: number;
  originalInvoiceNumber: string;
  returnDate: string;
  customerId: number;
  customerName: string;
  customerMobile: string;
  reason: string;
  returnAmount: number;
  refundAmount: number;
  refundMode: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  processedBy: number;
  processedByName: string;
  items: ReturnItem[];
}

const ReturnsScreen: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [totalReturns, setTotalReturns] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = useCallback(async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getAllReturns(size, (page - 1) * size);
      if (result.success) {
        setReturns(result.data.returns || []);
        setTotalReturns(result.data.total || 0);
      } else {
        message.error('Error loading returns');
      }
    } catch (error) {
      message.error('Error loading returns');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    loadReturns(page, size);
  }, [loadReturns]);

  const handleSearch = () => {
    loadReturns();
  };

  const handleCreateReturn = () => {
    setShowReturnModal(true);
  };

  const handleViewDetails = (returnRecord: SalesReturn) => {
    setSelectedReturn(returnRecord);
    setShowDetailsModal(true);
  };

  const handleDeleteReturn = (returnId: number) => {
    Modal.confirm({
      title: 'Delete Return',
      content: 'Are you sure you want to delete this return?',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const result = await window.electronAPI.deleteReturn(returnId);
          if (result.success) {
            message.success('Return deleted successfully');
            loadReturns();
          } else {
            message.error(result.error || 'Error deleting return');
          }
        } catch (error) {
          message.error('Error deleting return');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'GOOD': return 'green';
      case 'DAMAGED': return 'orange';
      case 'DEFECTIVE': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Return #',
      dataIndex: 'returnNumber',
      key: 'returnNumber',
      width: 120,
      render: (returnNumber: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {returnNumber}
        </span>
      ),
    },
    {
      title: 'Original Invoice',
      dataIndex: 'originalInvoiceNumber',
      key: 'originalInvoiceNumber',
      width: 120,
      render: (invoiceNumber: string) => (
        <span style={{ fontFamily: 'monospace' }}>
          {invoiceNumber}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_: any, record: SalesReturn) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.customerName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customerMobile}
          </div>
        </div>
      ),
    },
    {
      title: 'Return Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: SalesReturn, b: SalesReturn) => 
        new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime(),
    },
    {
      title: 'Return Amount',
      dataIndex: 'returnAmount',
      key: 'returnAmount',
      width: 120,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
      sorter: (a: SalesReturn, b: SalesReturn) => a.returnAmount - b.returnAmount,
    },
    {
      title: 'Refund Amount',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
      sorter: (a: SalesReturn, b: SalesReturn) => a.refundAmount - b.refundAmount,
    },
    {
      title: 'Refund Mode',
      dataIndex: 'refundMode',
      key: 'refundMode',
      width: 100,
      render: (mode: string) => (
        <Tag color="blue">{mode}</Tag>
      ),
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
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Completed', value: 'COMPLETED' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      onFilter: (value: any, record: SalesReturn) => record.status === value,
    },
    {
      title: 'Processed By',
      dataIndex: 'processedByName',
      key: 'processedByName',
      width: 120,
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: SalesReturn) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
          {record.status === 'PENDING' && (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteReturn(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const getStatistics = () => {
    const totalReturns = returns.length;
    const totalReturnAmount = returns.reduce((sum, r) => sum + r.returnAmount, 0);
    const totalRefundAmount = returns.reduce((sum, r) => sum + r.refundAmount, 0);
    const pendingReturns = returns.filter(r => r.status === 'PENDING').length;

    return {
      totalReturns,
      totalReturnAmount,
      totalRefundAmount,
      pendingReturns,
    };
  };

  const statistics = getStatistics();

  return (
    <div className="returns-screen">
      <div className="returns-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <Title level={3} style={{ margin: 0 }}>Sales Returns & Refunds</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateReturn}
          >
            New Return
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Returns" 
              value={statistics.totalReturns} 
              prefix={<UndoOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Return Amount" 
              value={statistics.totalReturnAmount} 
              prefix="₹"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Refund Amount" 
              value={statistics.totalRefundAmount} 
              prefix="₹"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Pending Returns" 
              value={statistics.pendingReturns} 
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="returns-filters" style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Search by return number, customer, or invoice"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={handleSearch} loading={loading}>
              Search
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Returns Table */}
      <Card>
        <PaginatedTable
          columns={columns}
          data={returns}
          total={totalReturns}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onPageChange={handlePageChange}
          onRefresh={loadReturns}
          rowSelection={rowSelection}
          emptyText="No returns found"
          showTotal={true}
          showSizeChanger={true}
          showQuickJumper={true}
        />
      </Card>

      {/* Return Details Modal */}
      <Modal
        title="Return Details"
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        ]}
      >
        {selectedReturn && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Return Number">
                {selectedReturn.returnNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Original Invoice">
                {selectedReturn.originalInvoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedReturn.customerName} ({selectedReturn.customerMobile})
              </Descriptions.Item>
              <Descriptions.Item label="Return Date">
                {new Date(selectedReturn.returnDate).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Return Amount">
                ₹{selectedReturn.returnAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Refund Amount">
                ₹{selectedReturn.refundAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Refund Mode">
                <Tag color="blue">{selectedReturn.refundMode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedReturn.status)}>
                  {selectedReturn.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedReturn.reason}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Return Items</Divider>
            
            <Table
              columns={[
                {
                  title: 'Item',
                  key: 'item',
                  render: (_: any, item: ReturnItem) => (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.brand} - {item.itemName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.barcode}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  render: (qty: number) => qty.toString(),
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  render: (price: number) => `₹${price.toFixed(2)}`,
                },
                {
                  title: 'Condition',
                  dataIndex: 'conditionStatus',
                  key: 'conditionStatus',
                  render: (condition: string) => (
                    <Tag color={getConditionColor(condition)}>
                      {condition}
                    </Tag>
                  ),
                },
                {
                  title: 'Refund Amount',
                  dataIndex: 'refundAmount',
                  key: 'refundAmount',
                  render: (amount: number) => `₹${amount.toFixed(2)}`,
                },
                {
                  title: 'Reason',
                  dataIndex: 'returnReason',
                  key: 'returnReason',
                },
              ]}
              dataSource={selectedReturn.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* Create Return Modal - Placeholder */}
      <Modal
        title="Create New Return"
        open={showReturnModal}
        onCancel={() => setShowReturnModal(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setShowReturnModal(false)}>
            Cancel
          </Button>,
          <Button key="create" type="primary">
            Create Return
          </Button>
        ]}
      >
        <Alert
          message="Return Creation"
          description="This feature allows you to process returns and refunds. Enter the original invoice number to start the return process."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={form} layout="vertical">
          <Form.Item
            label="Original Invoice Number"
            name="invoiceNumber"
            rules={[{ required: true, message: 'Please enter invoice number' }]}
          >
            <Input placeholder="Enter invoice number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReturnsScreen;