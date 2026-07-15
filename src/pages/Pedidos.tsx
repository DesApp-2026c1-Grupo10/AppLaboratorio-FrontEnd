import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Box, CircularProgress, Button, FormControl, InputLabel, Select, MenuItem, Tab, Tabs, Chip } from '@mui/material';
import type { SnackbarState } from '../types/snackbar';

import PedidoTable from '../components/pedidos/PedidoTable';
import FinalizarDialog from '../components/pedidos/FinalizarDialog';
import RevisarPedidoDialog from '../components/pedidos/RevisarPedidoDialog';
import RevisionPendienteDialog from '../components/pedidos/RevisionPendienteDialog';
import ActividadesPredefinidasPanel from '../components/pedidos/ActividadesPredefinidasPanel';
import { getPedidos, aprobarPedido, rechazarPedido, cancelarPedido, finalizarPedido, deshacerAprobacionPedido, crearRevision, createPedido, getPedidosConRevisionPendiente } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import { getUsuarios } from '../api/usuarios';
import { getMateriales } from '../api/materiales';
import { getReactivos } from '../api/reactivos';
import { useWs } from '../context/WsContext';
import type { Pedido } from '../types/pedido';
import type { Laboratorio } from '../types/laboratorio';
import type { Usuario } from '../types/usuario';
import AppLayout from '../components/layout/AppLayout';
import "../styles/pedidos.css";

const ESTADOS_ACTIVOS = ['Pendiente', 'Aprobado'];
const ESTADOS_HISTORIAL = ['Finalizado', 'Rechazado', 'Cancelado'];
const CARDS_POR_PAGINA = 8;

