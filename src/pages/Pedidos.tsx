import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import PedidoForm from '../components/pedidos/PedidoForm';
import PedidoTable from '../components/pedidos/PedidoTable';
import { getPedidos, createPedido, aprobarPedido, rechazarPedido, finalizarPedido } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import AppLayout from '../components/layout/AppLayout';
import type { Pedido } from '../types/pedido';
import '../styles/pedidos.css';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [pedidosData, laboratoriosData] = await Promise.all([getPedidos(), getLaboratorios()]);
      setPedidos(pedidosData);
      setLaboratorios(laboratoriosData);
    } catch (error) { console.error(error); }
  }

  const agregarPedido = async (pedido: any) => {
    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) { throw new Error('Sesión expirada'); }
    const usuarioLogueado = JSON.parse(usuarioStorage);
    const nuevoPedido = await createPedido({ ...pedido, usuarioId: usuarioLogueado.id });
    setPedidos([...pedidos, nuevoPedido]);
    setSnackbar({ msg: 'Pedido creado con éxito', severity: 'success' });
    return nuevoPedido;
  };

  const handleAprobar = async (id: number) => {
    try {
      const updated = await aprobarPedido(id);
      setPedidos((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSnackbar({ msg: 'Pedido aprobado', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ msg: error.message, severity: 'error' });
    }
  };

  const handleRechazar = async (id: number) => {
    try {
      const updated = await rechazarPedido(id);
      setPedidos((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSnackbar({ msg: 'Pedido rechazado', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ msg: error.message, severity: 'error' });
    }
  };

  const handleFinalizar = async (id: number) => {
    try {
      const usuarioStorage = localStorage.getItem('usuario');
      if (!usuarioStorage) { setSnackbar({ msg: 'Sesión expirada', severity: 'error' }); return; }
      const usuario = JSON.parse(usuarioStorage);
      const updated = await finalizarPedido(id, usuario.id);
      setPedidos((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSnackbar({ msg: 'Pedido finalizado. Stock y equipos actualizados.', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ msg: error.message, severity: 'error' });
    }
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
            <h2 className="pedidos-stat-title">Finalizados</h2>
            <p className="pedidos-stat-number">{pedidos.filter((p) => p.estado === 'Finalizado').length}</p>
          </div>
          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Rechazados</h2>
            <p className="pedidos-stat-number">{pedidos.filter((p) => p.estado === 'Rechazado').length}</p>
          </div>
        </div>

        <div className="pedidos-content">
          <PedidoForm laboratorios={laboratorios} onSubmitPedido={agregarPedido} />
          <br />
          <PedidoTable
            pedidos={pedidos}
            aceptarPedido={handleAprobar}
            rechazarPedido={handleRechazar}
            finalizarPedido={handleFinalizar}
          />
        </div>
      </div>

      {snackbar && (
        <Snackbar open autoHideDuration={4000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
        </Snackbar>
      )}
    </AppLayout>
  );
}
