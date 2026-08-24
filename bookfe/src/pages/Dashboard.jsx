import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User, Shield } from 'lucide-react';
import { logoutUser } from '../services/api';
import { clearAuth, getRefreshToken, getUser } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser() || {};

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await logoutUser(refreshToken);
    } else {
      clearAuth();
    }
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="admin-glow-top" />
      <div className="admin-glow-bottom" />

      <div
        className="admin-auth-card"
        style={{
          maxWidth: '560px',
          textAlign: 'center',
          padding: '3rem 2.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.2)',
          }}
        >
          <LayoutDashboard size={32} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
          Trang Dashboard
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: '1.6', marginBottom: '2rem' }}>
          Bạn đã đăng nhập thành công! Trang này đang trong quá trình chuẩn bị phát triển.
        </p>

        {user.username && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              textAlign: 'left',
              marginBottom: '2rem',
              fontSize: '0.9rem',
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <User size={18} color="#4F46E5" />
              <span>
                Tài khoản: <strong style={{ color: '#0F172A' }}>{user.username}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Shield size={18} color="#10B981" />
              <span>
                Quyền hạn: <strong style={{ color: '#0F172A' }}>{user.role || 'CLIENT'}</strong>
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="admin-submit-btn btn-super"
            style={{ marginTop: 0, flex: 1 }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>

          <Link
            to="/"
            className="admin-submit-btn"
            style={{
              marginTop: 0,
              flex: 1,
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              textDecoration: 'none',
            }}
          >
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
