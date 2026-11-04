/**
 * 🚂 EL TÉNDER, LA CABINA Y LA CALDERA, EN EL ESTILO NUEVO *(Santi: "ahora sí quiero que se pueda entrar. Sería un lugar chico, la
 * puerta sería blindada, quiero el que maneja y mínimo un guardia blindado y cosas o personas que me están faltando")*.
 *
 *  - Se entra por la puerta blindada del enganche, a UN PASILLO ANGOSTO entre el tanque de agua (allá) y el carbón (acá).
 *  - 🔁 LA CALDERA ES UN CILINDRO QUE ENTRA EN LA CABINA *(Santi: "esa parte de adelante… sin profundidad, ni sombras, ni tamaños adecuados,
 *    ni perspectiva")*: de la pared de la punta sigue para adentro, con la boca del fogón en su tapa redonda, mirando a la cola. Va en
 *    una pieza alta (`ALTA`): el que pasa por allá queda detrás y el que pasa por acá, delante.
 *  - 🔁 AFUERA, LA LOCOMOTORA VA SOBRE LA VÍA *(Santi pidió comparar con una imagen en esta cámara; me guié por el set "Vintage Steam Train" de
 *    Kokoro Reflections, sólo para ver proporciones, sin copiar nada)*: más angosta que la cabina, apretada, con las ruedas caladas apoyadas en
 *    el riel. Es lo único del tren con ruedas a la vista: en los vagones, el costado llega más acá que el riel y las tapa.
 *  - 🔁 EL MAQUINISTA MIRA PARA ADELANTE *(Santi: "está conduciendo mientras ve hacia el norte en vez de hacia el frente")*: parado al costado
 *    de la caldera, del lado de acá, con las palancas delante.
 *  - Las paredes, como las de los otros vagones: la de allá con su tapa, la de acá con su borde y su cara, las de las puntas finitas.
 *
 * Los mapas son a mano, punto por punto. El cuerpo de la caldera, el miriñaque y los terrones salen de una cuenta.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';
import { pintarSuelo } from './suelo.js';
import { TERRONES, COL_CARBON, COL_LUNA } from './gondola.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;

// El bronce va de claro a oscuro: C, B, b, d, e. El hierro: H, h, M, m, n.
const COL = { o: 0, H: 25, h: 24, M: 23, m: 31, n: 1, C: 29, B: 28, b: 45, d: 44, e: 47, R: 10, r: 9, q: 8, F: 14, f: 16, A: 41, a: 19, W: 6, w: 5, v: 4, V: 21, u: 20, K: 17 };

/**
 * La boca del fogón, 🔁 vista de costado: la tapa mira a la cabina, y desde esta cámara se la ve casi de canto. Antes era una ventana de frente,
 * pegada sobre una tapa que no podía tenerla. (El fuego va aparte: `FUEGO`.)
 */
const FOGON = [
  '..ooooooo',
  '.oBBBBBbo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  'oBooooobo',
  '.obbbbbdo',
  '..ooooooo',
];
/** El fuego adentro de la boca, en 8 cuadros: 5 de ancho por 12 de alto. Se mueve para arriba, sin parar. */
const FUEGO = [
  ['.....', '..y..', '..y..', '.yY..', '.YY.y', '.YZyY', 'yZZYZ', 'YZZZZ', 'ZZzZZ', 'ZzzzZ', 'zzzzz', 'zzzzz'],
  ['...y.', '...y.', '...Y.', '.y.Y.', '.Y.YZ', 'yY.ZZ', 'YZyZZ', 'ZZYZZ', 'ZzZZz', 'zzZzz', 'zzzzz', 'zzzzz'],
  ['.....', '.y...', '.Y...', '.Y..y', 'yY..Y', 'YZ.yY', 'ZZyYZ', 'ZZYZZ', 'zZZZz', 'zzZzz', 'zzzzz', 'zzzzz'],
  ['..y..', '..y..', '..Y..', '.yY.y', '.YZ.Y', 'yZZyY', 'YZZYZ', 'ZZZZZ', 'ZzZzZ', 'zzzzz', 'zzzzz', 'zzzzz'],
  ['.....', '...y.', '..yY.', 'y.YY.', 'Y.YZ.', 'YyZZy', 'ZYZZY', 'ZZZZZ', 'zZZzZ', 'zzZzz', 'zzzzz', 'zzzzz'],
  ['.y...', '.y...', '.Y..y', 'yY..Y', 'YZ.yY', 'YZ.YZ', 'ZZyZZ', 'ZZYZZ', 'ZzZzZ', 'zzzzz', 'zzzzz', 'zzzzz'],
  ['.....', '..y..', '..Y.y', '.yY.Y', '.YZyY', 'yZZYZ', 'YZZZZ', 'ZZZZz', 'zZzZz', 'zzzzz', 'zzzzz', 'zzzzz'],
  ['...y.', '...Y.', '.y.Y.', '.Y.YZ', 'yY.ZZ', 'YZyZZ', 'ZZYZZ', 'ZZZZZ', 'ZzZzZ', 'zzzzz', 'zzzzz', 'zzzzz'],
];
/**
 * 🆕 LA FORMA DE LA ESQUINA REDONDA *(Santi: "que la curva sea un poco más grande y que el borde de la pared también acompañe la curva")*: el borde de la
 * pared da la vuelta, de `G` puntos de grueso en la punta a `T` en la pared larga, entre el arco de adentro (radio `R`) y el óvalo de afuera. `u` y `v` se
 * miden desde el rincón de afuera. (Sale de una cuenta, no es un mapa a mano: es una curva que tiene que coincidir con el choque, de cualquier tamaño.)
 * `clase`: 0 afuera, 1 el borde, 2 adentro. `baja`: cuánto se corre hacia acá una columna de la cara para seguir la curva, igual arriba que abajo.
 */
export const formaEsquina = (G, T, R) => {
  const cu = G + R, cv = T + R;
  const lejos = (u, v) => [Math.max(0, cu - u - 0.5), Math.max(0, cv - v - 0.5)];
  const clase = (u, v) => {
    const [du, dv] = lejos(u, v);
    if (Math.hypot(du, dv) < R) return 2;
    return (du / cu) ** 2 + (dv / cv) ** 2 > 1 ? 0 : 1;
  };
  return {
    cu, cv, clase,
    filo: (u, v) => clase(u - 1, v) !== 1 || clase(u + 1, v) !== 1 || clase(u, v - 1) !== 1 || clase(u, v + 1) !== 1,
    // De 0 (el arco de adentro) a 1 (el óvalo de afuera).
    hacia: (u, v) => { const [du, dv] = lejos(u, v), a = Math.hypot(du, dv) / R - 1, b = 1 - Math.hypot(du / cu, dv / cv); return a / Math.max(0.001, a + b); },
    deCostado: (u, v) => { const [du, dv] = lejos(u, v); return dv < du * 0.6; },
    delArco: (u, v) => { const [du, dv] = lejos(u, v); return Math.hypot(du, dv) - R; },
    baja: (u) => (u >= cu ? 0 : Math.round(R - Math.sqrt(Math.max(0, R * R - (cu - u - 0.5) ** 2)))),
  };
};

const COL_FUEGO = { y: 17, Y: 29, Z: 45, z: 10 };

