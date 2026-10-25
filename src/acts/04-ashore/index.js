import { el } from '../../core/svg.js';
import { loop } from '../../core/tick.js';
import { clamp, easeOut, f1 } from '../../core/math.js';
import { primary } from '../../core/input.js';
import { PAPER, SEAL, BRUSH, ink, paper } from '../../ink/palette.js';
import { createPoem } from '../../ink/poem.js';
import { createSeal } from '../../ink/seal.js';
import { primitive } from '../../cut/primitive.js';
import { hold } from '../../cut/hold.js';
import { radGrad } from '../02-yixing/scene.js';
import {
  SCROLL_S0, SCROLL_W, SCROLL_X0, SCROLL_DY, STATIONS, drawScroll, stationCard, drawWaves,
  TEMPLE, drawRiver, drawIsland, PORTRAIT, drawHall, oldFace, drawItem,
  CANAL, GROUPS, drawCanal, drawCanalBoat, drawGroup, speech,
  WIN, LAMP_GOAL, ROPE, drawRoom, drawWindow, drawRiverDoor, itemList, drawTable, createShadows, createLamp,
  PAV_LAMP, drawPavilion,
} from './scene.js';

// 第四幕 · 舣舟（1085—1101，终幕）
// 万里长卷（停靠驿站）→ 儋州的浪变长江的浪，金山立起 → 对镜《自题金山画像》→ 推进画像的眼睛，入常州运河
// → 千人随观，听见谁 →「莫看杀轼否？」→ 钤印「不系舟」→ T7 硬切（全篇唯一）→ 孙氏馆：移灯，物影成「舣」
// →《答径山琳长老》→ 按住缆绳，「着力即差」，松手舣舟 → 灯灭，「舣舟」印自己落下 → T3 印化为舣舟亭中的灯
export default {
  id: 'ashore',
  title: '<em>肆</em>舣舟',
  seal: '舣舟',
  light: true,
  budget: { visitor: 150, full: 240 },
  run,
  scrollPiece: () => null,       // 结局长卷：后续实现
};

const JINSHAN = ['心似已灰之木', '身如不系之舟', '问汝平生功业', '黄州惠州儋州'];
const PLACE_ITEM = { 2: 'huizhou', 4: 'danzhou' };          // 第四句第几字起的地名 ↔ 驿站
// 人群的话（示意，不是引文）；书生背的是苏轼的诗
const LINES = {
  scholar: j => j.heart === 'bamboo' ? '宁可食无肉，不可居无竹' : '此生已觉都无事，今岁仍逢大有年',
  farmer: () => '宜兴的橘子，今年又结满了',
  elder: () => '那年除夕，城外有人给我们施粥',
  child: () => '哪个是东坡？',
  monk: () => '径山的维琳长老，也要来看他',
};
const AVAILABLE = { farmer: j => (j.yixing || []).includes('orchard'), elder: j => j.night === 'porridge' };

