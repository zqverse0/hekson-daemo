import { reseed } from '../../core/rng.js';
import { el } from '../../core/svg.js';
import { loop } from '../../core/tick.js';
import { easeOut, seg, f1 } from '../../core/math.js';
import { ink } from '../../ink/palette.js';
import { createPoem } from '../../ink/poem.js';
import { createSeal } from '../../ink/seal.js';
import { hold } from '../../cut/hold.js';
import { taps, choose } from '../../cut/taps.js';
import { compose } from '../../cut/compose.js';
import { SITE_AT, OX, MAP_OFF, MAP_BAND, drawMapBg, drawLake, drawHills, drawRiver, drawFields, drawDetail, createOpening,
  drawLabels, ox, drawMemorial, drawAlbum } from './scene.js';
import stele from './sites/stele.js';
import orchard from './sites/orchard.js';
import peak from './sites/peak.js';
import tea from './sites/tea.js';

// 第二幕 · 宜兴（元丰七年，1084）——全篇唯一的开放区域
// 拂雾 → 入画（太湖、群山、荆溪、田野）→ 字化为景 → 俯瞰图上择地漫游
//   游客版：选一处深入，其余三处以册页小景带过；完整版：任选三处
// → 耕牛（卖剑买牛）→ 上表（粥碗回响）→ 诗成《菩萨蛮》→ 钤印「一虚舟」→ 表文飞出，朱批诏书飞回（T4，直入第三幕）
export default {
  id: 'yixing',
  title: '<em>贰</em>船入荆溪',
  seal: '一虚舟',
  light: true,
  budget: { visitor: 120, full: 480 },
  run,
  scrollPiece: () => null,       // 结局长卷：后续实现
};

const SITES = [stele, orchard, peak, tea];
const POEM = ['买田阳羡吾将老', '从来只为溪山好', '来往一虚舟', '聊随物外游', '有书仍懒著', '水调歌归去', '筋力不辞诗', '要须风雨时'];
const SEAL_AT = [462, 252];
const ZOOM = 2.4;

