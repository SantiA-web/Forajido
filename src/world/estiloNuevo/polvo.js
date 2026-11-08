/**
 * 💨 EL POLVO DE LOS CASCOS, EN EL ESTILO NUEVO *(Santi: "quisiera que le agregaras más polvo detrás, que sea un poco
 * más densa"; eligió "en la grilla y más denso")*.
 *
 * Antes eran círculos lisos y transparentes (del dibujo viejo): no se apoyaban en la grilla de 3×3 y, como eran
 * transparentes, la nube nunca llegaba a cerrarse. Ahora cada bocanada es un dibujo en la grilla, opaco, que crece y
 * se deshace en 8 cuadros dibujados a mano, en dos tamaños (la bocanada grande y la chica). Lo transparente del final
 * está dibujado: la nube se agujerea punto por punto hasta quedar en granos sueltos.
 *
 * Letras: L la luz (arriba y a la derecha: el sol viene de allá y un poco de la derecha, como en el resto del afuera),
 * D el cuerpo, S la sombra (abajo y a la izquierda, lo que da a la cámara). Más claras que la arena pálida (37), así
 * se leen como tierra levantada; de noche, los escalones de luz del suelo.
 *
 * ⛈️ CON TORMENTA, BARRO *(Santi eligió "barro en vez de polvo")*: la arena mojada no vuela. Los cascos tiran
 * salpicones de barro (granos de uno o dos puntos, oscuros) que saltan para atrás, caen rápido y quedan un momento en
 * el suelo.
 *
 * Lo usa world/polvoDeCascos.js (el mismo polvo para el galope y la huida).
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { PALETA } from '../../engine/paleta.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;

const COLOR = { L: 17, D: 38, S: 36 };

/** LA BOCANADA GRANDE: 8 cuadros, de 6×4 a 19×11. */
const GRANDE = [
  [
    '..LL..',
    '.DDLL.',
    'SDDDDL',
    '.SSDD.',
  ],
  [
    '...LLL...',
    '..DDDLL..',
    '.DDDDDDL.',
    'SDDDDDDDL',
    'SSDDDDDD.',
    '.SSSSDD..',
  ],
  [
    '....LL.LL...',
    '..LLDDLDDL..',
    '.DDDDDDDDDL.',
    'DDDDDDDDDDLL',
    'SDDDDDDDDDDL',
    'SSDDDDDDDDD.',
    '.SSSDDDDDD..',
    '...SSSSS....',
  ],
  [
    '.....LLL.LL....',
    '...LLDDLLDDLL..',
    '..DDDDDDDDDDDL.',
    '.DDDDDDDDDDDDDL',
    'SDDDDDDDDDDDDDL',
    'SDDDDDDDDDDDDD.',
    'SSDDDDDDDDDDDD.',
    '.SSDDDDDDDDDD..',
    '..SSSSDDDSS....',
    '....SSS........',
  ],
  [
    '......LL..LLL....',
    '...LLLDDLLDDDLL..',
    '..LDDDDDDDDDDDDL.',
    '.DDDDDDDDDDDDDDDL',
    'DDDDDDDDDDDDDDDDL',
    'SDDDDDDDDDDDDDDD.',
    'SDDDDDDDDDDDDDDD.',
    'SSDDDDDDDDDDDDD..',
    '.SSDDDDDDDDDDDS..',
    '..SSSSDDDDSSS....',
    '.....SSSS........',
  ],
  [
    '.......L...LL.....',
    '...LL.LDDLLDDL.L..',
    '..LDDDDDD.DDDDDL..',
    '.DDD.DDDDDDD.DDDL.',
    'DDDDDDD.DDDDDDDDDL',
    'SDD.DDDDDD.DDDDDD.',
    'SDDDDD.DDDDDDD.DD.',
    '.SDDDDDDD.DDDDDD..',
    '.SSD.DDDDDDD.DS...',
    '..SSSS.DD.SSS.....',
    '.....S..S.........',
  ],
  [
    '........L....L.....',
    '..L..L.LD.L.DL..L..',
    '...DD.D.DD.DD.DL...',
    '.D.D.DD.D.DD.D.D.L.',
    'D.DD.D.DD.D.DD.DD..',
    '.D.DD.DD.D.DD.D.D.L',
    'S.D.D.D.DD.D.DD.D..',
    '.S.DD.D.D.DD.D.D...',
    '..S.D.DD.D.D.S.....',
    '...S.S..D..S.......',
    '...................',
  ],
  [
    '.........L.........',
    '...L.....D....L....',
    '.....D........D..L.',
    '..D.....D...D......',
    'D.....D.....D....D.',
    '...D.......D...D...',
    '.S....D..D.....D...',
    '....D.......D......',
    '..S.....D.....S....',
    '......S............',
    '...................',
  ],
];

