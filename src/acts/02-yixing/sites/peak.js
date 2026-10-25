import { reseed, R } from '../../../core/rng.js';
import { el } from '../../../core/svg.js';
import { f1, seg } from '../../../core/math.js';
import { PAPER, WALL, SEAL, ink, paper } from '../../../ink/palette.js';
import { ridge, areaD, taper, bez } from '../../../ink/paths.js';
import { pine, person } from '../../../ink/scenery.js';
import { catmull, linGrad } from '../scene.js';

// 铜官山 · 立轴登高：向上划动攀登，入云，云开见太湖
// 立轴画面比一屏高 EXTRA：山顶在 y≈-660，太湖在更远处
const EXTRA = 1200;
const FIG_Y = 640;                          // 登山人在屏幕上的固定高度（镜头坐标）
const pathX = y => 800 + 54 * Math.sin(y / 110);

export default {
  id: 'peak', name: '铜官山', play: '登高', item: 'cloud',
  draw, run,
};

function drawClimb(g, { heart, done }) {
  // 山顶望去：太湖、远岸、帆
  el('path', { d: areaD(ridge(0, 1600, -1030, 10, 50, 80, 180, 220), 0, 1600, -1020), fill: ink(.22), filter: 'url(#fWash)' }, g);
  el('rect', { x: 0, y: -1022, width: 1600, height: 300, fill: linGrad(g, 'y2PeakLake', [[0, .07], [.7, .03], [1, 0]]) }, g);
  for (let i = 0; i < 50; i++) {
    const x = R(0, 1600), y = R(-1010, -840), l = R(14, 36);
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-2 ${f1(l / 2)},0 t${f1(l / 2)},0`, fill: 'none', stroke: ink(f1(R(.08, .16))), 'stroke-width': 1 }, g);
  }
  for (const [x, y] of [[300, -960], [1120, -930], [1380, -980]]) {
    el('path', { d: `M${x},${y} l0,-26 l14,22 Z`, fill: ink(.5) }, g);
    el('path', { d: `M${x - 12},${y} l26,0 l-4,4 l-18,0 Z`, fill: ink(.7) }, g);
  }
  el('path', { d: areaD(ridge(0, 1600, -770, 10, 80, 70, 160, 200), 0, 1600, -560), fill: linGrad(g, 'y2PeakNear', [[0, .2], [.6, .08], [1, 0]]), filter: 'url(#fWash)' }, g);
  // 种过橘：山下远远一片朱点（橘林）
  if (done.has('orchard')) for (let i = 0; i < 16; i++) el('circle', { cx: f1(300 + R(-70, 70)), cy: f1(-770 + R(-10, 18)), r: 3.2, fill: SEAL, opacity: .85 }, g);

  // 两侧陪衬的峰
  el('path', { d: areaD(ridge(-100, 700, -150, 100, 520, 120, 260, 300), -100, 700, 900), fill: ink(.18), filter: 'url(#fWash)' }, g);
  el('path', { d: areaD(ridge(900, 1700, -60, 100, 480, 120, 260, 300), 900, 1700, 900), fill: ink(.18), filter: 'url(#fWash)' }, g);
  // 主峰
  const L = catmull([[-140, 980], [180, 520], [420, 120], [560, -260], [700, -560], [800, -664]], 10);
  const Rt = catmull([[800, -664], [900, -560], [1040, -240], [1170, 140], [1400, 520], [1740, 980]], 10);
  const body = 'M' + L.concat(Rt).map(p => `${f1(p[0] + R(-3, 3))},${f1(p[1])}`).join('L') + 'Z';
  // 先垫纸色，主峰不透出身后的陪衬峰
  el('path', { d: body, fill: PAPER }, g);
  el('path', { d: body, fill: linGrad(g, 'y2PeakBody', [[0, .42], [.5, .3], [1, .22]]), filter: 'url(#fInkEdge)' }, g);
  // 披麻皴：自山脊向两侧顺坡而下的长线，左坡向左、右坡向右，长短浓淡不一
  const tex = el('g', {}, g);
  for (let i = 0; i < 90; i++) {
    const y = R(-620, 820), half = (y + 664) / 1564 * 860, side = R(0, 1) < .5 ? -1 : 1, x = 800 + side * R(.05, .8) * half, l = R(60, 160);
    const dx = side * l * R(.25, .45);
    el('path', { d: taper(bez([x, y], [x + dx * .2, y + l * .35], [x + dx * .7, y + l * .7], [x + dx, y + l], 6), R(1.6, 3), .3, .2), fill: ink(f1(R(.14, .34))) }, tex);
  }
  // 云海（心印为山）
  if (heart === 'mountain') {
    const sea = el('g', {}, g);
    for (let i = 0; i < 26; i++) {
      const x = R(-100, 1700), y = R(-470, -360), rx = R(90, 200);
      el('ellipse', { cx: f1(x), cy: f1(y), rx: f1(rx), ry: f1(rx * .32), fill: paper(.95) }, sea);
      el('path', { d: `M${f1(x - rx * .6)},${f1(y - rx * .1)} q${f1(rx * .3)},${f1(-rx * .25)} ${f1(rx * .6)},0`, fill: 'none', stroke: ink(.22), 'stroke-width': 1.4 }, sea);
    }
  }
  // 山路
  let d = `M${f1(pathX(900))},900`;
  for (let y = 880; y >= -640; y -= 20) d += `L${f1(pathX(y))},${y}`;
  el('path', { d, fill: 'none', stroke: WALL, 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
  el('path', { d, fill: 'none', stroke: ink(.35), 'stroke-width': 1.4, 'stroke-dasharray': '10 12' }, g);
  for (const [x, y, h] of [[540, 330, 170], [1080, 120, 150], [650, -300, 120], [960, -430, 100]]) pine(g, x, y, h);
}

// 云：左右两团，入云时盖住画面上方，登顶后分开
function cloud(svg, side) {
  for (let i = 0; i < 14; i++) {
    const x = side < 0 ? R(-100, 900) : R(700, 1700), y = R(-40, 560), rx = R(140, 300);
    el('ellipse', { cx: f1(x), cy: f1(y), rx: f1(rx), ry: f1(rx * .45), fill: paper(.97) }, svg);
    el('path', { d: `M${f1(x - rx * .7)},${f1(y)} q${f1(rx * .35)},${f1(-rx * .3)} ${f1(rx * .7)},0 q${f1(rx * .2)},${f1(-rx * .2)} ${f1(rx * .5)},${f1(-rx * .05)}`, fill: 'none', stroke: ink(.2), 'stroke-width': 1.6 }, svg);
  }
}

function draw(bg, mid, { final = false, layer, journey = {}, done = new Set() } = {}) {
  reseed(231);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  const o = { heart: journey.heart, done };
  if (final) {
    const g = el('g', { transform: `translate(0,${EXTRA})` }, bg);
    drawClimb(g, o);
    person(bg, pathX(FIG_Y - EXTRA), FIG_Y, 54, .92, 1);
    return {};
  }
  // 立轴层：比一屏高，按像素摆放，登高时只平移这一层（合成层）
  const climb = layer('climb');
  const k = Math.max(innerWidth / 1600, innerHeight / 900);
  climb.setAttribute('viewBox', `0 ${-EXTRA} 1600 ${900 + EXTRA}`);
  climb.setAttribute('preserveAspectRatio', 'none');
  Object.assign(climb.style, { inset: 'auto', left: `${(innerWidth - 1600 * k) / 2}px`, top: `${(innerHeight - 900 * k) / 2 - EXTRA * k}px`,
    width: `${1600 * k}px`, height: `${(900 + EXTRA) * k}px`, willChange: 'transform' });
  drawClimb(climb, o);
  const clouds = [layer('cloudL'), layer('cloudR')];
  cloud(clouds[0], -1); cloud(clouds[1], 1);
  for (const c of clouds) { c.style.display = 'none'; c.style.willChange = 'transform, opacity'; }
  const fig = el('g', {}, mid);
  person(fig, 0, 0, 54, .92, 1);
  return { climb, clouds, fig, k };
}

async function run({ cut, journey, done }) {
  const s = await cut.shot((mid, { bg, layer }) => draw(bg, mid, { layer, journey, done }));
  const place = p => {
    s.climb.style.transform = `translate3d(0,${f1(p * EXTRA * s.k)}px,0)`;
    s.fig.setAttribute('transform', `translate(${f1(pathX(FIG_Y - p * EXTRA))},${FIG_Y})`);
    const c = seg(p, .4, .75) * (1 - seg(p, .9, 1) * .3);
    for (const cl of s.clouds) { cl.style.display = c > 0 ? '' : 'none'; cl.style.opacity = f1(c); }
  };
  place(0);
  await cut.gesture({ dir: 'up', prompt: '按箭头示意向上划动 · 登高', at: [1180, 780], len: 560, onProgress: place });
  // 云开
  s.clouds.forEach((c, i) => {
    c.style.transition = 'transform 2.4s cubic-bezier(.55,0,.35,1), opacity 2.4s';
    c.style.transform = `translate3d(${(i ? 1 : -1) * 60}%,0,0)`; c.style.opacity = 0;
  });
  await cut.sleep(journey.heart === 'mountain' ? 3200 : 1800);
  await cut.say('苏轼', '买田阳羡吾将老，从来只为溪山好。', '——苏轼《菩萨蛮》');
}
