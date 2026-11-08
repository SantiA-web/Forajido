/**
 * 🧵 LO QUE TE CRUZA EL TECHO, EN 3/4 *(Santi: "poné el cable. Y el cartel no se entiende entonces deberías como ponerlo en
 * diagonal")*.
 *
 *  - EL CABLE: de un poste a otro, a la altura de las rodillas, sobre todo el ancho del techo. Se salta.
 *  - EL PÓRTICO: un poste de cada lado de la vía, una viga por encima de todo el techo y el cartel colgado en el medio. Sólo
 *    se pasa cuerpo a tierra.
 *
 * LOS DOS CRUZAN EN DIAGONAL. En esta cámara lo que va derecho hacia el fondo se ve como un palo vertical y no se entiende
 * que cruza. Por eso el extremo de allá va corrido a la derecha y el de acá a la izquierda, y lo que te golpea también
 * depende de en qué parte del ancho estés (`xEnElAncho`).
 *
 * A mano: el cartel, ya torcido, y las piedras al pie de cada poste, en su propio mapa. De una cuenta: el cable, la viga, los
 * postes y la sombra.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const enGrilla = (v) => Math.round(v / PASO) * PASO;
const luzDe = (noche) => (noche ? CONFIG.tresCuartos.sueloNoche : 0);

/** Cuánto se corre en `x` por cada unidad del ancho del techo (de 0 a 160): dos de costado por cada una de fondo en pantalla. */
const CORRE = 0.4125;
const MEDIO_ANCHO = 80;
/** Dónde te cruza un obstáculo si estás en esa parte del ancho del techo. */
export const xEnElAncho = (ob, y) => ob.x - (y - MEDIO_ANCHO) * CORRE;
/** Si estás más cerca de la cámara que el tramo que te cruza, te dibujás encima; al saltar el cable, también. */
export function vaDetrasDeVos(ob, player) {
  return player.y > MEDIO_ANCHO - (player.x - ob.x) / CORRE || (ob.tipo === 'saltar' && player.techoSalto > 0);
}

/** A qué altura sobre la chapa va cada cosa. */
const ALTO = { saltar: 10, agachar: 32 };
const AN = 120, FILA_MEDIO = 36, POSTE_GRUESO = 5, POSTE_FINO = 3;
/** La fila del centro de la línea en esa columna: sube un punto cada dos de costado. */
const filaLinea = (x) => FILA_MEDIO - Math.floor((x - AN / 2) / 2);
const COMBA = 3;
const comba = (x) => Math.round(COMBA * Math.sin((Math.PI * x) / (AN - 1)));
const PIE_DE_ACA = 16;
/** Dónde pisa el poste de allá: el tren lo tapa, pero por los huecos de los enganches se ve que llega al suelo *(Santi)*. */
const PIE_DE_ALLA = -49;

const MADERA = { o: 0, L: 7, M: 6, K: 4, J: 4, x: 0 };
/** El cartel torcido como la viga, a mano: el lado izquierdo baja, porque es el que queda más cerca tuyo. */
const CARTEL = [
  '.................................oo',
  '...............................ooLo',
  '.............................ooLLMo',
  '...........................ooLLMMMo',
  '.........................ooLLMMMMMo',
  '.......................ooLLMMMMMMMo',
  '.....................ooLLMMMMxxMMMo',
  '...................ooLLMMMMMxMxMMMo',
  '.................ooLLMMMMxxMxMxMMMo',
  '...............ooLLMMMMMxMxMxMxMMMo',
  '.............ooLLMMMMxxMxxMMxxxMMMo',
  '...........ooLLMMMMMxMMMxMxMxMMMMJo',
  '.........ooLLMMMMxxMxMxMxMxMMMMJJMo',
  '.......ooLLMMMMMxxMMxMxMxMMMMJJMMKo',
  '.....ooLLMMMMMMMMxMMxxxMMMMJJMMKKoo',
  '...ooLLMMMMMxMMMMxMMxMMMMJJMMKKoo..',
  '.ooLLMMMMxxMxMMMMxxMMMMJJMMKKoo....',
  'oLLMMMMMxMMMxMMMxMMMMJJMMKKoo......',
  'oMMMMxxMxxMMxxxMMMMJJMMKKoo........',
  'oMMMxMxMxMMMxMMMMJJMMKKoo..........',
  'oMMMxxxMxxxMMMMJJMMKKoo............',
  'oMMMxMMMxMMMMJJMMKKoo..............',
  'oMMMxMMMMMMJJMMKKoo................',
  'oMMMxMMMMJJMMKKoo..................',
  'oMMMMMMJJMMKKoo....................',
  'oMMMMJJMMKKoo......................',
  'oMMJJMMKKoo........................',
  'oJJMMKKoo..........................',
  'oMMKKoo............................',
  'oKKoo..............................',
  'ooo................................',
  'o..................................',
];
/** La columna y la fila del cartel que van en el medio del borde de abajo. */
const CARTEL_CENTRO = [17, 22];
/** La primera fila de cada una de las dos columnas de las que cuelga. */
const CADENAS = [[8, 13], [26, 4]];

