/**
 * ⛏️ LA GÓNDOLA, EN EL ESTILO NUEVO *(Santi eligió "chapa y carbón", "el carbón se corre", y los cuatro detalles: el polvo al
 * viento, las huellas en el carbón, la pala y la carretilla, y el rótulo de la mina)*.
 *
 * Sigue sin adentro, con las reglas de antes: el piso ES la superficie del carbón, se sube y se baja por los enganches, y los
 * jinetes no te alcanzan porque desde afuera las paredes son altas.
 *
 *  - LOS COSTADOS, de chapa negra remachada, con óxido en las uniones. Desde adentro se ve poco: el carbón llega casi hasta arriba.
 *  - EL CARBÓN: terrones a mano (`TERRONES`) repartidos por código sobre el fondo, más pisado en el pasillo.
 *  - LOS MONTÍCULOS ('M', data/wagons.js): cada uno es una lista de terrones puestos a mano sobre su silueta. Como se corren con los
 *    frenos rotos (`gondola` en world/caidas.js), su estado vive en `train._monticulos`: el dibujo se rehace y no se puede perder.
 *    Hundirse y crecer es por código: el mismo dibujo, entrando en el carbón, en ocho cuadros.
 *  - EL RÓTULO de la mina por fuera, sobre una tapa lisa.
 *  - LO HONDO *(Santi: "no es un poquito de carbón, hay bastante abajo de lo que estamos viendo en la superficie, y quiero que se note")*:
 *    el corte en las puntas, donde se ve el carbón en capas al bajar hacia la chapa, y los pozos que deja el montón que se corre
 *    (`cuadrosDelPozo`). Lo de hundirse hasta la pantorrilla está en world/caidas.js (`dibujarPiesEnCarbon`).
 *
 * LA LUZ, como en la plataforma: de día, sol pleno; de noche, la luna, que en el carbón se ve azul.
 */
import { CONFIG } from '../../data/config.js';
import { WAGONS } from '../../data/wagons.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';
import { pintarSuelo } from './suelo.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;

/**
 * Los terrones, con cantos: la luz les viene de arriba a la izquierda. 🔁 Redondos y en filas parejas, el montón parecía una pila de
 * balas de cañón: el carbón se parte en pedazos con punta.
 */
export const TERRONES = [
  ['...oooo..', '.oohhlmo.', 'ohhllmmmo', 'oollmmmdo', '.ommmdddo', '.oomddoo.', '...ooo...'],
  ['.oooo..', 'ohhlmo.', 'olllmmo', '.ommddo', '.oodoo.', '...o...'],
  ['....ooo....', '..oohhmoo..', '.ohhhllmmo.', 'ohhlllmmmdo', 'ollllmmmddo', '.oommmdddoo', '...oomdoo..', '.....oo....'],
  ['oooooo..', 'ohhllmoo', 'ollmmmdo', '.ommddoo', '..oooo..'],
  ['oo...', 'ohloo', 'ommdo', '.ooo.'],
  ['..oo..', '.ohmo.', '.ohlmo', 'ohllmo', 'ollmdo', 'olmmdo', '.omdo.', '..oo..'],
];
/**
 * Los colores del carbón: el negro con su brillo, y el azulado. De noche, la luna.
 * 🔁 Mate, de punta a punta *(Santi: "con tanto brillo parece más un mineral como metal que carbón, sobre todo de noche")*: los
 * grises y azules claros salieron de todas las tablas.
 */
export const COL_CARBON = { o: 0, h: 23, l: 31, m: 1, d: 1 };
export const COL_AZULADO = { o: 0, h: 41, l: 31, m: 1, d: 1 };
export const COL_LUNA = { o: 0, h: 41, l: 18, m: 40, d: 40 };
const COL_ALTO = { o: 0, h: 24, l: 23, m: 31, d: 1 };
const COL_ALTO_LUNA = { o: 0, h: 19, l: 41, m: 18, d: 40 };
const COL_SOMBRA = { o: 0, h: 31, l: 1, m: 1, d: 1 };
const COL_SOMBRA_LUNA = { o: 0, h: 18, l: 40, m: 40, d: 40 };

/**
 * EL MONTÍCULO GRANDE (tres casillas) Y EL CHICO (dos): la silueta, en celdas de cuatro puntos, y los terrones, a mano, de atrás
 * para adelante: [x, y, cuál]. Los del frente, en la sombra.
 */
/**
 * 🪜 LA ESCALERA DE SOGA *(Santi: "de esas de mano pero que tienen soga en vez de madera, así se nota (vuela casi como una bandera)")*:
 * atada arriba de la pared, en las dos puntas.
 * 🔁 *(Santi: "dije 'casi' como una bandera. El movimiento debería ser más estructurado y detenido. No es tela: son tablas de madera
 * agarradas con una soga gruesa")*: las tablas no se doblan; la escalera entera sube despacio con el viento, se queda arriba, y baja.
 * a, c: la soga, luz y sombra; m, d: la tabla, luz y sombra; n: el nudo. El orden en que se pasan, en `POSES_ESCALERA`.
 */
