---
name: ink-scene-flow
description: 《行舟入墨》的幕结构、转场语法、演出原语（shot/say/gesture）、分支状态与汇聚规则。新增或修改任何一幕、转场、手势玩法、分支时先读，复用现有演出系统而不是另写一套。
---

# 幕与转场

设计来源：`docs/行舟入墨-流程设计.md`（幕内流程、分支的权威）、`docs/行舟入墨-展厅与架构.md`（时长、模式、画卷展示、工程结构的权威）、`docs/行舟入墨-玩法库.md`。`docs/行舟入墨-重构方案.md` 和 `docs/行舟入墨-设计分析.md` 是早期稿，部分内容已被取代，不作依据。

## 幕清单

| 序号 | id | 幕 | 主玩法（完整版） | 游客版删减 | 印文 | 离开方式 |
|---|---|---|---|---|---|---|
| 0 | `prologue` | 序 · 琼林之约 | 次韵 → 心印 | 只选一次 | 约 | T4 卷轴变运河 + T3 印变火光 |
| 1 | `night` | 一 · 孤舟夜泊 | 意象成景 + 墨分五色 | 4 个意象，支线二选一 | 残灯 | T3 印变红日 + T6 拂雾 |
| 2 | `yixing` | 二 · 宜兴（开放区域） | 临帖 / 种橘 / 登高 / 烹茶，任三 | 只选一处，其余自动小景 | 一虚舟 | T4 表文飞出、诏书飞回 |
| 3 | `return` | 三 · 归去来兮 | 吟诵节奏 → 船头掉转 | 不变 | 归去来 | T4 诏书展开成长卷 |
| 4 | `ashore` | 肆 · 舣舟（终幕，合并原过场、四、五、尾） | 万里长卷停靠驿站 → 对镜 → 运河听人群 → T7 → 移灯成"舣" → 放手 | 驿站最多一处、听 2 类 | 不系舟（按住）+ 舣舟（自动落下） | T3 印化为舣舟亭中的灯 → "再看一次" |

现行只有四幕（`night yixing return ashore`），`prologue` 尚未制作。原设计的 `voyage jinshan lamp epilogue` 都是 `ashore` 内的段落，不单独成幕。

每幕模块导出 `{ id, title, seal, budget: { visitor, full }, run(ctx), scrollPiece(journey) }`，放在 `src/acts/NN-id/index.js`，画面函数放同目录 `scene.js`；写好后加入 `src/app.js` 的 `ACTS`。
`ctx = { cut, journey, mode, fog }`。幕以 `cut.open(title, { bare: true })` 开场（`app.js` 负责；画面以浅色纸面为主的幕在模块上加 `light: true`，标题改用墨色）；以 T6 结尾的幕在最后 `await fog.cover('…')`，下一幕开头 `await fog.wipe(cut, …)`。
参考实现：`src/acts/04-ashore/`（宽于一屏的长卷层平移、与上一幕结尾画面重合后再推近、T7 硬切 `shot(build, { hard: true })`、暗场中 HTML 遮罩 + 顶层 svg 落印）；`src/acts/01-night/`（入画、按住、点选、二选一、支线镜头、重建镜头还原状态、诗成、钤印、印化为日、雾起）；`src/acts/02-yixing/`（承接雾、字化为景、俯瞰图上推近拉远进出地点、每处地点一个 `sites/*.js` 模块 `{ id, name, play, item, draw(bg, mid, { final }), run(ctx) }`、游客版用 `drawAlbum` 把未玩的地点以册页带过、上表、表文飞出飞回）。
直接从某幕开始调试时（`#act=yixing`），上一幕留下的雾不存在：承接 T6 的幕要先判断 `fog.covered`，没有就自己 `fog.cover()`。

## 运行模式与无操作计时

- 模式：`visitor`（展厅默认，约 10 分钟）、`judge`（讲解员 F1 进入，约 6 分钟）、`full`（完整版）。幕内用 `ctx.mode` 分支，不要另写一套幕。
- 无输入 20 秒 → 示范动画；40 秒 → 当前手势自动完成；探索段 90 秒 → 收卷回待机；画卷展示完 15 秒 → 回待机并重载页面。
- 所有演出原语都要支持"自动完成"（与跳过同一条路径：`Cut.cancel`）。

## 每幕五拍

`① 入画（三远构图）→ ② 主玩法 → ③ 诗成 → ④ 钤印 → ⑤ 化印（T3，进入下一幕）`
新幕必须套这个节拍。`ashore` 是终幕，几段各有一次入画（孙氏馆的入画自动完成），共两方印：「不系舟」按住钤印，「舣舟」无刻印步骤、自己落下。

## 转场语法（只用这七种）

| # | 名称 | 用途 |
|---|---|---|
| T1 | 展卷 / 收卷 | 只在开场和结尾 |
| T2 | 墨滴入水（v3 `inkCover/inkUncover`） | 从探索进入演出 |
| T3 | 印化为景 | 幕与幕之间（主链条） |
| T4 | 物件接力 | 同一物件跨两个画面，镜头不切 |
| T5 | 字化为景 | 诗句/帖字散开重组成景物 |
| T6 | 拂雾 | 大的时间跨度 |
| T7 | 硬切 | **全篇只在第四幕 → 第五幕用一次** |

