// 展厅大屏可能多人同时触摸：只认主触点
export const primary = fn => e => { if (e.isPrimary !== false) fn(e); };
