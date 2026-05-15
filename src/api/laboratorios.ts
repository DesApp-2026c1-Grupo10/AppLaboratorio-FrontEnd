const API_URL = "http://localhost:3001/api";

export async function getLaboratorios() {
  const response = await fetch("http://localhost:3001/api/laboratorios");
  if (!response.ok) throw new Error("Error obteniendo laboratorios");
  
  const result = await response.json();
  // result es { data: [...] }, nosotros devolvemos el array [...]
  return result.data || []; 
}

export async function createLaboratorio(laboratorio: any) {
  const response = await fetch(`${API_URL}/laboratorios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(laboratorio),
  });
  if (!response.ok) throw new Error("Error creando laboratorio");
  const result = await response.json();
  return result.data;
}