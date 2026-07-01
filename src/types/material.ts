export interface Material {
  id: number;
  name: string;
  descripcion?: string;
  stock: number;
  stockComprometido?: number;
  stockMinimo: number;
  unit?: string;
  laboratorioId?: number;
  laboratorio?: { id: number; nombre: string; edificio?: string };
  createdAt: string;
  updatedAt: string;
}
