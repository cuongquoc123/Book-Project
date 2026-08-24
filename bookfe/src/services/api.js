import axiosClient from './axiosClient';
import { setAuthData, clearAuth } from '../utils/auth';

/**
 * Async Promise wrapper helper returning Go-style [err, data] tuple
 * Eliminates try-catch blocks in API service functions
 */
export const to = (promise) =>
  promise
    .then((data) => [null, data])
    .catch((err) => [
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Đã có lỗi xảy ra. Vui lòng thử lại.',
      null,
    ]);

/**
 * Authentication API Service returning [err, data] tuples
 */
export async function loginUser({ username, password, roleHint = 'CLIENT' }) {
  const [err, data] = await to(axiosClient.post('/auth/login', { username, password }));

  if (!err && data && (data.accessToken || data.token)) {
    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken || '';
    setAuthData({
      accessToken,
      refreshToken,
      user: { username, role: data.role || roleHint },
    });
  }

  return [err, data];
}

export async function registerUser({ username, email, password }) {
  return to(axiosClient.post('/auth/register', { username, email, password }));
}

export async function logoutUser(refreshToken) {
  const [err, data] = await to(axiosClient.post('/auth/logout', { refreshToken }));
  clearAuth();
  return [err, data];
}

export async function getCurrentUser() {
  return to(axiosClient.get('/auth/me'));
}
