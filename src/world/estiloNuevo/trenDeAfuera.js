/**
 * 🚂 EL TREN DE AFUERA, EN EL ESTILO NUEVO: el que se ve desde el caballo y desde el techo *(Santi eligió empezar por el de pasajeros, y
 * después: "vamos con la C y aplicalo en los demás vagones. Recuerda que hay algunos que tienen pared de chapa o directamente no tienen pared")*.
 *
 * Mide lo mismo que el dibujo viejo (`MEDIDAS`, world/trenTresCuartos.js), así que el galope y el techo no cambian en nada que se juegue.
 * Va en la grilla nueva: un punto son 0,75 unidades, 3 píxeles con el zoom de cerca.
 *
 * Cada vagón se arma de la tabla AFUERA: qué pared lleva (tablas acostadas, chapa, barandas, nada), de qué color, qué techo y qué ventanas.
 *
 * A mano, en mapas: las ventanas, los nudos, las rejas y rejillas, las troneras, la escotilla, las bocas del hielo, la garita, el brazo del
 * correo, las vacas, la carga de la plataforma, la chimenea, el ventilador, el parche, el cilindro, el carretón y los 8 cuadros de la rueda.
 * Sale de una cuenta lo que se repite a lo largo: las tablas con sus vetas y grietas, las chapas con sus remaches y óxido, el carbón, las
 * hojas de las puertas y los tirantes.
 */

import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { RGB, PALETA } from '../../engine/paleta.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;
/** Alto de la lámina, en puntos: del tope de la chimenea hasta la vía. */
const H = 107;
/** La vía, abajo de todo: todo vagón apoya ahí. */
/** 🔁 LO HONDO DEL VAGÓN VISTO DESDE LA CÁMARA, en puntos: lo que mide el techo, y lo que mide el piso de los abiertos. */
export const HONDO = { puntos: 44 };

/** Los colores de la noche, a mano: la madera se apaga sin caer en los violetas *(Santi: "de noche se ve demasiado raro, oscuro y muy violeta")*. */
export const NOCHE = { 13: 12, 12: 11, 11: 47, 5: 47, 47: 3, 7: 5, 25: 24, 24: 23, 23: 31, 4: 3, 3: 1, 1: 1, 14: 33, 15: 14, 16: 15, 17: 16, 8: 39, 9: 8, 10: 9, 26: 42, 42: 0, 27: 26, 39: 0, 28: 5 };

/**
 * 🔁 De noche, apenas una luz de adentro: las cortinas están cerradas y el farol queda lejos *(Santi: "no deberían estar tan fuerte la luz de
 * las ventanas, se debería ver un poco de luz, no algo tan exagerado")*. Arriba un poco más, y se apaga hacia abajo.
 */
export const COL_VENTANA = { o: 0, M: 5, V: 21, v: 20, R: 22, s: 19, A: 35 };
export const COL_VENTANA_NOCHE = { o: 0, M: 3, V: 5, v: 4, R: 5, s: 47, A: 4 };
export const COL_FIERRO = { o: 0, H: 24, h: 23, A: 24, B: 28, V: 21, M: 5, r: 11, x: 31 };
const COL_RUEDA = { o: 0, H: 25, A: 24, a: 23, S: 24, s: 23, k: 23, K: 25, B: 7, n: 1 };
const COL_PARCHE = { o: 31, H: 25, h: 24, r: 11, x: 31 };

/**
 * 🔁 LA VENTANA, CUADRADA Y COMO LAS DE ADENTRO *(Santi: "la ventana debería tener forma cuadrada, como las del interior")*: el marco de
 * madera y la cruz que parte el vidrio en cuatro, con el reflejo del cielo en diagonal; debajo, la repisa.
 */
export const VENTANA = [
  '.oooooooooooooooooooooo.',
  '.oMMMMMMMMMMMMMMMMMMMMo.',
  '.oMooooooooooooooooooMo.',
  '.oMoVVVRRVVMMVVVVVVRoMo.',
  '.oMoVVRRVVVMMVVVVVRRoMo.',
  '.oMoVRRVVVRMMVVVVRRVoMo.',
  '.oMoRRVVVRVMMVVVRRVVoMo.',
  '.oMoRVVVRVVMMVVRRVVVoMo.',
  '.oMoVVVVVVVMMVVVVVVVoMo.',
  '.oMovvvvvvvMMvvvvvvvoMo.',
  '.oMovvvvvvvMMvvvvvvvoMo.',
  '.oMoMMMMMMMMMMMMMMMMoMo.',
  '.oMovvvvvRvMMvvRRvvvoMo.',
  '.oMovvvvRvvMMvRRvvvvoMo.',
  '.oMovvvRvvvMMRRvvvvvoMo.',
  '.oMovvvvvvvMMvvvvvvvoMo.',
  '.oMosssssssMMsssssssoMo.',
  '.oMosssssssMMsssssssoMo.',
  '.oMosssssssMMsssssssoMo.',
  '.oMooooooooooooooooooMo.',
  '.oMMMMMMMMMMMMMMMMMMMMo.',
  '.oooooooooooooooooooooo.',
  'AAAAAAAAAAAAAAAAAAAAAAAA',
  'oooooooooooooooooooooooo',
];

/** LOS NUDOS DE LA MADERA. */
const NUDOS = [
  [
    '..s..',
    '.sds.',
    'sdnds',
    'sdnds',
    '.sds.',
    '..s..',
  ],
  [
    '.s.',
    'sds',
    'sns',
    'sds',
    '.s.',
  ],
];

/**
 * 🔁 LOS TONOS DE LA MADERA, TODOS DE LA MISMA FAMILIA *(Santi: "hay mucha variedad de colores, salta de un marrón a un gris y después un
 * rojo, es demasiado")*: cada uno con su veta clara y su veta oscura, a un escalón de distancia.
 */
const TABLAS_DIA = [[4, 34, 33], [33, 4, 3], [34, 35, 4], [4, 34, 3], [33, 34, 3], [34, 4, 33]];
const TABLAS_NOCHE = [[3, 33, 32], [33, 47, 3], [32, 3, 33], [3, 47, 32], [33, 4, 32], [32, 33, 3]];

/**
 * LAS MADERAS DE CADA VAGÓN. Dentro de un vagón, una sola familia *(Santi: "es demasiado" el salto de color)*; de un vagón a otro, cada uno la suya.
 *   d, n    los tonos de las tablas, de día y de noche: [color, veta clara, veta oscura]
 *   j, c    la junta y el canto que agarra luz, [día, noche]
 *   cin     la moldura de la cintura, [día, noche], cada una [luz, cuerpo, sombra]
 *   banda   el fondo del cartel; filete, sus dos rayas; texto, las letras
 *   punta   cómo se dobla la pared en las puntas
 */
const MADERAS = {
  marron: { d: TABLAS_DIA, n: TABLAS_NOCHE, j: [3, 32], c: [35, 4], cin: [[5, 11, 3], [4, 47, 32]], banda: 47, filete: 7, texto: 7, punta: [0, 3, 3, 47, 47] },
  comedor: { d: [[4, 5, 3], [34, 11, 33], [4, 11, 47], [11, 5, 4]], n: [[3, 47, 32], [47, 33, 3], [3, 33, 32], [33, 47, 3]], j: [3, 32], c: [35, 4], cin: [[5, 11, 3], [4, 47, 32]], banda: 47, filete: 7, texto: 7, punta: [0, 3, 3, 47, 47] },
  correo: { d: [[34, 35, 33], [4, 34, 33], [35, 36, 34], [34, 4, 3]], n: TABLAS_NOCHE, j: [3, 32], c: [36, 4], cin: [[35, 34, 3], [4, 47, 32]], banda: 8, filete: 16, texto: 17, punta: [0, 3, 3, 47, 47] },
  guardias: { d: [[33, 34, 3], [4, 34, 33], [33, 4, 32], [4, 33, 3]], n: TABLAS_NOCHE, j: [32, 32], c: [34, 4], cin: [[4, 33, 32], [47, 3, 32]], banda: 32, filete: 15, texto: 16, punta: [0, 32, 32, 3, 3] },
  oscuro: { d: [[3, 33, 32], [33, 4, 3], [32, 33, 0]], n: [[32, 3, 0], [3, 33, 32], [32, 33, 0]], j: [0, 0], c: [34, 33], cin: [[4, 33, 0], [33, 3, 0]], banda: 32, filete: 15, texto: 16, punta: [0, 0, 32, 32, 3] },
  verde: { d: [[26, 14, 42], [42, 26, 42], [26, 14, 42], [42, 26, 42]], n: [[42, 26, 0], [42, 26, 0], [0, 42, 0]], j: [0, 0], c: [26, 26], cin: [[14, 26, 42], [26, 42, 0]], banda: 42, filete: 15, texto: 16, punta: [0, 0, 42, 42, 26] },
  vino: { d: [[39, 8, 1], [8, 9, 39], [39, 47, 1]], n: [[39, 8, 0], [0, 39, 0], [39, 47, 0]], j: [0, 0], c: [9, 8], cin: [[28, 7, 39], [5, 4, 0]], banda: 39, filete: 28, texto: 28, punta: [0, 0, 39, 39, 8] },
  rojo: { d: [[9, 11, 8], [8, 9, 39], [9, 11, 8], [8, 11, 39]], n: [[39, 8, 0], [8, 9, 39], [39, 47, 0]], j: [39, 0], c: [11, 9], cin: [[11, 9, 39], [9, 8, 0]], banda: 8, filete: 16, texto: 17, punta: [0, 39, 39, 8, 8] },
  cal: { d: [[16, 17, 15], [15, 16, 14], [16, 17, 15], [15, 16, 14]], n: [[14, 15, 33], [14, 34, 33], [34, 14, 33]], j: [14, 33], c: [17, 15], cin: [[17, 16, 14], [15, 14, 33]], banda: 15, filete: 14, texto: 3, punta: [0, 14, 14, 15, 15] },
  barandas: { d: [[34, 35, 33], [33, 34, 3], [4, 34, 3]], n: [[3, 33, 32], [33, 47, 3], [32, 3, 33]], j: [3, 32], c: [35, 4], cin: [[35, 34, 3], [33, 3, 32]], banda: 47, filete: 7, texto: 7, punta: [0, 3, 3, 47, 47] },
  plataforma: { d: [[34, 35, 33], [4, 34, 3], [33, 34, 3]], n: [[3, 33, 32], [33, 47, 3]], j: [3, 32], c: [35, 4], cin: [[35, 34, 3], [33, 3, 32]], banda: 47, filete: 7, texto: 7, punta: [0, 3, 3, 47, 47] },
};

