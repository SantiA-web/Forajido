/**
 * 🗺️ EL MAPA DE RUTAS, EN LA GRILLA NUEVA *(Santi: "quiero que se vea como un mapa de la epoca", "una textura mucho más gastada")*.
 *
 * Un papel suelto y roto sobre la mesa de madera del campamento, grabado en tinta sepia como los mapas de 1870-80 *(Santi eligió
 * "muy gastado", "papel suelto sobre una mesa" y "estilo grabado")*. Las sierras, las mesetas, los cactus, las dunas, los lugares,
 * la carpa y la rosa de los vientos son dibujos hechos a mano. La madera y el desgaste (dobleces, manchas, aro de taza, quemadura,
 * tinta desteñida, borde roto) los arma el programa, siempre iguales, porque es una superficie enorme.
 *
 * Todo lo que no se mueve se arma una sola vez, punto por punto. Encima van la vía señalada y los trenes.
 */

import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { PALETA, RGB } from '../../engine/paleta.js';
import { REGION } from '../../data/region.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;

/** Tintas. */
const TINTA = 1, SUAVE = 2, RIO = 3, SELLO = 4;
const COLOR_TINTA = { [TINTA]: 32, [SUAVE]: 34, [RIO]: 14, [SELLO]: 9 };
const TINTA_GASTADA = { [TINTA]: 34, [SUAVE]: 35, [RIO]: 15, [SELLO]: 11 };
/** El papel, de gastado y claro a sucio. */
const PAPEL = [17, 38, 37, 36, 35, 34];
const TRAMA = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** El halo de las letras: el color del papel. */
export const COLOR_HALO = PALETA[37];
export const CARTUCHO = { w: 180, h: 56 };
/** Dónde va el cartucho, desde el origen del mapa. */
export const cartuchoEn = () => ({ x: CONFIG.view.width - CARTUCHO.w - 8, y: CONFIG.view.height - CARTUCHO.h - 10 });

// ─────────────────────────── LOS DIBUJOS, A MANO ───────────────────────
// (t tinta, s tinta suave, r sello rojo, p borra lo que haya abajo, . nada.)

const MONTANA = [
  '.........t.........',
  '........tps........',
  '.......tpsps.......',
  '......tppspss......',
  '.....tpppspsps.....',
  '....tppppspspss....',
  '...tppppppspspsp...',
  '..tpppppppspspsps..',
  '.tppppppppspspspps.',
];
const MONTANITA = [
  '.......t.......',
  '......tps......',
  '.....tpsps.....',
  '....tppspss....',
  '...tpppspsps...',
  '..tppppspspss..',
  '.tpppppspspsps.',
];
const MESETA = [
  '.....ttttttttttttttttttttttttt.....',
  '...ttppppppppppppppppppppppppptt...',
  '..tppppppppppppppppppppppppppppps..',
  '..ttpppppppppppppppppppppppppptss..',
  '..tpstpstpstpstpstpstpstpstpstpst..',
  '.tpstpstpstpstpstpstpstpstpstpstps.',
  '.tpstpstpstpstpstpstpstpstpstpstps.',
  'tpstpstpstpstpstpstpstpstpstpstpstp',
  'tpstpstpstpstpstpstpstpstpstpstpstp',
  't.st.st.st.st.st.st.st.st.st.st.st.',
  '..s....s....s....s....s....s....s..',
];
const CACTUS = [
  '....t....',
  '....t..t.',
  't...t..t.',
  't...t..t.',
  't...tttt.',
  'tttttt...',
  '....t....',
  '....t....',
  '....t....',
  '...ttt...',
];
const DUNAS = [
  '......ttt........',
  '....ttpppt.......',
  '..ttpppspptt.....',
  '.t...s.s....t....',
  '..........sssss..',
  '........ss.....ss',
];
const PUEBLO = [
  '..sssss..',
  '.s.....s.',
  's..ttt..s',
  's..ttt..s',
  's..ttt..s',
  '.s.....s.',
  '..sssss..',
];
const MINA = [
  'tt.......tt',
  'ttt.....ttt',
  '..t.....t..',
  '...t...t...',
  '....t.t....',
  '.....t.....',
  '....t.t....',
  '...t...t...',
  '..t.....t..',
];
const PUESTO = [
  'ssssssss', 's......s', 's......s', 's......s', 's......s', 's......s', 's......s', 'ssssssss',
];
const CARPA = [
  '......r......',
  '.....rpr.....',
  '....rprpr....',
  '...rpprppr...',
  '..rpprprppr..',
  '.rpprppprppr.',
  'rrrrrrrrrrrrr',
];
// (La rosa: la mitad de arriba y la del medio son a mano; la de abajo es la misma, dada vuelta.)
const ROSA_ARRIBA = [
  '............t............',
  '............t............',
  '...........ttt...........',
  '...........ttpt..........',
  '..........tttpt..........',
  '..........tttppt.........',
  '..........tttppt.........',
  '..s.......tttppt......s..',
  '...s.....tttpppt.....s...',
  '....s....tttpppt....s....',
  '........ttttppppt........',
  '....ttttttttppppttttt....',
];
const ROSA_MEDIO = 'tttttttttttttpppppppppppt';
const ROSA = [...ROSA_ARRIBA, ROSA_MEDIO, ...ROSA_ARRIBA.slice().reverse().map((f) => [...f].reverse().join(''))];
const LETRA_TINTA = { t: TINTA, s: SUAVE, r: SELLO, p: 0 };

