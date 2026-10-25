import { reseed, R } from '../../core/rng.js';
import { f1 } from '../../core/math.js';
import { el } from '../../core/svg.js';
import { PAPER, WALL, SKIN, ROBE, SEAL, BRUSH, ink, paper } from '../../ink/palette.js';
import { ridge, areaD, taper, bez, ellD } from '../../ink/paths.js';
import { willow, bridge, pine, person, longHouse, gableHouse, pavilion } from '../../ink/scenery.js';
import { catmull, linGrad, radGrad, peaks } from '../02-yixing/scene.js';

// 第四幕 · 舣舟 的画面（1600×900 镜头坐标）
// 万里长卷 → 金山 · 对镜 → 运河万人 → （T7）孙氏馆 · 灯影 → 舣舟亭

// 山脊在两端（或一端）渐低到底线，避免画面上出现竖直的切边
const fade = (pts, base, x0, x1, w, ends = 'both') => pts.map(([x, y]) => {
  const a = ends === 'right' ? 1 : (x - x0) / w, b = ends === 'left' ? 1 : (x1 - x) / w;
  return [x, base + (y - base) * Math.max(0, Math.min(1, a, b))];
});

// ── 万里长卷 ──────────────────────────────────────────────
// 长卷比一屏宽：卷面在镜头坐标 x ∈ [SCROLL_X0, SCROLL_X0 + SCROLL_W]、y ∈ [300, 600]
// 起始时整幅镜头缩到 SCROLL_S0，恰好与第三幕结尾展开的长卷重合（第三幕：卷高 220、宽 2960，缩放 .55，中心 y 330）
export const SCROLL_S0 = 121 / 300, SCROLL_W = Math.round(2960 * .55 / SCROLL_S0), SCROLL_X0 = 800 - SCROLL_W / 2, SCROLL_DY = -66;
export const STATIONS = [
  { id: 'bian', name: '汴京', x: SCROLL_X0 + 170, y: 400 },
  { id: 'hangzhou', name: '杭州', x: SCROLL_X0 + 660, y: 520, stop: true, item: 'willow', thing: '一枝柳' },
  { id: 'ying', name: '颍州', x: SCROLL_X0 + 1130, y: 420 },
  { id: 'yang', name: '扬州', x: SCROLL_X0 + 1550, y: 470 },
  { id: 'ding', name: '定州', x: SCROLL_X0 + 2020, y: 350 },
  { id: 'huizhou', name: '惠州', x: SCROLL_X0 + 2720, y: 540, stop: true, item: 'litchi', thing: '一颗荔枝' },
  { id: 'danzhou', name: '儋州', x: SCROLL_X0 + 3540, y: 560, stop: true, item: 'shell', thing: '一枚贝壳' },
];

