/**
 * Gera os ícones PNG do PWA (192 e 512 px) sem bibliotecas: rasteriza o ícone (fundo claro
 * arredondado + três círculos) e escreve o PNG com zlib do Node.
 * Uso: npx vite-node scripts/icons.ts
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

type RGB = [number, number, number];
const BG: RGB = [0xf2, 0xf2, 0xf2];
const RED: RGB = [0xe0, 0x20, 0x20];
const BLUE: RGB = [0x1f, 0x5f, 0xd6];
const YELLOW: RGB = [0xff, 0xd4, 0x00];

function render(size: number, maskable: boolean): Uint8Array {
  const px = new Uint8Array(size * size * 4);
  const s = size / 512;
  const pad = maskable ? 0.1 * size : 0;
  const inner = size - 2 * pad;
  const r = 96 * (inner / 512);
  const circles: [number, number, number, RGB][] = [
    [170, 190, 70, RED],
    [342, 190, 70, BLUE],
    [256, 330, 70, YELLOW],
  ].map(([x, y, rad, c]) => [pad + (x as number) * (inner / 512), pad + (y as number) * (inner / 512), (rad as number) * (inner / 512), c as RGB]);
  void s;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let color: RGB | null = null;
      let alpha = 0;
      // retângulo arredondado
      const cx = Math.min(Math.max(x + 0.5, pad + r), size - pad - r);
      const cy = Math.min(Math.max(y + 0.5, pad + r), size - pad - r);
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const inRect = x + 0.5 >= pad && x + 0.5 <= size - pad && y + 0.5 >= pad && y + 0.5 <= size - pad && d <= r;
      if (maskable || inRect) {
        color = BG;
        alpha = 255;
      }
      for (const [ccx, ccy, rad, c] of circles) {
        const dd = Math.hypot(x + 0.5 - ccx, y + 0.5 - ccy);
        if (dd <= rad) {
          color = c;
          alpha = 255;
        } else if (dd <= rad + 1 && color) {
          // borda suavizada
          const t = rad + 1 - dd;
          color = [Math.round(color[0] + (c[0] - color[0]) * t), Math.round(color[1] + (c[1] - color[1]) * t), Math.round(color[2] + (c[2] - color[2]) * t)];
        }
      }
      if (color) {
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = alpha;
      }
    }
  }
  return px;
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, data.length);
  const typeBytes = new TextEncoder().encode(type);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes);
  crcInput.set(data, typeBytes.length);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(crcInput));
  return new Uint8Array([...len, ...typeBytes, ...data, ...crc]);
}
function png(size: number, px: Uint8Array): Uint8Array {
  const raw = new Uint8Array(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtro none
    raw.set(px.subarray(y * size * 4, (y + 1) * size * 4), y * (size * 4 + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, size);
  dv.setUint32(4, size);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return new Uint8Array([...sig, ...chunk('IHDR', ihdr), ...chunk('IDAT', new Uint8Array(deflateSync(raw))), ...chunk('IEND', new Uint8Array())]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', png(192, render(192, false)));
writeFileSync('public/icons/icon-512.png', png(512, render(512, true)));
console.log('public/icons/icon-192.png e icon-512.png gerados.');