/** LAS CHAPAS: [cuerpo, luz, sombra] (la noche la da NOCHE). */
const CHAPAS = { blindado: [23, 24, 31], gondola: [31, 23, 1] };

/**
 * QUÉ LLEVA CADA VAGÓN POR AFUERA.
 *   forma    'caja' (lo que no se aclare), 'gondola', 'ganado', 'plataforma'
 *   madera   la familia de MADERAS; chapa, en vez de madera
 *   techo    'linterna', 'pasarela', 'escotilla', 'hielo', 'garita'
 *   vent     'vidrio', 'reja', 'rejilla' o nada; colD/colN, los colores si cambian (las cortinas)
 *   puerta   la corrediza del medio; arriba, cuántos puntos de más necesita arriba de la lámina
 */
const CORTINA = { s: 16, v: 16 }, CORTINA_N = { s: 4, v: 47 };
export const AFUERA = {
  pasajeros: { madera: 'marron', techo: 'linterna', vent: 'vidrio', cartel: 'PASAJEROS' },
  comedor: { madera: 'comedor', techo: 'linterna', vent: 'vidrio', cartel: 'COMEDOR', colD: CORTINA, colN: CORTINA_N },
  dormitorio: { madera: 'verde', techo: 'linterna', vent: 'vidrio', cartel: 'DORMITORIO', colD: { s: 16, v: 16, V: 16, R: 37 }, colN: { s: 47, v: 47, V: 4, R: 4 } },
  primeraClase: { madera: 'vino', techo: 'linterna', vent: 'vidrio', cartel: '1A CLASE', colD: { M: 7, A: 28 }, colN: { M: 4, A: 5 }, poco: true },
  guardias: { madera: 'guardias', techo: 'pasarela', vent: 'reja', cartel: 'GUARDIAS', puerta: true },
  correo: { madera: 'correo', techo: 'pasarela', vent: 'vidrio', cartel: 'CORREO', puerta: true, brazo: true },
  correo_liviano: { madera: 'correo', techo: 'pasarela', vent: 'vidrio', cartel: 'CORREO', puerta: true },
  cerrado: { madera: 'marron', techo: 'pasarela', cartel: 'CERRADO', porton: true },
  almacen: { madera: 'oscuro', techo: 'pasarela', vent: 'reja', cartel: 'ALMACEN', puerta: true },
  armas: { madera: 'verde', techo: 'pasarela', vent: 'reja', cartel: 'ARMAS', puerta: true, franja: 'PELIGRO POLVORA' },
  refrigerado: { madera: 'cal', techo: 'hielo', vent: 'rejilla', cartel: 'REFRIGERADO', puerta: true },
  caboose: { madera: 'rojo', techo: 'garita', vent: 'vidrio', cartel: 'CABOOSE', arriba: 8 },
  blindado: { chapa: 'blindado', techo: 'escotilla', cartel: 'BLINDADO', puerta: true, troneras: true },
  gondola: { forma: 'gondola', chapa: 'gondola' },
  ganado: { forma: 'ganado', madera: 'barandas' },
  plataforma: { forma: 'plataforma', madera: 'plataforma' },
};

/** LA VENTANA CHICA CON BARROTES (los furgones: hay gente, pero no se la invita a mirar). */
const VENTANA_REJA = [
  'oooooooooooooooooo',
  'oMMMMMMMMMMMMMMMMo',
  'oMooooooooooooooMo',
  'oMoVRoVVoVRoVVVoMo',
  'oMoRVoVVoRVoVVVoMo',
  'oMoVVoVVoVVoVVVoMo',
  'oMovvovvovvovvvoMo',
  'oMovvovvovvovvvoMo',
  'oMossossossosssoMo',
  'oMossossossosssoMo',
  'oMooooooooooooooMo',
  'oMMMMMMMMMMMMMMMMo',
  'AAAAAAAAAAAAAAAAAA',
  'oooooooooooooooooo',
];

/** LA REJILLA DEL REFRIGERADO: tablillas, no vidrio. Adentro no hay luz. */
const REJILLA = [
  'oooooooooooooooooo',
  'oMMMMMMMMMMMMMMMMo',
  'oMooooooooooooooMo',
  'oMoHHHHHHHHHHHHoMo',
  'oMoxxxxxxxxxxxxoMo',
  'oMoHHHHHHHHHHHHoMo',
  'oMoxxxxxxxxxxxxoMo',
  'oMoHHHHHHHHHHHHoMo',
  'oMoxxxxxxxxxxxxoMo',
  'oMooooooooooooooMo',
  'oMMMMMMMMMMMMMMMMo',
  'oooooooooooooooooo',
];
const COL_REJILLA = { o: 0, M: 15, H: 24, x: 31 };

/** LA TRONERA DEL BLINDADO, con su tapa corrida. */
const TRONERA = [
  'ooooooooooo',
  'oHHHHHHHHho',
  'oHxxxxxxxho',
  'oHxxxxxxxho',
  'ohhhhhhhhho',
  'ooooooooooo',
];
const COL_TRONERA = { o: 0, H: 24, h: 23, x: 1 };

/** LA ESCOTILLA DEL BLINDADO, en el techo, con su manija y sus remaches. */
const ESCOTILLA = [
  'oooooooooooooooooooooooooo',
  'oHHxHHHHHHHHHHHHHHHHHHxHHo',
  'oHHHHHHHHHHHHHHHHHHHHHHHHo',
  'oHHooooooooooooooooooooHHo',
  'oHHohhhhhhhhhhhhhhhhhhoHHo',
  'oHHohhhhhhhhhhhhhhhhhhoHHo',
  'oHHohhhhhhoooooohhhhhhoHHo',
  'oHHohhhhhhoHHHHohhhhhhoHHo',
  'oHHohhhhhhoooooohhhhhhoHHo',
  'oHHohhhhhhhhhhhhhhhhhhoHHo',
  'oHHooooooooooooooooooooHHo',
  'oHHxHHHHHHHHHHHHHHHHHHxHHo',
  'oooooooooooooooooooooooooo',
  'ohhhhhhhhhhhhhhhhhhhhhhhho',
  'oooooooooooooooooooooooooo',
];

/** LA BOCA DEL HIELO, en el techo del refrigerado: el marco de fierro y la tapa de madera con su argolla. */
const BOCA_HIELO = [
  'oooooooooooooooooo',
  'oHHHHHHHHHHHHHHHHo',
  'oHxooooooooooooxHo',
  'oHoMMMMMMMMMMMMoHo',
  'oHoMMMMMMMMMMMMoHo',
  'oHoMMMMooooMMMMoHo',
  'oHoMMMMoMMoMMMMoHo',
  'oHoMMMMooooMMMMoHo',
  'oHoMMMMMMMMMMMMoHo',
  'oHxooooooooooooxHo',
  'oHHHHHHHHHHHHHHHHo',
  'oooooooooooooooooo',
  'ohhhhhhhhhhhhhhhho',
  'oooooooooooooooooo',
];

/** LA GARITA DEL CABOOSE, apoyada a media tapa: desde ahí la tripulación mira el tren entero. */
const GARITA = [
  '....ooooooooooooooooooooooooooooooooooooo....',
  '...oHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHo...',
  '..oHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHo..',
  '.oHHHHHHHxHHHHHHHHHHHHHHHHHHHHHHHHHxHHHHHHHo.',
  'oHHHHHHHHxHHHHHHHHHHHHHHHHHHHHHHHHHxHHHHHHHHo',
  'oHHHHHHHHxHHHHHHHHHHHHHHHHHHHHHHHHHxHHHHHHHHo',
  'oHHHHHHHHxHHHHHHHHHHHHHHHHHHHHHHHHHxHHHHHHHHo',
  'oHHHHHHHHxHHHHHHHHHHHHHHHHHHHHHHHHHxHHHHHHHHo',
  'ohhhhhhhhxhhhhhhhhhhhhhhhhhhhhhhhhhxhhhhhhhho',
  'ohhhhhhhhxhhhhhhhhhhhhhhhhhhhhhhhhhxhhhhhhhho',
  'ooooooooooooooooooooooooooooooooooooooooooooo',
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'ooooooooooooooooooooooooooooooooooooooooooooo',
  '..oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo..',
  '..orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro..',
  '..oRRRoooooooooooooRRRRRRRoooooooooooooRRRo..',
  '..oRRRoVVWVVoVVWVVoRRRRRRRoVVWVVoVVWVVoRRRo..',
  '..orrroVWVVVoVWVVVorrrrrrroVWVVVoVWVVVorrro..',
  '..oRRRovvvvvovvvvvoRRRRRRRovvvvvovvvvvoRRRo..',
  '..oRRRoooooooooooooRRRRRRRoooooooooooooRRRo..',
  '..orrrosssssosssssorrrrrrrosssssosssssorrro..',
  '..oRRRoooooooooooooRRRRRRRoooooooooooooRRRo..',
  '..oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo..',
  '..orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro..',
  '..oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo..',
  '..ooooooooooooooooooooooooooooooooooooooooo..',
];
const COL_GARITA = { o: 0, H: 24, h: 23, x: 31, B: 25, R: 9, r: 8, V: 21, v: 20, s: 19, W: 22 };
const COL_GARITA_N = { o: 0, H: 23, h: 31, x: 1, B: 24, R: 39, r: 0, V: 5, v: 4, s: 47, W: 5 };

/** EL BRAZO DEL CORREO: el poste de fierro con los dos brazos y el gancho, para levantar la saca sin parar el tren. */
const BRAZO = [
  '......ooo',
  '......oHo',
  'ooooooooo',
  'oHHHHHHHo',
  'ooooooooo',
  '......oHo',
  '......oHo',
  '......oHo',
  '...oooooo',
  '...oHH.Ho',
  '...ooo.Ho',
  '......oHo',
  '......oHo',
  '......oHo',
  '......oHo',
  'ooooooooo',
  'oHHHHHHHo',
  'ooooooooo',
  '......oHo',
  '......oho',
  '......ooo',
];

