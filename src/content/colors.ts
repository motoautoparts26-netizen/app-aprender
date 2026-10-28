import type { Item, Stage, Track } from '../engine/types';

/**
 * Trilha das Cores (seção 12.1).
 *
 * Códigos escolhidos para serem inequívocos e distantes de fronteiras entre categorias.
 * O vermelho é ligeiramente mais escuro que o verde para que os dois difiram também em brilho.
 */
export interface ColorDef {
  id: string;
  name: string;
  hex: string;
  /** Contorno obrigatório sobre fundo claro (branco). */
  outline?: string;
  /** Tons que "ainda são" esta cor (C5). */
  shades: string[];
}

export const COLORS: ColorDef[] = [
  { id: 'red', name: 'vermelho', hex: '#E02020', shades: ['#F05A5A', '#F27A7A', '#B81818', '#8F1010'] },
  { id: 'blue', name: 'azul', hex: '#1F5FD6', shades: ['#5B8BE6', '#8FB0F0', '#15449E', '#0F2F6E'] },
  { id: 'yellow', name: 'amarelo', hex: '#FFD400', shades: ['#FFE266', '#FFF0A3', '#E6BE00', '#CCA800'] },
  { id: 'green', name: 'verde', hex: '#1FA83C', shades: ['#5FC46F', '#9ADBA3', '#157A2A', '#0F5A1E'] },
  { id: 'black', name: 'preto', hex: '#1A1A1A', shades: [] },
  { id: 'white', name: 'branco', hex: '#FFFFFF', outline: '#9A9A9A', shades: [] },
  { id: 'orange', name: 'laranja', hex: '#FF8A1F', shades: ['#FFA85C', '#FFC28F', '#E07010'] },
  { id: 'purple', name: 'roxo', hex: '#7A3FBF', shades: ['#A06FD6', '#C39BE6', '#5C2E99', '#43226F'] },
  { id: 'pink', name: 'rosa', hex: '#FF6FAE', shades: ['#FF9BC7', '#FFC2DE', '#E6508F'] },
  { id: 'brown', name: 'marrom', hex: '#8B5A2B', shades: ['#A9743F', '#C4915E', '#6B4420', '#4E3017'] },
  { id: 'gray', name: 'cinza', hex: '#8E8E8E', shades: ['#B5B5B5', '#D0D0D0', '#6A6A6A', '#4A4A4A'] },
];

/**
 * Pares de confusão de CATEGORIA: cores vizinhas que uma criança típica mistura.
 * Nunca aparecem juntas na tela antes de C5. Não incluem os pares de daltonismo:
 * vermelho e verde são muito distintos para a criança típica e precisam aparecer
 * juntos para que o alerta de visão de cores tenha dados (seção 15).
 */
export const COLOR_CATEGORY_PAIRS: [string, string][] = [
  ['blue', 'purple'],
  ['orange', 'yellow'],
  ['pink', 'purple'],
  ['gray', 'white'],
  ['red', 'pink'],
  ['orange', 'brown'],
];

/** Pares típicos de deficiência de visão de cores (deuteranopia/protanopia). Só para o alerta. */
export const CVD_PAIRS: [string, string][] = [
  ['red', 'green'],
  ['red', 'brown'],
  ['green', 'brown'],
];

/**
 * Variantes: forma geométrica, objeto de cor típica, objeto de cor arbitrária.
 * A chave é um identificador do SVG em src/content/svg. Mínimo 4 por cor.
 */
