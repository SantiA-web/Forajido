/**
 * 🆕 E4 · EL JINETE DE LA LEY QUE SE CAE DEL CABALLO *(Santi: "vamos con la caída del caballo")*.
 *
 * Lo que eligió Santi: se cae **para atrás** (se echa atrás con el golpe, se va por el anca y cae de espaldas), el
 * caballo **se abre y se va** con la silla vacía, y el cuerpo **queda en la tierra y levanta polvo** al caer y al
 * arrastrarse. El movimiento está en systems/riders.js (`caerDelCaballo`) y el dibujo en entities/rider.js.
 *
 * LOS 8 CUADROS, de costado y mirando al este (como galopan al lado del tren), dibujados a mano por partes:
 * sombrero, cabeza, torso, brazos y piernas, cada parte su mapa y su lugar en cada cuadro. Nada se gira con código.
 *   0 el golpe: se echa atrás, suelta las riendas y tira los brazos arriba; el sombrero se le levanta.
 *   1 se va para atrás desde la cintura, levanta las rodillas; el sombrero se le vuela.
 *   2 acostado sobre el anca, con las piernas arriba y los brazos sueltos.
 *   3 se resbala por la grupa, con la cabeza pasando la cola.
 *   4 en el aire detrás del caballo, de cabeza, estirando el brazo hacia el suelo.
 *   5 llega al suelo con la mano y el hombro, las piernas por encima.
 *   6 el golpe de espaldas contra la tierra (el polvo), las piernas todavía arriba.
 *   7 las piernas bajan y queda tendido; después sigue el tirado de siempre (`lienzoTendido`).
 *
 * LAS MEDIDAS: el cuadro es el del jinete montado (estiloNuevo/jugador.js, 44 × 40) corrido: la columna 0 de acá es
 * la -16 del montado y la fila 0 es la 4. Así el asiento cae donde estaba (columnas 36-40, fila 18), el anca del
 * caballo queda entre las columnas 18 y 36 (filas 21-22) y el suelo, donde pisa el caballo, en la fila 41. El lienzo
 * va de la columna -24 a la 47.
 *
 * Las letras son las de la gente (el color lo pone su persona, `coloresDe`):
 *   sombrero h H k (luz, base, sombra), b la cinta · pelo a · piel n P p q · chaleco U V v w · camisa L C c
 *   cinto W y hebilla G · pantalón I T t · botas Q O o y la suela K
 */
import { iluminar } from '../../engine/luz.js';
import { C as BASE } from './jugador.js';
import { coloresDe } from './gente.js';

