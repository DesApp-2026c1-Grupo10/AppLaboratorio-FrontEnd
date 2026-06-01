import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  FormControl, Select, MenuItem, Alert,
} from '@mui/material';
import type { Pedido } from '../../types/pedido';

interface MaterialForm {
  id: number;
  name: string;
  solicitado: number;
  cantidad: number;
}

interface ReactivoForm {
  id: number;
  name: string;
  solicitado: number;
  cantidad: number;
}

interface EquipoForm {
  id: number;
  name: string;
  estado: string;
}

interface Props {
  open: boolean;
  pedido: Pedido | null;
  onConfirm: (data: {
    materiales: { id: number; cantidad: number }[];
    reactivos: { id: number; cantidad: number }[];
    equipos: { id: number; estado: string }[];
  }) => Promise<void>;
  onCancel: () => void;
}

function getEquipos(pedido: Pedido | null) {
  return (pedido as Pedido & { Equipments?: any[] })?.Equipments || [];
}

export default function FinalizarDialog({ open, pedido, onConfirm, onCancel }: Props) {
  const [materiales, setMateriales] = useState<MaterialForm[]>(() =>
    (pedido?.materiales || []).map((m) => ({
      id: m.id,
      name: m.name,
      solicitado: m.PedidoMaterial?.cantidad || 0,
      cantidad: m.PedidoMaterial?.cantidad || 0,
    }))
  );
  const [reactivos, setReactivos] = useState<ReactivoForm[]>(() =>
    (pedido?.reactivos || []).map((r) => ({
      id: r.id,
      name: r.name,
      solicitado: r.PedidoReactivo?.cantidad || 0,
      cantidad: r.PedidoReactivo?.cantidad || 0,
    }))
  );
  const [equipos, setEquipos] = useState<EquipoForm[]>(() =>
    getEquipos(pedido).map((e: EquipoForm) => ({
      id: e.id,
      name: e.name,
      estado: 'Disponible',
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      const mats = materiales.map((m) => ({ id: m.id, cantidad: m.cantidad }));
      const reas = reactivos.map((r) => ({ id: r.id, cantidad: r.cantidad }));
      const eqs = equipos.map((e) => ({ id: e.id, estado: e.estado }));
      await onConfirm({ materiales: mats, reactivos: reas, equipos: eqs });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Finalizar Pedido #{pedido?.id}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {materiales.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Materiales consumidos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Solicitado</TableCell>
                  <TableCell align="right">Consumido</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {materiales.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell align="right">{m.solicitado}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={m.cantidad}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMateriales(materiales.map((item) =>
                            item.id === m.id ? { ...item, cantidad: val } : item
                          ));
                        }}
                        slotProps={{ htmlInput: { min: 0 } }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {reactivos.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Reactivos consumidos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reactivo</TableCell>
                  <TableCell align="right">Solicitado</TableCell>
                  <TableCell align="right">Consumido</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reactivos.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align="right">{r.solicitado}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={r.cantidad}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setReactivos(reactivos.map((item) =>
                            item.id === r.id ? { ...item, cantidad: val } : item
                          ));
                        }}
                        slotProps={{ htmlInput: { min: 0 } }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {equipos.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Estado final de equipos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Equipo</TableCell>
                  <TableCell>Estado final</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipos.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.name}</TableCell>
                    <TableCell sx={{ width: 200 }}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={e.estado}
                          onChange={(ev) => setEquipos(equipos.map((item) =>
                            item.id === e.id ? { ...item, estado: ev.target.value } : item
                          ))}
                        >
                          <MenuItem value="Disponible">Disponible</MenuItem>
                          <MenuItem value="Mantenimiento">Enviar a Mantenimiento</MenuItem>
                          <MenuItem value="Roto">Roto / Dar de baja</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {materiales.length === 0 && reactivos.length === 0 && equipos.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Este pedido no tiene materiales, reactivos ni equipos asociados.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" disabled={submitting}>
          {submitting ? 'Finalizando...' : 'Confirmar Finalización'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
