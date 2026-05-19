import '../styles/inventario.css';
import  AppLayout  from "../components/layout/AppLayout";

export default function Inventario() {

  const materiales = [
    {
      id: 1,
      nombre: 'Etanol',
      stock: 250,
      unidad: 'ml'
    },
    {
      id: 2,
      nombre: 'Reactivo A',
      stock: 80,
      unidad: 'g'
    },
    {
      id: 3,
      nombre: 'Medio de Cultivo',
      stock: 140,
      unidad: 'ml'
    }
  ];

  const equipos = [
    {
      id: 1,
      nombre: 'Microscopio',
      ubicacion: 'Edificio A',
      estado: 'Disponible'
    },
    {
      id: 2,
      nombre: 'Centrífuga',
      ubicacion: 'Edificio B',
      estado: 'En mantenimiento'
    },
    {
      id: 3,
      nombre: 'Espectrofotómetro',
      ubicacion: 'Edificio A',
      estado: 'En uso'
    }
  ];

  return (
    <AppLayout>
      <div className="inventario-container">

        <h1 className="inventario-title">
          Inventario
        </h1>

        <p className="inventario-subtitle">
          Gestión de materiales y equipamiento
        </p>

        {/* Materiales */}

        <div className="inventario-card">

          <h2>Reactivos y Materiales</h2>

          <table className="inventario-table">

            <thead>
              <tr>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Unidad</th>
              </tr>
            </thead>

            <tbody>
              {materiales.map((material) => (
                <tr key={material.id}>
                  <td>{material.nombre}</td>
                  <td>{material.stock}</td>
                  <td>{material.unidad}</td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>

        {/* Equipos */}

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
              {equipos.map((equipo) => (
                <tr key={equipo.id}>
                  <td>{equipo.nombre}</td>
                  <td>{equipo.ubicacion}</td>
                  <td>{equipo.estado}</td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </div>
    </AppLayout>  
  );
}