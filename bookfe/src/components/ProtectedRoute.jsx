import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const user = getUser();
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'CLIENT';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children ? children : <Outlet />;
}

