import { COLORS } from './colors';
import { L6_WORDS, LETTER_NAMES, WORD_BANK } from './letters';
import { NUMBER_NAMES } from './numbers';

/**
 * Catálogo de falas (chave → texto em pt-BR). A interface só fala por chave,
 * para que qualquer fala possa ganhar um arquivo gravado em public/audio/{chave}.mp3.
 * Chaves com {nick} são preenchidas com o apelido da criança.
 */
export const SPEECH: Record<string, string> = {
  // --- início e navegação ---
  'start.tap': 'Toca na tela para começar!',
  // Saudação sem o nome da criança (decisão da responsável): uma voz só, sempre gravável.
  'home.greet': 'Olá! Que bom ter você aqui!',
  'home.pick': 'Qual ilha deseja explorar?',
  'track.colors': 'Cores',
  'track.letters': 'Letras',
  'track.numbers': 'Números',
  'limit.done': 'Por hoje acabou. Hora de brincar lá fora!',
  // Sem o nome da criança: o nome nunca é gravado e nenhuma frase do app o usa (decisão da responsável).
  'session.end': 'Você brincou muito bem hoje! Até a próxima!',
  'session.start': 'Vamos brincar!',

  // --- instruções ---
  'instr.match': 'Toca no que é igual a este.',
  'instr.match.color': 'Toca na cor igual a esta.',
  'instr.recognize.color': 'Toca no {name}.',
  'instr.recall.color': 'Que cor é essa?',
  'instr.placement': 'Vamos ver o que você já conhece. Toca no {name}.',
  'intro.color': 'Esta é a cor {name}. {name}!',
  'name.color': 'Este é o {name}.',
  'error.color': 'Este é o {name}!',
  'error.tapCorrect': 'Toca nele para continuar.',
  // Erro: o app diz SÓ o nome do que a criança tocou (aprende ouvindo) e deixa ela continuar
  // procurando; não aponta a resposta. Acerto: confirmação com o nome do item certo.
  'tapped.color': 'Esse é o {name}.',
  'tapped.letter': 'Essa é a letra {name}.',
  'tapped.word': 'Essa figura é: {word}.',
  'tapped.number': 'Esse é o {name}.',
  'tapped.qty': 'Esse tem {name}.',
  'success.color': 'Isso mesmo! Este é o {name}!',
  'success.letter': 'Isso mesmo! Esta é a letra {name}!',
  'success.word': 'Isso mesmo! Essa figura é: {word}!',
  'success.number': 'Isso mesmo! Este é o {name}!',
  'success.qty': 'Isso mesmo! Este tem {name}!',

  // --- letras ---
  'intro.letter': 'Esta é a letra {name}. {name}!',
  'name.letter': 'Esta é a letra {name}.',
  'instr.match.letter': 'Toca na letra igual a esta.',
  'instr.recognize.letter': 'Toca na letra {name}.',
  'instr.placement.letter': 'Vamos ver o que você já conhece. Toca na letra {name}.',
  'instr.recall.letter': 'Que letra é essa?',
  'error.letter': 'Esta é a letra {name}!',
  'error.tapLetter': 'Toca nela para continuar.',
  'instr.train': 'O trem vai para a estação da letra {name}. Toca na estação!',
  'train.arrive': 'Piuí! O trem chegou!',
  'instr.word': 'Vamos montar a palavra {word}. Qual letra está faltando? Toca nela.',
  'word.done': 'Olha: {word}!',
  'instr.detective': 'Vamos montar o nome {word}! Toca na letra igual à casinha vazia.',
  'instr.detective.next': 'Agora a próxima casinha.',
  'instr.detective.free': 'Monta o nome {word} sem olhar o modelo!',
  'detective.done': 'Olha! {word}!',
  'instr.detective.plain': 'Vamos montar o seu nome! Toca na letra igual à casinha vazia.',
  'instr.detective.free.plain': 'Monta o seu nome sem olhar o modelo!',
  'detective.done.plain': 'Olha! O seu nome!',
  // --- números ---
  'intro.number': 'Este é o número {name}. {name}!',
  'intro.qty': 'Olha: aqui tem {name}!',
  'name.numeral': 'Este é o número {name}.',
  'flash.look': 'Olha bem!',
  'instr.flash': 'Toca no que tem a mesma quantidade.',
  'instr.qty.recognize': 'Toca no que tem {name}.',
  'instr.placement.qty': 'Vamos ver o que você já conhece. Toca no que tem {name}.',
  'instr.count.start': 'Vamos contar! Toca em cada um.',
  'instr.count.how': 'Tem {name}! Toca no grupo que tem {name}.',
  'instr.numeral.match': 'Toca no número igual a este.',
  'instr.numeral.recognize': 'Toca no número {name}.',
  'instr.placement.numeral': 'Vamos ver o que você já conhece. Toca no número {name}.',
  'instr.numeral.qty': 'Toca no grupo que tem {name}.',
  'instr.zero.qty': 'Zero é nenhum. Toca no grupo que não tem nenhum.',
  'instr.recall.number': 'Que número é esse?',
  'error.number': 'Este é o {name}!',
  'error.qty': 'Este tem {name}!',
  'error.tapNumber': 'Toca nele para continuar.',
  'trace.demo': 'Olha como se desenha o {name}.',
  'instr.trace.guided': 'Agora é você! Começa no ponto verde e passa por cima da linha.',
  'instr.trace.dotted': 'Começa no ponto verde e segue os pontinhos.',
  'instr.trace.free': 'Começa no ponto verde e desenha o {name}.',
  'trace.ok': 'Que lindo {name}!',
  'trace.again': 'Vamos ver de novo e tentar outra vez.',

  'instr.box': 'Da caixa saiu {word}. Com qual letra começa {word}?',
  'instr.pair': 'Esta é a letra {name}. Qual figura começa com {name}? Toca nela.',
  'error.pair': 'Esta é a figura: {word}! Começa com {name}.',
  'replay.hint': 'Olha com atenção.',

  // --- elogios (sorteados) ---
  // Frases completas: vozes neurais pronunciam mal interjeições soltas ("Isso!", "Achou!").
  'praise.a': 'Isso mesmo!',
  'praise.b': 'Muito bem!',
  'praise.c': 'Você achou!',
  'praise.d': 'É isso mesmo!',
  'praise.e': 'Você olhou com atenção!',
  'praise.f': 'Boa! Você conseguiu!',
  'praise.g': 'Parabéns, acertou!',

  // --- adulto ---
  'adult.said': 'Disse certo',
  'adult.notyet': 'Ainda não',
};

for (const c of COLORS) SPEECH[`color.${c.id}`] = c.name;
for (const [l, name] of Object.entries(LETTER_NAMES)) SPEECH[`letter.${l}`] = name;
for (const [n, name] of Object.entries(NUMBER_NAMES)) SPEECH[`number.${n}`] = name;
for (const words of Object.values(L6_WORDS)) for (const w of words) SPEECH[`word.${w}`] = w;
for (const w of WORD_BANK) {
  const k = `word.${w.toLowerCase()}`;
  if (!SPEECH[k]) SPEECH[k] = w.toLowerCase();
}

export const PRAISE_KEYS = Object.keys(SPEECH).filter((k) => k.startsWith('praise.'));

export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}
