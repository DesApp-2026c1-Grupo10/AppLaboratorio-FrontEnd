import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getMovimientos, createMovimiento } from '../api/movimientos';
import { getMateriales } from '../api/materiales';
import { getReactivos } from '../api/reactivos';
import type { MovimientoStock } from '../types/movimiento';
import '../styles/inventario.css';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [reactivos, setReactivos] = useState<any[]>([]);
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ tipoMovimiento: 'entrada' as 'entrada' | 'salida', cantidad: 1, fecha: '', observacion: '', materialId: '', reactivoId: '' });
  const [tipoItem, setTipoItem] = useState<'material' | 'reactivo'>('material');

  useEffect(() => {
    Promise.all([getMovimientos(), getMateriales(), getReactivos()])
      .then(([mData, matData, rData]) => { setMovimientos(mData); setMateriales(matData); setReactivos(rData); })
      .catch(() => setSnackbar({ msg: 'Error cargando datos', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tipoFilter ? movimientos.filter((m) => m.tipoMovimiento === tipoFilter) : movimientos;

  const openCreate = () => {
    setForm({ tipoMovimiento: 'entrada', cantidad: 1, fecha: new Date().toISOString().split('T')[0], observacion: '', materialId: '', reactivoId: '' });
    setTipoItem('material');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.cantidad || form.cantidad < 1) { setSnackbar({ msg: 'La cantidad debe ser mayor a 0', severity: 'error' }); return; }
    if (!form.materialId && !form.reactivoId) { setSnackbar({ msg: 'Seleccione un material o reactivo', severity: 'error' }); return; }

    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) { setSnackbar({ msg: 'Sesión expirada', severity: 'error' }); return; }
    const usuario = JSON.parse(usuarioStorage);

    try {
      const payload: any = {
        tipoMovimiento: form.tipoMovimiento, cantidad: Number(form.cantidad),
        fecha: form.fecha || new Date().toISOString().split('T')[0],
        observacion: form.observacion || null, usuarioId: usuario.id,
      };
      if (tipoItem === 'material' && form.materialId) payload.materialId = Number(form.materialId);
      if (tipoItem === 'reactivo' && form.reactivoId) payload.reactivoId = Number(form.reactivoId);

      const created = await createMovimiento(payload);
      setMovimientos((prev) => [created, ...prev]);
      setSnackbar({ msg: 'Movimiento registrado', severity: 'success' });
      setDialogOpen(false);
    } catch (err: any) { setSnackbar({ msg: err.message, severity: 'error' }); }
  };

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Movimientos de Stock</Typography>
          <Typography variant="body1" className="inventario-subtitle">Registro de entradas y salidas de materiales y reactivos</Typography>
        </Box>

        <Box className="inv-toolbar">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipoFilter} label="Tipo" onChange={(e) => setTipoFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="entrada">Entradas</MenuItem>
              <MenuItem value="salida">Salidas</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Movimiento</Button>
        </Box>

        <Box className="inv-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Observación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} align="center">Cargando...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No hay movimientos</TableCell></TableRow>
              : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={m.tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} color={m.tipoMovimiento === 'entrada' ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{m.material?.name || m.reactivo?.name || '-'}</TableCell>
                  <TableCell>{m.cantidad}</TableCell>
                  <TableCell>{m.usuario ? `${m.usuario.nombre} ${m.usuario.apellido}` : '-'}</TableCell>
                  <TableCell>{m.observacion || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Movimiento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select value={form.tipoMovimiento} label="Tipo de Movimiento" onChange={(e) => setForm({ ...form, tipoMovimiento: e.target.value as 'entrada' | 'salida' })}>
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tipo de Item</InputLabel>
              <Select value={tipoItem} label="Tipo de Item" onChange={(e) => { setTipoItem(e.target.value as 'material' | 'reactivo'); setForm({ ...form, materialId: '', reactivoId: '' }); }}>
                <MenuItem value="material">Material</MenuItem>
                <MenuItem value="reactivo">Reactivo</MenuItem>
              </Select>
            </FormControl>
            {tipoItem === 'material' ? (
              <FormControl fullWidth>
                <InputLabel>Material</InputLabel>
                <Select value={form.materialId} label="Material" onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                  {materiales.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.name} (Stock: {m.stock})</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Reactivo</InputLabel>
                <Select value={form.reactivoId} label="Reactivo" onChange={(e) => setForm({ ...form, reactivoId: e.target.value })}>
                  {reactivos.map((r: any) => <MenuItem key={r.id} value={r.id}>{r.name} (Stock: {r.stock})</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField label="Cantidad" type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} fullWidth inputProps={{ min: 1 }} />
            <TextField label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Observación" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
