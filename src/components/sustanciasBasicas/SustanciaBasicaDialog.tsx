import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box,
} from '@mui/material';
import type { SustanciaBasica } from '../../types/sustanciaBasica';

interface Props {
  open: boolean;
  editing: SustanciaBasica | null;
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function SustanciaBasicaDialog({ open, editing, onSave, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', descripcion: '', stock: 0, stockMinimo: 0, unidadMedida: '' },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          name: editing.name, descripcion: editing.descripcion || '', stock: editing.stock,
          stockMinimo: editing.stockMinimo, unidadMedida: editing.unidadMedida || '',
        });
      } else {
        reset({ name: '', descripcion: '', stock: 0, stockMinimo: 0, unidadMedida: '' });
      }
    }
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Editar Sustancia Básica' : 'Nueva Sustancia Básica'}</DialogTitle>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" {...register('name', { required: 'El nombre es obligatorio' })} error={!!errors.name} helperText={errors.name?.message} fullWidth />
            <TextField label="Descripción" {...register('descripcion')} fullWidth multiline rows={2} />
            <TextField label="Stock" type="number" {...register('stock', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stock} helperText={errors.stock?.message} fullWidth />
            <TextField label="Stock Mínimo" type="number" {...register('stockMinimo', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stockMinimo} helperText={errors.stockMinimo?.message} fullWidth />
            <TextField label="Unidad de Medida" {...register('unidadMedida')} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" type="submit">Guardar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
