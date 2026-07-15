import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Checkbox,
  FormControl, Select, MenuItem, Alert, Box, IconButton, alpha,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Pedido } from '../../types/pedido';

interface MaterialForm {
  id: number;
  name: string;
  solicitado: number;
  cantidad: number;
  descartado: boolean;
}

interface ReactivoForm {
  id: number;
  name: string;
  solicitado: number;
  cantidad: number;
  descartado: boolean;
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
    materiales: { id: number; cantidad: number; descartado: boolean }[];
    reactivos: { id: number; cantidad: number; descartado: boolean }[];
    equipos: { id: number; estado: string }[];
  }) => Promise<void>;
  onCancel: () => void;
  allMateriales?: { id: number; name: string; stock?: number }[];
  allReactivos?: { id: number; name: string; stock?: number }[];
}

function getEquipos(pedido: Pedido | null) {
  return (pedido as Pedido & { Equipments?: any[] })?.Equipments || [];
}

function parseDespensa(descripcion: string): { dMats: { id: number; cantidad: number }[]; dReas: { id: number; cantidad: number }[] } {
  const dMatch = (descripcion || '').match(/__DESPENSA__:\{.*\}/);
  if (!dMatch) return { dMats: [], dReas: [] };
  try {
    const dp = JSON.parse(dMatch[0].replace('__DESPENSA__:', ''));
    return {
      dMats: (dp.despensaMateriales || []).map((d: any) => ({ id: d.id, cantidad: d.cantidad || 1 })),
      dReas: (dp.despensaReactivos || []).map((d: any) => ({ id: d.id, cantidad: d.cantidad || 1 })),
    };
  } catch { return { dMats: [], dReas: [] }; }
}

export default function FinalizarDialog({ open, pedido, onConfirm, onCancel, allMateriales, allReactivos }: Props) {
  const [materiales, setMateriales] = useState<MaterialForm[]>([]);
  const [reactivos, setReactivos] = useState<ReactivoForm[]>([]);
  const [equipos, setEquipos] = useState<EquipoForm[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pedido) return;

    const mats: MaterialForm[] = (pedido.materiales || []).map((m) => ({
      id: m.id,
      name: m.name,
      solicitado: m.PedidoMaterial?.cantidad || 0,
      cantidad: m.PedidoMaterial?.cantidad || 0,
      descartado: false,
    }));
    const reas: ReactivoForm[] = (pedido.reactivos || []).map((r) => ({
      id: r.id,
      name: r.name,
      solicitado: r.PedidoReactivo?.cantidad || 0,
      cantidad: r.PedidoReactivo?.cantidad || 0,
      descartado: false,
    }));

    const { dMats, dReas } = parseDespensa(pedido.descripcion || '');
    if (allMateriales) {
      for (const dm of dMats) {
        if (!mats.some((m) => m.id === dm.id)) {
          const found = allMateriales.find((m) => m.id === dm.id);
          if (found) mats.push({ id: found.id, name: found.name, solicitado: dm.cantidad, cantidad: dm.cantidad, descartado: false });
        }
      }
    }
    if (allReactivos) {
      for (const dr of dReas) {
        if (!reas.some((r) => r.id === dr.id)) {
          const found = allReactivos.find((r) => r.id === dr.id);
          if (found) reas.push({ id: found.id, name: found.name, solicitado: dr.cantidad, cantidad: dr.cantidad, descartado: false });
        }
      }
    }

    setMateriales(mats);
    setReactivos(reas);
    setEquipos(getEquipos(pedido).map((e: any) => ({
      id: e.id,
      name: e.name,
      estado: 'Disponible',
    })));
    setSubmitting(false);
    setError('');
  }, [pedido, allMateriales, allReactivos]);

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      const mats = materiales.map((m) => ({ id: m.id, cantidad: m.cantidad, descartado: m.descartado }));
      const reas = reactivos.map((r) => ({ id: r.id, cantidad: r.cantidad, descartado: r.descartado }));
      const eqs = equipos.map((e) => ({ id: e.id, estado: e.estado }));
      await onConfirm({ materiales: mats, reactivos: reas, equipos: eqs });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setSubmitting(false);
    }
  };

  const tieneItems = materiales.length > 0 || reactivos.length > 0 || equipos.length > 0;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
        },
      }}
    >
      <Box sx={{
        background: 'linear-gradient(135deg, #0B1739 0%, #1a237e 50%, #283593 100%)',
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            Finalizar Pedido #{pedido?.id}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontWeight: 500 }}>
            Registrar consumo de materiales, reactivos y estado de equipos
          </Typography>
        </Box>
        <IconButton onClick={onCancel} sx={{ color: alpha('#fff', 0.7), '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3, bgcolor: '#f8fafc' }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {materiales.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#0B1739' }}>Materiales consumidos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Solicitado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Consumido</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Descartar</TableCell>
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
                    <TableCell align="center">
                      <Checkbox
                        checked={m.descartado}
                        onChange={(e) => setMateriales(materiales.map((item) =>
                          item.id === m.id ? { ...item, descartado: e.target.checked } : item
                        ))}
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
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#0B1739' }}>Reactivos consumidos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Reactivo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Solicitado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Consumido</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Descartar</TableCell>
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
                    <TableCell align="center">
                      <Checkbox
                        checked={r.descartado}
                        onChange={(e) => setReactivos(reactivos.map((item) =>
                          item.id === r.id ? { ...item, descartado: e.target.checked } : item
                        ))}
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
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#0B1739' }}>Estado final de equipos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Equipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado final</TableCell>
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
                          <MenuItem value="Fuera de servicio">Roto / Dar de baja</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {!tieneItems && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Este pedido no tiene materiales, reactivos ni equipos asociados.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onCancel} disabled={submitting}
          variant="outlined"
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, py: 1.2, borderColor: '#6366F1', color: '#6366F1', transition: 'all 0.2s ease', '&:hover': { borderColor: '#4F46E5', bgcolor: 'rgba(99,102,241,0.04)', transform: 'translateY(-1px)' } }}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={submitting}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4, py: 1.2, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }, '&.Mui-disabled': { background: '#cbd5e1', boxShadow: 'none' } }}>
          {submitting ? 'Finalizando...' : 'Confirmar Finalización'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}