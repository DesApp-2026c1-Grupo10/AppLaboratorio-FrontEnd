import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Close as CloseIcon } from '@mui/icons-material';
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

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMonthWeeks(refDate: Date) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const endPad = lastDay.getDay() === 0 ? 0 : 7 - lastDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - startPad);
  const totalDays = startPad + lastDay.getDate() + endPad;
  const days: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(localDateStr(d));
  }
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return { weeks, currentMonth: month };
}

function formatMonthYear(refDate: Date) {
  return refDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

interface AgendaPedido {
  id: number;
  horario: string;
  laboratorioNombre: string;
  alumnos: number;
  fecha: string;
  usuarioId: number;
  docente: string;
  estado: string;
}

export default function Agenda() {
  const [pedidos, setPedidos] = useState<AgendaPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState<number | 'todos'>('todos');
  const [monthOffset, setMonthOffset] = useState(0);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const monthRefDate = new Date();
  monthRefDate.setMonth(monthRefDate.getMonth() + monthOffset);
  const { weeks: monthWeeks, currentMonth } = getMonthWeeks(monthRefDate);

  const usuarioLogueado: Usuario | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch { return null; }
  })();

  const esAdmin = usuarioLogueado?.rol === 'Desarrollador';
  const esProfesor = usuarioLogueado?.rol === 'Profesor';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, users] = await Promise.all([getPedidos(), getUsuarios()]);
      setUsuarios(users);
      const aprobados = data
        .filter((p: Pedido) => p.estado === 'Aprobado' || p.estado === 'Finalizado')
        .map((p: Pedido) => ({
          id: p.id,
          horario: `${formatTime(p.horaInicio)} - ${formatTime(p.horaFin)}`,
          laboratorioNombre: p.Laboratorio?.nombre || 'Sin nombre',
          alumnos: p.cantidadAlumnos,
          fecha: p.fecha,
          usuarioId: p.usuarioId,
          docente: p.Usuario ? `${p.Usuario.nombre} ${p.Usuario.apellido || ''}`.trim() : '—',
          estado: p.estado,
        }));
      setPedidos(aprobados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pedidosFiltrados = pedidos.filter((p) => {
    if (esProfesor) return p.usuarioId === usuarioLogueado?.id;
    if (esAdmin && filtroUsuario !== 'todos') return p.usuarioId === filtroUsuario;
    return true;
  });

  const hoy = localDateStr(new Date());

  return (
    <AppLayout>
      <Box sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739' }}>
            Agenda de Laboratorios
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setMonthOffset(mo => mo - 1)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <ChevronLeft fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 160, textAlign: 'center' }}>
                {formatMonthYear(monthRefDate)}
              </Typography>
              <IconButton size="small" onClick={() => setMonthOffset(mo => mo + 1)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <ChevronRight fontSize="small" />
              </IconButton>
              {monthOffset !== 0 && (
                <IconButton size="small" onClick={() => setMonthOffset(0)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, ml: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, px: 0.5 }}>Hoy</Typography>
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Clases aprobadas y finalizadas — {formatMonthYear(monthRefDate)}
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
          <Box>
            <Box sx={{ display: 'flex', mb: 0.5 }}>
              {DIAS.map((d) => (
                <Box key={d} sx={{ flex: 1, textAlign: 'center', py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>{d}</Typography>
                </Box>
              ))}
            </Box>
            {monthWeeks.map((week, wi) => (
              <Box key={wi} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                {week.map((fecha) => {
                  const pedidosDelDia = pedidosFiltrados.filter((p) => p.fecha === fecha).sort((a, b) => a.horario.localeCompare(b.horario));
                  const esHoy = fecha === hoy;
                  const dayNum = new Date(fecha + 'T00:00:00').getDate();
                  const esMesActual = new Date(fecha + 'T00:00:00').getMonth() === currentMonth;
                  const tieneClases = pedidosDelDia.length > 0;
                  return (
                    <Box key={fecha} onClick={() => tieneClases && setDiaSeleccionado(fecha)}
                      sx={{
                        flex: 1, minHeight: 120, border: esHoy ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        borderRadius: 2, bgcolor: esHoy ? '#f0f7ff' : esMesActual ? (tieneClases ? '#FFF3E0' : 'white') : '#f5f5f5',
                        opacity: esMesActual ? 1 : 0.5, p: 1, overflow: 'hidden',
                        cursor: tieneClases ? 'pointer' : 'default',
                        transition: 'box-shadow 0.15s',
                        '&:hover': tieneClases ? { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } : {},
                      }}>
                      <Typography variant="body2" sx={{ fontWeight: esHoy ? 800 : 600, color: esHoy ? 'primary.main' : 'text.secondary', display: 'block', mb: 0.5 }}>
                        {dayNum}
                      </Typography>
                      {pedidosDelDia.map((p) => (
                        <Box key={p.id} sx={{ bgcolor: p.estado === 'Finalizado' ? '#e0e0e0' : '#FFCC80', borderRadius: 1, px: 0.5, py: 0.3, mb: 0.3, fontSize: 10, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Box component="span" sx={{ fontWeight: 600 }}>{p.horario}</Box>
                          <Box component="span" sx={{ ml: 0.3 }}>{p.laboratorioNombre}</Box>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}

        <Dialog open={!!diaSeleccionado} onClose={() => setDiaSeleccionado(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {diaSeleccionado ? formatDateDisplay(diaSeleccionado) : ''}
            </Typography>
            <IconButton size="small" onClick={() => setDiaSeleccionado(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {diaSeleccionado && (() => {
              const pedidosDelDia = pedidosFiltrados.filter((p) => p.fecha === diaSeleccionado).sort((a, b) => a.horario.localeCompare(b.horario));
              return pedidosDelDia.map((p) => (
                <Card key={p.id} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', '&:last-child': { mb: 0 } }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{p.horario}</Typography>
                      <Chip label={p.estado} size="small" color={p.estado === 'Aprobado' ? 'success' : 'info'} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{p.laboratorioNombre}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${p.alumnos} alumnos`} size="small" sx={{ height: 20, fontSize: 11 }} />
                      {esAdmin && <Chip label={p.docente} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
                    </Box>
                  </CardContent>
                </Card>
              ));
            })()}
          </DialogContent>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
