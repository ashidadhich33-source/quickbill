import React from 'react';
import { Form as AntForm, FormProps as AntFormProps } from 'antd';

interface FormProps extends AntFormProps {
  children: React.ReactNode;
  onSubmit?: (values: any) => void;
  initialValues?: any;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: any;
  wrapperCol?: any;
  size?: 'small' | 'middle' | 'large';
}

const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  initialValues,
  layout = 'vertical',
  labelCol,
  wrapperCol,
  size = 'middle',
  ...props
}) => {
  return (
    <AntForm
      layout={layout}
      initialValues={initialValues}
      onFinish={onSubmit}
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      size={size}
      {...props}
    >
      {children}
    </AntForm>
  );
};

export default Form;