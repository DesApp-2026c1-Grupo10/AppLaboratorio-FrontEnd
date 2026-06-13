import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Chip, Table, TableBody, TableCell, TableRow,
  Checkbox, FormControlLabel, FormGroup, CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import EstadoChip from './EstadoChip';
import type { Pedido } from '../../types/pedido';
import type { Tarea } from '../../types/tarea';
import { getTareas, toggleTarea } from '../../api/pedidos';
import { formatTime } from '../../utils/format';

interface Props {
  open: boolean;
  pedido: Pedido | null;
  onClose: () => void;
}

export default function DetallePedidoDialog({ open, pedido, onClose }: Props) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);

  useEffect(() => {
    if (open && pedido) {
      setLoadingTareas(true);
      getTareas(pedido.id).then(setTareas).finally(() => setLoadingTareas(false));
    } else {
      setTareas([]);
    }
  }, [open, pedido]);

  const handleToggle = async (tarea: Tarea) => {
    if (!pedido) return;
    const updated = await toggleTarea(pedido.id, tarea.id);
    setTareas((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Pedido #{pedido.id}
        <Box component="span" sx={{ ml: 2, display: 'inline-block' }}><EstadoChip estado={pedido.estado} /></Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Fecha y Horario</Typography>
            <Typography>{pedido.fecha?.split('-')?.reverse()?.join('/')} | {formatTime(pedido.horaInicio)} - {formatTime(pedido.horaFin)}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Laboratorio</Typography>
            <Typography>{pedido.Laboratorio?.nombre || '-'}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Cantidad de Alumnos</Typography>
            <Typography>{pedido.cantidadAlumnos}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Solicitante</Typography>
            <Typography>{pedido.Usuario ? `${pedido.Usuario.nombre} ${pedido.Usuario.apellido}` : '-'}</Typography>
          </Box>

          {pedido.descripcion && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
              <Typography style={{ whiteSpace: 'pre-wrap' }}>{pedido.descripcion}</Typography>
            </Box>
          )}

          {pedido.materiales && pedido.materiales.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Materiales Solicitados</Typography>
              <Table size="small">
                <TableBody>
                  {pedido.materiales.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>Cant: {m.PedidoMaterial?.cantidad || 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={`Stock: ${m.stock}`}
                          size="small"
                          color={m.stock < (m.PedidoMaterial?.cantidad || 1) ? 'error' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {pedido.reactivos && pedido.reactivos.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Reactivos Solicitados</Typography>
              <Table size="small">
                <TableBody>
                  {pedido.reactivos.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>Cant: {r.PedidoReactivo?.cantidad || 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={`Stock: ${r.stock}`}
                          size="small"
                          color={r.stock < (r.PedidoReactivo?.cantidad || 1) ? 'error' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {pedido.Equipments && pedido.Equipments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Equipos Solicitados</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {pedido.Equipments.map((eq) => (
                  <Chip key={eq.id} label={eq.name} size="small" />
                ))}
              </Box>
            </Box>
          )}

          {loadingTareas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : tareas.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Checklist</Typography>
              <FormGroup>
                {tareas.map((t) => (
                  <FormControlLabel
                    key={t.id}
                    control={
                      <Checkbox
                        checked={t.completada}
                        onChange={() => handleToggle(t)}
                        size="small"
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: t.completada ? 'line-through' : 'none',
                          color: t.completada ? 'text.disabled' : 'text.primary',
                        }}
                      >
                        {t.descripcion}
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
