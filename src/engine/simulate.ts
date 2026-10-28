import type { PedagogyParams } from '../config/pedagogy';
import { addDays, dayKey, daysBetween } from './calendar';
import { buildPlacementPlan, nextPlacementSlot } from './placement';
import { createRng, type Rng } from './rng';
import { SessionRunner, trialFromSlot } from './session';
import { skillId } from './skills';
import { deriveState } from './state';
import { isTraceStep, type Content, type DerivedState, type Slot, type TrackId, type Trial } from './types';

/**
 * Perfil de criança simulada (seção 16). A "força" de cada habilidade sobe com a exposição
 * e cai com os dias sem ver o item. A chance de acerto parte do chute (1/opções).
 */
export interface LearnerProfile {
  name: string;
  /** Quanto a força sobe a cada exposição. */
  gain: number;
  /** Teto da força. */
  cap: number;
  /** Fração da força perdida por dia sem ver a habilidade. */
  forgetPerDay: number;
  /** Força inicial (0 = nunca viu). Útil para simular criança que já sabe algo. */
  initialStrength?: number;
  /** Confusão sistemática: quando o alvo está num par e o parceiro está na tela, toca no parceiro com esta chance. */
  confusion?: { pairs: [string, string][]; probability: number };
}

export const PROFILES: Record<'fast' | 'slow' | 'forgetful' | 'redGreen', LearnerProfile> = {
  fast: { name: 'aprende rápido', gain: 0.25, cap: 0.98, forgetPerDay: 0.02 },
  slow: { name: 'aprende devagar', gain: 0.06, cap: 0.95, forgetPerDay: 0.04 },
  forgetful: { name: 'esquece', gain: 0.2, cap: 0.98, forgetPerDay: 0.12 },
  redGreen: {
    name: 'confunde vermelho e verde',
    gain: 0.25,
    cap: 0.98,
    forgetPerDay: 0.02,
    confusion: { pairs: [['red', 'green']], probability: 0.5 },
  },
};

export interface SimulationOptions {
  profile: LearnerProfile;
  content: Content;
  params: PedagogyParams;
  tracks: TrackId[];
  days: number;
  sessionsPerDay: number;
  seed: number;
  /** Instante do primeiro dia (hora local da primeira sessão). */
  start: number;
  adultMode?: boolean;
  profileId?: string;
}

export interface DayLog {
  day: number;
  dayKey: string;
  newlyMastered: string[];
  enteredReinforcement: string[];
  leftReinforcement: string[];
  currentStage: Partial<Record<TrackId, string | null>>;
  activeItems: Partial<Record<TrackId, string[]>>;
  frozen: TrackId[];
  stuck: string[];
  alerts: string[];
  trials: number;
  correct: number;
}

export interface SimulationResult {
  trials: Trial[];
  log: DayLog[];
  finalState: DerivedState;
}

/** Comportamento da criança simulada diante de um Slot. */
export class SimulatedChild {
  private strength = new Map<string, number>();
  private lastSeen = new Map<string, number>();

  constructor(
    private readonly profile: LearnerProfile,
    private readonly content: Content,
    private readonly rng: Rng,
  ) {}

  answer(slot: Slot, now: number): { chosenId: string | null; correct: boolean } {
    const sid = skillId(slot.itemId, slot.step);
    let s = this.strength.get(sid) ?? this.profile.initialStrength ?? 0;
    const last = this.lastSeen.get(sid);
    if (last !== undefined) {
      const days = Math.max(0, daysBetween(last, now));
      s *= Math.pow(1 - this.profile.forgetPerDay, days);
    }

    const guess = slot.optionsCount > 0 ? 1 / slot.optionsCount : isTraceStep(slot.step) ? 0.3 : 0.2;
    let p = guess + (1 - guess) * s;
    if (slot.helpLevel === 2) p = 1;
    else if (slot.helpLevel === 1) p = Math.min(1, p + 0.2);

    let chosenId: string | null = slot.itemId;
    let correct = true;

    const target = this.content.items[slot.itemId];
    const conf = this.profile.confusion;
    const partnerOnScreen =
      conf && target
        ? slot.distractorIds.find((d) => {
            const it = this.content.items[d];
            return it && conf.pairs.some(([a, b]) => (a === target.glyph && b === it.glyph) || (b === target.glyph && a === it.glyph));
          })
        : undefined;

    if (partnerOnScreen && conf && slot.helpLevel < 2 && this.rng.next() < conf.probability) {
      chosenId = partnerOnScreen;
      correct = false;
    } else if (this.rng.next() >= p) {
      correct = false;
      chosenId = slot.distractorIds.length > 0 ? this.rng.pick(slot.distractorIds) : null;
    }

    // Exposição: aprende mesmo errando (viu a resposta certa), um pouco menos.
    const gain = correct ? this.profile.gain : this.profile.gain * 0.6;
    this.strength.set(sid, Math.min(this.profile.cap, s + gain));
    this.lastSeen.set(sid, now);
    return { chosenId, correct };
  }
}

