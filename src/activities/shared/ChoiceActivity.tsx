import { useEffect, useRef, useState, type ReactNode } from 'react';
import { audio } from '../../audio';
import type { PedagogyParams } from '../../config/pedagogy';
import { PRAISE_KEYS } from '../../content/speech';
import type { HelpLevel, Slot } from '../../engine/types';
import { useIdle } from './useIdle';

export interface AnswerResult {
  chosenId: string | null;
  correct: boolean;
  helpLevel: HelpLevel;
  optionsCount: number;
}

export interface ChoiceOption {
  id: string;
  label: string;
  node: ReactNode;
  neutral?: boolean;
  /** O que o narrador diz quando esta opção é tocada por engano ("Essa é a letra ene."). */
  tappedSay?: Say;
}

export interface RenderedOption {
  opt: ChoiceOption;
  isTarget: boolean;
  className: string;
  disabled: boolean;
  onTap: () => void;
  hidden: boolean;
}

export type Say = [key: string, vars?: Record<string, string>];

export interface ChoiceActivityProps {
  slot: Slot;
  params: PedagogyParams;
  onAnswer: (r: AnswerResult) => void;
  /** Opções já embaralhadas. A que tem id === slot.itemId é o alvo. */
  options: ChoiceOption[];
  /** Modelo no alto (PAREAR). */
  model?: ReactNode;
  /** Cartão grande da apresentação de item novo (padrão: o modelo). */
  introNode?: ReactNode;
  speech: {
    /** Apresentação do item novo. */
    intro?: Say;
    /** Nomeação do modelo sozinho, antes de abrir as opções (PAREAR). */
    name?: Say;
    instruct: Say;
    /** Falas após o erro, em sequência (não usadas no fluxo atual: o erro só nomeia o tocado). */
    error: Say[];
    /** Confirmação no acerto, com o nome do item ("Isso mesmo! Esta é a letra eme!"). Sem ela, elogio sorteado. */
    success?: Say;
  };
  /** Layout próprio para as opções (ex.: trem). Padrão: grade. */
  renderOptions?: (items: RenderedOption[]) => ReactNode;
  /** Chamado em todo toque válido, antes do feedback (ex.: mover o trem). */
  onTap?: (id: string, correct: boolean) => void;
  /** Atraso extra antes de concluir um acerto (ex.: o trem chegando). */
  successDelayMs?: number;
  /** Conteúdo extra abaixo das opções. */
  footer?: ReactNode;
}

type Phase = 'intro' | 'name' | 'instruct' | 'answer' | 'ok' | 'wrong';

/**
 * Atividade genérica de escolha entre opções (seções 7 e 10):
 * (apresentação) → (modelo sozinho + nomeação) → instrução → resposta →
 * acerto (elogio 1 s) ou erro (a certa brilha, o narrador nomeia, a criança toca nela).
 * Nunca diz "errado". Toques durante a instrução são ignorados.
 * Inatividade: repete → esconde um distrator (ajuda 1) → a certa pulsa (ajuda 2).
 */
