import type { AudioBackend } from './AudioService';

/**
 * Toca falas gravadas em public/audio/{chave}.mp3. A lista de arquivos existentes vem de
 * public/audio/index.json, gerado junto com os áudios (tools/gerar-audio.ps1).
 */
export class FileAudio implements AudioBackend {
  private el: HTMLAudioElement | null = null;
  private volume = 1;
  private readonly available = new Set<string>();

  constructor(private readonly base: string) {}

  /** Carrega o índice de gravações (mesma origem; funciona offline pelo precache). */
  async loadIndex(): Promise<number> {
    try {
      const res = await fetch(`${this.base}audio/index.json`, { cache: 'no-cache' });
      if (!res.ok) return 0;
      const list = (await res.json()) as unknown;
      if (Array.isArray(list)) for (const k of list) if (typeof k === 'string') this.available.add(k.replace(/\.mp3$/, ''));
      return this.available.size;
    } catch {
      return 0;
    }
  }

  has(key: string): boolean {
    return this.available.has(key);
  }

  count(): number {
    return this.available.size;
  }

  async unlock(): Promise<void> {
    // O elemento <audio> é criado dentro de um fluxo iniciado por gesto; nada a fazer aqui.
  }

  speak(_text: string, key: string): Promise<void> {
    return new Promise((resolve) => {
      this.stop();
      // As chaves só têm letras, dígitos, ponto, hífen e "@" (seguro em URL). Codificar o "@"
      // como %40 faz o servidor de desenvolvimento não achar o arquivo.
      const el = new Audio(`${this.base}audio/${key}.mp3`);
      el.volume = this.volume;
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        resolve();
      };
      el.onended = finish;
      el.onerror = finish;
      this.el = el;
      el.play().catch(finish);
      // Proteção contra áudio que nunca termina (aba em segundo plano, etc.).
      window.setTimeout(finish, 12_000);
    });
  }

  stop(): void {
    if (this.el) {
      this.el.pause();
      this.el.src = '';
      this.el = null;
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  setRate(): void {
    // arquivos gravados não mudam de velocidade
  }

  describe(): string {
    return `${this.available.size} fala(s) gravada(s)`;
  }
}