export function simulate(opts: SimulationOptions): SimulationResult {
  const rng = createRng(opts.seed);
  const child = new SimulatedChild(opts.profile, opts.content, rng);
  const profileId = opts.profileId ?? 'sim';
  const trials: Trial[] = [];
  const log: DayLog[] = [];
  let idCounter = 0;
  const nextId = (): string => `t${++idCounter}`;

  let prevState = deriveState([], opts.content, opts.params, opts.start);

  for (let day = 0; day < opts.days; day++) {
    const dayStart = addDays(opts.start, day);
    const dayTrialsBefore = trials.length;

    for (let sIdx = 0; sIdx < opts.sessionsPerDay; sIdx++) {
      const trackId = opts.tracks[(day * opts.sessionsPerDay + sIdx) % opts.tracks.length]!;
      let now = dayStart + sIdx * 4 * 3600 * 1000; // sessões espaçadas em 4 h
      const state = deriveState(trials, opts.content, opts.params, now);

      if (!state.tracks[trackId]?.placementDone) {
        const sessionId = `p-${day}-${sIdx}-${trackId}`;
        const plan = buildPlacementPlan(trackId, opts.content, opts.params, rng);
        const answered: Trial[] = [];
        let slot = nextPlacementSlot(plan, answered, opts.params);
        while (slot) {
          const ans = child.answer(slot, now);
          const trial = trialFromSlot(slot, { id: nextId(), profileId, sessionId, ...ans, timestamp: now });
          answered.push(trial);
          trials.push(trial);
          now += 20_000;
          slot = nextPlacementSlot(plan, answered, opts.params);
        }
        now += 60_000;
      }

      const stateForSession = deriveState(trials, opts.content, opts.params, now);
      const sessionId = `s-${day}-${sIdx}-${trackId}`;
      const runner = new SessionRunner(stateForSession, opts.content, opts.params, {
        trackId,
        profileId,
        sessionId,
        adultMode: !!opts.adultMode,
        seed: rng.int(1, 2 ** 31),
        startedAt: now,
      });
      let slot = runner.next(now);
      while (slot) {
        const ans = child.answer(slot, now);
        const trial = trialFromSlot(slot, { id: nextId(), profileId, sessionId, ...ans, timestamp: now });
        runner.record(trial);
        trials.push(trial);
        now += 15_000; // ~15 s por tentativa
        slot = runner.next(now);
      }
    }

    const endOfDay = dayStart + 23 * 3600 * 1000;
    const state = deriveState(trials, opts.content, opts.params, endOfDay);
    log.push(diffDay(day, dayKey(dayStart), prevState, state, trials.slice(dayTrialsBefore), opts.tracks));
    prevState = state;
  }

  return { trials, log, finalState: prevState };
}

function diffDay(
  day: number,
  key: string,
  before: DerivedState,
  after: DerivedState,
  dayTrials: Trial[],
  tracks: TrackId[],
): DayLog {
  const newlyMastered: string[] = [];
  const enteredReinforcement: string[] = [];
  const leftReinforcement: string[] = [];
  for (const s of Object.values(after.skills)) {
    const b = before.skills[s.skillId];
    const wasMastered = b?.status === 'mastered' || b?.status === 'provisional';
    const isMastered = s.status === 'mastered' || s.status === 'provisional';
    if (isMastered && !wasMastered && b?.status !== 'reinforcement') newlyMastered.push(s.skillId);
    if (s.status === 'reinforcement' && b?.status !== 'reinforcement') enteredReinforcement.push(s.skillId);
    if (b?.status === 'reinforcement' && s.status !== 'reinforcement') leftReinforcement.push(s.skillId);
  }
  const currentStage: Partial<Record<TrackId, string | null>> = {};
  const activeItems: Partial<Record<TrackId, string[]>> = {};
  const frozen: TrackId[] = [];
  const stuck: string[] = [];
  for (const t of tracks) {
    const ts = after.tracks[t];
    if (!ts) continue;
    currentStage[t] = ts.complete ? 'completa' : ts.currentStageId;
    activeItems[t] = ts.activeItemIds.slice();
    if (ts.frozen) frozen.push(t);
    stuck.push(...ts.stuckItemIds);
  }
  return {
    day,
    dayKey: key,
    newlyMastered,
    enteredReinforcement,
    leftReinforcement,
    currentStage,
    activeItems,
    frozen,
    stuck,
    alerts: after.alerts.map((a) => a.id),
    trials: dayTrials.filter((t) => !t.isPlacement).length,
    correct: dayTrials.filter((t) => !t.isPlacement && t.correct).length,
  };
}

/** Relatório de trajetória em texto (para docs e para o modo de desenvolvedor). */
export function formatTrajectory(name: string, result: SimulationResult): string {
  const lines: string[] = [`## Perfil: ${name}`, ''];
  for (const d of result.log) {
    const parts: string[] = [];
    const stages = Object.entries(d.currentStage)
      .map(([t, s]) => `${t}=${s ?? '—'}`)
      .join(' ');
    parts.push(`etapa: ${stages}`);
    if (d.trials > 0) parts.push(`acerto ${d.correct}/${d.trials}`);
    if (d.newlyMastered.length) parts.push(`dominou: ${d.newlyMastered.join(', ')}`);
    if (d.enteredReinforcement.length) parts.push(`REFORÇO: ${d.enteredReinforcement.join(', ')}`);
    if (d.leftReinforcement.length) parts.push(`saiu do reforço: ${d.leftReinforcement.join(', ')}`);
    if (d.frozen.length) parts.push(`congelado: ${d.frozen.join(', ')}`);
    if (d.stuck.length) parts.push(`encalhado: ${d.stuck.join(', ')}`);
    if (d.alerts.length) parts.push(`ALERTA: ${d.alerts.join(', ')}`);
    lines.push(`- Dia ${String(d.day + 1).padStart(2, '0')} (${d.dayKey}): ${parts.join(' · ')}`);
  }
  const st = result.finalState;
  const mastered = Object.values(st.skills).filter((s) => s.status === 'mastered' || s.status === 'provisional').length;
  const reinforcement = Object.values(st.skills).filter((s) => s.status === 'reinforcement').length;
  lines.push('', `**Final:** ${mastered} habilidades dominadas, ${reinforcement} em reforço, ${st.alerts.length} alerta(s).`, '');
  return lines.join('\n');
}