const ESCALERA = [
  [
    '...............................',
    '...............................',
    '........................md..aan',
    '.................md..aaaaaaaccn',
    '..........md..aaaaaaaccccccc..n',
    '...md..aaaaaaaccccccc...md....n',
    'aaaaaaaccccccc...md.....md....n',
    'ccccccc...md.....md.....md....n',
    '...md.....md.....md.....md..aan',
    '...md.....md.....md..aaaaaaaccn',
    '...md.....md..aaaaaaaccccccc...',
    '...md..aaaaaaaccccccc...md.....',
    'aaaaaaaccccccc...md............',
    'ccccccc...md...................',
    '...md..........................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '...............................',
    '........................md..aan',
    '.................md..aaaaaaaccn',
    '...md.....md..aaaaaaaccccccc..n',
    'aaaaaaaaaaaaaaccccccc...md....n',
    'cccccccccccccc...md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md..aan',
    '...md.....md.....md..aaaaaaaccn',
    '...md.....md..aaaaaaaccccccc...',
    'aaaaaaaaaaaaaaccccccc...md.....',
    'cccccccccccccc...md............',
    '...md.....md...................',
    '...............................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '...............................',
    '.................md.....md..aan',
    '..........md..aaaaaaaaaaaaaaccn',
    '...md..aaaaaaacccccccccccccc..n',
    'aaaaaaaccccccc...md.....md....n',
    'ccccccc...md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md..aan',
    '...md.....md..aaaaaaaaaaaaaaccn',
    '...md..aaaaaaacccccccccccccc...',
    'aaaaaaaccccccc...md.....md.....',
    'ccccccc...md...................',
    '...md..........................',
    '...............................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '........................md.....',
    '.................md..aaaaaaaaan',
    '...md.....md..aaaaaaacccccccccn',
    'aaaaaaaaaaaaaaccccccc...md....n',
    'cccccccccccccc...md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md..aaaaaaaaan',
    '...md.....md..aaaaaaacccccccccn',
    'aaaaaaaaaaaaaaccccccc...md.....',
    'cccccccccccccc...md............',
    '...md.....md...................',
    '...............................',
    '...............................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '........................md.....',
    '...md.....md.....md..aaaaaaaaan',
    'aaaaaaaaaaaaaaaaaaaaacccccccccn',
    'ccccccccccccccccccccc...md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md..aaaaaaaaan',
    'aaaaaaaaaaaaaaaaaaaaacccccccccn',
    'ccccccccccccccccccccc...md.....',
    '...md.....md.....md............',
    '...............................',
    '...............................',
    '...............................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '........................md.....',
    '..........md.....md..aaaaaaaaan',
    '...md..aaaaaaaaaaaaaacccccccccn',
    'aaaaaaacccccccccccccc...md....n',
    'ccccccc...md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md..aaaaaaaaan',
    '...md..aaaaaaaaaaaaaacccccccccn',
    'aaaaaaacccccccccccccc...md.....',
    'ccccccc...md.....md............',
    '...md..........................',
    '...............................',
    '...............................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '...............................',
    '.................md.....md..aan',
    '...md.....md..aaaaaaaaaaaaaaccn',
    'aaaaaaaaaaaaaacccccccccccccc..n',
    'cccccccccccccc...md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md..aan',
    '...md.....md..aaaaaaaaaaaaaaccn',
    'aaaaaaaaaaaaaacccccccccccccc...',
    'cccccccccccccc...md.....md.....',
    '...md.....md...................',
    '...............................',
    '...............................',
    '...............................',
    '...............................',
  ],
  [
    '...............................',
    '...............................',
    '........................md..aan',
    '..........md.....md..aaaaaaaccn',
    '...md..aaaaaaaaaaaaaaccccccc..n',
    'aaaaaaacccccccccccccc...md....n',
    'ccccccc...md.....md.....md....n',
    '...md.....md.....md.....md....n',
    '...md.....md.....md.....md..aan',
    '...md.....md.....md..aaaaaaaccn',
    '...md..aaaaaaaaaaaaaaccccccc...',
    'aaaaaaacccccccccccccc...md.....',
    'ccccccc...md.....md............',
    '...md..........................',
    '...............................',
    '...............................',
    '...............................',
  ],
];
// (Se queda abajo y arriba: repetidos a propósito. Y al usarla, baja de una a la primera pose y se queda quieta: ver `w._usoEscalera`.)
const POSES_ESCALERA = [0, 0, 0, 1, 2, 3, 4, 4, 4, 5, 6, 7];

const MONTONES = {
  // (🔁 Una loma con la ladera en pendiente, despareja y más ancha que su casilla abajo: con costados rectos parecía un bloque *(Santi: "las pilas creo que no deberían ser tan cuadradas")*.)
  3: {
    ancho: 80, alto: 60,
    silueta: [
      '.......XXX..........',
      '......XXXXX.XX......',
      '.....XXXXXXXXXXX....',
      '....XXXXXXXXXXXXX...',
      '....XXXXXXXXXXXXXX..',
      '...XXXXXXXXXXXXXXX..',
      '...XXXXXXXXXXXXXXXX.',
      '..XXXXXXXXXXXXXXXXX.',
      '..XXXXXXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXXXXXXXX',
      '...XXXXXXXXXXXXXXX..',
    ],
    terrones: [
      [30, 0, 5], [26, 4, 1], [35, 5, 3], [50, 5, 4],
      [21, 9, 2], [30, 10, 0], [40, 9, 5], [50, 10, 1], [58, 9, 3],
      [16, 15, 1], [24, 16, 0], [34, 15, 2], [45, 16, 0], [55, 15, 5], [63, 14, 1],
      [12, 22, 2], [21, 23, 3], [29, 22, 5], [38, 24, 0], [48, 23, 2], [58, 22, 1], [67, 21, 4],
      [8, 30, 0], [17, 31, 1], [25, 30, 2], [35, 31, 0], [43, 32, 3], [52, 30, 5], [62, 31, 0], [71, 30, 1],
      [3, 38, 2], [12, 39, 0], [21, 40, 3], [29, 38, 2], [39, 40, 0], [48, 39, 1], [57, 38, 2], [67, 39, 1], [72, 37, 3],
      [0, 46, 1], [8, 47, 2], [18, 47, 0], [28, 48, 3], [37, 47, 2], [47, 48, 0], [56, 46, 2], [66, 47, 4], [71, 46, 0],
      [6, 54, 3], [15, 54, 4], [24, 53, 0], [34, 54, 3], [44, 54, 4], [53, 53, 0], [63, 54, 3],
    ],
  },
  2: {
    ancho: 56, alto: 52,
    silueta: [
      '......XXX.....',
      '.....XXXXX....',
      '....XXXXXXX...',
      '...XXXXXXXXX..',
      '...XXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '.XXXXXXXXXXXXX',
      '.XXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXX',
      '..XXXXXXXXXXX.',
    ],
    terrones: [
      [24, 0, 5], [20, 5, 1], [28, 6, 3], [16, 10, 2], [25, 11, 0], [34, 10, 1], [11, 16, 0], [20, 17, 3], [29, 16, 5], [38, 17, 1],
      [8, 24, 2], [17, 25, 0], [26, 24, 2], [36, 25, 0], [45, 23, 1], [4, 32, 1], [11, 33, 2], [22, 32, 0], [31, 33, 3], [40, 32, 2], [49, 31, 1],
      [0, 39, 3], [8, 40, 0], [18, 40, 2], [28, 40, 0], [38, 39, 3], [47, 39, 0], [6, 46, 3], [15, 45, 0], [25, 46, 4], [34, 45, 0], [44, 46, 3],
    ],
  },
};

