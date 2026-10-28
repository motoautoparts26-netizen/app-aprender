import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveState } from '../../state';
import { at, masterStage, params, sharedContent } from '../fixtures/helpers';

const content = sharedContent();

function listSources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === '__tests__') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSources(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

const ENGINE_DIR = join(process.cwd(), 'src', 'engine');

describe('Integridade do motor (seções 4.2, 15 e 20)', () => {
  it('15. o motor não lê o relógio: sem Date.now() nem new Date() sem argumento', () => {
    const files = listSources(ENGINE_DIR);
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src.includes('Date.now('), `${f} usa Date.now()`).toBe(false);
      expect(/new Date\(\s*\)/.test(src), `${f} usa new Date() sem argumento`).toBe(false);
    }
  });

  it('o motor não importa React, Dexie nem nada fora de engine/config/content', () => {
    for (const f of listSources(ENGINE_DIR)) {
      const src = readFileSync(f, 'utf8');
      const imports = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!);
      for (const imp of imports) {
        const ok = imp.startsWith('./') || imp.startsWith('../config/') || imp.startsWith('../content');
        expect(ok, `${f} importa ${imp}`).toBe(true);
      }
    }
  });

  it('14. atividades fora da tela não interferem: o estado depende só das tentativas', () => {
    // O motor não tem entrada para registros "Fizemos!": a única entrada é o log de tentativas.
    // Mesmas tentativas + mesmo instante → estado idêntico, independentemente de qualquer outro registro.
    const trials = masterStage('C1', 0);
    const a = deriveState(trials, content, params, at(4));
    const offscreenLog = Array.from({ length: 50 }, (_, i) => ({ stageId: 'C1', doneAt: at(i % 4) }));
    expect(offscreenLog).toHaveLength(50);
    const b = deriveState(trials, content, params, at(4));
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(deriveState.length).toBe(4); // (trials, content, params, now): nada mais entra
  });

  it('L6: toda palavra do banco de iniciais tem figura e começa com a letra', async () => {
    const { L6_WORDS } = await import('../../../content/letters');
    const { PICTURE_WORDS } = await import('../../../content/svg/WordPicture');
    let n = 0;
    for (const [letter, words] of Object.entries(L6_WORDS)) {
      for (const w of words) {
        n++;
        expect(PICTURE_WORDS, `figura de ${w}`).toContain(w);
        expect(w.normalize('NFD').replace(/[̀-ͯ]/g, '')[0]?.toUpperCase()).toBe(letter);
      }
    }
    expect(n).toBe(48);
  });

  it('conteúdo válido: toda etapa referencia itens existentes com variantes e pré-requisitos válidos', () => {
    expect(Object.keys(content.items).length).toBeGreaterThan(60);
    for (const stage of Object.values(content.stages)) {
      expect(stage.itemIds.length).toBeGreaterThan(0);
    }
    expect(content.tracks.letters.stages[0]?.itemIds).toEqual(['T', 'E', 'S']);
  });

  it('o nome real da criança não aparece em nenhum arquivo do projeto', () => {
    // O nome fica em tools/nome-privado.txt (ignorado pelo git), nunca no repositório.
    const privateFile = join(process.cwd(), 'tools', 'nome-privado.txt');
    if (!existsSync(privateFile)) return; // em outro computador (ou na publicação) não há nome para checar
    const names = readFileSync(privateFile, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const scan = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        if (['node_modules', '.git', 'dist', 'audio', 'tts-venv', 'amostras'].includes(n)) return [];
        const full = join(dir, n);
        return statSync(full).isDirectory() ? scan(full) : /\.(ts|tsx|md|json|ps1|yml|html|css)$/.test(n) && !full.endsWith('nome-privado.txt') ? [full] : [];
      });
    for (const f of scan(process.cwd())) {
      const src = readFileSync(f, 'utf8');
      for (const name of names) {
        expect(new RegExp(`\\b${name}\\b`, 'i').test(src), `${f} contém o nome real`).toBe(false);
      }
    }
  });
});
