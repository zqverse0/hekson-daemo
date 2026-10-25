import { createFog } from './transitions/fog.js';
import { createJourney, MODES } from './journey/journey.js';
import night from './acts/01-night/index.js';
import yixing from './acts/02-yixing/index.js';
import returnAct from './acts/03-return/index.js';
import ashore from './acts/04-ashore/index.js';

// 新版各幕的调度：四幕依次进行
const ACTS = [night, yixing, returnAct, ashore];

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
    again(cut);
  }, { once: true });
}

// 全篇结束：给出"再看一次"（整页重载）
function again(cut) {
  const b = document.createElement('button');
  b.className = 'again'; b.textContent = '再看一次';
  b.addEventListener('pointerdown', e => e.stopPropagation());
  b.addEventListener('click', () => location.reload());
  cut.root.appendChild(b);
}