/** Letras de 5 de alto para el rótulo. */
const LETRAS = {
  M: ['o...o', 'oo.oo', 'o.o.o', 'o...o', 'o...o'], I: ['ooo', '.o.', '.o.', '.o.', 'ooo'], N: ['o..o', 'oo.o', 'o.oo', 'o..o', 'o..o'],
  A: ['.oo.', 'o..o', 'oooo', 'o..o', 'o..o'], L: ['o..', 'o..', 'o..', 'o..', 'ooo'], E: ['ooo', 'o..', 'oo.', 'o..', 'ooo'],
  G: ['.ooo', 'o...', 'o.oo', 'o..o', '.ooo'], R: ['ooo.', 'o..o', 'ooo.', 'o.o.', 'o..o'],
};

/** Los pozos que deja un montículo al correrse: la silueta, a mano, de a cuatro puntos. Lo de adentro, por código, a escalones. */
const POZOS = {
  3: { ancho: 64, alto: 44, silueta: [
    '.....XXXXXX.....',
    '...XXXXXXXXXXX..',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXX.',
    '...XXXXXXXXXXX..',
    '.....XXXXXXXX...',
  ] },
  2: { ancho: 44, alto: 44, silueta: [
    '...XXXXX...',
    '.XXXXXXXXX.',
    '.XXXXXXXXXX',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    '.XXXXXXXXXX',
    '.XXXXXXXXX.',
    '...XXXXXX..',
  ] },
};

const NADA = document.createElement('canvas');
NADA.width = NADA.height = 1;

/** Los montículos de este vagón, leídos una sola vez del plano. Es el estado que la caída va corriendo. */
export function monticulosDe(train, w, cols) {
  const todos = train._monticulos || (train._monticulos = {});
  if (todos[w.index]) return todos[w.index];
  const lista = [], plano = WAGONS.gondola.layout, en = (c, f) => (plano[f] || [])[c];
  for (let f = 0; f < plano.length; f++) for (let c = 0; c < cols; c++) {
    if (en(c, f) !== 'M' || en(c - 1, f) === 'M' || en(c, f - 1) === 'M') continue;
    let ca = c; while (en(ca + 1, f) === 'M') ca++;
    lista.push({ c, f, an: ca - c + 1, filas: 2, estado: 'quieto', t: 0, hacia: c, desde: null, llego: true, dir: 1 });
  }
  return (todos[w.index] = lista);
}

