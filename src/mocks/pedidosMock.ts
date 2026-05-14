import type{ Pedido } from '../types/pedido';

export const pedidosMock: Pedido[] = [
  {
    id: 1,
    fecha: '2026-05-10',
    horario: '08:00 - 10:00',
    alumnos: 25,
    estado: 'pendiente',
    laboratorioId: 1,
    laboratorioNombre: 'Laboratorio Química 1',
  },
];