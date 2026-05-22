const API_URL = 'http://localhost:3001/api/inventario';

export async function getMateriales(search?: string) {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_URL}/materiales${params}`);
  if (!res.ok) throw new Error('Error obteniendo materiales');
  const result = await res.json();
  return result.data || [];
}

export async function getMaterial(id: number) {
  const res = await fetch(`${API_URL}/materiales/${id}`);
  if (!res.ok) throw new Error('Material no encontrado');
  const result = await res.json();
  return result.data;
}

export async function createMaterial(data: any) {
  const res = await fetch(`${API_URL}/materiales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando material');
  return result.data;
}

export async function updateMaterial(id: number, data: any) {
  const res = await fetch(`${API_URL}/materiales/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando material');
  return result.data;
}

export async function deleteMaterial(id: number) {
  const res = await fetch(`${API_URL}/materiales/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando material');
}
