import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { POSScreen } from './pages/pos/POSScreen';
import { InventoryScreen } from './pages/inventory/InventoryScreen';
import { CustomersScreen } from './pages/customers/CustomersScreen';
import { ReportsScreen } from './pages/reports/ReportsScreen';
import { ReturnsScreen } from './pages/returns/ReturnsScreen';
import { LoginScreen } from './pages/auth/LoginScreen';
import { AppLayout } from './components/common/AppLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import POSErrorBoundary from './components/common/POSErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAppStore } from './store/app.store';
import './App.css';

const App: React.FC = () => {
  const { theme: appTheme } = useAppStore();

  return (
    <ErrorBoundary>
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
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Navigate to="/pos" replace />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pos" element={
              <ProtectedRoute>
                <AppLayout>
                  <POSErrorBoundary>
                    <POSScreen />
                  </POSErrorBoundary>
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <InventoryScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <AppLayout>
                  <CustomersScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <ReportsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/returns" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <ReturnsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;