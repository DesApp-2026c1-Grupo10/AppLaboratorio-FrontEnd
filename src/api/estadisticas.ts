const API_URL = 'http://localhost:3001/api';

export async function getEstadisticasResumen() {
  const response = await fetch(`${API_URL}/estadisticas`);
  if (!response.ok) throw new Error('Error obteniendo estadísticas');
  const result = await response.json();
  return result.data;
}
