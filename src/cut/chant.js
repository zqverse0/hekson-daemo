import { primary } from '../core/input.js';
import { loop } from '../core/tick.js';
import { primitive } from './primitive.js';

// 吟诵节奏：跟着诗句逐字按键。按住时间够长算"长按"（平声），否则算"轻点"（仄声）。
// 没有对错：画面按玩家实际的按法生长，按法与字的平仄相合时 onEnd 的 match 为真（可加一点奖励效果）。
//   tones     每字的平仄，'平' | '仄'
//   longMs    超过多少毫秒算长按
//   onStart(i)          第 i 字开始按下
//   onHold(i, ms)       按住中每帧回调（用来让墨线随按住时间延长）
//   onEnd(i, kind, match)  松开：kind 为 'long' | 'short'
// 全屏任意处按下都算；键盘：空格。自动完成时按正确的平仄把剩下的字一一补完。
export function chant(cut, { prompt, tones, longMs = 280, onStart = () => {}, onHold = () => {}, onEnd = () => {} }) {
  return primitive(cut, prompt, api => {
    let i = 0, t0 = 0, down = false;
    const begin = () => { if (down || i >= tones.length) return; down = true; t0 = performance.now(); onStart(i); };
    const end = () => {
      if (!down) return;
      down = false;
      const kind = performance.now() - t0 >= longMs ? 'long' : 'short';
      onEnd(i, kind, kind === (tones[i] === '平' ? 'long' : 'short'));
      if (++i >= tones.length) api.finish();
    };
    api.on(cut.root, 'pointerdown', primary(begin));
    api.on(cut.root, 'pointerup', primary(end));
    api.on(cut.root, 'pointercancel', primary(end));
    api.on(window, 'keydown', e => { if (e.key === ' ') { e.preventDefault(); if (!e.repeat) begin(); } });
    api.on(window, 'keyup', e => { if (e.key === ' ') end(); });
    api.stopOnEnd(loop(() => { if (down) onHold(i, performance.now() - t0); }));
    return () => {
      if (down) end();
      for (; i < tones.length; i++) { const kind = tones[i] === '平' ? 'long' : 'short'; onStart(i); onHold(i, longMs * 2); onEnd(i, kind, true); }
      api.finish();
    };
  });
}
