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
              primary={`${pedido.horario} - ${pedido.laboratorioNombre}`}
              secondary={`Alumnos: ${pedido.alumnos} | Estado: ${pedido.estado}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}