/**
 * 🆕 EL JUGADOR ARRIBA DEL TECHO, EN LA GRILLA *(Santi: "vamos con el jugador"; "seguí con el resto")*.
 *
 * El agazapado, el correr y el saltar son las piernas de siempre (ver `jugador.js`). Lo que hay acá son las poses que
 * no se pueden armar con el cuerpo parado: cuerpo a tierra, perder pie, colgado de cada lado, cayendo al enganche y
 * caído por un golpe. Todas de costado mirando al este, 8 cuadros las que se mueven, cada parte con su mapa y su lugar
 * en cada cuadro; al oeste, en espejo.
 *
 * LAS MEDIDAS: cada pieza es `[columna, fila, filas]`. La columna 0 es la x del jugador y la fila 0 es la primera debajo
 * de sus pies, así que el cuerpo vive en filas negativas. Colgado, en cambio, la fila 0 es el filo del techo.
 * Las letras son las de `COLORES` (jugador.js). Las piezas van en orden: las de después tapan a las de antes.
 */
import { iluminar } from '../../engine/luz.js';
import { sombrear } from '../../engine/paleta.js';
import { C as COLORES, VISTAS, MOCHILA, armaEn } from './jugador.js';
import { CAIDA, TIRADO } from './caida.js';

const ANCHO = 72, ALTO = 84, OX = 36, OY = 50;
export const LIENZO_TECHO = { ANCHO, ALTO, OX, OY };

/** Un mapa de pie del jugador (`jugador.js`), en las columnas y filas de acá. */
const dePie = (m, dx = 0, dy = 0) => [dx - 10, m.y - 27 + dy, m.filas];
/** El mismo mapa, en sombra: la parte del cuerpo que queda del otro lado. */
const SOMBRA = { I: 'T', T: 't', L: 'C', C: 'c', P: 'p', p: 'q', Q: 'O', O: 'o' };
const enSombra = ([x, y, filas], dx = 0, dy = 0) => [x + dx, y + dy, filas.map((f) => f.replace(/[ITLCPpQO]/g, (c) => SOMBRA[c]))];

// La cabeza de costado con el pañuelo subido (como en el asalto).
const CABEZA = [
  '.........hkH......',
  '........hhkHk.....',
  '...hh..hbbbbbk..kk',
  '....hhHHHHHHHHHkk.',
  '.....xkkkkkkkkkx..',
  '........qpPPp.....',
  '........rRRRRS....',
  '.........rRRS.....',
  '..........rS......',
];
const TORSO_PIE = [
  '.......UVVvV',
  '.......UVVvV',
  '.......UVVvv',
  '.......UVVvv',
  '.......UVVvv',
  '.......UVVvv',
  '.......VVVvw',
  '.......VVVvw',
  '.......WWyWG',
];

// ------------------------------------------------------------- cuerpo a tierra
/** El cuerpo acostado boca abajo, con el pecho apenas levantado y la cabeza mirando adelante. */
const TORSO_TIERRA = [-5, -5, [
  '..UUUUUVv..',
  '.UVVVVVVvv.',
  'WUVVVVVVvvv',
  'WGVvvvvvwwc',
  '..wwwwwwww.',
]];
const CABEZA_TIERRA = [-4, -13, CABEZA];

