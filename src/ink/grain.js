// 纸纹：噪声 + 纤维，作为平铺背景叠在最上层（与构图无关，可用 Math.random）
export function mountGrain(target) {
  const c = document.createElement('canvas'); c.width = c.height = 240;
  const x = c.getContext('2d'), img = x.createImageData(240, 240);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 150 + Math.random() * 105;
    img.data[i] = v; img.data[i + 1] = v * .97; img.data[i + 2] = v * .9; img.data[i + 3] = 70;
  }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(120,95,60,.12)'; x.lineWidth = .6;
  for (let i = 0; i < 70; i++) {
    const sx = Math.random() * 240, sy = Math.random() * 240;
    x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.random() * 20 - 10, sy + Math.random() * 20 - 10, sx + Math.random() * 30 - 15, sy + Math.random() * 30 - 15); x.stroke();
  }
  target.style.backgroundImage = `url(${c.toDataURL()})`;
}
