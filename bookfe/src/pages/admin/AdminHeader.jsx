import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FolderTree, LogOut, User, Crown, ShieldCheck } from 'lucide-react';
import { logoutUser } from '../../services/api';
import { clearAuth, getRefreshToken, getUser } from '../../utils/auth';

export default function AdminHeader({ currentUser }) {
  const navigate = useNavigate();
  const user = currentUser || getUser() || {};
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await logoutUser(refreshToken);
    } else {
      clearAuth();
    }

    // Role check for smart redirect: If admin -> /admin/login; If client -> /login
    const userRole = user.role;
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      navigate('/admin/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="dash-header">
      <div className="dash-header-inner">
        <NavLink to="/dashboard" className="dash-brand">
          <div className="dash-brand-icon">
            {isSuperAdmin ? <Crown size={22} /> : <ShieldCheck size={22} />}
          </div>
          <span className="dash-brand-title">Cổng Quản Trị Sách</span>
        </NavLink>

        <nav className="dash-nav-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
            end
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/books"
            className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Quản Lý Sách</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
          >
            <FolderTree size={18} />
            <span>Quản Lý Loại Sách</span>
          </NavLink>
        </nav>

        <div className="dash-user-section">
          <div className="dash-user-badge">
            <User size={16} color="#4F46E5" />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
              {user.username || 'Admin'}
            </span>
            <span className={`role-tag ${isSuperAdmin ? 'super-admin' : 'admin'}`}>
              {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
            </span>
          </div>

          <button type="button" onClick={handleLogout} className="dash-btn-logout">
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
