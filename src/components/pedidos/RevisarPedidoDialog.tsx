import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete,
} from '@mui/material';
import { getLaboratorios } from '../../api/laboratorios';
import { getMateriales } from '../../api/materiales';
import { getReactivos } from '../../api/reactivos';
import { getEquipos } from '../../api/equipos';
import type { Pedido } from '../../types/pedido';
import type { Laboratorio } from '../../types/laboratorio';

interface ItemSel {
  id: number;
  name: string;
  cantidad: number;
}

interface Props {
  open: boolean;
  pedido: Pedido | null;
  onSubmit: (comentario: string, cambios: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function RevisarPedidoDialog({ open, pedido, onSubmit, onClose }: Props) {
  const [comentario, setComentario] = useState('');
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [reactivos, setReactivos] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [laboratorioId, setLaboratorioId] = useState('');
  const [cantidadAlumnos, setCantidadAlumnos] = useState(1);
  const [descripcion, setDescripcion] = useState('');

  const [selectedMaterials, setSelectedMaterials] = useState<ItemSel[]>([]);
  const [selectedReactivos, setSelectedReactivos] = useState<ItemSel[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);

  useEffect(() => {
    if (!open || !pedido) return;
    setComentario('');
    Promise.all([getLaboratorios(), getMateriales(), getReactivos(), getEquipos()])
      .then(([labs, mats, reas, eqs]) => {
        setLaboratorios(labs);
        setMateriales(mats);
        setReactivos(reas);
        setEquipos(eqs);
        setFecha(pedido.fecha || '');
        setHoraInicio(pedido.horaInicio ? pedido.horaInicio.slice(0, 5) : '');
        setHoraFin(pedido.horaFin ? pedido.horaFin.slice(0, 5) : '');
        setLaboratorioId(String(pedido.laboratorioId || ''));
        setCantidadAlumnos(pedido.cantidadAlumnos || 1);
        setDescripcion(pedido.descripcion || '');
        setSelectedMaterials(
          (pedido.materiales || []).map((m) => ({ id: m.id, name: m.name, cantidad: m.PedidoMaterial?.cantidad || 1 }))
        );
        setSelectedReactivos(
          (pedido.reactivos || []).map((r) => ({ id: r.id, name: r.name, cantidad: r.PedidoReactivo?.cantidad || 1 }))
        );
        setSelectedEquipos(pedido.Equipments?.map((e) => e.id) || []);
      })
      .catch(console.error);
  }, [open, pedido]);

  const addMaterial = (matId: number) => {
    if (selectedMaterials.some((m) => m.id === matId)) return;
    const mat = materiales.find((m) => m.id === matId);
    if (mat) setSelectedMaterials([...selectedMaterials, { id: mat.id, name: mat.name, cantidad: 1 }]);
  };

  const removeMaterial = (id: number) => setSelectedMaterials((prev) => prev.filter((m) => m.id !== id));

  const addReactivo = (reaId: number) => {
    if (selectedReactivos.some((r) => r.id === reaId)) return;
    const rea = reactivos.find((r) => r.id === reaId);
    if (rea) setSelectedReactivos([...selectedReactivos, { id: rea.id, name: rea.name, cantidad: 1 }]);
  };

  const removeReactivo = (id: number) => setSelectedReactivos((prev) => prev.filter((r) => r.id !== id));

  const construirCambios = (): Record<string, any> => {
    const cambios: Record<string, any> = {};
    if (!pedido) return cambios;
    if (fecha !== pedido.fecha) cambios.fecha = fecha;
    if (horaInicio !== (pedido.horaInicio?.slice(0, 5) || '')) cambios.horaInicio = `${horaInicio}:00`;
    if (horaFin !== (pedido.horaFin?.slice(0, 5) || '')) cambios.horaFin = `${horaFin}:00`;
    if (Number(laboratorioId) !== pedido.laboratorioId) cambios.laboratorioId = Number(laboratorioId);
    if (cantidadAlumnos !== pedido.cantidadAlumnos) cambios.cantidadAlumnos = cantidadAlumnos;
    if (descripcion !== (pedido.descripcion || '')) cambios.descripcion = descripcion;

    const matsChanged = JSON.stringify(selectedMaterials.map(({ id, cantidad }) => ({ id, cantidad }))) !==
      JSON.stringify((pedido.materiales || []).map((m) => ({ id: m.id, cantidad: m.PedidoMaterial?.cantidad || 1 })));
    const reasChanged = JSON.stringify(selectedReactivos.map(({ id, cantidad }) => ({ id, cantidad }))) !==
      JSON.stringify((pedido.reactivos || []).map((r) => ({ id: r.id, cantidad: r.PedidoReactivo?.cantidad || 1 })));
    const eqsChanged = JSON.stringify([...selectedEquipos].sort()) !==
      JSON.stringify([...(pedido.Equipments || []).map((e) => e.id)].sort());

    if (matsChanged) cambios.materiales = selectedMaterials.map(({ id, cantidad }) => ({ id, cantidad }));
    if (reasChanged) cambios.reactivos = selectedReactivos.map(({ id, cantidad }) => ({ id, cantidad }));
    if (eqsChanged) cambios.equipos = selectedEquipos;
    return cambios;
  };

  const handleSubmit = async () => {
    const cambios = construirCambios();
    if (!comentario.trim() && Object.keys(cambios).length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(comentario, cambios);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  if (!pedido) return null;

  const tieneCambios = comentario.trim().length > 0 || Object.keys(construirCambios()).length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revisar Pedido #{pedido.id}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Proponé cambios al pedido. El creador recibirá la revisión y podrá aceptarla o rechazarla.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Hora Inicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Hora Fin" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>Laboratorio</InputLabel>
            <Select value={laboratorioId} label="Laboratorio" onChange={(e) => setLaboratorioId(e.target.value)}>
              {laboratorios.map((l) => <MenuItem key={l.id} value={String(l.id)}>{l.nombre} ({l.edificio})</MenuItem>)}
            </Select>
          </FormControl>

          <TextField label="Cantidad de Alumnos" type="number" value={cantidadAlumnos} onChange={(e) => setCantidadAlumnos(Number(e.target.value))} size="small" fullWidth slotProps={{ htmlInput: { min: 1 } }} />

          <TextField label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} size="small" fullWidth multiline rows={2} />

          {/* Materiales */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Materiales</Typography>
            <Autocomplete
              size="small"
              options={materiales.filter((m) => !selectedMaterials.some((s) => s.id === m.id))}
              getOptionLabel={(o) => `${o.name} (stock: ${o.stock})`}
              onChange={(_, v) => v && addMaterial(v.id)}
              renderInput={(params) => <TextField {...params} label="Agregar material" />}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {selectedMaterials.map((m) => (
                <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label={m.name} size="small" onDelete={() => removeMaterial(m.id)} />
                  <TextField type="number" value={m.cantidad} onChange={(e) => setSelectedMaterials((prev) => prev.map((x) => x.id === m.id ? { ...x, cantidad: Number(e.target.value) } : x))} size="small" sx={{ width: 70 }} slotProps={{ htmlInput: { min: 1 } }} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Reactivos */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Reactivos</Typography>
            <Autocomplete
              size="small"
              options={reactivos.filter((r) => !selectedReactivos.some((s) => s.id === r.id))}
              getOptionLabel={(o) => `${o.name} (stock: ${o.stock})`}
              onChange={(_, v) => v && addReactivo(v.id)}
              renderInput={(params) => <TextField {...params} label="Agregar reactivo" />}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {selectedReactivos.map((r) => (
                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label={r.name} size="small" onDelete={() => removeReactivo(r.id)} />
                  <TextField type="number" value={r.cantidad} onChange={(e) => setSelectedReactivos((prev) => prev.map((x) => x.id === r.id ? { ...x, cantidad: Number(e.target.value) } : x))} size="small" sx={{ width: 70 }} slotProps={{ htmlInput: { min: 1 } }} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Equipos */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Equipos</Typography>
            <FormControl size="small" fullWidth>
              <InputLabel>Seleccionar equipos</InputLabel>
              <Select
                multiple
                value={selectedEquipos}
                label="Seleccionar equipos"
                onChange={(e) => setSelectedEquipos(e.target.value as number[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const eq = equipos.find((e) => e.id === id);
                      return <Chip key={id} label={eq?.name || `#${id}`} size="small" />;
                    })}
                  </Box>
                )}
              >
                {equipos.map((eq) => (
                  <MenuItem key={eq.id} value={eq.id}>{eq.name} ({eq.status})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Comentario de la revisión"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
            required
            placeholder="Explicá qué cambios proponés y por qué..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!tieneCambios || submitting}>
          {submitting ? 'Enviando...' : 'Enviar Revisión'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
