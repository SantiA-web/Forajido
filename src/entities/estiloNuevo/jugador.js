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
      agachado: mapa(20, [
        '.......TFFTTT',
        '.......tTTTTTT',
        '......tt...TTT',
        '......tt....TT',
        '.....tt.....TT',
        '...OOOO....OOOO',
        '...OOOO....OOOQ',
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
      '.......VVCRCVV',
      '.......VVCLCVV',
      '.......VVCLCVV',
      '.......VVCLCVV',
      '.......VVCLCVV',
      '.......VVCLCVV',
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
      agachado: mapa(20, [
        '.......TTTTTTT',
        '......TTT...TTT',
        '......TT.....TT',
        '......TT.....TT',
        '.......TT...TT',
        '......OOO...OOO',
        '......OQO...OQO',
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
      '.......VVVrVVV',
      '.......VVVwVVV',
      '.......VVVwVVV',
      '.......VVVwVVV',
      '.......VVVwVVV',
      '.......VVVwVVV',
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
      '.......VVVCRCv',
      '.......VVVCLCv',
      '.......VVVCLCv',
      '.......VVVCLCv',
      '.......VVVCLCv',
      '.......VVVCLCv',
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
      agachado: mapa(20, [
        '.......TTTTttt',
        '......TTTT.ttt',
        '......TTT...tt',
        '......TT....tt',
        '......TT...OOO',
        '.....OOOO..OOO',
        '.....OOOQ',
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
      '.......VVVVrVv',
      '.......VVVVwVv',
      '.......VVVVwVv',
      '.......VVVVwVv',
      '.......VVVVwVv',
      '.......VVVVwVv',
      '.......VVVVwVv',
      '.......WWWWWWW',
    ]),
    hombro: [14, 9],
    mochila: [[8, 9, 4, 6]],
    piernas: null,   // las mismas de tres cuartos de frente, de atrás (ver abajo)
  },
};
// De espaldas, quieto y agachado son los de frente; en tres cuartos de
// espaldas, los de tres cuartos de frente (de atrás no se distingue punta de
// talón a esta escala). Lo que se mueve tiene sus propios cuadros (abajo).
VISTAS.espalda.piernas = { ...VISTAS.frente.piernas };
VISTAS.diagE.piernas = { ...VISTAS.diagF.piernas };

// ------------------------------------------------- las piernas que se mueven
/**
 * 🔁 OCHO CUADROS POR CICLO *(Santi: "a partir de ahora creo que todo debería
 * ser 8 fotogramas"; del trote: "solo se mueve la pierna de adelante y no
 * flexiona las rodillas")*: trotar (R0-R7), caminar (W0-W7) y avanzar
 * agachado (G0-G7). Las rodillas y los tobillos de cada cuadro están puestos a
 * mano, en puntos enteros, vistos de costado mirando a la derecha; cada pierna
 * es una línea de puntos enteros de dos de ancho (como el brazo del arma),
 * cadera → rodilla → tobillo, con la bota dibujada en la punta. Los cuadros
 * 4 a 7 son los 0 a 3 con las piernas cambiadas.
 *
 * El trote: apoya (la de adelante estirada, la de atrás empujando en punta),
 * amortigua (el cuerpo baja, la de atrás empieza a subir doblada), pasa (el
 * pie de atrás bien alto, cerca de la cola) y vuela (una empuja, la otra se
 * estira adelante, los dos pies en el aire y el cuerpo arriba).
 *
 * Las otras vistas salen de los mismos puntos: lo que va hacia adelante, de
 * frente baja en la pantalla (se acerca a la cámara) y de espaldas sube.
 */
const PASOS = {
  // [rodilla, tobillo] de la pierna de acá y [rodilla, tobillo] de la de allá
  R: { cadera: 17, baja: [0, 1, 0, -1, 0, 1, 0, -1], cuadros: [
    [[11, 20], [13, 24], [7, 21], [5, 23]],
    [[11, 21], [10, 24], [7, 21], [4, 21]],
    [[10, 21], [9, 24], [10, 20], [6, 21]],
    [[8, 21], [5, 23], [12, 19], [13, 22]],
  ] },
  W: { cadera: 17, baja: [0, 0, -1, 0, 0, 0, -1, 0], cuadros: [
    [[10, 21], [12, 24], [8, 21], [6, 24]],
    [[10, 21], [11, 24], [8, 21], [6, 23]],
    [[9, 21], [9, 24], [10, 21], [8, 23]],
    [[9, 21], [8, 24], [11, 21], [11, 23]],
  ] },
  G: { cadera: 20, baja: [3, 3, 2, 3, 3, 3, 2, 3], cuadros: [
    [[12, 21], [13, 24], [8, 22], [5, 24]],
    [[12, 21], [12, 24], [8, 22], [6, 23]],
    [[11, 21], [11, 24], [10, 21], [9, 23]],
    [[11, 21], [10, 24], [12, 21], [12, 23]],
  ] },
};
/** Cómo se ve desde cada vista lo que de costado va hacia adelante (x) y dónde está cada cadera. */
const VER = {
  lado: { aca: 9, alla: 8, kx: 1, ky: 0 },
  diagF: { aca: 8, alla: 11, kx: 0.5, ky: 0.3 },
  frente: { aca: 8, alla: 11, kx: 0, ky: 0.5 },
  espalda: { aca: 11, alla: 8, kx: 0, ky: -0.5 },
  diagE: { aca: 11, alla: 8, kx: 0.5, ky: -0.3 },
};
const CADERAS = {
  lado: ['.......TFFTT'],
  frente: ['.......TTTTTTF', '........TTTTTF'],
  espalda: ['.......TTTTTTF', '........TTTTTF'],
  diagF: ['.......TTTTttF'],
  diagE: ['.......tttTTTF'],
};
const CADERAS_AG = { lado: '.......TFFTTT', frente: '.......TTTTTTT', espalda: '.......TTTTTTT', diagF: '.......TTTTttt', diagE: '.......tttTTTT' };

/** La bota, con el tobillo en (ax, ay): cada vista y cada pierna tiene la suya. */
function bota(vista, aca, ax, ay, pon) {
  const fila = (y, x0, n, punta) => { for (let q = 0; q < n; q++) pon(x0 + q, y, punta && q === n - 1 ? 'Q' : 'O'); };
  if (vista === 'lado') { fila(ay + 1, ax - 1, 4); fila(ay + 2, ax - 1, 4, true); return; }
  if (vista === 'frente' || vista === 'espalda') {
    const izq = vista === 'frente' ? aca : !aca;
    const x0 = izq ? ax - 1 : ax;
    fila(ay + 1, x0, 3);
    fila(ay + 2, x0, 3);
    if (vista === 'frente') pon(x0 + 1, ay + 2, 'Q');
    return;
  }
  const izq = vista === 'diagF' ? aca : !aca;
  if (izq) { fila(ay + 1, ax - 1, 3); fila(ay + 2, ax - 1, 4, true); }
  else { fila(ay + 1, ax, 3); fila(ay + 2, ax, 3 + (vista === 'diagE' ? 1 : 0), vista === 'diagE'); }
}

/** Arma el mapa de un cuadro que se mueve, para una vista. */
function piernasQueSeMueven(vista, tipo, k) {
  const P = PASOS[tipo], V = VER[vista];
  const [rA, tA, rB, tB] = P.cuadros[k % 4];
  const [kAca, aAca, kAlla, aAlla] = k < 4 ? [rA, tA, rB, tB] : [rB, tB, rA, tA];
  const filas = [];
  const pon = (x, y, ch) => {
    const j = y - P.cadera;
    if (j < 0 || x < 0) return;
    while (filas.length <= j) filas.push([]);
    filas[j][x] = ch;
  };
  const pierna = (aca, rod, tob) => {
    const base = aca ? V.aca : V.alla;
    // Agachado, de frente las rodillas se abren.
    const abre = tipo === 'G' && vista !== 'lado' ? (base < 10 ? -1 : 1) : 0;
    const ver = ([x, y], abrir) => [base + Math.round((x - 9) * V.kx) + abrir, y + Math.round((x - 9) * V.ky)];
    const H = [base, P.cadera], K = ver(rod, abre * (vista.startsWith('diag') ? 1 : 2)), A = ver(tob, abre);
    A[1] = Math.min(A[1], 25);
    const color = aca || vista === 'frente' || vista === 'espalda' ? 'T' : 't';
    const trazo = (x, y) => { pon(x, y, color); pon(x + 1, y, color); };
    linea(H, K, trazo);
    linea(K, A, trazo);
    bota(vista, aca, A[0], A[1], pon);
  };
  pierna(false, kAlla, aAlla);
  pierna(true, kAca, aAca);
  const caderas = tipo === 'G' ? [CADERAS_AG[vista]] : CADERAS[vista];
  caderas.forEach((f, j) => { for (let x = 0; x < f.length; x++) if (f[x] !== '.') pon(x, P.cadera + j, f[x]); });
  return mapa(P.cadera, filas.map((f) => Array.from(f, (ch) => ch || '.').join('')));
}
for (const vista of Object.keys(VER)) {
  for (const tipo of Object.keys(PASOS)) for (let k = 0; k < 8; k++) VISTAS[vista].piernas[tipo + k] = piernasQueSeMueven(vista, tipo, k);
}

/**
 * EL BRAZO LIBRE (el izquierdo), dibujado aparte para que se hamaque.
 * 🔁 *(Santi: "agrandale un poco el brazo que no está utilizando, porque parece
 * un brazito de T-Rex")*: mide 8 puntos (hombro, codo a los 4, mano a los 8),
 * la mano le llega a la mitad del muslo; antes eran 6 y terminaba en el cinto.
 * Se hamaca al revés de la pierna de su lado; trotando el codo va doblado.
 * `ida` es cuánto va hacia adelante (de -1 a 1), `codo` cuánto se dobla (en radianes).
 */
const BRAZO_LIBRE = { R: { ida: 0.75, codo: 1.2 }, W: { ida: 0.35, codo: 0.25 }, G: { ida: 0.25, codo: 0.6 } };
const VER_BRAZO = {
  lado: { hombro: [9, 9], kx: 1, ky: 0 },
  frente: { hombro: [6, 9], kx: -0.15, ky: 0.35 },
  espalda: { hombro: [6, 9], kx: -0.15, ky: -0.35 },
  diagF: { hombro: [6, 9], kx: 0.5, ky: 0.3 },
  diagE: { hombro: [6, 9], kx: 0.5, ky: -0.3 },
};

/**
 * 🔁 EL REVÓLVER DIBUJADO A MANO EN 9 DIRECCIONES *(Santi: "el revólver parece
 * un objeto sin forma… un poco más largo y que tenga más forma de revólver y
 * que no se deforme cuando apunte a otras direcciones")*: el tambor con el
 * martillo arriba (oscuro), el caño de 5 (antes 4) con la boca clara y la
 * culata de madera hacia abajo de la mano. Cada dirección (de a 22,5°, de
 * arriba a abajo) está puesta punto por punto: no se gira ni se estira. La mano
 * está en (0, 0).
 */
const D = 31, G = 23, T = 24, L = 25, Wd = 5;
const REVOLVER = {
  '-4': [[-1, -1, D], [-1, -2, D], [0, -1, T], [0, -2, G], [0, -3, G], [0, -4, G], [0, -5, L], [1, 0, Wd], [1, 1, Wd]],
  '-3': [[-1, -1, D], [0, -2, D], [0, -1, T], [1, -2, G], [1, -3, G], [2, -4, G], [2, -5, L], [1, 0, Wd], [1, 1, Wd]],
  '-2': [[0, -1, D], [1, -2, D], [1, -1, T], [2, -2, G], [3, -3, G], [4, -4, L], [0, 1, Wd], [1, 1, Wd]],
  '-1': [[1, -1, D], [2, -2, D], [1, 0, T], [2, -1, G], [3, -1, G], [4, -2, G], [5, -2, L], [0, 1, Wd], [-1, 1, Wd]],
  0: [[1, -1, D], [2, -1, D], [1, 0, T], [2, 0, G], [3, 0, G], [4, 0, G], [5, 0, L], [0, 1, Wd], [-1, 1, Wd]],
  1: [[1, -1, D], [2, 0, D], [1, 0, T], [2, 1, G], [3, 1, G], [4, 2, G], [5, 2, L], [0, 1, Wd], [-1, 1, Wd]],
  2: [[1, 0, D], [2, 1, D], [1, 1, T], [2, 2, G], [3, 3, G], [4, 4, L], [-1, 1, Wd], [0, 1, Wd]],
  3: [[1, 1, D], [0, 1, T], [1, 2, G], [1, 3, G], [2, 4, G], [2, 5, L], [-1, 0, Wd], [-1, 1, Wd]],
  4: [[1, 1, D], [1, 2, D], [0, 1, T], [0, 2, G], [0, 3, G], [0, 4, G], [0, 5, L], [-1, 0, Wd], [-1, 1, Wd]],
};

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
 * diagE), `piernas` (quieto; caminar W0-W7; trotar R0-R7; agachado y avanzar
 * agachado G0-G7), `arma` (null,
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
    const corre = typeof dx === 'function' ? dx(j) : dx;
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') poner(x + corre, m.y + j + dy, C[fila[x]]);
  });
  /**
   * Cuánto baja el cuerpo: lo dice cada cuadro (PASOS). Agachado y quieto, 3.
   * Trotando, de costado el cuerpo va inclinado un punto hacia adelante.
   */
  const tipo = PASOS[piernas[0]] && /^\d$/.test(piernas.slice(1)) ? piernas[0] : null;
  const k = tipo ? +piernas[1] : 0;
  const baja = tipo ? PASOS[tipo].baja[k] : piernas === 'agachado' ? 3 : 0;
  const inclina = vista === 'lado' && tipo === 'R' ? 1 : 0;
  /**
   * 🔁 AGACHADO, ENCORVADO *(Santi: "el cuerpo, torso y cabeza, debería
   * inclinarse un poco hacia adelante y quedar apenas encorvado")*: la cabeza
   * se hunde un punto entre los hombros y, de costado, va dos puntos adelante
   * y la mitad de arriba del torso uno (en las diagonales, la cabeza uno). De
   * frente y de espaldas sólo se hunde: hacia la cámara no hay adelante que
   * mostrar.
   */
  const encorva = piernas === 'agachado' || tipo === 'G';
  const lomo = encorva && vista === 'lado' ? 1 : 0;
  const cabezaX = encorva ? (vista === 'lado' ? 2 : vista.startsWith('diag') ? 1 : 0) : 0;
  const cabezaY = encorva ? 1 : 0;
  const [hx, hy] = [V.hombro[0] + inclina + lomo, V.hombro[1] + baja];
  const dir = [Math.cos(ang), Math.sin(ang)];
  // Apuntando para arriba (hacia el fondo), el brazo va detrás del cuerpo.
  const detras = arma && dir[1] < -0.35;

  let boca = null;
  const brazo = () => {
    const largo = arma ? 6 : 8;
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
      const r = String(Math.max(-4, Math.min(4, Math.round(Math.atan2(dir[1], dir[0]) / (Math.PI / 8)))));
      const mx = Math.round(mano[0]), my = Math.round(mano[1]);
      for (const [x, y, c] of REVOLVER[r]) poner(mx + x, my + y, c);
      const [bx, by] = REVOLVER[r].find((p) => p[2] === L);
      boca = [mx + bx, my + by];
    }
    poner(Math.round(mano[0]), Math.round(mano[1]), C.P);
  };

  /** El brazo libre: de costado va detrás del cuerpo (es el de allá); en las otras vistas, al lado. */
  const brazoLibre = () => {
    const B = tipo ? BRAZO_LIBRE[tipo] : null;
    const ida = B ? B.ida * Math.cos(k * Math.PI / 4) : 0;
    const a = ida * 0.9, b = B ? B.codo : 0.1;
    const VB = VER_BRAZO[vista];
    const S = [VB.hombro[0] + inclina + lomo, VB.hombro[1] + baja];
    const ver = (fx, fy) => [S[0] + Math.round(fx * VB.kx), S[1] + Math.round(fy + fx * VB.ky)];
    const codo = [4 * Math.sin(a), 4 * Math.cos(a)];
    const mano = [codo[0] + 4 * Math.sin(a + b), codo[1] + 4 * Math.cos(a + b)];
    const atras = vista === 'lado';
    const manga = atras ? C.c : C.C;
    linea(S, ver(...codo), (x, y) => poner(x, y, manga));
    linea(ver(...codo), ver(...mano), (x, y) => poner(x, y, manga));
    const [mx, my] = ver(...mano);
    poner(mx, my, atras ? C.p : C.P);
  };

  if (vista === 'lado') brazoLibre();
  if (detras) brazo();
  if (mochila && (vista === 'espalda' || vista === 'diagE' || vista === 'lado')) {
    for (const [x, y, w, h] of V.mochila) for (let j = 0; j < h + mochila; j++) for (let q = 0; q < w; q++) poner(x + q + inclina + lomo, y + j + baja, j === 0 ? C.m : C.M);
  }
  const P = V.piernas[piernas] || V.piernas.quieto;
  dibujarMapa(P);
  // Cuando el cuerpo sube 1 (pasando un paso, en el aire o agachado), la cadera se estira un punto para que no
  // quede un hueco entre el cinto y el pantalón.
  if (baja < 0 || baja === 2) dibujarMapa({ y: P.y - 1, filas: [P.filas[0]] });
  dibujarMapa(V.torso, baja, (j) => inclina + (j < 5 ? lomo : 0));
  dibujarMapa(V.cabeza, baja + cabezaY, inclina + cabezaX);
  if (vista !== 'lado') brazoLibre();
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
