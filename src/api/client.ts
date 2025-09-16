export const API_BASE_URL = import.meta.env.VITE_API_URL;

import { getToken } from '../services/auth';
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  RegisterResponse,
  ProfileCreationRequest,
  ProfileCreationResponse,
  ProfileResponse,
  UploadLinkResponse,
  PublicLinkResponse
} from '../types';


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

// File upload functions
export async function getUploadLink(purpose: string): Promise<UploadLinkResponse> {
  console.log('Getting upload link for purpose:', purpose);
  
  return apiFetch<UploadLinkResponse>(`/api/cloud-storage/get-upload-link?purpose=${encodeURIComponent(purpose)}`, {
    method: 'GET',
  });
}

export async function uploadFile(uploadUrl: string, file: File): Promise<{ fileid: number }> {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Uploading file to:', uploadUrl);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Upload response:', result);
  
  // Extract fileid from the response
  const fileid = result.fileid || (result.fileids && result.fileids[0]);
  if (!fileid) {
    throw new Error('No fileid found in upload response');
  }
  
  return { fileid };
}

export async function getPublicLink(fileid: number): Promise<PublicLinkResponse> {
  console.log('Getting public link for fileid:', fileid);
  
  return apiFetch<PublicLinkResponse>(`/api/cloud-storage/get-public-link?fileid=${fileid}`, {
    method: 'GET',
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
  const jsonData: any = {};
  
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
