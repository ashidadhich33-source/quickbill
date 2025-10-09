import React from 'react';
import { Divider as AntDivider, DividerProps as AntDividerProps } from 'antd';

interface DividerProps extends AntDividerProps {
  children?: React.ReactNode;
  type?: 'horizontal' | 'vertical';
  orientation?: 'left' | 'right' | 'center';
  plain?: boolean;
  dashed?: boolean;
}

const Divider: React.FC<DividerProps> = ({
  children,
  type = 'horizontal',
  orientation = 'center',
  plain = false,
  dashed = false,
  ...props
}) => {
  return (
    <AntDivider
      type={type}
      orientation={orientation}
      plain={plain}
      dashed={dashed}
      {...props}
    >
      {children}
    </AntDivider>
  );
};

export default Divider;