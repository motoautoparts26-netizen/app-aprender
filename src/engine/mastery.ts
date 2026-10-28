import type { PedagogyParams } from '../config/pedagogy';
import { addDays, dayKey, startOfDay } from './calendar';
import { isTraceStep, type SkillState, type Step, type Trial } from './types';

/** Degraus sem opções na tela: traçado e evocação. Para eles a regra de MIN_OPTIONS não se aplica. */
export function requiresOptions(step: Step): boolean {
  return !isTraceStep(step) && step !== 'recall';
}

export function intervalDaysForBox(box: number, params: PedagogyParams): number {
  const intervals = params.REVIEW_INTERVALS_DAYS;
  const idx = Math.min(Math.max(box, 1), intervals.length) - 1;
  return intervals[idx] ?? 30;
}

/** Revisão vence às 00:00 do dia `days` depois do instante dado. */
export function reviewDueAt(from: number, days: number): number {
  return startOfDay(addDays(from, days));
}

/** A tentativa conta para o domínio? (seção 6) */
export function trialCounts(trial: Trial, params: PedagogyParams): boolean {
  if (trial.helpLevel !== 0 || trial.isPlacement || trial.isReview) return false;
  if (requiresOptions(trial.step) && trial.optionsCount < params.MIN_OPTIONS) return false;
  return true;
}

function minTrialsPerDay(step: Step, params: PedagogyParams): number {
  return isTraceStep(step) ? params.TRACE_MIN_TRIALS_PER_DAY : params.MIN_TRIALS_PER_DAY;
}

function markMastered(skill: SkillState, ts: number, params: PedagogyParams): void {
  skill.status = 'mastered';
  skill.box = 1;
  skill.nextReviewAt = reviewDueAt(ts, intervalDaysForBox(1, params));
  skill.masteredAt = ts;
  skill.pendingRecheck = false;
  skill.reinforcementSince = null;
  skill.qualifiedDays = [];
  skill.currentDay = null;
}

export function markProvisional(skill: SkillState, ts: number, params: PedagogyParams): void {
  skill.status = 'provisional';
  skill.box = 1;
  skill.nextReviewAt = reviewDueAt(ts, intervalDaysForBox(1, params));
  skill.masteredAt = ts;
  skill.pendingRecheck = false;
  skill.qualifiedDays = [];
  skill.currentDay = null;
}

function enterReinforcement(skill: SkillState, ts: number): void {
  skill.status = 'reinforcement';
  skill.box = null;
  skill.nextReviewAt = null;
  skill.pendingRecheck = false;
  skill.qualifiedDays = [];
  skill.currentDay = null;
  skill.reinforcementSince = ts;
}

/**
 * Aplica uma tentativa ao estado de uma habilidade (mutação). Chamado em ordem cronológica.
 * Implementa as seções 6 (domínio) e 8 (revisão e reforço).
 */
export function applyTrial(skill: SkillState, trial: Trial, params: PedagogyParams): void {
  skill.totalTrials++;
  if (trial.correct) skill.totalCorrect++;
  skill.lastTrialAt = trial.timestamp;
  if (trial.isPlacement) return;

  const mastered = skill.status === 'mastered' || skill.status === 'provisional';

  if (trial.isReview) {
    if (!mastered || trial.helpLevel !== 0) return;
    if (trial.correct) {
      if (skill.pendingRecheck) {
        // Segunda checagem passou: fica na mesma caixa, intervalo atual.
        skill.pendingRecheck = false;
        skill.nextReviewAt = reviewDueAt(trial.timestamp, intervalDaysForBox(skill.box ?? 1, params));
      } else {
        const nextBox = Math.min((skill.box ?? 1) + 1, params.REVIEW_INTERVALS_DAYS.length);
        skill.box = nextBox;
        skill.nextReviewAt = reviewDueAt(trial.timestamp, intervalDaysForBox(nextBox, params));
        // Uma revisão correta confirma o domínio provisório.
        skill.status = 'mastered';
      }
    } else if (skill.pendingRecheck) {
      enterReinforcement(skill, trial.timestamp);
    } else {
      skill.pendingRecheck = true;
    }
    return;
  }

  // Tentativa comum (não revisão) numa habilidade já dominada: brincadeira livre, sem efeito.
  if (mastered) return;

  if (skill.status === 'not-started') skill.status = 'practicing';
  if (!trialCounts(trial, params)) return;

  const day = dayKey(trial.timestamp);
  if (!skill.currentDay || skill.currentDay.key !== day) {
    skill.currentDay = { key: day, trials: 0, errors: 0 };
  }
  skill.currentDay.trials++;
  if (trial.correct) {
    if (!skill.variantsCorrect.includes(trial.variantId)) skill.variantsCorrect.push(trial.variantId);
  } else {
    skill.currentDay.errors++;
  }

  const minTrials = minTrialsPerDay(trial.step, params);
  const { trials, errors } = skill.currentDay;
  if (trials >= minTrials) {
    if (errors > params.MAX_ERRORS_PER_DAY) {
      // Dia reprovado: zera a contagem de dias qualificados.
      skill.qualifiedDays = [];
    } else if (!skill.qualifiedDays.includes(day)) {
      skill.qualifiedDays.push(day);
    }
  }

  const needDays = skill.status === 'reinforcement' ? params.REINFORCEMENT_DAYS : params.MASTERY_DAYS;
  const variantsOk = isTraceStep(trial.step) || skill.variantsCorrect.length >= params.MIN_VARIANTS;
  if (skill.qualifiedDays.length >= needDays && variantsOk) {
    markMastered(skill, trial.timestamp, params);
  }
}
