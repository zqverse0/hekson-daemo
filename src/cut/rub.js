import { el } from '../core/svg.js';
import { f1 } from '../core/math.js';
import { primary } from '../core/input.js';
import { SEAL } from '../ink/palette.js';
import { primitive } from './primitive.js';

// 来回擦动：在 box 内拖动，笔迹画进 paint（一个 <mask> 里的 <g>），被遮住的内容随笔迹显出。
// 用于临帖描摹、点茶击拂。擦到 threshold 比例的格子即完成，其余一次显出。
//   box     [x, y, w, h] 镜头坐标
//   paint   mask 内的 <g>：笔迹以白色描边画进去
//   brush   笔迹半径（镜头坐标）
//   onProgress(p)  覆盖比例 0..1
// 键盘：按住空格自动来回擦。自动完成时整块显出。
export function rub(cut, { prompt, box, paint, brush = 40, threshold = .6, grid = 10, onProgress = () => {} }) {
  return primitive(cut, prompt, api => {
    const [x0, y0, w, h] = box;
    const cells = new Uint8Array(grid * grid);
    let filled = 0, path = null, d = '', last = null, keyHeld = false;

    const gest = cut.gest;
    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    const c = cut.toScreen(x0 + w / 2, y0 + h / 2);
    el('circle', { class: 'start', cx: c.x, cy: c.y, r: Math.max(24, 30 * c.k), fill: 'none', stroke: SEAL, 'stroke-width': 2 }, gest);

    const mark = (x, y) => {
      for (let gy = 0; gy < grid; gy++) for (let gx = 0; gx < grid; gx++) {
        const i = gy * grid + gx;
        if (cells[i]) continue;
        const cx = x0 + (gx + .5) * w / grid, cy = y0 + (gy + .5) * h / grid;
        if (Math.hypot(cx - x, cy - y) < brush) { cells[i] = 1; filled++; }
      }
    };
    const end = () => {
      if (api.done) return;
      el('rect', { x: x0 - brush, y: y0 - brush, width: w + brush * 2, height: h + brush * 2, fill: '#fff' }, paint);
      gest.innerHTML = '';
      onProgress(1);
      api.finish();
    };
    const to = (x, y) => {
      if (!path) {
        d = `M${f1(x)},${f1(y)}l0.1,0`;
        path = el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': brush * 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, paint);
        last = [x, y]; mark(x, y);
      } else {
        const n = Math.ceil(Math.hypot(x - last[0], y - last[1]) / (brush / 2)) || 1;
        for (let i = 1; i <= n; i++) mark(last[0] + (x - last[0]) * i / n, last[1] + (y - last[1]) * i / n);
        d += `L${f1(x)},${f1(y)}`; path.setAttribute('d', d); last = [x, y];
      }
      const p = filled / cells.length;
      onProgress(p);
      if (p >= threshold) end();
    };
    const inBox = (x, y) => x > x0 - brush && x < x0 + w + brush && y > y0 - brush && y < y0 + h + brush;
    let down = false;
    api.on(cut.root, 'pointerdown', primary(e => {
      const s = cut.toShot(e.clientX, e.clientY);
      if (!inBox(s.x, s.y)) return;
      down = true; path = null; to(s.x, s.y);
    }));
    api.on(cut.root, 'pointermove', primary(e => { if (down) { const s = cut.toShot(e.clientX, e.clientY); to(s.x, s.y); } }));
    const up = primary(() => { down = false; path = null; });
    api.on(cut.root, 'pointerup', up);
    api.on(cut.root, 'pointercancel', up);

    // 键盘：按住空格，在框内之字形来回
    let k = 0;
    const rows = Math.max(2, Math.ceil(h / brush));
    api.every(() => {
      if (!keyHeld) return;
      const row = Math.floor(k / 6) % rows, col = k % 6, fwd = row % 2 === 0;
      const x = x0 + w * (fwd ? col : 5 - col) / 5, y = y0 + h * (row + .5) / rows;
      if (k % 6 === 0) path = null;
      to(x, y); k++;
    }, 50);
    api.on(window, 'keydown', e => { if (e.key === ' ') { e.preventDefault(); keyHeld = true; } });
    api.on(window, 'keyup', e => { if (e.key === ' ') keyHeld = false; });
    return end;
  });
}