const VARIANTS: Record<string, string[]> = {
  red: ['circle', 'square', 'apple', 'strawberry', 'car', 'balloon'],
  blue: ['circle', 'square', 'whale', 'raindrop', 'car', 'balloon'],
  yellow: ['circle', 'square', 'sun', 'banana', 'car', 'balloon'],
  green: ['circle', 'square', 'leaf', 'frog', 'car', 'balloon'],
  black: ['circle', 'square', 'cat', 'tire', 'car', 'balloon'],
  white: ['circle', 'square', 'cloud', 'egg', 'car', 'balloon'],
  orange: ['circle', 'square', 'orange-fruit', 'carrot', 'car', 'balloon'],
  purple: ['circle', 'square', 'grapes', 'eggplant', 'car', 'balloon'],
  pink: ['circle', 'square', 'pig', 'flower', 'car', 'balloon'],
  brown: ['circle', 'square', 'bear', 'tree-trunk', 'car', 'balloon'],
  gray: ['circle', 'square', 'elephant', 'rock', 'car', 'balloon'],
};

function confusable(id: string): string[] {
  const out: string[] = [];
  for (const [a, b] of COLOR_CATEGORY_PAIRS) {
    if (a === id) out.push(b);
    if (b === id) out.push(a);
  }
  return out;
}

function colorItem(id: string, stageId: string, variants = VARIANTS[id] ?? ['circle']): Item {
  return {
    id,
    trackId: 'colors',
    stageId,
    glyph: id,
    pool: 'color',
    variants,
    steps: ['match', 'recognize', 'recall'],
    gatingSteps: ['match', 'recognize'],
    confusableWith: confusable(id),
    prereqItemIds: [],
    speechKey: `color.${id}`,
  };
}

const C1 = ['red', 'blue'];
const C2 = ['yellow', 'green'];
const C3 = ['black', 'white'];
const C4 = ['orange', 'purple', 'pink', 'brown'];

/**
 * C5: cinza + tons das cores já dominadas. Cada tom é uma variante de um item "shade-<cor>",
 * cujo glyph é a cor (para nunca ficar junto do item base na tela).
 */
const C5_SHADE_COLORS = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown'];

/** C6: classificar por cor com formas misturadas. Um item por cor, variantes = formas diferentes. */
const C6_COLORS = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
const MIXED_SHAPES = ['triangle', 'star', 'heart', 'hexagon', 'moon'];

export function buildColorsTrack(): { track: Track; items: Item[] } {
  const items: Item[] = [];
  const stage = (
    id: string,
    order: number,
    title: string,
    itemIds: string[],
    extra: Partial<Stage> = {},
  ): Stage => ({ id, trackId: 'colors', order, title, itemIds, placement: true, ...extra });

  for (const c of C1) items.push(colorItem(c, 'C1'));
  for (const c of C2) items.push(colorItem(c, 'C2'));
  for (const c of C3) items.push(colorItem(c, 'C3'));
  for (const c of C4) items.push(colorItem(c, 'C4'));

  items.push(colorItem('gray', 'C5'));
  for (const c of C5_SHADE_COLORS) {
    const def = COLORS.find((d) => d.id === c);
    items.push({
      ...colorItem(`shade-${c}`, 'C5', (def?.shades ?? []).map((hex) => `shade:${hex}`)),
      glyph: c,
      prereqItemIds: [c],
      speechKey: `color.${c}`,
    });
  }

  for (const c of C6_COLORS) {
    items.push({
      ...colorItem(`sort-${c}`, 'C6', MIXED_SHAPES),
      glyph: c,
      steps: ['recognize'],
      gatingSteps: ['recognize'],
      prereqItemIds: [c],
      speechKey: `color.${c}`,
    });
  }

  const track: Track = {
    id: 'colors',
    title: 'Cores',
    stages: [
      stage('C1', 1, 'Vermelho e azul', C1),
      stage('C2', 2, 'Amarelo e verde', C2),
      stage('C3', 3, 'Preto e branco', C3),
      stage('C4', 4, 'Laranja, roxo, rosa e marrom', C4),
      stage('C5', 5, 'Cinza e tons', ['gray', ...C5_SHADE_COLORS.map((c) => `shade-${c}`)], {
        allowConfusable: true,
      }),
      stage('C6', 6, 'Separar por cor', C6_COLORS.map((c) => `sort-${c}`), {
        allowConfusable: true,
        placement: false,
      }),
    ],
  };
  return { track, items };
}