export function drawScroll(svg) {
  reseed(401);
  const x0 = SCROLL_X0, x1 = SCROLL_X0 + SCROLL_W;
  el('rect', { x: x0, y: 300, width: SCROLL_W, height: 300, fill: WALL, stroke: ink(.45), 'stroke-width': 2.4 }, svg);
  // 卷上江山：一路远山；南边（儋州一带）是海。平移的层，不加滤镜
  el('path', { d: areaD(fade(ridge(x0 + 20, x1 - 700, 420, 14, 90, 90, 240, 260), 470, x0 + 20, x1 - 700, 260, 'right'), x0 + 20, x1 - 700, 470), fill: linGrad(svg, 'a4Hill2', [[0, .14], [1, .02]]) }, svg);
  el('path', { d: areaD(fade(ridge(x0 + 20, x1 - 700, 470, 14, 100, 80, 200, 220), 520, x0 + 20, x1 - 700, 260, 'right'), x0 + 20, x1 - 700, 520), fill: linGrad(svg, 'a4Hill', [[0, .28], [1, .04]]) }, svg);
  for (let x = x0 + 60; x < x1 - 900; x += R(120, 260)) el('path', { d: `M${f1(x)},${f1(R(540, 580))} q9,-4 18,0 t18,0`, fill: 'none', stroke: ink(.25), 'stroke-width': 1.2 }, svg);
  // 海
  for (let i = 0; i < 70; i++) {
    const x = R(x1 - 1000, x1 - 30), y = R(470, 585), l = R(20, 50), a = Math.min(1, (x - (x1 - 1000)) / 400);
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-5 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: ink(f1(.1 + .2 * a)), 'stroke-width': 1.4 }, svg);
  }
  el('line', { x1: x1 - 900, y1: 462, x2: x1 - 20, y2: 462, stroke: ink(.3), 'stroke-width': 1.2 }, svg);
  // 驿站：墨圈 + 竖排地名（墨线到了才显出来）
  const labels = STATIONS.map(s => {
    const g = el('g', { opacity: 0 }, svg);
    el('circle', { cx: s.x, cy: s.y, r: 7, fill: WALL, stroke: ink(.8), 'stroke-width': 2.4 }, g);
    [...s.name].forEach((ch, i) => el('text', { x: s.x + 30, y: s.y - 40 + i * 30, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 28, fill: ink(.8), text: ch }, g));
    return g;
  });
  // 路线：自汴京一路南下至儋州
  const pts = catmull([[x0 + 40, 380], ...STATIONS.map(s => [s.x, s.y]), [x1 - 60, 470]], 16);
  const route = el('path', { d: 'M' + pts.map(p => `${f1(p[0])},${f1(p[1])}`).join('L'), fill: 'none', stroke: ink(.82), 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  const head = el('g', {}, svg);
  el('path', { d: 'M-22,0 Q0,10 22,-4 Q16,8 0,9 Q-14,8 -22,0 Z', fill: ink(.9) }, head);
  el('line', { x1: 0, y1: 2, x2: 0, y2: -26, stroke: ink(.85), 'stroke-width': 2 }, head);
  el('path', { d: 'M1,-25 Q12,-14 1,-4 Z', fill: WALL, stroke: ink(.7), 'stroke-width': 1.2 }, head);
  // 卷轴两端
  for (const x of [x0 - 30, x1]) el('rect', { x, y: 270, width: 30, height: 360, rx: 8, fill: ink(.85) }, svg);
  return { route, head, labels };
}

// 停靠驿站时浮出的小景（册页）
export function stationCard(mid, id) {
  reseed({ hangzhou: 411, huizhou: 412, danzhou: 413 }[id]);
  const s = STATIONS.find(s => s.id === id);
  const g = el('g', { opacity: 0 }, mid);
  g.style.transition = 'opacity .5s';
  el('rect', { x: 548, y: 138, width: 504, height: 384, fill: ink(.12) }, g);
  el('rect', { x: 540, y: 130, width: 504, height: 384, fill: WALL, stroke: ink(.6), 'stroke-width': 2 }, g);
  el('rect', { x: 556, y: 146, width: 472, height: 352, fill: 'none', stroke: ink(.3), 'stroke-width': 1 }, g);
  const art = el('g', {}, g);
  if (id === 'hangzhou') {
    // 苏堤春晓：长堤、拱桥、垂柳，柳色如烟
    el('path', { d: areaD(ridge(560, 1020, 300, 10, 60, 60, 140, 160), 560, 1020, 330), fill: linGrad(mid, 'a4CardHill', [[0, .2], [1, .03]]) }, art);
    el('path', { d: 'M560,410 Q760,396 1024,404 L1024,416 Q760,408 560,422 Z', fill: ink(.55) }, art);
    bridge(art, 800, 404, .55);
    for (const [x, h] of [[640, 170], [700, 140], [930, 160]]) willow(art, x, 410, h, .1);
    for (let i = 0; i < 16; i++) el('path', { d: `M${f1(R(580, 1000))},${f1(R(436, 480))} q8,-4 16,0 t16,0`, fill: 'none', stroke: ink(.22), 'stroke-width': 1 }, art);
  } else if (id === 'huizhou') {
    // 罗浮山下，荔枝满树
    el('path', { d: areaD(ridge(560, 1020, 330, 30, 150, 80, 180, 200), 560, 1020, 400), fill: linGrad(mid, 'a4CardLuofu', [[0, .26], [1, .04]]) }, art);
    el('path', { d: taper(bez([780, 470], [770, 420], [800, 380], [790, 330], 10), 16, 6), fill: ink(.8) }, art);
    for (let i = 0; i < 36; i++) { const a = R(0, Math.PI * 2), r = R(0, 120); el('path', { d: ellD(790 + Math.cos(a) * r * 1.3, 300 + Math.sin(a) * r * .55, R(10, 22), R(7, 13)), fill: ink(f1(R(.35, .7))) }, art); }
    for (let i = 0; i < 22; i++) { const a = R(0, Math.PI * 2), r = R(10, 110); el('circle', { cx: f1(790 + Math.cos(a) * r * 1.3), cy: f1(304 + Math.sin(a) * r * .55), r: 5, fill: SEAL, opacity: .9 }, art); }
    el('line', { x1: 560, y1: 472, x2: 1024, y2: 472, stroke: ink(.4), 'stroke-width': 1.4 }, art);
  } else {
    // 海天一线，茅屋读书
    el('line', { x1: 560, y1: 330, x2: 1024, y2: 330, stroke: ink(.4), 'stroke-width': 1.2 }, art);
    for (let i = 0; i < 40; i++) { const x = R(570, 1010), y = R(340, 480), l = R(16, 40); el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-5 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: ink(f1(R(.15, .35))), 'stroke-width': 1.3 }, art); }
    el('path', { d: 'M640,470 Q720,440 820,452 L900,470 Z', fill: ink(.5) }, art);
    el('rect', { x: 690, y: 400, width: 110, height: 56, fill: WALL, stroke: ink(.7), 'stroke-width': 1.4 }, art);
    el('path', { d: 'M676,404 L745,350 L814,404 Z', fill: ink(.6) }, art);
    for (let k = 0; k < 9; k++) el('line', { x1: 690 + k * 14, y1: 403, x2: 745, y2: 354, stroke: paper(.25), 'stroke-width': 1 }, art);
    el('rect', { x: 724, y: 420, width: 34, height: 36, fill: ink(.8) }, art);
    person(art, 741, 454, 30, .3, 1);
    for (const [x, h] of [[880, 130], [940, 110]]) { el('path', { d: taper(bez([x, 470], [x + 4, 430], [x + 16, 390], [x + 24, h + 230], 8), 6, 2), fill: ink(.75) }, art); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .55; el('path', { d: taper(bez([x + 24, h + 230], [x + 24 + Math.cos(a) * 30, h + 230 + Math.sin(a) * 20], [x + 24 + Math.cos(a) * 55, h + 236 + Math.sin(a) * 18], [x + 24 + Math.cos(a) * 70, h + 250 + Math.sin(a) * 10], 8), 4, .5), fill: ink(.7) }, art); } }
  }
  [...s.name].forEach((ch, i) => el('text', { x: 1000, y: 196 + i * 40, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 36, fill: ink(.85), text: ch }, g));
  el('text', { x: 792, y: 504, 'text-anchor': 'middle', 'font-size': 18, fill: ink(.6), 'letter-spacing': 4, text: `得 · ${s.thing}` }, g);
  return g;
}

