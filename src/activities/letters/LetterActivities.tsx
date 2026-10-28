import { useMemo, useState } from 'react';
import { audio } from '../../audio';
import type { PedagogyParams } from '../../config/pedagogy';
import { lettersFromName, WORD_BANK, wordsFor } from '../../content/letters';
import { NEUTRAL_PREFIX } from '../../engine/distractors';
import type { Content, DerivedState, Slot, Trial } from '../../engine/types';
import { ChoiceActivity, OptionButton, shuffle, type AnswerResult, type ChoiceOption, type RenderedOption } from '../shared/ChoiceActivity';
import { RecallActivity } from '../shared/RecallActivity';
import { LetterTile, parseLetterVariant, randomInk, WordWithLetter } from './LetterTile';
import { NameDetective } from './NameDetective';
import { FindPair, SurpriseBox } from './InitialSound';

export interface LettersProps {
  slot: Slot;
  content: Content;
  params: PedagogyParams;
  derived: DerivedState;
  childName: string;
  familyNames: string[];
  onAnswer: (r: AnswerResult) => void;
  /** Tentativas adicionais de atividades compostas (uma por letra). */
  onExtraTrial: (itemId: string, r: AnswerResult) => void;
  /** Modo livre/prévia: força uma "roupa" específica, ignorando sorteio e pré-condições. */
  force?: 'plain' | 'train' | 'word' | 'detective' | 'box' | 'pair';
}

function glyphOf(id: string, content: Content): string {
  return content.items[id]?.glyph ?? '?';
}

/** Letras já apresentadas à criança (alguma tentativa) ou dominadas: o que pode entrar numa palavra. */
export function presentedLetters(content: Content, derived: DerivedState): Set<string> {
  const set = new Set<string>();
  for (const it of Object.values(content.items)) {
    if (it.trackId !== 'letters' || it.pool !== 'letter') continue;
    const st = derived.items[it.id];
    if (st && (st.reachedMastery || st.skills.some((s) => s.totalTrials > 0))) set.add(it.glyph);
  }
  return set;
}

function letterOptions(slot: Slot, content: Content): ChoiceOption[] {
  const target = parseLetterVariant(slot.variantId);
  // Todas as opções com o mesmo tamanho: a variante (tamanho) vale para a tela toda, nunca só para o alvo,
  // senão o tamanho denunciaria a resposta.
  const all = [slot.itemId, ...slot.distractorIds].map((id) => {
    const neutral = id.startsWith(NEUTRAL_PREFIX);
    const glyph = neutral ? '?' : glyphOf(id, content);
    const color = id === slot.itemId ? target.color : randomInk();
    const label = audio.textFor(`letter.${glyph}`);
    return {
      id,
      label: neutral ? 'opção' : label,
      node: <LetterTile letter={glyph} color={neutral ? '#BDBDBD' : color} scale={target.scale} />,
      ...(neutral ? { neutral: true } : { tappedSay: ['tapped.letter', { name: label }] as [string, Record<string, string>] }),
    };
  });
  return shuffle(all);
}

/** Escolhe a "roupa" da atividade a partir do Slot. O motor não sabe disso. */
export function LettersActivity(p: LettersProps): JSX.Element {
  const { slot, content } = p;
  const stage = content.stages[slot.stageId];
  const glyph = glyphOf(slot.itemId, content);
  const name = audio.textFor(`letter.${glyph}`);
  const vars = { name };
  const options = useMemo(() => letterOptions(slot, content), [slot, content]);
  // Sorteio estável por slot, para variar a atividade sem trocar no meio.
  const roll = useMemo(() => Math.random(), [slot]);

  if (slot.step === 'recall') {
    return <RecallActivity slot={slot} node={<LetterTile letter={glyph} />} speechKey="instr.recall.letter" onAnswer={p.onAnswer} />;
  }

  if (slot.step === 'match') {
    const allowed = p.force ? new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ') : presentedLetters(content, p.derived);
    const names = [p.childName, ...p.familyNames]
      .map((n) => ({ name: n.trim().split(/\s+/)[0] ?? n, letters: lettersFromName(n) }))
      .filter((c) => c.letters.length >= 2);
    if (p.force === 'detective' && names.length > 0) return <NameDetective {...p} glyph={glyph} candidates={names} />;
    if (!p.force && slot.stageId === 'L1' && !slot.isPlacement && !slot.introduce && roll < 0.6) {
      const nameLetters = lettersFromName(p.childName);
      if (nameLetters.includes(glyph) && nameLetters.every((l) => allowed.has(l))) {
        return <NameDetective {...p} glyph={glyph} candidates={names} />;
      }
    }
    const order = stage?.order ?? 0;
    const words = p.force === 'word' || (!p.force && order >= 3 && !slot.isPlacement && !slot.introduce) ? wordsFor(glyph, allowed) : [];
    if (words.length > 0 && (p.force === 'word' || roll < 0.6)) {
      return <WordBuild {...p} glyph={glyph} word={words[Math.floor(Math.random() * words.length)]!} options={options} />;
    }
    const v = parseLetterVariant(slot.variantId);
    const inWordWord = v.inWord ? WORD_BANK.find((w) => w.includes(glyph) && [...w].every((c) => allowed.has(c))) : undefined;
    const model = inWordWord ? <WordWithLetter word={inWordWord} letter={glyph} color={v.color} /> : <LetterTile letter={glyph} color={v.color} scale={v.scale} />;
    return (
      <ChoiceActivity
        slot={slot}
        params={p.params}
        onAnswer={p.onAnswer}
        options={options}
        model={model}
        introNode={<LetterTile letter={glyph} />}
        speech={{ intro: ['intro.letter', vars], name: ['name.letter', vars], instruct: ['instr.match.letter'], error: [['error.letter', vars], ['error.tapLetter']], success: ['success.letter', vars] }}
      />
    );
  }

  // L6 (letra e som inicial): caixa surpresa (letras como opções) ou cadê o meu par (figuras como opções).
  if (p.force === 'box') return <SurpriseBox {...p} />;
  if (p.force === 'pair') return <FindPair {...p} />;
  if (slot.stageId === 'L6') {
    return roll < 0.5 ? <SurpriseBox {...p} /> : <FindPair {...p} />;
  }

  // RECONHECER: trem do alfabeto (L1–L4b) ou "toca na letra".
  const train = p.force === 'train' || (!p.force && !slot.isPlacement && !slot.introduce && !stage?.allowConfusable && roll < 0.65);
  if (train) return <AlphabetTrain {...p} options={options} vars={vars} />;
  return (
    <ChoiceActivity
      slot={slot}
      params={p.params}
      onAnswer={p.onAnswer}
      options={options}
      introNode={<LetterTile letter={glyph} />}
      speech={{ intro: ['intro.letter', vars], instruct: [slot.isPlacement ? 'instr.placement.letter' : 'instr.recognize.letter', vars], error: [['error.letter', vars], ['error.tapLetter']], success: ['success.letter', vars] }}
    />
  );
}

