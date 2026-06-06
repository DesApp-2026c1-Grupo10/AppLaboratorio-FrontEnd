export interface Tarea {
  id: number;
  pedidoId: number;
  descripcion: string;
  completada: boolean;
  tipo: string | null;
  createdAt: string;
  updatedAt: string;
}
