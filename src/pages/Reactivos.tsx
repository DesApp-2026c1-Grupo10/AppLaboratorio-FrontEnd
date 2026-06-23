import { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, TablePagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, History as HistoryIcon, BuildCircle as BuildCircleIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import ReactivoDialog from '../components/reactivos/ReactivoDialog';
import ProducirReactivoDialog from '../components/reactivos/ProducirReactivoDialog';
import { getReactivos, createReactivo, updateReactivo, deleteReactivo } from '../api/reactivos';
import { getLaboratorios } from '../api/laboratorios';
import { useWs } from '../context/WsContext';
import type { SnackbarState } from '../types/snackbar';
import TableSkeleton from '../components/TableSkeleton';
import type { Reactivo } from '../types/reactivo';
import type { Laboratorio } from '../types/laboratorio';
import '../styles/inventario.css';

export default function Reactivos() {
  const navigate = useNavigate();
  const { on } = useWs();
  const [reactivos, setReactivos] = useState<Reactivo[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [editing, setEditing] = useState<Reactivo | null>(null);
  const [producirReactivo, setProducirReactivo] = useState<Reactivo | null>(null);
  const [vencFilter, setVencFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedReactivos = [...reactivos].sort((a, b) => {
    if (!sortBy) return 0;
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'name': aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase(); break;
      case 'stock': aVal = a.stock; bVal = b.stock; break;
      case 'unidadMedida': aVal = a.unidadMedida?.toLowerCase(); bVal = b.unidadMedida?.toLowerCase(); break;
      case 'vencimiento': aVal = a.vencimiento; bVal = b.vencimiento; break;
      case 'prep_time': aVal = a.prep_time; bVal = b.prep_time; break;
      case 'laboratorio': aVal = a.laboratorio?.nombre?.toLowerCase(); bVal = b.laboratorio?.nombre?.toLowerCase(); break;
      default: return 0;
    }
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;

  useEffect(() => {
    getLaboratorios().then(setLaboratorios).catch(console.error);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getReactivos(search || undefined, vencFilter || undefined, page + 1, rowsPerPage);
      setReactivos(Array.isArray(result) ? result : (result?.data ?? []));
      setTotal(Array.isArray(result) ? result.length : (result?.total ?? 0));
    } catch {
      setSnackbar({ msg: 'Error cargando datos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, vencFilter, page, rowsPerPage]);

  useEffect(() => {
    const unsub = on('INVENTARIO_MODIFICADO', (data) => {
      if (data.tipo === 'reactivo') {
        loadData();
      }
    });
    return unsub;
  }, [on]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (r: Reactivo) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const handleSave = async (data: Record<string, any>) => {
    try {
      const payload = {
        ...data, stock: Number(data.stock), stockMinimo: Number(data.stockMinimo), prep_time: Number(data.prep_time),
        vencimiento: data.vencimiento || null,
        laboratorioId: data.laboratorioId ? Number(data.laboratorioId) : null,
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
    } catch (err) { setSnackbar({ msg: err instanceof Error ? err.message : 'Error', severity: 'error' }); }
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
                <TableCell sortDirection={sortBy === 'name' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>Nombre</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'stock' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'stock'} direction={sortBy === 'stock' ? sortOrder : 'asc'} onClick={() => handleSort('stock')}>Stock</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'unidadMedida' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'unidadMedida'} direction={sortBy === 'unidadMedida' ? sortOrder : 'asc'} onClick={() => handleSort('unidadMedida')}>Unidad</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'vencimiento' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'vencimiento'} direction={sortBy === 'vencimiento' ? sortOrder : 'asc'} onClick={() => handleSort('vencimiento')}>Vencimiento</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'prep_time' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'prep_time'} direction={sortBy === 'prep_time' ? sortOrder : 'asc'} onClick={() => handleSort('prep_time')}>Tiempo Prep. (min)</TableSortLabel>
                </TableCell>
                <TableCell>Composición</TableCell>
                <TableCell sortDirection={sortBy === 'laboratorio' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'laboratorio'} direction={sortBy === 'laboratorio' ? sortOrder : 'asc'} onClick={() => handleSort('laboratorio')}>Laboratorio</TableSortLabel>
                </TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableSkeleton columns={8} rows={5} />
              : reactivos.length === 0 ? <TableRow><TableCell colSpan={8} align="center">No hay reactivos</TableCell></TableRow>
              : sortedReactivos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <Chip label={r.stock} color={r.stockMinimo > 0 && r.stock <= r.stockMinimo ? 'warning' : r.stock <= 0 ? 'error' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{r.unidadMedida || '-'}</TableCell>
                  <TableCell>
                    {r.vencimiento ? (
                      <Chip label={new Date(r.vencimiento).toLocaleDateString()} color={proxVencer(r.vencimiento) ? 'error' : 'default'} size="small" />
                    ) : '-'}
                  </TableCell>
                  <TableCell>{r.prep_time || 0}</TableCell>
                  <TableCell>
                    {r.composicion && r.composicion.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {r.composicion.map((c) => (
                          <Chip key={c.id} label={`${c.name} ${c.ReactivoSustancia.porcentaje}%`} size="small" variant="outlined" />
                        ))}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{r.laboratorio?.nombre || '-'}</TableCell>
                  <TableCell>
                    {r.composicion && r.composicion.length > 0 && (
                      <IconButton size="small" onClick={() => setProducirReactivo(r)} title="Producir reactivo" color="primary"><BuildCircleIcon fontSize="small" /></IconButton>
                    )}
                    <IconButton size="small" onClick={() => navigate(`/movimientos?reactivoId=${r.id}`)} title="Ver movimientos">
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(r.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
            labelDisplayedRows={({ from, to, count }) => count !== 0 ? `${from}–${to} de ${count} reactivos` : '0 resultados'}
          />
        </Box>
      </Box>

      <ReactivoDialog
        open={dialogOpen}
        editing={editing}
        laboratorios={laboratorios}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

      {producirReactivo && (
        <ProducirReactivoDialog
          open
          reactivo={producirReactivo}
          usuarioId={usuarioLogueado?.id}
          onComplete={(updated) => {
            setReactivos((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setProducirReactivo(null);
            setSnackbar({ msg: `${updated.name} producido correctamente`, severity: 'success' });
          }}
          onClose={() => setProducirReactivo(null)}
        />
      )}

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
