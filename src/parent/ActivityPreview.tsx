import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { ColorActivity } from '../activities/colors/ColorActivity';
import { LettersActivity } from '../activities/letters/LetterActivities';
import { NumbersActivity } from '../activities/numbers/NumbersActivity';
import { Caption } from '../activities/shared/Caption';
import { ReplayButton } from '../activities/shared/ReplayButton';
import { audio } from '../audio';
import { SPEECH } from '../content/speech';
import { PICTURE_WORDS, WordPicture } from '../content/svg/WordPicture';
import { pickDistractors } from '../engine/distractors';
import { createRng } from '../engine/rng';
import type { Slot, Step } from '../engine/types';

/**
 * Prévia de qualquer atividade sem depender do progresso (modo de desenvolvedor).
 * Nada é gravado: as respostas só fecham a prévia.
 */
export function ActivityPreview(): JSX.Element {
  const { content, params, derived, profile } = useApp();
  const [itemId, setItemId] = useState('red');
  const [step, setStep] = useState<Step>('match');
  const [introduce, setIntroduce] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [gallery, setGallery] = useState(false);

  const items = useMemo(
    () => Object.values(content.items).sort((a, b) => a.trackId.localeCompare(b.trackId) || a.stageId.localeCompare(b.stageId) || a.id.localeCompare(b.id)),
    [content],
  );
  const item = content.items[itemId];

  const open = (): void => {
    if (!item) return;
    const rng = createRng(Date.now() % 2147483647);
    const variant = rng.pick(item.variants);
    const noOptions = step === 'recall' || step.startsWith('trace');
    setSlot({
      kind: 'current',
      trackId: item.trackId,
      stageId: item.stageId,
      itemId: item.id,
      step,
      helpLevel: 0,
      optionsCount: noOptions ? 0 : params.OPTIONS_NORMAL,
      variantId: variant,
      distractorIds: noOptions ? [] : pickDistractors(item, params.OPTIONS_NORMAL - 1, content, rng),
      isReview: false,
      isPlacement: false,
      introduce,
    });
  };

  return (
    <div className="card">
      <h2>Prévia de atividades</h2>
      <p><a className="btn" href="#teste">Abrir o modo livre (todas as atividades, sem limites)</a></p>
      <p className="muted">Mostra uma atividade como a criança veria, sem gravar nada. Útil para conferir figuras, falas e o trem.</p>
      <div className="row">
        <label>Item <select value={itemId} onChange={(e) => { setItemId(e.target.value); const it = content.items[e.target.value]; if (it && !it.steps.includes(step)) setStep(it.steps[0]!); }}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.stageId} · {SPEECH[i.speechKey] ?? i.glyph}{i.id !== i.glyph ? ` (${i.id})` : ''}</option>)}
        </select></label>
        <label>Degrau <select value={step} onChange={(e) => setStep(e.target.value as Step)}>
          {(item?.steps ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
        </select></label>
        <label><input type="checkbox" checked={introduce} onChange={(e) => setIntroduce(e.target.checked)} /> apresentar como item novo</label>
        <button className="btn primary" onClick={open}>Abrir prévia</button>
        <button className="btn" onClick={() => setGallery((g) => !g)}>{gallery ? 'Fechar galeria' : 'Galeria das 48 figuras'}</button>
      </div>
      {gallery && (
        <div className="gallery">
          {PICTURE_WORDS.map((w) => (
            <button key={w} className="gallery-item" onClick={() => void audio.say(`word.${w}`, {}, false)}>
              <WordPicture word={w} size={72} />
              <span>{w}</span>
            </button>
          ))}
        </div>
      )}
      {slot && (
        <div className="preview-overlay">
          <button className="btn preview-close" onClick={() => { audio.stop(); setSlot(null); }}>Fechar prévia</button>
          <div className="screen top">
            {slot.trackId === 'letters' ? (
              <LettersActivity
                key={`${slot.itemId}-${slot.step}-${slot.variantId}`}
                slot={slot}
                content={content}
                params={params}
                derived={derived}
                childName={profile?.name ?? ''}
                familyNames={profile?.familyNames ?? []}
                onAnswer={() => setSlot(null)}
                onExtraTrial={() => undefined}
              />
            ) : slot.trackId === 'numbers' ? (
              <NumbersActivity key={`${slot.itemId}-${slot.step}-${slot.variantId}`} slot={slot} content={content} params={params} onAnswer={() => setSlot(null)} />
            ) : (
              <ColorActivity key={`${slot.itemId}-${slot.step}`} slot={slot} content={content} params={params} onAnswer={() => setSlot(null)} />
            )}
            <ReplayButton />
            <Caption />
          </div>
        </div>
      )}
    </div>
  );
}
