import { reseed, R } from '../../../core/rng.js';
import { el } from '../../../core/svg.js';
import { f1, easeOut } from '../../../core/math.js';
import { loop } from '../../../core/tick.js';
import { PAPER, WALL, SEAL, BRUSH, ink } from '../../../ink/palette.js';
import { ridge, areaD } from '../../../ink/paths.js';
import { willow } from '../../../ink/scenery.js';
import { rub } from '../../../cut/rub.js';
import { orangeTree, linGrad } from '../scene.js';

// 荆溪岸 · 临帖：描《楚颂帖》中的"橘"字，字长成岸边一株橘树
const COPY = ['吾来阳羡', '船入荆溪', '意思豁然', '如惬平生之欲', '当买一小园', '种柑橘三百本'];
const BOX = [560, 196, 420, 420];          // 米字格
const TREE = [1380, 724, 300];             // 橘树：x, 地面 y, 高

export default {
  id: 'stele', name: '荆溪岸', play: '临帖', item: 'char',
  draw, run,
};

function draw(bg, mid, { final = false, layer } = {}) {
  reseed(211);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('path', { d: areaD(ridge(0, 1600, 300, 20, 90, 90, 220, 240), 0, 1600, 724), fill: linGrad(bg, 'y2Stele', [[0, .2], [.5, .06], [1, 0]]), filter: 'url(#fWash)' }, bg);
  // 溪水在下
  el('rect', { x: 0, y: 724, width: 1600, height: 180, fill: ink(.08) }, bg);
  el('line', { x1: 0, y1: 724, x2: 1600, y2: 724, stroke: ink(.55), 'stroke-width': 2.2, filter: 'url(#fBleed)' }, bg);
  const w = el('g', { fill: 'none', 'stroke-linecap': 'round' }, bg);
  for (let i = 0; i < 60; i++) {
    const x = R(0, 1600), y = R(740, 890), l = R(14, 40);
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-3 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: ink(f1(R(.08, .2))), 'stroke-width': 1.1 }, w);
  }
  willow(bg, 190, 726, 380, .1);
  // 帖：纸面、帖文、米字格
  el('rect', { x: 512, y: 112, width: 760, height: 590, fill: ink(.1), transform: 'translate(8,8)' }, bg);
  el('rect', { x: 512, y: 112, width: 760, height: 590, fill: WALL, stroke: ink(.4), 'stroke-width': 1.2 }, bg);
  const copy = el('g', { 'font-family': BRUSH, 'font-size': 30, fill: ink(.72), 'text-anchor': 'middle' }, bg);
  COPY.forEach((line, i) => [...line].forEach((ch, k) => el('text', { x: 1226 - i * 40, y: 170 + k * 36, text: ch, ...(ch === '橘' ? { fill: ink(.95) } : {}) }, copy)));
  el('rect', { x: 1226 - 5 * 40 - 20, y: 170 + 2 * 36 - 28, width: 40, height: 38, fill: 'none', stroke: SEAL, 'stroke-width': 2 }, bg);
  el('text', { x: 1060, y: 680, 'font-size': 15, fill: ink(.45), 'letter-spacing': 2, text: '苏轼《楚颂帖》（节）' }, bg);
  const [x, y, s] = BOX;
  el('rect', { x, y, width: s, height: s, fill: 'none', stroke: 'rgba(176,58,46,.55)', 'stroke-width': 2 }, bg);
  el('path', { d: `M${x},${y}L${x + s},${y + s}M${x + s},${y}L${x},${y + s}M${x + s / 2},${y}V${y + s}M${x},${y + s / 2}H${x + s}`, stroke: 'rgba(176,58,46,.25)', 'stroke-width': 1.2, 'stroke-dasharray': '6 8' }, bg);
  const big = { x: x + s / 2, y: y + s * .86, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 380, text: '橘' };
  el('text', { ...big, fill: ink(.12) }, bg);

  if (final) {
    el('text', { ...big, fill: ink(.92) }, bg);
    orangeTree(bg, ...TREE);
    return {};
  }
  // 描出的字：mask 内的白色笔迹显出浓墨字
  const defs = el('defs', {}, mid);
  const mask = el('mask', { id: 'y2Rub', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1600, height: 900 }, defs);
  const paint = el('g', {}, mask);
  const inked = el('text', { ...big, fill: ink(.92), mask: 'url(#y2Rub)' }, mid);
  const tree = el('g', { style: 'display:none' }, mid);
  const t = orangeTree(tree, ...TREE);
  // 心印为水：溪上多一叶扁舟（单独一层，走合成层平移）
  let boat = null;
  if (layer) {
    boat = layer('boat');
    // 画在视口中央，整层平移进出（画在视口外会被 svg 裁掉）
    el('path', { d: 'M710,800 Q800,812 892,796 Q870,826 800,828 Q734,828 710,800 Z', fill: ink(.85) }, boat);
    el('path', { d: 'M770,802 C770,770 830,768 834,800 Z', fill: ink(.7) }, boat);
    el('line', { x1: 870, y1: 798, x2: 930, y2: 760, stroke: ink(.8), 'stroke-width': 2.4 }, boat);
    boat.style.display = 'none';
  }
  return { paint, inked, tree, t, boat };
}

async function run({ cut, journey }) {
  const s = await cut.shot((mid, { bg, layer }) => draw(bg, mid, { layer }));
  await rub(cut, { prompt: '来回描摹 · 临帖', box: BOX, paint: s.paint, brush: 46, threshold: .5 });
  await cut.sleep(500);

  // 字化为景：字缩小飞向岸边，化作一株橘树
  s.tree.style.display = '';
  const [bx, by] = [BOX[0] + BOX[2] / 2, BOX[1] + BOX[3] / 2];
  await new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : 1800;
    const stop = loop(t => {
      const k = Math.min(1, (t - t0) / dur), e = easeOut(k);
      const x = (TREE[0] - bx) * e, y = (TREE[1] - 160 - by) * e;
      s.inked.setAttribute('transform', `translate(${f1(x)},${f1(y)}) translate(${bx},${by}) scale(${f1(1 - .7 * e)}) translate(${-bx},${-by})`);
      s.inked.setAttribute('opacity', f1(1 - Math.max(0, (k - .5) * 2)));
      const g = Math.max(0, (k - .35) / .65);
      s.tree.setAttribute('transform', `translate(${TREE[0]},${TREE[1]}) scale(${f1(.2 + .8 * g)}) translate(${-TREE[0]},${-TREE[1]})`);
      s.tree.setAttribute('opacity', f1(g));
      s.t.fruit.setAttribute('opacity', f1(.9 * Math.max(0, (k - .8) / .2)));
      if (k >= 1) { stop(); res(); }
    });
  });
  await cut.say('苏轼', '当买一小园，种柑橘三百本。', '——苏轼《楚颂帖》');

  if (journey.heart === 'water' && s.boat) {
    const k = cut.toScreen(0, 0).k;
    s.boat.style.display = '';
    s.boat.style.transform = `translate3d(${-1000 * k}px,0,0)`;
    void s.boat.offsetWidth;
    s.boat.style.transition = 'transform 5s linear';
    s.boat.style.transform = `translate3d(${300 * k}px,0,0)`;
    await cut.sleep(3200);
  }
}
