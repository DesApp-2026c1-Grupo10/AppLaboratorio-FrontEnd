import type { Pedido } from '../types/pedido';

export const pedidosMock: Pedido[] = [
  {
    id: 1,
    fecha: '2026-05-10',
    horaInicio: '08:00',
    horaFin: '10:00',
    cantidadAlumnos: 25,
    estado: 'Pendiente',
    descripcion: 'Práctica de laboratorio',
    usuarioId: 1,
    laboratorioId: 1,
    Laboratorio: { id: 1, nombre: 'Laboratorio Química 1' },
  },
];