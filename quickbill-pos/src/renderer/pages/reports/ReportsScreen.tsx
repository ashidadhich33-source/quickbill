import React, { useState, useEffect } from 'react';
import {
  Card, Button, Space, DatePicker, Select, Row, Col, Statistic,
  Typography, Table, Tabs, message, Spin
} from 'antd';
import {
  DownloadOutlined, PrinterOutlined, BarChartOutlined,
  PieChartOutlined, LineChartOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface SalesData {
  date: string;
  total_bills: number;
  total_sales: number;
  total_tax: number;
  total_discount: number;
}

interface TopItem {
  item_id: number;
  brand: string;
  item_description: string;
  total_quantity: number;
  total_sales: number;
  bill_count: number;
}

interface CustomerAnalysis {
  id: number;
  name: string;
  mobile: string;
  total_visits: number;
  total_spent: number;
  avg_bill_value: number;
  last_visit: string;
}

interface GSTReport {
  summary: {
    totalTaxableAmount: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalTax: number;
  };
  hsnWise: Array<{
    hsnCode: string;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
  }>;
}

const ReportsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [reportType, setReportType] = useState('sales');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [customerAnalysis, setCustomerAnalysis] = useState<CustomerAnalysis[]>([]);
  const [gstReport, setGstReport] = useState<GSTReport | null>(null);

  useEffect(() => {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange([firstDay, today]);
  }, []);

  useEffect(() => {
    if (dateRange) {
      loadReportData();
    }
  }, [dateRange, reportType]);

  const loadReportData = async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // Load sales summary
      const salesResult = await window.electronAPI.getSalesSummary(startDate, endDate);
      if (salesResult.success) {
        setSalesData(salesResult.data || []);
      }

      // Load top items
      const itemsResult = await window.electronAPI.getTopItems(startDate, endDate);
      if (itemsResult.success) {
        setTopItems(itemsResult.data || []);
      }

      // Load customer analysis
      const customersResult = await window.electronAPI.getCustomerAnalysis(startDate, endDate);
      if (customersResult.success) {
        setCustomerAnalysis(customersResult.data || []);
      }

      // Load GST report
      const gstResult = await window.electronAPI.getGSTReport(startDate, endDate);
      if (gstResult.success) {
        setGstReport(gstResult.data || null);
      }
    } catch (error) {
      message.error('Error loading report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: string) => {
    if (!dateRange) {
      message.warning('Please select date range');
      return;
    }

    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');
    
    message.info(`Exporting ${reportType} report to ${format}...`);
    // Implementation would call electron API to export data
  };

  const handlePrint = () => {
    message.info('Printing report...');
    // Implementation would call electron API to print report
  };

  const getTotalSales = () => {
    return salesData.reduce((sum, day) => sum + day.total_sales, 0);
  };

  const getTotalBills = () => {
    return salesData.reduce((sum, day) => sum + day.total_bills, 0);
  };

  const getTotalTax = () => {
    return salesData.reduce((sum, day) => sum + day.total_tax, 0);
  };

  const getTotalDiscount = () => {
    return salesData.reduce((sum, day) => sum + day.total_discount, 0);
  };

  const salesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Bills',
      dataIndex: 'total_bills',
      key: 'total_bills',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'Sales',
      dataIndex: 'total_sales',
      key: 'total_sales',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Tax',
      dataIndex: 'total_tax',
      key: 'total_tax',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Discount',
      dataIndex: 'total_discount',
      key: 'total_discount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
  ];

  const topItemsColumns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: any, record: TopItem) => (
        <div>
          <div><strong>{record.brand}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.item_description}
          </div>
        </div>
      ),
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: 'Total Sales',
      dataIndex: 'total_sales',
      key: 'total_sales',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Bills',
      dataIndex: 'bill_count',
      key: 'bill_count',
      render: (count: number) => count.toLocaleString(),
    },
  ];

  const customerColumns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: CustomerAnalysis) => (
        <div>
          <div><strong>{record.name}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.mobile}
          </div>
        </div>
      ),
    },
    {
      title: 'Visits',
      dataIndex: 'total_visits',
      key: 'total_visits',
      render: (visits: number) => visits.toLocaleString(),
    },
    {
      title: 'Total Spent',
      dataIndex: 'total_spent',
      key: 'total_spent',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Avg Bill',
      dataIndex: 'avg_bill_value',
      key: 'avg_bill_value',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Last Visit',
      dataIndex: 'last_visit',
      key: 'last_visit',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const gstColumns = [
    {
      title: 'HSN Code',
      dataIndex: 'hsnCode',
      key: 'hsnCode',
      render: (code: string) => <span style={{ fontFamily: 'monospace' }}>{code}</span>,
    },
    {
      title: 'Taxable Amount',
      dataIndex: 'taxableAmount',
      key: 'taxableAmount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'CGST',
      dataIndex: 'cgst',
      key: 'cgst',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'SGST',
      dataIndex: 'sgst',
      key: 'sgst',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'IGST',
      dataIndex: 'igst',
      key: 'igst',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Rate %',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${rate}%`,
    },
  ];

  const tabItems = [
    {
      key: 'sales',
      label: 'Sales Report',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic title="Total Sales" value={getTotalSales()} prefix="₹" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Total Bills" value={getTotalBills()} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Total Tax" value={getTotalTax()} prefix="₹" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Total Discount" value={getTotalDiscount()} prefix="₹" />
              </Card>
            </Col>
          </Row>

          <Card title="Daily Sales Summary">
            <Spin spinning={loading}>
              <Table
                columns={salesColumns}
                dataSource={salesData}
                rowKey="date"
                pagination={false}
                summary={(pageData) => {
                  const totalBills = pageData.reduce((sum, item) => sum + item.total_bills, 0);
                  const totalSales = pageData.reduce((sum, item) => sum + item.total_sales, 0);
                  const totalTax = pageData.reduce((sum, item) => sum + item.total_tax, 0);
                  const totalDiscount = pageData.reduce((sum, item) => sum + item.total_discount, 0);

                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{totalBills.toLocaleString()}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <strong>₹{totalSales.toLocaleString()}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <strong>₹{totalTax.toLocaleString()}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <strong>₹{totalDiscount.toLocaleString()}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Spin>
          </Card>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Top Items',
      children: (
        <Card title="Top Selling Items">
          <Spin spinning={loading}>
            <Table
              columns={topItemsColumns}
              dataSource={topItems}
              rowKey="item_id"
              pagination={false}
            />
          </Spin>
        </Card>
      ),
    },
    {
      key: 'customers',
      label: 'Customer Analysis',
      children: (
        <Card title="Customer Analysis">
          <Spin spinning={loading}>
            <Table
              columns={customerColumns}
              dataSource={customerAnalysis}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} customers`,
              }}
            />
          </Spin>
        </Card>
      ),
    },
    {
      key: 'gst',
      label: 'GST Report',
      children: (
        <div>
          {gstReport && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Taxable Amount" 
                      value={gstReport.summary.totalTaxableAmount} 
                      prefix="₹" 
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total CGST" 
                      value={gstReport.summary.totalCGST} 
                      prefix="₹" 
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total SGST" 
                      value={gstReport.summary.totalSGST} 
                      prefix="₹" 
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total IGST" 
                      value={gstReport.summary.totalIGST} 
                      prefix="₹" 
                    />
                  </Card>
                </Col>
              </Row>

              <Card title="HSN-wise GST Breakdown">
                <Spin spinning={loading}>
                  <Table
                    columns={gstColumns}
                    dataSource={gstReport.hsnWise}
                    rowKey="hsnCode"
                    pagination={false}
                    summary={(pageData) => {
                      const totalTaxable = pageData.reduce((sum, item) => sum + item.taxableAmount, 0);
                      const totalCGST = pageData.reduce((sum, item) => sum + item.cgst, 0);
                      const totalSGST = pageData.reduce((sum, item) => sum + item.sgst, 0);
                      const totalIGST = pageData.reduce((sum, item) => sum + item.igst, 0);

                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <strong>Total</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong>₹{totalTaxable.toLocaleString()}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <strong>₹{totalCGST.toLocaleString()}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <strong>₹{totalSGST.toLocaleString()}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>
                            <strong>₹{totalIGST.toLocaleString()}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <strong>-</strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Spin>
              </Card>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="reports-screen">
      <div className="reports-header">
        <Title level={3} style={{ margin: 0 }}>Reports & Analytics</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('PDF')}>
            Export PDF
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('Excel')}>
            Export Excel
          </Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </Space>
      </div>

      <div className="reports-content">
        {/* Filters */}
        <Card className="reports-filters">
          <Row gutter={16} align="middle">
            <Col span={6}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: '100%' }}
              >
                <Option value="sales">Sales Report</Option>
                <Option value="inventory">Inventory Report</Option>
                <Option value="customers">Customer Report</Option>
                <Option value="gst">GST Report</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={loadReportData} loading={loading}>
                Generate Report
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Report Content */}
        <Tabs items={tabItems} />
      </div>
    </div>
  );
};

export default ReportsScreen;