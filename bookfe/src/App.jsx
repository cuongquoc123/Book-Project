import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientLogin from './pages/user/ClientLogin';
import UserHome from './pages/user/UserHome';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import BookManagement from './pages/admin/BookManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import HomeNavigation from './pages/HomeNavigation';
import ServerError from './pages/ServerError';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/auth.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeNavigation />} />
        <Route path="/login" element={<ClientLogin />} />

        {/* Protected User Home Route */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN', 'SUPER_ADMIN']}>
              <UserHome />
            </ProtectedRoute>
          }
        />

        {/* Admin Gateway Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Portal Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/books"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <BookManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <CategoryManagement />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Only Route: Employee / User Management */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/server-error" element={<ServerError />} />
      </Routes>
    </Router>
  );
}