/** LA VACA, ENTERA Y PARADA SOBRE EL PISO: de arriba se le ve el lomo. */
const VACA = [
  '....ooooooooooooooooooo....',
  '..ooLLLLLLLLLLLLLLLLLLLoo..',
  '.oLLLLLLLLLLLLLLLLLLLLLLLo.',
  'oPPPPPPPPPPPPMMMMPPPPPPPPPo',
  'oPPPPMMMPPPPPMMMMMPPPPPPPPo',
  'oPPPPMMMMPPPPPMMMPPPPPPPPPo',
  'oPPPPPMMPPPPPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPPPPPPPPPPPSo',
  'oPPPPPPPPPPPPPPPPPPPPPPSSSo',
  'oSPPPPPPPPPPPPPPPPPPPSSSSSo',
  'oSSSSSSSSSSSSSSSSSSSSSSSSSo',
  'oSSSSSSSSSSSSSSSSSSSSSSSSSo',
  'oSSSSSSSSSSSSSSSSSSSSSSSSSo',
  '.ooooooooooooooooooooooooo.',
  '..oSSooGo.........oGooSSo..',
  '..oSSooGo.........oGooSSo..',
  '..oSSooGo.........oGooSSo..',
  '..oSSooGo.........oGooSSo..',
  '..oSSooGo.........oGooSSo..',
  '..oPPooGo.........oGooPPo..',
  '..ooooooo.........ooooooo..',
];
/** LA VACA, LA CABEZA, con los cuernos: cabecea moviéndose entera. */
const CABEZA = [
  '.oo.....oo.',
  'oHHo...oHHo',
  '.ooHoooHoo.',
  '..oPPPPPo..',
  '.oPPPPPPPo.',
  '.oPoPPPoPo.',
  '.oPPPPPPPo.',
  '..oLLLLLo..',
  '..oLnLnLo..',
  '..oLLLLLo..',
  '...ooooo...',
];
const COL_VACAS = [{ o: 0, P: 4, L: 5, S: 3, M: 3, H: 16, n: 0, G: 32 }, { o: 0, P: 16, L: 17, S: 15, M: 34, H: 15, n: 0, G: 32 }];

/** LA CARGA DE LA PLATAFORMA, amarrada: un cajón con su tapa y sus sogas, y una pila tapada con lona. */
const CAJON = [
  'oooooooooooooooooooooooooooooo',
  'oTTTTTTTTKTTTTTTTTTTKTTTTTTTTo',
  'ottttttttKttttttttttKtttttttto',
  'oTTTTTTTTKTTTTTTTTTTKTTTTTTTTo',
  'ottttttttKttttttttttKtttttttto',
  'oTTTTTTTTKTTTTTTTTTTKTTTTTTTTo',
  'oooooooooooooooooooooooooooooo',
  'oDDDDDDDDKDDDDDDDDDDKDDDDDDDDo',
  'oDFFFFFFFKFFFFFFFFFFKFFFFFFFDo',
  'oDFFFfFFFKFFFFFFFFFfKFFFFFFFDo',
  'oDFFFFfFFKFFFFFFFFfFKFFFFFFFDo',
  'oDFFFFFfFKFFFFFFFfFFKFFFFFFFDo',
  'oDffffffffffffffffffffffffffDo',
  'oDFFFFFFFKfFFFFfFFFFKFFFFFFFDo',
  'oDFFFFFFFKFfFFfFFFFFKFFFFFFFDo',
  'oDFFFFFFFKFFffFFFFFFKFFFFFFFDo',
  'oDFFFFFFFKFFffFFFFFFKFFFFFFFDo',
  'oDDDDDDDDKDDDDDDDDDDKDDDDDDDDo',
  'oooooooooooooooooooooooooooooo',
];
const LONA = [
  '.......oooooooooooooooooooo.........',
  '....oooGGGGGGGGGGGGGGGGGGGGooo......',
  '..ooGGGGGGGGKGGGGGGGGGKGGGGGGGoo....',
  '.oGGGGgGGGGGKGGGGgGGGGKGGGGGgGGGoo..',
  'oGGGGGGgGGGGKGGGGGgGGGKGGGGGGgGGGGo.',
  'oGGGGGGGgGGGKGGGGGGgGGKGGGGGGGgGGGGo',
  'ogggggggggggKgggggggggKggggggggggggo',
  'oSSSSSSSSSSSKSSSSSSSSSKSSSSSSSSSSSSo',
  'oSSSsSSSSSSSKSSSSsSSSSKSSSSSSSsSSSSo',
  'oSSSSsSSSSSSKSSSSSsSSSKSSSSSSSSsSSSo',
  'oSSSSSsSSSSSKSSSSSSsSSKSSSSSSSSSsSSo',
  'oSSSSSSSSSSSKSSSSSSSSSKSSSSSSSSSSSSo',
  'oKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKo',
  'oSSSSSSSsSSSKSSSSSSSSsKSSSSSSsSSSSSo',
  'oSSSSSSSSsSSKSSSSSSSSSKSSSSSSSsSSSSo',
  'oSSSSSSSSSSSKSSSSSSSSSKSSSSSSSSSSSSo',
  'oooooooooooooooooooooooooooooooooooo',
];
const COL_CARGA = { o: 0, T: 36, t: 35, K: 16, D: 4, F: 34, f: 33, G: 15, g: 14, S: 14, s: 33 };

/** EL PARCHE DE CHAPA, clavado encima de la chapa vieja. */
const PARCHE = [
  'ooooooooooo',
  'oHxhhhhhxho',
  'ohhhrhhhhho',
  'ohhrrhhhhho',
  'oHxhhhhhxho',
  'ooooooooooo',
];

/** EL VENTILADOR DEL TECHO, de chapa, con su pie. */
export const VENTILADOR = [
  '.ooooo.',
  'oHHHHho',
  'oHHHhho',
  '.ooooo.',
  '..oho..',
  '..ooo..',
];

/** LA CHIMENEA DE LA ESTUFA, sobre la linterna. */
export const CHIMENEA = [
  '..ooooo..',
  '.oHHHHHo.',
  'oHoooooho',
  'oHoxxxoho',
  'oHHoooHho',
  '.ooooooo.',
  '..oHhro..',
  '..oHhro..',
  '..oHrxo..',
  '.ooooooo.',
  '.oHHhhxo.',
  '.ooooooo.',
];

/** EL VENTILETE DE LA LINTERNA: un vidrio chiquito con su marco. */
const VENTILETE = [
  'ooooo',
  'oVoVo',
  'oVoVo',
  'ooooo',
];

/** EL CILINDRO DEL FRENO, colgado del bastidor. */
const CILINDRO = [
  'ooooooooooo',
  'oHHHHHHHHho',
  'ohhhhhhhhho',
  'ooooooooooo',
];

/** EL CARRETÓN: va encima de las ruedas, con el travesaño abulonado, la chapa con óxido, las hojas del resorte en el medio y las cajas de los ejes con su tornillo. */
const CARRETON = [
  '..........ooooooooooooo..........',
  '..........oHxhhhhhhhxho..........',
  '...ooooooooooooooooooooooooooo...',
  '...oHHxHHHHHHHHHHHHHHHHHHHxHHo...',
  '...ohhhhhhhrhhhhhhhhhrrhhhhhho...',
  '...ooooooooooooooooooooooooooo...',
  '.....ooo....ooooooooo....ooo.....',
  '.....oho....oHHHHHHHo....oho.....',
  '.....oho....ohhhhhhho....oho.....',
  '....ooooo...oHHHHHHHo...ooooo....',
  '....oHxHo...ooooooooo...oHxHo....',
  '....ooooo...............ooooo....',
];

/**
 * 🔁 LA RUEDA, MÁS GRANDE Y CON MÁS DETALLE: 17 puntos, unos 90 cm, lo que mide la de un coche de verdad al lado de la gente *(Santi: "las
 * ruedas no están algo pequeñas?"; "el nivel de detalle no concuerda")*. La llanta con la luz arriba y la sombra abajo (eso no gira), los
 * rayos con su lado oscuro y el cubo. 8 cuadros por vuelta: los rayos van de + a × y la marca da la vuelta. (Lo de adentro, oscuro: ver piezasDe.)
 */
const RUEDA = [
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo.BsooAAAo.',
    '.oHAo...Ss..oAAo.',
    'oHAo....Ss...oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAoSSokKkoSSoAao',
    'oAAossokkkossoAao',
    'oAAo..ooooo..oAao',
    'oAAo....Ss...oaao',
    '.oAAo...Ss..oaao.',
    '.oAAAoo.Ssooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo...ooAAAo.',
    '.oHAoSs...SBoAAo.',
    'oHAo..Ss.Ss..oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAo..okKko..oAao',
    'oAAo..okkko..oAao',
    'oAAo..ooooo..oAao',
    'oAAo..Ss.Ss..oaao',
    '.oAAoSs...Ssoaao.',
    '.oAAAoo...ooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo.SsooAAAo.',
    '.oHAo...Ss..oAAo.',
    'oHAo....Ss...oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAoSSokKkoSBoAao',
    'oAAossokkkossoAao',
    'oAAo..ooooo..oAao',
    'oAAo....Ss...oaao',
    '.oAAo...Ss..oaao.',
    '.oAAAoo.Ssooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo...ooAAAo.',
    '.oHAoSs...SsoAAo.',
    'oHAo..Ss.Ss..oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAo..okKko..oAao',
    'oAAo..okkko..oAao',
    'oAAo..ooooo..oAao',
    'oAAo..Ss.Ss..oaao',
    '.oAAoSs...SBoaao.',
    '.oAAAoo...ooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo.SsooAAAo.',
    '.oHAo...Ss..oAAo.',
    'oHAo....Ss...oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAoSSokKkoSSoAao',
    'oAAossokkkossoAao',
    'oAAo..ooooo..oAao',
    'oAAo....Ss...oaao',
    '.oAAo...Ss..oaao.',
    '.oAAAoo.Bsooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo...ooAAAo.',
    '.oHAoSs...SsoAAo.',
    'oHAo..Ss.Ss..oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAo..okKko..oAao',
    'oAAo..okkko..oAao',
    'oAAo..ooooo..oAao',
    'oAAo..Ss.Ss..oaao',
    '.oAAoBs...Ssoaao.',
    '.oAAAoo...ooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo.SsooAAAo.',
    '.oHAo...Ss..oAAo.',
    'oHAo....Ss...oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAoBSokKkoSSoAao',
    'oAAossokkkossoAao',
    'oAAo..ooooo..oAao',
    'oAAo....Ss...oaao',
    '.oAAo...Ss..oaao.',
    '.oAAAoo.Ssooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
  [
    '.....ooooooo.....',
    '...ooHHHHHHHoo...',
    '..oHHAAoooAAHHo..',
    '.oHAAoo...ooAAAo.',
    '.oHAoBs...SsoAAo.',
    'oHAo..Ss.Ss..oAAo',
    'oHAo..ooooo..oAao',
    'oHAo..okkko..oAao',
    'oHAo..okKko..oAao',
    'oAAo..okkko..oAao',
    'oAAo..ooooo..oAao',
    'oAAo..Ss.Ss..oaao',
    '.oAAoSs...Ssoaao.',
    '.oAAAoo...ooaaao.',
    '..oAAaaoooaaaao..',
    '...ooaaaaaaaoo...',
    '.....ooooooo.....',
  ],
];

