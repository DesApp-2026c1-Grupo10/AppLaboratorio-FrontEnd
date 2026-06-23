import { API_URL, authFetch } from './config';

export async function getEstadisticasResumen() {
  const response = await authFetch(`${API_URL}/estadisticas?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Error obteniendo estadísticas');
  const result = await response.json();
  return result.data;
}
