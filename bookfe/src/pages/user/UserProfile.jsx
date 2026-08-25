import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  ArrowLeft,
  BookOpen,
  KeyRound,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '../../services/api';
import { clearAuth, getRefreshToken, getUser } from '../../utils/auth';
import AlertToast from '../../components/AlertToast';
import '../../styles/auth.css';

export default function UserProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'edit' | 'password'
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Form states for Edit Profile & Change Password demo
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      const [err, data] = await getCurrentUser();
      if (!err && data) {
        const userInfo = {
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName || data.fullname,
          role: data.role,
          createdAt: data.createdAt,
        };
        setCurrentUser(userInfo);
        setEditForm({
          fullName: userInfo.fullName || '',
          email: userInfo.email || '',
        });
      } else if (err) {
        setAlert({ type: 'error', message: `Lỗi tải thông tin tài khoản: ${err}` });
      }
      setLoading(false);
    }
    fetchUserData();
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

  const handleSaveProfileNotice = (e) => {
    e.preventDefault();
    setAlert({
      type: 'info',
      message: 'ℹ️ Chức năng cập nhật profile chưa được Backend triển khai API (PUT /api/auth/profile). Bạn cần bổ sung API này ở Backend sau.',
    });
  };

  const handleChangePasswordNotice = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu mới và nhập lại mật khẩu không khớp!' });
      return;
    }
    setAlert({
      type: 'info',
      message: 'ℹ️ Chức năng đổi mật khẩu chưa được Backend triển khai API (PUT /api/auth/change-password). Bạn cần bổ sung API này ở Backend sau.',
    });
  };

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Extract avatar initials
  const initials = useMemo(() => {
    const name = currentUser.fullName || currentUser.username || 'User';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [currentUser]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Client Header Bar */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                background: '#ECFDF5',
              }}
            >
              <ArrowLeft size={16} />
              <span>Về Trang Chủ</span>
            </Link>

            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
              Thông Tin Tài Khoản
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAdmin && (
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  border: '1px solid #C7D2FE',
                }}
              >
                <ShieldCheck size={16} />
                <span>Trang Quản Trị</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
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

      {/* Main Content Area */}
      <main style={{ maxWidth: '1000px', width: '100%', margin: '2rem auto', padding: '0 1.5rem', flex: 1 }}>
        <AlertToast type={alert.type} message={alert.message} />

        {/* Profile Card Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 60%, #10B981 100%)',
            borderRadius: '24px 24px 0 0',
            padding: '2.5rem 2rem 5rem 2rem',
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'white',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.8rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                border: '4px solid rgba(255,255,255,0.3)',
              }}
            >
              {initials}
            </div>

            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {currentUser.fullName || currentUser.username || 'Độc giả'}
              </h1>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.925rem', opacity: 0.9 }}>
                @{currentUser.username} • {currentUser.email || 'Chưa cập nhật email'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '0 0 24px 24px',
            border: '1px solid #E2E8F0',
            borderTop: 'none',
            padding: '0 2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginTop: '-2rem',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              style={{
                padding: '1rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'info' ? '#059669' : '#64748B',
                borderBottom: activeTab === 'info' ? '3px solid #059669' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <User size={18} />
              <span>Thông tin tài khoản</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              style={{
                padding: '1rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'edit' ? '#059669' : '#64748B',
                borderBottom: activeTab === 'edit' ? '3px solid #059669' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Edit3 size={18} />
              <span>Chỉnh sửa thông tin</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('password')}
              style={{
                padding: '1rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'password' ? '#059669' : '#64748B',
                borderBottom: activeTab === 'password' ? '3px solid #059669' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <KeyRound size={18} />
              <span>Bảo mật & Đổi mật khẩu</span>
            </button>
          </div>

          {/* TAB 1: USER INFO DISPLAY */}
          {activeTab === 'info' && (
            <div style={{ padding: '2rem 0' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={16} color="#059669" /> Tên đăng nhập (Username)
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {currentUser.username}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="#059669" /> Họ và Tên (Full Name)
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {currentUser.fullName || 'Chưa cập nhật'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={16} color="#059669" /> Địa chỉ Email
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {currentUser.email || 'Chưa cập nhật'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} color="#059669" /> Vai trò hệ thống (Role)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '8px',
                        background: '#10B981',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                      }}
                    >
                      {currentUser.role || 'CLIENT'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                      (Tài khoản hợp lệ)
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} color="#059669" /> Ngày khởi tạo tài khoản
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                    {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : 'Ban đầu'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} color="#10B981" /> Trạng thái tài khoản
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669' }}>
                    ● Đang hoạt động (Active)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT PROFILE FORM */}
          {activeTab === 'edit' && (
            <div style={{ padding: '2rem 0' }}>
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Ghi chú cho Nhà Phát Triển:</strong> Backend hiện tại chưa có API cập nhật thông tin cá nhân (ví dụ `PUT /api/auth/profile`). Bạn có thể tạo thêm API này sau.
                </div>
              </div>

              <form onSubmit={handleSaveProfileNotice} style={{ maxWidth: '540px' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Nhập họ và tên đầy đủ..."
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="ban@example.com"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  Lưu Thay Đổi (Chờ API Backend)
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CHANGE PASSWORD FORM */}
          {activeTab === 'password' && (
            <div style={{ padding: '2rem 0' }}>
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Ghi chú cho Nhà Phát Triển:</strong> Backend hiện tại chưa có API đổi mật khẩu (ví dụ `PUT /api/auth/change-password`). Bạn có thể tạo thêm API này sau.
                </div>
              </div>

              <form onSubmit={handleChangePasswordNotice} style={{ maxWidth: '540px' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Nhập lại mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  Đổi Mật Khẩu (Chờ API Backend)
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
