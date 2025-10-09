import React from 'react';
import { Col as AntCol, ColProps as AntColProps } from 'antd';

interface ColProps extends AntColProps {
  children: React.ReactNode;
  span?: number;
  offset?: number;
  order?: number;
  pull?: number;
  push?: number;
  xs?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number };
  sm?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number };
  md?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number };
  lg?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number };
  xl?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number };
  xxl?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number };
  flex?: number | string;
}

const Col: React.FC<ColProps> = ({
  children,
  span,
  offset,
  order,
  pull,
  push,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  flex,
  ...props
}) => {
  return (
    <AntCol
      span={span}
      offset={offset}
      order={order}
      pull={pull}
      push={push}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      xxl={xxl}
      flex={flex}
      {...props}
    >
      {children}
    </AntCol>
  );
};

export default Col;