import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

interface CardProps extends AntCardProps {
  children: React.ReactNode;
  title?: string;
  extra?: React.ReactNode;
  loading?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  size?: 'default' | 'small';
  headStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  actions?: React.ReactNode[];
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  extra,
  loading = false,
  hoverable = false,
  bordered = true,
  size = 'default',
  headStyle,
  bodyStyle,
  actions,
  ...props
}) => {
  return (
    <AntCard
      title={title}
      extra={extra}
      loading={loading}
      hoverable={hoverable}
      bordered={bordered}
      size={size}
      headStyle={headStyle}
      bodyStyle={bodyStyle}
      actions={actions}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;