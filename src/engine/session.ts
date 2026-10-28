import type { PedagogyParams } from '../config/pedagogy';
import { pickDistractors, removeOneDistractor } from './distractors';
import { intervalDaysForBox, requiresOptions } from './mastery';
import { createRng, type Rng } from './rng';
import { highestReachedStep, isMasteredNow, nextStepToPractice, skillId } from './skills';
import {
  isTraceStep,
  type Content,
  type DerivedState,
  type HelpLevel,
  type Item,
  type Slot,
  type SlotKind,
  type Step,
  type TrackId,
  type Trial,
} from './types';

export interface SessionConfig {
  trackId: TrackId;
  profileId: string;
  sessionId: string;
  adultMode: boolean;
  seed: number;
  startedAt: number;
}

interface SkillRef {
  itemId: string;
  step: Step;
}

interface Pending {
  dueIndex: number;
  slot: Slot;
}

/**
 * Monta a sessão tentativa a tentativa (seção 9). A interface chama `next(now)`,
 * mostra o Slot, cria o Trial com a resposta e chama `record(trial)`.
 * O estado de entrada é o do início da sessão; a derivação completa acontece fora.
 */
export class SessionRunner {
  private readonly rng: Rng;
  private readonly trials: Trial[] = [];
  private readonly slots: Slot[] = [];
  private readonly pending: Pending[] = [];
  private readonly introduced = new Set<string>();
  private readonly recheckScheduled = new Set<string>();
  private readonly retriesByItem = new Map<string, number>();
  private readonly reinforcementUsed = new Map<string, number>();

  private readonly masteredPool: SkillRef[];
  private readonly reinforcementQueue: SkillRef[];
  private readonly reviewQueue: SkillRef[];
  private readonly crossQueue: SkillRef[];
  private readonly fillerQueue: SkillRef[];
  private readonly activeItems: string[];
  private readonly reviewBudget: number;

  private rrIndex = 0;
  private poolIndex = 0;
  private reviewUsed = 0;
  private crossUsed = 0;
  private consecutiveErrors = 0;
  private consecutiveCorrect = 0;
  private easyMode = false;
  private endingEarly = false;
  private easyLeft = 0;
  private closingGiven = false;
  private ended = false;

  constructor(
    private readonly state: DerivedState,
    private readonly content: Content,
    private readonly params: PedagogyParams,
    private readonly cfg: SessionConfig,
  ) {
    this.rng = createRng(cfg.seed);
    const track = content.tracks[cfg.trackId];
    const trackState = state.tracks[cfg.trackId];
    const now = cfg.startedAt;

    const trackItems = track.stages
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap((s) => s.itemIds.map((id) => content.items[id]!));

    // Itens dominados (para aquecimento, fechamento, modo fácil e brincadeira livre), etapas iniciais primeiro.
    this.masteredPool = [];
    for (const it of trackItems) {
      const step = highestMasteredNowStep(it, state);
      if (step) this.masteredPool.push({ itemId: it.id, step });
    }

    this.reinforcementQueue = Object.values(state.skills)
      .filter((s) => s.status === 'reinforcement' && content.items[s.itemId]?.trackId === cfg.trackId)
      .sort((a, b) => (a.reinforcementSince ?? 0) - (b.reinforcementSince ?? 0))
      .map((s) => ({ itemId: s.itemId, step: s.step }));

    // Revisões: só o degrau mais alto de cada item; vencidas primeiro, mais atrasadas antes.
    const due: { ref: SkillRef; at: number }[] = [];
    const notDue: { ref: SkillRef; at: number }[] = [];
    const cross: { ref: SkillRef; lateness: number }[] = [];
    for (const it of Object.values(content.items)) {
      const step = highestReachedStep(it, state.skills);
      if (!step) continue;
      const s = state.skills[skillId(it.id, step)];
      if (!s || !isMasteredNow(s) || s.nextReviewAt === null) continue;
      const ref = { itemId: it.id, step };
      if (it.trackId === cfg.trackId) {
        if (s.pendingRecheck || s.nextReviewAt <= now) due.push({ ref, at: s.pendingRecheck ? 0 : s.nextReviewAt });
        else notDue.push({ ref, at: s.nextReviewAt });
      } else if (s.nextReviewAt <= now) {
        const interval = intervalDaysForBox(s.box ?? 1, params) * 24 * 3600 * 1000;
        const lateness = (now - s.nextReviewAt) / interval;
        if (lateness > params.CROSS_TRACK_OVERDUE_FACTOR) cross.push({ ref, lateness });
      }
    }
    this.reviewQueue = due.sort((a, b) => a.at - b.at).map((d) => d.ref);
    this.fillerQueue = notDue.sort((a, b) => a.at - b.at).map((d) => d.ref);
    this.crossQueue = cross
      .sort((a, b) => b.lateness - a.lateness)
      .slice(0, params.CROSS_TRACK_REVIEWS_MAX)
      .map((c) => c.ref);

    this.activeItems = trackState?.activeItemIds.slice() ?? [];
    const middle = params.SESSION_TARGET_TRIALS - params.WARMUP_TRIALS - 1;
    this.reviewBudget = Math.floor(params.REVIEW_SHARE * middle);
  }

