import { DEFAULT_PEDAGOGY, type PedagogyParams } from '../../../config/pedagogy';
import { buildContent } from '../../../content';
import { addDays } from '../../calendar';
import type { Content, HelpLevel, Step, Trial } from '../../types';

/** Nome fictício nos testes (regra 10 da seção 20: nunca o nome real da criança). */
export const TEST_NAME = 'Teste';

export const params: PedagogyParams = DEFAULT_PEDAGOGY;

export function makeContent(name = TEST_NAME): Content {
  return buildContent({ childName: name });
}

/** Dia 0 às 10:00 local. */
export const T0 = new Date(2026, 0, 5, 10, 0, 0, 0).getTime();

/** Instante no dia `day` (a partir de T0), `idx` tentativas depois (20 s cada). */
export function at(day: number, idx = 0): number {
  return addDays(T0, day) + idx * 20_000;
}

let counter = 0;

export function makeTrial(partial: Partial<Trial> & { itemId: string; step: Step; timestamp: number }): Trial {
  const content = sharedContent();
  const item = content.items[partial.itemId];
  if (!item) throw new Error(`item de teste desconhecido: ${partial.itemId}`);
  return {
    id: `t${++counter}`,
    profileId: 'p1',
    sessionId: partial.sessionId ?? `s-${Math.floor((partial.timestamp - T0) / 86_400_000)}`,
    trackId: item.trackId,
    stageId: item.stageId,
    helpLevel: 0,
    optionsCount: 4,
    variantId: item.variants[0]!,
    distractorIds: [],
    chosenId: partial.correct === false ? (partial.chosenId ?? null) : partial.itemId,
    correct: true,
    isReview: false,
    isPlacement: false,
    ...partial,
  };
}

let _content: Content | null = null;
export function sharedContent(): Content {
  if (!_content) _content = makeContent();
  return _content;
}

export interface PracticeOpts {
  day: number;
  /** Lista de acertos/erros em ordem. */
  results: boolean[];
  options?: number;
  help?: HelpLevel;
  isReview?: boolean;
  /** Quantas variantes diferentes usar (cicla). Padrão: todas do item. */
  variants?: number;
  startIdx?: number;
}

/** Gera tentativas de uma habilidade num dia. */
export function practice(itemId: string, step: Step, opts: PracticeOpts): Trial[] {
  const item = sharedContent().items[itemId]!;
  const nVar = opts.variants ?? item.variants.length;
  return opts.results.map((correct, i) =>
    makeTrial({
      itemId,
      step,
      timestamp: at(opts.day, (opts.startIdx ?? 0) + i),
      correct,
      optionsCount: opts.options ?? 4,
      helpLevel: opts.help ?? 0,
      isReview: opts.isReview ?? false,
      variantId: item.variants[i % nVar]!,
    }),
  );
}

export const ok = (n: number): boolean[] => Array.from({ length: n }, () => true);

/** Dois dias qualificados (5 acertos cada) numa habilidade → dominada no dia `day+1`. */
export function masterSkill(itemId: string, step: Step, day: number): Trial[] {
  return [...practice(itemId, step, { day, results: ok(5) }), ...practice(itemId, step, { day: day + 1, results: ok(5) })];
}

/** Domina todos os gating steps de um item, um degrau por par de dias, a partir de `day`. */
export function masterItem(itemId: string, day: number): Trial[] {
  const item = sharedContent().items[itemId]!;
  const out: Trial[] = [];
  item.gatingSteps.forEach((st, i) => out.push(...masterSkill(itemId, st, day + i * 2)));
  return out;
}

/** Domina todos os itens de uma etapa em paralelo (mesmos dias). */
export function masterStage(stageId: string, day: number): Trial[] {
  const stage = sharedContent().stages[stageId]!;
  return stage.itemIds.flatMap((id) => masterItem(id, day));
}

/** Revisão (isReview) de uma habilidade. */
export function review(itemId: string, step: Step, day: number, correct: boolean, idx = 0): Trial {
  return makeTrial({ itemId, step, timestamp: at(day, 50 + idx), correct, isReview: true });
}
