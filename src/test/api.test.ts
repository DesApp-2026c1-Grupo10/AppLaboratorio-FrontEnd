import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHistorialPedido, finalizarPedido } from '../api/pedidos';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('pedidos API', () => {
  it('getHistorialPedido debería llamar al endpoint correcto', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1, tipo: 'CREACION' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getHistorialPedido(5);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/pedidos/5/historial'));
    expect(result).toHaveLength(1);
  });

  it('finalizarPedido debería enviar PUT con usuarioId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1, estado: 'Finalizado' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await finalizarPedido(1, { usuarioId: 99 });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/pedidos/1/finalizar',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ usuarioId: 99 }),
      })
    );
    expect(result.estado).toBe('Finalizado');
  });
});
