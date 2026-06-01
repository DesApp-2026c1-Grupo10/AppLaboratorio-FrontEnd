import { API_URL } from './config';

export async function getMateriales(search?: string, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  params.set('_t', String(Date.now()));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/inventario/materiales${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo materiales');
  const result = await res.json();
  if (page) return result;
  return result.data || [];
}

export async function getMaterial(id: number) {
  const res = await fetch(`${API_URL}/inventario/materiales/${id}?_t=${Date.now()}`);
  if (!res.ok) throw new Error('Material no encontrado');
  const result = await res.json();
  return result.data;
}

export async function createMaterial(data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/materiales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando material');
  return result.data;
}

export async function updateMaterial(id: number, data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/materiales/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando material');
  return result.data;
}

export async function deleteMaterial(id: number) {
  const res = await fetch(`${API_URL}/inventario/materiales/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando material');
}
