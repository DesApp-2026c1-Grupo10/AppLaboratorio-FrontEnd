import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Paper, Grid,
} from '@mui/material';
import AppLayout from '../components/layout/AppLayout';
import { getEstadisticasResumen } from '../api/estadisticas';
import type { EstadisticasData } from '../types/estadisticas';

const estadoColors: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  Pendiente: 'warning',
  Aprobado: 'success',
  Rechazado: 'error',
  Finalizado: 'info',
  Cancelado: 'default',
};

export default function Estadisticas() {
  const [data, setData] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEstadisticasResumen()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><Typography sx={{ p: 4 }}>Cargando estadísticas...</Typography></AppLayout>;

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739', mb: 1 }}>Estadísticas de Uso</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Resumen semanal y general del sistema</Typography>

        {/* Resumen Semanal */}
        <Typography variant="h5" sx={{ mb: 2, mt: 2 }}>Resumen Semanal</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{data?.semanal.pedidos || 0}</Typography>
              <Typography color="text.secondary">Pedidos esta semana</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary">{data?.semanal.usosEquipo || 0}</Typography>
              <Typography color="text.secondary">Usos de equipo esta semana</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card><CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">{data?.semanal.movimientos || 0}</Typography>
              <Typography color="text.secondary">Movimientos esta semana</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        {/* Resumen General */}
        <Typography variant="h5" sx={{ mb: 2 }}>Resumen General</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`Total pedidos: ${data?.resumen.totalPedidos || 0}`} variant="outlined" />
          {data?.resumen.pedidosPorEstado && Object.entries(data.resumen.pedidosPorEstado).map(([est, count]) => (
            <Chip key={est} label={`${est}: ${count}`} color={estadoColors[est] || 'default'} />
          ))}
        </Box>

        <Grid container spacing={3}>
          {/* Laboratorios más usados */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Laboratorios más usados</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Laboratorio</TableCell>
                        <TableCell align="right">Pedidos</TableCell>
                        <TableCell align="right">Alumnos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.laboratoriosMasUsados.map((lab, i) => (
                        <TableRow key={lab.nombre}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{lab.nombre}</TableCell>
                          <TableCell align="right">{lab.count}</TableCell>
                          <TableCell align="right">{lab.alumnos}</TableCell>
                        </TableRow>
                      ))}
                      {(!data?.laboratoriosMasUsados || data.laboratoriosMasUsados.length === 0) && (
                        <TableRow><TableCell colSpan={4} align="center">Sin datos</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Equipos más usados */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Equipos más usados</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Equipo</TableCell>
                        <TableCell align="right">Usos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.equiposMasUsados.map((eq, i) => (
                        <TableRow key={eq.nombre}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{eq.nombre}</TableCell>
                          <TableCell align="right">{eq.usos}</TableCell>
                        </TableRow>
                      ))}
                      {(!data?.equiposMasUsados || data.equiposMasUsados.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">Sin datos</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Materiales más usados */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Materiales más utilizados</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Material</TableCell>
                        <TableCell align="right">Cantidad utilizada</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.materialesMasUsados.map((mat, i) => (
                        <TableRow key={mat.nombre}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{mat.nombre}</TableCell>
                          <TableCell align="right">{mat.cantidad}</TableCell>
                        </TableRow>
                      ))}
                      {(!data?.materialesMasUsados || data.materialesMasUsados.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">Sin datos</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Sustancias básicas más consumidas */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Sustancias Básicas más consumidas</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Sustancia</TableCell>
                        <TableCell align="right">Cantidad consumida</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(data?.sustanciasMasUsadas ?? []).map((s, i) => (
                        <TableRow key={s.nombre}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{s.nombre}</TableCell>
                          <TableCell align="right">{s.cantidad}</TableCell>
                        </TableRow>
                      ))}
                      {(!data?.sustanciasMasUsadas || data.sustanciasMasUsadas.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">Sin datos</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Reactivos más usados */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Reactivos más consumidos</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Reactivo</TableCell>
                        <TableCell align="right">Cantidad consumida</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.reactivosMasUsados.map((rea, i) => (
                        <TableRow key={rea.nombre}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{rea.nombre}</TableCell>
                          <TableCell align="right">{rea.cantidad}</TableCell>
                        </TableRow>
                      ))}
                      {(!data?.reactivosMasUsados || data.reactivosMasUsados.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">Sin datos</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  );
}
