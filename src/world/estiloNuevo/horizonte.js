/**
 * 🏜️ EL HORIZONTE DE LEJOS, EN EL ESTILO NUEVO: la franja de cielo que asoma arriba cuando galopás lejos del tren.
 *
 * 🔁 TERCERA VUELTA *(Santi: "las mesetas altas esas ponelas en el desierto de siempre, que no queden 'detrás'. Y en la
 * parte de detrás ponés el cielo y montañas que apenas se distingue su silueta")*. Las mesetas de colores se fueron al
 * suelo (world/estiloNuevo/suelo.js): están paradas sobre la arena de allá, al fondo. Acá queda lo que está tan lejos
 * que ya es parte del cielo:
 *
 *  - EL CIELO, celeste *(Santi: "mejor hacelo celeste clásico")*, con las nubes, el sol o la luna y las estrellas. De
 *    noche, los azules de la noche; con tormenta, los grises.
 *  - DOS CAPAS DE MONTAÑAS EN SILUETA *(Santi eligió "dos capas de silueta")*: cada una de un solo tono, sin detalles,
 *    apenas distinta del cielo. La de atrás, más alta y más pálida; la de adelante, más baja y un poco más marcada.
 *    Las dos se corren muy despacio con el avance (la de adelante un poco más): eso es lo que se lee como distancia.
 *
 * Las piezas son mapas dibujados a mano (fila por fila; 'd(n)' son n puntos vacíos y 'R(c, n)' n puntos seguidos de la
 * misma letra), repartidos por sorteo fijo: siempre las mismas en el mismo lugar. Se dibuja en coordenadas de PANTALLA
 * (el zoom no lo achica), pero apoyado en una línea del MUNDO, la que le pasa la escena: el desierto empieza ahí.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;
const d = (n) => '.'.repeat(n), R = (c, n) => c.repeat(n);

/** Los colores de las letras: las nubes (la luz, el cuerpo y la panza) y el sol y la luna. */
const COLOR = { u: 30, v: 22, w: 21, o: 30, O: 17, Q: 17, q: 30 };

/**
 * El tono de cada capa de montañas, con cada cielo: [la de atrás, la de adelante]. Apenas distintos del cielo que
 * tienen detrás: de día, más claros (la bruma); de noche, un poco más oscuros.
 */
const TONOS = {
  dia: [22, 25],
  noche: [19, 1],
  tormenta: [25, 24],
};

/** LAS MONTAÑAS DE ATRÁS: cordones largos y altos, con algún pico. */
const LEJANAS = [
  [
    d(58) + R('A', 4),
    d(55) + R('A', 10),
    d(52) + R('A', 16),
    d(50) + R('A', 22),
    d(47) + R('A', 28),
    d(44) + R('A', 34) + d(20) + R('A', 6),
    d(40) + R('A', 41) + d(12) + R('A', 14),
    d(36) + R('A', 49) + d(5) + R('A', 24),
    d(32) + R('A', 85),
    d(28) + R('A', 93),
    d(25) + R('A', 100),
    d(22) + R('A', 108),
    d(18) + R('A', 116),
    d(14) + R('A', 124),
    d(10) + R('A', 132),
    d(6) + R('A', 140),
    d(3) + R('A', 146),
    R('A', 150),
  ],
  [
    d(30) + R('A', 3) + d(46) + R('A', 4),
    d(28) + R('A', 8) + d(41) + R('A', 9),
    d(25) + R('A', 14) + d(36) + R('A', 15),
    d(22) + R('A', 20) + d(30) + R('A', 21),
    d(19) + R('A', 27) + d(22) + R('A', 27),
    d(16) + R('A', 34) + d(12) + R('A', 34),
    d(13) + R('A', 89),
    d(10) + R('A', 96),
    d(7) + R('A', 103),
    d(4) + R('A', 110),
    d(2) + R('A', 116),
    R('A', 122),
  ],
];

/** LAS MONTAÑAS DE ADELANTE: lomadas bajas y redondas. */
const CERCANAS = [
  [
    d(30) + R('B', 8),
    d(24) + R('B', 20),
    d(18) + R('B', 32) + d(22) + R('B', 6),
    d(13) + R('B', 42) + d(12) + R('B', 18),
    d(9) + R('B', 52) + d(4) + R('B', 30),
    d(6) + R('B', 94),
    d(3) + R('B', 102),
    R('B', 110),
  ],
  [
    d(20) + R('B', 10),
    d(14) + R('B', 24),
    d(9) + R('B', 36) + d(10) + R('B', 8),
    d(5) + R('B', 46) + d(2) + R('B', 20),
    d(2) + R('B', 76),
    R('B', 82),
  ],
];

