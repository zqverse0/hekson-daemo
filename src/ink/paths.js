import { R } from '../core/rng.js';
import { f1 } from '../core/math.js';
import { noise1 } from '../core/noise.js';

// 点列 → 二次曲线路径
export function smooth(pts) {
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${f1(pts[i][0])},${f1(pts[i][1])} ${f1(mx)},${f1(my)}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L${f1(l[0])},${f1(l[1])}`;
}

// 三次贝塞尔采样
export function bez(p0, c1, c2, p3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
              u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]]);
  }
  return pts;
}

// 沿中心线生成两端粗细不同的笔触（模拟毛笔的起收笔）
export function taper(pts, w0, w1, wob = 0) {
  const n = pts.length, Lp = [], Rp = [], ph = R(0, 6);
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = (w0 + (w1 - w0) * i / (n - 1)) / 2 * (1 + wob * Math.sin(i * 1.9 + ph));
    Lp.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    Rp.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return 'M' + Lp.concat(Rp.reverse()).map(p => `${f1(p[0])},${f1(p[1])}`).join('L') + 'Z';
}

export const ellD = (cx, cy, rx, ry) => `M${f1(cx - rx)},${f1(cy)}a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0`;

// 山脊：高斯峰叠加 + 噪声
export function ridge(x0, x1, base, hmin, hmax, wmin, wmax, gap) {
  const peaks = [];
  for (let c = x0 - 150; c < x1 + 250; c += R(gap * .55, gap * 1.4)) peaks.push({ c, w: R(wmin, wmax), h: R(hmin, hmax) });
  const nz = noise1(), pts = [];
  for (let x = x0; x <= x1; x += 5) {
    let m = 0;
    for (const p of peaks) { const t = Math.abs(x - p.c) / p.w; m = Math.max(m, p.h * Math.exp(-Math.pow(t, 1.35))); }
    pts.push([x, base - m + nz(x * 2.5) * 7]);
  }
  return pts;
}

// 点列向下封闭到底边 h，成面
export const areaD = (pts, x0, x1, h = 900) => `M${x0},${h} ` + pts.map(p => `L${p[0]},${f1(p[1])}`).join('') + `L${x1},${h}Z`;