/** El montón entero, ya iluminado, y sus ocho cuadros de hundirse en el carbón. */
function cuadrosDelMonton(an, dia) {
  const M = MONTONES[an], ind = new Int16Array(M.ancho * M.alto).fill(-1);
  const pa = (x, y, i) => { if (x >= 0 && y >= 0 && x < M.ancho && y < M.alto) ind[y * M.ancho + x] = i; };
  const base = dia ? 31 : 18, canto = dia ? 1 : 40;
  // (🔁 La silueta, suavizada de una celda a la otra y con el borde desparejo: a escalones, el montón parecía una tumba.)
  const extremos = M.silueta.map((fila) => [fila.indexOf('X') * 4, (fila.lastIndexOf('X') + 1) * 4]);
  for (let y = 0; y < M.alto; y++) {
    const j = Math.min(extremos.length - 1, Math.floor(y / 4)), sig = extremos[Math.min(extremos.length - 1, j + 1)], f = (y % 4) / 4;
    const xa = extremos[j][0] + (sig[0] - extremos[j][0]) * f, xb = extremos[j][1] + (sig[1] - extremos[j][1]) * f;
    const salto = hash(Math.floor(y / 2), an) * 4 - 2, salto2 = hash(Math.floor(y / 2) + 40, an) * 4 - 2;
    for (let x = Math.round(xa + salto); x < Math.round(xb + salto2); x++) pa(x, y, base);
  }
  // (El sol, de arriba a la izquierda: arriba, lo que más brilla; abajo y a la derecha, en la sombra.)
  const colDe = (x, y, n) => {
    const frente = y > M.alto * 0.82 || x / M.ancho + y / M.alto > 1.4, alto = !frente && y < M.alto * 0.46;
    return dia ? (frente ? COL_SOMBRA : alto ? COL_ALTO : n % 5 === 0 ? COL_AZULADO : COL_CARBON) : (frente ? COL_SOMBRA_LUNA : alto ? COL_ALTO_LUNA : COL_LUNA);
  };
  // (El canto de cada terrón, del oscuro del carbón y no negro: negro, se separaban como bolitas.)
  const poner = (x, y, k, n, soloAdentro) => TERRONES[k].forEach((fila, j) => { for (let q = 0; q < fila.length; q++) {
    if (fila[q] === '.' || (soloAdentro && ind[(y + j) * M.ancho + x + q] !== base && ind[(y + j) * M.ancho + x + q] < 0)) continue;
    pa(x + q, y + j, fila[q] === 'o' ? canto : colDe(x, y, n)[fila[q]]);
  } });
  // 🔁 Primero, de relleno y por código, terrones por todo el montón hasta el borde: si no, la orilla quedaba lisa y parecía una cueva.
  const relleno = Math.round((M.ancho * M.alto) / 16);
  for (let n = 0; n < relleno; n++) {
    const x = Math.floor(hash(n, an * 3) * M.ancho) - 3, y = Math.floor(hash(n, an * 5 + 1) * M.alto) - 2;
    if (x < 0 || y < 0 || x + 11 >= M.ancho || y + 8 >= M.alto || ind[(y + 3) * M.ancho + x + 3] < 0) continue;
    poner(x, y, Math.floor(hash(n, an * 7 + 2) * TERRONES.length), n, true);
  }
  M.terrones.forEach(([x, y, k], n) => poner(x, y, k, n, false));
  // (La orilla de abajo, curva y despareja: derecha, era el otro lado del cuadrado.)
  for (let x = 0; x < M.ancho; x++) {
    const f = (x - M.ancho / 2) / (M.ancho / 2), hasta = M.alto - 1 - Math.round(5 * f * f) - Math.floor(hash(Math.floor(x / 5), an + 90) * 3);
    for (let y = hasta + 1; y < M.alto; y++) ind[y * M.ancho + x] = -1;
  }
  // El contorno negro, sólo por fuera de todo el montón.
  const copia = ind.slice(), lleno = (x, y) => x >= 0 && y >= 0 && x < M.ancho && y < M.alto && copia[y * M.ancho + x] >= 0;
  for (let y = 0; y < M.alto; y++) for (let x = 0; x < M.ancho; x++) if (lleno(x, y) && !(lleno(x - 1, y) && lleno(x + 1, y) && lleno(x, y - 1) && (lleno(x, y + 1) || y >= M.alto - 7))) ind[y * M.ancho + x] = 0;
  // (Donde apoya, su sombra sobre el carbón: es lo que dice hasta dónde llega y dónde se choca.)
  for (let x = 0; x < M.ancho; x++) {
    let y = M.alto - 1;
    while (y >= 0 && !lleno(x, y)) y--;
    for (let q = 0; q < 3 && y - q >= 0; q++) if (hash(x, y - q + an) < 0.8) ind[(y - q) * M.ancho + x] = 0;
  }
  const entero = document.createElement('canvas'); entero.width = M.ancho; entero.height = M.alto;
  entero.getContext('2d').putImageData(new ImageData(iluminar({ ancho: M.ancho, alto: M.alto, indices: ind, marcas: new Uint8Array(M.ancho * M.alto), campo: () => 0 }), M.ancho, M.alto), 0, 0);
  const cuadros = [];
  for (let k = 0; k < 8; k++) {
    const cv = document.createElement('canvas'); cv.width = M.ancho; cv.height = M.alto;
    cv.getContext('2d').drawImage(entero, 0, Math.round((k / 8) * M.alto));
    cuadros.push(cv);
  }
  return cuadros;
}

/**
 * 🕳️ EL POZO, iluminado, y sus ocho cuadros de abrirse. Se mira desde arriba y de frente, así que se ve la pared de allá y los
 * costados, bajando a escalones hasta lo negro; la orilla de acá tapa lo demás, con los terrones más altos y más claros.
 */
