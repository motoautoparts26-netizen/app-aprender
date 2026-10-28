import type { CSSProperties } from 'react';

/**
 * Ilustrações originais, simples, em SVG inline. Cada variante de cor é uma forma
 * desenhada com a cor do item. `stroke` é o contorno (obrigatório para o branco).
 */
export interface ColorShapeProps {
  shape: string;
  fill: string;
  stroke?: string;
  size?: number | string;
  style?: CSSProperties;
  /** Opção neutra: contorno tracejado, sem preenchimento. */
  neutral?: boolean;
}

export const SHAPES = [
  'circle', 'square', 'triangle', 'star', 'heart', 'hexagon', 'moon',
  'apple', 'strawberry', 'car', 'balloon', 'whale', 'raindrop', 'sun', 'banana', 'leaf', 'frog',
  'cat', 'tire', 'cloud', 'egg', 'orange-fruit', 'carrot', 'grapes', 'eggplant', 'pig', 'flower',
  'bear', 'tree-trunk', 'elephant', 'rock',
] as const;

export function ColorShape({ shape, fill, stroke, size = '100%', style, neutral }: ColorShapeProps): JSX.Element {
  const f = neutral ? 'none' : fill;
  const s = neutral ? '#BDBDBD' : stroke ?? darken(fill);
  const common = { fill: f, stroke: s, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const dash = neutral ? { strokeDasharray: '8 6' } : {};
  const detail = neutral ? 'none' : darken(fill, 0.35);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style} aria-hidden="true" focusable="false">
      <g {...common} {...dash}>
        {renderShape(shape, detail, f)}
      </g>
    </svg>
  );
}

