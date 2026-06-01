import { API_URL } from './config';

export async function getUsos(equipoId?: number) {
  const params = equipoId ? `?equipoId=${equipoId}&_t=${Date.now()}` : `?_t=${Date.now()}`;
  const res = await fetch(`${API_URL}/inventario/usos${params}`);
  if (!res.ok) throw new Error('Error obteniendo usos de equipo');
  const result = await res.json();
  return result.data || [];
}

export async function createUso(data: {
  equipoId: number;
  pedidoId?: number;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
}) {
  const res = await fetch(`${API_URL}/inventario/usos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error registrando uso');
  return result.data;
}

export async function finalizarUso(id: number) {
  const res = await fetch(`${API_URL}/inventario/usos/${id}/finalizar`, { method: 'PUT' });
  if (!res.ok) throw new Error('Error finalizando uso');
  const result = await res.json();
  return result.data;
}