/** Las letras del cartel, de 5 de alto. */
const LETRAS = {
  A: ['.oo.', 'o..o', 'oooo', 'o..o', 'o..o'], B: ['ooo.', 'o..o', 'ooo.', 'o..o', 'ooo.'], C: ['.ooo', 'o...', 'o...', 'o...', '.ooo'], D: ['ooo.', 'o..o', 'o..o', 'o..o', 'ooo.'],
  E: ['ooo', 'o..', 'oo.', 'o..', 'ooo'], F: ['ooo', 'o..', 'oo.', 'o..', 'o..'], G: ['.ooo', 'o...', 'o.oo', 'o..o', '.ooo'], I: ['ooo', '.o.', '.o.', '.o.', 'ooo'],
  J: ['...o', '...o', '...o', 'o..o', '.oo.'], L: ['o..', 'o..', 'o..', 'o..', 'ooo'], M: ['o...o', 'oo.oo', 'o.o.o', 'o...o', 'o...o'], N: ['o..o', 'oo.o', 'o.oo', 'o..o', 'o..o'],
  O: ['.oo.', 'o..o', 'o..o', 'o..o', '.oo.'], P: ['ooo.', 'o..o', 'ooo.', 'o...', 'o...'], R: ['ooo.', 'o..o', 'ooo.', 'o.o.', 'o..o'], S: ['.ooo', 'o...', '.oo.', '...o', 'ooo.'],
  T: ['ooo', '.o.', '.o.', '.o.', '.o.'], U: ['o..o', 'o..o', 'o..o', 'o..o', '.oo.'], V: ['o..o', 'o..o', 'o..o', 'o.o.', '.o..'], 1: ['.o', 'oo', '.o', '.o', '.o'],
};

const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

function lienzo(ind, W, Hh) {
  const datos = new Uint8ClampedArray(W * Hh * 4);
  for (let k = 0; k < ind.length; k++) {
    if (ind[k] < 0) continue;
    const c = RGB[ind[k]];
    datos[k * 4] = c[0]; datos[k * 4 + 1] = c[1]; datos[k * 4 + 2] = c[2]; datos[k * 4 + 3] = 255;
  }
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = Hh;
  cv.getContext('2d').putImageData(new ImageData(datos, W, Hh), 0, 0);
  return cv;
}

/** Un mapa suelto, ya pasado a dibujo. */
function suelto(filas, col, noche) {
  const an = filas[0].length, al = filas.length, ind = new Int16Array(an * al).fill(-1);
  filas.forEach((fila, j) => { for (let q = 0; q < an; q++) if (fila[q] !== '.') { const i = col[fila[q]]; ind[j * an + q] = noche && NOCHE[i] !== undefined ? NOCHE[i] : i; } });
  return { img: lienzo(ind, an, al), an, al };
}

const piezas = { d: null, n: null };
function piezasDe(noche) {
  const k = noche ? 'n' : 'd';
  if (!piezas[k]) piezas[k] = { ruedas: RUEDA.map((m) => suelto(m.map((f) => f.replace(/(?<=o.*)\.(?=.*o)/g, 'n')), COL_RUEDA, noche)), carreton: suelto(CARRETON, COL_FIERRO, noche) };
  return piezas[k];
}

/** Un par de ruedas con su carretón por cada `cx`, en puntos desde `x`. `recorrido`: cuánto corrió el tren. También para la locomotora. */
export function ruedasYCarreton(ctx, x, cxs, base, recorrido, noche) {
  const P = piezasDe(noche), k = ((Math.floor((recorrido / (Math.PI * 2 * RADIO_RUEDA)) * 8) % 8) + 8) % 8, rueda = P.ruedas[k];
  for (const cx of cxs) {
    for (const dx of [-10, 10]) ctx.drawImage(rueda.img, x + (cx + dx - 8) * PASO, base - 17 * PASO, 17 * PASO, 17 * PASO);
    ctx.drawImage(P.carreton.img, x + (cx - 16) * PASO, base - 19 * PASO, 33 * PASO, 12 * PASO);
  }
}

/**
 * 🧱 LO QUE CHOCA ARRIBA DE UN VAGÓN *(Santi: "chocan y además, en un futuro te vas a poder cubrir de las balas allí")*: los
 * ventiladores y las chimeneas, en el mismo lugar de la lámina (ver `laminaCoche`). La linterna se sigue pisando: cruza
 * casi todo el coche, justo en el lomo, que es lo único donde no se resbala. `x` e `y` son del mundo y del ancho del
 * techo (0 a 160); `rx` y `ry` lo que ocupan.
 */
const estorbos = new Map();
export function estorbosDeVagon(w) {
  if (!w || !AFUERA[w.id]) return [];
  const clave = w.id + '|' + w.x + '|' + w.width;
  if (estorbos.has(clave)) return estorbos.get(clave);
  const A = AFUERA[w.id], W = Math.round(w.width * PX), yTapa = 3, D = HONDO.puntos, en = (u) => yTapa + Math.round(D * u);
  const xw = Math.floor(w.x / PASO) * PASO;
  const nuevo = (columna, fila, mapa) => ({
    columna, fila, mapa, xw,
    x: xw + (columna + mapa[0].length / 2) * PASO, rx: (mapa[0].length / 2) * PASO * 0.8,
    y: ((fila - yTapa) / D) * 160, ry: 10,
  });
  const lista = [];
  if (A.techo === 'linterna') {
    const honda = Math.round(D * 0.2), yBoca = en(0.6) - 6 - honda + Math.round(honda * 0.65);
    for (const cx of [62, W - 71]) lista.push(nuevo(cx, yBoca, CHIMENEA));
    for (const q of [0.33, 0.5, 0.67]) lista.push(nuevo(Math.round(W * q) - 3, yBoca, VENTILADOR));
  } else if (A.techo === 'pasarela') {
    for (const x of [40, W - 47]) lista.push(nuevo(x, en(0.72), VENTILADOR));
  }
  estorbos.set(clave, lista);
  return lista;
}
/** Los estorbos del vagón que hay en esta `x`. */
export function estorbosEn(train, x) {
  if (!train || train.tramoAt(x) !== 'vagon') return [];
  return estorbosDeVagon(train.wagons[train.wagonAt(x)]);
}
const estampasEstorbo = new Map();
/**
 * Vuelve a estampar un estorbo encima del que quedó detrás de él (en la lámina del tren ya está, pero debajo de la gente).
 * Devuelve el rectángulo que ocupa, para borrarle el contorno a la persona que tapa.
 */
export function dibujarEstorbo(ctx, e, base, noche) {
  const clave = (e.mapa === CHIMENEA ? 'c' : 'v') + (noche ? 'n' : 'd');
  if (!estampasEstorbo.has(clave)) estampasEstorbo.set(clave, suelto(e.mapa, COL_FIERRO, noche));
  const S = estampasEstorbo.get(clave);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const x = e.xw + e.columna * PASO, y = base - (H - (e.fila - e.mapa.length)) * PASO, w = S.an * PASO, h = S.al * PASO;
  ctx.drawImage(S.img, x, y, w, h);
  ctx.imageSmoothingEnabled = prev;
  return { x, y, w, h };
}

/** Qué vagones ya tienen su dibujo nuevo de afuera. */
export const tieneAfueraNuevo = (p) => !!AFUERA[p.id];

