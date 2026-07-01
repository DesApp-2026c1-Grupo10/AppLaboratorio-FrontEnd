import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Table, TableBody, TableCell, TableRow,
  Checkbox, IconButton, Chip, CircularProgress, alpha, Card, CardContent,
} from '@mui/material';
import { ArrowBack, Send as SendIcon } from '@mui/icons-material';
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [revisiones]);

  const labNombre = (labId: number) => laboratorios.find((l) => l.id === labId)?.nombre || `#${labId}`;
  const matNombre = (matId: number) => materiales.find((m) => m.id === matId)?.name || `#${matId}`;
  const reaNombre = (reaId: number) => reactivos.find((r) => r.id === reaId)?.name || `#${reaId}`;
  const eqNombre = (eqId: number) => equipos.find((e) => e.id === eqId)?.name || `#${eqId}`;

  const handleGuardar = async () => {
    if (!pedido || !id) return;
    setSaving(true);
    try {
      await updatePedido(Number(id), {
        fecha: editFecha,
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
        laboratorioId: editLabId || undefined,
        cantidadAlumnos: editAlumnos,
        descripcion: editDesc,
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

  const chatRevisions = revisiones;
  const usuarioId = usuarioStorage.id;

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
                  {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </TextField>
                <TextField label="Alumnos" type="number" value={editAlumnos} onChange={(e) => setEditAlumnos(Number(e.target.value))} size="small" sx={{ flex: 1 }}
                  slotProps={{ input: { readOnly: !esAdmin } }} />
              </Box>
              <TextField label="Descripción" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} size="small" multiline rows={2} fullWidth
                slotProps={{ input: { readOnly: !esAdmin } }} />
            </Box>
          </CardContent>
        </Card>

        {esAdmin && (
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Materiales</Typography>
              <Table size="small">
                <TableBody>
                  {materiales.map((m) => {
                    const sel = selectedMats.find((s) => s.id === m.id);
                    return (
                      <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => toggleMat(m)}>
                        <TableCell padding="checkbox"><Checkbox checked={!!sel} /></TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          {sel && (
                            <TextField type="number" size="small" value={sel.cantidad}
                              onChange={(e) => { e.stopPropagation(); setCantMat(m.id, Math.max(1, Number(e.target.value))); }}
                              slotProps={{ htmlInput: { min: 1, style: { textAlign: 'center' } } }}
                              sx={{ width: 80 }} onClick={(e) => e.stopPropagation()} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>Reactivos</Typography>
              <Table size="small">
                <TableBody>
                  {reactivos.map((r) => {
                    const sel = selectedReas.find((s) => s.id === r.id);
                    return (
                      <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => toggleRea(r)}>
                        <TableCell padding="checkbox"><Checkbox checked={!!sel} /></TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          {sel && (
                            <TextField type="number" size="small" value={sel.cantidad}
                              onChange={(e) => { e.stopPropagation(); setCantRea(r.id, Math.max(1, Number(e.target.value))); }}
                              slotProps={{ htmlInput: { min: 1, style: { textAlign: 'center' } } }}
                              sx={{ width: 80 }} onClick={(e) => e.stopPropagation()} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>Equipos</Typography>
              <Table size="small">
                <TableBody>
                  {equipos.map((e) => (
                    <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => toggleEq(e.id)}>
                      <TableCell padding="checkbox"><Checkbox checked={selectedEqs.includes(e.id)} /></TableCell>
                      <TableCell>{e.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleGuardar} disabled={saving}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5, px: 4 }}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {!esAdmin && (
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Materiales</Typography>
              <Typography variant="body2" color="text.secondary">
                {pedido.materiales?.length ? pedido.materiales.map((m: any) => `${m.name} (${m.PedidoMaterial?.cantidad || 1})`).join(', ') : '(ninguno)'}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Reactivos</Typography>
              <Typography variant="body2" color="text.secondary">
                {pedido.reactivos?.length ? pedido.reactivos.map((r: any) => `${r.name} (${r.PedidoReactivo?.cantidad || 1})`).join(', ') : '(ninguno)'}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Equipos</Typography>
              <Typography variant="body2" color="text.secondary">
                {pedido.Equipments?.length ? pedido.Equipments.map((e: any) => e.name).join(', ') : '(ninguno)'}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Chat</Typography>
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {chatRevisions.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                  No hay mensajes aún
                </Typography>
              )}
              {chatRevisions.map((rev) => {
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
