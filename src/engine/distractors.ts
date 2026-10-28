import type { Rng } from './rng';
import type { Content, Item, Stage } from './types';

/** Opção neutra (forma cinza sem nome), último recurso quando não há itens suficientes. */
export const NEUTRAL_PREFIX = 'neutral-';

function conflicts(a: Item, b: Item, allowConfusable: boolean): boolean {
  if (a.glyph === b.glyph) return true;
  if (allowConfusable) return false;
  return (a.confusableWith ?? []).includes(b.glyph) || (b.confusableWith ?? []).includes(a.glyph);
}

/**
 * Escolhe distratores para um alvo (seção 11), em ordem de preferência:
 * mesma etapa → etapas anteriores → etapas futuras (sem nome) → neutros.
 * Nunca um glyph igual ao alvo; nunca pares confundíveis (com o alvo ou entre si) fora de etapa de contraste.
 * Dentro de cada nível a ordem é sorteada, para que nenhum distrator seja "sempre o mesmo".
 */
export function pickDistractors(
  target: Item,
  count: number,
  content: Content,
  rng: Rng,
): string[] {
  if (count <= 0) return [];
  const stage = content.stages[target.stageId];
  const track = content.tracks[target.trackId];
  const allow = !!stage?.allowConfusable;
  const order = stage?.order ?? 0;

  const pool = Object.values(content.items).filter((it) => it.trackId === target.trackId && it.pool === target.pool);
  // Um candidato por glyph: o item base (id === glyph) representa seus tons e variantes de etapas futuras.
  const baseIds = new Set(pool.map((it) => it.id));
  const samePool = pool.filter((it) => it.id !== target.id && (it.id === it.glyph || !baseIds.has(it.glyph)));
  const stageOrder = (it: Item): number => content.stages[it.stageId]?.order ?? 0;

  const tiers: Item[][] = [
    samePool.filter((it) => it.stageId === target.stageId),
    samePool.filter((it) => stageOrder(it) < order),
    samePool.filter((it) => stageOrder(it) > order),
  ];
  void track;

  const chosen: Item[] = [];
  for (const tier of tiers) {
    for (const cand of rng.shuffle(tier)) {
      if (chosen.length >= count) break;
      if (conflicts(target, cand, allow)) continue;
      if (chosen.some((c) => c.glyph === cand.glyph || conflicts(c, cand, allow))) continue;
      chosen.push(cand);
    }
    if (chosen.length >= count) break;
  }
  const ids = chosen.map((c) => c.id);
  let k = 1;
  while (ids.length < count) ids.push(`${NEUTRAL_PREFIX}${k++}`);
  return ids;
}

/**
 * Ajuda nível 1: remove UM distrator, o mais parecido com o alvo (confundível, se houver; senão sorteado).
 */
export function removeOneDistractor(target: Item, distractorIds: string[], content: Content, rng: Rng): string[] {
  if (distractorIds.length <= 1) return distractorIds;
  const confusable = distractorIds.find((id) => {
    const it = content.items[id];
    return it && (target.confusableWith ?? []).includes(it.glyph);
  });
  const toRemove = confusable ?? rng.pick(distractorIds);
  return distractorIds.filter((id) => id !== toRemove);
}

export function stageOf(item: Item, content: Content): Stage | undefined {
  return content.stages[item.stageId];
}
