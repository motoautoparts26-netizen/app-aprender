import type { Trial } from '../engine/types';
import { db, DEFAULT_SETTINGS, type OffscreenRecord, type Profile, type Settings } from './db';

export function newId(prefix = 'id'): string {
  const rnd = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}-${Date.now().toString(36)}-${rnd[0]!.toString(36)}${rnd[1]!.toString(36)}`;
}

const NAME_RE = /^[\p{L} '-]{1,30}$/u;

export function isValidName(name: string): boolean {
  return NAME_RE.test(name.trim());
}

// ---------- settings ----------
export async function loadSettings(): Promise<Settings> {
  const row = await db.settings.get('settings');
  return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await db.settings.put({ key: 'settings', value: next });
  return next;
}

// ---------- profiles ----------
export async function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy('createdAt').toArray();
}

export async function createProfile(input: { name: string; nickname: string; avatar: string }): Promise<Profile> {
  const name = input.name.trim();
  const nickname = (input.nickname || name).trim();
  if (!isValidName(name) || !isValidName(nickname)) throw new Error('Nome inválido');
  const profile: Profile = { id: newId('prof'), name, nickname, avatar: input.avatar, createdAt: Date.now() };
  await db.profiles.add(profile);
  return profile;
}

export async function updateProfile(id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<void> {
  if (patch.name !== undefined && !isValidName(patch.name)) throw new Error('Nome inválido');
  if (patch.nickname !== undefined && !isValidName(patch.nickname)) throw new Error('Apelido inválido');
  await db.profiles.update(id, patch);
}

export async function deleteProfile(id: string): Promise<void> {
  await db.transaction('rw', db.profiles, db.trials, db.offscreen, async () => {
    await db.trials.where('profileId').equals(id).delete();
    await db.offscreen.where('profileId').equals(id).delete();
    await db.profiles.delete(id);
  });
}

/** Apaga só o progresso, mantendo o perfil (modo de desenvolvedor). */
export async function resetProfileProgress(id: string): Promise<void> {
  await db.transaction('rw', db.trials, db.offscreen, async () => {
    await db.trials.where('profileId').equals(id).delete();
    await db.offscreen.where('profileId').equals(id).delete();
  });
}

// ---------- trials ----------
export async function loadTrials(profileId: string): Promise<Trial[]> {
  return db.trials.where('[profileId+timestamp]').between([profileId, 0], [profileId, Infinity]).toArray();
}

export async function addTrial(trial: Trial): Promise<void> {
  await db.trials.add(trial);
}

export async function addTrials(trials: Trial[]): Promise<void> {
  await db.trials.bulkAdd(trials);
}

// ---------- offscreen ----------
export async function listOffscreen(profileId: string): Promise<OffscreenRecord[]> {
  return db.offscreen.where('profileId').equals(profileId).toArray();
}

export async function addOffscreen(rec: Omit<OffscreenRecord, 'id'>): Promise<void> {
  await db.offscreen.add({ ...rec, id: newId('off') });
}
