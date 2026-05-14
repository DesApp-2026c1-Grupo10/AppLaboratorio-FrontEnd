import { useEffect, useState }
from "react";

import {
  getLaboratorios,
  createLaboratorio
} from "../api/laboratorios";

import type {
  Laboratorio
} from "../types/laboratorio";

export default function Laboratorios() {

  const [
    laboratorios,
    setLaboratorios
  ] = useState<Laboratorio[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [nombre, setNombre]
  = useState("");

  const [capacidad, setCapacidad]
  = useState(0);

  const [edificio, setEdificio]
  = useState("");

  useEffect(() => {

    loadLaboratorios();

  }, []);

  async function loadLaboratorios() {

    try {

      const data =
        await getLaboratorios();

      setLaboratorios(data);

    } catch (error) {

      console.error(error);

      setError(
        "No se pudieron cargar los laboratorios"
      );

    } finally {

      setLoading(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!nombre.trim() || !edificio.trim()){
      alert("Todos los campos son obligatorios");
      return;
    }    

    if (capacidad <= 0){
      alert("La capacidad debe ser mayor a 0")
      return;
    }

    try {

      const nuevoLaboratorio =
        await createLaboratorio({

          nombre,
          capacidad,
          edificio,
        });

      setLaboratorios([
        ...laboratorios,
        nuevoLaboratorio,
      ]);

      setNombre("");
      setCapacidad(0);
      setEdificio("");

    } catch (error) {

      console.error(error);
    }
  }

  if (loading) {

    return (
      <p>Cargando laboratorios...</p>
    );
  }

  if (error) {

    return (
      <p>{error}</p>
    );
  }

  return (

    <div>

      <h1>Laboratorios</h1>

      <form onSubmit={handleSubmit}>

        <div>

          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) =>
              setNombre(e.target.value)
            }
          />

        </div>

        <div>

          <input
            type="number"
            placeholder="Capacidad"
            value={capacidad}
            onChange={(e) =>
              setCapacidad(
                Number(e.target.value)
              )
            }
          />

        </div>

        <div>

          <input
            type="text"
            placeholder="Edificio"
            value={edificio}
            onChange={(e) =>
              setEdificio(e.target.value)
            }
          />

        </div>

        <button type="submit">
          Crear laboratorio
        </button>

      </form>      

      {laboratorios.length === 0 ? (

        <p>
          No hay laboratorios cargados
        </p>

      ) : (

        laboratorios.map(
          (lab: Laboratorio) => (

            <div
              key={lab.id}
              style={{
                border:
                  "1px solid gray",

                padding: "1rem",

                marginBottom: "1rem",

                borderRadius: "8px",
              }}
            >

              <h3>
                {lab.nombre}
              </h3>

              <p>
                <strong>
                  Capacidad:
                </strong>{" "}
                {lab.capacidad}
              </p>

              <p>
                <strong>
                  Edificio:
                </strong>{" "}
                {lab.edificio}
              </p>

            </div>
          )
        )
      )}
    </div>
  );
}

