/**
 * Verificação antes do build: todas as gravações esperadas existem em public/audio e o índice
 * está em dia. Sem isso, o app publicado misturaria vozes. Uso: npx vite-node scripts/check-audio.ts
 * Para publicar sem gravações de propósito: SEM_AUDIO=1 npm run build
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { expectedSpeechFiles } from '../src/content/speechList';

const dir = 'public/audio';
const expected = expectedSpeechFiles();

if (process.env['SEM_AUDIO'] === '1') {
  console.log('SEM_AUDIO=1: publicando sem gravações (voz do aparelho).');
  process.exit(0);
}
if (!existsSync(dir) || !existsSync(`${dir}/index.json`)) {
  console.error(`Gravações ausentes: rode tools\\gerar-audio.ps1 antes do build (esperadas: ${expected.length}).`);
  process.exit(1);
}
const present = new Set(readdirSync(dir).filter((f) => f.endsWith('.mp3')));
const missing = expected.filter((e) => !present.has(e.file) || statSync(`${dir}/${e.file}`).size < 1000);
const orphans = [...present].filter((f) => !expected.some((e) => e.file === f));
const index = JSON.parse(readFileSync(`${dir}/index.json`, 'utf8').replace(/^﻿/, '')) as string[];
const indexStale = expected.some((e) => !index.includes(e.file)) || orphans.some((o) => index.includes(o));
// Manifesto (arquivo → texto gravado): detecta frases cujo texto mudou depois da gravação.
const manifest: Record<string, string> = existsSync(`${dir}/manifest.json`)
  ? (JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8').replace(/^﻿/, '')) as Record<string, string>)
  : {};
const changed = expected.filter((e) => present.has(e.file) && manifest[e.file] !== undefined && manifest[e.file] !== e.text);

if (missing.length || orphans.length || indexStale || changed.length) {
  if (missing.length) console.error(`${missing.length} gravação(ões) faltando, ex.: ${missing.slice(0, 5).map((m) => m.file).join(', ')}`);
  if (orphans.length) console.error(`${orphans.length} gravação(ões) antiga(s) sobrando, ex.: ${orphans.slice(0, 5).join(', ')}`);
  if (changed.length) console.error(`${changed.length} gravação(ões) com texto desatualizado, ex.: ${changed.slice(0, 5).map((c) => c.file).join(', ')}`);
  if (indexStale) console.error('index.json desatualizado.');
  console.error('Rode: powershell -ExecutionPolicy Bypass -File tools\\gerar-audio.ps1');
  process.exit(1);
}
console.log(`Gravações completas: ${expected.length}/${expected.length}.`);
