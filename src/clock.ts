/**
 * Único lugar da interface que lê o relógio. O modo de desenvolvedor pode somar um
 * deslocamento (dias) para testar a revisão espaçada. O motor nunca chama isto:
 * ele recebe `now` por parâmetro.
 */
let offsetMs = 0;

export const clock = {
  now(): number {
    return Date.now() + offsetMs;
  },
  getOffsetMs(): number {
    return offsetMs;
  },
  setOffsetMs(ms: number): void {
    offsetMs = ms;
  },
  addDays(days: number): void {
    offsetMs += days * 24 * 60 * 60 * 1000;
  },
};
