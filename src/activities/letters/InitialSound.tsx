import { useMemo, useState } from 'react';
import { audio } from '../../audio';
import { L6_WORDS } from '../../content/letters';
import { WordPicture } from '../../content/svg/WordPicture';
import { NEUTRAL_PREFIX } from '../../engine/distractors';
import type { Content } from '../../engine/types';
import { ChoiceActivity, shuffle, type ChoiceOption } from '../shared/ChoiceActivity';
import { LetterTile, randomInk } from './LetterTile';
import type { LettersProps } from './LetterActivities';

function glyphOf(id: string, content: Content): string {
  return content.items[id]?.glyph ?? '?';
}

/**
 * Caixa surpresa das iniciais (L6, RECONHECER): a caixa abre, sai a figura, o narrador diz a
 * palavra; a criança toca a LETRA inicial entre 4 letras.
 */
export function SurpriseBox(p: LettersProps): JSX.Element {
  const { slot, content } = p;
  const glyph = glyphOf(slot.itemId, content);
  const word = slot.variantId;
  const [open, setOpen] = useState(false);
  const vars = { name: audio.textFor(`letter.${glyph}`), word };
  const options = useMemo<ChoiceOption[]>(() => {
    const ink = randomInk();
    return shuffle(
      [slot.itemId, ...slot.distractorIds].map((id) => {
        const neutral = id.startsWith(NEUTRAL_PREFIX);
        const g = neutral ? '?' : glyphOf(id, content);
        const label = audio.textFor(`letter.${g}`);
        return { id, label: neutral ? 'opção' : label, node: <LetterTile letter={g} color={neutral ? '#BDBDBD' : ink} scale="0.9" />, ...(neutral ? { neutral: true } : { tappedSay: ['tapped.letter', { name: label }] as [string, Record<string, string>] }) };
      }),
    );
  }, [slot, content]);

  // A caixa abre logo que a atividade aparece.
  if (!open) window.setTimeout(() => setOpen(true), 350);

  return (
    <ChoiceActivity
      slot={slot}
      params={p.params}
      onAnswer={p.onAnswer}
      options={options}
      model={
        <div className={`surprise${open ? ' open' : ''}`}>
          <div className="box-lid" />
          <div className="box-body" />
          <div className="box-pic"><WordPicture word={word} /></div>
        </div>
      }
      introNode={<LetterTile letter={glyph} />}
      speech={{ intro: ['intro.letter', vars], instruct: ['instr.box', vars], error: [['error.letter', vars], ['error.tapLetter']], success: ['success.letter', vars] }}
    />
  );
}

/**
 * Cadê o meu par (L6, RECONHECER): aparece a letra; a criança toca a FIGURA cuja palavra começa com ela.
 */
export function FindPair(p: LettersProps): JSX.Element {
  const { slot, content } = p;
  const glyph = glyphOf(slot.itemId, content);
  const word = slot.variantId;
  const vars = { name: audio.textFor(`letter.${glyph}`), word };
  const options = useMemo<ChoiceOption[]>(() => {
    const pics: ChoiceOption[] = [{ id: slot.itemId, label: word, node: <WordPicture word={word} />, tappedSay: ['tapped.word', { word }] }];
    for (const id of slot.distractorIds) {
      if (id.startsWith(NEUTRAL_PREFIX)) continue;
      const g = glyphOf(id, content);
      const words = L6_WORDS[g] ?? content.items[id]?.variants ?? [];
      const w = words[Math.floor(Math.random() * words.length)] ?? g;
      pics.push({ id, label: w, node: <WordPicture word={w} />, tappedSay: ['tapped.word', { word: w }] });
    }
    return shuffle(pics);
  }, [slot, content, word]);

  return (
    <ChoiceActivity
      slot={slot}
      params={p.params}
      onAnswer={p.onAnswer}
      options={options}
      model={<LetterTile letter={glyph} />}
      speech={{ intro: ['intro.letter', vars], instruct: ['instr.pair', vars], error: [['error.pair', vars], ['error.tapLetter']], success: ['success.word', vars] }}
    />
  );
}
