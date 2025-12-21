import React, { useEffect, useState } from 'react';
import type { User } from '../types/pld';
import { authApi } from '../lib/api';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem('pld_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.data.user);
      } catch {
        window.localStorage.removeItem('pld_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void loadMe();
  }, [token]);

  const login: AuthContextValue['login'] = async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    window.localStorage.setItem('pld_token', res.data.token);
  };

  const register: AuthContextValue['register'] = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    window.localStorage.setItem('pld_token', res.data.token);
  };

  const logout: AuthContextValue['logout'] = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem('pld_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
