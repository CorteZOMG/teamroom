import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, type LoginRequest, type RegisterRequest, type MeResponse } from '../api/client';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
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
    await apiLogout();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({ user, loading, error, refresh, login, register, logout }), [user, loading, error]);

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