import { useState, useEffect } from 'react';
import { Snackbar, Alert, Box, CircularProgress, Switch, FormControlLabel, Button } from '@mui/material';
import type { SnackbarState } from '../types/snackbar';
import type { ActividadPredefinida } from '../types/actividadPredefinida';

import PedidoForm from '../components/pedidos/PedidoForm';
import PedidoTable from '../components/pedidos/PedidoTable';
import FinalizarDialog from '../components/pedidos/FinalizarDialog';
import ActividadesPredefinidasPanel from '../components/pedidos/ActividadesPredefinidasPanel';
import RevisarPedidoDialog from '../components/pedidos/RevisarPedidoDialog';
import RevisionPendienteDialog from '../components/pedidos/RevisionPendienteDialog';
import { getPedidos, createPedido, aprobarPedido, rechazarPedido, finalizarPedido, crearRevision } from '../api/pedidos';
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
  const [soloMios, setSoloMios] = useState(false);
  const [showActividades, setShowActividades] = useState(false);
  const [pedidoToReview, setPedidoToReview] = useState<Pedido | null>(null);
  const [pedidoRevision, setPedidoRevision] = useState<Pedido | null>(null);
  const [pedidosConRevision, setPedidosConRevision] = useState<Set<number>>(new Set());

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
      await aprobarPedido(id, usuarioLogueado?.id);
      const pedidosData = await getPedidos();
      setPedidos(pedidosData);
      setSnackbar({ msg: 'Pedido aprobado correctamente. Pedidos conflictivos rechazados.', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al aprobar pedido', severity: 'error' });
    }
  };

  const rechazar = async (id: number) => {
    try {
      const pedidoActualizado = await rechazarPedido(id, usuarioLogueado?.id);
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...pedidoActualizado } : p));
      setSnackbar({ msg: 'Pedido rechazado', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al rechazar pedido', severity: 'error' });
    }
  };

  const handleSelectActividad = async (act: ActividadPredefinida, fecha: string, horaInicio: string, horaFin: string) => {
    if (!usuarioLogueado) return;
    try {
      const pedidoData: Record<string, any> = {
        fecha,
        horaInicio,
        horaFin,
        laboratorioId: act.laboratorioId,
        cantidadAlumnos: act.cantidadAlumnos,
        descripcion: act.descripcion || `Desde actividad: ${act.nombre}`,
        usuarioId: usuarioLogueado.id,
        materiales: act.config?.materiales || [],
        reactivos: act.config?.reactivos || [],
        equipos: act.config?.equipos || [],
      };
      const nuevoPedido = await createPedido(pedidoData);
      setPedidos([...pedidos, nuevoPedido]);
      setShowActividades(false);
      setSnackbar({ msg: `Pedido creado desde la actividad "${act.nombre}"`, severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: 'Error al crear pedido: ' + (error instanceof Error ? error.message : ''), severity: 'error' });
    }
  };

  const handleFinalizarClick = (pedido: Pedido) => {
    setPedidoToFinalize(pedido);
  };

  const handleRevisar = (pedido: Pedido) => {
    setPedidoToReview(pedido);
  };

  const handleEnviarRevision = async (comentario: string, cambios: Record<string, any>) => {
    if (!usuarioLogueado || !pedidoToReview) return;
    if (Object.keys(cambios).length === 0) {
      setSnackbar({ msg: 'No hay cambios propuestos. Modificá al menos un campo.', severity: 'error' });
      return;
    }
    try {
      await crearRevision(pedidoToReview.id, { usuarioId: usuarioLogueado.id, comentario, cambios });
      setSnackbar({ msg: 'Revisión enviada al creador del pedido.', severity: 'success' });
      setPedidoToReview(null);
    } catch (error) {
      setSnackbar({ msg: 'Error al enviar revisión: ' + (error instanceof Error ? error.message : ''), severity: 'error' });
    }
  };

  const handleVerRevision = (pedido: Pedido) => {
    setPedidoRevision(pedido);
  };

  const handleRevisionComplete = (updatedPedido?: Pedido) => {
    const pid = pedidoRevision?.id;
    if (pid) setPedidosConRevision((prev) => new Set(prev).add(pid));
    if (updatedPedido) {
      setPedidos((prev) => prev.map((p) => p.id === updatedPedido.id ? updatedPedido : p));
    }
    setPedidoRevision(null);
    setSnackbar({ msg: 'Revisión procesada.', severity: 'success' });
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
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button variant="outlined" onClick={(e) => { e.currentTarget.blur(); setShowActividades(true); }}>
                  Actividades Predefinidas
                </Button>
              </Box>
              <ActividadesPredefinidasPanel
                open={showActividades}
                laboratorios={laboratorios}
                onSelectActividad={handleSelectActividad}
                onClose={() => setShowActividades(false)}
              />
              <br />
              <FormControlLabel
                control={<Switch checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} />}
                label="Mis pedidos"
                sx={{ mb: 1 }}
              />
              <PedidoTable
                pedidos={soloMios ? pedidos.filter((p) => p.usuarioId === usuarioLogueado?.id) : pedidos}
                aceptarPedido={aceptarPedido}
                rechazarPedido={rechazar}
                finalizarPedido={handleFinalizarClick}
                esAdmin={esAdmin}
                onRevisar={esAdmin ? handleRevisar : undefined}
                onVerRevision={!esAdmin ? handleVerRevision : undefined}
                pedidosConRevision={pedidosConRevision}
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

      <RevisarPedidoDialog
        open={!!pedidoToReview}
        pedido={pedidoToReview}
        onSubmit={handleEnviarRevision}
        onClose={() => setPedidoToReview(null)}
      />

      <RevisionPendienteDialog
        open={!!pedidoRevision}
        pedido={pedidoRevision}
        usuarioId={usuarioLogueado?.id}
        onComplete={handleRevisionComplete}
        onClose={() => setPedidoRevision(null)}
      />

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