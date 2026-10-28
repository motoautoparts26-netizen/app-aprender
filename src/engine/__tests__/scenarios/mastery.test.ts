import { describe, expect, it } from 'vitest';
import { skillId } from '../../skills';
import { deriveState } from '../../state';
import { at, masterSkill, ok, params, practice, sharedContent } from '../fixtures/helpers';

const content = sharedContent();
const RED_MATCH = skillId('red', 'match');

describe('Cenários de domínio (seção 6)', () => {
  it('1. opções insuficientes não contam: 100% com 3 opções por 5 dias → nada dominado', () => {
    const trials = [0, 1, 2, 3, 4].flatMap((d) => practice('red', 'match', { day: d, results: ok(10), options: 3 }));
    const st = deriveState(trials, content, params, at(5));
    expect(st.skills[RED_MATCH]?.status).toBe('practicing');
    expect(st.skills[RED_MATCH]?.qualifiedDays).toEqual([]);
  });

  it('2. um dia só não basta: 10/10 num dia → não; +5 no dia seguinte → dominado', () => {
    const day0 = practice('red', 'match', { day: 0, results: ok(10) });
    let st = deriveState(day0, content, params, at(0, 20));
    expect(st.skills[RED_MATCH]?.status).toBe('practicing');
    expect(st.skills[RED_MATCH]?.qualifiedDays).toHaveLength(1);

    const day1 = practice('red', 'match', { day: 1, results: ok(5) });
    st = deriveState([...day0, ...day1], content, params, at(1, 20));
    expect(st.skills[RED_MATCH]?.status).toBe('mastered');
    expect(st.skills[RED_MATCH]?.box).toBe(1);
  });

  it('3. dia reprovado zera: qualificado, reprovado (2 erros em 5), qualificado → não; mais um → sim', () => {
    const d0 = practice('red', 'match', { day: 0, results: ok(5) });
    const d1 = practice('red', 'match', { day: 1, results: [true, false, true, false, true] });
    const d2 = practice('red', 'match', { day: 2, results: ok(5) });
    let st = deriveState([...d0, ...d1, ...d2], content, params, at(2, 20));
    expect(st.skills[RED_MATCH]?.status).toBe('practicing');
    expect(st.skills[RED_MATCH]?.qualifiedDays).toHaveLength(1);

    const d3 = practice('red', 'match', { day: 3, results: ok(5) });
    st = deriveState([...d0, ...d1, ...d2, ...d3], content, params, at(3, 20));
    expect(st.skills[RED_MATCH]?.status).toBe('mastered');
  });

  it('3b. um erro em cinco ainda é dia qualificado', () => {
    const d0 = practice('red', 'match', { day: 0, results: [true, false, true, true, true] });
    const d1 = practice('red', 'match', { day: 1, results: [true, true, true, true, false] });
    const st = deriveState([...d0, ...d1], content, params, at(1, 20));
    expect(st.skills[RED_MATCH]?.status).toBe('mastered');
  });

  it('4. dica não conta: 20 acertos com ajuda 1 em 3 dias → não dominado', () => {
    const trials = [0, 1, 2].flatMap((d) => practice('red', 'match', { day: d, results: ok(7), help: 1 }));
    const st = deriveState(trials, content, params, at(3));
    expect(st.skills[RED_MATCH]?.status).toBe('practicing');
    expect(st.skills[RED_MATCH]?.totalTrials).toBe(21);
  });

  it('5. variantes: 2 dias qualificados com só 2 variantes → não; acerto numa 3ª → dominado', () => {
    const d0 = practice('red', 'match', { day: 0, results: ok(5), variants: 2 });
    const d1 = practice('red', 'match', { day: 1, results: ok(5), variants: 2 });
    let st = deriveState([...d0, ...d1], content, params, at(1, 20));
    expect(st.skills[RED_MATCH]?.status).toBe('practicing');
    expect(st.skills[RED_MATCH]?.variantsCorrect).toHaveLength(2);

    const third = practice('red', 'match', { day: 2, results: [true], startIdx: 0 });
    third[0]!.variantId = content.items['red']!.variants[2]!;
    st = deriveState([...d0, ...d1, ...third], content, params, at(2, 5));
    expect(st.skills[RED_MATCH]?.status).toBe('mastered');
  });

  it('degrau 2 só libera com o degrau 1 dominado (prática em RECONHECER antes não conta)', () => {
    const early = practice('red', 'recognize', { day: 0, results: ok(5) });
    const st = deriveState(early, content, params, at(0, 10));
    // O motor registra, mas o item só oferece 'match' enquanto ele não está dominado.
    expect(st.skills[skillId('red', 'recognize')]?.status).toBe('practicing');
    expect(st.tracks.colors.activeItemIds).toContain('red');
    const trials = [...masterSkill('red', 'match', 0)];
    const st2 = deriveState(trials, content, params, at(2));
    expect(st2.skills[RED_MATCH]?.status).toBe('mastered');
    expect(st2.items['red']?.status).toBe('practicing');
  });
});