const guardados = new Map();
function guardado(clave, hacer) {
  if (!guardados.has(clave)) guardados.set(clave, hacer());
  return guardados.get(clave);
}

/** La imagen, y por columna los tramos llenos: lo que hay que borrarle al contorno de la gente que queda detrás. */
function pintar(ind, an, al, luz) {
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: an, alto: al, indices: ind, campo: () => luz }), an, al), 0, 0);
  const tramos = [];
  for (let x = 0; x < an; x++) {
    let desde = -1;
    for (let y = 0; y <= al; y++) {
      const lleno = y < al && ind[y * an + x] !== -1;
      if (lleno && desde < 0) desde = y;
      if (!lleno && desde >= 0) { tramos.push([x, desde, y - desde]); desde = -1; }
    }
  }
  return { img: cv, an, al, tramos };
}
function poner(ctx, L, x, y) {
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(L.img, x, y, L.an * PASO, L.al * PASO);
  ctx.imageSmoothingEnabled = prev;
}

function medidas(ob, sup, base) {
  const medio = (sup.arriba + sup.abajo) / 2;
  const yCentro = medio - ALTO[ob.tipo];
  const yTop = enGrilla(yCentro) - FILA_MEDIO * PASO;
  const fila = (y) => Math.round((y - yTop) / PASO);
  return { x: enGrilla(ob.x) - (AN / 2) * PASO, yTop, yCentro, suelo: fila(base + PIE_DE_ACA), sueloAlla: fila(base + PIE_DE_ALLA), abajoCartel: fila(medio - CONFIG.techo.costado.alturaViga) };
}

function lienzoPortico(m, noche) {
  return guardado(['portico', m.suelo, m.abajoCartel, noche].join('|'), () => {
    const al = m.suelo + 1, ind = new Int16Array(AN * al).fill(-1);
    const pon = (x, y, c) => { if (x >= 0 && y >= 0 && x < AN && y < al) ind[y * AN + x] = c; };
    const poste = [0, 5, 6, 4, 0];
    for (let y = filaLinea(0); y <= m.suelo; y++) for (let i = 0; i < POSTE_GRUESO; i++) pon(i, y, y % 11 === 0 && i > 0 && i < 4 ? 3 : poste[i]);
    const viga = [0, 7, 6, 4, 3, 0];
    for (let x = 0; x < AN; x++) for (let j = 0; j < viga.length; j++) pon(x, filaLinea(x) - 3 + j, x % 14 < 2 && j > 0 && j < 5 ? 3 : viga[j]);
    const izq = AN / 2 - CARTEL_CENTRO[0], arribaCartel = m.abajoCartel - CARTEL_CENTRO[1];
    for (const [c, f] of CADENAS) for (let y = filaLinea(izq + c) + 3; y < arribaCartel + f; y++) pon(izq + c, y, y % 2 ? 24 : 31);
    CARTEL.forEach((f, j) => { for (let i = 0; i < f.length; i++) if (f[i] !== '.') pon(izq + i, arribaCartel + j, MADERA[f[i]]); });
    return pintar(ind, AN, al, luzDe(noche));
  });
}

