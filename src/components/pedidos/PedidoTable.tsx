import { useState } from 'react';
import {
  Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, TableContainer, Paper,
} from '@mui/material';
import EstadoChip from './EstadoChip';
import DetallePedidoDialog from './DetallePedidoDialog';
import { getHistorialPedido } from '../../api/pedidos';
import { formatTime } from '../../utils/format';
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
  onRevisar?: (pedido: Pedido) => void;
  onVerRevision?: (pedido: Pedido) => void;
  pedidosConRevision?: Set<number>;
}

export default function PedidoTable({ pedidos, aceptarPedido, rechazarPedido, finalizarPedido, esAdmin, onRevisar, onVerRevision, pedidosConRevision }: Props) {

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
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

  const renderAcciones = (pedido: Pedido) => (
    <>
      {esAdmin && onRevisar && pedido.estado === 'Pendiente' && (
        <Button size="small" onClick={(e) => { e.currentTarget.blur(); onRevisar(pedido); }}>Revisar</Button>
      )}
      {!esAdmin && onVerRevision && pedido.estado === 'Pendiente' && (
        <Button
          size="small"
          onClick={(e) => { e.currentTarget.blur(); onVerRevision(pedido); }}
          color={pedidosConRevision?.has(pedido.id) ? 'success' : 'secondary'}
          disabled={pedidosConRevision?.has(pedido.id)}
        >
          {pedidosConRevision?.has(pedido.id) ? 'Revisado' : 'Revisión'}
        </Button>
      )}
      {pedido.estado === 'Pendiente' && (
        <>
          {esAdmin && <Button onClick={() => aceptarPedido(pedido.id)} color="primary" size="small">Aceptar</Button>}
          {esAdmin && <Button onClick={() => rechazarPedido(pedido.id)} color="error" size="small">Rechazar</Button>}
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
    </>
  );

  return (
    <>
      {/* Desktop table */}
      <Box className="pedidos-table-desktop">
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Horario</TableCell>
                <TableCell>Laboratorio</TableCell>
                <TableCell>Alumnos</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Detalle</TableCell>
                <TableCell>Historial</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>{pedido.fecha ? pedido.fecha.split('-').reverse().join('/') : '-'}</TableCell>
                  <TableCell>{formatTime(pedido.horaInicio)} - {formatTime(pedido.horaFin)}</TableCell>
                  <TableCell>{pedido.Laboratorio?.nombre}</TableCell>
                  <TableCell>{pedido.cantidadAlumnos}</TableCell>
                  <TableCell><EstadoChip estado={pedido.estado} /></TableCell>
                  <TableCell>
                    <Button size="small" onClick={(e) => { e.currentTarget.blur(); setDetallePedido(pedido); setDetalleOpen(true); }}>
                      Ver detalle
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => verHistorial(pedido.id)}>
                      Ver historial
                    </Button>
                  </TableCell>
                  <TableCell>{renderAcciones(pedido)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile cards */}
      <Box className="pedidos-cards-mobile">
        {pedidos.map((pedido) => (
          <Card key={pedido.id} variant="outlined">
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {pedido.Laboratorio?.nombre || 'Sin lab'}
                </Typography>
                <EstadoChip estado={pedido.estado} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {pedido.fecha ? pedido.fecha.split('-').reverse().join('/') : '-'} | {formatTime(pedido.horaInicio)} - {formatTime(pedido.horaFin)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pedido.cantidadAlumnos} alumnos | Solicitante: {pedido.Usuario ? `${pedido.Usuario.nombre} ${pedido.Usuario.apellido}` : '-'}
              </Typography>
            </CardContent>
            <CardActions sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              <Button size="small" onClick={(e) => { e.currentTarget.blur(); setDetallePedido(pedido); setDetalleOpen(true); }}>
                Ver detalle
              </Button>
              <Button size="small" onClick={() => verHistorial(pedido.id)}>
                Historial
              </Button>
              {esAdmin && onRevisar && pedido.estado === 'Pendiente' && (
                <Button size="small" onClick={(e) => { e.currentTarget.blur(); onRevisar(pedido); }}>Revisar</Button>
              )}
              {!esAdmin && onVerRevision && pedido.estado === 'Pendiente' && (
                <Button size="small" color={pedidosConRevision?.has(pedido.id) ? 'success' : 'secondary'} disabled={pedidosConRevision?.has(pedido.id)} onClick={(e) => { e.currentTarget.blur(); onVerRevision(pedido); }}>
                  {pedidosConRevision?.has(pedido.id) ? 'Revisado' : 'Revisión'}
                </Button>
              )}
              {esAdmin && renderAcciones(pedido)}
            </CardActions>
          </Card>
        ))}
      </Box>

      <DetallePedidoDialog
        open={detalleOpen}
        pedido={detallePedido}
        onClose={() => setDetalleOpen(false)}
      />

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
