import React from 'react';
import { Tag as AntTag, TagProps as AntTagProps } from 'antd';

interface TagProps extends AntTagProps {
  children: React.ReactNode;
  color?: string;
  closable?: boolean;
  onClose?: (e: React.MouseEvent<HTMLElement>) => void;
  visible?: boolean;
  icon?: React.ReactNode;
}

const Tag: React.FC<TagProps> = ({
  children,
  color,
  closable = false,
  onClose,
  visible = true,
  icon,
  ...props
}) => {
  if (!visible) return null;

  return (
    <AntTag
      color={color}
      closable={closable}
      onClose={onClose}
      icon={icon}
      {...props}
    >
      {children}
    </AntTag>
  );
};

export default Tag;