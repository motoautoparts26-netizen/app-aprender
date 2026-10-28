import { describe, expect, it } from 'vitest';
import { TRACE_PATHS } from '../../../content/numbers';
import { evaluateTrace } from '../TraceActivity';

type Pt = [number, number];
const TOL = 40 / 3; // igual à atividade: TRACE_TOLERANCE_PX / 3

/** Traço "de criança": segue os pontos com tremor e pontos intermediários. */
function childStroke(path: Pt[], jitter = 0.03, mirror = false): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    for (let t = 0; t < 1; t += 0.1) {
      const x = a[0] + (b[0] - a[0]) * t + (Math.sin(t * 20 + i) * jitter);
      const y = a[1] + (b[1] - a[1]) * t + (Math.cos(t * 17 + i) * jitter);
      out.push([mirror ? 1 - x : x, y]);
    }
  }
  const last = path[path.length - 1]!;
  out.push([mirror ? 1 - last[0] : last[0], last[1]]);
  return out;
}

describe('Avaliação do traçado (seção 12.3)', () => {
  it('aceita um traçado tremido que segue a ordem', () => {
    for (const n of [1, 2, 3, 6, 8]) {
      const paths = TRACE_PATHS[n]!;
      const r = evaluateTrace(paths.map((s) => childStroke(s)), paths, TOL);
      expect(r.ok, `número ${n}`).toBe(true);
      expect(r.mirrored).toBe(false);
    }
  });

  it('aceita espelhamento e registra', () => {
    const paths = TRACE_PATHS[3]!;
    const r = evaluateTrace(paths.map((s) => childStroke(s, 0.02, true)), paths, TOL);
    expect(r.ok).toBe(true);
    expect(r.mirrored).toBe(true);
  });

  it('recusa o traçado na direção contrária (fim → início)', () => {
    const paths = TRACE_PATHS[1]!;
    const reversed = paths.map((s) => childStroke(s.slice().reverse()));
    expect(evaluateTrace(reversed, paths, TOL).ok).toBe(false);
  });

  it('recusa um rabisco longe do caminho', () => {
    const paths = TRACE_PATHS[2]!;
    const scribble: Pt[] = Array.from({ length: 40 }, (_, i) => [0.1 + (i % 5) * 0.02, 0.9 - (i % 7) * 0.01]);
    expect(evaluateTrace([scribble], paths, TOL).ok).toBe(false);
  });

  it('números de dois traços (4 e 10) aceitam os dois traços em sequência', () => {
    for (const n of [4, 10]) {
      const paths = TRACE_PATHS[n]!;
      expect(paths.length).toBe(2);
      expect(evaluateTrace(paths.map((s) => childStroke(s)), paths, TOL).ok, `número ${n}`).toBe(true);
    }
  });
});
