import { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select, TextField,
  Chip, Typography, Autocomplete, Stack, IconButton, Alert,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import type { Pedido } from '../../types/pedido';

interface Props {
  onSubmitPedido: (data: any) => Promise<any>;
  laboratorios: any[];
}

interface ItemSeleccionado {
  id: number;
  name: string;
  cantidad: number;
  stock: number;
}

const initialForm = {
  fecha: '', horaInicio: '', horaFin: '', laboratorioId: '', cantidadAlumnos: 1, descripcion: '',
};

export default function PedidoForm({ onSubmitPedido, laboratorios }: Props) {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [reactivos, setReactivos] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);

  const [form, setForm] = useState({ ...initialForm });
  const [selectedMaterials, setSelectedMaterials] = useState<ItemSeleccionado[]>([]);
  const [selectedReactivos, setSelectedReactivos] = useState<ItemSeleccionado[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getMateriales(), getReactivos(), getEquipos()])
      .then(([m, r, e]) => { setMateriales(m); setReactivos(r); setEquipos(e); })
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setForm({ ...initialForm });
    setSelectedMaterials([]);
    setSelectedReactivos([]);
    setSelectedEquipos([]);
    setError('');
  };

  const equiposDisponibles = equipos.filter((eq) => eq.status === 'Disponible');
  const labSeleccionado = laboratorios.find((l) => l.id === Number(form.laboratorioId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fecha || !form.horaInicio || !form.horaFin || !form.laboratorioId) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPedido({
        ...form,
        laboratorioId: Number(form.laboratorioId),
        cantidadAlumnos: Number(form.cantidadAlumnos),
        materiales: selectedMaterials.map((m) => ({ id: m.id, cantidad: m.cantidad })),
        reactivos: selectedReactivos.map((r) => ({ id: r.id, cantidad: r.cantidad })),
        equipos: selectedEquipos,
      });
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Datos del Pedido</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Stack direction="row" spacing={2} flexWrap="wrap">
        <TextField label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 180 }} />
        <TextField label="Hora Inicio" placeholder="08:00" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} required sx={{ minWidth: 140 }} />
        <TextField label="Hora Fin" placeholder="10:00" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} required sx={{ minWidth: 140 }} />
        <TextField label="Cant. Alumnos" type="number" value={form.cantidadAlumnos} onChange={(e) => setForm({ ...form, cantidadAlumnos: Number(e.target.value) })} required sx={{ minWidth: 140 }} inputProps={{ min: 1 }} />
      </Stack>

      <FormControl fullWidth required>
        <InputLabel>Laboratorio</InputLabel>
        <Select value={form.laboratorioId} label="Laboratorio" onChange={(e) => setForm({ ...form, laboratorioId: e.target.value })}>
          {laboratorios.map((lab) => <MenuItem key={lab.id} value={lab.id}>{lab.nombre} (Cap: {lab.capacidad})</MenuItem>)}
        </Select>
      </FormControl>

      <TextField label="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} multiline rows={2} fullWidth />

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
            <TextField type="number" size="small" value={m.cantidad} onChange={(e) => setSelectedMaterials(selectedMaterials.map((sm) => sm.id === m.id ? { ...sm, cantidad: Number(e.target.value) } : sm))} inputProps={{ min: 1, max: m.stock }} sx={{ width: 80 }} />
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
              setSelectedReactivos([...selectedReactivos, { id: v.id, name: v.name, cantidad: 1, stock: v.stock }]);
            }
          }}
          renderInput={(params) => <TextField {...params} size="small" placeholder="Agregar reactivo..." />}
          fullWidth
        />
        {selectedReactivos.map((r) => (
          <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip label={r.name} color={r.cantidad > r.stock ? 'error' : 'secondary'} size="small" />
            <TextField type="number" size="small" value={r.cantidad} onChange={(e) => setSelectedReactivos(selectedReactivos.map((sr) => sr.id === r.id ? { ...sr, cantidad: Number(e.target.value) } : sr))} inputProps={{ min: 1, max: r.stock }} sx={{ width: 80 }} />
            <Typography variant="caption" color="text.secondary">disp: {r.stock}</Typography>
            <IconButton size="small" onClick={() => setSelectedReactivos(selectedReactivos.filter((sr) => sr.id !== r.id))} color="error"><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        ))}
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
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {selected.map((id) => {
                  const eq = equipos.find((e) => e.id === id);
                  return eq ? <Chip key={id} label={eq.name} size="small" color="success" /> : null;
                })}
              </Stack>
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
              Solo se muestran equipos con estado Disponible
            </Typography>
          )}
        </FormControl>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear Pedido'}
        </Button>
        <Button type="button" variant="outlined" color="error" size="large" onClick={resetForm}>
          Cancelar
        </Button>
      </Stack>
    </Box>
  );
}