function renderShape(shape: string, detail: string, fill: string): JSX.Element {
  switch (shape) {
    case 'square':
      return <rect x="15" y="15" width="70" height="70" rx="10" />;
    case 'triangle':
      return <polygon points="50,12 90,85 10,85" />;
    case 'star':
      return <polygon points="50,8 61,38 93,38 67,57 76,90 50,70 24,90 33,57 7,38 39,38" />;
    case 'heart':
      return <path d="M50 88 L16 54 C4 42 8 20 28 16 C38 14 46 20 50 28 C54 20 62 14 72 16 C92 20 96 42 84 54 Z" />;
    case 'hexagon':
      return <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" />;
    case 'moon':
      return <path d="M62 10 C36 14 22 36 26 58 C30 80 50 92 72 88 C56 82 44 68 44 50 C44 32 52 18 62 10 Z" />;
    case 'apple':
      return (
        <>
          <path d="M50 30 C36 18 12 26 14 54 C16 76 34 92 50 86 C66 92 84 76 86 54 C88 26 64 18 50 30 Z" />
          <path d="M50 30 C50 20 54 12 60 8" fill="none" stroke="#5A3A1A" strokeWidth="4" />
          <path d="M52 22 C58 14 68 14 72 18 C66 24 58 26 52 22 Z" fill="#3E9A42" stroke="#2E7A32" />
        </>
      );
    case 'strawberry':
      return (
        <>
          <path d="M50 26 C26 26 14 44 20 62 C26 80 40 92 50 92 C60 92 74 80 80 62 C86 44 74 26 50 26 Z" />
          <path d="M30 26 C40 16 60 16 70 26 C62 30 56 30 50 24 C44 30 38 30 30 26 Z" fill="#3E9A42" stroke="#2E7A32" />
          {[[40, 48], [58, 46], [48, 62], [64, 64], [36, 68], [52, 78]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#FFF3B0" stroke="none" />
          ))}
        </>
      );
    case 'car':
      return (
        <>
          <path d="M12 60 L20 42 L36 30 L66 30 L80 44 L90 48 L90 68 L12 68 Z" />
          <rect x="36" y="34" width="26" height="12" rx="3" fill="#CFEFFF" stroke={detail} />
          <circle cx="30" cy="70" r="9" fill="#2B2B2B" stroke="#111" />
          <circle cx="72" cy="70" r="9" fill="#2B2B2B" stroke="#111" />
        </>
      );
    case 'balloon':
      return (
        <>
          <ellipse cx="50" cy="40" rx="28" ry="34" />
          <polygon points="46,74 54,74 50,80" />
          <path d="M50 80 C44 88 56 92 50 98" fill="none" stroke="#555" strokeWidth="2" />
        </>
      );
    case 'whale':
      return (
        <>
          <path d="M12 56 C14 36 36 28 60 32 C80 36 92 46 90 58 C88 70 70 76 50 74 C32 72 14 70 12 56 Z" />
          <path d="M86 50 C92 42 96 34 94 26 C90 32 86 36 84 42 C82 36 80 32 76 28 C76 38 80 46 86 50 Z" />
          <circle cx="30" cy="50" r="3" fill="#222" stroke="none" />
          <path d="M60 30 C58 22 62 16 66 12" fill="none" stroke="#9ED8FF" strokeWidth="3" />
        </>
      );
    case 'raindrop':
      return <path d="M50 8 C50 8 20 46 20 62 C20 80 34 92 50 92 C66 92 80 80 80 62 C80 46 50 8 50 8 Z" />;
    case 'sun':
      return (
        <>
          <circle cx="50" cy="50" r="24" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 50 + Math.cos(a) * 32;
            const y1 = 50 + Math.sin(a) * 32;
            const x2 = 50 + Math.cos(a) * 44;
            const y2 = 50 + Math.sin(a) * 44;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="5" />;
          })}
        </>
      );
    case 'banana':
      return <path d="M18 30 C20 60 44 84 76 84 C84 84 90 80 90 76 C66 78 44 60 36 28 C32 22 18 22 18 30 Z" />;
    case 'leaf':
      return (
        <>
          <path d="M20 80 C18 40 46 14 86 14 C88 54 60 82 20 80 Z" />
          <path d="M22 78 C40 60 58 44 80 20" fill="none" stroke={detail} strokeWidth="2.5" />
        </>
      );
    case 'frog':
      return (
        <>
          <ellipse cx="50" cy="60" rx="34" ry="24" />
          <circle cx="32" cy="36" r="11" />
          <circle cx="68" cy="36" r="11" />
          <circle cx="32" cy="36" r="5" fill="#fff" stroke="none" />
          <circle cx="68" cy="36" r="5" fill="#fff" stroke="none" />
          <circle cx="33" cy="37" r="2.5" fill="#222" stroke="none" />
          <circle cx="69" cy="37" r="2.5" fill="#222" stroke="none" />
          <path d="M36 66 Q50 76 64 66" fill="none" stroke={detail} strokeWidth="3" />
        </>
      );
    case 'cat':
      return (
        <>
          <circle cx="50" cy="56" r="30" />
          <polygon points="26,36 22,10 44,26" />
          <polygon points="74,36 78,10 56,26" />
          <circle cx="40" cy="52" r="3.5" fill="#FFE37A" stroke="none" />
          <circle cx="60" cy="52" r="3.5" fill="#FFE37A" stroke="none" />
          <polygon points="50,60 46,64 54,64" fill="#F28CB0" stroke="none" />
          <path d="M20 62 L36 64 M20 72 L36 68 M80 62 L64 64 M80 72 L64 68" stroke="#999" strokeWidth="2" />
        </>
      );
    case 'tire':
      return (
        <>
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="18" fill="#D9D9D9" stroke="#888" />
          <circle cx="50" cy="50" r="6" fill="#777" stroke="none" />
        </>
      );
    case 'cloud':
      return <path d="M28 76 C14 76 10 60 20 54 C16 40 32 32 42 40 C46 24 70 22 74 40 C88 38 94 56 84 64 C90 74 80 80 72 76 Z" />;
    case 'egg':
      return <path d="M50 10 C30 10 20 44 20 60 C20 78 34 92 50 92 C66 92 80 78 80 60 C80 44 70 10 50 10 Z" />;
    case 'orange-fruit':
      return (
        <>
          <circle cx="50" cy="54" r="36" />
          <path d="M50 18 C52 10 60 8 66 10 C62 14 56 18 50 18 Z" fill="#3E9A42" stroke="#2E7A32" />
          <circle cx="40" cy="46" r="1.8" fill={detail} stroke="none" />
          <circle cx="58" cy="40" r="1.8" fill={detail} stroke="none" />
          <circle cx="62" cy="62" r="1.8" fill={detail} stroke="none" />
        </>
      );
    case 'carrot':
      return (
        <>
          <path d="M34 30 L66 30 L54 92 L46 92 Z" />
          <path d="M50 30 C44 20 36 16 30 18 C36 22 40 26 44 30 M50 30 C50 18 54 10 60 8 C58 16 56 24 54 30 M50 30 C56 22 64 18 72 20 C66 24 60 28 56 30" fill="none" stroke="#3E9A42" strokeWidth="4" />
          <path d="M42 48 L56 48 M44 62 L54 62 M47 76 L52 76" stroke={detail} strokeWidth="2" />
        </>
      );
    case 'grapes':
      return (
        <>
          {[[50, 26], [36, 40], [64, 40], [50, 46], [30, 58], [70, 58], [50, 64], [40, 78], [60, 78]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="11" />
          ))}
          <path d="M50 18 C52 10 56 8 62 6" fill="none" stroke="#5A3A1A" strokeWidth="4" />
        </>
      );
    case 'eggplant':
      return (
        <>
          <path d="M36 26 C20 30 14 52 22 70 C30 88 56 94 72 84 C88 74 86 50 70 36 C60 28 48 24 36 26 Z" />
          <path d="M30 26 C34 16 44 14 52 18 C46 22 40 26 36 30 Z" fill="#3E9A42" stroke="#2E7A32" />
          <path d="M34 20 C30 14 28 10 28 6" fill="none" stroke="#2E7A32" strokeWidth="4" />
        </>
      );
    case 'pig':
      return (
        <>
          <ellipse cx="50" cy="56" rx="34" ry="28" />
          <polygon points="24,36 20,18 38,30" />
          <polygon points="76,36 80,18 62,30" />
          <ellipse cx="50" cy="66" rx="12" ry="8" fill={detail} stroke="none" />
          <circle cx="45" cy="66" r="2.5" fill="#5A2A3A" stroke="none" />
          <circle cx="55" cy="66" r="2.5" fill="#5A2A3A" stroke="none" />
          <circle cx="38" cy="50" r="3" fill="#222" stroke="none" />
          <circle cx="62" cy="50" r="3" fill="#222" stroke="none" />
        </>
      );
    case 'flower':
      return (
        <>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3;
            return <ellipse key={i} cx={50 + Math.cos(a) * 22} cy={50 + Math.sin(a) * 22} rx="13" ry="18" transform={`rotate(${(i * 60)} ${50 + Math.cos(a) * 22} ${50 + Math.sin(a) * 22})`} />;
          })}
          <circle cx="50" cy="50" r="12" fill="#FFD400" stroke="#CCA800" />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="26" cy="28" r="12" />
          <circle cx="74" cy="28" r="12" />
          <circle cx="50" cy="56" r="34" />
          <ellipse cx="50" cy="68" rx="14" ry="10" fill="#E8C9A0" stroke={detail} />
          <circle cx="50" cy="64" r="4" fill="#222" stroke="none" />
          <circle cx="38" cy="48" r="3.5" fill="#222" stroke="none" />
          <circle cx="62" cy="48" r="3.5" fill="#222" stroke="none" />
        </>
      );
    case 'tree-trunk':
      return (
        <>
          <rect x="30" y="20" width="40" height="70" rx="6" />
          <ellipse cx="50" cy="20" rx="20" ry="8" fill={detail} />
          <ellipse cx="50" cy="20" rx="12" ry="4.5" fill={fill} stroke={detail} />
          <path d="M38 40 C40 56 36 70 40 84 M60 36 C58 52 62 66 58 80" fill="none" stroke={detail} strokeWidth="2" />
        </>
      );
    case 'elephant':
      return (
        <>
          <circle cx="54" cy="46" r="28" />
          <ellipse cx="24" cy="46" rx="14" ry="20" />
          <path d="M60 68 C62 80 58 90 50 94 C56 96 66 92 68 80 C70 74 68 70 66 68 Z" />
          <circle cx="60" cy="40" r="3" fill="#222" stroke="none" />
        </>
      );
    case 'rock':
      return <path d="M18 74 C10 60 20 40 36 34 C50 28 66 30 78 40 C90 50 90 68 80 78 C66 84 32 84 18 74 Z" />;
    case 'circle':
    default:
      return <circle cx="50" cy="50" r="38" />;
  }
}

/** Escurece um hex para o contorno. */
export function darken(hex: string, amount = 0.25): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#555';
  const n = parseInt(m[1]!, 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
