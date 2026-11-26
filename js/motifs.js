/* Romanian embroidery motifs drawn as pixel grids.
   Cross-stitch is a grid, like pixel art — the visual thread of the whole game. */

const PALETTE = { r: '#ff2e3b', y: '#ffd60a', b: '#2f6bff', k: '#0a0a0c', w: '#f6f5f0', g: '#2a2b31' };

const MOTIFS = {
  romb: [
    '.....r.....',
    '....rrr....',
    '...rr.rr...',
    '..rr.y.rr..',
    '.rr.yyy.rr.',
    'rr.yy.yy.rr',
    '.rr.yyy.rr.',
    '..rr.y.rr..',
    '...rr.rr...',
    '....rrr....',
    '.....r.....'
  ],
  star: [
    '....y....',
    '.y..y..y.',
    '..y.y.y..',
    '...yyy...',
    'yyyy.yyyy',
    '...yyy...',
    '..y.y.y..',
    '.y..y..y.',
    '....y....'
  ],
  hook: [
    '..r..',
    '.r.r.',
    'r...r',
    '.r.r.',
    '..r..',
    '..r..',
    '.rrr.'
  ],
  wave: [
    'r.......r.......',
    '.r.....r.r.....r',
    '..r...r...r...r.',
    '...r.r.....r.r..',
    '....r.......r...'
  ],
  tree: [
    '.....y.....',
    '....yyy....',
    '.y...y...y.',
    '..y..y..y..',
    '...y.y.y...',
    '.y..yyy..y.',
    '..y..y..y..',
    '...y.y.y...',
    '....yyy....',
    '.....y.....',
    '....rrr....'
  ]
};

/* recolor: map of char -> color, e.g. {r:'#2f6bff'} */
function motifSVG(name, { cell = 6, pad = 2, recolor = {}, bg = null, gap = 0.18 } = {}) {
  const g = MOTIFS[name];
  const h = g.length, w = g[0].length;
  const W = (w + pad * 2) * cell, H = (h + pad * 2) * cell;
  const inset = cell * gap;
  let rects = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = g[y][x];
    if (ch === '.') continue;
    const col = recolor[ch] || PALETTE[ch];
    rects += `<rect x="${(x + pad) * cell + inset}" y="${(y + pad) * cell + inset}" width="${cell - inset * 2}" height="${cell - inset * 2}" fill="${col}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${rects}</svg>`;
}
function motifURI(name, opts) {
  return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(motifSVG(name, opts)) + '")';
}
function installMotifVars() {
  const root = document.documentElement.style;
  root.setProperty('--m-romb', motifURI('romb', { cell: 6, pad: 1 }));
  root.setProperty('--m-romb-dim', motifURI('romb', { cell: 6, pad: 1, recolor: { r: '#3a1216', y: '#3a3410' } }));
  root.setProperty('--m-romb-blue', motifURI('romb', { cell: 6, pad: 1, recolor: { r: '#2f6bff', y: '#f6f5f0' } }));
  root.setProperty('--m-star', motifURI('star', { cell: 6, pad: 2 }));
  root.setProperty('--m-star-dim', motifURI('star', { cell: 6, pad: 3, recolor: { y: '#24252c' } }));
  root.setProperty('--m-hook', motifURI('hook', { cell: 6, pad: 1 }));
  root.setProperty('--m-hook-k', motifURI('hook', { cell: 6, pad: 1, recolor: { r: '#0a0a0c' } }));
  root.setProperty('--m-wave', motifURI('wave', { cell: 5, pad: 0 }));
  root.setProperty('--m-wave-y', motifURI('wave', { cell: 5, pad: 0, recolor: { r: '#ffd60a' } }));
  root.setProperty('--m-tree', motifURI('tree', { cell: 6, pad: 2 }));
}
