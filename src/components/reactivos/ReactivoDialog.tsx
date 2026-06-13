import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, IconButton, MenuItem, Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Reactivo } from '../../types/reactivo';
import type { SustanciaBasica } from '../../types/sustanciaBasica';
import type { Laboratorio } from '../../types/laboratorio';
import { getSustanciasBasicas } from '../../api/sustanciasBasicas';

interface ComposicionEntry {
  sustanciaBasicaId: number | '';
  porcentaje: number;
}

interface ReactivoDialogProps {
  open: boolean;
  editing: Reactivo | null;
  laboratorios: Laboratorio[];
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function ReactivoDialog({ open, editing, laboratorios, onSave, onClose }: ReactivoDialogProps) {
  const [sustancias, setSustancias] = useState<SustanciaBasica[]>([]);
  const [composicion, setComposicion] = useState<ComposicionEntry[]>([]);
  const [compError, setCompError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', descripcion: '', stock: 0, stockMinimo: 0, unidadMedida: '', vencimiento: '', prep_time: 0, laboratorioId: '' },
  });

  useEffect(() => {
    if (open) {
      getSustanciasBasicas().then(setSustancias).catch(console.error);
      if (editing) {
        reset({
          name: editing.name, descripcion: editing.descripcion || '', stock: editing.stock,
          stockMinimo: editing.stockMinimo, unidadMedida: editing.unidadMedida || '', vencimiento: editing.vencimiento || '',
          prep_time: editing.prep_time, laboratorioId: String(editing.laboratorioId || ''),
        });
        setComposicion(
          (editing.composicion || []).map((c) => ({
            sustanciaBasicaId: c.id,
            porcentaje: c.ReactivoSustancia.porcentaje,
          }))
        );
      } else {
        reset({ name: '', descripcion: '', stock: 0, stockMinimo: 0, unidadMedida: '', vencimiento: '', prep_time: 0, laboratorioId: '' });
        setComposicion([]);
      }
      setCompError('');
    }
  }, [open, editing, reset]);

  const agregarCompuesto = () => {
    setComposicion([...composicion, { sustanciaBasicaId: '', porcentaje: 0 }]);
  };

  const actualizarCompuesto = (index: number, field: keyof ComposicionEntry, value: number | '') => {
    const nueva = [...composicion];
    nueva[index] = { ...nueva[index], [field]: value };
    setComposicion(nueva);
  };

  const quitarCompuesto = (index: number) => {
    setComposicion(composicion.filter((_, i) => i !== index));
  };

  const disponibles = (index: number) =>
    sustancias.filter((s) => !composicion.some((c, i) => i !== index && c.sustanciaBasicaId === s.id));

  const sumaTotal = composicion.reduce((acc, c) => acc + (c.porcentaje || 0), 0);

  const handleLocalSave = (data: Record<string, any>) => {
    if (composicion.length > 0) {
      if (Math.abs(sumaTotal - 100) > 0.01) {
        setCompError(`La suma de porcentajes debe ser 100% (actual: ${sumaTotal}%)`);
        return;
      }
      const idsValidos = composicion.every((c) => c.sustanciaBasicaId !== '');
      if (!idsValidos) {
        setCompError('Seleccioná todas las sustancias');
        return;
      }
    }
    const payload = {
      ...data,
      composicion: composicion.map((c) => ({
        sustanciaBasicaId: Number(c.sustanciaBasicaId),
        porcentaje: c.porcentaje,
      })),
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Editar Reactivo' : 'Nuevo Reactivo'}</DialogTitle>
      <form onSubmit={handleSubmit(handleLocalSave)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre *" {...register('name', { required: 'El nombre es obligatorio' })} error={!!errors.name} helperText={errors.name?.message} fullWidth />
            <TextField label="Descripción" {...register('descripcion')} fullWidth multiline rows={2} />
            <TextField label="Stock" type="number" {...register('stock', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stock} helperText={errors.stock?.message} fullWidth />
            <TextField label="Stock Mínimo" type="number" {...register('stockMinimo', { valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.stockMinimo} helperText={errors.stockMinimo?.message} fullWidth />
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

            <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Está compuesto</Typography>
              {composicion.map((entry, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <TextField
                    select
                    size="small"
                    value={entry.sustanciaBasicaId}
                    onChange={(e) => actualizarCompuesto(i, 'sustanciaBasicaId', e.target.value === '' ? '' : Number(e.target.value))}
                    sx={{ minWidth: 200 }}
                    slotProps={{ select: { native: true } }}
                  >
                    <option value="">Seleccionar...</option>
                    {disponibles(i).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </TextField>
                  <TextField
                    type="number"
                    size="small"
                    value={entry.porcentaje}
                    onChange={(e) => actualizarCompuesto(i, 'porcentaje', Number(e.target.value))}
                    slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body2">%</Typography>
                  <IconButton size="small" onClick={() => quitarCompuesto(i)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {composicion.length > 0 && (
                <Typography variant="caption" color={Math.abs(sumaTotal - 100) > 0.01 ? 'error' : 'text.secondary'}>
                  Total: {sumaTotal}%
                </Typography>
              )}
              <Button size="small" startIcon={<AddIcon />} onClick={agregarCompuesto} sx={{ mt: 1 }}>
                Agregar sustancia
              </Button>
              {compError && <Alert severity="error" sx={{ mt: 1 }}>{compError}</Alert>}
            </Box>
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
