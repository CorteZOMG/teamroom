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

export interface MeResponse {
  id: string;
  username: string;
  email?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    // No cookies needed with Bearer token
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
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

// Session helpers (best-effort; backend does not provide /me)
export async function logout(): Promise<void> {
  // If backend had a logout, call it; otherwise just clear token client-side.
  // Here we only clear token; you can extend if backend adds endpoint later.
  return Promise.resolve();
}
