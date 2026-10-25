import { reseed, R } from '../../core/rng.js';
import { f1 } from '../../core/math.js';
import { el } from '../../core/svg.js';
import { noise1 } from '../../core/noise.js';
import { PAPER, SEAL, WALL, BRUSH, ink, paper } from '../../ink/palette.js';
import { ridge, areaD, taper, ellD } from '../../ink/paths.js';
import { person, gableHouse, longHouse } from '../../ink/scenery.js';

// 第一幕 · 孤舟夜泊 的画面（1600×900 镜头坐标）
// 熙宁六年除夕：无月，只有远火、低星；霜重。
export const HORIZON = 470;
export const LAMP = [722, 604];          // 舱中残灯
export const FIRES = [[1120, 360], [928, 440], [1396, 436]];   // 远火：城楼、城头
export const STARS = [[190, 392], [430, 344], [640, 402], [880, 330]];   // 低星
export const SONG = [1260, 412];         // 行歌：城中守岁灯火
export const CRY = [330, 470];           // 野哭：城外饥民篝火
export const SEAL_AT = [1084, 170];      // 钤印位置（诗末列左侧，避开城楼）
export const SUN = [1452, 452];          // 印化为日
export const DISHES = [{ id: 'nong', at: [104, 838], a: .92, label: '浓' }, { id: 'dan', at: [196, 838], a: .45, label: '淡' }, { id: 'qing', at: [288, 838], a: .14, label: '清' }];

export const POEM = ['行歌野哭两堪悲', '远火低星渐向微', '病眼不眠非守岁', '乡音无伴苦思归', '重衾脚冷知霜重', '新沐头轻感发稀', '多谢残灯不嫌客', '孤舟一夜许相依'];

// 径向光晕（代替 fSoft 模糊，便宜得多）。id 在同一时刻全局唯一即可：旧镜头会先移除
function glowDef(svg, id, stops) {
  const defs = svg.querySelector('defs') || el('defs', {}, svg);
  const g = el('radialGradient', { id }, defs);
  for (const [o, c] of stops) el('stop', { offset: o, 'stop-color': c }, g);
  return `url(#${id})`;
}
const WARM = [[0, paper(.95)], [.2, 'rgba(176,58,46,.55)'], [.55, 'rgba(176,58,46,.18)'], [1, 'rgba(176,58,46,0)']];
const COOL = [[0, paper(.95)], [.3, paper(.35)], [1, paper(0)]];

// 夜空（静态背景）
export function drawSky(bg) {
  // 夜色 = 纸上罩墨：顶部浓、近地平线略淡
  const defs = el('defs', {}, bg);
  const g = el('linearGradient', { id: 'n1Sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  for (const [o, a] of [[0, .9], [.45, .76], [.55, .64], [1, .82]]) el('stop', { offset: o, 'stop-color': '#1c1b19', 'stop-opacity': a }, g);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: PAPER }, bg);
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: 'url(#n1Sky)' }, bg);
}

