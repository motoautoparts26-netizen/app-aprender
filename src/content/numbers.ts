import type { Item, Stage, Track } from '../engine/types';

/**
 * Trilha dos Números (seção 12.3). Cada etapa define seus próprios itens e degraus.
 *
 * Pools: 'quantity' (cartões com N objetos), 'numeral' (o símbolo), 'trace' (traçado).
 */

export const NUMBER_NAMES: Record<number, string> = {
  0: 'zero', 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
  6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
};

/** Pares confundíveis de numerais. Nunca juntos antes de N6. */
export const NUMERAL_PAIRS: [string, string][] = [['6', '9'], ['2', '5'], ['1', '7'], ['3', '8']];

/** Variantes de quantidade: tipo de objeto × arranjo. */
const QTY_VARIANTS = ['dots:line', 'apples:row', 'stars:triangle', 'ducks:scatter', 'dots:dice'];
const NUMERAL_VARIANTS = ['size-l:ink', 'size-m:slate', 'size-s:navy', 'size-l:slate'];

function confusableNumerals(n: string): string[] {
  const out: string[] = [];
  for (const [a, b] of NUMERAL_PAIRS) {
    if (a === n) out.push(b);
    if (b === n) out.push(a);
  }
  return out;
}

/** N1 / N2: item é a quantidade. */
function quantityItem(n: number, stageId: string, steps: Item['steps'], prefix: string): Item {
  return {
    id: `${prefix}-${n}`,
    trackId: 'numbers',
    stageId,
    glyph: `q${n}`,
    pool: 'quantity',
    variants: QTY_VARIANTS,
    steps,
    gatingSteps: steps,
    confusableWith: [],
    prereqItemIds: [],
    speechKey: `number.${n}`,
  };
}

/** N3 / N5 / N6: item é o numeral. */
function numeralItem(n: number, stageId: string, extra: Partial<Item> = {}): Item {
  return {
    id: `num-${n}`,
    trackId: 'numbers',
    stageId,
    glyph: String(n),
    pool: 'numeral',
    variants: NUMERAL_VARIANTS,
    steps: ['match', 'recognize', 'recognize-qty'],
    gatingSteps: ['match', 'recognize', 'recognize-qty'],
    confusableWith: confusableNumerals(String(n)),
    prereqItemIds: [],
    speechKey: `number.${n}`,
    ...extra,
  };
}

/** N4 / N5: traçado. Sem opções, sem variantes. */
function traceItem(n: number, stageId: string, prereq: string[]): Item {
  return {
    id: `trace-${n}`,
    trackId: 'numbers',
    stageId,
    glyph: `t${n}`,
    pool: 'trace',
    variants: ['trace'],
    steps: ['trace-guided', 'trace-dotted', 'trace-free'],
    gatingSteps: ['trace-guided', 'trace-dotted'],
    confusableWith: [],
    prereqItemIds: prereq,
    speechKey: `number.${n}`,
  };
}

/**
 * Pontos de verificação do traçado em coordenadas normalizadas (0–1) de uma caixa
 * 1:1.4 (largura:altura). A UI escala para a tela. Ordem = sequência exigida.
 * Cada subarray é um traço (levantar o dedo entre eles).
 */
