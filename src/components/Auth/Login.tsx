// src/components/Auth/Login.tsx - Versión mejorada con registro
import React, { useState } from 'react';
import { User } from '../../types';
import { Register } from './Register';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        onLogin({ 
          token: data.token, 
          rol: data.user.rol
        });
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          rol: 'usuario' // Siempre crear como usuario
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess('¡Usuario registrado exitosamente! Ya puedes iniciar sesión.');
        setShowRegister(false);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Error al registrar usuario' 
        };
      }
    } catch (err) {
      return { 
        success: false, 
        error: 'Error de conexión al servidor' 
      };
    }
  };

  if (showRegister) {
    return (
      <Register 
        onRegister={handleRegister}
        onBackToLogin={() => {
          setShowRegister(false);
          setError('');
        }}
      />
    );
  }

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '100px auto', 
      padding: '2rem', 
      background: 'white',
      border: '1px solid #e5e7eb', 
      borderRadius: 16,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          background: '#f59e0b',
          width: 64,
          height: 64,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginBottom: '0.5rem' }}>
          Stock de Quesos
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Las Tres Estrellas
        </p>
      </div>
      
      {error && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          background: '#fee2e2', 
          color: '#991b1b',
          borderRadius: 8,
          border: '1px solid #fecaca',
          fontSize: '0.875rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          background: '#d1fae5', 
          color: '#065f46',
          borderRadius: 8,
          border: '1px solid #a7f3d0',
          fontSize: '0.875rem'
        }}>
          ✓ {success}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Usuario
        </label>
        <input
          type="text"
          placeholder="Tu nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            border: '2px solid #e5e7eb',
            borderRadius: 8,
            fontSize: '1rem',
            transition: 'all 0.3s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Contraseña
        </label>
        <input
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            border: '2px solid #e5e7eb',
            borderRadius: 8,
            fontSize: '1rem',
            transition: 'all 0.3s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      <button 
        onClick={handleLogin} 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '0.875rem',
          background: loading ? '#d1d5db' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: loading ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.3)',
          marginBottom: '1rem'
        }}
      >
        {loading ? 'Cargando...' : '→ Entrar'}
      </button>

      <div style={{ 
        textAlign: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          ¿No tienes cuenta?
        </p>
        <button
          onClick={() => setShowRegister(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#10b981',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline'
          }}
        >
          Crear una cuenta
        </button>
      </div>
    </div>
  );
};