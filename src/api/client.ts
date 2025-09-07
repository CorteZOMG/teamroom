export const API_BASE_URL = import.meta.env.VITE_API_URL;

import { getToken } from '../services/auth';

// Types for authentication
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}
                                 
export interface LoginResponse {
  jwt: string;
  username: string;
}

export interface RegisterResponse {
  message: string;
  username: string;
}

export interface ProfileCreationRequest {
  firstName: string;
  lastName?: string;
  biography?: string;
  profilePicture?: File;
}

export interface ProfileCreationResponse {
  message: string;
}

export interface ProfileResponse {
  firstName: string;
  lastName: string;
  biography: string;
  photoUrl: string;
}

export interface MeResponse {
  id: string;
  username: string;
  email?: string;
}

const DEFAULT_TIMEOUT_MS = 10000;

export async function apiFetch<T>(
  endpoint: string,
  options: (RequestInit & { timeoutMs?: number }) = {}
): Promise<T> {
  const token = getToken();
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  
  // Debug logging
  console.log('API Request:', {
    endpoint,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    method: fetchOptions.method || 'GET'
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        // Only set Content-Type for JSON, let browser handle FormData
        ...(fetchOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
      // No cookies needed with Bearer token
      ...fetchOptions,
    });

    if (!res.ok) {
      let errorText = '';
      try {
        errorText = await res.text();
      } catch {}
      throw new Error(`API error: ${res.status} ${res.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
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
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(userData: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function createProfile(profileData: ProfileCreationRequest): Promise<ProfileCreationResponse> {
  const formData = new FormData();
  formData.append('firstName', profileData.firstName);
  
  if (profileData.lastName) {
    formData.append('lastName', profileData.lastName);
  }
  
  if (profileData.biography) {
    formData.append('biography', profileData.biography);
  }
  
  if (profileData.profilePicture) {
    formData.append('profilePicture', profileData.profilePicture);
  }

  return apiFetch<ProfileCreationResponse>('/api/profile', {
    method: 'POST',
    body: formData,
    // Don't override headers - let apiFetch handle Authorization and Content-Type
  });
}

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
  const formData = new FormData();
  
  if (profileData.firstName) {
    formData.append('firstName', profileData.firstName);
  }
  
  if (profileData.lastName) {
    formData.append('lastName', profileData.lastName);
  }
  
  if (profileData.biography) {
    formData.append('biography', profileData.biography);
  }
  
  if (profileData.profilePicture) {
    formData.append('profilePicture', profileData.profilePicture);
  }

  return apiFetch<ProfileCreationResponse>('/api/profile', {
    method: 'PUT',
    body: formData,
  });
}

export async function patchProfile(profileData: Partial<ProfileCreationRequest>): Promise<ProfileCreationResponse> {
  const formData = new FormData();
  
  if (profileData.firstName) {
    formData.append('firstName', profileData.firstName);
  }
  
  if (profileData.lastName) {
    formData.append('lastName', profileData.lastName);
  }
  
  if (profileData.biography) {
    formData.append('biography', profileData.biography);
  }
  
  if (profileData.profilePicture) {
    formData.append('profilePicture', profileData.profilePicture);
  }

  return apiFetch<ProfileCreationResponse>('/api/profile', {
    method: 'PATCH',
    body: formData,
  });
}

// Session helpers (best-effort; backend does not provide /me)
export async function logout(): Promise<void> {
  // If backend had a logout, call it; otherwise just clear token client-side.
  // Here we only clear token; you can extend if backend adds endpoint later.
  return Promise.resolve();
}
