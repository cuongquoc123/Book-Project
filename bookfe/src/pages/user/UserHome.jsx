import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, Compass, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { logoutUser, getCurrentUser } from '../../services/api';
import { clearAuth, getRefreshToken, getUser } from '../../utils/auth';
import '../../styles/auth.css';

export default function UserHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  useEffect(() => {
    async function fetchUser() {
      const [err, data] = await getCurrentUser();
      if (!err && data) {
        setCurrentUser({
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName || data.fullname,
          role: data.role,
        });
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await logoutUser(refreshToken);
    } else {
      clearAuth();
    }

    const userRole = currentUser.role || 'CLIENT';
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      navigate('/admin/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      {/* Client Navigation Header */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <BookOpen size={22} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>Athenaeum Reader</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {isAdmin && (
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <ShieldCheck size={16} />
                <span>Trang Quản Trị Admin</span>
              </Link>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: '#F1F5F9',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
              }}
            >
              <User size={16} color="#059669" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                {currentUser.username || 'Độc giả'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  background: '#10B981',
                  color: 'white',
                  textTransform: 'uppercase',
                }}
              >
                {currentUser.role || 'CLIENT'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.9rem',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Home Content */}
      <main style={{ maxWidth: '1000px', width: '100%', margin: '3rem auto', padding: '0 1.5rem', flex: 1 }}>
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.15)',
            }}
          >
            <Compass size={36} />
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
            Trang Chủ Độc Giả (Client Home Page)
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748B', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Bạn đã đăng nhập thành công với tài khoản Độc Giả (<strong style={{ color: '#059669' }}>{currentUser.username}</strong>). Đây là trang chủ điều hướng dành cho độc giả đọc sách trực tuyến.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1.25rem',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              fontSize: '0.9rem',
              color: '#334155',
              marginBottom: '2.5rem',
            }}
          >
            <Heart size={18} color="#EF4444" />
            <span>Tính năng đọc sách & thư viện cá nhân đang sẵn sàng mở rộng!</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.75rem',
                background: '#059669',
                color: 'white',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
              }}
            >
              <span>Về Trang Điều Hướng Hệ Thống</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