  get count(): number {
    return this.trials.length;
  }

  get isOver(): boolean {
    return this.ended;
  }

  get recorded(): readonly Trial[] {
    return this.trials;
  }

  /** Próxima tentativa, ou null quando a sessão acabou. */
  next(now: number): Slot | null {
    if (this.ended) return null;
    const p = this.params;
    const n = this.trials.length;
    const timeUp = now - this.cfg.startedAt >= p.SESSION_MAX_MINUTES * 60_000;

    const finish = (): Slot | null => {
      if (!this.closingGiven) {
        this.closingGiven = true;
        return this.remember(this.easySlot('closing'));
      }
      this.ended = true;
      return null;
    };

    if (this.endingEarly) {
      if (this.easyLeft > 0) {
        this.easyLeft--;
        return this.remember(this.easySlot('easy'));
      }
      return finish();
    }
    if (n >= p.SESSION_TARGET_TRIALS - 1 || timeUp) return finish();
    if (n < p.WARMUP_TRIALS) return this.remember(this.easySlot('warmup'));

    const duePending = this.pending.findIndex((pd) => pd.dueIndex <= n);
    if (duePending >= 0) {
      const pd = this.pending[duePending]!;
      if (this.violatesRun(pd.slot.itemId)) {
        pd.dueIndex = n + 1;
      } else {
        this.pending.splice(duePending, 1);
        return this.remember(pd.slot);
      }
    }

    if (this.easyMode) return this.remember(this.easySlot('easy'));

    const fromQueue = (queue: SkillRef[], kind: SlotKind, isReview: boolean): Slot | null => {
      const idx = queue.findIndex((r) => !this.violatesRun(r.itemId));
      if (idx < 0) return null;
      const ref = queue.splice(idx, 1)[0]!;
      return this.makeSlot(ref.itemId, ref.step, kind, { isReview });
    };

    const reinforcement = fromQueue(this.reinforcementQueue, 'reinforcement', false);
    if (reinforcement) {
      // Reforço é prática: volta para a fila para repetir dentro da sessão, até o limite.
      const sid = skillId(reinforcement.itemId, reinforcement.step);
      const used = (this.reinforcementUsed.get(sid) ?? 0) + 1;
      this.reinforcementUsed.set(sid, used);
      if (used < p.REINFORCEMENT_MAX_PER_SESSION) {
        this.reinforcementQueue.push({ itemId: reinforcement.itemId, step: reinforcement.step });
      }
      return this.remember(reinforcement);
    }

    if (this.reviewUsed < this.reviewBudget) {
      const review = fromQueue(this.reviewQueue, 'review', true);
      if (review) {
        this.reviewUsed++;
        return this.remember(review);
      }
    }
    if (this.crossUsed < p.CROSS_TRACK_REVIEWS_MAX) {
      const cross = fromQueue(this.crossQueue, 'cross-review', true);
      if (cross) {
        this.crossUsed++;
        return this.remember(cross);
      }
    }

    const current = this.currentSlot();
    if (current) return this.remember(current);

    const filler = fromQueue(this.fillerQueue, 'filler', true);
    if (filler) return this.remember(filler);

    if (this.masteredPool.length > 0) return this.remember(this.easySlot('free'));
    return finish();
  }

  /** Registra a resposta à última tentativa entregue por `next`. */
  record(trial: Trial): void {
    const slot = this.slots[this.trials.length];
    this.trials.push(trial);
    const n = this.trials.length;
    const p = this.params;

