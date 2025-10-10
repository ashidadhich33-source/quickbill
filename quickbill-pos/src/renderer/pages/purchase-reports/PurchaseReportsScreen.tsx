import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Button,
  Space,
  Typography,
  Divider,
  Select,
  Spin,
  Alert,
  Progress
} from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UndoOutlined,
  CreditCardOutlined,
  TrendingUpOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { APIResponse } from '../../../shared/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PurchaseReportsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [summaryData, setSummaryData] = useState<any>(null);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<any[]>([]);
  const [purchaseVsSales, setPurchaseVsSales] = useState<any>(null);
  const [itemAnalysis, setItemAnalysis] = useState<any[]>([]);
  const [returnAnalysis, setReturnAnalysis] = useState<any>(null);
  const [paymentAnalysis, setPaymentAnalysis] = useState<any>(null);

  const loadSummaryData = async () => {
    if (!dateRange) return;
    
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getPurchaseSummary(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      
      if (response.success && response.data) {
        setSummaryData(response.data);
      }
    } catch (error) {
      console.error('Error loading summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopSuppliers = async () => {
    if (!dateRange) return;
    
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getTopSuppliers(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
        10
      );
      
      if (response.success && response.data) {
        setTopSuppliers(response.data);
      }
    } catch (error) {
      console.error('Error loading top suppliers:', error);
    }
  };

  const loadOrderStatus = async () => {
    if (!dateRange) return;
    
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getPurchaseOrderStatus(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      
      if (response.success && response.data) {
        setOrderStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading order status:', error);
    }
  };

  const loadMonthlyTrends = async () => {
    try {
      const response: APIResponse = await window.electronAPI.getMonthlyPurchaseTrends(year);
      
      if (response.success && response.data) {
        setMonthlyTrends(response.data);
      }
    } catch (error) {
      console.error('Error loading monthly trends:', error);
    }
  };

  const loadOutstandingBalances = async () => {
    try {
      const response: APIResponse = await window.electronAPI.getOutstandingBalances();
      
      if (response.success && response.data) {
        setOutstandingBalances(response.data);
      }
    } catch (error) {
      console.error('Error loading outstanding balances:', error);
    }
  };

  const loadPurchaseVsSales = async () => {
    if (!dateRange) return;
    
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getPurchaseVsSales(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      
      if (response.success && response.data) {
        setPurchaseVsSales(response.data);
      }
    } catch (error) {
      console.error('Error loading purchase vs sales:', error);
    }
  };

  const loadItemAnalysis = async () => {
    if (!dateRange) return;
    
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getItemWisePurchaseAnalysis(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
        20
      );
      
      if (response.success && response.data) {
        setItemAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error loading item analysis:', error);
    }
  };

  const loadReturnAnalysis = async () => {
    if (!dateRange) return;
    
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getPurchaseReturnAnalysis(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      
      if (response.success && response.data) {
        setReturnAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error loading return analysis:', error);
    }
  };

  const loadPaymentAnalysis = async () => {
    if (!dateRange) return;
    
    try {
      const [startDate, endDate] = dateRange;
      const response: APIResponse = await window.electronAPI.getPaymentAnalysis(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      
      if (response.success && response.data) {
        setPaymentAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error loading payment analysis:', error);
    }
  };

  const loadAllReports = async () => {
    await Promise.all([
      loadSummaryData(),
      loadTopSuppliers(),
      loadOrderStatus(),
      loadOutstandingBalances(),
      loadPurchaseVsSales(),
      loadItemAnalysis(),
      loadReturnAnalysis(),
      loadPaymentAnalysis()
    ]);
  };

  useEffect(() => {
    loadMonthlyTrends();
    loadOutstandingBalances();
  }, [year]);

  useEffect(() => {
    if (dateRange) {
      loadAllReports();
    }
  }, [dateRange]);

  const summaryColumns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
    },
  ];

  const topSuppliersColumns = [
    {
      title: 'Supplier',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'Orders',
      dataIndex: 'order_count',
      key: 'order_count',
    },
    {
      title: 'Total Amount (₹)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => amount.toFixed(2),
    },
    {
      title: 'Received (₹)',
      dataIndex: 'received_amount',
      key: 'received_amount',
      render: (amount: number) => amount.toFixed(2),
    },
    {
      title: 'Paid (₹)',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (amount: number) => amount.toFixed(2),
    },
    {
      title: 'Balance (₹)',
      dataIndex: 'current_balance',
      key: 'current_balance',
      render: (amount: number) => (
        <Text type={amount > 0 ? 'danger' : 'success'}>
          {amount.toFixed(2)}
        </Text>
      ),
    },
  ];

  const itemAnalysisColumns = [
    {
      title: 'Item',
      dataIndex: 'item_description',
      key: 'item_description',
      render: (text: string, record: any) => (
        <div>
          <Text strong>{record.brand} - {text}</Text>
          <div><Text type="secondary">{record.barcode}</Text></div>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'order_count',
      key: 'order_count',
    },
    {
      title: 'Quantity',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => amount.toFixed(2),
    },
    {
      title: 'Avg Price (₹)',
      dataIndex: 'avg_price',
      key: 'avg_price',
      render: (price: number) => price.toFixed(2),
    },
    {
      title: 'Received',
      dataIndex: 'received_quantity',
      key: 'received_quantity',
    },
    {
      title: 'Returned',
      dataIndex: 'returned_quantity',
      key: 'returned_quantity',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Purchase Reports & Analytics
            </Title>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={['Start Date', 'End Date']}
              />
              <Select
                value={year}
                onChange={setYear}
                style={{ width: 120 }}
              >
                <Option value={2023}>2023</Option>
                <Option value={2024}>2024</Option>
                <Option value={2025}>2025</Option>
              </Select>
              <Button type="primary" onClick={loadAllReports} loading={loading}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && summaryData && (
        <>
          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Purchase Orders"
                  value={summaryData.orders?.total_orders || 0}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Amount"
                  value={summaryData.orders?.total_amount || 0}
                  prefix="₹"
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Purchase Receipts"
                  value={summaryData.receipts?.total_receipts || 0}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Returns"
                  value={summaryData.returns?.total_returns || 0}
                  prefix={<UndoOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Top Suppliers */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="Top Suppliers" extra={<TrendingUpOutlined />}>
                <Table
                  columns={topSuppliersColumns}
                  dataSource={topSuppliers}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Order Status & Monthly Trends */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Order Status Distribution">
                <Table
                  columns={[
                    { title: 'Status', dataIndex: 'status', key: 'status' },
                    { title: 'Count', dataIndex: 'count', key: 'count' },
                    { 
                      title: 'Amount (₹)', 
                      dataIndex: 'total_amount', 
                      key: 'total_amount',
                      render: (amount: number) => amount.toFixed(2)
                    },
                  ]}
                  dataSource={orderStatus}
                  rowKey="status"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Monthly Purchase Trends">
                <Table
                  columns={[
                    { title: 'Month', dataIndex: 'month', key: 'month' },
                    { title: 'Orders', dataIndex: 'order_count', key: 'order_count' },
                    { 
                      title: 'Amount (₹)', 
                      dataIndex: 'total_amount', 
                      key: 'total_amount',
                      render: (amount: number) => amount.toFixed(2)
                    },
                  ]}
                  dataSource={monthlyTrends}
                  rowKey="month"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Outstanding Balances */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="Outstanding Balances" extra={<DollarOutlined />}>
                <Table
                  columns={[
                    { title: 'Supplier', dataIndex: 'company_name', key: 'company_name' },
                    { title: 'Code', dataIndex: 'supplier_code', key: 'supplier_code' },
                    { 
                      title: 'Outstanding (₹)', 
                      dataIndex: 'outstanding_amount', 
                      key: 'outstanding_amount',
                      render: (amount: number) => (
                        <Text type={amount > 0 ? 'danger' : 'success'}>
                          {amount.toFixed(2)}
                        </Text>
                      )
                    },
                    { 
                      title: 'Credit Limit (₹)', 
                      dataIndex: 'credit_limit', 
                      key: 'credit_limit',
                      render: (limit: number) => limit.toFixed(2)
                    },
                    {
                      title: 'Utilization',
                      key: 'utilization',
                      render: (record: any) => {
                        const utilization = (record.outstanding_amount / record.credit_limit) * 100;
                        return (
                          <Progress 
                            percent={Math.min(utilization, 100)} 
                            size="small"
                            status={utilization > 80 ? 'exception' : 'normal'}
                          />
                        );
                      }
                    },
                  ]}
                  dataSource={outstandingBalances}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Item Analysis */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="Top Purchased Items">
                <Table
                  columns={itemAnalysisColumns}
                  dataSource={itemAnalysis}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Return Analysis */}
          {returnAnalysis && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card title="Returns by Reason">
                  <Table
                    columns={[
                      { title: 'Reason', dataIndex: 'return_reason', key: 'return_reason' },
                      { title: 'Count', dataIndex: 'count', key: 'count' },
                      { 
                        title: 'Amount (₹)', 
                        dataIndex: 'total_amount', 
                        key: 'total_amount',
                        render: (amount: number) => amount.toFixed(2)
                      },
                    ]}
                    dataSource={returnAnalysis.byReason}
                    rowKey="return_reason"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Returns by Supplier">
                  <Table
                    columns={[
                      { title: 'Supplier', dataIndex: 'company_name', key: 'company_name' },
                      { title: 'Count', dataIndex: 'return_count', key: 'return_count' },
                      { 
                        title: 'Amount (₹)', 
                        dataIndex: 'total_return_amount', 
                        key: 'total_return_amount',
                        render: (amount: number) => amount.toFixed(2)
                      },
                    ]}
                    dataSource={returnAnalysis.bySupplier}
                    rowKey="company_name"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Payment Analysis */}
          {paymentAnalysis && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Payments by Mode">
                  <Table
                    columns={[
                      { title: 'Mode', dataIndex: 'payment_mode', key: 'payment_mode' },
                      { title: 'Count', dataIndex: 'count', key: 'count' },
                      { 
                        title: 'Amount (₹)', 
                        dataIndex: 'total_amount', 
                        key: 'total_amount',
                        render: (amount: number) => amount.toFixed(2)
                      },
                    ]}
                    dataSource={paymentAnalysis.byMode}
                    rowKey="payment_mode"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Monthly Payments">
                  <Table
                    columns={[
                      { title: 'Month', dataIndex: 'month', key: 'month' },
                      { title: 'Count', dataIndex: 'payment_count', key: 'payment_count' },
                      { 
                        title: 'Amount (₹)', 
                        dataIndex: 'total_amount', 
                        key: 'total_amount',
                        render: (amount: number) => amount.toFixed(2)
                      },
                    ]}
                    dataSource={paymentAnalysis.monthly}
                    rowKey="month"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {!loading && !dateRange && (
        <Alert
          message="Select Date Range"
          description="Please select a date range to view purchase reports and analytics."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default PurchaseReportsScreen;