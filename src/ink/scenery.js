import { R, rnd } from '../core/rng.js';
import { f1 } from '../core/math.js';
import { el } from '../core/svg.js';
import { noise1 } from '../core/noise.js';
import { PAPER, WALL, STONE, BRUSH, ink, paper } from './palette.js';
import { bez, taper, ellD, ridge, areaD } from './paths.js';

// 柳：后层淡墨柳丝 → 干 → 枝 → 前层浓墨柳丝。返回前层柳丝的 <g>
export function willow(g, x, y, h, lean = 0) {
  const S = h / 200, tx = x + lean * h * .2, ty = y - h * .5;
  const trunk = bez([x, y], [x - 5 * S + lean * h * .03, y - h * .2], [tx + 7 * S, y - h * .36], [tx, ty], 16);
  const branches = [];
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1;
    const sp = trunk[Math.round(R(.45, 1) * (trunk.length - 1))];
    const ex = sp[0] + side * h * R(.08, .42) + lean * h * .08, ey = ty - h * R(.04, .34);
    branches.push(bez(sp, [sp[0] + side * h * R(.02, .1), sp[1] - h * R(.06, .16)], [ex - side * h * R(.03, .1), ey - h * R(0, .08)], [ex, ey], 10));
  }
  // 柳丝：带笔锋的垂丝 + 两侧交错的柳叶短笔
  const strands = (n, aMin, aMax) => {
    const sg = el('g', {}, g);
    for (let i = 0; i < n; i++) {
      const br = branches[Math.floor(rnd() * branches.length)];
      const o = br[Math.floor(R(.2, 1) * (br.length - 1))];
      const dir = o[0] >= tx ? 1 : -1, len = h * R(.28, .62);
      const ex = o[0] + dir * R(4, 18) * S + lean * 10 * S + R(-4, 4) * S;
      const ey = Math.min(o[1] + len, y - h * .05);
      const pts = bez(o, [o[0] + dir * R(8, 20) * S, o[1] - R(2, 12) * S], [ex + dir * R(0, 6) * S, o[1] + (ey - o[1]) * .35], [ex, ey], 9);
      const a = R(aMin, aMax);
      el('path', { d: taper(pts, 1.8 * S, .3 * S), fill: ink(f1(a)) }, sg);
      let d = '';
      for (let j = 2; j < pts.length; j++) {
        const p = pts[j], q = pts[j - 1], ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
        const la = ang + (j % 2 ? 1 : -1) * R(.35, .7), ll = R(4, 7) * S;
        d += `M${f1(p[0])},${f1(p[1])}l${f1(Math.cos(la) * ll)},${f1(Math.sin(la) * ll)}`;
      }
      el('path', { d, stroke: ink(f1(a * .9)), 'stroke-width': f1(1.7 * S), 'stroke-linecap': 'round', fill: 'none' }, sg);
    }
    return sg;
  };
  strands(24, .16, .32);                       // 后层淡墨
  el('path', { d: `M${f1(x - h * .08)},${y} Q${f1(x - h * .03)},${f1(y - h * .03)} ${f1(x)},${f1(y - h * .07)} Q${f1(x + h * .03)},${f1(y - h * .03)} ${f1(x + h * .09)},${y} Z`, fill: ink(.8) }, g);
  el('path', { d: taper(trunk, h * .085, h * .035, .1), fill: ink(.82) }, g);
  for (let i = 0; i < 7; i++) {
    const p = trunk[Math.floor(R(.05, .9) * trunk.length)], w = h * .03;
    el('path', { d: `M${f1(p[0] - w * R(.2, .8))},${f1(p[1])} q${f1(w * .4)},${f1(-h * .02)} ${f1(w * .3)},${f1(-h * .05)}`, stroke: paper(.35), 'stroke-width': f1(S), fill: 'none' }, g);
  }
  for (const br of branches) el('path', { d: taper(br, h * .03, h * .006), fill: ink(.85) }, g);
  return strands(34, .45, .85);                // 前层浓墨
}