const laminas = new Map();
function laminaCoche(p, ancho, noche, capa = '', costado = false) {
  const clave = p.id + '|' + Math.round(ancho) + '|' + (noche ? 'n' : 'd') + '|' + capa + '|' + HONDO.puntos + '|' + (costado ? 'c' : '');
  if (laminas.has(clave)) return laminas.get(clave);
  const A = AFUERA[p.id];
  // 🔁 LOS ERRORES DE LA VISTA *(Santi: "los vagones se ven muy de vista lateral")*, medidos contra el mismo vagón en el asalto: la pared medía 60
  // puntos, 3,4 m al lado de la gente, y va en 40; las ruedas colgaban enteras debajo de la caja, y el riel de acá pasa por debajo de ella. El dibujo
  // de costado sólo queda para caminar por el techo, que es una vista lateral de verdad (la eligió Santi).
  const abierto = A.forma === 'ganado' || A.forma === 'plataforma', lado = costado && !abierto;
  const yAlero = lado ? 23 : 47, yTapa = yAlero - HONDO.puntos, dy = (A.arriba || 0) + Math.max(0, 4 - yTapa), Ht = H + dy;
  const W = Math.round(ancho * PX), ind = new Int16Array(W * Ht).fill(-1);
  const ton = (i) => (noche && NOCHE[i] !== undefined ? NOCHE[i] : i);
  const crudo = (x, y, i) => { x = Math.round(x); y = Math.round(y) + dy; if (x >= 0 && y >= 0 && x < W && y < Ht) ind[y * W + x] = i; };
  const pon = (x, y, i) => crudo(x, y, ton(i));
  const r = (x, y, w2, h2, i) => { for (let j = 0; j < h2; j++) for (let q = 0; q < w2; q++) pon(x + q, y + j, i); };
  const mapa = (x, y, filas, col, esCrudo) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') { const i = col[fila[q]]; crudo(x + q, y + j, esCrudo ? i : ton(i)); } });
  const escribir = (texto, x, y, col, gasta) => {
    for (const ch of texto) {
      const L = LETRAS[ch];
      if (L) L.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] === 'o' && !(gasta && hash(x + q, y + j) < 0.06)) pon(x + q, y + j, col); });
      x += L ? L[0].length + 1 : 3;
    }
  };
  const anchoTexto = (texto) => [...texto].reduce((a, ch) => a + (LETRAS[ch] ? LETRAS[ch][0].length + 1 : 3), 0) - 1;

  // Las alturas, de arriba para abajo.
  const yPared = yAlero + 4, yCartel = yAlero + (lado ? 6 : 5), yVent = lado ? 38 : 61, yCintura = lado ? 62 : 76, yZocalo = lado ? 83 : 87, yBastidor = lado ? 87 : 91;
  const altoPuerta = lado ? 38 : 28;
  const M = A.madera ? MADERAS[A.madera] : MADERAS.marron;
  const tonos = noche ? M.n : M.d, junta = M.j[noche ? 1 : 0], cantoClaro = M.c[noche ? 1 : 0];
  const des = A.poco ? 0.5 : 1;   // la primera clase, mejor cuidada: la mitad de gastada

  /** UNA HILADA DE TABLAS ACOSTADAS *(Santi eligió las horizontales)*: cada tanto una termina y empieza otra. */
  const hilada = (y, altoT, fila, xDesde = 0, xHasta = W) => {
    let x = xDesde - Math.floor(hash(fila, 22) * 100), previo = -1;
    for (let n = 0; x < xHasta; n++) {
      const largo = 90 + Math.floor(hash(fila * 7 + n, 23) * 90), sem = fila * 13 + n * 3;
      let t = Math.floor(hash(sem, 3) * tonos.length);
      if (t === previo) t = (t + 1) % tonos.length;
      previo = t;
      const [base, clara, oscura] = tonos[t];
      const dentro = (q) => q >= xDesde && q < xHasta;
      for (let j = 0; j < altoT; j++) for (let q = x; q < x + largo; q++) if (dentro(q)) crudo(q, y + j, base);
      for (let j = 1; j < altoT; j++) if (hash(sem, 31 + j) < 0.6 * des) {
        for (let q = x + Math.floor(hash(j, sem) * 14); q < x + largo;) {
          const l = 4 + Math.floor(hash(q, j + sem) * 18), col = hash(j, q + 5) < 0.5 ? clara : oscura;
          for (let i = 0; i < l && q + i < x + largo; i++) if (dentro(q + i)) crudo(q + i, y + j, col);
          q += l + 3 + Math.floor(hash(q, j) * 16);
        }
      }
      // Donde termina la tabla: la junta, los clavos y la grieta que sale de la punta.
      if (dentro(x)) for (let j = 0; j < altoT; j++) crudo(x, y + j, junta);
      for (const [cx, cy] of [[x + 2, y + 2], [x + 2, y + altoT - 2], [x - 3, y + 2], [x - 3, y + altoT - 2]]) if (dentro(cx)) crudo(cx, cy, junta);
      if (hash(sem, 41) < 0.55 * des) {
        let g = y + 2 + Math.floor(hash(sem, 42) * (altoT - 3));
        const hasta = x + 8 + Math.floor(hash(sem, 43) * 20);
        for (let q = x + 1; q < hasta; q++) { if (dentro(q)) crudo(q, g, junta); if (hash(q, sem) < 0.15) g += hash(q, sem + 1) < 0.5 ? 1 : -1; }
      }
      if (hash(sem, 51) < 0.5 * des && altoT >= 7) {
        const nx = x + 20 + Math.floor(hash(sem, 53) * (largo - 40));
        if (dentro(nx) && dentro(nx + 3)) mapa(nx, y + 1, NUDOS[1], { s: oscura, d: junta, n: 0 }, true);
      }
      x += largo;
    }
    for (let q = xDesde; q < xHasta; q++) { crudo(q, y, junta); if (hash(q, y + 7) < 0.25) crudo(q, y + 1, cantoClaro); }
  };
  const tablas = (y0, y1) => {
    for (let y = y0, fila = 0; y < y1; fila++) {
      const altoT = Math.min(7 + Math.floor(hash(fila, 21) * 3), y1 - y);
      hilada(y, altoT, fila);
      y += altoT;
    }
  };

  /** LA CHAPA: paneles grandes con sus juntas, los remaches y el óxido que chorrea. */
  const chapa = (y0, y1, [c, l, o]) => {
    r(0, y0, W, y1 - y0, c);
    for (let x = 17, n = 0; x < W; x += 34, n++) {
      r(x, y0, 1, y1 - y0, o); r(x + 1, y0, 1, y1 - y0, l);
      for (let y = y0 + 2; y < y1 - 1; y += 5) { pon(x - 2, y, l); pon(x + 3, y, l); }
      for (let k = 0; k < 3; k++) if (hash(n, 130 + k) < 0.55) {
        const q = x + 4 + Math.floor(hash(n, 134 + k) * 28), y2 = y0 + 2 + Math.floor(hash(n, 138 + k) * (y1 - y0 - 8)), largo = 3 + Math.floor(hash(n, 142 + k) * 9);
        for (let j = 0; j < largo && y2 + j < y1; j++) pon(q, y2 + j, j < 3 ? 11 : 4);
      }
    }
    for (let x = 4; x < W - 3; x += 6) { pon(x, y0 + 2, l); pon(x, y1 - 3, l); }
  };

  /** UNA HOJA DE PUERTA: tablas a lo alto, para que se distinga de la pared, con el travesaño en diagonal y la manija (o chapa con cerrojos). */
  const hoja = (x0, x1, y0, y1) => {
    r(x0, y0, x1 - x0, y1 - y0, 0);
    if (A.chapa) {
      const [c, l, o] = CHAPAS[A.chapa];
      r(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2, c);
      r(Math.round((x0 + x1) / 2), y0 + 1, 1, y1 - y0 - 2, o);
      for (let x = x0 + 3; x < x1 - 2; x += 5) { pon(x, y0 + 3, l); pon(x, y1 - 4, l); }
      for (const y of [y0 + 10, y1 - 12]) { r(x0 + 1, y, x1 - x0 - 2, 3, o); r(x0 + 1, y, x1 - x0 - 2, 1, l); }
      r(Math.round((x0 + x1) / 2) - 2, Math.round((y0 + y1) / 2) - 3, 5, 6, 0); r(Math.round((x0 + x1) / 2) - 1, Math.round((y0 + y1) / 2) - 2, 3, 4, 28);
      return;
    }
    const [base, clara, oscura] = tonos[0];
    for (let y = y0 + 1; y < y1 - 1; y++) for (let x = x0 + 1; x < x1 - 1; x++) crudo(x, y, (x - x0) % 7 === 0 ? junta : hash(x, 151 + (x - x0 >> 2)) < 0.25 && hash(y >> 2, x) < 0.5 ? oscura : base);
    const L = x1 - x0 - 2;
    for (let q = 0; q < L; q++) { const yy = y1 - 3 - Math.round((q * (y1 - y0 - 5)) / L); crudo(x0 + 1 + q, yy, clara); crudo(x0 + 1 + q, yy + 1, junta); }
    r(x1 - 6, Math.round((y0 + y1) / 2) - 3, 2, 6, 23);
  };

  /** EL BASTIDOR: la viga, y debajo, en sombra, los tirantes con sus dos postes y el cilindro del freno. */
  const bastidor = () => {
    r(2, yBastidor, W - 4, 1, 0); r(2, yBastidor + 1, W - 4, 1, 5); r(2, yBastidor + 2, W - 4, 1, 4); r(2, yBastidor + 3, W - 4, 1, 0);
    for (let x = 5; x < W - 4; x += 7) pon(x, yBastidor + 1, 24);
    const xa = 48, xb = W - 49, q1 = Math.round(W * 0.34), q2 = W - q1, yP = yBastidor + 4, baja = 7;
    if (!lado) {
      r(xa, yP, xb - xa, 2, 1);
      for (let x = xa; x < xb; x++) if ((x + yP) % 2) pon(x, yP + 2, 1);
      return;
    }
    r(xa, yP, xb - xa, 3, 1);
    for (const q of [q1, q2]) { r(q - 1, yP, 3, baja, 0); r(q, yP, 1, baja - 1, 24); }
    for (let x = xa; x <= q1; x++) pon(x, yP + Math.round(((x - xa) / (q1 - xa)) * (baja - 1)), 24);
    for (let x = q1; x <= q2; x++) pon(x, yP + baja - 1, 24);
    for (let x = q2; x <= xb; x++) pon(x, yP + Math.round(((xb - x) / (xb - q2)) * (baja - 1)), 24);
    mapa(Math.round(W / 2) - 5, yP, CILINDRO, COL_FIERRO);
  };

  /**
   * 🔁 EL TECHO, VISTO DESDE ARRIBA *(Santi: "que se note la parte curva, los costados, y la parte lisa de arriba en el medio")*: una tapa lisa con la
   * luz, y alrededor la curva que baja y se apaga a escalones. La bajada de allá casi no se ve, de lo oblicua; la de acá mira a la cámara y se ve
   * ancha. Las puntas bajan igual. Lo que va encima tiene su tapa y su frente, y tira sombra hacia acá.
   */
  const techo = () => {
    const D = yAlero - yTapa, en = (u) => yTapa + Math.round(D * u);
    const entra = [14, 10, 7, 5, 3, 2, 1, 1];
    const CURVA = [25, 24, 23, 31], jLisa = 6, jAca = D - 16;
    for (let y = yTapa; y < yAlero; y++) {
      const j = y - yTapa, m = entra[j] || 0;
      const nivelY = j < 3 ? 2 : j < jLisa ? 1 : j < jAca ? 0 : j < jAca + 6 ? 1 : j < jAca + 11 ? 2 : 3;
      for (let x = m; x < W - m; x++) {
        const e = Math.min(x, W - 1 - x), nivelX = e < 5 ? 2 : e < 11 ? 1 : 0;
        const nivel = Math.max(nivelX, nivelY);
        pon(x, y, nivel === 0 && hash(x >> 3, y) < 0.14 ? 24 : CURVA[nivel]);
      }
      pon(m, y, 0); pon(W - 1 - m, y, 0);
    }
    r(14, yTapa, W - 28, 1, 0);
    // Donde termina lo liso: la línea de remaches de la chapa de arriba.
    for (let x = 14; x < W - 14; x += 3) { pon(x, yTapa + jLisa, 31); pon(x, yTapa + jAca, 31); }
    // 🔁 Más detalle *(Santi: "el nivel de detalle no concuerda con el poco detalle del techo ni las ruedas")*: las juntas de las chapas cruzan el
    // techo de lado a lado, con sus remaches; el óxido chorrea por la bajada de acá; a mano, los parches (lo demás sale de una cuenta).
    for (let x = 12, n = 0; x < W - 12; x += 24, n++) {
      r(x, yTapa + 2, 1, D - 3, 31);
      for (let y = yTapa + 3; y < yAlero - 1; y += 3) { pon(x + 1, y, 25); pon(x - 1, y, 23); }
      for (let k = 0; k < 3; k++) if (hash(n, 80 + k) < 0.7) {
        const q = x + 3 + Math.floor(hash(n, 84 + k) * 19), y0 = yTapa + jAca + 1 + Math.floor(hash(n, 88 + k) * 4), largo = 2 + Math.floor(hash(n, 92 + k) * 9);
        for (let j = 0; j < largo && y0 + j < yAlero - 1; j++) pon(q, y0 + j, j < 2 ? 11 : 4);
      }
      if (hash(n, 96) < 0.25) mapa(x + 7, yTapa + jAca + 2, PARCHE, COL_PARCHE);
    }
    for (let x = 2; x < W - 2; x++) if (hash(x, 97) < 0.22) pon(x, yAlero - 2, hash(x, 98) < 0.5 ? 4 : 31);
    r(1, yAlero - 1, W - 2, 1, 24);
    const cm = Math.round(W / 2);
    if (A.techo === 'linterna') {
      // La linterna es una caja larga sobre el lomo: su frente con los ventiletes y, arriba, su propia tapa.
      const xL = 24, wL = W - 48, yPie = en(0.6), alto = 6, yCara = yPie - alto, honda = Math.round(D * 0.2), yArr = yCara - honda;
      r(xL - 1, yPie + 1, wL + 2, 2, 31);                                                          // la sombra que tira hacia acá
      r(xL + 2, yArr, wL - 4, 1, 0);
      for (let y = yArr + 1; y < yCara; y++) { const m = y === yArr + 1 ? 2 : y === yArr + 2 ? 1 : 0; r(xL + m, y, wL - 2 * m, 1, y < yArr + 3 ? 24 : 23); pon(xL + m - 1, y, 0); pon(xL + wL - m, y, 0); }
      r(xL - 1, yCara, wL + 2, 1, 0);
      r(xL, yCara + 1, wL, alto - 1, 47); r(xL - 1, yPie, wL + 2, 1, 0); r(xL - 1, yCara, 1, alto, 0); r(xL + wL, yCara, 1, alto, 0);
      for (let x = xL + 3; x < xL + wL; x += 6) r(x, yCara + 1, 1, alto - 1, 3);
      for (let x = xL + 8; x < xL + wL - 8; x += 21) mapa(x, yCara + 2, VENTILETE, noche ? { o: 0, V: 5 } : COL_FIERRO, noche);
      for (let x = xL + 12, n = 0; x < xL + wL - 6; x += 24, n++) { r(x, yArr + 1, 1, honda - 1, 23); for (let y = yArr + 2; y < yCara; y += 3) pon(x + 1, y, 25); if (hash(n, 99) < 0.5) r(x + 6, yCara - 3, 1, 3, 11); }
      // Las chimeneas con el hollín alrededor, y los ventiladores en el lomo de la linterna.
      const yBoca = yArr + Math.round(honda * 0.65);
      for (const cx of [62, W - 71]) {
        for (let q = -3; q < 14; q++) for (let j = 0; j < 3; j++) if ((q + j) % 2 === 0) pon(cx + q, yBoca + j - 1, 31);
        mapa(cx, yBoca - CHIMENEA.length, CHIMENEA, COL_FIERRO);
      }
      for (const q of [0.33, 0.5, 0.67]) mapa(Math.round(W * q) - 3, yBoca - VENTILADOR.length, VENTILADOR, COL_FIERRO);
    } else if (A.techo === 'pasarela') {
      // Las tablas por donde caminan los guardafrenos, levantadas sobre el lomo: su tapa, su canto y la sombra.
      const honda = Math.round(D * 0.2), y0 = en(0.28);
      r(4, y0 + honda + 3, W - 8, 2, 31);
      r(4, y0 - 1, W - 8, 1, 0); r(4, y0 + honda, W - 8, 1, 0); r(4, y0 + honda + 1, W - 8, 1, 3); r(4, y0 + honda + 2, W - 8, 1, 0);
      for (let x = 4; x < W - 4; x++) for (let j = 0; j < honda; j++) pon(x, y0 + j, (x - 4) % 8 === 0 ? 3 : hash(x, j + 160) < 0.15 ? 34 : j === 0 ? 35 : 5);
      for (const x of [40, W - 47]) mapa(x, en(0.72) - VENTILADOR.length, VENTILADOR, COL_FIERRO);
    } else if (A.techo === 'escotilla') {
      for (let x = 8; x < W - 8; x += 8) pon(x, en(0.2), 25);
      r(cm - 13, en(0.28) + ESCOTILLA.length, 26, 2, 31);
      mapa(cm - 13, en(0.28), ESCOTILLA, COL_FIERRO);
    } else if (A.techo === 'hielo') {
      for (const x of [14, W - 32]) { r(x, en(0.28) + BOCA_HIELO.length, 18, 2, 31); mapa(x, en(0.28), BOCA_HIELO, COL_FIERRO); }
      for (let x = 40; x < W - 40; x += 8) pon(x, en(0.2), 25);
    } else if (A.techo === 'garita') {
      r(cm - 21, en(0.64), 43, 2, 31);
      mapa(cm - 22, en(0.64) - GARITA.length, GARITA, noche ? COL_GARITA_N : COL_GARITA, true);
      mapa(30, en(0.5) - CHIMENEA.length, CHIMENEA, COL_FIERRO);
    }
    // El alero: sobresale y agarra la luz.
    r(0, yAlero, W, 1, 0); r(0, yAlero + 1, W, 1, 25); r(0, yAlero + 2, W, 1, 23); r(0, yAlero + 3, W, 1, 0);
    for (let x = 0; x < W; x++) if (hash(x, 100) < 0.1) pon(x, yAlero + 1, 23);
  };

  const forma = A.forma || 'caja';
  if (forma === 'caja') {
    // ===== LA PARED
    if (A.chapa) chapa(yPared, yBastidor, CHAPAS[A.chapa]);
    else tablas(yPared, yBastidor);
    // La sombra del alero, el cartel, la cintura y el zócalo.
    const oscuroPared = A.chapa ? 31 : M.punta[1];
    r(0, yPared, W, 2, oscuroPared);
    if (!lado) for (let x = 0; x < W; x += 2) pon(x, yPared + 2, oscuroPared);
    if (A.chapa) {
      const [c, l, o] = CHAPAS[A.chapa];
      r(0, yCartel, W, 8, o); r(0, yCartel, W, 1, l); r(0, yCartel + 7, W, 1, l);
      r(0, yCintura, W, 3, o); r(0, yCintura, W, 1, l);
      for (let x = 4; x < W - 3; x += 6) pon(x, yCintura + 1, c === 23 ? 25 : l);
      r(0, yZocalo, W, 1, o); r(0, yZocalo + 1, W, 2, c); r(0, yZocalo + 3, W, 1, 0);
    } else {
      r(0, yCartel, W, 8, M.banda); r(0, yCartel, W, 1, M.filete); r(0, yCartel + 7, W, 1, M.filete);
      // La cintura, también gastada: una moldura de madera vieja, mellada a tramos.
      const [luz, cuerpo, sombra] = M.cin[noche ? 1 : 0];
      for (let x = 0; x < W; x++) {
        crudo(x, yCintura, hash(x, 61) < 0.15 * des ? cuerpo : luz);
        crudo(x, yCintura + 1, cuerpo);
        crudo(x, yCintura + 2, sombra);
      }
      r(0, yZocalo, W, 1, oscuroPared); r(0, yZocalo + 1, W, 2, M.punta[3]); r(0, yZocalo + 3, W, 1, 0);
    }
    // El cartel, en el medio.
    if (A.cartel) escribir(A.cartel, Math.round((W - anchoTexto(A.cartel)) / 2), yCartel + (lado ? 2 : 1), A.chapa ? 25 : M.texto);
    // (🧨 Las armas, con la franja roja y el aviso, como por adentro.)
    if (A.franja) {
      const yF = yCintura + (lado ? 6 : 0);
      r(0, yF, W, 1, 0); r(0, yF + 1, W, 9, 9); r(0, yF + 1, W, 1, 10); r(0, yF + 10, W, 1, 0);
      const at = anchoTexto(A.franja);
      for (const cx of [Math.round(W / 4), Math.round((3 * W) / 4)]) escribir(A.franja, cx - Math.round(at / 2), yF + 3, 17, true);
    }

    // ===== LA PUERTA CORREDIZA o EL PORTÓN (📦 el del cerrado es de verdad: es por donde se salta: ver rideScene.js. De día, abierto.)
    const cm = Math.round(W / 2);
    let puerta0 = -1, puerta1 = -1;
    if (A.puerta) {
      // 🔁 A la medida de la gente, que mide 30 *(Santi: "las veo muy anchas y muy altas")*.
      const m = 12, y0 = yZocalo + 2 - altoPuerta;
      puerta0 = cm - m - 3; puerta1 = cm + m + 3;
      r(cm - m - 3, y0 - 2, 2 * m + 6, 1, 0); r(cm - m - 3, y0 - 1, 2 * m + 6, 1, 23);          // el riel
      hoja(cm - m, cm + m, y0, yZocalo + 2);
    } else if (A.porton) {
      const L = Math.round((3 * 16) / PASO), x0 = cm - Math.round(L / 2), y1 = yZocalo + 2, y0 = y1 - altoPuerta - 2;
      puerta0 = x0; puerta1 = x0 + L;
      if (noche) {
        r(x0 - 4, y0, L + 8, 1, 0); r(x0 - 4, y0 + 1, L + 8, 1, 23);
        hoja(x0, x0 + L, y0 + 2, y1);
      } else {
        r(x0 - L - 8, y0, 2 * L + 12, 1, 0); r(x0 - L - 8, y0 + 1, 2 * L + 12, 1, 23);
        // El hueco: el adentro en sombra, con el piso y unos bultos.
        r(x0, y0 + 2, L, y1 - y0 - 2, 32);
        r(x0, y1 - 6, L, 6, 33); r(x0, y1 - 6, L, 1, 3);
        for (const [bx, bw, bh] of [[5, 16, 13], [23, 11, 8], [46, 12, 15]]) { r(x0 + bx - 1, y1 - 7 - bh - 1, bw + 2, bh + 2, 0); r(x0 + bx, y1 - 7 - bh, bw, bh, 3); r(x0 + bx, y1 - 7 - bh, bw, 1, 33); }
        r(x0 - 1, y0 + 2, 1, y1 - y0 - 2, 0); r(x0 + L, y0 + 2, 1, y1 - y0 - 2, 0);
        hoja(x0 - L - 4, x0 - 4, y0 + 2, y1);
      }
    }

    // ===== LAS VENTANAS: donde están las de adentro (las 'W' de la pared de acá), salvo que caigan sobre la puerta
    const S = 16, fila = p.layout[p.layout.length - 1];
    const colVent = noche ? { ...COL_VENTANA_NOCHE, ...(A.colN || {}) } : { ...COL_VENTANA, ...(A.colD || {}) };
    if (A.vent) for (let c = 0; c < fila.length; c++) {
      if (fila[c] !== 'W' || fila[c - 1] === 'W') continue;
      let c2 = c; while (fila[c2 + 1] === 'W') c2++;
      const vx = Math.round(((c + c2 + 1) / 2) * S * PX);
      const media = A.vent === 'vidrio' ? 12 : 9;
      if (puerta0 >= 0 && vx + media + 2 > puerta0 && vx - media - 2 < puerta1) continue;
      if (A.vent === 'vidrio') mapa(vx - 12, yVent, VENTANA, colVent, true);
      else if (A.vent === 'reja') mapa(vx - 9, yVent + 3, VENTANA_REJA, colVent, true);
      else mapa(vx - 9, yVent + 5, REJILLA, COL_REJILLA);
    }
    if (A.troneras) for (let x = 26; x < W - 30; x += 40) if (x + 13 < puerta0 || x > puerta1) mapa(x, yVent + 8, TRONERA, COL_TRONERA);
    if (A.brazo) mapa(W - 24, yVent, BRAZO, COL_FIERRO);

    // ===== LAS PUNTAS: la pared se dobla, y la luz se va de a poco
    const pu = A.chapa ? [0, 31, 31, 23, 23] : M.punta;
    for (let y = yPared; y < yBastidor; y++) for (let d = 0; d < 5; d++) {
      if (d >= 3 && (d + y) % 2) continue;
      pon(d, y, pu[d]); pon(W - 1 - d, y, pu[d]);
    }
    techo();
    bastidor();
  } else if (forma === 'gondola') {
    // ===== LA GÓNDOLA: la chapa baja, y arriba, desde la cámara alta, la boca llena de carbón
    const yLado = yBastidor - (lado ? 37 : 30), yBoca = yLado - HONDO.puntos;
    r(2, yBoca - 1, W - 4, 1, 0); r(2, yBoca, W - 4, 3, 23); r(2, yBoca, W - 4, 1, 24); r(2, yBoca + 3, W - 4, 1, 0);       // el borde de allá
    r(3, yBoca + 4, W - 6, yLado - yBoca - 4, 0);
    // El carbón sale de una cuenta: terrones de luz y de sombra; el montón asoma por encima del borde de allá.
    for (let x = 4, n = 0; x < W - 4; x += 2, n++) {
      const asoma = 2 + Math.round(Math.sin(n * 0.21) * 2 + Math.sin(n * 0.7));
      if (asoma > 0) r(x, yBoca - asoma, 2, asoma + 4, 0);
      if (asoma > 1) pon(x, yBoca - asoma, 31);
    }
    for (const x of [2, W - 5]) { r(x, yBoca, 3, yLado - yBoca, 23); r(x, yBoca, 1, yLado - yBoca, 24); r(x - 1, yBoca, 1, yLado - yBoca, 0); r(x + 3, yBoca, 1, yLado - yBoca, 0); }
    for (let k = 0; k < (W * HONDO.puntos) / 19; k++) {
      const x = 6 + Math.floor(hash(k, 170) * (W - 14)), y = yBoca + 2 + Math.floor(hash(k, 171) * (yLado - yBoca - 3)), l = hash(k, 172);
      r(x, y, 2 + Math.floor(l * 2), 2, l < 0.55 ? 31 : l < 0.62 ? 23 : 0);
      if (l >= 0.4 && l < 0.7) pon(x, y, 31);
    }
    chapa(yLado + 4, yBastidor, CHAPAS.gondola);
    r(2, yLado, W - 4, 1, 0); r(2, yLado + 1, W - 4, 1, 25); r(2, yLado + 2, W - 4, 1, 24); r(2, yLado + 3, W - 4, 1, 0);
    r(2, yBastidor - 1, W - 4, 1, 0);
    const texto = 'MINA LA NEGRA', at = anchoTexto(texto), ty = yLado + (lado ? 15 : 13);
    for (const cx of [Math.round(W / 4), Math.round((3 * W) / 4)]) {
      const tx = cx - Math.round(at / 2);
      r(tx - 4, ty - 3, at + 8, 11, 0); r(tx - 3, ty - 2, at + 6, 9, 31);
      escribir(texto, tx, ty, 17);
    }
    bastidor();
  } else if (forma === 'ganado' || forma === 'plataforma') {
    // 🔁 LOS DOS SON UN PISO VISTO DESDE ARRIBA *(Santi: "el vagón de ganados también es una plataforma, un vagón más chato"; "no tiene las barandas de
    // aquel lado")*: el piso se ve hondo, y la baranda de allá sale del borde de allá. Primero lo de allá, después la carga, al final la baranda de acá.
    const yCanto = yBastidor - 5, yPiso = yCanto - HONDO.puntos, ganado = forma === 'ganado', altoB = ganado ? 20 : 13;
    /** UNA BARANDA a lo largo, parada sobre el borde `yB`: las tablas con aire entre medio y los postes. */
    const baranda = (yB, sem) => {
      for (let k = 0; k < (ganado ? 3 : 2); k++) hilada(yB - altoB + k * 7, 4, sem + k, 3, W - 3);
      for (let x = 3; x < W - 5; x += ganado ? 24 : 38) { r(x, yB - altoB - 2, 4, altoB + 2, 4); r(x, yB - altoB - 2, 1, altoB + 2, 0); r(x + 1, yB - altoB - 2, 1, altoB + 2, 34); r(x + 4, yB - altoB - 2, 1, altoB + 2, 0); r(x, yB - altoB - 2, 5, 1, 0); }
      r(W - 6, yB - altoB - 2, 4, altoB + 2, 4); r(W - 6, yB - altoB - 2, 1, altoB + 2, 0); r(W - 2, yB - altoB - 2, 1, altoB + 2, 0);
    };
    /** LAS BARANDAS DE LAS PUNTAS, que corren de allá para acá: de arriba se ve su canto. En el medio, el hueco del paso. */
    const puntas = () => {
      const y0 = yPiso - altoB, y1 = yCanto - altoB, h0 = y0 + Math.round((y1 - y0) * 0.4), h1 = y0 + Math.round((y1 - y0) * 0.6);
      for (const x of [3, W - 6]) for (let y = y0; y < y1; y++) if (y < h0 || y >= h1) { pon(x - 1, y, 0); pon(x, y, 34); pon(x + 1, y, 4); pon(x + 2, y, 3); pon(x + 3, y, 0); }
    };
    if (capa !== 'tablas') {
      baranda(yPiso, 40);
      r(2, yPiso - 1, W - 4, 1, 0);
      for (let y = yPiso, k = 0; y < yCanto; y += 7, k++) hilada(y, Math.min(7, yCanto - y), k + 60, 2, W - 2);
      r(2, yPiso, W - 4, 2, 32);                                                                    // la sombra de la baranda de allá
      puntas();
      r(2, yCanto, W - 4, 1, 0); r(2, yCanto + 1, W - 4, 1, 35); r(2, yCanto + 2, W - 4, 3, 4);
      for (let x = 8; x < W - 8; x += 8) pon(x, yCanto + 3, 3);
      bastidor();
    }
    if (!ganado) {
      // La carga, en dos filas como adentro: una contra cada baranda.
      for (const [yFila, x00, sem] of [[yPiso + Math.round(HONDO.puntos * 0.42), 40, 0], [yCanto - 9, 18, 9]]) {
        let n = sem;
        for (let x = x00; x + 36 < W - 12; n++) {
          const pieza = n % 2 ? LONA : CAJON;
          r(x + 1, yFila, pieza[0].length, 2, 32);
          mapa(x, yFila - pieza.length, pieza, COL_CARGA);
          x += pieza[0].length + 44 + Math.floor(hash(n, 180) * 60);
        }
      }
    }
    if (capa !== 'fondo') baranda(yCanto, 50);
  }

  if (forma === 'caja' && !lado) {
    // (Como en el asalto: el vagón es redondeado visto desde arriba, y eso se ve en las dos líneas largas.)
    const c = 12, tope = yAlero + dy, fondo = yBastidor + 3 + dy;
    for (let d = 0; d < c; d++) {
      const L = Math.round(c - Math.sqrt(c * c - (c - d) * (c - d)));
      if (!L) continue;
      for (const x of [d, W - 1 - d]) {
        for (let y = tope; y <= fondo; y++) ind[(y - L) * W + x] = ind[y * W + x];
        for (let y = fondo - L + 1; y <= fondo; y++) ind[y * W + x] = -1;
      }
    }
  }

  const hojaFinal = { img: lienzo(ind, W, Ht), W, Ht };
  laminas.set(clave, hojaFinal);
  return hojaFinal;
}

