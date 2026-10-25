import { el } from '../core/svg.js';
import { clamp, f1 } from '../core/math.js';
import { primary } from '../core/input.js';
import { loop } from '../core/tick.js';
import { SEAL, ink } from '../ink/palette.js';
import { primitive } from './primitive.js';

// 按住：在 at 附近按住（或按住空格）时进度上升，松开时回落；到 1 完成。
//   at / r      镜头坐标中的目标点与可按范围
//   duration    持续按住多少毫秒完成
//   decay       松开后每毫秒回落多少（0 表示不回落）
//   onProgress(p, holding)  每帧回调
export function hold(cut, { prompt, at, r = 140, duration = 2400, decay = 1 / 4000, onProgress = () => {} }) {
  return primitive(cut, prompt, api => {
    const gest = cut.gest;
    let p = 0, pressed = false, key = false;

    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    const c = cut.toScreen(at[0], at[1]), R = Math.max(48, 46 * c.k);
    el('circle', { class: 'start', cx: c.x, cy: c.y, r: R * .55, fill: 'none', stroke: SEAL, 'stroke-width': 2 }, gest);
    el('circle', { cx: c.x, cy: c.y, r: R, fill: 'none', stroke: ink(.25), 'stroke-width': 6 }, gest);
    const arc = el('circle', { cx: c.x, cy: c.y, r: R, fill: 'none', stroke: SEAL, 'stroke-width': 6, 'stroke-linecap': 'round',
      transform: `rotate(-90 ${c.x} ${c.y})`, 'stroke-dasharray': `0 ${2 * Math.PI * R}` }, gest);
    const draw = () => arc.setAttribute('stroke-dasharray', `${f1(p * 2 * Math.PI * R)} ${f1(2 * Math.PI * R)}`);

    const near = e => { const s = cut.toShot(e.clientX, e.clientY); return Math.hypot(s.x - at[0], s.y - at[1]) < r; };
    api.on(cut.root, 'pointerdown', primary(e => { if (near(e)) pressed = true; }));
    api.on(cut.root, 'pointerup', primary(() => { pressed = false; }));
    api.on(cut.root, 'pointercancel', primary(() => { pressed = false; }));
    api.on(window, 'keydown', e => { if (e.key === ' ') { e.preventDefault(); key = true; } });
    api.on(window, 'keyup', e => { if (e.key === ' ') key = false; });

    const end = () => { gest.innerHTML = ''; api.finish(); };
    api.stopOnEnd(loop((t, dt) => {
      const holding = pressed || key;
      p = clamp(p + (holding ? dt * 16.667 / duration : -dt * 16.667 * decay), 0, 1);
      onProgress(p, holding);
      draw();
      if (p >= 1) end();
    }));
    return () => { p = 1; onProgress(1, false); end(); };
  });
}
