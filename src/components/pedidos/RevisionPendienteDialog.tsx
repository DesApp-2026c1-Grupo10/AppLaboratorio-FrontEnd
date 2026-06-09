import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, Box, Chip, CircularProgress, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { getRevisiones, aceptarRevision, rechazarRevision } from '../../api/pedidos';
import { getLaboratorios } from '../../api/laboratorios';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import type { PedidoRevision } from '../../types/pedidoRevision';
import type { Pedido } from '../../types/pedido';
import type { Laboratorio } from '../../types/laboratorio';
import { formatTime } from '../../utils/format';

interface Props {
  open: boolean;
  pedido: Pedido | null;
  usuarioId: number | undefined;
  onComplete: (updatedPedido?: Pedido) => void;
  onClose: () => void;
}

interface CampoInfo {
  clave: string;
  label: string;
  original: string;
  nuevo?: string;
}

export default function RevisionPendienteDialog({ open, pedido, usuarioId, onComplete, onClose }: Props) {
  const [revisiones, setRevisiones] = useState<PedidoRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [accion, setAccion] = useState<'aceptar' | 'rechazar' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [reactivos, setReactivos] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);

  useEffect(() => {
    if (open && pedido) {
      setLoading(true);
      Promise.all([
        getRevisiones(pedido.id),
        getLaboratorios(),
        getMateriales(),
        getReactivos(),
        getEquipos(),
      ]).then(([revs, labs, mats, reas, eqs]) => {
        setRevisiones(revs);
        setLaboratorios(labs);
        setMateriales(mats);
        setReactivos(reas);
        setEquipos(eqs);
      }).finally(() => setLoading(false));
      setAccion(null);
      setMotivo('');
    }
  }, [open, pedido]);

  const pendientes = revisiones.filter((r) => r.estado === 'pendiente');
  const revision = pendientes[pendientes.length - 1] || null;
  const cambios = revision?.cambios || {};

  const labNombre = (id: number) => laboratorios.find((l) => l.id === id)?.nombre || `#${id}`;

  const fmtArr = (arr: { id: number; cantidad?: number }[] | undefined, items: any[]) =>
    arr?.map((a) => {
      const item = items.find((i) => i.id === a.id);
      const name = item?.name || `#${a.id}`;
      return a.cantidad !== undefined ? `${name} (${a.cantidad})` : name;
    }).join(', ') || '(ninguno)';

  const eqsNombres = (ids: number[] | undefined) =>
    ids?.map((id) => equipos.find((e) => e.id === id)?.name || `#${id}`).join(', ') || '(ninguno)';

  const campos: CampoInfo[] = pedido ? [
    { clave: 'fecha', label: 'Fecha', original: pedido.fecha || '' },
    { clave: 'horaInicio', label: 'Hora Inicio', original: formatTime(pedido.horaInicio) },
    { clave: 'horaFin', label: 'Hora Fin', original: formatTime(pedido.horaFin) },
    { clave: 'laboratorioId', label: 'Laboratorio', original: labNombre(pedido.laboratorioId) },
    { clave: 'cantidadAlumnos', label: 'Alumnos', original: String(pedido.cantidadAlumnos) },
    { clave: 'descripcion', label: 'Descripción', original: pedido.descripcion || '(sin descripción)' },
    { clave: 'materiales', label: 'Materiales', original: fmtArr(pedido.materiales?.map((m) => ({ id: m.id, cantidad: m.PedidoMaterial?.cantidad })), materiales) },
    { clave: 'reactivos', label: 'Reactivos', original: fmtArr(pedido.reactivos?.map((r) => ({ id: r.id, cantidad: r.PedidoReactivo?.cantidad })), reactivos) },
    { clave: 'equipos', label: 'Equipos', original: eqsNombres(pedido.Equipments?.map((e) => e.id)) },
  ] : [];

  const valorNuevo = (campo: CampoInfo): string | undefined => {
    const val = cambios[campo.clave];
    if (val === undefined || val === null) return undefined;
    switch (campo.clave) {
      case 'laboratorioId': return labNombre(Number(val));
      case 'horaInicio': return formatTime(val as string);
      case 'horaFin': return formatTime(val as string);
      case 'materiales': return fmtArr(val as any[], materiales);
      case 'reactivos': return fmtArr(val as any[], reactivos);
      case 'equipos': return eqsNombres(val as number[]);
      case 'cantidadAlumnos': return String(val);
      default: return String(val);
    }
  };

  const handleAceptar = async () => {
    if (!pedido || !revision || !usuarioId) return;
    setSubmitting(true);
    try {
      const updated = await aceptarRevision(pedido.id, revision.id, usuarioId);
      onComplete(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    if (!pedido || !revision) return;
    setSubmitting(true);
    try {
      await rechazarRevision(pedido.id, revision.id, motivo);
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revisión del Pedido #{pedido.id}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : !revision ? (
          <Typography color="text.secondary">No hay revisiones pendientes para este pedido.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{revision.Usuario?.nombre} {revision.Usuario?.apellido}</strong> propuso los siguientes cambios:
            </Typography>

            {revision.comentario && (
              <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Comentario:</Typography>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>{revision.comentario}</Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Detalle del pedido:</Typography>
              <Table size="small">
                <TableBody>
                  {campos.map((campo) => {
                    const nuevo = valorNuevo(campo);
                    const changed = nuevo !== undefined;
                    return (
                      <TableRow key={campo.clave} sx={changed ? { bgcolor: '#f1f8e9' } : undefined}>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize', width: 140 }}>
                          {campo.label}
                          {changed && <Chip label="Modificado" size="small" color="success" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={changed ? 'text.disabled' : 'text.primary'} sx={changed ? { textDecoration: 'line-through' } : undefined}>
                            {campo.original}
                          </Typography>
                          {changed && (
                            <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
                              {nuevo}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {accion === 'rechazar' && (
              <TextField
                label="Motivo del rechazo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {revision && !accion && (
          <>
            <Button onClick={() => setAccion('rechazar')} color="error">Rechazar</Button>
            <Button variant="contained" onClick={handleAceptar} disabled={submitting}>
              {submitting ? 'Aceptando...' : 'Aceptar Cambios'}
            </Button>
          </>
        )}
        {accion === 'rechazar' && (
          <>
            <Button onClick={() => setAccion(null)}>Volver</Button>
            <Button variant="contained" color="error" onClick={handleRechazar} disabled={!motivo.trim() || submitting}>
              {submitting ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
          </>
        )}
        {!revision && <Button onClick={onClose}>Cerrar</Button>}
      </DialogActions>
    </Dialog>
  );
}
