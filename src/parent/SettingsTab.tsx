import { useApp } from '../AppContext';
import { audio, files, missingRecordings, tts } from '../audio';
import { expectedSpeechFiles } from '../content/speechList';
import type { TrackId } from '../engine/types';

const TRACK_PT: Record<TrackId, string> = { colors: 'Cores', letters: 'Letras', numbers: 'Números' };

/** Situação das gravações: completas (voz única garantida) ou faltando (lista). */
function RecordingsStatus(): JSX.Element {
  const expected = expectedSpeechFiles().length;
  const missing = missingRecordings();
  if (files.count() === 0) {
    return <p className="alert">Nenhuma fala gravada. Rode <code>tools\gerar-audio.ps1</code> no computador; até lá o app usa a voz do aparelho.</p>;
  }
  if (missing.length === 0) {
    return <p className="muted">Falas gravadas: {expected}/{expected}. Com as gravações ligadas, a voz do aparelho não é usada em nenhuma frase.</p>;
  }
  return (
    <p className="alert">
      <strong>{missing.length} de {expected} falas sem gravação</strong> (saem na voz do aparelho e misturam vozes). Rode <code>tools\gerar-audio.ps1</code> de novo. Exemplos: {missing.slice(0, 6).join(', ')}.
    </p>
  );
}

export function SettingsTab(): JSX.Element {
  const { settings, updateSettings, params } = useApp();
  const toggleTrack = (t: TrackId): void => {
    const set = new Set(settings.enabledTracks);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    if (set.size === 0) return;
    void updateSettings({ enabledTracks: [...set] });
  };
  return (
    <>
      <div className="card">
        <h2>Sessões</h2>
        <label className="row">Limite diário de sessões
          <select value={settings.dailyLimit} onChange={(e) => void updateSettings({ dailyLimit: Number(e.target.value) })}>
            {Array.from({ length: params.DAILY_SESSION_LIMIT_MAX - params.DAILY_SESSION_LIMIT_MIN + 1 }, (_, i) => i + params.DAILY_SESSION_LIMIT_MIN).map((n) => <option key={n} value={n}>{n} por dia</option>)}
            <option value={0}>Sem limite (para testes)</option>
          </select>
        </label>
        {settings.dailyLimit === 0 && <p className="alert">Sem limite diário: útil para testar. Para o uso real com a criança, volte para 1 a 4 sessões por dia (seção 1 da especificação: sessões curtas).</p>}
        <label className="row"><input type="checkbox" checked={settings.adultMode} onChange={(e) => void updateSettings({ adultMode: e.target.checked })} /> Modo com adulto (atividades de falar o nome, com botões “Disse certo / Ainda não”)</label>
      </div>
      <div className="card">
        <h2>Trilhas ativas</h2>
        {(['colors', 'letters', 'numbers'] as TrackId[]).map((t) => (
          <label className="row" key={t}><input type="checkbox" checked={settings.enabledTracks.includes(t)} onChange={() => toggleTrack(t)} /> {TRACK_PT[t]}</label>
        ))}
        <p className="muted">Desativar uma trilha a esconde da criança; o progresso fica guardado.</p>
      </div>
      <div className="card">
        <h2>Narrador</h2>
        <label className="row">Volume <input type="range" min={0} max={1} step={0.1} value={settings.volume} onChange={(e) => void updateSettings({ volume: Number(e.target.value) })} /></label>
        <label className="row">Velocidade <input type="range" min={0.6} max={1.2} step={0.05} value={settings.speechRate} onChange={(e) => void updateSettings({ speechRate: Number(e.target.value) })} /> {settings.speechRate.toFixed(2)}</label>
        <label className="row">Voz
          <select value={settings.voiceName ?? ''} onChange={(e) => void updateSettings({ voiceName: e.target.value || null })}>
            <option value="">Automática (português do Brasil, feminina se houver)</option>
            {tts.listLocalVoices().map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
          <button className="btn" onClick={() => void audio.say('home.greet', {}, false)}>Ouvir</button>
        </label>
        <p className="muted">Voz em uso: {tts.describe()}. Só vozes locais são usadas: nada é enviado para fora do aparelho.</p>
        <RecordingsStatus />
        {files.count() > 0 && (
          <label className="row">
            <input type="checkbox" checked={settings.useRecorded} onChange={(e) => void updateSettings({ useRecorded: e.target.checked })} />
            Usar as falas gravadas. Desligado: usa a voz do aparelho escolhida acima.
            <button className="btn" onClick={() => void audio.say('home.pick', {}, false)}>Ouvir</button>
          </label>
        )}
        {!tts.hasLocalPtBr() && <p className="alert">Não há voz local em português do Brasil. No Android: Configurações → Sistema → Idiomas → Saída de conversão de texto em voz → instale a voz em português (Brasil).</p>}
      </div>
      <div className="card">
        <h2>Desenvolvedor</h2>
        <label className="row"><input type="checkbox" checked={settings.devMode} onChange={(e) => void updateSettings({ devMode: e.target.checked })} /> Mostrar a aba Simulação (avançar relógio, responder automaticamente, ver estado interno)</label>
      </div>
      <div className="card">
        <h2>Sobre</h2>
        <p className="muted">Aprender: cores, letras e números. Uso doméstico. Nenhum dado sai do aparelho; não há conta, servidor nem análise de uso. Ilustrações originais. Fonte Andika (SIL Open Font License).</p>
      </div>
    </>
  );
}
