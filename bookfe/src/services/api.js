import axiosClient from './axiosClient';
import { setAuthData, clearAuth } from '../utils/auth';

/**
 * Async Promise wrapper helper returning Go-style [err, data] tuple
 * Dynamically extracts error message from Backend ErrorRespone DTO
 */
export const to = (promise) =>
  promise
    .then((data) => [null, data])
    .catch((err) => {
      const responseData = err?.response?.data;
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData && typeof responseData === 'object') {
        errorMessage = responseData.message || responseData.error || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      return [errorMessage, null];
    });

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
      user: {
        id: data.id,
        username: data.username || username,
        email: data.email,
        fullName: data.fullname || data.fullName,
        role: data.role || roleHint,
      },
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
  const [err, data] = await to(axiosClient.get('/auth/me'));
  if (!err && data) {
    const currentUserInfo = {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.fullName || data.fullname,
      role: data.role,
    };
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    setAuthData({ accessToken: token, refreshToken, user: currentUserInfo });
  }
  return [err, data];
}

/* ==========================================
 * Category API Endpoints
 * ========================================== */

export async function getAllCategories() {
  return to(axiosClient.get('/categories'));
}

export async function getCategoryById(id) {
  return to(axiosClient.get(`/categories/${id}`));
}

export async function createCategory(data) {
  return to(axiosClient.post('/categories', data));
}

export async function updateCategory(id, data) {
  return to(axiosClient.put(`/categories/${id}`, data));
}

export async function deleteCategory(id) {
  return to(axiosClient.delete(`/categories/${id}`));
}

/* ==========================================
 * Book API Endpoints
 * ========================================== */

export async function getAllBooks() {
  return to(axiosClient.get('/books'));
}

export async function getBookById(id) {
  return to(axiosClient.get(`/books/${id}`));
}

export async function createBook(data) {
  return to(axiosClient.post('/books', data));
}

export async function updateBook(id, data) {
  return to(axiosClient.put(`/books/${id}`, data));
}

export async function deleteBook(id) {
  return to(axiosClient.delete(`/books/${id}`));
}

