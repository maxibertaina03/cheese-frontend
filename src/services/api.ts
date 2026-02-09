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

  // ← NUEVO: Eliminar unidad (admin only)
  deleteUnidad: (apiFetch: any, id: number) =>
    apiFetch(`${API_URL}/api/unidades/${id}`, {
      method: 'DELETE',
    }),

  // ← NUEVO: Eliminar unidad del historial permanentemente (admin only)
  deleteUnidadPermanente: (apiFetch: any, id: number) =>
    apiFetch(`${API_URL}/api/unidades/${id}/hard`, {
      method: 'DELETE',
    }),

  createParticion: (apiFetch: any, unidadId: number, data: any) =>
    apiFetch(`${API_URL}/api/unidades/${unidadId}/particiones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Productos
  getProductos: (apiFetch: any) => apiFetch(`${API_URL}/api/productos`),

  // ← NUEVOS: CRUD Productos (admin only)
  createProducto: (apiFetch: any, data: any) =>
    apiFetch(`${API_URL}/api/productos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProducto: (apiFetch: any, id: number, data: any) =>
    apiFetch(`${API_URL}/api/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProducto: (apiFetch: any, id: number) =>
    apiFetch(`${API_URL}/api/productos/${id}`, {
      method: 'DELETE',
    }),

  // Tipos de queso
  getTiposQueso: (apiFetch: any) => apiFetch(`${API_URL}/api/tipos-queso`),

  // Motivos
  getMotivos: (apiFetch: any) => apiFetch(`${API_URL}/api/motivos`),

    // Usuarios (admin only)
  getUsuarios: (apiFetch: any) => apiFetch(`${API_URL}/api/usuarios`),

  createUsuario: (apiFetch: any, data: any) =>
    apiFetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUsuario: (apiFetch: any, id: number, data: any) =>
    apiFetch(`${API_URL}/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUsuario: (apiFetch: any, id: number) =>
    apiFetch(`${API_URL}/api/usuarios/${id}`, {
      method: 'DELETE',
    }),

  // Elementos
  getElementos: (apiFetch: any) => apiFetch(`${API_URL}/api/elementos`),
  getElemento: (apiFetch: any, id: number) => apiFetch(`${API_URL}/api/elementos/${id}`),
  getElementoMovimientos: (apiFetch: any, id: number) =>
    apiFetch(`${API_URL}/api/elementos/${id}/movimientos`),

  createElemento: (apiFetch: any, data: any) =>
    apiFetch(`${API_URL}/api/elementos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateElemento: (apiFetch: any, id: number, data: any) =>
    apiFetch(`${API_URL}/api/elementos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteElemento: (apiFetch: any, id: number) =>
    apiFetch(`${API_URL}/api/elementos/${id}`, {
      method: 'DELETE',
    }),

  elementoIngreso: (apiFetch: any, id: number, data: any) =>
    apiFetch(`${API_URL}/api/elementos/${id}/ingreso`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  elementoEgreso: (apiFetch: any, id: number, data: any) =>
    apiFetch(`${API_URL}/api/elementos/${id}/egreso`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

};
