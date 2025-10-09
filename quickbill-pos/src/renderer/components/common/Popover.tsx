import React from 'react';
import { Popover as AntPopover, PopoverProps as AntPopoverProps } from 'antd';

interface PopoverProps extends AntPopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: React.ReactNode;
  trigger?: 'hover' | 'focus' | 'click' | 'contextMenu';
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  arrowPointAtCenter?: boolean;
  autoAdjustOverflow?: boolean;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

const Popover: React.FC<PopoverProps> = ({
  children,
  content,
  title,
  trigger = 'hover',
  placement = 'top',
  visible,
  onVisibleChange,
  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0.1,
  overlayClassName,
  overlayStyle,
  arrowPointAtCenter = false,
  autoAdjustOverflow = true,
  getPopupContainer,
  ...props
}) => {
  return (
    <AntPopover
      content={content}
      title={title}
      trigger={trigger}
      placement={placement}
      visible={visible}
      onVisibleChange={onVisibleChange}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      overlayClassName={overlayClassName}
      overlayStyle={overlayStyle}
      arrowPointAtCenter={arrowPointAtCenter}
      autoAdjustOverflow={autoAdjustOverflow}
      getPopupContainer={getPopupContainer}
      {...props}
    >
      {children}
    </AntPopover>
  );
};

export default Popover;