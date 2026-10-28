import { fill, SPEECH } from '../content/speech';
import { isRecordableKey } from '../content/speechList';

export interface AudioBackend {
  /** Fala o texto. Resolve quando termina (ou é interrompida). */
  speak(text: string, key: string): Promise<void>;
  stop(): void;
  setVolume(v: number): void;
  setRate(r: number): void;
  /** Deve ser chamado num gesto do usuário para liberar o áudio. */
  unlock(): Promise<void>;
  /** Descrição da voz em uso, para o painel. */
  describe(): string;
}

/**
 * Serviço de áudio da interface. Fala por chave do catálogo. Tenta primeiro um arquivo
 * gravado (public/audio/{chave}.mp3|m4a); se não houver, usa a síntese local.
 */
export class AudioService {
  private vars: Record<string, string> = {};
  private useRecorded = true;
  private lastKey: string | null = null;
  private lastVars: Record<string, string> = {};
  private listeners = new Set<(speaking: boolean) => void>();
  private captionListeners = new Set<(text: string | null) => void>();

  constructor(
    private readonly file: AudioBackend,
    private readonly tts: AudioBackend,
    private readonly hasFile: (key: string) => boolean,
  ) {}

  /**
   * Nome do arquivo gravado para uma fala: a chave e, se houver variáveis, "@" + valores
   * normalizados (ex.: instr.recognize.color@vermelho, home.greet@apelido).
   */
  static fileKey(key: string, vars: Record<string, string>): string {
    const values = Object.values(vars).filter((v) => v);
    if (values.length === 0) return key;
    return `${key}@${values.map(slug).join('-')}`;
  }

  setVars(vars: Record<string, string>): void {
    this.vars = { ...this.vars, ...vars };
  }

  /** Painel: preferir gravações (true) ou a voz do aparelho (false). */
  setUseRecorded(v: boolean): void {
    this.useRecorded = v;
  }

  private recordingsComplete = false;

  /**
   * Com as gravações completas, a voz do aparelho NUNCA entra numa frase gravável:
   * antes misturar vozes do que falar? Não: antes não misturar. Uma frase gravável sem
   * arquivo só pode acontecer com gravações incompletas, e aí o painel avisa.
   */
  setRecordingsComplete(v: boolean): void {
    this.recordingsComplete = v;
  }

  onSpeaking(fn: (speaking: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private currentText: string | null = null;

  /** Legenda: texto da fala atual (null quando termina). Usado no modo de teste. */
  onCaption(fn: (text: string | null) => void): () => void {
    this.captionListeners.add(fn);
    if (this.currentText) fn(this.currentText); // fala já em andamento ao assinar
    return () => this.captionListeners.delete(fn);
  }

  async unlock(): Promise<void> {
    await Promise.all([this.file.unlock(), this.tts.unlock()]);
  }

  stop(): void {
    this.file.stop();
    this.tts.stop();
    this.emit(false);
  }

  setVolume(v: number): void {
    this.file.setVolume(v);
    this.tts.setVolume(v);
  }

  setRate(r: number): void {
    this.tts.setRate(r);
  }

  describe(): string {
    return this.tts.describe();
  }

  textFor(key: string, vars: Record<string, string> = {}): string {
    const raw = SPEECH[key] ?? key;
    return fill(raw, { ...this.vars, ...vars });
  }

  /** Fala uma chave do catálogo. Interrompe o que estiver tocando. */
  async say(key: string, vars: Record<string, string> = {}, remember = true): Promise<void> {
    this.stop();
    if (remember) {
      this.lastKey = key;
      this.lastVars = vars;
    }
    // Com gravações ligadas, uma frase que tem versão sem nome (".plain") gravada usa essa versão,
    // para não misturar a voz gravada com a do aparelho.
    if (this.useRecorded && SPEECH[`${key}.plain`] && this.hasFile(`${key}.plain`)) {
      key = `${key}.plain`;
      vars = {};
    }
    const text = this.textFor(key, vars);
    const merged = { ...this.vars, ...vars };
    // Variáveis que a fala realmente usa (ex.: {name}), para achar a gravação certa.
    const used: Record<string, string> = {};
    for (const m of (SPEECH[key] ?? '').matchAll(/\{(\w+)\}/g)) used[m[1]!] = merged[m[1]!] ?? '';
    const fileKey = AudioService.fileKey(key, used);
    this.emit(true);
    this.currentText = text;
    for (const fn of this.captionListeners) fn(text);
    try {
      if (this.useRecorded && this.hasFile(fileKey)) await this.file.speak(text, fileKey);
      else if (this.useRecorded && this.hasFile(key)) await this.file.speak(text, key);
      else if (this.useRecorded && this.recordingsComplete && isRecordableKey(key)) {
        // Não deveria acontecer (gravações completas). Silêncio curto em vez de outra voz.
        await new Promise((r) => setTimeout(r, 400));
      } else await this.tts.speak(text, key);
    } finally {
      this.emit(false);
      if (this.currentText === text) this.currentText = null;
      for (const fn of this.captionListeners) fn(null);
    }
  }

  /** Fala várias chaves em sequência. */
  async sayAll(keys: [string, Record<string, string>?][]): Promise<void> {
    for (const [k, v] of keys) await this.say(k, v ?? {}, false);
    const last = keys[keys.length - 1];
    if (last) {
      this.lastKey = last[0];
      this.lastVars = last[1] ?? {};
    }
  }

  /** Botão "ouvir de novo": repete a última instrução. */
  async replay(): Promise<void> {
    if (this.lastKey) await this.say(this.lastKey, this.lastVars);
  }

  private emit(speaking: boolean): void {
    for (const fn of this.listeners) fn(speaking);
  }
}

/** "Vermelho!" → "vermelho"; "Maçã" → "maca". Só letras, números e hífen. */
export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
