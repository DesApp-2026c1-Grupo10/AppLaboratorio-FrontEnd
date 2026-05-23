import { useState, useEffect } from 'react';

import PedidoForm from '../components/pedidos/PedidoForm';
import PedidoTable from '../components/pedidos/PedidoTable';
import { getPedidos, createPedido, updatePedido } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import type { Pedido } from '../types/pedido';
import AppLayout from '../components/layout/AppLayout';
import "../styles/pedidos.css";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [laboratorios, setLaboratorios] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const pedidosData = await getPedidos();
      const laboratoriosData = await getLaboratorios();

      setPedidos(pedidosData);
      setLaboratorios(laboratoriosData);
    } catch (error) {
      console.error(error);
    }
  }

  const agregarPedido = async (pedido: Pedido) => {
    try {
      // 1. Leemos el usuario que está guardado en el navegador
      const usuarioStorage = localStorage.getItem("usuario") || localStorage.getItem("user");
      
      // 2. Si por algún milagro no hay usuario (aunque la ruta lo protege), cortamos todo
      if (!usuarioStorage) {
        alert("Sesión expirada. Por favor volvé a iniciar sesión.");
        return;
      }

      // 3. Convertimos el texto de localStorage de nuevo a un objeto de JavaScript
      const usuarioLogueado = JSON.parse(usuarioStorage);

      // 4. Usamos SU verdadero ID, chau hardcodeo 😎
      const pedidoConUsuario = { 
        ...pedido, 
        usuarioId: usuarioLogueado.id 
      };

      const nuevoPedido = await createPedido(pedidoConUsuario);

      setPedidos([...pedidos, nuevoPedido]);
      alert("¡Pedido creado con éxito!");

    } catch (error: any) {
      console.error(error);
      alert("No se pudo crear: " + error.message);
    }
  };

  const aceptarPedido = async (id: number) => {
    try {
      const pedidoActualizado = await updatePedido(id, { estado: "Aprobado" });

      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === id
            ? { ...pedido, ...pedidoActualizado } // ¡LA MAGIA!: Mezclamos el viejo (con el laboratorio) y el nuevo (con el estado)
            : pedido
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const rechazarPedido = async (id: number) => {
    try {
      const pedidoActualizado = await updatePedido(id, { estado: "Rechazado" });

      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === id
            ? { ...pedido, ...pedidoActualizado } // ¡LA MAGIA!: Hacemos lo mismo acá
            : pedido
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppLayout>
      <div className="pedidos-page">
        {/* HEADER */}
        <div className="pedidos-header">
          <h1 className="pedidos-title">Gestión de Pedidos</h1>
          <p className="pedidos-subtitle">
            Administrá reservas y solicitudes de laboratorios
          </p>
        </div>

        {/* STATS */}
        <div className="pedidos-stats">
          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Pedidos Totales</h2>
            <p className="pedidos-stat-number">{pedidos.length}</p>
          </div>

          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Pendientes</h2>
            <p className="pedidos-stat-number">
              {pedidos.filter((pedido) => pedido.estado === "Pendiente").length}
            </p>
          </div>

          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Aprobados</h2>
            <p className="pedidos-stat-number">
              {pedidos.filter((pedido) => pedido.estado === "Aprobado").length}
            </p>
          </div>

          <div className="pedidos-stat-card">
            <h2 className="pedidos-stat-title">Rechazados</h2>
            <p className="pedidos-stat-number">
              {pedidos.filter((pedido) => pedido.estado === "Rechazado").length}
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="pedidos-content">
          <PedidoForm
            laboratorios={laboratorios}
            onSubmitPedido={agregarPedido}
          />
          <br />
          <PedidoTable
            pedidos={pedidos}
            aceptarPedido={aceptarPedido}
            rechazarPedido={rechazarPedido}
          />
        </div>
      </div>
    </AppLayout>
  );
}