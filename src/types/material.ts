export interface Material {
  id: number;
  name: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  unit?: string;
  laboratorioId?: number;
  laboratorio?: { id: number; nombre: string };
  createdAt: string;
  updatedAt: string;
}
