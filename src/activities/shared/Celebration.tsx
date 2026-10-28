import { ColorShape } from '../../content/svg/ColorShape';

/** Fim de sessão: uma estrela e o narrador. Breve, pela participação (seção 2). */
export function Celebration({ onDone }: { onDone: () => void }): JSX.Element {
  return (
    <div className="screen" onPointerUp={onDone}>
      <div className="star">
        <ColorShape shape="star" fill="#FFD400" />
      </div>
      <div className="celebrate">Muito bem!</div>
    </div>
  );
}
