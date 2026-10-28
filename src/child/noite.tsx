import { useEffect } from 'react';

const NOITE = '#131A3B';
const DIA = '#F2F2F2';

function setThemeColor(c: string): void {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c);
}

/** Tema noite (Lulu): barra do navegador azul-noite enquanto a tela estiver aberta; volta a #F2F2F2 ao sair. */
export function useNoiteTheme(): void {
  useEffect(() => {
    setThemeColor(NOITE);
    return () => setThemeColor(DIA);
  }, []);
}

// Posições fixas (sem aleatoriedade): o céu é sempre o mesmo, calmo.
const STARS = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 100,
  delay: ((i * 7) % 30) / 10,
}));

/** Estrelinhas do céu noturno, atrás do conteúdo. */
export function Estrelinhas(): JSX.Element {
  return (
    <div className="noite-estrelas" aria-hidden="true">
      {STARS.map((s, i) => (
        <i key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}
