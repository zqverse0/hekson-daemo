// rAF 在后台 / 隐藏的 iframe 中可能暂停，用 setTimeout 兜底
export function tick(cb) {
  let fired = false;
  const id = requestAnimationFrame(t => { fired = true; cb(t); });
  setTimeout(() => { if (!fired) { cancelAnimationFrame(id); cb(performance.now()); } }, 120);
}
