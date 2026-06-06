export interface SustanciaBasica {
  id: number;
  name: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  unidadMedida?: string;
  createdAt: string;
  updatedAt: string;
}
