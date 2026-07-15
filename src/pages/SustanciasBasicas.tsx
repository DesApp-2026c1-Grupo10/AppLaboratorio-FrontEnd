import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, TablePagination, CircularProgress, Card, CardContent, CardActions, useMediaQuery,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import SustanciaBasicaDialog from '../components/sustanciasBasicas/SustanciaBasicaDialog';
import { getSustanciasBasicas, createSustanciaBasica, updateSustanciaBasica, deleteSustanciaBasica } from '../api/sustanciasBasicas';
import type { SnackbarState } from '../types/snackbar';
import TableSkeleton from '../components/TableSkeleton';
import type { SustanciaBasica } from '../types/sustanciaBasica';
import '../styles/inventario.css';

export default function SustanciasBasicas() {
  const [sustancias, setSustancias] = useState<SustanciaBasica[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [editing, setEditing] = useState<SustanciaBasica | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const isMobile = useMediaQuery('(max-width: 900px)');

  const handleSort = (column: string) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  const sorted = [...sustancias].sort((a, b) => {
    if (!sortBy) return 0;
    let aV: any, bV: any;
    switch (sortBy) {
      case 'name': aV = a.name?.toLowerCase(); bV = b.name?.toLowerCase(); break;
      case 'stock': aV = a.stock; bV = b.stock; break;
      case 'stockMinimo': aV = a.stockMinimo; bV = b.stockMinimo; break;
      case 'unidadMedida': aV = a.unidadMedida?.toLowerCase(); bV = b.unidadMedida?.toLowerCase(); break;
      default: return 0;
    }
    if (aV == null) return 1;
    if (bV == null) return -1;
    return aV < bV ? (sortOrder === 'asc' ? -1 : 1) : aV > bV ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getSustanciasBasicas(search || undefined, page + 1, rowsPerPage);
        setSustancias(Array.isArray(result) ? result : (result?.data ?? []));
        setTotal(Array.isArray(result) ? result.length : (result?.total ?? 0));
      } catch {
        setSnackbar({ msg: 'Error cargando datos', severity: 'error' });
      } finally { setLoading(false); }
    };
    load();
  }, [search, page, rowsPerPage]);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: SustanciaBasica) => { setEditing(s); setDialogOpen(true); };

  const handleSave = async (data: Record<string, any>) => {
    try {
      const payload = { ...data, stock: Number(data.stock), stockMinimo: Number(data.stockMinimo) };
      if (editing) {
        const updated = await updateSustanciaBasica(editing.id, payload);
        setSustancias((prev) => prev.map((s) => (s.id === editing.id ? updated : s)));
        setSnackbar({ msg: 'Sustancia básica actualizada', severity: 'success' });
      } else {
        const created = await createSustanciaBasica(payload);
        setSustancias((prev) => [...prev, created]);
        setSnackbar({ msg: 'Sustancia básica creada', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err) { setSnackbar({ msg: err instanceof Error ? err.message : 'Error', severity: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSustanciaBasica(id);
      setSustancias((prev) => prev.filter((s) => s.id !== id));
      setSnackbar({ msg: 'Sustancia básica eliminada', severity: 'success' });
    } catch { setSnackbar({ msg: 'Error eliminando sustancia básica', severity: 'error' }); }
    setDeleteDialog(null);
  };

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4">Sustancias Básicas</Typography>
          <Typography variant="body1" className="inventario-subtitle">Gestión de insumos primarios para preparación de reactivos</Typography>
        </Box>

        <Box className="inv-toolbar">
          <TextField size="small" placeholder="Buscar sustancia..." value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} /> } }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, py: 1, bgcolor: '#6366F1', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#4F46E5', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' } }}>
            Nueva Sustancia
          </Button>

        </Box>

        <Box className="inv-table-container">
          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1 }}>
              {loading ? <CircularProgress /> : sorted.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No hay sustancias básicas</Typography>
              ) : sorted.map((s) => (
                <Card key={s.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{s.name}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip label={`Stock: ${s.stock}`} size="small" color={s.stockMinimo > 0 && s.stock <= s.stockMinimo ? 'warning' : s.stock <= 0 ? 'error' : 'default'} />
                      <Chip label={`Mín: ${s.stockMinimo}`} size="small" variant="outlined" />
                      <Chip label={s.unidadMedida || '-'} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                  <CardActions onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(s.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
                labelDisplayedRows={({ from, to, count }) => count !== 0 ? `${from}–${to} de ${count} sustancias` : '0 resultados'}
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
                <TableCell sortDirection={sortBy === 'stock' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'stock'} direction={sortBy === 'stock' ? sortOrder : 'asc'} onClick={() => handleSort('stock')}>Stock</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'stockMinimo' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'stockMinimo'} direction={sortBy === 'stockMinimo' ? sortOrder : 'asc'} onClick={() => handleSort('stockMinimo')}>Stock Mínimo</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'unidadMedida' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'unidadMedida'} direction={sortBy === 'unidadMedida' ? sortOrder : 'asc'} onClick={() => handleSort('unidadMedida')}>Unidad</TableSortLabel>
                </TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableSkeleton columns={5} rows={5} />
              : sorted.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No hay sustancias básicas</TableCell></TableRow>
              : sorted.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <Chip label={s.stock} color={s.stockMinimo > 0 && s.stock <= s.stockMinimo ? 'warning' : s.stock <= 0 ? 'error' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{s.stockMinimo}</TableCell>
                  <TableCell>{s.unidadMedida || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(s.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
            labelDisplayedRows={({ from, to, count }) => count !== 0 ? `${from}–${to} de ${count} sustancias` : '0 resultados'}
          />
          </>
          )}
        </Box>
      </Box>

      <SustanciaBasicaDialog open={dialogOpen} editing={editing} onSave={handleSave} onClose={() => setDialogOpen(false)} />

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>¿Eliminar sustancia básica?</DialogTitle>
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