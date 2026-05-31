import { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, History as HistoryIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getReactivos, createReactivo, updateReactivo, deleteReactivo } from '../api/reactivos';
import { getLaboratorios } from '../api/laboratorios';
import type { Reactivo } from '../types/reactivo';
import '../styles/inventario.css';

export default function Reactivos() {
  const navigate = useNavigate();
  const [reactivos, setReactivos] = useState<Reactivo[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<Reactivo | null>(null);
  const [vencFilter, setVencFilter] = useState(false);
  const [form, setForm] = useState({ name: '', descripcion: '', stock: 0, unidadMedida: '', vencimiento: '', prep_time: 0, laboratorioId: '' });

  useEffect(() => {
    Promise.all([getReactivos(), getLaboratorios()])
      .then(([rData, lData]) => { setReactivos(rData); setLaboratorios(lData); })
      .catch(() => setSnackbar({ msg: 'Error cargando datos', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reactivos
    .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !vencFilter || (r.vencimiento && new Date(r.vencimiento) <= new Date(Date.now() + 30 * 86400000)));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', descripcion: '', stock: 0, unidadMedida: '', vencimiento: '', prep_time: 0, laboratorioId: '' });
    setDialogOpen(true);
  };

  const openEdit = (r: Reactivo) => {
    setEditing(r);
    setForm({
      name: r.name, descripcion: r.descripcion || '', stock: r.stock,
      unidadMedida: r.unidadMedida || '', vencimiento: r.vencimiento || '',
      prep_time: r.prep_time, laboratorioId: String(r.laboratorioId || ''),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSnackbar({ msg: 'El nombre es obligatorio', severity: 'error' }); return; }
    try {
      const payload = {
        ...form, stock: Number(form.stock), prep_time: Number(form.prep_time),
        vencimiento: form.vencimiento || null,
        laboratorioId: form.laboratorioId ? Number(form.laboratorioId) : null,
      };
      if (editing) {
        const updated = await updateReactivo(editing.id, payload);
        setReactivos((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
        setSnackbar({ msg: 'Reactivo actualizado', severity: 'success' });
      } else {
        const created = await createReactivo(payload);
        setReactivos((prev) => [...prev, created]);
        setSnackbar({ msg: 'Reactivo creado', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err: any) { setSnackbar({ msg: err.message, severity: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReactivo(id);
      setReactivos((prev) => prev.filter((r) => r.id !== id));
      setSnackbar({ msg: 'Reactivo eliminado', severity: 'success' });
    } catch { setSnackbar({ msg: 'Error eliminando reactivo', severity: 'error' }); }
    setDeleteDialog(null);
  };

  const proxVencer = (v: string) => v && new Date(v) <= new Date(Date.now() + 30 * 86400000);

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Reactivos</Typography>
          <Typography variant="body1" className="inventario-subtitle">Gestión de reactivos y sustancias</Typography>
        </Box>

        <Box className="inv-toolbar">
          <TextField size="small" placeholder="Buscar reactivo..." value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} /> } }} />
          <Button variant={vencFilter ? 'contained' : 'outlined'} color="warning" onClick={() => setVencFilter(!vencFilter)}>Próximos a vencer</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Reactivo</Button>
        </Box>

        <Box className="inv-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Tiempo Prep. (min)</TableCell>
                <TableCell>Laboratorio</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={30} /></TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay reactivos</TableCell></TableRow>
              : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <Chip label={r.stock} color={r.stock <= 0 ? 'error' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{r.unidadMedida || '-'}</TableCell>
                  <TableCell>
                    {r.vencimiento ? (
                      <Chip label={new Date(r.vencimiento).toLocaleDateString()} color={proxVencer(r.vencimiento) ? 'error' : 'default'} size="small" />
                    ) : '-'}
                  </TableCell>
                  <TableCell>{r.prep_time || 0}</TableCell>
                  <TableCell>{r.laboratorio?.nombre || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => navigate(`/movimientos?reactivoId=${r.id}`)} title="Ver movimientos"><HistoryIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(r.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Reactivo' : 'Nuevo Reactivo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} fullWidth />
            <TextField label="Unidad de Medida" value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} fullWidth />
            <TextField label="Vencimiento" type="date" value={form.vencimiento} onChange={(e) => setForm({ ...form, vencimiento: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Tiempo de Preparación (min)" type="number" value={form.prep_time} onChange={(e) => setForm({ ...form, prep_time: Number(e.target.value) })} fullWidth />
            <TextField label="Laboratorio" select value={form.laboratorioId} onChange={(e) => setForm({ ...form, laboratorioId: e.target.value })} fullWidth slotProps={{ select: { native: true } }}>
              <option value="">Sin laboratorio</option>
              {laboratorios.map((l: any) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>¿Eliminar reactivo?</DialogTitle>
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