// ─────────────────────────── EL AZAR QUE SIEMPRE DA LO MISMO ───────────

const azar = (x, y) => {
  const n = Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663);
  return (Math.imul(n ^ (n >>> 13), 1274126177) >>> 0) / 4294967296;
};
const suave = (t) => t * t * (3 - 2 * t);
function ruido(x, y) {
  const i = Math.floor(x), j = Math.floor(y), a = suave(x - i), b = suave(y - j);
  const c = azar(i, j) + (azar(i + 1, j) - azar(i, j)) * a;
  const d = azar(i, j + 1) + (azar(i + 1, j + 1) - azar(i, j + 1)) * a;
  return c + (d - c) * b;
}
const nubes = (x, y) => ruido(x, y) * 0.6 + ruido(x * 2.3 + 7, y * 2.3 + 3) * 0.3 + ruido(x * 5.1, y * 5.1 + 9) * 0.1;

// ─────────────────────────── ARMAR LA HOJA ─────────────────────────────

let cortes = null;

function armar(W, H, ox, oy, luz) {
  // De noche, cuánto se apaga cada punto según lo lejos que esté de la llama (menos de 0: cerca, ilumina de más).
  const apagado = (x, y) => {
    if (!luz) return 0;
    const d = Math.hypot(x - luz.x, y - luz.y);
    return -0.6 * Math.max(0, 1 - d / 60) + 2.6 * suave(Math.max(0, Math.min(1, (d - 60) / 420)));
  };
  const maderaDeNoche = (c, x, y) => {
    const paso = Math.floor(apagado(x, y) + TRAMA[(y & 3) * 4 + (x & 3)] / 16);
    const i = c - 32 - paso;
    return i < 0 ? 0 : Math.min(32 + i, 36);
  };
  const px = (u) => Math.round((u + ox) / PASO), py = (u) => Math.round((u + oy) / PASO);
  const V = CONFIG.view;
  const L = px(-14), R = px(V.width + 14), T = py(-8), B = py(V.height + 12);
  const AN = R - L, AL = B - T;
  const tinta = new Uint8Array(W * H);
  const pon = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) tinta[y * W + x] = c; };
  const estampar = (mapa, x, y) => {
    mapa.forEach((f, j) => { for (let i = 0; i < f.length; i++) if (f[i] !== '.') pon(x + i, y + j, LETRA_TINTA[f[i]]); });
  };
  const centrado = (mapa, ux, uy) => estampar(mapa, px(ux) - (mapa[0].length >> 1), py(uy) - (mapa.length >> 1));
  const linea = (a, b, c, d, color) => {
    let x0 = px(a), y0 = py(b); const x1 = px(c), y1 = py(d);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      pon(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };

  // El marco: la raya de afuera, la guarda de cuadritos y la raya fina de adentro.
  const G = 9;
  for (let x = L + G; x <= R - G; x++) {
    pon(x, T + G, TINTA); pon(x, B - G, TINTA); pon(x, T + G + 5, TINTA); pon(x, B - G - 5, TINTA); pon(x, T + G + 7, SUAVE); pon(x, B - G - 7, SUAVE);
    if (Math.floor((x - L) / 6) % 2 === 0) for (let k = 1; k <= 4; k++) { pon(x, T + G + k, TINTA); pon(x, B - G - k, TINTA); }
  }
  for (let y = T + G; y <= B - G; y++) {
    pon(L + G, y, TINTA); pon(R - G, y, TINTA); pon(L + G + 5, y, TINTA); pon(R - G - 5, y, TINTA);
    if (y >= T + G + 7 && y <= B - G - 7) { pon(L + G + 7, y, SUAVE); pon(R - G - 7, y, SUAVE); }
    if (Math.floor((y - T) / 6) % 2 === 0) for (let k = 1; k <= 4; k++) { pon(L + G + k, y, TINTA); pon(R - G - k, y, TINTA); }
  }

  // El terreno.
  const cerros = [];
  for (const t of REGION.terreno) {
    if (t.tipo === 'sierra') t.puntos.forEach(([x, y], i) => {
      cerros.push([x, y, i % 2 ? MONTANITA : MONTANA]);
      cerros.push([x + 7, y + 4, MONTANITA]);
    });
    else if (t.tipo === 'rio') {
      for (let i = 0; i < t.puntos.length - 1; i++) {
        const [a, b] = t.puntos[i], [c, d] = t.puntos[i + 1];
        linea(a, b, c, d, RIO); linea(a + 0.75, b, c + 0.75, d, RIO);
        const largo = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / 3));
        for (let k = 0; k < largo; k++) if (k % 2 === 0) {
          const u = k / largo, v = (k + 0.8) / largo;
          linea(a + (c - a) * u - 2.5, b + (d - b) * u, a + (c - a) * v - 2.5, b + (d - b) * v, RIO);
          linea(a + (c - a) * u + 3.5, b + (d - b) * u, a + (c - a) * v + 3.5, b + (d - b) * v, RIO);
        }
      }
    } else if (t.tipo === 'meseta') centrado(MESETA, t.x + t.w / 2, t.y + t.h / 2);
    else if (t.tipo === 'cactus') centrado(CACTUS, t.x, t.y);
    else if (t.tipo === 'dunas') centrado(DUNAS, t.x, t.y);
  }
  cerros.sort((a, b) => a[1] - b[1]).forEach(([x, y, m]) => centrado(m, x, y));

  // Los lugares, la carpa y la rosa.
  for (const l of REGION.lugares) centrado(l.tipo === 'mina' ? MINA : l.tipo === 'puesto' ? PUESTO : PUEBLO, l.x, l.y);
  centrado(CARPA, REGION.campamento.x, REGION.campamento.y);
  centrado(ROSA, 30, V.height - 30);

  // El cartucho: se limpia lo que haya abajo, y lleva su marco doble.
  const C = cartuchoEn();
  const cx0 = px(C.x), cy0 = py(C.y), cx1 = px(C.x + CARTUCHO.w), cy1 = py(C.y + CARTUCHO.h);
  for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) pon(x, y, 0);
  for (let x = cx0; x <= cx1; x++) { pon(x, cy0, TINTA); pon(x, cy1, TINTA); pon(x, cy0 + 2, SUAVE); pon(x, cy1 - 2, SUAVE); }
  for (let y = cy0; y <= cy1; y++) { pon(cx0, y, TINTA); pon(cx1, y, TINTA); if (y >= cy0 + 2 && y <= cy1 - 2) { pon(cx0 + 2, y, SUAVE); pon(cx1 - 2, y, SUAVE); } }

  // ── El borde roto.
  const mordida = (t, lado) => {
    let m = 1 + ruido(t / 7, lado * 11) * 3.5 + ruido(t / 2.5, lado * 5) * 1.5;
    const zona = ruido(t / 26, lado * 3 + 40);
    if (zona > 0.72) m += (zona - 0.72) * 34 * ruido(t / 3, lado * 17);
    return m;
  };
  const adentro = (x, y) => {
    if (x < L + mordida(y, 1) || x > R - mordida(y, 2) || y < T + mordida(x, 3) || y > B - mordida(x, 4)) return false;
    // Las puntas, gastadas y redondas.
    const ex = Math.min(x - L, R - x), ey = Math.min(y - T, B - y);
    return !(ex < 7 && ey < 7 && Math.hypot(7 - ex, 7 - ey) > 7.5 - ruido(x / 3, y / 3) * 2);
  };

  // ── Lo gastado.
  const pliegueX = [L + Math.round(AN / 3), L + Math.round((2 * AN) / 3)], pliegueY = T + Math.round(AL / 2);
  // (Dónde se comen las vías, que van aparte: en la raya de cada doblez, uno de cada dos.)
  cortes = (ux, uy) => {
    const x = px(ux), y = py(uy);
    return (pliegueX.includes(x) || y === pliegueY) && azar(Math.round(ux * 2), Math.round(uy * 2)) < 0.5;
  };
  const U = (ux, uy) => [px(ux), py(uy)];
  const manchas = [[...U(36, 128), 42], [...U(292, 38), 30], [...U(166, 66), 22], [...U(58, 208), 24]];
  const aros = [[...U(182, 168), 19]];
  const [qx, qy] = U(220, 30);

  const out = new Uint8ClampedArray(W * H * 4);
  const poner = (k, c) => { const q = RGB[c]; out[k * 4] = q[0]; out[k * 4 + 1] = q[1]; out[k * 4 + 2] = q[2]; out[k * 4 + 3] = 255; };
  const madera = (x, y) => {
    const fila = Math.floor(y / 22), corrido = azar(fila, 5) * 200;
    if (y % 22 === 0) return 32;
    if (Math.floor((x + corrido) / 150) !== Math.floor((x + corrido - 1) / 150)) return 32;
    const veta = ruido((x + corrido) / 34, y / 2.2);
    const tablon = azar(fila, Math.floor((x + corrido) / 150));
    const n = veta + (tablon - 0.5) * 0.3;
    return n < 0.36 ? 33 : n < 0.66 ? 34 : 35;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    const dentro = adentro(x, y) && Math.hypot(x - qx, y - qy) > 3.4 + ruido(x / 2, y / 2) * 1.5;
    if (!dentro) {
      // La sombra del papel sobre la mesa.
      const sombra = adentro(x - 2, y - 3);
      const m = madera(x, y);
      poner(k, luz ? maderaDeNoche(sombra ? 32 : m, x, y) : sombra ? 32 : m);
      continue;
    }
    // El papel: las nubes del envejecido, los bordes más sucios y cada paño un poco distinto.
    const borde = Math.min(x - L, R - x, y - T, B - y);
    let n = 1.75 + (nubes(x / 42, y / 42) - 0.5) * 2 + Math.max(0, 1 - borde / 16) * 1.5;
    n += (((x > pliegueX[0]) + (x > pliegueX[1]) + (y > pliegueY)) % 2) * 0.2;
    if (azar(x, y) < 0.02) n += 1;
    for (const [cx, cy, r] of manchas) {
      const d = Math.hypot(x - cx, (y - cy) * 1.25) + (nubes(x / 9, y / 9) - 0.5) * 16;
      if (d < r) n += d > r - 2.5 ? 1.5 : 0.55;
    }
    for (const [cx, cy, r] of aros) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < r) n += 0.15;
      if (Math.abs(d - r) < 1.6 && ruido(x / 8, y / 8) > 0.3) n += 1.4;
    }
    const dq = Math.hypot(x - qx, y - qy);
    const quemado = dq < 6.5 + ruido(x / 2, y / 2) * 2;
    if (dq < 12) n += (12 - dq) * 0.2;
    let borra = 0;
    // Los dobleces: una raya clara, comida, con su sombra al lado.
    for (const fx of pliegueX) {
      if (x === fx) { n = 0.2 + ruido(y / 5, fx) * 1; borra = 0.5; }
      else if (x === fx + 1) n += 1.1;
    }
    if (y === pliegueY) { n = 0.2 + ruido(x / 5, 3) * 1; borra = 0.5; }
    else if (y === pliegueY + 1) n += 1.1;
    for (const fx of pliegueX) {
      const d = Math.hypot(x - fx, y - pliegueY);
      if (d < 4 + ruido(x / 2, y / 2) * 2) { n = 0.1; borra = 0.85; }
    }
    if (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) n = Math.min(n, 1.4);
    // (De noche el papel más lejano no pasa del tono 4: si no, la tinta se pierde.)
    const tono = Math.max(0, Math.min(luz ? 4 : 5, Math.floor(n + apagado(x, y) + TRAMA[(y & 3) * 4 + (x & 3)] / 16)));
    let c = PAPEL[tono];
    if (quemado) c = dq < 4.8 ? 1 : 32;
    let t = tinta[k];
    if (t && !quemado) {
      // La tinta: se come en los dobleces, y se destiñe por zonas.
      const adentroCartucho = x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1;
      if (!adentroCartucho && (azar(x + 3, y) < borra || azar(x, y + 7) < 0.03)) t = 0;
      if (t) c = (!adentroCartucho && nubes(x / 34 + 20, y / 34) < 0.42 ? TINTA_GASTADA : COLOR_TINTA)[t];
    }
    poner(k, c);
  }
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  cv.getContext('2d').putImageData(new ImageData(out, W, H), 0, 0);
  return cv;
}