/** LA BOCANADA CHICA: 8 cuadros, de 4×3 a 11×7. */
const CHICA = [
  [
    '.LL.',
    'DDDL',
    '.SS.',
  ],
  [
    '..LL..',
    '.DDDL.',
    'SDDDDL',
    '.SSD..',
  ],
  [
    '..LLL...',
    '.DDDDLL.',
    'SDDDDDDL',
    'SSDDDDD.',
    '.SSSS...',
  ],
  [
    '...LL.L..',
    '.LDDDLDL.',
    'DDDDDDDDL',
    'SDDDDDDDL',
    '.SSDDDDD.',
    '..SSSS...',
  ],
  [
    '...LLL.L..',
    '.LDDDDLDL.',
    'DDDDDDDDDL',
    'SDDDDDDDDL',
    'SSDDDDDDD.',
    '.SSSSDD...',
  ],
  [
    '....L..L...',
    '.LDDD.LDL..',
    'DDD.DDDDDL.',
    'SDDDDD.DDDL',
    'SD.DDDDDD..',
    '.SSDD.DS...',
    '...SS......',
  ],
  [
    '....L......',
    '..D.D.L.L..',
    '.D.DD.D.D..',
    'S.D.D.DD.DL',
    '.D.D.D.D...',
    '..S.D.S....',
    '...........',
  ],
  [
    '.....L.....',
    '..D.....L..',
    '....D.D....',
    '.D.......D.',
    '...D..D....',
    '..S.....S..',
    '...........',
  ],
];

export const BOCANADAS = [GRANDE, CHICA];

/** El barro: el grano oscuro y el más claro (el que agarra la luz). */
const BARRO = [3, 4];

const guardados = new Map();
function lienzo(v, k, luz) {
  const clave = v + '|' + k + '|' + luz;
  if (guardados.has(clave)) return guardados.get(clave);
  const mapa = BOCANADAS[v][k];
  const an = mapa[0].length, al = mapa.length;
  const indices = new Int16Array(an * al).fill(-1);
  mapa.forEach((fila, j) => {
    for (let i = 0; i < an; i++) if (fila[i] !== '.') indices[j * an + i] = COLOR[fila[i]];
  });
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: an, alto: al, indices, campo: () => luz }), an, al), 0, 0);
  const g = { img: cv, an, al };
  guardados.set(clave, g);
  return g;
}

/**
 * Una bocanada en (`x`, `y`) del mundo (su centro), en el cuadro que le toca por su edad (`t` de 0 a 1). `v`: 0 la
 * grande, 1 la chica.
 */
export function dibujarBocanada(ctx, x, y, t, v, noche) {
  // (Crece rápido al salir del casco y después se queda deshaciéndose: los primeros cuadros duran menos.)
  const k = Math.max(0, Math.min(7, Math.floor(Math.sqrt(t) * 8)));
  const L = lienzo(v, k, noche ? CONFIG.tresCuartos.sueloNoche : 0);
  const px = Math.round(x / PASO - L.an / 2) * PASO, py = Math.round(y / PASO - L.al / 2) * PASO;
  ctx.drawImage(L.img, px, py, L.an * PASO, L.al * PASO);
}

