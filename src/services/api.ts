// src/services/api.ts
const API_URL = process.env.REACT_APP_API_URL;

export const createApiFetch = (
  token: string | undefined,
  onUnauthorized: () => void
) => {
  return (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).then(response => {
      if (response.status === 401) {
        onUnauthorized();
        return Promise.reject(new Error('Token expirado'));
      }
      return response;
    });
  };
};

export const apiService = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res;
  },

  // Unidades
  getUnidades: (apiFetch: any) => apiFetch(`${API_URL}/api/unidades`),
  getHistorial: (apiFetch: any) => apiFetch(`${API_URL}/api/unidades/historial`),
  
  createUnidad: (apiFetch: any, data: any) =>
    apiFetch(`${API_URL}/api/unidades`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUnidad: (apiFetch: any, id: number, observaciones: string) =>
    apiFetch(`${API_URL}/api/unidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ observacionesIngreso: observaciones }),
    }),

  createParticion: (apiFetch: any, unidadId: number, data: any) =>
    apiFetch(`${API_URL}/api/unidades/${unidadId}/particiones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Productos
  getProductos: (apiFetch: any) => apiFetch(`${API_URL}/api/productos`),

  // Tipos de queso
  getTiposQueso: (apiFetch: any) => apiFetch(`${API_URL}/api/tipos-queso`),

  // Motivos
  getMotivos: (apiFetch: any) => apiFetch(`${API_URL}/api/motivos`),
};