/** Coruja Lulu: ilustração original do tema noite (docs/referencia-lulu.html, corujaG). */
export type LuluHumor = 'normal' | 'feliz' | 'sono';

const P = '#1B1B2F';
const COR = '#8B5CF6';
const BARRIGA = '#CBB6FB'; // COR clareada 55%
const ASA = '#6C48C0'; // COR escurecida 22%
const BICO = '#F59E0B';

function Olhos({ humor }: { humor: LuluHumor }): JSX.Element {
  const discos = (
    <>
      <circle cx="41" cy="60" r="19" fill="#fff" />
      <circle cx="79" cy="60" r="19" fill="#fff" />
    </>
  );
  if (humor === 'feliz' || humor === 'sono') {
    // feliz: arcos para cima; sono: arcos para baixo (olhos fechados)
    const [a, b] = humor === 'feliz' ? ['M31 64 Q41 50 51 64', 'M69 64 Q79 50 89 64'] : ['M31 60 Q41 70 51 60', 'M69 60 Q79 70 89 60'];
    return (
      <>
        {discos}
        <path d={a} stroke={P} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d={b} stroke={P} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      {discos}
      <circle cx="43" cy="62" r="9" fill={P} />
      <circle cx="81" cy="62" r="9" fill={P} />
      <circle cx="46" cy="58" r="3" fill="#fff" />
      <circle cx="84" cy="58" r="3" fill="#fff" />
    </>
  );
}

/** A Lulu, opcionalmente pousada num galho. `size` é a largura em px (ou valor CSS). */
export function Lulu({ humor = 'normal', size = 120, galho = false }: { humor?: LuluHumor; size?: number | string; galho?: boolean }): JSX.Element {
  const viewBox = galho ? '-24 0 168 166' : '0 0 120 150';
  return (
    <svg viewBox={viewBox} width={size} style={{ height: 'auto', display: 'block', overflow: 'visible' }} aria-hidden="true">
      {galho && (
        <>
          <rect x="-24" y="146" width="168" height="14" rx="7" fill="#6E4527" />
          <path d="M120 146 q14 -18 30 -14 q-10 16 -30 14z" fill="#3F9461" />
        </>
      )}
      <polygon points="18,30 30,4 44,26" fill={ASA} />
      <polygon points="102,30 90,4 76,26" fill={ASA} />
      <ellipse cx="60" cy="82" rx="46" ry="58" fill={COR} />
      <ellipse cx="16" cy="94" rx="12" ry="30" fill={ASA} transform="rotate(12 16 94)" />
      <ellipse cx="104" cy="94" rx="12" ry="30" fill={ASA} transform="rotate(-12 104 94)" />
      <ellipse cx="60" cy="104" rx="30" ry="32" fill={BARRIGA} />
      <path d="M46 98 q4 5 8 0 M62 98 q4 5 8 0 M54 110 q4 5 8 0 M44 116 q4 5 8 0 M64 116 q4 5 8 0" stroke={ASA} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Olhos humor={humor} />
      {humor === 'feliz' ? (
        <>
          <polygon points="53,74 67,74 60,88" fill={BICO} />
          <path d="M55 79 Q60 84 65 79" stroke="#B45309" strokeWidth="2" fill="none" />
          <circle cx="27" cy="80" r="7" fill="#F59BB9" opacity=".85" />
          <circle cx="93" cy="80" r="7" fill="#F59BB9" opacity=".85" />
        </>
      ) : (
        <polygon points="54,74 66,74 60,86" fill={BICO} />
      )}
      {humor === 'sono' && (
        <g fill="#F7E6A1" fontFamily="Andika, sans-serif" fontWeight="700">
          <text x="94" y="24" fontSize="22">z</text>
          <text x="105" y="10" fontSize="15">z</text>
        </g>
      )}
      <path d="M44 138 l-4 8 M48 139 l0 9 M52 138 l4 8 M68 138 l-4 8 M72 139 l0 9 M76 138 l4 8" stroke={BICO} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
