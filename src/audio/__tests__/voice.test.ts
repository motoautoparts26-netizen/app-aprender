import { describe, expect, it } from 'vitest';
import { chooseVoice } from '../SpeechAudio';

const v = (name: string, lang: string, localService = true, def = false): SpeechSynthesisVoice =>
  ({ name, lang, localService, default: def, voiceURI: name }) as SpeechSynthesisVoice;

describe('Escolha da voz do narrador (seções 13 e 20)', () => {
  it('nunca escolhe voz remota, mesmo que seja a única pt-BR', () => {
    const voices = [v('Google português do Brasil', 'pt-BR', false), v('Microsoft Zira', 'en-US')];
    expect(chooseVoice(voices)?.name).toBe('Microsoft Zira');
  });

  it('prefere pt-BR feminina (Maria) a pt-BR masculina (Daniel)', () => {
    const voices = [v('Microsoft Daniel - Portuguese (Brazil)', 'pt-BR'), v('Microsoft Maria - Portuguese (Brazil)', 'pt-BR')];
    expect(chooseVoice(voices)?.name).toContain('Maria');
  });

  it('prefere pt-BR a pt-PT e a inglês', () => {
    const voices = [v('Joana', 'pt-PT'), v('Zira', 'en-US'), v('Luciana', 'pt-BR')];
    expect(chooseVoice(voices)?.name).toBe('Luciana');
  });

  it('a escolha do responsável vence, se for local', () => {
    const voices = [v('Microsoft Maria', 'pt-BR'), v('Microsoft Daniel', 'pt-BR'), v('Google pt-BR', 'pt-BR', false)];
    expect(chooseVoice(voices, 'Microsoft Daniel')?.name).toBe('Microsoft Daniel');
    expect(chooseVoice(voices, 'Google pt-BR')?.name).toBe('Microsoft Maria');
  });

  it('sem nenhuma voz local devolve null', () => {
    expect(chooseVoice([v('Google pt-BR', 'pt-BR', false)])).toBeNull();
  });
});
