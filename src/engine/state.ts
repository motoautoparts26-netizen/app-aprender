import type { PedagogyParams } from '../config/pedagogy';
import { colorVisionAlert } from './alerts';
import { dayKey } from './calendar';
import { applyTrial, markProvisional } from './mastery';
import {
  emptySkill,
  isMasteredNow,
  itemGatingSkills,
  itemIsMasteredNow,
  itemReachedMastery,
  skillId,
} from './skills';
import type {
  Alert,
  Content,
  DerivedState,
  Item,
  ItemState,
  SessionSummary,
  SkillState,
  Stage,
  StageStatus,
  Track,
  TrackId,
  TrackState,
  Trial,
} from './types';

/**
 * Deriva TODO o estado a partir do log de tentativas (seção 4.1).
 * Puro e determinístico: mesmas tentativas + mesmo `now` = mesmo estado.
 */
export function deriveState(
  trials: readonly Trial[],
  content: Content,
  params: PedagogyParams,
  now: number,
): DerivedState {
  const sorted = trials.slice().sort((a, b) => a.timestamp - b.timestamp);
  const skills: Record<string, SkillState> = {};
  const getSkill = (itemId: string, step: SkillState['step']): SkillState => {
    const id = skillId(itemId, step);
    let s = skills[id];
    if (!s) {
      s = emptySkill(itemId, step);
      skills[id] = s;
    }
    return s;
  };

  // --- Nivelamento: só a última rodada por trilha vale (refazer apaga o provisório). ---
  const provisionalEvents = computePlacementEvents(sorted, content, params);
  let nextEvent = 0;
  const applyEventsUpTo = (ts: number): void => {
    while (nextEvent < provisionalEvents.length && (provisionalEvents[nextEvent]?.at ?? Infinity) <= ts) {
      const ev = provisionalEvents[nextEvent++]!;
      for (const itemId of ev.itemIds) {
        const item = content.items[itemId];
        if (!item) continue;
        for (const st of item.gatingSteps) {
          const s = getSkill(itemId, st);
          if (s.status === 'not-started' || s.status === 'practicing') markProvisional(s, ev.at, params);
        }
      }
    }
  };

  for (const t of sorted) {
    if (!content.items[t.itemId]) continue; // item de conteúdo removido: ignora
    applyEventsUpTo(t.timestamp);
    applyTrial(getSkill(t.itemId, t.step), t, params);
  }
  applyEventsUpTo(now);

  // --- Itens ---
  const items: Record<string, ItemState> = {};
  for (const item of Object.values(content.items)) {
    const gating = itemGatingSkills(item, skills);
    const all = item.steps.map((st) => skills[skillId(item.id, st)] ?? emptySkill(item.id, st));
    let status: ItemState['status'];
    if (gating.every(isMasteredNow)) status = 'mastered';
    else if (gating.some((s) => s.status === 'reinforcement')) status = 'reinforcement';
    else if (all.some((s) => s.totalTrials > 0)) status = 'practicing';
    else status = 'not-started';
    items[item.id] = { itemId: item.id, status, reachedMastery: itemReachedMastery(item, skills), skills: all };
  }

  // --- Trilhas ---
  const tracks = {} as Record<TrackId, TrackState>;
  for (const track of Object.values(content.tracks)) {
    const ts = deriveTrack(track, content, skills, items, sorted, params);
    tracks[track.id] = ts;
    for (const id of ts.stuckItemIds) {
      const it = items[id];
      if (it) it.status = 'stuck';
    }
  }

  const alerts: Alert[] = [];
  const cvd = colorVisionAlert(sorted, content, params);
  if (cvd) alerts.push(cvd);

  return { skills, items, tracks, alerts, sessions: summarizeSessions(sorted), asOf: now };
}

interface PlacementEvent {
  at: number;
  itemIds: string[];
}

function computePlacementEvents(
  sorted: readonly Trial[],
  content: Content,
  params: PedagogyParams,
): PlacementEvent[] {
  // última sessão de nivelamento por trilha
  const lastSession: Partial<Record<TrackId, string>> = {};
  for (const t of sorted) if (t.isPlacement) lastSession[t.trackId] = t.sessionId;

  const byStage = new Map<string, { trials: number; correct: number; last: number }>();
  for (const t of sorted) {
    if (!t.isPlacement || lastSession[t.trackId] !== t.sessionId) continue;
    const acc = byStage.get(t.stageId) ?? { trials: 0, correct: 0, last: 0 };
    acc.trials++;
    if (t.correct) acc.correct++;
    acc.last = Math.max(acc.last, t.timestamp);
    byStage.set(t.stageId, acc);
  }
  const events: PlacementEvent[] = [];
  for (const [stageId, acc] of byStage) {
    const stage = content.stages[stageId];
    if (!stage || acc.trials === 0) continue;
    if (acc.correct / acc.trials >= params.PLACEMENT_PASS_ACCURACY) {
      events.push({ at: acc.last, itemIds: stage.itemIds });
    }
  }
  return events.sort((a, b) => a.at - b.at);
}

