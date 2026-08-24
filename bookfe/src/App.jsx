import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientLogin from './pages/user/ClientLogin';
import AdminLogin from './pages/admin/AdminLogin';
import HomeNavigation from './pages/HomeNavigation';
import ServerError from './pages/ServerError';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/auth.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeNavigation />} />
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protected Routes: Requires valid unexpired Token */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/server-error" element={<ServerError />} />
      </Routes>
    </Router>
  );
}
