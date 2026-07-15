import {
  Dialog,   DialogContent, DialogActions, Button,
  Typography, Box, Chip, Checkbox, FormControlLabel, FormGroup,
  CircularProgress, Paper, IconButton, alpha,
} from '@mui/material';
import {
  Close as CloseIcon, CalendarToday, ScienceOutlined, PeopleAlt, Person,
  DescriptionOutlined, Inventory2Outlined, ChecklistRounded,
  BiotechOutlined, BuildOutlined, ArrowForward,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import EstadoChip from './EstadoChip';
import type { Pedido } from '../../types/pedido';
import type { Tarea } from '../../types/tarea';
import { getTareas, toggleTarea, getPedido } from '../../api/pedidos';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import { formatTime } from '../../utils/format';
import { useWs } from '../../context/WsContext';

interface Props {
  open: boolean;
  pedido: Pedido | null;
  onClose: () => void;
}

const sectionIconSx = { fontSize: 20, color: 'primary.main' };

function SectionCard({ children, icon, title, subtitle }: { children: React.ReactNode; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.8, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', p: 1, borderRadius: 2, bgcolor: alpha('#6366F1', 0.1), color: '#6366F1' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      <Box sx={{ p: 2.5 }}>
        {children}
      </Box>
    </Paper>
  );
}

const resourceColors: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  error: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
};

function ResourceRow({ name, cantidad, unit, stock, needed }: { name: string; cantidad: number; unit: string; stock: number; needed: number }) {
  const lowStock = stock < needed;
  const c = lowStock ? resourceColors.error : resourceColors.success;
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      py: 1.2, px: 1.5, borderRadius: 2,
      bgcolor: alpha(c.bg, 0.5),
      border: '1px solid', borderColor: c.border,
      mb: 1, '&:last-child': { mb: 0 },
    }}>
      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{name}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={`${cantidad} ${unit}`} size="small" sx={{ fontWeight: 600, borderRadius: 1.5 }} variant="outlined" />
        <Chip
          label={`Stock: ${stock}`}
          size="small"
          sx={{
            fontWeight: 600, borderRadius: 1.5,
            bgcolor: c.bg, color: c.text, border: `1px solid ${c.border}`,
          }}
          variant="outlined"
        />
      </Box>
    </Box>
  );
}

