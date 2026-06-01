import { useEffect, useState } from "react";
import { getLaboratorios, createLaboratorio } from "../api/laboratorios";
import { Box, CircularProgress, TextField, Button, Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
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

  useEffect(() => { loadLaboratorios(); }, []);

  async function loadLaboratorios() {
    try {
      const data = await getLaboratorios();
      setLaboratorios(data);
    } catch (error) {
      console.error(error);
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
      setNombre("");
      setCapacidad(0);
      setEdificio("");
      setSnackbar({ msg: 'Laboratorio creado correctamente', severity: 'success' });
    } catch (error) {
      console.error(error);
      setSnackbar({ msg: 'Error al crear laboratorio', severity: 'error' });
    }
  }

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
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth />
              <TextField label="Capacidad" value={capacidad} onChange={(e) => { const v = e.target.value; if (/^\d*$/.test(v)) setCapacidad(v === "" ? 0 : Number(v)); }} fullWidth />
              <TextField label="Edificio" value={edificio} onChange={(e) => setEdificio(e.target.value)} fullWidth />
            </div>
            <Button type="submit" variant="contained" sx={{ mt: 3 }}>Crear laboratorio</Button>
          </form>

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
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="laboratorios-grid">
                      {labsDelEdificio.map((lab: Laboratorio) => (
                        <div key={lab.id} className="laboratorio-card">
                          <h3 className="laboratorio-title">{lab.nombre}</h3>
                          <p className="laboratorio-info"><strong>Capacidad:</strong> {lab.capacidad} alumnos</p>
                          <p className="laboratorio-info"><strong>Edificio:</strong> {lab.edificio}</p>
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

      {snackbar && (
        <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>
        </Snackbar>
      )}
    </AppLayout>
  );
}