export function bridge(g, x, y, s = 1) {
  const a = 34 * s, w = 96 * s, rise = 54 * s;
  el('path', { d: `M${x - w},${y} C${x - w * .6},${y - rise} ${x + w * .6},${y - rise} ${x + w},${y} Z M${x - a},${y} A${a} ${a} 0 0 1 ${x + a},${y} Z`,
    fill: ink(.5), 'fill-rule': 'evenodd', filter: 'url(#fBleed)' }, g);
  el('path', { d: `M${x - w * .92},${y - 8 * s} C${x - w * .55},${y - rise - 8 * s} ${x + w * .55},${y - rise - 8 * s} ${x + w * .92},${y - 8 * s}`, fill: 'none', stroke: ink(.75), 'stroke-width': 1.8 }, g);
  for (let i = -5; i <= 5; i++) {
    const px = x + i * w * .16, t = (px - (x - w)) / (2 * w), py = y - 8 * s - rise * .75 * Math.sin(Math.PI * t) - 1;
    el('line', { x1: f1(px), y1: f1(py), x2: f1(px), y2: f1(py + 9 * s), stroke: ink(.6), 'stroke-width': 1.2 }, g);
  }
  el('path', { d: `M${x - a},${y} A${a} ${a} 0 0 0 ${x + a},${y}`, fill: 'none', stroke: ink(.3), 'stroke-width': 2, filter: 'url(#fRipple)' }, g);
}

// 马头墙民居
export function gableHouse(g, x, y, w, h) {
  const s1 = 16, s2 = 30, top = y - h;
  const P = [[x, y], [x, top], [x + w * .18, top], [x + w * .18, top - s1], [x + w * .36, top - s1], [x + w * .36, top - s2],
    [x + w * .64, top - s2], [x + w * .64, top - s1], [x + w * .82, top - s1], [x + w * .82, top], [x + w, top], [x + w, y]];
  el('path', { d: 'M' + P.map(p => `${f1(p[0])},${f1(p[1])}`).join('L') + 'Z', fill: WALL, stroke: ink(.55), 'stroke-width': 1.3 }, g);
  for (const [a, b, yy] of [[0, .18, top], [.18, .36, top - s1], [.36, .64, top - s2], [.64, .82, top - s1], [.82, 1, top]]) {
    const xa = x + w * a, xb = x + w * b;
    el('path', { d: `M${f1(xa - 5)},${f1(yy + 1)} L${f1(xb + 5)},${f1(yy + 1)} L${f1(xb + 2)},${f1(yy - 6)} L${f1(xa - 2)},${f1(yy - 6)} Z`, fill: ink(.9) }, g);
  }
  el('rect', { x: f1(x + w * .42), y: f1(y - h * .45), width: f1(w * .16), height: f1(h * .45), fill: ink(.85) }, g);
  el('path', { d: `M${f1(x + w * .36)},${f1(y - h * .5)} L${f1(x + w * .64)},${f1(y - h * .5)}`, stroke: ink(.85), 'stroke-width': 3 }, g);
  for (const wx of [.14, .72]) {
    const rx = x + w * wx, ry = y - h * .78, ws = w * .14;
    el('rect', { x: f1(rx), y: f1(ry), width: f1(ws), height: f1(ws), fill: 'none', stroke: ink(.7), 'stroke-width': 1.2 }, g);
    el('path', { d: `M${f1(rx + ws / 2)},${f1(ry)}V${f1(ry + ws)}M${f1(rx)},${f1(ry + ws / 2)}H${f1(rx + ws)}`, stroke: ink(.5), 'stroke-width': 1 }, g);
  }
}

export function longHouse(g, x, y, w, h) {
  const top = y - h;
  el('rect', { x, y: top, width: w, height: h, fill: WALL, stroke: ink(.55), 'stroke-width': 1.3 }, g);
  el('path', { d: `M${x - 10},${top + 4} L${x + w + 10},${top + 4} L${x + w - 8},${top - 17} L${x + 8},${top - 17} Z`, fill: ink(.85) }, g);
  el('line', { x1: x - 10, y1: top + 4, x2: x + w + 10, y2: top + 4, stroke: ink(.95), 'stroke-width': 2.6 }, g);
  for (let tx = x + 6; tx < x + w; tx += 7) el('line', { x1: tx, y1: top + 1, x2: tx, y2: top - 14, stroke: paper(.16), 'stroke-width': 1 }, g);
  for (let i = 0; i < 3; i++) {
    const wx = x + w * (.12 + i * .3), ws = w * .16;
    el('rect', { x: f1(wx), y: f1(top + h * .25), width: f1(ws), height: f1(h * .38), fill: 'none', stroke: ink(.65), 'stroke-width': 1.1 }, g);
    for (let k = 1; k < 4; k++) el('line', { x1: f1(wx + ws * k / 4), y1: f1(top + h * .25), x2: f1(wx + ws * k / 4), y2: f1(top + h * .63), stroke: ink(.4), 'stroke-width': .9 }, g);
  }
}

