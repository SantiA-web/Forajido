/**
 * 🎨 ESTILO NUEVO · P2 — EL JUGADOR, DIBUJADO A MANO.
 *
 * Cada vista es un mapa de puntos escrito a mano (ver abajo): cabeza, torso y
 * piernas por separado, como un muñeco de papel. Nada se gira ni se estira:
 * las piezas sólo se apilan en puntos enteros, así un ojo, una mano o un caño
 * no pueden quedar corridos. Sin ojos ni nariz *(Santi: "la C se siente hecho
 * a posta esa simpleza"; "eliminaría los ojos y la nariz")*.
 *
 * Las ocho direcciones salen de cinco vistas (costado, tres cuartos de frente,
 * de frente, tres cuartos de espaldas, de espaldas); las de la izquierda son
 * las mismas en espejo.
 *
 * EL BRAZO DEL ARMA es lo único que se calcula: una línea de puntos enteros
 * (Bresenham, como la trazaría un dibujante) desde el hombro hacia donde
 * apuntás, con la mano y el arma en la punta. Va siempre del lado derecho del
 * dibujo y nunca cruza el cuerpo. La boca del caño se devuelve para el
 * fogonazo.
 *
 * Mide 27 puntos de alto (20 unidades del mundo), justo su caja: la cabeza
 * con el sombrero 8, el torso 9 y las piernas 10 *(Santi: "el personaje se ve
 * muy grande"; eligió esas medidas)*. 🔁 Antes medía 32 (24 unidades).
 *
 * 🔁 REDIBUJADO *(Santi: "tiene la espalda y las piernas demasiado anchas, el
 * sombrero es muy pequeño y no se entiende cuando está en las direcciones
 * diagonales. Además, ese pie oscuro también queda muy feo")*: el cuerpo pasó
 * de 10-11 puntos de ancho a 7 (más el brazo), cada pierna de 3 a 2; el
 * sombrero tiene la copa de 3 filas y el ala de 15; en las diagonales la cara,
 * el pelo, el chaleco y los pies se corren hacia donde mira; y la pierna de
 * allá es un escalón más oscura que la de acá, no casi negra, con botas
 * marrones.
 *
 * 🔁 EL ALA DEL SOMBRERO *(Santi: "hay que arreglar el ala del sombrero en casi
 * todas las direcciones")*: la cámara mira desde arriba, así que el ala se ve
 * como un óvalo en todas las vistas: 11 puntos detrás de la copa, 15 en el
 * medio y 11 en el borde de adelante (oscuro, la sombra del ala). Antes era
 * una tabla recta de 13-15-13 con las puntas oscuras y se leía como un
 * escalón. Los colores son
 * índices de la paleta (engine/paleta.js) y la luz llega pareja, la del punto
 * donde está parado (engine/luz.js).
 */
import { iluminar } from '../../engine/luz.js';
import { sombrear } from '../../engine/paleta.js';

// ------------------------------------------------------------- los colores
/** Cada letra de los mapas, a su color de la paleta. */
const C = {
  H: 5, h: 6, k: 4, b: 3, Y: 28,           // el sombrero (fieltro marrón), la cinta, la hebilla
  P: 12, p: 11, B: 47,                     // la piel y la barba
  R: 9, r: 8,                              // el pañuelo
  V: 33, v: 32, w: 32,                     // el chaleco de cuero (v: el costado en sombra)
  C: 15, L: 16, c: 14,                     // la camisa
  T: 19, t: 41,                            // el pantalón de lona azul (la pierna de allá, un escalón más oscura)
  O: 4, Q: 5,                              // las botas marrones, con la punta más clara
  W: 3, F: 32,                             // el cinto y la funda
  M: 3, m: 4,                              // la mochila
};

// ------------------------------------------------------------------ mapas
/** Un mapa de texto: cada fila desde `y`; el punto es vacío. */
const mapa = (y, filas) => ({ y, filas });

/**
 * LAS VISTAS. `cabeza` (sombrero, cara y pañuelo), `torso` (con el brazo
 * libre), `hombro` (de dónde sale el brazo del arma) y `piernas`: quieto,
 * cuatro cuadros de correr (A paso, B pasa, C el otro paso, D pasa) y
 * agachado (dos cuadros).
 */
