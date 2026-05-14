import { useForm } from 'react-hook-form';
import { TextField, Button, Stack } from '@mui/material';
import type{ Laboratorio } from '../../types/laboratorio';

interface Props {
  onSubmitLaboratorio: (data: Laboratorio) => void;
}

export default function LaboratorioForm({ onSubmitLaboratorio }: Props) {
  const { register, handleSubmit, reset } = useForm<Laboratorio>();

  const onSubmit = (data: Laboratorio) => {
    onSubmitLaboratorio(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <TextField
          label="Nombre"
          {...register('nombre', { required: true })}
        />

        <TextField
          label="Capacidad"
          type="number"
          {...register('capacidad', { required: true })}
        />

        <TextField
          label="Edificio"
          {...register('edificio', { required: true })}
        />

        <Button type="submit" variant="contained">
          Guardar
        </Button>
      </Stack>
    </form>
  );
}