不要新增"淡入淡出黑场"之类的通用转场。

## 演出原语（`src/cut/cut.js` 的 `createCut(inkDrop)`；转场 T2 在 `src/transitions/inkDrop.js`）

| 原语 | 作用 | 要点 |
|---|---|---|
| `shot(build)` | 切镜头；`build(mid, { bg, fg })` 在 1600×900 坐标里画，返回上下文对象 | 三层分开：`bg` 静态背景、`mid` 演出中会变的内容、`fg` 静态前景。首个镜头在墨色遮罩下搭好再揭开 |
| `say(who, text, note)` | 对白；`'旁白'` 隐藏人名 | 第一次点击补全文字，第二次推进 |
| `gesture({dir, prompt, at, len, onProgress})` | 沿箭头划动，进度 0→1 驱动 `onProgress(p)` | 松手回弹；支持方向键、滚轮；`at/len` 是 cutSvg 坐标 |
| `sleep(ms)` | 等待 | `Cut.skip` 时为 0 |
| `inkCover(x,y) / inkUncover()` | 墨团转场 | |
| `reveal(i)` | 世界中墨晕揭开第 i 处景 + 故事卡 + 墨点飞入进度 | |

已有的交互原语（新幕直接用，签名都是 `fn(cut, opts) → Promise`）：

| 原语 | 文件 | 用途 | 键盘替代 |
|---|---|---|---|
| `hold` | `src/cut/hold.js` | 在某点按住，进度到 1 完成（护灯、钤印） | 按住空格 |
| `taps` | `src/cut/taps.js` | 点选若干目标，`onTap` 返回 true 表示收下（寻景、点墨、施粥） | Tab 切换、Enter 点选 |
| `choose` | `src/cut/taps.js` | 多选一，返回 id（支线分叉） | 数字键 |
| `compose` | `src/cut/compose.js` | 三远构图：各层错位，拖回原位（入画） | Enter 逐层吸附 |
| `fog.wipe` | `src/transitions/fog.js` | T6 拂雾：擦开雾气 | 按住空格 |
| `rub` | `src/cut/rub.js` | 在框内来回擦，笔迹画进 `<mask>` 显出被遮的内容（临帖描摹、点茶击拂） | 按住空格 |
| `chant` | `src/cut/chant.js` | 跟着平仄逐字按：长按为平、轻点为仄（吟诵） | 空格 |
| `say` / `gesture` | `src/cut/cut.js` | 对白、沿箭头划动 | 空格/回车、方向键 |

辅助：`createPoem`（`src/ink/poem.js`，竖排诗句逐列写出）、`createSeal(parent, text)`（`src/ink/seal.js`，2–3 字竖长朱印）、`glyph`（`src/ink/glyph.js`，书法字体缺字拼合）、`fog.cover(text)`（雾起，带一行字）、`loop(fn)`（`src/core/tick.js`，每帧回调，返回 stop）。

新增原语一律用 `src/cut/primitive.js` 的 `primitive(cut, prompt, api => …)` 外壳：监听用 `api.on`、定时器用 `api.every/after`、每帧循环用 `api.stopOnEnd(loop(…))`，返回"立即完成"函数。外壳负责跳过、自动完成、清理和收起对白，不要绕开它手写。新原语也要提供键盘替代操作。

提示语格式：`操作 · 情节`，如"按住 · 护灯"、"松开 · 舣舟"、"按箭头示意向下缓慢划动 · 落笔"。

## 分支状态

```js
const journey = {
  heart: 'mountain' | 'water' | 'bamboo', // 序：心印，默认 'water'
  night: 'song' | 'porridge',              // 一：先走的支线，默认 'song'
  yixing: [],                              // 二：'stele' | 'orchard' | 'peak' | 'tea'，≥3 才能离开
  mood: 'longing' | 'free',                // 三：以最后 5 秒为准，默认 'free'
  stops: [],                               // 过场：'hangzhou' | 'huizhou' | 'danzhou'，0–2
  heard: [],                               // 四：'scholar' | 'farmer' | 'elder' | 'child' | 'monk'，≥3 触发台词
  items: [],                               // 收集物，第五幕灯影用
  seals: [],                               // { text, depth }
};
```

- 分支只**写**状态；后续场景只**读**状态决定"多出现什么"，状态缺失时用默认值，绝不卡住流程。
- 回响位置：粥碗 → 第二幕上表"粗给饘粥"；农人/老人台词 → 依赖 `yixing` / `night`；驿站物 → 金山画像前一闪；`mood` → 结局题跋。
- 汇聚：第五幕灯影无论 `items` 是什么都必须拼出"舣"字（物品越多越饱满，最少也能成字）。
- 结局唯一，变化只体现在最终长卷的构成（见流程设计第五节）。

## 调试

用幕 id 跳转并预设状态：`#act=ashore&mode=visitor&heart=bamboo&night=porridge&mood=longing`。幕 id：`night yixing return ashore`。v3 的 `#ep1`–`#ep3` 已废弃。
