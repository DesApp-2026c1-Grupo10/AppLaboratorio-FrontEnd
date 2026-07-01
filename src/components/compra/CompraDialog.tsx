import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography,
} from '@mui/material';

interface CompraDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: (cantidad: number) => Promise<void>;
  onClose: () => void;
}

export default function CompraDialog({ open, itemName, onConfirm, onClose }: CompraDialogProps) {
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(cantidad);
      setCantidad(1);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Comprar {itemName}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Registrar una compra incrementará el stock disponible.
          </Typography>
          <TextField
            label="Cantidad a comprar"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={loading || cantidad < 1}>
          {loading ? 'Registrando...' : 'Confirmar Compra'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
