import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, TextField,
  Typography, Box, Chip, CircularProgress, Table, TableBody, TableCell, TableRow, IconButton, alpha,
} from '@mui/material';
import { Close as CloseIcon, ArrowForward } from '@mui/icons-material';
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

  const limpiarDesc = (txt: string) => txt.replace(/(\[Advertencias:.*?\]|__DESPENSA__:\{.*\})/gs, '').trim() || '(sin descripción)';

  const campos: CampoInfo[] = pedido ? [
    { clave: 'fecha', label: 'Fecha', original: pedido.fecha || '' },
    { clave: 'horaInicio', label: 'Hora Inicio', original: formatTime(pedido.horaInicio) },
    { clave: 'horaFin', label: 'Hora Fin', original: formatTime(pedido.horaFin) },
    { clave: 'laboratorioId', label: 'Laboratorio', original: labNombre(pedido.laboratorioId) },
    { clave: 'cantidadAlumnos', label: 'Alumnos', original: String(pedido.cantidadAlumnos) },
    { clave: 'descripcion', label: 'Descripción', original: limpiarDesc(pedido.descripcion || '') },
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
      await rechazarRevision(pedido.id, revision.id, motivo, usuarioId!);
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
        },
      }}
    >
      <Box sx={{
        background: 'linear-gradient(135deg, #0B1739 0%, #1a237e 50%, #283593 100%)',
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            Revisión del Pedido #{pedido.id}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontWeight: 500 }}>
            {revision ? `Propuesta de ${revision.Usuario?.nombre || ''} ${revision.Usuario?.apellido || ''}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: alpha('#fff', 0.7), '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3, bgcolor: '#f8fafc' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : !revision ? (
          <Typography color="text.secondary">No hay revisiones pendientes para este pedido.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

            {revisiones.length > 1 && (
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Mensajes</Typography>
                {revisiones.filter((r) => r.estado !== 'pendiente').map((rev) => (
                  <Box key={rev.id} sx={{
                    display: 'flex', mb: 1,
                    justifyContent: rev.Usuario?.id === pedido?.usuarioId ? 'flex-start' : 'flex-end',
                  }}>
                    <Box sx={{
                      maxWidth: '80%', p: 1.5, borderRadius: 2,
                      bgcolor: rev.Usuario?.id === pedido?.usuarioId ? alpha('#6366F1', 0.08) : '#e8f5e9',
                      border: '1px solid',
                      borderColor: rev.Usuario?.id === pedido?.usuarioId ? alpha('#6366F1', 0.2) : '#c8e6c9',
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                        {rev.Usuario?.nombre || 'Usuario'} {rev.Usuario?.apellido || ''}
                        {rev.estado === 'aceptada' ? ' ✓' : rev.estado === 'rechazada' ? ' ✗' : ''}
                      </Typography>
                      {rev.comentario && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{rev.comentario}</Typography>
                      )}
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.3, display: 'block' }}>
                        {new Date(rev.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

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
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
        {revision && !accion && (
          <>
            <Button onClick={() => setAccion('rechazar')} color="error" variant="outlined" sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600 }}>
              Rechazar
            </Button>
            <Button variant="contained" onClick={handleAceptar} disabled={submitting}
              endIcon={<ArrowForward />}
              sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: '#0B1739', '&:hover': { bgcolor: '#1a237e' } }}>
              {submitting ? 'Aceptando...' : 'Aceptar Cambios'}
            </Button>
          </>
        )}
        {accion === 'rechazar' && (
          <>
            <Button onClick={() => setAccion(null)} variant="outlined" sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600 }}>
              Volver
            </Button>
            <Button variant="contained" color="error" onClick={handleRechazar} disabled={!motivo.trim() || submitting}
              sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600 }}>
              {submitting ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
          </>
        )}
        {!revision && (
          <Button onClick={onClose} variant="contained"
            endIcon={<ArrowForward />}
            sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: '#0B1739', '&:hover': { bgcolor: '#1a237e' } }}>
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