// 远层：远山、常州城墙与城楼、城中屋顶、城外饥民
export function drawFar(svg) {
  el('path', { d: areaD(ridge(0, 1600, HORIZON + 4, 40, 130, 90, 220, 260), 0, 1600, 560), fill: ink(.42), filter: 'url(#fWash)' }, svg);
  // 城中屋顶（从城墙后露出）
  const roofs = el('g', { fill: ink(.7) }, svg);
  for (let x = 840; x < 1600; x += R(46, 90)) {
    const w = R(40, 80), y = HORIZON - 28 - R(4, 22);
    el('path', { d: `M${f1(x)},${f1(y + 12)} L${f1(x + 8)},${f1(y)} L${f1(x + w - 8)},${f1(y)} L${f1(x + w)},${f1(y + 12)} Z` }, roofs);
  }
  // 城墙：垛口
  const wallTop = HORIZON - 30;
  let d = `M820,${HORIZON + 10} L820,${wallTop}`;
  for (let x = 820; x < 1600; x += 16) d += ` L${x},${wallTop - 7} L${x + 9},${wallTop - 7} L${x + 9},${wallTop} L${x + 16},${wallTop}`;
  d += ` L1600,${HORIZON + 10} Z`;
  el('path', { d, fill: ink(.8) }, svg);
  el('line', { x1: 820, y1: wallTop + 9, x2: 1600, y2: wallTop + 9, stroke: paper(.08), 'stroke-width': 1.2 }, svg);
  // 城楼
  const gx = 1120, gy = wallTop;
  el('rect', { x: gx - 70, y: gy - 46, width: 140, height: 46, fill: ink(.84) }, svg);
  el('path', { d: `M${gx - 98},${gy - 44} Q${gx - 70},${gy - 52} ${gx - 60},${gy - 62} L${gx + 60},${gy - 62} Q${gx + 70},${gy - 52} ${gx + 98},${gy - 44} Z`, fill: ink(.92) }, svg);
  el('rect', { x: gx - 56, y: gy - 92, width: 112, height: 30, fill: ink(.84) }, svg);
  el('path', { d: `M${gx - 80},${gy - 90} Q${gx - 56},${gy - 98} ${gx - 46},${gy - 110} L${gx + 46},${gy - 110} Q${gx + 56},${gy - 98} ${gx + 80},${gy - 90} Z`, fill: ink(.95) }, svg);
  el('path', { d: `M${gx - 16},${HORIZON + 10} L${gx - 16},${gy + 14} Q${gx},${gy + 2} ${gx + 16},${gy + 14} L${gx + 16},${HORIZON + 10} Z`, fill: ink(.95) }, svg);
  // 城外：饥民蜷坐（剪影）
  const crowd = el('g', {}, svg);
  for (let i = 0; i < 16; i++) person(crowd, CRY[0] + R(-170, 170), HORIZON + 22 + R(-6, 6), R(18, 26), R(.55, .8), Math.floor(R(0, 3.99)));
}

// 河：水面、波纹、小舟（篷、舱窗）、缆绳
export function drawRiver(svg) {
  el('rect', { x: 0, y: HORIZON + 6, width: 1600, height: 330, fill: PAPER }, svg);
  el('rect', { x: 0, y: HORIZON + 6, width: 1600, height: 330, fill: ink(.72) }, svg);
  const waves = el('g', { fill: 'none', 'stroke-linecap': 'round' }, svg);
  for (let i = 0; i < 150; i++) {
    const x = R(0, 1600), y = R(HORIZON + 16, 790), l = R(14, 44);
    el('path', { d: `M${f1(x)},${f1(y)} q${f1(l / 4)},-3 ${f1(l / 2)},0 t${f1(l / 2)},0`, stroke: paper(f1(R(.04, .13))), 'stroke-width': 1.1 }, waves);
  }
  // 小舟
  const b = el('g', {}, svg);
  el('path', { d: 'M520,628 Q700,646 900,618 Q868,668 706,670 Q574,670 520,628 Z', fill: ink(.92) }, b);
  el('path', { d: 'M528,630 Q700,646 892,621', fill: 'none', stroke: paper(.18), 'stroke-width': 1.4 }, b);
  // 篷
  el('path', { d: 'M640,640 C640,560 820,556 822,636 Z', fill: ink(.86) }, b);
  for (const x of [664, 690, 716, 742, 768, 794]) el('path', { d: `M${x},640 Q${x + 2},588 ${x + 4},578`, stroke: paper(.1), 'stroke-width': 1, fill: 'none' }, b);
  // 舱窗（灯在 mid 层画）
  el('path', { d: 'M700,632 C700,592 744,592 744,632 Z', fill: ink(.6) }, b);
  // 舱中人影：苏轼坐于灯旁
  el('path', { d: 'M748,632 C746,612 752,600 758,598 C754,592 756,584 763,584 C770,584 772,592 768,598 C776,602 780,616 778,632 Z', fill: ink(.95) }, b);
  // 倒影
  el('path', { d: 'M560,676 Q700,690 860,672', fill: 'none', stroke: ink(.35), 'stroke-width': 8, filter: 'url(#fRipple)' }, svg);
  // 缆绳
  el('path', { d: 'M532,630 Q520,700 512,744', fill: 'none', stroke: ink(.75), 'stroke-width': 1.6 }, svg);
}

