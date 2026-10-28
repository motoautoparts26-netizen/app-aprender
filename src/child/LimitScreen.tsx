import { useEffect } from 'react';
import { useApp } from '../AppContext';
import { audio } from '../audio';
import { weeklySuggestion } from '../content/offscreen';
import { ColorShape } from '../content/svg/ColorShape';
import { ParentGateButton } from '../parent/ParentGate';

/** Limite diário atingido: tela amigável, sem bloqueio agressivo, com a sugestão do dia (seção 15). */
export function LimitScreen(): JSX.Element {
  const { goto, derived, content, now } = useApp();
  useEffect(() => {
    void audio.say('limit.done');
  }, []);
  // Sugestão fora da tela da trilha com etapa atual (ícone + texto curto para o adulto).
  const track = (['colors', 'letters', 'numbers'] as const).map((t) => derived.tracks[t]).find((t) => t && t.currentStageId);
  const stageId = track?.currentStageId ?? content.tracks.colors?.stages[0]?.id ?? 'C1';
  const week = weeklySuggestion(stageId, now());
  return (
    <div className="screen" onPointerUp={() => goto('home')}>
      <ParentGateButton />
      <div className="intro-card" style={{ display: 'grid', placeItems: 'center' }}>
        <ColorShape shape="sun" fill="#FFD400" size="80%" />
      </div>
      <div className="celebrate">Hora de brincar lá fora!</div>
      {week && (
        <div className="row" style={{ maxWidth: 420, background: 'var(--card)', borderRadius: 16, padding: 10 }}>
          <span style={{ width: 48, height: 48, flex: '0 0 auto' }}><ColorShape shape={week.suggestion.icon.shape} fill={week.suggestion.icon.fill} /></span>
          <span className="muted" style={{ fontSize: 14 }}><strong>{week.suggestion.title}:</strong> {week.suggestion.text}</span>
        </div>
      )}
    </div>
  );
}
