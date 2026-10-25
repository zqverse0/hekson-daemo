import { el } from '../core/svg.js';
import { f1 } from '../core/math.js';
import { SEAL, WALL, BRUSH } from './palette.js';

// 竖长朱印：未落下时悬浮，落下后成印痕。印文 2–3 字。返回 { g, box, place(x, y, scale, rot, opacity) }
export function createSeal(parent, text) {
  const n = [...text].length, h = 20 + 44 * n, step = n > 2 ? 44 : 46;
  const g = el('g', { opacity: 0 }, parent);
  const box = el('rect', { x: -30, y: -h / 2, width: 60, height: h, rx: 4, fill: SEAL }, g);
  [...text].forEach((ch, i) => el('text', { x: 0, y: -h / 2 + 42 + i * step, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': n > 2 ? 36 : 38, fill: WALL, text: ch }, g));
  const place = (x, y, s, rot, o) => { g.setAttribute('transform', `translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s)})`); g.setAttribute('opacity', f1(o)); };
  return { g, box, place };
}
