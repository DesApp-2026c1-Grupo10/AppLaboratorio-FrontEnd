import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Grid,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ScienceIcon from '@mui/icons-material/Science';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import { getEstadisticasResumen } from '../api/estadisticas';
import type { EstadisticasData } from '../types/estadisticas';

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: '#F59E0B',
  Aprobado: '#10B981',
  Rechazado: '#EF4444',
  Finalizado: '#3B82F6',
  Cancelado: '#6B7280',
};

const BAR_ANIMATION_DURATION = 1200;

const Gradients = () => (
  <defs>
    <linearGradient id="gradLab" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#6366F1" />
      <stop offset="100%" stopColor="#A5B4FC" />
    </linearGradient>
    <linearGradient id="gradEquip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8B5CF6" />
      <stop offset="100%" stopColor="#C4B5FD" />
    </linearGradient>
    <linearGradient id="gradMat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#EC4899" />
      <stop offset="100%" stopColor="#F9A8D4" />
    </linearGradient>
    <linearGradient id="gradReac" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F59E0B" />
      <stop offset="100%" stopColor="#FDE68A" />
    </linearGradient>
    <linearGradient id="gradSust" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#10B981" />
      <stop offset="100%" stopColor="#6EE7B7" />
    </linearGradient>
  </defs>
);

