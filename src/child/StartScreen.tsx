import { useApp } from '../AppContext';
import { audio } from '../audio';
import { ParentGateButton } from '../parent/ParentGate';
import { Lulu } from '../content/svg/Lulu';
import { Estrelinhas, useNoiteTheme } from './noite';

/** "Toca para começar": o gesto libera o áudio no navegador (seção 13). */
export function StartScreen(): JSX.Element {
  const { goto } = useApp();
  useNoiteTheme();
  const start = async (): Promise<void> => {
    await audio.unlock();
    goto('home');
  };
  return (
    <div className="screen noite" onPointerUp={() => void start()}>
      <Estrelinhas />
      <ParentGateButton />
      <Lulu humor="feliz" size="min(60vw, 240px)" galho />
      <button className="big-btn noite-bt" style={{ fontSize: 22, padding: '18px 32px' }}>
        <span aria-hidden="true">▶</span> Toca para começar
      </button>
    </div>
  );
}
