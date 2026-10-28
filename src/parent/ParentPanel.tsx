import { useState } from 'react';
import { useApp } from '../AppContext';
import { DataTab } from './DataTab';
import { DevTab } from './DevTab';
import { SuggestionsTab } from './SuggestionsTab';
import { ProfilesTab } from './ProfilesTab';
import { ProgressTab } from './ProgressTab';
import { SettingsTab } from './SettingsTab';

type Tab = 'profiles' | 'progress' | 'suggestions' | 'data' | 'settings' | 'dev';

export function ParentPanel({ firstRun }: { firstRun: boolean }): JSX.Element {
  const { settings, goto } = useApp();
  const [tab, setTab] = useState<Tab>(firstRun ? 'profiles' : 'progress');

  return (
    <div className="parent">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Painel dos pais</h1>
        {!firstRun && <button className="btn primary" onClick={() => goto('start')}>Voltar para a criança</button>}
      </div>
      {firstRun && <p className="muted">Bem-vinda! Cadastre a criança para começar. Nenhum dado sai deste aparelho.</p>}
      {!firstRun && (
        <div className="tabs">
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>Progresso</button>
          <button className={tab === 'suggestions' ? 'active' : ''} onClick={() => setTab('suggestions')}>Fora da tela</button>
          <button className={tab === 'profiles' ? 'active' : ''} onClick={() => setTab('profiles')}>Perfis</button>
          <button className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>Dados</button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Configurações</button>
          {settings.devMode && <button className={tab === 'dev' ? 'active' : ''} onClick={() => setTab('dev')}>Simulação</button>}
        </div>
      )}
      {tab === 'profiles' && <ProfilesTab firstRun={firstRun} />}
      {tab === 'progress' && <ProgressTab />}
      {tab === 'suggestions' && <SuggestionsTab />}
      {tab === 'data' && <DataTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'dev' && settings.devMode && <DevTab />}
    </div>
  );
}
