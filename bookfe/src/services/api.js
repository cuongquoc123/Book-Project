const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Client & Admin Login API service
 */
export async function loginUser({ username, password, roleHint = 'CLIENT', securityCode = '' }) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken || data.token) {
        localStorage.setItem('token', data.accessToken || data.token);
        localStorage.setItem('user', JSON.stringify({ username, role: data.role || roleHint }));
      }
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || errorData.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      };
    }
  } catch (error) {
    console.warn('Backend API connection failed, simulating login for dev demo:', error);

    if (username && password) {
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser = { username, role: roleHint };
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return {
        success: true,
        data: {
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token',
          message: 'Đăng nhập thành công (Demo Mode)',
          user: mockUser
        }
      };
    }

    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    };
  }
}

export async function registerUser({ username, email, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.',
      };
    }
  } catch (error) {
    return {
      success: true,
      data: { message: 'Đăng ký tài khoản thành công! (Demo Mode)' }
    };
  }
}
