import { useEffect, useState }
from "react";

import {
  getLaboratorios,
  createLaboratorio
} from "../api/laboratorios";
import { TextField, Button, } from "@mui/material";
import type {
  Laboratorio
} from "../types/laboratorio";

import "../styles/laboratorio.css";
import  AppLayout  from "../components/layout/AppLayout";

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

    <AppLayout>

      <div className="laboratorios-page">

        {/* HEADER */}

        <div className="laboratorios-header">

          <h1 className="laboratorios-title">
            Laboratorios
          </h1>

          <p className="laboratorios-subtitle">
            Gestioná los laboratorios disponibles
          </p>

        </div>

        {/* STATS */}

        <div className="laboratorios-stats">

          <div className="laboratorios-stat-card">

            <h2 className="laboratorios-stat-title">
              Total Laboratorios
            </h2>

            <p className="laboratorios-stat-number">
              {laboratorios.length}
            </p>

          </div>

          <div className="laboratorios-stat-card">

            <h2 className="laboratorios-stat-title">
              Capacidad Total
            </h2>

            <p className="laboratorios-stat-number">
              {
                laboratorios.reduce(
                  (acc, lab) => acc + lab.capacidad,
                  0
                )
              }
            </p>

          </div>

        </div>

        {/* CONTENT */}

        <div className="laboratorios-content">

          <form onSubmit={handleSubmit}>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >

              <TextField
                label="Nombre"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                fullWidth
              />

              <TextField
                label="Capacidad"
                value={capacidad}
                onChange={(e) => {

                  const value = e.target.value;

                  if (/^\d*$/.test(value)) {

                    setCapacidad(
                      value === ""
                        ? 0
                        : Number(value)
                    );
                  }

                }}
                fullWidth
              />

              <TextField
                label="Edificio"
                value={edificio}
                onChange={(e) =>
                  setEdificio(e.target.value)
                }
                fullWidth
              />

            </div>

            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
            >
              Crear laboratorio
            </Button>

          </form>

          {/* GRID */}

          <div className="laboratorios-grid">

            {laboratorios.length === 0 ? (

              <p>
                No hay laboratorios cargados
              </p>

            ) : (

              laboratorios.map(
                (lab: Laboratorio) => (

                  <div
                    key={lab.id}
                    className="laboratorio-card"
                  >

                    <h3 className="laboratorio-title">
                      {lab.nombre}
                    </h3>

                    <p className="laboratorio-info">

                      <strong>
                        Capacidad:
                      </strong>{" "}

                      {lab.capacidad}

                    </p>

                    <p className="laboratorio-info">

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

        </div>

      </div>

    </AppLayout>
  );
}

