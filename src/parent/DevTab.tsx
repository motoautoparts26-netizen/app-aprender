import { useState } from 'react';
import { useApp } from '../AppContext';
import { SPEECH } from '../content/speech';
import { buildPlacementPlan, nextPlacementSlot } from '../engine/placement';
import { createRng } from '../engine/rng';
import { SessionRunner, trialFromSlot } from '../engine/session';
import { deriveState } from '../engine/state';
import type { TrackId, Trial } from '../engine/types';
import { addTrials, newId, resetProfileProgress } from '../storage/repo';
import { ActivityPreview } from './ActivityPreview';

const DAY = 86_400_000;

/** Modo de simulação (seção 16): relógio, respostas automáticas, estado interno, reset. */
export function DevTab(): JSX.Element {
  const { settings, updateSettings, profile, content, params, derived, trials, now, reloadTrials, refresh } = useApp();
  const [track, setTrack] = useState<TrackId>('colors');
  const [accuracy, setAccuracy] = useState(0.9);
  const [sessions, setSessions] = useState(1);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const offsetDays = Math.round(settings.clockOffsetMs / DAY);
  const shift = (days: number): void => void updateSettings({ clockOffsetMs: settings.clockOffsetMs + days * DAY }).then(refresh);

  const autoPlay = async (): Promise<void> => {
    if (!profile) return;
    setBusy(true);
    const rng = createRng(now() % 2147483647);
    const all: Trial[] = trials.slice();
    const out: string[] = [];
    for (let s = 0; s < sessions; s++) {
      let t = now() + s * 30 * 60_000;
      const state0 = deriveState(all, content, params, t);
      const made: Trial[] = [];
      const answer = (slot: ReturnType<SessionRunner['next']> & object, sessionId: string): Trial => {
        const correct = rng.next() < accuracy;
        const chosenId = correct ? slot.itemId : slot.distractorIds.length ? rng.pick(slot.distractorIds) : null;
        return trialFromSlot(slot, { id: newId('t'), profileId: profile.id, sessionId, chosenId, correct, timestamp: t });
      };
      if (!state0.tracks[track].placementDone && content.tracks[track].stages.some((st) => st.placement)) {
        const plan = buildPlacementPlan(track, content, params, rng);
        const answered: Trial[] = [];
        let slot = nextPlacementSlot(plan, answered, params);
        while (slot) {
          const tr = answer(slot, `${newId('s')}-placement`);
          answered.push(tr);
          made.push(tr);
          t += 15_000;
          slot = nextPlacementSlot(plan, answered, params);
        }
        out.push(`nivelamento: ${answered.filter((x) => x.correct).length}/${answered.length}`);
      }
      const state = deriveState([...all, ...made], content, params, t);
      const sessionId = newId('s');
      const runner = new SessionRunner(state, content, params, { trackId: track, profileId: profile.id, sessionId, adultMode: settings.adultMode, seed: rng.int(1, 2 ** 31 - 1), startedAt: t });
      let slot = runner.next(t);
      const kinds: string[] = [];
      while (slot) {
        const tr = answer(slot, sessionId);
        runner.record(tr);
        made.push(tr);
        kinds.push(slot.kind);
        t += 15_000;
        slot = runner.next(t);
      }
      await addTrials(made);
      all.push(...made);
      out.push(`sessão ${s + 1}: ${made.filter((x) => !x.isPlacement).length} tentativas (${kinds.filter((k) => k === 'review' || k === 'recheck').length} revisões, ${kinds.filter((k) => k === 'reinforcement').length} reforço)`);
    }
    await reloadTrials();
    setLog(out);
    setBusy(false);
  };

  const reset = async (): Promise<void> => {
    if (!profile || !window.confirm(`Apagar TODO o progresso de ${profile.name}? O perfil fica.`)) return;
    await resetProfileProgress(profile.id);
    await reloadTrials();
  };

  const trackState = derived.tracks[track];
  const skills = Object.values(derived.skills).filter((s) => content.items[s.itemId]?.trackId === track && s.totalTrials > 0);

  return (
    <>
      <div className="card">
        <h2>Relógio simulado</h2>
        <p>Deslocamento: <strong>{offsetDays >= 0 ? '+' : ''}{offsetDays} dia(s)</strong> · hoje para o app: {new Date(now()).toLocaleString('pt-BR')}</p>
        <div className="row">
          <button className="btn" onClick={() => shift(1)}>+1 dia</button>
          <button className="btn" onClick={() => shift(3)}>+3 dias</button>
          <button className="btn" onClick={() => shift(7)}>+7 dias</button>
          <button className="btn" onClick={() => void updateSettings({ clockOffsetMs: 0 }).then(refresh)}>Voltar ao real</button>
        </div>
      </div>
      <div className="card">
        <h2>Responder automaticamente</h2>
        <div className="row">
          <label>Trilha <select value={track} onChange={(e) => setTrack(e.target.value as TrackId)}>{Object.values(content.tracks).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
          <label>Acerto <input type="range" min={0} max={1} step={0.05} value={accuracy} onChange={(e) => setAccuracy(Number(e.target.value))} /> {Math.round(accuracy * 100)}%</label>
          <label>Sessões <input type="number" min={1} max={10} value={sessions} onChange={(e) => setSessions(Number(e.target.value))} style={{ width: 70 }} /></label>
          <button className="btn primary" disabled={busy} onClick={() => void autoPlay()}>{busy ? 'Rodando…' : 'Rodar'}</button>
        </div>
        <p className="muted">Grava tentativas reais no perfil atual, na data do relógio simulado. Para ver a revisão espaçada: rode 2 sessões, +1 dia, 2 sessões (domina), +1 dia, 1 sessão (revisão aparece).</p>
        {log.map((l, i) => <div key={i} className="muted">{l}</div>)}
      </div>
      <div className="card">
        <h2>Estado interno: {content.tracks[track].title}</h2>
        <p className="muted">
          etapa atual: {trackState.currentStageId ?? (trackState.complete ? 'concluída' : trackState.frozen ? 'congelada' : '—')} · ativos: {trackState.activeItemIds.join(', ') || '—'} · encalhados: {trackState.stuckItemIds.join(', ') || '—'}
          {trackState.frozen && ` · congelando: ${trackState.freezingSkillIds.join(', ')}`}
        </p>
        <table className="state">
          <thead><tr><th>Item</th><th>Degrau</th><th>Estado</th><th>Tent.</th><th>Dias ok</th><th>Variantes</th><th>Caixa</th><th>Próx. revisão</th><th>2ª chec.</th></tr></thead>
          <tbody>
            {skills.map((s) => (
              <tr key={s.skillId}>
                <td>{SPEECH[content.items[s.itemId]?.speechKey ?? ''] ?? s.itemId}</td><td>{s.step}</td><td>{s.status}</td>
                <td>{s.totalCorrect}/{s.totalTrials}</td><td>{s.qualifiedDays.length}{s.currentDay ? ` (hoje ${s.currentDay.trials - s.currentDay.errors}/${s.currentDay.trials})` : ''}</td>
                <td>{s.variantsCorrect.length}</td><td>{s.box ?? '—'}</td>
                <td>{s.nextReviewAt ? new Date(s.nextReviewAt).toLocaleDateString('pt-BR') : '—'}</td><td>{s.pendingRecheck ? 'sim' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActivityPreview />
      <div className="card">
        <h2>Apagar progresso</h2>
        <button className="btn danger" onClick={() => void reset()}>Apagar progresso de {profile?.name}</button>
      </div>
    </>
  );
}
