import { describe, expect, it } from 'vitest';
import { buildContent, LETTER_PAIRS } from '../../../content';
import { createRng } from '../../rng';
import { SessionRunner, trialFromSlot } from '../../session';
import { PROFILES, simulate, SimulatedChild } from '../../simulate';
import { deriveState } from '../../state';
import type { Content, DerivedState, TrackId, Trial } from '../../types';
import { at, params, sharedContent, T0 } from '../fixtures/helpers';

const content = sharedContent();

/** Roda uma sessão com respostas aleatórias (taxa `accuracy`) e devolve as tentativas. */
function runRandomSession(
  state: DerivedState,
  c: Content,
  trackId: TrackId,
  seed: number,
  accuracy: number,
  startedAt: number,
): Trial[] {
  const rng = createRng(seed * 31 + 7);
  const runner = new SessionRunner(state, c, params, {
    trackId,
    profileId: 'p1',
    sessionId: `s${seed}`,
    adultMode: false,
    seed,
    startedAt,
  });
  const out: Trial[] = [];
  let now = startedAt;
  let slot = runner.next(now);
  while (slot) {
    const correct = rng.next() < accuracy;
    const chosenId = correct ? slot.itemId : slot.distractorIds.length ? rng.pick(slot.distractorIds) : null;
    const t = trialFromSlot(slot, { id: `t${out.length}`, profileId: 'p1', sessionId: `s${seed}`, chosenId, correct, timestamp: now });
    runner.record(t);
    out.push(t);
    now += 15_000;
    slot = runner.next(now);
  }
  return out;
}

function maxRun(trials: Trial[]): number {
  let best = 0;
  let run = 0;
  let prev = '';
  for (const t of trials) {
    run = t.itemId === prev ? run + 1 : 1;
    prev = t.itemId;
    best = Math.max(best, run);
  }
  return best;
}

