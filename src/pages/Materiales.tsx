import { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, TablePagination,
} from '@mui/material';
import type { SnackbarState } from '../types/snackbar';
import TableSkeleton from '../components/TableSkeleton';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, History as HistoryIcon, SwapHoriz as SwapHorizIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import MaterialDialog from '../components/materiales/MaterialDialog';
import MoverDialog from '../components/MoverDialog';
import { getMateriales, createMaterial, updateMaterial, deleteMaterial, moverMaterial } from '../api/materiales';
import { getLaboratorios } from '../api/laboratorios';
import type { Material } from '../types/material';
import type { Laboratorio } from '../types/laboratorio';
import '../styles/inventario.css';

export default function Materiales() {
  const navigate = useNavigate();
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [editing, setEditing] = useState<Material | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [moverItem, setMoverItem] = useState<Material | null>(null);

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;

  const handleMover = async (nuevoLaboratorioId: number) => {
    if (!moverItem) return;
    const updated = await moverMaterial(moverItem.id, nuevoLaboratorioId, usuarioLogueado?.id);
    setMateriales((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setMoverItem(null);
    setSnackbar({ msg: `Material movido a ${laboratorios.find((l) => l.id === nuevoLaboratorioId)?.nombre || ''}`, severity: 'success' });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedMateriales = [...materiales].sort((a, b) => {
    if (!sortBy) return 0;
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'name': aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase(); break;
      case 'descripcion': aVal = a.descripcion?.toLowerCase(); bVal = b.descripcion?.toLowerCase(); break;
      case 'stock': aVal = a.stock; bVal = b.stock; break;
      case 'stockMinimo': aVal = a.stockMinimo; bVal = b.stockMinimo; break;
      case 'unit': aVal = a.unit?.toLowerCase(); bVal = b.unit?.toLowerCase(); break;
      case 'laboratorio': aVal = a.laboratorio?.nombre?.toLowerCase(); bVal = b.laboratorio?.nombre?.toLowerCase(); break;
      default: return 0;
    }
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    getLaboratorios().then(setLaboratorios).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getMateriales(search || undefined, page + 1, rowsPerPage);
        setMateriales(Array.isArray(result) ? result : (result?.data ?? []));
        setTotal(Array.isArray(result) ? result.length : (result?.total ?? 0));
      } catch {
        setSnackbar({ msg: 'Error cargando datos', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, page, rowsPerPage]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditing(m);
    setDialogOpen(true);
  };

  const handleSave = async (data: Record<string, any>) => {
    try {
      const payload = { ...data, stock: Number(data.stock), stockMinimo: Number(data.stockMinimo), laboratorioId: data.laboratorioId ? Number(data.laboratorioId) : null };
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
    } catch (err) {
      setSnackbar({ msg: err instanceof Error ? err.message : 'Error', severity: 'error' });
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
                <TableCell sortDirection={sortBy === 'name' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>Nombre</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'descripcion' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'descripcion'} direction={sortBy === 'descripcion' ? sortOrder : 'asc'} onClick={() => handleSort('descripcion')}>Descripción</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'stock' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'stock'} direction={sortBy === 'stock' ? sortOrder : 'asc'} onClick={() => handleSort('stock')}>Stock</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'stockMinimo' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'stockMinimo'} direction={sortBy === 'stockMinimo' ? sortOrder : 'asc'} onClick={() => handleSort('stockMinimo')}>Stock Mínimo</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'unit' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'unit'} direction={sortBy === 'unit' ? sortOrder : 'asc'} onClick={() => handleSort('unit')}>Unidad</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'laboratorio' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'laboratorio'} direction={sortBy === 'laboratorio' ? sortOrder : 'asc'} onClick={() => handleSort('laboratorio')}>Laboratorio</TableSortLabel>
                </TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
               {loading ? (
                <TableSkeleton columns={7} rows={5} />
              ) : materiales.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No hay materiales</TableCell></TableRow>
              ) : sortedMateriales.map((m) => (
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
                    <IconButton size="small" onClick={() => navigate(`/movimientos?materialId=${m.id}`)} title="Ver movimientos"><HistoryIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setMoverItem(m)} title="Mover de laboratorio"><SwapHorizIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(m.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
            labelDisplayedRows={({ from, to, count }) => count !== 0 ? `${from}–${to} de ${count} materiales` : '0 resultados'}
          />
        </Box>
      </Box>

      <MaterialDialog
        open={dialogOpen}
        editing={editing}
        laboratorios={laboratorios}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>¿Eliminar material?</DialogTitle>
        <DialogContent>Esta acción no se puede deshacer.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <MoverDialog
        open={!!moverItem}
        itemName={moverItem?.name || ''}
        itemTipo="Material"
        origenNombre={moverItem?.laboratorio ? `${moverItem.laboratorio.nombre} (${moverItem.laboratorio.edificio || 'Sin edificio'})` : 'Sin laboratorio'}
        laboratorios={laboratorios}
        onConfirm={handleMover}
        onClose={() => setMoverItem(null)}
      />

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
