import type { Trial } from '../engine/types';
import { db, type OffscreenRecord, type Profile, type Settings } from './db';
import { loadSettings, saveSettings } from './repo';

/** Formato do arquivo de backup (seção 15 e 20). Legível, sem nada executável. */
export interface BackupFile {
  app: 'app-aprender';
  version: 1;
  exportedAt: number;
  profiles: Profile[];
  trials: Trial[];
  offscreen: OffscreenRecord[];
  settings: Partial<Settings>;
}

export const BACKUP_MAX_BYTES = 20 * 1024 * 1024;

export async function buildBackup(): Promise<BackupFile> {
  const settings = await loadSettings();
  const { devMode: _d, clockOffsetMs: _c, ...rest } = settings;
  return {
    app: 'app-aprender',
    version: 1,
    exportedAt: Date.now(),
    profiles: await db.profiles.toArray(),
    trials: await db.trials.toArray(),
    offscreen: await db.offscreen.toArray(),
    settings: rest,
  };
}

export async function exportBackup(): Promise<{ blob: Blob; filename: string }> {
  const data = await buildBackup();
  const json = JSON.stringify(data, null, 1);
  const date = new Date().toISOString().slice(0, 10);
  await saveSettings({ lastBackupAt: Date.now() });
  return { blob: new Blob([json], { type: 'application/json' }), filename: `aprender-backup-${date}.json` };
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length <= 200;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function validProfile(p: unknown): p is Profile {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return isStr(o['id']) && isStr(o['name']) && isStr(o['nickname']) && isStr(o['avatar']) && isNum(o['createdAt']) &&
    (o['familyNames'] === undefined || (Array.isArray(o['familyNames']) && o['familyNames'].every(isStr)));
}

const STEPS = new Set(['match', 'recognize', 'recall', 'recognize-qty', 'trace-guided', 'trace-dotted', 'trace-free']);
const TRACKS = new Set(['colors', 'letters', 'numbers']);

function validTrial(t: unknown): t is Trial {
  if (!t || typeof t !== 'object') return false;
  const o = t as Record<string, unknown>;
  return isStr(o['id']) && isStr(o['profileId']) && isStr(o['sessionId']) && TRACKS.has(String(o['trackId'])) &&
    isStr(o['stageId']) && isStr(o['itemId']) && STEPS.has(String(o['step'])) &&
    [0, 1, 2].includes(Number(o['helpLevel'])) && isNum(o['optionsCount']) && isStr(o['variantId']) &&
    Array.isArray(o['distractorIds']) && o['distractorIds'].every(isStr) &&
    (o['chosenId'] === null || isStr(o['chosenId'])) && isBool(o['correct']) && isBool(o['isReview']) && isBool(o['isPlacement']) &&
    isNum(o['timestamp']);
}

function validOffscreen(r: unknown): r is OffscreenRecord {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return isStr(o['id']) && isStr(o['profileId']) && isStr(o['stageId']) && isNum(o['suggestionIndex']) && isNum(o['doneAt']);
}

/** Lê e valida um arquivo. Lança Error com mensagem em português se inválido. */
export async function parseBackup(file: File): Promise<BackupFile> {
  if (file.size > BACKUP_MAX_BYTES) throw new Error('Arquivo grande demais (limite 20 MB).');
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('Este arquivo não é um backup válido (não é JSON).');
  }
  if (!data || typeof data !== 'object') throw new Error('Este arquivo não é um backup válido.');
  const o = data as Record<string, unknown>;
  if (o['app'] !== 'app-aprender' || o['version'] !== 1) throw new Error('Este arquivo não é um backup deste app.');
  const profiles = Array.isArray(o['profiles']) ? o['profiles'] : [];
  const trials = Array.isArray(o['trials']) ? o['trials'] : [];
  const offscreen = Array.isArray(o['offscreen']) ? o['offscreen'] : [];
  if (!profiles.every(validProfile)) throw new Error('Backup com perfil inválido.');
  if (!trials.every(validTrial)) throw new Error('Backup com registro de tentativa inválido.');
  if (!offscreen.every(validOffscreen)) throw new Error('Backup com registro de atividade inválido.');
  const settings = o['settings'] && typeof o['settings'] === 'object' ? (o['settings'] as Partial<Settings>) : {};
  return { app: 'app-aprender', version: 1, exportedAt: isNum(o['exportedAt']) ? o['exportedAt'] : 0, profiles, trials, offscreen, settings };
}

/** Importa somando ao que existe (mesmo id = substitui). Devolve contagens. */
export async function importBackup(b: BackupFile): Promise<{ profiles: number; trials: number }> {
  await db.transaction('rw', db.profiles, db.trials, db.offscreen, async () => {
    await db.profiles.bulkPut(b.profiles);
    await db.trials.bulkPut(b.trials);
    await db.offscreen.bulkPut(b.offscreen);
  });
  const safe: Partial<Settings> = {};
  if (isNum(b.settings.dailyLimit)) safe.dailyLimit = Math.min(4, Math.max(0, Math.round(b.settings.dailyLimit)));
  if (isBool(b.settings.adultMode)) safe.adultMode = b.settings.adultMode;
  if (Array.isArray(b.settings.enabledTracks)) safe.enabledTracks = b.settings.enabledTracks.filter((t) => TRACKS.has(t));
  if (b.settings.currentProfileId === null || isStr(b.settings.currentProfileId)) safe.currentProfileId = b.settings.currentProfileId;
  await saveSettings(safe);
  return { profiles: b.profiles.length, trials: b.trials.length };
}
