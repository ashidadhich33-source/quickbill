import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

interface ButtonProps extends AntButtonProps {
  children: React.ReactNode;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large';
  shape?: 'default' | 'circle' | 'round';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = 'default',
  size = 'middle',
  shape = 'default',
  icon,
  loading = false,
  disabled = false,
  block = false,
  onClick,
  ...props
}) => {
  return (
    <AntButton
      type={type}
      size={size}
      shape={shape}
      icon={icon}
      loading={loading}
      disabled={disabled}
      block={block}
      onClick={onClick}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button;