/** La pierna, de estirada (0) a la rodilla bien adelante (3). */
const PIERNA = [
  [-16, -5, [
    '.......IIIII',
    '...IIIITTTTT',
    'Q.ITTTTTTttt',
    'OOTTtttt....',
    'KK..........',
  ]],
  [-15, -5, [
    '......IIIII',
    '..IIIITTTTT',
    'Q.ITTTTTttt',
    'OOTTttt....',
    'KK.........',
  ]],
  [-13, -5, [
    '...IIIIII',
    '.IITTTTTT',
    'QITTt.ttt',
    'OTTt.....',
    'KK.......',
  ]],
  [-12, -5, [
    '..IIIIII',
    'IITTTTTT',
    'QTTt.ttt',
    'OTt.....',
    'K.......',
  ]],
];
/** El brazo que tira: de estirado adelante (0) a la mano debajo del pecho (3). */
const BRAZO_TIERRA = [
  [3, -4, ['LC.......', '.LCCC....', '...cCCLPp', '.....cCpq']],
  [3, -4, ['LC.....', '.LCC...', '..cCLPp', '...cCpq']],
  [3, -4, ['LC...', 'LCC..', 'cCLPp', '.cCpq']],
  [2, -4, ['LC..', 'LCC.', 'cLPp', '.Cpq']],
];
/** El brazo apuntando, uno por dirección del arma (de -4, derecho arriba, a 2, hacia abajo): `mano` es donde va la empuñadura. */
const BRAZO_APUNTA = {
  [-4]: { pieza: [4, -13, ['Pp', 'pq', 'LC', 'LC', 'LC', 'LC', 'LC', 'LC', 'LC']], mano: [4, -13] },
  [-3]: { pieza: [4, -12, ['...Pp', '...pq', '..LC.', '..LC.', '.LC..', '.LC..', 'LC...', 'LC...']], mano: [7, -12] },
  [-2]: { pieza: [3, -11, ['.....Pp', '.....pq', '....LC.', '...LC..', '..LC...', '.LC....', 'LC.....']], mano: [8, -11] },
  [-1]: { pieza: [3, -8, ['.......Pp', '....LCCpq', '.LLCCc...', 'LCc......']], mano: [10, -8] },
  0: { pieza: [3, -6, ['LLCCCCCPp', '..ccccc.q']], mano: [10, -6] },
  1: { pieza: [3, -5, ['LLCC.....', '..ccCCCPp', '....ccCpq']], mano: [10, -4] },
  2: { pieza: [3, -6, ['LC....', '.LC...', '..LC..', '...LC.', '....Pp', '....pq']], mano: [7, -2] },
};

// El bulto en la espalda, cuerpo a tierra: la manta enrollada y el morral, según lo que llevás.
function mochilaTierra(n) {
  const morral = n >= 3
    ? [-9, -10, ['.MJJJJJJM..', 'MMMMYMMMMm.', 'JMMMMMMMMm.', 'mmmmmmmmmm.']]
    : [-8, -9, ['.MJJJJM..', 'MMMYMMMm.', 'mmmmmmmm.']];
  return [morral, [-3, -9, ['XeNNNeX', 'NEZZZEN', 'XiXXXiX']]];
}

const arrastre = [0, 1, 2, 3, 3, 2, 1, 0];
const opuesto = [3, 2, 1, 0, 0, 1, 2, 3];
const baja = [0, 0, 1, 1, 0, 0, 1, 1];
function poseTierra(k, moviendo, mochila, apunta = false) {
  const sube = moviendo ? baja[k] : 0;
  const aca = moviendo ? arrastre[k] : 0, alla = moviendo ? opuesto[k] : 3;
  return [
    enSombra(PIERNA[moviendo ? alla : 0], 0, -1),
    enSombra(BRAZO_TIERRA[alla], 1, -1),
    PIERNA[moviendo ? aca : 0],
    TORSO_TIERRA,
    ...(mochila > 0 ? mochilaTierra(mochila) : []),
    [CABEZA_TIERRA[0], CABEZA_TIERRA[1] + sube, CABEZA],
    ...(apunta ? [] : [BRAZO_TIERRA[aca]]),
  ];
}

