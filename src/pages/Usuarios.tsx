import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Snackbar, Alert, MenuItem, Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../api/usuarios';
import type { Usuario } from '../types/usuario';
import '../styles/inventario.css';

const ROLES = ['Profesor', 'Desarrollador'];

export default function Usuarios() {
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('user') || '{}');
  const esAdmin = usuarioLogueado?.rol === 'Desarrollador';
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol: 'Profesor' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsuarios();
        setUsuarios(data);
      } catch {
        setSnackbar({ msg: 'Error cargando usuarios', severity: 'error' });
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', apellido: '', email: '', password: '', rol: 'Profesor' });
    setDialogOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ nombre: u.nombre, apellido: u.apellido || '', email: u.email, password: '', rol: u.rol || 'Profesor' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const payload: Record<string, any> = { nombre: form.nombre, apellido: form.apellido, email: form.email, rol: form.rol };
        if (form.password) payload.password = form.password;
        const updated = await updateUsuario(editing.id, payload);
        setUsuarios((prev) => prev.map((u) => (u.id === editing.id ? updated : u)));
        setSnackbar({ msg: 'Usuario actualizado', severity: 'success' });
      } else {
        if (!form.password) { setSnackbar({ msg: 'Contraseña requerida', severity: 'error' }); return; }
        const created = await createUsuario(form);
        setUsuarios((prev) => [...prev, created]);
        setSnackbar({ msg: 'Usuario creado', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err) { setSnackbar({ msg: err instanceof Error ? err.message : 'Error', severity: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUsuario(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setSnackbar({ msg: 'Usuario eliminado', severity: 'success' });
    } catch (err) { setSnackbar({ msg: err instanceof Error ? err.message : 'Error eliminando usuario', severity: 'error' }); }
    setDeleteDialog(null);
  };

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Usuarios</Typography>
          <Typography variant="body1" className="inventario-subtitle">Gestión de usuarios del sistema</Typography>
        </Box>

        <Box className="inv-toolbar">
          <Box sx={{ flex: 1 }} />
          {esAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Usuario</Button>}
        </Box>

        <Box className="inv-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center">Cargando...</TableCell></TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">No hay usuarios</TableCell></TableRow>
              ) : usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nombre} {u.apellido || ''}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.rol} color={u.rol === 'Desarrollador' ? 'primary' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    {(esAdmin || u.id === usuarioLogueado?.id) && (
                      <IconButton size="small" onClick={() => openEdit(u)}><EditIcon fontSize="small" /></IconButton>
                    )}
                    {esAdmin && (
                      <IconButton size="small" onClick={() => setDeleteDialog(u.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required fullWidth size="small" />
            <TextField label="Apellido" value={form.apellido} onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))} fullWidth size="small" />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required fullWidth size="small" />
            <TextField label={editing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'} type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required={!editing} fullWidth size="small" />
            <TextField label="Rol" select value={form.rol} onChange={(e) => setForm(f => ({ ...f, rol: e.target.value }))} fullWidth size="small">
              {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>¿Eliminar usuario?</DialogTitle>
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
