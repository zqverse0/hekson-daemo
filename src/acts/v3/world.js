import { R, rnd } from '../../core/rng.js';
import { clamp, easeOut, f1 } from '../../core/math.js';
import { el } from '../../core/svg.js';
import { noise1 } from '../../core/noise.js';
import { tick } from '../../core/tick.js';
import { PAPER, WALL, STONE, SEAL, BRUSH, ink } from '../../ink/palette.js';
import { taper, ellD, ridge, areaD } from '../../ink/paths.js';
import { willow, bridge, gableHouse, longHouse, pine, pavilion } from '../../ink/scenery.js';
import { BOAT } from '../../ink/figures.js';
import { createLayers } from '../../stage/layers.js';

// v3 原型的运河长卷世界：北岸、水面、南岸、三处可唤醒的景、芦苇前景、小舟
export const W = 4400, H = 900, FAR = 566, NEAR = 792, WATER = 668;

export const NODES = [
  { cx: 1330, trig: 1150, seal: '壹', title: '买田阳羡',
    text: '元丰七年（1084 年），苏轼在常州宜兴买田，上《乞常州居住表》，次年获准。他并非常州人，却选择了这里。', note: '' },
  { cx: 2460, trig: 2300, seal: '贰', title: '夹岸相看',
    text: '建中靖国元年（1101 年），苏轼自海南北归，乘舟抵达常州，据记载运河两岸“千万人随观之”。同年七月，他在常州病逝。', note: '' },
  { cx: 3720, trig: 3470, seal: '叁', title: '舣舟筑亭',
    text: '“舣”，意为使船靠岸。后人为纪念苏轼来常泊舟，修建了舣舟亭，今在常州东坡公园内。', note: '注：亭为后世纪念建筑，并非苏轼当年所见。' },
];
const SCENES_X = NODES.map(n => n.cx);
const nearScene = (x, pad) => SCENES_X.some(c => Math.abs(x - c) < pad);