function lienzoCable(m, noche) {
  return guardado(['cable', m.suelo, noche].join('|'), () => {
    const al = m.suelo + 1, ind = new Int16Array(AN * al).fill(-1);
    const pon = (x, y, c) => { if (x >= 0 && y >= 0 && x < AN && y < al) ind[y * AN + x] = c; };
    const poste = [0, 5, 0];
    for (let y = filaLinea(0) - 1; y <= m.suelo; y++) for (let i = 0; i < POSTE_FINO; i++) pon(i, y, poste[i]);
    const hilo = [0, 24, 0];
    for (let x = 0; x < AN; x++) for (let j = 0; j < hilo.length; j++) pon(x, filaLinea(x) + comba(x) - 1 + j, hilo[j]);
    return pintar(ind, AN, al, luzDe(noche));
  });
}

/** Las piedras que sostienen cada poste: `col` es la columna del mapa donde cae la primera columna del poste. */
const PIE_CABLE = {
  col: 5,
  mapa: [
    '..ooo....ooo.',
    '.oLMDo..oLMDo',
    'oLMMDooLMMDDo',
    'oMMDDoLMMMDDo',
    '.ooooooooooo.',
  ],
};
const PIE_PORTICO = {
  col: 6,
  mapa: [
    '..oooo.....oooo..',
    '.oLMMDo...oLMMDo.',
    'oLMMMDDo.oLMMDDDo',
    'oLMMDDooLMMMDoDDo',
    'oMMDDDoLMMMMDDoDo',
    '.ooooooooooooooo.',
  ],
};
const COL_PIEDRA = { o: 0, L: 25, M: 24, D: 23 };
/** Las piedras de un poste. `xPoste`: su borde izquierdo; `yPiso`: la última fila, donde pisa. */
function pieDelPoste(ctx, tipo, noche, xPoste, yPiso) {
  const { col, mapa } = tipo === 'agachar' ? PIE_PORTICO : PIE_CABLE, an = mapa[0].length, al = mapa.length;
  const L = guardado(['pie', tipo, noche].join('|'), () => {
    const ind = new Int16Array(an * al).fill(-1);
    mapa.forEach((f, j) => { for (let i = 0; i < an; i++) if (f[i] !== '.') ind[j * an + i] = COL_PIEDRA[f[i]]; });
    return pintar(ind, an, al, luzDe(noche));
  });
  poner(ctx, L, xPoste - col * PASO, yPiso - (al - 1) * PASO);
}

/** Las flechas del aviso, cada una en su mapa: ▲ es saltar y ▼ es cuerpo a tierra. */
const FLECHA_SALTAR = [
  '.......o.......',
  '......oYo......',
  '.....oYYYo.....',
  '....oYYYYYo....',
  '...oYYYYYYYo...',
  '..oYYYYYYYYYo..',
  '.oYYYYYYYYYYYo.',
  'oooooYYYYYooooo',
  '....oYYYYYo....',
  '....oYYYYYo....',
  '....oYYYYYo....',
  '....oYYYYYo....',
  '....ooooooo....',
];
const FLECHA_TIERRA = [
  '....ooooooo....',
  '....oRRRRRo....',
  '....oRRRRRo....',
  '....oRRRRRo....',
  '....oRRRRRo....',
  'oooooRRRRRooooo',
  '.oRRRRRRRRRRRo.',
  '..oRRRRRRRRRo..',
  '...oRRRRRRRo...',
  '....oRRRRRo....',
  '.....oRRRo.....',
  '......oRo......',
  '.......o.......',
];
const COL_FLECHA = { o: 0, Y: 28, R: 10 };
function flecha(tipo) {
  return guardado('flecha' + tipo, () => {
    const mapa = tipo === 'saltar' ? FLECHA_SALTAR : FLECHA_TIERRA, an = mapa[0].length, al = mapa.length, ind = new Int16Array(an * al).fill(-1);
    mapa.forEach((f, j) => { for (let i = 0; i < an; i++) if (f[i] !== '.') ind[j * an + i] = COL_FLECHA[f[i]]; });
    return pintar(ind, an, al, 0);
  });
}
/** La flecha en el borde derecho, a la altura por donde va a venir (`xd` es el borde). De noche se ve igual: es un aviso. */
export function dibujarAvisoDelCruce(ctx, tipo, sup, xd) {
  const L = flecha(tipo), medio = (sup.arriba + sup.abajo) / 2;
  poner(ctx, L, enGrilla(xd - L.an * PASO), enGrilla(medio - ALTO[tipo] - (L.al * PASO) / 2));
}

