import React from 'react';
import { Row as AntRow, RowProps as AntRowProps } from 'antd';

interface RowProps extends AntRowProps {
  children: React.ReactNode;
  gutter?: number | [number, number] | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number };
  align?: 'top' | 'middle' | 'bottom';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly';
  wrap?: boolean;
}

const Row: React.FC<RowProps> = ({
  children,
  gutter = 0,
  align,
  justify,
  wrap = true,
  ...props
}) => {
  return (
    <AntRow
      gutter={gutter}
      align={align}
      justify={justify}
      wrap={wrap}
      {...props}
    >
      {children}
    </AntRow>
  );
};

export default Row;