import React, { useState, useEffect, useCallback } from 'react';
import { Pagination, Spin, Empty, Button, Space, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PaginationWrapperProps<T> {
  data: T[];
  total: number;
  pageSize?: number;
  currentPage?: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onRefresh?: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  emptyText?: string;
  showTotal?: boolean;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: string[];
  className?: string;
  style?: React.CSSProperties;
}

function PaginationWrapper<T>({
  data,
  total,
  pageSize = 20,
  currentPage = 1,
  loading = false,
  onPageChange,
  onRefresh,
  renderItem,
  renderHeader,
  renderFooter,
  emptyText = 'No data available',
  showTotal = true,
  showSizeChanger = true,
  showQuickJumper = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  className,
  style
}: PaginationWrapperProps<T>) {
  const [internalPage, setInternalPage] = useState(currentPage);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);

  useEffect(() => {
    setInternalPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setInternalPageSize(pageSize);
  }, [pageSize]);

  const handlePageChange = useCallback((page: number, size?: number) => {
    const newPageSize = size || internalPageSize;
    setInternalPage(page);
    setInternalPageSize(newPageSize);
    onPageChange(page, newPageSize);
  }, [internalPageSize, onPageChange]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      onPageChange(internalPage, internalPageSize);
    }
  }, [onRefresh, onPageChange, internalPage, internalPageSize]);

  const renderPagination = () => {
    if (total === 0) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '16px',
        padding: '0 16px'
      }}>
        <div>
          {showTotal && (
            <Text type="secondary">
              Showing {((internalPage - 1) * internalPageSize) + 1} to{' '}
              {Math.min(internalPage * internalPageSize, total)} of {total} items
            </Text>
          )}
        </div>
        
        <Space>
          {onRefresh && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
              size="small"
            >
              Refresh
            </Button>
          )}
          
          <Pagination
            current={internalPage}
            total={total}
            pageSize={internalPageSize}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger={showSizeChanger}
            showQuickJumper={showQuickJumper}
            pageSizeOptions={pageSizeOptions}
            showTotal={false}
            size="small"
          />
        </Space>
      </div>
    );
  };

  if (loading && data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (total === 0 && !loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <Empty description={emptyText} />
        {onRefresh && (
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            style={{ marginTop: '16px' }}
          >
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {renderHeader && renderHeader()}
      
      <div style={{ minHeight: '200px' }}>
        {data.map((item, index) => renderItem(item, index))}
      </div>
      
      {renderFooter && renderFooter()}
      
      {renderPagination()}
    </div>
  );
}

export default PaginationWrapper;