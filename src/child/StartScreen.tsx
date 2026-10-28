import { useApp } from '../AppContext';
import { audio } from '../audio';
import { ParentGateButton } from '../parent/ParentGate';

/** "Toca para começar": o gesto libera o áudio no navegador (seção 13). */
export function StartScreen(): JSX.Element {
  const { goto } = useApp();
  const start = async (): Promise<void> => {
    await audio.unlock();
    goto('home');
  };
  return (
    <div className="screen" onPointerUp={() => void start()}>
      <ParentGateButton />
      <svg viewBox="0 0 200 200" width="220" height="220" aria-hidden="true">
        <circle cx="100" cy="100" r="90" fill="#fff" stroke="#e0e0e0" strokeWidth="4" />
        <circle cx="70" cy="80" r="26" fill="#E02020" />
        <circle cx="130" cy="80" r="26" fill="#1F5FD6" />
        <circle cx="100" cy="130" r="26" fill="#FFD400" />
      </svg>
      <button className="big-btn" style={{ fontSize: 22, padding: '18px 32px' }}>
        <span aria-hidden="true">▶</span> Toca para começar
      </button>
    </div>
  );
}
