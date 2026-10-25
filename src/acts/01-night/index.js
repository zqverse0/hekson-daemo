import { reseed } from '../../core/rng.js';
import { el } from '../../core/svg.js';
import { loop } from '../../core/tick.js';
import { easeOut, f1 } from '../../core/math.js';
import { paper, BRUSH, SEAL } from '../../ink/palette.js';
import { createPoem } from '../../ink/poem.js';
import { createSeal } from '../../ink/seal.js';
import { hold } from '../../cut/hold.js';
import { taps, choose } from '../../cut/taps.js';
import { compose } from '../../cut/compose.js';
import { LAMP, FIRES, STARS, SONG, CRY, SEAL_AT, SUN, DISHES, POEM,
  drawSky, drawFar, drawRiver, drawBank, createMid, drawSong, drawCry } from './scene.js';

// 第一幕 · 孤舟夜泊（熙宁六年除夕，常州城外）
// 五拍：入画（平远）→ 护灯 · 点远火低星 · 行歌/野哭 → 诗成 → 钤印「残灯」→ 印化为日，雾起"十一年后"
// 结束时雾气盖住画面，下一幕以拂雾（T6）开场。
export default {
  id: 'night',
  title: '<em>壹</em>孤舟夜泊',
  seal: '残灯',
  budget: { visitor: 100, full: 300 },
  run,
  scrollPiece: () => null,       // 结局长卷：后续实现
};

const BRANCH_ITEM = { song: 'firecracker', porridge: 'bowl' };

