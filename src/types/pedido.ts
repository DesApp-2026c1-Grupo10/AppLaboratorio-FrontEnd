export type EstadoPedido = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Finalizado';

export interface RecursoMaterial {
  id: number;
  name: string;
  stock: number;
  unit?: string;
  PedidoMaterial?: { cantidad: number };
}

export interface RecursoReactivo {
  id: number;
  name: string;
  stock: number;
  unidadMedida?: string;
  PedidoReactivo?: { cantidad: number };
}

export interface Pedido {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  descripcion: string;
  usuarioId: number;
  laboratorioId: number;
  cantidadAlumnos: number;
  Usuario?: { id: number; nombre: string; apellido: string };
  Laboratorio?: { id: number; nombre: string };
  materiales?: RecursoMaterial[];
  reactivos?: RecursoReactivo[];
  Equipments?: { id: number; name: string; status: string }[];
  createdAt?: string;
  updatedAt?: string;
}
