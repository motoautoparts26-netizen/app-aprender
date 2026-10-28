import { useEffect, useState } from 'react';
import { audio } from '../../audio';

/** Legenda do que o narrador está dizendo (só no modo de teste; a criança nunca depende de texto). */
export function Caption(): JSX.Element | null {
  const [text, setText] = useState<string | null>(null);
  const [last, setLast] = useState<string>('');
  useEffect(
    () =>
      audio.onCaption((t) => {
        setText(t);
        if (t) setLast(t);
      }),
    [],
  );
  if (!last) return null;
  return (
    <div className={`caption${text ? ' live' : ''}`} aria-live="polite">
      {text ? '🔊 ' : ''}{last}
    </div>
  );
}