let guardado = null, clave = '';

/** La mesa y la hoja, con todo lo que no se mueve. */
export function dibujarHoja(ctx, { ancho, alto, ox, oy, noche }) {
  const W = Math.ceil(ancho / PASO), H = Math.ceil(alto / PASO), k = [W, H, ox, oy, noche].join('|');
  if (k !== clave) {
    const f = farolEn(H);
    guardado = armar(W, H, ox, oy, noche ? { x: f.x + 27, y: f.y + 42 } : null);
    clave = k; trazos = null; resaltadas.clear();
  }
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(guardado, 0, 0, W * PASO, H * PASO);
  ctx.imageSmoothingEnabled = prev;
}

// ─────────────────────────── LO QUE SE MUEVE ───────────────────────────

const enPunto = (u) => Math.round(u / PASO) * PASO;
const punto = (ctx, x, y, lado = 1) => ctx.fillRect(enPunto(x), enPunto(y), lado * PASO, lado * PASO);

function trazo(ctx, a, b, c, d, grueso) {
  const n = Math.ceil(Math.hypot(c - a, d - b) / PASO);
  for (let i = 0; i <= n; i++) punto(ctx, a + ((c - a) * i) / (n || 1), b + ((d - b) * i) / (n || 1), grueso);
}

/**
 * 🔁 LAS VÍAS VAN EN LA CAPA FINA, de a 2 píxeles *(Santi: "las rutas y lo que está escrito en el mapa es muy poco legible porque
 * se ve muy pixeleado")*: en la grilla de 3×3 las traviesas se volvían manchitas. En los dobleces, la mitad de la tinta se comió.
 */
