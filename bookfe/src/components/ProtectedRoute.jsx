import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUser, hasResourcePermission } from '../utils/auth';

export default function ProtectedRoute({ children, allowedRoles, requiredPermPrefix, requireSuperAdmin = false }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const user = getUser();
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // Super Admin direct pass
  if (isSuperAdmin) {
    return children ? children : <Outlet />;
  }

  // Check super-admin-only requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if route is an Admin Portal route
  const isAdminRoute = allowedRoles && (allowedRoles.includes('ADMIN') || allowedRoles.includes('SUPER_ADMIN'));

  if (isAdminRoute) {
    // Reject if role cannot access Admin Portal
    if (user.canAccessAdmin === false) {
      return <Navigate to="/login" replace />;
    }

    // Check specific resource permission if requiredPermPrefix is specified
    if (requiredPermPrefix) {
      const hasPerm = hasResourcePermission(user, requiredPermPrefix);
      if (!hasPerm) {
        return <Navigate to="/dashboard" replace />;
      }
    }

    return children ? children : <Outlet />;
  }

  // Check if route is a User Portal route (e.g., /home, /profile)
  const isUserRoute = allowedRoles && allowedRoles.includes('CLIENT');
  if (isUserRoute) {
    if (user.canAccessUser === false) {
      return <Navigate to="/admin/login" replace />;
    }
    return children ? children : <Outlet />;
  }

  return children ? children : <Outlet />;
}