function deriveTrack(
  track: Track,
  content: Content,
  skills: Record<string, SkillState>,
  items: Record<string, ItemState>,
  sorted: readonly Trial[],
  params: PedagogyParams,
): TrackState {
  const stages = track.stages.slice().sort((a, b) => a.order - b.order);
  const stageStatus: Record<string, StageStatus> = {};
  const completed = new Set<string>();
  const stageHasTrials = new Set<string>();
  for (const t of sorted) {
    if (t.trackId === track.id && !t.isPlacement && !t.isReview) stageHasTrials.add(t.stageId);
  }
  const placementDone = sorted.some((t) => t.trackId === track.id && t.isPlacement);

  const reinforcementBefore = (order: number): string[] => {
    const out: string[] = [];
    for (const s of Object.values(skills)) {
      if (s.status !== 'reinforcement') continue;
      const item = content.items[s.itemId];
      const st = item ? content.stages[item.stageId] : undefined;
      if (item && st && item.trackId === track.id && st.order < order) out.push(s.skillId);
    }
    return out;
  };

  let currentStageId: string | null = null;
  let frozen = false;
  let freezingSkillIds: string[] = [];
  let prevCompleted = true;
  let decided = false;

  for (const stage of stages) {
    if (decided) {
      stageStatus[stage.id] = 'locked';
      continue;
    }
    const isCompleted = stage.itemIds.every((id) => items[id]?.reachedMastery);
    if (isCompleted) {
      stageStatus[stage.id] = 'completed';
      completed.add(stage.id);
      prevCompleted = true;
      continue;
    }
    const prereqsOk = prevCompleted && (stage.prereqStageIds ?? []).every((p) => completed.has(p));
    const blocking = reinforcementBefore(stage.order);
    const unlocked = prereqsOk && (blocking.length === 0 || stageHasTrials.has(stage.id));
    if (unlocked) {
      stageStatus[stage.id] = 'current';
      currentStageId = stage.id;
    } else {
      stageStatus[stage.id] = 'locked';
      if (prereqsOk && blocking.length > 0) {
        frozen = true;
        freezingSkillIds = blocking;
      }
    }
    decided = true;
  }

  const complete = stages.every((s) => completed.has(s.id));
  const { active, stuck } = currentStageId
    ? computeActiveSet(content.stages[currentStageId]!, content, skills, items, sorted, params)
    : { active: [], stuck: [] };

  return {
    trackId: track.id,
    stageStatus,
    currentStageId,
    frozen,
    freezingSkillIds,
    complete,
    activeItemIds: active,
    stuckItemIds: stuck,
    placementDone,
  };
}

/**
 * Conjunto ativo e itens encalhados (seção 7).
 * Dias no conjunto contam a partir do último domínio ocorrido na etapa.
 */
function computeActiveSet(
  stage: Stage,
  content: Content,
  skills: Record<string, SkillState>,
  items: Record<string, ItemState>,
  sorted: readonly Trial[],
  params: PedagogyParams,
): { active: string[]; stuck: string[] } {
  const stageItems = stage.itemIds.map((id) => content.items[id]).filter((i): i is Item => !!i);

  let lastMasteryInStage = 0;
  for (const it of stageItems) {
    for (const st of it.gatingSteps) {
      const s = skills[skillId(it.id, st)];
      if (s?.masteredAt && isMasteredNow(s)) lastMasteryInStage = Math.max(lastMasteryInStage, s.masteredAt);
    }
  }

  const targetDays = new Map<string, Set<string>>();
  for (const t of sorted) {
    if (t.stageId !== stage.id || t.isReview || t.isPlacement || t.timestamp <= lastMasteryInStage) continue;
    let set = targetDays.get(t.itemId);
    if (!set) {
      set = new Set();
      targetDays.set(t.itemId, set);
    }
    set.add(dayKey(t.timestamp));
  }

  const candidates = stageItems.filter((it) => {
    const state = items[it.id];
    if (!state || state.reachedMastery) return false;
    const prereqOk = (it.prereqItemIds ?? []).every((p) => items[p]?.reachedMastery);
    return prereqOk;
  });

  const isStuck = (it: Item): boolean => (targetDays.get(it.id)?.size ?? 0) >= params.STUCK_ACTIVE_DAYS;

  const active: string[] = [];
  const activeGlyphs: string[] = [];
  const conflicts = (it: Item): boolean =>
    !stage.allowConfusable &&
    (it.confusableWith ?? []).some((g) => activeGlyphs.includes(g));
  const tryAdd = (it: Item): void => {
    if (active.length >= params.ACTIVE_SET_SIZE || active.includes(it.id) || conflicts(it)) return;
    active.push(it.id);
    activeGlyphs.push(it.glyph);
  };

  const nonStuck = candidates.filter((it) => !isStuck(it));
  const stuckOnes = candidates.filter(isStuck);
  for (const it of nonStuck) tryAdd(it);
  // Encalhados voltam se não houver outro para ocupar a vaga.
  for (const it of stuckOnes) tryAdd(it);

  const stuck = stuckOnes.filter((it) => !active.includes(it.id)).map((it) => it.id);
  return { active, stuck };
}

function summarizeSessions(sorted: readonly Trial[]): SessionSummary[] {
  const map = new Map<string, SessionSummary>();
  for (const t of sorted) {
    if (t.isPlacement) continue;
    let s = map.get(t.sessionId);
    if (!s) {
      s = {
        sessionId: t.sessionId,
        trackId: t.trackId,
        dayKey: dayKey(t.timestamp),
        startedAt: t.timestamp,
        endedAt: t.timestamp,
        trials: 0,
        correct: 0,
      };
      map.set(t.sessionId, s);
    }
    s.trials++;
    if (t.correct) s.correct++;
    s.endedAt = Math.max(s.endedAt, t.timestamp);
  }
  return [...map.values()].sort((a, b) => a.startedAt - b.startedAt);
}

/** Sessões (não nivelamento) já feitas no dia de `now`. Para o limite diário. */
export function sessionsOnDay(state: DerivedState, now: number): number {
  const key = dayKey(now);
  return state.sessions.filter((s) => s.dayKey === key).length;
}
