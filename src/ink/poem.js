import { el } from '../core/svg.js';
import { clamp, f1 } from '../core/math.js';
import { loop } from '../core/tick.js';
import { BRUSH } from './palette.js';
import { glyph } from './glyph.js';

// 竖排诗句，从右往左成列；每列可单独"写出"（自上而下揭开）
//   lines   每列一句
//   x0, y0  第一列（最右）首字位置；size 字号；step 字距；gap 列距
//   fill    字色
let uid = 0;
export function createPoem(parent, { lines, x0, y0, size = 34, step = 40, gap = 50, fill }) {
  const g = el('g', {}, parent);
  const defs = el('defs', {}, g);
  const cols = lines.map((line, i) => {
    const id = `poemClip${++uid}`;
    const x = x0 - i * gap, h = [...line].length * step + size;
    const rect = el('rect', { x: x - size, y: y0 - size, width: size * 2, height: 0 }, el('clipPath', { id }, defs));
    const t = el('g', { 'clip-path': `url(#${id})`, 'font-family': BRUSH, 'font-size': size, fill, 'text-anchor': 'middle' }, g);
    [...line].forEach((ch, k) => glyph(t, ch, x, y0 + k * step, size));
    return { rect, h, shown: 0 };
  });

  // 写出第 i 列，ms 毫秒；skip 为真时立即完成
  function reveal(i, ms = 1400, skip = false) {
    const c = cols[i];
    if (skip || ms <= 0) { c.shown = 1; c.rect.setAttribute('height', f1(c.h)); return Promise.resolve(); }
    return new Promise(res => {
      const t0 = performance.now(), from = c.shown;
      const stop = loop(t => {
        c.shown = clamp(from + (t - t0) / ms, 0, 1);
        c.rect.setAttribute('height', f1(c.shown * c.h));
        if (c.shown >= 1) { stop(); res(); }
      });
    });
  }
  return { g, reveal, count: cols.length, isShown: i => cols[i].shown >= 1 };
}
