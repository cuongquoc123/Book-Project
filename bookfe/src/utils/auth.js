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
  if (user) localStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
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
