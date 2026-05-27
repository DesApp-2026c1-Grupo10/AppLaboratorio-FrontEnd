import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Grid } from '@mui/material';
import AppLayout from '../components/layout/AppLayout';
import { getPedidos } from '../api/pedidos';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDays() {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  return DIAS.map((_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return localDateStr(d);
  });
}

export default function Agenda() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const weekDays = getWeekDays();

  useEffect(() => {
    async function load() {
      try {
        const data = await getPedidos();
        const aprobados = data
          .filter((p: any) => p.estado === 'Aprobado')
          .map((p: any) => ({
            id: p.id,
            horario: `${p.horaInicio} - ${p.horaFin}`,
            laboratorioNombre: p.Laboratorio?.nombre || 'Sin nombre',
            alumnos: p.cantidadAlumnos,
            fecha: p.fecha,
          }));
        setPedidos(aprobados);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hoy = localDateStr(new Date());

  return (
    <AppLayout>
      <Box sx={{ p: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739', mb: 1 }}>
          Agenda de Laboratorios
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Clases aprobadas — Semana del {weekDays[0]} al {weekDays[6]}
        </Typography>

        {loading ? (
          <Typography>Cargando...</Typography>
        ) : (
          <Grid container spacing={1.5}>
            {weekDays.map((fecha, i) => {
              const pedidosDelDia = pedidos.filter((p) => p.fecha === fecha).sort((a, b) => a.horario.localeCompare(b.horario));
              const esHoy = fecha === hoy;
              return (
                <Grid key={fecha} size={{ xs: 12, sm: 6, md: 12 / 7 }}>
                  <Card
                    sx={{
                      minHeight: 200,
                      border: esHoy ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      bgcolor: esHoy ? '#f0f7ff' : 'white',
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {DIAS[i]}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          {fecha}
                        </Typography>
                      </Typography>
                      {pedidosDelDia.length === 0 ? (
                        <Typography variant="caption" color="text.disabled">Sin clases</Typography>
                      ) : (
                        pedidosDelDia.map((p) => (
                          <Box
                            key={p.id}
                            sx={{
                              bgcolor: '#e3f2fd',
                              borderRadius: 1,
                              p: 0.8,
                              mb: 0.8,
                              borderLeft: '3px solid #1976d2',
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                              {p.horario}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {p.laboratorioNombre}
                            </Typography>
                            <Chip label={`${p.alumnos} alumnos`} size="small" sx={{ height: 18, fontSize: 10, mt: 0.3 }} />
                          </Box>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
}
