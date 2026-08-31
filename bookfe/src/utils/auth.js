/**
 * Authentication and JWT Token utility helper
 */

export function getToken() {
  return localStorage.getItem('token');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function getUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function setAuthData({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem('token', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (user) {
    const existing = getUser() || {};
    const merged = typeof user === 'string' ? JSON.parse(user) : user;
    localStorage.setItem('user', JSON.stringify({ ...existing, ...merged }));
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Helper to check if a user has permission to manage a specific resource
 * (e.g. 'BOOK', 'CATEGORY', 'ROLE', 'USER')
 */
export function hasResourcePermission(user, resourcePrefix) {
  if (!user) return false;

  const roleName = user.role || user.roleName;
  if (roleName === 'SUPER_ADMIN' || roleName === 'ADMIN') {
    return true;
  }

  // Extract permissions list
  let perms = user.permissions;
  if (!perms && user.roleDetails?.permissions) {
    perms = user.roleDetails.permissions;
  }

  // If perms is empty or not loaded yet, default to true for custom roles with canAccessAdmin to prevent lock-out!
  if (!perms || !Array.isArray(perms) || perms.length === 0) {
    return user.canAccessAdmin !== false;
  }

  const prefix = resourcePrefix.toUpperCase(); // e.g. "ROLE" or "BOOK" or "CATEGORY" or "USER"

  return perms.some((p) => {
    if (typeof p === 'string') {
      const pUpper = p.toUpperCase();
      return pUpper.startsWith(prefix) || pUpper.includes(prefix);
    }
    if (p && typeof p === 'object') {
      const resUpper = (p.resource || '').toUpperCase();
      const nameUpper = (p.name || '').toUpperCase();
      return resUpper === prefix || nameUpper.startsWith(prefix) || nameUpper.includes(prefix);
    }
    return false;
  });
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;

    const decodedPayload = JSON.parse(atob(payloadBase64));
    if (decodedPayload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedPayload.exp < currentTime;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function isTokenValid(token) {
  return Boolean(token) && !isTokenExpired(token);
}

/**
 * User is authenticated if either Access Token is valid OR Refresh Token is valid
 */
export function isAuthenticated() {
  const token = getToken();
  const refreshToken = getRefreshToken();

  // If access token is valid, authenticated
  if (isTokenValid(token)) return true;

  // If access token expired but refresh token is valid, still authenticated (will auto-refresh)
  if (isTokenValid(refreshToken)) return true;

  // Both tokens missing or expired -> clear storage and return false
  clearAuth();
  return false;
}
