import AgendaDiaria from '../components/agenda/AgendaDiaria';
import { pedidosMock } from '../mocks/pedidosMock';

export default function Agenda() {
  return (
    <div>
      <AgendaDiaria pedidos={pedidosMock} />
    </div>
  );
}