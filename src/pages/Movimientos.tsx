import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, CircularProgress, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel, TablePagination,
} from '@mui/material';
import type { SnackbarState } from '../types/snackbar';
import TableSkeleton from '../components/TableSkeleton';
import { Add as AddIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import MovimientoDialog from '../components/movimientos/MovimientoDialog';
import { getMovimientos, createMovimiento } from '../api/movimientos';
import { getMateriales } from '../api/materiales';
import { getReactivos } from '../api/reactivos';
import type { MovimientoStock } from '../types/movimiento';
import type { Material } from '../types/material';
import type { Reactivo } from '../types/reactivo';
import '../styles/inventario.css';

export default function Movimientos() {
  const [searchParams] = useSearchParams();
  const materialFilterUrl = searchParams.get('materialId');
  const reactivoFilterUrl = searchParams.get('reactivoId');

  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [reactivos, setReactivos] = useState<Reactivo[]>([]);
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getMateriales().then(setMateriales).catch(console.error);
    getReactivos().then(setReactivos).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getMovimientos(
          tipoFilter || undefined,
          materialFilterUrl ? Number(materialFilterUrl) : undefined,
          reactivoFilterUrl ? Number(reactivoFilterUrl) : undefined,
          page + 1, rowsPerPage,
        );
        setMovimientos(Array.isArray(result) ? result : (result?.data ?? []));
        setTotal(Array.isArray(result) ? result.length : (result?.total ?? 0));
      } catch {
        setSnackbar({ msg: 'Error cargando datos', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tipoFilter, page, rowsPerPage, materialFilterUrl, reactivoFilterUrl]);

  const openCreate = () => {
    setDialogOpen(true);
  };

  const handleSave = async (data: Record<string, any>) => {
    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) { setSnackbar({ msg: 'Sesión expirada', severity: 'error' }); return; }
    const usuario = JSON.parse(usuarioStorage);

    try {
      const payload: Record<string, any> = {
        tipoMovimiento: data.tipoMovimiento, cantidad: Number(data.cantidad),
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        observacion: data.observacion || null, usuarioId: usuario.id,
      };
      if (data.materialId) payload.materialId = Number(data.materialId);
      if (data.reactivoId) payload.reactivoId = Number(data.reactivoId);

      const created = await createMovimiento(payload);
      setMovimientos((prev) => [created, ...prev]);
      setSnackbar({ msg: 'Movimiento registrado', severity: 'success' });
      setDialogOpen(false);
    } catch (err) { setSnackbar({ msg: err instanceof Error ? err.message : 'Error', severity: 'error' }); }
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

        {(materialFilterUrl || reactivoFilterUrl) && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Filtrando por: ${materialFilterUrl ? `Material #${materialFilterUrl}` : `Reactivo #${reactivoFilterUrl}`}`}
              color="primary"
              size="small"
              onDelete={() => window.history.pushState({}, '', '/movimientos')}
            />
            <Button size="small" onClick={() => window.location.reload()}>Limpiar filtro</Button>
          </Box>
        )}

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
              {loading ? <TableSkeleton columns={6} rows={5} />
              : movimientos.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No hay movimientos</TableCell></TableRow>
              : movimientos.map((m) => (
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
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => count !== 0 ? `${from}–${to} de ${count} movimientos` : '0 resultados'}
          />
        </Box>
      </Box>

      <MovimientoDialog
        open={dialogOpen}
        materiales={materiales}
        reactivos={reactivos}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
