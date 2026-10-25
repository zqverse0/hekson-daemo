// 固定种子随机数（Park–Miller）。所有景物几何都用它，保证每次打开画面一致。
// 共享流的调用顺序决定画面：增删任何一处 rnd() 调用，都会让其后生成的景物全部变样。
const step = s => (s * 16807) % 2147483647;

let sd = 20261023;
export const reseed = n => { sd = n; };
export const rnd = () => (sd = step(sd), (sd - 1) / 2147483646);
export const R = (a, b) => a + (b - a) * rnd();

// 独立的随机流，不影响共享流（如众人长卷里按观众编号重现身影）
export function createRng(seed) {
  let s = seed % 2147483647 || 1;
  const r = () => (s = step(s), (s - 1) / 2147483646);
  return { rnd: r, R: (a, b) => a + (b - a) * r() };
}
