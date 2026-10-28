import { AudioService } from '../audio/AudioService';
import { COLORS } from './colors';
import { L6_WORDS, LETTER_NAMES, WORD_BANK } from './letters';
import { NUMBER_NAMES } from './numbers';
import { fill, SPEECH } from './speech';

/**
 * Lista completa das gravações que o app espera (arquivo → texto). É a MESMA função usada pelo
 * gerador de áudio e pelo app, para que catálogo e gravações nunca saiam de sincronia.
 * Frases com o nome da criança ({nick}) e as do detetive com {word} ficam de fora de propósito:
 * o nome nunca é gravado; com gravações ligadas o app usa as versões ".plain".
 */
export interface SpeechFile {
  file: string;
  text: string;
}

export function expectedSpeechFiles(): SpeechFile[] {
  const out = new Map<string, string>();
  const add = (key: string, vars: Record<string, string> = {}): void => {
    out.set(AudioService.fileKey(key, vars), fill(SPEECH[key]!, vars));
  };
  const colorNames = COLORS.map((c) => c.name);
  const letterNames = Object.values(LETTER_NAMES);
  const numberNames = Object.values(NUMBER_NAMES);
  const l6words = Object.values(L6_WORDS).flat();
  const bankWords = WORD_BANK.map((w) => w.toLowerCase());

  for (const key of Object.keys(SPEECH)) {
    const tpl = SPEECH[key]!;
    // Variáveis únicas: "{name}. {name}!" conta uma vez (senão a frase era pulada).
    const vars = [...new Set([...tpl.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))];
    if (vars.length === 0) {
      add(key);
      continue;
    }
    if (vars.includes('nick')) continue;
    const only = (v: string): boolean => vars.length === 1 && vars[0] === v;
    if (only('name')) {
      const pool = key.includes('color') || key === 'instr.placement' ? colorNames
        : key.includes('letter') || key === 'instr.train' || key === 'instr.pair' ? letterNames
        : key.includes('number') || key.includes('numeral') || key.includes('qty') || key.includes('count') || key.includes('trace') ? numberNames
        : [];
      for (const n of pool) add(key, { name: n });
    } else if (only('word')) {
      if (key.startsWith('instr.detective') || key === 'detective.done') continue;
      const pool = key === 'instr.box' || key === 'tapped.word' || key === 'success.word' ? l6words : bankWords;
      for (const w of pool) add(key, { word: w });
    } else if (key === 'error.pair') {
      for (const [letter, words] of Object.entries(L6_WORDS)) for (const w of words) add(key, { name: LETTER_NAMES[letter]!, word: w });
    }
  }
  return [...out.entries()].map(([file, text]) => ({ file: `${file}.mp3`, text }));
}

/** Chaves que o app nunca espera gravadas (ficam com a voz do aparelho só se as gravações estiverem desligadas). */
export function isRecordableKey(key: string): boolean {
  const tpl = SPEECH[key];
  if (!tpl) return false;
  if (tpl.includes('{nick}')) return false;
  if ((key.startsWith('instr.detective') || key === 'detective.done') && tpl.includes('{word}')) return false;
  return true;
}
