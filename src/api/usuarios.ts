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