const NUBES = [
  [
    d(10) + 'uuuu' + d(8) + 'uuu',
    d(6) + 'uuuuuuuuu' + d(2) + 'uuuuuuu',
    d(2) + R('u', 26) + d(3) + 'uuuu',
    R('u', 40),
    'vv' + R('u', 35) + 'vvv',
    d(2) + 'vvvvvvwvvvvvvvvvvvwvvvvvvvvvvvvvvvv',
    d(5) + 'wwwwwww' + d(4) + 'wwwwwwwwww' + d(3) + 'wwww',
  ],
  [
    d(8) + 'uuuuu',
    d(3) + 'uuuuuuuuuuuuu',
    R('u', 24),
    'vvvvv' + R('u', 15) + 'vvvvvvv',
    d(2) + 'wwwwwvvvvwwwwwvvvwwww',
  ],
];

const SOL = ['..OOO..', '.OoooO.', 'OoooooO', 'OoooooO', 'OoooooO', '.OoooO.', '..OOO..'];
const LUNA = ['..qqq..', '.qqQ...', 'qqQ....', 'qqQ....', 'qqQ....', '.qqQ...', '..qqq..'];

/** Los escalones del cielo, de arriba para abajo (y en qué parte de la franja empieza cada uno). */
// 🔁 De día, el celeste de siempre *(Santi: "el cambio de los tres colores es muy fuerte, entonces mejor hacelo celeste
// clásico")*: un solo celeste. (Se probó tramar el paso de un celeste al otro y se leía como una fila de puntitos.)
const CIELOS = {
  dia: [[0, 21]],
  noche: [[0, 40], [0.45, 18]],
  tormenta: [[0, 31], [0.4, 23]],
};

/**
 * Cada capa: cada cuántos puntos va una pieza, cuánto se corre como mucho dentro de su lugar, qué parte de los
 * lugares queda vacía, cuánto se mueve con el avance y a qué altura (en puntos sobre el piso) apoya.
 */
const CAPAS = {
  nubes: { cada: 90, corrido: 40, vacio: 0.35, corre: 0.004 },
  lejanas: { cada: 110, corrido: 40, vacio: 0.1, corre: 0.008, apoya: 4 },
  cercanas: { cada: 80, corrido: 30, vacio: 0.2, corre: 0.02, apoya: 0 },
};

/**
 * ⛰️ LAS MESETAS DEL MEDIO *(Santi: "para añadir más profundidad... otro nivel de estas mismas montañas? Sería un
 * intermedio entre las que se ven muy bien y las borrosas del cielo")*. Las mismas mesetas de colores del desierto
 * (world/estiloNuevo/suelo.js), pero muchos kilómetros más allá: más chicas (de lejos no llegan a la mitad de las de
 * adelante), sin rayitas de erosión, con el pie escondido detrás del horizonte y lavadas por el aire, que les come el
 * color y el contraste. Pasan más despacio que el desierto y más rápido que las siluetas: eso es lo que da la
 * profundidad al galopar.
 *
 * Puestos a mano: el borde de cada fila, la tapa, las mordeduras, las canaletas, la repisa y la aguja de cada una. Por
 * regla: la luz y la sombra que salen de esos bordes y el talud (como las de adelante). Mismas letras que allá: T lo de
 * arriba, L al sol, W la pared, X la sombra, G las canaletas; S, P el talud.
 */