export default function Estadisticas() {
  const [chartData, setChartData] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEstadisticasResumen()
      .then(setChartData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><Typography sx={{ p: 4 }}>Cargando estadísticas...</Typography></AppLayout>;

  const pedidosPorEstado = Object.entries(chartData?.resumen.pedidosPorEstado ?? {}).map(
    ([name, value]) => ({ name, value })
  );

  const totalPedidos = chartData?.resumen.totalPedidos ?? 0;
  const barChartHeight = 300;

  const CustomPieLabel = ({ cx, cy }: any) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} y={cy - 8} fontSize={28} fontWeight={700} fill="#0B1739">{totalPedidos}</tspan>
      <tspan x={cx} y={cy + 16} fontSize={13} fill="#64748B">pedidos</tspan>
    </text>
  );

  const tooltipSx = { bgcolor: '#1E293B', color: '#fff', px: 1.5, py: 1, borderRadius: 1, fontSize: 13, maxWidth: 260 };

  const PedidosTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const total = pedidosPorEstado.reduce((s: number, p: any) => s + p.value, 0);
    const pct = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : '0';
    return (
      <Box sx={tooltipSx}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{payload[0].name}</Typography>
        <Typography variant="body2">{payload[0].value} pedidos ({pct}%)</Typography>
      </Box>
    );
  };

  const BarTooltip = ({ active, payload, label, suffix = '' }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <Box sx={tooltipSx}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.3 }}>{label || payload[0].payload?.nombre || payload[0].name}</Typography>
        {payload.map((entry: any, i: number) => (
          <Typography key={i} variant="body2">
            {entry.name}: {entry.value} {suffix}
          </Typography>
        ))}
      </Box>
    );
  };

  const EquiposTooltip = (props: any) => <BarTooltip {...props} suffix="usos" />;
  const MaterialesTooltip = (props: any) => <BarTooltip {...props} suffix="unidades" />;
  const ReactivosTooltip = (props: any) => <BarTooltip {...props} suffix="ml/gr" />;
  const SustanciasTooltip = (props: any) => <BarTooltip {...props} suffix="unidades" />;
  const DescarteTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <Box sx={tooltipSx}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.3 }}>{label || payload[0]?.payload?.nombre}</Typography>
        <Typography variant="body2">Cantidad descartada: {payload[0]?.value}</Typography>
      </Box>
    );
  };

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739', mb: 1 }}>Estadísticas de Uso</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Resumen semanal y general del sistema</Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <EventNoteIcon sx={{ fontSize: 40, color: '#6366F1', mb: 1 }} />
              <Typography variant="h3" color="primary">{chartData?.semanal.pedidos || 0}</Typography>
              <Typography color="text.secondary">Pedidos esta semana</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <ScienceIcon sx={{ fontSize: 40, color: '#8B5CF6', mb: 1 }} />
              <Typography variant="h3" color="secondary">{chartData?.semanal.usosEquipo || 0}</Typography>
              <Typography color="text.secondary">Usos de equipo esta semana</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 40, color: '#F59E0B', mb: 1 }} />
              <Typography variant="h3" color="warning.main">{chartData?.semanal.movimientos || 0}</Typography>
              <Typography color="text.secondary">Movimientos esta semana</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`Total pedidos: ${totalPedidos}`} variant="outlined" />
          {chartData?.totalDescarte ? <Chip label={`Descarte total: ${chartData.totalDescarte}`} color="error" variant="outlined" /> : null}
          {pedidosPorEstado.map(({ name, value }) => (
            <Chip key={name} label={`${name}: ${value}`} sx={{ bgcolor: ESTADO_COLORS[name], color: '#fff' }} />
          ))}
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Pedidos por estado</Typography>
                <ResponsiveContainer width="100%" height={barChartHeight}>
                  <PieChart>
                    <Pie data={pedidosPorEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3} labelLine={false} label={CustomPieLabel} isAnimationActive={true} animationDuration={1200}>
                      {pedidosPorEstado.map((entry) => (
                        <Cell key={entry.name} fill={ESTADO_COLORS[entry.name] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip content={<PedidosTooltip />} />
                    <Legend iconType="circle" formatter={(value: string) => <span style={{ color: '#334155', fontSize: 13 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Laboratorios más usados</Typography>
                <ResponsiveContainer width="100%" height={barChartHeight}>
                  <BarChart data={chartData?.laboratoriosMasUsados ?? []} layout="vertical" margin={{ left: 80, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip content={<BarTooltip />} />
                    <Gradients />
                    <Bar dataKey="count" name="Pedidos" fill="url(#gradLab)" radius={[0, 4, 4, 0]} animationDuration={BAR_ANIMATION_DURATION} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Equipos más usados</Typography>
                <ResponsiveContainer width="100%" height={barChartHeight}>
                  <BarChart data={chartData?.equiposMasUsados ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<EquiposTooltip />} />
                    <Gradients />
                    <Bar dataKey="usos" name="Usos" fill="url(#gradEquip)" radius={[4, 4, 0, 0]} animationDuration={BAR_ANIMATION_DURATION} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Materiales más utilizados</Typography>
                <ResponsiveContainer width="100%" height={barChartHeight}>
                  <BarChart data={chartData?.materialesMasUsados ?? []} margin={{ right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<MaterialesTooltip />} />
                    <Gradients />
                    <Bar dataKey="cantidad" name="Cantidad" fill="url(#gradMat)" radius={[4, 4, 0, 0]} animationDuration={BAR_ANIMATION_DURATION} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Reactivos más consumidos</Typography>
                <ResponsiveContainer width="100%" height={barChartHeight}>
                  <BarChart data={chartData?.reactivosMasUsados ?? []} margin={{ right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ReactivosTooltip />} />
                    <Gradients />
                    <Bar dataKey="cantidad" name="Cantidad" fill="url(#gradReac)" radius={[4, 4, 0, 0]} animationDuration={BAR_ANIMATION_DURATION} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {chartData && chartData.materialesDescartados && chartData.materialesDescartados.length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Materiales Descartados</Typography>
                  <ResponsiveContainer width="100%" height={barChartHeight}>
                    <BarChart data={chartData.materialesDescartados} margin={{ right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip content={<DescarteTooltip />} />
                      <Bar dataKey="cantidad" name="Cantidad" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          {chartData && chartData.reactivosDescartados && chartData.reactivosDescartados.length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Reactivos Descartados</Typography>
                  <ResponsiveContainer width="100%" height={barChartHeight}>
                    <BarChart data={chartData.reactivosDescartados} margin={{ right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip content={<DescarteTooltip />} />
                      <Bar dataKey="cantidad" name="Cantidad" fill="#F97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>Sustancias Básicas</Typography>
                <ResponsiveContainer width="100%" height={barChartHeight}>
                  <BarChart data={chartData?.sustanciasMasUsadas ?? []} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" width={60} tick={{ fontSize: 9 }} />
                    <Tooltip content={<SustanciasTooltip />} />
                    <Gradients />
                    <Bar dataKey="cantidad" name="Cantidad" fill="url(#gradSust)" radius={[0, 4, 4, 0]} animationDuration={BAR_ANIMATION_DURATION} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  );
}
