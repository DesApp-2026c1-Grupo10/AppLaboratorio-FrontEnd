import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box,
} from '@mui/material';
import type { Material } from '../../types/material';
import type { Laboratorio } from '../../types/laboratorio';

interface MaterialDialogProps {
  open: boolean;
  editing: Material | null;
  laboratorios: Laboratorio[];
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function MaterialDialog({ open, editing, laboratorios, onSave, onClose }: MaterialDialogProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', descripcion: '', stock: 0, stockMinimo: 0, unit: '', laboratorioId: '' },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          name: editing.name, descripcion: editing.descripcion || '', stock: editing.stock,
          stockMinimo: editing.stockMinimo, unit: editing.unit || '', laboratorioId: String(editing.laboratorioId || ''),
        });
      } else {
        reset({ name: '', descripcion: '', stock: 0, stockMinimo: 0, unit: '', laboratorioId: '' });
      }
    }
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" {...register('name', { required: 'El nombre es obligatorio' })} error={!!errors.name} helperText={errors.name?.message} fullWidth />
            <TextField label="Descripción" {...register('descripcion')} fullWidth multiline rows={2} />
            <TextField label="Stock" type="number" {...register('stock', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stock} helperText={errors.stock?.message} fullWidth />
            <TextField label="Stock Mínimo" type="number" {...register('stockMinimo', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stockMinimo} helperText={errors.stockMinimo?.message} fullWidth />
            <TextField label="Unidad" {...register('unit')} fullWidth />
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
