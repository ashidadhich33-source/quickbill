import React from 'react';
import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';

const { Option } = AntSelect;

interface SelectProps extends AntSelectProps {
  children?: React.ReactNode;
  options?: Array<{ value: any; label: string; disabled?: boolean }>;
  placeholder?: string;
  value?: any;
  onChange?: (value: any, option?: any) => void;
  onSelect?: (value: any, option?: any) => void;
  onDeselect?: (value: any, option?: any) => void;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  showSearch?: boolean;
  filterOption?: boolean | ((input: string, option?: any) => boolean);
  mode?: 'multiple' | 'tags';
}

const Select: React.FC<SelectProps> = ({
  children,
  options = [] as NonNullable<SelectProps['options']>,
  placeholder,
  value,
  onChange,
  onSelect,
  onDeselect,
  size = 'middle',
  disabled = false,
  loading = false,
  allowClear = false,
  showSearch = false,
  filterOption = true,
  mode,
  ...props
}) => {
  return (
    <AntSelect
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      onDeselect={onDeselect}
      size={size}
      disabled={disabled}
      loading={loading}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={filterOption}
      mode={mode}
      {...props}
    >
      {children || options.map(option => (
        <Option 
          key={option.value} 
          value={option.value} 
          disabled={option.disabled}
        >
          {option.label}
        </Option>
      ))}
    </AntSelect>
  );
};

export default Select;