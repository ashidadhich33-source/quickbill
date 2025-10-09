import React, { useState, useEffect } from 'react';
import {
  Modal, Input, Table, Button, Space, Tag, message, Spin, Empty
} from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

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
  category: string;
  sub_category: string;
}

interface ItemSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
  categoryFilter?: string;
}

const ItemSearchModal: React.FC<ItemSearchModalProps> = ({
  visible,
  onClose,
  onSelectItem,
  categoryFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    if (visible) {
      if (categoryFilter) {
        loadItemsByCategory(categoryFilter);
      } else {
        loadItems();
      }
    }
  }, [visible, categoryFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.searchItems(searchTerm || '');
      if (result.success) {
        setItems(result.data || []);
      } else {
        message.error('Error loading items');
      }
    } catch (error) {
      message.error('Error loading items');
    } finally {
      setLoading(false);
    }
  };

  const loadItemsByCategory = async (category: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getItemsByCategory(category);
      if (result.success) {
        setItems(result.data || []);
      } else {
        message.error('Error loading items');
      }
    } catch (error) {
      message.error('Error loading items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadItems();
  };

  const handleSelectItem = (item: Item) => {
    onSelectItem(item);
  };

  const handleAddSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select items to add');
      return;
    }

    selectedRowKeys.forEach(key => {
      const item = items.find(i => i.id === key);
      if (item) {
        onSelectItem(item);
      }
    });

    setSelectedRowKeys([]);
    onClose();
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
      width: 80,
      render: (stock: number) => (
        <Tag color={stock > 0 ? 'green' : 'red'}>
          {stock}
        </Tag>
      ),
      sorter: (a: Item, b: Item) => a.current_stock - b.current_stock,
    },
    {
      title: 'GST%',
      dataIndex: 'gst_percentage',
      key: 'gst_percentage',
      width: 80,
      render: (gst: number) => `${gst}%`,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: Item) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleSelectItem(record)}
        >
          Add
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: Item) => ({
      disabled: record.current_stock === 0,
    }),
  };

  return (
    <Modal
      title="Search Items"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="add-selected"
          type="primary"
          onClick={handleAddSelected}
          disabled={selectedRowKeys.length === 0}
        >
          Add Selected ({selectedRowKeys.length})
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Search by brand, description, or barcode"
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
          columns={columns}
          dataSource={items}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ y: 400 }}
          onRow={(record) => ({
            onDoubleClick: () => handleSelectItem(record),
          })}
          locale={{
            emptyText: (
              <Empty
                description="No items found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Spin>
    </Modal>
  );
};

export default ItemSearchModal;