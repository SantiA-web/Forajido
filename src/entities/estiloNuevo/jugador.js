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
 * muy grande"; eligió esas medidas)*. 🔁 Antes medía 32 (24 unidades). Los colores son
 * índices de la paleta (engine/paleta.js) y la luz llega pareja, la del punto
 * donde está parado (engine/luz.js).
 */
import { iluminar } from '../../engine/luz.js';
import { sombrear } from '../../engine/paleta.js';

// ------------------------------------------------------------- los colores
/** Cada letra de los mapas, a su color de la paleta. */
const C = {
  H: 4, h: 5, k: 3, b: 1, Y: 28,           // el sombrero, la cinta, la hebilla
  P: 12, p: 11, B: 47,                     // la piel y la barba
  R: 9, r: 8,                              // el pañuelo
  V: 32, v: 33, w: 1,                      // el chaleco
  C: 15, L: 16, c: 14,                     // la camisa
  T: 23, t: 31,                            // el pantalón (la pierna de acá y la de allá)
  O: 32, Q: 34,                            // las botas
  W: 3, F: 5,                              // el cinto y la funda
  M: 4, m: 5,                              // la mochila
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
      '.......HHHH',
      '......kbbbbbY',
      '...kHHHHHHHHHHHk',
      '....kkkkkkkkkkk',
      '......BPPPPP',
      '......BBPPPPP',
      '.......BBBBB',
      '.....rRRRRRR',
    ]),
    torso: mapa(8, [
      '......VVVVCCC',
      '......VVVVCCL',
      '......wVVVCCL',
      '......wVVVCCL',
      '......wVVVCCL',
      '......wVVVCCL',
      '......wVVVCCL',
      '......wVVVCCC',
      '......WWWWWWY',
    ]),
    hombro: [10, 9],
    mochila: [[3, 9, 4, 8]],
    piernas: {
      quieto: mapa(17, [
        '......tFFTTT',
        '......tFFTTT',
        '......ttTTTT',
        '.......tTTT',
        '.......tTTT',
        '.......tTTT',
        '.......tTTT',
        '.......tTTT',
        '.....OOOOOOOO',
        '.....OQOOOOOO',
      ]),
      A: mapa(17, [
        '......tFFTTT',
        '......tFFTTT',
        '......ttTTTT',
        '......tt.TTT',
        '.....ttt..TTT',
        '.....tt...TTT',
        '....ttt...TTT',
        '....tt.....TTT',
        '..OOOO.....OOOOO',
        '..OOOO.....OQOOO',
      ]),
      B: mapa(17, [
        '......tFFTTT',
        '......tFFTTT',
        '......ttTTTTT',
        '......tt..TTT',
        '......tt.TTT',
        '......tt.TTT',
        '......tt.OOOOO',
        '......tt.OQOOO',
        '.....OOOOO',
        '.....OOOOO',
      ]),
      C: mapa(17, [
        '......tFFTTT',
        '......tFFTTT',
        '......TTTTtt',
        '.....TTT..ttt',
        '.....TTT...tt',
        '....TTT....ttt',
        '....TTT.....tt',
        '...TTT......tt',
        '.OOOOO......OOOO',
        '.OQOOO......OOOO',
      ]),
      D: mapa(17, [
        '......tFFTTT',
        '......tFFTTT',
        '......tttTTT',
        '.......ttTTT',
        '........tTTT',
        '.......ttTTT',
        '.....OOOtTTT',
        '.....OOOtTTT',
        '........OOOOOO',
        '........OQOOOO',
      ]),
      agachado: mapa(20, [
        '......tFFTTTTT',
        '......ttTTTTTTT',
        '......tt...TTTT',
        '.....ttt....TTT',
        '.....tt.....TTT',
        '...OOOOO..OOOOOO',
        '...OOOOO..OQOOOO',
      ]),
      agachado2: mapa(20, [
        '......tFFTTTTT',
        '......ttTTTTTTT',
        '.....ttt...TTTT',
        '....ttt.....TTT',
        '....tt.....TTT',
        '..OOOOO...OOOOOO',
        '..OOOOO...OQOOOO',
      ]),
    },
  },

  frente: {
    cabeza: mapa(0, [
      '.......HHHHH',
      '......kbbYbbk',
      '...kHHHHHHHHHHHk',
      '....kkkkkkkkkkk',
      '.......PPPPPP',
      '.......pPPPPp',
      '.......BBBBBB',
      '......RRRRRRRR',
    ]),
    torso: mapa(8, [
      '.....CVVRRRRVVC',
      '.....CVVVRRVVVC',
      '.....CVVCLLCVVC',
      '.....CVVCLLCVVC',
      '.....CVVCLLCVVC',
      '.....CVVCLLCVVC',
      '.....PVVCLLCVV',
      '.....PVVCCCCVV',
      '......WWWYYWWW',
    ]),
    hombro: [14, 9],
    mochila: [[6, 8, 1, 8], [13, 8, 1, 8]],
    piernas: {
      quieto: mapa(17, [
        '......TTTTTTTT',
        '......TTTTTTTT',
        '......TTTT.TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '.....OOOO..OOOO',
        '.....OOOO..OOOO',
      ]),
      A: mapa(17, [
        '......TTTTTTTT',
        '......TTTTTTTT',
        '......TTTT.TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......OOOO.TTT',
        '......OOOO.TTT',
        '...........TTT',
        '..........OOOO',
        '..........OOOO',
      ]),
      B: mapa(17, [
        '......TTTTTTTT',
        '......TTTTTTTT',
        '......TTTT.TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '.....OOOO..TTT',
        '.....OOOO..OOOO',
        '...........OOOO',
      ]),
      C: mapa(17, [
        '......TTTTTTTT',
        '......TTTTTTTT',
        '......TTTT.TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT.OOOO',
        '......TTT.OOOO',
        '......TTT',
        '.....OOOO',
        '.....OOOO',
      ]),
      D: mapa(17, [
        '......TTTTTTTT',
        '......TTTTTTTT',
        '......TTTT.TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..TTT',
        '......TTT..OOOO',
        '.....OOOO..OOOO',
        '.....OOOO',
      ]),
      agachado: mapa(20, [
        '.....TTTTTTTTTT',
        '.....TTTT..TTTT',
        '....TTTT....TTTT',
        '....TTT......TTT',
        '.....TTT....TTT',
        '....OOOO....OOOO',
        '....OOOO....OOOO',
      ]),
      agachado2: mapa(20, [
        '.....TTTTTTTTTT',
        '.....TTTT..TTTT',
        '....TTTT....TTTT',
        '....TTT......TTT',
        '....OOOO....TTT',
        '....OOOO....OOOO',
        '............OOOO',
      ]),
    },
  },

  espalda: {
    cabeza: mapa(0, [
      '.......HHHHH',
      '......kbbbbbk',
      '...kHHHHHHHHHHHk',
      '....kkkkkkkkkkk',
      '.......BBBBBB',
      '.......BBBBBB',
      '........pppp',
      '......RRRRRRRR',
    ]),
    torso: mapa(8, [
      '.....CVVVVrrVVVC',
      '.....CVVVVrVVVVC',
      '.....CVVVVwVVVVC',
      '.....CVVVVwVVVVC',
      '.....CVVVVwVVVV',
      '.....CVVVVwVVVV',
      '.....PVVVVwVVVV',
      '.....PVVVVwVVVV',
      '......WWWWWWWWW',
    ]),
    hombro: [15, 9],
    mochila: [[7, 9, 7, 8]],
    piernas: null,   // las mismas de frente (ver abajo)
  },

  diagF: {
    cabeza: mapa(0, [
      '.......HHHHH',
      '......kbbbbbbY',
      '...kHHHHHHHHHHHHk',
      '....kkkkkkkkkkkk',
      '......BPPPPPP',
      '......BpPPPPP',
      '.......BBBBBB',
      '......RRRRRRRR',
    ]),
    torso: mapa(8, [
      '.....CVVVRRRVVV',
      '.....CVVVCRCVVV',
      '.....CVVVCLCVVV',
      '.....CVVVCLCVVV',
      '.....CVVVCLCVVV',
      '.....CVVVCLCVVV',
      '.....PVVVCLCVVV',
      '.....PVVVCLCVVV',
      '.....WWWWWYWWWW',
    ]),
    hombro: [14, 9],
    mochila: [[7, 8, 1, 8], [12, 8, 1, 8]],
    piernas: {
      quieto: mapa(17, [
        '......TTTT..ttt',
        '......TTTT..ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...tOOOO',
        '.....OOOOO..OOOO',
        '.....OQOOOO',
      ]),
      A: mapa(17, [
        '......TTTT..ttt',
        '......TTTT..ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '.....OOOOO..ttt',
        '.....OQOOOO.ttt',
        '............ttt',
        '............OOOO',
        '............OOOO',
      ]),
      B: mapa(17, [
        '......TTTT..ttt',
        '......TTTT..ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '.....OOOOO..ttt',
        '.....OQOOOO.OOOO',
        '............OOOO',
      ]),
      C: mapa(17, [
        '......TTTT..ttt',
        '......TTTT..ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT..OOOO',
        '......TTT..OOOO',
        '......TTT',
        '......TTT',
        '.....OOOOO',
        '.....OQOOOO',
      ]),
      D: mapa(17, [
        '......TTTT..ttt',
        '......TTTT..ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...ttt',
        '......TTT...tOOOO',
        '......TTT...tOOOO',
        '.....OOOOO',
        '.....OQOOOO',
      ]),
      agachado: mapa(20, [
        '.....TTTTTTttttt',
        '.....TTTT...tttt',
        '....TTTT.....ttt',
        '....TTT......ttt',
        '.....TTT....ttt',
        '....OOOOO..OOOO',
        '....OQOOOO.OOOO',
      ]),
      agachado2: mapa(20, [
        '.....TTTTTTttttt',
        '.....TTTT...tttt',
        '....TTTT.....ttt',
        '....TTT......ttt',
        '...OOOOO....ttt',
        '...OQOOOO..OOOO',
        '...........OOOO',
      ]),
    },
  },

  diagE: {
    cabeza: mapa(0, [
      '.......HHHHH',
      '......bbbbbbk',
      '...kHHHHHHHHHHHHk',
      '....kkkkkkkkkkkk',
      '......BBBBBBP',
      '......BBBBBBP',
      '........ppp',
      '......RRRRRRR',
    ]),
    torso: mapa(8, [
      '.....VVVVVRVVVC',
      '.....VVVVrrrVVv',
      '.....VVVVVrVVVv',
      '....cVVVVVwVVVv',
      '....cVVVVVwVVVv',
      '....cVVVVVwVVVv',
      '....PVVVVVwVVVv',
      '.....VVVVVwVVVV',
      '.....WWWWWWWWWW',
    ]),
    hombro: [14, 9],
    mochila: [[6, 9, 7, 8]],
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
 * diagE), `piernas` (quieto, A, B, C, D, agachado, agachado2), `arma` (null,
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
  const dibujarMapa = (m, dy = 0) => m.filas.forEach((fila, j) => {
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') poner(x, m.y + j + dy, C[fila[x]]);
  });
  // Agachado, el cuerpo baja 3; pasando un paso, sube 1.
  const baja = piernas.startsWith('agachado') ? 3 : (piernas === 'B' || piernas === 'D') ? -1 : 0;
  const [hx, hy] = [V.hombro[0], V.hombro[1] + baja];
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
    for (const [x, y, w, h] of V.mochila) for (let j = 0; j < h + mochila; j++) for (let q = 0; q < w; q++) poner(x + q, y + j + baja, j === 0 ? C.m : C.M);
  }
  const P = V.piernas[piernas] || V.piernas.quieto;
  dibujarMapa(P);
  // Pasando un paso el cuerpo sube 1: la cadera se estira un punto para que no
  // quede un hueco entre el cinto y el pantalón.
  if (baja < 0) dibujarMapa({ y: P.y - 1, filas: [P.filas[0]] });
  dibujarMapa(V.torso, baja);
  dibujarMapa(V.cabeza, baja);
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