// ------------------------------------------------------------ perder pie, cayendo
/** El brazo que da la vuelta, en ocho posiciones alrededor del hombro. */
const VUELTA = [
  [-2, -26, ['Pp', 'pq', 'LC', 'LC', 'LC', 'LC', 'LC', 'LC']],
  [-1, -25, ['....Pp', '....pq', '...LC.', '..LC..', '.LC...', 'LC....', 'LC....']],
  [-1, -19, ['LLCCCCPp', '..cccc.q']],
  [-1, -18, ['LC....', '.LC...', '..LC..', '...LC.', '....Pp', '....pq']],
  [-1, -18, ['LC', 'LC', 'LC', 'LC', 'LC', 'LC', 'Pp', 'pq']],
  [-6, -18, ['....CL', '...CL.', '..CL..', '.CL...', 'Pp....', 'pq....']],
  [-8, -18, ['PpCCCCLL', 'q.cccc..']],
  [-6, -25, ['Pp....', 'pq....', '.CL...', '..CL..', '...CL.', '....CL', '....CL']],
];
/** Cómo se va para atrás mientras tambalea, en columnas. */
const TAMBALEA = [-1, -2, -2, -1, -1, 0, -1, -1];
function mochilaDePie(n, dx, dy = 0) {
  const M = MOCHILA.lado;
  return [dePie(M.manta, dx, dy), ...(M.morral[n] ? [dePie(M.morral[n], dx, dy)] : [])];
}
function posePerderPie(k, mochila) {
  const dx = TAMBALEA[k];
  return [
    enSombra(VUELTA[(k + 4) % 8], dx),
    dePie(VISTAS.lado.piernas['R' + k]),
    [-10 + dx, -19, TORSO_PIE],
    ...(mochila > 0 ? mochilaDePie(Math.min(4, mochila), dx) : []),
    [-10 + dx * 2, -28, CABEZA],
    [VUELTA[k][0] + dx, VUELTA[k][1], VUELTA[k][2]],
  ];
}
/** Cayendo, los brazos abiertos en V, de a dos alturas: el de acá para adelante y el de allá para atrás, sin taparle la cara. */
const ARRIBA_ACA = [
  [0, -27, ['.......Pp', '.......pq', '......LC.', '.....LC..', '....LC...', '...LC....', '..LC.....', '.LC......', 'LC.......']],
  [0, -28, ['......Pp', '......pq', '.....LC.', '....LC..', '....LC..', '...LC...', '..LC....', '.LC.....', 'LC......', 'LC......']],
];
const ARRIBA_ALLA = [
  [-10, -27, ['Pp.......', 'pq.......', '.CL......', '..CL.....', '...CL....', '....CL...', '.....CL..', '......CL.', '.......CL']],
  [-9, -28, ['Pp......', 'pq......', '.CL.....', '..CL....', '..CL....', '...CL...', '....CL..', '.....CL.', '......CL', '......CL']],
];
const ALTURA = [0, 0, 1, 1, 0, 0, 1, 1];
/** Cayendo: los brazos arriba, las piernas pedaleando y el sombrero que se le levanta. */
function poseCayendo(k, mochila) {
  const a = ARRIBA_ACA[ALTURA[k]], b = ARRIBA_ALLA[ALTURA[(k + 2) % 8]];
  return [
    enSombra(b),
    dePie(VISTAS.lado.piernas['R' + k]),
    [-10, -19, TORSO_PIE],
    ...(mochila > 0 ? mochilaDePie(Math.min(4, mochila), 0) : []),
    [-10, -23, CABEZA.slice(5)],
    [-10, -30 - (k % 4 < 2 ? 0 : 1), CABEZA.slice(0, 5)],
    a,
  ];
}

// ------------------------------------------------------------------- colgado
/** Del lado de acá: de espaldas, con los brazos arriba agarrando el filo y las piernas pataleando. */
const PIERNA_COLGADA = {
  izq: [
    [-5, 20, ['.II', '.II', '.II', '.II', '.II', '.II', '.II', '.IT', 'QOO', 'KKK']],
    [-6, 20, ['..II', '..II', '.II.', '.II.', '.II.', '.IT.', 'QOO.', 'KKK.']],
    [-4, 20, ['II.', 'II.', '.II', '.II', '.II', 'IIT', 'QOO', 'KKK']],
  ],
  der: [
    [1, 20, ['Tt.', 'Tt.', 'Tt.', 'Tt.', 'Tt.', 'Tt.', 'Tt.', 'Tt.', 'OOo', 'KKK']],
    [2, 20, ['Tt..', 'Tt..', '.Tt.', '.Tt.', '.Tt.', '.Tt.', '.OOo', '.KKK']],
    [0, 20, ['.Tt', '.Tt', 'Tt.', 'Tt.', 'Tt.', 'Ttt', 'OOo', 'KKK']],
  ],
};
const PATADA = [[0, 2], [1, 2], [2, 1], [2, 0], [0, 1], [1, 0], [2, 2], [1, 1]];
const BRAZO_COLGADO_IZQ = [-8, -1, ['PPp..', 'Ppq..', 'LC...', 'LC...', 'LC...', '.LC..', '.LC..', '.LC..', '..LC.', '..LC.', '...LC', '...LC']];
const BRAZO_COLGADO_DER = [4, -1, ['..PPp', '..Ppq', '...Cc', '...Cc', '...Cc', '..Cc.', '..Cc.', '..Cc.', '.Cc..', '.Cc..', 'Cc...', 'Cc...']];
function poseColgadoAca(k, mochila) {
  const [i, d] = PATADA[k];
  const dy = 3, V = VISTAS.espalda;
  const piezas = [
    PIERNA_COLGADA.der[d],
    PIERNA_COLGADA.izq[i],
    [-5, 20, ['.IITTTtt.', '.IIT.ttt.']],
    dePie(V.torso, 0, 30),
  ];
  if (mochila > 0) {
    const M = MOCHILA.espalda;
    piezas.push(dePie(M.manta, 0, 30));
    if (M.morral[mochila]) piezas.push(dePie(M.morral[mochila], 0, 30));
  }
  piezas.push(dePie(V.cabeza, 0, 27 + dy), BRAZO_COLGADO_IZQ, BRAZO_COLGADO_DER);
  return piezas;
}
const TIEMBLA = [0, 0, 1, 1, 0, 0, 1, 1], MANO_A = [0, 0, 0, 1, 1, 0, 0, 0], MANO_B = [0, 1, 1, 0, 0, 0, 0, 0];
/** Del lado de allá: sólo la copa del sombrero asomando y las dos manos en el filo. */
function poseColgadoAlla(k) {
  return [
    [-5, -3 + TIEMBLA[k], ['..hkH....', '.hhkHk...', 'hbbbbbkkk']],
    [-9, -1 + MANO_A[k], ['PPp', 'Ppq', '.q.']],
    [6, -1 + MANO_B[k], ['PPp', 'Ppq', '.q.']],
  ];
}

