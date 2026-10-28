/** Cores neutras das letras (seção 12.2: a letra não "tem" cor). */
export const INK: Record<string, string> = { ink: '#1A1A1A', slate: '#3F4A5A', navy: '#1F2F5A' };
const SIZE: Record<string, string> = { 'size-l': '1', 'size-m': '0.78', 'size-s': '0.6' };

export function parseLetterVariant(variantId: string | undefined): { scale: string; color: string; inWord: boolean } {
  if (!variantId || variantId === 'in-word') return { scale: '0.9', color: INK['ink']!, inWord: variantId === 'in-word' };
  const [size, ink] = variantId.split(':');
  return { scale: SIZE[size ?? 'size-l'] ?? '1', color: INK[ink ?? 'ink'] ?? INK['ink']!, inWord: false };
}

export function randomInk(): string {
  const keys = Object.keys(INK);
  return INK[keys[Math.floor(Math.random() * keys.length)]!]!;
}

/** Uma letra grande em Andika. `scale` relativo ao tamanho do cartão. */
export function LetterTile({ letter, color = INK['ink']!, scale = '1', dotted = false }: { letter: string; color?: string; scale?: string; dotted?: boolean }): JSX.Element {
  return (
    <span
      className={`letter${dotted ? ' dotted' : ''}`}
      style={{ color: dotted ? 'transparent' : color, fontSize: `calc(var(--letter-size) * ${scale})`, ...(dotted ? { WebkitTextStroke: '2px #9A9A9A' } : {}) }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/** Palavra com uma letra destacada (variante "em palavra"). */
export function WordWithLetter({ word, letter, color }: { word: string; letter: string; color: string }): JSX.Element {
  const idx = word.indexOf(letter);
  return (
    <span className="word-row" aria-hidden="true">
      {[...word].map((ch, i) => (
        <span key={i} className="letter" style={{ color: i === idx ? color : '#C4C9D0', fontSize: 'calc(var(--letter-size) * 0.55)' }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
