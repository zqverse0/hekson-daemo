import { reseed, R } from '../../../core/rng.js';
import { el } from '../../../core/svg.js';
import { f1, easeOut } from '../../../core/math.js';
import { PAPER, WALL, STONE, SEAL, BRUSH, ink, paper } from '../../../ink/palette.js';
import { ellD } from '../../../ink/paths.js';
import { hold } from '../../../cut/hold.js';
import { rub } from '../../../cut/rub.js';
import { bamboo, radGrad } from '../scene.js';

// 竹林茶寮 · 烹茶：汲泉 → 候汤 → 击拂 → 茶沫上分茶作画（画什么由心印决定）
const SPRING = [540, 760], POT = [770, 590], BOWL = [1100, 640];
const FOAM = [BOWL[0] - 96, BOWL[1] - 30, 192, 60];     // 击拂区域

export default {
  id: 'tea', name: '竹林茶寮', play: '烹茶', item: 'tea',
  draw, run,
};

// 茶沫上的画：竹 / 山 / 水
function foamArt(heart) {
  const [x, y] = BOWL;
  if (heart === 'bamboo') return [`M${x - 50},${y + 26} C${x - 44},${y + 4} ${x - 38},${y - 12} ${x - 30},${y - 28}`, `M${x - 36},${y - 10} q20,-10 44,-12 M${x - 42},${y + 4} q-18,-8 -36,-6 M${x - 34},${y - 18} q16,-14 34,-18`,
    `M${x + 20},${y + 26} C${x + 26},${y + 8} ${x + 30},${y - 6} ${x + 38},${y - 22}`, `M${x + 32},${y - 6} q22,-6 42,-2 M${x + 26},${y + 8} q-16,-10 -30,-8`];
  if (heart === 'mountain') return [`M${x - 82},${y + 16} L${x - 40},${y - 22} L${x - 12},${y + 2} L${x + 26},${y - 28} L${x + 82},${y + 16}`, `M${x - 46},${y + 22} q24,-6 48,0 t48,0`];
  return [`M${x - 84},${y - 10} q21,-14 42,0 t42,0 t42,0 t42,0`, `M${x - 66},${y + 10} q21,-12 42,0 t42,0 t42,0`, `M${x - 40},${y + 26} q20,-8 40,0 t40,0`];
}

