import { R } from '../../core/rng.js';
import { seg, easeOut, f1 } from '../../core/math.js';
import { el } from '../../core/svg.js';
import { WALL, SEAL, BRUSH, ink, paper } from '../../ink/palette.js';
import { willow, pine, pavilion, person, gableHouse, longHouse, bgScene } from '../../ink/scenery.js';
import { BOAT } from '../../ink/figures.js';

// v3 原型的三段剧情。cut = createCut() 的返回值
// 壹 · 买田阳羡（1084—1085）
async function ep0({ shot, say, gesture }) {
  const c = await shot(g => {
    bgScene(g, { bank: 600, sun: [1250, 230, 58, .3] });
    willow(g, 1180, 598, 240, .12);
    willow(g, 1390, 600, 200, -.22);
    el('path', { d: 'M-80,706 Q300,716 660,688 Q610,770 300,780 L-80,780 Z', fill: ink(.9) }, g);
    el('path', { d: 'M-80,710 Q300,719 650,692', fill: 'none', stroke: paper(.3), 'stroke-width': 2 }, g);
    el('use', { href: '#sym-sushi', x: 96, y: 88, width: 280, height: 630, class: 'breath' }, g);
    // 表文
    const sheet = el('g', { opacity: 0 }, g);
    el('rect', { x: 908, y: 150, width: 360, height: 462, fill: ink(.12), transform: 'translate(8,8)' }, sheet);
    el('rect', { x: 900, y: 142, width: 360, height: 462, fill: '#f8f3e6', stroke: ink(.4), 'stroke-width': 1.2 }, sheet);
    el('rect', { x: 892, y: 132, width: 376, height: 12, rx: 6, fill: '#5a3d22' }, sheet);
    el('rect', { x: 892, y: 602, width: 376, height: 12, rx: 6, fill: '#5a3d22' }, sheet);
    for (let x = 960; x < 1250; x += 60) el('line', { x1: x, y1: 160, x2: x, y2: 590, stroke: 'rgba(176,58,46,.22)', 'stroke-width': 1 }, sheet);
    const defs = el('defs', {}, sheet);
    const cols = [
      { x: 1200, chars: '乞常州居住表', size: 50, step: 64, a: 0, b: .45 },
      { x: 1124, chars: '臣有薄田在常州宜兴县', size: 30, step: 40, a: .45, b: .82 },
      { x: 1064, chars: '粗给饘粥', size: 30, step: 40, a: .82, b: 1 },
    ];
    cols.forEach((col, i) => {
      const cp = el('clipPath', { id: 'cw' + i }, defs);
      col.r = el('rect', { x: col.x - 40, y: 160, width: 80, height: 0 }, cp);
      const t = el('g', { 'clip-path': `url(#cw${i})`, 'font-family': BRUSH, 'font-size': col.size, fill: ink(.9), 'text-anchor': 'middle' }, sheet);
      [...col.chars].forEach((ch, k) => el('text', { x: col.x, y: 200 + (i ? 4 : 10) + k * col.step, text: ch }, t));
    });
    const brush = el('g', { opacity: 0 }, sheet);
    el('path', { d: 'M0,0 L-6,-16 L6,-16 Z', fill: ink(.95) }, brush);
    el('rect', { x: -4, y: -120, width: 8, height: 104, fill: '#8b6236', stroke: '#4a301a', 'stroke-width': 1 }, brush);
    el('rect', { x: -5, y: -24, width: 10, height: 10, fill: '#2c2a26' }, brush);
    return { sheet, cols, brush };
  });
  await say('旁白', '元丰七年（1084 年），苏轼乘舟途经常州，在宜兴（古称阳羡，时属常州）买下了一块田。');
  await say('苏轼', '买田阳羡吾将老，从来只为溪山好。', '——苏轼《菩萨蛮》');
  c.sheet.style.transition = 'opacity .8s'; c.sheet.setAttribute('opacity', 1);
  await say('旁白', '他想留在这里，于是提笔上表，请求朝廷允许他在常州居住。');
  c.brush.setAttribute('opacity', 1);
  await gesture({ dir: 'down', prompt: '按箭头示意向下缓慢划动 · 落笔', at: [1236, 170], len: 400, onProgress: p => {
    let cur = c.cols[0];
    for (const col of c.cols) {
      const k = seg(p, col.a, col.b);
      col.r.setAttribute('height', f1(k * 430));
      if (p >= col.a) cur = col;
    }
    const k = seg(p, cur.a, cur.b);
    c.brush.setAttribute('transform', `translate(${cur.x + 16},${f1(170 + k * 400)}) rotate(18)`);
  } });
  c.brush.setAttribute('opacity', 0);
  await say('苏轼', '臣有薄田在常州宜兴县，粗给饘粥……', '——苏轼《乞常州居住表》');
  await gesture({ dir: 'right', prompt: '按箭头示意向右缓慢划动 · 呈上表文', at: [760, 108], len: 560, onProgress: p => {
    const e = easeOut(p);
    c.sheet.setAttribute('transform', `translate(${f1(e * 520)},${f1(-e * 70)}) rotate(${f1(e * 10)},1080,373) translate(1080,373) scale(${f1(1 - e * .55)}) translate(-1080,-373)`);
    c.sheet.setAttribute('opacity', f1(1 - p * .6));
  } });
  c.sheet.style.transition = 'opacity .6s'; c.sheet.setAttribute('opacity', 0);
  await say('旁白', '元丰八年（1085 年），朝廷准其所请。');
  await say('旁白', '可没过多久，他又被朝廷起用，离开了常州。');
}

