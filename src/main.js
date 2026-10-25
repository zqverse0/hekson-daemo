import '@fontsource/ma-shan-zheng';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import './styles/main.css';

import { mountDefs } from './ink/defs.js';
import { defineFigures } from './ink/figures.js';
import { mountGrain } from './ink/grain.js';
import { createInkDrop } from './transitions/inkDrop.js';
import { createCut } from './cut/cut.js';
import { parseHash } from './journey/hash.js';
import { startV3 } from './acts/v3/game.js';

// M0：在新架构下运行 v3 原型的三段剧情。新各幕接入后由这里按模式调度
const gdefs = mountDefs();
defineFigures(gdefs);
mountGrain(document.getElementById('grain'));
const inkDrop = createInkDrop(document.getElementById('ink'));
const cut = createCut(inkDrop);
startV3({ cut, inkDrop, params: parseHash(location.hash) });
