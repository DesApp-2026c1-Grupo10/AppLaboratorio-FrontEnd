import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, CardActions, Typography, Button, Dialog,
  DialogContent, DialogActions, Snackbar, Alert, IconButton, TextField, Paper, alpha,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon, ScienceOutlined, PeopleAlt, Inventory2Outlined, BiotechOutlined, BuildOutlined } from '@mui/icons-material';
import { getActividadesPredefinidas, createActividadPredefinida, updateActividadPredefinida, deleteActividadPredefinida } from '../../api/actividadesPredefinidas';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import type { ActividadPredefinida } from '../../types/actividadPredefinida';
import type { Laboratorio } from '../../types/laboratorio';
import type { Material } from '../../types/material';
import type { Reactivo } from '../../types/reactivo';
import type { Equipo } from '../../types/equipo';
import PedidoForm from './PedidoForm';

interface Props {
  open: boolean;
  laboratorios: Laboratorio[];
  onSelectActividad: (actividad: ActividadPredefinida, fecha: string, horaInicio: string, horaFin: string) => void;
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

export default function ActividadesPredefinidasPanel({ open, laboratorios, onSelectActividad, onClose }: Props) {
  const [actividades, setActividades] = useState<ActividadPredefinida[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActividad, setEditingActividad] = useState<ActividadPredefinida | null>(null);
  const [detalleActividad, setDetalleActividad] = useState<ActividadPredefinida | null>(null);
  const [selectAct, setSelectAct] = useState<ActividadPredefinida | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [reactivos, setReactivos] = useState<Reactivo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;

  useEffect(() => {
    if (open) {
      getActividadesPredefinidas().then(setActividades).catch(console.error);
      setShowCreateForm(false);
      setEditingActividad(null);
    }
  }, [open]);

  const misActividades = actividades.filter((a) => a.usuarioId === usuarioLogueado?.id);

  const refresh = async () => {
    const updated = await getActividadesPredefinidas();
    setActividades(updated);
  };

  const handleCreateActividad = async (data: Record<string, any>) => {
    if (!usuarioLogueado) return;
    const config = {
      materiales: data.materiales || [],
      reactivos: data.reactivos || [],
      equipos: data.equipos || [],
      despensaMateriales: data.despensaMateriales || [],
      despensaReactivos: data.despensaReactivos || [],
    };
    if (editingActividad) {
      await updateActividadPredefinida(editingActividad.id, {
        nombre: data.nombre,
        laboratorioId: data.laboratorioId,
        cantidadAlumnos: data.cantidadAlumnos,
        descripcion: data.descripcion || '',
        config,
        usuarioId: editingActividad.usuarioId,
      });
      setSnackbar({ msg: 'Actividad editada', severity: 'success' });
    } else {
      await createActividadPredefinida({
        nombre: data.nombre,
        laboratorioId: data.laboratorioId,
        cantidadAlumnos: data.cantidadAlumnos,
        descripcion: data.descripcion || '',
        config,
        usuarioId: usuarioLogueado.id,
      });
      setSnackbar({ msg: 'Actividad creada', severity: 'success' });
    }
    await refresh();
    setShowCreateForm(false);
    setEditingActividad(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteActividadPredefinida(id);
      setActividades((prev) => prev.filter((a) => a.id !== id));
      setSnackbar({ msg: 'Actividad eliminada', severity: 'success' });
    } catch {
      setSnackbar({ msg: 'Error al eliminar', severity: 'error' });
    }
  };

  const openEdit = (act: ActividadPredefinida) => {
    setEditingActividad(act);
    setShowCreateForm(true);
  };

  useEffect(() => {
    if (detalleActividad) {
      Promise.all([
        getMateriales().then(setMateriales).catch(() => {}),
        getReactivos().then(setReactivos).catch(() => {}),
        getEquipos().then(setEquipos).catch(() => {}),
      ]);
    }
  }, [detalleActividad]);

  const handleSeleccionar = (act: ActividadPredefinida) => {
    setSelectAct(act);
    setFecha(new Date().toISOString().split('T')[0]);
    setHoraInicio('08:00');
    setHoraFin('10:00');
  };

  const confirmarSeleccion = () => {
    if (selectAct) {
      onSelectActividad(selectAct, fecha, horaInicio, horaFin);
      setSelectAct(null);
    }
  };

  return (
    <>
      {/* Dialog principal: listado + crear */}
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { bgcolor: alpha('#000', 0.5) } } }}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ bgcolor: '#6366F1', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            {showCreateForm ? (editingActividad ? 'Editar Actividad' : 'Nueva Actividad') : 'Actividades Predefinidas'}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: alpha('#fff', 0.7), '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ bgcolor: '#f8fafc', p: 3 }}>
          {showCreateForm ? (
            <>
              <PedidoForm
                key={editingActividad?.id || 'new'}
                laboratorios={laboratorios}
                onSubmitPedido={async () => {}}
                mode="actividad"
                onSubmitActividad={handleCreateActividad}
                actividadInicial={editingActividad ? {
                  nombre: editingActividad.nombre,
                  laboratorioId: editingActividad.laboratorioId,
                  cantidadAlumnos: editingActividad.cantidadAlumnos,
                  descripcion: editingActividad.descripcion,
                  materiales: editingActividad.config?.materiales,
                  reactivos: editingActividad.config?.reactivos,
                  equipos: editingActividad.config?.equipos,
                } : null}
              />
              <Button onClick={() => { setShowCreateForm(false); setEditingActividad(null); }}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                Volver
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateForm(true)}
                sx={{ mb: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}>
                Nueva Actividad
              </Button>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {misActividades.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No hay actividades guardadas</Typography>
                ) : (
                  misActividades.map((act) => (
                    <SectionCard key={act.id} icon={<ScienceOutlined sx={sectionIconSx} />} title={act.nombre}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {act.Laboratorio?.nombre || 'Sin laboratorio'} &bull; {act.cantidadAlumnos} alumnos
                        </Typography>
                        <Box>
                          <Button size="small" onClick={() => handleSeleccionar(act)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, mr: 1 }}>
                            Usar
                          </Button>
                          <Button size="small" onClick={() => setDetalleActividad(act)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, mr: 1 }}>
                            Ver detalle
                          </Button>
                          <IconButton size="small" onClick={() => openEdit(act)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(act.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                    </SectionCard>
                  ))
                )}
              </Box>
            </>
          )}
        </Box>
      </Dialog>

      {/* Dialog ver detalle */}
      <Dialog open={!!detalleActividad} onClose={() => setDetalleActividad(null)} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { bgcolor: alpha('#000', 0.5) } } }}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ bgcolor: '#6366F1', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            {detalleActividad?.nombre || 'Detalle'}
          </Typography>
          <IconButton onClick={() => setDetalleActividad(null)} sx={{ color: alpha('#fff', 0.7), '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ bgcolor: '#f8fafc', p: 3 }}>
          {detalleActividad && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SectionCard icon={<ScienceOutlined sx={sectionIconSx} />} title="Laboratorio">
                <Typography>{detalleActividad.Laboratorio?.nombre || '-'}</Typography>
              </SectionCard>
              <SectionCard icon={<PeopleAlt sx={sectionIconSx} />} title="Cantidad de Alumnos">
                <Typography>{detalleActividad.cantidadAlumnos}</Typography>
              </SectionCard>
              {detalleActividad.descripcion && (
                <SectionCard icon={<ScienceOutlined sx={sectionIconSx} />} title="Descripción">
                  <Typography style={{ whiteSpace: 'pre-wrap' }}>{detalleActividad.descripcion}</Typography>
                </SectionCard>
              )}
              {detalleActividad.config?.materiales && detalleActividad.config.materiales.length > 0 && (
                <SectionCard icon={<Inventory2Outlined sx={sectionIconSx} />} title="Materiales" subtitle={`${detalleActividad.config.materiales.length} items`}>
                  {detalleActividad.config.materiales.map((m: any) => {
                    const mat = materiales.find((x) => x.id === m.id);
                    return <Typography key={m.id} variant="body2">• {mat?.name || `ID #${m.id}`} - Cant: {m.cantidad}</Typography>;
                  })}
                </SectionCard>
              )}
              {detalleActividad.config?.reactivos && detalleActividad.config.reactivos.length > 0 && (
                <SectionCard icon={<BiotechOutlined sx={sectionIconSx} />} title="Reactivos" subtitle={`${detalleActividad.config.reactivos.length} items`}>
                  {detalleActividad.config.reactivos.map((r: any) => {
                    const rea = reactivos.find((x) => x.id === r.id);
                    return <Typography key={r.id} variant="body2">• {rea?.name || `ID #${r.id}`} - Cant: {r.cantidad}</Typography>;
                  })}
                </SectionCard>
              )}
              {detalleActividad.config?.equipos && detalleActividad.config.equipos.length > 0 && (
                <SectionCard icon={<BuildOutlined sx={sectionIconSx} />} title="Equipos" subtitle={`${detalleActividad.config.equipos.length} items`}>
                  {detalleActividad.config.equipos.map((id: number) => {
                    const eq = equipos.find((x) => x.id === id);
                    return <Typography key={id} variant="body2">• {eq?.name || `Equipo ID #${id}`}</Typography>;
                  })}
                </SectionCard>
              )}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDetalleActividad(null)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
            Cerrar
          </Button>
          <Button variant="contained" onClick={() => { if (detalleActividad) { handleSeleccionar(detalleActividad); setDetalleActividad(null); } }}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}>
            Usar esta actividad
          </Button>
        </Box>
      </Dialog>

      {/* Dialog confirmar fecha/hora */}
      <Dialog open={!!selectAct} onClose={() => setSelectAct(null)} maxWidth="xs" fullWidth
        slotProps={{ backdrop: { sx: { bgcolor: alpha('#000', 0.5) } } }}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ bgcolor: '#6366F1', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            Completar actividad
          </Typography>
          <IconButton onClick={() => setSelectAct(null)} sx={{ color: alpha('#fff', 0.7), '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ bgcolor: '#f8fafc', p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Completá los datos para la actividad "{selectAct?.nombre}"
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Hora Inicio" placeholder="08:00" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} fullWidth />
            <TextField label="Hora Fin" placeholder="10:00" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} fullWidth />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setSelectAct(null)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={confirmarSeleccion}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}>
            Confirmar
          </Button>
        </Box>
      </Dialog>

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </>
  );
}
