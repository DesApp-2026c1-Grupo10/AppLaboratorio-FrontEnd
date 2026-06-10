import { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel, TablePagination,
} from '@mui/material';
import type { SnackbarState } from '../types/snackbar';
import TableSkeleton from '../components/TableSkeleton';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, History as HistoryIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import EquipoDialog from '../components/equipos/EquipoDialog';
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '../api/equipos';
import { getUsos } from '../api/usos';
import { getLaboratorios } from '../api/laboratorios';
import type { Equipo, UsoEquipo } from '../types/equipo';
import type { Laboratorio } from '../types/laboratorio';
import '../styles/inventario.css';

const statusColor: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  Disponible: 'success', 'En uso': 'info', Mantenimiento: 'warning', 'Fuera de servicio': 'error',
};

export default function Equipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialUsos, setHistorialUsos] = useState<UsoEquipo[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [editing, setEditing] = useState<Equipo | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getLaboratorios().then(setLaboratorios).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getEquipos(search || undefined, estadoFilter || undefined, page + 1, rowsPerPage);
        setEquipos(Array.isArray(result) ? result : (result?.data ?? []));
        setTotal(Array.isArray(result) ? result.length : (result?.total ?? 0));
      } catch {
        setSnackbar({ msg: 'Error cargando datos', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, estadoFilter, page, rowsPerPage]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (e: Equipo) => {
    setEditing(e);
    setDialogOpen(true);
  };

  const verHistorial = async (id: number) => {
    try {
      const usos = await getUsos(id);
      setHistorialUsos(usos);
      setHistorialOpen(true);
    } catch { setSnackbar({ msg: 'Error cargando historial', severity: 'error' }); }
  };

  const handleSave = async (data: Record<string, any>) => {
    try {
      const payload = {
        ...data, is_movable: data.is_movable === 'true',
        laboratorioId: data.laboratorioId ? Number(data.laboratorioId) : null,
        ultimaRevision: data.ultimaRevision || null, observaciones: data.observaciones || null,
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
    } catch (err) { setSnackbar({ msg: err instanceof Error ? err.message : 'Error', severity: 'error' }); }
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
              {loading ? <TableSkeleton columns={7} rows={5} />
              : equipos.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay equipos</TableCell></TableRow>
              : equipos.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell>{eq.name}</TableCell>
                  <TableCell><Chip label={eq.status} color={statusColor[eq.status] || 'default'} size="small" /></TableCell>
                  <TableCell>{eq.laboratorio?.nombre || '-'}</TableCell>
                  <TableCell>{eq.laboratorio?.edificio || '-'}</TableCell>
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
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => count !== 0 ? `${from}–${to} de ${count} equipos` : '0 resultados'}
          />
        </Box>
      </Box>

      <EquipoDialog
        open={dialogOpen}
        editing={editing}
        laboratorios={laboratorios}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

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
