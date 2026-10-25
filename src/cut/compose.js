import { primary } from '../core/input.js';
import { primitive } from './primitive.js';

// 三远构图 · 入画：几层画面初始错位，玩家逐层拖回原位，靠近即吸附。
//   layers: [{ svg, off: [dx, dy], band: [y0, y1] }]
//     svg   镜头里单独的一层 <svg>（用 shot 的 layer() 创建，平移走合成层）
//     off   初始偏移（镜头坐标）
//     band  这一层在画面中的纵向范围，用来判断按下时拖的是哪一层
//   snap   离原位多近时吸附
// 键盘：Enter 吸附下一层。自动完成时全部吸附。
export function compose(cut, { prompt, layers, snap = 40 }) {
  return primitive(cut, prompt, api => {
    const ls = layers.map(l => ({ ...l, off: [...l.off], ok: false }));
    const place = (l, anim) => {
      const k = cut.toScreen(0, 0).k;
      l.svg.style.transition = anim ? 'transform .5s cubic-bezier(.3,1.3,.5,1), opacity .5s' : 'none';
      l.svg.style.transform = `translate3d(${l.off[0] * k}px,${l.off[1] * k}px,0)`;
      l.svg.style.opacity = l.ok ? 1 : .55;
    };
    const lock = l => { l.ok = true; l.off = [0, 0]; place(l, true); if (ls.every(x => x.ok)) api.after(() => api.finish(), 500); };
    ls.forEach(l => place(l, false));

    let drag = null;
    api.on(cut.root, 'pointerdown', primary(e => {
      const s = cut.toShot(e.clientX, e.clientY);
      // 按下处落在哪一层（按当前偏移后的范围），取最上层
      const l = [...ls].reverse().find(l => !l.ok && s.y >= l.band[0] + l.off[1] && s.y <= l.band[1] + l.off[1])
        || ls.find(l => !l.ok);
      if (l) drag = { l, x: s.x, y: s.y, o: [...l.off] };
    }));
    api.on(cut.root, 'pointermove', primary(e => {
      if (!drag) return;
      const s = cut.toShot(e.clientX, e.clientY);
      drag.l.off = [drag.o[0] + s.x - drag.x, drag.o[1] + s.y - drag.y];
      place(drag.l, false);
    }));
    const up = primary(() => {
      if (!drag) return;
      const l = drag.l; drag = null;
      if (Math.hypot(l.off[0], l.off[1]) < snap) lock(l);
    });
    api.on(cut.root, 'pointerup', up);
    api.on(cut.root, 'pointercancel', up);
    api.on(window, 'keydown', e => {
      if (e.key !== 'Enter') return;
      const l = ls.find(l => !l.ok);
      if (l) { e.preventDefault(); lock(l); }
    });
    return () => { ls.filter(l => !l.ok).forEach(l => { l.ok = true; l.off = [0, 0]; place(l, true); }); api.after(() => api.finish(), cut.state.skip ? 0 : 500); };
  });
}
