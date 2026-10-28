import { INK, parseLetterVariant } from '../letters/LetterTile';

/** Numeral grande em Andika, cor neutra (mesmas variantes de tamanho/cor das letras). */
export function NumeralTile({ n, variantId, color, scale }: { n: number | string; variantId?: string; color?: string; scale?: string }): JSX.Element {
  const v = parseLetterVariant(variantId);
  return (
    <span className="letter" style={{ color: color ?? v.color ?? INK['ink'], fontSize: `calc(var(--letter-size) * ${scale ?? v.scale})` }} aria-hidden="true">
      {n}
    </span>
  );
}
