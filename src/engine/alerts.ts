import type { PedagogyParams } from '../config/pedagogy';
import { CVD_PAIRS } from '../content/colors';
import { dayKey } from './calendar';
import type { Alert, Content, Trial } from './types';

function isCvdPair(a: string, b: string): boolean {
  return CVD_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * Alerta de possível dificuldade na visão de cores (seção 15). Triagem, não diagnóstico.
 * Considera erros sem ajuda em PAREAR e RECONHECER da trilha de cores, em ≥ CVD_MIN_DAYS dias,
 * com ≥ CVD_MIN_ERRORS erros no total, dos quais ≥ CVD_PAIR_SHARE envolvem um par típico.
 */
export function colorVisionAlert(
  trials: readonly Trial[],
  content: Content,
  params: PedagogyParams,
): Alert | null {
  let errors = 0;
  let pairErrors = 0;
  const days = new Set<string>();
  for (const t of trials) {
    if (t.trackId !== 'colors' || t.helpLevel !== 0 || t.correct || t.isPlacement) continue;
    if (t.step !== 'match' && t.step !== 'recognize') continue;
    const target = content.items[t.itemId];
    const chosen = t.chosenId ? content.items[t.chosenId] : undefined;
    if (!target) continue;
    errors++;
    days.add(dayKey(t.timestamp));
    if (chosen && isCvdPair(target.glyph, chosen.glyph)) pairErrors++;
  }
  if (errors < params.CVD_MIN_ERRORS || days.size < params.CVD_MIN_DAYS) return null;
  const share = pairErrors / errors;
  if (share < params.CVD_PAIR_SHARE) return null;
  return {
    id: 'color-vision',
    message:
      'Notamos um padrão nas atividades de cores que pode valer uma conversa com um oftalmologista, ' +
      'incluindo um teste de visão de cores. Isso não é um diagnóstico: cores saturadas em tela se ' +
      'distinguem também pelo brilho, então o app não substitui o exame.',
    evidence: { errors, pairErrors, days: days.size, share: Math.round(share * 100) / 100 },
  };
}
