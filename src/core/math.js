export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 把总进度 p 切出 [a, b] 一段，返回 0→1
export const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const f1 = n => (+n).toFixed(1);
