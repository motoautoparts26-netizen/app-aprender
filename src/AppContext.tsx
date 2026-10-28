import { createContext, useContext } from 'react';
import type { PedagogyParams } from './config/pedagogy';
import type { Content, DerivedState, Trial } from './engine/types';
import type { Profile, Settings } from './storage/db';

export type Screen = 'start' | 'home' | 'session' | 'limit' | 'parent';

export interface AppData {
  settings: Settings;
  profiles: Profile[];
  profile: Profile | null;
  trials: Trial[];
  content: Content;
  derived: DerivedState;
  params: PedagogyParams;
  /** Hora atual (com deslocamento do modo de desenvolvedor). */
  now: () => number;
}

export interface AppActions {
  updateSettings(patch: Partial<Settings>): Promise<void>;
  reloadProfiles(): Promise<void>;
  reloadTrials(): Promise<void>;
  recordTrial(trial: Trial): Promise<void>;
  /** Força recálculo do estado derivado (ex.: depois de avançar o relógio). */
  refresh(): void;
  goto(screen: Screen, payload?: { trackId?: 'colors' | 'letters' | 'numbers' }): void;
}

export const AppCtx = createContext<(AppData & AppActions) | null>(null);

export function useApp(): AppData & AppActions {
  const v = useContext(AppCtx);
  if (!v) throw new Error('AppCtx fora do provedor');
  return v;
}