const MEDIAS = [
  [
    '......................TTTTTTTT...TTTT...........................',
    '......................XWWWWWWL...XXWWTTTTTTTT...................',
    '...................TTTWWWWLGXWTTTWWWWLGXWWWWWTT.................',
    '...................XXWWWWWLGXWWWWWWWWLGXWWWWWWWT................',
    '..................TXWWWWWWLGXWWWWWWWWLGXWWWWWWWL................',
    '..................XWWWWWWWLGXWWWWWWWWLGXWWWWWWL.................',
    '...................XWWWWWWLGXWWWWWWWWLGXWWWWL...................',
    '..................TWTTTTTTLGXTTTTTTWWWLGXWWWL...T...............',
    '.................TWWXXXXXLGXXXXXXXXWWWLGXWWWL...X.....TT........',
    '.................XXWWWWWWLGXWWWWWWWWWWLGXWWWL.........XL........',
    '................TXWWWWWWWLGXWWWWWWWWWWLGXWWWWTTTT.....XX........',
    '................XWWWWWWWWLGXWWWWWWWWWWLGXWWWWWWWWT....XL........',
    '...............TWWPPPPPPPPPPPPWWWWWWWWLGXWWWWWWWWL....XS........',
    '..............SPPPPPPPPPPPPPPPPPPPWWWWWWWWWWWPPPPPS...XS........',
    '............SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS.XS........',
    '..........SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS..........',
    '........SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS........',
    '.......SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS......',
    '.....SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS.....',
    '....SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS...',
    '..SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS.',
    '.SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
  ],
  [
    '...................TTTTTTTT.....................',
    '...................XXWLGXWWT...T................',
    '................TTTWWWLGXWWWTTTXT...............',
    '................XWWWWWLGXWWWWLGXWT..............',
    '.................XWWWWLGXWWWWLGXL...............',
    '................TWWWWLGXWWWWWWLGXT..............',
    '...............TWWWWWLGXWWWWWWLGXWT.............',
    '...............XXWWWWLGXWWWWWWLGXWL.............',
    '................XXWWWLGXWWWWWWLGXL..............',
    '...T.....TTTTTTTWWWWWWWWWWWWWWWWWWTTTTTTT.......',
    '...X....TXWWWWWWWWWLGXWWWWWWWWWWWWWWWWWWWT......',
    '...X......XWWWWWWWWLGXWWWWWWWWWWWWWWWWWWL.......',
    '...X...T..XXWWWWWWWWLGXWWWWWWWWWWWWWWWWWWT......',
    '...X...X..XWWWWWWWPPPPPPPPPPPPWWWWWWWWWWWWT.....',
    '......TXTTWWWWPPPPPPPPPPPPPPPPPPPPWWWWWWWWWT....',
    '.....SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS...',
    '....SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS..',
    '..SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS.',
    '.SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
    'SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
  ],
  [
    '...........TTTTT..........',
    '...........XLGXWT.........',
    '.........TTWLGXWWT........',
    '.........XXWLGXWWL........',
    '........TXWWLGXWWWT.......',
    '.........XXWLGXWL.........',
    '.........XWWLGXWL.........',
    '........TWWWLGXWL.........',
    '........XXWWLGXWL..T......',
    '.......TTTTLGXTTTTT.......',
    '........XXXLGXXXXXXT...T..',
    '.......TXWWLGXWWWWWL...X..',
    '.......XWWWLGXWWWWWWT..X..',
    '......TWWWWLGXWWWWWL...X..',
    '.......XWWWLGXWWWWWWT..X..',
    '......TWWWWLGXWWWWPPS..X..',
    '.....TWWWWWWWWPPPPPPPS.X..',
    '....SPPPPPPPPPPPPPPPPPS...',
    '...SPPPPPPPPPPPPPPPPPPS...',
    '...XXPPPPPPPPPPPPPPPPPPS..',
    '..SXPPPPPPPPPPPPPPPPPPPPS.',
    '.SXPPPPPPPPPPPPPPPPPPPPPPS',
    'SXPPPPPPPPPPPPPPPPPPPPPPPS',
    'XPPPPPPPPPPPPPPPPPPPPPPPPS',
  ],
];
/** La franja de cada fila (r rojo, o ocre, l lila, v verde), a mano. */
const FRANJAS_MEDIAS = [
  'rrroooovvvooorrrrllloo',
  'rrrooolllooorrrrvvoo',
  'rrrooovvvooorrrrlllooorr',
];
/**
 * 🆕 LAS DEL NIVEL 1, UN POCO MÁS CERCA *(Santi: "hacé algunas de nivel 1 y otras de nivel 2, para dar más profundidad
 * aún. Las de nivel 1 agrandalas apenas más que las 2")*: otras tres, dibujadas a mano a su tamaño (una cuarta parte
 * más grandes; agrandar las otras las dejaría borrosas), con el mismo tipo de bordes y las mismas reglas.
 */
