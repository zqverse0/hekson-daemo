import { R, reseed } from '../../core/rng.js';
import { f1 } from '../../core/math.js';
import { el } from '../../core/svg.js';
import { noise1 } from '../../core/noise.js';
import { PAPER, WALL, SEAL, BRUSH, ink, paper } from '../../ink/palette.js';
import { ridge, areaD, taper, ellD } from '../../ink/paths.js';
import { longHouse, pavilion, person } from '../../ink/scenery.js';
import { linGrad, peaks } from '../02-yixing/scene.js';

// 第三幕 · 归去来兮 的画面（1600×900 镜头坐标）。元丰八年，白昼，麦熟（"今岁仍逢大有年"）

// 《归宜兴留题竹西寺》与逐字平仄（○平 ●仄）
export const POEM = ['此生已觉都无事', '今岁仍逢大有年', '山寺归来闻好语', '野花啼鸟亦欣然'];
export const TONES = ['仄平仄仄平平仄', '平仄平平仄仄平', '平仄平平平仄仄', '仄平平仄仄平平'];
export const OFF = { far: [-210, -90], temple: [240, -50], fields: [-180, 130] };
export const BAND = { far: [100, 380], temple: [380, 560], fields: [560, 900] };

// —— 竹西寺、麦田（吟诵） ——

export function drawSky(bg) {
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('rect', { x: 0, y: 0, width: 1600, height: 300, fill: linGrad(bg, 'y3Sky', [[0, .07], [1, 0]]) }, bg);
}

export function drawFar(svg) {
  el('path', { d: areaD(ridge(0, 1600, 330, 40, 150, 100, 260, 260), 0, 1600, 470), fill: linGrad(svg, 'y3Far1', [[0, .16], [1, 0]]), filter: 'url(#fWash)' }, svg);
  el('path', { d: areaD(ridge(0, 1600, 400, 40, 160, 90, 220, 240), 0, 1600, 520), fill: linGrad(svg, 'y3Far2', [[0, .3], [.7, .08], [1, 0]]), filter: 'url(#fWash)' }, svg);
}

// 山寺：右侧小山，山顶塔与殿，米点树
export function drawTemple(svg) {
  el('path', { d: areaD(peaks([[1160, 190, 230], [880, 90, 170], [1420, 120, 180]], 600, 1600, 560), 600, 1600, 640), fill: linGrad(svg, 'y3Hill', [[0, .5], [.6, .2], [1, 0]]), filter: 'url(#fInkEdge)' }, svg);
  // 塔：五层
  const px = 1100, base = 392;
  el('rect', { x: px - 14, y: base - 120, width: 28, height: 120, fill: WALL, stroke: ink(.6), 'stroke-width': 1.2 }, svg);
  for (let k = 0; k < 5; k++) {
    const y = base - k * 24 - 6, w = 34 - k * 4;
    el('path', { d: `M${px - w},${y} Q${px - w * .5},${y - 4} ${px - w * .4},${y - 10} L${px + w * .4},${y - 10} Q${px + w * .5},${y - 4} ${px + w},${y} Z`, fill: ink(.85) }, svg);
  }
  el('line', { x1: px, y1: base - 130, x2: px, y2: base - 150, stroke: ink(.85), 'stroke-width': 2 }, svg);
  longHouse(svg, 1150, 400, 110, 34);
  longHouse(svg, 1240, 412, 70, 26);
  // 米点树
  let a = '', b = '';
  for (let i = 0; i < 26; i++) {
    const x = R(960, 1380), y = R(400, 470);
    for (let j = 0; j < 6; j++) { const e = ellD(x + R(-10, 10), y + R(-8, 6), R(3, 5.5), R(2, 3.4)); if (j % 2) a += e; else b += e; }
  }
  el('path', { d: a, fill: ink(.3) }, svg);
  el('path', { d: b, fill: ink(.62) }, svg);
}

