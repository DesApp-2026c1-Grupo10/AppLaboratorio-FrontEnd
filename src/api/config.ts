export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function getAuthHeaders(): Record<string, string> {
  const usuario = localStorage.getItem('usuario');
  if (!usuario) return {};
  const { token } = JSON.parse(usuario);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  return response;
}