const VISTAS = {
  lado: {
    cabeza: mapa(0, [
      '........HhhH',
      '.......HHHHHH',
      '.....HHbbbbbbHH',
      '...HHHHHHHHHHHHHHH',
      '.....kkkkkkkkkkk',
      '.......BPPPP',
      '........BBBp',
      '.......rRRRR',
    ]),
    torso: mapa(8, [
      '.......VVVCC',
      '.......VVVCC',
      '.......VVVCL',
      '.......VVVCL',
      '.......VVVCL',
      '.......VVVCL',
      '.......VVVCC',
      '.......VVVCC',
      '.......WWWWY',
    ]),
    hombro: [10, 9],
    mochila: [[4, 9, 3, 7]],
    piernas: {
      quieto: mapa(17, [
        '.......TFFTT',
        '.......tTTT',
        '.......tTTT',
        '........TTT',
        '........TTT',
        '........TTT',
        '........TTT',
        '........TTT',
        '........OOOO',
        '.......OOOOQ',
      ]),
      A: mapa(17, [
        '.......TFFTT',
        '.......ttTTT',
        '......tt.TTT',
        '......tt..TT',
        '.....tt...TTT',
        '.....tt....TT',
        '....tt.....TT',
        '....tt.....TT',
        '...OOO.....OOOO',
        '...OOO.....OOOQ',
      ]),
      B: mapa(17, [
        '.......TFFTT',
        '........TTTt',
        '........TTTt',
        '........TTTt',
        '.......tTTT',
        '......ttTTT',
        '....OOO.TTT',
        '........TTT',
        '........OOOO',
        '.......OOOOQ',
      ]),
      C: mapa(17, [
        '.......TFFTT',
        '.......TTTtt',
        '......TTT.tt',
        '......TT...tt',
        '.....TTT...tt',
        '.....TT.....tt',
        '....TTT.....tt',
        '....TT......tt',
        '..OOOO......OOO',
        '..OOOO......OOO',
      ]),
      D: mapa(17, [
        '.......TFFTT',
        '........tttT',
        '........tttT',
        '........tttT',
        '.......TttT',
        '......TTttt',
        '....OOOOttt',
        '........ttt',
        '........OOOO',
        '.......OOOOO',
      ]),
      agachado: mapa(20, [
        '.......TFFTTT',
        '.......tTTTTTT',
        '......tt...TTT',
        '......tt....TT',
        '.....tt.....TT',
        '...OOOO....OOOO',
        '...OOOO....OOOQ',
      ]),
      RA: mapa(17, [
        '.......TFFTT',
        '.......ttTTT',
        '......tt..TTT',
        '......tt...TTT',
        '.....tt.....TT',
        '.....tt.....TT',
        '....tt......TT',
        '...tt.......TT',
        '..OO........OOOO',
        '..OO........OOOQ',
      ]),
      RB: mapa(17, [
        '.......TFFTT',
        '.......TTTtt',
        '......TTT.ttt',
        '..OO.TTT...tt',
        '..OOTTT....tt',
        '...........tt',
        '...........tt',
        '...........OOOO',
        '...........OOOQ',
        '',
      ]),
      RC: mapa(17, [
        '.......TFFTT',
        '.......TTTtt',
        '......TTT..tt',
        '......TT....tt',
        '.....TTT....tt',
        '.....TT......tt',
        '....TTT......tt',
        '...TTT.......tt',
        '..OOO........OOO',
        '..OOOQ.......OOO',
      ]),
      RD: mapa(17, [
        '.......TFFTT',
        '.......ttTTT',
        '......ttt.TTT',
        '..OO.ttt...TTT',
        '..OOttt.....TT',
        '...........TT',
        '...........TT',
        '...........OOOO',
        '...........OOOQ',
        '',
      ]),
      agA: mapa(20, [
        '.......TFFTTT',
        '......ttTTTTTT',
        '.....tt.....TTT',
        '....tt.......TT',
        '...tt........TT',
        '..OOO.......OOOO',
        '..OOO.......OOOQ',
      ]),
      agB: mapa(20, [
        '.......TFFTTT',
        '.......tTTTTTT',
        '.......tt..TTT',
        '.......ttt.TT',
        '.....OOOO..TT',
        '..........OOOO',
        '..........OOOQ',
      ]),
      agC: mapa(20, [
        '.......TFFTTT',
        '......TTTttttt',
        '.....TTT....ttt',
        '....TTT......tt',
        '...TTT.......tt',
        '..OOOO......OOO',
        '..OOOQ......OOO',
      ]),
      agD: mapa(20, [
        '.......TFFTTT',
        '.......TTTTttt',
        '.......TTT..tt',
        '......TTT...tt',
        '....OOOO...tt',
        '..........OOOO',
        '..........OOOO',
      ]),
    },
  },

  frente: {
    cabeza: mapa(0, [
      '........HhhHH',
      '.......HHHHHHH',
      '.....HHbbbYbbbHH',
      '...HHHHHHHHHHHHHHH',
      '.....kkkkkkkkkkk',
      '........PPPPP',
      '........pBBBp',
      '.......RRRRRRR',
    ]),
    torso: mapa(8, [
      '.......VVRRRVV',
      '......CVVCRCVV',
      '......CVVCLCVV',
      '......CVVCLCVV',
      '......CVVCLCVV',
      '......cVVCLCVV',
      '......PVVCLCVV',
      '.......VVCCCVV',
      '.......WWWYWWW',
    ]),
    hombro: [14, 9],
    mochila: [[8, 8, 1, 8], [12, 8, 1, 8]],
    piernas: {
      quieto: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '.......OOO.OOO',
        '.......OQO.OQO',
      ]),
      A: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '.......OOO.TT',
        '.......OQO.TT',
        '...........TT',
        '..........OOO',
        '..........OQO',
      ]),
      B: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '.......OOO.TT',
        '.......OQO.OOO',
        '..........OQO',
      ]),
      C: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.OOO',
        '........TT.OQO',
        '........TT',
        '.......OOO',
        '.......OQO',
      ]),
      D: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.OOO',
        '.......OOO.OQO',
        '.......OQO',
      ]),
      agachado: mapa(20, [
        '.......TTTTTTT',
        '......TTT...TTT',
        '......TT.....TT',
        '......TT.....TT',
        '.......TT...TT',
        '......OOO...OOO',
        '......OQO...OQO',
      ]),
      RA: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.OOO',
        '........TT.OQO',
        '........TT',
        '........TT',
        '........TT',
        '.......OOO',
        '.......OQO',
      ]),
      RB: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '........TT.OOO',
        '........TT.OQO',
        '.......OOO',
        '.......OQO',
        '',
      ]),
      RC: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '.......OOO.TT',
        '.......OQO.TT',
        '...........TT',
        '...........TT',
        '...........TT',
        '..........OOO',
        '..........OQO',
      ]),
      RD: mapa(17, [
        '.......TTTTTTF',
        '........TTTTTF',
        '........TT.TT',
        '........TT.TT',
        '........TT.TT',
        '.......OOO.TT',
        '.......OQO.TT',
        '..........OOO',
        '..........OQO',
        '',
      ]),
      agA: mapa(20, [
        '.......TTTTTTT',
        '......TTT...TTT',
        '......TT.....TT',
        '......OOO....TT',
        '......OQO...TT',
        '............OOO',
        '............OQO',
      ]),
      agB: mapa(20, [
        '.......TTTTTTT',
        '......TTT...TTT',
        '......TT.....TT',
        '......TT.....TT',
        '.......TT...OOO',
        '......OOO...OQO',
        '......OQO',
      ]),
      agC: mapa(20, [
        '.......TTTTTTT',
        '......TTT...TTT',
        '......TT.....TT',
        '......TT....OOO',
        '.......TT...OQO',
        '......OOO',
        '......OQO',
      ]),
      agD: mapa(20, [
        '.......TTTTTTT',
        '......TTT...TTT',
        '......TT.....TT',
        '......TT.....TT',
        '......OOO...TT',
        '......OQO...OOO',
        '............OQO',
      ]),
    },
  },

  espalda: {
    cabeza: mapa(0, [
      '........HHhhH',
      '.......HHHHHHH',
      '.....HHbbbbbbbHH',
      '...HHHHHHHHHHHHHHH',
      '.....kkkkkkkkkkk',
      '........BBBBB',
      '........ppppp',
      '.......RRRRRRR',
    ]),
    torso: mapa(8, [
      '.......VVVRVVV',
      '......CVVVrVVV',
      '......CVVVwVVV',
      '......CVVVwVVV',
      '......CVVVwVVV',
      '......cVVVwVVV',
      '......PVVVwVVV',
      '.......VVVwVVV',
      '.......WWWWWWW',
    ]),
    hombro: [14, 9],
    mochila: [[8, 9, 5, 6]],
    piernas: null,   // las mismas de frente (ver abajo)
  },

  diagF: {
    cabeza: mapa(0, [
      '.........HhhHH',
      '........HHHHHHH',
      '......HHbbbbbYbHH',
      '....HHHHHHHHHHHHHHH',
      '......kkkkkkkkkkkk',
      '........BPPPPP',
      '.........pBBBP',
      '........RRRRRRR',
    ]),
    torso: mapa(8, [
      '.......VVVRRRV',
      '......CVVVCRCv',
      '......CVVVCLCv',
      '......CVVVCLCv',
      '......CVVVCLCv',
      '......cVVVCLCv',
      '......PVVVCLCv',
      '.......VVVCCCv',
      '.......WWWWYWW',
    ]),
    hombro: [14, 9],
    mochila: [[8, 8, 1, 8], [12, 8, 1, 8]],
    piernas: {
      quieto: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.OOO',
        '.......OOO.OOO',
        '.......OOOQ',
      ]),
      A: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......OOO.tt',
        '.......OOOQtt',
        '...........tt',
        '...........tt',
        '...........OOO',
        '...........OOO',
        '',
      ]),
      B: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......OOO.tt',
        '.......OOOQOOO',
        '...........OOO',
        '',
      ]),
      C: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.OOO',
        '.......TTT.OOO',
        '.......TTT',
        '.......TTT',
        '.......TTT',
        '.......OOO',
        '.......OOOQ',
      ]),
      D: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.OOO',
        '.......TTT.OOO',
        '.......TTT',
        '.......OOO',
        '.......OOOQ',
      ]),
      agachado: mapa(20, [
        '.......TTTTttt',
        '......TTTT.ttt',
        '......TTT...tt',
        '......TT....tt',
        '......TT...OOO',
        '.....OOOO..OOO',
        '.....OOOQ',
      ]),
      RA: mapa(17, [
        '.......TTTTttF',
        '.......TTT.ttt',
        '.......TTT..ttt',
        '.......TTT...OOO',
        '.......TTT...OOO',
        '.......TTT',
        '.......TTT',
        '.......TTT',
        '.......OOO',
        '.......OOOQ',
      ]),
      RB: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '......TTT..tt',
        '....OOTT...tt',
        '....OOO....tt',
        '...........tt',
        '...........OOO',
        '...........OOO',
        '',
        '',
      ]),
      RC: mapa(17, [
        '.......TTTTttF',
        '.......TTTTtt',
        '........TTTTtt',
        '........OOOOtt',
        '........OOOQtt',
        '...........tt',
        '...........tt',
        '...........tt',
        '...........OOO',
        '...........OOO',
      ]),
      RD: mapa(17, [
        '.......TTTTttF',
        '.......TTT.tt',
        '.......TTT.tt',
        '.......TTT.OOO',
        '.......TTT.OOO',
        '.......TTT',
        '.......TTT',
        '.......OOO',
        '.......OOOQ',
        '',
      ]),
      agA: mapa(20, [
        '.......TTTTttt',
        '......TTTT.ttt',
        '......TTT...tt',
        '......TT...OOO',
        '......TT...OOO',
        '.....OOOO',
        '.....OOOQ',
      ]),
      agB: mapa(20, [
        '.......TTTTttt',
        '......TTTT.ttt',
        '......TTT..OOO',
        '......TT...OOO',
        '......TT',
        '.....OOOO',
        '.....OOOQ',
      ]),
      agC: mapa(20, [
        '.......TTTTttt',
        '......TTTT.ttt',
        '......TTT...tt',
        '.....OOOO...tt',
        '.....OOOQ...tt',
        '...........OOO',
        '...........OOO',
      ]),
      agD: mapa(20, [
        '.......TTTTttt',
        '......TTTT.ttt',
        '......OOOO..tt',
        '......OOOQ..tt',
        '...........tt',
        '...........OOO',
        '...........OOO',
      ]),
    },
  },

  diagE: {
    cabeza: mapa(0, [
      '.........HHhhH',
      '........HHHHHHH',
      '......HHbbbbbbbHH',
      '....HHHHHHHHHHHHHHH',
      '......kkkkkkkkkkkk',
      '.........BBBBP',
      '.........ppppP',
      '........RRRRRRR',
    ]),
    torso: mapa(8, [
      '.......VVVVRVv',
      '......cVVVVrVv',
      '......cVVVVwVv',
      '......cVVVVwVv',
      '......cVVVVwVv',
      '......cVVVVwVv',
      '......PVVVVwVv',
      '.......VVVVwVv',
      '.......WWWWWWW',
    ]),
    hombro: [14, 9],
    mochila: [[8, 9, 4, 6]],
    piernas: null,   // las mismas de tres cuartos de frente, de atrás (ver abajo)
  },
};
// De espaldas, las piernas son las de frente; en tres cuartos de espaldas, las
// de tres cuartos de frente (de atrás no se distingue punta de talón a esta escala).
VISTAS.espalda.piernas = VISTAS.frente.piernas;
VISTAS.diagE.piernas = VISTAS.diagF.piernas;