export function ChoiceActivity(p: ChoiceActivityProps): JSX.Element {
  const { slot, params, options, speech } = p;
  const initial: Phase = slot.introduce && speech.intro ? 'intro' : speech.name ? 'name' : 'instruct';
  const [phase, setPhase] = useState<Phase>(initial);
  const [help, setHelp] = useState<HelpLevel>(slot.helpLevel);
  const [hidden, setHidden] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);

  // Cada fase fala uma única vez por tentativa, mesmo que o React rode o efeito duas vezes
  // (modo de desenvolvimento) ou que a síntese demore a cancelar a fala anterior.
  // Em desenvolvimento o React executa o efeito duas vezes: a primeira execução fala e segue
  // até o fim; a segunda é pulada. Só a desmontagem (alive) interrompe a sequência.
  const spoken = useRef<string>('');
  useEffect(() => {
    if (spoken.current === phase) return;
    spoken.current = phase;
    void (async () => {
      if (phase === 'intro' && speech.intro) {
        await audio.say(speech.intro[0], speech.intro[1] ?? {}, false);
        await wait(500);
        if (alive.current) setPhase(speech.name ? 'name' : 'instruct');
        return;
      }
      if (phase === 'name' && speech.name) {
        await audio.say(speech.name[0], speech.name[1] ?? {}, false);
        await wait(700);
        if (alive.current) setPhase('instruct');
        return;
      }
      if (phase === 'instruct') {
        await audio.say(speech.instruct[0], speech.instruct[1] ?? {});
        if (alive.current) setPhase('answer');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'intro', phase === 'name', phase === 'instruct']);

  function hideOne(): void {
    if (options.length <= 2) return;
    const d = options.find((o) => o.id !== slot.itemId && !o.neutral) ?? options.find((o) => o.id !== slot.itemId);
    if (d) setHidden(d.id);
  }

  useIdle(phase === 'answer' || phase === 'wrong', params.IDLE_REPEAT_SECONDS, (n) => {
    if (n === 1) void audio.replay();
    else if (n === 2) {
      setHelp((h) => (h < 1 ? 1 : h));
      if (!hidden) hideOne();
      void audio.replay();
    } else if (n === 3) {
      setHelp(2);
      void audio.replay();
    }
  }, slot);

  const visibleCount = options.filter((o) => o.id !== hidden).length;

  async function tap(opt: ChoiceOption): Promise<void> {
    if (phase !== 'answer' && phase !== 'wrong') return;
    const correct = opt.id === slot.itemId;
    // A tentativa é o PRIMEIRO toque; os seguintes são a criança procurando.
    const firstTap = phase === 'answer';
    if (firstTap) setChosen(opt.id);
    p.onTap?.(opt.id, correct);
    if (correct) {
      setPhase('ok');
      // Confirmação com o nome do item (ou elogio sorteado) toca até o fim; a próxima tentativa só vem depois.
      const t0 = Date.now();
      if (speech.success) await audio.say(speech.success[0], speech.success[1] ?? {}, false);
      else await audio.say(PRAISE_KEYS[Math.floor(Math.random() * PRAISE_KEYS.length)]!, {}, false);
      await wait(Math.max(0, 1000 + (p.successDelayMs ?? 0) - (Date.now() - t0)) + 250);
      if (alive.current) {
        p.onAnswer(firstTap
          ? { chosenId: opt.id, correct: true, helpLevel: help, optionsCount: visibleCount }
          : { chosenId: chosen, correct: false, helpLevel: help, optionsCount: visibleCount });
      }
    } else {
      // Erro: só o nome do que foi tocado. Nada de "errado", nada de apontar a certa:
      // a criança continua procurando (a inatividade traz as ajudas, como sempre).
      setPhase('wrong');
      if (opt.tappedSay) void audio.say(opt.tappedSay[0], opt.tappedSay[1] ?? {}, false);
    }
  }

  if (phase === 'intro') {
    return <div className="activity"><div className="intro-card">{p.introNode ?? p.model}</div></div>;
  }

  const items: RenderedOption[] = options.map((opt) => {
    const isTarget = opt.id === slot.itemId;
    const cls = ['option'];
    const isHidden = opt.id === hidden;
    if (isHidden) cls.push('hidden');
    if (phase === 'ok' && isTarget) cls.push('correct');
    if ((phase === 'answer' || phase === 'wrong') && help >= 2 && isTarget) cls.push('hint');
    return { opt, isTarget, className: cls.join(' '), disabled: phase === 'instruct', onTap: () => void tap(opt), hidden: isHidden };
  });

  const gridClass = `options n${Math.min(4, Math.max(2, visibleCount))} appear`;

  return (
    <div className="activity">
      {p.model !== undefined && <div className="model">{p.model}</div>}
      {phase !== 'name' &&
        (p.renderOptions ? (
          p.renderOptions(items)
        ) : (
          <div className={gridClass}>
            {items.map((it) => (
              <OptionButton key={it.opt.id} it={it} />
            ))}
          </div>
        ))}
      {phase !== 'name' && p.footer}
    </div>
  );
}

export function OptionButton({ it, className }: { it: RenderedOption; className?: string }): JSX.Element {
  return (
    <button
      className={`${it.className}${className ? ` ${className}` : ''}`}
      onClick={it.onTap}
      disabled={it.disabled}
      aria-label={it.opt.label}
      {...(import.meta.env.DEV && it.isTarget ? { 'data-target': true } : {})}
    >
      {it.opt.node}
    </button>
  );
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