    if (trial.correct) {
      this.consecutiveCorrect++;
      this.consecutiveErrors = 0;
      if (this.easyMode && this.consecutiveCorrect >= p.FRUSTRATION_RECOVERY_CORRECT) this.easyMode = false;
    } else {
      this.consecutiveErrors++;
      this.consecutiveCorrect = 0;
      if (this.consecutiveErrors >= p.FRUSTRATION_ERRORS) this.easyMode = true;
      this.scheduleFollowUp(trial, slot, n);
    }

    if (!this.endingEarly && n >= p.EARLY_END_MIN_TRIALS) {
      const correct = this.trials.filter((t) => t.correct).length;
      if (correct / n < p.EARLY_END_ACCURACY) {
        this.endingEarly = true;
        this.easyLeft = p.EARLY_END_EASY_TRIALS;
      }
    }
  }

  /**
   * Tentativa extra de uma atividade composta (ex.: detetive do nome registra uma por letra).
   * Conta para o tamanho e para a taxa de acerto da sessão; não gera retorno com dica.
   */
  recordExtra(trial: Trial): void {
    this.slots[this.trials.length] = { ...this.slots[this.trials.length - 1]!, kind: 'free', itemId: trial.itemId, step: trial.step };
    this.trials.push(trial);
    if (trial.correct) {
      this.consecutiveCorrect++;
      this.consecutiveErrors = 0;
    } else {
      this.consecutiveErrors++;
      this.consecutiveCorrect = 0;
      if (this.consecutiveErrors >= this.params.FRUSTRATION_ERRORS) this.easyMode = true;
    }
  }

  // ------------------------------------------------------------------

  private scheduleFollowUp(trial: Trial, slot: Slot | undefined, n: number): void {
    const p = this.params;
    const kind = slot?.kind;
    if (trial.isReview && trial.helpLevel === 0) {
      const sid = skillId(trial.itemId, trial.step);
      if (this.recheckScheduled.has(sid)) return;
      this.recheckScheduled.add(sid);
      this.pending.push({
        dueIndex: n + this.rng.int(p.RECHECK_DELAY_MIN, p.RECHECK_DELAY_MAX),
        slot: this.makeSlot(trial.itemId, trial.step, 'recheck', { isReview: true }),
      });
      return;
    }
    if (kind === 'warmup' || kind === 'closing' || kind === 'easy' || kind === 'free' || kind === 'filler') return;
    if (trial.helpLevel >= 2) return;
    const retries = this.retriesByItem.get(trial.itemId) ?? 0;
    if (retries >= 2) return;
    this.retriesByItem.set(trial.itemId, retries + 1);
    const help = (trial.helpLevel + 1) as HelpLevel;
    this.pending.push({
      dueIndex: n + this.rng.int(p.RETRY_DELAY_MIN, p.RETRY_DELAY_MAX),
      slot: this.makeSlot(trial.itemId, trial.step, 'retry', { help }),
    });
  }

  private remember(slot: Slot): Slot {
    this.slots[this.trials.length] = slot;
    return slot;
  }

  private violatesRun(itemId: string): boolean {
    const n = this.trials.length;
    if (n < this.params.MAX_SAME_ITEM_RUN) return false;
    for (let i = 1; i <= this.params.MAX_SAME_ITEM_RUN; i++) {
      if (this.trials[n - i]!.itemId !== itemId) return false;
    }
    return true;
  }

  /** Item do conjunto ativo, em rodízio, respeitando o limite de itens novos. */
  private currentSlot(): Slot | null {
    const p = this.params;
    const items = this.activeItems;
    for (let k = 0; k < items.length; k++) {
      const itemId = items[(this.rrIndex + k) % items.length]!;
      const item = this.content.items[itemId]!;
      if (this.violatesRun(itemId)) continue;
      const step = nextStepToPractice(item, this.state.skills, this.cfg.adultMode);
      if (!step) continue;
      const isNew = this.isNewItem(item) && !this.introduced.has(itemId);
      if (isNew && this.introduced.size >= p.NEW_ITEMS_PER_SESSION) continue;
      if (isNew) this.introduced.add(itemId);
      this.rrIndex = (this.rrIndex + k + 1) % items.length;
      return this.makeSlot(itemId, step, 'current', { introduce: isNew });
    }
    return null;
  }

  private isNewItem(item: Item): boolean {
    return item.steps.every((st) => (this.state.skills[skillId(item.id, st)]?.totalTrials ?? 0) === 0);
  }

