import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio';
import type { PedagogyParams } from '../../config/pedagogy';
import { NEUTRAL_PREFIX } from '../../engine/distractors';
import { isTraceStep, type Content, type Slot } from '../../engine/types';
import { ChoiceActivity, shuffle, type AnswerResult, type ChoiceOption } from '../shared/ChoiceActivity';
import { RecallActivity } from '../shared/RecallActivity';
import { NumeralTile } from './NumeralTile';
import { QuantityCard, quantityOf } from './QuantityCard';
import { TraceActivity } from './TraceActivity';

export interface NumbersProps {
  slot: Slot;
  content: Content;
  params: PedagogyParams;
  onAnswer: (r: AnswerResult) => void;
}

const QTY_VARIANTS = ['dots:line', 'apples:row', 'stars:triangle', 'ducks:scatter', 'dots:dice'];

function glyphOf(id: string, content: Content): string {
  return content.items[id]?.glyph ?? '?';
}

function randomVariant(exclude?: string): string {
  const pool = QTY_VARIANTS.filter((v) => v !== exclude);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Opções como cartões de quantidade (uma aparência diferente por cartão). */
function quantityOptions(slot: Slot, content: Content, targetVariant?: string): ChoiceOption[] {
  const list = [slot.itemId, ...slot.distractorIds].map((id) => {
    const neutral = id.startsWith(NEUTRAL_PREFIX);
    const n = neutral ? 0 : quantityOf(glyphOf(id, content));
    const v = id === slot.itemId && targetVariant ? targetVariant : randomVariant();
    const label = audio.textFor(`number.${n}`);
    return { id, label: neutral ? 'opção' : label, node: <QuantityCard n={n} variantId={v} />, ...(neutral ? { neutral: true } : { tappedSay: ['tapped.qty', { name: label }] as [string, Record<string, string>] }) };
  });
  return shuffle(list);
}

/** Opções como numerais, todos do mesmo tamanho. */
function numeralOptions(slot: Slot, content: Content): ChoiceOption[] {
  const list = [slot.itemId, ...slot.distractorIds].map((id) => {
    const neutral = id.startsWith(NEUTRAL_PREFIX);
    const g = neutral ? '?' : glyphOf(id, content);
    const label = audio.textFor(`number.${g}`);
    return { id, label: neutral ? 'opção' : label, node: <NumeralTile n={g} variantId={slot.variantId} color={neutral ? '#BDBDBD' : undefined} />, ...(neutral ? { neutral: true } : { tappedSay: ['tapped.number', { name: label }] as [string, Record<string, string>] }) };
  });
  return shuffle(list);
}

/** Escolhe a atividade a partir do Slot (etapa + degrau). */
export function NumbersActivity(p: NumbersProps): JSX.Element {
  const { slot, content } = p;
  const item = content.items[slot.itemId]!;
  const n = quantityOf(item.glyph);
  const name = audio.textFor(`number.${n}`);
  const vars = { name };

  if (isTraceStep(slot.step)) return <TraceActivity {...p} n={n} />;
  if (slot.step === 'recall') return <RecallActivity slot={slot} node={<NumeralTile n={n} />} speechKey="instr.recall.number" onAnswer={p.onAnswer} />;

  if (item.pool === 'quantity') {
    if (slot.step === 'match') return <QuantityFlash {...p} n={n} />;
    if (slot.stageId !== 'N1' && !slot.isPlacement) return <CountTogether {...p} n={n} />;
    return (
      <ChoiceActivity
        slot={slot}
        params={p.params}
        onAnswer={p.onAnswer}
        options={useQtyOptions(slot, content)}
        introNode={<QuantityCard n={n} variantId={slot.variantId} />}
        speech={{ intro: ['intro.qty', vars], instruct: [slot.isPlacement ? 'instr.placement.qty' : 'instr.qty.recognize', vars], error: [['error.qty', vars], ['error.tapNumber']], success: ['success.qty', vars] }}
      />
    );
  }

  // Numerais (N3, N5, N6, zero)
  if (slot.step === 'match') {
    return (
      <ChoiceActivity
        slot={slot}
        params={p.params}
        onAnswer={p.onAnswer}
        options={useNumOptions(slot, content)}
        model={<NumeralTile n={n} variantId={slot.variantId} />}
        introNode={<NumeralTile n={n} />}
        speech={{ intro: ['intro.number', vars], name: ['name.numeral', vars], instruct: ['instr.numeral.match'], error: [['error.number', vars], ['error.tapNumber']], success: ['success.number', vars] }}
      />
    );
  }
  if (slot.step === 'recognize-qty') {
    return (
      <ChoiceActivity
        slot={slot}
        params={p.params}
        onAnswer={p.onAnswer}
        options={useQtyOptions(slot, content)}
        model={<NumeralTile n={n} />}
        speech={{ intro: ['intro.number', vars], instruct: [n === 0 ? 'instr.zero.qty' : 'instr.numeral.qty', vars], error: [['error.qty', vars], ['error.tapNumber']], success: ['success.qty', vars] }}
      />
    );
  }
  return (
    <ChoiceActivity
      slot={slot}
      params={p.params}
      onAnswer={p.onAnswer}
      options={useNumOptions(slot, content)}
      introNode={<NumeralTile n={n} />}
      speech={{ intro: ['intro.number', vars], instruct: [slot.isPlacement ? 'instr.placement.numeral' : 'instr.numeral.recognize', vars], error: [['error.number', vars], ['error.tapNumber']], success: ['success.number', vars] }}
    />
  );
}

function useQtyOptions(slot: Slot, content: Content): ChoiceOption[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => quantityOptions(slot, content), [slot]);
}
function useNumOptions(slot: Slot, content: Content): ChoiceOption[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => numeralOptions(slot, content), [slot]);
}

