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
        // 1. Leemos el usuario que está guardado en el navegador
        const usuarioStorage = localStorage.getItem("usuario");
        
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