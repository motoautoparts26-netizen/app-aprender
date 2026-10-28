import { ColorShape } from '../../content/svg/ColorShape';

/**
 * Cartão com N objetos. Variante = "objeto:arranjo" (ex.: 'dots:line', 'apples:row',
 * 'stars:triangle', 'ducks:scatter', 'dots:dice'). Mesma quantidade, aparências diferentes.
 */
const OBJECTS: Record<string, { shape: string; fill: string }> = {
  dots: { shape: 'circle', fill: '#1F5FD6' },
  apples: { shape: 'apple', fill: '#E02020' },
  stars: { shape: 'star', fill: '#FFD400' },
  ducks: { shape: 'balloon', fill: '#FF8A1F' },
};

/** Posições (0–100) dos objetos para cada quantidade e arranjo. */
export function positions(n: number, arrangement: string): [number, number][] {
  if (n <= 0) return [];
  const dice: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[30, 24], [70, 24], [30, 50], [70, 50], [30, 76], [70, 76]],
  };
  if (arrangement === 'dice' && dice[n]) return dice[n]!;
  if (arrangement === 'triangle') {
    const rows: [number, number][] = [];
    let left = n;
    let r = 1;
    const rowsNeeded: number[] = [];
    while (left > 0) {
      rowsNeeded.push(Math.min(r, left));
      left -= Math.min(r, left);
      r++;
    }
    const h = rowsNeeded.length;
    rowsNeeded.forEach((count, ri) => {
      const y = 20 + (ri * 60) / Math.max(1, h - 1);
      for (let i = 0; i < count; i++) rows.push([50 + (i - (count - 1) / 2) * 22, h === 1 ? 50 : y]);
    });
    return rows;
  }
  if (arrangement === 'scatter') {
    const seeds: [number, number][] = [[22, 30], [68, 22], [44, 56], [80, 62], [28, 76], [60, 80], [50, 28], [16, 54], [84, 40], [40, 92]];
    return seeds.slice(0, n);
  }
  // line / row: até 5 por linha
  const perRow = n <= 5 ? n : Math.ceil(n / 2);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rowsTotal = Math.ceil(n / perRow);
    const countInRow = Math.min(perRow, n - row * perRow);
    const x = 50 + (col - (countInRow - 1) / 2) * (100 / (perRow + 1));
    const y = rowsTotal === 1 ? 50 : 30 + row * 40;
    out.push([x, y]);
  }
  return out;
}

export function parseQtyVariant(variantId: string | undefined): { object: string; arrangement: string } {
  const [object = 'dots', arrangement = 'line'] = (variantId ?? 'dots:line').split(':');
  return { object: OBJECTS[object] ? object : 'dots', arrangement };
}

export function QuantityCard({ n, variantId, highlight = [], onTapObject, size = '100%' }: { n: number; variantId?: string; highlight?: number[]; onTapObject?: (i: number) => void; size?: string | number }): JSX.Element {
  const { object, arrangement } = parseQtyVariant(variantId);
  const obj = OBJECTS[object]!;
  const pts = positions(n, arrangement);
  const r = n <= 3 ? 14 : n <= 6 ? 11 : 9;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="qty-card">
      {n === 0 && <ellipse cx="50" cy="60" rx="34" ry="14" fill="none" stroke="#C4C9D0" strokeWidth="3" strokeDasharray="6 5" />}
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x - r} ${y - r})`} onPointerDown={onTapObject ? () => onTapObject(i) : undefined} style={onTapObject ? { cursor: 'pointer' } : undefined}>
          {highlight.includes(i) && <circle cx={r} cy={r} r={r + 4} fill="#8fd19e" opacity="0.6" />}
          <foreignObject width={r * 2} height={r * 2}>
            <ColorShape shape={obj.shape} fill={obj.fill} size="100%" />
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}

/** Quantidade representada por um glyph ('q3' → 3, 't2' → 2, '7' → 7). */
export function quantityOf(glyph: string): number {
  return Number(glyph.replace(/^\D+/, ''));
}
