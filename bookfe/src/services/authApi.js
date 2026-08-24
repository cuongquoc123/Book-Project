import axiosClient from './axiosClient';

/**
 * Authentication API Service using clean Axios Client
 */
export const authApi = {
  // Login API call
  login: async ({ username, password, roleHint, securityCode }) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        username,
        password,
      });

      if (response && (response.accessToken || response.token)) {
        const token = response.accessToken || response.token;
        localStorage.setItem('token', token);
        localStorage.setItem(
          'user',
          JSON.stringify({ username, role: response.role || roleHint || 'CLIENT' })
        );
      }

      return { success: true, data: response };
    } catch (error) {
      if (error.response && error.response.status < 500) {
        return {
          success: false,
          message:
            error.response.data?.message ||
            error.response.data?.error ||
            'Tên đăng nhập hoặc mật khẩu không chính xác.',
        };
      }
      throw error;
    }
  },

  // Register API call
  register: async ({ username, email, password }) => {
    try {
      const response = await axiosClient.post('/auth/register', {
        username,
        email,
        password,
      });
      return { success: true, data: response };
    } catch (error) {
      if (error.response && error.response.status < 500) {
        return {
          success: false,
          message: error.response.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.',
        };
      }
      throw error;
    }
  },

  // Logout API call
  logout: async (refreshToken) => {
    try {
      const response = await axiosClient.post('/auth/logout', { refreshToken });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: true, data: response };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: false, message: 'Lỗi khi đăng xuất' };
    }
  },
};

export default authApi;