async function run(ctx) {
  const { cut, journey, mode, fog } = ctx;
  const visitor = mode !== 'full';
  const done = new Set();
  let composed = false, opened = false, s;

  // 承接第一幕的雾；直接从本幕开始（调试）时先补上雾，首个镜头揭开墨色后看到的就是雾
  if (fog.covered) cut.state.first = false;
  else await fog.cover('十一年后');

  // 俯瞰图。每次回来都重建（reseed 保证画面一致）；from 为刚离开的地点时，从该处拉远
  async function map(from) {
    s = await cut.shot((mid, { bg, layer }) => {
      reseed(201);
      drawMapBg(bg);
      const L = { lake: layer('lake'), hills: layer('hills'), river: layer('river'), fields: layer('fields') };
      drawLake(L.lake); drawHills(L.hills); drawRiver(L.river); drawFields(L.fields);
      const detail = layer('detail'), groups = drawDetail(detail);
      if (!opened) { detail.style.display = 'none'; groups.forEach(g => g.setAttribute('opacity', 0)); }
      else drawLabels(mid, done);
      if (!composed) {
        const k = cut.toScreen(0, 0).k;
        for (const [id, [dx, dy]] of Object.entries(MAP_OFF)) { L[id].style.transform = `translate3d(${dx * k}px,${dy * k}px,0)`; L[id].style.opacity = .55; }
      }
      // 俯瞰图镜头一开始就是独立合成层：推近、拉远只缩放已栅格化的位图（中途改 will-change 会触发整屏重绘）
      const div = mid.parentNode;
      div.style.willChange = 'transform, opacity';
      if (from) { const c = cut.toScreen(...SITE_AT[from]); div.style.transformOrigin = `${c.x}px ${c.y}px`; div.style.transform = `scale(${ZOOM})`; }
      return { mid, L, detail, groups, div };
    });
    if (from) await zoom(s.div, ZOOM, 1, 1200);
  }
  // 缩放整幅画：逐帧设 transform。不用 CSS 过渡——过渡会让浏览器按最大倍数重新栅格化整屏，4K 下卡顿半秒以上
  function zoom(div, a, b, ms) {
    return new Promise(res => {
      const t0 = performance.now(), dur = cut.state.skip ? 1 : ms;
      const stop = loop(t => {
        const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        div.style.transform = `scale(${(a + (b - a) * e).toFixed(3)})`;
        if (k >= 1) { stop(); res(); }
      });
    });
  }
  // 镜头在俯瞰图上推近某处（T4 变体：始终在同一幅画里）
  async function pushIn(at) {
    const c = cut.toScreen(...at);
    s.div.style.transformOrigin = `${c.x}px ${c.y}px`;
    await zoom(s.div, 1, ZOOM, 1000);
  }
  const finish = site => { done.add(site.id); journey.yixing.push(site.id); journey.items.push(site.item); };
  async function visit(site) {
    await pushIn(SITE_AT[site.id]);
    await site.run({ ...ctx, done });
    cut.hush();
    finish(site);
    await map(site.id);
    await cut.sleep(500);
  }

  // ① 拂雾 · 入画
  await map();
  if (fog.covered) { await fog.wipe(cut, { prompt: '拂去雾气' }); await cut.sleep(1000); }   // 等雾散尽，免得拂雾的余势拖动画层
  await compose(cut, { prompt: '拖动画层 · 入画', layers: Object.keys(MAP_OFF).map(id => ({ svg: s.L[id], off: MAP_OFF[id], band: MAP_BAND[id] })) });
  composed = true;
  // 归位后撤掉各层的合成变换：否则推近时每层都要按新缩放逐帧重绘
  await cut.sleep(500);
  for (const svg of Object.values(s.L)) { svg.style.transition = ''; svg.style.transform = ''; }
  await cut.say('旁白', '元丰七年，苏轼再过常州，乘舟入宜兴（古称阳羡）。');

  // ② 字化为景（T5）：《楚颂帖》首句写在溪面上，散作山峦、田垄、竹林
  const op = createOpening(s.mid, s.detail, s.groups);
  for (let i = 0; i < op.chars.length; i++) { op.show(i); await cut.sleep(170); }
  op.cap.setAttribute('opacity', 1);
  await cut.sleep(1800);
  await new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : 2200;
    const stop = loop(t => { const k = Math.min(1, (t - t0) / dur); op.scatter(easeOut(k)); if (k >= 1) { stop(); res(); } });
  });
  opened = true;
  drawLabels(s.mid, done);
  await cut.sleep(600);

  // ③ 择地漫游
  const pickSite = async () => {
    const open = SITES.filter(x => !done.has(x.id));
    const id = await choose(cut, { prompt: '轻触一处 · 漫游', options: open.map(x => ({ id: x.id, at: SITE_AT[x.id], r: 150 })), fallback: open[0].id });
    return SITES.find(x => x.id === id);
  };
  if (visitor) {
    await visit(await pickSite());
    // 其余三处：册页小景
    const rest = SITES.filter(x => !done.has(x.id));
    const a = await cut.shot((mid, { bg }) => drawAlbum(bg, mid, rest.map(x => ({ name: x.name, play: x.play, draw: (b, m, o) => x.draw(b, m, { ...o, journey, done }) }))));
    for (let i = 0; i < rest.length; i++) {
      a[i].cover.style.transition = 'opacity 1s ease'; a[i].cover.style.opacity = 0;
      finish(rest[i]);
      await cut.sleep(2600);
    }
    cut.hush();
    await map();
  } else {
    while (done.size < 3) await visit(await pickSite());
  }

  // ④ 汇合：田边一头牛——卖剑买牛
  const cow = ox(s.mid, OX[0], OX[1], .9);
  cow.style.transition = 'opacity 1s'; cow.style.opacity = 0;
  void cow.getBoundingClientRect(); cow.style.opacity = 1;
  await taps(cut, { prompt: '轻触耕牛', targets: [{ id: 'ox', at: [OX[0] + 10, OX[1] - 30], r: 130, required: true, hint: true }], onTap: () => true });
  await cut.say('苏轼', '卖剑买牛吾欲老，杀鸡为黍子来无。', '——苏轼《次韵完夫再赠之什》');

  // ⑤ 上表：第一幕施过粥，案头有那只粥碗，写到"粗给饘粥"时一亮
  const m = await cut.shot((mid, { bg }) => drawMemorial(bg, mid, { bowl: journey.night === 'porridge' }));
  m.sheet.style.opacity = 0; m.sheet.setAttribute('opacity', 1);
  void m.sheet.getBoundingClientRect();
  m.sheet.style.transition = 'opacity .8s'; m.sheet.style.opacity = 1;
  await cut.sleep(800);
  m.brush.setAttribute('opacity', 1);
  await cut.gesture({ dir: 'down', prompt: '按箭头示意向下缓慢划动 · 落笔', at: [1236, 170], len: 400, onProgress: p => {
    let cur = m.cols[0];
    for (const col of m.cols) { col.r.setAttribute('height', f1(seg(p, col.a, col.b) * 430)); if (p >= col.a) cur = col; }
    m.brush.setAttribute('transform', `translate(${cur.x + 16},${f1(170 + seg(p, cur.a, cur.b) * 400)}) rotate(18)`);
    if (m.glow) m.glow.setAttribute('opacity', f1(seg(p, .84, 1)));
  } });
  m.brush.setAttribute('opacity', 0);
  await cut.say('苏轼', '臣有薄田在常州宜兴县，粗给饘粥……', '——苏轼《乞常州居住表》。注：上表地点待考，画面为艺术化表现');

  // ⑥ 诗成《菩萨蛮》
  const poem = createPoem(m.sheet.parentNode, { lines: POEM, x0: 840, y0: 150, size: 30, step: 36, gap: 44, fill: ink(.85) });
  for (let i = 0; i < POEM.length; i++) await poem.reveal(i, 900, cut.state.skip);
  el('text', { x: 850, y: 410, 'text-anchor': 'end', 'font-size': 15, fill: ink(.5), 'letter-spacing': 2, text: '苏轼《菩萨蛮》' }, m.sheet.parentNode);
  await cut.sleep(1600);

  // ⑦ 钤印「一虚舟」
  const seal = createSeal(m.sheet.parentNode, '一虚舟');
  seal.place(SEAL_AT[0], SEAL_AT[1], 1.3, 0, .45);
  let depth = 0;
  await hold(cut, { prompt: '按住 · 钤印', at: SEAL_AT, r: 130, duration: 1200, decay: 1 / 2500,
    onProgress: p => { depth = p; seal.place(SEAL_AT[0], SEAL_AT[1], 1.3 - .3 * p, -3 * p, .45 + .55 * p); } });
  journey.seals.push({ text: '一虚舟', depth: +depth.toFixed(2) });
  await cut.sleep(700);

  // ⑧ 呈上表文（T4）：表文向右飞出；同一卷从左边飞回，已有朱批
  const fly = (p, from) => {
    const e = easeOut(p), x = from * (1 - e) * 1500;
    m.sheet.setAttribute('transform', `translate(${f1(x)},${f1(-Math.abs(1 - e) * 60)}) rotate(${f1(from * (1 - e) * 8)},1080,373)`);
  };
  await cut.gesture({ dir: 'right', prompt: '按箭头示意向右划动 · 呈上表文', at: [760, 108], len: 560, onProgress: p => {
    const e = easeOut(p);
    m.sheet.setAttribute('transform', `translate(${f1(e * 700)},${f1(-e * 70)}) rotate(${f1(e * 10)},1080,373)`);
  } });
  m.sheet.setAttribute('transform', 'translate(2000,0)');
  await cut.sleep(900);
  m.zhu.setAttribute('opacity', 1);
  await new Promise(res => {
    const t0 = performance.now(), dur = cut.state.skip ? 1 : 1500;
    const stop = loop(t => { const k = Math.min(1, (t - t0) / dur); fly(k, -1); if (k >= 1) { stop(); res(); } });
  });
  await cut.say('旁白', '元丰八年，朝廷准其所请。');
}