function trazosDeVia(ruta, ayuda, largoTraviesa) {
  const viva = ruta.servicio !== false, cada = viva ? 6 : 9;
  const llenos = [], punteados = [];
  const linea = (lista, a, b, c, d) => {
    const n = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / 0.4));
    for (let i = 0; i <= n; i++) {
      const x = a + ((c - a) * i) / n, y = b + ((d - b) * i) / n;
      if (cortes && cortes(x, y)) continue;
      lista.push(x, y);
    }
  };
  let prev = ayuda.puntoEn(ruta, 0);
  for (let d = 2; d <= ruta.total; d += 2) {
    const t = d / ruta.total, p = ayuda.puntoEn(ruta, t);
    if (!ayuda.enTunel(ruta, t)) linea(llenos, prev.x, prev.y, p.x, p.y);
    else if (Math.floor(d / 4) % 2 === 0) linea(punteados, prev.x, prev.y, p.x, p.y);
    prev = p;
  }
  for (let d = 0; d < ruta.total; d += cada) {
    const t = d / ruta.total;
    if (ayuda.enTunel(ruta, t)) continue;
    const p = ayuda.puntoEn(ruta, t), u = ayuda.tangenteEn(ruta, t), l = largoTraviesa;
    linea(llenos, p.x + u.y * l, p.y - u.x * l, p.x - u.y * l, p.y + u.x * l);
  }
  for (const [a, b] of ruta.tuneles || []) for (const t of [a, b]) {
    const p = ayuda.puntoEn(ruta, t), u = ayuda.tangenteEn(ruta, t), nx = u.y, ny = -u.x, h = t === a ? -1 : 1;
    linea(llenos, p.x + nx * 4, p.y + ny * 4, p.x - nx * 4, p.y - ny * 4);
    linea(llenos, p.x + nx * 4, p.y + ny * 4, p.x + nx * 4 + u.x * 2 * h, p.y + ny * 4 + u.y * 2 * h);
    linea(llenos, p.x - nx * 4, p.y - ny * 4, p.x - nx * 4 + u.x * 2 * h, p.y - ny * 4 + u.y * 2 * h);
  }
  return { llenos, punteados, viva };
}

