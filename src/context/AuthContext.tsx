import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister, deleteUser as apiDeleteUser } from '../api/client';
import type { LoginRequest, RegisterRequest } from '../types';
import { getToken, setToken, clearToken } from '../services/auth';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const token = getToken();
      setIsAuthenticated(!!token);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const login = async (data: LoginRequest) => {
    setError(null);
    try {
      const response = await apiLogin(data);
      setToken(response.jwt);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const register = async (data: RegisterRequest) => {
    setError(null);
    try {
      const response = await apiRegister(data);
      // Note: Registration might not return a JWT token
      // If it does, we should store it here
      // For now, we'll assume user needs to login after registration
      console.log('Registration successful:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    clearToken();
    setIsAuthenticated(false);
  };

  const deleteUser = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiDeleteUser();
      // After successful deletion, clear token and logout
      clearToken();
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ isAuthenticated, loading, error, refresh, login, register, logout, deleteUser }), [isAuthenticated, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 