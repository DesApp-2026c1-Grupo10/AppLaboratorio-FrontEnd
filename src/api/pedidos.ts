import { API_URL } from './config';
import type { Pedido } from '../types/pedido';
import type { Tarea } from '../types/tarea';
import type { PedidoRevision } from '../types/pedidoRevision';

export async function getPedidos(): Promise<Pedido[]> {
  const response = await fetch(`${API_URL}/pedidos?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo pedidos');
  const result = await response.json();
  return result.data || [];
}

export async function getPedido(id: number): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${id}?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo pedido');
  const result = await response.json();
  return result.data;
}

export async function createPedido(pedido: Record<string, any>): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error creando pedido');
  return result.data;
}

export async function updatePedido(id: number, data: Record<string, any>): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error actualizando pedido');
  const result = await response.json();
  return result.data;
}

export async function aprobarPedido(id: number, usuarioId?: number): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${id}/aprobar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: usuarioId ? JSON.stringify({ usuarioId }) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error aprobando pedido');
  return result.data;
}

export async function rechazarPedido(id: number, usuarioId?: number): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${id}/rechazar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: usuarioId ? JSON.stringify({ usuarioId }) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error rechazando pedido');
  return result.data;
}

export async function finalizarPedido(id: number, data: {
  usuarioId: number;
  materiales?: { id: number; cantidad: number }[];
  reactivos?: { id: number; cantidad: number }[];
  equipos?: { id: number; estado: string }[];
}): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${id}/finalizar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error finalizando pedido');
  return result.data;
}

export async function getTareas(id: number): Promise<Tarea[]> {
  const response = await fetch(`${API_URL}/pedidos/${id}/tareas?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo tareas');
  const result = await response.json();
  return result.data || [];
}

export async function toggleTarea(pedidoId: number, tareaId: number): Promise<Tarea> {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/tareas/${tareaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Error actualizando tarea');
  const result = await response.json();
  return result.data;
}

export async function getHistorialPedido(id: number): Promise<any[]> {
  const response = await fetch(`${API_URL}/pedidos/${id}/historial?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo historial');
  const result = await response.json();
  return result.data || [];
}

export async function getRevisiones(id: number): Promise<PedidoRevision[]> {
  const response = await fetch(`${API_URL}/pedidos/${id}/revisiones?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo revisiones');
  const result = await response.json();
  return result.data || [];
}

export async function crearRevision(id: number, data: {
  usuarioId: number;
  comentario: string;
  cambios: Record<string, any>;
}): Promise<PedidoRevision> {
  const response = await fetch(`${API_URL}/pedidos/${id}/revisiones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error creando revisión');
  return result.data;
}

export async function aceptarRevision(pedidoId: number, revisionId: number, usuarioId: number): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/revisiones/${revisionId}/aceptar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error aceptando revisión');
  return result.data;
}

export async function rechazarRevision(pedidoId: number, revisionId: number, motivo: string): Promise<PedidoRevision> {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/revisiones/${revisionId}/rechazar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error rechazando revisión');
  return result.data;
}
