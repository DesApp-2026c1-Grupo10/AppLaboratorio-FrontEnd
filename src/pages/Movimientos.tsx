import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, CircularProgress, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, TableSortLabel, Chip, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel, TablePagination,
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
  const [tipoItem, setTipoItem] = useState<'material' | 'reactivo' | ''>('');
  const [itemId, setItemId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  const sortedMovimientos = [...movimientos].sort((a, b) => {
    if (!sortBy) return 0;
    let aV: any, bV: any;
    switch (sortBy) {
      case 'fecha': aV = a.fecha; bV = b.fecha; break;
      case 'tipoMovimiento': aV = a.tipoMovimiento; bV = b.tipoMovimiento; break;
      case 'item': aV = (a.material?.name || a.reactivo?.name || '')?.toLowerCase(); bV = (b.material?.name || b.reactivo?.name || '')?.toLowerCase(); break;
      case 'cantidad': aV = a.cantidad; bV = b.cantidad; break;
      case 'responsable': aV = (a.usuario ? `${a.usuario.nombre} ${a.usuario.apellido}` : '')?.toLowerCase(); bV = (b.usuario ? `${b.usuario.nombre} ${b.usuario.apellido}` : '')?.toLowerCase(); break;
      default: return 0;
    }
    if (aV == null) return 1;
    if (bV == null) return -1;
    return aV < bV ? (sortOrder === 'asc' ? -1 : 1) : aV > bV ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  useEffect(() => {
    getMateriales().then(setMateriales).catch(console.error);
    getReactivos().then(setReactivos).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const matId = materialFilterUrl ? Number(materialFilterUrl) : tipoItem === 'material' && itemId ? Number(itemId) : undefined;
        const reacId = reactivoFilterUrl ? Number(reactivoFilterUrl) : tipoItem === 'reactivo' && itemId ? Number(itemId) : undefined;
        const result = await getMovimientos(
          tipoFilter || undefined, matId, reacId, page + 1, rowsPerPage,
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
  }, [tipoFilter, tipoItem, itemId, page, rowsPerPage, materialFilterUrl, reactivoFilterUrl]);

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
          <Typography variant="body1" className="inventario-subtitle">Registro de movimientos de stock de materiales y reactivos</Typography>
        </Box>

        <Box className="inv-toolbar">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tipo mov.</InputLabel>
            <Select value={tipoFilter} label="Tipo mov." onChange={(e) => setTipoFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
              <MenuItem value="descarte">Descarte</MenuItem>
              <MenuItem value="compra">Compra</MenuItem>
              <MenuItem value="producido">Producido</MenuItem>
              <MenuItem value="usado">Usado</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Tipo item</InputLabel>
            <Select value={tipoItem} label="Tipo item" onChange={(e) => { setTipoItem(e.target.value as typeof tipoItem); setItemId(''); }}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="material">Material</MenuItem>
              <MenuItem value="reactivo">Reactivo</MenuItem>
            </Select>
          </FormControl>
          {tipoItem && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{tipoItem === 'material' ? 'Material' : 'Reactivo'}</InputLabel>
              <Select value={itemId} label={tipoItem === 'material' ? 'Material' : 'Reactivo'} onChange={(e) => setItemId(e.target.value as number)}>
                <MenuItem value="">Seleccionar...</MenuItem>
                {(tipoItem === 'material' ? materiales : reactivos).map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ml: 'auto' }}>Nuevo Movimiento</Button>
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
                <TableCell sortDirection={sortBy === 'fecha' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'fecha'} direction={sortBy === 'fecha' ? sortOrder : 'asc'} onClick={() => handleSort('fecha')}>Fecha</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'tipoMovimiento' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'tipoMovimiento'} direction={sortBy === 'tipoMovimiento' ? sortOrder : 'asc'} onClick={() => handleSort('tipoMovimiento')}>Tipo</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'item' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'item'} direction={sortBy === 'item' ? sortOrder : 'asc'} onClick={() => handleSort('item')}>Item</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'cantidad' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'cantidad'} direction={sortBy === 'cantidad' ? sortOrder : 'asc'} onClick={() => handleSort('cantidad')}>Cantidad</TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'responsable' ? sortOrder : false}>
                  <TableSortLabel active={sortBy === 'responsable'} direction={sortBy === 'responsable' ? sortOrder : 'asc'} onClick={() => handleSort('responsable')}>Responsable</TableSortLabel>
                </TableCell>
                <TableCell>Observación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableSkeleton columns={6} rows={5} />
              : movimientos.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No hay movimientos</TableCell></TableRow>
              : sortedMovimientos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={m.tipoMovimiento} color={m.tipoMovimiento === 'entrada' || m.tipoMovimiento === 'compra' ? 'success' : m.tipoMovimiento === 'salida' || m.tipoMovimiento === 'usado' ? 'error' : m.tipoMovimiento === 'descarte' ? 'warning' : 'info'} size="small" />
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
