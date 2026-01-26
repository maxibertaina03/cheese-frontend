// src/components/Auth/Login.tsx
import React, { useState } from 'react';
import { User } from '../../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        onLogin({ token: data.token, rol: data.rol });
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '100px auto', 
      padding: '2rem', 
      border: '1px solid #ccc', 
      borderRadius: 8 
    }}>
      <h2>Iniciar sesión</h2>
      
      {error && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          background: '#fee2e2', 
          color: '#991b1b',
          borderRadius: 4 
        }}>
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />
      <button 
        onClick={handleLogin} 
        disabled={loading}
        style={{ width: '100%', padding: '0.5rem' }}
      >
        {loading ? 'Cargando...' : 'Entrar'}
      </button>
    </div>
  );
};