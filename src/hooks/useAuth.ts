// src/hooks/useAuth.ts
import { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiService.login(username, password);
      const data = await res.json();
      
      if (res.ok) {
        setUser({ token: data.token, rol: data.rol });
        return { success: true, error: '' };
      } else {
        return { success: false, error: 'Credenciales inválidas' };
      }
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return { user, login, logout, setUser };
};