/**
 * ☁️ LA NUBE EN EL AIRE *(Santi: "quiero que se genere una nube de polvo en el aire, no solo que se marque en el
 * suelo... y cuando los jinetes estén juntos que se acumule una sola nube bien grande")*.
 *
 * Cada pisada suelta un copo (world/polvoDeCascos.js): una bola de tierra que sube del casco, se infla y se va
 * apagando. Acá no se dibujan uno por uno: se suman todos en un mismo campo, punto por punto de la grilla, y se pinta
 * lo que pasa de cierto espesor. Por eso los copos de un caballo se pegan en una tira, y los de varios caballos juntos
 * se suman en UNA nube más grande y más cerrada.
 *
 * ⚠️ La forma sale de una cuenta, no de un dibujo a mano: tiene que poder juntarse con la de cualquier otro caballo.
 * Lo dibujado son los colores de siempre del polvo (L la luz arriba a la derecha, D el cuerpo, S la sombra abajo a la
 * izquierda) y la trama de huecos.
 *
 * TAPA A MEDIAS *(Santi eligió "tapa a medias": "al jinete se lo ve entre la tierra")*: va encima de los caballos,
 * pero con huecos en trama (fija en el mundo, así no tiembla al moverse la cámara). Donde es fina tiene más huecos; ni
 * la más espesa se cierra del todo (`AIRE.cubre`).
 */
export const AIRE = {
  /** Desde qué espesor aparece el primer punto, y cuánto más hace falta para el más cerrado. */
  desde: 0.3, rango: 0.9,
  /** De los 16 escalones de la trama, cuántos se llegan a pintar como mucho (13: siempre queda un hueco de cada 5). */
  cubre: 13,
  /** Cuánto se achata la bola (alto / ancho). */
  chato: 0.75,
  /**
   * 🔁 Desde qué espesor se cierra del todo, sin huecos *(Santi: "la nube de polvo grande literal, y que tape lo que se
   * ponga entremedio")*: la del grupo llega y tapa; la de un caballo solo no llega y sigue con su trama.
   */
  solido: 2.0,
  /** De qué tamaño son las manchas del ruido del borde, en puntos de la grilla. */
  grano: 7,
};
const TRAMA = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Un ruido suave de 0 a 1, el mismo para el mismo lugar del mundo (dos escalas sumadas). */
function ruido(x, y) {
  const h = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  const capa = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  return capa(x, y) * 0.65 + capa(x * 2.3 + 17, y * 2.3 + 5) * 0.35;
}
/** (🔁 Más clara que las bocanadas del suelo: con la sombra de ellas, 36 y después 37, la nube se perdía contra la tierra y la pelota parecía una media luna.) */
const COLOR_AIRE = { L: 17, D: 38, S: 16 };
let lienzoAire = null;
/**
 * Pinta la nube de todos los copos juntos. `copos`: [{ x, y, r, s }] (centro en el mundo, radio, espesor de 0 a 1);
 * `celda`: el punto de la grilla en unidades del mundo (el del dibujo cercano o el doble, el del chico).
 */
