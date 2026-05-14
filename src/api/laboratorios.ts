const API_URL =
  "http://localhost:3001";

export async function getLaboratorios() {

  const response = await fetch(
    `${API_URL}/laboratorios`
  );

  if (!response.ok) {
    throw new Error(
      "Error obteniendo laboratorios"
    );
  }

  return response.json();
}

export async function createLaboratorio(
  laboratorio: any
) {

  const response = await fetch(
    `${API_URL}/laboratorios`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        laboratorio
      ),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Error creando laboratorio"
    );
  }

  return response.json();
}