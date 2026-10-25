import { R, reseed } from '../../core/rng.js';
import { f1 } from '../../core/math.js';
import { el } from '../../core/svg.js';
import { noise1 } from '../../core/noise.js';
import { PAPER, WALL, STONE, SEAL, BRUSH, ink, paper } from '../../ink/palette.js';
import { ridge, areaD, taper, ellD, bez } from '../../ink/paths.js';
import { willow, longHouse, gableHouse } from '../../ink/scenery.js';
import { glyph } from '../../ink/glyph.js';

// 第二幕 · 宜兴 的公用画面（1600×900 镜头坐标）：俯瞰图、字化为景、橘树、竹、牛、上表
// 元丰七年，白昼，纸色为底。

export const SITE_AT = { peak: [300, 236], stele: [770, 548], orchard: [420, 760], tea: [1290, 724] };
export const OX = [660, 836];
export const OPENING = '吾来阳羡船入荆溪意思豁然';     // 《楚颂帖》首句，去标点后写在溪面上
export const MAP_OFF = { lake: [260, -90], hills: [-230, -60], river: [210, 90], fields: [-170, 140] };
export const MAP_BAND = { lake: [140, 330], hills: [330, 480], river: [480, 640], fields: [640, 900] };
const RIVER = [[-40, 660], [240, 616], [520, 580], [780, 556], [1040, 534], [1270, 494], [1440, 410], [1560, 300], [1660, 240]];

