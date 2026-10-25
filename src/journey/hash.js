// 调试 / 演示入口：#act=lamp&mode=visitor&heart=bamboo → { act: 'lamp', mode: 'visitor', heart: 'bamboo' }
export function parseHash(hash) {
  const out = {};
  for (const part of hash.replace(/^#/, '').split('&')) {
    if (!part) continue;
    const [k, v = ''] = part.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}