// --------------------------------------------------------------------- caído
/** Pasa un cuadro de la caída del caballo a las filas de acá (el suelo era la fila 41). */
const deCaida = (piezas, dx) => piezas.map(([x, y, filas]) => [x + dx, y - 41, filas]);
/** El golpe, hacia atrás; después el mismo tirado de los jinetes; y se levanta. */
const CAIDO = [
  // 0 · El golpe: se echa atrás, los brazos adelante.
  [
    [-3, -10, ['.IIIT....', '.tIIT....', '..IIT....', '..IIT....', '..IIT....', '..IIT....', '..IIT....', '.IIIT....', '.QOOOO...', '.KKKKK...']],
    [-6, -19, ['UVVvv..', 'UVVvv..', '.UVVvv.', '.UVVvv.', '..UVVvv', '..UVVvv', '..VVVvw', '..VVVvw', '..WWyWG']],
    [-14, -29, CABEZA],
    [-1, -22, ['......Pp', '....LCpq', '..LCc...', 'LCc.....']],
  ],
  // 1 · Se va de espaldas: las piernas se despegan.
  [
    [-17, -20, ['......hHHk..', '....hhbbbbk.', '..hhHHHHHkkk', 'hhHHkkkk....', 'kkk.........']],
    [-11, -15, ['.kkkpp', 'kkPPPn', '.krRqq', '..rRr.']],
    [-8, -12, ['UVVCv.....', 'UVVvvc....', '.UVVvCc...', '..UVVvCc..', '..VVVvwCc.', '...VVVvwCC', '....WWWWGW']],
    [1, -13, ['.....IIT.', '...IITTt.', '.IITTt.Tt', 'IIT...Tt.', '.....QOO.', '.....oooK']],
    [-5, -19, ['..Pp', '..pq', '.LC.', 'LC..']],
  ],
  deCaida(CAIDA[6], -6),
  deCaida(CAIDA[7], -6),
  deCaida(TIRADO.comun, -6),
  deCaida(TIRADO.comun, -6),
  // 6 · Se sienta.
  [
    [-4, -7, ['....IIT....', '..IITTTt...', '.IIT..TIt..', 'IIT....tIT.', 'KQO...QOOO.', 'KKK...KKKKK']],
    [-9, -15, ['.UVVvv..', '.UVVvv..', '.UVVvv..', '.UVVvvv.', '.VVVvwv.', '.VVVvwc.', '.VVVvwcC', '.WWyWG.C']],
    [-16, -24, CABEZA],
    [-6, -8, ['LCc..', 'LCc..', '.Pp..', '.pq..']],
  ],
  // 7 · Se levanta agachado.
  [
    dePie(VISTAS.lado.piernas.agachado),
    [-10, -16, TORSO_PIE],
    [-8, -25, CABEZA],
    [-1, -14, ['LC...', '.LC..', '..LC.', '..Pp.', '..pq.']],
  ],
];
/** Con la mochila puesta: se la ve en la espalda de pie o sentado; yéndose de espaldas, abajo del torso; tirado (2 a 5), queda debajo del cuerpo y no se ve. */
const BULTO_CAYENDO = [-10, -9, ['..MJJJM.', '.MMMMMMm', 'MMMMMMm.', 'mmmmmm..']];
const ESPALDA_CAIDO = { 0: [-3, 0], 6: [-5, 4], 7: [0, 3] };
function poseCaido(k, mochila) {
  if (!mochila) return CAIDO[k];
  if (k === 1) return [BULTO_CAYENDO, ...CAIDO[k]];
  if (k >= 2 && k <= 5) return CAIDO[k];
  const [dx, dy] = ESPALDA_CAIDO[k], piezas = [...CAIDO[k]];
  piezas.splice(2, 0, ...mochilaDePie(Math.min(4, mochila), dx, dy));
  return piezas;
}