// ------------------------------------------------------- armar un cuadro
const ANCHO = 44, ALTO = 40, OX = 12, OY = 6;   // el lienzo, con lugar para el arma
/** Dónde quedan los pies en el lienzo (el medio de las dos botas, abajo). */
export const PIES = [OX + 10, OY + 27];
export { ANCHO, ALTO };

/** Una línea de puntos enteros, de a a b (Bresenham). */
function linea([x0, y0], [x1, y1], poner) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) {
    poner(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}

/**
 * UN CUADRO, en índices de la paleta. `vista` (lado, frente, espalda, diagF,
 * diagE), `piernas` (quieto; caminar A-D; trotar RA-RD; agachado y avanzar
 * agachado agA-agD), `arma` (null,
 * 'revolver', 'winchester', 'escopeta'), `ang` el ángulo del arma en el dibujo
 * (ya espejado) y `mochila` (0-4). Devuelve los índices y la boca del caño.
 */
export function cuadroJugador({ vista, piernas, arma, ang, mochila }) {
  const V = VISTAS[vista];
  const idx = new Int16Array(ANCHO * ALTO).fill(-1);
  const poner = (x, y, i) => {
    x += OX; y += OY;
    if (x >= 0 && y >= 0 && x < ANCHO && y < ALTO) idx[y * ANCHO + x] = i;
  };
  const dibujarMapa = (m, dy = 0, dx = 0) => m.filas.forEach((fila, j) => {
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') poner(x + dx, m.y + j + dy, C[fila[x]]);
  });
  /**
   * Agachado, el cuerpo baja 3 (pasando un paso agachado, 2: el cuerpo se
   * hamaca un poco). Caminando, al pasar un paso sube 1; trotando, en el aire
   * (RB, RD) también. 🔁 TROTAR TIENE SUS CUADROS *(Santi: "parece que está
   * caminando rápido en vez de trotar")*: antes usaba los de caminar, con los
   * dos pies siempre en el piso. Ahora hay un momento en el aire (los dos pies
   * levantados) y el pie de atrás sube bien alto; de costado, además, el
   * cuerpo va inclinado un punto hacia adelante.
   */
  const ag = piernas.startsWith('ag');
  const baja = ag ? ((piernas === 'agB' || piernas === 'agD') ? 2 : 3)
    : (piernas === 'B' || piernas === 'D' || piernas === 'RB' || piernas === 'RD') ? -1 : 0;
  const inclina = vista === 'lado' && piernas.startsWith('R') ? 1 : 0;
  const [hx, hy] = [V.hombro[0] + inclina, V.hombro[1] + baja];
  const dir = [Math.cos(ang), Math.sin(ang)];
  // Apuntando para arriba (hacia el fondo), el brazo va detrás del cuerpo.
  const detras = arma && dir[1] < -0.35;

  let boca = null;
  const brazo = () => {
    const largo = arma ? 6 : 5;
    const d = arma ? dir : [0.15, 1];
    const mano = [hx + d[0] * largo, hy + d[1] * largo];
    linea([hx, hy], mano, (x, y) => { poner(x, y, C.C); poner(x, y + 1, C.c); });
    poner(Math.round(mano[0]), Math.round(mano[1]), C.P);
    poner(Math.round(mano[0]), Math.round(mano[1]) + 1, C.p);
    if (!arma) return;
    const en = (k) => [mano[0] + dir[0] * k, mano[1] + dir[1] * k];
    if (arma === 'winchester') {
      linea(en(-3), en(0), (x, y) => poner(x, y, 5));
      linea(en(1), en(9), (x, y) => poner(x, y, 24));
      const [bx, by] = en(1); poner(Math.round(bx), Math.round(by), 28);
      boca = en(9);
    } else if (arma === 'escopeta') {
      linea(en(-3), en(0), (x, y) => poner(x, y, 5));
      linea(en(1), en(6), (x, y) => { poner(x, y, 31); poner(x, y + 1, 23); });
      boca = en(6);
    } else {
      linea(en(1), en(4), (x, y) => poner(x, y, 23));
      boca = en(4);
      const [bx, by] = boca; poner(Math.round(bx), Math.round(by), 25);
    }
    poner(Math.round(mano[0]), Math.round(mano[1]), C.P);
  };

  if (detras) brazo();
  if (mochila && (vista === 'espalda' || vista === 'diagE' || vista === 'lado')) {
    for (const [x, y, w, h] of V.mochila) for (let j = 0; j < h + mochila; j++) for (let q = 0; q < w; q++) poner(x + q + inclina, y + j + baja, j === 0 ? C.m : C.M);
  }
  const P = V.piernas[piernas] || V.piernas.quieto;
  dibujarMapa(P);
  // Cuando el cuerpo sube 1 (pasando un paso, en el aire o agachado), la cadera se estira un punto para que no
  // quede un hueco entre el cinto y el pantalón.
  if (baja < 0 || baja === 2) dibujarMapa({ y: P.y - 1, filas: [P.filas[0]] });
  dibujarMapa(V.torso, baja, inclina);
  dibujarMapa(V.cabeza, baja, inclina);
  if (mochila && (vista === 'frente' || vista === 'diagF')) {
    for (const [x, y, w, h] of V.mochila) for (let j = 0; j < h; j++) for (let q = 0; q < w; q++) poner(x + q, y + j + baja, C.M);
  }
  if (!detras) brazo();

  // El contorno de un punto, por afuera de todo.
  const lleno = idx.slice();
  for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
    if (lleno[y * ANCHO + x] >= 0) continue;
    const vecino = (a, b) => a >= 0 && b >= 0 && a < ANCHO && b < ALTO && lleno[b * ANCHO + a] >= 0;
    if (vecino(x - 1, y) || vecino(x + 1, y) || vecino(x, y - 1) || vecino(x, y + 1)) idx[y * ANCHO + x] = 0;
  }
  return { idx, boca: boca && [boca[0] + OX, boca[1] + OY], hombro: [hx + OX, hy + OY] };
}

const guardados = new Map();

/**
 * EL CUADRO YA ILUMINADO, como canvas (se guarda: hay pocas combinaciones).
 * `luz` son pasos parejos para todo el cuerpo; `destello` lo pinta claro (el
 * balazo que recibiste).
 */
export function lienzoJugador(o, luz = 0, destello = false) {
  const clave = [o.vista, o.piernas, o.arma || '', Math.round(o.ang * 100), o.mochila || 0, luz, destello ? 1 : 0].join('|');
  let g = guardados.get(clave);
  if (g) return g;
  if (guardados.size > 900) guardados.clear();
  const q = cuadroJugador(o);
  const indices = destello ? q.idx.map((i) => (i > 0 ? sombrear(i, 4) : i)) : q.idx;
  const datos = iluminar({ ancho: ANCHO, alto: ALTO, indices, campo: () => luz });
  const cv = document.createElement('canvas');
  cv.width = ANCHO; cv.height = ALTO;
  cv.getContext('2d').putImageData(new ImageData(datos, ANCHO, ALTO), 0, 0);
  g = { img: cv, boca: q.boca, hombro: q.hombro };
  guardados.set(clave, g);
  return g;
}
