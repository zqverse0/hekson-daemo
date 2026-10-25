// rAF 在后台 / 隐藏的 iframe 中可能暂停，用 setTimeout 兜底
export function tick(cb) {
  let fired = false;
  const id = requestAnimationFrame(t => { fired = true; cb(t); });
  setTimeout(() => { if (!fired) { cancelAnimationFrame(id); cb(performance.now()); } }, 120);
}

// 每帧回调 fn(t, dt)，dt 以 60fps 的一帧为 1。返回 stop()
export function loop(fn) {
  let on = true, last = performance.now();
  (function f(t) {
    if (!on) return;
    const dt = Math.min(50, t - last) / 16.667; last = t;
    fn(t, dt);
    tick(f);
  })(last);
  return () => { on = false; };
}
