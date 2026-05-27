export interface LaboratorioStats {
  nombre: string;
  count: number;
  alumnos: number;
}

export interface EquipoStats {
  nombre: string;
  usos: number;
}

export interface MaterialStats {
  nombre: string;
  cantidad: number;
}

export interface ReactivoStats {
  nombre: string;
  cantidad: number;
}

export interface EstadisticasData {
  resumen: {
    totalPedidos: number;
    pedidosPorEstado: Record<string, number>;
  };
  laboratoriosMasUsados: LaboratorioStats[];
  equiposMasUsados: EquipoStats[];
  materialesMasUsados: MaterialStats[];
  reactivosMasUsados: ReactivoStats[];
  semanal: {
    pedidos: number;
    usosEquipo: number;
    movimientos: number;
  };
}
