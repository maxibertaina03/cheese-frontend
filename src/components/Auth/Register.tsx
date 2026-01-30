// src/components/Auth/Register.tsx
import React, { useState } from 'react';

interface RegisterProps {
  onRegister: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onBackToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onBackToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    // Validaciones
    if (!username || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const result = await onRegister(username, password);
      
      if (result.success) {
        // Registro exitoso - el componente padre manejará la navegación
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Error al registrar usuario');
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginBottom: '0.5rem' }}>
          Crear Cuenta
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Registrate como usuario del sistema
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
          Contraseña
        </label>
        <input
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          Confirmar Contraseña
        </label>
        <input
          type="password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
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
        onClick={handleRegister} 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '0.875rem',
          background: loading ? '#d1d5db' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: loading ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.3)'
        }}
      >
        {loading ? 'Registrando...' : '✓ Crear Cuenta'}
      </button>

      <div style={{ 
        marginTop: '1.5rem', 
        textAlign: 'center',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          ¿Ya tienes cuenta?
        </p>
        <button
          onClick={onBackToLogin}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f59e0b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline'
          }}
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};