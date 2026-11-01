/**
 * 🐂 EL NOVILLO DEL VAGÓN DE GANADO, EN EL ESTILO NUEVO *(Santi eligió "novillos de costado", con tres pelajes)*.
 *
 * Hecho con esqueleto, como dijimos para los animales: las piezas (el cuerpo, las cabezas, las colas y las poses de una
 * pata) son mapas a mano, cada una en los dos lados (E, mira a la derecha; O, a la izquierda), y el código sólo las
 * acomoda. Las cuatro patas usan las ocho poses corridas: van de a pares en diagonal, como en el trote de verdad.
 *
 * Mide 38 × 26 puntos, con el lugar de la cola: de largo unos 2,2 m y de alto 1,5 m al lado de la gente.
 * Letras: o contorno, B lomo con luz, b cuerpo, s sombra, W y w las manchas del overo, x la marca quemada, H cabeza,
 * e oreja, k ojo, n hocico, c cuerno, i su punta, L pata, h pezuña.
 */

export const ANCHO_NOVILLO = 38;
export const ALTO_NOVILLO = 26;

const CUERPO = {
  E: [
    '..................................',
    '..................................',
    '...................oooooo.........',
    '....oooooooooooooooBBBBBBoo.......',
    '...oBBBBBBBBBBBBBBBBBBBBBBBoo.....',
    '..oBBBWWWBBBBBBBBBBBBBBBBBBBBo....',
    '..oBBwwwwwbbbbbbbbbWWWWbbbBBBBo...',
    '.oBbbbwwwwbbbbbbbbwwwwwwbbbbbbbo..',
    '.obbbbbwwbbbbbbbbbwwwwwbbbbbbbbo..',
    '.obbxxbbbbbbbbbbbbbwwwbbbbbbbbso..',
    '.obbxxbbbbbbbbbbbbbbbbbbbbbbbbso..',
    '.obbbbbbbbbbwwbbbbbbbbbbbbbbbsso..',
    '.osbbbbbbbbwwwwbbbbbbbbbbbbbbsso..',
    '..osbbbbbbbbwwbbbbbbbbbbbbbbbsso..',
    '..osssbbbbbbbbbbbbbbbbbbbbbsssso..',
    '...oosssssssbbbbbbbbbbsssssssso...',
    '.....oooossssssssssssssssssoo.....',
    '.........oooooooooooooooooo.......',
  ],
  O: [
    '..................................',
    '..................................',
    '.........oooooo...................',
    '.......ooBBBBBBooooooooooooooo....',
    '.....ooBBBBBBBBBBBBBBBBBBBBBBBo...',
    '....oBBBBBBBBBBBBBBBBBBBBWWWBBBo..',
    '...oBBBBbbbWWWWbbbbbbbbbwwwwwBBo..',
    '..obbbbbbbwwwwwwbbbbbbbbbwwwwbbBo.',
    '..obbbbbbbbwwwwwbbbbbbbbbbwwbbbbo.',
    '..osbbbbbbbbwwwbbbbbbbbbbbbbxxbbo.',
    '..osbbbbbbbbbbbbbbbbbbbbbbbbxxbbo.',
    '..ossbbbbbbbbbbbbbbbbwwbbbbbbbbbo.',
    '..ossbbbbbbbbbbbbbbwwwwbbbbbbbbso.',
    '..ossbbbbbbbbbbbbbbbwwbbbbbbbbso..',
    '..ossssbbbbbbbbbbbbbbbbbbbbsssso..',
    '...ossssssssbbbbbbbbbbsssssssoo...',
    '.....oossssssssssssssssssoooo.....',
    '.......oooooooooooooooooo.........',
  ],
};

/** Las cabezas, de 11 de ancho y 11 de alto: atenta, gacha y mugiendo (alta y con la boca abierta). La cara es larga. */
const CABEZAS = {
  E: [
    ['.....cc....', '....cio....', '.oooooooo..', 'oeeoHHHHHo.', '.oeHHkHHHHo', '..oHHHHHHHo', '..oHHHHHHso', '...oHHHHnno', '...oHHHnnno', '....oosnno.', '......ooo..'],
    ['...........', '....cc.....', '...cio.....', '.ooooooo...', 'oeeoHHHHo..', '.oeHHkHHHo.', '..oHHHHHHHo', '...oHHHHHso', '....oHHnnno', '.....oonnno', '.......ooo.'],
    ['..cc.......', '.cioooooo..', '.oeHHkHHHoo', 'oeeHHHHHHno', '.ooHHHHHoo.', '..oHHHHo.nn', '..oHHHso.oo', '...oHHo....', '...ooo.....', '...........', '...........'],
  ],
  O: [
    ['....cc.....', '....oic....', '..oooooooo.', '.oHHHHHoeeo', 'oHHHHkHHeo.', 'oHHHHHHHo..', 'osHHHHHHo..', 'onnHHHHo...', 'onnnHHHo...', '.onnsoo....', '..ooo......'],
    ['...........', '.....cc....', '.....oic...', '...ooooooo.', '..oHHHHoeeo', '.oHHHkHHeo.', 'oHHHHHHHo..', 'osHHHHHo...', 'onnnHHo....', 'onnnoo.....', '.ooo.......'],
    ['.......cc..', '..oooooocio', 'ooHHHkHHeo.', 'onHHHHHHeeo', '.ooHHHHHoo.', 'nn.oHHHHo..', 'oo.osHHHo..', '....oHHo...', '.....ooo...', '...........', '...........'],
  ],
};

