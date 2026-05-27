import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Inventario from '../pages/Inventario';
import Materiales from '../pages/Materiales';
import Reactivos from '../pages/Reactivos';
import Equipos from '../pages/Equipos';
import Movimientos from '../pages/Movimientos';
import Dashboard from '../pages/Dashboard';
import Laboratorios from '../pages/Laboratorios';
import Pedidos from '../pages/Pedidos';
import Agenda from '../pages/Agenda';
import Estadisticas from '../pages/Estadisticas';

const adminRoutes = ['/inventario', '/materiales', '/reactivos', '/equipos', '/movimientos', '/estadisticas'];

const RutaProtegida = ({ children }: { children: JSX.Element }) => {
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
        <Route path="/agenda" element={<RutaProtegida><Agenda /></RutaProtegida>} />

        {/* Inventario */}
        <Route path="/inventario" element={<RutaProtegida><Inventario /></RutaProtegida>} />
        <Route path="/materiales" element={<RutaProtegida><Materiales /></RutaProtegida>} />
        <Route path="/reactivos" element={<RutaProtegida><Reactivos /></RutaProtegida>} />
        <Route path="/equipos" element={<RutaProtegida><Equipos /></RutaProtegida>} />
        <Route path="/movimientos" element={<RutaProtegida><Movimientos /></RutaProtegida>} />
        <Route path="/estadisticas" element={<RutaProtegida><Estadisticas /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}