// 满屏海浪（儋州的浪 → 长江的浪；两个镜头用同一幅，交接处看不出切换）
export function drawWaves(svg) {
  reseed(421);
  el('rect', { x: -40, y: 60, width: 1680, height: 900, fill: PAPER }, svg);
  for (let row = 0; row < 14; row++) {
    const y = 60 + row * 64;
    let d = `M-40,${y}`;
    for (let x = -40; x < 1640; x += 80) d += ` q20,${f1(-R(18, 30))} 40,${f1(-R(4, 10))} q12,${f1(R(4, 10))} 40,${f1(R(14, 24))}`;
    el('path', { d: d + ` L1640,${y + 64} L-40,${y + 64} Z`, fill: row % 2 ? paper(1) : WALL }, svg);
    el('path', { d, fill: 'none', stroke: ink(f1(.35 + row * .03)), 'stroke-width': 2.2 }, svg);
    for (let x = -40; x < 1640; x += 80) if (R(0, 1) < .6) el('path', { d: `M${f1(x + 26)},${f1(y - 14)} q8,-8 16,-2`, fill: 'none', stroke: ink(.3), 'stroke-width': 1.4 }, svg);
  }
}

// ── 金山 ─────────────────────────────────────────────────
export const TEMPLE = [820, 400];
export function drawRiver(bg) {
  reseed(431);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('path', { d: areaD(fade(ridge(0, 560, 560, 10, 60, 80, 200, 220), 580, 0, 560, 220, 'right'), 0, 560, 580), fill: ink(.2), filter: 'url(#fWash)' }, bg);
  el('path', { d: areaD(fade(ridge(1060, 1600, 560, 10, 70, 80, 200, 220), 580, 1060, 1600, 220, 'left'), 1060, 1600, 580), fill: ink(.2), filter: 'url(#fWash)' }, bg);
  for (let i = 0; i < 90; i++) { const x = R(0, 1600), y = R(580, 890), l = R(20, 60); el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-4 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: ink(f1(.08 + (y - 580) / 1500)), 'stroke-width': 1.3 }, bg); }
}
// 金山：宋时在江心，是岛
export function drawIsland(svg) {
  reseed(432);
  const top = peaks([[820, 300, 150], [690, 180, 100], [960, 200, 120]], 520, 1120, 640);
  const d = areaD(top, 520, 1120, 650);
  el('path', { d, fill: PAPER }, svg);
  el('path', { d, fill: linGrad(svg, 'a4Isle', [[0, .5], [.7, .3], [1, .15]]), filter: 'url(#fInkEdge)' }, svg);
  // 苔点：沿山脊与坡上
  let moss = '';
  for (let i = 0; i < 70; i++) { const p = top[Math.floor(R(0, top.length))]; if (p[1] > 630) continue; moss += ellD(p[0] + R(-6, 6), p[1] + R(2, 40), R(2, 4.5), R(1.4, 2.6)); }
  el('path', { d: moss, fill: ink(.7) }, svg);
  // 坡面：顺着山势的弧形短笔
  for (let i = 0; i < 26; i++) {
    const x = R(580, 1060), y = R(470, 620), side = x < 820 ? -1 : 1;
    el('path', { d: taper(bez([x, y], [x + side * 10, y + 4], [x + side * 18, y + 12], [x + side * 22, y + 22], 6), 2, .3), fill: ink(f1(R(.18, .32))) }, svg);
  }
  for (const [x, y, w, h] of [[650, 590, 64, 24], [890, 580, 76, 26], [740, 500, 54, 20], [920, 500, 50, 20]]) longHouse(svg, x, y, w, h);
  // 寺塔
  const px = 820, base = 360;
  for (let i = 0; i < 6; i++) {
    const w = 46 - i * 6, y = base - i * 26;
    el('rect', { x: px - w / 2, y: y - 20, width: w, height: 20, fill: WALL, stroke: ink(.6), 'stroke-width': 1.2 }, svg);
    el('path', { d: `M${px - w / 2 - 14},${y - 18} Q${px},${y - 26} ${px + w / 2 + 14},${y - 18} L${px + w / 2 + 6},${y - 26} L${px - w / 2 - 6},${y - 26} Z`, fill: ink(.88) }, svg);
  }
  el('line', { x1: px, y1: base - 156, x2: px, y2: base - 186, stroke: ink(.9), 'stroke-width': 2.4 }, svg);
  for (const [x, y, h] of [[600, 600, 90], [1040, 610, 80], [760, 430, 60]]) pine(svg, x, y, h);
  for (let i = 0; i < 14; i++) el('path', { d: `M${f1(R(520, 1100))},${f1(R(652, 690))} q10,-4 20,0 t20,0`, fill: 'none', stroke: ink(.28), 'stroke-width': 1.3 }, svg);
}

