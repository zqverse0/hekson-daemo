import { el } from '../../core/svg.js';
import { loop } from '../../core/tick.js';
import { easeOut, f1 } from '../../core/math.js';
import { primary } from '../../core/input.js';
import { ink } from '../../ink/palette.js';
import { createPoem } from '../../ink/poem.js';
import { createSeal } from '../../ink/seal.js';
import { primitive } from '../../cut/primitive.js';
import { hold } from '../../cut/hold.js';
import { compose } from '../../cut/compose.js';
import { chant } from '../../cut/chant.js';
import { POEM, TONES, OFF, BAND, BOAT, HOME, drawSky, drawFar, drawTemple, drawFields, createGrowth, createChantText,
  drawRiverSky, drawHome, drawAhead, createBoat, createEdict, createScroll } from './scene.js';

// 第三幕 · 归去来兮（元丰八年，1085）
// 入画（深远：远山、山寺、麦田）→ 吟诵《归宜兴留题竹西寺》（平声长按画麦浪远山，仄声轻点落野花飞鸟）
// → 第二卷诏书落下，船头被强行掉转（此时的划动故意无效）→ 逆水回望 / 随风放舟（以最后 5 秒为准）
// → 《满庭芳》对应的句子 → 钤印「归去来」→ 诏书展开成万里长卷（T4，进入过场）
export default {
  id: 'return',
  title: '<em>叁</em>归去来兮',
  seal: '归去来',
  light: true,
  budget: { visitor: 70, full: 120 },
  run,
  scrollPiece: () => null,       // 结局长卷：后续实现
};

const MOOD_LINES = {
  longing: ['老去君恩未报', '空回首弹铗悲歌'],
  free: ['船头转', '长风万里', '归马驻平坡'],
};