// Catmull-Rom 加密点列
export function catmull(pts, n = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const RIVER_PTS = catmull(RIVER);
const riverAt = t => RIVER_PTS[Math.round(t * (RIVER_PTS.length - 1))];

// 渐变：同一时刻文档内唯一即可（旧镜头会先被移除）
export function linGrad(svg, id, stops, attrs = { x1: 0, y1: 0, x2: 0, y2: 1 }) {
  const defs = svg.querySelector('defs') || el('defs', {}, svg);
  const g = el('linearGradient', { id, ...attrs }, defs);
  for (const [o, a] of stops) el('stop', { offset: o, 'stop-color': '#1c1b19', 'stop-opacity': a }, g);
  return `url(#${id})`;
}
export function radGrad(svg, id, stops) {
  const defs = svg.querySelector('defs') || el('defs', {}, svg);
  const g = el('radialGradient', { id }, defs);
  for (const [o, c] of stops) el('stop', { offset: o, 'stop-color': c }, g);
  return `url(#${id})`;
}

// 山：指定峰位的高斯峰叠加（ridge 的峰位是随机的，铜官山要落在固定位置）
export function peaks(list, x0, x1, base) {
  const nz = noise1(), pts = [];
  for (let x = x0; x <= x1; x += 5) {
    let m = 0;
    for (const [c, h, w] of list) m = Math.max(m, h * Math.exp(-Math.pow(Math.abs(x - c) / w, 1.35)));
    pts.push([x, base - m + nz(x * 2.5) * 6]);
  }
  return pts;
}

// —— 景物 ——

// 橘树：干 + 米点树冠 + 朱色橘子。返回 { g, crown, fruit }
export function orangeTree(parent, x, y, h, { fruit = true } = {}) {
  const g = el('g', {}, parent);
  const cy = y - h * .62, rr = h * .36;
  el('path', { d: taper(bez([x, y], [x - h * .04, y - h * .2], [x + h * .05, y - h * .4], [x, y - h * .55], 8), h * .07, h * .025), fill: ink(.82) }, g);
  for (const s of [-1, 1]) el('path', { d: taper(bez([x, y - h * .38], [x + s * h * .1, y - h * .46], [x + s * h * .18, y - h * .5], [x + s * h * .24, y - h * .62], 6), h * .03, h * .01), fill: ink(.8) }, g);
  const crown = el('g', {}, g);
  let back = '', front = '';
  for (let i = 0; i < 120; i++) {
    const a = R(0, Math.PI * 2), d = rr * Math.sqrt(R(0, 1));
    const px = x + Math.cos(a) * d * 1.15, py = cy + Math.sin(a) * d * .8, s = R(.022, .04) * h;
    if (i % 3) back += ellD(px, py, s, s * .62); else front += ellD(px, py, s * .8, s * .5);
  }
  el('path', { d: back, fill: ink(.3) }, crown);
  el('path', { d: front, fill: ink(.62) }, crown);
  const fr = el('g', { fill: SEAL, opacity: fruit ? .9 : 0 }, g);
  for (let i = 0; i < 9; i++) {
    const a = R(0, Math.PI * 2), d = rr * Math.sqrt(R(.1, .9));
    el('circle', { cx: f1(x + Math.cos(a) * d * 1.1), cy: f1(cy + Math.sin(a) * d * .75), r: f1(h * .032) }, fr);
  }
  return { g, crown, fruit: fr };
}

// 竹：分节的竿 + "个"字竹叶
export function bamboo(parent, x, y, h, lean = 0, a = .8) {
  const g = el('g', {}, parent);
  const top = [x + lean * h, y - h];
  const pts = bez([x, y], [x + lean * h * .2, y - h * .35], [x + lean * h * .6, y - h * .7], top, 12);
  const w = Math.max(3, h * .022);
  el('path', { d: taper(pts, w, w * .6), fill: ink(f1(a * .75)) }, g);
  let nodes = '';
  for (let i = 1; i < 12; i += 2) { const p = pts[i]; nodes += `M${f1(p[0] - w)},${f1(p[1])}l${f1(w * 2)},0`; }
  el('path', { d: nodes, stroke: paper(.7), 'stroke-width': 1.6, fill: 'none' }, g);
  for (let k = 0; k < 5; k++) {
    const p = pts[6 + Math.floor(R(0, 6))], side = k % 2 ? 1 : -1;
    for (let j = 0; j < 3; j++) {
      const ang = (side > 0 ? 0 : Math.PI) + side * R(.25, .9) + (j - 1) * .45, l = h * R(.1, .16);
      const e = [p[0] + Math.cos(ang) * l, p[1] + Math.sin(ang) * l * .7 + l * .25];
      el('path', { d: taper([p, [(p[0] + e[0]) / 2, (p[1] + e[1]) / 2 - 3], e], h * .02, 0), fill: ink(f1(a * R(.7, 1))) }, g);
    }
  }
  return g;
}

// 耕牛（侧立，面向右）；(x, y) 为蹄底中点
export function ox(parent, x, y, s = 1) {
  const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
  for (const [lx, a] of [[-48, .6], [44, .6]]) el('path', { d: taper([[lx, -44], [lx + 3, -22], [lx + 1, 0]], 10, 6), fill: ink(a) }, g);
  el('path', { d: 'M-74,-62 Q-76,-96 -40,-100 L36,-102 Q64,-102 72,-84 L76,-56 Q72,-40 52,-40 L-54,-38 Q-74,-42 -74,-62 Z', fill: ink(.8) }, g);
  for (const lx of [-62, 58]) el('path', { d: taper([[lx, -46], [lx - 2, -22], [lx, 0]], 11, 7), fill: ink(.85) }, g);
  el('path', { d: 'M62,-96 Q86,-104 98,-90 L114,-62 Q116,-48 104,-46 Q94,-46 90,-56 L68,-66 Z', fill: ink(.88) }, g);
  el('path', { d: 'M90,-96 Q82,-116 66,-118 M98,-94 Q112,-114 128,-110', fill: 'none', stroke: ink(.85), 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M-74,-84 Q-90,-62 -84,-30', fill: 'none', stroke: ink(.8), 'stroke-width': 2.4 }, g);
  el('path', { d: ellD(-84, -28, 4, 7), fill: ink(.85) }, g);
  el('path', { d: 'M-40,-92 Q0,-98 40,-94', fill: 'none', stroke: paper(.35), 'stroke-width': 2 }, g);
  return g;
}

// —— 俯瞰图 ——

export function drawMapBg(bg) {
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('rect', { x: 0, y: 0, width: 1600, height: 220, fill: linGrad(bg, 'y2Sky', [[0, .08], [1, 0]]) }, bg);
}

// 太湖：远岸、湖面、帆
export function drawLake(svg) {
  el('path', { d: areaD(ridge(0, 1600, 196, 8, 42, 80, 180, 210), 0, 1600, 204), fill: ink(.24), filter: 'url(#fWash)' }, svg);
  el('rect', { x: 0, y: 200, width: 1600, height: 150, fill: linGrad(svg, 'y2Lake', [[0, .09], [1, .02]]) }, svg);
  const w = el('g', { fill: 'none', 'stroke-linecap': 'round' }, svg);
  for (let i = 0; i < 70; i++) {
    const x = R(0, 1600), y = R(212, 340), l = R(14, 40);
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-2 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.07, .16))), 'stroke-width': 1 }, w);
  }
  for (const [x, y, s] of [[980, 236, 1], [1180, 262, .8], [1340, 228, .7], [1460, 280, .9]]) {
    el('path', { d: `M${x},${y} l0,${-30 * s} l${16 * s},${26 * s} Z`, fill: ink(.5) }, svg);
    el('path', { d: `M${x - 14 * s},${y} l${30 * s},0 l-4,${5 * s} l${-22 * s},0 Z`, fill: ink(.7) }, svg);
  }
}