const MEDIAS_1 = [
  [
    '............................TTTTTTTTT....TTTT...................................',
    '...........................TXWWWWWWWL....XXWWTTTTTTTTTT.........................',
    '........................TTTWWWWWLGXWWTTTTWWWWWLGXWWWWWWTTT......................',
    '........................XWWWWWWWLGXWWWWWWWWWWWLGXWWWWWWWWWT.....................',
    '.......................TWWWWWWWWLGXWWWWWWWWWWWWLGXWWWWWWWWL.....................',
    '.......................XXWWWWWWWLGXWWWWWWWWWWWWLGXWWWWWWWL......................',
    '........................XXWWWWWLGXWWWWWWWWWWWWWLGXWWWWWWWWT.....................',
    '.......................TXWWWWWWLGXWWWWWWWWWWWWWLGXWWWWWL...T....................',
    '......................TXWWWWWWWLGXWWWWWWWWWWWWWWLGXWWWWL...X....................',
    '......................XWWWTTTTTLGXTTTTTTTTTWWWWWLGXWWWWL...........T............',
    '.....................TWWWWXXXXXLGXXXXXXXXXXWWWWWLGXWWWWL...T.......XT...........',
    '......................XWWWWWWWWWLGXWWWWWWWWWWWWWLGXWWWWL...XT......XX...........',
    '......................XXWWWWWWWWLGXWWWWWWWWWWWWLGXWWWWWWTTTWL......XL...........',
    '......................XWWWWWWWWWLGXWWWWWWWWWWWWLGXWWWWWWWWWL.......XX...........',
    '......................XXWWWWWWWWLGXWWWWWWWWWWWWLGXWWWWWWWWWWT......XL...........',
    '...................T..XWWWWWWWWWWLGXWWWWWWWWWWLGXWWWWWWWWWWWWT.....XX...........',
    '...................XSSPPPPPPPPWWWLGXWWWWWWWWWWLGXWPPPPPPPPPPPL.....XL...........',
    '..................SPPPPPPPPPPPPPPPWWWWWWWWWWWPPPPPPPPPPPPPPPPPS....XX...........',
    '................SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS..XS...........',
    '..............SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS.............',
    '............SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS...........',
    '..........SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS.........',
    '........SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS.......',
    '......SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS.....',
    '.....SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS....',
    '...SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSS..',
    '.SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS.',
    'SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
  ],
  [
    '........................TTTTTTTTTT..........................',
    '........................XWWWLGXWWWT....T....................',
    '.....................TTTWWWWLGXWWWWTTTTXT...................',
    '....................TWWWWWWWLGXWWWWWWLGXWT..................',
    '.....................XWWWWWWLGXWWWWWWLGXL...................',
    '....................TWWWWWWWLGXWWWWWWLGXWT..................',
    '...................TWWTTTTTTLGXTTTTWWLGXWWT.................',
    '...................XXWXXXXXLGXXXXXXWWWLGXWL.................',
    '....................XXWWWWWLGXWWWWWWWWLGXL..................',
    '...................TXWWWWWWLGXWWWWWWWWLGXWT.................',
    '...................XWWWWWWWLGXWWWWWWWWLGXWWT................',
    '...TT..............XXWWWWWWLGXWWWWWWWWLGXWL.................',
    '...XL......TTTTTTTTWWWWWWWWWWWWWWWWWWWWWWWWTTTTTTTT.........',
    '...XX.....TWWWWWWWWWWWWWLGXWWWWWWWWWWWWWWWWWWWWWWWWT........',
    '...XL.......XXWWWWWWWWWWLGXWWWWWWWWWWWWWWWWWWWWWWWL.........',
    '...XX....T..XWWWWWWWWWWWWLGXWWWWWWWWWWWWWWWWWWWWWWWT........',
    '...XL....X..XXWWWWWWWWWWWLGXWWWWWWWWWWWWWWWWWWWWWWWWT.......',
    '...XX...TWTTWWWWWWPPPPPPPPPPPPWWWWWWWWWWWWWWWWWWWWPPS.......',
    '.......TWWWWWWPPPPPPPPPPPPPPPPPPPPWWWWWWWWWWWPPPPPPPPS......',
    '......SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS.....',
    '.....SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS....',
    '....SPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS...',
    '..SSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS..',
    '.SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS.',
    'SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
  ],
  [
    '..............TTTTTT............',
    '..............XLGXWWT...........',
    '...........TTTWLGXWWWT..........',
    '...........XXWWLGXWWWL..........',
    '..........TXWWWLGXWWWWT.........',
    '...........XXWWLGXWWWL..........',
    '...........XWWLGXWWWL...........',
    '..........TWWWLGXWWWL...........',
    '..........XXWWLGXWWWL..T........',
    '.........TXWWWLGXWWWL...........',
    '..........XXWWLGXWWWL..T........',
    '.........TTTTTLGXTTTTTTL........',
    '.........XXXXXLGXXXXXXXWT...T...',
    '........TWWWWWLGXWWWWWWL....X...',
    '.........XWWWWLGXWWWWWWWT...X...',
    '........TWWWWWWLGXWWWWWWL...X...',
    '........XXWWWWWLGXWWWWWWWT..X...',
    '.......TXWWWWWWLGXWWWWWWL...X...',
    '........XXWWWWWLGXWWWWWWWT..X...',
    '.......TXWWWWWWLGXPPPPPPPS..X...',
    '......TXWWWWWWPPPPPPPPPPPPS.X...',
    '.....SXPPPPPPPPPPPPPPPPPPPPS....',
    '....SXPPPPPPPPPPPPPPPPPPPPPS....',
    '....XPPPPPPPPPPPPPPPPPPPPPPPS...',
    '...SPPPPPPPPPPPPPPPPPPPPPPPPPS..',
    '..SPPPPPPPPPPPPPPPPPPPPPPPPPPPS.',
    '.SPPPPPPPPPPPPPPPPPPPPPPPPPPPPS.',
    '.XXPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
    'SXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
    'XPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPS',
  ],
];
const FRANJAS_MEDIAS_1 = [
  'rrrrooooovvvvoooorrrrllllooo',
  'rrrroooollloooorrrrvvvooo',
  'rrrroooovvvvoooorrrrlllloooorr',
];
const PARTE_MEDIA = { T: 0, L: 0, S: 0, W: 1, P: 1, X: 2, G: 2 };
/**
 * QUÉ TAN LAVADAS: por franja, [al sol, pared, sombra]. Santi vio tres niveles y eligió dos a la vez: las del nivel 2
 * (el color apagado hacia el beige y la piedra) más al fondo, y delante las del nivel 1 (casi tan coloridas como las
 * del desierto). El 3 (casi del color del cielo) quedó afuera. De noche y con tormenta, uno solo para las dos.
 */
