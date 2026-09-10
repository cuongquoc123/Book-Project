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
    const isOnlyAdmin = portal === 'ADMIN' || (allowedRoles && !allowedRoles.includes('CLIENT'));
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

  // 1. If this is an Admin route (portal is ADMIN)
  const isAdminPortal = portal === 'ADMIN' || (allowedRoles && !allowedRoles.includes('CLIENT'));
  if (isAdminPortal) {
    // Check if user is forbidden from admin portal
    if (user.canAccessAdmin === false || user.role === 'CLIENT') {
      return <Navigate to="/home" replace />;
    }

    // If specific allowed roles are explicitly required and user doesn't match
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }

    // Check granular resource permission
    if (requiredPermPrefix && !hasResourcePermission(user, requiredPermPrefix)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children ? children : <Outlet />;
  }

  // 2. If this is a User route (portal is USER)
  const isUserPortal = portal === 'USER' || (allowedRoles && allowedRoles.includes('CLIENT'));
  if (isUserPortal) {
    if (user.canAccessUser === false) {
      return <Navigate to="/dashboard" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children ? children : <Outlet />;
  }

  // Fallback for general routes
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'CLIENT') {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

