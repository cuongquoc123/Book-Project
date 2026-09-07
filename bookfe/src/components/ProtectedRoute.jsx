import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUser, hasResourcePermission } from '../utils/auth';

export default function ProtectedRoute({
  children,
  allowedRoles,
  portal, // 'ADMIN' | 'USER'
  requiredPermPrefix,
  requireSuperAdmin = false,
}) {
  if (!isAuthenticated()) {
    const isOnlyAdmin = allowedRoles && !allowedRoles.includes('CLIENT');
    return <Navigate to={isOnlyAdmin ? '/admin/login' : '/login'} replace />;
  }

  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // Super Admin has unrestricted access to all routes
  if (isSuperAdmin) {
    return children ? children : <Outlet />;
  }

  // Super Admin only requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'CLIENT') {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 1. If this is an Admin route (portal is ADMIN or allowedRoles does not include CLIENT)
  const isAdminPortal = portal === 'ADMIN' || (allowedRoles && !allowedRoles.includes('CLIENT'));
  if (isAdminPortal) {
    if (user.canAccessAdmin === false) {
      return <Navigate to="/home" replace />;
    }

    if (requiredPermPrefix && !hasResourcePermission(user, requiredPermPrefix)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children ? children : <Outlet />;
  }

  // 2. If this is a User route (portal is USER or allowedRoles includes CLIENT)
  const isUserPortal = portal === 'USER' || (allowedRoles && allowedRoles.includes('CLIENT'));
  if (isUserPortal) {
    if (user.canAccessUser === false) {
      return <Navigate to="/dashboard" replace />;
    }
    return children ? children : <Outlet />;
  }

  return children ? children : <Outlet />;
}

