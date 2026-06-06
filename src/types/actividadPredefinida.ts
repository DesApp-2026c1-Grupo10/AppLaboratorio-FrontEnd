export interface ActividadPredefinida {
  id: number;
  nombre: string;
  laboratorioId: number;
  horaInicio: string;
  horaFin: string;
  cantidadAlumnos: number;
  descripcion?: string;
  config: {
    materiales?: { id: number; cantidad: number }[];
    reactivos?: { id: number; cantidad: number }[];
    equipos?: number[];
  } | null;
  usuarioId: number;
  Usuario?: { id: number; nombre: string; apellido: string };
  Laboratorio?: { id: number; nombre: string };
  createdAt: string;
  updatedAt: string;
}
