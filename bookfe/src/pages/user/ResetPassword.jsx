import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../../services/api';
import FormInput from '../../components/FormInput';
import AlertToast from '../../components/AlertToast';
import BrandSection from '../../components/BrandSection';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!token) {
      setAlert({ type: 'error', message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token!' });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ type: 'error', message: 'Mật khẩu mới phải có độ dài tối thiểu 6 ký tự!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    setLoading(true);
    const [err, data] = await resetPassword({ token, newPassword });
    setLoading(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message: data?.message || 'Đổi mật khẩu thành công! Đang chuyển hướng về đăng nhập...',
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="client-auth-wrapper">
      <div className="client-bg-shape-1" />
      <div className="client-bg-shape-2" />

      <div className="client-auth-container">
        <BrandSection />

        <div className="client-auth-form-side">
          <div className="client-form-card">
            <div className="client-form-header">
              <h2 className="client-form-title">Đặt lại mật khẩu</h2>
              <p className="client-form-subtitle">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            <AlertToast type={alert.type} message={alert.message} />

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Mật khẩu mới"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={Lock}
                placeholder="Tối thiểu 6 ký tự"
                required
                rightElement={
                  <button type="button" className="input-btn-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <FormInput
                label="Xác nhận mật khẩu mới"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={Lock}
                placeholder="Nhập lại mật khẩu mới"
                required
              />

              <button type="submit" className="client-submit-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <span>Cập nhật mật khẩu</span>
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
              <Link to="/login" style={{ color: '#059669', fontWeight: 600 }}>
                Trở về trang Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}