import { el } from '../core/svg.js';

// 视差图层：每层一个 <svg>，按系数 f 随镜头平移。容器为 #L-<name>
// 远层（f < 1）额外加宽 2400，保证宽屏下也铺满
export function createLayers(spec, W, H) {
  const layers = {};
  for (const [k, f] of Object.entries(spec)) {
    const w = f >= 1 ? Math.round(W * f) : Math.round(W * f + 2400);
    const div = document.getElementById('L-' + k);
    layers[k] = { f, w, div, svg: el('svg', { viewBox: `0 0 ${w} ${H}` }, div) };
  }
  return {
    layers,
    resize(scale) {
      for (const L of Object.values(layers)) { L.svg.setAttribute('width', L.w * scale); L.svg.setAttribute('height', H * scale); }
    },
    apply(camX, scale) {
      for (const L of Object.values(layers)) L.div.style.transform = `translate3d(${-camX * L.f * scale}px,0,0)`;
    },
  };
}
