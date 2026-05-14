export type EstadoPedido =
  | 'pendiente'
  | 'aceptado'
  | 'rechazado';

export interface Pedido {

  id: number;

  fecha: string;

  horaInicio: string;

  horaFin: string;

  estado: string;

  descripcion: string;

  usuarioId: number;

  laboratorioId: number;

  Usuario?: {
    nombre: string;
    apellido: string;
  };

  Laboratorio?: {
    nombre: string;
  };
}