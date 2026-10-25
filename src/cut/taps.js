import { el } from '../core/svg.js';
import { primary } from '../core/input.js';
import { SEAL } from '../ink/palette.js';
import { primitive } from './primitive.js';

// 点选：画面上若干目标，点中时调用 onTap(target)。
//   targets: [{ id, at: [x, y], r, required, hint }]   镜头坐标；required 的全部被"收下"后完成
//   onTap(target, auto) → true 表示该目标已收下（不再响应）；auto 为真表示是自动完成在代点
//   hint: 在目标处显示脉冲圈
// 键盘：Tab 依次聚焦未完成目标，Enter 点选。自动完成时按顺序代点所有剩余的 required 目标。
export function taps(cut, { prompt, targets, onTap }) {
  return primitive(cut, prompt, api => {
    const gest = cut.gest;
    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    const taken = new Set();
    const rings = new Map();
    for (const t of targets) {
      if (!t.hint) continue;
      const c = cut.toScreen(t.at[0], t.at[1]);
      rings.set(t.id, el('circle', { class: 'start', cx: c.x, cy: c.y, r: Math.max(16, (t.r || 40) * .5 * c.k), fill: 'none', stroke: SEAL, 'stroke-width': 2 }, gest));
    }
    const left = () => targets.filter(t => t.required && !taken.has(t.id));
    const take = (t, auto = false) => {
      if (taken.has(t.id)) return;
      if (onTap(t, auto)) { taken.add(t.id); rings.get(t.id)?.remove(); }
      if (!left().length) { gest.innerHTML = ''; api.finish(); }
    };
    const hit = (x, y) => {
      let best = null, bd = Infinity;
      for (const t of targets) {
        if (taken.has(t.id)) continue;
        const d = Math.hypot(x - t.at[0], y - t.at[1]);
        if (d < (t.r || 40) && d < bd) { best = t; bd = d; }
      }
      return best;
    };
    api.on(cut.root, 'pointerdown', primary(e => {
      const s = cut.toShot(e.clientX, e.clientY), t = hit(s.x, s.y);
      if (t) take(t);
    }));
    let focus = -1;
    api.on(window, 'keydown', e => {
      const open = targets.filter(t => !taken.has(t.id));
      if (!open.length) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        focus = (focus + 1) % open.length;
        for (const [id, r] of rings) r.setAttribute('stroke-width', id === open[focus].id ? 5 : 2);
      } else if (e.key === 'Enter' && focus >= 0) {
        e.preventDefault(); take(open[focus % open.length]);
      }
    });
    return () => { for (const t of left()) { take(t, true); if (api.done) break; } };
  });
}

// 二选一 / 多选一：点中任一选项即完成，返回其 id。自动完成时返回 fallback
//   options: [{ id, at: [x, y], r }]
export function choose(cut, { prompt, options, fallback }) {
  return primitive(cut, prompt, api => {
    const gest = cut.gest;
    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    for (const o of options) {
      const c = cut.toScreen(o.at[0], o.at[1]);
      el('circle', { class: 'start', cx: c.x, cy: c.y, r: Math.max(18, (o.r || 60) * .45 * c.k), fill: 'none', stroke: SEAL, 'stroke-width': 2 }, gest);
    }
    const pick = id => { gest.innerHTML = ''; api.finish(id); };
    api.on(cut.root, 'pointerdown', primary(e => {
      const s = cut.toShot(e.clientX, e.clientY);
      const o = options.find(o => Math.hypot(s.x - o.at[0], s.y - o.at[1]) < (o.r || 60));
      if (o) pick(o.id);
    }));
    // 键盘：数字键 1、2… 选择
    api.on(window, 'keydown', e => { const o = options[+e.key - 1]; if (o) { e.preventDefault(); pick(o.id); } });
    return () => pick(fallback ?? options[0].id);
  });
}
