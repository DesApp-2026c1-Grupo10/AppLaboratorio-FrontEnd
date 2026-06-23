import { API_URL, authFetch } from './config';

export async function getLaboratorios() {
  const response = await authFetch(`${API_URL}/laboratorios?_t=${Date.now()}`);
  if (!response.ok) throw new Error("Error obteniendo laboratorios");
  
  const result = await response.json();
  // result es { data: [...] }, nosotros devolvemos el array [...]
  return result.data || []; 
}

export async function createLaboratorio(laboratorio: Record<string, any>) {
  const response = await authFetch(`${API_URL}/laboratorios`, {
    method: "POST",
    body: JSON.stringify(laboratorio),
  });
  if (!response.ok) throw new Error("Error creando laboratorio");
  const result = await response.json();
  return result.data;
}

export async function updateLaboratorio(id: number, data: Record<string, any>) {
  const response = await authFetch(`${API_URL}/laboratorios/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error actualizando laboratorio");
  const result = await response.json();
  return result.data;
}