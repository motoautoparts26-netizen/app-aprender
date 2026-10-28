import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio';
import { PRAISE_KEYS } from '../../content/speech';
import { skillId } from '../../engine/skills';
import type { Content, DerivedState, HelpLevel, Slot } from '../../engine/types';
import { shuffle, wait, type AnswerResult } from '../shared/ChoiceActivity';
import { useIdle } from '../shared/useIdle';
import { LetterTile, randomInk } from './LetterTile';
import type { LettersProps } from './LetterActivities';

/**
 * Detetive do nome (seção 12.2): o nome em casinhas; a criança preenche da esquerda para a direita
 * tocando nas letras (as do nome + distratores, ≥ 4 na tela). Cada casinha é uma tentativa PAREAR
 * daquela letra. Com modelo pontilhado enquanto alguma letra não está dominada; sem modelo depois
 * (aí as tentativas são brincadeira: letras dominadas ignoram tentativas comuns).
 */
export interface NameCandidate {
  /** Nome como é falado (ex.: "Teste"). */
  name: string;
  /** Letras únicas, maiúsculas, sem acento (ex.: T, E, S). */
  letters: string[];
}

export function NameDetective(p: LettersProps & { glyph: string; candidates: NameCandidate[] }): JSX.Element {
  const { slot, content, params } = p;
  const candidate = useMemo(() => {
    // Prefere um nome que contenha a letra-alvo; o da criança vem primeiro.
    const withGlyph = p.candidates.filter((c) => c.letters.includes(p.glyph));
    return withGlyph[Math.floor(Math.random() * withGlyph.length)] ?? p.candidates[0] ?? { name: p.glyph, letters: [p.glyph] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);
  const word = candidate.letters;
  const letterItem = (g: string): string | undefined => Object.values(content.items).find((it) => it.trackId === 'letters' && it.pool === 'letter' && it.glyph === g && it.id === g)?.id;
  const allMastered = word.every((g) => {
    const id = letterItem(g);
    return id && (p.derived.skills[skillId(id, 'match')]?.status === 'mastered' || p.derived.skills[skillId(id, 'match')]?.status === 'provisional');
  });
  const showModel = !allMastered;

  const tiles = useMemo(() => {
    const ids = new Set<string>();
    for (const g of word) {
      const id = letterItem(g);
      if (id) ids.add(id);
    }
    for (const d of slot.distractorIds) if (!d.startsWith('neutral-')) ids.add(d);
    const list = [...ids].map((id) => ({ id, glyph: content.items[id]!.glyph, color: randomInk() }));
    return shuffle(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, slot]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'instruct' | 'answer' | 'ok' | 'wrong' | 'done'>('instruct');
  const [help, setHelp] = useState<HelpLevel>(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);

  // O narrador fala o nome de verdade; as casinhas usam as letras únicas (regra da L1).
  const wordText = candidate.name;
  const targetGlyph = word[index] ?? '';
  const targetId = letterItem(targetGlyph) ?? slot.itemId;
  const vars = { word: wordText, name: audio.textFor(`letter.${targetGlyph}`) };

  const spoken = useRef<string>('');
  useEffect(() => {
    if (phase !== 'instruct') return;
    const key = `${index}`;
    if (spoken.current === key) return;
    spoken.current = key;
    void (async () => {
      if (index === 0) await audio.say(showModel ? 'instr.detective' : 'instr.detective.free', vars);
      else await audio.say('instr.detective.next');
      if (alive.current) setPhase('answer');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  useIdle(phase === 'answer' || phase === 'wrong', params.IDLE_REPEAT_SECONDS, (n) => {
    if (n === 1) void audio.replay();
    else if (n >= 2) {
      setHelp(n === 2 ? 1 : 2);
      void audio.replay();
    }
  }, `${index}-${wordText}`);

  // As letras continuam na tela depois de usadas: cada casinha precisa de ≥ 4 opções para contar (seção 6).
  const optionsCount = tiles.length;

  const report = (correct: boolean, chosenId: string | null): void => {
    const r: AnswerResult = { chosenId, correct, helpLevel: help, optionsCount };
    // A letra do Slot responde ao motor; as demais entram como tentativas extras.
    if (targetId === slot.itemId && !reportedSlot.current) {
      reportedSlot.current = true;
      pendingSlotResult.current = r;
    } else {
      p.onExtraTrial(targetId, r);
    }
  };
  const reportedSlot = useRef(false);
  const pendingSlotResult = useRef<AnswerResult | null>(null);

  async function tap(i: number): Promise<void> {
    const tile = tiles[i]!;
    if (phase !== 'answer' && phase !== 'wrong') return;
    const firstTap = phase === 'answer';
    if (firstTap) setChosen(tile.id);
    if (tile.glyph === targetGlyph) {
      setPhase('ok');
      // A tentativa é o primeiro toque: acerto se foi direto, erro se antes tocou outra letra.
      report(firstTap, firstTap ? tile.id : chosen);
      const t0 = Date.now();
      await audio.say('success.letter', { name: audio.textFor(`letter.${tile.glyph}`) }, false);
      await wait(Math.max(0, 700 - (Date.now() - t0)) + 200);
      if (alive.current) advance(i);
    } else {
      // Erro: só o nome da letra tocada; a criança continua procurando.
      setPhase('wrong');
      void audio.say('tapped.letter', { name: audio.textFor(`letter.${tile.glyph}`) }, false);
    }
  }

  function advance(_tileIndex: number): void {
    setHelp(0);
    setChosen(null);
    if (index + 1 >= word.length) {
      setPhase('done');
      void audio.say('detective.done', vars, false);
      window.setTimeout(() => {
        if (!alive.current) return;
        // Se a letra do Slot não apareceu no nome, responde ao motor com acerto nulo? Não: ela sempre aparece (escolhemos nomes que a contêm).
        p.onAnswer(pendingSlotResult.current ?? { chosenId: slot.itemId, correct: true, helpLevel: 0, optionsCount });
      }, 1200);
    } else {
      setIndex(index + 1);
      setPhase('instruct');
    }
  }

  return (
    <div className="activity">
      <div className="word-build">
        {showModel && (
          <div className="word-row model-row">
            {word.map((ch, i) => <LetterTile key={i} letter={ch} dotted scale="0.5" />)}
          </div>
        )}
        <div className="word-row houses">
          {word.map((ch, i) => (
            <span key={i} className={`house${i < index || phase === 'done' ? ' filled' : i === index ? ' empty active' : ''}`}>
              {i < index || phase === 'done' ? <LetterTile letter={ch} scale="0.5" /> : ''}
            </span>
          ))}
        </div>
      </div>
      {phase !== 'done' && (
        <div className={`options n${Math.min(4, Math.max(2, optionsCount))} appear`}>
          {tiles.map((t, i) => {
            const isTarget = t.glyph === targetGlyph;
            const cls = ['option'];
            if (phase === 'ok' && isTarget) cls.push('correct');
            if ((phase === 'answer' || phase === 'wrong') && help >= 2 && isTarget) cls.push('hint');
            return (
              <button key={t.id} className={cls.join(' ')} disabled={phase === 'instruct'} onClick={() => void tap(i)} aria-label={audio.textFor(`letter.${t.glyph}`)} {...(import.meta.env.DEV && isTarget ? { 'data-target': true } : {})}>
                <LetterTile letter={t.glyph} color={t.color} scale="0.9" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type { Content, DerivedState };