async function run({ cut, journey, mode }) {
  const visitor = mode !== 'full';

  // ① 入画 · 深远
  const a = await cut.shot((mid, { bg, layer }) => {
    drawSky(bg);
    const L = { far: layer('far'), temple: layer('temple'), fields: layer('fields') };
    drawFar(L.far); drawTemple(L.temple); drawFields(L.fields);
    const k = cut.toScreen(0, 0).k;
    for (const [id, [dx, dy]] of Object.entries(OFF)) { L[id].style.transform = `translate3d(${dx * k}px,${dy * k}px,0)`; L[id].style.opacity = .55; }
    const text = createChantText(mid, { lines: POEM, tones: TONES });
    text.g.style.display = 'none';
    return { mid, L, text, growth: createGrowth(mid) };
  });
  await compose(cut, { prompt: '拖动画层 · 入画', layers: Object.keys(OFF).map(id => ({ svg: a.L[id], off: OFF[id], band: BAND[id] })) });
  await cut.say('旁白', '元丰八年，苏轼获准常州居住，南归途中过扬州竹西寺。');

  // ② 吟诵：游客版跟吟前两句，后两句自动吟完
  a.text.g.style.display = '';
  const n = visitor ? 14 : 28;
  const tones = TONES.join('').slice(0, n).split('');
  let longMs = 280;
  a.text.focus(0);
  await chant(cut, {
    prompt: '○ 平声长按 · ● 仄声轻点', tones, longMs,
    onStart: () => a.growth.start(),
    onHold: (i, ms) => { if (ms > 120) a.growth.grow(ms, longMs); },
    onEnd: (i, kind, match) => { a.growth.end(kind); a.text.sing(i, match); a.text.focus(i + 1); },
  });
  for (let i = n; i < 28; i++) {
    a.text.focus(i);
    const kind = TONES.join('')[i] === '平' ? 'long' : 'short';
    a.growth.start(); if (kind === 'long') a.growth.grow(longMs * 3, longMs);
    a.growth.end(kind); a.text.sing(i, true);
    await cut.sleep(150);
  }
  a.text.focus(-1);
  el('text', { x: 300 - 3 * 58, y: 470, 'text-anchor': 'middle', 'font-size': 15, fill: ink(.5), 'letter-spacing': 2, text: '苏轼《归宜兴留题竹西寺》' }, a.mid);
  await cut.sleep(2000);

  // ③ 运河上：第二卷诏书落下
  const r = await cut.shot((mid, { bg, layer }) => {
    drawRiverSky(bg);
    const home = layer('home'), ahead = layer('ahead');
    drawHome(home, { orchard: (journey.yixing || []).includes('orchard') || !journey.yixing?.length });
    drawAhead(ahead);
    ahead.style.opacity = .35;
    for (const s of [home, ahead]) s.style.willChange = 'transform, opacity';
    const div = mid.parentNode;
    div.style.willChange = 'transform, opacity';
    const boat = createBoat(mid);
    const edict = createEdict(mid);
    const scroll = createScroll(layer('scroll'));
    return { mid, home, ahead, boat, edict, scroll, div };
  });
  r.edict.setAttribute('opacity', 1);
  await tween(cut, 1300, e => r.edict.setAttribute('transform', `translate(${BOAT[0] + 60},${f1(-60 + (BOAT[1] - 40 + 60) * e)}) rotate(${f1(40 * (1 - e))})`));
  await cut.say('旁白', '同年，朝廷起用苏轼，他只得离开。');

  // ④ 船头掉转：提示往回划，但无论怎么划，船都被掉过头去（输入故意失效，这是设计）
  await primitive(cut, '向左划动 · 回宜兴', api => {
    let last = null;
    api.on(cut.root, 'pointerdown', primary(e => { last = e.clientX; }));
    api.on(cut.root, 'pointermove', primary(e => { if (last !== null && e.clientX < last - 2) r.boat.splash.setAttribute('opacity', 1); last = e.clientX; }));
    api.on(cut.root, 'pointerup', primary(() => { last = null; r.boat.splash.setAttribute('opacity', 0); }));
    const t0 = performance.now();
    api.stopOnEnd(loop(t => {
      const k = Math.min(1, Math.max(0, (t - t0 - 900) / 2200));
      r.boat.turn(1 - 2 * easeOut(k));
      if (k >= 1) { r.boat.splash.setAttribute('opacity', 0); api.finish(); }
    }));
    return () => { r.boat.turn(-1); api.finish(); };
  });

  // ⑤ 逆水回望 / 随风放舟：向左划（继续往回）为思归，放手或向右为旷达；以最后 5 秒为准
  const home = cut.toScreen(...HOME);
  r.home.style.transformOrigin = `${home.x}px ${home.y}px`;
  const mood = await drift(cut, {
    prompt: '向左划动 · 回望　放手 · 随风', ms: visitor ? 10000 : 14000, fallback: journey.mood,
    onFrame(w, p, rowing) {
      r.home.style.transform = `scale(${(1 - .82 * p).toFixed(3)})`;
      r.home.style.opacity = f1(.35 + .65 * w);
      r.ahead.style.opacity = f1(.35 + .65 * (1 - w));
      r.boat.setSail(1 - w);
      r.boat.splash.setAttribute('opacity', rowing ? 1 : 0);
    },
  });
  journey.mood = mood;

  // ⑥ 《满庭芳》：思归与旷达各写一句
  const lines = MOOD_LINES[mood];
  const poem = createPoem(r.mid, { lines, x0: 1060, y0: 110, size: 36, step: 42, gap: 54, fill: ink(.85) });
  for (let i = 0; i < lines.length; i++) await poem.reveal(i, 1100, cut.state.skip);
  const cap = el('text', { x: 1060, y: 110 + Math.max(...lines.map(l => l.length)) * 42 + 8, 'text-anchor': 'end', 'font-size': 15, fill: ink(.5), 'letter-spacing': 2, text: '苏轼《满庭芳》（节）' }, r.mid);
  await cut.sleep(1400);

  // ⑦ 钤印「归去来」
  const sealAt = [1060 - lines.length * 54 - 26, 200];
  const seal = createSeal(r.mid, '归去来');
  seal.place(sealAt[0], sealAt[1], 1.3, 0, .45);
  let depth = 0;
  await hold(cut, { prompt: '按住 · 钤印', at: sealAt, r: 130, duration: 1200, decay: 1 / 2500,
    onProgress: p => { depth = p; seal.place(sealAt[0], sealAt[1], 1.3 - .3 * p, -3 * p, .45 + .55 * p); } });
  journey.seals.push({ text: '归去来', depth: +depth.toFixed(2) });
  await cut.sleep(700);

  // ⑧ T4：诏书升起，展开、再展开，成为万里长卷；镜头拉远
  for (const e of [poem.g, seal.g, cap]) { e.style.transition = 'opacity 1s'; e.style.opacity = 0; }
  await tween(cut, 900, e => r.edict.setAttribute('transform', `translate(${f1(BOAT[0] + 60 - 60 * e)},${f1(BOAT[1] - 40 - (BOAT[1] - 370) * e)}) scale(${f1(1 + .6 * e)})`));
  r.edict.setAttribute('opacity', 0);
  // 江景淡去只剩纸色，长卷独自展开；镜头拉远时四周也是纸
  for (const s of [r.home, r.ahead, r.div.querySelector('svg.bg')]) { s.style.transition = 'opacity 2s'; s.style.opacity = 0; }
  r.boat.g.style.transition = 'opacity 2s'; r.boat.g.style.opacity = 0;
  await tween(cut, 3000, e => r.scroll.set(e * .5));
  await tween(cut, 2600, e => {
    r.scroll.set(.5 + .5 * e);
    r.div.style.transform = `scale(${(1 - .45 * e).toFixed(3)})`;
  });
  await cut.sleep(1200);
  cut.hush();
}

