import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCartOutlined, DatabaseOutlined, UserOutlined,
  BarChartOutlined, UndoOutlined, SettingOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined,
  ShopOutlined, FileTextOutlined, InboxOutlined, DollarOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../store/app.store';
import { useAuthStore } from '../../store/auth.store';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useAppStore();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/pos',
      icon: <ShoppingCartOutlined />,
      label: 'POS',
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: 'Inventory',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/returns',
      icon: <UndoOutlined />,
      label: 'Returns',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'purchase-management',
      icon: <ShopOutlined />,
      label: 'Purchase Management',
      children: [
        {
          key: '/suppliers',
          icon: <UserOutlined />,
          label: 'Suppliers',
        },
        {
          key: '/purchase-orders',
          icon: <FileTextOutlined />,
          label: 'Purchase Orders',
        },
        {
          key: '/purchase-receipts',
          icon: <InboxOutlined />,
          label: 'Purchase Receipts',
        },
        {
          key: '/supplier-payments',
          icon: <DollarOutlined />,
          label: 'Supplier Payments',
        },
      ],
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // Handle profile
        message.info('Profile feature coming soon');
        break;
      case 'settings':
        // Handle settings
        message.info('Settings feature coming soon');
        break;
      case 'logout':
        try {
          await logout();
          message.success('Logged out successfully');
          navigate('/login');
        } catch (error) {
          message.error('Logout failed');
        }
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: theme === 'dark' ? '#001529' : '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ 
            color: theme === 'dark' ? '#fff' : '#1890ff',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            {collapsed ? 'QB' : 'QuickBill POS'}
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
          }}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </Space>

          <Space>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: '16px' }}
            />
            
            <Button
              type="text"
              onClick={toggleTheme}
              style={{ fontSize: '16px' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.full_name || 'User'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ 
          margin: '24px 16px',
          padding: 24,
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 112px)',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;