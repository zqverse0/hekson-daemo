// T2 墨滴入水：墨团从 (x, y) 旋转放大盖满屏幕，再褪去
// inkEl 是一个 600×600、内含 fBlob 墨团的定位元素（见 index.html #ink）
export function createInkDrop(inkEl) {
  function cover(x, y) {
    return new Promise(r => {
      inkEl.style.transition = 'none';
      inkEl.style.left = x + 'px'; inkEl.style.top = y + 'px';
      inkEl.style.opacity = 1; inkEl.style.transform = 'scale(.01) rotate(0deg)';
      void inkEl.offsetWidth;
      const k = Math.hypot(innerWidth, innerHeight) * 2.8 / 600;
      inkEl.style.transition = 'transform 1s cubic-bezier(.55,0,.35,1)';
      inkEl.style.transform = `scale(${k}) rotate(40deg)`;
      setTimeout(r, 1000);
    });
  }
  function uncover() {
    return new Promise(r => {
      inkEl.style.transition = 'opacity .9s ease';
      inkEl.style.opacity = 0;
      setTimeout(() => { inkEl.style.transition = 'none'; inkEl.style.transform = 'scale(0)'; r(); }, 900);
    });
  }
  return { cover, uncover };
}
