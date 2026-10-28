import { COLORS } from '../../content/colors';
import { NEUTRAL_PREFIX } from '../../engine/distractors';
import type { Content } from '../../engine/types';

export interface OptionVisual {
  id: string;
  hex: string;
  outline?: string;
  shape: string;
  neutral: boolean;
}

/** Formas que podem ter qualquer cor (não ensinam cor "típica" errada, como uma banana azul). */
export const ARBITRARY_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'hexagon', 'moon', 'car', 'balloon'];

export function colorOf(itemId: string, variantId: string | undefined, content: Content): { hex: string; outline?: string } {
  const item = content.items[itemId];
  const base = COLORS.find((c) => c.id === item?.glyph);
  if (variantId?.startsWith('shade:')) return { hex: variantId.slice(6) };
  return { hex: base?.hex ?? '#999', ...(base?.outline ? { outline: base.outline } : {}) };
}

export function shapeOf(variantId: string | undefined, fallback: string): string {
  if (!variantId || variantId.startsWith('shade:')) return fallback;
  return variantId;
}

export function randomShape(exclude: string[] = []): string {
  const pool = ARBITRARY_SHAPES.filter((s) => !exclude.includes(s));
  return pool[Math.floor(Math.random() * pool.length)] ?? 'circle';
}

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Monta as opções visuais de uma tentativa de cor.
 * PAREAR: todas com a mesma forma do modelo (a cor é o único critério).
 * RECONHECER: formas variadas (a forma não pode denunciar a resposta).
 */
export function buildColorOptions(
  targetId: string,
  variantId: string,
  distractorIds: string[],
  step: 'match' | 'recognize',
  content: Content,
): { model: OptionVisual; options: OptionVisual[] } {
  const targetShape = shapeOf(variantId, randomShape());
  const target: OptionVisual = { id: targetId, ...colorOf(targetId, variantId, content), shape: targetShape, neutral: false };
  const usedShapes = [targetShape];
  const others: OptionVisual[] = distractorIds.map((id) => {
    const neutral = id.startsWith(NEUTRAL_PREFIX);
    const shape = step === 'match' ? targetShape : randomShape(usedShapes);
    if (step === 'recognize') usedShapes.push(shape);
    if (neutral) return { id, hex: '#DDDDDD', shape, neutral: true };
    return { id, ...colorOf(id, undefined, content), shape, neutral: false };
  });
  return { model: target, options: shuffle([target, ...others]) };
}
