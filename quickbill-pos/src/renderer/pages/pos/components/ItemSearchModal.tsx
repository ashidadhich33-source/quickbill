import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal, Input, Button, Space, Tag, message, Spin, Empty, Row, Col, Typography
} from 'antd';
import { FixedSizeList as VirtualList } from 'react-window';
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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);


  const loadItems = useCallback(async (search: string = '') => {
    setLoading(true);
    try {
      const result = await window.electronAPI.searchItems(search);
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
  }, []);

  const loadItemsByCategory = useCallback(async (category: string) => {
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
  }, []);

  useEffect(() => {
    if (visible) {
      if (categoryFilter) {
        loadItemsByCategory(categoryFilter);
      } else {
        loadItems();
      }
    }
  }, [visible, categoryFilter, loadItems, loadItemsByCategory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Debounced search
  const debouncedSearch = useCallback((search: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      loadItems(search);
    }, 300);
    
    setSearchTimeout(timeout);
  }, [loadItems, searchTimeout]);

  const handleSearch = useCallback(() => {
    loadItems(searchTerm);
  }, [loadItems, searchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

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

  // Virtual list item renderer
  const ItemRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    const isSelected = selectedRowKeys.includes(item.id);
    const isOutOfStock = item.current_stock === 0;

    return (
      <div style={style}>
        <Row
          align="middle"
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: isSelected ? '#e6f7ff' : 'white',
            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            opacity: isOutOfStock ? 0.6 : 1
          }}
          onClick={() => !isOutOfStock && handleSelectItem(item)}
        >
          <Col span={1}>
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isOutOfStock}
              onChange={(e) => {
                e.stopPropagation();
                if (isSelected) {
                  setSelectedRowKeys(prev => prev.filter(key => key !== item.id));
                } else {
                  setSelectedRowKeys(prev => [...prev, item.id]);
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Typography.Text strong>{item.brand}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text ellipsis={{ tooltip: item.item_description }}>
              {item.item_description}
            </Typography.Text>
          </Col>
          <Col span={2}>
            <Typography.Text>{item.size || '-'}</Typography.Text>
          </Col>
          <Col span={2}>
            <Typography.Text>{item.shade || '-'}</Typography.Text>
          </Col>
          <Col span={3}>
            <Typography.Text code>{item.barcode || '-'}</Typography.Text>
          </Col>
          <Col span={2}>
            <Typography.Text strong>₹{item.mrp.toFixed(2)}</Typography.Text>
          </Col>
          <Col span={2}>
            <Tag color={item.current_stock > 0 ? 'green' : 'red'}>
              {item.current_stock}
            </Tag>
          </Col>
          <Col span={1}>
            <Typography.Text>{item.gst_percentage}%</Typography.Text>
          </Col>
          <Col span={1}>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectItem(item);
              }}
            />
          </Col>
        </Row>
      </div>
    );
  }, [items, selectedRowKeys, handleSelectItem]);

  // Header row for virtual list
  const HeaderRow = useMemo(() => (
    <Row
      style={{
        padding: '8px 16px',
        backgroundColor: '#fafafa',
        borderBottom: '2px solid #d9d9d9',
        fontWeight: 'bold'
      }}
    >
      <Col span={1}>Select</Col>
      <Col span={4}>Brand</Col>
      <Col span={6}>Description</Col>
      <Col span={2}>Size</Col>
      <Col span={2}>Shade</Col>
      <Col span={3}>Barcode</Col>
      <Col span={2}>MRP</Col>
      <Col span={2}>Stock</Col>
      <Col span={1}>GST%</Col>
      <Col span={1}>Action</Col>
    </Row>
  ), []);

  return (
    <Modal
      title="Search Items"
      open={visible}
      onCancel={onClose}
      width={1200}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </Space.Compact>
      </div>

      <Spin spinning={loading}>
        {items.length === 0 ? (
          <Empty
            description="No items found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            {HeaderRow}
            <VirtualList
              height={400}
              itemCount={items.length}
              itemSize={50}
              width="100%"
            >
              {ItemRow}
            </VirtualList>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default ItemSearchModal;