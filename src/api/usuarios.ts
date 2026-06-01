import { API_URL } from './config';

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
  return result.data; // Esto devuelve { id, nombre, email, rol }
}