import { useEffect, useState } from "react";

import "../styles/dashboard.css";

import { getLaboratorios }
from "../api/laboratorios";

import { getPedidos }
from "../api/pedidos";

import AppLayout
from "../components/layout/AppLayout";

export default function Dashboard() {

  // States

  const [
    laboratorios,
    setLaboratorios
  ] = useState([]);

  const [
    pedidos,
    setPedidos
  ] = useState([]);

  const hoy = new Date()
    .toISOString()
    .split("T")[0];

  const pedidosHoy =
    pedidos.filter(
      (pedido: any) =>
        pedido.fecha === hoy
    );

  // useEffect

  useEffect(() => {

    loadDashboard();

  }, []);

  // funciones

  async function loadDashboard() {

    try {

      const labs =
        await getLaboratorios();

      const pedidosData =
        await getPedidos();

      setLaboratorios(labs);

      setPedidos(pedidosData);

    } catch (error) {

      console.error(error);
    }
  }

  // JSX

  return (

    <AppLayout>

      <div className="dashboard">

        <h1 className="dashboard-title">
          Vista Diaria de Laboratorios
        </h1>

        <p className="dashboard-subtitle">
          Estado general del sistema
        </p>

        {/* Estadísticas */}

        <div className="stats-grid">

          {/* CARD */}

          <div className="stat-card">

            <div className="stat-card-header">

              <span className="stat-icon">
                📚
              </span>

            </div>

            <h2>
              Clases Hoy
            </h2>

            <p>
              {pedidosHoy.length}
            </p>

          </div>

          {/* CARD */}

          <div className="stat-card">

            <div className="stat-card-header">

              <span className="stat-icon">
                🧪
              </span>

            </div>

            <h2>
              Laboratorios
            </h2>

            <p>
              {laboratorios.length}
            </p>

          </div>

          {/* CARD */}

          <div className="stat-card">

            <div className="stat-card-header">

              <span className="stat-icon">
                ⏳
              </span>

            </div>

            <h2>
              Pedidos Pendientes
            </h2>

            <p>

              {
                pedidos.filter(
                  (pedido: any) =>
                    pedido.estado ===
                    "Pendiente"
                ).length
              }

            </p>

          </div>

          {/* CARD */}

          <div className="stat-card">

            <div className="stat-card-header">

              <span className="stat-icon">
                ✅
              </span>

            </div>

            <h2>
              Finalizados
            </h2>

            <p>
              {pedidos.filter((pedido: any) => pedido.estado === "Finalizado").length}
            </p>

          </div>

          {/* CARD */}

          <div className="stat-card">

            <div className="stat-card-header">

              <span className="stat-icon">
                ⚠️
              </span>

            </div>

            <h2>
              Alertas de Stock
            </h2>

            <p>{/* stock bajo */}0</p>

          </div>

        </div>

        {/* Cronograma */}

        <div className="timeline-container">

          <h2 className="timeline-title">
            Cronograma de Laboratorios
          </h2>

          {
            pedidosHoy.length === 0 ? (

              <p className="timeline-empty">
                No hay actividades para hoy
              </p>

            ) : (

              pedidosHoy.map(
                (pedido: any) => (

                  <div
                    className="timeline-item"

                    key={pedido.id}
                  >

                    <div>

                      <div className="timeline-hour">

                        {pedido.horaInicio}

                        {" - "}

                        {pedido.horaFin}

                      </div>

                      <div className="timeline-class">

                        {pedido.descripcion}

                        {" - "}

                        {
                          pedido.Laboratorio
                            ?.nombre
                        }

                      </div>

                    </div>

                    <div
                      className={`status ${
                        pedido.estado ===
                        "Aprobado"
                          ? "status-active"
                          : "status-next"
                      }`}
                    >

                      {pedido.estado}

                    </div>

                  </div>
                )
              )
            )
          }

        </div>

      </div>

    </AppLayout>
  );
}