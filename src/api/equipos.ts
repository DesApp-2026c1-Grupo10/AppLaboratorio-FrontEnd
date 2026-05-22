const API_URL = 'http://localhost:3001/api/inventario';

export async function getEquipos(search?: string, estado?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (estado) params.set('estado', estado);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/equipos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo equipos');
  const result = await res.json();
  return result.data || [];
}

export async function getEquipo(id: number) {
  const res = await fetch(`${API_URL}/equipos/${id}`);
  if (!res.ok) throw new Error('Equipo no encontrado');
  const result = await res.json();
  return result.data;
}

export async function createEquipo(data: any) {
  const res = await fetch(`${API_URL}/equipos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando equipo');
  return result.data;
}

export async function updateEquipo(id: number, data: any) {
  const res = await fetch(`${API_URL}/equipos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando equipo');
  return result.data;
}

export async function deleteEquipo(id: number) {
  const res = await fetch(`${API_URL}/equipos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando equipo');
}
