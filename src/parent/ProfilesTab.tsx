import { useState } from 'react';
import { useApp } from '../AppContext';
import { ColorShape } from '../content/svg/ColorShape';
import { AVATARS } from '../content/svg/Island';
import { createProfile, deleteProfile, isValidName, updateProfile } from '../storage/repo';

/** Nomes da família para o detetive do nome (seção 12.2). Até 6; só o primeiro nome. */
function FamilyNames({ profileId, names }: { profileId: string; names: string[] }): JSX.Element {
  const { reloadProfiles } = useApp();
  const [value, setValue] = useState('');
  const save = async (next: string[]): Promise<void> => {
    await updateProfile(profileId, { familyNames: next });
    await reloadProfiles();
  };
  const add = async (): Promise<void> => {
    const n = value.trim();
    if (!isValidName(n) || names.length >= 6) return;
    await save([...names, n]);
    setValue('');
  };
  return (
    <div className="row" style={{ width: '100%', paddingLeft: 50 }}>
      <span className="muted">Nomes da família (detetive do nome):</span>
      {names.map((n) => (
        <span key={n} className="chip">{n} <button className="btn" style={{ minHeight: 24, padding: '0 6px' }} onClick={() => void save(names.filter((x) => x !== n))} aria-label={`remover ${n}`}>×</button></span>
      ))}
      {names.length < 6 && (
        <>
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} maxLength={30} placeholder="ex.: mamãe, vovó, irmão" autoComplete="off" style={{ minHeight: 36 }} />
          <button className="btn" onClick={() => void add()}>Adicionar</button>
        </>
      )}
    </div>
  );
}

const AVATAR_COLORS: Record<string, string> = { sun: '#FFD400', star: '#FF8A1F', cloud: '#FFFFFF', leaf: '#1FA83C', balloon: '#E02020', whale: '#1F5FD6' };

export function ProfilesTab({ firstRun }: { firstRun: boolean }): JSX.Element {
  const { profiles, profile, updateSettings, reloadProfiles, goto } = useApp();
  const [name, setName] = useState('');
  const [nick, setNick] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    if (!isValidName(name)) return setError('Use só letras, até 30 caracteres.');
    if (nick && !isValidName(nick)) return setError('Apelido: só letras, até 30 caracteres.');
    const p = await createProfile({ name, nickname: nick || name, avatar });
    await updateSettings({ currentProfileId: p.id });
    await reloadProfiles();
    setName('');
    setNick('');
    setError('');
    if (firstRun) goto('start');
  };

  const remove = async (id: string, n: string): Promise<void> => {
    if (!window.confirm(`Apagar o perfil de ${n} e todo o progresso? Isso não pode ser desfeito.`)) return;
    await deleteProfile(id);
    await reloadProfiles();
    if (profile?.id === id) await updateSettings({ currentProfileId: null });
  };

  return (
    <>
      {profiles.length > 0 && (
        <div className="card">
          <h2>Perfis</h2>
          {profiles.map((p) => (
            <div className="row" key={p.id} style={{ padding: '6px 0' }}>
              <span style={{ width: 40, height: 40 }}><ColorShape shape={p.avatar} fill={AVATAR_COLORS[p.avatar] ?? '#999'} /></span>
              <strong>{p.name}</strong>
              <span className="muted">({p.nickname})</span>
              {p.id === profile?.id ? <span className="chip mastered">em uso</span> : <button className="btn" onClick={() => void updateSettings({ currentProfileId: p.id })}>Usar</button>}
              <button className="btn danger" onClick={() => void remove(p.id, p.name)}>Apagar</button>
              <FamilyNames profileId={p.id} names={p.familyNames ?? []} />
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <h2>{firstRun ? 'Cadastrar a criança' : 'Novo perfil'}</h2>
        <div className="row">
          <label>Primeiro nome <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="off" /></label>
          <label>Apelido (como o narrador chama) <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} maxLength={30} placeholder={name || 'igual ao nome'} autoComplete="off" /></label>
        </div>
        <p className="muted">O nome é usado nas letras do nome (etapa L1). Sem acento ou cedilha, as letras ficam A–Z.</p>
        <div className="avatar-pick">
          {AVATARS.map((a) => (
            <button key={a} className={a === avatar ? 'sel' : ''} onClick={() => setAvatar(a)} aria-label={a}><ColorShape shape={a} fill={AVATAR_COLORS[a] ?? '#999'} /></button>
          ))}
        </div>
        {error && <p style={{ color: '#b2255f' }}>{error}</p>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => void submit()}>Salvar</button>
        </div>
      </div>
    </>
  );
}
