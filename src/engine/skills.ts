import type { Content, Item, SkillState, Step } from './types';

export function skillId(itemId: string, step: Step): string {
  return `${itemId}:${step}`;
}

export function parseSkillId(id: string): { itemId: string; step: Step } {
  const idx = id.lastIndexOf(':');
  return { itemId: id.slice(0, idx), step: id.slice(idx + 1) as Step };
}

export function emptySkill(itemId: string, step: Step): SkillState {
  return {
    skillId: skillId(itemId, step),
    itemId,
    step,
    status: 'not-started',
    qualifiedDays: [],
    currentDay: null,
    variantsCorrect: [],
    box: null,
    nextReviewAt: null,
    pendingRecheck: false,
    masteredAt: null,
    reinforcementSince: null,
    totalTrials: 0,
    totalCorrect: 0,
    lastTrialAt: null,
  };
}

/** Dominada agora (inclui provisória). Não inclui reforço. */
export function isMasteredNow(s: SkillState | undefined): boolean {
  return s !== undefined && (s.status === 'mastered' || s.status === 'provisional');
}

/** Já alcançou domínio alguma vez (dominada, provisória ou em reforço). */
export function reachedMastery(s: SkillState | undefined): boolean {
  return isMasteredNow(s) || s?.status === 'reinforcement';
}

export function itemGatingSkills(item: Item, skills: Record<string, SkillState>): SkillState[] {
  return item.gatingSteps.map((st) => skills[skillId(item.id, st)] ?? emptySkill(item.id, st));
}

export function itemIsMasteredNow(item: Item, skills: Record<string, SkillState>): boolean {
  return itemGatingSkills(item, skills).every(isMasteredNow);
}

export function itemReachedMastery(item: Item, skills: Record<string, SkillState>): boolean {
  return itemGatingSkills(item, skills).every(reachedMastery);
}

/** Degrau mais alto já dominado (ou em reforço) de um item; null se nenhum. */
export function highestReachedStep(item: Item, skills: Record<string, SkillState>): Step | null {
  let best: Step | null = null;
  for (const st of item.steps) {
    if (reachedMastery(skills[skillId(item.id, st)])) best = st;
  }
  return best;
}

/**
 * Próximo degrau a praticar: o primeiro, na ordem do item, que ainda não alcançou domínio
 * e cujo degrau anterior já alcançou. `recall` só entra com adulto presente.
 */
export function nextStepToPractice(
  item: Item,
  skills: Record<string, SkillState>,
  adultMode: boolean,
): Step | null {
  let prevReached = true;
  for (const st of item.steps) {
    const s = skills[skillId(item.id, st)];
    if (!reachedMastery(s)) {
      if (!prevReached) return null;
      if (st === 'recall' && !adultMode) return null;
      return st;
    }
    prevReached = true;
  }
  return null;
}

export function itemsOf(content: Content, itemIds: readonly string[]): Item[] {
  return itemIds.map((id) => {
    const it = content.items[id];
    if (!it) throw new Error(`Item desconhecido: ${id}`);
    return it;
  });
}
