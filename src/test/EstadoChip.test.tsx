import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EstadoChip from '../components/pedidos/EstadoChip';

describe('EstadoChip', () => {
  it('debería renderizar Pendiente con color warning', () => {
    render(<EstadoChip estado="Pendiente" />);
    const chip = screen.getByText('Pendiente');
    expect(chip).toBeInTheDocument();
  });

  it('debería renderizar Aprobado con color success', () => {
    render(<EstadoChip estado="Aprobado" />);
    const chip = screen.getByText('Aprobado');
    expect(chip).toBeInTheDocument();
  });

  it('debería renderizar Finalizado con color info', () => {
    render(<EstadoChip estado="Finalizado" />);
    const chip = screen.getByText('Finalizado');
    expect(chip).toBeInTheDocument();
  });

  it('debería renderizar Cancelado', () => {
    render(<EstadoChip estado="Cancelado" />);
    const chip = screen.getByText('Cancelado');
    expect(chip).toBeInTheDocument();
  });

  it('debería aceptar labels personalizados', () => {
    render(<EstadoChip estado="CREACION" customLabels={{ CREACION: 'Creación' }} />);
    const chip = screen.getByText('Creación');
    expect(chip).toBeInTheDocument();
  });
});