/**
 * N1 PAREAR de quantidade "de relance": mostra o cartão por ~1,5 s, esconde, e a criança
 * escolhe o cartão com a mesma quantidade (com outra aparência).
 */
function QuantityFlash(p: NumbersProps & { n: number }): JSX.Element {
  const { slot, content, n } = p;
  const [shown, setShown] = useState(true);
  const options = useMemo(() => quantityOptions(slot, content, randomVariant(slot.variantId)), [slot, content]);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      await audio.say('flash.look', {}, false);
      await new Promise((r) => setTimeout(r, 1500));
      setShown(false);
    })();
  }, []);
  if (shown) {
    return (
      <div className="activity">
        <div className="intro-card"><QuantityCard n={n} variantId={slot.variantId} /></div>
      </div>
    );
  }
  return (
    <ChoiceActivity
      slot={{ ...slot, introduce: false }}
      params={p.params}
      onAnswer={p.onAnswer}
      options={options}
      model={<div className="hidden-card">?</div>}
      speech={{ instruct: ['instr.flash'], error: [['error.qty', { name: audio.textFor(`number.${n}`) }], ['error.tapNumber']], success: ['success.qty', { name: audio.textFor(`number.${n}`) }] }}
    />
  );
}

/**
 * N2 contar com correspondência um a um: a criança toca cada objeto (acende, o narrador conta);
 * depois "Tem três! Toca no grupo que tem três." com cartões de quantidade.
 */
function CountTogether(p: NumbersProps & { n: number }): JSX.Element {
  const { slot, content, n } = p;
  const [tapped, setTapped] = useState<number[]>([]);
  const [phase, setPhase] = useState<'count' | 'choose'>('count');
  const options = useMemo(() => quantityOptions(slot, content), [slot, content]);
  const started = useRef(false);
  const vars = { name: audio.textFor(`number.${n}`) };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void audio.say('instr.count.start');
  }, []);
  const tap = (i: number): void => {
    if (phase !== 'count' || tapped.includes(i)) return;
    const next = [...tapped, i];
    setTapped(next);
    void (async () => {
      // O número é falado até o fim; no último, ainda uma pausa antes de trocar de tela,
      // para a criança ouvir a contagem completa.
      await audio.say(`number.${next.length}`, {}, false);
      if (next.length >= n) {
        await new Promise((r) => setTimeout(r, 700));
        setPhase('choose');
      }
    })();
  };
  if (phase === 'count') {
    return (
      <div className="activity">
        <div className="intro-card count-card"><QuantityCard n={n} variantId={slot.variantId} highlight={tapped} onTapObject={tap} /></div>
      </div>
    );
  }
  return (
    <ChoiceActivity
      slot={{ ...slot, introduce: false }}
      params={p.params}
      onAnswer={p.onAnswer}
      options={options}
      speech={{ instruct: ['instr.count.how', vars], error: [['error.qty', vars], ['error.tapNumber']], success: ['success.qty', vars] }}
    />
  );
}
