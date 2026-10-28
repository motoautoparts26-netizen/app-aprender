import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { ColorActivity } from '../activities/colors/ColorActivity';
import { LettersActivity } from '../activities/letters/LetterActivities';
import { NumbersActivity } from '../activities/numbers/NumbersActivity';
import { Celebration } from '../activities/shared/Celebration';
import type { AnswerResult } from '../activities/shared/ChoiceActivity';
import { ReplayButton } from '../activities/shared/ReplayButton';
import { audio } from '../audio';
import { buildPlacementPlan, nextPlacementSlot, type PlacementPlan } from '../engine/placement';
import { createRng } from '../engine/rng';
import { SessionRunner, trialFromSlot } from '../engine/session';
import { deriveState } from '../engine/state';
import type { Slot, TrackId, Trial } from '../engine/types';
import { ParentGateButton } from '../parent/ParentGate';
import { newId } from '../storage/repo';

type Phase = 'placement' | 'session' | 'end';

/**
 * Fluxo de uma sessão: nivelamento (na primeira vez na trilha) → sessão montada pelo motor →
 * celebração. Cada tentativa é gravada imediatamente ao ser respondida (seção 4.2).
 */
export function SessionScreen({ trackId }: { trackId: TrackId }): JSX.Element {
  const app = useApp();
  const { content, params, profile, settings, derived, now, recordTrial, goto } = app;
  const [phase, setPhase] = useState<Phase>('placement');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [seq, setSeq] = useState(0);
  const sessionId = useRef(newId('s'));
  const runner = useRef<SessionRunner | null>(null);
  const plan = useRef<PlacementPlan | null>(null);
  const placementAnswered = useRef<Trial[]>([]);
  const allTrials = useRef<Trial[]>(app.trials);
  const started = useRef(false);

  const startRunner = useCallback(
    (trials: Trial[]) => {
      const state = deriveState(trials, content, params, now());
      runner.current = new SessionRunner(state, content, params, {
        trackId,
        profileId: profile!.id,
        sessionId: sessionId.current,
        adultMode: settings.adultMode,
        seed: createRng(now() % 2147483647).int(1, 2 ** 31 - 1),
        startedAt: now(),
      });
      setPhase('session');
      void audio.say('session.start', {}, false);
      const first = runner.current.next(now());
      if (first) setSlot(first);
      else setPhase('end');
    },
    [content, params, profile, settings.adultMode, trackId, now],
  );

  useEffect(() => {
    if (started.current || !profile) return;
    started.current = true;
    const track = derived.tracks[trackId];
    if (!track.placementDone && content.tracks[trackId].stages.some((s) => s.placement)) {
      plan.current = buildPlacementPlan(trackId, content, params, createRng(now() % 2147483647));
      const first = nextPlacementSlot(plan.current, [], params);
      if (first) {
        setPhase('placement');
        setSlot(first);
        return;
      }
    }
    startRunner(allTrials.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeTrial = useCallback(
    (base: Slot, r: AnswerResult): Trial =>
      trialFromSlot(
        { ...base, helpLevel: r.helpLevel, optionsCount: r.optionsCount },
        {
          id: newId('t'),
          profileId: profile!.id,
          sessionId: phase === 'placement' ? `${sessionId.current}-placement` : sessionId.current,
          chosenId: r.chosenId,
          correct: r.correct,
          timestamp: now(),
        },
      ),
    [profile, phase, now],
  );

  /** Tentativa extra de atividade composta: mesma sessão, outro item da mesma trilha. */
  const onExtraTrial = useCallback(
    async (itemId: string, r: AnswerResult) => {
      if (!slot || !profile || phase !== 'session') return;
      const item = content.items[itemId];
      if (!item) return;
      const trial = makeTrial({ ...slot, itemId, stageId: item.stageId, distractorIds: [], kind: 'free', introduce: false }, r);
      await recordTrial(trial);
      allTrials.current = [...allTrials.current, trial];
      runner.current?.recordExtra(trial);
    },
    [slot, profile, phase, content, makeTrial, recordTrial],
  );

  const onAnswer = useCallback(
    async (r: AnswerResult & { mirrored?: boolean }) => {
      if (!slot || !profile) return;
      const trial = makeTrial(slot, r);
      if (r.mirrored !== undefined) trial.mirrored = r.mirrored;
      await recordTrial(trial);
      allTrials.current = [...allTrials.current, trial];
      setSeq((s) => s + 1);

      if (phase === 'placement' && plan.current) {
        placementAnswered.current.push(trial);
        const next = nextPlacementSlot(plan.current, placementAnswered.current, params);
        if (next) return setSlot(next);
        return startRunner(allTrials.current);
      }
      if (runner.current) {
        runner.current.record(trial);
        const next = runner.current.next(now());
        if (next) return setSlot(next);
      }
      setSlot(null);
      setPhase('end');
      void audio.say('session.end', {}, false);
    },
    [slot, profile, phase, params, now, recordTrial, startRunner, makeTrial],
  );

  if (phase === 'end') return <Celebration onDone={() => goto('home')} />;
  if (!slot) return <div className="screen">…</div>;

  const key = `${slot.itemId}-${slot.step}-${seq}`;
  const liveDerived = deriveState(allTrials.current, content, params, now());

  return (
    <div className="screen top">
      <ParentGateButton />
      {slot.trackId === 'letters' ? (
        <LettersActivity
          key={key}
          slot={slot}
          content={content}
          params={params}
          derived={liveDerived}
          childName={profile?.name ?? ''}
          familyNames={profile?.familyNames ?? []}
          onAnswer={(r) => void onAnswer(r)}
          onExtraTrial={(id, r) => void onExtraTrial(id, r)}
        />
      ) : slot.trackId === 'numbers' ? (
        <NumbersActivity key={key} slot={slot} content={content} params={params} onAnswer={(r) => void onAnswer(r)} />
      ) : (
        <ColorActivity key={key} slot={slot} content={content} params={params} onAnswer={(r) => void onAnswer(r)} />
      )}
      <ReplayButton />
    </div>
  );
}