export function pine(g, x, y, h) {
  const S = h / 300;
  const trunk = bez([x, y], [x - h * .12, y - h * .35], [x + h * .1, y - h * .62], [x - h * .02, y - h], 18);
  const tp = t => trunk[Math.round(t * (trunk.length - 1))];
  const brs = [[.42, -1, .38], [.56, 1, .42], [.7, -1, .34], [.83, 1, .3], [.95, -1, .18]].map(([t, side, l]) => {
    const s0 = tp(t), len = h * l * R(.85, 1.1), ex = s0[0] + side * len, ey = s0[1] - R(-.02, .08) * h;
    return { side, pts: bez(s0, [s0[0] + side * len * .3, s0[1] - h * .08], [s0[0] + side * len * .7, ey + h * .04], [ex, ey], 10) };
  });
  // 松针团：淡墨衬底 + 扇形针叶
  const cluster = (cx, cy, r, a) => {
    el('path', { d: ellD(cx, cy + r * .12, r * 1.05, r * .3), fill: ink(f1(a * .3)) }, g);
    let d = '';
    for (let k = 0; k <= 18; k++) {
      const an = -Math.PI * (.06 + .88 * k / 18) + R(-.04, .04), l = r * R(.8, 1.05);
      d += `M${f1(cx)},${f1(cy)}l${f1(Math.cos(an) * l)},${f1(Math.sin(an) * l * .62)}`;
    }
    d += `M${f1(cx - r)},${f1(cy + 1)}Q${f1(cx)},${f1(cy + r * .22)} ${f1(cx + r)},${f1(cy + 1)}`;
    el('path', { d, stroke: ink(f1(a)), 'stroke-width': f1(1.2 * S), fill: 'none', 'stroke-linecap': 'round' }, g);
  };
  // 树干：浅墨填色、浓墨勾边，加鳞皴
  el('path', { d: taper(trunk, h * .075, h * .028, .08), fill: 'rgba(120,108,92,.5)', stroke: ink(.9), 'stroke-width': f1(1.6 * S), 'stroke-linejoin': 'round' }, g);
  let sc = '';
  for (let i = 1; i < trunk.length - 2; i++) {
    const p = trunk[i], w = (h * .075 + (h * .028 - h * .075) * i / (trunk.length - 1)) * .28;
    for (const o of [-1, 1]) {
      const cx = p[0] + o * w + R(-2, 2) * S, cy = p[1] + R(-3, 3) * S, r = R(3, 5) * S;
      sc += `M${f1(cx - r)},${f1(cy)}q${f1(r)},${f1(r * .9)} ${f1(2 * r)},0`;
    }
  }
  el('path', { d: sc, stroke: ink(.7), 'stroke-width': f1(1.1 * S), fill: 'none' }, g);
  for (const b of brs) el('path', { d: taper(b.pts, h * .03, h * .01, .15), fill: ink(.85) }, g);
  for (const b of brs) {
    const e = b.pts[b.pts.length - 1], m = b.pts[5];
    cluster(m[0], m[1] - 10 * S, h * .1, .65);
    cluster((e[0] + m[0]) / 2 + b.side * 6 * S, e[1] - h * .06, h * .09, .55);
    cluster(e[0], e[1] - 4 * S, h * .13, .88);
  }
  const top = trunk[trunk.length - 1];
  cluster(top[0], top[1] - 4 * S, h * .12, .88);
}

