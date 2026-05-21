const API_URL = "http://localhost:3001/api/inventario";
export async function getEquipos() {
  const response = await fetch(`${API_URL}/equipos`);
  if (!response.ok) throw new Error("Error obteniendo equipos");
  const result = await response.json();
  return result.data || [];
}
export async function getMateriales() {
  const response = await fetch(`${API_URL}/materiales`);
  if (!response.ok) throw new Error("Error obteniendo materiales");
  const result = await response.json();
  return result.data || [];
}
export async function getReactivos() {
  const response = await fetch(`${API_URL}/reactivos`);
  if (!response.ok) throw new Error("Error obteniendo reactivos");
  const result = await response.json();
  return result.data || [];
}