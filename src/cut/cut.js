import { el } from '../core/svg.js';
import { clamp, f1 } from '../core/math.js';
import { primary } from '../core/input.js';
import { SEAL, ink } from '../ink/palette.js';

// 剧情演出系统。所有原语返回 Promise，并遵守同一套跳过 / 中断约定：
//   - 开始时若 state.skip 为真，立即完成；
//   - 运行中把"立即完成自己"的函数挂到 state.cancel；
//   - 完成时移除自己注册的全部监听器和定时器，并清空 state.cancel。
// 新增原语（按住、拖放、选择、镜头推拉……）必须照此实现。
export function createCut(inkDrop) {
  const $ = id => document.getElementById(id);
  const cutEl = $('cut'), shots = $('cutShots'), gestSvg = $('gest');
  const dlg = $('dlg'), dWho = $('dWho'), dText = $('dText'), dNote = $('dNote');
  const gPrompt = $('gPrompt'), gText = $('gText');

  const state = { skip: false, cancel: null, layer: null, first: false };
  const sleep = ms => new Promise(r => setTimeout(r, state.skip ? 0 : ms));

  $('skipBtn').addEventListener('pointerdown', e => e.stopPropagation());
  $('skipBtn').addEventListener('click', e => { e.stopPropagation(); skip(); });
  function skip() { state.skip = true; state.cancel && state.cancel(); }

  // 开始一段演出：标题、显示剧情层；首个镜头在墨色遮罩下搭好
  function open(titleHtml) {
    $('cutTitle').innerHTML = titleHtml;
    cutEl.classList.add('on');
    state.skip = false; state.first = true;
  }
  function close() {
    dlg.classList.remove('show');
    cutEl.classList.remove('on');
    if (state.layer) { state.layer.remove(); state.layer = null; }
    state.skip = false;
  }

  // 切换镜头：build(mid, { bg, fg }) 在 1600×900 坐标里画，返回的对象交给剧情脚本操作。
  //   bg  静态背景（远山、岸、水、不动的树）——画完就不再改动
  //   mid 动态中景（人物、会动的物件、手势驱动的部分）
  //   fg  静态前景（压在最上面、不再改动的近景）
  // 演出中只改 mid；改 bg / fg 会让带滤镜的背景整层重算
  async function shot(build) {
    const old = state.layer;
    if (old && !state.first) { old.style.transition = 'opacity .45s'; old.style.opacity = 0; await sleep(450); }
    if (old) old.remove();
    const div = document.createElement('div');
    div.className = 'shot';
    const layer = cls => el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', class: cls }, div);
    const bg = layer('bg'), mid = layer('mid'), fg = layer('fg');
    shots.appendChild(div);
    state.layer = div;
    const ctx = build(mid, { bg, fg }) || {};
    if (state.first) { state.first = false; await inkDrop.uncover(); }
    else { div.style.opacity = 0; void div.offsetWidth; div.style.transition = 'opacity .6s'; div.style.opacity = 1; await sleep(550); }
    return ctx;
  }

  // 对白；who 为 '旁白' 时隐藏人名。第一次点击补全文字，第二次推进
  function say(who, text, note = '') {
    return new Promise(res => {
      const narr = who === '旁白';
      dlg.classList.toggle('narr', narr);
      dWho.textContent = narr ? '' : who; dNote.textContent = note; dText.textContent = '';
      dlg.classList.add('show'); dlg.classList.remove('ready');
      let i = 0, typing = true, closed = false;
      const tm = setInterval(() => { i++; dText.textContent = text.slice(0, i); if (i >= text.length) endType(); }, 42);
      function endType() { clearInterval(tm); dText.textContent = text; typing = false; dlg.classList.add('ready'); }
      const adv = primary(() => { if (typing) { endType(); return; } finish(); });
      function onKey(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); adv(e); } }
      function finish() {
        if (closed) return; closed = true;
        cutEl.removeEventListener('pointerdown', adv); removeEventListener('keydown', onKey);
        clearInterval(tm); dText.textContent = text; dlg.classList.remove('ready'); state.cancel = null; res();
      }
      cutEl.addEventListener('pointerdown', adv); addEventListener('keydown', onKey);
      state.cancel = finish;
      if (state.skip) finish();
    });
  }

  // 镜头坐标（1600×900，xMidYMid slice）→ 屏幕坐标
  function toScreen(x, y) {
    const k = Math.max(innerWidth / 1600, innerHeight / 900) || 1;
    return { x: (innerWidth - 1600 * k) / 2 + x * k, y: (innerHeight - 900 * k) / 2 + y * k, k };
  }

  // 沿箭头划动：划动进度 0→1 直接驱动 onProgress(p)。at / len 为镜头坐标（1600×900）
  function gesture({ dir, prompt, at, len, onProgress }) {
    return new Promise(res => {
      const v = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] }[dir];
      const a = toScreen(at[0], at[1]), L = Math.max(80, len * a.k);
      const b = { x: a.x + v[0] * L, y: a.y + v[1] * L };
      gestSvg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      gestSvg.innerHTML = '';
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: ink(.35), 'stroke-width': 6, 'stroke-linecap': 'round' }, gestSvg);
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: 'rgba(250,244,230,.9)', 'stroke-width': 2, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round' }, gestSvg);
      const ang = Math.atan2(v[1], v[0]) * 180 / Math.PI;
      const n = Math.max(3, Math.floor(L / 54));
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1), cx = a.x + v[0] * L * t, cy = a.y + v[1] * L * t;
        const g = el('g', { class: 'chev', transform: `translate(${f1(cx)},${f1(cy)}) rotate(${ang})`, style: `animation-delay:${(i * .12).toFixed(2)}s` }, gestSvg);
        el('path', { d: 'M-7,-11 L5,0 L-7,11', fill: 'none', stroke: ink(.55), 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        el('path', { d: 'M-7,-11 L5,0 L-7,11', fill: 'none', stroke: '#faf4e6', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      }
      el('circle', { class: 'start', cx: a.x, cy: a.y, r: 12, fill: 'none', stroke: SEAL, 'stroke-width': 2 }, gestSvg);
      const trail = el('line', { x1: a.x, y1: a.y, x2: a.x, y2: a.y, stroke: SEAL, 'stroke-width': 5, 'stroke-linecap': 'round' }, gestSvg);
      const head = el('g', { transform: `translate(${a.x},${a.y}) rotate(${ang})` }, gestSvg);
      el('path', { d: 'M-14,-18 L14,0 L-14,18 L-6,0 Z', fill: SEAL, stroke: '#faf4e6', 'stroke-width': 2, 'stroke-linejoin': 'round' }, head);
      gText.textContent = prompt; gPrompt.classList.add('on');

      let p = 0, drag = null, done = false, back = null, keyT = null;
      const keyName = { down: 'ArrowDown', up: 'ArrowUp', right: 'ArrowRight', left: 'ArrowLeft' }[dir];
      const draw = () => {
        const x = a.x + v[0] * L * p, y = a.y + v[1] * L * p;
        trail.setAttribute('x2', f1(x)); trail.setAttribute('y2', f1(y));
        head.setAttribute('transform', `translate(${f1(x)},${f1(y)}) rotate(${ang})`);
      };
      const set = np => { if (done) return; p = clamp(np, 0, 1); onProgress(p); draw(); if (p >= 1) finish(); };
      const springBack = () => { clearInterval(back); back = setInterval(() => { if (p <= 0 || done) { clearInterval(back); return; } set(p - .025); }, 30); };
      const onDown = primary(e => { if (done) return; clearInterval(back); drag = { x: e.clientX, y: e.clientY, p0: p }; });
      const onMove = primary(e => { if (!drag || done) return; set(drag.p0 + ((e.clientX - drag.x) * v[0] + (e.clientY - drag.y) * v[1]) / L); });
      const onUp = primary(() => { if (!drag || done) return; drag = null; springBack(); });
      const onKey = e => { if (e.key !== keyName || keyT || done) return; e.preventDefault(); clearInterval(back); keyT = setInterval(() => set(p + .025), 30); };
      const onKeyUp = e => { if (e.key !== keyName) return; clearInterval(keyT); keyT = null; if (!done) springBack(); };
      const onWheel = e => { const d = Math.abs(e.deltaY) + Math.abs(e.deltaX); clearInterval(back); set(p + d / 1400); };
      function finish() {
        done = true; state.cancel = null;
        cutEl.removeEventListener('pointerdown', onDown); cutEl.removeEventListener('pointermove', onMove);
        cutEl.removeEventListener('pointerup', onUp); cutEl.removeEventListener('pointercancel', onUp);
        removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp); cutEl.removeEventListener('wheel', onWheel);
        clearInterval(back); clearInterval(keyT);
        gPrompt.classList.remove('on');
        setTimeout(() => { gestSvg.innerHTML = ''; res(); }, state.skip ? 0 : 380);
      }
      cutEl.addEventListener('pointerdown', onDown); cutEl.addEventListener('pointermove', onMove);
      cutEl.addEventListener('pointerup', onUp); cutEl.addEventListener('pointercancel', onUp);
      addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp); cutEl.addEventListener('wheel', onWheel, { passive: true });
      state.cancel = () => set(1);
      if (state.skip) set(1);
    });
  }

  return { state, sleep, shot, say, gesture, toScreen, open, close, skip };
}
