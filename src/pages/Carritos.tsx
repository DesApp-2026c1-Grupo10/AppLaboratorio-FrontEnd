import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions, Button, Chip,
  Checkbox, Table, TableBody, TableCell, TableRow, CircularProgress, IconButton, alpha,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getCarritos, marcarCarritoPreparado, marcarItemPreparado, eliminarCarrito } from '../api/carritos';
import { useWs } from '../context/WsContext';

interface CarritoItemData {
  id: number; tipo: string; itemId: number; nombre: string;
  cantidad: number; preparado: boolean;
}

interface CarritoData {
  id: number; pedidoId: number; preparado: boolean;
  items: CarritoItemData[];
  Pedido?: { id: number; fecha: string; horaInicio: string; horaFin: string; estado?: string };
  createdAt: string;
}

export default function Carritos() {
  const [carritos, setCarritos] = useState<CarritoData[]>([]);
  const [loading, setLoading] = useState(true);
  const { on } = useWs();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCarritos();
      setCarritos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const unsub = on('CARRITO_ACTUALIZADO', () => { loadData(); });
    return unsub;
  }, [on]);

  const toggleItem = async (id: number) => {
    await marcarItemPreparado(id);
    loadData();
  };

  const confirmarCarrito = async (id: number) => {
    await marcarCarritoPreparado(id);
    loadData();
  };

  const handleDelete = async (id: number) => {
    await eliminarCarrito(id);
    loadData();
  };

  const pendientes = carritos.filter((c) => {
    const est = c.Pedido?.estado;
    return est === 'Pendiente' && !c.preparado;
  });

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739', mb: 1 }}>Carritos de Preparación</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Items solicitados desde Despensa para preparar
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : pendientes.length === 0 ? (
          <Typography color="text.secondary">No hay carritos pendientes de Despensa</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 3 }}>
            {pendientes.map((c) => {
              const todosListos = c.items.length > 0 && c.items.every((i) => i.preparado);
              return (
                <Card key={c.id} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: 4, borderColor: 'warning.main', position: 'relative' }}>
                  <IconButton
                    onClick={() => handleDelete(c.id)}
                    sx={{
                      position: 'absolute', top: 8, right: 8,
                      bgcolor: alpha('#ef5350', 0.1), color: '#ef5350',
                      width: 32, height: 32,
                      '&:hover': { bgcolor: alpha('#ef5350', 0.25) },
                      zIndex: 1,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0B1739' }}>
                        Pedido #{c.pedidoId}
                      </Typography>
                      <Chip label="Despensa" size="small" color="warning" variant="outlined" />
                    </Box>
                    {c.Pedido && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {c.Pedido.fecha} | {c.Pedido.horaInicio} - {c.Pedido.horaFin}
                      </Typography>
                    )}

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Cant.</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Listo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {c.items.map((item) => (
                          <TableRow key={item.id}
                            sx={{ textDecoration: item.preparado ? 'line-through' : 'none', opacity: item.preparado ? 0.5 : 1 }}>
                            <TableCell>{item.nombre}</TableCell>
                            <TableCell>
                              <Chip label={item.tipo} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">{item.cantidad}</TableCell>
                            <TableCell align="center">
                              <Checkbox checked={item.preparado} onChange={() => toggleItem(item.id)} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>

                  <CardActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      disabled={!todosListos}
                      onClick={() => confirmarCarrito(c.id)}
                      sx={{
                        textTransform: 'none', fontWeight: 600, borderRadius: 2.5, px: 4,
                        bgcolor: todosListos ? '#0B1739' : undefined,
                        '&:hover': todosListos ? { bgcolor: '#1a237e' } : undefined,
                      }}
                    >
                      Confirmar Pedido
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
