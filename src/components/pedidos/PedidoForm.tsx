import {
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import { useForm } from 'react-hook-form';
import type{ Pedido } from '../../types/pedido';
import type{ Laboratorio } from '../../types/laboratorio';

interface Props {
  laboratorios: Laboratorio[];
  onSubmitPedido: (pedido: Pedido) => void;
}

export default function PedidoForm({
  laboratorios,
  onSubmitPedido,
}: Props) {
  const { register, handleSubmit, reset } = useForm<Pedido>();

  const onSubmit = (data: Pedido) => {
    onSubmitPedido({
      ...data,
      estado: 'Pendiente',
      usuarioId: 1,
    });

    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <TextField
          type="date"
          {...register('fecha', { required: true })}
        />

        <TextField
          label="Hora inicio"
          type="time"
          InputLabelProps={{
            shrink: true,
          }}
          {...register(
            'horaInicio',
            { required: true }
          )}
        />

        <TextField
          label="Hora fin"
          type="time"
          InputLabelProps={{
            shrink: true,
          }}
          {...register(
            'horaFin',
            { required: true }
          )}
        />

        <TextField
          label="Cantidad de alumnos"
          type="number"
          {...register(
            'cantidadAlumnos',
            {
              required: true,
              min: 1,
            }
          )}
        />

        <TextField
          select
          label="Laboratorio"
          {...register('laboratorioId', { required: true })}
        >
          {laboratorios.map((lab) => (
            <MenuItem key={lab.id} value={lab.id}>
              {lab.nombre}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Descripción"
          {...register(
            'descripcion',
            { required: true }
          )}
        />

        <Button type="submit" variant="contained">
          Crear pedido
        </Button>
      </Stack>
    </form>
  );
}