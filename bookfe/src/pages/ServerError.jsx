import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';

export default function ServerError() {
  const navigate = useNavigate();
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const savedMsg = sessionStorage.getItem('lastServerError');
    if (savedMsg) {
      setErrorDetails(savedMsg);
    }
  }, []);

  const handleRetry = () => {
    sessionStorage.removeItem('lastServerError');
    window.history.back();
  };

  return (
    <div className="admin-auth-wrapper" style={{ justifyContent: 'center' }}>
      <div className="admin-glow-top" />
      <div className="admin-glow-bottom" />

      <div
        className="admin-auth-card"
        style={{
          maxWidth: '520px',
          textAlign: 'center',
          padding: '3rem 2.5rem',
          border: '1px solid #FECDD3',
          boxShadow: '0 20px 50px rgba(239, 68, 68, 0.1)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: '#FFE4E6',
            color: '#E11D48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 4px 16px rgba(225, 29, 72, 0.2)',
          }}
        >
          <ServerCrash size={36} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
          500 - Lỗi Máy Chủ
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Đã có sự cố xảy ra tại máy chủ Backend Spring Boot hoặc kết nối mạng bị gián đoạn.
        </p>

        {errorDetails && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: '12px',
              color: '#9F1239',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              marginBottom: '2rem',
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            <strong>Chi tiết lỗi:</strong> {errorDetails}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleRetry}
            className="admin-submit-btn btn-admin"
            style={{ flex: 1, marginTop: 0 }}
          >
            <RefreshCw size={18} />
            <span>Thử lại</span>
          </button>

          <Link
            to="/"
            className="admin-submit-btn"
            style={{
              flex: 1,
              marginTop: 0,
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              textDecoration: 'none',
            }}
          >
            <Home size={18} />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
