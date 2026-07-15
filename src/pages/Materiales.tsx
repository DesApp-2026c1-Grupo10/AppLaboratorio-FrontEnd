import { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, TablePagination, Card, CardContent, CardActions, alpha, useMediaQuery,
} from '@mui/material';
import type { SnackbarState } from '../types/snackbar';
import TableSkeleton from '../components/TableSkeleton';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, History as HistoryIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import MaterialDialog from '../components/materiales/MaterialDialog';
import CompraDialog from '../components/compra/CompraDialog';
import { getMateriales, createMaterial, updateMaterial, deleteMaterial } from '../api/materiales';
import { createMovimiento } from '../api/movimientos';
import { getLaboratorios } from '../api/laboratorios';
import { useWs } from '../context/WsContext';
import type { Material } from '../types/material';
import type { Laboratorio } from '../types/laboratorio';
import '../styles/inventario.css';

export default function Materiales() {
  const navigate = useNavigate();
  const { on } = useWs();
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
  const isMobile = useMediaQuery('(max-width: 900px)');

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;

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
      case 'stockComprometido': aVal = a.stockComprometido || 0; bVal = b.stockComprometido || 0; break;
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
    const unsub = on('INVENTARIO_MODIFICADO', (data) => {
      if (data.tipo === 'material') {
        loadData();
      }
    });
    return unsub;
  }, [on]);

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
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

  const [comprarMaterial, setComprarMaterial] = useState<Material | null>(null);

  const handleComprar = async (cantidad: number) => {
    if (!comprarMaterial) return;
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    await createMovimiento({
      tipoMovimiento: 'compra',
      cantidad,
      materialId: comprarMaterial.id,
      usuarioId: usuario.id,
      observacion: 'Compra registrada desde inventario',
    });
    setSnackbar({ msg: `Compra registrada: +${cantidad} ${comprarMaterial.name}`, severity: 'success' });
    loadData();
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
          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1 }}>
              {loading ? <CircularProgress /> : sortedMateriales.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No hay materiales</Typography>
              ) : sortedMateriales.map((m) => (
                <Card key={m.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{m.name}</Typography>
                    {m.descripcion && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{m.descripcion}</Typography>}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      <Chip label={`Stock: ${m.stock}`} size="small" color={m.stockMinimo > 0 && m.stock <= m.stockMinimo ? 'warning' : 'default'} />
                      <Chip label={`Comp: ${m.stockComprometido || 0}`} size="small" variant="outlined" />
                      <Chip label={`Disp: ${(m.stock || 0) - (m.stockComprometido || 0)}`} size="small" variant="outlined" color="primary" />
                      <Chip label={`Mín: ${m.stockMinimo}`} size="small" variant="outlined" />
                      <Chip label={m.unit || '-'} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{m.laboratorio?.nombre || 'Sin laboratorio'}</Typography>
                  </CardContent>
                  <CardActions sx={{ flexWrap: 'wrap', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => setComprarMaterial(m)} title="Comprar" color="success"><ShoppingCartIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => navigate(`/movimientos?materialId=${m.id}`)} title="Ver movimientos"><HistoryIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(m.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </CardActions>
                </Card>
              ))}
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
          ) : (
          <>
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
                  <TableSortLabel active={sortBy === 'stock'} direction={sortBy === 'stock' ? sortOrder : 'asc'} onClick={() => handleSort('stock')}>Stock Físico</TableSortLabel>
                </TableCell>
                <TableCell>Stock Comp.</TableCell>
                <TableCell>Disponible</TableCell>
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
                <TableSkeleton columns={9} rows={5} />
              ) : materiales.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center">No hay materiales</TableCell></TableRow>
              ) : sortedMateriales.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Chip label={m.stock} color={m.stockMinimo > 0 && m.stock <= m.stockMinimo ? 'warning' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{m.stockComprometido || 0}</TableCell>
                  <TableCell>{(m.stock || 0) - (m.stockComprometido || 0)}</TableCell>
                  <TableCell>{m.stockMinimo}</TableCell>
                  <TableCell>{m.unit || '-'}</TableCell>
                  <TableCell>{m.laboratorio?.nombre || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => setComprarMaterial(m)} title="Comprar" color="success"><ShoppingCartIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => navigate(`/movimientos?materialId=${m.id}`)} title="Ver movimientos"><HistoryIcon fontSize="small" /></IconButton>
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
          </>
          )}
        </Box>
      </Box>

      <MaterialDialog
        open={dialogOpen}
        editing={editing}
        laboratorios={laboratorios}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

      <CompraDialog open={comprarMaterial !== null} itemName={comprarMaterial?.name || ''} onConfirm={handleComprar} onClose={() => setComprarMaterial(null)} />

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
