import { useMemo } from 'react';
import { audio } from '../../audio';
import type { PedagogyParams } from '../../config/pedagogy';
import { ColorShape } from '../../content/svg/ColorShape';
import type { Content, Slot } from '../../engine/types';
import { ChoiceActivity, type AnswerResult } from '../shared/ChoiceActivity';
import { buildColorOptions, type OptionVisual } from './visuals';

export type { AnswerResult } from '../shared/ChoiceActivity';

interface Props {
  slot: Slot;
  content: Content;
  params: PedagogyParams;
  onAnswer: (r: AnswerResult) => void;
}

function Shape({ v }: { v: OptionVisual }): JSX.Element {
  return <ColorShape shape={v.shape} fill={v.hex} neutral={v.neutral} {...(v.outline ? { stroke: v.outline } : {})} />;
}

/**
 * PAREAR e RECONHECER de cores sobre a atividade genérica.
 * PAREAR: modelo sozinho + "Este é o amarelo." → opções + "Toca na cor igual a esta."
 * RECONHECER: opções de formas variadas + "Toca no amarelo."
 */
export function ColorActivity({ slot, content, params, onAnswer }: Props): JSX.Element {
  const step = slot.step === 'match' ? 'match' : 'recognize';
  const { model, options } = useMemo(
    () => buildColorOptions(slot.itemId, slot.variantId, slot.distractorIds, step, content),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot],
  );
  const name = audio.textFor(content.items[slot.itemId]?.speechKey ?? '');
  const vars = { name };
  const labelOf = (o: OptionVisual): string => (o.neutral ? 'opção' : audio.textFor(content.items[o.id]?.speechKey ?? ''));

  return (
    <ChoiceActivity
      slot={slot}
      params={params}
      onAnswer={onAnswer}
      options={options.map((o) => ({
        id: o.id,
        label: labelOf(o),
        node: <Shape v={o} />,
        ...(o.neutral ? { neutral: true } : { tappedSay: ['tapped.color', { name: labelOf(o) }] as [string, Record<string, string>] }),
      }))}
      {...(step === 'match' ? { model: <Shape v={model} /> } : { introNode: <Shape v={model} /> })}
      speech={{
        intro: ['intro.color', vars],
        ...(step === 'match' ? { name: ['name.color', vars] as [string, Record<string, string>] } : {}),
        instruct: [step === 'match' ? 'instr.match.color' : slot.isPlacement ? 'instr.placement' : 'instr.recognize.color', vars],
        error: [['error.color', vars], ['error.tapCorrect']],
        success: ['success.color', vars],
      }}
    />
  );
}
