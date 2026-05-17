import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, message, Modal, Form,
  InputNumber, Select, Row, Col, Statistic, Typography, Tabs
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ImportOutlined, ExportOutlined, WarningOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import PaginatedTable from '../../components/common/PaginatedTable';

const { Title } = Typography;
const { Option } = Select;

interface Item {
  id: number;
  brand: string;
  style_code: string;
  item_description: string;
  size: string;
  shade: string;
  barcode: string;
  mrp: number;
  gst_percentage: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  category: string;
  sub_category: string;
  is_active: boolean;
}

const InventoryScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = useCallback(async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      // For now, we'll use searchItems with pagination simulation
      // In a real implementation, you'd have a dedicated paginated endpoint
      const result = await window.electronAPI.searchItems(searchTerm);
      if (result.success) {
        const allItems = result.data || [];
        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;
        const paginatedItems = allItems.slice(startIndex, endIndex);
        
        setItems(paginatedItems);
        setTotalItems(allItems.length);
      } else {
        message.error('Error loading items');
      }
    } catch (error) {
      message.error('Error loading items');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    loadItems(page, size);
  }, [loadItems]);

  const handleSearch = () => {
    loadItems();
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    form.resetFields();
    setShowItemModal(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = (item: Item) => {
    Modal.confirm({
      title: 'Delete Item',
      content: `Are you sure you want to delete "${item.item_description}"?`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const result = await window.electronAPI.deleteItem(item.id);
          if (result.success) {
            message.success('Item deleted successfully');
            loadItems();
          } else {
            message.error('Error deleting item');
          }
        } catch (error) {
          message.error('Error deleting item');
        }
      },
    });
  };

  const handleSaveItem = async (values: any) => {
    try {
      let result;
      if (editingItem) {
        result = await window.electronAPI.updateItem(editingItem.id, values);
      } else {
        result = await window.electronAPI.createItem(values);
      }

      if (result.success) {
        message.success(`Item ${editingItem ? 'updated' : 'created'} successfully`);
        setShowItemModal(false);
        loadItems();
      } else {
        message.error(`Error ${editingItem ? 'updating' : 'creating'} item`);
      }
    } catch (error) {
      message.error(`Error ${editingItem ? 'updating' : 'creating'} item`);
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

      const result = await window.electronAPI.importItemsFromCSV(selectedFile.data);
      if (result.success) {
        message.success('Items imported successfully');
        loadItems();
      } else {
        message.error(result.error || 'Error importing items');
      }
    } catch (error) {
      message.error('Error importing items');
    }
  };

  const handleExport = async () => {
    try {
      const result = await window.electronAPI.exportItemsToCSV('inventory_export.csv');
      if (result.success) {
        message.success('Items exported successfully');
      } else {
        message.error('Error exporting items');
      }
    } catch (error) {
      message.error('Error exporting items');
    }
  };

  const getFilteredItems = () => {
    let filtered = items;

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(item => item.current_stock <= item.min_stock);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => item.current_stock === 0);
    }

    return filtered;
  };

  const getStatistics = () => {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.current_stock <= item.min_stock).length;
    const outOfStockItems = items.filter(item => item.current_stock === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.current_stock * item.mrp), 0);

    return { totalItems, lowStockItems, outOfStockItems, totalValue };
  };

  const columns = [
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
      sorter: (a: Item, b: Item) => a.brand.localeCompare(b.brand),
    },
    {
      title: 'Description',
      dataIndex: 'item_description',
      key: 'item_description',
      ellipsis: true,
      sorter: (a: Item, b: Item) => a.item_description.localeCompare(b.item_description),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 80,
    },
    {
      title: 'Shade',
      dataIndex: 'shade',
      key: 'shade',
      width: 100,
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 120,
    },
    {
      title: 'MRP',
      dataIndex: 'mrp',
      key: 'mrp',
      width: 100,
      render: (price: number) => `₹${price.toFixed(2)}`,
      sorter: (a: Item, b: Item) => a.mrp - b.mrp,
    },
    {
      title: 'Stock',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 100,
      render: (stock: number, record: Item) => (
        <div>
          <Tag color={stock === 0 ? 'red' : stock <= record.min_stock ? 'orange' : 'green'}>
            {stock}
          </Tag>
          {stock <= record.min_stock && (
            <WarningOutlined style={{ color: '#faad14', marginLeft: 4 }} />
          )}
        </div>
      ),
      sorter: (a: Item, b: Item) => a.current_stock - b.current_stock,
    },
    {
      title: 'Min/Max',
      key: 'stock_range',
      width: 100,
      render: (_: any, record: Item) => (
        <span>{record.min_stock}/{record.max_stock}</span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: Item) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
          />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteItem(record)}
          />
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

  const statistics = getStatistics();
  const filteredItems = getFilteredItems();

  const tabItems = [
    {
      key: 'all',
      label: 'All Items',
      children: (
        <PaginatedTable
          columns={columns}
          data={filteredItems}
          total={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onPageChange={handlePageChange}
          onRefresh={loadItems}
          rowSelection={rowSelection}
          emptyText="No items found"
          showTotal={true}
          showSizeChanger={true}
          showQuickJumper={true}
        />
      ),
    },
    {
      key: 'low-stock',
      label: 'Low Stock',
      children: (
        <Table
          columns={columns}
          dataSource={filteredItems.filter(item => item.current_stock <= item.min_stock)}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      key: 'out-of-stock',
      label: 'Out of Stock',
      children: (
        <Table
          columns={columns}
          dataSource={filteredItems.filter(item => item.current_stock === 0)}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      ),
    },
  ];

  return (
    <div className="inventory-screen">
      <div className="inventory-header">
        <Title level={3} style={{ margin: 0 }}>Inventory Management</Title>
        <Space>
          <Button icon={<ImportOutlined />} onClick={handleImport}>
            Import
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Export
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateItem}>
            Add Item
          </Button>
        </Space>
      </div>

      <div className="inventory-content">
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Items" value={statistics.totalItems} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Low Stock" 
                value={statistics.lowStockItems} 
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Out of Stock" 
                value={statistics.outOfStockItems} 
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Total Value" 
                value={statistics.totalValue} 
                prefix="₹"
                formatter={(value) => value.toLocaleString()}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="inventory-filters">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="SHIRTS">Shirts</Option>
                <Option value="JEANS">Jeans</Option>
                <Option value="DRESS">Dress</Option>
                <Option value="SHOES">Shoes</Option>
                <Option value="ACCESSORIES">Accessories</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Stock Status"
                value={stockFilter}
                onChange={setStockFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">All</Option>
                <Option value="low">Low Stock</Option>
                <Option value="out">Out of Stock</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={handleSearch}>
                Search
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Items Table */}
        <Card className="inventory-table">
          <Tabs items={tabItems} />
        </Card>
      </div>

      {/* Item Modal */}
      <Modal
        title={editingItem ? 'Edit Item' : 'Create Item'}
        open={showItemModal}
        onCancel={() => setShowItemModal(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveItem}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="Brand"
                rules={[{ required: true, message: 'Please enter brand' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="style_code"
                label="Style Code"
                rules={[{ required: true, message: 'Please enter style code' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="item_description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="size" label="Size">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shade" label="Shade">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="barcode" label="Barcode">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="mrp"
                label="MRP"
                rules={[{ required: true, message: 'Please enter MRP' }]}
              >
                <InputNumber style={{ width: '100%' }} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gst_percentage"
                label="GST %"
                rules={[{ required: true, message: 'Please enter GST percentage' }]}
              >
                <InputNumber style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="current_stock" label="Current Stock">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="min_stock" label="Min Stock">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="max_stock" label="Max Stock">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="Category">
                <Select>
                  <Option value="SHIRTS">Shirts</Option>
                  <Option value="JEANS">Jeans</Option>
                  <Option value="DRESS">Dress</Option>
                  <Option value="SHOES">Shoes</Option>
                  <Option value="ACCESSORIES">Accessories</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryScreen;