import { primary } from '../core/input.js';
import { primitive } from '../cut/primitive.js';

// T6 拂雾：淡墨雾气盖住画面（可带一行字，如"十一年后"），玩家擦开。
// 雾是剧情层之上的一张 <canvas>，镜头可以在雾下切换。
export function createFog(root) {
  const cv = document.createElement('canvas');
  cv.className = 'fog';
  root.appendChild(cv);
  const ctx = cv.getContext('2d');
  let cells = null, cols = 16, rows = 9;

  function paint(text) {
    const w = cv.width = innerWidth, h = cv.height = innerHeight;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#efe7d6'; ctx.fillRect(0, 0, w, h);
    // 淡墨云团（与构图无关，可用 Math.random）
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = (.08 + Math.random() * .22) * Math.max(w, h);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(28,27,25,${.03 + Math.random() * .05})`); g.addColorStop(1, 'rgba(28,27,25,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    if (text) {
      const fs = Math.round(h * .09);
      ctx.font = `${fs}px "Ma Shan Zheng", "STKaiti", "KaiTi", serif`;
      ctx.fillStyle = 'rgba(28,27,25,.72)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
    }
    cells = new Uint8Array(cols * rows);
  }

  // 雾气盖上（约 0.9 秒）
  async function cover(text = '') {
    if (text) await document.fonts.load('48px "Ma Shan Zheng"', text).catch(() => {});
    paint(text);
    cv.style.transition = 'none'; cv.style.opacity = 0; cv.style.display = 'block';
    void cv.offsetWidth;
    cv.style.transition = 'opacity .9s ease'; cv.style.opacity = 1;
    await new Promise(r => setTimeout(r, 900));
  }

  function hide(ms = 900) {
    cv.style.transition = `opacity ${ms}ms ease`; cv.style.opacity = 0;
    return new Promise(r => setTimeout(() => { cv.style.display = 'none'; r(); }, ms));
  }

  // 擦开：拖动擦除雾气，擦开 threshold 比例后其余自动散去。键盘：按住空格自动擦拭
  function wipe(cut, { prompt, threshold = .5 } = {}) {
    return primitive(cut, prompt, api => {
      const R = Math.max(60, innerHeight * .09);
      let down = false, lx = 0, ly = 0, keyHeld = false;
      const erase = (x0, y0, x1, y1) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round'; ctx.lineWidth = R * 2; ctx.strokeStyle = 'rgba(0,0,0,.9)';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (R / 2)) || 1;
        for (let i = 0; i <= n; i++) {
          const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const cx = Math.floor((x + dx * R * .6) / innerWidth * cols), cy = Math.floor((y + dy * R * .6) / innerHeight * rows);
            if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) cells[cy * cols + cx] = 1;
          }
        }
        if (cells.reduce((a, b) => a + b, 0) / cells.length >= threshold) done();
      };
      const done = () => { if (api.done) return; api.finish(); hide(cut.state.skip ? 0 : 1100); };
      api.on(cut.root, 'pointerdown', primary(e => { down = true; lx = e.clientX; ly = e.clientY; erase(lx, ly, lx, ly); }));
      api.on(cut.root, 'pointermove', primary(e => { if (!down) return; erase(lx, ly, e.clientX, e.clientY); lx = e.clientX; ly = e.clientY; }));
      api.on(cut.root, 'pointerup', primary(() => { down = false; }));
      // 键盘：按住空格，自动之字形擦拭
      let k = 0;
      api.every(() => {
        if (!keyHeld) return;
        const row = Math.floor(k / 8) % rows, col = k % 8, fwd = row % 2 === 0;
        const x = innerWidth * ((fwd ? col : 7 - col) + .5) / 8, y = innerHeight * (row + .5) / rows;
        erase(x - R, y, x + R, y); k++;
      }, 40);
      api.on(window, 'keydown', e => { if (e.key === ' ') { e.preventDefault(); keyHeld = true; } });
      api.on(window, 'keyup', e => { if (e.key === ' ') keyHeld = false; });
      return done;
    });
  }

  return { cover, wipe, hide, get covered() { return cv.style.display === 'block'; } };
}
