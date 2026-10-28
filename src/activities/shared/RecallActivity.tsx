import { useEffect, useRef, type ReactNode } from 'react';
import { audio } from '../../audio';
import type { Slot } from '../../engine/types';
import type { AnswerResult } from './ChoiceActivity';

/**
 * EVOCAR (modo com adulto): o app mostra o item e pergunta; a criança fala;
 * o adulto registra com um controle discreto. Nunca bloqueia o avanço.
 */
export function RecallActivity({ slot, node, speechKey, onAnswer }: { slot: Slot; node: ReactNode; speechKey: string; onAnswer: (r: AnswerResult) => void }): JSX.Element {
  const spoken = useRef(false);
  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    void audio.say(speechKey);
  }, [slot, speechKey]);
  const answer = (correct: boolean): void =>
    onAnswer({ chosenId: correct ? slot.itemId : null, correct, helpLevel: slot.helpLevel, optionsCount: 0 });
  return (
    <div className="activity">
      <div className="intro-card">{node}</div>
      <div className="adult-bar">
        <button className="big-btn" onClick={() => answer(true)}>{audio.textFor('adult.said')}</button>
        <button className="big-btn" onClick={() => answer(false)}>{audio.textFor('adult.notyet')}</button>
      </div>
    </div>
  );
}
