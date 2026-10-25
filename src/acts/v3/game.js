import { clamp } from '../../core/math.js';
import { tick } from '../../core/tick.js';
import { primary } from '../../core/input.js';
import { createWorld, NODES } from './world.js';
import { EPISODES } from './episodes.js';

// v3 原型的整体流程：开场展卷 → 撑船漫游 → 到点触发剧情 → 墨晕揭景 → 靠岸 → 结尾
// 调试：#v3=1..3 直接跳到对应剧情前
export function startV3({ cut, inkDrop, params }) {
  const $ = id => document.getElementById(id);
  const world = createWorld();
  const stageEl = $('stage'), hint = $('hint'), card = $('card'), hud = $('hud');
  const progressLis = [...document.querySelectorAll('#progress li')];
  const MINX = 300, MAXX = 3690, MAXV = 5.2;
  let state = 'intro', boatX = MINX, boatV = 0, dragging = false, pX = 0, wheelImp = 0, next = 0, keyDir = 0;

  stageEl.addEventListener('pointerdown', primary(e => {
    if (state !== 'play') return;
    dragging = true; pX = e.clientX; stageEl.classList.add('dragging'); stageEl.setPointerCapture(e.pointerId);
    const w = world.toWorld(e.clientX, e.clientY);
    if (world.isWater(w.y)) for (let k = 0; k < 3; k++) world.ripple(w.x, w.y, k * 9, 1.6, .55);
  }));
  stageEl.addEventListener('pointermove', primary(e => { pX = e.clientX; }));
  const up = () => { dragging = false; stageEl.classList.remove('dragging'); };
  stageEl.addEventListener('pointerup', primary(up)); stageEl.addEventListener('pointercancel', primary(up));
  addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'd') keyDir = 1; if (e.key === 'ArrowLeft' || e.key === 'a') keyDir = -1; });
  addEventListener('keyup', e => { if (['ArrowRight', 'ArrowLeft', 'a', 'd'].includes(e.key)) keyDir = 0; });
  addEventListener('wheel', e => { if (state === 'play') wheelImp = clamp(wheelImp + (e.deltaY + e.deltaX) * .03, -MAXV, MAXV); }, { passive: true });

  function jumpTo(i) {
    for (let j = 0; j < i; j++) { world.showArt(j); progressLis[j].classList.add('done'); }
    next = i; boatX = NODES[i].trig - 90; world.snapCamera();
  }
  $('startBtn').addEventListener('click', () => {
    $('intro').classList.add('open');
    const i = +params.v3;
    if (i >= 1 && i <= NODES.length) jumpTo(i - 1);
    setTimeout(() => { state = 'play'; hint.classList.remove('hide'); }, 900);
    setTimeout(() => $('intro').style.display = 'none', 1700);
  });
  $('againBtn').addEventListener('click', () => location.reload());

  async function triggerNode(i) {
    state = 'cut'; keyDir = 0; up(); hint.classList.add('hide'); card.classList.remove('show');
    world.hideMarker(i);
    const p = world.toScreen(NODES[i].cx, 360);
    await inkDrop.cover(p.x, p.y);
    hud.style.opacity = 0;
    cut.open(EPISODES[i].title);
    await EPISODES[i].run(cut);
    await inkDrop.cover(innerWidth / 2, innerHeight / 2);
    cut.close();
    hud.style.opacity = 1;
    await inkDrop.uncover();
    reveal(i);
  }

  function reveal(i) {
    const n = NODES[i];
    world.revealArt(i);
    setTimeout(() => {
      $('cardSeal').textContent = n.seal;
      $('cardTitle').textContent = n.title;
      $('cardText').textContent = n.text;
      $('cardNote').textContent = n.note;
      card.classList.add('show');
    }, 600);
    // 墨点从景处飞入顶部进度圆点
    const d = document.createElement('div'); d.className = 'drop';
    const p = world.toScreen(n.cx, 360);
    d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    document.body.appendChild(d);
    const r = progressLis[i].querySelector('i').getBoundingClientRect();
    setTimeout(() => {
      d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px';
      d.style.transform = 'scale(.6)'; d.style.opacity = 0;
    }, 40);
    setTimeout(() => { progressLis[i].classList.add('done'); d.remove(); }, 1000);
    if (i === NODES.length - 1) {
      state = 'moor';
      setTimeout(() => { card.classList.remove('show'); $('ending').classList.add('show'); state = 'end'; }, 5200);
    } else state = 'play';
  }

  let last = performance.now();
  function frame(t) {
    const dt = Math.min(50, t - last) / 16.667; last = t;
    let want = 0;
    if (state === 'play') {
      if (dragging) want = clamp((world.toWorld(pX, 0).x - boatX) * .05, -MAXV, MAXV);
      if (keyDir) want = keyDir * MAXV;
      want = clamp(want + wheelImp, -MAXV, MAXV);
    } else if (state === 'moor') {
      want = clamp((MAXX - boatX) * .03, -2, 2);   // 靠岸：船自己漂到终点
    }
    wheelImp *= Math.pow(.9, dt);
    boatV += (want - boatV) * .07 * dt;
    if (state === 'cut') boatV *= .8;
    boatX = clamp(boatX + boatV * dt, MINX, MAXX);
    if (boatX === MAXX || boatX === MINX) boatV *= .8;

    if (state === 'play' && next < NODES.length && boatX >= NODES[next].trig) triggerNode(next++);
    if (boatX > MINX + 160) hint.classList.add('hide');

    world.render(t, dt, { boatX, boatV, fish: state === 'play' });
    tick(frame);
  }
  tick(frame);
}
