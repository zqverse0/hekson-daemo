---
name: ink-wash-style
description: 《行舟入墨》的水墨视觉规范与可复用绘制函数清单。画任何景物、人物、UI、配色、字体、SVG 滤镜之前先读，避免重写 v3 里已有的 taper/ridge/willow/pine 等函数或引入不合规的颜色。
---

# 水墨视觉规范

下文函数已抽取到模块，直接 import，不要重写，也不要再从原型 `prototypes/scene-01-sushi-v3.html` 里复制：

| 模块 | 内容 |
|---|---|
| `src/core/rng.js` | `rnd R reseed createRng` |
| `src/core/math.js` | `clamp seg easeOut f1` |
| `src/core/svg.js` | `el NS` |
| `src/core/noise.js` | `noise1` |
| `src/core/tick.js` | `tick` |
| `src/core/input.js` | `primary`（只认主触点） |
| `src/ink/palette.js` | 色板常量、`ink paper BRUSH` |
| `src/ink/defs.js` | `mountDefs()`：全部滤镜与渐变 |
| `src/ink/paths.js` | `smooth bez taper ellD ridge areaD` |
| `src/ink/scenery.js` | `willow bridge gableHouse longHouse pine pavilion person bgScene` |
| `src/ink/figures.js` | `defineFigures(gdefs)`、`BOAT` |
| `src/ink/grain.js` | `mountGrain(el)` |
| `src/ink/poem.js` `seal.js` `glyph.js` | 竖排诗句、朱印、缺字拼合 |
| `src/acts/02-yixing/scene.js` | `orangeTree bamboo ox catmull peaks linGrad radGrad`（橘树、竹、牛、平滑曲线、定位山峰、渐变）——其他幕要用就从这里 import，用到第三处时再挪进 `src/ink/` |
| `src/stage/layers.js` | `createLayers(spec, W, H)` 视差图层 |

## 配色（只有这些）

| 用途 | 值 | 说明 |
|---|---|---|
| 纸 | `--paper #efe7d6` / `--paper-hi #f7f1e4` / `--paper-lo #e3d8c1` | 底色；`body` 必须显式设背景 |
| 墨 | `ink(a) = rgba(28,27,25,a)` | **所有黑灰都用它**，靠透明度分浓淡 |
| 留白高光 | `paper(a) = rgba(239,231,214,a)` | 墨块上的反白线（瓦楞、蓑衣纹、须） |
| 朱 | `--seal #b03a2e` | 唯一强调色：印章、可交互标记、手势箭头、太阳、绦带 |
| 点缀 | `INDIGO #3e5560`（衣缘）、`--gold #e3bf63`（剧情标题序号）、`gDusk`（暮色渐变） | 只在指定位置用 |
| 浅色填充 | `WALL #f7f1e4`、`STONE #e7ddc8`、`SKIN #f1e6d0`、`ROBE #ebe1cb` | 建筑、石、肤、袍 |

墨色浓淡约定（墨分五色）：焦 .9–1 · 浓 .7–.85 · 重 .45–.6 · 淡 .2–.35 · 清 .05–.15。
尾声（当代）才允许加入柔和设色，其余幕不加新色相。

## 字体

- 书法：`--brush: "Ma Shan Zheng","STXingkai","STKaiti","KaiTi",serif` — 标题、人名、印文、题款。
- 正文：`--serif: "Noto Serif SC","Songti SC","SimSun",serif`。
- 竖排（`writing-mode: vertical-rl`）用于标题、表文、题跋、印章；HUD 和说明文字用横排。
- 序号用 壹 贰 叁 肆 伍 陆 柒，刻在朱印里。

## SVG 滤镜（在 `#gdefs` 里，直接 `filter="url(#…)"` 引用）