// 近岸：枯苇、霜点、系船桩
export function drawBank(svg) {
  const nz = noise1();
  let d = 'M0,910 L0,' + f1(752 + nz(0) * 12);
  for (let x = 0; x <= 1600; x += 10) d += `L${x},${f1(752 + nz(x) * 12)}`;
  d += 'L1600,910Z';
  el('path', { d, fill: PAPER }, svg);
  el('path', { d, fill: ink(.86) }, svg);
  el('path', { d: 'M' + Array.from({ length: 161 }, (_, i) => `${i * 10},${f1(752 + nz(i * 10) * 12)}`).join('L'), fill: 'none', stroke: ink(.9), 'stroke-width': 3, filter: 'url(#fBleed)' }, svg);
  el('rect', { x: 506, y: 726, width: 10, height: 40, fill: ink(.95) }, svg);
  // 霜：留白小点
  let fr = '';
  for (let i = 0; i < 260; i++) { const x = R(0, 1600); fr += ellD(x, 756 + nz(x) * 12 + R(0, 120), R(.8, 2.2), R(.6, 1.4)); }
  el('path', { d: fr, fill: paper(.32) }, svg);
  // 枯苇
  const reeds = el('g', {}, svg);
  for (let x = R(20, 60); x < 1600; x += R(60, 160)) {
    if (x > 60 && x < 340) continue;              // 给砚台留位置
    for (let k = 0; k < 6; k++) {
      const bx = x + R(-18, 18), h = R(60, 150), lean = R(-.35, .25), by = 760 + nz(bx) * 12;
      el('path', { d: taper([[bx, by], [bx + lean * h * .4, by - h * .55], [bx + lean * h, by - h]], 3.2, .4), fill: ink(f1(R(.75, .95))) }, reeds);
    }
  }
}

