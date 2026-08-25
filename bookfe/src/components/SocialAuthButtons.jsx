import React from 'react';
import GoogleLoginButton from './GoogleLoginButton';

export default function SocialAuthButtons({ onGoogleSuccess, onError }) {
  return (
    <>
      <div className="social-divider">
        <span>hoặc đăng nhập nhanh bằng Google</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0.75rem 0' }}>
        <GoogleLoginButton
          onLoginSuccess={onGoogleSuccess}
          onError={onError}
        />
      </div>
    </>
  );
}
