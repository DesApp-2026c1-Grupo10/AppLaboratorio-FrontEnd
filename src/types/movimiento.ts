export interface MovimientoStock {
  id: number;
  tipoMovimiento: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  observacion?: string;
  usuarioId: number;
  materialId?: number;
  reactivoId?: number;
  usuario?: { id: number; nombre: string; apellido: string };
  material?: { id: number; name: string };
  reactivo?: { id: number; name: string };
  createdAt: string;
}