function draw(bg, mid, { final = false, journey = {}, done = new Set() } = {}) {
  reseed(241);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  // 竹林：后层淡、前层浓
  for (let i = 0; i < 16; i++) bamboo(bg, R(0, 1600), 724, R(380, 640), R(-.12, .12), .32);
  for (const x of [470, 600, 1300, 1400, 1490, 1570]) bamboo(bg, x + R(-20, 20), 724, R(500, 760), R(-.08, .08), .8);
  el('rect', { x: 0, y: 724, width: 1600, height: 180, fill: ink(.05) }, bg);
  el('line', { x1: 0, y1: 724, x2: 1600, y2: 724, stroke: ink(.5), 'stroke-width': 2, filter: 'url(#fBleed)' }, bg);
  // 茅舍
  el('rect', { x: 70, y: 380, width: 340, height: 344, fill: WALL, stroke: ink(.5), 'stroke-width': 1.4 }, bg);
  el('path', { d: 'M20,404 Q200,330 460,380 L420,300 Q220,250 60,320 Z', fill: ink(.78) }, bg);
  let th = '';
  for (let x = 70; x < 440; x += 12) th += `M${x},${f1(316 - (x - 60) * .02)} l${f1(R(-4, 6))},${f1(R(60, 80))}`;
  el('path', { d: th, stroke: paper(.25), 'stroke-width': 1.2, fill: 'none' }, bg);
  el('rect', { x: 120, y: 560, width: 90, height: 164, fill: ink(.75) }, bg);
  // 临过帖：那个"橘"字挂在茶寮墙上
  if (done.has('stele')) {
    el('rect', { x: 268, y: 420, width: 96, height: 190, fill: PAPER, stroke: ink(.5), 'stroke-width': 1.2 }, bg);
    el('rect', { x: 262, y: 414, width: 108, height: 8, fill: ink(.8) }, bg);
    el('rect', { x: 262, y: 608, width: 108, height: 8, fill: ink(.8) }, bg);
    el('text', { x: 316, y: 538, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 70, fill: ink(.9), text: '橘' }, bg);
  }
  // 泉：石、水
  el('path', { d: ellD(SPRING[0], SPRING[1] + 10, 90, 18), fill: ink(.12) }, bg);
  el('path', { d: `M${SPRING[0] - 110},${SPRING[1] + 4} q-10,-40 30,-50 q30,-6 40,30 Z M${SPRING[0] + 70},${SPRING[1]} q10,-34 40,-30 q30,10 20,40 Z`, fill: ink(.6) }, bg);
  el('path', { d: `M${SPRING[0] - 140},${SPRING[1] - 70} L${SPRING[0] - 10},${SPRING[1] - 40}`, stroke: ink(.7), 'stroke-width': 8, 'stroke-linecap': 'round' }, bg);
  // 风炉与釜
  const [px, py] = POT;
  el('path', { d: `M${px - 50},724 L${px - 40},${py + 30} L${px + 40},${py + 30} L${px + 50},724 Z`, fill: STONE, stroke: ink(.6), 'stroke-width': 1.5 }, bg);
  el('path', { d: `M${px - 18},710 q18,-34 36,0 Z`, fill: ink(.85) }, bg);
  el('path', { d: `M${px - 62},${py} Q${px - 60},${py + 40} ${px},${py + 42} Q${px + 60},${py + 40} ${px + 62},${py} Z`, fill: ink(.85) }, bg);
  el('ellipse', { cx: px, cy: py, rx: 62, ry: 12, fill: ink(.6) }, bg);
  // 案与盏
  el('path', { d: 'M930,700 L1270,700 L1256,712 L944,712 Z', fill: ink(.8) }, bg);
  el('path', { d: 'M960,712 l0,12 M1240,712 l0,12', stroke: ink(.8), 'stroke-width': 8 }, bg);
  const [bx, by] = BOWL;
  el('path', { d: `M${bx - 104},${by} Q${bx - 90},${by + 50} ${bx - 26},${by + 56} L${bx - 22},${by + 60} L${bx + 22},${by + 60} L${bx + 26},${by + 56} Q${bx + 90},${by + 50} ${bx + 104},${by} Z`, fill: ink(.9) }, bg);
  el('ellipse', { cx: bx, cy: by, rx: 106, ry: 38, fill: ink(.72), stroke: ink(.95), 'stroke-width': 2 }, bg);

  const host = final ? bg : mid;
  const art = foamArt(journey.heart);
  // 釜中水、汤花、热气
  const water = el('ellipse', { cx: px, cy: py, rx: 54, ry: 8, fill: paper(.5), opacity: final ? 1 : 0 }, host);
  const bubbles = Array.from({ length: 14 }, (_, i) => el('circle', { cx: f1(px + R(-44, 44)), cy: f1(py + R(-4, 4)), r: f1(1.6 + i * .25), fill: 'none', stroke: ink(.55), 'stroke-width': 1.2, opacity: final ? 1 : 0 }, host));
  const steam = el('path', { d: `M${px - 20},${py - 14} q-12,-40 6,-80 q14,-30 -4,-70 M${px + 16},${py - 16} q12,-36 -4,-70`, fill: 'none', stroke: ink(.28), 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: final ? 1 : 0 }, host);
  // 茶沫：mask 内的白色笔迹显出
  let paint = null, foam;
  if (final) foam = el('ellipse', { cx: bx, cy: by, rx: 100, ry: 34, fill: paper(.95) }, host);
  else {
    const mask = el('mask', { id: 'y2Foam', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1600, height: 900 }, el('defs', {}, mid));
    paint = el('g', {}, mask);
    foam = el('ellipse', { cx: bx, cy: by, rx: 100, ry: 34, fill: paper(.95), mask: 'url(#y2Foam)' }, host);
  }
  const pics = art.map(d => el('path', { d, fill: 'none', stroke: ink(.55), 'stroke-width': 2.4, 'stroke-linecap': 'round', pathLength: 1,
    'stroke-dasharray': 1, 'stroke-dashoffset': final ? 0 : 1 }, host));
  // 瓢：自泉边舀水到釜
  const ladle = el('g', {}, host);
  el('path', { d: 'M0,0 q-4,22 -28,22 q-24,0 -28,-22 Z', fill: ink(.75) }, ladle);
  el('path', { d: 'M-2,-2 L80,-60', stroke: ink(.8), 'stroke-width': 5, 'stroke-linecap': 'round' }, ladle);
  const ladleAt = p => {
    const e = easeOut(p), x = SPRING[0] + 20 + (px + 36 - SPRING[0] - 20) * e, y = SPRING[1] - 6 + (py - 40 - SPRING[1] + 6) * e - Math.sin(Math.PI * p) * 80;
    ladle.setAttribute('transform', `translate(${f1(x)},${f1(y)}) rotate(${f1(-30 * Math.max(0, (p - .8) / .2))})`);
  };
  ladleAt(final ? 1 : 0);
  return { water, bubbles, steam, paint, foam, pics, ladleAt, ember: el('circle', { cx: px, cy: 700, r: 0, fill: radGrad(host, 'y2Ember', [[0, 'rgba(176,58,46,.7)'], [1, 'rgba(176,58,46,0)']]) }, host) };
}

async function run({ cut, journey, done }) {
  const s = await cut.shot((mid, { bg }) => draw(bg, mid, { journey, done }));
  await cut.gesture({ dir: 'right', prompt: '按箭头示意向右划动 · 汲泉', at: [SPRING[0], 560], len: 300, onProgress: p => {
    s.ladleAt(p); s.water.setAttribute('opacity', f1(Math.max(0, (p - .8) / .2)));
  } });
  await hold(cut, { prompt: '按住风炉 · 候汤', at: [POT[0], 690], r: 160, duration: 2600, decay: 1 / 5000, onProgress: p => {
    s.ember.setAttribute('r', f1(20 + 30 * p));
    s.steam.setAttribute('opacity', f1(p));
    s.bubbles.forEach((b, i) => b.setAttribute('opacity', p > i / s.bubbles.length ? 1 : 0));
  } });
  await rub(cut, { prompt: '在盏中来回擦动 · 击拂', box: FOAM, paint: s.paint, brush: 30, threshold: .6, grid: 8 });
  // 分茶：茶沫上浮出一幅小画
  s.pics.forEach((p, i) => { p.style.transition = `stroke-dashoffset 1.4s ease ${i * .5}s`; void p.getBoundingClientRect(); p.style.strokeDashoffset = 0; });
  await cut.sleep(1400 + s.pics.length * 500);
  await cut.say('苏轼', '从来佳茗似佳人。', '——苏轼《次韵曹辅寄壑源试焙新芽》（此句非在常州所作）');
}
