import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'CASHIER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      if (!isAuthenticated) {
        await checkAuth();
      }
      setIsChecking(false);
    };

    validateAuth();
  }, [isAuthenticated, checkAuth]);

  if (isChecking || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Check role hierarchy
    const roleHierarchy = {
      'CASHIER': 1,
      'MANAGER': 2,
      'ADMIN': 3
    };

    const userRoleLevel = roleHierarchy[user?.role || 'CASHIER'];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column'
        }}>
          <h2>Access Denied</h2>
          <p>You don&apos;t have permission to access this page.</p>
          <p>Required role: {requiredRole}</p>
          <p>Your role: {user?.role}</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;