async function run({ cut, journey, mode, fog }) {
  const visitor = mode !== 'full';
  const st = { lines: new Set(), fires: [], stars: [], branch: null, composed: false };
  let windy = false, sheltering = false, lampLevel = 1;
  let s, stopLamp = () => {};

  // 夜景镜头。支线回来时重建，按 st 还原已完成的内容（reseed 保证每次画面相同）
  async function night() {
    stopLamp();
    s = await cut.shot((mid, { bg, layer }) => {
      reseed(701);
      drawSky(bg);
      const far = layer('far'), river = layer('river'), bank = layer('bank');
      drawFar(far); drawRiver(river); drawBank(bank);
      const m = createMid(mid);
      const poem = createPoem(mid, { lines: POEM, x0: 1520, y0: 96, size: 30, step: 36, gap: 52, fill: paper(.86) });
      const dawn = layer('dawn');
      el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: paper(.62) }, dawn);
      dawn.style.opacity = 0;
      for (const i of st.lines) poem.reveal(i, 0);
      st.fires.forEach(i => m.fire(FIRES[i]));
      st.stars.forEach(i => m.star(STARS[i]));
      if (st.branch) m.branchLight(st.branch);
      if (!st.composed) {
        // 入画前各层错位（与 compose 的初始偏移一致）
        const k = cut.toScreen(0, 0).k;
        for (const [svg, [dx, dy]] of [[far, OFF.far], [river, OFF.river], [bank, OFF.bank]]) {
          svg.style.transform = `translate3d(${dx * k}px,${dy * k}px,0)`; svg.style.opacity = .55;
        }
      } else m.lamp.show(true);
      return { mid, far, river, bank, m, poem, dawn };
    });
    stopLamp = loop((t, dt) => {
      let target = 1;
      if (windy) {
        const gust = Math.pow(Math.max(0, Math.sin(t * .0016)), 2);
        s.m.lamp.wind(.25 + gust * .65, t);
        target = sheltering ? 1 : 1 - .72 * gust;          // 火苗会被吹弱，但不会熄灭
        s.m.lamp.shield(sheltering ? .9 : 0);
      } else { s.m.lamp.wind(0, t); s.m.lamp.shield(0); }
      lampLevel += (target - lampLevel) * .12 * dt;
      s.m.lamp.set(lampLevel, t);
    });
  }
  const write = async (...idx) => { for (const i of idx) { st.lines.add(i); await s.poem.reveal(i, 1300, cut.state.skip); } };

  // ① 入画 · 平远
  await night();
  await compose(cut, {
    prompt: '拖动画层 · 入画',
    layers: [{ svg: s.far, off: OFF.far, band: [300, 500] }, { svg: s.river, off: OFF.river, band: [476, 750] }, { svg: s.bank, off: OFF.bank, band: [740, 900] }],
  });
  st.composed = true;
  s.m.lamp.show(true);
  await cut.say('旁白', '熙宁六年除夕，苏轼赴常州一带赈灾，夜宿城外舟中。');

  // ② 护灯：风一阵阵吹来，按住灯火替它挡风
  windy = true;
  await hold(cut, { prompt: '按住灯火 · 护灯', at: LAMP, r: 160, duration: visitor ? 2600 : 4200, decay: 1 / 6000,
    onProgress: (p, h) => { sheltering = h; } });
  windy = false; sheltering = false;
  await write(6, 7);

  // ③ 墨分五色：远火用淡墨，低星用清墨
  s.m.palette.show(true);
  let dish = null;
  const PROMPT = '蘸墨 · 点远火低星';
  const tip = text => { cut.prompt(text); setTimeout(() => { if (cut.state.cancel) cut.prompt(PROMPT); }, 1600); };
  const stars = STARS.slice(0, visitor ? 3 : 4);
  await taps(cut, {
    prompt: PROMPT,
    targets: [
      ...DISHES.map(d => ({ id: d.id, at: d.at, r: 46 })),
      ...FIRES.map((at, i) => ({ id: 'f' + i, at, r: 64, required: true, hint: true })),
      ...stars.map((at, i) => ({ id: 's' + i, at, r: 60, required: true, hint: true })),
    ],
    onTap(t, auto) {
      const d = DISHES.find(d => d.id === t.id);
      if (d) { dish = d.id; s.m.palette.select(d.id); return false; }
      const fire = t.id[0] === 'f', i = +t.id.slice(1), need = fire ? 'dan' : 'qing';
      if (!auto && !dish) { tip('先在砚中蘸墨'); return false; }
      if (!auto && dish !== need) {
        s.m.blot(t.at, DISHES.find(d => d.id === dish).a);
        tip(fire ? '远火宜淡墨' : '星光宜清墨');
        return false;
      }
      if (fire) { s.m.fire(FIRES[i]); st.fires.push(i); } else { s.m.star(STARS[i]); st.stars.push(i); }
      return true;
    },
  });
  s.m.palette.show(false);
  await write(1);

  // ④ 支线：行歌（城中守岁）或 野哭（城外施粥）
  const tags = el('g', {}, s.mid);
  for (const [text, [x, y]] of [['行歌', [SONG[0], SONG[1] - 70]], ['野哭', [CRY[0], CRY[1] - 70]]]) {
    el('rect', { x: x - 22, y: y - 42, width: 44, height: 84, rx: 3, fill: SEAL, opacity: .9 }, tags);
    [...text].forEach((ch, i) => el('text', { x, y: y - 8 + i * 36, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 30, fill: paper(.95), text: ch }, tags));
  }
  const branch = await choose(cut, {
    prompt: '行歌，还是野哭？',
    options: [{ id: 'song', at: SONG, r: 150 }, { id: 'porridge', at: CRY, r: 170 }],
    fallback: journey.night,
  });
  journey.night = branch;
  stopLamp();
  if (branch === 'song') {
    const v = await cut.shot((mid, { bg }) => drawSong(bg, mid));
    const pick = visitor ? [1, 3, 5] : [0, 1, 2, 3, 4, 5, 6];
    await taps(cut, { prompt: '轻触窗灯 · 行歌', targets: pick.map(i => ({ id: 'w' + i, at: v.wins[i], r: 90, required: true, hint: true })),
      onTap(t) { v.light(+t.id.slice(1)); return true; } });
  } else {
    const v = await cut.shot((mid, { bg }) => drawCry(bg, mid));
    await taps(cut, { prompt: '轻触篝火 · 施粥', targets: v.fires.map((at, i) => ({ id: 'c' + i, at, r: 120, required: true, hint: true })),
      onTap(t) { v.feed(+t.id.slice(1)); return true; } });
  }
  await cut.sleep(900);
  journey.items.push(BRANCH_ITEM[branch]);
  st.branch = branch;
  await night();
  await write(0);

  // ⑤ 诗成
  await write(2, 3, 4, 5);
  const cap = el('text', { x: 1520 - 3.5 * 52, y: 400, 'text-anchor': 'middle', 'font-size': 15, fill: paper(.55), 'letter-spacing': 2,
    text: '苏轼《除夜野宿常州城外二首》其一' }, s.mid);
  await cut.sleep(2400);

  // ⑥ 钤印
  const seal = createSeal(s.mid, '残灯');
  seal.place(SEAL_AT[0], SEAL_AT[1], 1.35, 0, .45);
  let depth = 0;
  await hold(cut, { prompt: '按住 · 钤印', at: SEAL_AT, r: 130, duration: 1200, decay: 1 / 2500,
    onProgress: p => { depth = p; seal.place(SEAL_AT[0], SEAL_AT[1], 1.35 - .35 * p, -3 * p, .45 + .55 * p); } });
  journey.seals.push({ text: '残灯', depth: +depth.toFixed(2) });
  await cut.sleep(800);

  // ⑦ 化印为日（T3）：印离开纸面，飞向东方地平线，化作初升的红日；天色渐明
  for (const e of [s.poem.g, cap, tags]) { e.style.transition = 'opacity 1.2s'; e.style.opacity = 0; }
  s.m.lamp.fade(1600);
  s.dawn.style.transition = 'opacity 3.2s ease'; s.dawn.style.opacity = 1;
  const halo = el('circle', { cx: SUN[0], cy: SUN[1], r: 0, fill: 'url(#n1Lamp)', opacity: .7 }, s.mid);
  const sun = el('circle', { cx: SUN[0], cy: SUN[1], r: 0, fill: SEAL, opacity: .85 }, s.mid);
  await new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : 2600;
    const stop = loop(t => {
      const k = Math.min(1, (t - t0) / dur), e = easeOut(k);
      const x = SEAL_AT[0] + (SUN[0] - SEAL_AT[0]) * e, y = SEAL_AT[1] + (SUN[1] - 30 - SEAL_AT[1]) * e;
      // 方印渐圆：宽高趋同、圆角变大；印文淡去
      seal.box.setAttribute('rx', f1(4 + 26 * e));
      seal.box.setAttribute('y', f1(-54 + 24 * e)); seal.box.setAttribute('height', f1(108 - 48 * e));
      seal.place(x, y, 1 - .25 * e, -3 * (1 - e), 1 - .9 * Math.max(0, (k - .6) / .4));
      for (const t of seal.g.querySelectorAll('text')) t.setAttribute('opacity', f1(1 - e));
      const grow = Math.max(0, (k - .45) / .55);
      sun.setAttribute('r', f1(56 * grow)); sun.setAttribute('cy', f1(SUN[1] - 30 * e));
      halo.setAttribute('r', f1(190 * grow)); halo.setAttribute('cy', f1(SUN[1] - 30 * e));
      if (k >= 1) { stop(); res(); }
    });
  });
  await cut.sleep(1400);
  stopLamp();

  // 雾起：十一年后
  await fog.cover('十一年后');
}

// 入画前各层的错位（镜头坐标）
const OFF = { far: [-240, -110], river: [230, 70], bank: [-150, 150] };