describe('Montagem da sessão (seção 9)', () => {
  it('10. conjunto ativo: etapa com 5 itens → no máximo 3 recebem tentativas até um ser dominado', () => {
    // Sem nome, L1 fica vazia e a trilha começa nas vogais (5 itens).
    const c = buildContent({ childName: '' });
    expect(c.tracks.letters.stages[0]?.id).toBe('L2');
    const never = { ...PROFILES.slow, gain: 0, cap: 0 }; // nunca aprende
    const res = simulate({ profile: never, content: c, params, tracks: ['letters'], days: 4, sessionsPerDay: 2, seed: 3, start: T0 });
    const targets = new Set(res.trials.filter((t) => !t.isPlacement).map((t) => t.itemId));
    expect(targets.size).toBeLessThanOrEqual(params.ACTIVE_SET_SIZE);
    expect(res.finalState.tracks.letters.activeItemIds).toHaveLength(3);
  });

  it('11. nunca o mesmo item 3 vezes seguidas, em 1000 sessões aleatórias', () => {
    const empty = deriveState([], content, params, T0);
    const learned = simulate({ profile: PROFILES.fast, content, params, tracks: ['colors', 'letters', 'numbers'], days: 12, sessionsPerDay: 2, seed: 11, start: T0 });
    const states: DerivedState[] = [empty, learned.finalState];
    const tracks: TrackId[] = ['colors', 'letters', 'numbers'];
    let sessions = 0;
    for (let seed = 1; seed <= 500; seed++) {
      for (const st of states) {
        const trackId = tracks[seed % 3]!;
        const trials = runRandomSession(st, content, trackId, seed, 0.3 + (seed % 7) * 0.1, at(20 + (seed % 5)));
        expect(trials.length).toBeGreaterThan(0);
        expect(maxRun(trials)).toBeLessThanOrEqual(params.MAX_SAME_ITEM_RUN);
        sessions++;
      }
    }
    expect(sessions).toBe(1000);
  });

  it('12. pares confundíveis nunca juntos na tela antes da etapa de contraste', () => {
    const res = simulate({ profile: PROFILES.fast, content, params, tracks: ['letters'], days: 90, sessionsPerDay: 2, seed: 5, start: T0 });
    const reached = new Set(res.trials.map((t) => t.stageId));
    expect(reached.has('L4b')).toBe(true); // chegou longe o bastante para o teste valer
    let checked = 0;
    for (const t of res.trials) {
      const stage = content.stages[t.stageId]!;
      if (stage.allowConfusable) continue;
      const glyphs = [t.itemId, ...t.distractorIds].map((id) => content.items[id]?.glyph).filter(Boolean) as string[];
      for (const [a, b] of LETTER_PAIRS) {
        expect(glyphs.includes(a) && glyphs.includes(b), `${a}/${b} juntos em ${t.stageId}`).toBe(false);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(500);
    // E no conjunto ativo de L4b, M e N (ou B e D) nunca ao mesmo tempo.
    let l4bDays = 0;
    for (const day of res.log) {
      const active = day.activeItems.letters ?? [];
      if (day.currentStage.letters !== 'L4b') continue;
      l4bDays++;
      expect(active.includes('M') && active.includes('N'), `M e N ativos juntos: ${active.join(',')}`).toBe(false);
      expect(active.includes('B') && active.includes('D'), `B e D ativos juntos: ${active.join(',')}`).toBe(false);
    }
    expect(l4bDays).toBeGreaterThan(0);
  });

  it('sessão tem aquecimento, fechamento e respeita o tamanho alvo', () => {
    const st = deriveState([], content, params, T0);
    const runner = new SessionRunner(st, content, params, { trackId: 'colors', profileId: 'p1', sessionId: 's', adultMode: false, seed: 1, startedAt: T0 });
    // Criança que já sabe tudo: a sessão não encerra cedo por frustração.
    const child = new SimulatedChild({ ...PROFILES.fast, initialStrength: 1 }, content, createRng(2));
    const kinds: string[] = [];
    let now = T0;
    let slot = runner.next(now);
    while (slot) {
      kinds.push(slot.kind);
      const ans = child.answer(slot, now);
      runner.record(trialFromSlot(slot, { id: `t${kinds.length}`, profileId: 'p1', sessionId: 's', ...ans, timestamp: now }));
      now += 15_000;
      slot = runner.next(now);
    }
    expect(kinds).toHaveLength(params.SESSION_TARGET_TRIALS);
    expect(kinds.slice(0, 2)).toEqual(['warmup', 'warmup']);
    expect(kinds[kinds.length - 1]).toBe('closing');
    expect(kinds).toContain('current');
  });

  it('item novo é apresentado antes de ser cobrado, no máximo 2 por sessão', () => {
    const st = deriveState([], content, params, T0);
    const runner = new SessionRunner(st, content, params, { trackId: 'numbers', profileId: 'p1', sessionId: 's', adultMode: false, seed: 1, startedAt: T0 });
    const introduced: string[] = [];
    let now = T0;
    let slot = runner.next(now);
    while (slot) {
      if (slot.introduce) introduced.push(slot.itemId);
      runner.record(trialFromSlot(slot, { id: `t${now}`, profileId: 'p1', sessionId: 's', chosenId: slot.itemId, correct: true, timestamp: now }));
      now += 15_000;
      slot = runner.next(now);
    }
    expect(introduced.length).toBeLessThanOrEqual(params.NEW_ITEMS_PER_SESSION);
    expect(introduced.length).toBeGreaterThan(0);
  });

  it('tempo máximo encerra a sessão mesmo com poucas tentativas', () => {
    const st = deriveState([], content, params, T0);
    const runner = new SessionRunner(st, content, params, { trackId: 'colors', profileId: 'p1', sessionId: 's', adultMode: false, seed: 1, startedAt: T0 });
    let now = T0;
    let count = 0;
    let slot = runner.next(now);
    while (slot) {
      count++;
      runner.record(trialFromSlot(slot, { id: `t${count}`, profileId: 'p1', sessionId: 's', chosenId: slot.itemId, correct: true, timestamp: now }));
      now += 2 * 60_000; // 2 min por tentativa: estoura os 7 min
      slot = runner.next(now);
    }
    expect(count).toBeLessThan(params.SESSION_TARGET_TRIALS);
    expect(count).toBeGreaterThanOrEqual(params.WARMUP_TRIALS + 1);
  });

  it('acerto abaixo de 60% depois de 8 tentativas encerra cedo com 2 fáceis e fechamento', () => {
    const st = deriveState([], content, params, T0);
    const runner = new SessionRunner(st, content, params, { trackId: 'colors', profileId: 'p1', sessionId: 's', adultMode: false, seed: 1, startedAt: T0 });
    const kinds: string[] = [];
    let now = T0;
    let slot = runner.next(now);
    while (slot) {
      kinds.push(slot.kind);
      runner.record(trialFromSlot(slot, { id: `t${kinds.length}`, profileId: 'p1', sessionId: 's', chosenId: null, correct: false, timestamp: now }));
      now += 15_000;
      slot = runner.next(now);
    }
    expect(kinds.length).toBeLessThan(params.SESSION_TARGET_TRIALS);
    expect(kinds.slice(-3)).toEqual(['easy', 'easy', 'closing']);
  });
});
