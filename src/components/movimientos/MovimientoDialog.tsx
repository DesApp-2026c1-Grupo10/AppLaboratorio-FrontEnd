import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { Material } from '../../types/material';
import type { Reactivo } from '../../types/reactivo';

interface MovimientoDialogProps {
  open: boolean;
  materiales: Material[];
  reactivos: Reactivo[];
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function MovimientoDialog({ open, materiales, reactivos, onSave, onClose }: MovimientoDialogProps) {
  const [tipoItem, setTipoItem] = useState<'material' | 'reactivo'>('material');
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { tipoMovimiento: 'entrada' as 'entrada' | 'salida', cantidad: 1, fecha: new Date().toISOString().split('T')[0], observacion: '', materialId: '', reactivoId: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ tipoMovimiento: 'entrada', cantidad: 1, fecha: new Date().toISOString().split('T')[0], observacion: '', materialId: '', reactivoId: '' });
      setTipoItem('material');
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Movimiento</DialogTitle>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Controller
              name="tipoMovimiento"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select {...field} label="Tipo de Movimiento">
                    <MenuItem value="entrada">Entrada</MenuItem>
                    <MenuItem value="salida">Salida</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Item</InputLabel>
              <Select value={tipoItem} label="Tipo de Item" onChange={(e) => { setTipoItem(e.target.value as 'material' | 'reactivo'); reset({ materialId: '', reactivoId: '' }); }}>
                <MenuItem value="material">Material</MenuItem>
                <MenuItem value="reactivo">Reactivo</MenuItem>
              </Select>
            </FormControl>
            {tipoItem === 'material' ? (
              <Controller
                name="materialId"
                control={control}
                rules={{ required: 'Seleccione un material' }}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Material</InputLabel>
                    <Select {...field} label="Material">
                      {materiales.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.name} (Stock: {m.stock})</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              />
            ) : (
              <Controller
                name="reactivoId"
                control={control}
                rules={{ required: 'Seleccione un reactivo' }}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Reactivo</InputLabel>
                    <Select {...field} label="Reactivo">
                      {reactivos.map((r) => <MenuItem key={r.id} value={String(r.id)}>{r.name} (Stock: {r.stock})</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              />
            )}
            <TextField label="Cantidad" type="number" {...register('cantidad', { valueAsNumber: true, min: { value: 1, message: 'Debe ser mayor a 0' } })} error={!!errors.cantidad} helperText={errors.cantidad?.message} fullWidth />
            <TextField label="Fecha" type="date" {...register('fecha')} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Observación" {...register('observacion')} fullWidth multiline rows={2} />
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
