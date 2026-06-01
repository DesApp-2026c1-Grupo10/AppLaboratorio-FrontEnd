import { API_URL } from './config';

export async function getEquipos(search?: string, estado?: string, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (estado) params.set('estado', estado);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  params.set('_t', String(Date.now()));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/inventario/equipos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo equipos');
  const result = await res.json();
  if (page) return result;
  return result.data || [];
}

export async function getEquipo(id: number) {
  const res = await fetch(`${API_URL}/inventario/equipos/${id}?_t=${Date.now()}`);
  if (!res.ok) throw new Error('Equipo no encontrado');
  const result = await res.json();
  return result.data;
}

export async function createEquipo(data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/equipos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando equipo');
  return result.data;
}

export async function updateEquipo(id: number, data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/equipos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando equipo');
  return result.data;
}

export async function deleteEquipo(id: number) {
  const res = await fetch(`${API_URL}/inventario/equipos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando equipo');
}
