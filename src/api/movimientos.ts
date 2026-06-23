import { API_URL, authFetch } from './config';

export async function getMovimientos(tipo?: string, materialId?: number, reactivoId?: number, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  if (materialId) params.set('materialId', String(materialId));
  if (reactivoId) params.set('reactivoId', String(reactivoId));
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  params.set('_t', String(Date.now()));
  const qs = params.toString();
  const res = await authFetch(`${API_URL}/inventario/movimientos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo movimientos');
  const result = await res.json();
  if (page) return result;
  return result.data || [];
}

export async function createMovimiento(data: {
  tipoMovimiento: 'entrada' | 'salida';
  cantidad: number;
  fecha?: string;
  observacion?: string;
  usuarioId: number;
  materialId?: number;
  reactivoId?: number;
}) {
  const res = await authFetch(`${API_URL}/inventario/movimientos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error registrando movimiento');
  return result.data;
}
