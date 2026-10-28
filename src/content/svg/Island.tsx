import type { TrackId } from '../../engine/types';

/** Ilhas da tela inicial. Ilustração original e calma. */
export function Island({ track, size = 160 }: { track: TrackId; size?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 200 160" width={size} height={size * 0.8} aria-hidden="true">
      <ellipse cx="100" cy="128" rx="90" ry="22" fill="#CFE8F7" />
      <path d="M30 120 C40 90 70 80 100 82 C130 80 160 90 170 120 Z" fill="#E9D8A6" stroke="#CDB77E" strokeWidth="2" />
      <path d="M48 112 C60 92 86 86 100 88 C118 86 142 94 152 112 Z" fill="#9BD58A" stroke="#6FB85A" strokeWidth="2" />
      {track === 'colors' && (
        <>
          <circle cx="70" cy="70" r="16" fill="#E02020" stroke="#9E1616" strokeWidth="2" />
          <circle cx="100" cy="56" r="16" fill="#1F5FD6" stroke="#153F8E" strokeWidth="2" />
          <circle cx="130" cy="70" r="16" fill="#FFD400" stroke="#B89800" strokeWidth="2" />
          <path d="M70 86 L70 100 M100 72 L100 96 M130 86 L130 100" stroke="#5A3A1A" strokeWidth="3" />
        </>
      )}
      {track === 'letters' && (
        <g fontFamily="Andika, 'Comic Neue', 'Segoe UI', sans-serif" fontWeight="700" fontSize="44" fill="#444" stroke="#fff" strokeWidth="3" paintOrder="stroke">
          <text x="46" y="92">A</text>
          <text x="86" y="78">B</text>
          <text x="128" y="92">C</text>
        </g>
      )}
      {track === 'numbers' && (
        <g fontFamily="Andika, 'Comic Neue', 'Segoe UI', sans-serif" fontWeight="700" fontSize="44" fill="#444" stroke="#fff" strokeWidth="3" paintOrder="stroke">
          <text x="50" y="92">1</text>
          <text x="86" y="78">2</text>
          <text x="124" y="92">3</text>
        </g>
      )}
      <circle cx="160" cy="30" r="14" fill="#FFE37A" />
    </svg>
  );
}

/** Avatares originais para o cadastro. */
export const AVATARS = ['sun', 'star', 'cloud', 'leaf', 'balloon', 'whale'] as const;
