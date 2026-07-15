// src/App.tsx
//
// Raíz de la aplicación: resuelve la sesión y monta los providers de contexto
// alrededor del shell. Todo lo demás vive en app/AppShell y en los contenedores
// de cada bounded context (contextos/*).
import React from 'react';
import './App.css';
import { createApiFetch } from './services/api';
import { useAuth } from './contextos/identidad/hooks/useAuth';
import { Login } from './contextos/identidad/componentes/Login';
import { InventarioProvider } from './contextos/inventario-quesos/InventarioContexto';
import { AppShell } from './app/AppShell';

function App() {
  const { user, setUser, logout, authLoading } = useAuth();

  const apiFetch = createApiFetch(user?.token, () => {
    setUser(null);
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
  });

  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Verificando sesion...</div>;
  }

  if (!user) return <Login onLogin={setUser} />;

  // Los providers y el shell se montan recién con sesión iniciada y se
  // desmontan al cerrar sesión, así que el estado se limpia solo.
  return (
    <InventarioProvider apiFetch={apiFetch}>
      <AppShell user={user} apiFetch={apiFetch} onLogout={logout} />
    </InventarioProvider>
  );
}

export default App;