function cuadrosDelPozo(an, dia) {
  const M = POZOS[an], ind = new Int16Array(M.ancho * M.alto).fill(-1);
  const extremos = M.silueta.map((fila) => [fila.indexOf('X') * 4, (fila.lastIndexOf('X') + 1) * 4]);
  const izq = new Int16Array(M.alto), der = new Int16Array(M.alto);
  for (let y = 0; y < M.alto; y++) {
    const j = Math.min(extremos.length - 1, Math.floor(y / 4)), sig = extremos[Math.min(extremos.length - 1, j + 1)], f = (y % 4) / 4;
    izq[y] = Math.round(extremos[j][0] + (sig[0] - extremos[j][0]) * f + hash(Math.floor(y / 2), an + 60) * 3 - 1.5);
    der[y] = Math.round(extremos[j][1] + (sig[1] - extremos[j][1]) * f + hash(Math.floor(y / 2), an + 70) * 3 - 1.5);
  }
  const adentro = (x, y) => y >= 0 && y < M.alto && x >= izq[y] && x < der[y];
  const arriba = new Int16Array(M.ancho).fill(-1), abajo = new Int16Array(M.ancho).fill(-1);
  for (let x = 0; x < M.ancho; x++) for (let y = 0; y < M.alto; y++) if (adentro(x, y)) { if (arriba[x] < 0) arriba[x] = y; abajo[x] = y; }
  // (Cuánto bajó ya cada punto: desde la orilla de allá y desde los costados, no desde la de acá.)
  const hondo = (x, y) => Math.min(y - arriba[x], (x - izq[y]) * 1.2, (der[y] - 1 - x) * 1.2) + hash(Math.floor(x / 3), Math.floor(y / 3) + an) * 2;
  // (🔁 Cada escalón con su borde iluminado y su pared oscura: de un solo tono, el pozo era una mancha negra.)
  const BORDES = dia ? [23, 31, 1, 1, 0] : [41, 18, 40, 40, 0], PAREDES = dia ? [31, 1, 1, 0, 0] : [18, 40, 40, 0, 0];
  const TABLAS = dia
    ? [{ o: 1, h: 23, l: 31, m: 1, d: 1 }, { o: 1, h: 31, l: 1, m: 1, d: 0 }, { o: 0, h: 1, l: 1, m: 0, d: 0 }]
    : [{ o: 40, h: 41, l: 18, m: 40, d: 40 }, { o: 40, h: 18, l: 40, m: 40, d: 0 }, { o: 0, h: 40, l: 40, m: 0, d: 0 }];
  const ESCALON = 5;
  const nivel = (x, y) => Math.min(BORDES.length - 1, Math.floor(hondo(x, y) / ESCALON));
  for (let y = 0; y < M.alto; y++) for (let x = 0; x < M.ancho; x++) if (adentro(x, y)) {
    const lv = nivel(x, y);
    ind[y * M.ancho + x] = hondo(x, y) % ESCALON < 2 ? BORDES[lv] : PAREDES[lv];
  }
  const pa = (x, y, i) => { if (x >= 0 && y >= 0 && x < M.ancho && y < M.alto) ind[y * M.ancho + x] = i; };
  const estampar = (k, x, y, col, recortar) => TERRONES[k].forEach((fila, j) => { for (let q = 0; q < fila.length; q++) {
    if (fila[q] === '.' || (recortar && !adentro(x + q, y + j))) continue;
    pa(x + q, y + j, col[fila[q]]);
  } });
  // Terrones en las paredes, cada uno del oscuro de su escalón.
  const cuantos = Math.round((M.ancho * M.alto) / 70);
  for (let n = 0; n < cuantos; n++) {
    const x = Math.floor(hash(n, an * 11) * M.ancho), y = Math.floor(hash(n, an * 13 + 1) * M.alto);
    if (!adentro(x, y)) continue;
    const lv = nivel(x, y);
    if (lv < TABLAS.length) estampar(Math.floor(hash(n, an * 17) * TERRONES.length), x - 3, y - 2, TABLAS[lv], true);
  }
  // La orilla: arriba, terrones que están por caer; abajo, los que tapan el resto.
  for (let x = 1; x < M.ancho - 6; x += 6) {
    if (arriba[x] >= 0) estampar(hash(x, 5) < 0.5 ? 3 : 4, x, arriba[x] - 2, TABLAS[0], false);
    if (abajo[x] >= 0) estampar(hash(x, 7) < 0.5 ? 3 : 1, x, abajo[x] - 5, TABLAS[0], false);
  }
  const entero = document.createElement('canvas'); entero.width = M.ancho; entero.height = M.alto;
  const luz = iluminar({ ancho: M.ancho, alto: M.alto, indices: ind, marcas: new Uint8Array(M.ancho * M.alto), campo: () => 0 });
  const cuadros = [];
  for (let k = 0; k < 8; k++) {
    const datos = luz.slice(), lim = ((k + 1) / 8) * 1.45;
    for (let y = 0; y < M.alto; y++) for (let x = 0; x < M.ancho; x++) if (Math.hypot((x - M.ancho / 2) / (M.ancho / 2), (y - M.alto / 2) / (M.alto / 2)) > lim) datos[(y * M.ancho + x) * 4 + 3] = 0;
    const cv = document.createElement('canvas'); cv.width = M.ancho; cv.height = M.alto;
    cv.getContext('2d').putImageData(new ImageData(datos, M.ancho, M.alto), 0, 0);
    cuadros.push(cv);
  }
  return { cuadros, ancho: M.ancho, alto: M.alto };
}

