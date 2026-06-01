import { TableRow, TableCell, Skeleton } from '@mui/material';

interface Props {
  columns: number;
  rows?: number;
}

export default function TableSkeleton({ columns, rows = 5 }: Props) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: columns }).map((__, j) => (
        <TableCell key={j}>
          <Skeleton animation="wave" height={24} />
        </TableCell>
      ))}
    </TableRow>
  ));
}
