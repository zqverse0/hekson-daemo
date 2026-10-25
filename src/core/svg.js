export const NS = 'http://www.w3.org/2000/svg';

// 建 SVG 元素；属性 text 写入 textContent
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) k === 'text' ? (e.textContent = attrs[k]) : e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
