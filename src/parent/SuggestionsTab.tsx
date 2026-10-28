import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { OFFSCREEN, weeklySuggestion } from '../content/offscreen';
import { ColorShape } from '../content/svg/ColorShape';
import type { TrackId } from '../engine/types';
import { addOffscreen, listOffscreen } from '../storage/repo';
import type { OffscreenRecord } from '../storage/db';

const TRACK_PT: Record<TrackId, string> = { colors: 'Cores', letters: 'Letras', numbers: 'Números' };

/** Sugestões fora da tela: a da semana em destaque por trilha, com "Fizemos!" (só registra). */
export function SuggestionsTab(): JSX.Element {
  const { content, derived, profile, now } = useApp();
  const [done, setDone] = useState<OffscreenRecord[]>([]);
  const refresh = async (): Promise<void> => {
    if (profile) setDone(await listOffscreen(profile.id));
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const tracks = (['colors', 'letters', 'numbers'] as TrackId[]).filter((t) => content.tracks[t]);

  return (
    <>
      <p className="muted">Atividades de 5 minutos, com coisas de casa, ligadas à etapa atual. "Fizemos!" só registra: nunca interfere no avanço.</p>
      {tracks.map((t) => {
        const ts = derived.tracks[t];
        const stageId = ts.currentStageId ?? content.tracks[t].stages[content.tracks[t].stages.length - 1]!.id;
        const week = weeklySuggestion(stageId, now());
        const all = OFFSCREEN[stageId] ?? [];
        const doneHere = done.filter((d) => d.stageId === stageId);
        return (
          <div className="card" key={t}>
            <h2>{TRACK_PT[t]} · etapa {stageId}{ts.complete ? ' (concluída)' : ''}</h2>
            {week && (
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span style={{ width: 56, height: 56, flex: '0 0 auto' }}><ColorShape shape={week.suggestion.icon.shape} fill={week.suggestion.icon.fill} /></span>
                <div style={{ flex: 1 }}>
                  <strong>Sugestão da semana: {week.suggestion.title}</strong>
                  <p style={{ margin: '4px 0' }}>{week.suggestion.text}</p>
                  <button
                    className="btn primary"
                    onClick={() => profile && void addOffscreen({ profileId: profile.id, stageId, suggestionIndex: week.index, doneAt: now() }).then(refresh)}
                  >
                    Fizemos!
                  </button>
                  <span className="muted" style={{ marginLeft: 8 }}>{doneHere.filter((d) => d.suggestionIndex === week.index).length}× nesta etapa</span>
                </div>
              </div>
            )}
            <details style={{ marginTop: 8 }}>
              <summary className="muted">Outras ideias desta etapa ({all.length})</summary>
              <ul>
                {all.map((s, i) => (
                  <li key={i}><strong>{s.title}:</strong> {s.text}</li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </>
  );
}
