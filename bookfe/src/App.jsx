import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientLogin from './pages/user/ClientLogin';
import UserHome from './pages/user/UserHome';
import UserProfile from './pages/user/UserProfile';
import UserBorrowHistory from './pages/user/UserBorrowHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import BookManagement from './pages/admin/BookManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import BorrowManagement from './pages/admin/BorrowManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import RoleManagement from './pages/admin/RoleManagement';
import HomeNavigation from './pages/HomeNavigation';
import ServerError from './pages/ServerError';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/auth.css';
import ResetPassword from './pages/user/ResetPassword';
import ForgotPassword from './pages/user/ForgotPassword';
import VerifyEmail from './pages/user/VerifyEmail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeNavigation />} />
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* Protected User Home & Profile Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute portal="USER">
              <UserHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute portal="USER">
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-borrows"
          element={
            <ProtectedRoute portal="USER">
              <UserBorrowHistory />
            </ProtectedRoute>
          }
        />

        {/* Admin Gateway Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Portal Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute portal="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/books"
          element={
            <ProtectedRoute portal="ADMIN" requiredPermPrefix="BOOK">
              <BookManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute portal="ADMIN" requiredPermPrefix="CATEGORY">
              <CategoryManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/borrows"
          element={
            <ProtectedRoute portal="ADMIN">
              <BorrowManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute portal="ADMIN" requiredPermPrefix="ROLE">
              <RoleManagement />
            </ProtectedRoute>
          }
        />

        {/* Employee / User Management */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute portal="ADMIN" requiredPermPrefix="USER">
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/server-error" element={<ServerError />} />
      </Routes>
    </Router>
  );
}

