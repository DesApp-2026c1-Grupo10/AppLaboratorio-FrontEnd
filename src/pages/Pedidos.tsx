import { useState, useEffect } from 'react';

import PedidoForm from '../components/pedidos/PedidoForm';
import PedidoTable from '../components/pedidos/PedidoTable';
import { getPedidos, createPedido, updatePedido } from '../api/pedidos';
import { getLaboratorios } from '../api/laboratorios';
import type { Pedido } from '../types/pedido';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [laboratorios, setLaboratorios] = useState([]);

  useEffect(() =>{
    loadData();
  }, []);

  async function loadData() {

    try{
      const pedidosData = await getPedidos();

      const laboratoriosData = await getLaboratorios();

      setPedidos(pedidosData);

      setLaboratorios(laboratoriosData);
    } catch (error){
      console.error(error);
    }

  };

  const agregarPedido = async (pedido: Pedido) => {
    
    try {

      const nuevoPedido = await createPedido(pedido);

      setPedidos([
        ...pedidos,
        nuevoPedido,
      ]);

    } catch (error){
      console.error(error);

      alert("No se pudo crear: " + error.message);
    }
  };

  const aceptarPedido = async (id: number) => {
    
    try {

      const pedidoActualizado = await updatePedido(id, {estado: "Aprobado",});

      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === id
            ? pedidoActualizado
            : pedido
        )
      );
    } catch (error) {
      console.error(error);
    }
    
  };

  const rechazarPedido = async (id: number) => {

    try {

      const pedidoActualizado = await updatePedido(id, {estado: "Rechazado",});

      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === id
            ? pedidoActualizado
            : pedido
        )
      );
    } catch (error){
      console.error(error);
    }

  };

  return (
    <div>
      <h1>Pedidos</h1>

      <PedidoForm
        laboratorios={laboratorios}
        onSubmitPedido={agregarPedido}
      />

      <PedidoTable
        pedidos={pedidos}
        aceptarPedido={aceptarPedido}
        rechazarPedido={rechazarPedido}
      />
    </div>
  );
}