// 亭子按部件分组，剧情里可以逐段"建起来"。返回 { pt, ey, platform, cols, rails, plaque, roof, top }
export function pavilion(g, px, by) {
  const pt = by - 26, ey = pt - 150, P = { pt, ey };
  const part = n => (P[n] = el('g', {}, g));
  let q = part('platform');
  el('path', { d: `M${px - 162},${by} L${px - 150},${pt} L${px + 150},${pt} L${px + 162},${by} Z`, fill: STONE, stroke: ink(.7), 'stroke-width': 1.6 }, q);
  for (let i = 0; i < 9; i++) { const sx = px - 136 + i * 34; el('line', { x1: sx, y1: pt + 4, x2: f1(sx + R(-4, 4)), y2: by - 3, stroke: ink(.25), 'stroke-width': 1 }, q); }
  for (let i = 0; i < 4; i++) { const sw = 84 - i * 8; el('rect', { x: px - sw / 2, y: by + i * 7 - 1, width: sw, height: 7, fill: STONE, stroke: ink(.5), 'stroke-width': 1 }, q); }
  const cols = [-118, -42, 42, 118];
  q = part('cols');
  for (const c of cols) el('rect', { x: px + c - 4, y: ey, width: 8, height: pt - ey, fill: ink(.86) }, q);
  q = part('rails');
  for (const [a, b] of [[-118, -42], [42, 118]]) {
    el('line', { x1: px + a, y1: pt - 36, x2: px + b, y2: pt - 36, stroke: ink(.85), 'stroke-width': 3 }, q);
    for (let bx = px + a + 9; bx < px + b; bx += 9) el('line', { x1: bx, y1: pt - 36, x2: bx, y2: pt, stroke: ink(.55), 'stroke-width': 1.3 }, q);
  }
  for (let i = 0; i < 3; i++) {
    const a = px + cols[i] + 4, b = px + cols[i + 1] - 4;
    el('rect', { x: a, y: ey + 4, width: b - a, height: 12, fill: 'none', stroke: ink(.7), 'stroke-width': 1.2 }, q);
    for (let fx = a + 6; fx < b; fx += 7) el('line', { x1: fx, y1: ey + 4, x2: fx, y2: ey + 16, stroke: ink(.45), 'stroke-width': 1 }, q);
  }
  q = part('plaque');
  el('rect', { x: px - 36, y: ey + 22, width: 72, height: 24, fill: ink(.9) }, q);
  el('text', { x: px, y: ey + 40, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 17, fill: PAPER, 'letter-spacing': 2, text: '舣舟亭' }, q);
  q = part('roof');
  el('path', { d: `M${px - 205},${ey - 40} Q${px - 160},${ey + 2} ${px - 110},${ey} L${px + 110},${ey} Q${px + 160},${ey + 2} ${px + 205},${ey - 40} Q${px + 70},${ey - 38} ${px},${ey - 128} Q${px - 70},${ey - 38} ${px - 205},${ey - 40} Z`, fill: ink(.88) }, q);
  for (let k = -7; k <= 7; k++) {
    if (!k) continue;
    el('line', { x1: px + k * 3, y1: ey - 120, x2: px + k * 26, y2: ey - 6 - Math.abs(k) * 2.5, stroke: paper(.16), 'stroke-width': 1.1 }, q);
  }
  el('path', { d: `M${px - 198},${ey - 38} Q${px - 158},${ey - 6} ${px - 110},${ey - 7} L${px + 110},${ey - 7} Q${px + 158},${ey - 6} ${px + 198},${ey - 38}`, fill: 'none', stroke: paper(.38), 'stroke-width': 1.5 }, q);
  el('path', { d: `M${px + 205},${ey - 40} Q${px + 70},${ey - 38} ${px},${ey - 128} Q${px - 70},${ey - 38} ${px - 205},${ey - 40}`, fill: 'none', stroke: ink(1), 'stroke-width': 3, 'stroke-linecap': 'round' }, q);
  q = part('top');
  el('line', { x1: px, y1: ey - 128, x2: px, y2: ey - 166, stroke: ink(.9), 'stroke-width': 2.5 }, q);
  el('circle', { cx: px, cy: ey - 140, r: 8, fill: ink(.9) }, q);
  el('ellipse', { cx: px, cy: ey - 155, rx: 5, ry: 6.5, fill: ink(.9) }, q);
  return P;
}

