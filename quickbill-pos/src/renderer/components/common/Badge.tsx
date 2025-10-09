import React from 'react';
import { Badge as AntBadge, BadgeProps as AntBadgeProps } from 'antd';

interface BadgeProps extends AntBadgeProps {
  children?: React.ReactNode;
  count?: number | React.ReactNode;
  showZero?: boolean;
  overflowCount?: number;
  dot?: boolean;
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  text?: string;
  color?: string;
  size?: 'default' | 'small';
  offset?: [number, number];
}

const Badge: React.FC<BadgeProps> = ({
  children,
  count,
  showZero = false,
  overflowCount = 99,
  dot = false,
  status,
  text,
  color,
  size = 'default',
  offset,
  ...props
}) => {
  return (
    <AntBadge
      count={count}
      showZero={showZero}
      overflowCount={overflowCount}
      dot={dot}
      status={status}
      text={text}
      color={color}
      size={size}
      offset={offset}
      {...props}
    >
      {children}
    </AntBadge>
  );
};

export default Badge;