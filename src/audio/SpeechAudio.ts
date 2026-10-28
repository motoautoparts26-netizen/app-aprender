import type { AudioBackend } from './AudioService';

/**
 * Síntese de voz do navegador, SÓ com vozes locais (`localService === true`), porque as
 * vozes remotas enviam o texto para servidores de terceiros (seção 20).
 */
export class SpeechAudio implements AudioBackend {
  private voice: SpeechSynthesisVoice | null = null;
  private preferredName: string | null = null;
  private volume = 1;
  private rate = 0.9;
  private current: SpeechSynthesisUtterance | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.loadVoices();
  }

  /** Vozes locais disponíveis, pt primeiro, para o seletor do painel. */
  listLocalVoices(): SpeechSynthesisVoice[] {
    if (!SpeechAudio.isSupported()) return [];
    return window.speechSynthesis
      .getVoices()
      .filter((v) => v.localService)
      .sort((a, b) => Number(/^pt/i.test(b.lang)) - Number(/^pt/i.test(a.lang)) || a.name.localeCompare(b.name));
  }

  /** Escolha do responsável (nome da voz) ou null para automático. */
  setPreferredVoice(name: string | null): void {
    this.preferredName = name;
    const voices = SpeechAudio.isSupported() ? window.speechSynthesis.getVoices() : [];
    if (voices.length) this.voice = chooseVoice(voices, name);
  }

  currentVoiceName(): string | null {
    return this.voice?.name ?? null;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private loadVoices(): Promise<void> {
    if (!SpeechAudio.isSupported()) return Promise.resolve();
    return new Promise((resolve) => {
      const pick = (): boolean => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return false;
        this.voice = chooseVoice(voices, this.preferredName);
        return true;
      };
      if (pick()) return resolve();
      const onChange = (): void => {
        if (pick()) {
          window.speechSynthesis.removeEventListener('voiceschanged', onChange);
          resolve();
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', onChange);
      // Alguns navegadores nunca disparam o evento: não trava o app.
      setTimeout(() => {
        pick();
        resolve();
      }, 1500);
    });
  }

  async unlock(): Promise<void> {
    if (!SpeechAudio.isSupported()) return;
    await this.ready;
    // Fala vazia num gesto do usuário: libera o áudio e aquece a voz.
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }

  speak(text: string): Promise<void> {
    if (!SpeechAudio.isSupported()) return Promise.resolve();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      if (this.voice) u.voice = this.voice;
      u.rate = this.rate;
      u.volume = this.volume;
      let started = false;
      let finished = false;
      const done = (): void => {
        if (finished) return;
        finished = true;
        if (this.current === u) this.current = null;
        resolve();
      };
      u.onstart = () => {
        started = true;
      };
      u.onend = done;
      u.onerror = done;
      this.current = u;
      // O Chrome às vezes fica "pausado" depois de um cancel(); resume() destrava.
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(u);
      // As vigias só agem sobre ESTA fala, e só se ela ainda for a atual: uma vigia antiga
      // nunca pode cancelar a fala seguinte.
      const giveUp = (): void => {
        if (finished) return;
        if (this.current === u) window.speechSynthesis.cancel();
        done();
      };
      // Voz lenta para começar (SAPI no Windows pode levar mais de 1 s): espera até 4 s pelo início.
      // Sem voz instalada, o navegador dispara 'error' e `done` resolve na hora.
      if (!this.voice) {
        giveUp();
        return;
      }
      setTimeout(() => {
        if (!started) giveUp();
      }, 4000);
      // Proteção: se o navegador "engolir" o evento de fim, libera depois de um tempo proporcional.
      setTimeout(giveUp, 4000 + text.length * 120);
    });
  }

  stop(): void {
    if (!SpeechAudio.isSupported()) return;
    this.current = null;
    window.speechSynthesis.cancel();
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  setRate(r: number): void {
    this.rate = Math.max(0.5, Math.min(1.5, r));
  }

  describe(): string {
    if (!SpeechAudio.isSupported()) return 'Este navegador não tem síntese de voz.';
    if (!this.voice) return 'Nenhuma voz local disponível. Instale uma voz em português nas configurações do aparelho.';
    const ptBR = /pt[-_]BR/i.test(this.voice.lang);
    return `${this.voice.name} (${this.voice.lang}, local)${ptBR ? '' : ' — não é pt-BR; instale uma voz em português do Brasil'}`;
  }

  hasLocalPtBr(): boolean {
    return !!this.voice && /pt[-_]BR/i.test(this.voice.lang);
  }
}

/**
 * Nomes de vozes femininas pt-BR conhecidas (Windows, Android, iOS, Chrome OS). A API não informa
 * o gênero da voz, então a preferência é por nome.
 */
const FEMALE_HINTS = /maria|francisca|luciana|vit[óo]ria|camila|let[íi]cia|fernanda|yara|thalita|brenda|elza|manuela|giovanna|female|feminin|mulher|\bf\b/i;
const MALE_HINTS = /daniel|antonio|ant[ôo]nio|donato|fabio|f[áa]bio|humberto|julio|j[úu]lio|nicolau|valerio|val[ée]rio|male|masculin|homem|\bm\b/i;

/**
 * Melhor voz local: pt-BR > pt > qualquer; dentro disso, feminina e de melhor qualidade.
 * Nunca remota. Se o responsável escolheu uma voz no painel, ela vence.
 */
export function chooseVoice(voices: SpeechSynthesisVoice[], preferredName?: string | null): SpeechSynthesisVoice | null {
  const local = voices.filter((v) => v.localService);
  if (preferredName) {
    const chosen = local.find((v) => v.name === preferredName);
    if (chosen) return chosen;
  }
  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0;
    if (/pt[-_]BR/i.test(v.lang)) s += 100;
    else if (/^pt/i.test(v.lang)) s += 50;
    if (FEMALE_HINTS.test(v.name) && !MALE_HINTS.test(v.name)) s += 20;
    if (/natural|neural|premium|enhanced|online/i.test(v.name)) s += 10;
    if (v.default) s += 1;
    return s;
  };
  return local.sort((a, b) => score(b) - score(a))[0] ?? null;
}
