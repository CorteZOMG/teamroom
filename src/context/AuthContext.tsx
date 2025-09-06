import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister, type LoginRequest, type RegisterRequest } from '../api/client';
import { getToken, clearToken } from '../services/auth';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
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
    await apiLogin(data);
    await refresh();
  };

  const register = async (data: RegisterRequest) => {
    setError(null);
    await apiRegister(data);
    await refresh();
  };

  const logout = async () => {
    setError(null);
    clearToken();
    setIsAuthenticated(false);
  };

  const value = useMemo<AuthContextValue>(() => ({ isAuthenticated, loading, error, refresh, login, register, logout }), [isAuthenticated, loading, error]);

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