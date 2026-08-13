const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
  params?: Record<string, string | number | undefined>;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;
  
  let url = `${API_BASE}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, `HTTP ${response.status}`, errorData);
  }
  
  return response.json();
}

// === Familiar Module ===
export const familiarApi = {
  registrarCaso: (data: unknown, token: string) =>
    apiRequest('/familiar/registro', { method: 'POST', body: data, token }),
    
  obtenerCaso: (id: string) =>
    apiRequest(`/familiar/caso/${id}`),
    
  misCasos: (token: string) =>
    apiRequest('/familiar/mis-casos', { token }),
    
  registrarUsuario: (data: unknown) =>
    apiRequest<{ message: string; email: string; requiere_verificacion: boolean }>(
      '/familiar/auth/registro', { method: 'POST', body: data }
    ),
    
  verificarEmail: (token: string) =>
    apiRequest<{ message: string; access_token?: string; token_type?: string; rol?: string }>(
      '/familiar/auth/verificar-email', { method: 'POST', body: { token } }
    ),

  reenviarVerificacion: (email: string) =>
    apiRequest<{ message: string }>(
      '/familiar/auth/reenviar-verificacion', { method: 'POST', body: { email } }
    ),
    
  login: (data: { email: string; password: string }) =>
    apiRequest<{ access_token: string; token_type: string; rol: string }>(
      '/familiar/auth/login', { method: 'POST', body: data }
    ),
};

// === Community Module ===
export const comunidadApi = {
  casosAprobados: (params?: Record<string, string | number | undefined>) =>
    apiRequest('/comunidad/casos-aprobados', { params }),
    
  enviarPista: (data: unknown, token: string) =>
    apiRequest('/comunidad/pista', { method: 'POST', body: data, token }),
    
  pistasDelCaso: (casoId: string) =>
    apiRequest(`/comunidad/caso/${casoId}/pistas`),
};

// === Admin Module ===
export const adminApi = {
  casosPendientes: (token: string) =>
    apiRequest('/admin/casos-pendientes', { token }),
    
  aprobarCaso: (id: string, token: string) =>
    apiRequest(`/admin/caso/${id}/aprobar`, { method: 'PATCH', token }),
    
  rechazarCaso: (id: string, token: string) =>
    apiRequest(`/admin/caso/${id}/rechazar`, { method: 'PATCH', token }),
    
  marcarLocalizado: (id: string, data: unknown, token: string) =>
    apiRequest(`/admin/caso/${id}/localizado`, { method: 'PATCH', body: data, token }),
    
  colaPistas: (token: string) =>
    apiRequest('/admin/cola-pistas', { token }),
    
  moderarPista: (id: string, data: unknown, token: string) =>
    apiRequest(`/admin/pista/${id}/moderar`, { method: 'PATCH', body: data, token }),
    
  estadisticas: (token: string) =>
    apiRequest('/admin/estadisticas', { token }),
};

// === Prediction Module ===
export const predictionApi = {
  kde: (casoId: string, token: string) =>
    apiRequest(`/prediction/kde/${casoId}`, { token }),
    
  markov: (casoId: string, token: string) =>
    apiRequest(`/prediction/markov/${casoId}`, { token }),
    
  poligono: (casoId: string, token: string) =>
    apiRequest(`/prediction/poligono/${casoId}`, { token }),
};

// === Derechos ARCO (LOPDP Art. 13-17, Art. 8) ===
export const derechosApi = {
  /** Art. 13 — Acceso: obtener todos los datos personales del titular */
  acceso: (token: string) =>
    apiRequest('/derechos/acceso', { token }),

  /** Art. 14 — Rectificación: corregir datos personales */
  rectificacion: (data: { nombre?: string; email?: string; telefono?: string }, token: string) =>
    apiRequest('/derechos/rectificacion', { method: 'PATCH', body: data, token }),

  /** Art. 15 — Eliminación: solicitar supresión de datos */
  eliminacion: (data: { motivo: string; confirmar: boolean }, token: string) =>
    apiRequest('/derechos/eliminacion', { method: 'POST', body: data, token }),

  /** Art. 16 — Oposición: oponerse al tratamiento */
  oposicion: (data: { motivo: string; tratamiento_especifico?: string }, token: string) =>
    apiRequest('/derechos/oposicion', { method: 'POST', body: data, token }),

  /** Art. 17 — Portabilidad: exportar datos en formato JSON */
  portabilidad: (token: string) =>
    apiRequest('/derechos/portabilidad', { token }),

  /** Art. 8 — Revocar consentimiento */
  revocarConsentimiento: (data: { motivo?: string; confirmar: boolean }, token: string) =>
    apiRequest('/derechos/revocar-consentimiento', { method: 'POST', body: data, token }),
};

export { ApiError };
