import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, TableSortLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getMateriales, createMaterial, updateMaterial, deleteMaterial } from '../api/materiales';
import { getLaboratorios } from '../api/laboratorios';
import type { Material } from '../types/material';
import '../styles/inventario.css';

export default function Materiales() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState({ name: '', descripcion: '', stock: 0, stockMinimo: 0, unit: '', laboratorioId: '' });
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    Promise.all([getMateriales(), getLaboratorios()])
      .then(([matData, labData]) => {
        setMateriales(matData);
        setLaboratorios(labData);
      })
      .catch(() => setSnackbar({ msg: 'Error cargando datos', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = materiales
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', descripcion: '', stock: 0, stockMinimo: 0, unit: '', laboratorioId: '' });
    setDialogOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({
      name: m.name, descripcion: m.descripcion || '', stock: m.stock,
      stockMinimo: m.stockMinimo, unit: m.unit || '', laboratorioId: String(m.laboratorioId || ''),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSnackbar({ msg: 'El nombre es obligatorio', severity: 'error' });
      return;
    }
    try {
      const payload = { ...form, stock: Number(form.stock), stockMinimo: Number(form.stockMinimo), laboratorioId: form.laboratorioId ? Number(form.laboratorioId) : null };
      if (editing) {
        const updated = await updateMaterial(editing.id, payload);
        setMateriales((prev) => prev.map((m) => (m.id === editing.id ? updated : m)));
        setSnackbar({ msg: 'Material actualizado', severity: 'success' });
      } else {
        const created = await createMaterial(payload);
        setMateriales((prev) => [...prev, created]);
        setSnackbar({ msg: 'Material creado', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err: any) {
      setSnackbar({ msg: err.message, severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMaterial(id);
      setMateriales((prev) => prev.filter((m) => m.id !== id));
      setSnackbar({ msg: 'Material eliminado', severity: 'success' });
    } catch {
      setSnackbar({ msg: 'Error eliminando material', severity: 'error' });
    }
    setDeleteDialog(null);
  };

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Materiales</Typography>
          <Typography variant="body1" className="inventario-subtitle">Gestión de materiales de laboratorio</Typography>
        </Box>

        <Box className="inv-toolbar">
          <TextField size="small" placeholder="Buscar material..." value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} /> } }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Material</Button>
        </Box>

        <Box className="inv-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel active direction={sortDir} onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>Nombre</TableSortLabel>
                </TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Stock Mínimo</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Laboratorio</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No hay materiales</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Chip label={m.stock} color={m.stockMinimo > 0 && m.stock <= m.stockMinimo ? 'warning' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{m.stockMinimo}</TableCell>
                  <TableCell>{m.unit || '-'}</TableCell>
                  <TableCell>{m.laboratorio?.nombre || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(m.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} fullWidth />
            <TextField label="Stock Mínimo" type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })} fullWidth />
            <TextField label="Unidad" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} fullWidth />
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
        <DialogTitle>¿Eliminar material?</DialogTitle>
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
