import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { POSScreen } from './pages/pos/POSScreen';
import { InventoryScreen } from './pages/inventory/InventoryScreen';
import { CustomersScreen } from './pages/customers/CustomersScreen';
import { ReportsScreen } from './pages/reports/ReportsScreen';
import { ReturnsScreen } from './pages/returns/ReturnsScreen';
import { LoginScreen } from './pages/auth/LoginScreen';
import SuppliersScreen from './pages/suppliers/SuppliersScreen';
import PurchaseOrdersScreen from './pages/purchase-orders/PurchaseOrdersScreen';
import PurchaseReceiptsScreen from './pages/purchase-receipts/PurchaseReceiptsScreen';
import SupplierPaymentsScreen from './pages/supplier-payments/SupplierPaymentsScreen';
import PurchaseReturnsScreen from './pages/purchase-returns/PurchaseReturnsScreen';
import PurchaseReportsScreen from './pages/purchase-reports/PurchaseReportsScreen';
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
            <Route path="/suppliers" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <SuppliersScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/purchase-orders" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <PurchaseOrdersScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/purchase-receipts" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <PurchaseReceiptsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/supplier-payments" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <SupplierPaymentsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/purchase-returns" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <PurchaseReturnsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/purchase-reports" element={
              <ProtectedRoute requiredRole="MANAGER">
                <AppLayout>
                  <PurchaseReportsScreen />
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