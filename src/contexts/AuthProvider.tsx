import React, { useCallback, useEffect, useState } from 'react';
import type { User } from '../types/pld';
import { authApi, setClientAuthToken } from '../lib/api';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

function safeGetStoredToken(): string | null {
  try {
    const token = window.localStorage.getItem('pld_token');
    return token && token.trim() ? token : null;
  } catch {
    return null;
  }
}

function safeSetStoredToken(token: string | null) {
  try {
    if (token && token.trim()) {
      window.localStorage.setItem('pld_token', token.trim());
    } else {
      window.localStorage.removeItem('pld_token');
    }
  } catch {
    // ignore
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => safeGetStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Mantém o axios client alinhado ao token atual (além do cookie HttpOnly)
    setClientAuthToken(token);

    const loadMe = async () => {
      try {
        const res = await authApi.me();
        setUser(res.data.user);
      } catch {
        safeSetStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void loadMe();
  }, [token]);

  const login: AuthContextValue['login'] = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    safeSetStoredToken(res.data.token);
    setClientAuthToken(res.data.token);
    return res.data.user;
  }, []);

  const register: AuthContextValue['register'] = useCallback(async (name, email, password, opts) => {
    const res = await authApi.register({ name, email, password, startTrial: !!opts?.startTrial });
    setUser(res.data.user);
    setToken(res.data.token);
    safeSetStoredToken(res.data.token);
    setClientAuthToken(res.data.token);
    return res.data.user;
  }, []);

  const logout: AuthContextValue['logout'] = useCallback(() => {
    // Best-effort para limpar cookie HttpOnly.
    void authApi.logout().catch(() => undefined);
    setUser(null);
    setToken(null);
    safeSetStoredToken(null);
    setClientAuthToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