/** El poste de allá, entero hasta el suelo: antes que el tren, que lo tapa salvo en los huecos. */
export function cruceDetras(ctx, ob, sup, base, noche) {
  const m = medidas(ob, sup, base), grueso = ob.tipo === 'agachar' ? POSTE_GRUESO : POSTE_FINO, poste = grueso === POSTE_GRUESO ? [0, 4, 5, 3, 0] : [0, 4, 0];
  const y0 = filaLinea(AN - 1) - 1, al = m.sueloAlla + 1 - y0;
  const L = guardado(['posteAlla', ob.tipo, al, noche].join('|'), () => {
    const ind = new Int16Array(grueso * al);
    for (let y = 0; y < al; y++) for (let i = 0; i < grueso; i++) ind[y * grueso + i] = poste[i];
    return pintar(ind, grueso, al, luzDe(noche));
  });
  poner(ctx, L, m.x + (AN - grueso) * PASO, m.yTop + y0 * PASO);
  pieDelPoste(ctx, ob.tipo, noche, m.x + (AN - grueso) * PASO, m.yTop + m.sueloAlla * PASO);
}

/**
 * La sombra sobre la chapa, justo debajo de la línea: lo que hace ver a qué altura va y por dónde cruza. Sólo cae donde hay
 * techo (`hayTecho(x)`): sobre el hueco de un enganche no tiene dónde apoyarse.
 */
export function sombraDelCruce(ctx, ob, sup, base, noche, hayTecho) {
  const m = medidas(ob, sup, base), caida = Math.round(ALTO[ob.tipo] / PASO);
  const L = guardado(['sombra', ob.tipo, noche].join('|'), () => {
    const al = FILA_MEDIO + 34, ind = new Int16Array(AN * al).fill(-1);
    for (let x = 0; x < AN; x++) for (let j = -1; j <= 1; j++) {
      const y = filaLinea(x) + (ob.tipo === 'saltar' ? comba(x) : 0) + j;
      if (y >= 0 && y < al && (x + y) % 2 === 0) ind[y * AN + x] = 31;
    }
    return pintar(ind, AN, al, luzDe(noche));
  });
  ctx.save();
  ctx.beginPath();
  for (let x = 0; x < AN; x++) if (hayTecho(m.x + x * PASO)) ctx.rect(m.x + x * PASO, sup.arriba, PASO, sup.abajo - sup.arriba);
  ctx.clip();
  poner(ctx, L, m.x, m.yTop + caida * PASO);
  ctx.restore();
}

/** El cable, o la viga con el cartel y el poste de acá. `tapa`: te pasa por delante. Devuelve dónde va el aviso. */
export function dibujarCruce(ctx, ob, sup, base, noche, tapa) {
  const m = medidas(ob, sup, base);
  const L = ob.tipo === 'agachar' ? lienzoPortico(m, noche) : lienzoCable(m, noche);
  poner(ctx, L, m.x, m.yTop);
  pieDelPoste(ctx, ob.tipo, noche, m.x, m.yTop + m.suelo * PASO);
  if (tapa) for (const [x, y, alto] of L.tramos) estiloNuevo.borrarGente(ctx, m.x + x * PASO, m.yTop + y * PASO, PASO, alto * PASO);
  return m.yCentro - 12;
}