// 麦田与运河，河上一叶归舟（船头向左，往宜兴去）
export function drawFields(svg) {
  const nz = noise1();
  let d = `M0,910L0,${f1(568 + nz(0) * 8)}`;
  for (let x = 0; x <= 1600; x += 10) d += `L${x},${f1(568 + nz(x) * 8)}`;
  d += 'L1600,910Z';
  el('path', { d, fill: PAPER }, svg);
  el('path', { d, fill: ink(.04) }, svg);
  let rows = '';
  for (const y of [610, 668, 810, 868]) rows += `M-10,${f1(y + R(-4, 4))} Q${f1(R(400, 1200))},${f1(y - R(4, 12))} 1610,${f1(y + R(-4, 4))}`;
  el('path', { d: rows, fill: 'none', stroke: ink(.07), 'stroke-width': 1.2 }, svg);
  // 运河
  el('rect', { x: 0, y: 704, width: 1600, height: 62, fill: ink(.08) }, svg);
  el('path', { d: 'M0,704 L1600,704 M0,766 L1600,766', stroke: ink(.45), 'stroke-width': 1.8, filter: 'url(#fBleed)' }, svg);
  const w = el('g', { fill: 'none' }, svg);
  for (let i = 0; i < 40; i++) { const x = R(0, 1600), y = R(712, 760), l = R(12, 30); el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-2 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.1, .2))), 'stroke-width': 1 }, w); }
  // 归舟
  const bx = 520, by = 742;
  el('path', { d: `M${bx - 70},${by - 8} Q${bx},${by + 8} ${bx + 70},${by - 4} Q${bx + 50},${by + 14} ${bx},${by + 14} Q${bx - 50},${by + 14} ${bx - 70},${by - 8} Z`, fill: ink(.85) }, svg);
  el('path', { d: `M${bx - 10},${by - 4} C${bx - 10},${by - 32} ${bx + 40},${by - 32} ${bx + 40},${by - 4} Z`, fill: ink(.7) }, svg);
  person(svg, bx - 34, by - 4, 30, .9, 1);
}