async function run({ cut, journey, mode }) {
  const visitor = mode !== 'full';
  for (const key of ['stops', 'items', 'heard', 'seals']) if (!Array.isArray(journey[key])) journey[key] = [];
  const K = () => cut.toScreen(0, 0).k;

  // ① 万里长卷：与第三幕结尾展开的长卷重合，再推近到卷首
  const v = await cut.shot((mid, { bg, layer }) => {
    el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
    const k = K(), svg = layer('scroll'), x0 = SCROLL_X0 - 40, w = SCROLL_W + 80, a = cut.toScreen(x0, 0);
    svg.setAttribute('viewBox', `${x0} 0 ${w} 900`);
    svg.setAttribute('preserveAspectRatio', 'none');
    Object.assign(svg.style, { inset: 'auto', left: `${a.x}px`, top: `${a.y}px`, width: `${w * k}px`, height: `${900 * k}px`, willChange: 'transform' });
    const s = drawScroll(svg);
    const waves = layer('waves');
    drawWaves(waves);
    Object.assign(waves.style, { display: 'none', willChange: 'transform' });
    const div = mid.parentNode;
    div.style.willChange = 'transform';
    div.style.transform = `translate3d(0,${f1(SCROLL_DY * k)}px,0) scale(${SCROLL_S0.toFixed(4)})`;
    return { ...s, svg, waves, div, mid, k };
  });
  const pan = tx => { v.svg.style.transform = `translate3d(${f1(tx * v.k)}px,0,0)`; };
  const txStart = 60 - SCROLL_X0, txEnd = 1600 - (SCROLL_X0 + SCROLL_W + 60);
  await tween(cut, 2400, e => {
    v.div.style.transform = `translate3d(0,${f1(SCROLL_DY * v.k * (1 - e))}px,0) scale(${(SCROLL_S0 + (1 - SCROLL_S0) * e).toFixed(4)})`;
    pan(txStart * e);
  });
  v.div.style.transform = ''; v.div.style.willChange = 'auto';      // 缩放结束后按原尺寸重新栅格化，卷面才清晰
  await cut.say('旁白', '此后十六年，苏轼辗转南北，远谪惠州、儋州。');

  // 墨线自动前进；经过杭州、惠州、儋州时放慢并现出朱点，点中即停靠（游客版最多一处，完整版两处）
  const maxStops = visitor ? 1 : 2;
  const len = v.route.getTotalLength();
  const at = STATIONS.map(s => {
    let best = 0, bd = Infinity;
    for (let l = 0; l <= len; l += 6) { const d = Math.abs(v.route.getPointAtLength(l).x - s.x); if (d < bd) { bd = d; best = l; } }
    return best;
  });
  v.route.setAttribute('stroke-dasharray', `${f1(len)} ${f1(len)}`);
  await primitive(cut, '点朱点 · 停靠驿站', api => {
    const gest = cut.gest;
    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    api.stopOnEnd(() => { gest.innerHTML = ''; });
    let l = 0, tx = txStart, card = null, cardT = 0, ring = null, ringFor = -1;
    const shown = new Set();
    const canStop = i => STATIONS[i].stop && !journey.stops.includes(STATIONS[i].id) && journey.stops.length < maxStops;
    const nearIdx = () => card ? -1 : STATIONS.findIndex((s, i) => canStop(i) && l > at[i] - 260 && l < at[i] + 140);
    const draw = () => {
      v.route.setAttribute('stroke-dashoffset', f1(len - l));
      const p = v.route.getPointAtLength(l);
      v.head.setAttribute('transform', `translate(${f1(p.x)},${f1(p.y - 4)})`);
      STATIONS.forEach((s, i) => { if (!shown.has(i) && l >= at[i] - 8) { shown.add(i); v.labels[i].style.transition = 'opacity .6s'; v.labels[i].style.opacity = 1; } });
      tx = clamp(820 - p.x, txEnd, txStart);
      pan(tx);
      const i = nearIdx();
      if (i !== ringFor) { ring?.remove(); ring = null; ringFor = i; }
      if (i >= 0) {
        const c = cut.toScreen(STATIONS[i].x + tx, STATIONS[i].y);
        if (!ring) ring = el('circle', { class: 'start', r: f1(Math.max(22, 26 * c.k)), fill: 'none', stroke: SEAL, 'stroke-width': 3 }, gest);
        ring.setAttribute('cx', f1(c.x)); ring.setAttribute('cy', f1(c.y));
      }
    };
    const stopAt = i => {
      const s = STATIONS[i];
      journey.stops.push(s.id); journey.items.push(s.item);
      card = stationCard(v.mid, s.id); cardT = performance.now();
      requestAnimationFrame(() => { card.style.opacity = 1; });
      draw();
    };
    api.on(cut.root, 'pointerdown', primary(e => {
      const i = nearIdx();
      if (i < 0) return;
      const s = cut.toShot(e.clientX, e.clientY);
      if (Math.hypot(s.x - (STATIONS[i].x + tx), s.y - STATIONS[i].y) < 240) stopAt(i);
    }));
    api.on(window, 'keydown', e => { if (e.key === 'Enter') { const i = nearIdx(); if (i >= 0) { e.preventDefault(); stopAt(i); } } });
    const dropCard = () => { const c = card; card = null; c.style.opacity = 0; setTimeout(() => c.remove(), 600); };
    api.stopOnEnd(loop((t, dt) => {
      if (card) { if (t - cardT > 3400) dropCard(); return; }
      l = Math.min(len, l + (nearIdx() >= 0 ? 150 : 640) * dt * 16.667 / 1000);
      draw();
      if (l >= len) api.finish();
    }));
    draw();
    return () => { if (card) dropCard(); l = len; draw(); api.finish(); };
  });

  // 儋州：海浪拍满屏幕
  v.waves.style.display = '';
  await tween(cut, 1600, e => { v.waves.style.transform = `translate3d(0,${f1(900 * v.k * (1 - e))}px,0)`; });

  // ② 金山：浪退，江心立起金山（T4：同一幅浪接过来）
  const j = await cut.shot((mid, { bg, layer }) => {
    const k = K();
    drawRiver(bg);
    const isle = layer('isle'), waves = layer('waves');
    drawIsland(isle); drawWaves(waves);
    for (const s of [isle, waves]) s.style.willChange = 'transform';
    isle.style.transform = `translate3d(0,${f1(280 * k)}px,0)`;
    const div = mid.parentNode;
    div.style.willChange = 'transform';
    return { isle, waves, div, k };
  });
  await tween(cut, 2600, e => {
    j.waves.style.transform = `translate3d(0,${f1(900 * j.k * e)}px,0)`;
    j.isle.style.transform = `translate3d(0,${f1(280 * j.k * (1 - e))}px,0)`;
  });
  j.waves.style.display = 'none'; j.isle.style.transform = '';
  await cut.sleep(1000);
  await zoom(cut, j.div, cut.toScreen(...TEMPLE), 1, 2.4, 1500);

  // ③ 对镜：画前的人移到画像上，两张脸重叠时《自题金山画像》落下
  const h = await cut.shot((mid, { bg }) => {
    drawHall(bg);
    oldFace(bg, PORTRAIT[0], PORTRAIT[1], .9, true);
    const me = el('g', {}, mid);
    oldFace(me, 0, 0, .9, false);
    const div = mid.parentNode;
    div.style.willChange = 'transform';
    return { me, mid, div };
  });
  const placeMe = p => {
    h.me.setAttribute('transform', `translate(${f1(1190 - (1190 - PORTRAIT[0]) * p)},${PORTRAIT[1]})`);
    h.me.setAttribute('opacity', f1(1 - .45 * clamp((p - .6) / .4, 0, 1)));
  };
  placeMe(0);
  await cut.gesture({ dir: 'left', prompt: '按箭头示意向左划动 · 对镜', at: [1190, 790], len: 560, onProgress: placeMe });
  h.me.style.transition = 'opacity 1.4s'; h.me.style.opacity = 0;
  await cut.sleep(900);
  const poem = createPoem(h.mid, { lines: JINSHAN, x0: 1390, y0: 170, size: 42, step: 52, gap: 76, fill: ink(.88) });
  for (let i = 0; i < JINSHAN.length; i++) await poem.reveal(i, 1000, cut.state.skip);
  // 黄州、惠州、儋州依次点朱；过场停靠过的驿站，收集物在地名旁一闪
  const cx = 1390 - 3 * 76;
  const marks = el('g', {}, h.mid);
  for (const i of [0, 2, 4]) {
    const y = 170 + i * 52 - 38;
    const m = el('line', { x1: cx + 34, y1: y, x2: cx + 34, y2: y + 96, stroke: SEAL, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, marks);
    m.style.transition = 'opacity .5s'; requestAnimationFrame(() => { m.style.opacity = 1; });
    const stop = PLACE_ITEM[i] && STATIONS.find(s => s.id === PLACE_ITEM[i]);
    if (stop && journey.stops.includes(stop.id)) {
      const it = el('g', { transform: `translate(${cx - 70},${y + 70}) scale(1.4)`, opacity: 0 }, marks);
      drawItem(it, stop.item);
      it.style.transition = 'opacity .4s'; requestAnimationFrame(() => { it.style.opacity = 1; });
      setTimeout(() => { it.style.transition = 'opacity 1.2s'; it.style.opacity = 0; }, cut.state.skip ? 0 : 1300);
    }
    await cut.sleep(800);
  }
  const cap = el('text', { x: 1390 - 1.5 * 76, y: 170 + 6 * 52 + 20, 'text-anchor': 'middle', 'font-size': 16, fill: ink(.5), 'letter-spacing': 2, text: '苏轼《自题金山画像》' }, h.mid);
  await cut.sleep(2200);

  // 推进画像的眼睛：眼中倒映出一条河，穿过倒影来到常州段运河
  for (const e of [poem.g, marks, cap]) { e.style.transition = 'opacity .8s'; e.style.opacity = 0; }
  const eye = [PORTRAIT[0] - 19 * .9, PORTRAIT[1] - 12 * .9];
  const refl = el('g', { opacity: 0 }, h.mid);
  el('ellipse', { cx: eye[0], cy: eye[1], rx: 7, ry: 3.4, fill: paper(.9), stroke: ink(.6), 'stroke-width': .6 }, refl);
  el('path', { d: `M${eye[0] - 6},${eye[1] + .6} q3,-1 6,0 t6,0`, fill: 'none', stroke: ink(.55), 'stroke-width': .5 }, refl);
  refl.style.transition = 'opacity 1s'; requestAnimationFrame(() => { refl.style.opacity = 1; });
  await cut.sleep(600);
  await zoom(cut, h.div, cut.toScreen(...eye), 1, 5, 1800);

  // ④ 运河万人：听见谁
  const c = await cut.shot((mid, { bg }) => {
    drawCanal(bg);
    const boat = drawCanalBoat(mid);
    const groups = GROUPS.map(g => ({ ...g, ok: !AVAILABLE[g.id] || AVAILABLE[g.id](journey) }));
    groups.forEach(g => drawGroup(mid, g));
    return { mid, boat, groups };
  });
  await cut.say('旁白', '建中靖国元年夏，苏轼自海南北归，舟入常州运河。');
  const avail = c.groups.filter(g => g.ok);
  const need = Math.min(visitor ? 2 : 3, avail.length);
  const bubbles = [];
  await primitive(cut, '点人群 · 听', api => {
    const gest = cut.gest;
    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    api.stopOnEnd(() => { gest.innerHTML = ''; });
    const rings = new Map(), heard = new Set();
    const mark = g => { const s = cut.toScreen(g.at[0], g.at[1] - (g.at[1] < CANAL.near ? 24 : 44)); rings.set(g.id, el('circle', { class: 'start', cx: s.x, cy: s.y, r: f1(Math.max(26, 44 * s.k)), fill: 'none', stroke: SEAL, 'stroke-width': 2.4 }, gest)); };
    avail.forEach(mark);
    const hear = g => {
      if (heard.has(g.id) || heard.size >= need) return;
      heard.add(g.id); journey.heard.push(g.id);
      rings.get(g.id)?.remove();
      const b = speech(c.mid, g.at, LINES[g.id](journey), g.at[1] < CANAL.near);
      bubbles.push(b); requestAnimationFrame(() => { b.style.opacity = 1; });
      if (heard.size >= need) { for (const r of rings.values()) r.remove(); api.after(() => api.finish(), 1800); }
    };
    api.on(cut.root, 'pointerdown', primary(e => {
      const s = cut.toShot(e.clientX, e.clientY);
      const g = avail.find(g => Math.hypot(s.x - g.at[0], s.y - (g.at[1] - 30)) < 150);
      if (g) hear(g);
    }));
    api.on(window, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const g = avail.find(g => !heard.has(g.id)); if (g) hear(g); } });
    // 船缓缓前行
    const t0 = performance.now();
    api.stopOnEnd(loop(t => c.boat.setAttribute('transform', `translate(${f1(Math.min(120, (t - t0) * .006))},0)`)));
    return () => { for (const g of avail) hear(g); api.finish(); };
  });
  // 全场人声骤停一拍
  for (const b of bubbles) { b.style.transition = 'opacity .25s'; b.style.opacity = 0; }
  await cut.sleep(900);
  await cut.say('苏轼', '莫看杀轼否？', '——邵博《邵氏闻见后录》');

  // 钤印「不系舟」
  const sealAt = [1450, 132];
  const s4 = createSeal(c.mid, '不系舟');
  s4.place(sealAt[0], sealAt[1], 1.3, 0, .45);
  let depth = 0;
  await hold(cut, { prompt: '按住 · 钤印', at: sealAt, r: 130, duration: 1200, decay: 1 / 2500,
    onProgress: p => { depth = p; s4.place(sealAt[0], sealAt[1], 1.3 - .3 * p, -3 * p, .45 + .55 * p); } });
  journey.seals.push({ text: '不系舟', depth: +depth.toFixed(2) });

  // ⑤ T7 硬切（全篇唯一一次）：印刚落下，下一帧就是孙氏馆漆黑的屋子，只有一盏灯
  cut.hush();
  cut.root.classList.remove('light');
  const items = itemList(journey);
  const r = await cut.shot((mid, { bg, layer }) => {
    drawRoom(bg);
    const L = { door: layer('door'), win: layer('win'), table: layer('table') };
    const boat = drawRiverDoor(L.door, mid);
    drawWindow(L.win);
    const xs = drawTable(L.table, items);
    const shadows = createShadows(mid, items, xs);
    const lamp = createLamp(mid);
    const rope = el('path', { fill: 'none', stroke: paper(.6), 'stroke-width': 2.4, 'stroke-linecap': 'round' }, mid);
    const k = K();
    const OFF = { door: [140, 0], win: [0, -70], table: [0, 90] };
    for (const [id, [dx, dy]] of Object.entries(OFF)) Object.assign(L[id].style, { transform: `translate3d(${dx * k}px,${dy * k}px,0)`, opacity: .3, willChange: 'transform, opacity' });
    for (const e of [boat, shadows.root, lamp.g, rope]) e.style.display = 'none';
    return { L, OFF, boat, shadows, lamp, rope, mid, div: mid.parentNode, k };
  }, { hard: true });
  // 入画自动完成：窗、门外的河、桌依次归位
  await tween(cut, 2600, e => {
    for (const [id, [dx, dy]] of Object.entries(r.OFF)) { r.L[id].style.transform = `translate3d(${f1(dx * r.k * (1 - e))}px,${f1(dy * r.k * (1 - e))}px,0)`; r.L[id].style.opacity = f1(.3 + .7 * e); }
  });
  for (const s of Object.values(r.L)) { s.style.transform = ''; s.style.willChange = 'auto'; }
  for (const e of [r.boat, r.shadows.root, r.lamp.g, r.rope]) e.style.display = '';
  let boatX = 0, sag = 30;
  const drawRope = () => {
    const [px, py] = ROPE.post, bx = ROPE.boat[0] - 64 + boatX, by = ROPE.boat[1] - 4;
    r.rope.setAttribute('d', `M${px},${py - 20} Q${f1((px + bx) / 2)},${f1((py + by) / 2 + sag)} ${f1(bx)},${by}`);
    r.boat.setAttribute('transform', `translate(${f1(boatX)},0)`);
  };
  drawRope();

  // 灯影成字：左右移灯，物影投在窗纸上；无论桌上是什么，都聚成「舣」
  let lampX = 420;
  const update = (t = performance.now()) => { const cc = clamp(1 - Math.abs(lampX - LAMP_GOAL) / 380, 0, 1); r.lamp.place(lampX, 1, t); r.shadows.set(lampX, cc); return cc; };
  update();
  await primitive(cut, '左右拖动 · 移灯照影', api => {
    const gest = cut.gest;
    gest.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    gest.innerHTML = '';
    api.stopOnEnd(() => { gest.innerHTML = ''; });
    const ring = el('circle', { class: 'start', r: 40, fill: 'none', stroke: SEAL, 'stroke-width': 2.4 }, gest);
    let drag = null, key = 0, ok = 0;
    api.on(cut.root, 'pointerdown', primary(e => { drag = { x: cut.toShot(e.clientX, e.clientY).x, l: lampX }; }));
    api.on(cut.root, 'pointermove', primary(e => { if (drag) lampX = clamp(drag.l + cut.toShot(e.clientX, e.clientY).x - drag.x, 320, 1280); }));
    const up = primary(() => { drag = null; });
    api.on(cut.root, 'pointerup', up); api.on(cut.root, 'pointercancel', up);
    api.on(window, 'keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); key = e.key === 'ArrowLeft' ? -1 : 1; } });
    api.on(window, 'keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') key = 0; });
    api.stopOnEnd(loop((t, dt) => {
      lampX = clamp(lampX + key * 7 * dt, 320, 1280);
      const cc = update(t);
      const s = cut.toScreen(lampX, 640);
      ring.setAttribute('cx', f1(s.x)); ring.setAttribute('cy', f1(s.y)); ring.setAttribute('r', f1(Math.max(26, 40 * s.k)));
      ok = cc > .94 ? ok + dt * 16.667 : 0;
      if (ok > 500) api.finish();
    }));
    return () => { lampX = LAMP_GOAL; update(); api.finish(); };
  });
  const from = lampX;
  await tween(cut, 900, e => { lampX = from + (LAMP_GOAL - from) * e; update(); });
  r.shadows.set(LAMP_GOAL, 1);
  await cut.sleep(1400);

  // 《答径山琳长老》写在窗纸上，随月光淡去
  const lines = ['大患缘有身', '无身则无疾'];
  const wp = createPoem(r.mid, { lines, x0: WIN.x + WIN.w - 50, y0: WIN.y + 64, size: 34, step: 44, gap: 50, fill: ink(.85) });
  for (let i = 0; i < lines.length; i++) await wp.reveal(i, 1200, cut.state.skip);
  const wcap = el('text', { x: WIN.x + WIN.w - 20, y: WIN.y + WIN.h - 20, 'text-anchor': 'end', 'font-size': 15, fill: ink(.6), 'letter-spacing': 2, text: '苏轼《答径山琳长老》（节）' }, r.mid);
  await cut.sleep(1800);
  for (const e of [wp.g, wcap, r.shadows.root]) { e.style.transition = 'opacity 2.6s'; e.style.opacity = 0; }
  await cut.sleep(2600);

  // ⑥ 放手：按住缆绳；「着力即差」；松手，船轻轻靠岸
  const ropeAt = [(ROPE.post[0] + ROPE.boat[0] - 64) / 2, (ROPE.post[1] + ROPE.boat[1]) / 2 + 6];
  await hold(cut, { prompt: '按住 · 缆绳', at: ropeAt, r: 170, duration: 1400, decay: 1 / 3000,
    onProgress: p => { sag = 30 * (1 - p); boatX = -14 * p; drawRope(); } });
  const word = createPoem(r.mid, { lines: ['着力即差'], x0: 300, y0: 220, size: 52, step: 66, gap: 60, fill: paper(.9) });
  await word.reveal(0, 1600, cut.state.skip);
  const wnote = el('text', { x: 300, y: 520, 'text-anchor': 'middle', 'font-size': 16, fill: paper(.55), 'letter-spacing': 2, text: '——钱世雄劝他着力，苏轼答' }, r.mid);
  await primitive(cut, '松开 · 舣舟', api => {
    api.on(cut.root, 'pointerup', primary(() => api.finish()));
    api.on(window, 'keyup', e => { if (e.key === ' ' || e.key === 'Enter') api.finish(); });
  });
  await tween(cut, 2600, e => { boatX = -14 + (ROPE.dock[0] - ROPE.boat[0] + 14) * e; sag = 30 + 50 * e; drawRope(); });
  r.rope.style.transition = 'opacity 1.2s'; r.rope.style.opacity = 0;
  await cut.sleep(600);

  // ⑦ 灯灭；黑暗中，一方朱印自己落下：「舣舟」
  for (const e of [word.g, wnote]) { e.style.transition = 'opacity 1.4s'; e.style.opacity = 0; }
  await tween(cut, 1600, e => r.lamp.place(LAMP_GOAL, 1 - e));
  const dark = document.createElement('div');
  dark.style.cssText = 'position:absolute;inset:0;background:#1c1b19;opacity:0;transition:opacity 1.6s';
  r.div.appendChild(dark);
  requestAnimationFrame(() => { dark.style.opacity = 1; });
  await cut.sleep(1800);
  const top = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice' }, r.div);
  const glow = el('circle', { cx: PAV_LAMP[0], cy: PAV_LAMP[1], r: 0, fill: radGrad(top, 'a4SealGlow', [[0, paper(.95)], [.3, 'rgba(176,58,46,.55)'], [1, 'rgba(176,58,46,0)']]) }, top);
  const s5 = createSeal(top, '舣舟');
  await tween(cut, 900, e => s5.place(PAV_LAMP[0], PAV_LAMP[1], 1.9 - .9 * e, 4 * (1 - e), e));
  journey.seals.push({ text: '舣舟', depth: 1 });
  await cut.sleep(1600);

  // T3：朱印慢慢变亮、变暖，化成舣舟亭里的一盏灯
  await tween(cut, 2000, e => { glow.setAttribute('r', f1(320 * e)); s5.place(PAV_LAMP[0], PAV_LAMP[1], 1 - .6 * e, 0, 1 - e); });
  cut.root.classList.add('light');
  const f = await cut.shot((mid, { bg }) => { drawPavilion(bg, mid); return { mid }; });
  await cut.sleep(1200);

  // 结局：同一句话；各幕钤下的印排成一行，印色深浅取决于盖印的力度
  const end = el('text', { x: 800, y: 150, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 54, fill: ink(.85), 'letter-spacing': 6, opacity: 0, text: '他漂泊了一生，最后在这里靠了岸。' }, f.mid);
  end.style.transition = 'opacity 2s'; requestAnimationFrame(() => { end.style.opacity = 1; });
  await cut.sleep(2000);
  const seals = journey.seals.filter(s => s && s.text);
  seals.forEach((s, i) => {
    const sl = createSeal(f.mid, s.text);
    const h = (20 + 44 * [...s.text].length) * .55;                  // 印高随字数，按顶边对齐
    sl.place(800 + (i - (seals.length - 1) / 2) * 76, 214 + h / 2, .55, 0, .3 + .7 * clamp(+s.depth || 0, 0, 1));
  });
  el('text', { x: 800, y: 872, 'text-anchor': 'middle', 'font-size': 16, fill: ink(.5), 'letter-spacing': 2, text: '注：舣舟亭为后世纪念建筑，并非苏轼当年所见。' }, f.mid);
  await cut.sleep(2400);
}

// 按时长逐帧推进 fn(e)，e 为缓动后的 0..1；跳过时立即到终点
function tween(cut, ms, fn) {
  return new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : ms;
    const stop = loop(t => { const k = Math.min(1, Math.max(0, (t - t0) / dur)); fn(easeOut(k)); if (k >= 1) { stop(); res(); } });
  });
}

// 镜头推近：以屏幕点 o 为中心缩放整个镜头 div（JS 逐帧，见 CLAUDE.md 性能规则）
function zoom(cut, div, o, a, b, ms) {
  div.style.transformOrigin = `${o.x}px ${o.y}px`;
  return new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : ms;
    const stop = loop(t => {
      const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      div.style.transform = `scale(${(a + (b - a) * e).toFixed(3)})`;
      if (k >= 1) { stop(); res(); }
    });
  });
}