export function dibujarNubeDeAire(ctx, copos, noche, celda) {
  if (!copos.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of copos) {
    x0 = Math.min(x0, c.x - c.r); x1 = Math.max(x1, c.x + c.r);
    y0 = Math.min(y0, c.y - c.r * (c.chato ?? AIRE.chato)); y1 = Math.max(y1, c.y + c.r * (c.chato ?? AIRE.chato));
  }
  const i0 = Math.floor(x0 / celda) - 1, j0 = Math.floor(y0 / celda) - 1;
  const W = Math.min(900, Math.ceil(x1 / celda) + 2 - i0), H = Math.min(600, Math.ceil(y1 / celda) + 2 - j0);
  if (W <= 0 || H <= 0) return;
  const campo = new Float32Array(W * H);
  for (const c of copos) {
    if (c.s <= 0.02) continue;
    const ry = c.r * (c.chato ?? AIRE.chato);
    const a0 = Math.max(0, Math.floor((c.x - c.r) / celda) - i0), a1 = Math.min(W - 1, Math.ceil((c.x + c.r) / celda) - i0);
    const b0 = Math.max(0, Math.floor((c.y - ry) / celda) - j0), b1 = Math.min(H - 1, Math.ceil((c.y + ry) / celda) - j0);
    for (let j = b0; j <= b1; j++) {
      const dy = ((j + j0 + 0.5) * celda - c.y) / ry;
      for (let i = a0; i <= a1; i++) {
        const dx = ((i + i0 + 0.5) * celda - c.x) / c.r;
        const d = 1 - dx * dx - dy * dy;
        if (d > 0) campo[j * W + i] += c.s * d;
      }
    }
  }
  // 🔁 El borde comido *(Santi: "la nube se ve muy perfecta, muy circular")*: un ruido suave, fijo en el mundo (no
  // tiembla con la cámara), que adelgaza la nube en unos lados y la engorda en otros.
  // (El ruido decide sólo hasta dónde llega la nube; la luz y la sombra salen de la forma sin ruido: con el ruido
  // adentro, la nube quedaba manchada como un camuflaje.)
  const indices = new Int16Array(W * H).fill(-1);
  const v = (i, j) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : campo[j * W + i]);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const limpio = campo[j * W + i];
    if (limpio <= 0) continue;
    const val = limpio * (0.55 + 0.9 * ruido((i + i0) / AIRE.grano, (j + j0) / AIRE.grano));
    if (val < AIRE.desde) continue;
    const t = TRAMA[((j + j0) & 3) * 4 + ((i + i0) & 3)];
    if (val < AIRE.solido && (t >= AIRE.cubre || val < AIRE.desde + (AIRE.rango * (t + 0.5)) / 16)) continue;
    // La luz viene de arriba a la derecha: el lado de la bola que mira para allá, claro; el de abajo a la izquierda, sombra.
    // (🔁 Estaba al revés: la luz salía abajo a la izquierda. Y se mide a tres puntos, no a uno: con los bultos de la
    // pelota, la cuenta de cerca hacía estrellas de luz adentro.)
    const P = 3, gx = v(i + P, j) - v(i - P, j), gy = v(i, j + P) - v(i, j - P);
    const hacia = -gx + gy, largo = Math.hypot(gx, gy);
    indices[j * W + i] = largo > 0.12 && hacia > 0.5 * largo ? COLOR_AIRE.L : largo > 0.12 && hacia < -0.5 * largo ? COLOR_AIRE.S : COLOR_AIRE.D;
  }
  if (!lienzoAire) lienzoAire = document.createElement('canvas');
  if (lienzoAire.width !== W || lienzoAire.height !== H) { lienzoAire.width = W; lienzoAire.height = H; }
  const luz = noche ? CONFIG.tresCuartos.sueloNoche : 0;
  lienzoAire.getContext('2d').putImageData(new ImageData(iluminar({ ancho: W, alto: H, indices, campo: () => luz }), W, H), 0, 0);
  const suave = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lienzoAire, i0 * celda, j0 * celda, W * celda, H * celda);
  ctx.imageSmoothingEnabled = suave;
}

/** Un grano de barro: uno o dos puntos, apoyado en la grilla. */
export function dibujarGrano(ctx, x, y, grande, claro, noche) {
  // (De noche, un escalón más oscuro: el claro pasa a ser el oscuro de día y el oscuro, casi negro.)
  ctx.fillStyle = PALETA[noche ? (claro ? 3 : 1) : BARRO[claro ? 1 : 0]];
  const px = Math.round(x / PASO) * PASO, py = Math.round(y / PASO) * PASO;
  ctx.fillRect(px, py, PASO * (grande ? 2 : 1), PASO);
}