/** El manómetro: el reloj de la presión, con su caño de bronce. */
const MANOMETRO = [
  '...ooooo...',
  '..oBBBBBo..',
  '.oBKKKKKbo.',
  'oBKKKRKKKbo',
  'oBKKRKKKKbo',
  'oBKKoKKKKbo',
  'oBKKKKKKKbo',
  'obKKKKKKKdo',
  '.obKKKKKdo.',
  '..obbbbdo..',
  '...oooBo...',
  '.....oBo...',
  '.....oBo...',
];
/** El tubo de agua: el vidrio con la línea hasta donde llega, entre dos llaves de bronce. */
const TUBO = [
  'ooooooo',
  'oBBBbbo',
  'ooobooo',
  '..oVo..',
  '..oVo..',
  '..oVo..',
  '..oao..',
  '..oAo..',
  '..oAo..',
  '..oAo..',
  '..oAo..',
  'ooobooo',
  'oBBBbbo',
  'ooooooo',
];
/** LA PALANCA DEL VAPOR: la barra larga de bronce con su puño y el sector dentado, parada en el piso. */
const PALANCA_VAPOR = [
  '.....oooo..',
  '....oRRRro.',
  '....oRrrqo.',
  '.....oooo..',
  '......oBo..',
  '......oBo..',
  '.....oBbo..',
  '.....oBo...',
  '.....oBo...',
  '....oBbo...',
  '....oBo....',
  '....oBo....',
  '...oBbo....',
  '...oBo.....',
  '..ooBoooo..',
  '.oMoMoMoMo.',
  'oHhhhhhhhmo',
  'oMMMMMMMMmo',
  'ommmmmmmmno',
  'ommmmmmmmno',
  'ooooooooooo',
];
/** LA PALANCA DEL FRENO: más corta, de fierro, con la manija roja. */
const PALANCA_FRENO = [
  '..oooooo.',
  '.oRRRRrqo',
  '..oooooo.',
  '....oho..',
  '....oho..',
  '....oho..',
  '....oho..',
  '....oho..',
  '....oho..',
  '...ooooo.',
  '..oHhhhmo',
  '..oMMMMmo',
  '..ommmmno',
  '..ooooooo',
];
/** LA CUERDA DEL SILBATO: la manija de madera con que termina. */
const MANIJA_SILBATO = ['.ofo.', '.ofo.', '.ofo.', 'ooWoo', 'oWWwo', 'oWWwo', 'owwvo', 'ooooo'];
/** LA VIANDA: la lata del almuerzo, con su asa y la tapa. */
const VIANDA = [
  '...oooo...',
  '..oH..ho..',
  '.oo....oo.',
  'ooooooooo.',
  'oHHHHHHho.',
  'ooooooooo.',
  'oHhhhhhmo.',
  'oHhhhhhmo.',
  'oHhhhhhmo.',
  'ommmmmmmo.',
  'ooooooooo.',
];
/** EL BANCO de tablas, con el asiento visto de arriba y el frente, sobre sus patas. */
const BANCO = [
  '.ooooooooooooooooooooooooooooooooooooo.',
  'oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo',
  'owwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo',
  'oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo',
  'owwwvwwwwwwwwwwwwwwwwvwwwwwwwwwwwwwwwwo',
  'ooooooooooooooooooooooooooooooooooooooo',
  'ovvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvo',
  'ooooooooooooooooooooooooooooooooooooooo',
  '.ovwo...........................ovwo...',
  '.ovwo...........................ovwo...',
  '.ovwo...........................ovwo...',
  '.ooo............................ooo....',
];
/** LA TAPA DEL TANQUE DE AGUA, arriba del ténder. */
const TAPA_TANQUE = [
  '...ooooooooooo...',
  '..oHHHHHHHHHhho..',
  '.oHhhhhhhhhhhhmo.',
  'oHhhhhooooohhhhmo',
  'oHhhhoMMMMoohhhmo',
  'oHhhhoMMMMoohhhmo',
  'oHhhhhooooohhhhmo',
  '.ohhhhhhhhhhhhmo.',
  '..ommmmmmmmmmmo..',
  '...ooooooooooo...',
];
/**
 * 🔁 LO QUE VA ENCIMA DE LA CALDERA, otra vez: con esta cámara un círculo acostado se ve poco achatado, así que las bocas y las bases son óvalos
 * gordos (las de antes eran rayas), y las piezas son más altas que el borde del tubo: por eso asoman por encima.
 *
 * LA CHIMENEA: la boca con el hueco negro, el cuerpo que se angosta, el zuncho de bronce y la base que abraza el lomo.
 */
const CHIMENEA = [
  '.......oooooooo.......',
  '....oooHHHHHHHHooo....',
  '..ooHHHooooooooHHhoo..',
  '.oHHoonnnnnnnnnnoohmo.',
  '.oHoonnnnnnnnnnnnoomo.',
  '.oHonnnnnnnnnnnnnnomo.',
  '.oHoonnnnnnnnnnnnoomo.',
  '.oHHoonnnnnnnnnnoohmo.',
  '..ooHHHooooooooHhmoo..',
  '...oooHHHHHHhhhhmoo...',
  '....oMMHHHHhhhhmmo....',
  '.....oMHHHHhhhmmo.....',
  '.....oMHHHhhhhmmo.....',
  '.....oMHHHhhhhmo......',
  '.....oMHHHhhhhmo......',
  '.....oBBBBbbbbdo......',
  '.....oMHHHhhhhmo......',
  '.....oMHHHhhhhmo......',
  '.....oMHHHhhhhmo......',
  '....ooMMHHhhhhmmoo....',
  '...ooMMMHHhhhmmnoo....',
  '..oMMMMMHHhhhmmmnno...',
  '..oMMMMHHHhhhhmmmnno..',
  '...ooommmmmmmmmnnoo...',
  '......oooooooooo......',
];
/** EL DOMO DE VAPOR, de bronce: la cúpula con su brillo, el cuello y la pollera ovalada que abraza el lomo. */
const DOMO = [
  '.......oooooooo.......',
  '.....ooCCCCBBBBoo.....',
  '....oCCCCCBBBBBbbo....',
  '...oCCCCCBBBBBBbbdo...',
  '...oBCCBBBBBBBbbbdo...',
  '..oBBBBBBBBBBbbbbddo..',
  '..oBBBBBBBBBbbbbbdeo..',
  '..obBBBBBBbbbbbdddeo..',
  '..obbbbbbbbbbbdddeeo..',
  '..oodddddddddddeeeoo..',
  '...ooodddddddeeeooo...',
  '.oobbbbbbbbbddddddeoo.',
  'oebbbbddddddddddeeeeeo',
  '.ooeeeeeeeeeeeeeeeeoo.',
  '....oooooooooooooo....',
];
/** LA ARENERA: el domo chico de hierro con su tapa. */
const ARENERA = [
  '.....oooooooo.....',
  '...ooHHHHhhhmoo...',
  '..oHHHHhhhhhhhmo..',
  '..oHhhhhhhhhhmmo..',
  '..oooooooooooooo..',
  '..oHhhhhhhhhmmmo..',
  '..oHhhhhhhhmmmno..',
  '..oMhhhhhhhmmmno..',
  '.ooMMhhhhhmmmmnoo.',
  'oMMMMMMMMMmmmmnnno',
  '.oommmmmmmmmnnnoo.',
  '....oooooooooo....',
];
/** LA CAMPANA, de bronce, en su pie. (🔁 La de antes, dentro de una horquilla, parecía una llama en una caja.) */
const CAMPANA = [
  '.....oooo.....',
  '....oCBBbo....',
  '...oCCBBbdo...',
  '...oCBBbbdo...',
  '..oCCBBbbddo..',
  '..oBBBBbbddo..',
  '.oBBBbbbbddeo.',
  '.oooooooooooo.',
  '.....oMmo.....',
  '...ooMMmmoo...',
  '..oMMMmmmnno..',
  '...oooooooo...',
];
/** EL FARO, parado sobre el lomo de la caja de humo: se le ve la tapa de arriba, y el vidrio, que mira para adelante, casi de canto. */
const FARO = [
  '...oooooooooo...',
  '..oHHHHHHhhhho..',
  '.oHHHHHhhhhhhhoo',
  '.oooooooooooooKo',
  '.oHhhhhhhhmoKKKo',
  '.oMhhhhhhmmoKKKo',
  '.oMhhhhhmmmoKKKo',
  '.oMMMMMmmmnoooo.',
  '..ooooooooooo...',
  '.....omno.......',
  '...oommnnoo.....',
  '...oooooooo.....',
];
/** El codo donde el caño de abajo se mete en la caldera. */
const CODO = [
  'ooooo.',
  'HHHHho',
  'MMMMmo',
  'oooMmo',
  '...omo',
  '..oooo',
  '..oBbo',
  '..oooo',
];
/** EL CILINDRO DE VAPOR, bajo, al costado de la caldera, con el vástago que va a las ruedas. */
const CILINDRO = [
  '....oooooooooooooooooooooooooooo..',
  '...oHHHHHHHHHHHHHHHHHHHHHHHHHHho..',
  '...oHhhhhhhhhhhhhhhhhhhhhhhhhhmo..',
  '...oHhhhhhhhhhhhhhhhhhhhhhhhhhmo..',
  '...oMMMMMMMMMMMMMMMMMMMMMMMMMMmo..',
  '...oMMMoMMMMMMMMMMMMMMMMoMMMMMmo..',
  '...oMMMMMMMMMMMMMMMMMMMMMMMMMMmo..',
  '.oooMMMMMMMMMMMMMMMMMMMMMMMMMMmo..',
  'oHhoMMMMMMMMMMMMMMMMMMMMMMMMMMmo..',
  '.ooommmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  '...ommmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  '...ommoommmmmmmmmmmmmmmoommmmmmo..',
  '...onnnnnnnnnnnnnnnnnnnnnnnnnnno..',
  '....oooooooooooooooooooooooooooo..',
];
/** LA LLAVE DE PASO DEL TANQUE, con su volante rojo. */
const VALVULA = [
  '...ooooo...',
  '..oRRRRRo..',
  '.oRoororRo.',
  'oRooorooRqo',
  'oRoorrrooRo',
  'oRrrrBrrrRo',
  'oRoorrrooRo',
  'oRooorooRqo',
  '.oRoororRo.',
  '..oqqqqqo..',
  '...ooooo...',
];
/** EL CAJÓN DE HERRAMIENTAS, sobre la cubierta, con su pestillo de bronce. */
const CAJON_HERRAMIENTAS = [
  '.oooooooooooooooooooo.',
  'oHHHHHHHHHHHHHHHHHHhho',
  'oHhhhhhhhhhhhhhhhhhmmo',
  'oooooooooooooooooooooo',
  'oMMMMMMMMoBBoMMMMMMMmo',
  'oMMMMMMMMoooMMMMMMMMmo',
  'oMMMMMMMMMMMMMMMMMMMmo',
  'ommmmmmmmmmmmmmmmmmmno',
  'oooooooooooooooooooooo',
];
/** EL HUMO: cinco copos, sin borde: a medida que se aleja de la chimenea crecen y después se deshacen. */
const HUMO = {
  X: [
    '...........HHHHHHHHHH...............',
    '.......HHHHHHHHHHHHHHHHHHH..........',
    '....HHHHHHHHHHHHHHHHHHHHHHHHHh......',
    '..HHHHHHHHHHHHHHHHHHHHHHHHHHHHhh....',
    '.HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhhh..',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhhhh.',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhhhhhh',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHhhhhhhhh',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHhhhhhhhhhh',
    'HHHHHHHHHHHHHHHHHHHHHHHhhhhhhhhhhhhh',
    '.HHHHHHHHHHHHHHHHHHHhhhhhhhhhhhhhhh.',
    '.HHHHHHHHHHHHHHhhhhhhhhhhhhhhhhhhhh.',
    '..HHHHHhhhhhhhhhhhhhhhhhhhhhhhhhhh..',
    '...hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh...',
    '.....hhhhhhhhhhhhhhhhhhhhhhhhhh.....',
    '.......ooooooooooooooooooooooo......',
    '..........oooooooooooooooo..........',
  ],
  x: [
    '.......HHHHHHHH.......',
    '....HHHHHHHHHHHHHh....',
    '..HHHHHHHHHHHHHHHHhh..',
    '.HHHHHHHHHHHHHHHHHhhh.',
    'HHHHHHHHHHHHHHHHHHhhhh',
    'HHHHHHHHHHHHHHHHHhhhhh',
    'HHHHHHHHHHHHHHHHhhhhhh',
    'HHHHHHHHHHHHHHhhhhhhhh',
    '.HHHHHHHHHhhhhhhhhhhh.',
    '..HHHHhhhhhhhhhhhhhh..',
    '....hhhhhhhhhhhhhh....',
    '.......oooooooo.......',
  ],
  g: ['....HHHH....', '..HHHHHHHH..', '.HHHHHHHHhh.', 'HHHHHHHHHhhh', 'HHHHHHHHhhhh', '.HHHHHhhhhh.', '..hhhhhhhh..', '....oooo....'],
  m: ['...HHH...', '.HHHHHHh.', 'HHHHHHhhh', 'HHHHHhhhh', '.Hhhhhhh.', '...ooo...'],
  c: ['.HHh.', 'HHHhh', 'Hhhhh', '.ooo.'],
};