/** Las partes de un cuadro: `[columna, fila, filas]`, en las columnas y filas de arriba. */
export const CAIDA = [
  // 0 · El golpe.
  [
    [31, 0, ['.....hHHHk', '.....bbbbb', 'hhhhhHHHHHHHkkk', '..kkkkkkkkkkk']],
    [35, 6, ['aaappp', '.aaPPPn', '..apPq', '..qpq']],
    [35, 10, ['.UVVCv', '.UVVvv', '.UVVvCc', '.UVVvCcC', '..UVVvvcc', '.UVVvvCcC', '.VVVvwCCC', 'VVVvwCC', 'WWWWGW']],
    [40, 5, ['.....Pp', '...LLpq', '..LCC', '.LC', 'LC', '.C', '.c']],
    [35, 19, ['TTTIIII', '...TIIT', '...tIIT', '...tIIT', '...tIIT', '...tIIT', '...tIIT', '...QOOOO', '...oooooK']],
  ],
  // 1 · Se va para atrás.
  [
    [22, 0, ['......hHHk..', '....hhbbbbk.', '..hhHHHHHkkk', 'hhHHkkkk....', 'kkk.........']],
    [28, 8, ['.aaapp', 'aaPPPn', '.apPqq', '..qpq']],
    [31, 12, ['UVVCv', 'UVVvvc', '.UVVvCc', '..UVVvCc', '..VVVvwCc', '...VVVvwCC', '....WWWWGW']],
    [35, 7, ['..pq', '..Pp', '.LC', '.LC', 'LC']],
    [36, 15, [
      '.......IIT..',
      '.....IITTt..',
      '.....tt.IT..',
      'ttTTIIT..IT.',
      '.........IIT',
      '..........IT',
      '.........QOO',
      '.........oooK',
    ]],
  ],
  // 2 · Acostado sobre el anca.
  [
    [15, 3, ['..h', 'hbH', 'HbH', 'HbH', 'kbk', '..k']],
    [23, 15, ['.nPP.', 'pPPPq', 'aaapq', 'aaaa.']],
    [28, 15, ['..UUUUUUW', '.CVVVVVVW', 'CCVVVVVVG', 'cVVVvvvvW', '.vvwwww..']],
    [26, 10, ['pq', 'qq', '.c', '.cC', '..c']],
    [30, 9, ['..Pp', '..pq', '.LC', '.LC', 'LC', 'LC']],
    [36, 4, [
      '......KQOO..',
      '......KOOOo.',
      '......KOOo..',
      '.....IITOo..',
      '.....IITt...',
      '....IITt....',
      '....IITt....',
      '...IITt.....',
      '...IITt.....',
      '..IITt......',
      '.IITt.......',
      '.IITt.......',
      '.TTt........',
    ]],
  ],
  // 3 · Se resbala por la grupa.
  [
    [6, 8, ['hhHHHHHkk', '..bbbbb..', '..HHHHk..', '...kkk...']],
    [21, 24, ['.c', '.cC', 'cC', 'pq', 'qq']],
    [19, 19, ['.....UUUW', '..UUUVVVW', '.CVVVVVVG', 'CCVVVvvvW', 'cVvvvww..', '.ww......']],
    [13, 22, ['..nPP.', '.pPPPq', 'aaPpq.', 'aaaa..']],
    [17, 14, ['Pp', 'pq', '.LC', '..LC', '...LC', '....L']],
    [28, 8, [
      '........KQOO',
      '........KOOo',
      '.......IITOo',
      '.......IITt.',
      '......IITt..',
      '......IITt..',
      '.....IITt...',
      '....IITt....',
      '...IITt.....',
      '..IITt......',
      '.IITt.......',
      'IITt........',
      'TTt.........',
    ]],
  ],
  // 4 · En el aire, de cabeza.
  [
    [-2, 10, ['..hHHk..', '..bbbb..', 'hhHHHHkk']],
    [9, 21, ['.......UUW', '.....UUUVW', '...UUUVVVG', '..CUVVVVvW', '.CCVVVvvw.', 'CcVVvvw...', 'ccvvw.....']],
    [3, 26, ['..nPP.', '.pPPPq', 'aaPPq.', 'aaaaa.', '.aaa..']],
    [6, 27, ['....LC', '...LC', '..LC', '..LC', '.LC', 'Pp', 'pq']],
    [17, 13, ['......KQO.', '.....KOOOo', '.....IIOo.', '....IITt..', '....IITt..', '...IITt...', '..IITt....', '.IITt.....', '.ITt......', '.Tt.......']],
  ],
  // 5 · Llega al suelo con la mano.
  [
    [-6, 30, ['..hHHk..', '..bbbb..', 'hhHHHHkk', '..kkkk..']],
    [7, 27, ['......UUW', '.....UUVW', '....UUVVG', '...UUVVVW', '..CUVVVvW', '.CCVVVvw.', 'CcVVvvw..', 'cvvvw....']],
    [1, 34, ['..nPP.', '.pPPPq', 'aaPPq.', 'aaaaa.', '.aaa..']],
    [8, 33, ['..LC', '..LC', '.LC', '.LC', 'LC', 'Pp', 'pq']],
    [14, 16, ['....KQO.', '...KOOOo', '...IIOo.', '..IITt..', '..IITt..', '.IITt...', '.IITt...', 'IITt....', 'IITt....', 'ITt.....', 'Tt......']],
  ],
  // 6 · El golpe de espaldas.
  [
    [-11, 33, ['..hHHk..', '..bbbb..', 'hhHHHHkk', '..kkkk..']],
    [4, 36, ['......UUW', '...UUUVVW', '.CUVVVVVG', 'CCVVVVvvW', 'cVvvvwww.', '.www.....']],
    [-2, 38, ['..nPP', '.pPPPq', 'aaPPq.', 'aaaaa.']],
    [3, 32, ['.Pp', '.pq', '..LC', '..LC', '...LC', '...L']],
    [12, 26, ['..KQO.', '..KOOo', '..IIOo', '..IITt', '.IITt.', '.IITt.', '.IITt.', 'IITt..', 'IITt..', 'ITt...', '.t....']],
  ],
  // 7 · Las piernas bajan.
  [
    [-10, 31, ['..hHHk..', '..bbbb..', 'hhHHHHkk', '..kkkk..']],
    [3, 36, ['...UUUUUW', '.CUVVVVVW', 'CCVVVVVVG', 'cVVvvvvvW', '.vwwwwww.']],
    [-3, 37, ['..nPP.', '.pPPPq', 'aaPPq.', 'aaaaa.']],
    [-1, 34, ['Pp....', 'pqLC..', '...LCL']],
    [12, 34, [
      '..........KQ.',
      '....IIT...KOO',
      '..IITTtIIIOOo',
      'IITTt...ttooK',
      'TTt..........',
    ]],
  ],
];