/** La cola, de 5 de ancho y 13 de alto, en cuatro posiciones: va y viene espantando moscas. */
const COLAS = {
  E: [
    ['...oo', '..oo.', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '.oso.', '.oso.', '.oso.', '..o..', '.....'],
    ['...oo', '..oo.', '..o..', '..o..', '..o..', '.oo..', '.o...', '.o...', 'oso..', 'oso..', 'oso..', '.o...', '.....'],
    ['...oo', '...o.', '..oo.', '..o..', '.oo..', '.o...', 'oo...', 'o....', 'so...', 'so...', 'o....', '.....', '.....'],
    ['...oo', '..oo.', '..o..', '..oo.', '...o.', '...o.', '...oo', '....o', '...os', '...os', '...os', '....o', '.....'],
  ],
  O: [
    ['oo...', '.oo..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '.oso.', '.oso.', '.oso.', '..o..', '.....'],
    ['oo...', '.oo..', '..o..', '..o..', '..o..', '..oo.', '...o.', '...o.', '..oso', '..oso', '..oso', '...o.', '.....'],
    ['oo...', '.o...', '.oo..', '..o..', '..oo.', '...o.', '...oo', '....o', '...os', '...os', '....o', '.....', '.....'],
    ['oo...', '.oo..', '..o..', '.oo..', '.o...', '.o...', 'oo...', 'o....', 'so...', 'so...', 'so...', 'o....', '.....'],
  ],
};

/**
 * LAS OCHO POSES DE UNA PATA TROTANDO, de 9 de ancho y 10 de alto (el muslo, grueso, arriba; la caña, finita, abajo):
 * apoya adelante, va quedando atrás con la pata estirada, se levanta doblando la rodilla, y vuelve adelante.
 */
const POSES = {
  E: [
    ['..oLLLo..', '..oLLLo..', '...oLLo..', '....oLo..', '....oLo..', '.....oLo.', '.....oLo.', '.....oLo.', '.....ohho', '.....oooo'],
    ['..oLLLo..', '..oLLLo..', '...oLLo..', '...oLLo..', '....oLo..', '....oLo..', '....oLo..', '....oLo..', '....ohho.', '....oooo.'],
    ['..oLLLo..', '..oLLLo..', '..oLLo...', '...oLo...', '...oLo...', '...oLo...', '...oLo...', '...oLo...', '...ohho..', '...oooo..'],
    ['..oLLLo..', '..oLLLo..', '..oLLo...', '..oLo....', '..oLo....', '..oLo....', '..oLo....', '..oLo....', '..ohho...', '..oooo...'],
    ['..oLLLo..', '..oLLo...', '..oLo....', '..oLo....', '.oLo.....', '.oLo.....', '.oLo.....', '.oLo.....', '.ohho....', '.oooo....'],
    ['..oLLLo..', '..oLLLo..', '...oLLo..', '...oLLo..', '..oLLo...', '.oLLo....', '.ohho....', '.oooo....', '.........', '.........'],
    ['..oLLLo..', '...oLLLo.', '....oLLo.', '....oLLo.', '...oLLo..', '..oLLo...', '..ohho...', '..oooo...', '.........', '.........'],
    ['..oLLLo..', '...oLLLo.', '.....oLo.', '.....oLo.', '.....oLo.', '......oLo', '......ohh', '......ooo', '.........', '.........'],
  ],
  O: [
    ['..oLLLo..', '..oLLLo..', '..oLLo...', '..oLo....', '..oLo....', '.oLo.....', '.oLo.....', '.oLo.....', 'ohho.....', 'oooo.....'],
    ['..oLLLo..', '..oLLLo..', '..oLLo...', '..oLLo...', '..oLo....', '..oLo....', '..oLo....', '..oLo....', '.ohho....', '.oooo....'],
    ['..oLLLo..', '..oLLLo..', '...oLLo..', '...oLo...', '...oLo...', '...oLo...', '...oLo...', '...oLo...', '..ohho...', '..oooo...'],
    ['..oLLLo..', '..oLLLo..', '...oLLo..', '....oLo..', '....oLo..', '....oLo..', '....oLo..', '....oLo..', '...ohho..', '...oooo..'],
    ['..oLLLo..', '...oLLo..', '....oLo..', '....oLo..', '.....oLo.', '.....oLo.', '.....oLo.', '.....oLo.', '....ohho.', '....oooo.'],
    ['..oLLLo..', '..oLLLo..', '..oLLo...', '..oLLo...', '...oLLo..', '....oLLo.', '....ohho.', '....oooo.', '.........', '.........'],
    ['..oLLLo..', '.oLLLo...', '.oLLo....', '.oLLo....', '..oLLo...', '...oLLo..', '...ohho..', '...oooo..', '.........', '.........'],
    ['..oLLLo..', '.oLLLo...', '.oLo.....', '.oLo.....', '.oLo.....', 'oLo......', 'hho......', 'ooo......', '.........', '.........'],
  ],
};
/** La pata parada, cuando no camina. */
const PARADA = ['..oLLLo..', '..oLLLo..', '...oLLo..', '...oLo...', '...oLo...', '...oLo...', '...oLo...', '...oLo...', '...ohho..', '...oooo..'];

/** Los tres pelajes *(Santi: el colorado, el negro y el overo)*: la misma letra, otros colores. */
const PELAJES = [
  // (🔁 Marrón rojizo, como el pelaje de verdad *(Santi: "nunca vi una vaca roja")*: antes iba en el rojo de la sangre.)
  { B: 12, b: 11, s: 47, W: 12, w: 11, L: 11, F: 47, H: 12 },   // colorado
  { B: 2, b: 31, s: 1, W: 2, w: 31, L: 31, F: 1, H: 2 },      // negro
  { B: 5, b: 4, s: 3, W: 17, w: 16, L: 4, F: 3, H: 5 },        // overo: marrón con manchas blancas
];
export const CUANTOS_PELAJES = PELAJES.length;
const COLORES = { o: 0, h: 1, k: 0, n: 12, c: 16, i: 14 };

/** Dónde va cada pata (la columna del mapa de la pose) y su fase: atrás lejos y adelante cerca van juntas. */
const PATAS = { E: [[2, 0, true], [6, 4, false], [18, 4, true], [22, 0, false]], O: [[23, 0, true], [19, 4, false], [7, 4, true], [3, 0, false]] };
const LUGARES = { E: { cabeza: 23, cola: -2 }, O: { cabeza: 0, cola: 31 } };
/** Lo que hace parado, en ocho cuadros: mueve la cola y baja un rato la cabeza. */
const QUIETO = [[0, 0], [0, 1], [0, 2], [0, 1], [0, 0], [0, 3], [1, 0], [1, 0]];
const SALTITO = [0, -1, -1, 0, 0, -1, -1, 0];

/**
 * Pinta un cuadro. `R(x, y, ancho, alto, color)`; (ox, oy) es la esquina del dibujo. `modo`: 'quieto' (cola y cabeza),
 * 'trote' (las ocho poses), o 'susto' (parado, con la cabeza alta, mugiendo, y la cola tirante). `marca`: la marca
 * quemada en el anca.
 */
export function pintarNovillo(R, lado, pelaje, cuadro, modo = 'quieto', ox = 0, oy = 0, marca = false) {
  const P = PELAJES[pelaje % PELAJES.length], k = ((cuadro % 8) + 8) % 8;
  ox += 2;                                                // (el lugar de la cola, a la izquierda)
  const color = (ch, lejos = false) => {
    if (ch === 'x') return marca ? 1 : P.b;
    if (ch === 'e') return P.s;
    if (ch === 'L') return lejos ? P.F : P.L;
    return P[ch] ?? COLORES[ch];
  };
  const mapa = (filas, x, y, lejos = false) => filas.forEach((fila, j) => {
    for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') R(ox + x + q, oy + y + j, 1, 1, color(fila[q], lejos));
  });
  const trote = modo === 'trote', dy = trote ? SALTITO[k] : 0;
  const [cabeza, cola] = modo === 'susto' ? [2, k & 1 ? 2 : 3] : trote ? [0, k % 4] : QUIETO[k];
  // Primero las patas de allá, después las de acá, y encima el cuerpo.
  const patas = PATAS[lado].filter((p) => p[2]).concat(PATAS[lado].filter((p) => !p[2]));
  for (const [col, fase, lejos] of patas) mapa(trote ? POSES[lado][(k + fase) % 8] : PARADA, col, 16, lejos);
  mapa(COLAS[lado][cola], LUGARES[lado].cola, 4 + dy);
  mapa(CUERPO[lado], 0, dy);
  mapa(CABEZAS[lado][cabeza], LUGARES[lado].cabeza, dy + 1);
}
