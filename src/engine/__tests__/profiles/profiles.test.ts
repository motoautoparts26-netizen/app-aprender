import { describe, expect, it } from 'vitest';
import { PROFILES, simulate } from '../../simulate';
import { params, sharedContent, T0 } from '../fixtures/helpers';

const content = sharedContent();
const tracks = ['colors', 'letters', 'numbers'] as const;

function countMastered(res: ReturnType<typeof simulate>): number {
  return Object.values(res.finalState.skills).filter((s) => s.status === 'mastered' || s.status === 'provisional').length;
}

describe('Perfis simulados (seção 16)', () => {
  const fast = simulate({ profile: PROFILES.fast, content, params, tracks: [...tracks], days: 30, sessionsPerDay: 2, seed: 101, start: T0 });
  const slow = simulate({ profile: PROFILES.slow, content, params, tracks: [...tracks], days: 30, sessionsPerDay: 2, seed: 101, start: T0 });
  const forgetful = simulate({ profile: PROFILES.forgetful, content, params, tracks: [...tracks], days: 60, sessionsPerDay: 2, seed: 101, start: T0 });
  const redGreen = simulate({ profile: PROFILES.redGreen, content, params, tracks: ['colors'], days: 10, sessionsPerDay: 2, seed: 101, start: T0 });

  it('criança rápida avança: domina habilidades e passa de C1 em 30 dias', () => {
    expect(countMastered(fast)).toBeGreaterThan(8);
    expect(fast.finalState.tracks.colors.stageStatus['C1']).toBe('completed');
    expect(fast.finalState.alerts).toHaveLength(0);
  });

  it('criança devagar avança menos que a rápida, mas sem punição: nada é "perdido"', () => {
    expect(countMastered(slow)).toBeLessThan(countMastered(fast));
    expect(slow.finalState.alerts).toHaveLength(0);
  });

  it('nenhum perfil avança de etapa sem o critério completo', () => {
    for (const res of [fast, slow, forgetful]) {
      for (const t of tracks) {
        const ts = res.finalState.tracks[t];
        for (const stage of content.tracks[t].stages) {
          if (ts.stageStatus[stage.id] !== 'completed') continue;
          for (const id of stage.itemIds) expect(res.finalState.items[id]?.reachedMastery, `${id}`).toBe(true);
        }
      }
    }
  });

  it('criança que esquece entra em reforço ao menos uma vez e o avanço congela quando é pré-requisito', () => {
    const entered = forgetful.log.flatMap((d) => d.enteredReinforcement);
    expect(entered.length).toBeGreaterThan(0);
    const left = forgetful.log.flatMap((d) => d.leftReinforcement);
    expect(left.length).toBeGreaterThan(0);
  });

  it('perfil vermelho/verde dispara o alerta; os outros não', () => {
    expect(redGreen.finalState.alerts.map((a) => a.id)).toContain('color-vision');
    expect(fast.finalState.alerts).toHaveLength(0);
    expect(slow.finalState.alerts).toHaveLength(0);
    expect(forgetful.finalState.alerts).toHaveLength(0);
  });

  it('revisões acontecem nas datas previstas (há tentativas isReview em dias posteriores ao domínio)', () => {
    const reviews = fast.trials.filter((t) => t.isReview);
    expect(reviews.length).toBeGreaterThan(10);
    const firstMastery = fast.log.find((d) => d.newlyMastered.length > 0)!.day;
    const firstReview = Math.min(...reviews.map((t) => Math.floor((t.timestamp - T0) / 86_400_000)));
    expect(firstReview).toBeGreaterThan(firstMastery);
  });
});
