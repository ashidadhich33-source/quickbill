import React from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';

interface TableProps<T = any> extends AntTableProps<T> {
  dataSource: T[];
  columns: any[];
  loading?: boolean;
  pagination?: boolean | object;
  scroll?: { x?: number; y?: number };
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index?: number) => any;
}

const Table = <T extends Record<string, any>>({
  dataSource,
  columns,
  loading = false,
  pagination = true,
  scroll,
  size = 'middle',
  bordered = false,
  rowKey = 'id',
  onRow,
  ...props
}: TableProps<T>) => {
  return (
    <AntTable
      dataSource={dataSource}
      columns={columns}
      loading={loading}
      pagination={pagination}
      scroll={scroll}
      size={size}
      bordered={bordered}
      rowKey={rowKey}
      onRow={onRow}
      {...props}
    />
  );
};

export default Table;