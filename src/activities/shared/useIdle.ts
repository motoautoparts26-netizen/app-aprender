import { useEffect, useRef } from 'react';

/**
 * Inatividade (seção 1): a cada `seconds` sem resposta chama `onTick(n)` com n = 1, 2, 3…
 * A tela decide: 1 → repete a instrução; 2 → ajuda nível 1; 3 → ajuda nível 2.
 * `active` desliga o relógio (por exemplo, enquanto o narrador fala ou após responder).
 */
export function useIdle(active: boolean, seconds: number, onTick: (n: number) => void, resetKey: unknown): void {
  const count = useRef(0);
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    count.current = 0;
    if (!active) return;
    const id = window.setInterval(() => {
      count.current += 1;
      cb.current(count.current);
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [active, seconds, resetKey]);
}
