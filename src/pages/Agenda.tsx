import { useState, useEffect } from 'react';
import AgendaDiaria from '../components/agenda/AgendaDiaria';
import { getPedidos } from '../api/pedidos';
import type { Pedido } from '../types/pedido';

export default function Agenda() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    async function loadPedidos() {
      try {
        const data = await getPedidos();
        
        // Transformamos la data de la DB al formato que espera el componente
        const pedidosFormateados = data.map((p: any) => ({
          id: p.id,
          // Combinamos horaInicio y horaFin para crear 'horario'
          horario: `${p.horaInicio} - ${p.horaFin}`,
          // Sacamos el nombre del laboratorio del objeto relacionado
          laboratorioNombre: p.Laboratorio?.nombre || 'Sin nombre',
          // Mapeamos cantidadAlumnos a alumnos
          alumnos: p.cantidadAlumnos,
          estado: p.estado,
          fecha: p.fecha
        }));

        // Opcional: filtrar solo los aprobados para la agenda
        const aprobados = pedidosFormateados.filter((p: any) => p.estado === 'Aprobado');
        
        setPedidos(aprobados);
      } catch (error) {
        console.error("Error al cargar agenda:", error);
      }
    }
    loadPedidos();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      {pedidos.length === 0 ? (
        <p>No hay clases aprobadas para mostrar.</p>
      ) : (
        <AgendaDiaria pedidos={pedidos} />
      )}
    </div>
  );
}