/** Las franjas del cilindro, de arriba para abajo: [hasta dónde llega, color]. El sol le da de arriba; abajo se va a negro. */
// (🔁 De 3/4 se ve más el lomo que el costado: lo claro arriba y ancho, y abajo una franja de sombra angosta. *Santi: "está puesto en lateral"*.)
/**
 * 🔁 LA LUZ DEL TUBO, sacada de la cuenta y no a ojo. Esta cámara dibuja lo alto igual que lo hondo: de arriba para abajo se ve primero el lado de
 * allá, después el lomo (al 15 %), después la parte que mira a la cámara (al 50 %) y recién al 85 % el costado de acá. Lo más claro va en el lomo,
 * y abajo de todo vuelve un poco de luz rebotada del suelo: es lo que hace que se vea redondo y no pintado.
 */
const FRANJAS = [[0.014, 0], [0.06, 24], [0.33, 25], [0.57, 24], [0.72, 23], [0.86, 31], [0.955, 1], [0.985, 31], [1.01, 0]];
const FRANJAS_HUMO = [[0.014, 0], [0.06, 23], [0.33, 24], [0.57, 23], [0.72, 31], [0.955, 1], [0.985, 31], [1.01, 0]];
const FRANJAS_TAPA = [[0.014, 0], [0.33, 23], [0.6, 31], [0.955, 1], [1.01, 0]];
const banda = (lista, t) => { for (let i = 0; i < lista.length; i++) if (t < lista[i][0]) return i; return lista.length - 1; };
const OSCURO = { 25: 24, 24: 23, 23: 31, 31: 1, 1: 40, 40: 0, 28: 45, 45: 44, 44: 47, 47: 39 };
/** De noche, lejos del fogón, el hierro y el bronce a la luz de la luna: con sólo oscurecerlos, media caldera quedaba negra. */
const LUNA = { 25: 20, 24: 19, 23: 41, 31: 18, 1: 40, 29: 45, 28: 44, 45: 44, 44: 47, 47: 39, 10: 8, 9: 39 };

/** Lo que la locomotora de afuera usa igual (estiloNuevo/locoDeAfuera.js): las mismas piezas a mano y la misma luz del tubo. */
export const COL_PIEZAS = COL;
export const PIEZAS_CALDERA = { CHIMENEA, DOMO, ARENERA, CAMPANA, FARO, CODO, CILINDRO, HUMO, FRANJAS, FRANJAS_HUMO, FRANJAS_TAPA, OSCURO };

