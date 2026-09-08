import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2, Mail, Send, ArrowLeft } from 'lucide-react';
import { verifyEmail, resendVerification } from '../../services/api';
import AlertToast from '../../components/AlertToast';
import BrandSection from '../../components/BrandSection';
import FormInput from '../../components/FormInput';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendAlert, setResendAlert] = useState({ type: '', message: '' });

  // Use useRef to prevent duplicate API execution in React StrictMode (development mode)
  const hasRequestedRef = useRef(false);

  // Use useRef for resend email input to prevent unnecessary re-rendering
  const resendEmailRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('Vui lòng cung cấp mã token xác thực hoặc yêu cầu gửi lại email kích hoạt bên dưới.');
      return;
    }

    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    const handleVerify = async () => {
      const [err, data] = await verifyEmail(token);
      setLoading(false);
      if (err) {
        setSuccess(false);
        setMessage(err);
      } else {
        setSuccess(true);
        setMessage(data?.message || 'Tài khoản của bạn đã được kích hoạt thành công! Hãy đăng nhập ngay.');
      }
    };

    handleVerify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendAlert({ type: '', message: '' });

    const email = resendEmailRef.current?.value.trim() || '';
    if (!email) {
      setResendAlert({ type: 'error', message: 'Vui lòng nhập địa chỉ email!' });
      return;
    }

    setResendLoading(true);
    const [err, data] = await resendVerification(email);
    setResendLoading(false);

    if (err) {
      setResendAlert({ type: 'error', message: err });
    } else {
      setResendAlert({
        type: 'success',
        message: data?.message || 'Đã gửi lại email kích hoạt. Vui lòng kiểm tra hộp thư của bạn!',
      });
      if (resendEmailRef.current) {
        resendEmailRef.current.value = '';
      }
    }
  };

  return (
    <div className="client-auth-wrapper">
      <div className="client-bg-shape-1" />
      <div className="client-bg-shape-2" />

      <div className="client-auth-container">
        {/* Reusable Brand Section Component */}
        <BrandSection />

        {/* Right Side: Verify Email Status / Resend Form */}
        <div className="client-auth-form-side">
          <div className="client-form-card">
            <div className="client-form-header" style={{ textAlign: 'center' }}>
              <h2 className="client-form-title">Xác thực tài khoản</h2>
              <p className="client-form-subtitle">Kích hoạt tài khoản thành viên Athenaeum</p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <Loader2 className="animate-spin" size={48} color="#059669" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#64748b', fontWeight: 600 }}>Đang tiến hành xác thực tài khoản...</p>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Vui lòng đợi trong giây lát</p>
              </div>
            ) : success ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={56} color="#059669" style={{ margin: '0 auto 1rem' }} />
                <AlertToast type="success" message={message} />
                <Link
                  to="/login"
                  className="client-submit-btn"
                  style={{ textDecoration: 'none', marginTop: '1.5rem' }}
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <XCircle size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                  <AlertToast type="error" message={message} />
                </div>

                {/* Resend Verification Email Section */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Gửi lại liên kết kích hoạt?
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                    Nhập email bạn đã dùng để đăng ký để nhận liên kết xác thực mới.
                  </p>

                  <AlertToast type={resendAlert.type} message={resendAlert.message} />

                  <form onSubmit={handleResend}>
                    <FormInput
                      label="Địa chỉ Email"
                      type="email"
                      inputRef={resendEmailRef}
                      icon={Mail}
                      placeholder="ban@example.com"
                      required
                    />

                    <button
                      type="submit"
                      className="client-submit-btn"
                      disabled={resendLoading}
                      style={{ marginTop: '1rem' }}
                    >
                      {resendLoading ? (
                        <span>Đang gửi email...</span>
                      ) : (
                        <>
                          <span>Gửi lại email kích hoạt</span>
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <Link
                    to="/login"
                    style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.9rem' }}
                  >
                    <ArrowLeft size={16} /> Quay lại Đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
