import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScienceIcon from '@mui/icons-material/Science';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AppLayout from '../components/layout/AppLayout';
import { getMateriales } from '../api/materiales';
import { getReactivos } from '../api/reactivos';
import { getEquipos } from '../api/equipos';
import { getMovimientos } from '../api/movimientos';
import type { Material } from '../types/material';
import type { Equipo } from '../types/equipo';
import type { MovimientoStock } from '../types/movimiento';
import '../styles/inventario.css';

export default function Inventario() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ materiales: 0, reactivos: 0, equipos: 0 });
  const [stockBajo, setStockBajo] = useState<Material[]>([]);
  const [enMantenimiento, setEnMantenimiento] = useState<Equipo[]>([]);
  const [ultimosMovimientos, setUltimosMovimientos] = useState<MovimientoStock[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [materiales, reactivos, equipos, movimientos] = await Promise.all([
        getMateriales(),
        getReactivos(),
        getEquipos(),
        getMovimientos(),
      ]);
      setStats({ materiales: materiales.length, reactivos: reactivos.length, equipos: equipos.length });
      setStockBajo(materiales.filter((m) => m.stockMinimo > 0 && m.stock <= m.stockMinimo));
      setEnMantenimiento(equipos.filter((e) => e.status === 'Mantenimiento'));
      setUltimosMovimientos(movimientos.slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <AppLayout>
      <Box className="inventario-page">
        <Box className="inventario-header">
          <Typography variant="h4" className="inventario-title">Inventario General</Typography>
          <Typography variant="body1" className="inventario-subtitle">
            Gestión centralizada de materiales, reactivos y equipos
          </Typography>
        </Box>

        <Box className="inventario-stats-grid">
          <Box className="stats-grid">
            <Card className="inv-stat-card" onClick={() => navigate('/materiales')} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h3">{stats.materiales}</Typography>
                <Typography color="text.secondary">Materiales</Typography>
              </CardContent>
            </Card>
            <Card className="inv-stat-card" onClick={() => navigate('/reactivos')} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <ScienceIcon color="secondary" sx={{ fontSize: 40 }} />
                <Typography variant="h3">{stats.reactivos}</Typography>
                <Typography color="text.secondary">Reactivos</Typography>
              </CardContent>
            </Card>
            <Card className="inv-stat-card" onClick={() => navigate('/equipos')} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <PrecisionManufacturingIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                <Typography variant="h3">{stats.equipos}</Typography>
                <Typography color="text.secondary">Equipos</Typography>
              </CardContent>
            </Card>
            <Card className="inv-stat-card" onClick={() => navigate('/movimientos')} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <SwapHorizIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                <Typography variant="h3">{ultimosMovimientos.length}</Typography>
                <Typography color="text.secondary">Movimientos recientes</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningAmberIcon color="warning" />
                <Typography variant="h6">Stock Bajo</Typography>
              </Box>
              {stockBajo.length === 0 ? (
                <Typography color="text.secondary">No hay materiales con stock bajo</Typography>
              ) : (
                stockBajo.map((m) => (
                  <Box key={m.id} className="alerta-item">
                    <Typography><strong>{m.name}</strong></Typography>
                    <Chip label={`Stock: ${m.stock} / Mín: ${m.stockMinimo}`} color="warning" size="small" />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BuildCircleIcon color="warning" />
                <Typography variant="h6">Equipos en Mantenimiento</Typography>
              </Box>
              {enMantenimiento.length === 0 ? (
                <Typography color="text.secondary">No hay equipos en mantenimiento</Typography>
              ) : (
                enMantenimiento.map((e) => (
                  <Box key={e.id} className="alerta-item">
                    <Typography><strong>{e.name}</strong></Typography>
                    <Chip label={e.status} color="warning" size="small" />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SwapHorizIcon color="primary" />
              <Typography variant="h6">Últimos Movimientos</Typography>
            </Box>
            {ultimosMovimientos.length === 0 ? (
              <Typography color="text.secondary">No hay movimientos registrados</Typography>
            ) : (
              ultimosMovimientos.map((m) => (
                <Box key={m.id} className="movimiento-item">
                  <Box>
                    <Chip
                      label={m.tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'}
                      color={m.tipoMovimiento === 'entrada' ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                      {m.material?.name || m.reactivo?.name} - Cant: {m.cantidad}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {m.usuario?.nombre} - {new Date(m.fecha).toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
