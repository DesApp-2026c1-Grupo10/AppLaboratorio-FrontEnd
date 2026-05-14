import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import type{ Laboratorio } from '../../types/laboratorio';

interface Props {
  laboratorios: Laboratorio[];
}

export default function LaboratorioTable({ laboratorios }: Props) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Nombre</TableCell>
          <TableCell>Capacidad</TableCell>
          <TableCell>Edificio</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {laboratorios.map((lab) => (
          <TableRow key={lab.id}>
            <TableCell>{lab.nombre}</TableCell>
            <TableCell>{lab.capacidad}</TableCell>
            <TableCell>{lab.edificio}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}