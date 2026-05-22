import {
  Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Box, Typography, Stack,
} from '@mui/material';
import type { Pedido } from '../../types/pedido';

const estadoColor: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  Pendiente: 'warning', Aprobado: 'success', Rechazado: 'error', Finalizado: 'info',
};

interface Props {
  pedidos: Pedido[];
  aceptarPedido: (id: number) => void;
  rechazarPedido: (id: number) => void;
  finalizarPedido: (id: number) => void;
}

export default function PedidoTable({ pedidos, aceptarPedido, rechazarPedido, finalizarPedido }: Props) {
  const usuarioStorage = localStorage.getItem('usuario');
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;
  const puedeAprobar = usuarioLogueado && usuarioLogueado.rol !== 'Alumno';

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Fecha</TableCell>
          <TableCell>Horario</TableCell>
          <TableCell>Laboratorio</TableCell>
          <TableCell>Alumnos</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Recursos</TableCell>
          {puedeAprobar && <TableCell>Acciones</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {pedidos.map((pedido) => (
          <TableRow key={pedido.id}>
            <TableCell>{pedido.fecha}</TableCell>
            <TableCell>{pedido.horaInicio} - {pedido.horaFin}</TableCell>
            <TableCell>{pedido.Laboratorio?.nombre}</TableCell>
            <TableCell>{pedido.cantidadAlumnos}</TableCell>
            <TableCell>
              <Chip label={pedido.estado} color={estadoColor[pedido.estado] || 'default'} size="small" />
            </TableCell>
            <TableCell>
              <Stack spacing={0.5}>
                {pedido.materiales && pedido.materiales.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Materiales:</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {pedido.materiales.map((m) => (
                        <Chip key={m.id} label={`${m.name} x${m.PedidoMaterial?.cantidad || 1}`} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
                {pedido.reactivos && pedido.reactivos.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Reactivos:</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {pedido.reactivos.map((r) => (
                        <Chip key={r.id} label={`${r.name} x${r.PedidoReactivo?.cantidad || 1}`} size="small" variant="outlined" color="secondary" />
                      ))}
                    </Stack>
                  </Box>
                )}
                {pedido.Equipments && pedido.Equipments.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Equipos:</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {pedido.Equipments.map((eq) => (
                        <Chip key={eq.id} label={eq.name} size="small" variant="outlined" color="primary" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </TableCell>
            {puedeAprobar && (
              <TableCell>
                {pedido.estado === 'Pendiente' && (
                  <>
                    <Button onClick={() => aceptarPedido(pedido.id)} color="primary" size="small">Aprobar</Button>
                    <Button onClick={() => rechazarPedido(pedido.id)} color="error" size="small">Rechazar</Button>
                  </>
                )}
                {pedido.estado === 'Aprobado' && (
                  <Button onClick={() => finalizarPedido(pedido.id)} color="success" size="small" variant="contained">Finalizar</Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
