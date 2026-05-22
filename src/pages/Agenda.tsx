import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import AgendaDiaria from '../components/agenda/AgendaDiaria';
import AppLayout from '../components/layout/AppLayout';
import { getPedidos } from '../api/pedidos';
import type { Pedido } from '../types/pedido';

export default function Agenda() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    async function loadPedidos() {
      try {
        const data = await getPedidos();
        const pedidosFormateados = data.map((p: any) => ({
          id: p.id,
          horario: `${p.horaInicio} - ${p.horaFin}`,
          laboratorioNombre: p.Laboratorio?.nombre || 'Sin nombre',
          alumnos: p.cantidadAlumnos,
          estado: p.estado,
          fecha: p.fecha
        }));
        const aprobados = pedidosFormateados.filter((p: any) => p.estado === 'Aprobado');
        setPedidos(aprobados);
      } catch (error) {
        console.error("Error al cargar agenda:", error);
      }
    }
    loadPedidos();
  }, []);

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Agenda de Laboratorios</Typography>
          <Typography variant="body1" className="inventario-subtitle">Clases aprobadas y programadas</Typography>
        </Box>
        {pedidos.length === 0 ? (
          <Typography color="text.secondary">No hay clases aprobadas para mostrar.</Typography>
        ) : (
          <AgendaDiaria pedidos={pedidos} />
        )}
      </Box>
    </AppLayout>
  );
}
