# 行舟入墨 · 苏轼 × 常州

展厅大屏互动叙事作品：水墨风格，诗词驱动。

## 运行

需要 Node.js 20.19 或 22.12 及以上（Vite 7 的要求）。

```bash
npm install        # 首次运行前安装依赖
npm start          # 开发模式，浏览器打开终端里显示的地址（默认 http://localhost:5173）
```

| 命令 | 用途 |
|---|---|
| `npm start` / `npm run dev` | 开发模式，改代码后自动刷新 |
| `npm run build` | 打包到 `dist/`（纯静态文件，可离线运行） |
| `npm run serve` | 打包并以正式版本运行（默认 http://localhost:4173），展厅部署前用它检查 |

当前版本是 M0：原型的三段剧情已在新架构下运行。地址后加 `#v3=1`、`#v3=2`、`#v3=3` 可直接跳到对应剧情前。

## 文档

- 设计：`docs/行舟入墨-流程设计.md`、`docs/行舟入墨-展厅与架构.md`
- 开发约定：`CLAUDE.md`、`.claude/skills/`