export function vagonGondola(train, w, dia) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  const x0 = Math.floor(w.x / PASO) * PASO, yArriba = -tc.alturaPared;
  const yAbajo = map.rows * S + 2 * S;
  const W = Math.ceil((w.x + w.width - x0) * PX), H = Math.round((yAbajo - yArriba) * PX);
  const ax = (u) => Math.round((u - x0) * PX), ay = (u) => Math.round((u - yArriba) * PX);
  const cols = Math.round(w.width / S);
  const X = (c) => ax(w.x + c * S), Y = (f) => ay(f * S);
  const h = (a, b) => hash(a + w.colStart * 3, b);
  const NOCHE = tc.sueloNoche;
  const yRim = Y(0) - 4, yCarbon = Y(0) + 11, yAcá = Y(map.rows - 1), yCara = Y(map.rows) + 12, yBajo = yCara + 4;
  const enMundo = (x, y) => [x0 + x * PASO, yArriba + y * PASO];

  const capa = () => ({ i: new Int16Array(W * H).fill(-1), m: new Uint8Array(W * H) });
  const PISO = capa(), FRENTE = capa(), BOGIES = capa(), deLuna = new Uint8Array(W * H);
  const pone = (cp) => (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; cp.i[y * W + x] = i; };
  const rect = (cp) => { const p = pone(cp); return (x, y, ww, hh, i) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) p(x + q, y + j, i); }; };

  // ---- una chapa: paneles con su junta, remaches arriba y abajo, y el óxido que chorrea de las uniones
  const chapa = (p, y0, y1, cuerpo, junta) => {
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) p(x, y, x % 32 === 0 ? 0 : x % 32 === 1 ? junta : cuerpo);
    for (let x = 0; x < W; x += 32) {
      for (const dx of [-3, 4]) for (const y of [y0 + 2, y1 - 3]) p(x + dx, y, 24);
      const largo = 2 + Math.floor(h(x, 3) * (y1 - y0 - 3));
      for (let y = 0; y < largo; y++) if (h(x, y + 11) < 0.8) p(x + 2, y0 + 1 + y, y < largo / 2 ? 47 : 11);
    }
  };

  // ===== EL FONDO: la pared de allá, y el carbón, que le llega casi hasta el borde
  {
    const r = rect(PISO), p = pone(PISO);
    chapa(p, yRim + 3, yCarbon + 4, 31, 1);
    r(0, yRim - 1, W, 1, 0); r(0, yRim, W, 1, 24); r(0, yRim + 1, W, 1, 23); r(0, yRim + 2, W, 1, 0);
    const coal = (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; PISO.i[y * W + x] = i; deLuna[y * W + x] = 1; };
    // (🔁 De noche, más oscuro que los montones: son cobertura, y tienen que despegarse del piso.)
    const COLF = dia ? { o: 1, h: 23, l: 23, m: 31, d: 1 } : { o: 40, h: 18, l: 18, m: 40, d: 40 };
    const COLP = dia ? { o: 1, h: 31, l: 31, m: 1, d: 1 } : { o: 40, h: 40, l: 18, m: 40, d: 40 };
    const fondo = dia ? [31, 1] : [40, 40];
    // (A rayones cortos y corridos: el fondo entre los terrones.)
    for (let y = yCarbon; y < yAcá; y++) {
      const borde = Math.floor(h(Math.floor(y / 4), 7) * 3);
      for (let x = 0; x < W; x++) {
        if (y < yCarbon + 3 && h(Math.floor(x / 5), 19) * 3 > y - yCarbon + borde) continue;
        const fila = Math.floor(y / 2), m = h(Math.floor((x + h(fila, 9) * 40) / 7), fila);
        coal(x, y, m < 0.55 ? fondo[1] : fondo[0]);
      }
    }
    const yP0 = Y(4), yP1 = Y(6);
    const estampar = (k, x, y, col) => TERRONES[k].forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') coal(x + q, y + j, col[fila[q]]); });
    const cuantos = Math.round((W * (yAcá - yCarbon)) / 34);
    for (let n = 0; n < cuantos; n++) {
      const x = Math.floor(h(n, 3) * W) - 4, y = yCarbon + Math.floor(h(n, 7) * (yAcá - yCarbon - 5));
      // El pasillo, pisado: terrones chicos y apagados, y menos.
      const pasillo = y >= yP0 - 2 && y < yP1 - 4;
      if (pasillo && h(n, 13) > 0.55) continue;
      const k = pasillo ? (h(n, 17) < 0.5 ? 3 : 4) : Math.floor(h(n, 17) * TERRONES.length);
      estampar(k, x, y, pasillo ? COLP : COLF);
    }
    /**
     * ✂️ EL CORTE: en cada punta, el pasillo baja hasta la chapa baja. De este lado se ve la pared de carbón que queda, en capas, cada
     * vez más alta cuanto más cerca de la punta; es lo que dice que abajo hay mucho más.
     */
    // (De frente al corte da la sombra: es lo más oscuro del vagón, y por eso se ve.)
    const CAPAS = dia ? [1, 0, 1, 0, 0, 1] : [40, 0, 40, 0, 0, 40];
    const LUZ_CORTE = dia ? { o: 1, h: 24, l: 23, m: 31, d: 1 } : { o: 40, h: 19, l: 41, m: 18, d: 40 };
    const ROCA_CORTE = dia ? { o: 0, h: 23, l: 31, m: 1, d: 1 } : { o: 0, h: 41, l: 18, m: 40, d: 40 };
    const LARGO = 60, ALTO = 24;
    const altoDel = (q) => { const t = q / LARGO; return Math.round(ALTO * (1 - t) * (1 - t * 0.3) + (t < 0.95 ? h(Math.floor(q / 3), 37) * 4 - 2 : 0)); };
    for (const lado of [1, -1]) {
      const xDe = (q) => (lado > 0 ? 5 + q : W - 6 - q);
      for (let q = 0; q < LARGO; q++) {
        const t = q / LARGO, x = xDe(q), alto = Math.max(0, altoDel(q));
        // (🔁 Sin líneas: las rayas derechas parecían un andamio. Las capas, torcidas y hechas de terrones.)
        for (let j = 0; j < alto; j++) coal(x, yP0 + j, CAPAS[Math.floor((j + h(Math.floor(q / 6), 31 + lado) * 4) / 5) % CAPAS.length]);
        // El piso de la bajada, más negro cuanto más abajo.
        for (let y = yP0 + alto; y < yP1; y++) if (h(x, y) < (1 - t) * 0.85) coal(x, y, y < yP0 + alto + 3 ? 0 : dia ? 1 : 40);
      }
      // Los terrones que asoman de las capas, los de la orilla de arriba, los del piso y la barranca de acá.
      for (let n = 0; n < 26; n++) {
        const q = Math.floor(h(n, 53 + lado) * LARGO * 0.85), alto = Math.max(3, altoDel(q));
        estampar(Math.floor(h(n, 71) * 5), xDe(q) - 3, yP0 + Math.floor(h(n, 61 + lado) * (alto - 2)), ROCA_CORTE);
      }
      // (Salteados y a distintas alturas: parejos, eran una línea de rayitas.)
      for (let q = 0; q < LARGO; q += 4) {
        if (h(q, 67 + lado) < 0.7) estampar(Math.floor(h(q, 69) * 5), xDe(q) - 3, yP0 - 7 + Math.floor(h(q, 73) * 5), LUZ_CORTE);
        const tapa = (1 - q / LARGO) * 9;
        if (tapa > 1.5 && h(q, 77 + lado) < 0.6) estampar(h(q, 79) < 0.5 ? 3 : 0, xDe(q) - 3, yP1 - Math.round(tapa * (0.5 + h(q, 81) * 0.5)), ROCA_CORTE);
      }
      for (let n = 0; n < 8; n++) {
        const q = Math.floor(h(n, 83 + lado) * LARGO), alto = Math.max(0, altoDel(q));
        estampar(h(n, 89) < 0.5 ? 4 : 3, xDe(q) - 3, yP0 + alto + 2 + Math.floor(h(n, 97) * Math.max(1, yP1 - yP0 - alto - 8)), dia ? { o: 1, h: 31, l: 31, m: 1, d: 1 } : { o: 40, h: 18, l: 18, m: 40, d: 40 });
      }
    }
    // La sombra de debajo de la cara de afuera, sobre la viga.
    r(0, yCara, W, 1, 0); r(0, yCara + 1, W, yBajo - yCara - 1, 1);
  }

  // ===== LA CARA DE AFUERA: la chapa, alta, con el rótulo de la mina
  {
    const r = rect(FRENTE), p = pone(FRENTE);
    chapa(p, yAcá + 4, yCara, 23, 31);
    r(0, yAcá, W, 1, 0); r(0, yAcá + 1, W, 1, 25); r(0, yAcá + 2, W, 1, 24); r(0, yAcá + 3, W, 1, 0);
    r(0, yCara - 1, W, 1, 0);
    const texto = 'MINA LA NEGRA';
    const ancho = [...texto].reduce((s, ch) => s + (LETRAS[ch] ? LETRAS[ch][0].length + 1 : 3), 0) - 1;
    const ty = yAcá + 14;
    for (const cx of [Math.round(W / 4), Math.round((3 * W) / 4)]) {
      let tx = cx - Math.round(ancho / 2);
      // 🔁 Sobre una tapa lisa y sin desgaste: las juntas de la chapa y lo gastado le comían letras y no se leía.
      r(tx - 4, ty - 3, ancho + 8, 11, 0); r(tx - 3, ty - 2, ancho + 6, 9, 31);
      for (const ch of texto) {
        const L = LETRAS[ch];
        if (L) L.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] === 'o') p(tx + q, ty + j, 17); });
        tx += L ? L[0].length + 1 : 3;
      }
    }
  }

  // ===== LOS BOGIES
  {
    const r = rect(BOGIES);
    const rueda = (cx, cy) => {
      const R = 7;
      for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
        const d = Math.hypot(x, y);
        if (d > R + 0.4) continue;
        BOGIES.i[(cy + y) * W + cx + x] = d > R - 1 ? 0 : d > R - 2.5 ? (y < 0 ? 24 : 23) : d > 2 ? 31 : 23;
      }
    };
    for (const bc of [3, cols - 3]) {
      const cx = X(bc), cy = yBajo + 7;
      r(cx - 20, yBajo, 40, 6, 0); r(cx - 19, yBajo + 1, 38, 4, 31); r(cx - 19, yBajo + 1, 38, 1, 23);
      rueda(cx - 11, cy); rueda(cx + 11, cy);
      r(cx - 3, yBajo + 2, 6, 6, 0); r(cx - 2, yBajo + 3, 4, 4, 23);
    }
  }

  const lienzo = (datos, ww, hh) => {
    const cv = document.createElement('canvas'); cv.width = ww; cv.height = hh;
    cv.getContext('2d').putImageData(new ImageData(datos, ww, hh), 0, 0);
    return cv;
  };
  const campoPiso = dia ? (x, y) => (y > yAcá ? -1 : 0) : (x, y) => (deLuna[y * W + x] ? 0 : NOCHE);
  const resultado = {
    piso: [], altas: [],
    luz: (ux, uy) => Math.round(dia ? 0 : NOCHE + (ay(uy) > yAcá ? -1 : 0)),
  };
  // La tierra de debajo, en la sombra: la misma de afuera, pasando.
  {
    const vy = yBajo, vh = H - yBajo, [mx, my] = enMundo(0, vy);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = vh;
    const cx = cv.getContext('2d'), ind = new Int16Array(W * vh), marcas = new Uint8Array(W * vh);
    let hecho = null;
    resultado.piso.push({
      x: mx, y: my, w: W * PASO, h: vh * PASO, base: 0,
      get img() {
        const k = Math.round((estiloNuevo.desfile || 0) * PX);
        if (k !== hecho) {
          hecho = k;
          pintarSuelo(ind, W, vh, Math.round(mx / PASO), Math.round(my / PASO), k);
          cx.putImageData(new ImageData(iluminar({ ancho: W, alto: vh, indices: ind, marcas, campo: () => (dia ? -2 : -3) }), W, vh), 0, 0);
        }
        return cv;
      },
    });
  }
  resultado.piso.push({ img: lienzo(iluminar({ ancho: W, alto: H, indices: PISO.i, marcas: PISO.m, campo: campoPiso }), W, H), x: x0, y: yArriba, w: W * PASO, h: H * PASO, base: 0 });

  const recorte = (datos, x, y, ww, hh) => {
    const out = new Uint8ClampedArray(ww * hh * 4);
    for (let j = 0; j < hh; j++) out.set(datos.subarray(((y + j) * W + x) * 4, ((y + j) * W + x + ww) * 4), j * ww * 4);
    return out;
  };
  {
    const bo = iluminar({ ancho: W, alto: H, indices: BOGIES.i, marcas: BOGIES.m, campo: () => (dia ? -1 : NOCHE) });
    const [mx, my] = enMundo(0, yBajo);
    resultado.altas.push({ img: lienzo(recorte(bo, 0, yBajo, W, H - yBajo), W, H - yBajo), x: mx, y: my, w: W * PASO, h: (H - yBajo) * PASO, base: map.rows * S + 0.02 });
  }

  /**
   * ⛰️ LOS MONTÍCULOS: cada uno, dos piezas. La que está donde está (crece, si recién llegó) y la que se hunde donde estaba. Tiemblan
   * mientras esperan el golpe. (El estado lo mueve `gondola`, en world/caidas.js.)
   */
  const lista = monticulosDe(train, w, cols);
  w._monticulos = lista;
  const cuadros = { 3: cuadrosDelMonton(3, dia), 2: cuadrosDelMonton(2, dia) };
  for (const m of lista) {
    const Mo = MONTONES[m.an], cs = cuadros[m.an];
    const pxDe = (c) => X(c) + Math.round((m.an * (S * PX) - Mo.ancho) / 2);
    const yPt = Y(m.f + m.filas) + 2 - Mo.alto;
    const yW = yArriba + yPt * PASO, base = (m.f + m.filas) * S - 0.005;
    const avance = () => Math.min(1, m.t / CONFIG.caidas.gondola.dura);
    // ⚠️ El aviso: adonde se va a correr ya asoma la punta del montón, con los terrones que le llegan rodando (ver `avisarCarbon`).
    resultado.altas.push({
      w: Mo.ancho * PASO, h: Mo.alto * PASO, y: yW, base,
      get x() { return x0 + pxDe(m.hacia) * PASO; },
      get img() {
        if (m.estado !== 'aviso' && m.estado !== 'espera') return NADA;
        return (m.tAviso || 0) < CONFIG.caidas.gondola.reguero.tiempo / 2 ? cs[7] : cs[6];
      },
    });
    resultado.altas.push({
      w: Mo.ancho * PASO, h: Mo.alto * PASO, y: yW, base,
      get x() {
        const tiembla = (m.estado === 'aviso' || m.estado === 'espera') && Math.floor(performance.now() / 60) % 2 ? 1 : 0;
        return x0 + (pxDe(m.c) + tiembla) * PASO;
      },
      get img() { return m.estado === 'corre' ? cs[Math.max(0, 6 - Math.floor(avance() * 7))] : cs[0]; },
    });
    resultado.altas.push({
      w: Mo.ancho * PASO, h: Mo.alto * PASO, y: yW, base,
      get x() { return x0 + pxDe(m.desde ?? m.c) * PASO; },
      get img() {
        if (m.estado !== 'corre' || m.desde == null) return NADA;
        const k = Math.floor(avance() * 8);
        return k >= 8 ? NADA : cs[k];
      },
    });
  }

  // ===== LAS PUNTAS: la chapa de canto, de punta a punta y un poco más alta que el carbón
  // (🔁 Sin puerta *(Santi: "elimina la puerta y reemplazala por la misma pared que ya cubre todo el vagón")*. Va en tres pedazos sólo para que cada uno quede bien parado con la gente de su fila.)
  for (const xc of [1, W - 5]) {
    for (const [ya, yb, base] of [[yRim, Y(4), 4 * S - 0.01], [Y(4), Y(6), 6 * S - 0.01], [Y(6), yAcá + 1, 6 * S - 0.01]]) {
      const ph = yb - ya, cp = { i: new Int16Array(6 * ph).fill(-1), m: new Uint8Array(6 * ph) };
      for (let y = 0; y < ph; y++) for (let x = 0; x < 6; x++) cp.i[y * 6 + x] = x === 0 || x === 5 || y + ya === yRim ? 0 : x === 1 ? 24 : x === 2 ? 23 : 31;
      for (let y = 0; y < ph; y++) if ((y + ya - yRim - 4) % 12 === 0) cp.i[y * 6 + 2] = 24;
      const [mx, my] = enMundo(xc - 1, ya);
      resultado.altas.push({ img: lienzo(iluminar({ ancho: 6, alto: ph, indices: cp.i, marcas: cp.m, campo: () => (dia ? 0 : NOCHE) }), 6, ph), x: mx, y: my, w: 6 * PASO, h: ph * PASO, base });
    }
  }

  // 🪜 Las dos escaleras de soga, atadas arriba de la pared; vuelan por encima de la gente. (A destiempo una de la otra.)
  {
    const COL = { a: 16, c: 14, m: 6, d: 4, n: 13 };
    const an = ESCALERA[0][0].length, al = ESCALERA[0].length;
    const lienzos = ESCALERA.map((filas) => {
      const ind = new Int16Array(an * al).fill(-1), lleno = (x, y) => x >= 0 && y >= 0 && x < an && y < al && filas[y][x] !== '.';
      for (let y = 0; y < al; y++) for (let x = 0; x < an; x++) {
        if (lleno(x, y)) ind[y * an + x] = COL[filas[y][x]];
        else if (lleno(x - 1, y) || lleno(x + 1, y) || lleno(x, y - 1) || lleno(x, y + 1)) ind[y * an + x] = 0;
      }
      return lienzo(iluminar({ ancho: an, alto: al, indices: ind, marcas: new Uint8Array(an * al), campo: () => (dia ? 0 : NOCHE) }), an, al);
    });
    const uso = w._usoEscalera || (w._usoEscalera = [0, 0]);
    [[1 - an, 0, 0], [W - 4 - an, 5, 1]].forEach(([px, desde, lado]) => {
      const [mx, my] = enMundo(px, Y(4) - 12);
      let k = desde, antes = 0;
      resultado.altas.push({
        x: mx, y: my, w: an * PASO, h: al * PASO, base: map.rows * S,
        get img() {
          const ahora = performance.now(), quieta = ahora < uso[lado], cada = quieta ? CONFIG.caidas.gondola.escalera.alUsarla : CONFIG.caidas.gondola.escalera.cada;
          if (ahora - antes >= cada) {
            antes = ahora;
            const pose = POSES_ESCALERA[k];
            // (Agarrada, cae a la pose de abajo por el camino más corto y se queda ahí.)
            if (!quieta) k = (k + 1) % POSES_ESCALERA.length;
            else if (pose !== 0) k = pose <= 4 ? POSES_ESCALERA.indexOf(pose - 1) : (k + 1) % POSES_ESCALERA.length;
          }
          return lienzos[POSES_ESCALERA[k]];
        },
      });
    });
  }

  // La pared de acá, delante de todos.
  {
    const fr = iluminar({ ancho: W, alto: H, indices: FRENTE.i, marcas: FRENTE.m, campo: () => (dia ? -1 : NOCHE) });
    const [mx, my] = enMundo(0, yAcá);
    resultado.altas.push({ img: lienzo(recorte(fr, 0, yAcá, W, yCara - yAcá), W, yCara - yAcá), x: mx, y: my, w: W * PASO, h: (yCara - yAcá) * PASO, base: map.rows * S + 0.01 });
  }

  // 🛠️ Dónde van la pala y la carretilla (world/caidas.js). La pala, clavada en el montículo más cercano al medio de los de allá.
  const conPala = lista.filter((m) => m.f < map.rows / 2).sort((a, b) => Math.abs(a.c - cols / 2) - Math.abs(b.c - cols / 2))[0];
  w._gondola = { conPala, x0, yArriba, pozos: { 3: cuadrosDelPozo(3, dia), 2: cuadrosDelPozo(2, dia) } };
  return resultado;
}
