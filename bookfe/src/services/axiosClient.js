import axios from 'axios';
import { clearAuth } from '../utils/auth';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 Unauthorized (Expired Tokens) and 5xx Server Errors
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;

    // 401 Unauthorized: Token expired or invalid -> Clear auth and redirect to /login
    if (status === 401) {
      clearAuth();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const isNetworkError = !error.response;
    const isServerError = status && status >= 500;

    // Server error or network connection failed -> Navigate to General Server Error Page
    if (isNetworkError || isServerError) {
      const errorMsg = isNetworkError
        ? 'Không thể kết nối đến máy chủ Backend Spring Boot.'
        : `Lỗi máy chủ (${error.response.status}): ${error.response.data?.message || 'Internal Server Error'}`;

      sessionStorage.setItem('lastServerError', errorMsg);
      if (window.location.pathname !== '/server-error') {
        window.location.href = '/server-error';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