const pills = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'Pendiente' },
  { label: 'Aprobados', value: 'Aprobado' },
  { label: 'Finalizados', value: 'Finalizado' },
  { label: 'Rechazados', value: 'Rechazado' },
];

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const navigate = useNavigate();
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [loading, setLoading] = useState(true);
  const [pedidoToFinalize, setPedidoToFinalize] = useState<Pedido | null>(null);
  const [pedidoToReview, setPedidoToReview] = useState<Pedido | null>(null);
  const [pedidoRevision, setPedidoRevision] = useState<Pedido | null>(null);
  const [pedidosConRevision, setPedidosConRevision] = useState<Set<number>>(new Set());
  const [allMateriales, setAllMateriales] = useState<{ id: number; name: string; stock?: number }[]>([]);
  const [allReactivos, setAllReactivos] = useState<{ id: number; name: string; stock?: number }[]>([]);
  const [revisionesPorPedido, setRevisionesPorPedido] = useState<Record<number, { pendiente: boolean; procesada: boolean }>>({});
  const [revisionesRespuestaVistas, setRevisionesRespuestaVistas] = useState<Set<number>>(new Set());
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroLab, setFiltroLab] = useState<number | ''>('');
  const [filtroUser, setFiltroUser] = useState<number | ''>('');
  const [orden, setOrden] = useState('fecha_desc');
  const [tabIndex, setTabIndex] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cardsLimit, setCardsLimit] = useState(CARDS_POR_PAGINA);
  const [showActividades, setShowActividades] = useState(false);

  const { on } = useWs();

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;
  const esAdmin = usuarioLogueado?.rol === 'Desarrollador';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubs = [
      on('PEDIDO_CREADO', () => { loadData(); }),
      on('PEDIDO_APROBADO', () => { loadData(); }),
      on('PEDIDO_RECHAZADO', () => { loadData(); }),
      on('PEDIDO_FINALIZADO', () => { loadData(); }),
      on('PEDIDO_CANCELADO', () => { loadData(); }),
      on('PEDIDO_MODIFICADO', () => { loadData(); }),
      on('REVISION_CREADA', () => { loadData(); }),
      on('REVISION_ACEPTADA', () => { loadData(); }),
      on('REVISION_RECHAZADA', () => { loadData(); }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [on]);

  async function loadData() {
    try {
      const fetchParams = esAdmin ? {} : { usuarioId: usuarioLogueado?.id, rol: usuarioLogueado?.rol };
      const [pedidosData, laboratoriosData, revMap, usuariosData, matsData, reasData] = await Promise.all([
        getPedidos(fetchParams),
        getLaboratorios(),
        getPedidosConRevisionPendiente(),
        getUsuarios(),
        getMateriales(),
        getReactivos(),
      ]);
      setPedidos(pedidosData);
      setLaboratorios(laboratoriosData);
      setRevisionesPorPedido(revMap);
      setUsuarios(usuariosData);
      setAllMateriales(matsData);
      setAllReactivos(reasData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

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

  const deshacer = async (id: number) => {
    try {
      await deshacerAprobacionPedido(id, usuarioLogueado?.id);
      const pedidosData = await getPedidos();
      setPedidos(pedidosData);
      setSnackbar({ msg: 'Aprobación deshecha. Stock restaurado.', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al deshacer aprobación', severity: 'error' });
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

  const handleCancelar = async (id: number) => {
    try {
      const pedidoActualizado = await cancelarPedido(id, usuarioLogueado.id);
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...pedidoActualizado } : p));
      setSnackbar({ msg: 'Pedido cancelado', severity: 'success' });
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al cancelar pedido', severity: 'error' });
    }
  };

  const handleFinalizarClick = (pedido: Pedido) => setPedidoToFinalize(pedido);
  const handleRevisar = (pedido: Pedido) => setPedidoToReview(pedido);

  const handleEnviarRevision = async (comentario: string, cambios: Record<string, any>) => {
    if (!usuarioLogueado || !pedidoToReview) return;
    if (Object.keys(cambios).length === 0) {
      setSnackbar({ msg: 'No hay cambios propuestos. Modificá al menos un campo.', severity: 'error' });
      return;
    }
    await crearRevision(pedidoToReview.id, { usuarioId: usuarioLogueado.id, comentario, cambios });
    setSnackbar({ msg: 'Revisión enviada al creador del pedido.', severity: 'success' });
  };

  const handleVerRevision = (pedido: Pedido) => setPedidoRevision(pedido);

  const agregarPedido = async (data: Record<string, any>) => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    await createPedido({ ...data, usuarioId: usuario.id });
    setSnackbar({ msg: 'Pedido creado correctamente', severity: 'success' });
    loadData();
  };

  const refreshLaboratorios = async () => {
    const labs = await getLaboratorios();
    setLaboratorios(labs);
  };

  const handleSelectActividad = async (actividad: any, fecha: string, horaInicio: string, horaFin: string) => {
    setShowActividades(false);
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    try {
      await createPedido({
        fecha,
        horaInicio,
        horaFin,
        laboratorioId: actividad.laboratorioId,
        cantidadAlumnos: actividad.cantidadAlumnos,
        descripcion: actividad.descripcion || '',
        materiales: actividad.config?.materiales || [],
        reactivos: actividad.config?.reactivos || [],
        equipos: actividad.config?.equipos || [],
        despensaMateriales: actividad.config?.despensaMateriales || [],
        despensaReactivos: actividad.config?.despensaReactivos || [],
        usuarioId: usuario.id,
      });
      setSnackbar({ msg: `Actividad "${actividad.nombre}" creada como pedido`, severity: 'success' });
      loadData();
    } catch (err) {
      setSnackbar({ msg: err instanceof Error ? err.message : 'Error al crear pedido desde actividad', severity: 'error' });
    }
  };

  const marcarRevisionVista = (pedidoId: number) => {
    setRevisionesRespuestaVistas((prev) => new Set(prev).add(pedidoId));
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

  const pedidosFiltrados = useMemo(() => {
    let lista = [...pedidos];

    if (filtroLab !== '') {
      lista = lista.filter((p) => p.laboratorioId === filtroLab);
    }
    if (filtroUser !== '') {
      lista = lista.filter((p) => p.usuarioId === filtroUser);
    }

    lista.sort((a, b) => {
      switch (orden) {
        case 'fecha_asc': return a.fecha.localeCompare(b.fecha);
        case 'fecha_desc': return b.fecha.localeCompare(a.fecha);
        case 'hora_asc': return a.horaInicio.localeCompare(b.horaInicio);
        case 'hora_desc': return b.horaInicio.localeCompare(a.horaInicio);
        case 'id_asc': return a.id - b.id;
        case 'id_desc': return b.id - a.id;
        default: return 0;
      }
    });

    return lista;
  }, [pedidos, filtroLab, filtroUser, orden]);

  const activos = useMemo(() => {
    let lista = pedidosFiltrados.filter((p) => ESTADOS_ACTIVOS.includes(p.estado));
    if (filtroEstado && filtroEstado !== '') {
      lista = lista.filter((p) => p.estado === filtroEstado);
    }
    return lista;
  }, [pedidosFiltrados, filtroEstado]);

  const historial = useMemo(() => {
    let lista = pedidosFiltrados.filter((p) => ESTADOS_HISTORIAL.includes(p.estado));
    if (filtroEstado && filtroEstado !== '') {
      lista = lista.filter((p) => p.estado === filtroEstado);
    }
    return lista;
  }, [pedidosFiltrados, filtroEstado]);

  const activosVisibles = useMemo(() => activos.slice(0, cardsLimit), [activos, cardsLimit]);
  const hayMasActivos = activos.length > cardsLimit;

  const handleTabChange = (_: any, newIndex: number) => {
    setTabIndex(newIndex);
    setCardsLimit(CARDS_POR_PAGINA);
    setFiltroEstado('');
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="large" onClick={() => navigate('/pedidos/nuevo')}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, py: 1.2, bgcolor: '#6366F1', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#4F46E5', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' } }}>
                    + Nuevo Pedido
                  </Button>
                  <Button variant="outlined" size="large" onClick={() => setShowActividades(true)}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, py: 1.2, borderColor: '#6366F1', color: '#6366F1', transition: 'all 0.2s ease', '&:hover': { borderColor: '#4F46E5', bgcolor: 'rgba(99,102,241,0.04)', transform: 'translateY(-1px)' } }}>
                    Actividades Predefinidas
                  </Button>
                </Box>
                <Box />
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, mt: 4 }}>
                <Tabs value={tabIndex} onChange={handleTabChange}>
                  <Tab label={`Activos (${pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length})`} />
                  <Tab label={`Historial (${pedidos.filter((p) => ESTADOS_HISTORIAL.includes(p.estado)).length})`} />
                </Tabs>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {pills.map((p) => (
                    <Chip
                      key={p.value}
                      label={p.label}
                      variant={filtroEstado === p.value ? 'filled' : 'outlined'}
                      color={filtroEstado === p.value ? 'primary' : 'default'}
                      onClick={() => setFiltroEstado(filtroEstado === p.value ? '' : p.value)}
                      clickable
                      size="small"
                    />
                  ))}
                </Box>
                {esAdmin && (
                  <>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Laboratorio</InputLabel>
                      <Select value={filtroLab} label="Laboratorio" onChange={(e) => setFiltroLab(e.target.value as number | '')}>
                        <MenuItem value="">Todos</MenuItem>
                        {laboratorios.map((l) => <MenuItem key={l.id} value={l.id}>{l.nombre}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Usuario</InputLabel>
                      <Select value={filtroUser} label="Usuario" onChange={(e) => { setFiltroUser(e.target.value as number | ''); }}>
                        <MenuItem value="">Todos</MenuItem>
                        {usuarios.map((u) => <MenuItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </>
                )}
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select value={orden} label="Ordenar por" onChange={(e) => setOrden(e.target.value)}>
                    <MenuItem value="fecha_desc">Fecha (más reciente)</MenuItem>
                    <MenuItem value="fecha_asc">Fecha (más antiguo)</MenuItem>
                    <MenuItem value="hora_desc">Hora (más tarde)</MenuItem>
                    <MenuItem value="hora_asc">Hora (más temprano)</MenuItem>
                    <MenuItem value="id_desc">ID (más reciente)</MenuItem>
                    <MenuItem value="id_asc">ID (más antiguo)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {tabIndex === 0 ? (
                <>
                  <PedidoTable
                    pedidos={activosVisibles}
                    aceptarPedido={aceptarPedido}
                    rechazarPedido={rechazar}
                    cancelarPedido={handleCancelar}
                    deshacerAprobacion={deshacer}
                    finalizarPedido={handleFinalizarClick}
                    esAdmin={esAdmin}
                    onRevisar={esAdmin ? handleRevisar : undefined}
                    onVerRevision={handleVerRevision}
                    pedidosConRevision={pedidosConRevision}
                    revisionesPorPedido={revisionesPorPedido}
                    usuarioLogueadoId={usuarioLogueado?.id}
                    revisionesRespuestaVistas={revisionesRespuestaVistas}
                    onMarcarRevisionVista={marcarRevisionVista}
                    vista="cards"
                  />
                  {hayMasActivos && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button variant="outlined" onClick={() => setCardsLimit(cardsLimit + CARDS_POR_PAGINA)}>
                        Ver más pedidos ({activos.length - cardsLimit} restantes)
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <PedidoTable
                  pedidos={historial}
                  aceptarPedido={aceptarPedido}
                  rechazarPedido={rechazar}
                  cancelarPedido={handleCancelar}
                  deshacerAprobacion={deshacer}
                  esAdmin={esAdmin}
                  onRevisar={esAdmin ? handleRevisar : undefined}
                  onVerRevision={handleVerRevision}
                  pedidosConRevision={pedidosConRevision}
                  revisionesPorPedido={revisionesPorPedido}
                  usuarioLogueadoId={usuarioLogueado?.id}
                  revisionesRespuestaVistas={revisionesRespuestaVistas}
                  onMarcarRevisionVista={marcarRevisionVista}
                  vista="cards"
                />
              )}
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
        allMateriales={allMateriales}
        allReactivos={allReactivos}
      />

      <ActividadesPredefinidasPanel
        open={showActividades}
        laboratorios={laboratorios}
        onSelectActividad={handleSelectActividad}
        onClose={() => setShowActividades(false)}
      />
    </AppLayout>
  );
}