// ------------------------------------------------------------------ el lienzo
const TABLA = { ...COLORES, a: COLORES.k };
const guardadas = new Map();
function pintar(idx, x0, y0, filas) {
  filas.forEach((fila, j) => {
    for (let i = 0; i < fila.length; i++) {
      const c = TABLA[fila[i]], x = x0 + i + OX, y = y0 + j + OY;
      if (fila[i] !== '.' && c != null && x >= 0 && y >= 0 && x < ANCHO && y < ALTO) idx[y * ANCHO + x] = c;
    }
  });
}

/**
 * Un cuadro: `pose` ('tierra', 'arrastre', 'perderPie', 'cayendo', 'colgadoAca', 'colgadoAlla', 'caido'), `k` de 0 a 7,
 * `mochila` de 0 a 4; cuerpo a tierra y apuntando, `arma` ('colt', 'smith', 'winchester', 'escopeta') y `r`, la dirección
 * del arma de a 22,5° (de -4 a 2). Devuelve el lienzo, la boca del caño y el hombro, en sus puntos.
 */
export function lienzoPoseTecho({ pose, k = 0, mochila = 0, arma = null, r: dirArma = 0 }, luz = 0, destello = false) {
  const clave = [pose, k, mochila, arma, dirArma, luz, destello].join('|');
  let g = guardadas.get(clave);
  if (g) return g;
  if (guardadas.size > 300) guardadas.clear();
  const piezas = pose === 'tierra' ? poseTierra(0, false, mochila, !!arma)
    : pose === 'arrastre' ? poseTierra(k, true, mochila)
      : pose === 'perderPie' ? posePerderPie(k, mochila)
        : pose === 'cayendo' ? poseCayendo(k, mochila)
          : pose === 'colgadoAca' ? poseColgadoAca(k, mochila)
            : pose === 'colgadoAlla' ? poseColgadoAlla(k)
              : poseCaido(k, mochila);
  const idx = new Int16Array(ANCHO * ALTO).fill(-1);
  for (const [x, y, filas] of piezas) pintar(idx, x, y, filas);
  let boca = null, hombro = null;
  if (pose === 'tierra' && arma) {
    const B = BRAZO_APUNTA[dirArma];
    pintar(idx, B.pieza[0], B.pieza[1], B.pieza[2]);
    const a = armaEn(arma, dirArma * Math.PI / 8);
    for (const [x, y, c] of a.puntos) {
      const px = B.mano[0] + x + OX, py = B.mano[1] + y + OY;
      if (px >= 0 && py >= 0 && px < ANCHO && py < ALTO) idx[py * ANCHO + px] = c;
    }
    boca = a.boca ? [B.mano[0] + a.boca[0] + OX, B.mano[1] + a.boca[1] + OY] : null;
    hombro = [3 + OX, -5 + OY];
  }
  const indices = destello ? idx.map((i) => (i > 0 ? sombrear(i, 4) : i)) : idx;
  const cv = document.createElement('canvas');
  cv.width = ANCHO; cv.height = ALTO;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: ANCHO, alto: ALTO, indices, campo: () => luz }), ANCHO, ALTO), 0, 0);
  g = { img: cv, boca, hombro };
  guardadas.set(clave, g);
  return g;
}
