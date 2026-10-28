import Dexie, { type Table } from 'dexie';
import type { TrackId, Trial } from '../engine/types';

export interface Profile {
  id: string;
  /** Primeiro nome (usado em L1). Até 30 caracteres. */
  name: string;
  /** Como o narrador chama a criança. */
  nickname: string;
  /** Chave do avatar (ilustração original). */
  avatar: string;
  /** Outros nomes da família para o detetive do nome (até 6). */
  familyNames?: string[];
  createdAt: number;
}

export interface Settings {
  currentProfileId: string | null;
  dailyLimit: number;
  adultMode: boolean;
  enabledTracks: TrackId[];
  volume: number;
  speechRate: number;
  /** Nome da voz escolhida pelo responsável; null = automática (pt-BR, feminina). */
  voiceName: string | null;
  /** Tocar as falas gravadas (quando existirem) em vez da voz do aparelho. */
  useRecorded: boolean;
  devMode: boolean;
  /** Deslocamento do relógio em ms (modo de desenvolvedor). */
  clockOffsetMs: number;
  lastBackupAt: number | null;
}

export interface SettingsRow {
  key: 'settings';
  value: Settings;
}

export interface OffscreenRecord {
  id: string;
  profileId: string;
  stageId: string;
  suggestionIndex: number;
  doneAt: number;
}

export const DEFAULT_SETTINGS: Settings = {
  currentProfileId: null,
  dailyLimit: 2,
  adultMode: false,
  enabledTracks: ['colors', 'letters', 'numbers'],
  volume: 1,
  speechRate: 0.9,
  voiceName: null,
  useRecorded: true,
  devMode: false,
  clockOffsetMs: 0,
  lastBackupAt: null,
};

class AppDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  trials!: Table<Trial, string>;
  settings!: Table<SettingsRow, string>;
  offscreen!: Table<OffscreenRecord, string>;

  constructor() {
    super('app-aprender');
    this.version(1).stores({
      profiles: 'id, createdAt',
      trials: 'id, profileId, [profileId+timestamp], sessionId',
      settings: 'key',
      offscreen: 'id, profileId',
    });
  }
}

export const db = new AppDatabase();
