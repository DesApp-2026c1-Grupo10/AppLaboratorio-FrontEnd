import { API_URL, authFetch } from './config';
import type { Pedido } from '../types/pedido';
import type { Tarea } from '../types/tarea';
import type { PedidoRevision } from '../types/pedidoRevision';

export async function getPedidos(params?: { usuarioId?: number; rol?: string }): Promise<Pedido[]> {
  const query = new URLSearchParams({ _t: String(Date.now()) });
  if (params?.usuarioId) query.set('usuarioId', String(params.usuarioId));
  if (params?.rol) query.set('rol', params.rol);
  const response = await authFetch(`${API_URL}/pedidos?${query}`);
  if (!response.ok) throw new Error('Error obteniendo pedidos');
  const result = await response.json();
  return result.data || [];
}

export async function getPedido(id: number): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo pedido');
  const result = await response.json();
  return result.data;
}

export async function checkPedido(pedido: Record<string, any>): Promise<{ errors: string[]; warnings: string[] }> {
  const response = await authFetch(`${API_URL}/pedidos/check`, {
    method: 'POST',
    body: JSON.stringify(pedido),
  });
  const result = await response.json();
  if (!response.ok) return { errors: [result.message || 'Error verificando pedido'], warnings: [] };
  return { errors: result.errors || [], warnings: result.warnings || [] };
}

export async function createPedido(pedido: Record<string, any>): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos`, {
    method: 'POST',
    body: JSON.stringify(pedido),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error creando pedido');
  return result.data;
}

export async function updatePedido(id: number, data: Record<string, any>): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error actualizando pedido');
  const result = await response.json();
  return result.data;
}

export async function aprobarPedido(id: number, usuarioId?: number): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/aprobar`, {
    method: 'PUT',
    body: usuarioId ? JSON.stringify({ usuarioId }) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error aprobando pedido');
  return result.data;
}

export async function deshacerAprobacionPedido(id: number, usuarioId?: number): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/deshacer-aprobacion`, {
    method: 'PUT',
    body: usuarioId ? JSON.stringify({ usuarioId }) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error deshaciendo aprobación');
  return result.data;
}

export async function rechazarPedido(id: number, usuarioId?: number): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/rechazar`, {
    method: 'PUT',
    body: usuarioId ? JSON.stringify({ usuarioId }) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error rechazando pedido');
  return result.data;
}

export async function cancelarPedido(id: number, usuarioId: number): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/cancelar`, {
    method: 'PUT',
    body: JSON.stringify({ usuarioId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error cancelando pedido');
  return result.data;
}

export async function finalizarPedido(id: number, data: {
  usuarioId: number;
  materiales?: { id: number; cantidad: number; descartado?: boolean }[];
  reactivos?: { id: number; cantidad: number; descartado?: boolean }[];
  equipos?: { id: number; estado: string }[];
}): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/finalizar`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error finalizando pedido');
  return result.data;
}

export async function getTareas(id: number): Promise<Tarea[]> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/tareas?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo tareas');
  const result = await response.json();
  return result.data || [];
}

export async function toggleTarea(pedidoId: number, tareaId: number): Promise<Tarea> {
  const response = await authFetch(`${API_URL}/pedidos/${pedidoId}/tareas/${tareaId}`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Error actualizando tarea');
  const result = await response.json();
  return result.data;
}

export async function getHistorialPedido(id: number): Promise<any[]> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/historial?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo historial');
  const result = await response.json();
  return result.data || [];
}

export async function getPedidosConRevisionPendiente(): Promise<Record<number, { pendiente: boolean; procesada: boolean }>> {
  const response = await authFetch(`${API_URL}/pedidos/con-revision-pendiente?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo pedidos con revisión pendiente');
  const result = await response.json();
  return result.data || {};
}

export async function getRevisiones(id: number): Promise<PedidoRevision[]> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/revisiones?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo revisiones');
  const result = await response.json();
  return result.data || [];
}

export async function crearRevision(id: number, data: {
  usuarioId: number;
  comentario: string;
  cambios: Record<string, any>;
}): Promise<PedidoRevision> {
  const response = await authFetch(`${API_URL}/pedidos/${id}/revisiones`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error creando revisión');
  return result.data;
}

export async function aceptarRevision(pedidoId: number, revisionId: number, usuarioId: number): Promise<Pedido> {
  const response = await authFetch(`${API_URL}/pedidos/${pedidoId}/revisiones/${revisionId}/aceptar`, {
    method: 'PUT',
    body: JSON.stringify({ usuarioId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error aceptando revisión');
  return result.data;
}

export async function rechazarRevision(pedidoId: number, revisionId: number, motivo: string, usuarioId: number): Promise<PedidoRevision> {
  const response = await authFetch(`${API_URL}/pedidos/${pedidoId}/revisiones/${revisionId}/rechazar`, {
    method: 'PUT',
    body: JSON.stringify({ motivo, usuarioId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error rechazando revisión');
  return result.data;
}