export default function DetallePedidoDialog({ open, pedido, onClose }: Props) {
  const [pedidoLocal, setPedidoLocal] = useState<Pedido | null>(pedido);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [inventario, setInventario] = useState<{ materiales: any[]; reactivos: any[]; equipos: any[] }>({ materiales: [], reactivos: [], equipos: [] });
  const { on } = useWs();

  useEffect(() => { setPedidoLocal(pedido); }, [pedido]);

  const pedidoActual = pedidoLocal || pedido;

  useEffect(() => {
    if (open && pedidoActual) {
      setLoadingTareas(true);
      Promise.all([
        getTareas(pedidoActual.id),
        getMateriales(),
        getReactivos(),
        getEquipos(),
      ]).then(([ts, mats, reas, eqs]) => {
        setTareas(ts);
        setInventario({ materiales: mats, reactivos: reas, equipos: eqs });
      }).finally(() => setLoadingTareas(false));
    } else {
      setTareas([]);
      setInventario({ materiales: [], reactivos: [], equipos: [] });
    }
  }, [open, pedidoActual]);

  useEffect(() => {
    if (!open || !pedidoActual) return;
    const pid = pedidoActual.id;
    const refresh = () => {
      getPedido(pid).then(setPedidoLocal);
      getTareas(pid).then(setTareas);
    };
    const off1 = on('REVISION_CREADA', (data: any) => { console.log('[WS] REVISION_CREADA', data); if (data.pedidoId === pid) refresh(); });
    const off2 = on('PEDIDO_MODIFICADO', (data: any) => { console.log('[WS] PEDIDO_MODIFICADO', data); if (data.id === pid) refresh(); });
    const off3 = on('PEDIDO_APROBADO', (data: any) => { console.log('[WS] PEDIDO_APROBADO', data); if (data.id === pid) refresh(); });
    const off4 = on('PEDIDO_RECHAZADO', (data: any) => { console.log('[WS] PEDIDO_RECHAZADO', data); if (data.id === pid) refresh(); });
    const off5 = on('PEDIDO_CANCELADO', (data: any) => { console.log('[WS] PEDIDO_CANCELADO', data); if (data.id === pid) refresh(); });
    const off6 = on('PEDIDO_FINALIZADO', (data: any) => { console.log('[WS] PEDIDO_FINALIZADO', data); if (data.id === pid) refresh(); });
    const off7 = on('INVENTARIO_MODIFICADO', (data: any) => { console.log('[WS] INVENTARIO_MODIFICADO', data); refresh(); });
    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); };
  }, [open, pedidoActual, on]);

  const handleToggle = async (tarea: Tarea) => {
    if (!pedidoActual) return;
    const updated = await toggleTarea(pedidoActual.id, tarea.id);
    setTareas((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  if (!pedidoActual) return null;

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              Pedido #{pedidoActual.id}
            </Typography>
            <EstadoChip estado={pedidoActual.estado} />
          </Box>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontWeight: 500 }}>
            {pedidoActual.Laboratorio?.nombre || 'Sin laboratorio'} &bull; {pedidoActual.fecha?.split('-')?.reverse()?.join('/')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: alpha('#fff', 0.7), '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {[
              { icon: <CalendarToday sx={{ fontSize: 20 }} />, label: 'Fecha y Horario', value: `${pedidoActual.fecha?.split('-')?.reverse()?.join('/')} | ${formatTime(pedidoActual.horaInicio)} - ${formatTime(pedidoActual.horaFin)}` },
              { icon: <ScienceOutlined sx={{ fontSize: 20 }} />, label: 'Laboratorio', value: pedidoActual.Laboratorio?.nombre || '-' },
              { icon: <PeopleAlt sx={{ fontSize: 20 }} />, label: 'Alumnos', value: pedidoActual.cantidadAlumnos },
              { icon: <Person sx={{ fontSize: 20 }} />, label: 'Docente', value: pedidoActual.Usuario ? `${pedidoActual.Usuario.nombre} ${pedidoActual.Usuario.apellido}` : '-', noBorder: true },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.8, borderBottom: item.noBorder ? 'none' : '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', p: 1, borderRadius: 1.5, bgcolor: alpha('#6366F1', 0.08), color: '#6366F1' }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.4, display: 'block', lineHeight: 1.2 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.1 }}>{item.value}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>

          {pedidoActual.descripcion && (() => {
            const cleanDesc = pedidoActual.descripcion.replace(/(\[Advertencias:.*?\]|__DESPENSA__:\{.*\})/gs, '').trim();
            if (!cleanDesc) return null;
            return (
              <SectionCard icon={<DescriptionOutlined sx={sectionIconSx} />} title="Descripción">
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
                  {cleanDesc}
                </Typography>
              </SectionCard>
            );
          })()}

          {pedidoActual.materiales && pedidoActual.materiales.length > 0 && (
            <SectionCard icon={<Inventory2Outlined sx={sectionIconSx} />} title="Materiales" subtitle={`${pedidoActual.materiales.length} items`}>
              {pedidoActual.materiales.map((m) => (
                <ResourceRow
                  key={m.id}
                  name={m.name}
                  cantidad={m.PedidoMaterial?.cantidad || 1}
                  unit="uds"
                  stock={m.stock}
                  needed={m.PedidoMaterial?.cantidad || 1}
                />
              ))}
            </SectionCard>
          )}

          {pedidoActual.reactivos && pedidoActual.reactivos.length > 0 && (
            <SectionCard icon={<BiotechOutlined sx={sectionIconSx} />} title="Reactivos" subtitle={`${pedidoActual.reactivos.length} items`}>
              {pedidoActual.reactivos.map((r) => (
                <ResourceRow
                  key={r.id}
                  name={r.name}
                  cantidad={r.PedidoReactivo?.cantidad || 1}
                  unit={r.unidadMedida || 'uds'}
                  stock={r.stock}
                  needed={r.PedidoReactivo?.cantidad || 1}
                />
              ))}
            </SectionCard>
          )}

          {pedidoActual.Equipments && pedidoActual.Equipments.length > 0 && (
            <SectionCard icon={<BuildOutlined sx={sectionIconSx} />} title="Equipos" subtitle={`${pedidoActual.Equipments.length} items`}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {pedidoActual.Equipments.map((eq) => (
                  <Chip
                    key={eq.id}
                    label={eq.name}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: alpha('#6366F1', 0.08), color: '#6366F1', border: 'none' }}
                  />
                ))}
              </Box>
            </SectionCard>
          )}

          {(() => {
            let despensa: { despensaMateriales?: { id: number; cantidad: number }[]; despensaReactivos?: { id: number; cantidad: number }[] } | null = null;
            const desc = pedidoActual.descripcion || '';
            const m = desc.match(/__DESPENSA__:(\{.*\})/);
            if (m) {
              try { despensa = JSON.parse(m[1]); } catch (_) {}
            }
            if (!despensa || (!despensa.despensaMateriales?.length && !despensa.despensaReactivos?.length)) return null;
            const totalItems = (despensa.despensaMateriales?.length || 0) + (despensa.despensaReactivos?.length || 0);
            return (
              <SectionCard icon={<Inventory2Outlined sx={sectionIconSx} />} title="Solicitado a Despensa" subtitle={`${totalItems} items`}>
                {despensa.despensaMateriales?.map((d: any) => {
                  const item = inventario.materiales.find((m: any) => m.id === d.id);
                  return <ResourceRow key={`dm-${d.id}`} name={item?.name || `Material #${d.id}`} cantidad={d.cantidad} unit="uds" stock={item?.stock || 0} needed={d.cantidad} />;
                })}
                {despensa.despensaReactivos?.map((d: any) => {
                  const item = inventario.reactivos.find((m: any) => m.id === d.id);
                  return <ResourceRow key={`dr-${d.id}`} name={item?.name || `Reactivo #${d.id}`} cantidad={d.cantidad} unit={item?.unidadMedida || 'uds'} stock={item?.stock || 0} needed={d.cantidad} />;
                })}
              </SectionCard>
            );
          })()}

          {loadingTareas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : tareas.length > 0 && (
            <SectionCard icon={<ChecklistRounded sx={sectionIconSx} />} title="Checklist" subtitle={`${tareas.filter(t => t.completada).length}/${tareas.length} completadas`}>
              <FormGroup>
                {tareas.map((t) => (
                  <FormControlLabel
                    key={t.id}
                    control={<Checkbox checked={t.completada} onChange={() => handleToggle(t)} size="small" sx={{ '&.Mui-checked': { color: '#6366F1' } }} />}
                    label={
                      <Typography variant="body2" sx={{
                        fontWeight: t.completada ? 400 : 500,
                        textDecoration: t.completada ? 'line-through' : 'none',
                        color: t.completada ? 'text.disabled' : 'text.primary',
                      }}>
                        {t.descripcion}
                      </Typography>
                    }
                    sx={{ py: 0.3, px: 1, borderRadius: 2, '&:hover': { bgcolor: alpha('#6366F1', 0.04) } }}
                  />
                ))}
              </FormGroup>
            </SectionCard>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" disableElevation
          endIcon={<ArrowForward />}
          sx={{ borderRadius: '12px', px: 3.5, py: 1, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' } }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
