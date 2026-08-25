import axios from 'axios';
import { getToken, getRefreshToken, setAuthData, clearAuth, isTokenExpired } from '../utils/auth';

const API_BASE_URL = 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Refresh token queue management
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Perform raw Axios call to refresh Access Token
 */
async function performRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken || isTokenExpired(refreshToken)) {
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }

  // Use raw axios instance to prevent interceptor loops
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const data = response.data;
  const newAccessToken = data.accessToken || data.token;
  const newRefreshToken = data.refreshToken || refreshToken;

  if (!newAccessToken) {
    throw new Error('REFRESH_FAILED');
  }

  setAuthData({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });

  return newAccessToken;
}

// Request Interceptor: Proactive Token Expiration Check
axiosClient.interceptors.request.use(
  async (config) => {
    // Exempt all auth endpoints (/auth/login, /auth/register, /auth/refresh, /auth/logout)
    const isAuthEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/logout');

    if (isAuthEndpoint) {
      return config;
    }

    let token = getToken();
    const refreshToken = getRefreshToken();

    // Check if Access Token is expired for non-auth requests
    if (token && isTokenExpired(token)) {
      // If Refresh Token is also expired or missing -> Clear auth and redirect
      if (!refreshToken || isTokenExpired(refreshToken)) {
        clearAuth();
        redirectToLogin();
        return Promise.reject(new Error('SESSION_EXPIRED'));
      }

      // Proactively refresh token before sending request
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccessToken = await performRefreshToken();
          isRefreshing = false;
          onRefreshed(newAccessToken);
          token = newAccessToken;
        } catch (err) {
          isRefreshing = false;
          clearAuth();
          redirectToLogin();
          return Promise.reject(err);
        }
      } else {
        // Wait for ongoing refresh to complete
        token = await new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            resolve(newToken);
          });
        });
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized & Server Errors
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    // 1. If it's an Auth Endpoint (e.g. wrong password on /auth/login), pass error directly to component
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // 2. Handle 401 Unauthorized for Protected Endpoints
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken && !isTokenExpired(refreshToken)) {
        try {
          const newAccessToken = await performRefreshToken();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } catch (refreshErr) {
          clearAuth();
          redirectToLogin();
          return Promise.reject(refreshErr);
        }
      } else {
        clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    // 3. True Network Errors (Server down / CORS) or 5xx Server Errors
    const isTrueNetworkError = error.code === 'ERR_NETWORK' || (axios.isAxiosError(error) && !error.response);
    const isServerError = status && status >= 500;

    if (isTrueNetworkError || isServerError) {
      const errorMsg = isTrueNetworkError
        ? 'Không thể kết nối đến máy chủ Backend.'
        : `Lỗi máy chủ (${status}): ${error.response?.data?.message || 'Internal Server Error'}`;

      sessionStorage.setItem('lastServerError', errorMsg);
      if (window.location.pathname !== '/server-error') {
        window.location.href = '/server-error';
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
    window.location.href = '/login';
  }
}

export default axiosClient;
