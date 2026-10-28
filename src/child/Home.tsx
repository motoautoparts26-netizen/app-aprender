import { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { audio } from '../audio';
import { Island } from '../content/svg/Island';
import { sessionsOnDay } from '../engine/state';
import type { TrackId } from '../engine/types';
import { ParentGateButton } from '../parent/ParentGate';
import { ReplayButton } from '../activities/shared/ReplayButton';
import { Lulu } from '../content/svg/Lulu';
import { Estrelinhas, useNoiteTheme } from './noite';

const ORDER: TrackId[] = ['colors', 'letters', 'numbers'];

/** Tela inicial: ilhas grandes e ilustradas (seção 9). Nenhum texto é necessário para usar. */
export function Home(): JSX.Element {
  const { content, settings, derived, now, goto } = useApp();
  const tracks = ORDER.filter((t) => content.tracks[t]);
  // dailyLimit 0 = sem limite (só para testes)
  const limitReached = settings.dailyLimit > 0 && sessionsOnDay(derived, now()) >= settings.dailyLimit;

  useNoiteTheme();
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return; // React em desenvolvimento roda o efeito duas vezes
    greeted.current = true;
    void audio.sayAll([['home.greet'], ['home.pick']]);
  }, []);

  const pick = (t: TrackId): void => {
    if (limitReached) return goto('limit');
    goto('session', { trackId: t });
  };

  return (
    <div className="screen noite">
      <Estrelinhas />
      <ParentGateButton />
      <div className="noite-lulu-home"><Lulu humor="normal" size={84} galho /></div>
      <div className="islands">
        {tracks.map((t) => {
          const ts = derived.tracks[t];
          const sleepy = ts.complete || limitReached;
          return (
            <button
              key={t}
              className={`big-btn island-btn${sleepy ? ' sleepy' : ''}`}
              onClick={() => pick(t)}
              onPointerEnter={() => void audio.say(`track.${t}`, {}, false)}
              aria-label={content.tracks[t].title}
            >
              <Island track={t} size={180} />
              <span className="island-title">{content.tracks[t].title}</span>
            </button>
          );
        })}
      </div>
      <ReplayButton noite />
    </div>
  );
}