// 人群剪影；kind 0 髻 / 1 幞头 / 2 斗笠 / 其他 无头饰
export function person(g, x, y, h, a, kind) {
  const w = h * .46, c = ink(f1(a));
  el('path', { d: `M${f1(x - w * .5)},${f1(y)} Q${f1(x - w * .44)},${f1(y - h * .45)} ${f1(x - w * .3)},${f1(y - h * .7)} Q${f1(x)},${f1(y - h * .8)} ${f1(x + w * .3)},${f1(y - h * .7)} Q${f1(x + w * .44)},${f1(y - h * .45)} ${f1(x + w * .5)},${f1(y)} Z`, fill: c }, g);
  el('circle', { cx: f1(x), cy: f1(y - h * .83), r: f1(h * .105), fill: c }, g);
  if (kind === 0) el('circle', { cx: f1(x), cy: f1(y - h * .95), r: f1(h * .05), fill: c }, g);
  if (kind === 1) {
    el('rect', { x: f1(x - h * .09), y: f1(y - h * .99), width: f1(h * .18), height: f1(h * .1), fill: c }, g);
    el('line', { x1: f1(x - h * .22), y1: f1(y - h * .91), x2: f1(x + h * .22), y2: f1(y - h * .91), stroke: c, 'stroke-width': f1(h * .025) }, g);
  }
  if (kind === 2) el('path', { d: `M${f1(x - h * .24)},${f1(y - h * .86)} L${f1(x)},${f1(y - h * 1.02)} L${f1(x + h * .24)},${f1(y - h * .86)} Z`, fill: c }, g);
  if (rnd() < .22) el('line', { x1: f1(x + w * .25), y1: f1(y - h * .66), x2: f1(x + w * .55), y2: f1(y - h * 1.02), stroke: c, 'stroke-width': f1(h * .07), 'stroke-linecap': 'round' }, g);
}

// 剧情镜头通用背景（1600×900）：远山、岸、水、可选近岸
// o: { bank: 岸线 y, near?: 近岸 y, warm?: 暮色, sun?: [cx, cy, r, 透明度] }
export function bgScene(g, o) {
  const B = o.bank;
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, g);
  if (o.warm) el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: 'url(#gDusk)' }, g);
  if (o.sun) el('circle', { cx: o.sun[0], cy: o.sun[1], r: o.sun[2], fill: `rgba(176,58,46,${o.sun[3]})`, filter: 'url(#fSoft)' }, g);
  const m = el('g', { transform: `translate(0,${B - 600})` }, g);
  el('path', { d: areaD(ridge(0, 1600, 545, 150, 320, 90, 210, 300), 0, 1600), fill: 'url(#gFar1)', filter: 'url(#fWash)' }, m);
  el('path', { d: areaD(ridge(0, 1600, 600, 60, 200, 70, 160, 240), 0, 1600), fill: 'url(#gMid)', filter: 'url(#fInkEdge)', opacity: .75 }, m);
  el('rect', { x: 0, y: 440, width: 1600, height: 460, fill: 'url(#gMist)' }, m);
  const nz = noise1();
  let d = `M0,${f1(B - 30 + nz(0) * 10)}`;
  for (let x = 0; x <= 1600; x += 10) d += `L${x},${f1(B - 30 + nz(x) * 10)}`;
  d += `L1600,${B}L0,${B}Z`;
  el('path', { d, fill: PAPER }, g);
  el('path', { d, fill: ink(.07) }, g);
  const bottom = o.near || 900;
  el('rect', { x: 0, y: B, width: 1600, height: bottom - B + 20, fill: ink(.045) }, g);
  el('line', { x1: 0, y1: B, x2: 1600, y2: B, stroke: ink(.7), 'stroke-width': 2.4, filter: 'url(#fBleed)' }, g);
  const waves = el('g', { fill: 'none', 'stroke-linecap': 'round' }, g);
  for (let i = 0; i < 110; i++) {
    const x = R(0, 1600), y = R(B + 8, bottom - 8), l = R(12, 40);
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-3 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.07, .22))), 'stroke-width': 1.1 }, waves);
  }
  if (o.near) {
    const nn = noise1();
    let s = `M0,910L0,${f1(o.near + nn(0) * 14)}`;
    for (let x = 0; x <= 1600; x += 10) s += `L${x},${f1(o.near + nn(x) * 14)}`;
    s += 'L1600,910Z';
    el('path', { d: s, fill: PAPER }, g);
    el('path', { d: s, fill: ink(.12) }, g);
  }
}
