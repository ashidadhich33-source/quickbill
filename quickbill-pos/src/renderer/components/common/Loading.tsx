import React from 'react';
import { Spin, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  text?: string;
  spinning?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'default', 
  text = 'Loading...', 
  spinning = true 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px' 
    }}>
      <Space direction="vertical" align="center">
        <Spin 
          size={size} 
          spinning={spinning}
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        />
        {text && <span>{text}</span>}
      </Space>
    </div>
  );
};

export default Loading;