import React from 'react';
import { Drawer as AntDrawer, DrawerProps as AntDrawerProps } from 'antd';

interface DrawerProps extends AntDrawerProps {
  children: React.ReactNode;
  title?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'default' | 'large';
  closable?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  zIndex?: number;
  bodyStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;
  footer?: React.ReactNode;
  extra?: React.ReactNode;
  onClose?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  afterOpenChange?: (open: boolean) => void;
  getContainer?: string | HTMLElement | (() => HTMLElement) | false;
  destroyOnClose?: boolean;
  forceRender?: boolean;
  autoFocus?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({
  children,
  title,
  placement = 'right',
  size = 'default',
  closable = true,
  mask = true,
  maskClosable = true,
  keyboard = true,
  zIndex = 1000,
  bodyStyle,
  headerStyle,
  footerStyle,
  footer,
  extra,
  onClose,
  afterOpenChange,
  getContainer,
  destroyOnClose = false,
  forceRender = false,
  autoFocus = true,
  ...props
}) => {
  return (
    <AntDrawer
      title={title}
      placement={placement}
      size={size}
      closable={closable}
      mask={mask}
      maskClosable={maskClosable}
      keyboard={keyboard}
      zIndex={zIndex}
      bodyStyle={bodyStyle}
      headerStyle={headerStyle}
      footerStyle={footerStyle}
      footer={footer}
      extra={extra}
      onClose={onClose}
      afterOpenChange={afterOpenChange}
      getContainer={getContainer}
      destroyOnClose={destroyOnClose}
      forceRender={forceRender}
      autoFocus={autoFocus}
      {...props}
    >
      {children}
    </AntDrawer>
  );
};

export default Drawer;