import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

interface InputProps extends AntInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPressEnter?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  onPressEnter,
  prefix,
  suffix,
  size = 'middle',
  disabled = false,
  readOnly = false,
  maxLength,
  showCount = false,
  ...props
}) => {
  return (
    <AntInput
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onPressEnter={onPressEnter}
      prefix={prefix}
      suffix={suffix}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      showCount={showCount}
      {...props}
    />
  );
};

export default Input;