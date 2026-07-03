import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Table, TableBody, TableCell, TableRow,
  Checkbox, CircularProgress, alpha, Card, CardContent,
} from '@mui/material';
import { ArrowBack, Send as SendIcon, Inventory2Outlined, BiotechOutlined, BuildOutlined } from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { getPedido, updatePedido, getRevisiones, crearRevision } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import { getMateriales } from '../api/materiales';
import { getReactivos } from '../api/reactivos';
import { getEquipos } from '../api/equipos';
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
  const [despensaEqs, setDespensaEqs] = useState<number[]>([]);

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
      setSelectedMats((ped.materiales || []).map((m: any) => ({ id: m.id, cantidad: m.PedidoMaterial?.cantidad || 1 })));
      setSelectedReas((ped.reactivos || []).map((r: any) => ({ id: r.id, cantidad: r.PedidoReactivo?.cantidad || 1 })));
      setSelectedEqs((ped.Equipments || []).map((e: any) => e.id));

      // Parse __DESPENSA__ from descripcion
      const desc = ped.descripcion || '';
      const dMatch = desc.match(/__DESPENSA__:\{.*\}/);
      if (dMatch) {
        const jsonStr = dMatch[0].replace('__DESPENSA__:', '');
        try {
          const dp = JSON.parse(jsonStr);
          setDespensaMats((dp.despensaMateriales || []).map((d: any) => ({ id: d.id, cantidad: d.cantidad || 1 })));
          setDespensaReas((dp.despensaReactivos || []).map((d: any) => ({ id: d.id, cantidad: d.cantidad || 1 })));
          setDespensaEqs((dp.despensaEquipos || []).map((d: any) => d.id));
        } catch (parseErr) {
          console.error('Error parseando __DESPENSA__:', parseErr);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [revisiones]);

  const labEdificio = useMemo(() => {
    if (!editLabId) return null;
    const lab = laboratorios.find((l) => l.id === editLabId);
    return lab?.edificio || null;
  }, [editLabId, laboratorios]);

  const itemsEdificio = useMemo(() => {
    if (!labEdificio || labEdificio === 'Despensa') return { materiales: [], reactivos: [], equipos: [] };
    return {
      materiales: materiales.filter((m: any) => m.laboratorio?.edificio === labEdificio),
      reactivos: reactivos.filter((r: any) => r.laboratorio?.edificio === labEdificio),
      equipos: equipos.filter((e: any) => e.laboratorio?.edificio === labEdificio),
    };
  }, [labEdificio, materiales, reactivos, equipos]);

  const itemsDespensa = useMemo(() => {
    return {
      materiales: materiales.filter((m: any) => despensaMats.some((d) => d.id === m.id)),
      reactivos: reactivos.filter((r: any) => despensaReas.some((d) => d.id === r.id)),
      equipos: equipos.filter((e: any) => despensaEqs.includes(e.id)),
    };
  }, [materiales, reactivos, equipos, despensaMats, despensaReas, despensaEqs]);

  const matNombre = (matId: number) => materiales.find((m) => m.id === matId)?.name || `Material #${matId}`;
  const reaNombre = (reaId: number) => reactivos.find((r) => r.id === reaId)?.name || `Reactivo #${reaId}`;
  const eqNombre = (eqId: number) => equipos.find((e) => e.id === eqId)?.name || `Equipo #${eqId}`;

  const handleGuardar = async () => {
    if (!pedido || !id) return;
    setSaving(true);
    try {
      const originalDesc = pedido.descripcion || '';
      const advertenciaMatch = originalDesc.match(/\[Advertencias:.*?\]/);
      const advertencia = advertenciaMatch ? advertenciaMatch[0] : '';
      const cleanDesc = editDesc.replace(/(\[Advertencias:.*?\]|__DESPENSA__:\{.*\})/gs, '').trim();
      const keepDespensaMats = selectedMats.filter((s) => despensaMats.some((d) => d.id === s.id));
      const keepDespensaReas = selectedReas.filter((s) => despensaReas.some((d) => d.id === s.id));
      const keepDespensaEqs = selectedEqs.filter((s) => despensaEqs.includes(s));
      let newDespensaData = '';
      if (keepDespensaMats.length > 0 || keepDespensaReas.length > 0 || keepDespensaEqs.length > 0) {
        newDespensaData = `__DESPENSA__:${JSON.stringify({
          despensaMateriales: keepDespensaMats,
          despensaReactivos: keepDespensaReas,
          despensaEquipos: keepDespensaEqs.map((id) => ({ id })),
        })}`;
      }
      const finalDesc = [cleanDesc, advertencia, newDespensaData].filter(Boolean).join('\n');

      await updatePedido(Number(id), {
        fecha: editFecha,
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
        laboratorioId: editLabId || undefined,
        cantidadAlumnos: editAlumnos,
        descripcion: finalDesc,
        materiales: selectedMats,
        reactivos: selectedReas,
        equipos: selectedEqs,
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!mensaje.trim() || !id) return;
    const msg = mensaje.trim();
    setMensaje('');
    try {
      await crearRevision(Number(id), {
        comentario: msg,
        usuarioId: usuarioStorage.id,
        cambios: {},
      });
      const revs = await getRevisiones(Number(id));
      setRevisiones(revs);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMat = (item: any) => {
    setSelectedMats((prev) => {
      const exists = prev.find((m) => m.id === item.id);
      if (exists) return prev.filter((m) => m.id !== item.id);
      return [...prev, { id: item.id, cantidad: 1 }];
    });
  };

  const toggleRea = (item: any) => {
    setSelectedReas((prev) => {
      const exists = prev.find((r) => r.id === item.id);
      if (exists) return prev.filter((r) => r.id !== item.id);
      return [...prev, { id: item.id, cantidad: 1 }];
    });
  };

  const toggleEq = (eqId: number) => {
    setSelectedEqs((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const setCantMat = (id: number, val: number) => {
    setSelectedMats((prev) => prev.map((m) => (m.id === id ? { ...m, cantidad: val } : m)));
  };
  const setCantRea = (id: number, val: number) => {
    setSelectedReas((prev) => prev.map((r) => (r.id === id ? { ...r, cantidad: val } : r)));
  };

  if (loading) return <AppLayout><Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box></AppLayout>;
  if (!pedido) return <AppLayout><Typography>Pedido no encontrado</Typography></AppLayout>;

  const usuarioId = usuarioStorage.id;

  function renderTable(
    titulo: string,
    icon: React.ReactNode,
    items: any[],
    tipo: 'mat' | 'rea' | 'eq',
    colorNormal: boolean,
  ) {
    const colSpan = esAdmin ? 3 : 2;
    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600, color: colorNormal ? undefined : 'warning.dark' }}>
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
              const rowSx = colorNormal ? {} : { bgcolor: alpha('#ff9800', 0.05), '&:hover': { bgcolor: alpha('#ff9800', 0.12) } };
              return (
                <TableRow key={item.id} hover sx={{ cursor: esAdmin ? 'pointer' : 'default', ...rowSx }}
                  onClick={() => { if (esAdmin) { tipo === 'eq' ? toggleEq(item.id) : tipo === 'mat' ? toggleMat(item) : toggleRea(item); } }}>
                  {esAdmin && (
                    <TableCell padding="checkbox">
                      <Checkbox checked={!!sel}
                        sx={colorNormal ? {} : { color: 'warning.main', '&.Mui-checked': { color: 'warning.main' } }} />
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography sx={{ color: colorNormal ? undefined : 'warning.dark', fontWeight: colorNormal ? 400 : 500 }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  {esAdmin && (
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

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/pedidos')} sx={{ mb: 2, textTransform: 'none' }}>
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
                <TextField label="Fecha" type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} size="small" sx={{ flex: 1 }}
                  slotProps={{ inputLabel: { shrink: true }, input: { readOnly: !esAdmin } }} />
                <TextField label="Hora Inicio" type="time" value={editHoraInicio} onChange={(e) => setEditHoraInicio(e.target.value)} size="small" sx={{ flex: 1 }}
                  slotProps={{ inputLabel: { shrink: true }, input: { readOnly: !esAdmin } }} />
                <TextField label="Hora Fin" type="time" value={editHoraFin} onChange={(e) => setEditHoraFin(e.target.value)} size="small" sx={{ flex: 1 }}
                  slotProps={{ inputLabel: { shrink: true }, input: { readOnly: !esAdmin } }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Laboratorio" select value={editLabId} onChange={(e) => setEditLabId(Number(e.target.value))} size="small" sx={{ flex: 1 }}
                  slotProps={{ select: { readOnly: !esAdmin } }} SelectProps={{ native: true }}>
                  <option value="">Seleccionar...</option>
                  {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nombre} ({l.edificio})</option>)}
                </TextField>
                <TextField label="Alumnos" type="number" value={editAlumnos} onChange={(e) => setEditAlumnos(Number(e.target.value))} size="small" sx={{ flex: 1 }}
                  slotProps={{ input: { readOnly: !esAdmin } }} />
              </Box>
              <TextField label="Descripción" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} size="small" multiline rows={2} fullWidth
                slotProps={{ input: { readOnly: !esAdmin } }} />
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

            {itemsDespensa.materiales.length + itemsDespensa.reactivos.length + itemsDespensa.equipos.length > 0 && (
              <Box sx={{ mt: 3, borderTop: '2px dashed #ff9800', pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'warning.dark' }}>
                  Solicitado a Despensa
                </Typography>
                {renderTable('Materiales', <Inventory2Outlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensa.materiales, 'mat', false)}
                {renderTable('Reactivos', <BiotechOutlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensa.reactivos, 'rea', false)}
                {renderTable('Equipos', <BuildOutlined sx={{ verticalAlign: 'middle', fontSize: 20, mr: 0.5 }} />, itemsDespensa.equipos, 'eq', false)}
              </Box>
            )}
          </CardContent>
        </Card>

        {esAdmin && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleGuardar} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5, px: 4 }}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        )}

        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Chat</Typography>
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {revisiones.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                  No hay mensajes aún
                </Typography>
              )}
              {revisiones.map((rev) => {
                const esMio = rev.Usuario?.id === usuarioId;
                return (
                  <Box key={rev.id} sx={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                    <Box sx={{
                      maxWidth: '75%', p: 1.5, borderRadius: 2,
                      bgcolor: esMio ? alpha('#6366F1', 0.12) : '#f0f0f0',
                      border: '1px solid',
                      borderColor: esMio ? alpha('#6366F1', 0.25) : '#e0e0e0',
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3, color: esMio ? '#6366F1' : 'text.secondary' }}>
                        {rev.Usuario?.nombre || 'Usuario'} {rev.Usuario?.apellido || ''}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{rev.comentario}</Typography>
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviarMensaje(); } }}
              />
              <Button variant="contained" onClick={handleEnviarMensaje} disabled={!mensaje.trim()}
                sx={{ minWidth: 40, px: 2, borderRadius: 2 }}>
                <SendIcon fontSize="small" />
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
