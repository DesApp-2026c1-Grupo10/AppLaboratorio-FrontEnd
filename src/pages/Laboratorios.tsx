import { useEffect, useState } from "react";
import { getLaboratorios, createLaboratorio, updateLaboratorio } from "../api/laboratorios";
import {
  Box, CircularProgress, TextField, Button, Snackbar, Alert, Accordion, AccordionSummary,
  AccordionDetails, Typography, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import { Edit as EditIcon, AddCircleOutlined as AddIcon } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { SnackbarState } from "../types/snackbar";
import type { Laboratorio } from "../types/laboratorio";
import "../styles/laboratorio.css";
import AppLayout from "../components/layout/AppLayout";

export default function Laboratorios() {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [capacidad, setCapacidad] = useState(0);
  const [edificio, setEdificio] = useState("");
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratorio | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editCapacidad, setEditCapacidad] = useState(0);
  const [editEdificio, setEditEdificio] = useState("");

  const [editEdifDialogOpen, setEditEdifDialogOpen] = useState(false);
  const [editEdifOriginal, setEditEdifOriginal] = useState("");
  const [editEdifNuevo, setEditEdifNuevo] = useState("");

  const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
  const usuarioLogueado = usuarioStorage ? JSON.parse(usuarioStorage) : null;
  const esAdmin = usuarioLogueado?.rol === 'Desarrollador';

  useEffect(() => { loadLaboratorios(); }, []);

  async function loadLaboratorios() {
    try {
      const data = await getLaboratorios();
      setLaboratorios(data);
    } catch {
      setError("No se pudieron cargar los laboratorios");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !edificio.trim()) {
      setSnackbar({ msg: 'Todos los campos son obligatorios', severity: 'error' });
      return;
    }
    if (capacidad <= 0) {
      setSnackbar({ msg: 'La capacidad debe ser mayor a 0', severity: 'error' });
      return;
    }
    try {
      const nuevoLaboratorio = await createLaboratorio({ nombre, capacidad, edificio });
      setLaboratorios([...laboratorios, nuevoLaboratorio]);
      setNombre(""); setCapacidad(0); setEdificio("");
      setSnackbar({ msg: 'Laboratorio creado correctamente', severity: 'success' });
    } catch {
      setSnackbar({ msg: 'Error al crear laboratorio', severity: 'error' });
    }
  }

  const openEditLab = (lab: Laboratorio) => {
    setEditingLab(lab);
    setEditNombre(lab.nombre);
    setEditCapacidad(lab.capacidad);
    setEditEdificio(lab.edificio);
    setEditDialogOpen(true);
  };

  const handleEditLab = async () => {
    if (!editingLab) return;
    try {
      const updated = await updateLaboratorio(editingLab.id, {
        nombre: editNombre, capacidad: editCapacidad, edificio: editEdificio,
      });
      setLaboratorios((prev) => prev.map((l) => l.id === editingLab.id ? updated : l));
      setSnackbar({ msg: 'Laboratorio actualizado', severity: 'success' });
      setEditDialogOpen(false);
      setEditingLab(null);
    } catch {
      setSnackbar({ msg: 'Error al actualizar laboratorio', severity: 'error' });
    }
  };

  const openEditEdif = (edif: string) => {
    setEditEdifOriginal(edif);
    setEditEdifNuevo(edif);
    setEditEdifDialogOpen(true);
  };

  const handleEditEdif = async () => {
    if (!editEdifNuevo.trim()) return;
    try {
      const labsEnEdif = laboratorios.filter((l) => l.edificio === editEdifOriginal);
      await Promise.all(labsEnEdif.map((l) =>
        updateLaboratorio(l.id, { nombre: l.nombre, capacidad: l.capacidad, edificio: editEdifNuevo.trim() })
      ));
      const updated = await getLaboratorios();
      setLaboratorios(updated);
      setSnackbar({ msg: 'Edificio renombrado correctamente', severity: 'success' });
      setEditEdifDialogOpen(false);
    } catch {
      setSnackbar({ msg: 'Error al renombrar edificio', severity: 'error' });
    }
  };

  const edificios = [...new Set(laboratorios.map((l) => l.edificio))];

  if (loading) return <AppLayout><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box></AppLayout>;
  if (error) return <AppLayout><p>{error}</p></AppLayout>;

  return (
    <AppLayout>
      <div className="laboratorios-page">
        <div className="laboratorios-header">
          <h1 className="laboratorios-title">Laboratorios</h1>
          <p className="laboratorios-subtitle">Gestioná los laboratorios disponibles</p>
        </div>

        <div className="laboratorios-content">
          {esAdmin && (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth />
                <TextField label="Capacidad" value={capacidad} onChange={(e) => { const v = e.target.value; if (/^\d*$/.test(v)) setCapacidad(v === "" ? 0 : Number(v)); }} fullWidth />
                <TextField label="Edificio" value={edificio} onChange={(e) => setEdificio(e.target.value)} fullWidth />
              </div>
              <Button type="submit" variant="contained" startIcon={<AddIcon />}
                sx={{ mt: 3, textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 4, py: 1.2, bgcolor: '#6366F1', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#4F46E5', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' } }}>
                Crear laboratorio
              </Button>
            </form>
          )}

          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Edificios y Laboratorios</Typography>

          {laboratorios.length === 0 ? (<p>No hay laboratorios cargados</p>) : (
            edificios.map((edif) => {
              const labsDelEdificio = laboratorios.filter((l) => l.edificio === edif);
              return (
                <Accordion key={edif} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{edif}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
                      {labsDelEdificio.length} laboratorio{labsDelEdificio.length !== 1 ? 's' : ''}
                    </Typography>
                    {esAdmin && (
                      <span
                        style={{ marginLeft: 8, display: 'inline-flex', cursor: 'pointer', verticalAlign: 'middle' }}
                        onClick={(e) => { e.stopPropagation(); openEditEdif(edif); }}
                        title="Renombrar edificio"
                      >
                        <EditIcon fontSize="small" />
                      </span>
                    )}
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="laboratorios-grid">
                      {labsDelEdificio.map((lab: Laboratorio) => (
                        <div key={lab.id} className="laboratorio-card">
                          <h3 className="laboratorio-title">{lab.nombre}</h3>
                          <p className="laboratorio-info"><strong>Capacidad:</strong> {lab.capacidad} alumnos</p>
                          <p className="laboratorio-info"><strong>Edificio:</strong> {lab.edificio}</p>
                          {esAdmin && (
                            <Button size="small" startIcon={<EditIcon />} onClick={() => openEditLab(lab)} sx={{ mt: 1 }}>
                              Editar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Laboratorio</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} fullWidth />
            <TextField label="Capacidad" value={editCapacidad} onChange={(e) => { const v = e.target.value; if (/^\d*$/.test(v)) setEditCapacidad(v === "" ? 0 : Number(v)); }} fullWidth />
            <TextField label="Edificio" value={editEdificio} onChange={(e) => setEditEdificio(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditLab} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editEdifDialogOpen} onClose={() => setEditEdifDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Renombrar Edificio</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Se renombrará el edificio "{editEdifOriginal}" para todos los laboratorios que lo contienen.
          </Typography>
          <TextField label="Nuevo nombre" value={editEdifNuevo} onChange={(e) => setEditEdifNuevo(e.target.value)} fullWidth autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEdifDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditEdif} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {snackbar && (
        <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>
        </Snackbar>
      )}
    </AppLayout>
  );
}