/** Trem do alfabeto: estações = opções; o trem anda até a estação tocada. */
function AlphabetTrain(p: LettersProps & { options: ChoiceOption[]; vars: Record<string, string> }): JSX.Element {
  const [pos, setPos] = useState(-1);
  const [arrived, setArrived] = useState(false);
  const n = p.options.length;
  return (
    <ChoiceActivity
      slot={p.slot}
      params={p.params}
      onAnswer={p.onAnswer}
      options={p.options}
      speech={{ intro: ['intro.letter', p.vars], instruct: ['instr.train', p.vars], error: [['error.letter', p.vars], ['error.tapLetter']], success: ['success.letter', p.vars] }}
      onTap={(id, correct) => {
        setPos(p.options.findIndex((o) => o.id === id));
        if (correct) setArrived(true);
      }}
      successDelayMs={900}
      renderOptions={(items: RenderedOption[]) => (
        <div className="train-scene appear">
          <div className="stations" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {items.map((it) => (
              <div key={it.opt.id} className="station">
                <OptionButton it={it} className="sign" />
                <div className="post" />
              </div>
            ))}
          </div>
          <div className="rail" />
          <div className={`train${arrived ? ' arrived' : ''}`} style={{ left: pos < 0 ? '0px' : `calc(${((pos + 0.5) / n) * 100}% - 42px)` }}>
            <TrainSvg />
          </div>
        </div>
      )}
    />
  );
}

function TrainSvg(): JSX.Element {
  return (
    <svg viewBox="0 0 120 70" width="84" height="49" aria-hidden="true">
      <rect x="4" y="28" width="60" height="28" rx="6" fill="#6FA8DC" stroke="#3B6E9E" strokeWidth="3" />
      <rect x="64" y="14" width="40" height="42" rx="6" fill="#F28C8C" stroke="#B85656" strokeWidth="3" />
      <rect x="72" y="22" width="18" height="14" rx="3" fill="#E8F4FF" stroke="#3B6E9E" strokeWidth="2" />
      <rect x="14" y="4" width="14" height="24" rx="3" fill="#3B6E9E" />
      <circle cx="22" cy="60" r="8" fill="#444" stroke="#222" strokeWidth="2" />
      <circle cx="48" cy="60" r="8" fill="#444" stroke="#222" strokeWidth="2" />
      <circle cx="90" cy="60" r="8" fill="#444" stroke="#222" strokeWidth="2" />
      <circle cx="20" cy="0" r="5" fill="#D9D9D9" opacity="0.8" />
    </svg>
  );
}

/** Montar palavra copiando o modelo: uma casinha vazia (a letra-alvo); as outras já preenchidas. */
function WordBuild(p: LettersProps & { glyph: string; word: string; options: ChoiceOption[] }): JSX.Element {
  const gap = p.word.indexOf(p.glyph);
  const [filled, setFilled] = useState(false);
  const vars = { name: audio.textFor(`letter.${p.glyph}`), word: p.word.toLowerCase() };
  return (
    <ChoiceActivity
      slot={p.slot}
      params={p.params}
      onAnswer={p.onAnswer}
      options={p.options}
      model={
        <div className="word-build">
          <div className="word-row model-row">
            {[...p.word].map((ch, i) => <LetterTile key={i} letter={ch} dotted scale="0.5" />)}
          </div>
          <div className="word-row houses">
            {[...p.word].map((ch, i) => (
              <span key={i} className={`house${i === gap ? (filled ? ' filled' : ' empty') : ''}`}>
                {i === gap && !filled ? '' : <LetterTile letter={ch} scale="0.5" />}
              </span>
            ))}
          </div>
        </div>
      }
      speech={{ instruct: ['instr.word', vars], error: [['error.letter', vars], ['error.tapLetter']], success: ['success.letter', vars] }}
      onTap={(_, correct) => {
        if (correct) setFilled(true);
      }}
      successDelayMs={600}
    />
  );
}

export type { Trial };
