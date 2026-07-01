import { API_URL, authFetch } from './config';

export async function getCarritos() {
  const response = await authFetch(`${API_URL}/inventario/carritos?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo carritos');
  const result = await response.json();
  return result.data || [];
}

export async function marcarCarritoPreparado(id: number) {
  const response = await authFetch(`${API_URL}/inventario/carritos/${id}/preparado`, { method: 'PUT' });
  if (!response.ok) throw new Error('Error actualizando carrito');
  const result = await response.json();
  return result.data;
}

export async function marcarItemPreparado(itemId: number) {
  const response = await authFetch(`${API_URL}/inventario/carritos/item/${itemId}/preparado`, { method: 'PUT' });
  if (!response.ok) throw new Error('Error actualizando item');
  const result = await response.json();
  return result.data;
}

export async function eliminarCarrito(id: number) {
  const response = await authFetch(`${API_URL}/inventario/carritos/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Error eliminando carrito');
}
