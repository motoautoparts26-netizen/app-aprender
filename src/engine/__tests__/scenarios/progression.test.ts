import { describe, expect, it } from 'vitest';
import { SessionRunner } from '../../session';
import { skillId } from '../../skills';
import { deriveState } from '../../state';
import { at, masterItem, masterSkill, masterStage, ok, params, practice, review, sharedContent } from '../fixtures/helpers';

const content = sharedContent();

describe('Progressão entre etapas (seções 6 e 8)', () => {
  it('6. etapa só libera completa: vermelho dominado e azul em prática → C2 bloqueada', () => {
    const trials = [...masterItem('red', 0), ...practice('blue', 'match', { day: 0, results: ok(5) })];
    let st = deriveState(trials, content, params, at(4));
    expect(st.items['red']?.status).toBe('mastered');
    expect(st.tracks.colors.stageStatus['C1']).toBe('current');
    expect(st.tracks.colors.stageStatus['C2']).toBe('locked');

    const all = [...trials, ...masterItem('blue', 0)];
    st = deriveState(all, content, params, at(4));
    expect(st.tracks.colors.stageStatus['C1']).toBe('completed');
    expect(st.tracks.colors.stageStatus['C2']).toBe('current');
    expect(st.tracks.colors.currentStageId).toBe('C2');
  });

  it('7. revisão: um erro não derruba (segunda checagem acerta → mesma caixa)', () => {
    const sid = skillId('red', 'match');
    // Dominada no dia 1 (caixa 1). Revisões corretas nos dias 2 e 5 → caixa 3.
    const trials = [...masterSkill('red', 'match', 0), review('red', 'match', 2, true), review('red', 'match', 5, true)];
    let st = deriveState(trials, content, params, at(5, 60));
    expect(st.skills[sid]?.box).toBe(3);

    const withFail = [...trials, review('red', 'match', 12, false, 0), review('red', 'match', 12, true, 4)];
    st = deriveState(withFail, content, params, at(12, 60));
    expect(st.skills[sid]?.status).toBe('mastered');
    expect(st.skills[sid]?.box).toBe(3);
    expect(st.skills[sid]?.pendingRecheck).toBe(false);
  });

  it('8. revisão: dois erros derrubam → reforço com prioridade → 1 dia qualificado → caixa 1', () => {
    const sid = skillId('red', 'match');
    const trials = [
      ...masterSkill('red', 'match', 0),
      review('red', 'match', 2, false, 0),
      review('red', 'match', 2, false, 4),
    ];
    let st = deriveState(trials, content, params, at(2, 60));
    expect(st.skills[sid]?.status).toBe('reinforcement');
    expect(st.skills[sid]?.box).toBeNull();
    expect(st.items['red']?.status).toBe('reinforcement');

    // Na próxima sessão, logo depois do aquecimento, vem o reforço.
    const runner = new SessionRunner(st, content, params, {
      trackId: 'colors',
      profileId: 'p1',
      sessionId: 'x',
      adultMode: false,
      seed: 7,
      startedAt: at(3),
    });
    const kinds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const slot = runner.next(at(3, i))!;
      kinds.push(slot.kind);
      runner.record({ ...slotToTrial(slot, at(3, i)) });
    }
    expect(kinds.slice(0, 2)).toEqual(['warmup', 'warmup']);
    expect(kinds[2]).toBe('reinforcement');
    expect(runner.recorded[2]?.itemId).toBe('red');

    // Um dia qualificado (5 acertos sem ajuda, 4 opções) → volta à caixa 1.
    const back = [...trials, ...practice('red', 'match', { day: 3, results: ok(5) })];
    st = deriveState(back, content, params, at(3, 60));
    expect(st.skills[sid]?.status).toBe('mastered');
    expect(st.skills[sid]?.box).toBe(1);
  });

  it('9. reforço em etapa anterior congela o desbloqueio da próxima etapa', () => {
    // C1, C2 e C3 dominadas (dias 0–3). Criança estaria em C4.
    const base = [...masterStage('C1', 0), ...masterStage('C2', 0), ...masterStage('C3', 0)];
    let st = deriveState(base, content, params, at(4));
    expect(st.tracks.colors.currentStageId).toBe('C4');

    // Azul (C1) erra revisão duas vezes no dia 5 → reforço → C4 congela.
    const frozen = [...base, review('blue', 'recognize', 5, false, 0), review('blue', 'recognize', 5, false, 4)];
    st = deriveState(frozen, content, params, at(5, 60));
    expect(st.skills[skillId('blue', 'recognize')]?.status).toBe('reinforcement');
    expect(st.tracks.colors.frozen).toBe(true);
    expect(st.tracks.colors.currentStageId).toBeNull();
    expect(st.tracks.colors.stageStatus['C4']).toBe('locked');
    expect(st.tracks.colors.freezingSkillIds).toContain(skillId('blue', 'recognize'));

    // Sai do reforço (1 dia qualificado) → C4 libera.
    const released = [...frozen, ...practice('blue', 'recognize', { day: 6, results: ok(5) })];
    st = deriveState(released, content, params, at(6, 60));
    expect(st.tracks.colors.frozen).toBe(false);
    expect(st.tracks.colors.currentStageId).toBe('C4');
  });

  it('9b. reforço na etapa ATUAL não congela nada: a etapa continua atual', () => {
    const base = [...masterStage('C1', 0), ...masterItem('yellow', 0)];
    const trials = [...base, review('yellow', 'recognize', 5, false, 0), review('yellow', 'recognize', 5, false, 4)];
    const st = deriveState(trials, content, params, at(5, 60));
    expect(st.tracks.colors.currentStageId).toBe('C2');
    expect(st.tracks.colors.frozen).toBe(false);
  });

  it('nivelamento: etapa com ≥80% fica provisória na caixa 1; a revisão confirma', () => {
    const plc = (itemId: string, correct: boolean, idx: number) => ({
      ...practice(itemId, 'recognize', { day: 0, results: [correct], startIdx: idx })[0]!,
      isPlacement: true,
      sessionId: 'placement-1',
    });
    const trials = [plc('red', true, 0), plc('blue', true, 1), plc('red', true, 2), plc('blue', true, 3),
      plc('yellow', true, 4), plc('green', false, 5), plc('yellow', false, 6), plc('green', true, 7)];
    const st = deriveState(trials, content, params, at(0, 30));
    expect(st.skills[skillId('red', 'match')]?.status).toBe('provisional');
    expect(st.skills[skillId('red', 'recognize')]?.status).toBe('provisional');
    expect(st.skills[skillId('yellow', 'match')]?.status ?? 'not-started').toBe('not-started');
    expect(st.tracks.colors.currentStageId).toBe('C2');

    const confirmed = [...trials, review('red', 'recognize', 1, true)];
    const st2 = deriveState(confirmed, content, params, at(1, 60));
    expect(st2.skills[skillId('red', 'recognize')]?.status).toBe('mastered');
    expect(st2.skills[skillId('red', 'recognize')]?.box).toBe(2);
  });
});

function slotToTrial(slot: ReturnType<SessionRunner['next']> & object, ts: number) {
  return {
    id: `x${ts}`,
    profileId: 'p1',
    sessionId: 'x',
    trackId: slot.trackId,
    stageId: slot.stageId,
    itemId: slot.itemId,
    step: slot.step,
    helpLevel: slot.helpLevel,
    optionsCount: slot.optionsCount,
    variantId: slot.variantId,
    distractorIds: slot.distractorIds,
    chosenId: slot.itemId,
    correct: true,
    isReview: slot.isReview,
    isPlacement: slot.isPlacement,
    timestamp: ts,
  };
}
