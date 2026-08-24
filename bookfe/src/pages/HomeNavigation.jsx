import React from 'react';
import { BookOpen, ShieldAlert, UserCheck } from 'lucide-react';
import PortalCard from '../components/PortalCard';

export default function HomeNavigation() {
  return (
    <div className="portal-landing-wrapper">
      <div className="admin-glow-top" />
      <div className="admin-glow-bottom" />

      <div style={{ textAlign: 'center', maxWidth: '640px', zIndex: 2 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.1rem',
            background: '#EEF2FF',
            color: '#4F46E5',
            border: '1px solid #C7D2FE',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            boxShadow: '0 2px 10px rgba(79, 70, 229, 0.1)',
          }}
        >
          <BookOpen size={16} /> Book FE Authentication System
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
          Hệ Thống Đăng Nhập Book FE
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: '1.6' }}>
          Lựa chọn cổng truy cập tương ứng bên dưới để trải nghiệm 2 giao diện đăng nhập được thiết kế tối giản, tươi sáng và hiện đại.
        </p>
      </div>

      <div className="portal-grid" style={{ zIndex: 2 }}>
        {/* Client Portal Card */}
        <PortalCard
          to="/login"
          icon={UserCheck}
          iconClass="client-icon"
          badgeText="Client / Reader Portal"
          badgeColor="#059669"
          title="1. Trang Đăng Nhập Client"
          description="Thiết kế Fresh Light Minimalist thanh lịch dành cho độc giả. Hỗ trợ đăng nhập, đăng ký nhanh, chuyển đổi mật khẩu và liên kết mạng xã hội."
          actionText="Truy cập Cổng Client"
        />

        {/* Admin & Super Admin Portal Card */}
        <PortalCard
          to="/admin/login"
          icon={ShieldAlert}
          iconClass="admin-icon"
          badgeText="Management Portal"
          badgeColor="#4F46E5"
          title="2. Trang Đăng Nhập Admin & Super Admin"
          description="Giao diện Modern Indigo Light hiện đại dùng chung cho cả tài khoản Admin và Super Admin (ví dụ tài khoản: supper / 123)."
          actionText="Truy cập Cổng Admin"
          isAdmin
        />
      </div>

      <div style={{ marginTop: '3.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600, zIndex: 2 }}>
        Book Project Authentication Interface • React 19 & Vite
      </div>
    </div>
  );
}
