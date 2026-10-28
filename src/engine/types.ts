/**
 * Tipos do motor pedagógico. Este módulo (e todo src/engine) não conhece
 * React, banco de dados nem relógio: tudo chega por parâmetro.
 */

export type TrackId = 'colors' | 'letters' | 'numbers';

/** Degraus. Cores e letras usam match → recognize → recall. Números têm degraus próprios. */
export type Step =
  | 'match'
  | 'recognize'
  | 'recall'
  | 'recognize-qty'
  | 'trace-guided'
  | 'trace-dotted'
  | 'trace-free';

export const TRACE_STEPS: readonly Step[] = ['trace-guided', 'trace-dotted', 'trace-free'];

export function isTraceStep(step: Step): boolean {
  return TRACE_STEPS.includes(step);
}

export type HelpLevel = 0 | 1 | 2;

/** A única fonte da verdade. Tudo o mais é derivado da lista de tentativas. */
export interface Trial {
  id: string;
  profileId: string;
  sessionId: string;
  trackId: TrackId;
  stageId: string;
  itemId: string;
  step: Step;
  helpLevel: HelpLevel;
  /** Opções na tela. 0 no traçado. */
  optionsCount: number;
  variantId: string;
  distractorIds: string[];
  /** O que a criança tocou. null = não respondeu. */
  chosenId: string | null;
  correct: boolean;
  isReview: boolean;
  isPlacement: boolean;
  mirrored?: boolean;
  /** epoch ms */
  timestamp: number;
}

// ---------------- Conteúdo ----------------

export interface Item {
  id: string;
  trackId: TrackId;
  stageId: string;
  /** O que aparece na tela (ex.: 'M', 'red', '3'). Dois itens com o mesmo glyph nunca ficam juntos. */
  glyph: string;
  /** Família de opções: distratores vêm do mesmo pool (ex.: 'color', 'letter', 'numeral', 'quantity'). */
  pool: string;
  /** Apresentações diferentes do item (seção 5). */
  variants: string[];
  /** Degraus na ordem em que são liberados. */
  steps: Step[];
  /** Degraus cujo domínio é exigido para o item contar como dominado. */
  gatingSteps: Step[];
  /** Glyphs com que este item se confunde. Nunca juntos na tela antes da etapa de contraste. */
  confusableWith?: string[];
  /** Itens que precisam estar dominados antes deste entrar no conjunto ativo. */
  prereqItemIds?: string[];
  /** Chave do catálogo de falas com o nome do item. */
  speechKey: string;
}

export interface Stage {
  id: string;
  trackId: TrackId;
  order: number;
  title: string;
  itemIds: string[];
  /** Etapa de contraste: pares confundíveis podem aparecer juntos. */
  allowConfusable?: boolean;
  /** Etapas que precisam estar concluídas (além da anterior na ordem). */
  prereqStageIds?: string[];
  /** Entra no nivelamento? */
  placement: boolean;
  /** Degrau testado no nivelamento (padrão: recognize). */
  placementStep?: Step;
}

export interface Track {
  id: TrackId;
  title: string;
  stages: Stage[];
}

export interface Content {
  tracks: Record<TrackId, Track>;
  stages: Record<string, Stage>;
  items: Record<string, Item>;
}

// ---------------- Estado derivado ----------------

export type SkillStatus =
  | 'not-started'
  | 'practicing'
  | 'mastered'
  /** Veio do nivelamento; confirmado pelas revisões. */
  | 'provisional'
  | 'reinforcement';

export type DayOutcome = 'neutral' | 'qualified' | 'failed';

export interface SkillState {
  skillId: string;
  itemId: string;
  step: Step;
  status: SkillStatus;
  /** Dias qualificados consecutivos (sem reprovado entre eles) desde o último reset. */
  qualifiedDays: string[];
  /** Estatísticas do dia corrente (tentativas que contam). */
  currentDay: { key: string; trials: number; errors: number } | null;
  /** Variantes com acerto em tentativas que contam. */
  variantsCorrect: string[];
  /** Caixa Leitner (1..n) quando dominada/provisória. */
  box: number | null;
  nextReviewAt: number | null;
  /** Errou a última revisão; aguarda segunda checagem. */
  pendingRecheck: boolean;
  masteredAt: number | null;
  reinforcementSince: number | null;
  totalTrials: number;
  totalCorrect: number;
  lastTrialAt: number | null;
}

export type ItemStatus = 'not-started' | 'practicing' | 'mastered' | 'reinforcement' | 'stuck';

export interface ItemState {
  itemId: string;
  status: ItemStatus;
  /** Todos os gating steps alcançaram domínio (mesmo que um esteja em reforço). */
  reachedMastery: boolean;
  skills: SkillState[];
}

export type StageStatus = 'locked' | 'current' | 'completed';

export interface TrackState {
  trackId: TrackId;
  stageStatus: Record<string, StageStatus>;
  /** Etapa em que a criança está. null se a trilha acabou ou se o próximo desbloqueio está congelado. */
  currentStageId: string | null;
  /** A etapa atual foi concluída, mas a próxima não libera por reforço pendente. */
  frozen: boolean;
  /** Itens de etapas anteriores em reforço que congelam o avanço. */
  freezingSkillIds: string[];
  complete: boolean;
  /** Itens que recebem tentativas de alvo agora. */
  activeItemIds: string[];
  stuckItemIds: string[];
  placementDone: boolean;
}

export interface Alert {
  id: 'color-vision';
  /** Texto para o painel, em pt-BR. */
  message: string;
  evidence: Record<string, number>;
}

export interface SessionSummary {
  sessionId: string;
  trackId: TrackId;
  dayKey: string;
  startedAt: number;
  endedAt: number;
  trials: number;
  correct: number;
}

export interface DerivedState {
  skills: Record<string, SkillState>;
  items: Record<string, ItemState>;
  tracks: Record<TrackId, TrackState>;
  alerts: Alert[];
  sessions: SessionSummary[];
  /** Horas em que o estado foi derivado. */
  asOf: number;
}

// ---------------- Sessão ----------------

export type SlotKind =
  | 'warmup'
  | 'closing'
  | 'recheck'
  | 'retry'
  | 'reinforcement'
  | 'review'
  | 'cross-review'
  | 'current'
  | 'filler'
  | 'free'
  | 'easy'
  | 'placement';

/** O que a interface deve mostrar a seguir. */
export interface Slot {
  kind: SlotKind;
  trackId: TrackId;
  stageId: string;
  itemId: string;
  step: Step;
  helpLevel: HelpLevel;
  optionsCount: number;
  variantId: string;
  distractorIds: string[];
  isReview: boolean;
  isPlacement: boolean;
  /** Apresentar o item (nomear) antes de pedir resposta. */
  introduce: boolean;
}