// 贰 · 夹岸相看（1101）
async function ep1({ shot, say, gesture }) {
  const c = await shot(g => {
    bgScene(g, { bank: 430, near: 790, sun: [1300, 170, 40, .25] });
    const town = el('g', { opacity: .45 }, g);
    [[120, 70, 40], [330, 90, 52], [620, 80, 44], [900, 100, 56], [1210, 76, 42], [1420, 92, 50]].forEach(([x, w, h], i) =>
      (i % 2 ? gableHouse : longHouse)(town, x, 418, w, h));
    const crowd = [el('g', { opacity: 0 }, g), el('g', { opacity: 0 }, g)];
    for (let x = 40; x < 820; x += R(16, 28)) person(crowd[0], x, 434 + R(-3, 3), R(32, 50), R(.4, .65), Math.floor(R(0, 3.99)));
    for (let x = 780; x < 1580; x += R(16, 28)) person(crowd[1], x, 434 + R(-3, 3), R(32, 50), R(.4, .65), Math.floor(R(0, 3.99)));
    const boat = el('g', {}, g);
    el('use', { href: '#boatArt', transform: `translate(0,${BOAT.WL * 2}) scale(1,-1)`, opacity: .14, filter: 'url(#fRipple)' }, boat);
    el('use', { href: '#boatArt' }, boat);
    const placeBoat = x => boat.setAttribute('transform', `translate(${f1(x - 195)},${600 - 144}) scale(1.5)`);
    placeBoat(330);
    crowd.push(el('g', { opacity: 0 }, g));
    for (let x = -40; x < 1660; x += R(70, 120)) person(crowd[2], x, 960, R(190, 270), R(.84, .95), Math.floor(R(0, 3.99)));
    return { crowd, placeBoat };
  });
  await say('旁白', '十六年后，建中靖国元年（1101 年），苏轼从海南北归，乘舟再次来到常州。');
  for (let k = 0; k < 3; k++) {
    const right = k % 2 === 0;
    await gesture({ dir: right ? 'right' : 'left', prompt: `按箭头示意左右划动 · 摇橹（${k + 1}/3）`, at: right ? [560, 200] : [1040, 200], len: 480,
      onProgress: p => {
        c.placeBoat(330 + (k + p) * 240);
        c.crowd[k].setAttribute('opacity', f1(p));
        c.crowd[k].setAttribute('transform', `translate(0,${f1((1 - p) * 26)})`);
      } });
    if (k === 0) await say('旁白', '听说东坡回来了，岸边的人越聚越多……');
  }
  await say('旁白', '据宋人记载，那天运河两岸，“千万人随观之”。');
  const d = await shot(g => {
    bgScene(g, { bank: 520, sun: [1260, 200, 46, .22] });
    const far = el('g', { filter: 'url(#fGhost)', opacity: .6 }, g);
    for (let x = 0; x < 1600; x += R(18, 30)) person(far, x, 524, R(42, 64), R(.35, .6), Math.floor(R(0, 3.99)));
    el('path', { d: 'M-50,820 Q800,842 1650,800 L1650,910 L-50,910 Z', fill: ink(.9) }, g);
    const su = el('use', { href: '#sym-sushi', x: 540, y: 60, width: 444, height: 1000, class: 'breath' }, g);
    const fg = el('g', { filter: 'url(#fDof)', opacity: .85 }, g);
    person(fg, 1230, 1000, 440, .9, 1);
    person(fg, 260, 1010, 400, .85, 0);
    return { su };
  });
  await say('苏轼', '莫看杀轼否？', '——宋·邵博《邵氏闻见后录》。意为：这样看下去，莫不是要把我看杀了？');
  d.su.style.transition = 'opacity 2.6s ease'; d.su.style.opacity = .22; d.su.setAttribute('filter', 'url(#fGhost)');
  await say('旁白', '这是他最后一次来到常州。同年七月，苏轼在常州病逝。');
}

