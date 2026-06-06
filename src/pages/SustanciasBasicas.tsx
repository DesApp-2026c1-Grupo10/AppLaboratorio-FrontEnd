import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Snackbar, Alert, TablePagination,
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getSustanciasBasicas(search || undefined, page + 1, rowsPerPage);
        setSustancias(Array.isArray(result) ? result : (result?.data ?? []));
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

  const openEdit = (s: SustanciaBasica) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleSave = async (data: Record<string, any>) => {
    try {
      const payload = {
        ...data, stock: Number(data.stock), stockMinimo: Number(data.stockMinimo),
      };
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nueva Sustancia</Button>
        </Box>

        <Box className="inv-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Stock Mínimo</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableSkeleton columns={5} rows={5} />
              : sustancias.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No hay sustancias básicas</TableCell></TableRow>
              : sustancias.map((s) => (
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
        </Box>
      </Box>

      <SustanciaBasicaDialog
        open={dialogOpen}
        editing={editing}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

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
