import React, { useState, useEffect, useCallback } from 'react';
import { Table, Pagination, Spin, Empty, Button, Space, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { TableProps, ColumnType } from 'antd/es/table';

const { Text } = Typography;

interface PaginatedTableProps<T> extends Omit<TableProps<T>, 'pagination' | 'dataSource'> {
  data: T[];
  total: number;
  pageSize?: number;
  currentPage?: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onRefresh?: () => void;
  emptyText?: string;
  showTotal?: boolean;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: string[];
  paginationPosition?: 'top' | 'bottom' | 'both';
  className?: string;
  style?: React.CSSProperties;
}

function PaginatedTable<T extends Record<string, any>>({
  data,
  total,
  pageSize = 20,
  currentPage = 1,
  loading = false,
  onPageChange,
  onRefresh,
  emptyText = 'No data available',
  showTotal = true,
  showSizeChanger = true,
  showQuickJumper = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  paginationPosition = 'bottom',
  className,
  style,
  ...tableProps
}: PaginatedTableProps<T>) {
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

  const renderPagination = (position: 'top' | 'bottom') => {
    if (total === 0) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: position === 'top' ? '0 0 16px 0' : '16px 0 0 0',
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
            showTotal={undefined}
            size="small"
          />
        </Space>
      </div>
    );
  };

  const paginationConfig = {
    current: internalPage,
    total: total,
    pageSize: internalPageSize,
    onChange: handlePageChange,
    onShowSizeChange: handlePageChange,
    showSizeChanger: showSizeChanger,
    showQuickJumper: showQuickJumper,
    pageSizeOptions: pageSizeOptions,
    showTotal: showTotal ? (total: number, range: [number, number]) => 
      `${range[0]}-${range[1]} of ${total} items` : false,
    position: paginationPosition === 'both' ? ['topRight', 'bottomRight'] : [paginationPosition + 'Right'],
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
      {paginationPosition === 'top' || paginationPosition === 'both' ? renderPagination('top') : null}
      
      <Table
        {...tableProps}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ y: 400 }}
      />
      
      {paginationPosition === 'bottom' || paginationPosition === 'both' ? renderPagination('bottom') : null}
    </div>
  );
}

export default PaginatedTable;