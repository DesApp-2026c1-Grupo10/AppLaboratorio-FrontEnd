const API_URL = 'http://localhost:3001/api';

export async function getPedidos() {
  const response = await fetch(`${API_URL}/pedidos`);
  if (!response.ok) throw new Error('Error obteniendo pedidos');
  const result = await response.json();
  return result.data || [];
}

export async function getPedido(id: number) {
  const response = await fetch(`${API_URL}/pedidos/${id}`);
  if (!response.ok) throw new Error('Error obteniendo pedido');
  const result = await response.json();
  return result.data;
}

export async function createPedido(pedido: any) {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error creando pedido');
  return result.data;
}

export async function updatePedido(id: number, data: any) {
  const response = await fetch(`${API_URL}/pedidos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error actualizando pedido');
  const result = await response.json();
  return result.data;
}

export async function aprobarPedido(id: number) {
  const response = await fetch(`${API_URL}/pedidos/${id}/aprobar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error aprobando pedido');
  return result.data;
}

export async function rechazarPedido(id: number) {
  const response = await fetch(`${API_URL}/pedidos/${id}/rechazar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
}) {
  const response = await fetch(`${API_URL}/pedidos/${id}/finalizar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Error finalizando pedido');
  return result.data;
}

export async function getHistorialPedido(id: number) {
  const response = await fetch(`${API_URL}/pedidos/${id}/historial`);
  if (!response.ok) throw new Error('Error obteniendo historial');
  const result = await response.json();
  return result.data || [];
}
