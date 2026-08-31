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
        roleDisplayName: data.roleDisplayName,
        canAccessAdmin: data.canAccessAdmin !== false,
        canAccessUser: data.canAccessUser !== false,
      },
    });
  }

  return [err, data];
}

export async function registerUser({ username, email, password }) {
  return to(axiosClient.post('/auth/register', { username, email, password }));
}

export async function createAdminUser({ username, email, password, fullname }) {
  return to(axiosClient.post('/auth/create-admin', { username, email, password, fullname }));
}

export async function getAllUsers() {
  return to(axiosClient.get('/auth/users'));
}

export async function updateUserRole(userId, roleId) {
  return to(axiosClient.put(`/auth/users/${userId}/role`, { roleId }));
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

export async function getAllCategories(params = {}) {
  const { page = 0, size = 100, sortBy = 'id', sortDir = 'desc' } = params;
  return to(axiosClient.get('/categories', { params: { page, size, sortBy, sortDir } }));
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

export async function getAllBooks(params = {}) {
  const { page = 0, size = 5, sortBy = 'id', sortDir = 'desc' } = params;
  return to(axiosClient.get('/books', { params: { page, size, sortBy, sortDir } }));
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

/* ==========================================
 * File Upload API Endpoints
 * ========================================== */

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return to(
    axiosClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
}

export async function deleteUploadedImage(fileUrl) {
  if (!fileUrl) return [null, null];
  return to(axiosClient.delete('/upload/image', { params: { fileUrl } }));
}

export async function loginWithGoogle(idToken) {
  const [err, data] = await to(axiosClient.post('/auth/google', { idToken }));

  if (!err && data && (data.accessToken || data.token)) {
    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken || '';
    setAuthData({
      accessToken,
      refreshToken,
      user: {
        id: data.id,
        username: data.username || data.fullname || data.email,
        email: data.email,
        fullName: data.fullname || data.fullName,
        role: data.role || 'CLIENT',
      },
    });
  }
  return [err, data];
}

/* ==========================================
 * Role & Permission API Endpoints
 * ========================================== */

export async function getAllRoles() {
  return to(axiosClient.get('/roles'));
}

export async function getRoleById(id) {
  return to(axiosClient.get(`/roles/${id}`));
}

export async function createRole(data) {
  return to(axiosClient.post('/roles', data));
}

export async function updateRole(id, data) {
  return to(axiosClient.put(`/roles/${id}`, data));
}

export async function deleteRole(id) {
  return to(axiosClient.delete(`/roles/${id}`));
}

export async function getGroupedPermissions() {
  return to(axiosClient.get('/permissions'));
}