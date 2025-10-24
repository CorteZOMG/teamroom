const STORAGE_KEY = 'auth_jwt';

export function setToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {}
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Extract username from JWT token
 * JWT format: header.payload.signature
 * Payload contains: { sub: username, ... }
 */
export function getUsernameFromToken(): string | null {
  try {
    const token = getToken();
    if (!token) return null;

    // Split JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Extract username from 'sub' field
    return payload.sub || null;
  } catch (error) {
    console.error('Failed to extract username from token:', error);
    return null;
  }
} 