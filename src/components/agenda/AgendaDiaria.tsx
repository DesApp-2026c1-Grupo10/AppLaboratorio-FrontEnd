import {
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';

import type{ Pedido } from '../../types/pedido';

interface Props {
  pedidos: Pedido[];
}

export default function AgendaDiaria({ pedidos }: Props) {
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Agenda diaria
      </Typography>

      <List>
        {pedidos.map((pedido) => (
          <ListItem key={pedido.id}>
            <ListItemText
              primary={`${pedido.horaInicio} - ${pedido.horaFin} - ${pedido.Laboratorio?.nombre || 'Sin laboratorio'}`}
              secondary={`Alumnos: ${pedido.cantidadAlumnos} | Estado: ${pedido.estado}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}