// ── 对镜：画中的苏轼与画前的苏轼 ──────────────────────────
export const PORTRAIT = [620, 330];
export function drawHall(bg) {
  reseed(441);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: linGrad(bg, 'a4Hall', [[0, .12], [.8, .04], [1, .2]]) }, bg);
  el('line', { x1: 0, y1: 800, x2: 1600, y2: 800, stroke: ink(.4), 'stroke-width': 2 }, bg);
  for (const x of [120, 1480]) el('rect', { x: x - 18, y: 0, width: 36, height: 800, fill: ink(.6) }, bg);
  // 立轴：李公麟所画的像
  el('rect', { x: 452, y: 70, width: 336, height: 700, fill: ink(.18) }, bg);
  el('rect', { x: 470, y: 96, width: 300, height: 640, fill: SKIN, stroke: ink(.5), 'stroke-width': 1.4 }, bg);
  el('rect', { x: 440, y: 56, width: 360, height: 16, rx: 4, fill: ink(.85) }, bg);
  el('rect', { x: 430, y: 764, width: 380, height: 20, rx: 6, fill: ink(.85) }, bg);
  el('line', { x1: 620, y1: 20, x2: 620, y2: 56, stroke: ink(.7), 'stroke-width': 2 }, bg);
}

// 老年苏轼胸像（东坡巾、长须已白）。fine 为画中白描；否则为画前的人，墨色更重
export function oldFace(g, x, y, s, fine) {
  const o = el('g', { transform: `translate(${x},${y}) scale(${s})` }, g);
  const line = fine ? ink(.75) : ink(.92), lw = fine ? 1.6 : 2.6;
  // 肩与交领
  el('path', { d: 'M-150,330 Q-140,170 -50,130 L50,130 Q140,170 150,330 Z', fill: fine ? ROBE : ink(.55), stroke: line, 'stroke-width': lw }, o);
  el('path', { d: 'M-50,130 L18,250 M50,130 L-18,250', fill: 'none', stroke: line, 'stroke-width': lw }, o);
  // 脸
  el('ellipse', { cx: 0, cy: -6, rx: 44, ry: 56, fill: SKIN, stroke: line, 'stroke-width': lw }, o);
  el('path', { d: 'M-44,4 Q-56,0 -52,16 Q-48,26 -40,22 M44,4 Q56,0 52,16 Q48,26 40,22', fill: 'none', stroke: line, 'stroke-width': lw }, o);
  // 东坡巾：高筒、后垂
  el('path', { d: 'M-46,-34 L-42,-116 Q0,-128 42,-116 L46,-34 Q0,-44 -46,-34 Z', fill: ink(fine ? .7 : .9) }, o);
  el('path', { d: 'M-42,-116 L-24,-138 L24,-138 L42,-116', fill: ink(fine ? .7 : .9) }, o);
  el('line', { x1: -44, y1: -76, x2: 44, y2: -76, stroke: paper(.3), 'stroke-width': 1.2 }, o);
  // 眉眼鼻
  for (const sx of [-1, 1]) {
    el('path', { d: taper([[sx * 8, -22], [sx * 20, -26], [sx * 32, -22]], 3.2, 1), fill: ink(fine ? .55 : .7) }, o);
    el('path', { d: `M${sx * 10},-12 Q${sx * 19},-17 ${sx * 28},-12`, fill: 'none', stroke: line, 'stroke-width': lw * .8 }, o);
    el('circle', { cx: sx * 19, cy: -12, r: 2.2, fill: line }, o);
    el('path', { d: `M${sx * 12},-4 Q${sx * 20},0 ${sx * 30},-4`, fill: 'none', stroke: ink(.25), 'stroke-width': 1 }, o);
  }
  el('path', { d: 'M-3,-10 Q-6,10 -10,16 Q0,21 10,16', fill: 'none', stroke: line, 'stroke-width': lw * .8 }, o);
  // 须：白而长
  el('path', { d: 'M-30,22 Q-34,80 -14,140 Q0,170 10,140 Q34,80 30,22 Q0,38 -30,22 Z', fill: paper(.95), stroke: line, 'stroke-width': lw * .8 }, o);
  for (let i = 0; i < 9; i++) { const sx = -22 + i * 5.5; el('path', { d: `M${f1(sx)},30 Q${f1(sx * .7)},90 ${f1(sx * .3)},${f1(130 + R(-10, 10))}`, fill: 'none', stroke: ink(.28), 'stroke-width': 1 }, o); }
  el('path', { d: 'M-4,22 Q-26,20 -40,36 M4,22 Q26,20 40,36', fill: 'none', stroke: line, 'stroke-width': lw * .8 }, o);
  return o;
}

