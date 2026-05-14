import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Inventario from '../pages/Inventario';
import Dashboard from '../pages/Dashboard';
import Laboratorios from '../pages/Laboratorios';
import Pedidos from '../pages/Pedidos';
import Agenda from '../pages/Agenda';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/laboratorios" element={<Laboratorios />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/inventario" element={<Inventario />} />
      </Routes>
    </BrowserRouter>
  );
}