// 吟诵时长出的景物：长按 → 麦浪 / 远山线（随按住延长），轻点 → 野花 / 飞鸟
export function createGrowth(mid) {
  reseed(311);
  const wheat = Array.from({ length: 16 }, (_, i) => [60 + (i % 8) * 196 + R(-30, 30), (i < 8 ? 640 : 846) + R(-14, 14)]);
  const hill = Array.from({ length: 16 }, (_, i) => [440 + (i % 8) * 140 + R(-20, 20), 210 + (i < 8 ? 0 : 50) + R(-16, 16)]);   // 避开左上的诗
  const flower = Array.from({ length: 16 }, () => [R(40, 1560), R(590, 890)].map((v, k) => k && v > 690 && v < 780 ? v + 100 : v));
  const bird = Array.from({ length: 16 }, () => [R(460, 1560), R(80, 220)]);
  const n = { long: 0, short: 0 };
  let cur = null;
  const start = () => { cur = null; };
  // 长按：先建一条虚线，按住时 dashoffset 递减
  const grow = (ms, longMs) => {
    if (!cur) {
      const k = n.long++, [x, y] = (k % 2 ? hill : wheat)[(k >> 1) % 16];
      const d = k % 2
        ? `M${f1(x)},${f1(y + 20)} q30,-26 60,-34 q24,10 40,0 q30,-20 70,-6 q20,14 40,22`
        : [0, 1, 2].map(j => `M${f1(x + j * 10)},${f1(y + j * 9)} q18,-10 36,0 t36,0 t36,0 t36,0 t36,0`).join('');   // 麦浪：三道错开的波纹
      cur = el('path', { d, fill: 'none', stroke: ink(k % 2 ? .38 : .5), 'stroke-width': k % 2 ? 2.4 : 2.6, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, mid);
    }
    cur.setAttribute('stroke-dashoffset', f1(1 - Math.min(1, ms / (longMs * 3))));
  };
  // 松开：长按补足到至少一半长；轻点落下花或鸟
  const end = (kind) => {
    if (kind === 'long') { if (cur) cur.setAttribute('stroke-dashoffset', f1(Math.min(+cur.getAttribute('stroke-dashoffset'), .45))); cur = null; return; }
    if (cur) { cur.remove(); cur = null; n.long--; }            // 按得太短：撤掉刚起的线
    const k = n.short++;
    if (k % 2) {
      const [x, y] = bird[(k >> 1) % 16];
      el('path', { d: `M${f1(x - 12)},${f1(y)} q6,-7 12,0 q6,-7 12,0`, fill: 'none', stroke: ink(.75), 'stroke-width': 2, 'stroke-linecap': 'round' }, mid);
    } else {
      const [x, y] = flower[(k >> 1) % 16];
      el('path', { d: `M${f1(x)},${f1(y + 22)} q-3,-10 -6,-20 M${f1(x)},${f1(y + 22)} q4,-12 10,-18 M${f1(x)},${f1(y + 22)} l0,-14`, fill: 'none', stroke: ink(.5), 'stroke-width': 1.4 }, mid);
      for (const [dx, dy] of [[-6, 0], [10, 3], [0, 8]]) for (let j = 0; j < 4; j++) el('circle', { cx: f1(x + dx + R(-4, 4)), cy: f1(y + dy - 4 + R(-4, 4)), r: f1(R(2.4, 4)), fill: SEAL, opacity: f1(R(.55, .9)) }, mid);
    }
  };
  return { start, grow, end };
}

// 待吟诵的诗：先以清墨写出，每吟一字转为浓墨；字旁标平仄（○平 ●仄）
export function createChantText(mid, { lines, tones, x0 = 300, y0 = 116, size = 36, step = 44, gap = 58 }) {
  const g = el('g', { 'font-family': BRUSH, 'font-size': size, 'text-anchor': 'middle' }, mid);
  const chars = [];
  lines.forEach((line, c) => [...line].forEach((ch, k) => {
    const x = x0 - c * gap, y = y0 + k * step, tone = tones[c][k];
    const t = el('text', { x, y, fill: ink(.16), text: ch }, g);
    const m = el('circle', { cx: x + size * .62, cy: y - size * .32, r: 4.5, fill: tone === '平' ? 'none' : ink(.45), stroke: ink(.45), 'stroke-width': 1.4 }, g);
    chars.push({ t, m, x, y, tone });
  }));
  const ring = el('rect', { width: size * 1.3, height: size * 1.25, rx: 4, fill: 'none', stroke: SEAL, 'stroke-width': 2.4, opacity: 0 }, g);
  const focus = i => {
    const c = chars[i];
    if (!c) { ring.setAttribute('opacity', 0); return; }
    ring.setAttribute('x', f1(c.x - size * .65)); ring.setAttribute('y', f1(c.y - size * .95)); ring.setAttribute('opacity', 1);
  };
  const sing = (i, match) => {
    const c = chars[i];
    c.t.setAttribute('fill', ink(.9));
    if (match) c.m.setAttribute('stroke', SEAL), c.m.setAttribute('fill', c.tone === '平' ? 'none' : SEAL);
  };
  return { g, chars, focus, sing };
}

// —— 运河上：诏书落下、船头掉转、回望 / 放舟 ——

export const BOAT = [800, 660];

export function drawRiverSky(bg) {
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('rect', { x: 0, y: 0, width: 1600, height: 440, fill: linGrad(bg, 'y3Sky2', [[0, .06], [1, 0]]) }, bg);
  el('rect', { x: 0, y: 440, width: 1600, height: 460, fill: linGrad(bg, 'y3Water', [[0, .05], [1, .12]]) }, bg);
  el('line', { x1: 0, y1: 440, x2: 1600, y2: 440, stroke: ink(.25), 'stroke-width': 1.2 }, bg);
  const w = el('g', { fill: 'none', 'stroke-linecap': 'round' }, bg);
  for (let i = 0; i < 130; i++) {
    const y = R(450, 890), x = R(0, 1600), l = R(10, 26) * (y - 400) / 300;
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-2 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.08, .2))), 'stroke-width': 1.1 }, w);
  }
}