let trazos = null;
/** Todas las vías impresas. */
export function dibujarVias(ctx, rutas, ayuda, noche) {
  trazos ||= rutas.map((r) => trazosDeVia(r, ayuda, 2.25));
  for (const v of trazos) {
    estiloNuevo.pintarFinos(ctx, v.llenos, 0.5, PALETA[v.viva || noche ? 32 : 34]);
    estiloNuevo.pintarFinos(ctx, v.punteados, 0.5, PALETA[noche ? 32 : 34]);
  }
}

const resaltadas = new Map();
/** La vía señalada: encima de la impresa, más gruesa y con el travesaño más largo. */
export function viaResaltada(ctx, ruta, ayuda) {
  if (!resaltadas.has(ruta)) resaltadas.set(ruta, trazosDeVia(ruta, ayuda, 3.25));
  estiloNuevo.pintarFinos(ctx, resaltadas.get(ruta).llenos, 1, PALETA[0]);
}

/** Un anillo de puntos alrededor de una parada. */
export function anillo(ctx, x, y, radio, indice) {
  ctx.fillStyle = PALETA[indice];
  const n = Math.ceil(radio * 7);
  for (let i = 0; i < n; i++) punto(ctx, x + Math.cos((i / n) * 6.283) * radio, y + Math.sin((i / n) * 6.283) * radio);
}

