/**
 * Dia de calendário = dia local do aparelho, corte às 00:00 (seção 4.2).
 * O motor nunca lê o relógio: `now` sempre chega por parâmetro.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Chave YYYY-MM-DD no fuso local. */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Início (00:00 local) do dia que contém o timestamp. */
export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Soma dias de calendário mantendo a hora local. */
export function addDays(timestamp: number, days: number): number {
  const d = new Date(timestamp);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Diferença em dias de calendário entre dois instantes (b - a). */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}