const vacasHechas = { d: null, n: null };
function vacasDe(noche) {
  const k = noche ? 'n' : 'd';
  if (!vacasHechas[k]) vacasHechas[k] = COL_VACAS.map((col) => ({ lomo: suelto(VACA, col, noche), cabeza: suelto(CABEZA, col, noche) }));
  return vacasHechas[k];
}

/** El coche entero, apoyado sobre la vía en `base`. `vuelta`: cuántas vueltas dieron las ruedas; `t`: el reloj, para que las vacas cabeceen. */
export function dibujarCocheNuevo(ctx, p, x0, ancho, base, vuelta, noche, t = 0, costado = false) {
  const x = Math.floor(x0 / PASO) * PASO;
  const liso = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const estampa = (capa) => {
    const h = laminaCoche(p, ancho, noche, capa, costado);
    ctx.drawImage(h.img, x, base - h.Ht * PASO, h.W * PASO, h.Ht * PASO);
    return h;
  };
  const ruedas = () => {
    const W = Math.round(ancho * PX), P = piezasDe(noche), k = ((Math.floor(vuelta * 8) % 8) + 8) % 8, rueda = P.ruedas[k];
    for (const cx of [27, W - 27]) {
      for (const dx of [-10, 10]) ctx.drawImage(rueda.img, x + (cx + dx - 8) * PASO, base - 17 * PASO, 17 * PASO, 17 * PASO);
      ctx.drawImage(P.carreton.img, x + (cx - 16) * PASO, base - 19 * PASO, 33 * PASO, 12 * PASO);
    }
  };
  // (Desde arriba, la caja les tapa la parte de arriba a las ruedas; de costado se ven enteras.)
  if (!costado) ruedas();
  if (AFUERA[p.id].forma === 'ganado') {
    estampa('fondo');
    // (🐄 Entre las dos capas: la baranda de allá les queda atrás y la de acá adelante. Primero la fila de allá, que la de acá la tapa.)
    const V = vacasDe(noche), W = Math.round(ancho * PX), yP = base - H * PASO, yCanto = 86, yPiso = yCanto - HONDO.puntos;
    let i = 0;
    for (const [pie, x00] of [[yPiso + Math.round(HONDO.puntos * 0.4), 34], [yCanto - 5, 14]]) for (let bx = x00; bx + 27 < W - 12; bx += 44, i++) {
      const cabeceo = Math.round(Math.sin(t * 1.4 + i * 1.9)), v = V[i % 3 === 1 ? 1 : 0];
      const gx = x + bx * PASO, gy = yP + (pie - v.lomo.al) * PASO;
      ctx.drawImage(v.lomo.img, gx, gy, v.lomo.an * PASO, v.lomo.al * PASO);
      ctx.drawImage(v.cabeza.img, gx + (i % 2 ? -5 : 21) * PASO, gy + (1 + cabeceo) * PASO, v.cabeza.an * PASO, v.cabeza.al * PASO);
    }
    estampa('tablas');
  } else estampa('');
  if (costado) ruedas();
  ctx.imageSmoothingEnabled = liso;
}

