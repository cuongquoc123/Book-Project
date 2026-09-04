import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import FormInput from '../../components/FormInput';
import AlertToast from '../../components/AlertToast';
import BrandSection from '../../components/BrandSection';

export default function ForgotPassword() {
  const emailRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    // Trích xuất email từ inputRef
    const email = emailRef.current?.value.trim() || '';

    if (!email) {
      setAlert({ type: 'error', message: 'Vui lòng nhập địa chỉ email!' });
      return;
    }

    setLoading(true);
    const [err, data] = await forgotPassword(email);
    setLoading(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message: data?.message || 'Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư!',
      });
      if (emailRef.current) emailRef.current.value = '';
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
              <h2 className="client-form-title">Quên mật khẩu?</h2>
              <p className="client-form-subtitle">
                Nhập địa chỉ email liên kết với tài khoản của bạn để nhận liên kết đặt lại mật khẩu.
              </p>
            </div>

            <AlertToast type={alert.type} message={alert.message} />

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Địa chỉ Email đăng ký"
                type="email"
                inputRef={emailRef}
                icon={Mail}
                placeholder="ban@example.com"
                required
              />

              <button type="submit" className="client-submit-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
                {loading ? (
                  <span>Đang gửi email...</span>
                ) : (
                  <>
                    <span>Gửi liên kết khôi phục</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
              <Link to="/login" style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Quay lại Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}