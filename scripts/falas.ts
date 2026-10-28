/**
 * Grava tools/falas.json ([{ file, text }]) para o gerador de áudio (tools/gerar-audio.ps1).
 * A lista vem de src/content/speechList.ts, a mesma que o app usa para conferir as gravações.
 * Uso: npx vite-node scripts/falas.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { expectedSpeechFiles } from '../src/content/speechList';

const list = expectedSpeechFiles();
mkdirSync('tools', { recursive: true });
writeFileSync('tools/falas.json', JSON.stringify(list, null, 1), 'utf8');
console.log(`${list.length} falas em tools/falas.json (frases com o nome da criança ficam de fora). Exemplo: ${list[5]?.file} → "${list[5]?.text}"`);
