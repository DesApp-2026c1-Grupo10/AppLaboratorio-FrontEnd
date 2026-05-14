import { useEffect, useState } from "react";
import '../styles/dashboard.css';
import { getLaboratorios } from '../api/laboratorios';
import { getPedidos } from '../api/pedidos';



export default function Dashboard() {
  // States
  const [laboratorios, setLaboratorios] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const hoy = new Date()
    .toISOString()
    .split("T")[0];
  const pedidosHoy = pedidos.filter((pedido: any) => pedido.fecha === hoy);

  // useEffect
  useEffect(() => {
    loadDashboard();
  }, []);

  // funciones
  async function loadDashboard() {

    try {

      const labs = await getLaboratorios();

      const pedidosData = await getPedidos();

      setLaboratorios(labs);

      setPedidos(pedidosData);

    } catch (error) {
      console.error(error);
    }

  }

  // JSX
  return (
    <div className="dashboard">

      <h1 className="dashboard-title">
        Vista Diaria de Laboratorios
      </h1>

      <p className="dashboard-subtitle">
        Hoy: Domingo 26 de Abril de 2026
      </p>

      {/* Estadísticas */}

      <div className="stats-grid">

        <div className="stat-card">
          <h2>Clases Hoy</h2>
          <p>{pedidosHoy.length}</p>
        </div>

        <div className="stat-card">
          <h2>Laboratorios</h2>
          <p>{laboratorios.length}</p>
        </div>

        <div className="stat-card">
          <h2>Pedidos Pendientes</h2>
          <p>{
            pedidos.filter((pedido: any) => pedido.estado === "Pendiente").length
            }</p>
        </div>

        <div className="stat-card">
          <h2>Alertas de Stock</h2>
          <p>3</p>
        </div>

      </div>

      {/* Cronograma */}

      <div className="timeline-container">

        <h2 className="timeline-title">
          Cronograma de Laboratorios
        </h2>

        {pedidosHoy.map((pedido: any) => (

          <div className="timeline-item" key={pedido.id} >

            <div className="timeline-hour">
              {pedido.horaInicio}
              {" - "}
              {pedido.horaFin}
            </div>    

            <div className="timeline-class">
              {pedido.descripcion}
              {" - "}
              {pedido.Laboratorio?.nombre}
            </div>

            <div className="status status-next">
              {pedido.estado}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}