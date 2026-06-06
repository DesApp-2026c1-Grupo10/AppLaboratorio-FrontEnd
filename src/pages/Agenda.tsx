import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AppLayout from '../components/layout/AppLayout';
import { getPedidos } from '../api/pedidos';
import { getUsuarios } from '../api/usuarios';
import { formatTime } from '../utils/format';
import type { Usuario } from '../types/usuario';
import type { Pedido } from '../types/pedido';

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

interface AgendaPedido {
  id: number;
  horario: string;
  laboratorioNombre: string;
  alumnos: number;
  fecha: string;
  usuarioId: number;
  docente: string;
}

export default function Agenda() {
  const [pedidos, setPedidos] = useState<AgendaPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState<number | 'todos'>('todos');
  const weekDays = getWeekDays();

  const usuarioLogueado: Usuario | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch { return null; }
  })();

  const esAdmin = usuarioLogueado?.rol === 'Desarrollador';
  const esProfesor = usuarioLogueado?.rol === 'Profesor';

  useEffect(() => {
    async function load() {
      try {
        const [data, users] = await Promise.all([getPedidos(), getUsuarios()]);
        setUsuarios(users);
        const aprobados = data
          .filter((p: Pedido) => p.estado === 'Aprobado')
          .map((p: Pedido) => ({
            id: p.id,
            horario: `${formatTime(p.horaInicio)} - ${formatTime(p.horaFin)}`,
            laboratorioNombre: p.Laboratorio?.nombre || 'Sin nombre',
            alumnos: p.cantidadAlumnos,
            fecha: p.fecha,
            usuarioId: p.usuarioId,
            docente: p.Usuario ? `${p.Usuario.nombre} ${p.Usuario.apellido || ''}`.trim() : '—',
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

  const pedidosFiltrados = pedidos.filter((p) => {
    if (esProfesor) return p.usuarioId === usuarioLogueado?.id;
    if (esAdmin && filtroUsuario !== 'todos') return p.usuarioId === filtroUsuario;
    return true;
  });

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

        {esAdmin && (
          <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
            <InputLabel>Filtrar por docente</InputLabel>
            <Select
              value={filtroUsuario}
              label="Filtrar por docente"
              onChange={(e) => setFiltroUsuario(e.target.value as number | 'todos')}
            >
              <MenuItem value="todos">Todos los docentes</MenuItem>
              {usuarios.filter((u) => u.rol === 'Profesor' || u.rol === 'Desarrollador').map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.nombre} {u.apellido || ''} ({u.rol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {loading ? (
          <Typography>Cargando...</Typography>
        ) : (
          <Grid container spacing={1.5}>
            {weekDays.map((fecha, i) => {
              const pedidosDelDia = pedidosFiltrados.filter((p) => p.fecha === fecha).sort((a, b) => a.horario.localeCompare(b.horario));
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
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
                              <Chip label={`${p.alumnos} alumnos`} size="small" sx={{ height: 18, fontSize: 10 }} />
                              {esAdmin && (
                                <Chip label={p.docente} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                              )}
                            </Box>
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
