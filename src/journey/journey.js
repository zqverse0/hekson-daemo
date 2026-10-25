// 分支状态。分支只写入，后续场景只读取；读取时缺失一律用默认值，不能卡住流程。
export const DEFAULTS = {
  heart: 'water',   // 序：心印 mountain | water | bamboo
  night: 'song',    // 一：先走的支线 song（行歌）| porridge（野哭·施粥）
  yixing: [],       // 二：stele | orchard | peak | tea
  mood: 'free',     // 三：longing | free
  stops: [],        // 过场：hangzhou | huizhou | danzhou
  heard: [],        // 四：scholar | farmer | elder | child | monk
  items: [],        // 收集物，第五幕灯影用
  seals: [],        // { text, depth }
};
const CHOICES = { heart: ['mountain', 'water', 'bamboo'], night: ['song', 'porridge'], mood: ['longing', 'free'] };

export const MODES = ['visitor', 'judge', 'full'];

// 由 hash 参数创建（调试时可预设，如 #act=night&night=porridge）
export function createJourney(params = {}) {
  const j = structuredClone(DEFAULTS);
  for (const [k, opts] of Object.entries(CHOICES)) if (opts.includes(params[k])) j[k] = params[k];
  return j;
}
