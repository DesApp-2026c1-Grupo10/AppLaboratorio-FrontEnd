import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box,
} from '@mui/material';
import type { Reactivo } from '../../types/reactivo';
import type { Laboratorio } from '../../types/laboratorio';

interface ReactivoDialogProps {
  open: boolean;
  editing: Reactivo | null;
  laboratorios: Laboratorio[];
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function ReactivoDialog({ open, editing, laboratorios, onSave, onClose }: ReactivoDialogProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', descripcion: '', stock: 0, unidadMedida: '', vencimiento: '', prep_time: 0, laboratorioId: '' },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          name: editing.name, descripcion: editing.descripcion || '', stock: editing.stock,
          unidadMedida: editing.unidadMedida || '', vencimiento: editing.vencimiento || '',
          prep_time: editing.prep_time, laboratorioId: String(editing.laboratorioId || ''),
        });
      } else {
        reset({ name: '', descripcion: '', stock: 0, unidadMedida: '', vencimiento: '', prep_time: 0, laboratorioId: '' });
      }
    }
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Editar Reactivo' : 'Nuevo Reactivo'}</DialogTitle>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" {...register('name', { required: 'El nombre es obligatorio' })} error={!!errors.name} helperText={errors.name?.message} fullWidth />
            <TextField label="Descripción" {...register('descripcion')} fullWidth multiline rows={2} />
            <TextField label="Stock" type="number" {...register('stock', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stock} helperText={errors.stock?.message} fullWidth />
            <TextField label="Unidad de Medida" {...register('unidadMedida')} fullWidth />
            <TextField label="Vencimiento" type="date" {...register('vencimiento')} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Tiempo de Preparación (min)" type="number" {...register('prep_time', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.prep_time} helperText={errors.prep_time?.message} fullWidth />
            <Controller
              name="laboratorioId"
              control={control}
              render={({ field }) => (
                <TextField label="Laboratorio" select {...field} fullWidth slotProps={{ select: { native: true } }}>
                  <option value="">Sin laboratorio</option>
                  {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </TextField>
              )}
            />
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
