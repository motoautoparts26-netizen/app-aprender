import { useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { exportBackup, importBackup, parseBackup } from '../storage/backup';
import { isIOS, isStandalone } from '../storage/persist';

/** Dados: backup, importação, avisos de instalação (seção 15). */
export function DataTab(): JSX.Element {
  const { settings, trials, reloadProfiles, reloadTrials, updateSettings, now } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const daysSinceBackup = settings.lastBackupAt ? Math.floor((now() - settings.lastBackupAt) / 86_400_000) : null;
  const needsBackup = trials.length > 0 && (daysSinceBackup === null || daysSinceBackup >= 14);

  const doExport = async (): Promise<void> => {
    const { blob, filename } = await exportBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    await updateSettings({ lastBackupAt: Date.now() });
    setMsg(`Backup salvo: ${filename}. Guarde-o em local privado.`);
  };

  const doImport = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    try {
      const data = await parseBackup(file);
      const when = data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('pt-BR') : 'data desconhecida';
      if (!window.confirm(`Importar backup de ${when} com ${data.profiles.length} perfil(is) e ${data.trials.length} tentativas? Registros com o mesmo id serão substituídos; o resto é somado.`)) return;
      const r = await importBackup(data);
      await reloadProfiles();
      await reloadTrials();
      setMsg(`Importado: ${r.profiles} perfil(is), ${r.trials} tentativas.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível importar.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      {isIOS() && !isStandalone() && (
        <div className="alert">
          <strong>iPhone/iPad:</strong> instale o app na tela inicial (botão Compartilhar → "Adicionar à Tela de Início"). Sem isso, o Safari pode apagar o progresso depois de 7 dias sem uso.
        </div>
      )}
      {needsBackup && (
        <div className="alert">
          <strong>Lembrete:</strong> {daysSinceBackup === null ? 'ainda não há backup.' : `o último backup foi há ${daysSinceBackup} dias.`} Tudo fica só neste aparelho; exporte um backup para não perder o progresso.
        </div>
      )}
      <div className="card">
        <h2>Backup</h2>
        <p className="muted">O arquivo contém o nome da criança e o histórico de atividades. Guarde-o em local privado. Nada é enviado a lugar nenhum: o arquivo é salvo neste aparelho e você decide onde guardá-lo.</p>
        <div className="row">
          <button className="btn primary" onClick={() => void doExport()}>Exportar backup (JSON)</button>
          <span className="muted">{settings.lastBackupAt ? `Último: ${new Date(settings.lastBackupAt).toLocaleString('pt-BR')}` : 'Nenhum backup ainda'}</span>
        </div>
      </div>
      <div className="card">
        <h2>Importar backup</h2>
        <p className="muted">Para trocar de aparelho ou recuperar. O arquivo é verificado antes de entrar (estrutura, tipos, até 20 MB). Nada dele é executado.</p>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => void doImport(e.target.files?.[0])} />
      </div>
      {msg && <p className="muted">{msg}</p>}
    </>
  );
}
