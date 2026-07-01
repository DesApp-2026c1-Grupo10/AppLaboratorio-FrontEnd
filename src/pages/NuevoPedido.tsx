import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Box, CircularProgress, Typography, Button } from '@mui/material';
import type { SnackbarState } from '../types/snackbar';
import PedidoForm from '../components/pedidos/PedidoForm';
import { createPedido } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import { useWs } from '../context/WsContext';
import type { Laboratorio } from '../types/laboratorio';
import AppLayout from '../components/layout/AppLayout';

export default function NuevoPedido() {
  const navigate = useNavigate();
  const { on } = useWs();
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  useEffect(() => {
    getLaboratorios().then(setLaboratorios).catch(console.error);
  }, []);

  useEffect(() => {
    const unsub = on('INVENTARIO_MODIFICADO', () => {
      getLaboratorios().then(setLaboratorios).catch(console.error);
    });
    return unsub;
  }, [on]);

  const agregarPedido = async (data: Record<string, any>) => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    await createPedido({
      ...data,
      usuarioId: usuario.id,
    });
    setSnackbar({ msg: 'Pedido creado correctamente', severity: 'success' });
    setTimeout(() => navigate('/pedidos'), 1500);
  };

  const refreshLaboratorios = async () => {
    const labs = await getLaboratorios();
    setLaboratorios(labs);
  };

  return (
    <AppLayout>
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739' }}>Nuevo Pedido</Typography>
            <Typography variant="body1" color="text.secondary">Completá los pasos para crear un pedido de laboratorio</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate('/pedidos')}>Volver</Button>
        </Box>

        {laboratorios.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <PedidoForm
            laboratorios={laboratorios}
            onSubmitPedido={agregarPedido}
            onRefreshLabs={refreshLaboratorios}
          />
        )}
      </Box>

      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