| id | 效果 | 用于 |
|---|---|---|
| `fWash` | 大扭曲 + 强模糊 | 远山渲染、墨流 |
| `fInkEdge` | 中扭曲 | 中景山墨边 |
| `fBleed` | 高频小扭曲 | 岸线、桥、芦苇的洇墨毛边 |
| `fRipple` | 横向扭曲 | 水中倒影 |
| `fBlob` | 超大扭曲 | 转场墨团 |
| `fBloom{i}` | 超大扭曲，userSpaceOnUse | 景物揭开的墨晕遮罩 |
| `fSoft` / `fGhost` / `fDof` | 纯模糊 | 太阳、未解锁虚影、前景景深 |

渐变：`gFar1 gFar2 gMid gMist gBank gWater gNear gDusk`（都是墨色透明度渐变，`userSpaceOnUse`，按 900 高的坐标系写死 y 值）。

## 可复用函数（v3 中已有）

| 函数 | 作用 |
|---|---|
| `rnd() / R(a,b)` | 固定种子随机数（`sd = 20261023`），所有景物几何必须用它 |
| `el(tag, attrs, parent)` | 建 SVG 元素，`text` 属性写入 textContent |
| `ink(a) / paper(a) / f1(n)` | 墨色、留白色、保留一位小数 |
| `clamp / seg / easeOut` | 数值工具；`seg(p,a,b)` 把总进度切成分段进度 |
| `noise1()` | 多频正弦噪声，返回 `x => y` |
| `smooth(pts)` | 点列 → 二次曲线路径 |
| `bez(p0,c1,c2,p3,n)` | 三次贝塞尔采样成点列 |
| `taper(pts,w0,w1,wob)` | **毛笔笔触**：沿中心线生成起收笔粗细不同的填充路径 |
| `ridge(...) + areaD(...)` | 山脊点列 + 封闭成面 |
| `ellD(cx,cy,rx,ry)` | 椭圆路径（米点、苔点、松针团衬底） |
| `willow(g,x,y,h,lean)` | 柳：后层淡丝 → 干 → 枝 → 前层浓丝 |
| `pine(g,x,y,h)` | 松：浅墨干 + 浓墨勾边 + 鳞皴 + 扇形针叶 |
| `bridge / gableHouse / longHouse` | 拱桥、马头墙民居、长屋 |
| `pavilion(g,px,by)` | 亭子，**按部件分组返回**（platform/cols/rails/plaque/roof/top），可逐段"建起来" |
| `person(g,x,y,h,a,kind)` | 人群剪影，kind 0 髻 / 1 幞头 / 2 斗笠 |
| `bgScene(g,o)` | 剧情镜头通用背景（远山、岸、水、可选近岸、暮色、太阳），坐标系 1600×900 |
| `#sym-sushi / #sym-boatman / #boatArt` | 苏轼（中年，白描，面向右）、艄公、小舟 symbol |
| 纸纹 canvas | 240×240 噪声 + 纤维，`#grain` 以 multiply 叠在最上层 |

需要新景物时，先用上面的函数组合；确实要新函数，沿用"后层淡墨 → 主体 → 前层浓墨"的叠画顺序，笔画用 `taper`。

## 笔法约定

- 远树：细干 + 两层米点（淡 .2–.32、浓 .45–.6）。
- 山头、岸边：苔点（小椭圆，墨 .7–.78）。
- 近岸：枯笔横扫（粗描边，墨 .28）。
- 水：短波纹 `q…t…`，墨 .07–.24；倒影 = 同一 `use` 垂直翻转 + `fRipple` + 透明度 .14–.16。
- 人物：白描勾线（墨 .92，线宽 2.4）+ 淡设色；衣纹线墨 .3–.45。
- 建筑：白墙 + 浓墨瓦顶 + `paper(.16)` 瓦楞线。

## 动效

缓动只用 `easeOut` 或 `cubic-bezier(.55,0,.35,1)` 类先快后慢曲线。唯一允许回弹的是盖印（`cubic-bezier(.3,1.6,.5,1)`）。
静止人物加 `.breath`（缩放 ≤1%）。
