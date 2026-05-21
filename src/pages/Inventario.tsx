import { useEffect, useState } from "react";
import { getEquipos, getMateriales, getReactivos } from "../api/inventario";
import type { Equipment, Material, Reagent } from "../types/inventario";
import '../styles/inventario.css';
import  AppLayout  from "../components/layout/AppLayout";

function statusText(status: string) {
  const map: Record<string, string> = {
    AVAILABLE: "Disponible",
    IN_USE: "En uso",
    MAINTENANCE: "En mantenimiento",
  };
  return map[status] || status;
}

export default function Inventario() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [reactivos, setReactivos] = useState<Reagent[]>([]);
  const [equipos, setEquipos] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      try {
        const [mats, reacts, eqs] = await Promise.all([
          getMateriales(),
          getReactivos(),
          getEquipos(),
        ]);
        setMateriales(mats);
        setReactivos(reacts);
        setEquipos(eqs);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el inventario");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  if (loading) return <p>Cargando inventario...</p>;
  if (error) return <p>{error}</p>;
  return (
    <AppLayout>
      <div className="inventario-container">
        <h1 className="inventario-title">Inventario</h1>
        <p className="inventario-subtitle">
          Gestión de materiales y equipamiento
        </p>
        <div className="inventario-card">
          <h2>Materiales</h2>
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {materiales.length === 0 && (
                <tr>
                  <td colSpan={3}>No hay materiales cargados</td>
                </tr>
              )}
              {materiales.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.stock}</td>
                  <td>{m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="inventario-card">
          <h2>Reactivos</h2>
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Tiempo de preparación</th>
              </tr>
            </thead>
            <tbody>
              {reactivos.length === 0 && (
                <tr>
                  <td colSpan={3}>No hay reactivos cargados</td>
                </tr>
              )}
              {reactivos.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.stock}</td>
                  <td>{r.prep_time} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="inventario-card">
          <h2>Equipamiento</h2>
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {equipos.length === 0 && (
                <tr>
                  <td colSpan={3}>No hay equipos cargados</td>
                </tr>
              )}
              {equipos.map((eq) => (
                <tr key={eq.id}>
                  <td>{eq.name}</td>
                  <td>Edificio {eq.bld_id}</td>
                  <td>{statusText(eq.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}