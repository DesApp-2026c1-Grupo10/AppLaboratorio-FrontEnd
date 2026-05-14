const API_URL =
  "http://localhost:3001";

export async function getPedidos() {

  const response = await fetch(
    `${API_URL}/pedidos`
  );

  if (!response.ok) {

    throw new Error(
      "Error obteniendo pedidos"
    );
  }

  return response.json();
}

export async function createPedido(
  pedido: any
) {

  const response = await fetch(
    `${API_URL}/pedidos`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        pedido
      ),
    }
  );

  if (!response.ok) {

    const errorData =
      await response.json();

    throw new Error(
      errorData.error ||
      "Error creando pedido"
    );
  }

  return response.json();
}

export async function updatePedido(
  id: number,
  data: any
) {

  const response = await fetch(
    `${API_URL}/pedidos/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        data
      ),
    }
  );

  if (!response.ok) {

    throw new Error(
      "Error actualizando pedido"
    );
  }

  return response.json();
}

