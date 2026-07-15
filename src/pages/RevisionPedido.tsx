import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Table, TableBody, TableCell, TableRow,
  Checkbox, CircularProgress, alpha, Card, CardContent, Snackbar, Alert,
  Chip,
} from '@mui/material';
import { ArrowBack, Send as SendIcon, Inventory2Outlined, BiotechOutlined, BuildOutlined } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getPedido, getRevisiones, crearRevision, aceptarRevision, rechazarRevision } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import { getMateriales } from '../api/materiales';
import { getReactivos } from '../api/reactivos';
import { getEquipos } from '../api/equipos';
import { useWs } from '../context/WsContext';
import type { Pedido } from '../types/pedido';
import type { PedidoRevision } from '../types/pedidoRevision';
import type { Laboratorio } from '../types/laboratorio';

export default function RevisionPedido() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const usuarioStorage = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('user') || '{}');
  const esAdmin = usuarioStorage?.rol === 'Desarrollador';

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [reactivos, setReactivos] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [revisiones, setRevisiones] = useState<PedidoRevision[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazoInput, setShowRechazoInput] = useState(false);

  const [editFecha, setEditFecha] = useState('');
  const [editHoraInicio, setEditHoraInicio] = useState('');
  const [editHoraFin, setEditHoraFin] = useState('');
  const [editLabId, setEditLabId] = useState<number | ''>('');
  const [editAlumnos, setEditAlumnos] = useState(1);
  const [editDesc, setEditDesc] = useState('');

  const [selectedMats, setSelectedMats] = useState<{ id: number; cantidad: number }[]>([]);
  const [selectedReas, setSelectedReas] = useState<{ id: number; cantidad: number }[]>([]);
  const [selectedEqs, setSelectedEqs] = useState<number[]>([]);

  const [despensaMats, setDespensaMats] = useState<{ id: number; cantidad: number }[]>([]);
  const [despensaReas, setDespensaReas] = useState<{ id: number; cantidad: number }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ped, revs, labs, mats, reas, eqs] = await Promise.all([
        getPedido(Number(id)),
        getRevisiones(Number(id)),
        getLaboratorios(),
        getMateriales(),
        getReactivos(),
        getEquipos(),
      ]);
      setPedido(ped);
      setRevisiones(revs);
      setLaboratorios(labs);
      setMateriales(mats);
      setReactivos(reas);
      setEquipos(eqs);

      setEditFecha(ped.fecha || '');
      setEditHoraInicio(ped.horaInicio || '');
      setEditHoraFin(ped.horaFin || '');
      setEditLabId(ped.laboratorioId || '');
      setEditAlumnos(ped.cantidadAlumnos || 1);
      setEditDesc(ped.descripcion || '');

      const matsList = (ped.materiales || []).map((m: any) => ({ id: m.id, cantidad: m.PedidoMaterial?.cantidad || 1 }));
      const reasList = (ped.reactivos || []).map((r: any) => ({ id: r.id, cantidad: r.PedidoReactivo?.cantidad || 1 }));

      const desc = ped.descripcion || '';
      const dMatch = desc.match(/__DESPENSA__:\{.*\}/);
      if (dMatch) {
        const jsonStr = dMatch[0].replace('__DESPENSA__:', '');
        try {
          const dp = JSON.parse(jsonStr);
          const dMats = (dp.despensaMateriales || []).map((d: any) => ({ id: d.id, cantidad: d.cantidad || 1 }));
          const dReas = (dp.despensaReactivos || []).map((d: any) => ({ id: d.id, cantidad: d.cantidad || 1 }));
          setDespensaMats(dMats);
          setDespensaReas(dReas);
          for (const dm of dMats) {
            if (!matsList.some((m) => m.id === dm.id)) matsList.push(dm);
          }
          for (const dr of dReas) {
            if (!reasList.some((r) => r.id === dr.id)) reasList.push(dr);
          }
        } catch { /* ignore */ }
      }

      setSelectedMats(matsList);
      setSelectedReas(reasList);
      setSelectedEqs((ped.Equipments || []).map((e: any) => e.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [revisiones]);

  const { on } = useWs();
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    unsubs.push(on('REVISION_CREADA', (data) => {
      if (data.pedidoId === Number(id)) {
        setRevisiones((prev) => {
          if (prev.some((r) => r.id === data.revision.id)) return prev;
          return [...prev, data.revision];
        });
      }
    }));
    unsubs.push(on('REVISION_ACEPTADA', (data) => {
      if (data.pedidoId === Number(id)) fetchData();
    }));
    unsubs.push(on('REVISION_RECHAZADA', (data) => {
      if (data.pedidoId === Number(id)) fetchData();
    }));
    return () => unsubs.forEach((fn) => fn());
  }, [id, on]);

  const pendingRevision = revisiones.find((r) => r.estado === 'pendiente') || null;

  const labEdificio = useMemo(() => {
    if (!editLabId) return null;
    const lab = laboratorios.find((l) => l.id === editLabId);
    return lab?.edificio || null;
  }, [editLabId, laboratorios]);

  const itemsEdificio = useMemo(() => {
    if (!labEdificio) return { materiales: [], reactivos: [], equipos: [] };
    return {
      materiales: materiales.filter((m: any) => m.laboratorio?.edificio === labEdificio),
      reactivos: reactivos.filter((r: any) => r.laboratorio?.edificio === labEdificio),
      equipos: equipos.filter((e: any) => e.laboratorio?.edificio === labEdificio || (!e.laboratorioId && e.is_movable)),
    };
  }, [labEdificio, materiales, reactivos, equipos]);

  const itemsDespensaDisponibles = useMemo(() => {
    return {
      materiales: materiales.filter((m: any) => !m.laboratorioId),
      reactivos: reactivos.filter((r: any) => !r.laboratorioId),
    };
  }, [materiales, reactivos]);

  const itemsDespensaSeleccionados = useMemo(() => {
    return {
      materiales: materiales.filter((m: any) => despensaMats.some((d) => d.id === m.id)),
      reactivos: reactivos.filter((r: any) => despensaReas.some((d) => d.id === r.id)),
    };
  }, [materiales, reactivos, despensaMats, despensaReas]);

  // Items originales que pidio el profesor (para vista profesor)
  const originalMats = useMemo(() => {
    if (!pedido) return [];
    return (pedido.materiales || []).map((m: any) => ({
      id: m.id, name: m.name, cantidad: m.PedidoMaterial?.cantidad || 1,
    }));
  }, [pedido]);

  const originalReas = useMemo(() => {
    if (!pedido) return [];
    return (pedido.reactivos || []).map((r: any) => ({
      id: r.id, name: r.name, cantidad: r.PedidoReactivo?.cantidad || 1,
    }));
  }, [pedido]);

  const originalEqs = useMemo(() => {
    if (!pedido) return [];
    return (pedido.Equipments || []).map((e: any) => ({ id: e.id, name: e.name }));
  }, [pedido]);

  const originalDespensaMats = useMemo(() => {
    return materiales.filter((m: any) => despensaMats.some((d) => d.id === m.id));
  }, [materiales, despensaMats]);

  const originalDespensaReas = useMemo(() => {
    return reactivos.filter((r: any) => despensaReas.some((d) => d.id === r.id));
  }, [reactivos, despensaReas]);

  // Cambios propuestos por el dev
  const cambios = pendingRevision?.cambios || {};
  const cambiosMateriales = (cambios.materiales as any[]) || null;
  const cambiosReactivos = (cambios.reactivos as any[]) || null;
  const cambiosEquipos = (cambios.equipos as number[]) || null;

  const handleGuardarDev = async () => {
    if (!pedido || !id) return;
    setSaving(true);
    try {
      const originalDesc = pedido.descripcion || '';
      const advertenciaMatch = originalDesc.match(/\[Advertencias:.*?\]/);
      const advertencia = advertenciaMatch ? advertenciaMatch[0] : '';
      const cleanDesc = editDesc.replace(/(\[Advertencias:.*?\]|__DESPENSA__:\{.*\})/gs, '').trim();

      // Separar items de edificio vs despensa
      const buildingMats = selectedMats.filter((s) => !despensaMats.some((d) => d.id === s.id));
      const buildingReas = selectedReas.filter((s) => !despensaReas.some((d) => d.id === s.id));

      let newDespensaData = '';
      if (despensaMats.length > 0 || despensaReas.length > 0) {
        newDespensaData = `__DESPENSA__:${JSON.stringify({
          despensaMateriales: despensaMats,
          despensaReactivos: despensaReas,
        })}`;
      }
      const finalDesc = [cleanDesc, advertencia, newDespensaData].filter(Boolean).join('\n');

      const cambiosPayload: Record<string, any> = {
        fecha: editFecha,
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
        laboratorioId: editLabId || undefined,
        cantidadAlumnos: editAlumnos,
        descripcion: finalDesc,
        materiales: buildingMats,
        reactivos: buildingReas,
        equipos: selectedEqs,
      };

      await crearRevision(Number(id), {
        comentario: 'Revisión de cambios del desarrollador',
        usuarioId: usuarioStorage.id,
        cambios: cambiosPayload,
      });
      await fetchData();
      setSnackbar({ msg: 'Revisión enviada al profesor para aprobación.', severity: 'success' });
    } catch (e) {
      setSnackbar({ msg: e instanceof Error ? e.message : 'Error al guardar revisión', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!mensaje.trim() || !id) return;
    const msg = mensaje.trim();
    setMensaje('');
    try {
      const nueva = await crearRevision(Number(id), {
        comentario: msg,
        usuarioId: usuarioStorage.id,
        cambios: {},
      });
      setRevisiones((prev) => {
        if (prev.some((r) => r.id === nueva.id)) return prev;
        return [...prev, nueva];
      });
    } catch (e) {
      setSnackbar({ msg: e instanceof Error ? e.message : 'Error al enviar mensaje', severity: 'error' });
    }
  };

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const revs = await getRevisiones(Number(id));
        setRevisiones((prev) => {
          if (revs.length > prev.length) return revs;
          return prev;
        });
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const toggleMat = (item: any) => {
    setSelectedMats((prev) => {
      const exists = prev.find((m) => m.id === item.id);
      if (exists) return prev.filter((m) => m.id !== item.id);
      return [...prev, { id: item.id, cantidad: 1 }];
    });
    if (!item.laboratorioId) {
      setDespensaMats((prev) => {
        const exists = prev.find((d) => d.id === item.id);
        if (exists) return prev.filter((d) => d.id !== item.id);
        return [...prev, { id: item.id, cantidad: 1 }];
      });
    }
  };

  const toggleRea = (item: any) => {
    setSelectedReas((prev) => {
      const exists = prev.find((r) => r.id === item.id);
      if (exists) return prev.filter((r) => r.id !== item.id);
      return [...prev, { id: item.id, cantidad: 1 }];
    });
    if (!item.laboratorioId) {
      setDespensaReas((prev) => {
        const exists = prev.find((d) => d.id === item.id);
        if (exists) return prev.filter((d) => d.id !== item.id);
        return [...prev, { id: item.id, cantidad: 1 }];
      });
    }
  };

  const toggleEq = (eqId: number) => {
    setSelectedEqs((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const setCantMat = (id: number, val: number) => {
    setSelectedMats((prev) => prev.map((m) => (m.id === id ? { ...m, cantidad: val } : m)));
    setDespensaMats((prev) => prev.map((d) => (d.id === id ? { ...d, cantidad: val } : d)));
  };
  const setCantRea = (id: number, val: number) => {
    setSelectedReas((prev) => prev.map((r) => (r.id === id ? { ...r, cantidad: val } : r)));
    setDespensaReas((prev) => prev.map((d) => (d.id === id ? { ...d, cantidad: val } : d)));
  };

  const handleAceptar = async () => {
    if (!pedido || !pendingRevision || !usuarioStorage.id) return;
    setSaving(true);
    try {
      const updated = await aceptarRevision(pedido.id, pendingRevision.id, usuarioStorage.id);
      setPedido(updated);
      const revs = await getRevisiones(Number(id));
      setRevisiones(revs);
      setSnackbar({ msg: 'Cambios aceptados correctamente.', severity: 'success' });
      setShowRechazoInput(false);
      setMotivoRechazo('');
    } catch (e) {
      setSnackbar({ msg: e instanceof Error ? e.message : 'Error al aceptar', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async () => {
    if (!pedido || !pendingRevision || !usuarioStorage.id) return;
    if (!motivoRechazo.trim()) { setSnackbar({ msg: 'Escribí un motivo para rechazar', severity: 'error' }); return; }
    setSaving(true);
    try {
      await rechazarRevision(pedido.id, pendingRevision.id, motivoRechazo, usuarioStorage.id);
      const revs = await getRevisiones(Number(id));
      setRevisiones(revs);
      setSnackbar({ msg: 'Cambios rechazados.', severity: 'info' });
      setShowRechazoInput(false);
      setMotivoRechazo('');
    } catch (e) {
      setSnackbar({ msg: e instanceof Error ? e.message : 'Error al rechazar', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const limpiarDesc = (txt: string) => txt.replace(/(\[Advertencias:.*?\]|__DESPENSA__:\{.*\})/gs, '').trim() || '(sin descripción)';

  function renderTable(
    titulo: string,
    icon: React.ReactNode,
    items: any[],
    tipo: 'mat' | 'rea' | 'eq',
    colorNormal: boolean,
    readOnly?: boolean,
  ) {
    const colSpan = (esAdmin && !readOnly) ? 3 : 2;
    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, fontWeight: 600, color: colorNormal ? undefined : 'warning.dark' }}>
          {icon} {titulo}
        </Typography>
        <Table size="small">
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={colSpan}><Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 1 }}>(ninguno)</Typography></TableCell></TableRow>
            )}
            {items.map((item: any) => {
              const sel = tipo === 'mat' ? selectedMats.find((s) => s.id === item.id)
                : tipo === 'rea' ? selectedReas.find((s) => s.id === item.id)
                : selectedEqs.includes(item.id);
              return (
                <TableRow key={item.id} hover sx={{ cursor: (esAdmin && !readOnly) ? 'pointer' : 'default' }}
                  onClick={() => { if (esAdmin && !readOnly) { tipo === 'eq' ? toggleEq(item.id) : tipo === 'mat' ? toggleMat(item) : toggleRea(item); } }}>
                  {(esAdmin && !readOnly) && (
                    <TableCell padding="checkbox">
                      <Checkbox checked={!!sel}
                        sx={colorNormal ? {} : { color: 'warning.main', '&.Mui-checked': { color: 'warning.main' } }} />
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography sx={{ fontWeight: colorNormal ? 400 : 500 }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  {(esAdmin && !readOnly) && (
                    <TableCell align="right" sx={{ width: 120 }}>
                      {sel && tipo !== 'eq' && (
                        <TextField type="number" size="small" value={tipo === 'mat' ? (sel as any).cantidad : (sel as any).cantidad}
                          onChange={(e) => { e.stopPropagation(); if (tipo === 'mat') setCantMat(item.id, Math.max(1, Number(e.target.value))); else setCantRea(item.id, Math.max(1, Number(e.target.value))); }}
                          slotProps={{ htmlInput: { min: 1, style: { textAlign: 'center' } } }}
                          sx={{ width: 80 }} onClick={(e) => e.stopPropagation()} />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </>
    );
  }

  if (loading) return <AppLayout><Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box></AppLayout>;
  if (!pedido) return <AppLayout><Typography>Pedido no encontrado</Typography></AppLayout>;

  // ===================== PROFESOR MODE =====================
  if (!esAdmin) {
    return (
      <AppLayout>
        <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/pedidos')}
            sx={{ mb: 2, textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3, py: 0.8, border: '2px solid', borderColor: '#6366F1', color: '#6366F1', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { borderColor: '#4F46E5', bgcolor: 'rgba(99,102,241,0.06)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.2)' } }}>
            Volver a Pedidos
          </Button>

          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739', mb: 3 }}>
            Revisión - Pedido #{pedido.id}
          </Typography>

          {/* Detalle del pedido (read-only) */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Detalle del Pedido</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField label="Fecha" type="date" value={editFecha} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }} />
                  <TextField label="Hora Inicio" type="time" value={editHoraInicio} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }} />
                  <TextField label="Hora Fin" type="time" value={editHoraFin} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField label="Laboratorio" select value={editLabId} size="small" sx={{ flex: 1 }} slotProps={{ select: { native: true, readOnly: true } }}>
                    <option value="">Seleccionar...</option>
                    {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nombre} ({l.edificio})</option>)}
                  </TextField>
                  <TextField label="Alumnos" type="number" value={editAlumnos} size="small" sx={{ flex: 1 }} slotProps={{ input: { readOnly: true } }} />
                </Box>
                <TextField label="Descripción" value={limpiarDesc(editDesc)} size="small" multiline rows={2} fullWidth slotProps={{ input: { readOnly: true } }} />
              </Box>
            </CardContent>
          </Card>

          {/* Items originales que pidio el profesor */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Items solicitados en el pedido</Typography>
              {originalMats.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><Inventory2Outlined sx={{ fontSize: 18, mr: 0.5 }} /> Materiales</Typography>
                  <Box sx={{ pl: 2, mb: 1 }}>{originalMats.map((m: any) => <Typography key={m.id} variant="body2">• {m.name} x{m.cantidad}</Typography>)}</Box>
                </>
              )}
              {originalReas.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><BiotechOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Reactivos</Typography>
                  <Box sx={{ pl: 2, mb: 1 }}>{originalReas.map((r: any) => <Typography key={r.id} variant="body2">• {r.name} x{r.cantidad}</Typography>)}</Box>
                </>
              )}
              {originalEqs.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><BuildOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Equipos</Typography>
                  <Box sx={{ pl: 2, mb: 1 }}>{originalEqs.map((e: any) => <Typography key={e.id} variant="body2">• {e.name}</Typography>)}</Box>
                </>
              )}
              {originalDespensaMats.length + originalDespensaReas.length > 0 && (
                <Box sx={{ mt: 1, borderTop: '1px dashed #ff9800', pt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark' }}>Solicitado a Despensa</Typography>
                  {originalDespensaMats.map((m: any) => <Typography key={m.id} variant="body2" sx={{ pl: 2 }}>• {m.name}</Typography>)}
                  {originalDespensaReas.map((r: any) => <Typography key={r.id} variant="body2" sx={{ pl: 2 }}>• {r.name}</Typography>)}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Cambios propuestos */}
          {pendingRevision && (
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '2px solid', borderColor: '#6366F1' }}>
              <CardContent sx={{ p: 3, bgcolor: alpha('#6366F1', 0.03) }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#6366F1' }}>
                  Cambios propuestos por {pendingRevision.Usuario?.nombre || 'Desarrollador'}
                </Typography>

                {/* Campos modificados */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {cambios.fecha && <Chip label={`Fecha: ${cambios.fecha}`} color="info" size="small" variant="outlined" />}
                  {cambios.horaInicio && <Chip label={`Hora Inicio: ${cambios.horaInicio}`} color="info" size="small" variant="outlined" />}
                  {cambios.horaFin && <Chip label={`Hora Fin: ${cambios.horaFin}`} color="info" size="small" variant="outlined" />}
                  {cambios.laboratorioId && <Chip label={`Laboratorio: ${laboratorios.find((l) => l.id === cambios.laboratorioId)?.nombre || '#' + cambios.laboratorioId}`} color="info" size="small" variant="outlined" />}
                  {cambios.cantidadAlumnos && <Chip label={`Alumnos: ${cambios.cantidadAlumnos}`} color="info" size="small" variant="outlined" />}
                  {cambios.descripcion && <Chip label={`Descripción actualizada`} color="info" size="small" variant="outlined" />}
                </Box>

                {/* Materiales propuestos */}
                {cambiosMateriales && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><Inventory2Outlined sx={{ fontSize: 16, mr: 0.5 }} /> Materiales propuestos:</Typography>
                    <Box sx={{ pl: 2 }}>{cambiosMateriales.map((m: any) => {
                      const nom = materiales.find((x) => x.id === m.id)?.name || `#${m.id}`;
                      return <Typography key={m.id} variant="body2">• {nom} x{m.cantidad}</Typography>;
                    })}</Box>
                  </Box>
                )}
                {/* Reactivos propuestos */}
                {cambiosReactivos && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><BiotechOutlined sx={{ fontSize: 16, mr: 0.5 }} /> Reactivos propuestos:</Typography>
                    <Box sx={{ pl: 2 }}>{cambiosReactivos.map((r: any) => {
                      const nom = reactivos.find((x) => x.id === r.id)?.name || `#${r.id}`;
                      return <Typography key={r.id} variant="body2">• {nom} x{r.cantidad}</Typography>;
                    })}</Box>
                  </Box>
                )}
                {/* Equipos propuestos */}
                {cambiosEquipos && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><BuildOutlined sx={{ fontSize: 16, mr: 0.5 }} /> Equipos propuestos:</Typography>
                    <Box sx={{ pl: 2 }}>{cambiosEquipos.map((eqId: number) => {
                      const nom = equipos.find((x) => x.id === eqId)?.name || `#${eqId}`;
                      return <Typography key={eqId} variant="body2">• {nom}</Typography>;
                    })}</Box>
                  </Box>
                )}

                {/* Despensa propuesta por el dev (viene en cambios.descripcion) */}
                {(() => {
                  if (!cambios.descripcion) return null;
                  const dMatch = String(cambios.descripcion).match(/__DESPENSA__:\{.*\}/);
                  if (!dMatch) return null;
                  try {
                    const dp = JSON.parse(dMatch[0].replace('__DESPENSA__:', ''));
                    const dMatsIds = (dp.despensaMateriales || []).map((d: any) => d.id);
                    const dReasIds = (dp.despensaReactivos || []).map((d: any) => d.id);
                    const dMats = materiales.filter((m: any) => dMatsIds.includes(m.id));
                    const dReas = reactivos.filter((r: any) => dReasIds.includes(r.id));
                    if (dMats.length === 0 && dReas.length === 0) return null;
                    return (
                      <Box sx={{ mt: 1, borderTop: '1px dashed #ff9800', pt: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark' }}>Solicitado a Despensa</Typography>
                        {dMats.map((m: any) => <Typography key={m.id} variant="body2" sx={{ pl: 2 }}>• {m.name}</Typography>)}
                        {dReas.map((r: any) => <Typography key={r.id} variant="body2" sx={{ pl: 2 }}>• {r.name}</Typography>)}
                      </Box>
                    );
                  } catch { return null; }
                })()}

                {/* Botones aceptar/rechazar */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  {!showRechazoInput ? (
                    <>
                      <Button variant="outlined" color="error" onClick={() => setShowRechazoInput(true)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3 }}>
                        Rechazar
                      </Button>
                      <Button variant="contained" onClick={handleAceptar} disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 4, py: 1.2, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' } }}>
                        {saving ? 'Aceptando...' : 'Aceptar Cambios'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <TextField size="small" label="Motivo del rechazo" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} multiline rows={2} sx={{ flex: 1 }} />
                      <Button variant="outlined" onClick={() => { setShowRechazoInput(false); setMotivoRechazo(''); }}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 2 }}>
                        Cancelar
                      </Button>
                      <Button variant="contained" color="error" onClick={handleRechazar} disabled={!motivoRechazo.trim() || saving}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3 }}>
                        {saving ? 'Rechazando...' : 'Confirmar Rechazo'}
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Chat */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Chat</Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {revisiones.length === 0 && (
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>No hay mensajes aún</Typography>
                )}
                {revisiones.map((rev) => {
                  const esMio = rev.Usuario?.id === usuarioStorage.id;
                  const esRespuesta = rev.estado === 'respuesta';
                  const esAceptada = rev.estado === 'aceptada';
                  const esRechazada = rev.estado === 'rechazada';
                  const esPendiente = rev.estado === 'pendiente';
                  return (
                    <Box key={rev.id} sx={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{
                        maxWidth: '75%', p: 1.5, borderRadius: 2,
                        bgcolor: esRespuesta ? alpha('#22c55e', 0.1) : esRechazada ? alpha('#ef4444', 0.1) : esPendiente ? alpha('#6366F1', 0.1) : esMio ? alpha('#6366F1', 0.12) : '#f0f0f0',
                        border: '1px solid',
                        borderColor: esRespuesta ? alpha('#22c55e', 0.25) : esRechazada ? alpha('#ef4444', 0.25) : esPendiente ? alpha('#6366F1', 0.25) : esMio ? alpha('#6366F1', 0.25) : '#e0e0e0',
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3, color: esMio ? '#6366F1' : 'text.secondary' }}>
                          {rev.Usuario?.nombre || 'Usuario'} {rev.Usuario?.apellido || ''}
                          {esAceptada && ' ✓ Aceptado'}
                          {esRechazada && ' ✗ Rechazado'}
                          {esPendiente && ' 🔄 Pendiente'}
                        </Typography>
                        {rev.comentario && (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{rev.comentario}</Typography>
                        )}
                        {rev.cambios && Object.keys(rev.cambios).length > 0 && (
                          <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                            🔧 {Object.keys(rev.cambios).join(', ')}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.3, display: 'block', fontSize: 10 }}>
                          {new Date(rev.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribí un mensaje..."
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviarMensaje(); } }} />
                <Button variant="contained" onClick={handleEnviarMensaje} disabled={!mensaje.trim()}
                  sx={{ minWidth: 48, px: 2, borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }, '&.Mui-disabled': { background: '#cbd5e1', boxShadow: 'none' } }}> 
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
      </AppLayout>
    );
  }

  // ===================== DEV MODE =====================
  return (
    <AppLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/pedidos')}
          sx={{ mb: 2, textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 3, py: 0.8, border: '2px solid', borderColor: '#6366F1', color: '#6366F1', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { borderColor: '#4F46E5', bgcolor: 'rgba(99,102,241,0.06)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.2)' } }}>
          Volver a Pedidos
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1739', mb: 3 }}>
          Revisión - Pedido #{pedido.id}
        </Typography>

        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Detalle del Pedido</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Fecha" type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Hora Inicio" type="time" value={editHoraInicio} onChange={(e) => setEditHoraInicio(e.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Hora Fin" type="time" value={editHoraFin} onChange={(e) => setEditHoraFin(e.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Laboratorio" select value={editLabId} onChange={(e) => setEditLabId(Number(e.target.value))} size="small" sx={{ flex: 1 }} slotProps={{ select: { native: true } }}>
                  <option value="">Seleccionar...</option>
                  {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nombre} ({l.edificio})</option>)}
                </TextField>
                <TextField label="Alumnos" type="number" value={editAlumnos} onChange={(e) => setEditAlumnos(Number(e.target.value))} size="small" sx={{ flex: 1 }} />
              </Box>
              <TextField label="Descripción" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} size="small" multiline rows={2} fullWidth />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Materiales, Reactivos y Equipos</Typography>

            {labEdificio && labEdificio !== 'Despensa' ? (
              <>
                {renderTable('Materiales del Edificio ' + labEdificio, <Inventory2Outlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsEdificio.materiales, 'mat', true)}
                {renderTable('Reactivos del Edificio ' + labEdificio, <BiotechOutlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsEdificio.reactivos, 'rea', true)}
                {renderTable('Equipos del Edificio ' + labEdificio, <BuildOutlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsEdificio.equipos, 'eq', true)}
              </>
            ) : (
              <Typography color="text.secondary">Seleccioná un laboratorio para ver sus materiales, reactivos y equipos disponibles.</Typography>
            )}

            {(itemsDespensaDisponibles.materiales.length > 0 || itemsDespensaDisponibles.reactivos.length > 0) && (
              <Box sx={{ mt: 3, borderTop: '2px dashed #ff9800', pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'warning.dark' }}>Despensa</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Seleccioná items de despensa para agregar al pedido</Typography>
                {renderTable('Materiales', <Inventory2Outlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensaDisponibles.materiales, 'mat', false)}
                {renderTable('Reactivos', <BiotechOutlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensaDisponibles.reactivos, 'rea', false)}
              </Box>
            )}

            {itemsDespensaSeleccionados.materiales.length + itemsDespensaSeleccionados.reactivos.length > 0 && (
              <Box sx={{ mt: 3, borderTop: '2px dashed #ff9800', pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'warning.dark' }}>Solicitado a Despensa</Typography>
                {renderTable('Materiales', <Inventory2Outlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensaSeleccionados.materiales, 'mat', false)}
                {renderTable('Reactivos', <BiotechOutlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensaSeleccionados.reactivos, 'rea', false)}
              </Box>
            )}
          </CardContent>
        </Card>

        {esAdmin && !pendingRevision && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleGuardarDev} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 4, py: 1.2, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }, '&.Mui-disabled': { background: '#cbd5e1', boxShadow: 'none' } }}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        )}

        {/* Chat en modo Dev */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Chat</Typography>
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {revisiones.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>No hay mensajes aún</Typography>
              )}
              {revisiones.map((rev) => {
                const esMio = rev.Usuario?.id === usuarioStorage.id;
                const esRespuesta = rev.estado === 'respuesta';
                const esAceptada = rev.estado === 'aceptada';
                const esRechazada = rev.estado === 'rechazada';
                const esPendiente = rev.estado === 'pendiente';
                return (
                  <Box key={rev.id} sx={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                    <Box sx={{
                      maxWidth: '75%', p: 1.5, borderRadius: 2,
                      bgcolor: esRespuesta ? alpha('#22c55e', 0.1) : esRechazada ? alpha('#ef4444', 0.1) : esPendiente ? alpha('#6366F1', 0.1) : esMio ? alpha('#6366F1', 0.12) : '#f0f0f0',
                      border: '1px solid',
                      borderColor: esRespuesta ? alpha('#22c55e', 0.25) : esRechazada ? alpha('#ef4444', 0.25) : esPendiente ? alpha('#6366F1', 0.25) : esMio ? alpha('#6366F1', 0.25) : '#e0e0e0',
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3, color: esMio ? '#6366F1' : 'text.secondary' }}>
                        {rev.Usuario?.nombre || 'Usuario'} {rev.Usuario?.apellido || ''}
                        {esAceptada && ' ✓ Aceptado'}
                        {esRechazada && ' ✗ Rechazado'}
                        {esPendiente && ' 🔄 Pendiente'}
                      </Typography>
                      {rev.comentario && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{rev.comentario}</Typography>
                      )}
                      {rev.cambios && Object.keys(rev.cambios).length > 0 && (
                        <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                          🔧 {Object.keys(rev.cambios).join(', ')}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.3, display: 'block', fontSize: 10 }}>
                        {new Date(rev.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <div ref={chatEndRef} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribí un mensaje..."
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviarMensaje(); } }} />
              <Button variant="contained" onClick={handleEnviarMensaje} disabled={!mensaje.trim()}
                sx={{ minWidth: 48, px: 2, borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }, '&.Mui-disabled': { background: '#cbd5e1', boxShadow: 'none' } }}> 
                <SendIcon fontSize="small" />
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      {snackbar && <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={snackbar.severity}>{snackbar.msg}</Alert></Snackbar>}
    </AppLayout>
  );
}
