import { reseed, R } from '../../../core/rng.js';
import { el } from '../../../core/svg.js';
import { f1, seg } from '../../../core/math.js';
import { PAPER, BRUSH, ink } from '../../../ink/palette.js';
import { ridge, areaD } from '../../../ink/paths.js';
import { pavilion } from '../../../ink/scenery.js';
import { taps } from '../../../cut/taps.js';
import { hold } from '../../../cut/hold.js';
import { orangeTree, linGrad } from '../scene.js';

// 田间 · 营园种橘：择地种橘 → 筑"楚颂"亭 → 春去秋来，橘熟
const PLOTS = [[360, 650], [640, 704], [900, 646], [470, 836], [790, 846]];
const PAV = [1290, 640, .62];              // 亭：x, 台基底 y, 缩放
const PARTS = ['platform', 'cols', 'rails', 'roof', 'top', 'plaque'];

export default {
  id: 'orchard', name: '田间', play: '种橘', item: 'orange',
  draw, run,
};

function draw(bg, mid, { final = false } = {}) {
  reseed(221);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('path', { d: areaD(ridge(0, 1600, 400, 30, 130, 90, 220, 260), 0, 1600, 520), fill: linGrad(bg, 'y2OrchHill', [[0, .22], [.6, .1], [1, 0]]), filter: 'url(#fWash)' }, bg);
  el('rect', { x: 0, y: 430, width: 1600, height: 470, fill: ink(.04) }, bg);
  // 田埂几道，田里犁沟成片（短笔，随远近疏密），不画满格
  let f = '';
  for (const y of [500, 576, 690, 840]) f += `M-10,${f1(y + R(-8, 8))} Q${f1(R(500, 1100))},${f1(y - R(8, 20))} 1610,${f1(y + R(-6, 6))}`;
  el('path', { d: f, fill: 'none', stroke: ink(.18), 'stroke-width': 1.6, 'stroke-linecap': 'round' }, bg);
  let fur = '';
  for (let i = 0; i < 70; i++) {
    const y = R(460, 890), sc = (y - 430) / 460, x = R(-40, 1640), l = R(40, 120) * sc;
    fur += `M${f1(x)},${f1(y)} l${f1(l)},${f1(R(-2, 2))}`;
  }
  el('path', { d: fur, fill: 'none', stroke: ink(.1), 'stroke-width': 1.2, 'stroke-linecap': 'round' }, bg);

  // 橘树：未种时不画；种下后先是幼苗（缩小、无果），转季节后长成结果
  const trees = PLOTS.map(([x, y]) => {
    const g = el('g', { style: final ? '' : 'display:none' }, final ? bg : mid);
    const t = orangeTree(g, x, y, 190, { fruit: final });
    return { g, t, at: [x, y] };
  });
  // 亭：台基、柱、栏、顶、宝顶依次建起；匾额换成"楚颂"
  const [px, py, ps] = PAV;
  const pg = el('g', { transform: `translate(${px},${py}) scale(${ps})` }, final ? bg : mid);
  const P = pavilion(pg, 0, 0);
  P.plaque.innerHTML = '';
  el('rect', { x: -36, y: P.ey + 22, width: 72, height: 26, fill: ink(.9) }, P.plaque);
  el('text', { x: 0, y: P.ey + 42, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 19, fill: PAPER, 'letter-spacing': 4, text: '楚颂' }, P.plaque);
  if (!final) for (const k of PARTS) P[k].style.display = 'none';
  return { trees, P };
}

async function run({ cut, mode }) {
  const s = await cut.shot((mid, { bg }) => draw(bg, mid));
  const n = mode === 'full' ? 5 : 3;
  const grow = (tr, g) => {
    const [x, y] = tr.at;
    tr.g.setAttribute('transform', `translate(${x},${y}) scale(${f1(.4 + .6 * g)}) translate(${-x},${-y})`);
  };
  await taps(cut, {
    prompt: '轻触田垄 · 种橘',
    targets: s.trees.slice(0, n).map((tr, i) => ({ id: 't' + i, at: [tr.at[0], tr.at[1] - 30], r: 110, required: true, hint: true })),
    onTap(t) { const tr = s.trees[+t.id.slice(1)]; tr.g.style.display = ''; grow(tr, 0); return true; },
  });

  await hold(cut, { prompt: '按住 · 筑亭', at: [PAV[0], PAV[1] - 90], r: 200, duration: 2800, decay: 0,
    onProgress: p => PARTS.forEach((k, i) => { s.P[k].style.display = p > i / PARTS.length ? '' : 'none'; }) });
  await cut.say('苏轼', '吾园落成，当作一亭，名之曰"楚颂"。', '——苏轼《楚颂帖》');

  const planted = s.trees.slice(0, n);
  await cut.gesture({ dir: 'right', prompt: '按箭头示意向右划动 · 春去秋来', at: [420, 200], len: 640, onProgress: p => {
    for (const tr of planted) { grow(tr, seg(p, 0, .7)); tr.t.fruit.setAttribute('opacity', f1(.9 * seg(p, .6, 1))); }
  } });
  await cut.sleep(600);
}
