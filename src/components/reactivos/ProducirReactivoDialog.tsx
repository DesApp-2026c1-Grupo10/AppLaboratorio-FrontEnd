import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Chip, Alert, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import type { Reactivo, ComposicionItem } from '../../types/reactivo';
import { producirReactivo } from '../../api/reactivos';

interface Props {
  open: boolean;
  reactivo: Reactivo;
  usuarioId?: number;
  onComplete: (updated: Reactivo) => void;
  onClose: () => void;
}

export default function ProducirReactivoDialog({ open, reactivo, usuarioId, onComplete, onClose }: Props) {
  const [cantidad, setCantidad] = useState(0);
  const [error, setError] = useState('');
  const [faltantes, setFaltantes] = useState<{ name: string; disponible: number; necesario: number; porcentaje: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleProducir = async () => {
    if (cantidad <= 0) { setError('Ingresá una cantidad mayor a 0'); return; }
    setError('');
    setFaltantes([]);
    setSubmitting(true);
    try {
      const updated = await producirReactivo(reactivo.id, cantidad, usuarioId);
      onComplete(updated);
    } catch (err: any) {
      if (err?.faltantes) {
        setFaltantes(err.faltantes);
        setError(err.message || 'Stock insuficiente');
      } else {
        setError(err?.message || 'Error al producir');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const composicion = reactivo.composicion || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Producir {reactivo.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {composicion.length > 0 && (
            <Table size="small">
              <TableBody>
                {composicion.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.ReactivoSustancia.porcentaje}%</TableCell>
                    <TableCell>
                      <Chip label={`Stock: ${c.stock}`} size="small"
                        color={c.stock <= 0 ? 'error' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <TextField label="Cantidad a producir" type="number" value={cantidad || ''}
            onChange={(e) => setCantidad(Number(e.target.value))}
            slotProps={{ htmlInput: { min: 1 } }} fullWidth />

          {cantidad > 0 && composicion.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Se va a consumir:</Typography>
              {composicion.map((c) => {
                const necesario = cantidad * (c.ReactivoSustancia.porcentaje / 100);
                const suficiente = c.stock >= necesario;
                return (
                  <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip label={c.name} size="small" color={suficiente ? 'default' : 'error'} variant="outlined" />
                    <Typography variant="body2">
                      {necesario} de {c.stock} disponibles
                    </Typography>
                    {!suficiente && <Chip label="Falta" size="small" color="error" />}
                  </Box>
                );
              })}
            </Box>
          )}

          {faltantes.length > 0 && (
            <Alert severity="error">
              <Typography variant="body2" fontWeight="bold">Stock insuficiente:</Typography>
              {faltantes.map((f) => (
                <Typography key={f.name} variant="body2">
                  {f.name}: necesario {f.necesario}, disponible {f.disponible}
                </Typography>
              ))}
            </Alert>
          )}

          {error && !faltantes.length && (
            <Alert severity="error">{error}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleProducir} disabled={submitting}>
          {submitting ? 'Produciendo...' : 'Producir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
