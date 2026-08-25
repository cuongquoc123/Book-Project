import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '../services/api';

const GOOGLE_CLIENT_ID = '980684942933-fo9k6e1spr3ipp7m74aedq5v6hfs631h.apps.googleusercontent.com';

export default function GoogleLoginButton({ onLoginSuccess, onError }) {
  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      if (onError) onError('Không nhận được Google ID Token.');
      return;
    }

    const [err, data] = await loginWithGoogle(idToken);
    if (err) {
      console.error('Lỗi đăng nhập Google:', err);
      if (onError) onError(err);
      return;
    }

    console.log('Đăng nhập thành công qua Google:', data);
    if (onLoginSuccess) {
      onLoginSuccess(data);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '12px 0' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            if (onError) onError('Đăng nhập Google trên trình duyệt thất bại.');
          }}
          useOneTap={false}
          shape="pill"
          theme="outline"
          size="medium"
          text="continue_with"
          locale="vi"
        />
      </div>
    </GoogleOAuthProvider>
  );
}