/**
 * 🆕 EL TIRADO DE COSTADO, el que queda en la tierra al terminar *(Santi: "dibujale el tirado al costado y hacé uno
 * con chaqueta para los que tienen chaqueta")*. Antes quedaba el tirado de adentro del tren, que está visto desde
 * arriba con los brazos abiertos, y se notaba el salto desde el cuadro 7. Éste sigue al 7: de espaldas, la cabeza
 * a la izquierda, una rodilla apenas levantada, el brazo de acá sobre el costado y el sombrero en el suelo.
 * Con chaqueta: el costado del cuerpo es la chaqueta de lona, larga hasta tapar la cadera, y arriba asoma el
 * chaleco con la estrella. (Las piezas van en orden: las de después tapan a las de antes.)
 */
export const TIRADO = {
  comun: [
    [-12, 38, ['..hHHk..', '..bbbb..', 'hhHHHHkk']],
    [-3, 37, ['..nPP.', '.nPPPq', 'aPPPpq', 'aaaaa.']],
    [3, 36, ['...UUUUUW', '.CUVVVVVW', 'CCVVVVVVG', 'cVVvvvvvW', '.vwwwwww.']],
    [12, 35, ['....IIT.......', '..IITTtII..KQ.', 'IITTt..tIIIKOO', 'TTt......ttOOo', '...........ooK']],
    [5, 39, ['LLCCCCPp', '.ccccc.q']],
  ],
  // 🔁 Con chaqueta: la chaqueta en sombra y el brazo claro encima. Toda del mismo tono parecía una bolsa.
  chaqueta: [
    [-12, 38, ['..hHHk..', '..bbbb..', 'hhHHHHkk']],
    [-3, 37, ['..nPP.', '.nPPPq', 'aPPPpq', 'aaaaa.']],
    [12, 35, ['....IIT.......', '..IITTtII..KQ.', 'IITTt..tIIIKOO', 'TTt......ttOOo', '...........ooK']],
    [3, 36, ['...UUEUUc', '.cUVVVVVcc', 'Ccccccccccc', 'cccccccccc', '.cccccccc']],
    [5, 39, ['LLLLLLPp', '.CCCCC.q']],
  ],
};
/** El cuadro, la caída entera dura `CAIDA_DURA` segundos (lo que tarda en caer de la silla al suelo). */
export const CAIDA_DURA = 0.6;
/** Cuándo pega en el suelo (el cuadro 6): ahí arranca el polvo y empieza a quedar atrás. */
export const CAIDA_PEGA = 6 / 8 * CAIDA_DURA;