// 身后的宜兴：岸、橘园（朱点）、楚颂亭；整层可缩小成地平线上一点
export const HOME = [300, 438];
export function drawHome(svg, { orchard = true } = {}) {
  el('path', { d: areaD(peaks([[200, 60, 120], [420, 40, 100], [60, 30, 90]], -40, 640, 440), -40, 640, 446), fill: ink(.32), filter: 'url(#fWash)' }, svg);
  el('path', { d: 'M-40,446 L640,446 L600,452 L-40,452 Z', fill: ink(.5) }, svg);
  if (orchard) for (let i = 0; i < 22; i++) {
    const x = R(140, 360), y = R(428, 444);
    el('path', { d: ellD(x, y - 3, 6, 4), fill: ink(.5) }, svg);
    if (R(0, 1) < .6) el('circle', { cx: f1(x + R(-3, 3)), cy: f1(y - 4), r: 1.8, fill: SEAL }, svg);
  }
  const pg = el('g', { transform: `translate(410,446) scale(.16)` }, svg);
  const P = pavilion(pg, 0, 0);
  P.plaque.innerHTML = '';
}

// 前方：开阔江面、远帆
export function drawAhead(svg) {
  el('path', { d: areaD(ridge(900, 1640, 436, 4, 26, 80, 180, 200), 900, 1640, 442), fill: ink(.14), filter: 'url(#fWash)' }, svg);
  for (const [x, y, s] of [[1080, 470, .7], [1300, 456, .5], [1480, 500, .9]]) {
    el('path', { d: `M${x},${y} l0,${-30 * s} l${16 * s},${26 * s} Z`, fill: ink(.45) }, svg);
    el('path', { d: `M${x - 12 * s},${y} l${28 * s},0 l-4,${4 * s} l${-20 * s},0 Z`, fill: ink(.6) }, svg);
  }
  // 长风
  for (let i = 0; i < 10; i++) {
    const x = R(820, 1560), y = R(300, 600), l = R(120, 260);
    el('path', { d: taper([[x, y], [x + l * .5, y - R(4, 10)], [x + l, y - R(0, 8)]], 2.2, .2), fill: ink(f1(R(.12, .22))) }, svg);
  }
}

// 船（船头朝左），可掉转；帆的鼓胀程度可调
export function createBoat(mid) {
  const [bx, by] = BOAT;
  const g = el('g', {}, mid);
  const body = el('g', {}, g);
  el('path', { d: `M${bx - 150},${by - 16} Q${bx},${by + 16} ${bx + 140},${by - 8} Q${bx + 110},${by + 34} ${bx},${by + 36} Q${bx - 110},${by + 34} ${bx - 150},${by - 16} Z`, fill: ink(.88) }, body);
  el('path', { d: `M${bx - 146},${by - 13} Q${bx},${by + 17} ${bx + 136},${by - 6}`, fill: 'none', stroke: paper(.3), 'stroke-width': 1.4 }, body);
  el('path', { d: `M${bx + 10},${by + 4} C${bx + 10},${by - 46} ${bx + 110},${by - 46} ${bx + 110},${by - 2} Z`, fill: ink(.7) }, body);
  person(body, bx - 60, by + 2, 52, .92, 1);
  el('line', { x1: bx - 10, y1: by + 6, x2: bx - 10, y2: by - 230, stroke: ink(.85), 'stroke-width': 4 }, body);
  const sail = el('path', { fill: WALL, stroke: ink(.7), 'stroke-width': 1.6 }, body);
  const ribs = el('path', { fill: 'none', stroke: ink(.35), 'stroke-width': 1.2 }, body);
  const splash = el('g', { opacity: 0 }, g);
  for (let i = 0; i < 5; i++) el('path', { d: `M${bx + 150 + i * 14},${by + 10 - i * 3} q8,-10 16,0`, fill: 'none', stroke: paper(.9), 'stroke-width': 2.4, 'stroke-linecap': 'round' }, splash);
  // full：0 收帆（垂着）… 1 满帆。dir：1 船头朝左时帆向右鼓（顺风往右）
  const setSail = full => {
    const top = by - 220, bot = by - 30, mx = bx - 10, bulge = 20 + 90 * full;
    sail.setAttribute('d', `M${mx},${top} Q${f1(mx + bulge)},${f1((top + bot) / 2)} ${mx},${bot} L${mx - 6},${bot} Q${f1(mx + bulge * .6 - 6)},${f1((top + bot) / 2)} ${mx - 6},${top} Z`);
    let r = '';
    for (let k = 1; k < 5; k++) { const y = top + (bot - top) * k / 5; r += `M${mx - 4},${f1(y)} q${f1(bulge * .9)},${f1(-4 * full)} ${f1(bulge * .95)},0`; }
    ribs.setAttribute('d', r);
  };
  setSail(0);
  // flip：1 船头朝左（往宜兴），-1 掉转后朝右
  const turn = flip => body.setAttribute('transform', `translate(${bx},0) scale(${f1(flip)},1) translate(${-bx},0)`);
  return { g, setSail, turn, splash };
}

