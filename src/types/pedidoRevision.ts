export interface PedidoRevision {
  id: number;
  pedidoId: number;
  usuarioId: number;
  comentario: string | null;
  cambios: Record<string, any> | null;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  createdAt: string;
  updatedAt: string;
  Usuario?: { id: number; nombre: string; apellido: string; rol: string };
}
