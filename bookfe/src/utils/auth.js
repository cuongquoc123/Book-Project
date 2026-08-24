/**
 * Authentication and JWT Token utility helper
 */

export function getToken() {
  return localStorage.getItem('token');
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

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Check if the JWT token is valid and not expired
 */
export function isTokenValid(token) {
  if (!token) return false;

  try {
    // Decode base64 payload of JWT
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;

    const decodedPayload = JSON.parse(atob(payloadBase64));
    
    // Check expiration timestamp (exp is in seconds)
    if (decodedPayload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < currentTime) {
        console.warn('JWT token has expired.');
        return false;
      }
    }

    return true;
  } catch (error) {
    // If not a valid JWT format, treat as mock token or valid if string exists in dev
    console.warn('Non-JWT token or decode error, checking string existence:', error);
    return Boolean(token && token.length > 5);
  }
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  const valid = isTokenValid(token);
  if (!valid) {
    clearAuth();
    return false;
  }

  return true;
}
