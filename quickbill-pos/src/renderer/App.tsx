import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { POSScreen } from './pages/pos/POSScreen';
import { InventoryScreen } from './pages/inventory/InventoryScreen';
import { CustomersScreen } from './pages/customers/CustomersScreen';
import { ReportsScreen } from './pages/reports/ReportsScreen';
import { AppLayout } from './components/common/AppLayout';
import { useAppStore } from './store/app.store';
import './App.css';

const App: React.FC = () => {
  const { theme: appTheme } = useAppStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="/pos" element={<POSScreen />} />
            <Route path="/inventory" element={<InventoryScreen />} />
            <Route path="/customers" element={<CustomersScreen />} />
            <Route path="/reports" element={<ReportsScreen />} />
          </Routes>
        </AppLayout>
      </Router>
    </ConfigProvider>
  );
};

export default App;