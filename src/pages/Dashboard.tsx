import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import "../styles/dashboard.css";
import { getLaboratorios } from "../api/laboratorios";
import { getPedidos } from "../api/pedidos";
import { getMateriales } from "../api/materiales";
import { getEquipos } from "../api/equipos";
import AppLayout from "../components/layout/AppLayout";

export default function Dashboard() {
  const [laboratorios, setLaboratorios] = useState([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [stockBajo, setStockBajo] = useState(0);
  const [equiposMantenimiento, setEquiposMantenimiento] = useState(0);
  const [loading, setLoading] = useState(true);

  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const pedidosHoy = pedidos.filter((p: any) => p.fecha === hoy);
  const pendientes = pedidos.filter((p: any) => p.estado === "Pendiente");
  const finalizados = pedidos.filter((p: any) => p.estado === "Finalizado");

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [labs, pedidosData, mats, eqs] = await Promise.all([
        getLaboratorios(), getPedidos(), getMateriales(), getEquipos(),
      ]);
      setLaboratorios(labs);
      setPedidos(pedidosData);
      setStockBajo(mats.filter((m: any) => m.stockMinimo > 0 && m.stock <= m.stockMinimo).length);
      setEquiposMantenimiento(eqs.filter((e: any) => e.status === 'Mantenimiento').length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AppLayout><Typography sx={{ p: 4 }}>Cargando dashboard...</Typography></AppLayout>;

  return (
    <AppLayout>
      <div className="dashboard">
        <h1 className="dashboard-title">Vista Diaria de Laboratorios</h1>
        <p className="dashboard-subtitle">Estado general del sistema</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header"><SchoolIcon sx={{ fontSize: 32, color: '#1976d2' }} /></div>
            <h2>Clases Hoy</h2>
            <p>{pedidosHoy.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-header"><ScienceIcon sx={{ fontSize: 32, color: '#7b1fa2' }} /></div>
            <h2>Laboratorios</h2>
            <p>{laboratorios.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-header"><HourglassEmptyIcon sx={{ fontSize: 32, color: '#ed6c02' }} /></div>
            <h2>Pendientes</h2>
            <p>{pendientes.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-header"><CheckCircleIcon sx={{ fontSize: 32, color: '#2e7d32' }} /></div>
            <h2>Finalizados</h2>
            <p>{finalizados.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-header"><WarningAmberIcon sx={{ fontSize: 32, color: stockBajo > 0 ? '#ed6c02' : '#9e9e9e' }} /></div>
            <h2>Alertas Stock</h2>
            <p>{stockBajo}</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-header"><WarningAmberIcon sx={{ fontSize: 32, color: equiposMantenimiento > 0 ? '#d32f2f' : '#9e9e9e' }} /></div>
            <h2>En Mantenimiento</h2>
            <p>{equiposMantenimiento}</p>
          </div>
        </div>

        <div className="timeline-container">
          <h2 className="timeline-title">Cronograma de Hoy</h2>
          {pedidosHoy.length === 0 ? (
            <p className="timeline-empty">No hay actividades para hoy</p>
          ) : (
            pedidosHoy
              .sort((a: any, b: any) => a.horaInicio.localeCompare(b.horaInicio))
              .map((pedido: any) => (
                <div className="timeline-item" key={pedido.id}>
                  <div>
                    <div className="timeline-hour">{pedido.horaInicio} - {pedido.horaFin}</div>
                    <div className="timeline-class">{pedido.Laboratorio?.nombre} · {pedido.cantidadAlumnos} alumnos</div>
                  </div>
                  <div className={`status ${pedido.estado === "Aprobado" ? "status-active" : pedido.estado === "Pendiente" ? "status-next" : ""}`}>
                    {pedido.estado}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
