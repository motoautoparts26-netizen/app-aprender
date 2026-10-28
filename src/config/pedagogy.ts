/**
 * Todos os parâmetros pedagógicos do app. Nenhum número pedagógico pode
 * aparecer solto no código: se precisar de um, ele entra aqui, com comentário.
 *
 * Referências entre parênteses apontam para a seção da ESPECIFICACAO.md.
 */
export interface PedagogyParams {
  // ---- Critério de domínio (seção 6) ----
  /** Tentativas válidas mínimas num dia para o dia contar (qualificado ou reprovado). */
  MIN_TRIALS_PER_DAY: number;
  /** Erros tolerados num dia qualificado. Mais que isso, com ≥ MIN_TRIALS_PER_DAY, reprova o dia. */
  MAX_ERRORS_PER_DAY: number;
  /** Dias qualificados distintos, sem dia reprovado entre eles, para dominar. */
  MASTERY_DAYS: number;
  /** Opções mínimas na tela para a tentativa contar para o domínio. */
  MIN_OPTIONS: number;
  /** Apresentações (variantes) diferentes do item que precisam ter acerto. */
  MIN_VARIANTS: number;
  /** Traçado: tentativas mínimas por dia (não há opções nem variantes no traçado). */
  TRACE_MIN_TRIALS_PER_DAY: number;

  // ---- Conjunto ativo (seção 7) ----
  /** Itens da etapa atual que recebem tentativas de alvo ao mesmo tempo. */
  ACTIVE_SET_SIZE: number;
  /** Dias com sessão no conjunto ativo sem domínio para o item ser marcado como encalhado. */
  STUCK_ACTIVE_DAYS: number;

  // ---- Revisão espaçada (seção 8) ----
  /** Intervalo em dias de cada caixa Leitner. Depois da última caixa, repete o último intervalo. */
  REVIEW_INTERVALS_DAYS: number[];
  /** Dias qualificados para sair do reforço e voltar à caixa 1. */
  REINFORCEMENT_DAYS: number;
  /** Tentativas por sessão de uma mesma habilidade em reforço (prioridade sem tomar a sessão toda). */
  REINFORCEMENT_MAX_PER_SESSION: number;

  // ---- Montagem da sessão (seção 9) ----
  /** Tentativas por sessão (o que vier primeiro com SESSION_MAX_MINUTES). */
  SESSION_TARGET_TRIALS: number;
  /** Duração máxima da sessão em minutos. */
  SESSION_MAX_MINUTES: number;
  /** Tentativas de aquecimento no início. */
  WARMUP_TRIALS: number;
  /** Fração das vagas (fora aquecimento e fechamento) reservada a revisões vencidas. */
  REVIEW_SHARE: number;
  /** Revisões de outras trilhas por sessão, só se muito atrasadas. */
  CROSS_TRACK_REVIEWS_MAX: number;
  /** "Muito atrasada" = atraso maior que este fator × o intervalo da caixa. */
  CROSS_TRACK_OVERDUE_FACTOR: number;
  /** Itens novos apresentados por sessão. */
  NEW_ITEMS_PER_SESSION: number;
  /** Opções na tela em condição normal. */
  OPTIONS_NORMAL: number;
  /** Opções na tela no modo fácil (proteção contra frustração). */
  OPTIONS_EASY: number;
  /** Depois de um erro, o item volta entre RETRY_DELAY_MIN e RETRY_DELAY_MAX tentativas. */
  RETRY_DELAY_MIN: number;
  RETRY_DELAY_MAX: number;
  /** Depois de errar uma revisão, a segunda checagem vem entre estes limites. */
  RECHECK_DELAY_MIN: number;
  RECHECK_DELAY_MAX: number;
  /** Vezes seguidas que o mesmo item pode aparecer (3 seguidas é proibido). */
  MAX_SAME_ITEM_RUN: number;
  /** Erros seguidos que ativam o modo fácil. */
  FRUSTRATION_ERRORS: number;
  /** Acertos seguidos que desativam o modo fácil. */
  FRUSTRATION_RECOVERY_CORRECT: number;
  /** A partir desta quantidade de tentativas, acerto abaixo de EARLY_END_ACCURACY encerra a sessão. */
  EARLY_END_MIN_TRIALS: number;
  EARLY_END_ACCURACY: number;
  /** Itens fáceis antes de encerrar mais cedo. */
  EARLY_END_EASY_TRIALS: number;
  /** Segundos sem resposta antes de repetir a instrução (seção 1). */
  IDLE_REPEAT_SECONDS: number;

