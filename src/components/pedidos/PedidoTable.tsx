import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import type{ Pedido } from '../../types/pedido';

interface Props {
  pedidos: Pedido[];
  aceptarPedido: (id: number) => void;
  rechazarPedido: (id: number) => void;
}

export default function PedidoTable({
  pedidos,
  aceptarPedido,
  rechazarPedido,
}: Props) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Fecha</TableCell>
          <TableCell>Horario</TableCell>
          <TableCell>Laboratorio</TableCell>
          <TableCell>Alumnos</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Acciones</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {pedidos.map((pedido) => (
          <TableRow key={pedido.id}>
            <TableCell>{pedido.fecha}</TableCell>
            <TableCell>
              {pedido.horaInicio}
              {" - "}
              {pedido.horaFin}
            </TableCell>
            <TableCell>{pedido.Laboratorio?.nombre}</TableCell>
            <TableCell>{pedido.cantidadAlumnos}</TableCell>
            <TableCell>{pedido.estado}</TableCell>
            <TableCell>
              <Button onClick={() => aceptarPedido(pedido.id)}>
                Aceptar
              </Button>

              <Button onClick={() => rechazarPedido(pedido.id)}>
                Rechazar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}