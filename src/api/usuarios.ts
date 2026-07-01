import { API_URL, authFetch } from './config';
import type { Usuario } from '../types/usuario';

export async function loginUsuario(email: string, password: string) {
  const response = await fetch(`${API_URL}/usuarios/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Email o contraseña incorrectos");
  }

  const result = await response.json();
  return result.data;
}

export async function getUsuarios(): Promise<Usuario[]> {
  const response = await authFetch(`${API_URL}/usuarios`);
  if (!response.ok) throw new Error('Error obteniendo usuarios');
  const result = await response.json();
  return result.data || [];
}

export async function createUsuario(data: Record<string, any>): Promise<Usuario> {
  const response = await authFetch(`${API_URL}/usuarios`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error creando usuario');
  }
  const result = await response.json();
  return result.data;
}

export async function updateUsuario(id: number, data: Record<string, any>): Promise<Usuario> {
  const response = await authFetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error actualizando usuario');
  }
  const result = await response.json();
  return result.data;
}

export async function deleteUsuario(id: number): Promise<void> {
  const response = await authFetch(`${API_URL}/usuarios/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error eliminando usuario' }));
    throw new Error(err.message || 'Error eliminando usuario');
  }
}
