import { ColorShape } from '../../content/svg/ColorShape';
import { Lulu } from '../../content/svg/Lulu';
import { Estrelinhas, useNoiteTheme } from '../../child/noite';

/** Fim de sessão: a Lulu feliz com uma estrela e o narrador. Breve (até 2 s de animação), pela participação (seção 2). */
export function Celebration({ onDone }: { onDone: () => void }): JSX.Element {
  useNoiteTheme();
  return (
    <div className="screen noite" onPointerUp={onDone}>
      <Estrelinhas />
      <div className="noite-celebra">
        <div className="noite-pula"><Lulu humor="feliz" size={150} /></div>
        <div className="star">
          <ColorShape shape="star" fill="#FFD400" />
        </div>
      </div>
      <div className="celebrate">Muito bem!</div>
    </div>
  );
}
