// 共享滤镜与渐变，挂在页面上一个隐藏的 <svg> 里，id 全局可引用
const DEFS = `
<filter id="fInkEdge" x="-5%" y="-10%" width="110%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="0.7"/>
</filter>
<filter id="fWash" x="-10%" y="-20%" width="120%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.01 0.035" numOctaves="3" seed="8" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="3.5"/>
</filter>
<filter id="fSoft" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="7"/>
</filter>
<filter id="fBleed" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="0.35"/>
</filter>
<filter id="fRipple" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="2" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="1.4"/>
</filter>
<filter id="fGhost" x="-10%" y="-10%" width="120%" height="120%">
  <feGaussianBlur stdDeviation="2.5"/>
</filter>
<filter id="fDof" x="-20%" y="-20%" width="140%" height="140%">
  <feGaussianBlur stdDeviation="7"/>
</filter>
<filter id="fBlob" x="-25%" y="-25%" width="150%" height="150%">
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="80" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="3"/>
</filter>

<linearGradient id="gFar1" gradientUnits="userSpaceOnUse" x1="0" y1="290" x2="0" y2="590">
  <stop offset="0" stop-color="#1c1b19" stop-opacity=".17"/><stop offset="1" stop-color="#1c1b19" stop-opacity="0"/>
</linearGradient>
<linearGradient id="gFar2" gradientUnits="userSpaceOnUse" x1="0" y1="380" x2="0" y2="610">
  <stop offset="0" stop-color="#1c1b19" stop-opacity=".27"/><stop offset="1" stop-color="#1c1b19" stop-opacity="0"/>
</linearGradient>
<linearGradient id="gMid" gradientUnits="userSpaceOnUse" x1="0" y1="360" x2="0" y2="620">
  <stop offset="0" stop-color="#1c1b19" stop-opacity=".58"/>
  <stop offset=".6" stop-color="#1c1b19" stop-opacity=".16"/>
  <stop offset="1" stop-color="#1c1b19" stop-opacity="0"/>
</linearGradient>
<linearGradient id="gMist" gradientUnits="userSpaceOnUse" x1="0" y1="440" x2="0" y2="600">
  <stop offset="0" stop-color="#efe7d6" stop-opacity="0"/><stop offset=".75" stop-color="#efe7d6" stop-opacity=".92"/>
  <stop offset="1" stop-color="#efe7d6" stop-opacity=".95"/>
</linearGradient>
<linearGradient id="gBank" gradientUnits="userSpaceOnUse" x1="0" y1="470" x2="0" y2="570">
  <stop offset="0" stop-color="#1c1b19" stop-opacity=".03"/><stop offset="1" stop-color="#1c1b19" stop-opacity=".15"/>
</linearGradient>
<linearGradient id="gWater" gradientUnits="userSpaceOnUse" x1="0" y1="566" x2="0" y2="800">
  <stop offset="0" stop-color="#1c1b19" stop-opacity=".09"/><stop offset=".45" stop-color="#1c1b19" stop-opacity=".025"/>
  <stop offset="1" stop-color="#1c1b19" stop-opacity=".06"/>
</linearGradient>
<linearGradient id="gNear" gradientUnits="userSpaceOnUse" x1="0" y1="780" x2="0" y2="900">
  <stop offset="0" stop-color="#1c1b19" stop-opacity=".30"/><stop offset=".35" stop-color="#1c1b19" stop-opacity=".12"/>
  <stop offset="1" stop-color="#1c1b19" stop-opacity=".04"/>
</linearGradient>
<linearGradient id="gDusk" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#b03a2e" stop-opacity=".22"/><stop offset=".6" stop-color="#c9874e" stop-opacity=".10"/>
  <stop offset="1" stop-color="#c9874e" stop-opacity="0"/>
</linearGradient>`;

// 挂载到 body 开头，返回 <defs id="gdefs">，人物 symbol 等也往这里加
export function mountDefs() {
  const holder = document.createElement('div');
  holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs id="gdefs">${DEFS}</defs></svg>`;
  document.body.prepend(holder.firstElementChild);
  return document.getElementById('gdefs');
}
