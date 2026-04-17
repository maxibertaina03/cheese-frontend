import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';

const AUTH_STORAGE_KEY = 'cheese_stock_auth';

export const useAuth = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const setUser = (nextUser: User | null) => {
    setUserState(nextUser);

    if (nextUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);

      if (!savedUser) {
        setAuthLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser) as User;
        const response = await apiService.verifyToken(parsedUser.token);

        if (!response.ok) {
          setUser(null);
          setAuthLoading(false);
          return;
        }

        const data = await response.json();
        setUser({
          token: parsedUser.token,
          rol: data.user.rol,
        });
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiService.login(username, password);
      const data = await res.json();

      if (res.ok) {
        setUser({ token: data.token, rol: data.user.rol });
        return { success: true, error: '' };
      }

      return { success: false, error: data.error || 'Credenciales invalidas' };
    } catch {
      return { success: false, error: 'Error de conexion' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  return { user, login, logout, setUser, authLoading };
};
