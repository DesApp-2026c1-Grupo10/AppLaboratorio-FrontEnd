import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { Equipo } from '../../types/equipo';
import type { Laboratorio } from '../../types/laboratorio';

interface EquipoDialogProps {
  open: boolean;
  editing: Equipo | null;
  laboratorios: Laboratorio[];
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function EquipoDialog({ open, editing, laboratorios, onSave, onClose }: EquipoDialogProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', descripcion: '', status: 'Disponible', is_movable: 'false', bld_id: '', laboratorioId: '', ultimaRevision: '', observaciones: '' },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          name: editing.name, descripcion: editing.descripcion || '', status: editing.status,
          is_movable: String(editing.is_movable), bld_id: String(editing.bld_id || ''),
          laboratorioId: String(editing.laboratorioId || ''), ultimaRevision: editing.ultimaRevision || '',
          observaciones: editing.observaciones || '',
        });
      } else {
        reset({ name: '', descripcion: '', status: 'Disponible', is_movable: 'false', bld_id: '', laboratorioId: '', ultimaRevision: '', observaciones: '' });
      }
    }
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</DialogTitle>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" {...register('name', { required: 'El nombre es obligatorio' })} error={!!errors.name} helperText={errors.name?.message} fullWidth />
            <TextField label="Descripción" {...register('descripcion')} fullWidth multiline rows={2} />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select {...field} label="Estado">
                    <MenuItem value="Disponible">Disponible</MenuItem>
                    <MenuItem value="En uso">En uso</MenuItem>
                    <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                    <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <TextField label="Edificio (bld_id)" type="number" {...register('bld_id')} fullWidth />
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
            <Controller
              name="is_movable"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>¿Es movible?</InputLabel>
                  <Select {...field} label="¿Es movible?">
                    <MenuItem value="true">Sí</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <TextField label="Última Revisión" type="date" {...register('ultimaRevision')} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Observaciones" {...register('observaciones')} fullWidth multiline rows={2} />
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
