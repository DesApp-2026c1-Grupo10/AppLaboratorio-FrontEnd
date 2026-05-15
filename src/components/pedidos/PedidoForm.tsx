import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';

import type { Pedido } from '../../types/pedido';

interface Props {
  onSubmitPedido: (data: Pedido) => void;
  laboratorios: any[]; // Lista de laboratorios reales para el menú desplegable
}

export default function PedidoForm({ onSubmitPedido, laboratorios }: Props) {
  const { register, handleSubmit, reset } = useForm<Pedido>();

  const onSubmit = (data: Pedido) => {
    onSubmitPedido({
      ...data,
      // Aseguramos que los valores numéricos se envíen correctamente
      cantidadAlumnos: Number(data.cantidadAlumnos),
      laboratorioId: Number(data.laboratorioId),
      estado: 'Pendiente',
    });

    reset();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mt: 2 }}
    >
      <TextField
        label="Fecha"
        type="date"
        InputLabelProps={{ shrink: true }}
        {...register('fecha', { required: true })}
        fullWidth
      />

      <TextField
        label="Hora Inicio (ej: 08:00)"
        placeholder="08:00"
        type="text"
        {...register('horaInicio', { required: true })}
        fullWidth
      />

      <TextField
        label="Hora Fin (ej: 10:00)"
        placeholder="10:00"
        type="text"
        {...register('horaFin', { required: true })}
        fullWidth
      />

      <TextField
        label="Cantidad de Alumnos"
        type="number"
        {...register('cantidadAlumnos', { required: true })}
        fullWidth
      />

      <FormControl fullWidth>
        <InputLabel id="laboratorio-select-label">Laboratorio</InputLabel>
        <Select
          labelId="laboratorio-select-label"
          label="Laboratorio"
          defaultValue=""
          {...register('laboratorioId', { required: true })}
        >
          {laboratorios.map((lab) => (
            <MenuItem key={lab.id} value={lab.id}>
              {lab.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button type="submit" variant="contained" color="primary" fullWidth>
        Crear Pedido
      </Button>
    </Box>
  );
}