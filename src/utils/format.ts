export function formatTime(time: string | null | undefined): string {
  if (!time) return time || '';
  const parts = time.split(':');
  if (parts.length === 3) {
    return parts.slice(0, 2).join(':');
  }
  return time;
}
