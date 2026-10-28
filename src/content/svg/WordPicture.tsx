/**
 * Figuras originais das 48 palavras da etapa L6 (letra e som inicial), em SVG simples.
 * Estilo único: contorno cinza-escuro, cores do app, poucos detalhes, legível em 64 px.
 */
const S = '#4A4A4A';
const C = {
  red: '#E02020', blue: '#1F5FD6', yellow: '#FFD400', green: '#1FA83C', orange: '#FF8A1F', purple: '#7A3FBF',
  pink: '#FF6FAE', brown: '#8B5A2B', gray: '#8E8E8E', white: '#FFFFFF', skin: '#F2C9A0', sky: '#CFE8F7', dark: '#2B2B2B',
  wood: '#C89B5E', leaf: '#5FC46F', sand: '#F2E2B0',
};

const base = { stroke: S, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const eye = (x: number, y: number, r = 2.5): JSX.Element => <circle cx={x} cy={y} r={r} fill={C.dark} stroke="none" />;

const PICS: Record<string, () => JSX.Element> = {
  // ---- B ----
  bola: () => <><circle cx="50" cy="52" r="36" fill={C.red} /><path d="M20 30 C40 44 60 44 80 30 M20 74 C40 60 60 60 80 74" fill="none" stroke={C.white} strokeWidth="4" /></>,
  // Banana: cacho fechado, pontas marrons e vinco; bem diferente da lua (que tem rosto e estrelas).
  banana: () => <><path d="M14 36 C22 66 48 86 80 86 C88 86 92 82 92 78 C64 80 40 62 30 30 C28 24 22 22 18 24 C14 26 13 30 14 36 Z" fill={C.yellow} /><path d="M30 34 C40 60 60 76 84 80" fill="none" stroke="#C9A200" strokeWidth="2.5" /><path d="M14 30 C14 26 18 22 22 24 L24 30 Z" fill={C.brown} stroke="none" /><path d="M86 80 L92 78 L92 84 Z" fill={C.brown} stroke="none" /></>,
  bolo: () => <><rect x="16" y="52" width="68" height="34" rx="8" fill={C.pink} /><rect x="16" y="52" width="68" height="12" rx="6" fill={C.white} /><rect x="48" y="24" width="4" height="22" fill={C.blue} stroke="none" /><ellipse cx="50" cy="20" rx="5" ry="8" fill={C.orange} stroke="none" /></>,
  barco: () => <><path d="M12 62 L88 62 L74 84 L26 84 Z" fill={C.brown} /><rect x="48" y="18" width="4" height="44" fill={C.dark} stroke="none" /><path d="M52 20 L80 56 L52 56 Z" fill={C.white} /><path d="M8 88 C20 80 30 96 42 88 C54 80 64 96 76 88 C84 84 90 90 94 88" fill="none" stroke={C.blue} strokeWidth="4" /></>,
  // ---- D ----
  dado: () => <><rect x="18" y="18" width="64" height="64" rx="12" fill={C.white} />{[[34, 34], [66, 34], [50, 50], [34, 66], [66, 66]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill={C.dark} stroke="none" />)}</>,
  dedo: () => <><path d="M34 90 L34 44 C34 32 40 24 48 24 C56 24 62 32 62 44 L62 90 Z" fill={C.skin} /><path d="M38 34 C44 30 52 30 58 34" fill="none" /><rect x="40" y="36" width="16" height="12" rx="4" fill="#FADFC8" /></>,
  dente: () => <path d="M28 20 C14 20 12 44 20 60 C26 72 26 90 34 90 C42 90 42 68 50 68 C58 68 58 90 66 90 C74 90 74 72 80 60 C88 44 86 20 72 20 C62 20 58 26 50 26 C42 26 38 20 28 20 Z" fill={C.white} />,
  dinossauro: () => <><path d="M14 66 C14 46 32 40 48 42 L60 30 C66 22 80 22 84 32 L80 44 L66 48 L66 60 C70 72 60 82 44 82 C30 82 14 80 14 66 Z" fill={C.green} /><path d="M38 40 L42 30 L46 40 M50 40 L54 32 L58 40" fill={C.leaf} /><rect x="30" y="80" width="10" height="10" fill={C.green} /><rect x="54" y="80" width="10" height="10" fill={C.green} />{eye(72, 32)}</>,
  // ---- F ----
  faca: () => <><path d="M14 70 L62 22 C70 16 80 22 76 32 L34 74 Z" fill={C.gray} /><rect x="10" y="66" width="30" height="14" rx="5" transform="rotate(-45 25 73)" fill={C.brown} /></>,
  foca: () => <><path d="M90 76 C86 56 74 44 56 44 C38 44 22 54 18 70 C14 80 24 84 34 80 L40 86 L52 80 C62 84 76 84 90 76 Z" fill={C.gray} /><circle cx="26" cy="52" r="14" fill={C.gray} />{eye(22, 50)}<circle cx="14" cy="56" r="3" fill={C.dark} stroke="none" /><path d="M40 86 L34 94 L48 90 Z" fill={C.gray} /><circle cx="24" cy="30" r="8" fill={C.red} /></>,
  fogo: () => <><path d="M50 10 C58 26 72 34 72 56 C72 74 62 88 50 88 C38 88 28 74 28 56 C28 44 36 36 38 30 C40 40 46 44 48 42 C44 30 46 18 50 10 Z" fill={C.orange} /><path d="M50 50 C56 60 60 66 58 74 C56 82 44 82 42 74 C40 66 46 60 50 50 Z" fill={C.yellow} stroke="none" /></>,
  flor: () => <>{[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx={50 + Math.cos((a * Math.PI) / 180) * 20} cy={46 + Math.sin((a * Math.PI) / 180) * 20} rx="12" ry="16" transform={`rotate(${a} ${50 + Math.cos((a * Math.PI) / 180) * 20} ${46 + Math.sin((a * Math.PI) / 180) * 20})`} fill={C.pink} />)}<circle cx="50" cy="46" r="11" fill={C.yellow} /><path d="M50 62 L50 92" stroke={C.green} strokeWidth="4" /></>,
  // ---- J ----
  jacaré: () => <><path d="M8 58 C10 46 30 40 48 42 L90 42 C94 42 94 52 90 52 L52 56 C46 64 60 72 52 76 L20 76 C10 76 6 66 8 58 Z" fill={C.green} />{eye(42, 46)}<path d="M56 48 L60 52 L64 48 L68 52 L72 48 L76 52 L80 48" fill="none" stroke={C.white} strokeWidth="2.5" /></>,
  janela: () => <><rect x="18" y="14" width="64" height="72" rx="4" fill={C.wood} /><rect x="26" y="22" width="48" height="56" fill={C.sky} /><path d="M50 22 L50 78 M26 50 L74 50" /></>,
  jipe: () => <><path d="M10 62 L10 44 L30 44 L38 30 L70 30 L74 44 L90 44 L90 62 Z" fill={C.green} /><rect x="42" y="34" width="22" height="10" fill={C.sky} /><circle cx="28" cy="66" r="10" fill={C.dark} /><circle cx="72" cy="66" r="10" fill={C.dark} /><circle cx="28" cy="66" r="4" fill={C.gray} stroke="none" /><circle cx="72" cy="66" r="4" fill={C.gray} stroke="none" /></>,
  jarra: () => <><path d="M30 24 L70 24 L66 86 L34 86 Z" fill={C.sky} /><path d="M70 36 C86 36 86 60 70 60" fill="none" /><rect x="26" y="18" width="48" height="8" rx="3" fill={C.gray} /></>,
  // ---- L ----
  // Lua: céu escuro com estrelas, crescente pálido com rostinho dormindo.
  lua: () => <><rect x="4" y="4" width="92" height="92" rx="14" fill="#1F2F5A" stroke="none" /><path d="M66 14 C40 18 24 40 28 62 C32 84 54 94 76 88 C58 84 46 70 46 52 C46 34 54 20 66 14 Z" fill="#FFF3B0" stroke="#D9C46A" /><path d="M58 46 Q62 44 66 46 M60 60 Q66 64 70 60" fill="none" stroke="#8A7A3A" strokeWidth="2.5" />{[[18, 22], [84, 30], [80, 70], [16, 78]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" fill="#FFF3B0" stroke="none" />)}</>,
  leão: () => <><circle cx="50" cy="52" r="38" fill={C.orange} /><circle cx="50" cy="54" r="24" fill={C.yellow} />{eye(42, 50)}{eye(58, 50)}<path d="M46 60 L54 60 L50 65 Z" fill={C.brown} stroke="none" /><path d="M42 68 Q50 74 58 68" fill="none" /></>,
  lápis: () => <><rect x="40" y="10" width="20" height="56" fill={C.yellow} /><path d="M40 66 L50 90 L60 66 Z" fill={C.skin} /><path d="M46 80 L50 90 L54 80 Z" fill={C.dark} stroke="none" /><rect x="40" y="10" width="20" height="10" fill={C.pink} /></>,
  livro: () => <><path d="M14 20 L48 26 L48 86 L14 80 Z" fill={C.blue} /><path d="M86 20 L52 26 L52 86 L86 80 Z" fill={C.blue} /><path d="M22 34 L40 37 M22 46 L40 49 M60 37 L78 34 M60 49 L78 46" stroke={C.white} strokeWidth="2.5" /></>,
  // ---- M ----
  mão: () => <><path d="M30 92 L30 50 C30 44 38 44 38 50 L38 30 C38 24 46 24 46 30 L46 24 C46 18 54 18 54 24 L54 30 C54 24 62 24 62 30 L62 46 C62 40 72 40 72 48 L70 76 C68 86 60 92 50 92 Z" fill={C.skin} /></>,
  mala: () => <><rect x="14" y="34" width="72" height="50" rx="8" fill={C.brown} /><path d="M38 34 L38 24 L62 24 L62 34" fill="none" /><rect x="14" y="52" width="72" height="8" fill={C.wood} stroke="none" /></>,
  melancia: () => <><path d="M10 40 C20 76 80 76 90 40 Z" fill={C.red} /><path d="M10 40 C20 76 80 76 90 40" fill="none" stroke={C.green} strokeWidth="8" />{[[36, 50], [50, 56], [64, 50], [50, 44]].map(([x, y]) => <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2.5" ry="4" fill={C.dark} stroke="none" />)}</>,
  maçã: () => <><path d="M50 30 C36 18 12 26 14 54 C16 76 34 92 50 86 C66 92 84 76 86 54 C88 26 64 18 50 30 Z" fill={C.red} /><path d="M50 30 C50 20 54 12 60 8" fill="none" stroke={C.brown} strokeWidth="4" /><path d="M52 22 C58 14 68 14 72 18 C66 24 58 26 52 22 Z" fill={C.green} /></>,
  // ---- N ----
  nuvem: () => <path d="M28 76 C14 76 10 60 20 54 C16 40 32 32 42 40 C46 24 70 22 74 40 C88 38 94 56 84 64 C90 74 80 80 72 76 Z" fill={C.white} />,
  navio: () => <><path d="M10 60 L90 60 L78 84 L22 84 Z" fill={C.red} /><rect x="30" y="40" width="40" height="20" fill={C.white} /><rect x="44" y="26" width="12" height="14" fill={C.gray} /><path d="M8 90 C20 84 30 96 42 90 C54 84 64 96 76 90 C84 86 90 92 94 90" fill="none" stroke={C.blue} strokeWidth="4" /></>,
  ninho: () => <><path d="M14 56 C14 80 86 80 86 56 Z" fill={C.brown} /><path d="M14 56 C30 48 70 48 86 56" fill="none" stroke={C.wood} strokeWidth="5" /><ellipse cx="38" cy="50" rx="9" ry="11" fill={C.sky} /><ellipse cx="60" cy="50" rx="9" ry="11" fill={C.sky} /></>,
  neve: () => <>{[0, 60, 120].map((a) => <g key={a} transform={`rotate(${a} 50 50)`}><path d="M50 10 L50 90 M50 22 L42 30 M50 22 L58 30 M50 78 L42 70 M50 78 L58 70" stroke={C.blue} strokeWidth="4" /></g>)}<circle cx="50" cy="50" r="6" fill={C.sky} stroke={C.blue} /></>,
  // ---- P ----
  pato: () => <><ellipse cx="46" cy="62" rx="30" ry="20" fill={C.yellow} /><circle cx="68" cy="40" r="14" fill={C.yellow} /><path d="M80 40 L94 44 L80 48 Z" fill={C.orange} />{eye(72, 37)}<path d="M20 60 C14 52 22 46 30 54" fill={C.yellow} /></>,
  pão: () => <><path d="M14 60 C14 40 30 32 50 32 C70 32 86 40 86 60 C86 74 70 80 50 80 C30 80 14 74 14 60 Z" fill={C.wood} /><path d="M34 46 L44 54 M48 42 L58 50 M62 46 L72 54" fill="none" stroke={C.brown} strokeWidth="2.5" /></>,
  pipa: () => <><path d="M50 10 L84 46 L50 70 L16 46 Z" fill={C.purple} /><path d="M50 10 L50 70 M16 46 L84 46" /><path d="M50 70 C44 78 56 84 50 92" fill="none" /></>,
  peixe: () => <><path d="M18 50 C30 30 60 26 76 50 C60 74 30 70 18 50 Z" fill={C.blue} /><path d="M76 50 L92 36 L92 64 Z" fill={C.blue} />{eye(32, 46)}<path d="M44 40 C50 46 50 54 44 60" fill="none" stroke={C.white} strokeWidth="2.5" /></>,
  // ---- R ----
  rato: () => <><ellipse cx="54" cy="60" rx="30" ry="22" fill={C.gray} /><circle cx="34" cy="38" r="12" fill={C.gray} /><circle cx="62" cy="34" r="12" fill={C.gray} /><circle cx="34" cy="38" r="6" fill={C.pink} stroke="none" /><circle cx="62" cy="34" r="6" fill={C.pink} stroke="none" />{eye(44, 56)}<circle cx="24" cy="64" r="3" fill={C.pink} stroke="none" /><path d="M84 62 C96 60 96 76 86 78" fill="none" /></>,
  roda: () => <><circle cx="50" cy="50" r="40" fill={C.dark} /><circle cx="50" cy="50" r="22" fill={C.gray} /><circle cx="50" cy="50" r="7" fill={C.dark} />{[0, 60, 120].map((a) => <path key={a} d="M50 28 L50 72" transform={`rotate(${a} 50 50)`} />)}</>,
  rei: () => <><circle cx="50" cy="58" r="26" fill={C.skin} /><path d="M24 40 L24 18 L36 30 L50 14 L64 30 L76 18 L76 40 Z" fill={C.yellow} />{eye(42, 56)}{eye(58, 56)}<path d="M42 68 Q50 74 58 68" fill="none" /></>,
  rosa: () => <><circle cx="50" cy="42" r="22" fill={C.red} /><path d="M38 34 C44 28 56 28 62 34 M34 44 C42 52 58 52 66 44" fill="none" stroke="#9E1616" strokeWidth="2.5" /><path d="M50 64 L50 92" stroke={C.green} strokeWidth="4" /><path d="M50 76 C40 70 36 72 34 80 C42 82 48 80 50 76 Z" fill={C.green} /></>,
  // ---- T ----
  tomate: () => <><circle cx="50" cy="56" r="34" fill={C.red} /><path d="M50 22 L44 10 M50 22 L58 12 M50 22 L38 16 M50 22 L62 18" stroke={C.green} strokeWidth="4" /></>,
  tesoura: () => <><circle cx="30" cy="74" r="12" fill={C.red} /><circle cx="66" cy="74" r="12" fill={C.red} /><path d="M36 64 L76 12 M60 64 L20 12" stroke={C.gray} strokeWidth="7" /></>,
  telefone: () => <><path d="M26 16 C40 16 44 30 40 40 L34 46 C40 60 54 70 64 74 L70 66 C78 62 90 70 88 80 C84 92 60 90 36 64 C12 40 14 18 26 16 Z" fill={C.green} /></>,
  tartaruga: () => <><ellipse cx="50" cy="56" rx="32" ry="22" fill={C.green} /><path d="M30 46 L50 36 L70 46 L62 66 L38 66 Z" fill={C.leaf} /><circle cx="84" cy="56" r="10" fill={C.leaf} />{eye(86, 54)}<rect x="24" y="72" width="12" height="10" rx="4" fill={C.leaf} /><rect x="60" y="72" width="12" height="10" rx="4" fill={C.leaf} /></>,
  // ---- V ----
  vaca: () => <><ellipse cx="50" cy="56" rx="34" ry="26" fill={C.white} /><circle cx="36" cy="46" r="9" fill={C.dark} stroke="none" /><ellipse cx="62" cy="64" rx="10" ry="7" fill={C.dark} stroke="none" /><ellipse cx="50" cy="72" rx="12" ry="7" fill={C.pink} />{eye(44, 48)}{eye(60, 48)}<path d="M24 36 C20 28 26 26 30 32 M76 36 C80 28 74 26 70 32" fill="none" /></>,
  vela: () => <><rect x="38" y="36" width="24" height="52" rx="4" fill={C.white} /><rect x="48" y="26" width="4" height="12" fill={C.dark} stroke="none" /><path d="M50 10 C56 18 56 26 50 28 C44 26 44 18 50 10 Z" fill={C.orange} /></>,
  vaso: () => <><path d="M26 40 L74 40 L66 88 L34 88 Z" fill={C.brown} /><rect x="22" y="32" width="56" height="10" rx="3" fill={C.wood} /><path d="M50 32 L50 14" stroke={C.green} strokeWidth="4" /><ellipse cx="42" cy="18" rx="8" ry="5" fill={C.green} /><ellipse cx="58" cy="18" rx="8" ry="5" fill={C.green} /></>,
  vassoura: () => <><path d="M60 8 L36 60" stroke={C.wood} strokeWidth="6" /><path d="M24 58 L50 58 L58 90 L16 90 Z" fill={C.yellow} /><path d="M30 70 L26 88 M38 68 L36 88 M46 70 L48 88" fill="none" stroke={C.orange} strokeWidth="2" /></>,
  // ---- Z ----
  zebra: () => <><ellipse cx="50" cy="58" rx="34" ry="24" fill={C.white} />{[26, 38, 50, 62, 74].map((x) => <path key={x} d={`M${x} 36 L${x - 4} 80`} stroke={C.dark} strokeWidth="5" />)}<circle cx="80" cy="44" r="12" fill={C.white} />{eye(84, 42)}</>,
  zero: () => <text x="50" y="80" textAnchor="middle" fontFamily="Andika, sans-serif" fontWeight="700" fontSize="80" fill={C.blue} stroke="none">0</text>,
  zíper: () => <><rect x="38" y="8" width="24" height="84" fill={C.blue} /><path d="M50 12 L50 70" stroke={C.gray} strokeWidth="6" />{[20, 32, 44, 56].map((y) => <path key={y} d={`M44 ${y} L56 ${y}`} stroke={C.white} strokeWidth="2" />)}<rect x="44" y="68" width="12" height="14" rx="3" fill={C.gray} /></>,
  zangão: () => <><ellipse cx="50" cy="58" rx="28" ry="20" fill={C.yellow} />{[40, 52, 64].map((x) => <path key={x} d={`M${x} 40 L${x} 76`} stroke={C.dark} strokeWidth="6" />)}<circle cx="24" cy="54" r="12" fill={C.yellow} />{eye(20, 52)}<ellipse cx="44" cy="34" rx="14" ry="8" fill={C.sky} /><ellipse cx="64" cy="34" rx="14" ry="8" fill={C.sky} /></>,
};

export function hasPicture(word: string): boolean {
  return word in PICS;
}

/** Figura de uma palavra. Se não existir desenho, mostra a palavra escrita (nunca quebra). */
export function WordPicture({ word, size = '100%' }: { word: string; size?: number | string }): JSX.Element {
  const draw = PICS[word];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <g {...base}>{draw ? draw() : <text x="50" y="58" textAnchor="middle" fontSize="18" fill={S} stroke="none">{word}</text>}</g>
    </svg>
  );
}

export const PICTURE_WORDS = Object.keys(PICS);