export function vagonCabina(train, w, dia) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  const x0 = Math.floor(w.x / PASO) * PASO, yArriba = -tc.alturaPared;
  const yAbajo = map.rows * S + 2 * S;
  const tramoLoco = train.tramos.find((t) => t.tipo === 'locomotora');
  const anchoU = w.width + (tramoLoco ? tramoLoco.cols * S : 0);
  const W = Math.ceil((w.x + anchoU - x0) * PX), H = Math.round((yAbajo - yArriba) * PX);
  const ax = (u) => Math.round((u - x0) * PX), ay = (u) => Math.round((u - yArriba) * PX);
  const X = (c) => ax(w.x + c * S), Y = (f) => ay(f * S);
  const NOCHE = tc.sueloNoche;
  const yAcá = Y(map.rows - 1), yCara = Y(map.rows) + 12, yBajo = yCara + 4;
  // 🔁 La locomotora va sobre la vía de verdad *(Santi: las ruedas no pueden flotar)*: el riel de acá pasa por `yVia`, muy adentro de la pared de acá.
  const yVia = yAcá - 26;
  const enMundo = (x, y) => [x0 + x * PASO, yArriba + y * PASO];

  const capa = () => ({ i: new Int16Array(W * H).fill(-1), m: new Uint8Array(W * H) });
  const PISO = capa(), ALTA = capa(), ESTRIBO = capa(), FRENTE = capa();
  const pone = (cp) => (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; cp.i[y * W + x] = i; };
  const rect = (cp) => { const p = pone(cp); return (x, y, ww, hh, i) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) p(x + q, y + j, i); }; };
  const dibujo = (cp, x, y, filas, col = COL) => { const p = pone(cp); filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') p(x + q, y + j, col[fila[q]]); }); };
  const lienzo = (datos, ww, hh) => {
    const cv = document.createElement('canvas'); cv.width = ww; cv.height = hh;
    cv.getContext('2d').putImageData(new ImageData(datos, ww, hh), 0, 0);
    return cv;
  };
  /** Una chapa remachada: paneles con su junta y los remaches arriba y abajo. */
  const chapa = (p, x1, x2, y1, y2, cuerpo, junta) => {
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) p(x, y, (x - x1) % 32 === 0 ? 0 : (x - x1) % 32 === 1 ? junta : cuerpo);
    for (let x = x1; x < x2; x += 32) for (const dx of [-3, 4]) for (const y of [y1 + 2, y2 - 3]) if (x + dx >= x1 && x + dx < x2) p(x + dx, y, 24);
  };

  const xCabina = X(10), xFin = X(18), xCubierta = W - 30;
  const yPasillo = Y(4), yCarbon = Y(6);
  // 🔁 El cilindro, más gordo *(Santi: "hacelo un poco más ancho")*: 72 puntos, casi dos gentes y media. Se apoya sobre las filas 4 y 5 y
  // sube por encima de ellas, como todo lo que tiene altura en esta cámara: el que pasa por la fila 3 asoma por detrás.
  const yB = Y(6), D = 72, yT = yB - D, xTapa = X(14) + 16, xHumo = W - 92, xPunta = W - 44;
  const t = (y) => (y - yT) / D;
  const yFuego = yT + 30;
  const yPieLomo = yT + 14;

  // ===== EL TANQUE DE AGUA: lo de arriba de chapa remachada, con la tapa; su frente es la pared de allá del pasillo
  {
    const r = rect(PISO), p = pone(PISO), yF = yPasillo - 27;
    r(0, 0, xCabina, yF, 23);
    r(0, 0, xCabina, 1, 0); r(0, 1, xCabina, 2, 25); r(0, 3, xCabina, 1, 24);
    for (const yj of [Math.round(yF * 0.36), Math.round(yF * 0.7)]) { r(0, yj, xCabina, 1, 31); r(0, yj + 1, xCabina, 1, 24); for (let x = 3; x < xCabina; x += 12) p(x, yj + 3, 24); }
    for (let x = 64; x < xCabina; x += 64) { r(x, 4, 1, yF - 4, 31); r(x + 1, 4, 1, yF - 4, 24); }
    for (let x = 8; x < xCabina - 6; x += 12) p(x, 7, 24);
    dibujo(PISO, X(4) - 8, 18, TAPA_TANQUE);
    // El borde de adelante agarra la luz: es lo que le da la altura.
    r(0, yF - 3, xCabina, 1, 25); r(0, yF - 2, xCabina, 1, 24); r(0, yF - 1, xCabina, 1, 0);
    chapa(p, 0, xCabina, yF, yPasillo, dia ? 31 : 23, dia ? 23 : 24);
    r(0, yPasillo - 9, xCabina, 2, 10);
    r(0, yPasillo - 1, xCabina, 1, 0);
    // El lomo del tanque se redondea hacia acá, y por el frente bajan la escalera y el caño con su llave.
    for (let y = yF - 11; y < yF - 3; y++) for (let x = 0; x < xCabina; x++) if ((y < yF - 7 ? (x + y) % 2 === 0 : true)) p(x, y, 24);
    r(0, yF - 3, xCabina, 1, 25);
    const xE = X(8);
    r(xE - 1, yF - 14, 2, yPasillo - yF + 12, 0); r(xE + 12, yF - 14, 2, yPasillo - yF + 12, 0);
    r(xE, yF - 14, 1, yPasillo - yF + 12, 25); r(xE + 13, yF - 14, 1, yPasillo - yF + 12, 24);
    for (let y = yF - 11; y < yPasillo - 3; y += 6) { r(xE + 1, y, 11, 1, 25); r(xE + 1, y + 1, 11, 1, 0); }
    const xV = X(2);
    r(xV + 3, yF + 4, 5, yPasillo - yF - 5, 0); r(xV + 4, yF + 4, 2, yPasillo - yF - 5, 25); r(xV + 6, yF + 4, 1, yPasillo - yF - 5, 23);
    dibujo(PISO, xV, yF + 4, VALVULA);
  }

  // ===== EL PISO: tablas gastadas en el pasillo y en toda la cabina, tiznadas de carbón, con las sombras de lo alto
  {
    const p = pone(PISO);
    const enPiso = (x, y) => (x < xCabina ? y >= yPasillo && y < yCarbon : y >= Y(1) && y < yAcá);
    for (let y = Y(1); y < yAcá; y++) for (let x = 0; x < xFin; x++) {
      if (!enPiso(x, y)) continue;
      const fila = Math.floor((y - Y(1)) / 11), corrido = (fila % 3) * 23, q = x + corrido, largo = Math.floor(q / 69);
      const junta = (y - Y(1)) % 11 === 0 || q % 69 === 0;
      let c = junta ? 3 : hash(x, y) < 0.01 ? 3 : hash(largo, fila) < 0.4 ? 4 : 5;
      if (!junta && hash(x >> 1, y >> 1) < 0.02) c = 1;
      // La sombra al pie de la pared de allá y del tanque, y la que la caldera tira hacia acá.
      const alPie = (x >= xCabina && y < Y(1) + 5) || (x < xCabina && y < yPasillo + 5);
      const alLadoTanque = x >= xCabina && x < xCabina + 7 && y < yPasillo;
      const bajoCaldera = x >= xTapa - 16 && y >= yB && y < yB + 10;
      if (alPie || alLadoTanque || bajoCaldera) c = junta ? 32 : 3;
      p(x, y, c);
    }
  }

  // ===== LA PARED DE ALLÁ DE LA CABINA: la tapa, la cara remachada, la franja y las dos ventanas
  {
    const r = rect(PISO), p = pone(PISO), yF = 8, yP = Y(1);
    r(xCabina, 0, xFin - xCabina, 1, 0); r(xCabina, 1, xFin - xCabina, 3, 25); r(xCabina, 4, xFin - xCabina, 3, 24); r(xCabina, 7, xFin - xCabina, 1, 0);
    chapa(p, xCabina, xFin, yF, yP, 23, 31);
    r(xCabina, yF + 28, xFin - xCabina, 2, 10);
    r(xCabina, yP - 1, xFin - xCabina, 1, 0);
    for (const vx of [X(11), X(14) + 5]) {   // (🔁 La de adelante, más para acá: donde estaba caía en la curva de la esquina.)
      r(vx - 1, yF + 3, 42, 22, 0); r(vx, yF + 4, 40, 20, 47); r(vx, yF + 4, 40, 1, 44);
      r(vx + 2, yF + 6, 36, 16, 0); r(vx + 3, yF + 7, 34, 14, 21); r(vx + 3, yF + 15, 34, 6, 20); r(vx + 20, yF + 7, 1, 14, 0);
      for (let j = 0; j < 5; j++) p(vx + 6 + j, yF + 12 - j, 22);
    }
    // La cuerda del silbato, baja del techo y se pasa a la pared.
    const xc = X(13) + 13;
    r(xc, yF, 1, 22, 16); r(xc - 1, yF, 1, 22, 0); r(xc + 1, yF, 1, 22, 0);
    dibujo(PISO, xc - 2, yF + 21, MANIJA_SILBATO);
  }

  // ===== EL BANCO, con la vianda arriba, contra la pared de allá
  {
    const xb = X(11) + 1, yb = Y(3) - 12;
    dibujo(PISO, xb, yb, BANCO);
    dibujo(PISO, xb + 24, yb - 7, VIANDA);
    // (Choca del largo del banco, no de las dos casillas. Las balas, como siempre: ver `soloPaso`, world/tilemap.js.)
    map.ponerChoquesFinos('cabina:' + w.colStart, [{ celdas: [w.colStart + 11, w.colStart + 12, 2, 2], soloPaso: true, rects: [[...enMundo(xb, Y(2)), ...enMundo(xb + BANCO[0].length, Y(3))]] }]);
  }

  // ===== EL CARBÓN DEL TÉNDER: de punta a punta, con el borde de chapa de allá. Y el tabique contra la cabina
  {
    const r = rect(PISO), p = pone(PISO);
    // 🔁 HONDO *(Santi: "que el carbón se vea con mucha más profundidad")*: se ve la cara de adentro de la pared de allá, alta y en sombra, y el carbón
    // abajo. Al pie de esa pared casi no llega la luz; más acá el montón sube en lomas, y lo que está alto agarra luz. Los de más acá pisan a los de atrás.
    const hondo = 24, yFondo = yCarbon + 5 + hondo;
    const hueco = dia ? 0 : 40;
    r(0, yCarbon, xCabina, yAcá - yCarbon, hueco);
    const BAJO = dia ? { o: 0, h: 1, l: 1, m: 0, d: 0 } : { o: 0, h: 18, l: 40, m: 40, d: 0 };
    const ALTO = dia ? { o: 0, h: 24, l: 23, m: 31, d: 1 } : { o: 0, h: 19, l: 41, m: 18, d: 40 };
    const lista = [];
    for (let i = 0; i < 800; i++) lista.push([Math.floor(hash(i, 3) * (xCabina - 8)), yFondo - 5 + Math.floor(hash(i, 5) * (yAcá - yFondo + 3)), TERRONES[i % TERRONES.length]]);
    lista.sort((a, b) => a[1] - b[1]);
    for (const [tx, ty, T] of lista) {
      const q = (ty - yFondo) / (yAcá - yFondo), loma = 0.6 + 0.25 * Math.sin(tx / 37) + 0.15 * Math.sin(tx / 13 + 2);
      dibujo(PISO, tx, ty, T, q < 0.28 ? BAJO : Math.abs(q - loma) < 0.13 ? ALTO : dia ? COL_CARBON : COL_LUNA);
    }
    r(0, yCarbon - 1, xCabina, 1, 0); r(0, yCarbon, xCabina, 2, 24); r(0, yCarbon + 2, xCabina, 2, 31); r(0, yCarbon + 4, xCabina, 1, 0);
    for (let x = 6; x < xCabina; x += 16) p(x, yCarbon + 2, 23);
    // La cara de adentro, con su junta y sus remaches: se va oscureciendo hacia abajo y se pierde detrás del carbón.
    for (let y = yCarbon + 5; y < yFondo - 3; y++) for (let x = 0; x < xCabina; x++) {
      const q = (y - yCarbon - 5) / hondo;
      if (q > 0.72 && ((x * 3 + (x >> 2) * 5) % 11) < (q - 0.72) * 34) continue;
      p(x, y, x % 32 === 0 ? 0 : q < 0.3 ? 1 : q < 0.6 ? ((x + y) % 2 ? 1 : hueco) : hueco);
    }
    for (let x = 4; x < xCabina; x += 16) p(x, yCarbon + 8, 31);
    // (La casilla del tabique: visto de arriba, el canto de chapa.)
    const a = X(11) - X(10);
    r(xCabina, yCarbon - 3, a, yAcá - yCarbon + 3, 23);
    r(xCabina, yCarbon - 4, a, 1, 0); r(xCabina, yCarbon - 3, a, 2, 25); r(xCabina, yCarbon - 1, a, 1, 24);
    r(xCabina, yCarbon - 3, 1, yAcá - yCarbon + 3, 0); r(xCabina + a - 1, yCarbon - 3, 1, yAcá - yCarbon + 3, 0);
    for (let y = yCarbon + 8; y < yAcá; y += 12) { p(xCabina + 5, y, 24); p(xCabina + a - 6, y, 24); }
    // La sombra que tira sobre el piso de la cabina.
    for (let y = yCarbon; y < yAcá; y++) for (let x = xCabina + a; x < xCabina + a + 5; x++) p(x, y, 3);
  }

  // ===== LAS PUNTAS: la pared finita. La del enganche, de punta a punta menos la puerta; la de adelante, cortada por la caldera
  {
    const r = rect(PISO), p = pone(PISO), punta = (x, y1, y2) => { r(x, y1, 1, y2 - y1, 0); r(x + 1, y1, 1, y2 - y1, 25); r(x + 2, y1, 2, y2 - y1, 23); r(x + 4, y1, 1, y2 - y1, 31); r(x + 5, y1, 1, y2 - y1, 0); };
    punta(0, 0, yPasillo); punta(0, yCarbon - 1, yAcá);
    punta(xFin - 6, 0, yAcá);
    // 🔁 La pared de adelante, tan gruesa como su casilla, igual que el tabique: chocabas contra el aire, un buen trecho antes de la pared.
    const xG = X(17);
    for (const [y1, y2] of [[Y(1), yT], [yB, yAcá]]) {
      r(xG, y1, xFin - 6 - xG, y2 - y1, 23); r(xG, y1, 1, y2 - y1, 0);
      for (let y = y1 + 6; y < y2; y += 12) p(xG + 5, y, 24);
    }
  }

  // ===== LA LOCOMOTORA POR AFUERA, LO QUE VA ABAJO DE LA CALDERA: la sombra sobre las piedras y el costado de allá, que asoma
  {
    const r = rect(PISO), p = pone(PISO), xP = W - 31;
    for (let y = yVia - 18; y < yVia + 12; y++) for (let x = xFin; x < W - 6; x++) {
      if (y < yVia + 5 ? (x + y) % 2 === 0 : (x + y) % 4 === 0 && y % 2 === 0) p(x, y, dia ? 3 : 40);
    }
    // (🔁 Había una tira del costado de allá asomando por encima del tubo: es imposible, el tubo la tapa entera.)
    // El riel de acá, entero: sobre él apoyan las ruedas.
    r(xFin, yVia - 1, W - xFin, 1, 25); r(xFin, yVia, W - xFin, 1, 24); r(xFin, yVia + 1, W - xFin, 1, 0);
    // La plataforma de chapa delante de la caldera, vista desde arriba: sin ella, entre la caldera y el miriñaque se veía pasar la vía.
    const yPl = yVia - 98;
    r(xP - 16, yPl, 16, yB - yPl, 31); r(xP - 16, yPl, 16, 1, 0); r(xP - 16, yPl + 1, 16, 1, 24);
    for (let y = yPl + 6; y < yB; y += 8) p(xP - 4, y, 24);
    // La sombra de la cuña, en el piso: que se vea que apoya.
    for (let x = xP + 2; x < W - 12; x++) {
      const yS = Math.round(yVia - 4 - ((x - xP) / (W - 12 - xP)) * 42);
      for (let y = yS; y < yS + 5; y++) if ((x + y) % 2 === 0) p(x, y, dia ? 3 : 40);
    }
  }

  // ===== LA CALDERA: el cilindro de 3/4. Se le ve sobre todo el lomo. Lo que da la vuelta (las tapas, los aros, las juntas) se curva para
  // afuera: lo de la punta de atrás hacia atrás, lo de adelante hacia adelante. Lo que va encima sale del lomo, no del borde.
  {
    const p = pone(ALTA), rA = rect(ALTA);
    // Entre franja y franja, tres hileras que se van mezclando. (🔁 Con una sola hilera a puntos, y a puntos también el borde negro, el tubo parecía cosido.)
    const hilera = (lista, x, y) => {
      const i = banda(lista, t(y)), c = lista[i][1], mezcla = (j) => j !== i && lista[j][1] !== 0 && c !== 0 && t(y) < 0.95;
      const j1 = banda(lista, t(y + 1)), j2 = banda(lista, t(y + 2)), j0 = banda(lista, t(y - 1)), poco = (x + 2 * (y % 2)) % 4 === 0;
      if (mezcla(j1)) return (x + y) % 2 ? lista[j1][1] : c;
      if (mezcla(j2)) return poco ? lista[j2][1] : c;
      if (mezcla(j0)) return poco ? lista[j0][1] : c;
      return c;
    };
    const xCentro = (xTapa + xPunta) / 2, mitad = (xPunta - xTapa) / 2;
    const redondo = (y) => Math.sqrt(Math.max(0, 1 - (2 * t(y) - 1) ** 2));
    const curva = (x, y) => Math.round(((x - xCentro) / mitad) * 3 * redondo(y));
    for (let y = yT; y < yB; y++) {
      const m = redondo(y), xA = xTapa + curva(xTapa, y), xH = xHumo + curva(xHumo, y), xP = xPunta + curva(xPunta, y);
      const xi = xA - Math.round(10 * m), xd = xP + Math.round(6 * m);
      // La tapa de atrás, la de la boca del fogón: mira a la cabina, un escalón más oscura que el tubo.
      for (let x = xi; x < xA; x++) p(x, y, x === xi ? 0 : hilera(FRANJAS_TAPA, x, y));
      for (let x = xA; x < xH; x++) p(x, y, hilera(FRANJAS, x, y));
      for (let x = xH; x < xP; x++) p(x, y, hilera(FRANJAS_HUMO, x, y));
      // La tapa de adelante.
      for (let x = xP; x <= xd; x++) p(x, y, x === xd ? 0 : hilera(FRANJAS_TAPA, x, y));
      p(xP - 1, y, 0);
      p(xA, y, 0);
      p(xH, y, 0);
    }
    // Los aros de bronce, que brillan en el lomo y se apagan abajo, y el rojo delante de la caja de humo.
    // (🔁 Sin el contorno negro: con él se veían como calcomanías. El borde es la misma chapa, dos escalones más oscura: el aro abraza el tubo.)
    const aro = (x, a, c) => {
      for (let y = yT + 1; y < yB - 1; y++) {
        const xc = x + curva(x, y);
        for (const xb of [xc - 1, xc + a]) { const v = ALTA.i[y * W + xb]; p(xb, y, v === 25 ? 23 : v === 24 ? 31 : v === 23 ? 1 : 0); }
        for (let q = 0; q < a; q++) p(xc + q, y, c(t(y)));
      }
    };
    const bronce = (tt) => (tt < 0.06 ? 45 : tt < 0.33 ? 28 : tt < 0.57 ? 45 : tt < 0.72 ? 44 : tt < 0.86 ? 47 : 39);
    for (const ax0 of [xFin + 26, xFin + 84, xFin + 142]) aro(ax0, 2, bronce);
    aro(xTapa + 8, 2, bronce);
    aro(xHumo - 8, 6, (tt) => (tt < 0.06 ? 9 : tt < 0.33 ? 10 : tt < 0.57 ? 9 : tt < 0.86 ? 8 : 39));
    // El brocal donde la caldera atraviesa la pared.
    aro(xFin - 7, 7, (tt) => (tt < 0.06 ? 23 : tt < 0.33 ? 24 : tt < 0.57 ? 23 : tt < 0.72 ? 31 : 1));
    // Los remaches, en una sola hilera a lo largo.
    for (let x = xTapa + 22; x < xHumo - 10; x += 6) {
      if ((x - xFin - 26) % 58 < 6) continue;
      p(x, yT + 40, 23);
    }
    // El pasamanos, finito, por el lado de acá del lomo, con sus soportes de bronce. No termina en el aire: el último soporte lo cierra.
    {
      const yC = yT + 25, x1 = xFin + 3, x2 = xHumo - 14;
      for (let x = x1; x < x2; x++) { const v = ALTA.i[(yC + 3) * W + x]; p(x, yC + 3, OSCURO[v] ?? 1); }
      rA(x1, yC, x2 - x1, 1, 0); rA(x1, yC + 1, x2 - x1, 1, 25); rA(x1, yC + 2, x2 - x1, 1, 0);
      for (const x of [xFin + 12, xFin + 70, xFin + 128, x2 - 2]) { rA(x, yC - 1, 3, 7, 0); rA(x + 1, yC, 1, 5, 45); }
    }
    // El caño del agua, más grueso y más abajo, en la parte de la caldera que ya está en sombra: nace en la pared y se mete en la caldera por un codo.
    {
      const yC = yT + 50, x1 = xFin + 3, x2 = xHumo - 22;
      rA(x1, yC, x2 - x1, 1, 0); rA(x1, yC + 1, x2 - x1, 1, 24); rA(x1, yC + 2, x2 - x1, 1, 31); rA(x1, yC + 3, x2 - x1, 1, 0);
      for (let x = x1; x < x2; x++) p(x, yC + 4, 1);
      for (const x of [xFin + 40, xFin + 98]) { rA(x, yC - 1, 3, 6, 0); rA(x + 1, yC, 1, 4, 47); }
      dibujo(ALTA, x2, yC, CODO);
    }
    // Lo de la cabina: el manómetro y el tubo de agua, sobre el costado, y el caño que los une. Bien a la vista del maquinista.
    dibujo(ALTA, xTapa + 16, yT + 17, MANOMETRO);
    dibujo(ALTA, xTapa + 36, yT + 19, TUBO);
    rA(xTapa + 22, yT + 31, 18, 1, 0); rA(xTapa + 22, yT + 32, 18, 1, 28); rA(xTapa + 22, yT + 33, 18, 1, 0);
    // La boca del fogón, en la tapa.
    dibujo(ALTA, xTapa - 12, yFuego - 3, FOGON);
    // 🔁 LO QUE VA PARADO ENCIMA, sobre el lomo de verdad: al 15 % del tubo, no al 35 %. Antes quedaba todo pegado al costado, como calcomanías; así
    // apoya arriba y asoma por encima del borde. La sombra cae hacia acá, sobre la curva, y se va cerrando (la sombra sale de una cuenta).
    const sombra = (x1, ancho, yPie) => {
      const xm = x1 + ancho / 2, hondo = 5;
      for (let y = yPie - 2; y < yPie + hondo; y++) {
        const q = (y - yPie + 2) / (hondo + 2), med = (ancho / 2 - 1) * Math.sqrt(Math.max(0, 1 - q * q));
        for (let x = Math.round(xm - med); x <= Math.round(xm + med); x++) {
          const k = y * W + x, c = ALTA.i[k];
          if (c > 0 && OSCURO[c] !== undefined) ALTA.i[k] = OSCURO[c];
        }
      }
    };
    const encima = (mapa, x) => { const al = mapa.length, an = mapa[0].length; sombra(x, an, yPieLomo); dibujo(ALTA, x, yPieLomo - al + 1, mapa); };
    encima(DOMO, xFin + 40);
    encima(CAMPANA, xFin + 96);
    encima(ARENERA, xFin + 116);
    encima(CHIMENEA, xHumo + 8);
    encima(FARO, xPunta - 13);
  }

  // ===== LA LOCOMOTORA POR AFUERA, LO QUE VA DELANTE DE LA CALDERA, por capas: el bastidor (con la caldera); las ruedas y las bielas, que se
  // mueven (`cuadrosRuedas`, más abajo); y encima el cilindro, el estribo y el miriñaque (`ESTRIBO`). El estribo se ve desde arriba y les tapa
  // la parte de arriba a las ruedas, como pasa con esta cámara.
  const xP = W - 31, yR = yVia - 15, xCil = xHumo + 2, yCil = yB + 17;
  {
    const r = rect(ALTA), ancho = xP - xFin;
    r(xFin, yB + 16, ancho, 6, 1); r(xFin, yB + 22, ancho, 1, 0);
  }
  {
    const r = rect(ESTRIBO), p = pone(ESTRIBO), ancho = xP - xFin;
    dibujo(ESTRIBO, xCil, yCil, CILINDRO);
    // El estribo: la tapa de chapa, en sombra al pie de la caldera; el borde que agarra la luz; y el costado.
    r(xFin, yB, ancho, 8, 23); r(xFin, yB, ancho, 3, 1);
    for (let x = xFin + 3; x < xP; x += 6) p(x + (x % 12 ? 0 : 2), yB + 5, 24);
    r(xFin, yB + 8, ancho, 1, 25); r(xFin, yB + 9, ancho, 1, 0);
    chapa(p, xFin, xP, yB + 10, yB + 15, 31, 23);
    r(xFin, yB + 12, ancho, 1, 10); r(xFin, yB + 15, ancho, 1, 0);
    dibujo(ESTRIBO, xFin + 124, yB - 1, CAJON_HERRAMIENTAS);
    // 🔁 EL MIRIÑAQUE, como todo lo demás en esta cámara: una tapa que se ve desde arriba y un frente que baja *(Santi: "la punta termina más cerca de
    // la pantalla que más lejos")*. Tenía razón: las dos caras bajando hasta el piso llevaban la punta para abajo en la pantalla, que acá quiere decir
    // hacia el que mira. Ahora la tapa es un triángulo a nivel, con la punta sobre el eje de la locomotora; la tapa cubre los dos rieles, y debajo del
    // borde de acá, el único que da a la cámara, bajan los barrotes. (Sale de una cuenta, no es un mapa a mano.)
    const xFinC = W - 12, largo = xFinC - xP, yAl = yVia - 96, yAc = yB + 8, yPu = Math.round((yAl + yAc) / 2);
    const mezcla = (a, b, q) => a + (b - a) * q;
    for (let x = xP; x <= xFinC; x++) {
      const q = (x - xP) / largo, yA = Math.round(mezcla(yAl, yPu, q)), yC = Math.round(mezcla(yAc, yPu, q)), alto = Math.round(mezcla(25, 15, q));
      for (let y = yA; y <= yC; y++) p(x, y, y === yA || x === xFinC ? 0 : y === yC ? 10 : (y - yPu + 96) % 9 === 0 ? 8 : 9);
      for (let j = 1; j <= alto; j++) p(x, yC + j, j === alto || x === xFinC ? 0 : (x - xP) % 5 < 2 ? 39 : j < 3 ? 8 : 40);
      p(x, yC + alto + 1, 0);
    }
    // La viga: atraviesa la tapa de lado a lado, delante de la caldera.
    r(xP, yAl - 1, 5, yAc - yAl + 2, 0); r(xP + 1, yAl, 3, yAc - yAl, 8); r(xP + 1, yAl, 1, yAc - yAl, 10);
  }

  // De noche, afuera y lejos del fogón, hierro y bronce a la luz de la luna. Cerca del fogón no es de día: lo más claro baja un escalón.
  if (!dia) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, c = ALTA.i[k];
    if (LUNA[c] !== undefined) {
      const d = Math.hypot(x - (xTapa - 10), (y - (yFuego + 8)) * 1.3);
      // (Entre la luz del fogón y la de la luna, un tramo a puntos: que no se note el corte.)
      if (d >= 72 || (d >= 56 && (x + y) % 2)) ALTA.i[k] = LUNA[c];
      else if (c === 25 || c === 24) ALTA.i[k] = OSCURO[c];
    }
    const c2 = PISO.i[k];
    if (x >= xFin && LUNA[c2] !== undefined) PISO.i[k] = LUNA[c2];
    const c3 = ESTRIBO.i[k];
    if (LUNA[c3] !== undefined) ESTRIBO.i[k] = LUNA[c3];
  }

  // ===== LA PARED DE ACÁ, delante de todos: el borde que agarra la luz, la cara de chapa, la franja y la chapa con el número
  {
    const r = rect(FRENTE), p = pone(FRENTE);
    chapa(p, 0, xFin, yAcá + 4, yCara, 23, 31);
    r(0, yAcá, xFin, 1, 0); r(0, yAcá + 1, xFin, 1, 25); r(0, yAcá + 2, xFin, 1, 24); r(0, yAcá + 3, xFin, 1, 0);
    r(0, yCara - 10, xFin, 2, 10);
    r(0, yCara - 1, xFin, 1, 0);
    r(xFin - 1, yAcá, 1, yCara - yAcá, 0);
    // La chapa de bronce del fabricante, en la cabina.
    const cx = X(13) + 4;
    r(cx, yAcá + 8, 34, 13, 0); r(cx + 1, yAcá + 9, 32, 11, 45); r(cx + 1, yAcá + 9, 32, 1, 28); r(cx + 4, yAcá + 12, 26, 1, 44); r(cx + 4, yAcá + 15, 26, 1, 44);
  }

  /**
   * 🆕 LAS ESQUINAS REDONDAS DE LA LOCOMOTORA *(Santi: "la locomotora también cuenta como vagón")*: las cuatro de adentro de la cabina, que coinciden con el
   * choque (world/train.js), y por afuera las del tanque, la de atrás del carbón y las de la cabina. La cara de la pared de allá se dobla siguiendo el arco:
   * su franja y sus remaches bajan con la curva. (Sale de la cuenta de `formaEsquina`.)
   */
  {
    const R = Math.round(CONFIG.tresCuartos.radioEsquina / PASO), xG = X(17), yP = Y(1), GD = xFin - xG;
    const pp = pone(PISO), pf = pone(FRENTE);
    const borra = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = y * W + x; for (const cp of [PISO, FRENTE]) { cp.i[k] = -1; cp.m[k] = 0; } };
    const tono = (E, u, v) => (E.filo(u, v) ? 0 : E.deCostado(u, v) ? 23 : E.hacia(u, v) > 0.5 ? 25 : 24);
    // (En la pared de acá, lo claro es un hilo pegado al arco, como el del borde derecho; lo demás, oscuro como la pared de la punta.)
    const tonoAcá = (E, u, v) => { const a = E.delArco(u, v); return E.filo(u, v) ? 0 : E.deCostado(u, v) || a >= 3 ? 23 : a < 2 ? 25 : 24; };
    // La cara de la pared de allá, corrida hacia acá en cada columna, con el pie en negro.
    const dobla = (x, d, dSig) => {
      for (let y = yP - 1; y >= 8; y--) { const k = y * W + x; if (PISO.i[k] >= 0) pp(x, y + d, PISO.i[k]); }
      for (let y = yP - 1 + dSig; y <= yP - 1 + d; y++) pp(x, y, 0);
    };
    // La pared gruesa de adelante sube hasta el borde de arriba: si no, la curva no tiene de qué salir.
    for (let y = 8; y < yP; y++) { for (let x = xG; x < xFin - 6; x++) pp(x, y, 23); pp(xG, y, 0); }
    for (let y = 14; y < yP; y += 12) pp(xG + 5, y, 24);
    // Arriba, adelante: la de adentro y la de afuera son la misma curva.
    {
      const E = formaEsquina(GD, 8, R), Xu = (u) => xFin - 1 - u;
      for (let u = GD; u < E.cu; u++) dobla(Xu(u), E.baja(u), E.baja(u + 1));
      for (let v = 0; v < E.cv; v++) for (let u = 0; u < E.cu; u++) {
        const c = E.clase(u, v);
        if (c === 0) borra(Xu(u), v); else if (c === 1) pp(Xu(u), v, tono(E, u, v));
      }
    }
    // Arriba, contra el tanque: la pared de allá baja en curva, y lo de arriba del arco es la chapa del costado del tanque.
    {
      const E = formaEsquina(0, 8, R);
      for (let u = 0; u < R; u++) {
        const x = xCabina + u, d = E.baja(u), dS = E.baja(u + 1);
        dobla(x, d, dS);
        for (let y = 8; y < 8 + d; y++) pp(x, y, y >= 7 + dS ? 0 : 24);
      }
    }
    // Abajo, en la cabina: el rincón contra el tabique, tapado por la pared de acá.
    for (let v = 0; v < R; v++) for (let u = 0; u < R; u++) {
      const dentro = (a, b) => Math.hypot(R - a - 0.5, R - b - 0.5) <= R || a >= R || b >= R;
      if (dentro(u, v)) continue;
      pf(X(11) + u, yAcá - 1 - v, dentro(u + 1, v) || dentro(u, v + 1) ? 0 : 23);
    }
    // Las de abajo por afuera: el borde da la vuelta y la cara lo acompaña, y la cara termina redondeada abajo.
    for (const [G, Xu] of [[GD, (u) => xFin - 1 - u], [6, (u) => u]]) {
      const E = formaEsquina(G, 4, R), yBase = yAcá + 3;
      for (let v = 0; v < E.cv; v++) for (let u = 0; u < E.cu; u++) {
        const c = E.clase(u, v);
        if (c === 1) pf(Xu(u), yBase - v, tonoAcá(E, u, v));
        else if (c === 0) pf(Xu(u), yBase - v, u === 0 ? 0 : 23);
      }
      for (let y = yBase; y < yCara; y++) pf(Xu(0), y, 0);
      const pie = [];
      for (let u = 0; u < E.cu; u++) {
        let kept = yCara - 1;
        for (let v = 0; v < E.cv; v++) { if (E.clase(u, v) === 0) borra(Xu(u), yCara - 1 - v); else { kept = yCara - 1 - v; break; } }
        pie.push(kept);
      }
      pie.forEach((yb, u) => { for (let y = u ? pie[u - 1] : yb; y <= yb; y++) pf(Xu(u), y, 0); });
    }
    // La de atrás del tanque, sólo por afuera.
    {
      const E = formaEsquina(6, 8, R);
      for (let v = 0; v < E.cv; v++) for (let u = 0; u < E.cu; u++) {
        const c = E.clase(u, v);
        if (c === 0) borra(u, v); else if (c === 1 && (E.clase(u - 1, v) === 0 || E.clase(u, v - 1) === 0)) pp(u, v, 0);
      }
    }
  }

  // La luz del fogón, de noche: alumbra el piso delante de la boca, a escalones; lo demás, luz de luna.
  // (🔁 Con la de todos los vagones, -2, el hierro negro desaparecía. El carbón ya tiene su color de luna.)
  const fx = xTapa - 10, fy = yFuego + 8;
  const luzFogon = (x, y) => {
    if (x >= xFin || (y >= yCarbon && y < yAcá && x < xCabina)) return 0;
    const d = Math.hypot(x - fx, (y - fy) * 1.3);
    return d < 44 ? 0 : d < 84 ? -1 : y < Y(1) || x >= xFin ? -1 : NOCHE + 1;
  };
  const campoPiso = dia ? () => 0 : luzFogon;
  const resultado = {
    piso: [], altas: [],
    luz: (ux, uy) => (dia ? 0 : luzFogon(ax(ux), ay(uy))),
  };

  // La tierra de debajo, en la sombra: la misma de afuera, pasando. Sólo bajo la cabina y el ténder: la locomotora, más angosta, tiene la suya.
  {
    const xI = 0, an = xFin, vy = yBajo;
    const vh = H - vy, [mx, my] = enMundo(xI, vy);
    const cv = document.createElement('canvas'); cv.width = an; cv.height = vh;
    const cx = cv.getContext('2d'), ind = new Int16Array(an * vh), marcas = new Uint8Array(an * vh);
    let hecho = null;
    resultado.piso.push({
      x: mx, y: my, w: an * PASO, h: vh * PASO, base: 0,
      get img() {
        const k = Math.round((estiloNuevo.desfile || 0) * PX);
        if (k !== hecho) {
          hecho = k;
          pintarSuelo(ind, an, vh, Math.round(mx / PASO), Math.round(my / PASO), k);
          cx.putImageData(new ImageData(iluminar({ ancho: an, alto: vh, indices: ind, marcas, campo: () => (dia ? -2 : -3) }), an, vh), 0, 0);
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
  const suelto = (filas, col, campo) => {
    const an = Math.max(...filas.map((f) => f.length)), al = filas.length, ind = new Int16Array(an * al).fill(-1);
    filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') ind[j * an + q] = col[fila[q]]; });
    return { img: lienzo(iluminar({ ancho: an, alto: al, indices: ind, marcas: new Uint8Array(an * al), campo }), an, al), an, al };
  };

  // 🚂 La caldera entera: el que pasa por allá queda detrás; el que pasa por acá (el maquinista), delante.
  {
    const yA0 = 40, altoA = yVia + 2 - yA0;
    const al = iluminar({ ancho: W, alto: H, indices: ALTA.i, marcas: ALTA.m, campo: () => 0 });
    const [mx, my] = enMundo(0, yA0);
    resultado.altas.push({ img: lienzo(recorte(al, 0, yA0, W, altoA), W, altoA), x: mx, y: my, w: W * PASO, h: altoA * PASO, base: 6 * S - 0.02 });
  }

  // 🛞 LAS RUEDAS Y LAS BIELAS *(Santi: "las ruedas totalmente visibles de la locomotora deberían moverse")*: giran con lo que corre el suelo, sin
  // resbalar: si el tren frena, frenan. 16 cuadros por vuelta (rayos, contrapeso y biela salen de la cuenta de cada cuadro, no son mapas a mano);
  // las chicas, de la mitad de radio, dan el doble de vueltas.
  {
    const xI = xFin, yI = yB + 10, AN = xP - xFin, AL = yVia + 2 - yI;
    const q1 = xFin + 38 - xI, q2 = xFin + 86 - xI, yC = yR - yI, RUEDA = 18, RY = 15;
    const cuadros = [];
    for (let k = 0; k < 16; k++) {
      const ind = new Int16Array(AN * AL).fill(-1), a = (k / 16) * Math.PI * 2;
      const p = (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < AN && y < AL) ind[y * AN + x] = !dia && LUNA[i] !== undefined ? LUNA[i] : i; };
      const r = (x, y, w2, h2, i) => { for (let j = 0; j < h2; j++) for (let q = 0; q < w2; q++) p(x + q, y + j, i); };
      const rueda = (cx, cy, R, Ry, ang, rayos, contrapeso) => {
        const paso = (Math.PI * 2) / rayos;
        for (let y = -Ry; y <= Ry; y++) for (let x = -R; x <= R; x++) {
          const v = (y * R) / Ry, d = Math.hypot(x, v);
          if (d > R + 0.4) continue;
          if (d > R - 1 || (d <= R - 3 && d > R - 4)) { p(cx + x, cy + y, 0); continue; }
          if (d > R - 3) { p(cx + x, cy + y, y < 0 ? 25 : 23); continue; }
          if (d <= R * 0.2) { p(cx + x, cy + y, 24); continue; }
          let th = Math.atan2(v, x) - ang;
          th = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          if (contrapeso && Math.abs(th - Math.PI) < 0.8 && d > R * 0.42) { p(cx + x, cy + y, 1); continue; }
          const m = ((th % paso) + paso) % paso, lejos = Math.min(m, paso - m) * d;
          if (lejos < 0.75) p(cx + x, cy + y, 10);
        }
      };
      rueda(q1, yC, RUEDA, RY, a, 6, true); rueda(q2, yC, RUEDA, RY, a, 6, true);
      rueda(xHumo + 8 - xI, yVia - 8 - yI, 9, 8, a * 2, 5, false); rueda(xHumo + 32 - xI, yVia - 8 - yI, 9, 8, a * 2, 5, false);
      // La biela que une las dos ruedas va siempre derecha; su altura sube y baja con la manivela.
      const dx = 9 * Math.cos(a), dy = 7.5 * Math.sin(a), yP = Math.round(yC + dy);
      r(Math.round(q1 + dx), yP - 2, q2 - q1, 4, 0); r(Math.round(q1 + dx), yP - 1, q2 - q1, 1, 25); r(Math.round(q1 + dx), yP, q2 - q1, 1, 24);
      for (const q of [q1, q2]) { const xq = Math.round(q + dx); r(xq - 3, yP - 3, 6, 6, 0); r(xq - 2, yP - 2, 4, 4, 28); }
      // La biela larga y el vástago: la cruceta va y viene derecho, entrando y saliendo del cilindro.
      const xc = xCil - xI - 8 + dx, ya = yCil + 8 - yI, xq2 = q2 + dx, n = Math.max(1, Math.round(xc - xq2));
      for (let i = 0; i <= n; i++) { const x = xq2 + i, y = yP + ((ya - yP) * i) / n; r(Math.round(x), Math.round(y) - 1, 1, 3, 0); p(x, y, 25); }
      r(Math.round(xc), ya - 1, xCil - xI + 4 - Math.round(xc), 3, 0); r(Math.round(xc), ya, xCil - xI + 4 - Math.round(xc), 1, 25);
      r(Math.round(xc) - 3, ya - 3, 6, 7, 0); r(Math.round(xc) - 2, ya - 2, 4, 5, 24);
      cuadros.push(lienzo(iluminar({ ancho: AN, alto: AL, indices: ind, marcas: new Uint8Array(AN * AL), campo: () => 0 }), AN, AL));
    }
    const [mx, my] = enMundo(xI, yI), VUELTA = Math.PI * 2 * RUEDA * PASO;
    resultado.altas.push({
      x: mx, y: my, w: AN * PASO, h: AL * PASO, base: 6 * S - 0.016,
      get img() { const k = Math.floor(((estiloNuevo.desfile || 0) / VUELTA) * 16); return cuadros[((k % 16) + 16) % 16]; },
    });
  }

  // El cilindro, el estribo y el miriñaque, encima de las ruedas.
  {
    const yE0 = yVia - 100, altoE = yVia + 2 - yE0;
    const es = iluminar({ ancho: W, alto: H, indices: ESTRIBO.i, marcas: ESTRIBO.m, campo: () => 0 });
    const [mx, my] = enMundo(0, yE0);
    resultado.altas.push({ img: lienzo(recorte(es, 0, yE0, W, altoE), W, altoE), x: mx, y: my, w: W * PASO, h: altoE * PASO, base: 6 * S - 0.012 });
  }

  // 🔥 El fuego, en la boca del fogón: un cuadro por cada 90 ms. Siempre con su luz, también de noche.
  {
    const cuadros = FUEGO.map((f) => suelto(f, COL_FUEGO, () => 0));
    const [mx, my] = enMundo(xTapa - 10, yFuego);
    resultado.altas.push({
      x: mx, y: my, w: 5 * PASO, h: 12 * PASO, base: 6 * S - 0.01,
      get img() { return cuadros[Math.floor(performance.now() / 90) % 8].img; },
    });
  }

  // Las dos palancas, cada una en su casilla (columna 16, filas 6 y 7): el maquinista va delante de una y detrás de la otra.
  for (const [mapa, fila, dx] of [[PALANCA_VAPOR, 6, 0], [PALANCA_FRENO, 7, 2]]) {
    const pz = suelto(mapa, COL, () => (dia ? 0 : -1));
    const [mx, my] = enMundo(X(16) - 8 + dx, Y(fila + 1) - mapa.length);
    resultado.altas.push({ img: pz.img, x: mx, y: my, w: pz.an * PASO, h: pz.al * PASO, base: (fila + 1) * S - 0.01 });
  }

  // 🏭 EL HUMO, MUCHO MÁS *(Santi: "poner mucho más humo")*: una columna gorda que sale de la chimenea, sube y se la lleva el viento hacia la cola,
  // por encima de la cabina. Va por encima de todos: anda alto. Los copos son a mano; dónde va cada uno en cada uno de los 8 cuadros sale de una
  // cuenta, y cada copo llega en el cuadro 8 adonde estaba el siguiente en el 0: así no se nota dónde termina la vuelta.
  {
    const xBoca = xHumo + 19, yBoca = yPieLomo - CHIMENEA.length + 6;
    const AN = 370, AL = 150, xB = AN - 24, yBo = AL - 10, COPOS = 26;
    const copoDe = (q) => (q < 0.03 ? 'm' : q < 0.08 ? 'g' : q < 0.2 ? 'x' : q < 0.86 ? 'X' : q < 0.94 ? 'x' : 'g');
    const cuadros = [];
    for (let f = 0; f < 8; f++) {
      const ind = new Int16Array(AN * AL).fill(-1);
      const pinta = (c, cx, cy, col) => HUMO[c].forEach((fila, j) => { for (let q = 0; q < fila.length; q++) {
        const x = Math.round(cx) + q, y = Math.round(cy) + j;
        if (fila[q] !== '.' && x >= 0 && y >= 0 && x < AN && y < AL) ind[y * AN + x] = col[fila[q]];
      } });
      for (let i = COPOS - 1; i >= 0; i--) {
        const q = (i + f / 8) / COPOS, c = copoDe(q), an = HUMO[c][0].length, al = HUMO[c].length;
        // Negro al salir de la chimenea, gris en el medio y claro cuando ya se abrió.
        const col = dia
          ? (q < 0.1 ? { o: 1, H: 24, h: 31 } : q < 0.24 ? { o: 31, H: 24, h: 23 } : { o: 23, H: 25, h: 24 })
          : q < 0.1 ? { o: 40, H: 41, h: 40 } : q < 0.24 ? { o: 40, H: 19, h: 41 } : { o: 41, H: 20, h: 19 };
        // Primero sube derecho y después se la lleva el viento. Una sola columna, gorda y despareja: los copos se pisan, y se ve el lomo de cada uno.
        const x = xB - Math.pow(q, 1.2) * (AN - 60), y = yBo - Math.pow(q, 0.5) * 100, abre = Math.min(1, q * 4);
        pinta(c, x - an / 2 + Math.sin(q * 19) * 5 * abre, y - al / 2 + Math.cos(q * 14) * 7 * abre, col);
        if (q > 0.08) pinta(c, x - an / 2 + 8 + Math.sin(q * 31 + 1) * 6, y - al / 2 + 8 + Math.cos(q * 23 + 2) * 6, col);
      }
      // El primer tramo sube muy rápido: unos copos chicos más, para que el humo salga pegado a la boca de la chimenea.
      for (let j = 3; j >= 0; j--) {
        const q = ((j + f / 8) / 4) / COPOS, c = j < 2 ? 'c' : 'm';
        pinta(c, xB - Math.pow(q, 1.2) * (AN - 60) - HUMO[c][0].length / 2, yBo - Math.pow(q, 0.5) * 100 - HUMO[c].length / 2, dia ? { o: 1, H: 24, h: 31 } : { o: 40, H: 41, h: 40 });
      }
      cuadros.push(lienzo(iluminar({ ancho: AN, alto: AL, indices: ind, marcas: new Uint8Array(AN * AL), campo: () => 0 }), AN, AL));
    }
    const [hx, hy] = enMundo(xBoca - xB, yBoca - yBo);
    resultado.altas.push({
      x: hx, y: hy, w: AN * PASO, h: AL * PASO, base: map.rows * S + 1,
      get img() { return cuadros[Math.floor(performance.now() / 70) % 8]; },
    });
  }

  // 🔁 La pared de la punta, por encima del marco de la puerta *(Santi)*: el marco sube más que la abertura y se la comía.
  {
    const pi = iluminar({ ancho: W, alto: H, indices: PISO.i, marcas: PISO.m, campo: campoPiso });
    const [mx, my] = enMundo(0, 0);
    resultado.altas.push({ img: lienzo(recorte(pi, 0, 0, 6, yPasillo), 6, yPasillo), x: mx, y: my, w: 6 * PASO, h: yPasillo * PASO, base: 6 * S + 0.01 });
  }

  // La pared de acá, delante de todos.
  {
    const fr = iluminar({ ancho: W, alto: H, indices: FRENTE.i, marcas: FRENTE.m, campo: () => (dia ? 0 : -1) });
    // (🔁 Desde más arriba: los rincones de la curva son parte de esta pared.)
    const yCorte = yAcá - Math.round(CONFIG.tresCuartos.radioEsquina / PASO) - 1;
    const [mx, my] = enMundo(0, yCorte);
    resultado.altas.push({ img: lienzo(recorte(fr, 0, yCorte, W, yCara - yCorte), W, yCara - yCorte), x: mx, y: my, w: W * PASO, h: (yCara - yCorte) * PASO, base: map.rows * S });
  }
  return resultado;
}