/**
 * 🔗 EL ENGANCHE, COMO EL DE ADENTRO *(Santi: "quiero que el enganche se vea diferente, como cuando estás en el interior
 * del tren. Y ese mismo diseño pasalo al tren durante el galope")*: una plataforma de chapa remachada pegada a cada vagón,
 * con su canto del lado del hueco; la chapa estriada del medio, que se desliza sobre las dos; cuatro postes y dos cadenas.
 *
 * A mano, cada una en su mapa: las dos plataformas y el poste. De una cuenta, porque cambian de largo: la chapa del medio y las
 * cadenas. `XL` y `XR` son los bordes de verdad de los dos vagones, ya corridos; las plataformas se meten tres puntos debajo
 * de su vagón, que se dibuja después.
 */
const PLATAFORMA_IZQ = [
  'oooooooooooooooooooooooo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRRrRRRRRRRRRRRRrRRGGo',
  'RRRRRRRRRppRRRRRRRRRRGGo',
  'RRRRRRRRppppRRRRRRRRRGGo',
  'RRRRRRRRRpppRRRRRRRRRGGo',
  'RRRRRrRRRRRRRRRRRRrRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRRRRRRRRRRRpRRRRRRGGo',
  'RRRRRRRRRRRRRpppRRRRRGGo',
  'RRRRRrRRRRRRRRppRRrRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRppRRRRRRRRRRRRRRRGGo',
  'RRRppppRRRRRRRRRRRRRRGGo',
  'RRRRRrRRRRRRRRRRRRrRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRRRRRRRRpRRRRRRRRRGGo',
  'RRRRRRRRRRpppRRRRRRRRGGo',
  'RRRRRrRRRRRRRRRRRRrRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'RRRRRRRRRRRRRRRRRRRRRGGo',
  'oooooooooooooooooooooooo',
  'FFFFFFFFFFFFFFFFFFFFFGGo',
  'FFFFFFFFFFFFFFFFFFFFFGGo',
  'oooooooooooooooooooooooo',
];
const PLATAFORMA_DER = [
  'oooooooooooooooooooooooo',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRrRRRRRRRRRRRRrRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRRRRRRRRppRRRRR',
  'oGGRRRRRRRRRRRRRppppRRRR',
  'oGGRRrRRRRRRRRRRRRrRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRpRRRRRRRRRRRRR',
  'oGGRRRRRRpppRRRRRRRRRRRR',
  'oGGRRrRRRRRRRRRRRRrRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRRRRRRRRRRRppRR',
  'oGGRRRRRRRRRRRRRRRRppppR',
  'oGGRRrRRRRRRRRRRRRrRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRRRRRRpRRRRRRRR',
  'oGGRRRRRRRRRRRpppRRRRRRR',
  'oGGRRrRRRRRRRRRRRRrRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oGGRRRRRRRRRRRRRRRRRRRRR',
  'oooooooooooooooooooooooo',
  'oGGFFFFFFFFFFFFFFFFFFFFF',
  'oGGFFFFFFFFFFFFFFFFFFFFF',
  'oooooooooooooooooooooooo',
];
const POSTE_ENGANCHE = [
  'ooo',
  'oHo',
  'oXo',
  'oXo',
  'oXo',
  'oXo',
  'oXo',
  'oXo',
  'ooo',
];
const COL_ENGANCHE = { d: { o: 0, R: 32, r: 35, p: 47, G: 23, F: 1, H: 24, X: 31 }, n: { o: 0, R: 1, r: 32, p: 32, G: 31, F: 0, H: 23, X: 1 } };
const NOCHE_ENGANCHE = { 23: 31, 24: 23, 31: 1, 1: 0 };
const piezasEnganche = { d: null, n: null };
function piezasDelEnganche(noche) {
  const k = noche ? 'n' : 'd';
  if (!piezasEnganche[k]) piezasEnganche[k] = { izq: suelto(PLATAFORMA_IZQ, COL_ENGANCHE[k], false), der: suelto(PLATAFORMA_DER, COL_ENGANCHE[k], false), poste: suelto(POSTE_ENGANCHE, COL_ENGANCHE[k], false) };
  return piezasEnganche[k];
}

