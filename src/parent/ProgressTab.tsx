import { useApp } from '../AppContext';
import { SPEECH } from '../content/speech';
import { dayKey } from '../engine/calendar';
import type { SkillState, TrackId } from '../engine/types';

const STATUS_PT: Record<string, string> = {
  'not-started': 'não iniciada', practicing: 'em prática', mastered: 'dominada', provisional: 'provisória', reinforcement: 'em reforço', stuck: 'encalhado',
};
const STEP_PT: Record<string, string> = {
  match: 'parear', recognize: 'reconhecer', recall: 'evocar', 'recognize-qty': 'símbolo→quantidade',
  'trace-guided': 'traçar com guia', 'trace-dotted': 'traçar pontilhado', 'trace-free': 'traçar livre',
};

export function ProgressTab(): JSX.Element {
  const { content, derived, profile, now } = useApp();
  const tracks = (['colors', 'letters', 'numbers'] as TrackId[]).filter((t) => content.tracks[t]);
  const today = dayKey(now());
  const recent = derived.sessions.filter((s) => (now() - s.startedAt) / 86_400_000 <= 14);

  return (
    <>
      {derived.alerts.map((a) => (
        <div className="alert" key={a.id}><strong>Observação:</strong> {a.message}</div>
      ))}
      <div className="card">
        <h2>Últimos 14 dias: {profile?.name}</h2>
        <p className="muted">
          {recent.length} sessão(ões) · {recent.filter((s) => s.dayKey === today).length} hoje ·
          acerto geral {recent.length ? Math.round((100 * recent.reduce((a, s) => a + s.correct, 0)) / Math.max(1, recent.reduce((a, s) => a + s.trials, 0))) : 0}%
        </p>
      </div>
      {tracks.map((t) => {
        const ts = derived.tracks[t];
        return (
          <div className="card" key={t}>
            <h2>{content.tracks[t].title} {ts.complete ? '· concluída' : ts.frozen ? '· avanço aguardando reforço' : ts.currentStageId ? `· etapa ${ts.currentStageId}` : ''}</h2>
            {!ts.placementDone && <p className="muted">Nivelamento ainda não feito (acontece na primeira vez que a criança entra na ilha).</p>}
            {content.tracks[t].stages.map((stage) => (
              <details key={stage.id} open={ts.stageStatus[stage.id] === 'current'}>
                <summary>
                  <strong>{stage.id}</strong> {stage.title} <span className={`chip ${ts.stageStatus[stage.id] === 'completed' ? 'mastered' : ts.stageStatus[stage.id] === 'current' ? 'practicing' : 'not-started'}`}>{ts.stageStatus[stage.id] === 'completed' ? 'concluída' : ts.stageStatus[stage.id] === 'current' ? 'atual' : 'bloqueada'}</span>
                </summary>
                <div style={{ paddingLeft: 12 }}>
                  {stage.itemIds.map((id) => {
                    const item = content.items[id]!;
                    const st = derived.items[id]!;
                    const active = ts.activeItemIds.includes(id);
                    return (
                      <div key={id} className="row" style={{ padding: '4px 0' }}>
                        <span style={{ minWidth: 90 }}><strong>{SPEECH[item.speechKey] ?? item.glyph}</strong>{active && <span className="chip practicing">ativo</span>}</span>
                        {st.skills.filter((s) => item.gatingSteps.includes(s.step) || s.totalTrials > 0).map((s) => <SkillChip key={s.skillId} s={s} stuck={st.status === 'stuck'} />)}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        );
      })}
    </>
  );
}

function SkillChip({ s, stuck }: { s: SkillState; stuck: boolean }): JSX.Element {
  const cls = stuck && s.status === 'practicing' ? 'stuck' : s.status;
  let extra = '';
  if (s.status === 'mastered' || s.status === 'provisional') extra = ` · caixa ${s.box} · revisão ${s.nextReviewAt ? new Date(s.nextReviewAt).toLocaleDateString('pt-BR') : ''}`;
  else if (s.status === 'practicing') extra = ` · ${s.qualifiedDays.length} dia(s) ok`;
  return (
    <span className={`chip ${cls}`} title={`${s.totalCorrect}/${s.totalTrials} acertos`}>
      {STEP_PT[s.step] ?? s.step}: {STATUS_PT[cls] ?? cls}{extra}
    </span>
  );
}