  // ---- Nivelamento (seção 14) ----
  PLACEMENT_ITEMS_PER_STAGE: number;
  PLACEMENT_TRIALS_PER_ITEM: number;
  /** Acerto mínimo numa etapa para ela ficar provisoriamente dominada. */
  PLACEMENT_PASS_ACCURACY: number;

  // ---- Alerta de visão de cores (seção 15) ----
  /** Erros totais mínimos antes de avaliar o padrão. */
  CVD_MIN_ERRORS: number;
  /** Dias distintos mínimos com erros. */
  CVD_MIN_DAYS: number;
  /** Fração dos erros em pares típicos que dispara o alerta. */
  CVD_PAIR_SHARE: number;

  // ---- Painel e aparelho ----
  DAILY_SESSION_LIMIT_DEFAULT: number;
  DAILY_SESSION_LIMIT_MIN: number;
  DAILY_SESSION_LIMIT_MAX: number;
  /** Velocidade da síntese de voz (1 = normal). */
  SPEECH_RATE: number;
  /** Tolerância em px ao redor do caminho do traçado. */
  TRACE_TOLERANCE_PX: number;
  /** Dias sem backup antes de lembrar. */
  BACKUP_REMINDER_DAYS: number;
}

export const DEFAULT_PEDAGOGY: PedagogyParams = {
  MIN_TRIALS_PER_DAY: 5,
  MAX_ERRORS_PER_DAY: 1,
  MASTERY_DAYS: 2,
  MIN_OPTIONS: 4,
  MIN_VARIANTS: 3,
  TRACE_MIN_TRIALS_PER_DAY: 3,

  ACTIVE_SET_SIZE: 3,
  STUCK_ACTIVE_DAYS: 5,

  REVIEW_INTERVALS_DAYS: [1, 3, 7, 14, 30],
  REINFORCEMENT_DAYS: 1,
  REINFORCEMENT_MAX_PER_SESSION: 6,

  SESSION_TARGET_TRIALS: 16,
  SESSION_MAX_MINUTES: 7,
  WARMUP_TRIALS: 2,
  REVIEW_SHARE: 0.3,
  CROSS_TRACK_REVIEWS_MAX: 2,
  CROSS_TRACK_OVERDUE_FACTOR: 2,
  NEW_ITEMS_PER_SESSION: 2,
  OPTIONS_NORMAL: 4,
  OPTIONS_EASY: 2,
  RETRY_DELAY_MIN: 2,
  RETRY_DELAY_MAX: 4,
  RECHECK_DELAY_MIN: 3,
  RECHECK_DELAY_MAX: 5,
  MAX_SAME_ITEM_RUN: 2,
  FRUSTRATION_ERRORS: 3,
  FRUSTRATION_RECOVERY_CORRECT: 2,
  EARLY_END_MIN_TRIALS: 8,
  EARLY_END_ACCURACY: 0.6,
  EARLY_END_EASY_TRIALS: 2,
  IDLE_REPEAT_SECONDS: 8,

  PLACEMENT_ITEMS_PER_STAGE: 2,
  PLACEMENT_TRIALS_PER_ITEM: 2,
  PLACEMENT_PASS_ACCURACY: 0.8,

  CVD_MIN_ERRORS: 6,
  CVD_MIN_DAYS: 2,
  CVD_PAIR_SHARE: 0.4,

  DAILY_SESSION_LIMIT_DEFAULT: 2,
  DAILY_SESSION_LIMIT_MIN: 1,
  DAILY_SESSION_LIMIT_MAX: 4,
  SPEECH_RATE: 0.9,
  TRACE_TOLERANCE_PX: 40,
  BACKUP_REMINDER_DAYS: 14,
};
