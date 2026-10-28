import type { Content, Item, Stage, Track, TrackId } from '../engine/types';
import { buildColorsTrack } from './colors';
import { buildLettersTrack } from './letters';
import { buildNumbersTrack } from './numbers';

export interface ContentOptions {
  /** Primeiro nome da criança, para a etapa L1. */
  childName: string;
  /** Trilhas ativas (painel). Padrão: todas. */
  enabledTracks?: TrackId[];
}

/** Monta o conteúdo completo. Puro: mesma entrada, mesma saída. */
export function buildContent(opts: ContentOptions): Content {
  const built = [buildColorsTrack(), buildLettersTrack(opts.childName), buildNumbersTrack()];
  const enabled = new Set<TrackId>(opts.enabledTracks ?? ['colors', 'letters', 'numbers']);

  const tracks = {} as Record<TrackId, Track>;
  const stages: Record<string, Stage> = {};
  const items: Record<string, Item> = {};

  for (const { track, items: trackItems } of built) {
    if (!enabled.has(track.id)) continue;
    tracks[track.id] = track;
    for (const s of track.stages) {
      if (stages[s.id]) throw new Error(`Etapa duplicada: ${s.id}`);
      stages[s.id] = s;
    }
    for (const it of trackItems) {
      if (items[it.id]) throw new Error(`Item duplicado: ${it.id}`);
      items[it.id] = it;
    }
  }
  validate({ tracks, stages, items });
  return { tracks, stages, items };
}

function validate(c: Content): void {
  for (const stage of Object.values(c.stages)) {
    for (const id of stage.itemIds) {
      const it = c.items[id];
      if (!it) throw new Error(`Etapa ${stage.id} referencia item inexistente ${id}`);
      if (it.stageId !== stage.id) throw new Error(`Item ${id} diz estar em ${it.stageId}, mas está em ${stage.id}`);
      if (it.variants.length === 0) throw new Error(`Item ${id} sem variantes`);
      for (const g of it.gatingSteps) {
        if (!it.steps.includes(g)) throw new Error(`Item ${id}: gating step ${g} não está em steps`);
      }
      for (const p of it.prereqItemIds ?? []) {
        if (!c.items[p]) throw new Error(`Item ${id}: pré-requisito inexistente ${p}`);
      }
    }
  }
}

export { COLORS, CVD_PAIRS, COLOR_CATEGORY_PAIRS } from './colors';
export { LETTER_NAMES, LETTER_PAIRS, lettersFromName, WORD_BANK, wordsFor } from './letters';
export { NUMBER_NAMES, NUMERAL_PAIRS, TRACE_PATHS } from './numbers';
