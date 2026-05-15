import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Inventario from '../pages/Inventario';
import Dashboard from '../pages/Dashboard';
import Laboratorios from '../pages/Laboratorios';
import Pedidos from '../pages/Pedidos';
import Agenda from '../pages/Agenda';

// --- EL "PATOVICA" DE LAS RUTAS ---
// Este componente envuelve a las páginas que queremos proteger.
const RutaProtegida = ({ children }: { children: JSX.Element }) => {
  const usuarioGuardado = localStorage.getItem('usuario');
  
  // Si no hay usuario en localStorage, lo rebotamos a la página de Login
  if (!usuarioGuardado) {
    return <Navigate to="/login" replace />;
  }
  
  // Si está logueado, lo dejamos pasar a la página que pidió
  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La ruta pública (Cualquiera puede verla) */}
        <Route path="/login" element={<Login />} />

        {/* Las rutas privadas (Tienen que pasar por el patovica) */}
        <Route 
          path="/" 
          element={<RutaProtegida><Dashboard /></RutaProtegida>} 
        />
        <Route 
          path="/laboratorios" 
          element={<RutaProtegida><Laboratorios /></RutaProtegida>} 
        />
        <Route 
          path="/pedidos" 
          element={<RutaProtegida><Pedidos /></RutaProtegida>} 
        />
        <Route 
          path="/agenda" 
          element={<RutaProtegida><Agenda /></RutaProtegida>} 
        />
        <Route 
          path="/inventario" 
          element={<RutaProtegida><Inventario /></RutaProtegida>} 
        />
      </Routes>
    </BrowserRouter>
  );
}