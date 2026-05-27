import { Chip } from '@mui/material';

const defaultColors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  Pendiente: 'warning',
  Aprobado: 'success',
  Rechazado: 'error',
  Finalizado: 'info',
  Cancelado: 'default',
};

const defaultLabels: Record<string, string> = {
  Pendiente: 'Pendiente',
  Aprobado: 'Aprobado',
  Rechazado: 'Rechazado',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
};

interface Props {
  estado: string;
  customLabels?: Record<string, string>;
  customColors?: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'>;
}

export default function EstadoChip({ estado, customLabels, customColors }: Props) {
  const labels = customLabels || defaultLabels;
  const colors = customColors || defaultColors;
  return (
    <Chip
      label={labels[estado] || estado}
      color={colors[estado] || 'default'}
      size="small"
      variant="outlined"
    />
  );
}
