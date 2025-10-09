import React from 'react';
import { Space as AntSpace, SpaceProps as AntSpaceProps } from 'antd';

interface SpaceProps extends AntSpaceProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number;
  align?: 'start' | 'end' | 'center' | 'baseline';
  wrap?: boolean;
  split?: React.ReactNode;
}

const Space: React.FC<SpaceProps> = ({
  children,
  direction = 'horizontal',
  size = 'small',
  align,
  wrap = false,
  split,
  ...props
}) => {
  return (
    <AntSpace
      direction={direction}
      size={size}
      align={align}
      wrap={wrap}
      split={split}
      {...props}
    >
      {children}
    </AntSpace>
  );
};

export default Space;