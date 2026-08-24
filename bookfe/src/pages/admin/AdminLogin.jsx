import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, User, ArrowRight, Server, Shield, Database, Activity } from 'lucide-react';
import { loginUser } from '../../services/api';
import FormInput from '../../components/FormInput';
import AlertToast from '../../components/AlertToast';
import { isAuthenticated } from '../../utils/auth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  // Use useRef for uncontrolled inputs to prevent unnecessary component re-renders on typing
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  // Alert message
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Auto redirect to /dashboard if valid token exists
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    const username = usernameRef.current?.value.trim() || '';
    const password = passwordRef.current?.value || '';

    if (!username || !password) {
      setAlert({ type: 'error', message: 'Vui lòng nhập Tên tài khoản và Mật khẩu hệ thống.' });
      return;
    }

    setLoading(true);

    const [err] = await loginUser({
      username,
      password,
    });

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message: 'Xác thực thành công! Đang chuyển hướng đến Dashboard...',
      });
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    }

    setLoading(false);
  };

  return (
    <div className="admin-auth-wrapper">
      <div className="client-bg-shape-1" />
      <div className="client-bg-shape-2" />

      <div className="admin-auth-container">
        {/* Left Side: System & Admin Portal Information */}
        <div className="admin-auth-brand-side">
          <Link to="/" className="client-brand-header">
            <div
              className="client-brand-logo-icon"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)' }}
            >
              <ShieldCheck size={24} />
            </div>
            <span className="client-brand-title" style={{ fontFamily: 'inherit', fontWeight: 800, color: '#0F172A' }}>
              Book Admin Gateway
            </span>
          </Link>

          <div className="client-brand-content">
            <h1 className="client-brand-heading" style={{ fontFamily: 'inherit' }}>
              Cổng Quản Trị <span>Hệ Thống Sách.</span>
            </h1>
            <p className="client-brand-desc">
              Trung tâm điều hành và xác thực phân quyền dành riêng cho Ban Quản Trị (Admin & Super Admin).
            </p>

            {/* System Status Metrics Grid */}
            <div className="admin-system-metrics-grid">
              <div className="admin-metric-card">
                <div style={{ display: 'flex', items: 'center', gap: '8px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  <Server size={14} /> Server Status
                </div>
                <div className="admin-metric-value" style={{ color: '#10B981', fontSize: '1.25rem' }}>Online (8080)</div>
                <div className="admin-metric-label">Spring Boot API</div>
              </div>

              <div className="admin-metric-card">
                <div style={{ display: 'flex', items: 'center', gap: '8px', color: '#4F46E5', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  <Database size={14} /> Database
                </div>
                <div className="admin-metric-value" style={{ color: '#4F46E5', fontSize: '1.25rem' }}>MySQL Active</div>
                <div className="admin-metric-label">BookDB Instance</div>
              </div>

              <div className="admin-metric-card">
                <div style={{ display: 'flex', items: 'center', gap: '8px', color: '#0284C7', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  <Shield size={14} /> Security Mode
                </div>
                <div className="admin-metric-value" style={{ color: '#0284C7', fontSize: '1.25rem' }}>JWT Auth</div>
                <div className="admin-metric-label">Role-Based Access</div>
              </div>

              <div className="admin-metric-card">
                <div style={{ display: 'flex', items: 'center', gap: '8px', color: '#7C3AED', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  <Activity size={14} /> Latency
                </div>
                <div className="admin-metric-value" style={{ color: '#7C3AED', fontSize: '1.25rem' }}>&lt; 5ms</div>
                <div className="admin-metric-label">Low Latency</div>
              </div>
            </div>
          </div>

          <div className="client-brand-quote" style={{ borderLeftColor: '#4F46E5', maxWidth: '600px' }}>
            <p style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
              “Bảo mật và hiệu năng là nền tảng cốt lõi của một hệ thống quản lý xuất sắc.”
            </p>
            <span style={{ color: '#4F46E5' }}>— Enterprise Security Standard</span>
          </div>
        </div>

        {/* Right Side: Admin Form */}
        <div className="admin-auth-form-side">
          <div className="admin-auth-card">
            {/* Top Security Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div className="admin-header-badge admin-badge-normal">
                <ShieldCheck size={14} />
                <span>Admin & Super Admin Portal</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Server size={12} /> System v2.4
              </div>
            </div>

            <h2 className="admin-card-title">Book Management</h2>
            <p className="admin-card-subtitle">Đăng nhập tài khoản Quản trị viên (Admin / Super Admin)</p>

            {/* Alert Feedback Component */}
            <AlertToast type={alert.type} message={alert.message} />

            {/* Admin Single Form */}
            <form onSubmit={handleSubmit}>
              {/* Admin Username Input */}
              <FormInput
                label="Tên tài khoản quản trị"
                inputRef={usernameRef}
                icon={User}
                inputClassName="admin-input"
                labelStyle={{ color: '#334155' }}
                placeholder="Nhập tên đăng nhập (VD: supper, admin...)"
                required
              />

              {/* Admin Password Input */}
              <FormInput
                label="Mật khẩu hệ thống"
                type={showPassword ? 'text' : 'password'}
                inputRef={passwordRef}
                icon={Lock}
                inputClassName="admin-input"
                labelStyle={{ color: '#334155' }}
                placeholder="••••••••••••"
                required
                rightElement={
                  <button
                    type="button"
                    className="input-btn-right"
                    style={{ color: '#94A3B8' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Remember Option */}
              <div className="form-actions-row" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                <label className="checkbox-label" style={{ color: '#475569' }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                  />
                  Duy trì phiên làm việc an toàn (24h)
                </label>
              </div>

              {/* Submit Button */}
              <button type="submit" className="admin-submit-btn btn-admin" disabled={loading}>
                {loading ? (
                  <span>Đang xác thực thông tin...</span>
                ) : (
                  <>
                    <span>Đăng nhập Cổng Quản Trị</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation Link */}
            <div className="admin-footer-text">
              Chuyển tới giao diện độc giả?{' '}
              <Link to="/login" className="admin-footer-link">
                Trang Đăng Nhập Client
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