export const ANCHO_CAIDA = 72, ALTO_CAIDA = 46, OX_CAIDA = 24;
const caidas = new Map();
/** El cuadro `k` de la caída (o el tirado, con `k` 8), iluminado, como canvas (se guarda). */
export function lienzoCaida(aspecto, k, luz = 0, fino = true) {
  const clave = JSON.stringify(aspecto || {}) + '|' + k + '|' + luz + '|' + fino;
  let g = caidas.get(clave);
  if (g) return g;
  if (caidas.size > 200) caidas.clear();
  const col = { ...BASE, ...coloresDe(aspecto || {}, 'guardia') };
  // (Con chaqueta, las mangas y el cuello de lona, como en el montado.)
  if (aspecto && aspecto.chaqueta) Object.assign(col, { L: 37, C: 36, c: 35 });
  const idx = new Int16Array(ANCHO_CAIDA * ALTO_CAIDA).fill(-1);
  // (`k` 8: el tirado de costado, con o sin chaqueta.)
  const piezas = k < CAIDA.length ? CAIDA[k] : TIRADO[aspecto && aspecto.chaqueta ? 'chaqueta' : 'comun'];
  for (const [x0, y0, filas] of piezas) {
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        const c = col[fila[i]];
        if (fila[i] === '.' || c == null) continue;
        const x = x0 + i + OX_CAIDA, y = y0 + j;
        if (x >= 0 && y >= 0 && x < ANCHO_CAIDA && y < ALTO_CAIDA) idx[y * ANCHO_CAIDA + x] = c;
      }
    });
  }
  // Sin el borde fino, el borde va en el dibujo (como el tirado).
  if (!fino) {
    const lleno = idx.slice();
    const v = (a, b) => a >= 0 && b >= 0 && a < ANCHO_CAIDA && b < ALTO_CAIDA && lleno[b * ANCHO_CAIDA + a] >= 0;
    for (let y = 0; y < ALTO_CAIDA; y++) for (let x = 0; x < ANCHO_CAIDA; x++) {
      if (lleno[y * ANCHO_CAIDA + x] >= 0) continue;
      if (v(x - 1, y) || v(x + 1, y) || v(x, y - 1) || v(x, y + 1)) idx[y * ANCHO_CAIDA + x] = 0;
    }
  }
  const datos = iluminar({ ancho: ANCHO_CAIDA, alto: ALTO_CAIDA, indices: idx, campo: () => luz });
  const cv = document.createElement('canvas');
  cv.width = ANCHO_CAIDA; cv.height = ALTO_CAIDA;
  cv.getContext('2d').putImageData(new ImageData(datos, ANCHO_CAIDA, ALTO_CAIDA), 0, 0);
  g = cv;
  caidas.set(clave, g);
  return g;
}

/**
 * EL POLVO que levanta al pegar y al arrastrarse: una nube chica que crece y se deshace, en 4 cuadros dibujados a
 * mano (D la tierra levantada, d el borde, más claro). De día es tierra clara; de noche, más apagada.
 */
export const POLVO = [
  ['.dd.', 'dDDd', 'dDDd', '.dd.'],
  ['..dd..', '.dDDd.', 'dDDDDd', 'dDDDDd', '.dDDd.', '..dd..'],
  ['..d.d..', '.dDdDd.', 'dDd.dDd', '.dDdDd.', '..d.d..'],
  ['.d...d.', 'd..d..d', '..d.d..', '.d...d.'],
];
export const COLOR_POLVO = { dia: { D: 37, d: 36 }, noche: { D: 15, d: 14 } };
