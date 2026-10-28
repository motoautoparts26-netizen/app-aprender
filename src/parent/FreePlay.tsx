import { useState } from 'react';
import { useApp } from '../AppContext';
import { ColorActivity } from '../activities/colors/ColorActivity';
import { LettersActivity, type LettersProps } from '../activities/letters/LetterActivities';
import { NumbersActivity } from '../activities/numbers/NumbersActivity';
import { Caption } from '../activities/shared/Caption';
import { ReplayButton } from '../activities/shared/ReplayButton';
import { audio } from '../audio';
import { pickDistractors } from '../engine/distractors';
import { createRng } from '../engine/rng';
import type { Content, Slot, Step } from '../engine/types';

interface Kind {
  id: string;
  title: string;
  track: 'colors' | 'letters' | 'numbers';
  /** Itens candidatos (sorteia um a cada rodada). */
  items: string[];
  step: Step;
  force?: LettersProps['force'];
  introduce?: boolean;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const KINDS: Kind[] = [
  { id: 'c-match', title: 'Cores: toca na cor igual (parear)', track: 'colors', items: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown'], step: 'match' },
  { id: 'c-intro', title: 'Cores: apresentar cor nova', track: 'colors', items: ['black', 'white', 'gray'], step: 'match', introduce: true },
  { id: 'c-rec', title: 'Cores: toca no vermelho (reconhecer)', track: 'colors', items: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'white'], step: 'recognize' },
  { id: 'c-shade', title: 'Cores: tons (C5)', track: 'colors', items: ['shade-red', 'shade-blue', 'shade-green', 'shade-yellow'], step: 'recognize' },
  { id: 'c-recall', title: 'Cores: que cor é essa? (modo com adulto)', track: 'colors', items: ['red', 'blue', 'green'], step: 'recall' },
  { id: 'l-match', title: 'Letras: toca na letra igual', track: 'letters', items: LETTERS, step: 'match', force: 'plain' },
  { id: 'l-intro', title: 'Letras: apresentar letra nova', track: 'letters', items: LETTERS, step: 'match', force: 'plain', introduce: true },
  { id: 'l-train', title: 'Letras: trem do alfabeto', track: 'letters', items: LETTERS, step: 'recognize', force: 'train' },
  { id: 'l-rec', title: 'Letras: toca na letra (reconhecer)', track: 'letters', items: LETTERS, step: 'recognize', force: 'plain' },
  { id: 'l-word', title: 'Letras: montar palavra copiando o modelo', track: 'letters', items: ['B', 'L', 'S', 'P', 'M', 'T', 'V', 'C', 'A', 'O'], step: 'match', force: 'word' },
  { id: 'l-det', title: 'Letras: detetive do nome', track: 'letters', items: LETTERS, step: 'match', force: 'detective' },
  { id: 'l-box', title: 'Letras: caixa surpresa das iniciais (L6)', track: 'letters', items: ['init-B', 'init-D', 'init-F', 'init-J', 'init-L', 'init-M', 'init-N', 'init-P', 'init-R', 'init-T', 'init-V', 'init-Z'], step: 'recognize', force: 'box' },
  { id: 'l-pair', title: 'Letras: cadê o meu par (L6)', track: 'letters', items: ['init-B', 'init-D', 'init-F', 'init-J', 'init-L', 'init-M', 'init-N', 'init-P', 'init-R', 'init-T', 'init-V', 'init-Z'], step: 'recognize', force: 'pair' },
  { id: 'l-pairs', title: 'Letras: pares parecidos (L5)', track: 'letters', items: ['M@L5', 'N@L5', 'B@L5', 'D@L5', 'E@L5', 'F@L5', 'P@L5', 'R@L5'], step: 'recognize', force: 'plain' },
  { id: 'l-recall', title: 'Letras: que letra é essa? (modo com adulto)', track: 'letters', items: LETTERS, step: 'recall' },
  { id: 'n-flash', title: 'Números: quantidade de relance (N1)', track: 'numbers', items: ['qty-1', 'qty-2', 'qty-3'], step: 'match' },
  { id: 'n-qty', title: 'Números: toca no que tem três (N1)', track: 'numbers', items: ['qty-1', 'qty-2', 'qty-3'], step: 'recognize' },
  { id: 'n-count', title: 'Números: contar junto (N2)', track: 'numbers', items: ['count-2', 'count-3', 'count-4', 'count-5'], step: 'recognize' },
  { id: 'n-count10', title: 'Números: contar até 10 (N5)', track: 'numbers', items: ['count-6', 'count-7', 'count-8', 'count-9', 'count-10'], step: 'recognize' },
  { id: 'n-nmatch', title: 'Números: toca no número igual (N3)', track: 'numbers', items: ['num-1', 'num-2', 'num-3', 'num-4', 'num-5'], step: 'match' },
  { id: 'n-nrec', title: 'Números: toca no número três (N3)', track: 'numbers', items: ['num-1', 'num-2', 'num-3', 'num-4', 'num-5', 'num-6', 'num-7', 'num-8', 'num-9', 'num-10'], step: 'recognize' },
  { id: 'n-nqty', title: 'Números: toca no grupo que tem três (N3)', track: 'numbers', items: ['num-1', 'num-2', 'num-3', 'num-4', 'num-5'], step: 'recognize-qty' },
  { id: 'n-zero', title: 'Números: o zero (N6)', track: 'numbers', items: ['num-0'], step: 'recognize-qty' },
  { id: 'n-pairs', title: 'Números: pares parecidos 6/9, 2/5, 1/7 (N6)', track: 'numbers', items: ['num-6@N6', 'num-9@N6', 'num-2@N6', 'num-5@N6', 'num-1@N6', 'num-7@N6'], step: 'recognize' },
  { id: 'n-tg', title: 'Números: traçado com guia (N4)', track: 'numbers', items: ['trace-1', 'trace-2', 'trace-3', 'trace-4', 'trace-5'], step: 'trace-guided' },
  { id: 'n-td', title: 'Números: traçado pontilhado', track: 'numbers', items: ['trace-1', 'trace-2', 'trace-3', 'trace-4', 'trace-5', 'trace-6', 'trace-7', 'trace-8', 'trace-9', 'trace-10'], step: 'trace-dotted' },
  { id: 'n-tf', title: 'Números: traçado livre', track: 'numbers', items: ['trace-1', 'trace-2', 'trace-3', 'trace-4', 'trace-5', 'trace-6', 'trace-7', 'trace-8', 'trace-9', 'trace-10'], step: 'trace-free' },
];

function makeSlot(kind: Kind, content: Content, optionsNormal: number): Slot | null {
  const ids = kind.items.filter((id) => content.items[id]);
  if (ids.length === 0) return null;
  const rng = createRng((Date.now() ^ Math.floor(Math.random() * 1e9)) % 2147483647);
  const item = content.items[rng.pick(ids)]!;
  const noOptions = kind.step === 'recall' || kind.step.startsWith('trace');
  return {
    kind: 'current',
    trackId: item.trackId,
    stageId: item.stageId,
    itemId: item.id,
    step: kind.step,
    helpLevel: 0,
    optionsCount: noOptions ? 0 : optionsNormal,
    variantId: rng.pick(item.variants),
    distractorIds: noOptions ? [] : pickDistractors(item, optionsNormal - 1, content, rng),
    isReview: false,
    isPlacement: false,
    introduce: !!kind.introduce,
  };
}

/**
 * Modo livre: qualquer atividade, sem nivelamento, sem limite e sem gravar nada.
 * Acesso: link com #teste, ou pelo painel (aba Simulação).
 */
export function FreePlay({ onExit }: { onExit: () => void }): JSX.Element {
  const { content, params, derived, profile } = useApp();
  const [kind, setKind] = useState<Kind | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [round, setRound] = useState(0);

  const start = (k: Kind): void => {
    const s = makeSlot(k, content, params.OPTIONS_NORMAL);
    if (!s) return;
    void audio.unlock(); // o toque no botão é o gesto que libera o áudio no navegador
    setKind(k);
    setSlot(s);
    setRound((r) => r + 1);
  };
  const next = (): void => {
    if (kind) start(kind);
  };
  const close = (): void => {
    audio.stop();
    setSlot(null);
    setKind(null);
  };

  if (slot && kind) {
    const key = `${kind.id}-${round}`;
    return (
      <div className="preview-overlay">
        <div className="row preview-close" style={{ gap: 6 }}>
          <button className="btn" onClick={close}>Voltar à lista</button>
          <button className="btn" onClick={next}>Outra</button>
        </div>
        <div className="screen top">
          {slot.trackId === 'letters' ? (
            <LettersActivity key={key} slot={slot} content={content} params={params} derived={derived} childName={profile?.name ?? 'Ana'} familyNames={profile?.familyNames ?? []} onAnswer={next} onExtraTrial={() => undefined} {...(kind.force ? { force: kind.force } : {})} />
          ) : slot.trackId === 'numbers' ? (
            <NumbersActivity key={key} slot={slot} content={content} params={params} onAnswer={next} />
          ) : (
            <ColorActivity key={key} slot={slot} content={content} params={params} onAnswer={next} />
          )}
          <ReplayButton />
          <Caption />
        </div>
      </div>
    );
  }

  const groups: [string, Kind[]][] = [
    ['Cores', KINDS.filter((k) => k.track === 'colors')],
    ['Letras', KINDS.filter((k) => k.track === 'letters')],
    ['Números', KINDS.filter((k) => k.track === 'numbers')],
  ];

  return (
    <div className="parent">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Modo livre (teste)</h1>
        <button className="btn primary" onClick={onExit}>Sair</button>
      </div>
      <p className="muted">
        Toque numa atividade para abri-la como a criança veria. Nada é gravado; não há nivelamento, limite diário nem progressão.
        Ao responder, vem outra rodada da mesma atividade. Toque em "Toca para começar" uma vez antes, se o som não sair.
      </p>
      {groups.map(([title, kinds]) => (
        <div className="card" key={title}>
          <h2>{title}</h2>
          <div className="row">
            {kinds.map((k) => (
              <button key={k.id} className="btn" onClick={() => start(k)}>{k.title.replace(/^[^:]+: /, '')}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
