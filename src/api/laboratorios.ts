import { API_URL } from './config';

export async function getLaboratorios() {
  const response = await fetch(`${API_URL}/laboratorios?_t=${Date.now()}`);
  if (!response.ok) throw new Error("Error obteniendo laboratorios");
  
  const result = await response.json();
  // result es { data: [...] }, nosotros devolvemos el array [...]
  return result.data || []; 
}

export async function createLaboratorio(laboratorio: Record<string, any>) {
  const response = await fetch(`${API_URL}/laboratorios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(laboratorio),
  });
  if (!response.ok) throw new Error("Error creando laboratorio");
  const result = await response.json();
  return result.data;
}