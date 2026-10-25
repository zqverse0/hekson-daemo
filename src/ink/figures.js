import { el } from '../core/svg.js';
import { SKIN, ROBE, INDIGO, SEAL, ink, paper } from './palette.js';

// 小舟尺寸：viewBox 宽、高、水线 y
export const BOAT = { W: 260, H: 175, WL: 96 };

// 在 gdefs 中定义 #sym-sushi（中年，白描，面向右）、#sym-boatman、#boatArt
export function defineFigures(gdefs) {
  defineSushi(gdefs);
  defineBoatman(gdefs);
  defineBoat(gdefs);
}

function defineSushi(gdefs) {
  const sym = el('symbol', { id: 'sym-sushi', viewBox: '0 0 400 900', overflow: 'visible' }, gdefs);
  // 身体略加宽、压低；头部放大，比例更接近人物画
  const body = el('g', { transform: 'translate(220,880) scale(1.2,.9) translate(-220,-880)' }, sym);
  const head = el('g', { transform: 'translate(236,246) scale(1.4) translate(-244,-178)' }, sym);
  const K = ink(.92);
  let p = body;
  const P = (d, a) => el('path', Object.assign({ d }, a), p);
  const line = (d, w = 1.6, c = ink(.45)) => P(d, { fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' });
  // 袍
  P('M198,180 C172,232 160,330 152,450 C142,600 124,760 106,864 Q206,882 314,868 C306,760 294,600 288,470 C284,380 278,262 264,184 Q232,170 198,180 Z',
    { fill: ROBE, stroke: K, 'stroke-width': 2.4, 'stroke-linejoin': 'round' });
  P('M106,864 Q206,882 314,868 L312,852 Q206,866 110,848 Z', { fill: INDIGO, opacity: .88 });
  line('M160,560 C150,680 136,780 128,850');
  line('M206,540 C204,660 200,780 196,860');
  line('M252,540 C256,660 262,780 268,860');
  line('M286,600 C292,700 300,800 306,852');
  line('M182,620 C176,700 170,780 160,852', 1.1, ink(.3));
  // 云头履
  P('M278,868 Q304,856 326,866 Q330,872 322,880 L276,880 Z', { fill: K });
  // 绦带
  line('M262,520 C258,600 252,660 254,730', 2.4, SEAL);
  line('M272,520 C276,590 282,650 278,702', 2, SEAL);
  line('M254,730 l-5,16 M254,730 l1,17 M254,730 l6,15', 1.4, SEAL);
  // 大袖
  P('M212,192 C192,252 188,322 196,382 C200,440 206,492 222,524 Q272,544 324,510 C332,452 332,382 324,332 C314,282 292,232 264,196 Q238,186 212,192 Z',
    { fill: ROBE, stroke: K, 'stroke-width': 2.4, 'stroke-linejoin': 'round' });
  line('M232,258 C226,340 226,430 236,516');
  line('M262,276 C262,360 266,440 272,528');
  line('M296,300 C304,380 308,450 306,512');
  line('M214,300 C210,360 212,420 220,470', 1.1, ink(.3));
  P('M222,524 Q272,544 324,510 L322,496 Q272,528 225,510 Z', { fill: INDIGO, opacity: .88 });
  P('M300,326 Q320,318 334,328 L332,354 Q316,346 298,352 Z', { fill: INDIGO });
  P('M332,330 Q344,334 342,347 Q336,352 331,349 Z', { fill: SKIN, stroke: K, 'stroke-width': 1.4 });
  // 交领
  P('M226,172 L250,224 L276,180 L264,177 L250,208 L238,170 Z', { fill: INDIGO });
  p = head;
  // 巾带
  line('M206,108 C192,136 186,160 182,196', 2.6, ink(.85));
  line('M212,110 C202,140 199,166 201,200', 2.2, ink(.85));
  // 面
  P('M214,106 L262,106 Q269,115 268,124 L281,140 Q283,147 272,148 L274,153 L268,159 L262,178 L228,178 C216,168 210,140 214,106 Z',
    { fill: SKIN, stroke: K, 'stroke-width': 1.6, 'stroke-linejoin': 'round' });
  P('M223,128 Q213,134 219,148 Q227,148 227,138', { fill: SKIN, stroke: K, 'stroke-width': 1.3 });
  P('M210,106 C206,124 208,146 216,160 L222,150 C216,136 216,120 220,106 Z', { fill: K });
  line('M249,117 Q257,112 266,116', 2, K);
  line('M252,125 Q257,122 263,125', 1.6, K);
  line('M266,132 Q270,138 268,142', 1, ink(.5));
  // 须
  P('M270,152 Q285,178 279,208 Q273,244 260,282 Q251,240 244,208 Q238,180 242,160 Q256,166 270,152 Z', { fill: ink(.86) });
  line('M262,176 Q262,222 258,262 M252,180 Q250,212 252,240', 1, paper(.32));
  line('M274,151 Q263,160 250,157', 1.8, K);
  line('M229,150 Q235,168 247,172', 1.3, K);
  // 东坡巾：内为高筒，外罩一层较矮的巾，前有缺口
  P('M206,104 L211,40 Q234,33 256,38 L262,104 Z', { fill: K });
  P('M198,112 L202,70 L230,63 L236,74 L242,63 L268,70 L272,110 Q234,103 198,112 Z', { fill: ink(.8), stroke: paper(.35), 'stroke-width': 1 });
  line('M219,68 L218,108 M254,67 L256,106', 1, paper(.28));
}

// 艄公（斗笠蓑衣，撑篙）
function defineBoatman(gdefs) {
  const p = el('symbol', { id: 'sym-boatman', viewBox: '0 0 200 400', overflow: 'visible' }, gdefs);
  const K = ink(.9);
  const P = (d, a) => el('path', Object.assign({ d }, a), p);
  P('M178,52 L22,396', { stroke: ink(.85), 'stroke-width': 4, 'stroke-linecap': 'round' });
  P('M88,232 L64,388', { stroke: K, 'stroke-width': 11, 'stroke-linecap': 'round' });
  P('M116,232 Q146,300 134,388', { stroke: K, 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none' });
  P('M54,386 L78,384 L78,394 L52,395 Z', { fill: K });
  P('M126,384 L152,384 L150,394 L124,395 Z', { fill: K });
  let cape = 'M74,100 Q100,92 130,100 L152,236';
  for (let x = 152; x > 60; x -= 8) cape += ` L${x - 4},226 L${x - 8},236`;
  P(cape + ' Z', { fill: ink(.8) });
  for (let x = 78; x <= 140; x += 7) P(`M${x},108 L${x + (x - 104) * .35},226`, { stroke: paper(.22), 'stroke-width': 1 });
  P('M120,116 Q132,134 136,148', { stroke: K, 'stroke-width': 8, 'stroke-linecap': 'round', fill: 'none' });
  P('M96,124 Q104,160 116,188', { stroke: K, 'stroke-width': 8, 'stroke-linecap': 'round', fill: 'none' });
  el('circle', { cx: 136, cy: 148, r: 6, fill: SKIN, stroke: K, 'stroke-width': 1.4 }, p);
  el('circle', { cx: 116, cy: 188, r: 6, fill: SKIN, stroke: K, 'stroke-width': 1.4 }, p);
  P('M96,74 Q90,94 100,106 Q114,110 120,96 L122,74 Z', { fill: SKIN, stroke: K, 'stroke-width': 1.6 });
  P('M36,78 Q100,26 166,76 Q100,68 36,78 Z', { fill: ink(.92) });
  for (let k = -4; k <= 4; k++) P(`M100,38 L${100 + k * 15},${74 - Math.abs(k) * .6}`, { stroke: paper(.2), 'stroke-width': 1 });
  P('M100,40 L100,28', { stroke: K, 'stroke-width': 4 });
}

// 小舟（世界与剧情共用）
function defineBoat(gdefs) {
  const art = el('g', { id: 'boatArt' }, gdefs);
  el('line', { x1: 28, y1: 85, x2: 5, y2: 136, stroke: ink(.8), 'stroke-width': 1.6, 'stroke-linecap': 'round' }, art);
  el('path', { d: 'M6,80 Q130,93 254,73 Q228,106 130,106 Q38,106 6,80 Z', fill: ink(.9) }, art);
  el('path', { d: 'M12,82 Q130,93 248,76', fill: 'none', stroke: paper(.35), 'stroke-width': 1.2 }, art);
  el('path', { d: 'M80,90 C82,50 156,50 160,89 Z', fill: ink(.8) }, art);
  for (const x of [96, 112, 128, 144]) el('path', { d: `M${x},90 Q${x + 1},62 ${x + 2},58`, stroke: paper(.2), 'stroke-width': 1, fill: 'none' }, art);
  el('use', { href: '#sym-boatman', x: 24, y: 14, width: 36, height: 72 }, art);
  el('use', { href: '#sym-sushi', x: 160, y: 8, width: 35, height: 78 }, art);
}
