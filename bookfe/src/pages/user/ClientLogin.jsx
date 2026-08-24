import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../../services/api';
import FormInput from '../../components/FormInput';
import AlertToast from '../../components/AlertToast';
import SocialAuthButtons from '../../components/SocialAuthButtons';
import BrandSection from '../../components/BrandSection';
import { isAuthenticated } from '../../utils/auth';

export default function ClientLogin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Use useRef for input fields to avoid re-rendering on every keystroke
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Alert state
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
    const email = emailRef.current?.value.trim() || '';

    if (!username || !password) {
      setAlert({ type: 'error', message: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.' });
      return;
    }

    if (activeTab === 'register' && !email) {
      setAlert({ type: 'error', message: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }

    setLoading(true);

    if (activeTab === 'login') {
      const [err] = await loginUser({
        username,
        password,
        roleHint: 'CLIENT',
      });

      if (err) {
        setAlert({ type: 'error', message: err });
      } else {
        setAlert({ type: 'success', message: 'Đăng nhập thành công! Đang chuyển hướng đến Dashboard...' });
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    } else {
      const [err] = await registerUser({
        username,
        email,
        password,
      });

      if (err) {
        setAlert({ type: 'error', message: err });
      } else {
        setAlert({ type: 'success', message: 'Đăng ký thành công! Hãy đăng nhập bằng tài khoản mới.' });
        setActiveTab('login');
      }
    }

    setLoading(false);
  };

  return (
    <div className="client-auth-wrapper">
      <div className="client-bg-shape-1" />
      <div className="client-bg-shape-2" />

      <div className="client-auth-container">
        {/* Editorial Brand Section Component */}
        <BrandSection />

        {/* Right Side: Auth Form */}
        <div className="client-auth-form-side">
          <div className="client-form-card">
            <div className="client-form-header">
              <h2 className="client-form-title">
                {activeTab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
              </h2>
              <p className="client-form-subtitle">
                {activeTab === 'login'
                  ? 'Vui lòng nhập thông tin đăng nhập để tiếp tục trải nghiệm'
                  : 'Nhập thông tin bên dưới để trở thành thành viên của Athenaeum'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="client-tabs">
              <button
                type="button"
                className={`client-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('login');
                  setAlert({ type: '', message: '' });
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`client-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('register');
                  setAlert({ type: '', message: '' });
                }}
              >
                Đăng ký
              </button>
            </div>

            {/* Reusable AlertToast Component */}
            <AlertToast type={alert.type} message={alert.message} />

            <form onSubmit={handleSubmit}>
              {/* Username Input Component */}
              <FormInput
                label="Tên đăng nhập / Username"
                inputRef={usernameRef}
                icon={User}
                placeholder="ví dụ: docgia123"
                required
              />

              {/* Email Input Component (Register tab only) */}
              {activeTab === 'register' && (
                <FormInput
                  label="Địa chỉ Email"
                  type="email"
                  inputRef={emailRef}
                  icon={Mail}
                  placeholder="ban@example.com"
                  required
                />
              )}

              {/* Password Input Component */}
              <FormInput
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                inputRef={passwordRef}
                icon={Lock}
                placeholder="••••••••"
                required
                rightElement={
                  <button
                    type="button"
                    className="input-btn-right"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Additional Options */}
              {activeTab === 'login' && (
                <div className="form-actions-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="forgot-link">
                    Quên mật khẩu?
                  </a>
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className="client-submit-btn" disabled={loading}>
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Đăng nhập vào thư viện' : 'Tạo tài khoản đọc sách'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Reusable SocialAuthButtons Component */}
            <SocialAuthButtons
              onSocialClick={(provider) =>
                setAlert({ type: 'success', message: `Đăng nhập bằng ${provider} (Demo mode)` })
              }
            />

            <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#888' }}>
              Bạn là Quản trị viên?{' '}
              <Link to="/admin/login" style={{ color: '#059669', fontWeight: 600 }}>
                Truy cập Portal Admin →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
