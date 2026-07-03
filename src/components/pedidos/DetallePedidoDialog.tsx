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
import { getTareas, toggleTarea } from '../../api/pedidos';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import { formatTime } from '../../utils/format';

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
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [inventario, setInventario] = useState<{ materiales: any[]; reactivos: any[]; equipos: any[] }>({ materiales: [], reactivos: [], equipos: [] });

  useEffect(() => {
    if (open && pedido) {
      setLoadingTareas(true);
      Promise.all([
        getTareas(pedido.id),
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
  }, [open, pedido]);

  const handleToggle = async (tarea: Tarea) => {
    if (!pedido) return;
    const updated = await toggleTarea(pedido.id, tarea.id);
    setTareas((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              Pedido #{pedido.id}
            </Typography>
            <EstadoChip estado={pedido.estado} />
          </Box>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontWeight: 500 }}>
            {pedido.Laboratorio?.nombre || 'Sin laboratorio'} &bull; {pedido.fecha?.split('-')?.reverse()?.join('/')}
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
              { icon: <CalendarToday sx={{ fontSize: 20 }} />, label: 'Fecha y Horario', value: `${pedido.fecha?.split('-')?.reverse()?.join('/')} | ${formatTime(pedido.horaInicio)} - ${formatTime(pedido.horaFin)}` },
              { icon: <ScienceOutlined sx={{ fontSize: 20 }} />, label: 'Laboratorio', value: pedido.Laboratorio?.nombre || '-' },
              { icon: <PeopleAlt sx={{ fontSize: 20 }} />, label: 'Alumnos', value: pedido.cantidadAlumnos },
              { icon: <Person sx={{ fontSize: 20 }} />, label: 'Docente', value: pedido.Usuario ? `${pedido.Usuario.nombre} ${pedido.Usuario.apellido}` : '-', noBorder: true },
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

          {pedido.descripcion && (() => {
            const cleanDesc = pedido.descripcion.replace(/(\[Advertencias:.*?\]|__DESPENSA__:\{.*\})/gs, '').trim();
            if (!cleanDesc) return null;
            return (
              <SectionCard icon={<DescriptionOutlined sx={sectionIconSx} />} title="Descripción">
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
                  {cleanDesc}
                </Typography>
              </SectionCard>
            );
          })()}

          {pedido.materiales && pedido.materiales.length > 0 && (
            <SectionCard icon={<Inventory2Outlined sx={sectionIconSx} />} title="Materiales" subtitle={`${pedido.materiales.length} items`}>
              {pedido.materiales.map((m) => (
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

          {pedido.reactivos && pedido.reactivos.length > 0 && (
            <SectionCard icon={<BiotechOutlined sx={sectionIconSx} />} title="Reactivos" subtitle={`${pedido.reactivos.length} items`}>
              {pedido.reactivos.map((r) => (
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

          {pedido.Equipments && pedido.Equipments.length > 0 && (
            <SectionCard icon={<BuildOutlined sx={sectionIconSx} />} title="Equipos" subtitle={`${pedido.Equipments.length} items`}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {pedido.Equipments.map((eq) => (
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
            let despensa: { despensaMateriales?: { id: number; cantidad: number }[]; despensaReactivos?: { id: number; cantidad: number }[]; despensaEquipos?: { id: number }[] } | null = null;
            const desc = pedido.descripcion || '';
            console.log('[DEBUG DetallePedidoDialog] Raw descripcion:', desc);
            const m = desc.match(/__DESPENSA__:(\{.*\})/);
            console.log('[DEBUG DetallePedidoDialog] Match:', m ? m[1] : 'NO MATCH');
            if (m) {
              try { despensa = JSON.parse(m[1]); } catch (_) {}
            }
            console.log('[DEBUG DetallePedidoDialog] Parsed despensa:', despensa);
            if (!despensa || (!despensa.despensaMateriales?.length && !despensa.despensaReactivos?.length && !despensa.despensaEquipos?.length)) return null;
            const totalItems = (despensa.despensaMateriales?.length || 0) + (despensa.despensaReactivos?.length || 0) + (despensa.despensaEquipos?.length || 0);
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
                {despensa.despensaEquipos?.map((d: any) => {
                  const item = inventario.equipos.find((m: any) => m.id === d.id);
                  return <ResourceRow key={`de-${d.id}`} name={item?.name || `Equipo #${d.id}`} cantidad={1} unit="uds" stock={item?.stock || 0} needed={1} />;
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
          sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: '#0B1739', '&:hover': { bgcolor: '#1a237e' } }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