const LAVADOS = {
  1: { r: [12, 11, 35], o: [37, 36, 35], l: [25, 24, 24], v: [16, 15, 14] },
  2: { r: [16, 36, 15], o: [16, 15, 24], l: [25, 24, 24], v: [25, 15, 24] },
  noche: { r: [41, 2, 18], o: [19, 41, 18], l: [41, 19, 18], v: [19, 2, 18] },
  tormenta: { r: [25, 24, 23], o: [25, 24, 23], l: [25, 23, 24], v: [24, 25, 23] },
};
const TRAMA_MEDIA = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/**
 * Las dos capas, de atrás para adelante. *(Santi: "poné unas dos o tres de cada uno")*: con la pantalla de unos 640
 * puntos, una cada ~240 y pocos huecos dan dos o tres de cada una. La del nivel 1 pasa casi el doble de rápido que la
 * del 2 (está más cerca) y hunde un poco más el pie.
 */
const CAPAS_MEDIAS = [
  { mapas: MEDIAS, franjas: FRANJAS_MEDIAS, lavado: 2, cada: 230, corrido: 80, vacio: 0.12, corre: 0.07, hunde: 3 },
  { mapas: MEDIAS_1, franjas: FRANJAS_MEDIAS_1, lavado: 1, cada: 250, corrido: 90, vacio: 0.12, corre: 0.13, hunde: 4 },
];

let buf = null, cv = null;

/**
 * La franja entera, en pantalla. 'hy': su alto en unidades de pantalla (0 o menos, nada); 'ancho': el de la pantalla;
 * 'avance': cuánto se corrió el mundo sobre el suelo.
 */
