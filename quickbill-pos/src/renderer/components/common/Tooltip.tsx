import React from 'react';
import { Tooltip as AntTooltip, TooltipProps as AntTooltipProps } from 'antd';

type TooltipProps = AntTooltipProps & {
  children: React.ReactNode;
  title: React.ReactNode;
};

const Tooltip: React.FC<TooltipProps> = ({
  children,
  title,
  placement = 'top',
  trigger = 'hover',
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
    <AntTooltip
      title={title}
      placement={placement}
      trigger={trigger}
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
    </AntTooltip>
  );
};

export default Tooltip;