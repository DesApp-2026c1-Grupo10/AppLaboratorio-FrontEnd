import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, CardActions, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, IconButton, TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
    };
    if (editingActividad) {
      await updateActividadPredefinida(editingActividad.id, {
        nombre: data.nombre,
        laboratorioId: data.laboratorioId,
        cantidadAlumnos: data.cantidadAlumnos,
        descripcion: data.descripcion || '',
        config,
        usuarioId: usuarioLogueado.id,
      });
      setSnackbar({ msg: 'Actividad actualizada', severity: 'success' });
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
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Actividades Predefinidas</DialogTitle>
        <DialogContent dividers>
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
              <Button onClick={(e) => { e.currentTarget.blur(); setShowCreateForm(false); setEditingActividad(null); }} sx={{ mt: 1 }}>Volver</Button>
            </>
          ) : (
            <>
              <Button variant="contained" startIcon={<AddIcon />} onClick={(e) => { e.currentTarget.blur(); setShowCreateForm(true); }} sx={{ mb: 2 }}>
                Nueva Actividad
              </Button>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {misActividades.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No hay actividades guardadas</Typography>
                ) : (
                  misActividades.map((act) => (
                    <Card key={act.id} variant="outlined" sx={{ cursor: 'pointer' }} onClick={(e) => { e.currentTarget.blur(); handleSeleccionar(act); }}>
                      <CardContent sx={{ pb: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={600}>{act.nombre}</Typography>
                          <Box>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); e.currentTarget.blur(); openEdit(act); }}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); e.currentTarget.blur(); handleDelete(act.id); }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); e.currentTarget.blur(); setDetalleActividad(act); }}>
                          Ver detalle
                        </Button>
                      </CardActions>
                    </Card>
                  ))
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => { e.currentTarget.blur(); onClose(); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detalleActividad} onClose={() => setDetalleActividad(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detalleActividad?.nombre}</DialogTitle>
        <DialogContent dividers>
          {detalleActividad && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Laboratorio</Typography>
                <Typography>{detalleActividad.Laboratorio?.nombre || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Cantidad de Alumnos</Typography>
                <Typography>{detalleActividad.cantidadAlumnos}</Typography>
              </Box>
              {detalleActividad.descripcion && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
                  <Typography style={{ whiteSpace: 'pre-wrap' }}>{detalleActividad.descripcion}</Typography>
                </Box>
              )}
              {detalleActividad.config?.materiales && detalleActividad.config.materiales.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Materiales</Typography>
                  {detalleActividad.config.materiales.map((m: any) => {
                    const mat = materiales.find((x) => x.id === m.id);
                    return (
                      <Typography key={m.id} variant="body2">• {mat?.name || `ID #${m.id}`} - Cant: {m.cantidad}</Typography>
                    );
                  })}
                </Box>
              )}
              {detalleActividad.config?.reactivos && detalleActividad.config.reactivos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Reactivos</Typography>
                  {detalleActividad.config.reactivos.map((r: any) => {
                    const rea = reactivos.find((x) => x.id === r.id);
                    return (
                      <Typography key={r.id} variant="body2">• {rea?.name || `ID #${r.id}`} - Cant: {r.cantidad}</Typography>
                    );
                  })}
                </Box>
              )}
              {detalleActividad.config?.equipos && detalleActividad.config.equipos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Equipos</Typography>
                  {detalleActividad.config.equipos.map((id: number) => {
                    const eq = equipos.find((x) => x.id === id);
                    return (
                      <Typography key={id} variant="body2">• {eq?.name || `Equipo ID #${id}`}</Typography>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => { e.currentTarget.blur(); setDetalleActividad(null); }}>Cerrar</Button>
          <Button variant="contained" onClick={(e) => { e.currentTarget.blur(); if (detalleActividad) { handleSeleccionar(detalleActividad); setDetalleActividad(null); } }}>
            Usar esta actividad
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectAct} onClose={() => setSelectAct(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Completar actividad</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Completá los datos para la actividad "{selectAct?.nombre}"
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Hora Inicio" placeholder="08:00" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} fullWidth />
            <TextField label="Hora Fin" placeholder="10:00" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => { e.currentTarget.blur(); setSelectAct(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={(e) => { e.currentTarget.blur(); confirmarSeleccion(); }}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </>
  );
}
