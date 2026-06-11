import { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select, TextField,
  Chip, Typography, Autocomplete, IconButton, Alert, Slider, Tooltip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import type { Material } from '../../types/material';
import type { Reactivo } from '../../types/reactivo';
import type { Equipo } from '../../types/equipo';
import type { Laboratorio } from '../../types/laboratorio';

interface Props {
  onSubmitPedido: (data: Record<string, any>) => Promise<any>;
  laboratorios: Laboratorio[];
  onRefreshLabs?: () => void;
  mode?: 'pedido' | 'actividad';
  onSubmitActividad?: (data: Record<string, any>) => Promise<any>;
  actividadInicial?: {
    nombre?: string;
    laboratorioId?: number;
    cantidadAlumnos?: number;
    descripcion?: string;
    materiales?: { id: number; cantidad: number }[];
    reactivos?: { id: number; cantidad: number }[];
    equipos?: number[];
  } | null;
  onActividadesClick?: () => void;
}

interface ItemSeleccionado {
  id: number;
  name: string;
  cantidad: number;
  stock: number;
  unidadMedida?: string;
}

export default function PedidoForm({ onSubmitPedido, laboratorios, onRefreshLabs, mode = 'pedido', onSubmitActividad, actividadInicial, onActividadesClick }: Props) {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [reactivos, setReactivos] = useState<Reactivo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const [selectedMaterials, setSelectedMaterials] = useState<ItemSeleccionado[]>([]);
  const [selectedReactivos, setSelectedReactivos] = useState<ItemSeleccionado[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { nombre: '', fecha: '', horaInicio: '', horaFin: '', laboratorioId: '', cantidadAlumnos: 1, descripcion: '' },
  });

  useEffect(() => {
    Promise.all([getMateriales(), getReactivos(), getEquipos()])
      .then(([m, r, e]) => { setMateriales(m); setReactivos(r); setEquipos(e); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (mode === 'actividad' && actividadInicial) {
      reset({
        nombre: actividadInicial.nombre || '',
        laboratorioId: String(actividadInicial.laboratorioId || ''),
        cantidadAlumnos: actividadInicial.cantidadAlumnos || 1,
        descripcion: actividadInicial.descripcion || '',
      });
      setSelectedMaterials(
        (actividadInicial.materiales || []).map((m) => {
          const mat = materiales.find((x) => x.id === m.id);
          return { id: m.id, name: mat?.name || `ID#${m.id}`, cantidad: m.cantidad, stock: mat?.stock ?? 0 };
        })
      );
      setSelectedReactivos(
        (actividadInicial.reactivos || []).map((r) => {
          const rea = reactivos.find((x) => x.id === r.id);
          return { id: r.id, name: rea?.name || `ID#${r.id}`, cantidad: r.cantidad, stock: rea?.stock ?? 0, unidadMedida: rea?.unidadMedida };
        })
      );
      setSelectedEquipos(actividadInicial.equipos || []);
    }
  }, [actividadInicial, materiales, reactivos]);

  const resetForm = () => {
    reset({ nombre: '', fecha: '', horaInicio: '', horaFin: '', laboratorioId: '', cantidadAlumnos: 1, descripcion: '' });
    setSelectedMaterials([]);
    setSelectedReactivos([]);
    setSelectedEquipos([]);
    setError('');
  };

  const equiposDisponibles = equipos.filter((eq) => !['Mantenimiento', 'Fuera de servicio'].includes(eq.status));

  const onSubmit = async (data: Record<string, any>) => {
    setError('');
    if (mode === 'actividad') {
      if (!data.nombre?.trim() || !data.laboratorioId) {
        setError('Completá todos los campos obligatorios');
        return;
      }
    } else if (!data.fecha || !data.horaInicio || !data.horaFin || !data.laboratorioId) {
      setError('Completá todos los campos obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        laboratorioId: Number(data.laboratorioId),
        cantidadAlumnos: Number(data.cantidadAlumnos),
        materiales: selectedMaterials.map((m) => ({ id: m.id, cantidad: m.cantidad })),
        reactivos: selectedReactivos.map((r) => ({ id: r.id, cantidad: r.cantidad })),
        equipos: selectedEquipos,
      };
      if (mode === 'actividad' && onSubmitActividad) {
        if (!data.nombre?.trim()) { setError('El nombre de la actividad es obligatorio'); setSubmitting(false); return; }
        await onSubmitActividad(payload);
      } else {
        await onSubmitPedido(payload);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al crear ${mode === 'actividad' ? 'actividad' : 'pedido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Datos del Pedido</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {mode === 'actividad' && (
          <TextField label="Nombre de la actividad *" {...register('nombre', { required: mode === 'actividad' })} error={!!errors.nombre} helperText={errors.nombre?.message} required sx={{ minWidth: 250 }} />
        )}
        {mode !== 'actividad' && (
          <TextField label="Fecha" type="date" {...register('fecha', { required: mode !== 'actividad' })} slotProps={{ inputLabel: { shrink: true } }} error={!!errors.fecha} required sx={{ minWidth: 180 }} />
        )}
        {mode !== 'actividad' && (
          <TextField label="Hora Inicio" placeholder="08:00" {...register('horaInicio', { required: mode !== 'actividad' })} error={!!errors.horaInicio} required sx={{ minWidth: 140 }} />
        )}
        {mode !== 'actividad' && (
          <TextField label="Hora Fin" placeholder="10:00" {...register('horaFin', { required: mode !== 'actividad' })} error={!!errors.horaFin} required sx={{ minWidth: 140 }} />
        )}
        <TextField label="Cant. Alumnos" type="number" {...register('cantidadAlumnos', { valueAsNumber: true, min: { value: 1, message: 'Mínimo 1' } })} error={!!errors.cantidadAlumnos} helperText={errors.cantidadAlumnos?.message} required sx={{ minWidth: 140 }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <Controller
          name="laboratorioId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl fullWidth required error={!!errors.laboratorioId}>
              <InputLabel>Laboratorio</InputLabel>
              <Select {...field} label="Laboratorio">
                {laboratorios.map((lab) => <MenuItem key={lab.id} value={lab.id}>{lab.nombre} (Cap: {lab.capacidad})</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        {onRefreshLabs && (
          <Tooltip title="Recargar laboratorios">
            <IconButton onClick={onRefreshLabs} size="small" sx={{ mb: 0.5 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Materiales */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Materiales</Typography>
        <Autocomplete
          options={materiales.filter((m) => !selectedMaterials.find((sm) => sm.id === m.id))}
          getOptionLabel={(o) => `${o.name} (Stock: ${o.stock} ${o.unit || ''})`}
          onChange={(_, v) => {
            if (v) {
              setSelectedMaterials([...selectedMaterials, { id: v.id, name: v.name, cantidad: 1, stock: v.stock }]);
            }
          }}
          renderInput={(params) => <TextField {...params} size="small" placeholder="Agregar material..." />}
          fullWidth
        />
        {selectedMaterials.map((m) => (
          <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip label={m.name} color={m.cantidad > m.stock ? 'error' : 'primary'} size="small" />
            <TextField type="number" size="small" value={m.cantidad} onChange={(e) => setSelectedMaterials(selectedMaterials.map((sm) => sm.id === m.id ? { ...sm, cantidad: Number(e.target.value) } : sm))} slotProps={{ htmlInput: { min: 1, max: m.stock } }} sx={{ width: 80 }} />
            <Typography variant="caption" color="text.secondary">disp: {m.stock}</Typography>
            <IconButton size="small" onClick={() => setSelectedMaterials(selectedMaterials.filter((sm) => sm.id !== m.id))} color="error"><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        ))}
      </Box>

      {/* Reactivos */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Reactivos</Typography>
        <Autocomplete
          options={reactivos.filter((r) => !selectedReactivos.find((sr) => sr.id === r.id))}
          getOptionLabel={(o) => `${o.name} (Stock: ${o.stock} ${o.unidadMedida || ''})`}
          onChange={(_, v) => {
            if (v) {
              setSelectedReactivos([...selectedReactivos, { id: v.id, name: v.name, cantidad: 1, stock: v.stock, unidadMedida: v.unidadMedida }]);
            }
          }}
          renderInput={(params) => <TextField {...params} size="small" placeholder="Agregar reactivo..." />}
          fullWidth
        />
        {selectedReactivos.map((r) => {
          const esLiquido = r.unidadMedida?.toLowerCase().includes('litro') || r.unidadMedida?.toLowerCase().includes('l') || r.unidadMedida === 'ml';
          return (
            <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip label={r.name} color={r.cantidad > r.stock ? 'error' : 'secondary'} size="small" />
              {esLiquido ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 200 }}>
                  <Slider
                    value={r.cantidad}
                    onChange={(_, val) => setSelectedReactivos(selectedReactivos.map((sr) => sr.id === r.id ? { ...sr, cantidad: val as number } : sr))}
                    min={0}
                    max={r.stock || 10}
                    step={1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${v} ${r.unidadMedida || 'L'}`}
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="caption" sx={{ minWidth: 60 }}>{r.cantidad} {r.unidadMedida || 'L'}</Typography>
                </Box>
              ) : (
                <TextField type="number" size="small" value={r.cantidad} onChange={(e) => setSelectedReactivos(selectedReactivos.map((sr) => sr.id === r.id ? { ...sr, cantidad: Number(e.target.value) } : sr))} slotProps={{ htmlInput: { min: 1, max: r.stock } }} sx={{ width: 80 }} />
              )}
              <Typography variant="caption" color="text.secondary">disp: {r.stock}</Typography>
              <IconButton size="small" onClick={() => setSelectedReactivos(selectedReactivos.filter((sr) => sr.id !== r.id))} color="error"><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          );
        })}
      </Box>

      {/* Equipos */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Equipos</Typography>
        <FormControl fullWidth>
          <InputLabel>Seleccionar equipos</InputLabel>
          <Select
            multiple
            value={selectedEquipos}
            label="Seleccionar equipos"
            onChange={(e) => setSelectedEquipos(e.target.value as number[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {selected.map((id) => {
                  const eq = equipos.find((e) => e.id === id);
                  return eq ? <Chip key={id} label={eq.name} size="small" color="success" /> : null;
                })}
              </Box>
            )}
          >
            {equiposDisponibles.length === 0 ? (
              <MenuItem disabled>No hay equipos disponibles</MenuItem>
            ) : (
              equiposDisponibles.map((eq) => (
                <MenuItem key={eq.id} value={eq.id}>
                  {eq.name} {eq.laboratorio ? `(${eq.laboratorio.nombre})` : ''}
                </MenuItem>
              ))
            )}
          </Select>
          {selectedEquipos.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No se muestran equipos en Mantenimiento o Fuera de servicio
            </Typography>
          )}
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting}>
          {submitting ? 'Creando...' : mode === 'actividad' ? 'Crear Actividad' : 'Crear Pedido'}
        </Button>
        <Button type="button" variant="outlined" color="error" size="large" onClick={resetForm}>
          Cancelar
        </Button>
        {onActividadesClick && (
          <Button type="button" variant="outlined" size="large" onClick={(e) => { e.currentTarget.blur(); onActividadesClick(); }}>
            Actividades Predefinidas
          </Button>
        )}
      </Box>
    </Box>
  );
}
