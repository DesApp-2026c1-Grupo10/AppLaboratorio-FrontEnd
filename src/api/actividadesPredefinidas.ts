import { API_URL, authFetch } from './config';
import type { ActividadPredefinida } from '../types/actividadPredefinida';

export async function getActividadesPredefinidas(): Promise<ActividadPredefinida[]> {
  const res = await authFetch(`${API_URL}/actividades-predefinidas?_t=${Date.now()}`);
  if (!res.ok) throw new Error('Error obteniendo actividades');
  const result = await res.json();
  return result.data || [];
}

export async function createActividadPredefinida(data: Record<string, any>): Promise<ActividadPredefinida> {
  const res = await authFetch(`${API_URL}/actividades-predefinidas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error creando actividad');
  return result.data;
}

export async function updateActividadPredefinida(id: number, data: Record<string, any>): Promise<ActividadPredefinida> {
  const res = await authFetch(`${API_URL}/actividades-predefinidas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error actualizando actividad');
  return result.data;
}

export async function deleteActividadPredefinida(id: number) {
  const res = await authFetch(`${API_URL}/actividades-predefinidas/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando actividad');
}