/** El tren, con sus tres bocanadas. */
export function tren(ctx, p, u, t) {
  ctx.fillStyle = PALETA[0];
  punto(ctx, p.x - PASO, p.y - PASO, 3);
  ctx.fillStyle = PALETA[10];
  punto(ctx, p.x, p.y);
  ctx.fillStyle = PALETA[34];
  for (let i = 1; i <= 3; i++) {
    punto(ctx, p.x - u.x * i * 3, p.y - u.y * i * 3 - i * 2.2 + Math.sin(t * 3 + i) * 0.8, i < 3 ? 2 : 1);
  }
}

/**
 * 🏮 EL FAROL DE LA MESA, al costado del mapa *(Santi: "cuando sea de noche pongas un farol sobre la mesa al costado del mapa que
 * alumbre. Y si entrás al mapa de día el farol está pero apagado")*. Un farol de kerosén dibujado a mano, y 8 cuadros de llama a
 * mano. Va siempre pegado al borde izquierdo de la pantalla, así no se corta en ventanas chicas.
 */
// 🔁 Más grande todavía y en 3/4 *(Santi: "el farol tiene que ser más grande, casi tapar el borde del mapa y debería tener una
// vista 3/4")*: se ve la tapa redonda del tanque, el globo de vidrio con la llama adentro, el sombrerete con la boca de la chimenea
// y el asa de alambre. (La mitad izquierda es a mano; la derecha es la misma dada vuelta, un tono más oscura: la luz viene de la izquierda.)
const MEDIO_FAROL = [
  '...................aaaaaaaaa',
  '...............aaaaeeeeeeeee',
  '............aaaeeeeaaaaaaaaa',
  '..........aaeeeaaa..........',
  '........aaeeaa..............',
  '.......aeeaa................',
  '......aeea..................',
  '.....aeea...................',
  '....aeea....................',
  '....aeea............aaaaaaaa',
  '...aeea...........aavvvvvvvv',
  '...aeea..........advvvvvvvvv',
  '...aeea..........adkkkkkkkkk',
  '...aeea..........addcccccccc',
  '...aeea..........adccccccccc',
  '...aeea.........aadccccccccc',
  '...aeea.......aaddcccccccccc',
  '...aeea.....aaddcccccccccccc',
  '...aeea...aaddcccccccccccccc',
  '...aeea.aaddcccccccccccccccc',
  '...aeeaaddcccccccccccccccccc',
  '...aeeaadcccccccccccccccbbbb',
  '...aeeaabbcccccccccccccbbbbb',
  '...aeeaaabbbbbbbbbbbbbbbbbbb',
  '...aeea..aaaaaaaaaaaaaaaaaaa',
  '...aeea....agGGGgggggggggggg',
  '...aeea...agGGGggggggggggggg',
  '...aeea..agGGGgggggggggggggg',
  '...aeea.agGGGggggggggggggggg',
  '...aeeaagGGGgggggggggggggggg',
  '...aeeaagGGGgggggggggggggggg',
  '...aeeaaggGGGggggggggggggggg',
  '...aeeaaggGGGggggggggggggggg',
  '...aeeaaggGGGggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaaggGGgggggggggggggggg',
  '...aeeaagggGGggggggggggggggg',
  '...aeeaagggGGggggggggggggggg',
  '...aeeaagggGGggggggggggggggg',
  '...aeeaagggGGggggggggggggggg',
  '...aeeaagggggggggggggggggggg',
  '...aeeaagggggggggggggggggggg',
  '...aeeaagggggggggggggggggggg',
  '...aeeaagggggggggggggggggggg',
  '...aeea.aggggggggggggggggggg',
  '...aeea..agggggggggggggggggg',
  '...aeea...aggggggggggggggggg',
  '...aeea....agggggggggggggggg',
  '...aeea...aaaaaaaaaaaaaaaaaa',
  '...aeea....adddccccccccccccc',
  '...aeea....adccccccccccccccc',
  '...aeea....aaaaaaaaaaaaaaaaa',
  '...aeea..aaadddddddddddddddd',
  '...aeaaaaddddccccccccccccccc',
  '...aaadddccccccccccccccccccc',
  '..aaddcccccccccccccccccccccc',
  '.addcccccccccccccccccccccccc',
  'addccccccccccccccccccccccccc',
  'adcccccccccccccccccccccccccc',
  'abaccccccccccccccccccccccccc',
  'adbaaccccccccccccccccccccccc',
  'addbbaaacccccccccccccccccccc',
  'addccbbaaaaccccccccccccccccc',
  'addcccbbbaaaaacccccccccccccc',
  'addccccbbbbaaaaaaaaacccccccc',
  'addcccccccbbbbbbaaaaaaaaaaaa',
  'addccccccccccccbbbbbbbbbbbbb',
  'addcccccccccccbbbbbbbbbbbbbb',
  'addccccccccccbbbbbbbbbbbbbbb',
  '.adcccccccccbbbbbbbbbbbbbbbb',
  '.abcccccccbbbbbbbbbbbbbbbbbb',
  '..aabbbbbbbbbbbbbbbbbbbbbbbb',
  '....aaabbbbbbbbbbbbbbbbbbbbb',
  '........aaaaaaabbbbbbbbbbbbb',
  '..............aaaaaaaaaaaaaa',
  '........ssssssssssssssssssss',
];
const AL_OTRO_LADO = { d: 'c', c: 'b', G: 'g' };
const FAROL = MEDIO_FAROL.map((f) => f + [...f.slice(0, 27)].reverse().map((l) => AL_OTRO_LADO[l] || l).join(''));
const LLAMA = [
  ['....o....', '....o....', '...ooo...', '...oyo...', '..ooyoo..', '..oyyyo..', '.ooyWyoo.', '.oyyWyyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['.....o...', '....oo...', '...ooo...', '...oyyo..', '..ooyoo..', '..oyyyo..', '.ooyWyoo.', '.oyyWyyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['.........', '.....o...', '....oo...', '...oyyo..', '..ooyyo..', '..oyyWo..', '.ooyWWoo.', '.oyyWWyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['.........', '....o....', '...ooo...', '...oyo...', '..oyyoo..', '..oyWyo..', '.ooWWyoo.', '.oyWWyyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['...o.....', '...oo....', '...ooo...', '..oyyo...', '..oyyoo..', '..oyWyo..', '.ooWWyoo.', '.oyWWyyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['....o....', '...oo....', '...ooo...', '...oyo...', '..ooyoo..', '..oyyyo..', '.ooyWyoo.', '.oyWWyyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['.....o...', '.....oo..', '....ooo..', '...oyyo..', '..ooyyo..', '..oyyWo..', '.ooyWWoo.', '.oyyWWyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
  ['.........', '....o....', '...ooo...', '...oyo...', '..ooyoo..', '..oyyyo..', '.ooyWyoo.', '.oyyWyyo.', '.oyWWWyo.', '.oyWWWyo.', '.oyyWyyo.', '..oyyyo..', '...ooo...', '....o....'],
];
const QUEMADOR = ['...aka...', '..acdca..', '..abcba..', '.aabcbaa.', '.acccbba.', '.aaaaaaa.'];
const METAL = { a: 31, b: 23, c: 24, d: 25, e: 25, k: 31, s: 32 };
// (v: la boca de la chimenea, por donde de noche se ve el resplandor.)
const VIDRIO_APAGADO = { g: 14, G: 15, v: 0 };
const VIDRIO_PRENDIDO = { g: 45, G: 28, v: 44 };
const COLOR_LLAMA = { o: 28, y: 29, W: 30 };

/** Dónde va el farol, en puntos: su esquina de arriba a la izquierda. */
const farolEn = (H) => ({ x: 0, y: Math.round(H * 0.5) - 40 });

export function farol(ctx, alto, prendido, t) {
  const f = farolEn(Math.ceil(alto / PASO)), vidrio = prendido ? VIDRIO_PRENDIDO : VIDRIO_APAGADO;
  const pintar = (mapa, x0, y0, tabla) => mapa.forEach((fila, j) => {
    for (let i = 0; i < fila.length; i++) {
      const c = tabla[fila[i]];
      if (c === undefined) continue;
      ctx.fillStyle = PALETA[c];
      ctx.fillRect((x0 + i) * PASO, (y0 + j) * PASO, PASO, PASO);
    }
  });
  pintar(FAROL, f.x, f.y, { ...METAL, ...vidrio });
  if (prendido) pintar(LLAMA[Math.floor(t * 8) % 8], f.x + 23, f.y + 33, COLOR_LLAMA);
  pintar(QUEMADOR, f.x + 23, f.y + 47, METAL);
}

/** El fueguito de tu carpa. */
export function fueguito(ctx, x, y) {
  ctx.fillStyle = PALETA[10];
  punto(ctx, x, y, 2);
}
