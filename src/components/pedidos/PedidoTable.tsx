import { useState } from 'react';
import {
  Button, Box, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel,
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
  revisionesPorPedido?: Record<number, { pendiente: boolean; procesada: boolean }>;
  usuarioLogueadoId?: number;
  revisionesRespuestaVistas?: Set<number>;
  onMarcarRevisionVista?: (pedidoId: number) => void;
  vista?: 'cards' | 'tabla';
}

export default function PedidoTable({ pedidos, aceptarPedido, rechazarPedido, finalizarPedido, esAdmin, onRevisar, onVerRevision, pedidosConRevision, revisionesPorPedido, usuarioLogueadoId, revisionesRespuestaVistas, onMarcarRevisionVista, vista = 'cards' }: Props) {

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [historialPedidoId, setHistorialPedidoId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    if (!sortBy) return 0;
    let aV: any, bV: any;
    switch (sortBy) {
      case 'id': aV = a.id; bV = b.id; break;
      case 'fecha': aV = a.fecha; bV = b.fecha; break;
      case 'horario': aV = a.horaInicio; bV = b.horaInicio; break;
      case 'laboratorio': aV = a.Laboratorio?.nombre?.toLowerCase(); bV = b.Laboratorio?.nombre?.toLowerCase(); break;
      case 'solicitante': aV = `${a.Usuario?.nombre || ''} ${a.Usuario?.apellido || ''}`.toLowerCase(); bV = `${b.Usuario?.nombre || ''} ${b.Usuario?.apellido || ''}`.toLowerCase(); break;
      case 'estado': aV = a.estado; bV = b.estado; break;
      default: return 0;
    }
    if (aV == null) return 1;
    if (bV == null) return -1;
    return aV < bV ? (sortOrder === 'asc' ? -1 : 1) : aV > bV ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  const tieneRespuestaNoVista = (pedidoId: number) => {
    const info = revisionesPorPedido?.[pedidoId];
    return info?.procesada && !info.pendiente && !revisionesRespuestaVistas?.has(pedidoId);
  };

  const verHistorial = async (id: number) => {
    try {
      const data = await getHistorialPedido(id);
      setHistorial(data);
      setHistorialPedidoId(id);
      setHistorialOpen(true);
      onMarcarRevisionVista?.(id);
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

  const esOwner = (pedido: Pedido) => pedido.usuarioId === usuarioLogueadoId;

  const infoRevision = (pedido: Pedido) => pedido.id != null ? revisionesPorPedido?.[pedido.id] : undefined;
  const tieneRevision = (pedido: Pedido) => !!infoRevision(pedido) || pedidosConRevision?.has(pedido.id);

  const renderAcciones = (pedido: Pedido) => (
    <>
      {esAdmin && onRevisar && pedido.estado === 'Pendiente' && (
        <Button size="small" onClick={(e) => { e.currentTarget.blur(); onRevisar(pedido); }}>Revisar</Button>
      )}
      {onVerRevision && esOwner(pedido) && pedido.estado === 'Pendiente' && tieneRevision(pedido) && (
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
          {!esAdmin && <span style={{ color: '#888', fontStyle: 'italic' }}>Pendiente</span>}
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
      {vista === 'tabla' ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'id' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'id'} direction={sortBy === 'id' ? sortOrder : 'asc'} onClick={() => handleSort('id')}>ID</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'fecha' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'fecha'} direction={sortBy === 'fecha' ? sortOrder : 'asc'} onClick={() => handleSort('fecha')}>Fecha</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'horario' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'horario'} direction={sortBy === 'horario' ? sortOrder : 'asc'} onClick={() => handleSort('horario')}>Horario</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'laboratorio' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'laboratorio'} direction={sortBy === 'laboratorio' ? sortOrder : 'asc'} onClick={() => handleSort('laboratorio')}>Lab</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'solicitante' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'solicitante'} direction={sortBy === 'solicitante' ? sortOrder : 'asc'} onClick={() => handleSort('solicitante')}>Solicitante</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'estado' ? sortOrder : false}>
                <TableSortLabel active={sortBy === 'estado'} direction={sortBy === 'estado' ? sortOrder : 'asc'} onClick={() => handleSort('estado')}>Estado</TableSortLabel>
              </TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidosOrdenados.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No hay pedidos en el historial</TableCell></TableRow>
            ) : pedidosOrdenados.map((pedido) => (
              <TableRow key={pedido.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setDetallePedido(pedido); setDetalleOpen(true); }}>
                <TableCell>#{pedido.id}</TableCell>
                <TableCell>{pedido.fecha ? pedido.fecha.split('-').reverse().join('/') : '-'}</TableCell>
                <TableCell>{formatTime(pedido.horaInicio)} - {formatTime(pedido.horaFin)}</TableCell>
                <TableCell>{pedido.Laboratorio?.nombre || '-'}</TableCell>
                <TableCell>{pedido.Usuario ? `${pedido.Usuario.nombre} ${pedido.Usuario.apellido}` : '-'}</TableCell>
                <TableCell><EstadoChip estado={pedido.estado} /></TableCell>
                <TableCell>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); setDetallePedido(pedido); setDetalleOpen(true); }}>Ver</Button>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); verHistorial(pedido.id); }}>Historial</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
        {pedidos.map((pedido) => (
          <Card
            key={pedido.id}
            variant="outlined"
            sx={{
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'scale(1.02)', boxShadow: 4, cursor: 'pointer' },
            }}
            onClick={(e) => { e.currentTarget.blur(); setDetallePedido(pedido); setDetalleOpen(true); }}
          >
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
            <CardActions sx={{ flexWrap: 'wrap', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
              <Button size="small" onClick={(e) => { e.currentTarget.blur(); setDetallePedido(pedido); setDetalleOpen(true); }}>
                Ver detalle
              </Button>
              <Button size="small" color={tieneRespuestaNoVista(pedido.id) ? 'warning' : 'primary'} onClick={() => verHistorial(pedido.id)}>
                Historial
              </Button>
              {esAdmin && onRevisar && pedido.estado === 'Pendiente' && (
                <Button size="small" onClick={(e) => { e.currentTarget.blur(); onRevisar(pedido); }}>Revisar</Button>
              )}
              {onVerRevision && esOwner(pedido) && pedido.estado === 'Pendiente' && tieneRevision(pedido) && (
                <Button size="small" color={pedidosConRevision?.has(pedido.id) ? 'success' : 'secondary'} disabled={pedidosConRevision?.has(pedido.id)} onClick={(e) => { e.currentTarget.blur(); onVerRevision(pedido); }}>
                  {pedidosConRevision?.has(pedido.id) ? 'Revisado' : 'Revisión'}
                </Button>
              )}
              {pedido.estado === 'Pendiente' && (
                <>
                  {esAdmin && <Button onClick={() => aceptarPedido(pedido.id)} color="primary" size="small">Aceptar</Button>}
                  {esAdmin && <Button onClick={() => rechazarPedido(pedido.id)} color="error" size="small">Rechazar</Button>}
                  {!esAdmin && <span style={{ color: '#888', fontStyle: 'italic' }}>Pendiente</span>}
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
            </CardActions>
          </Card>
        ))}
      </Box>
      )}

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
