import '@fontsource/ma-shan-zheng';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import './styles/main.css';
import './styles/acts.css';

import { mountDefs } from './ink/defs.js';
import { defineFigures } from './ink/figures.js';
import { mountGrain } from './ink/grain.js';
import { createInkDrop } from './transitions/inkDrop.js';
import { createCut } from './cut/cut.js';
import { parseHash } from './journey/hash.js';
import { startV3 } from './acts/v3/game.js';
import { startActs } from './app.js';

// 默认运行新版各幕；#v3 或 #v3=1..3 运行原型，作回归对照
const params = parseHash(location.hash);
const gdefs = mountDefs();
defineFigures(gdefs);
mountGrain(document.getElementById('grain'));
const inkDrop = createInkDrop(document.getElementById('ink'));
const cut = createCut(inkDrop);
if ('v3' in params) startV3({ cut, inkDrop, params });
else startActs({ cut, inkDrop, params });
