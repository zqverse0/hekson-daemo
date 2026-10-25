import { reseed } from './core/rng.js';
import { el } from './core/svg.js';
import { BRUSH, ink } from './ink/palette.js';
import { bgScene } from './ink/scenery.js';
import { createFog } from './transitions/fog.js';
import { createJourney, MODES } from './journey/journey.js';
import night from './acts/01-night/index.js';
import yixing from './acts/02-yixing/index.js';
import returnAct from './acts/03-return/index.js';

// 新版各幕的调度。段落按序号排列，已实现的放进 ACTS
const ACTS = [night, yixing, returnAct];

export function startActs({ cut, inkDrop, params }) {
  const $ = id => document.getElementById(id);
  document.body.classList.add('acts');
  const journey = createJourney(params);
  const mode = MODES.includes(params.mode) ? params.mode : 'visitor';
  const fog = createFog(cut.root);
  const from = Math.max(0, ACTS.findIndex(a => a.id === params.act));

  $('startBtn').addEventListener('click', async () => {
    $('intro').classList.add('open');
    setTimeout(() => $('intro').style.display = 'none', 1700);
    await new Promise(r => setTimeout(r, 700));
    await inkDrop.cover(innerWidth / 2, innerHeight / 2);
    for (let i = from; i < ACTS.length; i++) {
      cut.open(ACTS[i].title, { bare: true, light: !!ACTS[i].light });
      if (i > from) cut.state.first = false;       // 只有第一幕在墨色遮罩下揭开，其余幕从上一幕的画面接过来
      await ACTS[i].run({ cut, journey, mode, fog });
    }
    await notYet(cut, fog);
  }, { once: true });
}

// 后续段落尚未制作：换成占位画面（上一幕以雾结尾时先拂雾），给出"再看一次"
async function notYet(cut, fog) {
  cut.open('', { bare: true, light: true });
  cut.hush();
  cut.state.first = false;
  await cut.shot((mid, { bg }) => {
    reseed(901);
    bgScene(bg, { bank: 600, sun: [1240, 250, 56, .35] });
    el('text', { x: 800, y: 380, 'text-anchor': 'middle', 'font-family': BRUSH, 'font-size': 56, fill: ink(.75), 'letter-spacing': 12, text: '万里长卷' }, mid);
    el('text', { x: 800, y: 430, 'text-anchor': 'middle', 'font-size': 20, fill: ink(.5), 'letter-spacing': 6, text: '过场 · 制作中' }, mid);
  });
  if (fog.covered) await fog.wipe(cut, { prompt: '拂去雾气' });
  cut.title('<em>过</em>万里长卷');
  const b = document.createElement('button');
  b.className = 'again'; b.textContent = '再看一次';
  b.addEventListener('click', () => location.reload());
  cut.root.appendChild(b);
}