export function createWorld() {
  const L = createLayers({ far: .18, mid: .45, main: 1, fx: 1, front: 1.35 }, W, H);
  const LAYERS = L.layers;

  { // 远山 + 日
    const g = LAYERS.far.svg, w = LAYERS.far.w;
    el('circle', { cx: 1150, cy: 215, r: 46, fill: 'rgba(176,58,46,.30)', filter: 'url(#fSoft)' }, g);
    el('path', { d: areaD(ridge(0, w, 545, 150, 330, 90, 210, 300), 0, w), fill: 'url(#gFar1)', filter: 'url(#fWash)' }, g);
    el('path', { d: areaD(ridge(0, w, 590, 60, 190, 70, 170, 230), 0, w), fill: 'url(#gFar2)', filter: 'url(#fWash)' }, g);
    for (let i = 0; i < 5; i++) {
      const x = 1480 + i * R(28, 46), y = 250 + R(-26, 26), s = R(5, 9);
      el('path', { d: `M${x - s},${y - s * .35} Q${x - s * .4},${y - s * .5} ${x},${y} Q${x + s * .4},${y - s * .5} ${x + s},${y - s * .4}`,
        stroke: ink(.55), 'stroke-width': 1.3, fill: 'none', 'stroke-linecap': 'round' }, g);
    }
  }
  { // 中景山
    const g = LAYERS.mid.svg, w = LAYERS.mid.w;
    const pts = ridge(0, w, 610, 70, 230, 70, 160, 260);
    el('path', { d: areaD(pts, 0, w), fill: 'url(#gMid)', filter: 'url(#fInkEdge)' }, g);
    el('path', { d: 'M' + pts.map(p => `${p[0]},${f1(p[1])}`).join('L'), fill: 'none', stroke: ink(.42), 'stroke-width': 2.2, filter: 'url(#fInkEdge)' }, g);
    const dots = el('g', { fill: ink(.75) }, g);
    for (let i = 2; i < pts.length - 2; i++) {
      const y = pts[i][1];
      if (y < pts[i - 2][1] && y < pts[i + 2][1] && y < 520) {
        for (let k = 0; k < 3; k++) el('ellipse', { cx: f1(pts[i][0] + R(-14, 14)), cy: f1(y + R(3, 16)), rx: f1(R(1.8, 3.6)), ry: f1(R(1.2, 2.6)) }, dots);
      }
    }
    el('rect', { x: 0, y: 440, width: w, height: 460, fill: 'url(#gMist)' }, g);
  }

  const M = LAYERS.main.svg;
  const mdefs = el('defs', {}, M);
  const nb = noise1(), nw = noise1(), nn = noise1();
  const farTop = x => 498 + nb(x) * 26, farEdge = x => FAR + nw(x) * 3, nearTop = x => NEAR + nn(x) * 16;

  { // 北岸
    let d = `M0,${f1(farTop(0))}`;
    for (let x = 0; x <= W; x += 10) d += `L${x},${f1(farTop(x))}`;
    for (let x = W; x >= 0; x -= 10) d += `L${x},${f1(farEdge(x))}`;
    d += 'Z';
    el('path', { d, fill: PAPER }, M);
    el('path', { d, fill: 'url(#gBank)' }, M);
    let s = 'M0,' + f1(farEdge(0));
    for (let x = 0; x <= W; x += 10) s += `L${x},${f1(farEdge(x))}`;
    el('path', { d: s, fill: 'none', stroke: ink(.72), 'stroke-width': 2.6, filter: 'url(#fBleed)' }, M);
    const trees = el('g', {}, M);
    for (let x = 40; x < W; x += R(50, 150)) {
      if (nearScene(x, 300)) continue;
      // 远树：细干 + 米点点叶，两层墨色
      const y = farTop(x) + R(4, 20), h = R(12, 26);
      el('path', { d: taper([[x, y], [x + R(-1, 1), y - h * .5], [x + R(-2, 2), y - h]], 2.2, .5), fill: ink(.55) }, trees);
      let d1 = '', d2 = '';
      for (let k = 0; k < 10; k++) d1 += ellD(x + R(-9, 9), y - h - R(-3, 10), R(3, 5.5), R(1.2, 2));
      for (let k = 0; k < 5; k++) d2 += ellD(x + R(-6, 6), y - h - R(-1, 6), R(2, 3.6), R(1, 1.6));
      el('path', { d: d1, fill: ink(f1(R(.2, .32))) }, trees);
      el('path', { d: d2, fill: ink(f1(R(.45, .6))) }, trees);
    }
    const moss = el('g', { fill: ink(.7) }, M);
    for (let i = 0; i < 160; i++) {
      const x = R(0, W);
      if (nearScene(x, 230)) continue;
      el('ellipse', { cx: f1(x), cy: f1(farTop(x) + R(-2, 8)), rx: f1(R(1.5, 3.4)), ry: f1(R(1, 2.4)) }, moss);
    }
  }
  { // 水
    el('rect', { x: 0, y: FAR, width: W, height: NEAR - FAR + 30, fill: 'url(#gWater)' }, M);
    const waves = el('g', { fill: 'none', 'stroke-linecap': 'round' }, M);
    for (let i = 0; i < 360; i++) {
      const t = Math.pow(rnd(), 1.6), y = FAR + 10 + (rnd() < .5 ? t : 1 - t) * (NEAR - FAR - 20);
      const x = R(0, W), l = R(12, 40);
      el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-3 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.07, .24))), 'stroke-width': f1(R(.8, 1.5)) }, waves);
    }
    for (let i = 0; i < 26; i++) {
      const x = R(0, W), y = FAR + R(6, 22);
      el('line', { x1: f1(x), y1: f1(y), x2: f1(x + R(80, 260)), y2: f1(y), stroke: ink(.09), 'stroke-width': 1 }, waves);
    }
    const clip = el('clipPath', { id: 'cWater' }, mdefs);
    el('rect', { x: 0, y: FAR, width: W, height: NEAR - FAR + 20 }, clip);
  }

  /* 三处可唤醒的景 */
  {
    const g = el('g', { id: 'art0' }, mdefs);
    willow(g, 1120, FAR - 6, 230, .1);
    willow(g, 1290, FAR - 4, 190, -.25);
    bridge(g, 1500, FAR, 1.05);
    willow(g, 1650, FAR - 6, 160, .2);
  }
  {
    const g = el('g', { id: 'art1' }, mdefs);
    willow(g, 2250, FAR - 8, 210, -.15);
    longHouse(g, 2395, FAR - 8, 160, 58);
    gableHouse(g, 2310, FAR - 8, 112, 72);
    gableHouse(g, 2540, FAR - 8, 132, 88);
    for (let i = 0; i < 4; i++) el('rect', { x: 2440 - i * 5, y: FAR - 8 + i * 6, width: 70 + i * 10, height: 6, fill: STONE, stroke: ink(.5), 'stroke-width': 1 }, g);
    willow(g, 2730, FAR - 6, 200, .25);
  }
  {
    const g = el('g', { id: 'art2' }, mdefs);
    willow(g, 3420, FAR - 6, 220, -.2);
    pine(g, 3960, FAR - 8, 300);
    pavilion(g, 3720, FAR - 6);
    const t = el('g', { 'font-family': BRUSH, fill: ink(.85), 'text-anchor': 'middle' }, g);
    el('text', { x: 4160, y: 200, 'font-size': 76, text: '舣' }, t);
    el('text', { x: 4160, y: 282, 'font-size': 76, text: '舟' }, t);
    ['後', '人', '築', '亭'].forEach((c, i) => el('text', { x: 4100, y: 190 + i * 24, 'font-size': 20, fill: ink(.6), text: c }, t));
    el('rect', { x: 4140, y: 306, width: 40, height: 40, fill: SEAL, rx: 2 }, g);
    el('text', { x: 4160, y: 333, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 24, fill: WALL, text: '常' }, g);
  }

  // 每处景：淡影 ghost + 墨晕遮罩下的实景 live（含水中倒影）
  const nodes = NODES.map((n, i) => {
    const reg = { x: n.cx - 950, y: -150, width: 1900, height: 1200 };
    const f = el('filter', { id: 'fBloom' + i, filterUnits: 'userSpaceOnUse', ...reg }, mdefs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.016', numOctaves: 3, seed: 11 + i, result: 'n' }, f);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 150, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
    el('feGaussianBlur', { in: 'd', stdDeviation: 7 }, f);
    const mask = el('mask', { id: 'mInk' + i, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, mdefs);
    const mg = el('g', { filter: `url(#fBloom${i})` }, mask);
    const circles = [
      { c: el('circle', { cx: n.cx, cy: 470, r: 0, fill: '#fff' }, mg), max: 700, delay: 0 },
      { c: el('circle', { cx: n.cx + R(-260, -140), cy: R(380, 520), r: 0, fill: '#fff' }, mg), max: R(170, 260), delay: -250 },
      { c: el('circle', { cx: n.cx + R(140, 260), cy: R(380, 520), r: 0, fill: '#fff' }, mg), max: R(170, 260), delay: -120 },
      { c: el('circle', { cx: n.cx + R(-60, 60), cy: R(640, 720), r: 0, fill: '#fff' }, mg), max: R(140, 220), delay: -60 },
    ];
    const ghost = el('use', { href: '#art' + i, opacity: .075, filter: 'url(#fGhost)' }, M);
    const live = el('g', { mask: `url(#mInk${i})` }, M);
    const refl = el('g', { 'clip-path': 'url(#cWater)' }, live);
    el('use', { href: '#art' + i, transform: `translate(0,${2 * FAR}) scale(1,-1)`, opacity: .16, filter: 'url(#fRipple)' }, refl);
    el('use', { href: '#art' + i }, live);
    return { circles, ghost, live, marker: null };
  });

  { // 南岸（近景）
    let d = `M0,${H + 10}L0,${f1(nearTop(0))}`;
    for (let x = 0; x <= W; x += 10) d += `L${x},${f1(nearTop(x))}`;
    d += `L${W},${H + 10}Z`;
    el('path', { d, fill: PAPER }, M);
    el('path', { d, fill: 'url(#gNear)' }, M);
    let s = 'M0,' + f1(nearTop(0));
    for (let x = 0; x <= W; x += 10) s += `L${x},${f1(nearTop(x))}`;
    el('path', { d: s, fill: 'none', stroke: ink(.85), 'stroke-width': 3.4, filter: 'url(#fBleed)' }, M);
    const dry = el('g', { fill: 'none', stroke: ink(.28), 'stroke-linecap': 'round' }, M);
    for (let x = 0; x < W; x += R(60, 180)) {
      const l = R(40, 140);
      let p = `M${f1(x)},${f1(nearTop(x) + 6)}`;
      for (let k = 10; k <= l; k += 10) p += `L${f1(x + k)},${f1(nearTop(x + k) + 6 + R(-1, 1))}`;
      el('path', { d: p, 'stroke-width': f1(R(3, 6)) }, dry);
    }
    const moss = el('g', { fill: ink(.78) }, M);
    for (let i = 0; i < 260; i++) {
      const x = R(0, W);
      el('ellipse', { cx: f1(x), cy: f1(nearTop(x) + R(-3, 22)), rx: f1(R(1.6, 4)), ry: f1(R(1.1, 2.8)) }, moss);
    }
    const tufts = el('g', { fill: 'none', stroke: ink(.7), 'stroke-linecap': 'round' }, M);
    for (let x = 20; x < W; x += R(70, 200)) {
      const y = nearTop(x) + 2;
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + R(-.7, .7), l = R(10, 26);
        el('path', { d: `M${f1(x + k * 3)},${f1(y)} q${f1(Math.cos(a) * l * .3)},${f1(-l * .6)} ${f1(Math.cos(a) * l)},${f1(Math.sin(a) * l)}`, 'stroke-width': 1.2 }, tufts);
      }
    }
  }

  /* 特效层：提示墨点、涟漪、跃鱼 */
  const FX = LAYERS.fx.svg;
  nodes.forEach((n, i) => {
    n.marker = el('g', { class: 'marker', transform: `translate(${NODES[i].cx},360)` }, FX);
    el('circle', { class: 'ring', cx: 0, cy: 0, r: 12, fill: 'none', stroke: SEAL, 'stroke-width': 2 }, n.marker);
    el('circle', { class: 'ring r2', cx: 0, cy: 0, r: 12, fill: 'none', stroke: SEAL, 'stroke-width': 2 }, n.marker);
    el('path', { class: 'dot', d: 'M0,-14 C6,-5 9,0 9,5 A9,9 0 1 1 -9,5 C-9,0 -6,-5 0,-14 Z', fill: ink(.9) }, n.marker);
  });
  const rippleG = el('g', { fill: 'none' }, FX);
  const ripples = [], fishes = [];
  function ripple(x, y, delay = 0, grow = 1.1, o = .45) {
    ripples.push({ x, y, d: delay, rx: 8, ry: 2.2, o, grow, e: null });
  }

  /* 前景芦苇 */
  {
    const g = LAYERS.front.svg, w = LAYERS.front.w;
    for (let x = R(700, 900); x < w; x += R(520, 980)) {
      const cl = el('g', { filter: 'url(#fBleed)' }, g);
      const n = Math.round(R(7, 13));
      for (let k = 0; k < n; k++) {
        const bx = x + R(-40, 40), h = R(110, 250), lean = R(-.45, .45), bw = R(3.5, 6);
        const tx = bx + lean * h, ty = H - h;
        const c1x = bx + lean * h * .25, c1y = H - h * .55;
        el('path', { d: `M${f1(bx - bw)},${H + 6} Q${f1(c1x - bw * .6)},${f1(c1y)} ${f1(tx)},${f1(ty)} Q${f1(c1x + bw * .6)},${f1(c1y)} ${f1(bx + bw)},${H + 6} Z`, fill: ink(f1(R(.7, .92))) }, cl);
        if (rnd() < .35) {
          for (let j = 0; j < 7; j++) {
            const a = -Math.PI / 2 + lean + R(-.6, .6), l = R(10, 24);
            el('line', { x1: f1(tx), y1: f1(ty), x2: f1(tx + Math.cos(a) * l), y2: f1(ty + Math.sin(a) * l), stroke: ink(.35), 'stroke-width': 1 }, cl);
          }
        }
      }
    }
  }

  /* 世界中的小舟 */
  const boatDiv = document.getElementById('boat');
  const boatSvg = el('svg', { viewBox: `0 0 ${BOAT.W} ${BOAT.H}` }, boatDiv);
  el('use', { href: '#boatArt', transform: `translate(0,${BOAT.WL * 2}) scale(1,-1)`, opacity: .15, filter: 'url(#fRipple)' }, boatSvg);
  el('use', { href: '#boatArt' }, boatSvg);

  /* 尺寸与镜头 */
  let scale = 1, VW = 1600, camX = 0, lastRipX = 300, fishAt = performance.now() + 5000;
  function resize() {
    // 隐藏的面板里视口尺寸可能为 0，避免得到 0 / NaN
    scale = Math.max(innerHeight, 1) / H; VW = Math.max(innerWidth, 1) / scale;
    L.resize(scale);
    boatSvg.setAttribute('width', BOAT.W * scale); boatSvg.setAttribute('height', BOAT.H * scale);
  }
  addEventListener('resize', resize); resize();

  // 墨晕揭开第 i 处景，约 2.1 秒
  function revealArt(i) {
    const n = nodes[i];
    const t0 = performance.now(), dur = 2100;
    (function step(t) {
      const k = clamp((t - t0) / dur, 0, 1);
      for (const c of n.circles) c.c.setAttribute('r', f1(c.max * easeOut(clamp((t - t0 - c.delay) / dur, 0, 1))));
      n.ghost.setAttribute('opacity', f1(.075 * (1 - k)));
      if (k < 1) tick(step);
      else { n.live.removeAttribute('mask'); n.ghost.remove(); }
    })(t0);
  }
  // 直接显示第 i 处景（调试跳转用）
  function showArt(i) {
    const n = nodes[i];
    n.live.removeAttribute('mask'); n.ghost.remove(); n.marker.style.opacity = 0;
  }
  function hideMarker(i) {
    const m = nodes[i].marker;
    m.style.transition = 'opacity .4s'; m.style.opacity = 0;
  }

  // 每帧：镜头跟随、视差、小舟、涟漪、跃鱼
  function render(t, dt, { boatX, boatV, fish }) {
    const camT = clamp(boatX - VW * .36, 0, Math.max(0, W - VW));
    camX = Number.isFinite(camX) ? camX + (camT - camX) * .06 * dt : camT;
    L.apply(camX, scale);
    const bob = Math.sin(t * .0021) * 2.6;
    const tilt = clamp(boatV * .5, -2.5, 2.5) + Math.sin(t * .0016) * .8;
    boatDiv.style.transform = `translate3d(${(boatX - camX - BOAT.W / 2) * scale}px,${(WATER + bob - BOAT.WL) * scale}px,0) rotate(${tilt}deg)`;

    // 船尾涟漪
    if (Math.abs(boatX - lastRipX) > 28 && Math.abs(boatV) > .4) {
      lastRipX = boatX;
      ripple(boatX - Math.sign(boatV) * 105, WATER + 8);
    }
    // 跃鱼
    if (fish && t > fishAt) {
      fishAt = t + 6000 + Math.random() * 6000;
      const x0 = boatX + 220 + Math.random() * 380, y0 = FAR + 50 + Math.random() * (NEAR - FAR - 100);
      const e = el('path', { d: 'M-13,0 Q-2,-7 10,-1 L16,-6 L14,0 L16,6 L10,1 Q-2,7 -13,0 Z', fill: ink(.85) }, FX);
      fishes.push({ x0, y0, t0: t, e });
      ripple(x0, y0 + 4, 0, 1.3, .5);
    }
    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i], k = (t - f.t0) / 900;
      if (k >= 1) { f.e.remove(); fishes.splice(i, 1); ripple(f.x0 + 70, f.y0 + 4, 0, 1.4, .55); ripple(f.x0 + 70, f.y0 + 4, 8, 1.4, .4); continue; }
      const x = f.x0 + k * 70, y = f.y0 - Math.sin(k * Math.PI) * 58;
      const ang = Math.atan2(-58 * Math.PI * Math.cos(k * Math.PI), 70) * 180 / Math.PI;
      f.e.setAttribute('transform', `translate(${f1(x)},${f1(y)}) rotate(${f1(ang)})`);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      if (r.d > 0) { r.d -= dt; continue; }
      if (!r.e) r.e = el('ellipse', { cx: f1(r.x), cy: f1(r.y), rx: 8, ry: 2.2, 'stroke-width': 1.2 }, rippleG);
      r.rx += r.grow * dt; r.ry += r.grow * .2 * dt; r.o -= .007 * dt;
      if (r.o <= 0) { r.e.remove(); ripples.splice(i, 1); continue; }
      r.e.setAttribute('rx', f1(r.rx)); r.e.setAttribute('ry', f1(r.ry)); r.e.setAttribute('stroke', ink(f1(r.o)));
    }
  }

  return {
    render, ripple, revealArt, showArt, hideMarker,
    snapCamera() { camX = NaN; },
    // 世界坐标 ↔ 屏幕坐标
    toScreen: (wx, wy) => ({ x: (wx - camX) * scale, y: wy * scale }),
    toWorld: (sx, sy) => ({ x: camX + sx / scale, y: sy / scale }),
    isWater: wy => wy > FAR + 10 && wy < NEAR - 6,
  };
}
