import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  FormControl, InputLabel, Select, MenuItem, Alert,
} from '@mui/material';
import type { Laboratorio } from '../types/laboratorio';

interface Props {
  open: boolean;
  itemName: string;
  itemTipo: string;
  origenNombre: string;
  laboratorios: Laboratorio[];
  onConfirm: (nuevoLaboratorioId: number) => Promise<void>;
  onClose: () => void;
}

export default function MoverDialog({ open, itemName, itemTipo, origenNombre, laboratorios, onConfirm, onClose }: Props) {
  const [nuevoLabId, setNuevoLabId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!nuevoLabId) { setError('Seleccioná un laboratorio destino'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onConfirm(nuevoLabId);
      setNuevoLabId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al mover');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mover {itemTipo}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>{itemName}</strong> — Origen: {origenNombre}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Seleccioná el laboratorio destino:
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Laboratorio destino</InputLabel>
          <Select value={nuevoLabId} label="Laboratorio destino" onChange={(e) => setNuevoLabId(e.target.value as number)}>
            <MenuItem value="">Seleccionar...</MenuItem>
            {laboratorios.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.nombre} {l.edificio ? `(${l.edificio})` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={submitting}>
          {submitting ? 'Moviendo...' : 'Mover'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}