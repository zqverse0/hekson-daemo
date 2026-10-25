// 纸纹：噪声 + 纤维，作为平铺背景叠在最上层（与构图无关，可用 Math.random）
// 原型用 mix-blend-mode:multiply 叠加，全屏混合每帧都要重算。这里改成普通 alpha 叠加，
// 用"暗色 + 透明度"换算出与 multiply 等效的加深量：
//   multiply 加深量 = P·a·(1−c)；普通叠加加深量 = α·(P−C)  ⇒  α = a·(1−c)·P / (P−C)
// 纸色 P≈235、叠加色 C≈50 时，P/(P−C) ≈ 1.27
const A = (70 / 255) * .5;        // 原型：像素 alpha 70，图层 opacity .5
const K = 1.27;

export function mountGrain(target) {
  const c = document.createElement('canvas'); c.width = c.height = 240;
  const x = c.getContext('2d'), img = x.createImageData(240, 240);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (150 + Math.random() * 105) / 255;
    img.data[i] = 62; img.data[i + 1] = 50; img.data[i + 2] = 34;
    img.data[i + 3] = Math.round(255 * A * (1 - v * .95) * K);
  }
  x.putImageData(img, 0, 0);
  // 纤维：原型为 rgba(120,95,60,.12) multiply、图层 .5
  x.strokeStyle = 'rgba(62,50,34,.045)'; x.lineWidth = .6;
  for (let i = 0; i < 70; i++) {
    const sx = Math.random() * 240, sy = Math.random() * 240;
    x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.random() * 20 - 10, sy + Math.random() * 20 - 10, sx + Math.random() * 30 - 15, sy + Math.random() * 30 - 15); x.stroke();
  }
  target.style.backgroundImage = `url(${c.toDataURL()})`;
}
