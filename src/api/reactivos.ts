const API_URL = 'http://localhost:3001/api/inventario';

export async function getReactivos(search?: string, proximoVencer?: boolean) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (proximoVencer) params.set('proximoVencer', 'true');
  const qs = params.toString();
  const res = await fetch(`${API_URL}/reactivos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo reactivos');
  const result = await res.json();
  return result.data || [];
}

export async function getReactivo(id: number) {
  const res = await fetch(`${API_URL}/reactivos/${id}`);
  if (!res.ok) throw new Error('Reactivo no encontrado');
  const result = await res.json();
  return result.data;
}

export async function createReactivo(data: any) {
  const res = await fetch(`${API_URL}/reactivos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando reactivo');
  return result.data;
}

export async function updateReactivo(id: number, data: any) {
  const res = await fetch(`${API_URL}/reactivos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando reactivo');
  return result.data;
}

export async function deleteReactivo(id: number) {
  const res = await fetch(`${API_URL}/reactivos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando reactivo');
}