// 叁 · 舣舟筑亭
async function ep2({ shot, say, gesture, sleep }) {
  const c = await shot(g => {
    bgScene(g, { bank: 640, warm: true, sun: [1210, 430, 92, .36] });
    const bt = el('g', { transform: 'translate(150,618) scale(1.3)' }, g);
    el('path', { d: 'M6,80 Q130,93 254,73 Q228,106 130,106 Q38,106 6,80 Z', fill: ink(.88) }, bt);
    el('path', { d: 'M80,90 C82,50 156,50 160,89 Z', fill: ink(.78) }, bt);
    el('path', { d: 'M480,724 Q560,700 640,660', fill: 'none', stroke: ink(.6), 'stroke-width': 1.6 }, g);
    willow(g, 400, 642, 300, .15);
    pine(g, 1330, 644, 330);
    const pg = el('g', { transform: 'translate(800,640) scale(1.45) translate(-800,-640)' }, g);
    const P = pavilion(pg, 800, 640);
    const stream = el('path', { d: 'M800,40 L800,41', stroke: ink(.8), 'stroke-width': 16, 'stroke-linecap': 'round', fill: 'none', filter: 'url(#fWash)', opacity: 0 }, g);
    const ghost = el('use', { href: '#sym-sushi', x: 1150, y: 300, width: 160, height: 360, opacity: 0, filter: 'url(#fGhost)' }, g);
    const stamp = el('g', { opacity: 0, transform: 'translate(1380,190)' }, g);
    el('rect', { x: -38, y: -70, width: 76, height: 150, rx: 4, fill: SEAL }, stamp);
    ['舣', '舟', '亭'].forEach((ch, i) => el('text', { x: 0, y: -26 + i * 46, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 40, fill: WALL, text: ch }, stamp));
    const build = p => {
      const a = easeOut(seg(p, 0, .22));
      P.platform.setAttribute('opacity', f1(a)); P.platform.setAttribute('transform', `translate(0,${f1((1 - a) * 30)})`);
      const k = Math.max(.001, easeOut(seg(p, .2, .5)));
      P.cols.setAttribute('transform', `translate(0,${P.pt}) scale(1,${k.toFixed(3)}) translate(0,${-P.pt})`);
      P.cols.setAttribute('opacity', k > .01 ? 1 : 0);
      P.rails.setAttribute('opacity', f1(seg(p, .42, .6)));
      const r = easeOut(seg(p, .55, .85));
      for (const part of [P.roof, P.top]) part.setAttribute('transform', `translate(0,${f1(-(1 - r) * 200)})`);
      P.roof.setAttribute('opacity', f1(Math.min(1, r * 1.6)));
      P.top.setAttribute('opacity', f1(seg(p, .84, .94)));
      P.plaque.setAttribute('opacity', f1(seg(p, .92, 1)));
      stream.setAttribute('d', `M800,40 L800,${f1(41 + p * 560)}`);
      stream.setAttribute('opacity', f1(p > 0 ? .75 * (1 - seg(p, .9, 1)) : 0));
    };
    build(0);
    return { build, ghost, stamp };
  });
  await say('旁白', '“舣”（yǐ），意为使船靠岸。');
  await say('旁白', '后来，人们为纪念苏轼来常泊舟，在运河边筑起一座亭子。');
  await gesture({ dir: 'down', prompt: '按箭头示意向下缓慢划动 · 筑亭', at: [800, 90], len: 440, onProgress: c.build });
  c.stamp.style.transition = 'opacity .5s'; c.stamp.setAttribute('opacity', 1);
  c.ghost.style.transition = 'opacity 2.4s'; c.ghost.setAttribute('opacity', .32);
  await sleep(600);
  await say('旁白', '这便是舣舟亭，今在常州东坡公园内。', '注：亭为后世纪念建筑，并非苏轼当年所见；画中人影为艺术化表现。');
}

export const EPISODES = [
  { run: ep0, title: '<em>壹</em>买田阳羡' },
  { run: ep1, title: '<em>贰</em>夹岸相看' },
  { run: ep2, title: '<em>叁</em>舣舟筑亭' },
];
