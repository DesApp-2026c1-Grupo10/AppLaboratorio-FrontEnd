export interface ComposicionItem {
  id: number;
  name: string;
  stock: number;
  ReactivoSustancia: { porcentaje: number };
}

export interface Reactivo {
  id: number;
  name: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  unidadMedida?: string;
  vencimiento?: string;
  prep_time: number;
  laboratorioId?: number;
  laboratorio?: { id: number; nombre: string; edificio?: string };
  composicion?: ComposicionItem[];
  createdAt: string;
  updatedAt: string;
}