export const TRACE_PATHS: Record<number, [number, number][][]> = {
  0: [[[0.5, 0.1], [0.2, 0.3], [0.2, 0.7], [0.5, 0.9], [0.8, 0.7], [0.8, 0.3], [0.5, 0.1]]],
  // 1 com a "pontinha": começa à esquerda, sobe até o topo e desce reto (um traço só).
  1: [[[0.32, 0.3], [0.55, 0.1], [0.55, 0.5], [0.55, 0.9]]],
  2: [[[0.25, 0.25], [0.5, 0.1], [0.75, 0.3], [0.5, 0.55], [0.25, 0.9], [0.75, 0.9]]],
  3: [[[0.25, 0.2], [0.55, 0.1], [0.7, 0.3], [0.45, 0.5], [0.7, 0.7], [0.55, 0.9], [0.25, 0.8]]],
  4: [[[0.35, 0.1], [0.2, 0.6], [0.8, 0.6]], [[0.65, 0.1], [0.65, 0.9]]],
  5: [[[0.75, 0.1], [0.3, 0.1], [0.3, 0.5], [0.6, 0.45], [0.75, 0.7], [0.5, 0.9], [0.25, 0.8]]],
  6: [[[0.7, 0.1], [0.35, 0.4], [0.25, 0.7], [0.5, 0.9], [0.75, 0.7], [0.5, 0.5], [0.25, 0.7]]],
  7: [[[0.25, 0.1], [0.75, 0.1], [0.5, 0.5], [0.35, 0.9]]],
  8: [[[0.7, 0.2], [0.3, 0.3], [0.7, 0.7], [0.5, 0.9], [0.3, 0.7], [0.7, 0.3], [0.5, 0.1], [0.7, 0.2]]],
  9: [[[0.75, 0.3], [0.5, 0.1], [0.25, 0.3], [0.5, 0.5], [0.75, 0.3], [0.75, 0.6], [0.5, 0.9]]],
  10: [[[0.12, 0.28], [0.28, 0.1], [0.28, 0.5], [0.28, 0.9]], [[0.7, 0.1], [0.5, 0.3], [0.5, 0.7], [0.7, 0.9], [0.9, 0.7], [0.9, 0.3], [0.7, 0.1]]],
};

export function buildNumbersTrack(): { track: Track; items: Item[] } {
  const items: Item[] = [];
  const stage = (
    id: string,
    order: number,
    title: string,
    itemIds: string[],
    extra: Partial<Stage> = {},
  ): Stage => ({ id, trackId: 'numbers', order, title, itemIds, placement: true, ...extra });

  // N1: quantidades 1–3 de relance: match (flash) e recognize.
  const n1 = [1, 2, 3].map((n) => quantityItem(n, 'N1', ['match', 'recognize'], 'qty'));
  // N2: contagem 1–5 com correspondência um a um: só recognize ("quantos tem?").
  const n2 = [1, 2, 3, 4, 5].map((n) => quantityItem(n, 'N2', ['recognize'], 'count'));
  // N3: símbolo 1–5.
  const n3 = [1, 2, 3, 4, 5].map((n) => numeralItem(n, 'N3'));
  // N4: traçado 1–5. Exige N3 (etapa) e o numeral correspondente (item).
  const n4 = [1, 2, 3, 4, 5].map((n) => traceItem(n, 'N4', [`num-${n}`]));
  // N5: 6–10, quantidade → símbolo → traçado.
  const n5count = [6, 7, 8, 9, 10].map((n) => quantityItem(n, 'N5', ['recognize'], 'count'));
  const n5num = [6, 7, 8, 9, 10].map((n) => numeralItem(n, 'N5', { prereqItemIds: [`count-${n}`] }));
  const n5trace = [6, 7, 8, 9, 10].map((n) => traceItem(n, 'N5', [`num-${n}`]));
  // N6: pares confundíveis em contraste e o zero.
  const n6pairs = [6, 9, 2, 5, 1, 7].map((n) =>
    numeralItem(n, 'N6', {
      id: `num-${n}@N6`,
      steps: ['recognize'],
      gatingSteps: ['recognize'],
      prereqItemIds: [`num-${n}`],
    }),
  );
  const zero = numeralItem(0, 'N6', {
    steps: ['recognize', 'recognize-qty'],
    gatingSteps: ['recognize', 'recognize-qty'],
    confusableWith: [],
  });

  items.push(...n1, ...n2, ...n3, ...n4, ...n5count, ...n5num, ...n5trace, ...n6pairs, zero);

  const track: Track = {
    id: 'numbers',
    title: 'Números',
    stages: [
      stage('N1', 1, 'Quantos são? (1 a 3)', n1.map((i) => i.id), { placementStep: 'match' }),
      stage('N2', 2, 'Contar até 5', n2.map((i) => i.id)),
      stage('N3', 3, 'Os números de 1 a 5', n3.map((i) => i.id)),
      stage('N4', 4, 'Desenhar de 1 a 5', n4.map((i) => i.id), { placement: false, prereqStageIds: ['N3'] }),
      stage('N5', 5, 'De 6 a 10', [...n5count, ...n5num, ...n5trace].map((i) => i.id), { placement: false }),
      stage('N6', 6, 'Números parecidos e o zero', [...n6pairs, zero].map((i) => i.id), {
        allowConfusable: true,
        placement: false,
      }),
    ],
  };
  return { track, items };
}