// 动态中景的对象：残灯、远火、低星、砚台、诗、印
export function createMid(mid) {
  const lampGlow = glowDef(mid, 'n1Lamp', WARM), fireGlow = glowDef(mid, 'n1Fire', WARM), starGlow = glowDef(mid, 'n1Star', COOL);
  // 残灯（入画完成前隐藏：河层还没归位）
  const lampG = el('g', { style: 'display:none' }, mid);
  const glow = el('circle', { cx: LAMP[0], cy: LAMP[1], r: 70, fill: lampGlow, opacity: .8 }, lampG);
  const flame = el('path', { d: 'M0,-14 C5,-6 6,0 0,4 C-6,0 -5,-6 0,-14 Z', fill: paper(.95), transform: `translate(${LAMP[0]},${LAMP[1] + 18})` }, lampG);
  const sleeve = el('path', { d: 'M-74,44 C-80,2 -54,-40 -14,-48 C-34,-22 -40,6 -30,44 Z', fill: paper(.82), stroke: ink(.9), 'stroke-width': 2, opacity: 0, transform: `translate(${LAMP[0]},${LAMP[1]})` }, lampG);
  const wind = el('g', { opacity: 0 }, mid);
  for (let i = 0; i < 9; i++) {
    const y = R(520, 700), x = R(-300, 1300), l = R(160, 380);
    el('path', { d: taper([[x, y], [x + l * .5, y - R(4, 14)], [x + l, y - R(0, 10)]], 2.6, .2), fill: paper(f1(R(.12, .26))) }, wind);
  }
  const lamp = {
    level: 1,                             // 火苗大小 0..1
    set(level, t = performance.now()) {
      this.level = level;
      const fl = 1 + Math.sin(t * .021) * .08 + Math.sin(t * .053) * .05;
      flame.setAttribute('transform', `translate(${LAMP[0]},${LAMP[1] + 18}) scale(${f1(fl * (.35 + .65 * level))},${f1(fl * (.3 + .7 * level))})`);
      glow.setAttribute('opacity', f1(.25 + .6 * level));
      glow.setAttribute('r', f1(40 + 40 * level * fl));
    },
    shield(v) { sleeve.setAttribute('opacity', f1(v)); },
    show(v) { lampG.style.display = v ? '' : 'none'; },
    fade(ms) { lampG.style.transition = `opacity ${ms}ms`; lampG.style.opacity = 0; },
    wind(v, t) { wind.setAttribute('opacity', f1(v)); wind.setAttribute('transform', `translate(${f1((t * .9) % 1600)},0)`); },
  };

  // 远火、低星（点出后才出现）
  const lights = el('g', {}, mid);
  const fire = ([x, y], r = 26) => el('circle', { cx: x, cy: y, r, fill: fireGlow }, lights);
  const star = ([x, y]) => { el('circle', { cx: x, cy: y, r: 16, fill: starGlow }, lights); el('circle', { cx: x, cy: y, r: 2.2, fill: paper(.95) }, lights); };
  // 点错墨色：一团墨晕开后淡去
  const blot = ([x, y], a) => {
    const c = el('circle', { cx: x, cy: y, r: 6, fill: ink(a) }, mid);
    c.style.transition = 'r .5s ease-out, opacity 1.4s ease .5s';
    requestAnimationFrame(() => { c.setAttribute('r', 22); c.style.opacity = 0; });
    setTimeout(() => c.remove(), 2000);
  };
  // 支线回到夜景后，对应方向的灯火更亮
  const branchLight = (id) => {
    if (id === 'song') for (let i = 0; i < 6; i++) fire([SONG[0] + R(-150, 150), SONG[1] + R(-8, 10)], R(10, 18));
    else for (let i = 0; i < 3; i++) fire([CRY[0] + (i - 1) * 110, HORIZON + 18], 30);
  };

  // 砚台：三碟墨
  const dishes = el('g', {}, mid);
  const sel = el('circle', { r: 40, fill: 'none', stroke: SEAL, 'stroke-width': 3, opacity: 0 }, dishes);
  for (const d of DISHES) {
    el('circle', { cx: d.at[0], cy: d.at[1], r: 34, fill: WALL, stroke: ink(.6), 'stroke-width': 1.5 }, dishes);
    el('circle', { cx: d.at[0], cy: d.at[1], r: 24, fill: ink(d.a) }, dishes);
    el('text', { x: d.at[0], y: d.at[1] + 64, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 24, fill: paper(.8), text: d.label }, dishes);
  }
  dishes.style.display = 'none';
  const palette = {
    show(v) { dishes.style.display = v ? '' : 'none'; },
    select(id) { const d = DISHES.find(d => d.id === id); sel.setAttribute('cx', d.at[0]); sel.setAttribute('cy', d.at[1]); sel.setAttribute('opacity', 1); },
  };

  return { lamp, fire, star, blot, branchLight, palette };
}

// 印：未落下时悬浮，落下后成印痕。返回控制对象
export function createSeal(mid, text) {
  const g = el('g', { opacity: 0 }, mid);
  const box = el('rect', { x: -30, y: -54, width: 60, height: 108, rx: 4, fill: SEAL }, g);
  [...text].forEach((ch, i) => el('text', { x: 0, y: -12 + i * 46, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 38, fill: WALL, text: ch }, g));
  const place = (x, y, s, rot, o) => { g.setAttribute('transform', `translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s)})`); g.setAttribute('opacity', f1(o)); };
  return { g, box, place };
}

