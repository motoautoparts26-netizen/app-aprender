import { useEffect, useState } from 'react';
import { audio } from '../../audio';

/** Botão grande de "ouvir de novo", sempre presente nas telas da criança (seção 13). */
/** `noite`: amarelo com ícone escuro, só nas telas com tema noite. */
export function ReplayButton({ noite = false }: { noite?: boolean }): JSX.Element {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => audio.onSpeaking(setSpeaking), []);
  const ink = noite ? '#131A3B' : '#fff';
  return (
    <button
      className={`big-btn round-btn replay${noite ? ' noite' : ''}${speaking ? ' speaking' : ''}`}
      onClick={() => void audio.replay()}
      aria-label="Ouvir de novo"
    >
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10v4h4l5 4V6L8 10H4z" fill={ink} />
        <path d="M16 9c1.3 1.5 1.3 4.5 0 6M18.5 6.5c2.6 3 2.6 8 0 11" />
      </svg>
    </button>
  );
}