// 群山：铜官山居左
export function drawHills(svg) {
  el('path', { d: areaD(peaks([[330, 280, 230], [620, 190, 190], [900, 120, 170], [1160, 70, 160], [80, 170, 140]], 0, 1600, 470), 0, 1600, 520),
    fill: ink(.22), filter: 'url(#fWash)' }, svg);
  const front = peaks([[300, 250, 170], [110, 130, 110], [560, 150, 140], [820, 84, 120], [1060, 46, 110]], 0, 1600, 486);
  el('path', { d: areaD(front, 0, 1600, 530), fill: linGrad(svg, 'y2Hill', [[0, .62], [.6, .3], [1, 0]], { x1: 0, y1: 0, x2: 0, y2: 1 }), filter: 'url(#fInkEdge)' }, svg);
  // 苔点
  let moss = '';
  for (let i = 0; i < front.length; i += 3) {
    const [x, y] = front[i];
    if (y > 470 || R(0, 1) < .45) continue;
    moss += ellD(x + R(-4, 4), y + R(2, 10), R(2, 4.2), R(1.4, 2.6));
  }
  el('path', { d: moss, fill: ink(.75) }, svg);
}

// 荆溪：自左下蜿蜒入太湖；溪上一叶小舟
export function drawRiver(svg) {
  const d = taper(RIVER_PTS, 58, 120);
  el('path', { d, fill: PAPER }, svg);
  el('path', { d, fill: ink(.08), stroke: ink(.42), 'stroke-width': 1.8, filter: 'url(#fBleed)' }, svg);
  const w = el('g', { fill: 'none', 'stroke-linecap': 'round' }, svg);
  for (let i = 0; i < 46; i++) {
    const [x, y] = riverAt(R(0, 1)), l = R(10, 26);
    el('path', { d: `M${f1(x + R(-14, 14))},${f1(y + R(-10, 10))} q${f1(l / 4)},-2 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.1, .22))), 'stroke-width': 1 }, w);
  }
  const [bx, by] = riverAt(.36);
  el('path', { d: `M${bx - 26},${by} Q${bx},${by + 6} ${bx + 26},${by - 2} Q${bx + 18},${by + 10} ${bx},${by + 10} Q${bx - 18},${by + 10} ${bx - 26},${by} Z`, fill: ink(.85) }, svg);
  el('path', { d: `M${bx - 8},${by + 1} C${bx - 8},${by - 14} ${bx + 10},${by - 14} ${bx + 10},${by} Z`, fill: ink(.7) }, svg);
}

// 田野：近处的地面、阡陌、村舍
export function drawFields(svg) {
  const nz = noise1();
  let d = `M0,910L0,${f1(620 + nz(0) * 8)}`;
  for (let x = 0; x <= 1600; x += 10) d += `L${x},${f1(620 + nz(x) * 8 - x * .012)}`;
  d += 'L1600,910Z';
  el('path', { d, fill: PAPER }, svg);
  el('path', { d, fill: ink(.035) }, svg);
  // 阡陌：几道起伏的田埂，竖埂稀疏错落、不成方格
  let rows = '';
  for (const y of [676, 740, 818]) rows += `M-10,${f1(y + R(-6, 6))} Q${f1(R(300, 600))},${f1(y - R(6, 18))} ${f1(R(800, 1000))},${f1(y - 8)} T1610,${f1(y + R(-10, 4))}`;
  el('path', { d: rows, fill: 'none', stroke: ink(.16), 'stroke-width': 1.6, 'stroke-linecap': 'round' }, svg);
  let cols = '';
  for (const [y0, y1] of [[640, 676], [676, 740], [740, 818], [818, 900]]) for (let x = R(40, 180); x < 1080; x += R(170, 300)) cols += `M${f1(x)},${y0 + 4} q${f1(R(-8, 8))},${f1((y1 - y0) / 2)} ${f1(R(-16, -4))},${y1 - y0 - 8}`;
  el('path', { d: cols, fill: 'none', stroke: ink(.13), 'stroke-width': 1.3, 'stroke-linecap': 'round' }, svg);
  const v = el('g', {}, svg);
  longHouse(v, 960, 676, 70, 30);
  gableHouse(v, 1046, 686, 64, 34);
  v.setAttribute('opacity', .8);
}

// 字化为景的落点：前四字成山峦（米点树、苔点），中四字成田垄，后四字成竹林
const DETAIL_AT = [[300, 300], [130, 380], [560, 352], [840, 410], [560, 690], [300, 830], [780, 760], [960, 856], [1170, 690], [1290, 740], [1410, 684], [1520, 770]];
export function drawDetail(svg) {
  const groups = DETAIL_AT.map(([x, y], i) => {
    const g = el('g', {}, svg);
    if (i < 4) {
      let dots = '', dark = '';
      for (let k = 0; k < 7; k++) {
        const tx = x + R(-60, 60), ty = y + R(-10, 30);
        el('path', { d: `M${f1(tx)},${f1(ty + 22)} L${f1(tx + R(-2, 2))},${f1(ty)}`, stroke: ink(.6), 'stroke-width': 1.6 }, g);
        for (let j = 0; j < 7; j++) { const a = R(-1, 1) * 9, b = R(-1, 1) * 7; const e = ellD(tx + a, ty + b, R(3, 5), R(2, 3.2)); if (j % 2) dots += e; else dark += e; }
      }
      el('path', { d: dots, fill: ink(.3) }, g);
      el('path', { d: dark, fill: ink(.6) }, g);
    } else if (i < 8) {
      // 秧苗：一丛三笔，成行而不齐
      let t = '';
      for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) {
        const tx = x - 80 + k * 21 + r * 7 + R(-3, 3), ty = y - 14 + r * 15 + R(-2, 2);
        for (let j = 0; j < 4; j++) {          // 一丛四五片叶，长短、斜度各异，叶尖微弯
          const a = R(-.9, .7), h = R(6, 13), bx = tx + R(-2, 2);
          t += `M${f1(bx)},${f1(ty)}q${f1(Math.sin(a) * h * .3)},${f1(-h * .6)} ${f1(Math.sin(a) * h)},${f1(-Math.cos(a) * h)}`;
        }
      }
      el('path', { d: t, fill: 'none', stroke: ink(.45), 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
    } else {
      for (let k = 0; k < 4; k++) bamboo(g, x + R(-40, 40), y + R(-6, 10), R(80, 140), R(-.15, .15), R(.6, .9));
    }
    return g;
  });
  return groups;
}

// 字化为景（T5）：溪面上写出《楚颂帖》首句，字迹散开化作山峦、田垄、竹林
export function createOpening(mid, detailSvg, groups) {
  const chars = [...OPENING].map((ch, i) => {
    const t = .1 + (i + Math.floor(i / 4) * .8) / (OPENING.length + 1.6) * .82;
    const [x, y] = riverAt(t);
    return el('text', { x: f1(x), y: f1(y + 15), 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 44, fill: ink(.88), opacity: 0, text: ch }, mid);
  });
  const cap = el('text', { x: 1160, y: 620, 'font-size': 16, fill: ink(.5), 'letter-spacing': 2, opacity: 0, text: '——苏轼《楚颂帖》' }, mid);
  return {
    chars, cap,
    show(i) { chars[i].setAttribute('opacity', 1); },
    // k：0..1 的散开进度
    scatter(k) {
      detailSvg.style.display = '';
      chars.forEach((c, i) => {
        const e = Math.min(1, Math.max(0, k * 1.6 - i * .05));
        const x0 = +c.getAttribute('x'), y0 = +c.getAttribute('y') - 15, [tx, ty] = DETAIL_AT[i];
        const x = x0 + (tx - x0) * e, y = y0 + (ty - y0) * e;
        c.setAttribute('transform', `translate(${f1(x - x0)},${f1(y - y0)}) rotate(${f1(e * (i % 2 ? 30 : -30))} ${f1(x0)} ${f1(y0)})`);
        c.setAttribute('opacity', f1(1 - e));
        groups[i].setAttribute('opacity', f1(e));
      });
      cap.setAttribute('opacity', f1(Math.max(0, 1 - k * 2)));
    },
  };
}

// 地点名：未到为淡墨，到过为浓墨并钤一小方朱印
const LABEL = { peak: [[360, 196], '铜官山'], stele: [[700, 632], '荆溪岸'], orchard: [[250, 684], '田间'], tea: [[1350, 580], '竹林茶寮'] };
export function drawLabels(mid, done) {
  const g = el('g', {}, mid);
  for (const [id, [[x, y], name]] of Object.entries(LABEL)) {
    const on = done.has(id);
    [...name].forEach((ch, i) => el('text', { x, y: y + i * 32, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 30, fill: ink(on ? .9 : .45),
      stroke: PAPER, 'stroke-width': 6, 'stroke-linejoin': 'round', 'paint-order': 'stroke', text: ch }, g));
    if (on) el('rect', { x: x - 8, y: y + name.length * 32 - 14, width: 16, height: 16, fill: SEAL }, g);
  }
  // 田间种过橘：地图上也看得到那片橘林
  if (done.has('orchard')) for (let i = 0; i < 14; i++) el('circle', { cx: f1(SITE_AT.orchard[0] + R(-80, 80)), cy: f1(SITE_AT.orchard[1] + R(-20, 30)), r: 3, fill: SEAL, opacity: .8 }, g);
  return g;
}

// —— 上表 ——

// 田边案头：苏轼、表文、笔；第一幕施过粥时案头多一只粥碗
export function drawMemorial(bg, mid, { bowl }) {
  reseed(281);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('path', { d: areaD(ridge(0, 1600, 520, 40, 150, 90, 220, 260), 0, 1600, 600), fill: ink(.18), filter: 'url(#fWash)' }, bg);
  let rows = '';
  for (const y of [640, 690, 760, 850]) rows += `M-10,${y} Q800,${y - 14} 1610,${y - 4}`;
  el('path', { d: rows, fill: 'none', stroke: ink(.16), 'stroke-width': 1.4 }, bg);
  willow(bg, 1530, 660, 300, -.15);
  ox(bg, 1400, 724, .85);
  // 案
  el('path', { d: 'M420,742 L1340,742 L1320,760 L440,760 Z', fill: ink(.8) }, bg);
  el('path', { d: 'M470,760 l0,100 M1290,760 l0,100', stroke: ink(.8), 'stroke-width': 10 }, bg);
  el('use', { href: '#sym-sushi', x: 96, y: 112, width: 280, height: 630 }, bg);

  let glow = null;
  if (bowl) {
    const bx = 640, by = 742;
    glow = el('circle', { cx: bx, cy: by - 20, r: 70, fill: radGrad(mid, 'y2Bowl', [[0, 'rgba(176,58,46,.4)'], [1, 'rgba(176,58,46,0)']]), opacity: 0 }, mid);
    el('path', { d: `M${bx - 34},${by - 32} L${bx + 34},${by - 32} Q${bx + 30},${by} ${bx},${by} Q${bx - 30},${by} ${bx - 34},${by - 32} Z`, fill: WALL, stroke: ink(.8), 'stroke-width': 2 }, mid);
    el('ellipse', { cx: bx, cy: by - 32, rx: 34, ry: 6, fill: STONE, stroke: ink(.7), 'stroke-width': 1.5 }, mid);
  }

  // 表文
  const sheet = el('g', { opacity: 0 }, mid);
  el('rect', { x: 908, y: 150, width: 360, height: 462, fill: ink(.1) }, sheet);
  el('rect', { x: 900, y: 142, width: 360, height: 462, fill: WALL, stroke: ink(.4), 'stroke-width': 1.2 }, sheet);
  el('rect', { x: 892, y: 132, width: 376, height: 12, rx: 6, fill: ink(.85) }, sheet);
  el('rect', { x: 892, y: 602, width: 376, height: 12, rx: 6, fill: ink(.85) }, sheet);
  for (let x = 960; x < 1250; x += 60) el('line', { x1: x, y1: 160, x2: x, y2: 590, stroke: 'rgba(176,58,46,.22)', 'stroke-width': 1 }, sheet);
  const defs = el('defs', {}, sheet);
  const cols = [
    { x: 1200, chars: '乞常州居住表', size: 50, step: 64, a: 0, b: .45 },
    { x: 1124, chars: '臣有薄田在常州宜兴县', size: 30, step: 40, a: .45, b: .82 },
    { x: 1064, chars: '粗给饘粥', size: 30, step: 40, a: .82, b: 1 },
  ];
  cols.forEach((col, i) => {
    const cp = el('clipPath', { id: 'y2cw' + i }, defs);
    col.r = el('rect', { x: col.x - 40, y: 160, width: 80, height: 0 }, cp);
    const t = el('g', { 'clip-path': `url(#y2cw${i})`, 'font-family': BRUSH, 'font-size': col.size, fill: ink(.9), 'text-anchor': 'middle' }, sheet);
    [...col.chars].forEach((ch, k) => glyph(t, ch, col.x, 200 + (i ? 4 : 10) + k * col.step, col.size));
  });
  // 朱批（诏书飞回时出现）
  const zhu = el('text', { x: 990, y: 470, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 150, fill: SEAL, opacity: 0, transform: 'rotate(-8 990 430)', text: '准' }, sheet);
  const brush = el('g', { opacity: 0 }, sheet);
  el('path', { d: 'M0,0 L-6,-16 L6,-16 Z', fill: ink(.95) }, brush);
  el('rect', { x: -4, y: -120, width: 8, height: 104, fill: STONE, stroke: ink(.85), 'stroke-width': 1.5 }, brush);
  el('rect', { x: -5, y: -24, width: 10, height: 10, fill: ink(.9) }, brush);
  return { sheet, cols, brush, glow, zhu };
}

// —— 册页：其余几处以小景带过（游客版） ——
// leaves: [{ name, play, draw(svg, svg, { final: true }) }]
export function drawAlbum(bg, mid, leaves) {
  reseed(291);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  const W = 430, H = 242, gap = (1600 - W * leaves.length) / (leaves.length + 1);
  return leaves.map((lf, i) => {
    const x = gap + i * (W + gap), y = 290;
    el('rect', { x: x - 14, y: y - 14, width: W + 28, height: H + 28, fill: WALL, stroke: ink(.35), 'stroke-width': 1.2 }, bg);
    const s = el('svg', { x, y, width: W, height: H, viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', overflow: 'hidden' }, bg);
    lf.draw(s, s, { final: true });
    el('rect', { x, y, width: W, height: H, fill: 'none', stroke: ink(.6), 'stroke-width': 1.5 }, bg);
    const label = `${lf.name} · ${lf.play}`;
    el('text', { x: x + W / 2, y: y + H + 66, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 34, fill: ink(.85), 'letter-spacing': 4, text: label }, bg);
    // 盖在册页上的纸，依次揭开
    const cover = el('rect', { x: x - 16, y: y - 16, width: W + 32, height: H + 120, fill: PAPER }, mid);
    return { cover, at: [x + W / 2, y + H / 2] };
  });
}
