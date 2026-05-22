export interface Reactivo {
  id: number;
  name: string;
  descripcion?: string;
  stock: number;
  unidadMedida?: string;
  vencimiento?: string;
  prep_time: number;
  laboratorioId?: number;
  laboratorio?: { id: number; nombre: string };
  createdAt: string;
  updatedAt: string;
}
