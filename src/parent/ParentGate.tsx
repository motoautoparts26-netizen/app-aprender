import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useApp } from '../AppContext';

/**
 * Acesso ao painel: segurar o canto por 3 segundos e resolver uma soma (seção 15).
 * Protege contra a criança, não contra adultos.
 */
export function ParentGateButton(): JSX.Element {
  const { goto } = useApp();
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  const down = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    // Mantém o ponteiro "preso" ao botão: no celular, um leve deslize do dedo não cancela a pressão.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ponteiro já liberado (ou evento sintético): segue sem captura
    }
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      setOpen(true);
    }, 3000);
  };
  const up = (): void => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  return (
    <>
      <button
        className={`corner-gate${holding ? ' holding' : ''}`}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Área dos pais (segure 3 segundos)"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#777" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
      </button>
      {open && <GateDialog onSuccess={() => { setOpen(false); goto('parent'); }} onCancel={() => setOpen(false)} />}
    </>
  );
}

function GateDialog({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }): JSX.Element {
  const [a] = useState(() => 2 + Math.floor(Math.random() * 8));
  const [b] = useState(() => 2 + Math.floor(Math.random() * 8));
  const [typed, setTyped] = useState('');
  const press = (d: string): void => {
    const next = (typed + d).slice(0, 2);
    setTyped(next);
    if (Number(next) === a + b) onSuccess();
    else if (next.length === 2) onCancel();
  };
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, background: 'rgba(242,242,242,0.97)', zIndex: 20 }}>
      <div className="parent card" style={{ maxWidth: 320, textAlign: 'center' }}>
        <h1>Área dos pais</h1>
        <p>Quanto é {a} + {b}?</p>
        <p style={{ fontSize: 28, minHeight: 40 }}>{typed || '–'}</p>
        <div className="gate-pad" style={{ margin: '0 auto' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} onClick={() => press(d)}>{d}</button>
          ))}
          <button onClick={onCancel}>✕</button>
          <button onClick={() => press('0')}>0</button>
          <button onClick={() => setTyped('')}>⌫</button>
        </div>
      </div>
    </div>
  );
}
