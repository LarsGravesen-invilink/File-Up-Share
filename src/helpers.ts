export function formatSize(mb: number): string {
  if (mb >= 1024) return (mb / 1024).toFixed(1);
  return mb.toFixed(0);
}

export function formatSizeUnit(mb: number): string {
  return mb >= 1024 ? 'ГБ' : 'МБ';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function durationToMs(value: number, unit: 'hours' | 'minutes'): number {
  return unit === 'hours' ? value * 3600000 : value * 60000;
}

export function timeLeft(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Истекло';
  const totalHours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (totalHours > 0) return `${totalHours}ч ${mins}м`;
  return `${mins}м`;
}

export function liveCountdown(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return '00:00:00';
  const totalHours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${String(totalHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
