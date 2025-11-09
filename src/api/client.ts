// Use relative URLs if VITE_API_URL is empty (for Docker with nginx proxy)
// Otherwise use the full URL (for production or development)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

import { getToken } from '../services/auth';
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  RegisterResponse,
  ProfileCreationRequest,
  ProfileCreationResponse,
  ProfileResponse
} from '../types';


const DEFAULT_TIMEOUT_MS = 10000;

export class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: (RequestInit & { timeoutMs?: number; skipAuth?: boolean }) = {}
): Promise<T> {
  const token = getToken();
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipAuth = false, ...fetchOptions } = options;
  
  // Debug logging
  console.log('API Request:', {
    endpoint,
    hasToken: !!token,
    skipAuth,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    method: fetchOptions.method || 'GET'
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        // Only set Content-Type for JSON if a body exists and it's not FormData
        ...(fetchOptions.body && !(fetchOptions.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        // Don't add Authorization header if skipAuth is true or if it's a login/register endpoint
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
      // No cookies needed with Bearer token
      ...fetchOptions,
    });

    if (!res.ok) {
      let errorData: unknown = null;
      try {
        errorData = await res.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error('HTTP Error:', res.status, errorData);
      throw new HttpError(res.status, errorData, `HTTP Error: ${res.status}`);
    }

    const responseText = await res.text();
    try {
      return JSON.parse(responseText) as T;
    } catch (e) {
      // Handle cases where the response body is empty but the request was successful (e.g., 201 or 204)
      if (responseText === '') {
        return null as T; // Or {} as T, depending on desired behavior for empty success
      }
      // Re-throw if it's a genuine JSON parsing error on non-empty text
      throw new Error(`Failed to parse JSON response: ${responseText}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    if (typeof navigator !== 'undefined' && navigator && !navigator.onLine) {
      throw new Error('You appear to be offline. Please reconnect and try again.');
    }
    throw new Error((err as Error)?.message || 'Network error');
  } finally {
    clearTimeout(timeoutId);
  }
}
// Authentication functions
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  console.log('Attempting login with:', { username: credentials.username, hasPassword: !!credentials.password });
  console.log('API Base URL:', API_BASE_URL);
  console.log('Full URL:', `${API_BASE_URL}/api/auth/login`);
  
  try {
    const result = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true, // Don't send Authorization header for login
    });
    console.log('Login successful, JWT received:', result.jwt ? 'Yes' : 'No');
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(userData: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
    skipAuth: true, // Don't send Authorization header for registration
  });
}



export async function createProfile(profileData: ProfileCreationRequest): Promise<ProfileCreationResponse> {
  // Always use JSON format as per API documentation
  const jsonData = {
    firstName: profileData.firstName,
    lastName: profileData.lastName || '',
    biography: profileData.biography || '',
    photoUrl: profileData.photoUrl || ''
  };

  return apiFetch<ProfileCreationResponse>('/api/profile', {
    method: 'POST',
    body: JSON.stringify(jsonData),
  });
}

// Note: Using GET /api/profile to get current user info instead of /api/me

export async function getProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>('/api/profile', {
    method: 'GET',
  });
}

export async function getProfileByUsername(username: string): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>(`/api/profile/${username}`, {
    method: 'GET',
  });
}

export async function updateProfile(profileData: Partial<ProfileCreationRequest>): Promise<ProfileCreationResponse> {
  const jsonData = {
    firstName: profileData.firstName || '',
    lastName: profileData.lastName || '',
    biography: profileData.biography || '',
    photoUrl: profileData.photoUrl || ''
  };

  return apiFetch<ProfileCreationResponse>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(jsonData),
  });
}

export async function patchProfile(profileData: Partial<ProfileCreationRequest>): Promise<ProfileCreationResponse> {
  const jsonData: Partial<ProfileCreationRequest> = {};
  
  if (profileData.firstName !== undefined) {
    jsonData.firstName = profileData.firstName;
  }
  
  if (profileData.lastName !== undefined) {
    jsonData.lastName = profileData.lastName;
  }
  
  if (profileData.biography !== undefined) {
    jsonData.biography = profileData.biography;
  }
  
  if (profileData.photoUrl !== undefined) {
    jsonData.photoUrl = profileData.photoUrl;
  }

  return apiFetch<ProfileCreationResponse>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(jsonData),
  });
}
// User account management
export async function deleteUser(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/user', {
    method: 'DELETE',
  });
}

// Session helpers (best-effort; backend does not provide /me)
export async function logout(): Promise<void> {
  // If backend had a logout, call it; otherwise just clear token client-side.
  // Here we only clear token; you can extend if backend adds endpoint later.
  return Promise.resolve();
}
