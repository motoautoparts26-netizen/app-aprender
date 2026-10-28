import type { PedagogyParams } from '../config/pedagogy';
import { pickDistractors } from './distractors';
import type { Rng } from './rng';
import type { Content, Slot, Stage, TrackId, Trial } from './types';

/**
 * Nivelamento (seção 14): testa itens representativos de cada etapa, em ordem,
 * e para na primeira etapa com acerto abaixo de PLACEMENT_PASS_ACCURACY.
 */
export interface PlacementPlan {
  trackId: TrackId;
  stages: { stageId: string; slots: Slot[] }[];
}

export function buildPlacementPlan(
  trackId: TrackId,
  content: Content,
  params: PedagogyParams,
  rng: Rng,
): PlacementPlan {
  const track = content.tracks[trackId];
  const stages = track.stages
    .filter((s) => s.placement && s.itemIds.length > 0)
    .sort((a, b) => a.order - b.order);

  return {
    trackId,
    stages: stages.map((stage) => ({ stageId: stage.id, slots: slotsForStage(stage, content, params, rng) })),
  };
}

function slotsForStage(stage: Stage, content: Content, params: PedagogyParams, rng: Rng): Slot[] {
  const ids = stage.itemIds;
  const reps: string[] = [];
  // Primeiro e último item da etapa (ou os primeiros N se a etapa for pequena).
  const n = Math.min(params.PLACEMENT_ITEMS_PER_STAGE, ids.length);
  if (n === 1) reps.push(ids[0]!);
  else {
    reps.push(ids[0]!);
    reps.push(ids[ids.length - 1]!);
    for (let i = 1; reps.length < n && i < ids.length - 1; i++) reps.push(ids[i]!);
  }
  const slots: Slot[] = [];
  for (let r = 0; r < params.PLACEMENT_TRIALS_PER_ITEM; r++) {
    for (const itemId of reps) {
      const item = content.items[itemId]!;
      const step = stage.placementStep ?? (item.steps.includes('recognize') ? 'recognize' : item.steps[0]!);
      const variant = item.variants[r % item.variants.length]!;
      slots.push({
        kind: 'placement',
        trackId: item.trackId,
        stageId: stage.id,
        itemId,
        step,
        helpLevel: 0,
        optionsCount: params.OPTIONS_NORMAL,
        variantId: variant,
        distractorIds: pickDistractors(item, params.OPTIONS_NORMAL - 1, content, rng),
        isReview: false,
        isPlacement: true,
        introduce: false,
      });
    }
  }
  return slots;
}

/**
 * Próxima tentativa do nivelamento dado o que já foi respondido nesta rodada.
 * null = nivelamento terminou (uma etapa ficou abaixo do corte, ou acabaram as etapas).
 */
export function nextPlacementSlot(
  plan: PlacementPlan,
  answered: readonly Trial[],
  params: PedagogyParams,
): Slot | null {
  for (const stage of plan.stages) {
    const done = answered.filter((t) => t.stageId === stage.stageId && t.isPlacement);
    if (done.length < stage.slots.length) return stage.slots[done.length]!;
    const acc = done.filter((t) => t.correct).length / done.length;
    if (acc < params.PLACEMENT_PASS_ACCURACY) return null;
  }
  return null;
}

/** Etapas aprovadas numa rodada de nivelamento. */
export function placementPassedStages(answered: readonly Trial[], params: PedagogyParams): string[] {
  const byStage = new Map<string, { t: number; c: number }>();
  for (const t of answered) {
    if (!t.isPlacement) continue;
    const a = byStage.get(t.stageId) ?? { t: 0, c: 0 };
    a.t++;
    if (t.correct) a.c++;
    byStage.set(t.stageId, a);
  }
  return [...byStage.entries()].filter(([, a]) => a.c / a.t >= params.PLACEMENT_PASS_ACCURACY).map(([id]) => id);
}
