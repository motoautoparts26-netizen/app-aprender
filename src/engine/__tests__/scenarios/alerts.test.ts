import { describe, expect, it } from 'vitest';
import { PROFILES, simulate } from '../../simulate';
import { params, sharedContent, T0 } from '../fixtures/helpers';

const content = sharedContent();

describe('13. alerta de visão de cores dispara só para o perfil certo', () => {
  it('perfil que confunde vermelho/verde dispara em até 10 sessões', () => {
    const res = simulate({ profile: PROFILES.redGreen, content, params, tracks: ['colors'], days: 5, sessionsPerDay: 2, seed: 21, start: T0 });
    const alerts = res.finalState.alerts.map((a) => a.id);
    expect(alerts).toContain('color-vision');
    const ev = res.finalState.alerts[0]!.evidence;
    expect(ev['errors']).toBeGreaterThanOrEqual(params.CVD_MIN_ERRORS);
    expect(ev['share']).toBeGreaterThanOrEqual(params.CVD_PAIR_SHARE);
  });

  it.each([
    ['rápido', PROFILES.fast],
    ['devagar', PROFILES.slow],
    ['esquece', PROFILES.forgetful],
  ])('perfil %s nunca dispara em 30 sessões', (_name, profile) => {
    for (const seed of [1, 2, 3]) {
      const res = simulate({ profile, content, params, tracks: ['colors'], days: 15, sessionsPerDay: 2, seed, start: T0 });
      expect(res.finalState.alerts.map((a) => a.id)).not.toContain('color-vision');
    }
  });
});
