import { API_URL } from './config';

export async function getReactivos(search?: string, proximoVencer?: boolean, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (proximoVencer) params.set('proximoVencer', 'true');
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  params.set('_t', String(Date.now()));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/inventario/reactivos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo reactivos');
  const result = await res.json();
  if (page) return result;
  return result.data || [];
}

export async function getReactivo(id: number) {
  const res = await fetch(`${API_URL}/inventario/reactivos/${id}?_t=${Date.now()}`);
  if (!res.ok) throw new Error('Reactivo no encontrado');
  const result = await res.json();
  return result.data;
}

export async function createReactivo(data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/reactivos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando reactivo');
  return result.data;
}

export async function updateReactivo(id: number, data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/reactivos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando reactivo');
  return result.data;
}

export async function deleteReactivo(id: number) {
  const res = await fetch(`${API_URL}/inventario/reactivos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando reactivo');
}

export async function producirReactivo(id: number, cantidad: number, usuarioId?: number) {
  const res = await fetch(`${API_URL}/inventario/reactivos/${id}/producir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad, usuarioId }),
  });
  const result = await res.json();
  if (!res.ok) throw result;
  return result.data;
}