// ── 运河万人 ─────────────────────────────────────────────
export const CANAL = { far: 330, near: 570 };
export const GROUPS = [
  { id: 'scholar', at: [300, 300], kind: 1, n: 5 },
  { id: 'farmer', at: [1250, 300], kind: 2, n: 4 },
  { id: 'elder', at: [400, 760], kind: 0, n: 4 },
  { id: 'child', at: [980, 690], kind: 3, n: 4, small: true },
  { id: 'monk', at: [1360, 780], kind: 3, n: 3 },
];
export function drawCanal(bg) {
  reseed(451);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  // 远岸：屋舍、柳、密密的人
  for (let x = 20; x < 1600; x += R(110, 190)) (R(0, 1) < .5 ? longHouse : gableHouse)(bg, x, CANAL.far - 40, R(80, 120), R(40, 60));
  for (const x of [180, 620, 1040, 1480]) willow(bg, x, CANAL.far - 4, 150, R(-.1, .1));
  for (let i = 0; i < 220; i++) person(bg, R(0, 1600), CANAL.far + R(-36, 2), R(20, 30), R(.25, .5), Math.floor(R(0, 4)));
  el('path', { d: `M0,${CANAL.far} L1600,${CANAL.far + 6}`, stroke: ink(.6), 'stroke-width': 3, filter: 'url(#fBleed)' }, bg);
  // 河
  el('rect', { x: 0, y: CANAL.far + 4, width: 1600, height: CANAL.near - CANAL.far, fill: linGrad(bg, 'a4Canal', [[0, .05], [1, .12]]) }, bg);
  for (let i = 0; i < 60; i++) { const x = R(0, 1600), y = R(CANAL.far + 20, CANAL.near - 10), l = R(20, 60); el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-4 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: ink(.18), 'stroke-width': 1.2 }, bg); }
  el('path', { d: `M0,${CANAL.near} L1600,${CANAL.near - 6}`, stroke: ink(.7), 'stroke-width': 3, filter: 'url(#fBleed)' }, bg);
  // 近岸人海（背影）
  for (let i = 0; i < 150; i++) { const y = R(CANAL.near + 40, 940); person(bg, R(-20, 1620), y, 36 + (y - CANAL.near) * .16, R(.22, .45), Math.floor(R(0, 4))); }
}
// 运河上苏轼的船
export function drawCanalBoat(mid) {
  const g = el('g', {}, mid), bx = 760, by = 480;
  el('path', { d: `M${bx - 170},${by - 14} Q${bx},${by + 18} ${bx + 170},${by - 14} Q${bx + 130},${by + 34} ${bx},${by + 38} Q${bx - 130},${by + 34} ${bx - 170},${by - 14} Z`, fill: ink(.88) }, g);
  el('path', { d: `M${bx - 90},${by} C${bx - 90},${by - 62} ${bx + 40},${by - 62} ${bx + 40},${by} Z`, fill: ink(.6) }, g);
  // 白袍、东坡巾：与两岸墨色人影区别开
  const fx = bx + 100, fy = by - 4, H = 76;
  el('path', { d: `M${fx - 18},${fy} Q${fx - 16},${fy - H * .45} ${fx - 10},${fy - H * .7} Q${fx},${fy - H * .78} ${fx + 10},${fy - H * .7} Q${fx + 16},${fy - H * .45} ${fx + 18},${fy} Z`, fill: paper(.95), stroke: ink(.9), 'stroke-width': 2 }, g);
  el('circle', { cx: fx, cy: fy - H * .83, r: 7, fill: SKIN, stroke: ink(.9), 'stroke-width': 1.6 }, g);
  el('rect', { x: fx - 6, y: fy - H * 1.04, width: 12, height: 12, fill: ink(.9) }, g);
  el('path', { d: `M${fx - 4},${fy - H * .76} Q${fx},${fy - H * .55} ${fx + 4},${fy - H * .76}`, fill: paper(.9), stroke: ink(.5), 'stroke-width': 1 }, g);
  for (let i = 0; i < 6; i++) el('path', { d: `M${bx - 150 - i * 40},${by + 18 + (i % 2) * 6} q12,-4 24,0`, fill: 'none', stroke: ink(.3), 'stroke-width': 1.4 }, g);
  return g;
}
// 一群人：GROUPS 中的一类，画在 mid（可被点中）
export function drawGroup(mid, grp) {
  reseed(460 + GROUPS.indexOf(grp));
  const g = el('g', {}, mid), [x, y] = grp.at, far = y < CANAL.near;
  const h = (far ? 46 : 84) * (grp.small ? .62 : 1);
  for (let i = 0; i < grp.n; i++) person(g, x + (i - (grp.n - 1) / 2) * h * .5 + R(-6, 6), y + R(-6, 6), h * R(.9, 1.08), R(.86, .96), grp.kind);
  return g;
}
// 人群说的话：浅色衬底的横排字
export function speech(mid, [x, y], text, far) {
  const g = el('g', { opacity: 0 }, mid);
  g.style.transition = 'opacity .5s';
  const ty = far ? y - 72 : y - 120;
  el('text', { x, y: ty, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 32, fill: 'none', stroke: paper(.95), 'stroke-width': 10, 'stroke-linejoin': 'round', text }, g);
  el('text', { x, y: ty, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 32, fill: ink(.9), text }, g);
  return g;
}

