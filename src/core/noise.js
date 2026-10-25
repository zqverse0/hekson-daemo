import { R } from './rng.js';

// 多频正弦噪声，返回 x => y（约 -1..1）
export function noise1() {
  const p = [R(0, 6.3), R(0, 6.3), R(0, 6.3), R(0, 6.3)];
  return x => Math.sin(x * .0037 + p[0]) * .5 + Math.sin(x * .011 + p[1]) * .28 + Math.sin(x * .031 + p[2]) * .14 + Math.sin(x * .09 + p[3]) * .08;
}
