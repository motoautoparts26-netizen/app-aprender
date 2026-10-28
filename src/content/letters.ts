import type { Item, Stage, Track } from '../engine/types';

/**
 * Trilha das Letras (seção 12.2). Maiúsculas de imprensa, fonte Andika.
 * A trilha depende do nome da criança (L1), por isso é construída por função.
 */

/** Nome da letra em português, para o narrador. */
export const LETTER_NAMES: Record<string, string> = {
  A: 'á', B: 'bê', C: 'cê', D: 'dê', E: 'é', F: 'éfe', G: 'gê', H: 'agá', I: 'i', J: 'jota',
  K: 'cá', L: 'éle', M: 'eme', N: 'ene', O: 'ó', P: 'pê', Q: 'quê', R: 'erre', S: 'ésse', T: 'tê',
  U: 'u', V: 'vê', W: 'dáblio', X: 'xis', Y: 'ípsilon', Z: 'zê',
};

/** Pares confundíveis. Nunca juntos na tela antes de L5. */
export const LETTER_PAIRS: [string, string][] = [
  ['M', 'N'], ['E', 'F'], ['P', 'R'], ['B', 'D'], ['C', 'G'], ['I', 'L'], ['V', 'W'], ['O', 'Q'],
  ['Z', 'N'], ['H', 'N'],
];

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const L3_BASE = ['S', 'T', 'L', 'C', 'V', 'X', 'Z', 'H'];
const L4A_BASE = ['J', 'K', 'Q', 'Y', 'W', 'F'];
const L4B_BASE = ['M', 'P', 'B', 'R', 'D', 'N', 'G'];
/** Pares de contraste da L5. */
const L5_PAIRS: [string, string][] = [
  ['M', 'N'], ['E', 'F'], ['P', 'R'], ['B', 'D'], ['C', 'G'], ['I', 'L'], ['V', 'W'], ['O', 'Q'],
];

/**
 * L6: letra e som inicial. Só letras com som inicial regular. Cada palavra é uma variante;
 * a UI mostra a figura e o narrador diz a palavra.
 */
export const L6_WORDS: Record<string, string[]> = {
  B: ['bola', 'banana', 'bolo', 'barco'],
  D: ['dado', 'dedo', 'dente', 'dinossauro'],
  F: ['faca', 'foca', 'fogo', 'flor'],
  J: ['jacaré', 'janela', 'jipe', 'jarra'],
  L: ['lua', 'leão', 'lápis', 'livro'],
  M: ['mão', 'mala', 'melancia', 'maçã'],
  N: ['nuvem', 'navio', 'ninho', 'neve'],
  P: ['pato', 'pão', 'pipa', 'peixe'],
  R: ['rato', 'roda', 'rei', 'rosa'],
  T: ['tomate', 'tesoura', 'telefone', 'tartaruga'],
  V: ['vaca', 'vela', 'vaso', 'vassoura'],
  Z: ['zebra', 'zero', 'zíper', 'zangão'],
};

/**
 * Banco de palavras curtas para "montar palavra copiando o modelo" e para a variante "em palavra".
 * Maiúsculas, sem acento, 3 a 5 letras, conhecidas por crianças de 4 anos.
 */
export const WORD_BANK: string[] = [
  'BOLA', 'GATO', 'PATO', 'SAPO', 'MALA', 'CASA', 'DADO', 'VACA', 'FACA', 'LUA', 'SOL', 'MAR', 'UVA', 'OVO',
  'RATO', 'LOBO', 'FOCA', 'TATU', 'MOLA', 'PIPA', 'VELA', 'ROSA', 'BOCA', 'DEDO', 'NUVEM', 'BOLO', 'PAO', 'MAO',
  'CAMA', 'COPO', 'SUCO', 'PE', 'RUA', 'ASA', 'OSSO', 'BEBE', 'LEAO', 'TIGRE', 'ZEBRA', 'JIPE', 'KIWI', 'YOGA', 'WAFER',
  'FADA', 'FOGO', 'JACA', 'LAPIS', 'MACACO', 'NAVIO', 'PEIXE', 'RODA', 'REI', 'TOMATE', 'VASO', 'ZERO', 'HOJE', 'HORA', 'QUEIJO',
];

/** Palavras do banco que contêm a letra e só usam letras já apresentadas. */
export function wordsFor(letter: string, allowed: ReadonlySet<string>, maxLen = 5): string[] {
  return WORD_BANK.filter((w) => w.length <= maxLen && w.includes(letter) && [...w].every((ch) => allowed.has(ch)));
}

/** Variantes de letra: tamanho × cor neutra; contexto "em palavra" só a partir de L3. */
const LETTER_VARIANTS_BASIC = ['size-l:ink', 'size-m:slate', 'size-s:navy', 'size-l:slate'];
const LETTER_VARIANTS_FULL = [...LETTER_VARIANTS_BASIC, 'in-word'];

