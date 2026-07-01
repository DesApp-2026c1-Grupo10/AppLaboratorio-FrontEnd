import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import Login from '../pages/Login';
import Inventario from '../pages/Inventario';
import Materiales from '../pages/Materiales';
import Reactivos from '../pages/Reactivos';
import Equipos from '../pages/Equipos';
import SustanciasBasicas from '../pages/SustanciasBasicas';
import Carritos from '../pages/Carritos';
import Movimientos from '../pages/Movimientos';
import Dashboard from '../pages/Dashboard';
import Laboratorios from '../pages/Laboratorios';
import Pedidos from '../pages/Pedidos';
import Agenda from '../pages/Agenda';
import Estadisticas from '../pages/Estadisticas';
import Usuarios from '../pages/Usuarios';
import NuevoPedido from '../pages/NuevoPedido';
import RevisionPedido from '../pages/RevisionPedido';

const adminRoutes = ['/inventario', '/materiales', '/reactivos', '/equipos', '/movimientos', '/carritos', '/estadisticas', '/usuarios'];

const RutaProtegida = ({ children }: { children: ReactNode }) => {
  const usuarioStorage = localStorage.getItem('usuario') || localStorage.getItem('user');
  if (!usuarioStorage) {
    return <Navigate to="/login" replace />;
  }
  const usuario = JSON.parse(usuarioStorage);
  if (adminRoutes.includes(window.location.pathname) && usuario.rol !== 'Desarrollador') {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
        <Route path="/laboratorios" element={<RutaProtegida><Laboratorios /></RutaProtegida>} />
        <Route path="/pedidos" element={<RutaProtegida><Pedidos /></RutaProtegida>} />
        <Route path="/pedidos/nuevo" element={<RutaProtegida><NuevoPedido /></RutaProtegida>} />
        <Route path="/pedidos/revision/:id" element={<RutaProtegida><RevisionPedido /></RutaProtegida>} />
        <Route path="/agenda" element={<RutaProtegida><Agenda /></RutaProtegida>} />

        {/* Inventario */}
        <Route path="/inventario" element={<RutaProtegida><Inventario /></RutaProtegida>} />
        <Route path="/materiales" element={<RutaProtegida><Materiales /></RutaProtegida>} />
        <Route path="/reactivos" element={<RutaProtegida><Reactivos /></RutaProtegida>} />
        <Route path="/equipos" element={<RutaProtegida><Equipos /></RutaProtegida>} />
        <Route path="/movimientos" element={<RutaProtegida><Movimientos /></RutaProtegida>} />
        <Route path="/sustancias-basicas" element={<RutaProtegida><SustanciasBasicas /></RutaProtegida>} />
        <Route path="/carritos" element={<RutaProtegida><Carritos /></RutaProtegida>} />
        <Route path="/estadisticas" element={<RutaProtegida><Estadisticas /></RutaProtegida>} />
        <Route path="/usuarios" element={<RutaProtegida><Usuarios /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}
