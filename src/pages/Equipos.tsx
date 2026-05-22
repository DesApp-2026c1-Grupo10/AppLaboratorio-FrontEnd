import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, History as HistoryIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '../api/equipos';
import { getUsos } from '../api/usos';
import { getLaboratorios } from '../api/laboratorios';
import type { Equipo, UsoEquipo } from '../types/equipo';
import '../styles/inventario.css';

const statusColor: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  Disponible: 'success', 'En uso': 'info', Mantenimiento: 'warning', 'Fuera de servicio': 'error',
};

export default function Equipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialUsos, setHistorialUsos] = useState<UsoEquipo[]>([]);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<Equipo | null>(null);
  const [form, setForm] = useState({ name: '', descripcion: '', status: 'Disponible', is_movable: false, bld_id: '', laboratorioId: '', ultimaRevision: '', observaciones: '' });

  useEffect(() => {
    Promise.all([getEquipos(), getLaboratorios()])
      .then(([eData, lData]) => { setEquipos(eData); setLaboratorios(lData); })
      .catch(() => setSnackbar({ msg: 'Error cargando datos', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = equipos
    .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => !estadoFilter || e.status === estadoFilter);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', descripcion: '', status: 'Disponible', is_movable: false, bld_id: '', laboratorioId: '', ultimaRevision: '', observaciones: '' });
    setDialogOpen(true);
  };

  const openEdit = (e: Equipo) => {
    setEditing(e);
    setForm({
      name: e.name, descripcion: e.descripcion || '', status: e.status,
      is_movable: e.is_movable, bld_id: String(e.bld_id || ''),
      laboratorioId: String(e.laboratorioId || ''),
      ultimaRevision: e.ultimaRevision || '', observaciones: e.observaciones || '',
    });
    setDialogOpen(true);
  };

  const verHistorial = async (id: number) => {
    try {
      const usos = await getUsos(id);
      setHistorialUsos(usos);
      setHistorialOpen(true);
    } catch { setSnackbar({ msg: 'Error cargando historial', severity: 'error' }); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSnackbar({ msg: 'El nombre es obligatorio', severity: 'error' }); return; }
    try {
      const payload = {
        ...form, is_movable: Boolean(form.is_movable),
        bld_id: form.bld_id ? Number(form.bld_id) : null,
        laboratorioId: form.laboratorioId ? Number(form.laboratorioId) : null,
        ultimaRevision: form.ultimaRevision || null, observaciones: form.observaciones || null,
      };
      if (editing) {
        const updated = await updateEquipo(editing.id, payload);
        setEquipos((prev) => prev.map((eq) => (eq.id === editing.id ? updated : eq)));
        setSnackbar({ msg: 'Equipo actualizado', severity: 'success' });
      } else {
        const created = await createEquipo(payload);
        setEquipos((prev) => [...prev, created]);
        setSnackbar({ msg: 'Equipo creado', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err: any) { setSnackbar({ msg: err.message, severity: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEquipo(id);
      setEquipos((prev) => prev.filter((eq) => eq.id !== id));
      setSnackbar({ msg: 'Equipo eliminado', severity: 'success' });
    } catch { setSnackbar({ msg: 'Error eliminando equipo', severity: 'error' }); }
    setDeleteDialog(null);
  };

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Equipos</Typography>
          <Typography variant="body1" className="inventario-subtitle">Gestión de equipamiento de laboratorio</Typography>
        </Box>

        <Box className="inv-toolbar">
          <TextField size="small" placeholder="Buscar equipo..." value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} /> } }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={estadoFilter} label="Estado" onChange={(e) => setEstadoFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Disponible">Disponible</MenuItem>
              <MenuItem value="En uso">En uso</MenuItem>
              <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
              <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Equipo</Button>
        </Box>

        <Box className="inv-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Laboratorio</TableCell>
                <TableCell>Edificio</TableCell>
                <TableCell>Movible</TableCell>
                <TableCell>Última Revisión</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center">Cargando...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay equipos</TableCell></TableRow>
              : filtered.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell>{eq.name}</TableCell>
                  <TableCell><Chip label={eq.status} color={statusColor[eq.status] || 'default'} size="small" /></TableCell>
                  <TableCell>{eq.laboratorio?.nombre || '-'}</TableCell>
                  <TableCell>{eq.bld_id || '-'}</TableCell>
                  <TableCell>{eq.is_movable ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{eq.ultimaRevision ? new Date(eq.ultimaRevision).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => verHistorial(eq.id)} title="Historial de uso"><HistoryIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => openEdit(eq)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(eq.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth multiline rows={2} />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={form.status} label="Estado" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="Disponible">Disponible</MenuItem>
                <MenuItem value="En uso">En uso</MenuItem>
                <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Edificio (bld_id)" type="number" value={form.bld_id} onChange={(e) => setForm({ ...form, bld_id: e.target.value })} fullWidth />
            <TextField label="Laboratorio" select value={form.laboratorioId} onChange={(e) => setForm({ ...form, laboratorioId: e.target.value })} fullWidth slotProps={{ select: { native: true } }}>
              <option value="">Sin laboratorio</option>
              {laboratorios.map((l: any) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </TextField>
            <FormControl fullWidth>
              <InputLabel>¿Es movible?</InputLabel>
              <Select value={form.is_movable ? 'true' : 'false'} label="¿Es movible?" onChange={(e) => setForm({ ...form, is_movable: e.target.value === 'true' })}>
                <MenuItem value="true">Sí</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Última Revisión" type="date" value={form.ultimaRevision} onChange={(e) => setForm({ ...form, ultimaRevision: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Historial Dialog */}
      <Dialog open={historialOpen} onClose={() => setHistorialOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Uso</DialogTitle>
        <DialogContent>
          {historialUsos.length === 0 ? (
            <Typography color="text.secondary">Sin usos registrados</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historialUsos.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{new Date(u.fechaInicio).toLocaleString()}</TableCell>
                    <TableCell>{u.fechaFin ? new Date(u.fechaFin).toLocaleString() : 'En curso'}</TableCell>
                    <TableCell>{u.pedido?.descripcion || '-'}</TableCell>
                    <TableCell>{u.observaciones || '-'}</TableCell>
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

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>¿Eliminar equipo?</DialogTitle>
        <DialogContent>Esta acción no se puede deshacer.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