const MAX_L1_LETTERS = 6;

/** Normaliza o nome: primeiro nome, maiúsculas, sem acento/cedilha, só A–Z, letras únicas. */
export function lettersFromName(rawName: string): string[] {
  const first = rawName.trim().split(/\s+/)[0] ?? '';
  const ascii = first
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ç/gi, 'c')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of ascii) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  // Se o nome tem as duas letras de um par confundível, a L1 fica com a primeira na ordem do nome.
  const kept: string[] = [];
  for (const ch of out) {
    const partnerKept = LETTER_PAIRS.some(
      ([a, b]) => (a === ch && kept.includes(b)) || (b === ch && kept.includes(a)),
    );
    if (!partnerKept) kept.push(ch);
  }
  return kept.slice(0, MAX_L1_LETTERS);
}

export function confusableLetters(letter: string): string[] {
  const out: string[] = [];
  for (const [a, b] of LETTER_PAIRS) {
    if (a === letter) out.push(b);
    if (b === letter) out.push(a);
  }
  return out;
}

function letterItem(letter: string, stageId: string, variants: string[]): Item {
  return {
    id: letter,
    trackId: 'letters',
    stageId,
    glyph: letter,
    pool: 'letter',
    variants,
    steps: ['match', 'recognize', 'recall'],
    gatingSteps: ['match', 'recognize'],
    confusableWith: confusableLetters(letter),
    prereqItemIds: [],
    speechKey: `letter.${letter}`,
  };
}

export function buildLettersTrack(childName: string): { track: Track; items: Item[] } {
  const items: Item[] = [];
  const placed = new Set<string>();
  const stage = (
    id: string,
    order: number,
    title: string,
    itemIds: string[],
    extra: Partial<Stage> = {},
  ): Stage => ({ id, trackId: 'letters', order, title, itemIds, placement: true, ...extra });

  const addLetters = (stageId: string, letters: string[], variants: string[]): string[] => {
    const ids: string[] = [];
    for (const l of letters) {
      if (placed.has(l)) continue;
      placed.add(l);
      items.push(letterItem(l, stageId, variants));
      ids.push(l);
    }
    return ids;
  };

  const l1 = addLetters('L1', lettersFromName(childName), LETTER_VARIANTS_BASIC);
  const l2 = addLetters('L2', VOWELS, LETTER_VARIANTS_BASIC);
  const l3 = addLetters('L3', L3_BASE, LETTER_VARIANTS_FULL);
  const l4a = addLetters('L4a', L4A_BASE, LETTER_VARIANTS_FULL);
  const l4b = addLetters('L4b', L4B_BASE, LETTER_VARIANTS_FULL);

  // L5: cada letra do par vira um item de contraste "<letra>@L5", liberado quando as duas estão dominadas.
  const l5: string[] = [];
  for (const [a, b] of L5_PAIRS) {
    for (const l of [a, b]) {
      const id = `${l}@L5`;
      items.push({
        ...letterItem(l, 'L5', LETTER_VARIANTS_FULL),
        id,
        steps: ['recognize'],
        gatingSteps: ['recognize'],
        prereqItemIds: [a, b],
        speechKey: `letter.${l}`,
      });
      l5.push(id);
    }
  }

  // L6: som inicial. Opções são figuras de palavras; o item é a letra.
  const l6: string[] = [];
  for (const [l, words] of Object.entries(L6_WORDS)) {
    const id = `init-${l}`;
    items.push({
      id,
      trackId: 'letters',
      stageId: 'L6',
      glyph: l,
      pool: 'initial-sound',
      variants: words,
      steps: ['recognize'],
      gatingSteps: ['recognize'],
      confusableWith: [],
      prereqItemIds: [l],
      speechKey: `letter.${l}`,
    });
    l6.push(id);
  }

  const stages: Stage[] = [];
  let order = 1;
  if (l1.length > 0) stages.push(stage('L1', order++, 'Letras do meu nome', l1));
  if (l2.length > 0) stages.push(stage('L2', order++, 'Vogais', l2));
  if (l3.length > 0) stages.push(stage('L3', order++, 'Consoantes bem diferentes', l3));
  if (l4a.length > 0) stages.push(stage('L4a', order++, 'Mais consoantes', l4a));
  if (l4b.length > 0) stages.push(stage('L4b', order++, 'Últimas consoantes', l4b));
  stages.push(stage('L5', order++, 'Letras parecidas', l5, { allowConfusable: true, placement: false }));
  // L6 mostra figuras de palavras, não letras: a regra de pares visualmente parecidos não se aplica.
  stages.push(stage('L6', order++, 'Letra e som', l6, { placement: false, allowConfusable: true }));

  return { track: { id: 'letters', title: 'Letras', stages }, items };
}