// 支线画面 · 行歌：城墙之后，守岁的人家
export function drawSong(bg, mid) {
  reseed(731);
  drawSky(bg);
  const glow = glowDef(mid, 'n1Win', WARM);
  const houses = el('g', {}, bg);
  const wins = [];
  [[120, 150, 120], [330, 120, 150], [520, 170, 110], [760, 130, 160], [960, 160, 120], [1180, 140, 150], [1380, 150, 115]].forEach(([x, w, h], i) => {
    (i % 2 ? gableHouse : longHouse)(houses, x, 660, w, h);
    wins.push([x + w * .5, 660 - h * .55]);
  });
  houses.setAttribute('opacity', .75);
  // 灯笼
  for (let x = 200; x < 1500; x += R(160, 240)) {
    el('line', { x1: x, y1: 380, x2: x, y2: 420, stroke: ink(.8), 'stroke-width': 1.5 }, bg);
    el('ellipse', { cx: x, cy: 436, rx: 14, ry: 18, fill: SEAL, opacity: .85 }, bg);
  }
  // 前景城墙（苏轼在墙外）
  let d = 'M-10,910 L-10,700';
  for (let x = -10; x < 1620; x += 40) d += ` L${x},688 L${x + 24},688 L${x + 24},700 L${x + 40},700`;
  d += ' L1620,910 Z';
  el('path', { d, fill: ink(.9) }, bg);
  const lit = [];
  const light = i => {
    const [x, y] = wins[i];
    el('circle', { cx: x, cy: y, r: 60, fill: glow }, mid);
    // 窗中团聚的人影
    for (let k = 0; k < 3; k++) person(mid, x - 20 + k * 20, y + 26, 30 - k * 4, .8, k % 3);
    lit.push(i);
  };
  return { wins, light, lit };
}

// 支线画面 · 野哭：城外冻土，饥民围着将熄的火
export function drawCry(bg, mid) {
  reseed(733);
  drawSky(bg);
  el('path', { d: areaD(ridge(0, 1600, 520, 30, 90, 90, 200, 260), 0, 1600, 900), fill: ink(.45), filter: 'url(#fWash)' }, bg);
  el('rect', { x: 0, y: 560, width: 1600, height: 340, fill: PAPER }, bg);
  el('rect', { x: 0, y: 560, width: 1600, height: 340, fill: ink(.84) }, bg);
  let fr = '';
  for (let i = 0; i < 300; i++) fr += ellD(R(0, 1600), R(570, 900), R(.8, 2.4), R(.6, 1.4));
  el('path', { d: fr, fill: paper(.3) }, bg);
  const glow = glowDef(mid, 'n1Camp', WARM);
  const fires = [[380, 700], [800, 740], [1220, 700]];
  fires.forEach(([x, y]) => {
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      person(bg, x + Math.cos(a) * 90, y + Math.sin(a) * 26 + 30, R(70, 96), R(.75, .92), Math.floor(R(0, 3.99)));
    }
  });
  const embers = fires.map(([x, y]) => el('circle', { cx: x, cy: y, r: 26, fill: glow, opacity: .35 }, mid));
  const feed = i => {
    const [x, y] = fires[i];
    embers[i].setAttribute('r', 90); embers[i].setAttribute('opacity', .95);
    // 一碗粥，热气升起
    el('path', { d: `M${x - 26},${y + 52} L${x + 26},${y + 52} Q${x + 24},${y + 76} ${x},${y + 78} Q${x - 24},${y + 76} ${x - 26},${y + 52} Z`, fill: WALL, stroke: ink(.8), 'stroke-width': 2 }, mid);
    el('path', { d: `M${x - 8},${y + 46} q6,-14 0,-28 M${x + 8},${y + 46} q6,-16 0,-32`, fill: 'none', stroke: paper(.6), 'stroke-width': 2, 'stroke-linecap': 'round' }, mid);
  };
  return { fires, feed };
}

