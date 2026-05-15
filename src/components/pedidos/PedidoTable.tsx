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
  
  // 1. Leemos el usuario guardado para saber su rol
  const usuarioStorage = localStorage.getItem('usuario');
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;
  
  // 2. Verificamos si tiene permisos (cualquiera que NO sea Alumno)
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
          
          {/* Condicionamos la cabecera de la columna */}
          {puedeAprobar && <TableCell>Acciones</TableCell>}
          
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
            
            {/* Condicionamos los botones de acción */}
            {puedeAprobar && (
              <TableCell>
                <Button 
                  onClick={() => aceptarPedido(pedido.id)} 
                  color="primary"
                >
                  Aceptar
                </Button>

                <Button 
                  onClick={() => rechazarPedido(pedido.id)} 
                  color="error"
                >
                  Rechazar
                </Button>
              </TableCell>
            )}
            
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}