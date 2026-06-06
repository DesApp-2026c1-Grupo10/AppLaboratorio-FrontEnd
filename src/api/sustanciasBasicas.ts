import { API_URL } from './config';

export async function getSustanciasBasicas(search?: string, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  params.set('_t', String(Date.now()));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/inventario/sustancias-basicas${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo sustancias básicas');
  const result = await res.json();
  if (page) return result;
  return result.data || [];
}

export async function createSustanciaBasica(data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/sustancias-basicas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando sustancia básica');
  return result.data;
}

export async function updateSustanciaBasica(id: number, data: Record<string, any>) {
  const res = await fetch(`${API_URL}/inventario/sustancias-basicas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando sustancia básica');
  return result.data;
}

export async function deleteSustanciaBasica(id: number) {
  const res = await fetch(`${API_URL}/inventario/sustancias-basicas/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando sustancia básica');
}
