/**
 * Gerador determinístico (mulberry32). Com a mesma semente, a mesma sessão.
 * Essencial para os testes e para reproduzir um problema relatado.
 */
export interface Rng {
  /** [0, 1) */
  next(): number;
  /** inteiro em [min, max] */
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => {
      if (arr.length === 0) throw new Error('pick from empty array');
      return arr[Math.floor(next() * arr.length)] as (typeof arr)[number];
    },
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tmp;
      }
      return out;
    },
  };
}
