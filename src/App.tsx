import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx, type Screen } from './AppContext';
import { audio, audioReady, tts } from './audio';
import { Home } from './child/Home';
import { LimitScreen } from './child/LimitScreen';
import { SessionScreen } from './child/SessionScreen';
import { StartScreen } from './child/StartScreen';
import { clock } from './clock';
import { DEFAULT_PEDAGOGY } from './config/pedagogy';
import { buildContent } from './content';
import { deriveState } from './engine/state';
import type { TrackId, Trial } from './engine/types';
import { FreePlay } from './parent/FreePlay';
import { ParentPanel } from './parent/ParentPanel';
import { DEFAULT_SETTINGS, type Profile, type Settings } from './storage/db';
import { requestPersistentStorage } from './storage/persist';
import { addTrial, listProfiles, loadSettings, loadTrials, saveSettings } from './storage/repo';

export function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('start');
  // Modo livre de teste: link com #teste (nada gravado, sem limites).
  const [freePlay, setFreePlay] = useState(() => window.location.hash === '#teste');
  useEffect(() => {
    const onHash = (): void => setFreePlay(window.location.hash === '#teste');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const [trackId, setTrackId] = useState<TrackId>('colors');
  const [tick, setTick] = useState(0);

  const profile = useMemo(
    () => profiles.find((p) => p.id === settings.currentProfileId) ?? profiles[0] ?? null,
    [profiles, settings.currentProfileId],
  );

  // Carga inicial
  useEffect(() => {
    void (async () => {
      const s = await loadSettings();
      clock.setOffsetMs(s.clockOffsetMs);
      audio.setVolume(s.volume);
      audio.setRate(s.speechRate);
      tts.setPreferredVoice(s.voiceName);
      audio.setUseRecorded(s.useRecorded);
      setSettings(s);
      setProfiles(await listProfiles());
      await audioReady;
      setLoaded(true);
      void requestPersistentStorage();
    })();
  }, []);

  const reloadTrials = useCallback(async () => {
    if (!profile) return setTrials([]);
    setTrials(await loadTrials(profile.id));
  }, [profile]);

  useEffect(() => {
    void reloadTrials();
  }, [reloadTrials]);

  useEffect(() => {
    if (profile) audio.setVars({ nick: profile.nickname, name: profile.name });
  }, [profile]);

  const content = useMemo(
    () => buildContent({ childName: profile?.name ?? '', enabledTracks: settings.enabledTracks }),
    [profile?.name, settings.enabledTracks],
  );

  const derived = useMemo(
    () => deriveState(trials, content, DEFAULT_PEDAGOGY, clock.now()),
    // tick força recálculo quando o relógio simulado muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trials, content, tick],
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
    if (patch.clockOffsetMs !== undefined) clock.setOffsetMs(patch.clockOffsetMs);
    if (patch.volume !== undefined) audio.setVolume(patch.volume);
    if (patch.speechRate !== undefined) audio.setRate(patch.speechRate);
    if (patch.voiceName !== undefined) tts.setPreferredVoice(patch.voiceName);
    if (patch.useRecorded !== undefined) audio.setUseRecorded(patch.useRecorded);
    setTick((t) => t + 1);
  }, []);

  const reloadProfiles = useCallback(async () => setProfiles(await listProfiles()), []);

  const recordTrial = useCallback(async (trial: Trial) => {
    await addTrial(trial);
    setTrials((prev) => [...prev, trial]);
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const goto = useCallback((s: Screen, payload?: { trackId?: TrackId }) => {
    if (payload?.trackId) setTrackId(payload.trackId);
    audio.stop();
    setScreen(s);
  }, []);

  if (!loaded) return <div className="screen">…</div>;

  const value = {
    settings, profiles, profile, trials, content, derived, params: DEFAULT_PEDAGOGY, now: clock.now,
    updateSettings, reloadProfiles, reloadTrials, recordTrial, refresh, goto,
  };

  // Sem perfil: o painel abre direto no cadastro.
  const needsProfile = profiles.length === 0;

  return (
    <AppCtx.Provider value={value}>
      {freePlay && !needsProfile ? (
        <FreePlay onExit={() => { window.location.hash = ''; setFreePlay(false); }} />
      ) : screen === 'parent' || needsProfile ? (
        <ParentPanel firstRun={needsProfile} />
      ) : screen === 'start' ? (
        <StartScreen />
      ) : screen === 'home' ? (
        <Home />
      ) : screen === 'limit' ? (
        <LimitScreen />
      ) : (
        <SessionScreen trackId={trackId} />
      )}
    </AppCtx.Provider>
  );
}
