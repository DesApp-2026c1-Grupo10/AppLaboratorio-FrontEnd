import { useState, useEffect } from 'react';
import { Snackbar, Alert, Box, CircularProgress } from '@mui/material';
import type { SnackbarState } from '../types/snackbar';

import PedidoForm from '../components/pedidos/PedidoForm';
import PedidoTable from '../components/pedidos/PedidoTable';
import FinalizarDialog from '../components/pedidos/FinalizarDialog';
import { getPedidos, createPedido, aprobarPedido, rechazarPedido, finalizarPedido } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import type { Pedido } from '../types/pedido';
import type { Laboratorio } from '../types/laboratorio';
import AppLayout from '../components/layout/AppLayout';
import "../styles/pedidos.css";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [loading, setLoading] = useState(true);
  const [pedidoToFinalize, setPedidoToFinalize] = useState<Pedido | null>(null);

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;
  const esAdmin = usuarioLogueado?.rol === 'Desarrollador';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [pedidosData, laboratoriosData] = await Promise.all([getPedidos(), getLaboratorios()]);
      setPedidos(pedidosData);
      setLaboratorios(laboratoriosData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const refreshLaboratorios = async () => {
    try {
      const data = await getLaboratorios();
      setLaboratorios(data);
    } catch (error) {
      console.error(error);
    }
  };

  const agregarPedido = async (pedido: Pedido) => {
    try {
      if (!usuarioLogueado) {
        setSnackbar({ msg: 'Sesión expirada. Por favor volvé a iniciar sesión.', severity: 'error' });
        return;
      }
      const pedidoConUsuario = { ...pedido, usuarioId: usuarioLogueado.id };
      const nuevoPedido = await createPedido(pedidoConUsuario);
      setPedidos([...pedidos, nuevoPedido]);
      setSnackbar({ msg: '¡Pedido creado con éxito!', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: 'No se pudo crear: ' + (error instanceof Error ? error.message : 'Error desconocido'), severity: 'error' });
      throw error;
    }
  };

  const aceptarPedido = async (id: number) => {
    try {
      const pedidoActualizado = await aprobarPedido(id);
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...pedidoActualizado } : p));
      setSnackbar({ msg: 'Pedido aprobado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al aprobar pedido', severity: 'error' });
    }
  };

  const rechazar = async (id: number) => {
    try {
      const pedidoActualizado = await rechazarPedido(id);
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...pedidoActualizado } : p));
      setSnackbar({ msg: 'Pedido rechazado', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al rechazar pedido', severity: 'error' });
    }
  };

  const handleFinalizarClick = (pedido: Pedido) => {
    setPedidoToFinalize(pedido);
  };

  const handleFinalizarConfirm = async (data: {
    materiales: { id: number; cantidad: number }[];
    reactivos: { id: number; cantidad: number }[];
    equipos: { id: number; estado: string }[];
  }) => {
    if (!usuarioLogueado || !pedidoToFinalize) return;
    const updated = await finalizarPedido(pedidoToFinalize.id, {
      usuarioId: usuarioLogueado.id,
      ...data,
    });
    setPedidos((prev) => prev.map((p) => p.id === pedidoToFinalize.id ? { ...p, ...updated } : p));
    setPedidoToFinalize(null);
    setSnackbar({ msg: 'Clase finalizada. Stock y equipos actualizados.', severity: 'success' });
  };

  return (
    <AppLayout>
      <div className="pedidos-page">
        <div className="pedidos-header">
          <h1 className="pedidos-title">Gestión de Pedidos</h1>
          <p className="pedidos-subtitle">Administrá reservas y solicitudes de laboratorios</p>
        </div>

        <div className="pedidos-stats">
          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Pedidos Totales</h2>
            <p className="pedidos-stat-number">{pedidos.length}</p>
          </div>
          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Pendientes</h2>
            <p className="pedidos-stat-number">{pedidos.filter((p) => p.estado === 'Pendiente').length}</p>
          </div>
          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Aprobados</h2>
            <p className="pedidos-stat-number">{pedidos.filter((p) => p.estado === 'Aprobado').length}</p>
          </div>
          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Rechazados</h2>
            <p className="pedidos-stat-number">{pedidos.filter((p) => p.estado === 'Rechazado').length}</p>
          </div>
        </div>

        <div className="pedidos-content">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <PedidoForm laboratorios={laboratorios} onSubmitPedido={agregarPedido} onRefreshLabs={refreshLaboratorios} />
              <br />
              <PedidoTable
                pedidos={pedidos}
                aceptarPedido={aceptarPedido}
                rechazarPedido={rechazar}
                finalizarPedido={handleFinalizarClick}
                esAdmin={esAdmin}
              />
            </>
          )}
        </div>
      </div>

      {snackbar && (
        <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>
        </Snackbar>
      )}

      <FinalizarDialog
        key={pedidoToFinalize?.id || 'none'}
        open={!!pedidoToFinalize}
        pedido={pedidoToFinalize}
        onConfirm={handleFinalizarConfirm}
        onCancel={() => setPedidoToFinalize(null)}
      />
    </AppLayout>
  );
}