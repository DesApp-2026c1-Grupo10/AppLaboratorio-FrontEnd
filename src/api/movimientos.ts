const API_URL = 'http://localhost:3001/api/inventario';

export async function getMovimientos(tipo?: string, materialId?: number, reactivoId?: number) {
  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  if (materialId) params.set('materialId', String(materialId));
  if (reactivoId) params.set('reactivoId', String(reactivoId));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/movimientos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error obteniendo movimientos');
  const result = await res.json();
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
  const res = await fetch(`${API_URL}/movimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Error registrando movimiento');
  return result.data;
}