export function dibujarEngancheNuevo(ctx, XL, XR, base, noche, g, E) {
  const P = piezasDelEnganche(noche), Y0 = base - 49 * PASO, yT = 8, yF = 30, PLAT = 16;
  const Lx = Math.floor(XL / PASO) * PASO, Rx = Math.floor(XR / PASO) * PASO;
  const liso = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const cuadro = (x, y, w, h, i) => { ctx.fillStyle = PALETA[noche && NOCHE_ENGANCHE[i] !== undefined ? NOCHE_ENGANCHE[i] : i]; ctx.fillRect(x, Y0 + y * PASO, w * PASO, h * PASO); };
  const poner = (L, x, y) => ctx.drawImage(L.img, x, Y0 + y * PASO, L.an * PASO, L.al * PASO);

  // Las dos plataformas, cada una con su vagón.
  poner(P.izq, Lx - 3 * PASO, yT);
  poner(P.der, Rx - 21 * PASO, yT);

  // La chapa del medio, encima de las dos: estirado apenas las pisa, encogido las tapa.
  const pa = Lx + 16 * PASO, ancho = Math.max(0, Math.round((Rx - 16 * PASO - pa) / PASO));
  if (ancho > 0) {
    const y0 = yT + 2, y1 = yF - 1;
    cuadro(pa, y0, ancho, y1 - y0 + 2, 0);
    cuadro(pa, y0 + 1, ancho, 1, 24);
    cuadro(pa, y0 + 2, ancho, y1 - y0 - 3, 23);
    for (let q = 2; q < ancho - 1; q += 3) cuadro(pa + q * PASO, y0 + 3, 1, y1 - y0 - 5, 24);
    cuadro(pa, y1 - 1, ancho, 1, 31);
    cuadro(pa, y0, 1, y1 - y0 + 2, 0);
    cuadro(pa + (ancho - 1) * PASO, y0, 1, y1 - y0 + 2, 0);
  }

  // Los postes y las cadenas: primero los de allá, después los de acá. La cadena cuelga más cuanto más cerca están los postes.
  const a = Lx + 19 * PASO, b = Rx - 20 * PASO, n = Math.round((b - a) / PASO);
  const largoCadena = ((E ? E.max : 62) - 2 * PLAT) / PASO + 3;
  const cuelga = Math.min(7, Math.sqrt(Math.max(0, largoCadena * largoCadena - n * n)) * 0.5);
  const tiembla = !!(g && g.tenso > 0 && E && Math.floor(E.reloj * 30) % 2);
  for (const pie of n >= 0 ? [yT + 1, yF - 1] : []) {
    const arriba = pie - 8;
    poner(P.poste, a - PASO, arriba);
    poner(P.poste, b - PASO, arriba);
    for (let q = 1; q < n; q++) {
      const t = q / n, fila = arriba + 2 + Math.round(cuelga * 4 * t * (1 - t)) + (tiembla && q % 2 ? 1 : 0);
      cuadro(a + q * PASO, fila, 1, 1, q % 2 ? 24 : 0);
    }
  }
  ctx.imageSmoothingEnabled = liso;
}

/** A qué altura sobre la vía quedan, en unidades: la mitad del techo, la ventana y la mitad del carbón. */
export const ALTURAS_DE_FRENTE = {
  get techo() { return (H - 47 + HONDO.puntos / 2) * PASO; },
  get carbon() { return (H - 61 + HONDO.puntos / 2) * PASO; },
  ventanilla: (H - 73) * PASO,
};

/** Cuánto mide el radio de la rueda, en unidades: para saber cuánto gira. */
export const RADIO_RUEDA = 8.5 * PASO;

/**
 * EL PERFIL DEL TECHO, desde arriba del tren: la vista es de costado y no se ve la tapa. Chapa con la luz en el lomo y las puntas redondas.
 * `arriba` es donde pisás.
 */
const perfiles = new Map();
export function dibujarPerfilNuevo(ctx, x0, ancho, arriba, alto, noche) {
  const clave = Math.round(ancho) + '|' + Math.round(alto) + '|' + (noche ? 'n' : 'd');
  let hoja = perfiles.get(clave);
  if (!hoja) {
    const W = Math.round(ancho * PX), Al = Math.round(alto * PX), ind = new Int16Array(W * Al).fill(-1);
    const ton = (i) => (noche && NOCHE[i] !== undefined ? NOCHE[i] : i), entra = [6, 3, 1];
    for (let j = 0; j < Al; j++) {
      const m = entra[j] || 0, i = j === 0 ? 0 : j === 1 ? 25 : j < 4 ? 24 : j < Al - 2 ? 23 : 31;
      for (let x = m; x < W - m; x++) ind[j * W + x] = ton(x === m || x === W - m - 1 ? 0 : i);
      if (j > 3) for (let x = 14; x < W - 6; x += 24) ind[j * W + x] = ton(31);
    }
    // 🔁 Con el mismo detalle que el resto: remaches en las juntas, óxido que chorrea y algún parche. Sale de una cuenta.
    const punto = (x, j, i) => { if (x >= 0 && x < W && j >= 0 && j < Al) ind[j * W + x] = ton(i); };
    for (let x = 14, n = 0; x < W - 6; x += 24, n++) {
      for (let j = 5; j < Al - 2; j += 2) { punto(x + 1, j, 24); punto(x - 1, j, 31); }
      for (let k = 0; k < 3; k++) if (hash(n, 110 + k) < 0.7) {
        const q = x + 3 + Math.floor(hash(n, 114 + k) * 19), largo = 2 + Math.floor(hash(n, 118 + k) * Math.max(1, Al - 7));
        for (let j = 0; j < largo; j++) punto(q, 4 + j, j < 2 ? 11 : 4);
      }
      if (hash(n, 122) < 0.3 && Al > 9) {
        for (let q = 0; q < 12; q++) for (let j = 0; j < 5; j++) punto(x + 7 + q, 4 + j, q === 0 || q === 11 || j === 0 || j === 4 ? 31 : 24);
        for (const [q, j] of [[1, 1], [10, 1], [1, 3], [10, 3]]) punto(x + 7 + q, 4 + j, 31);
      }
    }
    for (let x = 2; x < W - 2; x++) if (hash(x, 124) < 0.2) punto(x, 2, 24);
    hoja = { img: lienzo(ind, W, Al), W, Al };
    perfiles.set(clave, hoja);
  }
  const liso = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(hoja.img, Math.floor(x0 / PASO) * PASO, arriba, hoja.W * PASO, hoja.Al * PASO);
  ctx.imageSmoothingEnabled = liso;
}