export function dibujarHorizonteNuevo(ctx, { hy, ancho, avance, dia, tormenta = false }) {
  if (hy <= 0) return;
  const W = Math.ceil(ancho / PASO) + 1, H = Math.round(hy / PASO);
  if (H <= 0) return;
  if (!buf || buf.length < W * H) buf = new Int16Array(W * H);
  const ind = buf.subarray(0, W * H);
  const cielo = tormenta ? 'tormenta' : dia ? 'dia' : 'noche';
  const pv = (x, y, i) => { if (x >= 0 && y >= 0 && x < W && y < H) ind[y * W + x] = i; };
  const estampar = (mapa, sx, sy, tono) => {
    for (let j = 0; j < mapa.length; j++) for (let i = 0; i < mapa[j].length; i++) {
      const l = mapa[j][i];
      if (l !== '.') pv(sx + i, sy + j, tono ?? COLOR[l]);
    }
  };
  const capa = (C, piezas, piso, tono) => {
    const dx = Math.round((avance * C.corre) / PASO);
    for (let n = Math.floor(dx / C.cada) - 2; n <= Math.floor((dx + W) / C.cada) + 1; n++) {
      if (hash(n, C.cada) < C.vacio) continue;
      const p = piezas[Math.floor(hash(n, C.cada + 7) * piezas.length)];
      // (Las nubes no apoyan en nada: flotan en el tercio de arriba.)
      const y = piso == null ? 1 + Math.floor(hash(n, 3) * Math.max(1, H * 0.3)) : piso - C.apoya - p.length;
      estampar(p, n * C.cada - dx + Math.floor(hash(n, C.cada + 1) * C.corrido), y, tono);
    }
  };

  // 1. El cielo, por escalones.
  for (let y = 0; y < H; y++) {
    let c = CIELOS[cielo][0][1];
    for (const [desde, i] of CIELOS[cielo]) if (y >= desde * H) c = i;
    ind.fill(c, y * W, (y + 1) * W);
  }
  // 2. Las estrellas (de noche), el astro y las nubes (de día).
  if (cielo === 'noche') {
    for (let n = 0; n < 70; n++) {
      const sx = Math.floor(hash(n, 7) * W), sy = Math.floor(hash(n, 13) * (H * 0.6));
      pv(sx, sy, hash(n, 29) < 0.3 ? 30 : 22);
    }
  }
  if (cielo !== 'tormenta' && H > 30) {
    const cx = Math.round(W * 0.78), cy = Math.round(H * 0.24);
    estampar(dia ? SOL : LUNA, cx - 3, cy - 3);
  }
  if (cielo === 'dia') capa(CAPAS.nubes, NUBES, null);

  // 3. Las dos capas de montañas, apoyadas en la línea del horizonte (abajo de la franja). Debajo de cada capa, su
  //    mismo tono hasta el piso, para que no queden huecos entre una pieza y la otra.
  const piso = H, [atras, adelante] = TONOS[cielo];
  capa(CAPAS.lejanas, LEJANAS, piso, atras);
  for (let y = piso - CAPAS.lejanas.apoya; y < piso; y++) for (let x = 0; x < W; x++) pv(x, y, atras);
  capa(CAPAS.cercanas, CERCANAS, piso, adelante);
  for (let y = piso - 2; y < piso; y++) for (let x = 0; x < W; x++) pv(x, y, adelante);

  // 4. Las mesetas del medio, en sus dos capas, delante de las siluetas, con el pie hundido detrás del horizonte. Cada punto toma su
  //    franja con la misma onda y el mismo tramado que las de adelante (suelo.js, pintarMesetas).
  for (const C of CAPAS_MEDIAS) {
    const tabla = LAVADOS[cielo === 'dia' ? C.lavado : cielo], MEDIAS_C = C.mapas;
    const dx = Math.round((avance * C.corre) / PASO);
    for (let n = Math.floor(dx / C.cada) - 2; n <= Math.floor((dx + W) / C.cada) + 1; n++) {
      if (hash(n, C.cada) < C.vacio) continue;
      const k = Math.floor(hash(n, C.cada + 7) * MEDIAS_C.length), mapa = MEDIAS_C[k], franjas = C.franjas[k];
      const sx = n * C.cada - dx + Math.floor(hash(n, C.cada + 1) * C.corrido), sy = piso - mapa.length + C.hunde;
      for (let i = 0; i < mapa[0].length; i++) {
        const onda = 0.8 * Math.sin(i / 11 + k * 2) + 0.4 * Math.sin(i / 3.7 + k);
        for (let j = 0; j < mapa.length; j++) {
          const l = mapa[j][i];
          if (l === '.') continue;
          const mezcla = (TRAMA_MEDIA[(j & 3) * 4 + (i & 3)] / 16 - 0.5) * 1.4;
          const jj = Math.max(0, Math.min(mapa.length - 1, Math.floor(j + onda + mezcla + 0.5)));
          pv(sx + i, sy + j, tabla[franjas[jj]][PARTE_MEDIA[l]]);
        }
      }
    }
  }

  // (El cielo y las montañas ya vienen con su luz: no se oscurecen de noche.)
  const datos = iluminar({ ancho: W, alto: H, indices: ind, campo: () => 0 });
  if (!cv) cv = document.createElement('canvas');
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  cv.getContext('2d').putImageData(new ImageData(datos, W, H), 0, 0);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, 0, 0, W * PASO, H * PASO);
  ctx.imageSmoothingEnabled = prev;
}