// 第二卷诏书：卷着的轴，系朱绦
export function createEdict(mid) {
  const g = el('g', { opacity: 0 }, mid);
  el('rect', { x: -70, y: -12, width: 140, height: 24, rx: 4, fill: WALL, stroke: ink(.6), 'stroke-width': 1.4 }, g);
  for (const x of [-78, 70]) el('rect', { x, y: -15, width: 8, height: 30, rx: 2, fill: ink(.85) }, g);
  el('rect', { x: -6, y: -13, width: 12, height: 26, fill: SEAL }, g);
  return g;
}

// T4：诏书展开成万里长卷，画在单独一层（overflow 可见：拉远后长卷要伸出原画幅）。返回 set(k)：k 0..1 展开程度
export function createScroll(mid, cy = 330) {
  mid.style.overflow = 'visible';
  reseed(331);
  const g = el('g', { style: 'display:none' }, mid);
  const defs = el('defs', {}, g);
  const clip = el('rect', { x: 800, y: cy - 110, width: 0, height: 220 }, el('clipPath', { id: 'y3Scroll' }, defs));
  const paperR = el('rect', { x: 800, y: cy - 110, width: 0, height: 220, fill: WALL, stroke: ink(.45), 'stroke-width': 1.4 }, g);
  const art = el('g', { 'clip-path': 'url(#y3Scroll)' }, g);
  // 长卷上的江山：一路远山、江水、零星帆影（往后的过场就在这卷上）
  // 不加滤镜：展开时裁剪框每帧在变，带滤镜的内容会每帧重算
  el('path', { d: areaD(ridge(-1400, 3000, cy - 10, 10, 70, 80, 200, 220), -1400, 3000, cy + 40), fill: linGrad(mid, 'y3ScrollHill2', [[0, .14], [1, .02]]) }, art);
  el('path', { d: areaD(ridge(-1400, 3000, cy + 14, 10, 80, 70, 180, 200), -1400, 3000, cy + 40), fill: linGrad(mid, 'y3ScrollHill', [[0, .34], [1, .06]]) }, art);
  el('line', { x1: -1400, y1: cy + 46, x2: 3000, y2: cy + 46, stroke: ink(.4), 'stroke-width': 1.4 }, art);
  for (let x = -1300; x < 3000; x += R(160, 320)) el('path', { d: `M${f1(x)},${cy + 70} q8,-4 16,0 t16,0`, fill: 'none', stroke: ink(.3), 'stroke-width': 1 }, art);
  for (let x = -1200; x < 3000; x += R(400, 700)) { el('path', { d: `M${f1(x)},${cy + 62} l0,-16 l9,13 Z`, fill: ink(.5) }, art); }
  const rollers = [-1, 1].map(() => el('rect', { y: cy - 122, width: 14, height: 244, rx: 4, fill: ink(.85) }, g));
  const set = k => {
    g.style.display = '';
    const w = 160 + k * 2800, x = 800 - w / 2;
    for (const r of [clip, paperR]) { r.setAttribute('x', f1(x)); r.setAttribute('width', f1(w)); }
    rollers[0].setAttribute('x', f1(x - 14)); rollers[1].setAttribute('x', f1(x + w));
  };
  return { g, set };
}

