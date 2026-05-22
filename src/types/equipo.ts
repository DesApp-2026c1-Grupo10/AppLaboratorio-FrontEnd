export interface Equipo {
  id: number;
  name: string;
  descripcion?: string;
  status: 'Disponible' | 'En uso' | 'Mantenimiento' | 'Fuera de servicio';
  is_movable: boolean;
  bld_id?: number;
  laboratorioId?: number;
  laboratorio?: { id: number; nombre: string };
  ultimaRevision?: string;
  observaciones?: string;
  usos?: UsoEquipo[];
  createdAt: string;
  updatedAt: string;
}

export interface UsoEquipo {
  id: number;
  equipoId: number;
  pedidoId?: number;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
  equipo?: { id: number; name: string };
  pedido?: { id: number; fecha: string; descripcion: string };
}
