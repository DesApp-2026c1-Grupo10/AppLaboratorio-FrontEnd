const API_URL = "http://localhost:3001/api";

export async function getPedidos() {
  const response = await fetch(`${API_URL}/pedidos`);
  if (!response.ok) throw new Error("Error obteniendo pedidos");
  const result = await response.json();
  return result.data || [];
}

export async function createPedido(pedido: any) {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Error creando pedido");
  return result.data;
}

// ESTA ES LA FUNCIÓN QUE TE FALTA Y HACE QUE EXPLOTE
export async function updatePedido(id: number, data: any) {
  const response = await fetch(`${API_URL}/pedidos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error actualizando pedido");
  const result = await response.json();
  return result.data;
}