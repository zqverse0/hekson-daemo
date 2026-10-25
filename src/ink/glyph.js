import { el } from '../core/svg.js';
import { f1 } from '../core/math.js';

// 书法字体（Ma Shan Zheng）缺字时用部件拼合，不改原文用字。
//   [部件, 横向缩放, 中心横移（字号的倍数）]
const PARTS = {
  '饘': [['饣', .46, -.27], ['亶', .64, .18]],     // 《乞常州居住表》"粗给饘粥"
};

// 写一个字：text-anchor、字体等继承自父元素；size 用于拼合字的部件定位
export function glyph(parent, ch, x, y, size) {
  const parts = PARTS[ch];
  if (!parts) return el('text', { x, y, text: ch }, parent);
  const g = el('g', {}, parent);
  for (const [p, sx, dx] of parts) el('text', { x: 0, y: 0, text: p, transform: `translate(${f1(x + dx * size)},${f1(y)}) scale(${sx},1)` }, g);
  return g;
}