// 按时长逐帧推进 fn(e)，e 为缓动后的 0..1；跳过时立即到终点
function tween(cut, ms, fn) {
  return new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : ms;
    const stop = loop(t => { const k = Math.min(1, Math.max(0, (t - t0) / dur)); fn(easeOut(k)); if (k >= 1) { stop(); res(); } });
  });
}

// 逆水回望 / 随风放舟：w 0 为放舟、1 为回望。向左划动（或按住 ←）时趋向 1，放手或向右划时回落。
// 结束时取最后 5 秒 w 的平均值。自动完成时按已有记录判定，没有记录则用 fallback（默认放舟）
function drift(cut, { prompt, ms, fallback = 'free', onFrame }) {
  return primitive(cut, prompt, api => {
    let w = 0, lastLeft = -1e9, x = null, keyL = false;
    const hist = [], t0 = performance.now();
    api.on(cut.root, 'pointerdown', primary(e => { x = e.clientX; }));
    api.on(cut.root, 'pointermove', primary(e => {
      if (x === null) return;
      if (e.clientX < x - 1) lastLeft = performance.now();
      else if (e.clientX > x + 1) lastLeft = -1e9;           // 顺着船的方向划：放舟
      x = e.clientX;
    }));
    const up = primary(() => { x = null; });
    api.on(cut.root, 'pointerup', up);
    api.on(cut.root, 'pointercancel', up);
    api.on(window, 'keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); keyL = true; } });
    api.on(window, 'keyup', e => { if (e.key === 'ArrowLeft') keyL = false; });
    const done = () => {
      if (api.done) return;
      if (!hist.length) { api.finish(fallback === 'longing' ? 'longing' : 'free'); return; }
      const end = hist[hist.length - 1][0], last = hist.filter(h => h[0] >= end - 5000);
      api.finish(last.reduce((s, h) => s + h[1], 0) / last.length > .5 ? 'longing' : 'free');
    };
    api.stopOnEnd(loop((t, dt) => {
      const rowing = keyL || t - lastLeft < 450;
      w += ((rowing ? 1 : 0) - w) * (rowing ? .06 : .025) * dt;
      hist.push([t, w]);
      onFrame(w, Math.min(1, (t - t0) / ms), rowing);
      if (t - t0 >= ms) done();
    }));
    return done;
  });
}