  /**
   * Aquecimento, fechamento, modo fácil, brincadeira livre: item já dominado.
   * Sem item dominado (primeira sessão): PAREAR do conjunto ativo com poucas opções e ajuda, que não conta.
   */
  private easySlot(kind: SlotKind): Slot {
    const options = kind === 'easy' ? this.params.OPTIONS_EASY : this.params.OPTIONS_NORMAL;
    const pool = this.masteredPool;
    if (pool.length > 0) {
      for (let k = 0; k < pool.length; k++) {
        const ref = pool[(this.poolIndex + k) % pool.length]!;
        if (this.violatesRun(ref.itemId)) continue;
        this.poolIndex = (this.poolIndex + k + 1) % pool.length;
        return this.makeSlot(ref.itemId, ref.step, kind, { options });
      }
    }
    // Rodízio pelo conjunto ativo, para o aquecimento não repetir o mesmo item.
    let itemId: string | undefined;
    for (let k = 0; k < this.activeItems.length; k++) {
      const cand = this.activeItems[(this.poolIndex + k) % this.activeItems.length]!;
      if (this.violatesRun(cand)) continue;
      itemId = cand;
      this.poolIndex = (this.poolIndex + k + 1) % this.activeItems.length;
      break;
    }
    if (itemId === undefined) itemId = this.activeItems[0] ?? this.anyItemId();
    const item = this.content.items[itemId]!;
    const step = item.steps[0]!;
    return this.makeSlot(itemId, step, kind, { help: 1, options: this.params.OPTIONS_EASY });
  }

  private anyItemId(): string {
    const track = this.content.tracks[this.cfg.trackId];
    return track.stages[0]!.itemIds[0]!;
  }

  private makeSlot(
    itemId: string,
    step: Step,
    kind: SlotKind,
    opts: { help?: HelpLevel; options?: number; isReview?: boolean; introduce?: boolean } = {},
  ): Slot {
    const item = this.content.items[itemId]!;
    const help = opts.help ?? 0;
    const noOptions = !requiresOptions(step);
    let options = noOptions ? 0 : opts.options ?? this.params.OPTIONS_NORMAL;
    let distractors: string[] = [];
    if (!noOptions) {
      distractors = pickDistractors(item, options - 1, this.content, this.rng);
      if (help === 1 && distractors.length > 1) {
        distractors = removeOneDistractor(item, distractors, this.content, this.rng);
        options = distractors.length + 1;
      }
    }
    return {
      kind,
      trackId: item.trackId,
      stageId: item.stageId,
      itemId,
      step,
      helpLevel: help,
      optionsCount: options,
      variantId: this.pickVariant(item, step),
      distractorIds: distractors,
      isReview: !!opts.isReview,
      isPlacement: false,
      introduce: !!opts.introduce,
    };
  }

  /** Prefere variantes ainda sem acerto registrado, para cumprir MIN_VARIANTS cedo. */
  private pickVariant(item: Item, step: Step): string {
    if (isTraceStep(step)) return item.variants[0] ?? 'trace';
    const seen = this.state.skills[skillId(item.id, step)]?.variantsCorrect ?? [];
    const unseen = item.variants.filter((v) => !seen.includes(v));
    return this.rng.pick(unseen.length > 0 ? unseen : item.variants);
  }
}

function highestMasteredNowStep(item: Item, state: DerivedState): Step | null {
  let best: Step | null = null;
  for (const st of item.steps) {
    if (isMasteredNow(state.skills[skillId(item.id, st)])) best = st;
  }
  return best;
}

/** Monta o Trial a partir do Slot e da resposta. Usado pela interface e pelo simulador. */
export function trialFromSlot(
  slot: Slot,
  response: {
    id: string;
    profileId: string;
    sessionId: string;
    chosenId: string | null;
    correct: boolean;
    timestamp: number;
    mirrored?: boolean;
  },
): Trial {
  return {
    id: response.id,
    profileId: response.profileId,
    sessionId: response.sessionId,
    trackId: slot.trackId,
    stageId: slot.stageId,
    itemId: slot.itemId,
    step: slot.step,
    helpLevel: slot.helpLevel,
    optionsCount: slot.optionsCount,
    variantId: slot.variantId,
    distractorIds: slot.distractorIds,
    chosenId: response.chosenId,
    correct: response.correct,
    isReview: slot.isReview,
    isPlacement: slot.isPlacement,
    ...(response.mirrored !== undefined ? { mirrored: response.mirrored } : {}),
    timestamp: response.timestamp,
  };
}
