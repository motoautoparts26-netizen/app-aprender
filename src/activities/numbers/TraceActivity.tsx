import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { audio } from '../../audio';
import type { PedagogyParams } from '../../config/pedagogy';
import { PRAISE_KEYS } from '../../content/speech';
import { TRACE_PATHS } from '../../content/numbers';
import type { Content, HelpLevel, Slot } from '../../engine/types';
import type { AnswerResult } from '../shared/ChoiceActivity';
import { useIdle } from '../shared/useIdle';

type Pt = [number, number];

/** Caixa do traçado: 100 × 140 (largura × altura), coordenadas normalizadas 0–1 nos caminhos. */
const W = 100;
const H = 140;

const toBox = ([x, y]: Pt): Pt => [x * W, y * H];

/** Polilinha suavizada (Catmull-Rom → Bézier) para a guia ficar bonita. */
function smoothPath(points: Pt[]): string {
  if (points.length < 2) return '';
  const p = points.map(toBox);
  let d = `M ${p[0]![0]} ${p[0]![1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Avalia o traçado (seção 12.3): pontos de verificação em ordem, dentro da tolerância,
 * começando perto do ponto inicial. Espelhamento horizontal é aceito e registrado.
 */
export function evaluateTrace(strokes: Pt[][], expected: Pt[][], tolerance: number): { ok: boolean; mirrored: boolean } {
  const drawn = strokes.flat();
  if (drawn.length < 3) return { ok: false, mirrored: false };
  const check = (paths: Pt[][]): boolean => {
    const checkpoints = paths.flat();
    let idx = 0;
    // começo: o primeiro ponto do traçado perto do ponto inicial (direção certa)
    const start = checkpoints[0]!;
    const first = drawn.slice(0, Math.max(3, Math.floor(drawn.length * 0.15)));
    if (!first.some((q) => dist(q, start) <= tolerance)) return false;
    for (const cp of checkpoints) {
      let found = -1;
      for (let i = idx; i < drawn.length; i++) {
        if (dist(drawn[i]!, cp) <= tolerance) {
          found = i;
          break;
        }
      }
      if (found < 0) return false;
      idx = found;
    }
    return true;
  };
  if (check(expected)) return { ok: true, mirrored: false };
  const mirrored = expected.map((s) => s.map(([x, y]) => [1 - x, y] as Pt));
  if (check(mirrored)) return { ok: true, mirrored: true };
  return { ok: false, mirrored: false };
}

function dist(a: Pt, b: Pt): number {
  const dx = (a[0] - b[0]) * W;
  const dy = (a[1] - b[1]) * H;
  return Math.hypot(dx, dy);
}

type Phase = 'demo' | 'instruct' | 'draw' | 'ok' | 'retry';

/**
 * Traçado guiado (N4/N5): demonstração animada, ponto inicial verde, a criança traça com o dedo.
 * Degraus: guia completa → pontilhada → só o ponto inicial. Ajuda 1 mostra a guia pontilhada,
 * ajuda 2 a guia completa.
 */
export function TraceActivity(p: { slot: Slot; content: Content; params: PedagogyParams; n: number; onAnswer: (r: AnswerResult & { mirrored?: boolean }) => void }): JSX.Element {
  const { slot, n, params } = p;
  const expected = TRACE_PATHS[n] ?? TRACE_PATHS[1]!;
  const [phase, setPhase] = useState<Phase>('demo');
  const [help, setHelp] = useState<HelpLevel>(slot.helpLevel);
  // Os traços vivem num ref (fonte da verdade); o estado só serve para redesenhar.
  const strokesRef = useRef<Pt[][]>([]);
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const finished = useRef(false);
  const [demoProgress, setDemoProgress] = useState(0); // 0..1 ao longo de todos os traços
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const evalTimer = useRef<number | null>(null);
  const attempts = useRef(0);
  const spoken = useRef<string>('');
  const name = audio.textFor(`number.${n}`);
  const vars = { name };

  const guide: 'full' | 'dotted' | 'none' =
    help >= 2 ? 'full' : help === 1 ? 'dotted' : slot.step === 'trace-guided' ? 'full' : slot.step === 'trace-dotted' ? 'dotted' : 'none';

  // Demonstração: um ponto percorre o caminho enquanto a linha se desenha.
  useEffect(() => {
    if (phase !== 'demo') return;
    if (spoken.current !== `demo-${attempts.current}`) {
      spoken.current = `demo-${attempts.current}`;
      void audio.say('trace.demo', vars, false);
    }
    // Relógio por tempo decorrido (não por quadros): termina mesmo se a aba ficar em segundo plano.
    const t0 = performance.now();
    const dur = 1500 * expected.length + 400;
    let ended = false;
    const id = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      setDemoProgress(t);
      if (t >= 1 && !ended) {
        ended = true;
        window.clearInterval(id);
        window.setTimeout(() => setPhase('instruct'), 300);
      }
    }, 33);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'instruct') return;
    const key = slot.step === 'trace-guided' ? 'instr.trace.guided' : slot.step === 'trace-dotted' ? 'instr.trace.dotted' : 'instr.trace.free';
    void audio.say(key, vars).then(() => setPhase('draw'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useIdle(phase === 'draw' && strokes.length === 0, params.IDLE_REPEAT_SECONDS, (k) => {
    if (k === 1) void audio.replay();
    else if (k === 2) setHelp((h) => (h < 1 ? 1 : h));
    else if (k === 3) setHelp(2);
  }, `${slot.itemId}-${attempts.current}`);

  const toNorm = (e: ReactPointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const down = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (phase !== 'draw') return;
    if (evalTimer.current) window.clearTimeout(evalTimer.current);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // evento sintético ou ponteiro já liberado: segue sem captura
    }
    drawing.current = true;
    strokesRef.current = [...strokesRef.current, [toNorm(e)]];
    setStrokes(strokesRef.current);
  };
  const move = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (!drawing.current) return;
    const s = strokesRef.current;
    const last = s[s.length - 1]!;
    strokesRef.current = [...s.slice(0, -1), [...last, toNorm(e)]];
    setStrokes(strokesRef.current);
  };
  const up = (): void => {
    if (!drawing.current) return;
    drawing.current = false;
    // Números de dois traços: espera o segundo; senão avalia depois de uma pausa curta.
    const delay = strokesRef.current.length < expected.length ? 1400 : 250;
    evalTimer.current = window.setTimeout(() => void finish(strokesRef.current), delay);
  };

  const tolerance = params.TRACE_TOLERANCE_PX / 3; // a caixa tem 100 un. de largura ≈ 300 px na tela
  async function finish(s: Pt[][]): Promise<void> {
    if (finished.current) return;
    finished.current = true;
    const result = evaluateTrace(s, expected, tolerance);
    attempts.current++;
    if (import.meta.env.DEV) (window as unknown as { __traceResult?: unknown }).__traceResult = { n, ...result };
    if (result.ok) {
      setPhase('ok');
      await audio.say(PRAISE_KEYS[Math.floor(Math.random() * PRAISE_KEYS.length)]!, {}, false);
      await audio.say('trace.ok', vars, false);
      p.onAnswer({ chosenId: slot.itemId, correct: true, helpLevel: help, optionsCount: 0, mirrored: result.mirrored });
    } else {
      setPhase('retry');
      await audio.say('trace.again', {}, false);
      // Erro: registra, mostra a demonstração de novo; o motor traz o item de volta com ajuda.
      p.onAnswer({ chosenId: null, correct: false, helpLevel: help, optionsCount: 0 });
    }
  }

  // Demonstração: fração desenhada de cada traço.
  const demoStrokes = expected.map((stroke, si) => {
    const per = 1 / expected.length;
    const local = Math.max(0, Math.min(1, (demoProgress - si * per) / per));
    return { stroke, local };
  });
  const startPt = toBox(expected[0]![0]!);
  const demoDot = (() => {
    const si = Math.min(expected.length - 1, Math.floor(demoProgress * expected.length));
    const stroke = expected[si]!;
    const local = demoStrokes[si]!.local;
    const idxF = local * (stroke.length - 1);
    const i = Math.floor(idxF);
    const a = stroke[i]!;
    const b = stroke[Math.min(stroke.length - 1, i + 1)]!;
    const f = idxF - i;
    return toBox([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  })();

  return (
    <div className="activity">
      <svg
        ref={svgRef}
        className={`trace ${phase}`}
        viewBox={`0 0 ${W} ${H}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        aria-label={`Traçar o número ${name}`}
      >
        {/* guia */}
        {expected.map((stroke, i) => (
          <path
            key={`g${i}`}
            d={smoothPath(stroke)}
            fill="none"
            stroke={guide === 'none' && phase !== 'demo' ? 'transparent' : '#BFC7D2'}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={guide === 'dotted' && phase !== 'demo' ? '0.1 14' : undefined}
          />
        ))}
        {/* demonstração */}
        {phase === 'demo' &&
          demoStrokes.map(({ stroke, local }, i) => (
            <path key={`d${i}`} d={smoothPath(stroke)} fill="none" stroke="#6FA8DC" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${local} 1`} />
          ))}
        {phase === 'demo' && <circle cx={demoDot[0]} cy={demoDot[1]} r="6" fill="#1F3A57" />}
        {/* traço da criança */}
        {strokes.map((s, i) => (
          <polyline key={`s${i}`} points={s.map(toBox).map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={phase === 'ok' ? '#1FA83C' : '#3F4A5A'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* ponto inicial verde */}
        {phase !== 'ok' && <circle cx={startPt[0]} cy={startPt[1]} r="7" fill="#1FA83C" stroke="#fff" strokeWidth="2" className="start-dot" />}
      </svg>
    </div>
  );
}
