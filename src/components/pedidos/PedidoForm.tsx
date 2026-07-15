import { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select, TextField,
  Chip, Typography, Autocomplete, IconButton, Alert, Stepper, Step, StepLabel, Paper,
  FormControlLabel, Checkbox, List, ListItem, ListItemIcon, ListItemText, alpha,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { Delete as DeleteIcon, ArrowBack, ArrowForward } from '@mui/icons-material';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import { checkPedido } from '../../api/pedidos';
import type { Material } from '../../types/material';
import type { Reactivo } from '../../types/reactivo';
import type { Equipo } from '../../types/equipo';
import type { Laboratorio } from '../../types/laboratorio';

interface ItemSeleccionado {
  id: number;
  name: string;
  cantidad: number;
  stock: number;
  unidadMedida?: string;
  deDespensa?: boolean;
}

interface Props {
  onSubmitPedido: (data: Record<string, any>) => Promise<any>;
  laboratorios: Laboratorio[];
  onRefreshLabs?: () => void;
  mode?: 'pedido' | 'actividad';
  onSubmitActividad?: (data: Record<string, any>) => Promise<any>;
  actividadInicial?: any;
  onActividadesClick?: () => void;
}

const EDIFICIOS = ['Malvinas', 'Libertador', 'Justicia Social'];

const STEPS = ['Edificio & Lab', 'Materiales', 'Reactivos', 'Equipos', 'Revisar'];

export default function PedidoForm({ onSubmitPedido, laboratorios, mode = 'pedido', onSubmitActividad, onActividadesClick }: Props) {
  const [step, setStep] = useState(0);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [reactivos, setReactivos] = useState<Reactivo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<ItemSeleccionado[]>([]);
  const [selectedReactivos, setSelectedReactivos] = useState<ItemSeleccionado[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [reviewChecked, setReviewChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, reset, watch, getValues, formState: { errors } } = useForm({
    defaultValues: { nombre: '', fecha: '', horaInicio: '', horaFin: '', laboratorioId: '', cantidadAlumnos: 1, descripcion: '' },
  });

  const [edificio, setEdificio] = useState('');
  const watchFecha = watch('fecha');
  const watchHoraInicio = watch('horaInicio');
  const watchHoraFin = watch('horaFin');
  const watchCantidadAlumnos = watch('cantidadAlumnos');
  const [despensaMaterials, setDespensaMaterials] = useState<ItemSeleccionado[]>([]);
  const [despensaReactivos, setDespensaReactivos] = useState<ItemSeleccionado[]>([]);

  useEffect(() => {
    Promise.all([getMateriales(), getReactivos(), getEquipos()])
      .then(([m, r, e]) => { setMateriales(m); setReactivos(r); setEquipos(e); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (step === STEPS.length - 1 && !reviewChecked) {
      setReviewChecked(true);
      const labId = getValues('laboratorioId');
      if (mode !== 'actividad' && labId && watchFecha && watchHoraInicio && watchHoraFin) {
        const payload = {
          fecha: watchFecha,
          horaInicio: watchHoraInicio,
          horaFin: watchHoraFin,
          laboratorioId: Number(labId),
          cantidadAlumnos: Number(getValues('cantidadAlumnos')),
          equipos: selectedEquipos,
          materiales: selectedMaterials.map((m) => ({ id: m.id, cantidad: m.cantidad })),
          reactivos: selectedReactivos.map((r) => ({ id: r.id, cantidad: r.cantidad })),
        };
        checkPedido(payload).then((result) => {
          setWarnings(result.warnings);
          if (result.errors?.length) {
            setError(result.errors.join('. '));
          }
        }).catch(console.error);
      }
    }
  }, [step]);

  const laboratoriosFiltrados = laboratorios.filter((l) => {
    if (l.edificio !== edificio) return false;
    if (watchCantidadAlumnos && l.capacidad < Number(watchCantidadAlumnos)) return false;
    return true;
  });

  const equiposDisponibles = equipos.filter((eq) => !['Mantenimiento', 'Fuera de servicio'].includes(eq.status));

  const resetForm = () => {
    reset({ nombre: '', fecha: '', horaInicio: '', horaFin: '', laboratorioId: '', cantidadAlumnos: 1, descripcion: '' });
    setEdificio('');
    setSelectedMaterials([]);
    setSelectedReactivos([]);
    setSelectedEquipos([]);
    setDespensaMaterials([]);
    setDespensaReactivos([]);
    setStep(0);
    setError('');
    setWarnings([]);
    setReviewChecked(false);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!edificio) { setError('Seleccioná un edificio'); return; }
      if (mode !== 'actividad' && (!watchFecha || !watchHoraInicio || !watchHoraFin)) { setError('Completá fecha y horarios'); return; }
      if (mode !== 'actividad' && watchHoraInicio && watchHoraFin) {
        const toMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
        if (toMin(watchHoraInicio) >= toMin(watchHoraFin)) { setError('La hora de inicio debe ser anterior a la hora de fin'); return; }
      }
      if (!getValues('laboratorioId')) { setError('Seleccioná un laboratorio'); return; }
      if (watchCantidadAlumnos && Number(watchCantidadAlumnos) > 0 && laboratoriosFiltrados.length === 0) {
        setError('No hay laboratorio con esa capacidad en el edificio seleccionado');
        return;
      }
    }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (step === STEPS.length - 1) { setWarnings([]); setReviewChecked(false); }
    setStep(s => Math.max(s - 1, 0));
  };

  const crearPedido = async (data: Record<string, any>) => {
    setError('');
    const labId = data.laboratorioId;
    if (!labId) { setError('Seleccioná un laboratorio'); return; }
    if (mode !== 'actividad' && (!data.fecha || !data.horaInicio || !data.horaFin)) {
      setError('Completá fecha y horarios');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        laboratorioId: Number(labId),
        cantidadAlumnos: Number(data.cantidadAlumnos),
        materiales: selectedMaterials.map((m) => ({ id: m.id, cantidad: m.cantidad })),
        reactivos: selectedReactivos.map((r) => ({ id: r.id, cantidad: r.cantidad })),
        equipos: selectedEquipos,
        despensaMateriales: despensaMaterials.map((m) => ({ id: m.id, cantidad: m.cantidad })),
        despensaReactivos: despensaReactivos.map((r) => ({ id: r.id, cantidad: r.cantidad })),
      };
      if (mode === 'actividad' && onSubmitActividad) {
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

  const renderChecklistItems = (
    items: any[],
    selected: ItemSeleccionado[],
    setSelected: React.Dispatch<React.SetStateAction<ItemSeleccionado[]>>,
    despensaItems: ItemSeleccionado[],
    setDespensa: React.Dispatch<React.SetStateAction<ItemSeleccionado[]>>,
    labelKey: string,
    unitKey: string,
  ) => {
    const itemsDelEdificio = items.filter((i) => {
      const lab = i.laboratorio;
      return lab && lab.edificio === edificio;
    });
    const itemsDeDespensa = items.filter((i) => !i.laboratorioId);

    const isSelected = (id: number) => selected.some((s) => s.id === id);
    const isDespensaSelected = (id: number) => despensaItems.some((s) => s.id === id);
    const getSelected = (id: number) => selected.find((s) => s.id === id);
    const getDespensa = (id: number) => despensaItems.find((s) => s.id === id);

    const toggleItem = (item: any) => {
      if (isSelected(item.id)) {
        setSelected(selected.filter((s) => s.id !== item.id));
      } else {
        setSelected([...selected, { id: item.id, name: item.name || item[labelKey], cantidad: 1, stock: item.stock }]);
      }
    };

    const toggleDespensa = (item: any) => {
      if (isDespensaSelected(item.id)) {
        setDespensa(despensaItems.filter((s) => s.id !== item.id));
      } else {
        setDespensa([...despensaItems, { id: item.id, name: item.name || item[labelKey], cantidad: 1, stock: item.stock, deDespensa: true }]);
      }
    };

    const updateCantidad = (id: number, val: number) => {
      setSelected(selected.map((s) => s.id === id ? { ...s, cantidad: Math.max(1, val) } : s));
    };

    const updateDespensaCantidad = (id: number, val: number) => {
      setDespensa(despensaItems.map((s) => s.id === id ? { ...s, cantidad: Math.max(1, val) } : s));
    };

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>En {edificio}:</Typography>
        {itemsDelEdificio.length === 0 ? (
          <Typography variant="caption" color="text.secondary">No hay items en este edificio</Typography>
        ) : (
          <List dense>
            {itemsDelEdificio.map((item) => (
              <ListItem key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 0.5, bgcolor: isSelected(item.id) ? alpha('#6366F1', 0.04) : 'transparent' }}>
                <ListItemIcon>
                  <Checkbox checked={isSelected(item.id)} onChange={() => toggleItem(item)} />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={`Stock: ${item.stock} ${item[unitKey] || ''}`}
                  sx={{ flex: 1 }}
                />
                {isSelected(item.id) && (
                  <TextField
                    type="number"
                    size="small"
                    value={getSelected(item.id)?.cantidad || 1}
                    onChange={(e) => updateCantidad(item.id, Number(e.target.value))}
                    slotProps={{ htmlInput: { min: 1, max: item.stock } }}
                    sx={{ width: 70, ml: 1 }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}

        {itemsDeDespensa.length > 0 && (
          <>
            <Box sx={{ borderTop: '1px dashed', borderColor: 'warning.light', my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.dark' }}>En Despensa:</Typography>
            <List dense>
              {itemsDeDespensa.map((item) => (
                <ListItem key={item.id} sx={{ border: '1px solid', borderColor: 'warning.light', borderRadius: 2, mb: 0.5, bgcolor: isDespensaSelected(item.id) ? alpha('#f59e0b', 0.06) : 'transparent' }}>
                  <ListItemIcon>
                    <Checkbox checked={isDespensaSelected(item.id)} onChange={() => toggleDespensa(item)} color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={`Stock: ${item.stock} ${item[unitKey] || ''} (en Despensa)`}
                    sx={{ flex: 1 }}
                  />
                  {isDespensaSelected(item.id) && (
                    <TextField
                      type="number"
                      size="small"
                      value={getDespensa(item.id)?.cantidad || 1}
                      onChange={(e) => updateDespensaCantidad(item.id, Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 1, max: item.stock } }}
                      sx={{ width: 70, ml: 1 }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Paso 1: Edificio y Laboratorio</Typography>
            <FormControl fullWidth>
              <InputLabel>Edificio</InputLabel>
              <Select value={edificio} label="Edificio" onChange={(e) => { setEdificio(e.target.value); reset({ ...getValues(), laboratorioId: '' } as any); }}>
                {EDIFICIOS.map((ed) => <MenuItem key={ed} value={ed}>{ed}</MenuItem>)}
              </Select>
            </FormControl>
            {mode === 'actividad' ? (
              <TextField label="Nombre de la actividad *" {...register('nombre', { required: true })} error={!!errors.nombre} helperText={errors.nombre?.message} required fullWidth />
            ) : (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Fecha" type="date" {...register('fecha', { required: true })} slotProps={{ inputLabel: { shrink: true } }} error={!!errors.fecha} required sx={{ minWidth: 180 }} />
                <TextField label="Hora Inicio" placeholder="08:00" {...register('horaInicio', { required: true })} error={!!errors.horaInicio} required sx={{ minWidth: 140 }} />
                <TextField label="Hora Fin" placeholder="10:00" {...register('horaFin', { required: true })} error={!!errors.horaFin} required sx={{ minWidth: 140 }} />
              </Box>
            )}
            <TextField label="Cant. Alumnos" type="number" {...register('cantidadAlumnos', { valueAsNumber: true, min: { value: 1, message: 'Mínimo 1' } })} error={!!errors.cantidadAlumnos} helperText={errors.cantidadAlumnos?.message} required sx={{ minWidth: 140 }} />
            <Controller
              name="laboratorioId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <FormControl fullWidth required error={!!errors.laboratorioId}>
                  <InputLabel>Laboratorio</InputLabel>
                  <Select {...field} label="Laboratorio">
                    {!edificio ? (
                      <MenuItem disabled>Seleccioná un edificio primero</MenuItem>
                    ) : laboratoriosFiltrados.length === 0 ? (
                      <MenuItem disabled>No hay laboratorio con esa capacidad</MenuItem>
                    ) : (
                      laboratoriosFiltrados.map((lab) => <MenuItem key={lab.id} value={lab.id}>{lab.nombre} (Cap: {lab.capacidad})</MenuItem>)
                    )}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Paso 2: Materiales</Typography>
            {renderChecklistItems(materiales, selectedMaterials, setSelectedMaterials, despensaMaterials, setDespensaMaterials, 'name', 'unit')}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Paso 3: Reactivos</Typography>
            {renderChecklistItems(reactivos, selectedReactivos, setSelectedReactivos, despensaReactivos, setDespensaReactivos, 'name', 'unidadMedida')}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Paso 4: Equipos</Typography>
            {(() => {
              const equiposDelEdificio = equiposDisponibles.filter((eq) => {
                const lab = eq.laboratorio;
                return (lab && lab.edificio === edificio) || (!eq.laboratorioId && eq.is_movable);
              });
              return (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Equipos disponibles:</Typography>
                  {equiposDelEdificio.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No hay equipos disponibles</Typography>
                  ) : (
                    <List dense>
                      {equiposDelEdificio.map((eq) => (
                        <ListItem key={eq.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 0.5, bgcolor: selectedEquipos.includes(eq.id) ? alpha('#6366F1', 0.04) : 'transparent' }}>
                          <ListItemIcon>
                            <Checkbox checked={selectedEquipos.includes(eq.id)} onChange={() => setSelectedEquipos(selectedEquipos.includes(eq.id) ? selectedEquipos.filter(id => id !== eq.id) : [...selectedEquipos, eq.id])} />
                          </ListItemIcon>
                          <ListItemText
                            primary={eq.name}
                            secondary={eq.is_movable && !eq.laboratorioId ? 'Movible entre edificios' : eq.laboratorio?.nombre || ''}
                            sx={{ flex: 1 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              );
            })()}
          </Box>
        );
      case 4: {
        const labSeleccionado = laboratorios.find(l => l.id === Number(getValues('laboratorioId')));
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Paso 5: Revisar Pedido</Typography>
            {warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Advertencias:</Typography>
                {warnings.map((w, i) => <Typography key={i} variant="body2">• {w}</Typography>)}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Edificio: ${edificio}`} color="primary" variant="outlined" />
                <Chip label={`Lab: ${labSeleccionado?.nombre || '-'}`} color="primary" variant="outlined" />
                {mode !== 'actividad' && <Chip label={`Fecha: ${watchFecha}`} color="primary" variant="outlined" />}
                {mode !== 'actividad' && <Chip label={`${watchHoraInicio} - ${watchHoraFin}`} color="primary" variant="outlined" />}
                <Chip label={`Alumnos: ${getValues('cantidadAlumnos')}`} color="primary" variant="outlined" />
              </Box>
              {selectedMaterials.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Materiales:</Typography>
                  {selectedMaterials.map(m => <Chip key={m.id} label={`${m.name} x${m.cantidad}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                </Box>
              )}
              {despensaMaterials.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'warning.dark' }}>Materiales (traer de Despensa):</Typography>
                  {despensaMaterials.map(m => <Chip key={m.id} label={`${m.name} x${m.cantidad}`} size="small" color="warning" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />)}
                </Box>
              )}
              {selectedReactivos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Reactivos:</Typography>
                  {selectedReactivos.map(r => <Chip key={r.id} label={`${r.name} x${r.cantidad}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                </Box>
              )}
              {despensaReactivos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'warning.dark' }}>Reactivos (traer de Despensa):</Typography>
                  {despensaReactivos.map(r => <Chip key={r.id} label={`${r.name} x${r.cantidad}`} size="small" color="warning" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />)}
                </Box>
              )}
              {selectedEquipos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Equipos:</Typography>
                  {selectedEquipos.map(id => {
                    const eq = equipos.find(e => e.id === id);
                    return <Chip key={id} label={eq?.name || `ID#${id}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />;
                  })}
                </Box>
              )}

            </Box>
          </Box>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      <Paper sx={{ p: 3, mb: 2 }}>
        {renderStepContent()}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          {step > 0 && (
            <Button startIcon={<ArrowBack />} onClick={handleBack} variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3.5, py: 1, border: '2px solid', borderColor: '#6366F1', color: '#6366F1', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { borderColor: '#4F46E5', bgcolor: 'rgba(99,102,241,0.06)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.2)' } }}>
              Anterior
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {step < STEPS.length - 1 ? (
            <Button type="button" endIcon={<ArrowForward />} onClick={handleNext} variant="contained"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 4.5, py: 1.2, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' } }}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" variant="contained" size="large" disabled={submitting}
              onClick={() => { if (step === STEPS.length - 1) crearPedido(getValues()); }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 5, py: 1.4, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }, '&.Mui-disabled': { background: '#cbd5e1', boxShadow: 'none' } }}>
              {submitting ? 'Creando...' : mode === 'actividad' ? 'Crear Actividad' : 'Crear Pedido'}
            </Button>
          )}
          <Button type="button" variant="outlined" size="large" onClick={resetForm}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3.5, py: 1, border: '2px solid', borderColor: '#ef4444', color: '#ef4444', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { borderColor: '#dc2626', bgcolor: 'rgba(239,68,68,0.06)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(239,68,68,0.2)' } }}>
            Cancelar
          </Button>
          {onActividadesClick && step === 0 && (
            <Button type="button" variant="outlined" size="large" onClick={(e) => { e.currentTarget.blur(); onActividadesClick(); }}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3.5, py: 1, border: '2px solid', borderColor: '#6366F1', color: '#6366F1', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { borderColor: '#4F46E5', bgcolor: 'rgba(99,102,241,0.06)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.2)' } }}>
              Actividades Predefinidas
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
