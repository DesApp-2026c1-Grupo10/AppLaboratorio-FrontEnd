import { useState } from 'react';
import {
  Button, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, TableContainer, Paper,
} from '@mui/material';
import EstadoChip from './EstadoChip';
import { getHistorialPedido } from '../../api/pedidos';
import type { Pedido } from '../../types/pedido';

interface HistorialEntry {
  id: number;
  tipo: string;
  descripcion: string;
  cambios: any;
  createdAt: string;
  Usuario?: { nombre: string; apellido: string };
}

interface Props {
  pedidos: Pedido[];
  aceptarPedido: (id: number) => void;
  rechazarPedido: (id: number) => void;
  finalizarPedido?: (pedido: Pedido) => void;
  esAdmin?: boolean;
}

export default function PedidoTable({ pedidos, aceptarPedido, rechazarPedido, finalizarPedido, esAdmin }: Props) {

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [historialPedidoId, setHistorialPedidoId] = useState<number | null>(null);

  const verHistorial = async (id: number) => {
    try {
      const data = await getHistorialPedido(id);
      setHistorial(data);
      setHistorialPedidoId(id);
      setHistorialOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const tipoLabel: Record<string, string> = {
    CREACION: 'Creación',
    MODIFICACION: 'Modificación',
    APROBACION: 'Aprobación',
    RECHAZO: 'Rechazo',
    FINALIZACION: 'Finalización',
  };

  const tipoColor: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
    CREACION: 'success',
    MODIFICACION: 'info',
    APROBACION: 'success',
    RECHAZO: 'error',
    FINALIZACION: 'warning',
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Laboratorio</TableCell>
              <TableCell>Alumnos</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Historial</TableCell>
              {esAdmin && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell>{pedido.fecha ? new Date(pedido.fecha).toLocaleDateString('es-AR') : '-'}</TableCell>
                <TableCell>{pedido.horaInicio} - {pedido.horaFin}</TableCell>
                <TableCell>{pedido.Laboratorio?.nombre}</TableCell>
                <TableCell>{pedido.cantidadAlumnos}</TableCell>
                <TableCell><EstadoChip estado={pedido.estado} /></TableCell>
                <TableCell>
                  <Button size="small" onClick={() => verHistorial(pedido.id)}>
                    Ver historial
                  </Button>
                </TableCell>
                {esAdmin && (
                  <TableCell>
                    {pedido.estado === 'Pendiente' && (
                      <>
                        <Button onClick={() => aceptarPedido(pedido.id)} color="primary" size="small">Aceptar</Button>
                        <Button onClick={() => rechazarPedido(pedido.id)} color="error" size="small">Rechazar</Button>
                      </>
                    )}
                    {pedido.estado === 'Aprobado' && finalizarPedido && (
                      <Button onClick={() => finalizarPedido(pedido)} color="warning" variant="contained" size="small">
                        Finalizar
                      </Button>
                    )}
                    {pedido.estado === 'Rechazado' && (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>Rechazado</span>
                    )}
                    {pedido.estado === 'Finalizado' && (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>Finalizado</span>
                    )}
                    {pedido.estado === 'Cancelado' && (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>Cancelado</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={historialOpen} onClose={() => setHistorialOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial del Pedido #{historialPedidoId}</DialogTitle>
        <DialogContent>
          {historial.length === 0 ? (
            <Typography color="text.secondary">Sin cambios registrados</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historial.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <EstadoChip
                        estado={h.tipo}
                        customLabels={tipoLabel}
                        customColors={tipoColor}
                      />
                    </TableCell>
                    <TableCell>{h.Usuario ? `${h.Usuario.nombre} ${h.Usuario.apellido}` : '-'}</TableCell>
                    <TableCell>{h.descripcion || JSON.stringify(h.cambios)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistorialOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
