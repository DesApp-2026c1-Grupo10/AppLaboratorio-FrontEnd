import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Snackbar, Alert, MenuItem, Chip, Avatar, Card, CardContent, CardActions, useMediaQuery,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AdminPanelSettings, School, Person } from '@mui/icons-material';
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
  const isMobile = useMediaQuery('(max-width: 900px)');

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

  const rolIcon = (rol: string) => {
    switch (rol) {
      case 'Desarrollador': return <AdminPanelSettings sx={{ color: '#6366F1', fontSize: 18 }} />;
      case 'Profesor': return <School sx={{ color: '#f59e0b', fontSize: 18 }} />;
      default: return <Person sx={{ color: '#94a3b8', fontSize: 18 }} />;
    }
  };

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Usuarios</Typography>
          <Typography variant="body1" className="inventario-subtitle">Gestión de usuarios del sistema</Typography>
        </Box>

        <Box className="inv-toolbar">
          {esAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, py: 1, bgcolor: '#6366F1', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#4F46E5', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' } }}>
            Nuevo Usuario
          </Button>}
          <TextField size="small" placeholder="Buscar usuario..." slotProps={{ input: { startAdornment: null } }} />
        </Box>

        <Box className="inv-table-container">
          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1 }}>
              {loading ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Cargando...</Typography>
              ) : usuarios.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No hay usuarios</Typography>
              ) : usuarios.map((u) => (
                <Card key={u.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: u.rol === 'Desarrollador' ? '#6366F1' : '#f59e0b', fontSize: 16, fontWeight: 700 }}>
                        {u.nombre.charAt(0).toUpperCase()}{u.apellido?.charAt(0)?.toUpperCase() || ''}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{u.nombre} {u.apellido || ''}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {u.id}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>{u.email}</Typography>
                    <Chip icon={rolIcon(u.rol)} label={u.rol} size="small"
                      sx={{ fontWeight: 600, bgcolor: u.rol === 'Desarrollador' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: u.rol === 'Desarrollador' ? '#6366F1' : '#d97706', pl: 0.5 }} />
                  </CardContent>
                  <CardActions onClick={(e) => e.stopPropagation()}>
                    {(esAdmin || u.id === usuarioLogueado?.id) && (
                      <IconButton size="small" onClick={() => openEdit(u)}
                        sx={{ transition: 'all 0.2s', '&:hover': { color: '#6366F1', bgcolor: 'rgba(99,102,241,0.08)' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {esAdmin && (
                      <IconButton size="small" onClick={() => setDeleteDialog(u.id)}
                        sx={{ transition: 'all 0.2s', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center">Cargando...</TableCell></TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">No hay usuarios</TableCell></TableRow>
              ) : usuarios.map((u) => (
                <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: u.rol === 'Desarrollador' ? '#6366F1' : '#f59e0b', fontSize: 15, fontWeight: 700 }}>
                        {u.nombre.charAt(0).toUpperCase()}{u.apellido?.charAt(0)?.toUpperCase() || ''}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.nombre} {u.apellido || ''}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {u.id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip icon={rolIcon(u.rol)} label={u.rol} size="small"
                      sx={{ fontWeight: 600, bgcolor: u.rol === 'Desarrollador' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: u.rol === 'Desarrollador' ? '#6366F1' : '#d97706', pl: 0.5 }} />
                  </TableCell>
                  <TableCell align="right">
                    {(esAdmin || u.id === usuarioLogueado?.id) && (
                      <IconButton size="small" onClick={() => openEdit(u)}
                        sx={{ transition: 'all 0.2s', '&:hover': { color: '#6366F1', bgcolor: 'rgba(99,102,241,0.08)' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {esAdmin && (
                      <IconButton size="small" onClick={() => setDeleteDialog(u.id)}
                        sx={{ transition: 'all 0.2s', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
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
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, color: '#64748b' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, bgcolor: '#6366F1', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#4F46E5', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' } }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar usuario?</DialogTitle>
        <DialogContent>Esta acción no se puede deshacer.</DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialog(null)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, color: '#64748b' }}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={() => deleteDialog && handleDelete(deleteDialog)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, bgcolor: '#ef4444', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#dc2626', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