// ── 孙氏馆 · 灯影 ───────────────────────────────────────
export const WIN = { x: 470, y: 100, w: 660, h: 430 };
export const TABLE_Y = 700, LAMP_GOAL = 800, GLYPH = [800, 316];
export const DOOR = { x: 1220, y: 130, w: 300, h: 600 };
export const ROPE = { post: [1236, 690], boat: [1420, 612], dock: [1290, 640] };

export function drawRoom(bg) {
  reseed(471);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: ink(.88) }, bg);
}
// 窗：窗纸、窗棂、窗外藤影
export function drawWindow(svg) {
  reseed(472);
  const { x, y, w, h } = WIN;
  el('rect', { x: x - 16, y: y - 16, width: w + 32, height: h + 32, fill: ink(.95) }, svg);
  el('rect', { x, y, width: w, height: h, fill: paper(.2) }, svg);
  // 藤影：月光把窗外的藤投在窗纸上（只落在窗纸内）
  el('rect', { x, y, width: w, height: h }, el('clipPath', { id: 'a4Vine' }, el('defs', {}, svg)));
  const vine = el('g', { 'clip-path': 'url(#a4Vine)' }, svg);
  for (let i = 0; i < 7; i++) {
    const sx = x + R(0, w), pts = bez([sx, y], [sx + R(-60, 60), y + h * .3], [sx + R(-80, 80), y + h * .6], [sx + R(-40, 40), y + R(h * .5, h)], 14);
    el('path', { d: taper(pts, 4, 1.2), fill: ink(.32) }, vine);
    for (let k = 3; k < pts.length; k += 3) { const p = pts[k], s = R(0, 1) < .5 ? -1 : 1; el('path', { d: ellD(p[0] + s * 12, p[1], 11, 6), fill: ink(.24) }, vine); }
  }
  for (let i = 1; i < 6; i++) el('line', { x1: x + w * i / 6, y1: y, x2: x + w * i / 6, y2: y + h, stroke: ink(.75), 'stroke-width': 4 }, svg);
  for (let i = 1; i < 4; i++) el('line', { x1: x, y1: y + h * i / 4, x2: x + w, y2: y + h * i / 4, stroke: ink(.75), 'stroke-width': 4 }, svg);
}
// 门外：河、月、系着的小船（船单独返回，放舟时移动）
export function drawRiverDoor(svg, mid) {
  reseed(473);
  const { x, y, w, h } = DOOR;
  el('rect', { x, y, width: w, height: h, fill: ink(.6) }, svg);
  el('circle', { cx: x + 210, cy: y + 110, r: 26, fill: paper(.85) }, svg);
  el('circle', { cx: x + 210, cy: y + 110, r: 60, fill: radGrad(svg, 'a4Moon', [[0, paper(.35)], [1, paper(0)]]) }, svg);
  el('line', { x1: x, y1: y + 400, x2: x + w, y2: y + 400, stroke: paper(.25), 'stroke-width': 1.4 }, svg);
  for (let i = 0; i < 22; i++) { const xx = R(x + 10, x + w - 40), yy = R(y + 410, y + h - 10), l = R(16, 40); el('path', { d: `M${f1(xx)},${f1(yy)} q${f1(l / 4)},-4 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: paper(f1(R(.15, .35))), 'stroke-width': 1.3 }, svg); }
  el('path', { d: `M${x + 200},${y + 530} l4,-126 l12,0 l4,126 Z`, fill: paper(.08) }, svg);
  el('rect', { x: x - 20, y: y - 20, width: w + 40, height: h + 40, fill: 'none', stroke: ink(.95), 'stroke-width': 40 }, svg);
  el('rect', { x: ROPE.post[0] - 7, y: ROPE.post[1] - 40, width: 14, height: 70, fill: ink(.95) }, svg);
  const boat = el('g', {}, mid);
  const [bx, by] = ROPE.boat;
  el('path', { d: `M${bx - 70},${by - 8} Q${bx},${by + 10} ${bx + 70},${by - 8} Q${bx + 52},${by + 18} ${bx},${by + 20} Q${bx - 52},${by + 18} ${bx - 70},${by - 8} Z`, fill: ink(.95), stroke: paper(.3), 'stroke-width': 1.2 }, boat);
  el('path', { d: `M${bx - 20},${by - 2} C${bx - 20},${by - 30} ${bx + 30},${by - 30} ${bx + 30},${by - 2} Z`, fill: ink(.85), stroke: paper(.25), 'stroke-width': 1 }, boat);
  return boat;
}

// 桌与收集物。每件物品有桌上的样子（item）和投在窗上的影子（同一形状，墨色）
const ITEM_DRAW = {
  firecracker: (g, c, a) => { el('rect', { x: -8, y: -30, width: 16, height: 30, rx: 2, fill: a ? SEAL : c }, g); el('path', { d: 'M0,-30 q6,-10 0,-18', fill: 'none', stroke: c, 'stroke-width': 2 }, g); },
  bowl: (g, c) => { el('path', { d: 'M-24,-20 Q-22,0 0,0 Q22,0 24,-20 Z', fill: c }, g); el('rect', { x: -10, y: 0, width: 20, height: 4, fill: c }, g); },
  char: (g, c, a) => { el('rect', { x: -18, y: -34, width: 36, height: 34, fill: a ? WALL : c }, g); if (a) el('text', { x: 0, y: -8, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 26, fill: ink(.85), text: '橘' }, g); },
  orange: (g, c, a) => { el('circle', { cx: 0, cy: -14, r: 14, fill: a ? SEAL : c }, g); el('path', { d: 'M0,-28 q6,-8 12,-6', fill: 'none', stroke: c, 'stroke-width': 2 }, g); },
  cloud: (g, c, a) => { el('path', { d: 'M-26,0 Q-30,-16 -14,-18 Q-10,-32 6,-26 Q22,-32 24,-14 Q34,-6 24,0 Z', fill: a ? WALL : c, stroke: a ? c : 'none', 'stroke-width': 1.6 }, g); },
  tea: (g, c) => { el('path', { d: 'M-16,-22 L16,-22 L11,0 L-11,0 Z', fill: c }, g); el('path', { d: 'M16,-17 q10,2 4,10', fill: 'none', stroke: c, 'stroke-width': 3 }, g); },
  willow: (g, c) => { el('path', { d: taper([[0, 0], [6, -20], [2, -46]], 3, .6), fill: c }, g); for (let i = 0; i < 6; i++) el('path', { d: ellD(i % 2 ? 7 : -3, -10 - i * 6, 6, 2.4), fill: c }, g); },
  litchi: (g, c, a) => { el('circle', { cx: 0, cy: -12, r: 12, fill: a ? SEAL : c }, g); if (a) for (let i = 0; i < 6; i++) el('circle', { cx: f1(Math.cos(i) * 6), cy: f1(-12 + Math.sin(i) * 6), r: 1.3, fill: ink(.4) }, g); el('path', { d: 'M0,-24 l2,-8', stroke: c, 'stroke-width': 2 }, g); },
  shell: (g, c, a) => { el('path', { d: 'M-20,0 Q-22,-24 0,-28 Q22,-24 20,0 Z', fill: a ? WALL : c, stroke: a ? c : 'none', 'stroke-width': 1.6 }, g); if (a) for (let i = -2; i <= 2; i++) el('line', { x1: 0, y1: -2, x2: i * 8, y2: -26, stroke: c, 'stroke-width': 1 }, g); },
};
export function itemList(journey) {
  const list = (journey.items || []).filter(i => ITEM_DRAW[i]);
  return list.length ? list : ['firecracker'];        // 什么都没带也有一件（第一幕的爆竹纸），保证能成字
}
export function drawTable(svg, items) {
  reseed(474);
  el('rect', { x: 260, y: TABLE_Y, width: 1080, height: 22, fill: ink(.95), stroke: paper(.18), 'stroke-width': 1.4 }, svg);
  for (const x of [300, 1290]) el('rect', { x, y: TABLE_Y + 22, width: 18, height: 200, fill: ink(.95) }, svg);
  const xs = items.map((_, i) => 340 + (i + .5) * 920 / items.length);
  items.forEach((id, i) => { const g = el('g', { transform: `translate(${f1(xs[i])},${TABLE_Y}) scale(1.3)` }, svg); ITEM_DRAW[id](g, paper(.7), true); });
  return xs;
}
// 窗上的影子：每件物品一团影，lampX 决定投影位置；c 越接近 1 越聚拢成"舣"
export function createShadows(mid, items, xs) {
  reseed(475);
  const { x, y, w, h } = WIN;
  const defs = el('defs', {}, mid);
  el('rect', { x, y, width: w, height: h }, el('clipPath', { id: 'a4Win' }, defs));
  const root = el('g', { 'clip-path': 'url(#a4Win)' }, mid);
  const light = el('circle', { r: 360, fill: radGrad(mid, 'a4LampWin', [[0, 'rgba(247,241,228,.55)'], [.5, 'rgba(176,58,46,.12)'], [1, 'rgba(176,58,46,0)']]) }, root);
  // 字：物品越多笔画越饱满
  const glyph = el('text', { x: GLYPH[0], y: GLYPH[1] + 108, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 320, fill: ink(.8), stroke: ink(.8), 'stroke-width': f1(Math.min(10, 1 + items.length * 1.3)), 'stroke-linejoin': 'round', opacity: 0, text: '舣' }, root);
  // 聚拢后的落点：散在字的笔画范围里
  const slots = items.map((_, i) => { const a = i * 2.4; return [GLYPH[0] + Math.cos(a) * (40 + i * 14), GLYPH[1] + Math.sin(a) * (30 + i * 10)]; });
  const shades = items.map((id, i) => { const g = el('g', {}, root); ITEM_DRAW[id](g, ink(.62), false); return { g, dy: R(-60, 40) }; });
  const set = (lampX, c) => {
    light.setAttribute('cx', f1(800 - (lampX - 800) * .7)); light.setAttribute('cy', 300);
    const e = c * c * (3 - 2 * c);
    shades.forEach((s, i) => {
      const sx = 800 + (xs[i] - lampX) * 1.5, sy = 330 + s.dy;
      const px = sx + (slots[i][0] - sx) * e, py = sy + (slots[i][1] - sy) * e, sc = 3.2 + 1.2 * e;
      s.g.setAttribute('transform', `translate(${f1(px)},${f1(py + 30 * sc)}) scale(${f1(sc)})`);
      s.g.setAttribute('opacity', f1(.85 - .55 * Math.max(0, (c - .8) / .2)));
    });
    glyph.setAttribute('opacity', f1(Math.max(0, (c - .55) / .45)));
  };
  return { root, glyph, light, set };
}
// 灯：桌上可左右移动
export function createLamp(mid) {
  const g = el('g', {}, mid);
  const glow = el('circle', { cx: 0, cy: -52, r: 90, fill: radGrad(mid, 'a4Lamp', [[0, paper(.9)], [.25, 'rgba(176,58,46,.45)'], [1, 'rgba(176,58,46,0)']]) }, g);
  el('path', { d: 'M-18,0 L18,0 L10,-10 L4,-34 L-4,-34 L-10,-10 Z', fill: ink(.95), stroke: paper(.3), 'stroke-width': 1.2 }, g);
  el('path', { d: 'M-16,-34 L16,-34 L12,-40 L-12,-40 Z', fill: ink(.9), stroke: paper(.3), 'stroke-width': 1.2 }, g);
  const flame = el('path', { d: 'M0,-70 C6,-60 7,-50 0,-44 C-7,-50 -6,-60 0,-70 Z', fill: paper(.95) }, g);
  return {
    g,
    place(x, level = 1, t = performance.now()) {
      const fl = 1 + Math.sin(t * .019) * .06;
      g.setAttribute('transform', `translate(${f1(x)},${TABLE_Y})`);
      flame.setAttribute('transform', `translate(0,-44) scale(${f1(level * fl)}) translate(0,44)`);
      glow.setAttribute('opacity', f1(level));
    },
  };
}

// ── 舣舟亭 ───────────────────────────────────────────────
export const PAV_LAMP = [800, 585];
export function drawPavilion(bg, mid) {
  reseed(481);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('path', { d: areaD(ridge(0, 1600, 600, 10, 80, 90, 220, 240), 0, 1600, 620), fill: ink(.14), filter: 'url(#fWash)' }, bg);
  el('rect', { x: 0, y: 660, width: 1600, height: 240, fill: linGrad(bg, 'a4Pond', [[0, .06], [1, .14]]) }, bg);
  for (let i = 0; i < 50; i++) { const x = R(0, 1600), y = R(680, 890), l = R(20, 50); el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-4 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: ink(.2), 'stroke-width': 1.2 }, bg); }
  for (const [x, h, l] of [[300, 300, .1], [1300, 280, -.1], [1460, 220, .05]]) willow(bg, x, 664, h, l);
  pavilion(bg, 800, 664);
  // 亭中一盏灯
  el('circle', { cx: PAV_LAMP[0], cy: PAV_LAMP[1], r: 70, fill: radGrad(mid, 'a4PavLamp', [[0, paper(.95)], [.25, 'rgba(176,58,46,.4)'], [1, 'rgba(176,58,46,0)']]) }, mid);
  el('path', { d: `M${PAV_LAMP[0]},${PAV_LAMP[1] - 12} C${PAV_LAMP[0] + 5},${PAV_LAMP[1] - 4} ${PAV_LAMP[0] + 6},${PAV_LAMP[1] + 4} ${PAV_LAMP[0]},${PAV_LAMP[1] + 8} C${PAV_LAMP[0] - 6},${PAV_LAMP[1] + 4} ${PAV_LAMP[0] - 5},${PAV_LAMP[1] - 4} ${PAV_LAMP[0]},${PAV_LAMP[1] - 12} Z`, fill: SEAL }, mid);
  el('line', { x1: PAV_LAMP[0], y1: 536, x2: PAV_LAMP[0], y2: PAV_LAMP[1] - 12, stroke: ink(.7), 'stroke-width': 1.4 }, mid);
}

// 收集物的小图（对镜时在地名旁一闪）
export function drawItem(g, id) { ITEM_DRAW[id]?.(g, ink(.75), true); }
