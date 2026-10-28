import { expectedSpeechFiles } from '../content/speechList';
import { AudioService } from './AudioService';
import { FileAudio } from './FileAudio';
import { SpeechAudio } from './SpeechAudio';

export const files = new FileAudio(import.meta.env.BASE_URL);
export const tts = new SpeechAudio();

/** Instância única do narrador: gravação (se existir) → síntese local. */
export const audio = new AudioService(files, tts, (key) => files.has(key));

/** Gravações esperadas que não existem no índice. Vazio = completo. */
export function missingRecordings(): string[] {
  return expectedSpeechFiles().map((e) => e.file.replace(/\.mp3$/, '')).filter((k) => !files.has(k));
}

/** Carrega o índice de gravações; chamado uma vez na inicialização. */
export const audioReady: Promise<number> = files.loadIndex().then((n) => {
  audio.setRecordingsComplete(n > 0 && missingRecordings().length === 0);
  return n;
});

export { AudioService } from './AudioService';
