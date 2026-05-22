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

const RutaProtegida = ({ children }: { children: JSX.Element }) => {
  const usuarioGuardado = localStorage.getItem('usuario');
  if (!usuarioGuardado) {
    return <Navigate to="/login" replace />;
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
      </Routes>
    </BrowserRouter>
  );
}
