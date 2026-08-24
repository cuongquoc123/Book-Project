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
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Call raw Axios refresh endpoint to get new Access Token
 */
async function performRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken || isTokenExpired(refreshToken)) {
    throw new Error('Refresh Token is missing or expired');
  }

  // Use raw axios call to avoid interceptor recursion
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const data = response.data;
  const newAccessToken = data.accessToken || data.token;
  const newRefreshToken = data.refreshToken || refreshToken;

  if (!newAccessToken) {
    throw new Error('Failed to obtain new access token');
  }

  setAuthData({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });

  return newAccessToken;
}

// Request Interceptor: Proactive Token Expiration Check & Auto Refresh
axiosClient.interceptors.request.use(
  async (config) => {
    // Skip token logic for login & register endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      return config;
    }

    let token = getToken();
    const refreshToken = getRefreshToken();

    // Check if Access Token is expired
    if (token && isTokenExpired(token)) {
      // If Refresh Token is also expired or missing -> Clear auth and redirect
      if (!refreshToken || isTokenExpired(refreshToken)) {
        clearAuth();
        redirectToLogin();
        return Promise.reject(new Error('Tokens expired. Redirecting to login.'));
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

// Response Interceptor: Reactive 401 Catch & Token Refresh Retry
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;

    // 401 Unauthorized: Try refreshing token if not already retried
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

    const isNetworkError = !error.response;
    const isServerError = status && status >= 500;

    // 5xx Server Error or Network failure -> Redirect to Server Error Page
    if (isNetworkError || isServerError) {
      const errorMsg = isNetworkError
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
