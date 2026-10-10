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
/**
 * 🔁 VUELTA 7 *(Santi, de la maqueta: "me encantan los detalles, quedan
 * fantásticos")*: la luz viene siempre de arriba a la izquierda y cada
 * material tiene su luz, su base y su sombra.
 */
const C = {
  h: 6, H: 5, k: 4, K: 3, x: 1, b: 32, l: 25,       // el sombrero: luz, base, sombra, honda; la cinta y su adorno de plata
  P: 12, p: 11, q: 47, B: 47, n: 13,                 // la piel (bajo el ala, en sombra), la barba
  S: 10, R: 9, r: 8, z: 39,                          // el pañuelo
  U: 34, V: 33, v: 32, w: 1, y: 5,                   // el chaleco de cuero y sus botones
  L: 16, C: 15, c: 14, s: 2,                         // la camisa (L el puño, al sol)
  W: 3, G: 28,                                       // el cinto y la hebilla (las balas son `y`)
  I: 20, T: 19, t: 41,                               // el pantalón de lona: luz, base, sombra
  Q: 6, O: 5, o: 4,                                  // las botas (Q la luz); la suela es `K`
  F: 4, f: 3,                                        // la funda
  M: 3, m: 4,                                        // la mochila
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
      '.........hkH',
      '........hhkHk',
      '...hh..hbbbbbk..kk',
      '....hhHHHHHHHHHkk',
      '.....xkkkkkkkkkx',
      '........qpPPn',
      '........qqBBp',
      '........rRRRS',
    ]),
    torso: mapa(8, [
      '.......UVVvR',
      '.......UVVvr',
      '.......UVVvy',
      '.......UVVvv',
      '.......UVVvy',
      '.......UVVvv',
      '.......VVVvw',
      '.......VVVvw',
      '.......WWyWG',
    ]),
    hombro: [10, 9],
    mochila: [[4, 9, 3, 7]],
    piernas: {
      quieto: mapa(17, [
        '.......IFFTT',
        '.......tFfTt',
        '.......tIIT',
        '........IIT',
        '........IIT',
        '........IIT',
        '........IIT',
        '.......IIIT',
        '.......QOOOO',
        '.......KKKKK',
      ]),
      agachado: mapa(20, [
        '.......IFFTTT',
        '.......tIITTTT',
        '......tt...ITT',
        '......tt....IT',
        '.....tt.....IT',
        '...OOOO....QOOO',
        '...KKKK....KKKK',
      ]),
    },
  },
  frente: {
    cabeza: mapa(0, [
      '.........hkH',
      '........hhkHk',
      '...hh..hbblbbk..kk',
      '....hhHHHHHHHHHkk',
      '.....xkkkkkkkkkx',
      '........ppPPp',
      '........qBBBq',
      '.......zRRSRRr',
    ]),
    torso: mapa(8, [
      '.......CURSrvc',
      '........UURVv',
      '........UVyVv',
      '........UVVvv',
      '........UVyvv',
      '........VVVvv',
      '........VVyvw',
      '........VVVvw',
      '........WyGyW',
    ]),
    hombro: [13, 9],
    mochila: [[8, 8, 1, 8], [12, 8, 1, 8]],
    piernas: {
      quieto: mapa(17, [
        '.......IITTTttF',
        '.......IIT.TttF',
        '.......IIT.TttF',
        '........IT..Ttf',
        '........IT..Tt',
        '........IT..Tt',
        '........IT..Tt',
        '.......IIT..TTt',
        '.......QOO..OOo',
        '.......KKK..KKKK',
      ]),
      agachado: mapa(20, [
        '.......IITTTtt',
        '......IIT...Ttt',
        '......IT.....Tt',
        '......IT.....Tt',
        '.......IT...Tt',
        '......QOO...OOo',
        '......KKK...KKK',
      ]),
    },
  },
  espalda: {
    cabeza: mapa(0, [
      '.........hkH',
      '........hhkHk',
      '...hh..hbbbbbk..kk',
      '....hhHHHHHHHHHkk',
      '.....xkkkkkkkkkx',
      '........qBBBq',
      '........ppppp',
      '.......rRRSRRr',
    ]),
    torso: mapa(8, [
      '.......CVVRVVc',
      '........UVrVv',
      '........UVVVv',
      '........UVVvv',
      '........UVVvv',
      '........VVVvv',
      '........VVVvw',
      '........VVVvw',
      '........WWWWW',
    ]),
    hombro: [13, 9],
    mochila: [[8, 9, 5, 6]],
    piernas: {
      quieto: mapa(17, [
        '.......IITTTttF',
        '.......IIT.TttF',
        '.......IIT.TttF',
        '........IT..Ttf',
        '........IT..Tt',
        '........IT..Tt',
        '........IT..Tt',
        '.......IIT..TTt',
        '.......OOO..OOO',
        '.......KKK..KKK',
      ]),
      agachado: mapa(20, [
        '.......IITTTtt',
        '......IIT...Ttt',
        '......IT.....Tt',
        '......IT.....Tt',
        '.......IT...Tt',
        '......OOO...OOO',
        '......KKK...KKK',
      ]),
    },
  },
  diagF: {
    cabeza: mapa(0, [
      '..........hkH',
      '.........hhkHk',
      '....hh..hbblbk..kk',
      '.....hhHHHHHHHHHkk',
      '......xkkkkkkkkkx',
      '........qppPPn',
      '.........qBBBp',
      '........zRRSRRr',
    ]),
    torso: mapa(8, [
      '.......CUVRSrc',
      '........UUVRv',
      '........UVVyv',
      '........UVVvv',
      '........UVVyv',
      '........UVVvw',
      '........VVVyw',
      '........VVVvw',
      '........WyWGy',
    ]),
    hombro: [13, 9],
    mochila: [[8, 8, 1, 8], [12, 8, 1, 8]],
    piernas: {
      quieto: mapa(17, [
        '.......IITTtttF',
        '.......IIT.tttF',
        '.......IIT..ttF',
        '........IT..ttf',
        '........IT..tt',
        '........IT..tt',
        '........IT..tt',
        '.......IIT..OOo',
        '.......QOO..KKKK',
        '.......KKKK',
      ]),
      agachado: mapa(20, [
        '.......IITTttt',
        '......IITT.ttt',
        '......IIT...tt',
        '......IT....tt',
        '......IT...OOo',
        '.....QOOO..KKK',
        '.....KKKK',
      ]),
    },
  },
  diagE: {
    cabeza: mapa(0, [
      '..........hkH',
      '.........hhkHk',
      '....hh..hbbbbk..kk',
      '.....hhHHHHHHHHHkk',
      '......xkkkkkkkkkx',
      '.........qBBBP',
      '.........ppppP',
      '........rRRSRRr',
    ]),
    torso: mapa(8, [
      '.......CVVVRvc',
      '........UVVrv',
      '........UVVVv',
      '........UVVvv',
      '........UVVvv',
      '........UVVvv',
      '........VVVvw',
      '........VVVvw',
      '........WWWWW',
    ]),
    hombro: [13, 9],
    mochila: [[8, 9, 4, 6]],
    piernas: {
      quieto: mapa(17, [
        '.......tttTTTF',
        '.......tt.IITF',
        '.......tt.IIT',
        '.......tt..IT',
        '.......tt..IT',
        '.......tt..IT',
        '.......tt..IT',
        '.......OOo.IIT',
        '.......KKK.QOOO',
        '...........KKKK',
      ]),
      agachado: mapa(20, [
        '.......tttTTII',
        '......ttt.TTII',
        '......tt...TII',
        '......tt....IT',
        '......OOo...IT',
        '......KKK..QOOO',
        '...........KKKK',
      ]),
    },
  },
};
// Cada vista tiene sus propios quieto y agachado (vuelta 7).

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
  lado: ['.......IFFTT', '........Ff'],
  frente: ['.......IITTTttF', '..............F'],
  espalda: ['.......IITTTttF', '..............F'],
  diagF: ['.......IITTtttF', '..............F'],
  diagE: ['.......tttTTTF', '.............F'],
};
const CADERAS_AG = { lado: '.......IFFTTT', frente: '.......IITTTtt', espalda: '.......IITTTtt', diagF: '.......IITTttt', diagE: '.......tttTTII' };
/** Los dos colores de cada pierna (el lado que da a la luz y el otro), por vista. */
const TELA = {
  lado: { aca: 'IT', alla: 'tt' },
  frente: { aca: 'IT', alla: 'Tt' },
  espalda: { aca: 'Tt', alla: 'IT' },
  diagF: { aca: 'IT', alla: 'tt' },
  diagE: { aca: 'IT', alla: 'tt' },
};

/** La bota, con el tobillo en (ax, ay): cada vista y cada pierna tiene la suya. */
function bota(vista, aca, ax, ay, pon) {
  // Arriba el cuero, con la luz en la punta de la izquierda (de espaldas no:
  // se ve el talón); abajo la suela, oscura.
  const cuero = (y, x0, n) => { for (let q = 0; q < n; q++) pon(x0 + q, y, q === 0 && vista !== 'espalda' ? 'Q' : 'O'); };
  const suela = (y, x0, n) => { for (let q = 0; q < n; q++) pon(x0 + q, y, 'K'); };
  if (vista === 'lado') { cuero(ay + 1, ax - 1, 4); suela(ay + 2, ax - 1, 4); return; }
  if (vista === 'frente' || vista === 'espalda') {
    const izq = vista === 'frente' ? aca : !aca;
    const x0 = izq ? ax - 1 : ax;
    cuero(ay + 1, x0, 3); suela(ay + 2, x0, 3);
    return;
  }
  const izq = vista === 'diagF' ? aca : !aca;
  if (izq) { cuero(ay + 1, ax - 1, 3); suela(ay + 2, ax - 1, 4); }
  else { cuero(ay + 1, ax, 3); suela(ay + 2, ax, vista === 'diagE' ? 4 : 3); }
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
    const [luz, sombra] = TELA[vista][aca ? 'aca' : 'alla'];
    const trazo = (x, y) => { pon(x, y, luz); pon(x + 1, y, sombra); };
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
 * 🔁 LAS ARMAS, DIBUJADAS DE COSTADO Y PUESTAS EN CADA DIRECCIÓN *(Santi, con
 * fotos de referencia: el Smith & Wesson es un Schofield, el Colt de caño
 * largo; la escopeta de dos caños con culata; el Winchester 1873 "muy ancho
 * para lo largo", "la culata del Winchester" le gustó; "la palanca… un poco
 * más larga y fina"; "la escopeta quedó del mismo largo que el rifle? eso no
 * debería suceder")*.
 *
 * Cada arma es UN dibujo de costado, mirando a la derecha, con la mano del
 * gatillo en (0, 0): cada punto es [u, v, color], `u` a lo largo del arma y
 * `v` hacia abajo. Todas vistas igual: de costado y un poco desde arriba (la
 * fila de arriba de cada parte es su cara de arriba, con luz).
 *
 * Largos (de la culata a la boca): Winchester 17, escopeta 14 (un 20% más
 * corta, como una de dos caños de la época al lado del rifle), Colt 14 y
 * Schofield 11 (con la culata del revólver).
 */
const CULATA_LARGA = [
  [-2, 0, 6], [-1, 0, 6],
  [-4, 1, 6], [-3, 1, 6], [-2, 1, 5], [-1, 1, 5],
  [-4, 2, 4], [-3, 2, 5], [-2, 2, 4],
  [-4, 3, 4],
  [-5, 1, 31], [-5, 2, 31], [-5, 3, 31],
];
const tira = (v, u0, u1, c) => Array.from({ length: u1 - u0 + 1 }, (_, k) => [u0 + k, v, c]);
const ARMAS = {
  // Smith & Wesson Schofield: la traba arriba atrás, el tambor (más alto que el caño), el caño de 5
  // con la mira, el extractor debajo, el guardamonte y la culata de madera.
  smith: [
    [0, -2, 24], [0, -1, 31],
    [1, -1, 25], [2, -1, 24], [1, 0, 24], [2, 0, 23], [1, 1, 23], [2, 1, 31],
    ...tira(0, 3, 7, 25), ...tira(1, 3, 7, 23), [7, -1, 24],
    [3, 2, 31], [4, 2, 31],
    [1, 2, 31], [2, 2, 31],
    [0, 2, 6], [-1, 2, 5], [-1, 3, 5], [-2, 3, 4], [-2, 4, 4],
  ],
  // Colt de caño largo: la espuela del martillo, caño de 8 con la varilla debajo, culata rojiza.
  colt: [
    [-1, -2, 31], [0, -1, 31],
    [1, -1, 25], [2, -1, 24], [1, 0, 24], [2, 0, 23], [1, 1, 23], [2, 1, 31],
    ...tira(0, 3, 10, 25), ...tira(1, 3, 10, 23), [10, -1, 24],
    ...tira(2, 3, 6, 31),
    [1, 2, 31], [2, 2, 31],
    [0, 2, 11], [-1, 2, 47], [-1, 3, 47], [-2, 3, 47], [-2, 4, 47],
  ],
  // Winchester 1873: la culata larga, el cajón de bronce, la palanca larga y fina (un anillo que va
  // por debajo de la muñeca de la culata), el caño pavonado con su mira, el guardamanos y el tubo.
  winchester: [
    ...CULATA_LARGA,
    [1, 0, 45], [2, 0, 45], [1, 1, 28], [2, 1, 44],
    [1, 2, 31], [0, 3, 31], [-1, 3, 31], [-2, 3, 31],
    ...tira(0, 3, 11, 24), [11, -1, 24],
    ...tira(1, 3, 7, 5), ...tira(1, 8, 11, 31),
  ],
  // Escopeta de dos caños con culata: los dos martillos uno al lado del otro, los caños (el de allá
  // arriba con luz, la canal, el de acá), la mira de bronce en la canal, las dos bocas, el guardamanos.
  escopeta: [
    ...CULATA_LARGA,
    [0, -2, 31], [1, -1, 31], [0, -1, 23], [1, 0, 31],
    [2, 0, 24], [1, 1, 23], [2, 1, 23], [1, 2, 31], [2, 2, 31],
    [1, 3, 31],
    ...tira(0, 3, 7, 25), ...tira(1, 3, 7, 23), ...tira(2, 3, 5, 5), ...tira(2, 6, 7, 24),
    [7, 1, 28],
    [8, 0, 31], [8, 1, 23], [8, 2, 31],
  ],
};
// Dónde va la mano de apoyo (la izquierda) en las armas largas, y dónde está la boca.
const APOYO = { winchester: 4, escopeta: 4 };
const BOCA = { smith: 7, colt: 10, winchester: 11, escopeta: 8 };

/**
 * EL ARMA EN UNA DIRECCIÓN (de a 22,5°), punto por punto. El arma se recorre a
 * lo largo de su eje dominante de a un punto entero (como una línea de pixel
 * art: en diagonal, un escalón por punto) y en cada paso se pone la columna del
 * dibujo de costado que cae ahí; en diagonal se saltean columnas para que el
 * arma no quede más larga. Las columnas van hacia abajo del arma: en las
 * direcciones tendidas, hacia abajo de la pantalla; en las empinadas, de
 * costado. Hacia la izquierda es la misma, en espejo. Se guarda.
 */
const armasGuardadas = new Map();
export function armaEn(id, angulo) {
  const r = Math.round(angulo / (Math.PI / 8));
  const clave = id + r;
  let g = armasGuardadas.get(clave);
  if (g) return g;
  let a = r * Math.PI / 8;
  let c = Math.cos(a), s = Math.sin(a);
  const espejo = c < -1e-6;
  if (espejo) { a = Math.PI - a; c = Math.cos(a); s = Math.sin(a); }
  const tendida = Math.abs(c) >= Math.abs(s) - 1e-6;
  const m = Math.max(Math.abs(c), Math.abs(s));
  const columnas = new Map();
  for (const [u, v, col] of ARMAS[id]) {
    if (!columnas.has(u)) columnas.set(u, []);
    columnas.get(u).push([v, col]);
  }
  /** Dónde cae el punto `u` del eje, y hacia dónde va "abajo del arma". */
  const sobreEje = (u) => {
    const k = Math.round(u * m);
    return tendida ? [k, Math.round(k * s / c)] : [Math.round(k * c / Math.abs(s)), k * Math.sign(s)];
  };
  const abajo = tendida ? [0, 1] : [-Math.sign(s), 0];
  const puntos = [];
  const us = [...columnas.keys()];
  const kMin = Math.round(Math.min(...us) * m), kMax = Math.round(Math.max(...us) * m);
  for (let k = kMin; k <= kMax; k++) {
    const u = Math.round(k / m);
    const col = columnas.get(u);
    if (!col) continue;
    const [x, y] = sobreEje(u);
    for (const [v, color] of col) puntos.push([x + abajo[0] * v, y + abajo[1] * v, color]);
  }
  const voltear = ([x, y, col]) => [espejo ? -x : x, y, col];
  const en = (u) => { const [x, y] = sobreEje(u); return [espejo ? -x : x, y]; };
  g = { puntos: puntos.map(voltear), en, angulo: r * Math.PI / 8 };
  armasGuardadas.set(clave, g);
  return g;
}

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
 * 'colt', 'smith', 'winchester', 'escopeta'), `ang` el ángulo del arma en el dibujo
 * (ya espejado) y `mochila` (0-4). Devuelve los índices y la boca del caño.
 */
/**
 * EL CULATAZO, en 8 cuadros (`golpe` 0-7, en 0,20 s): el brazo del arma sube
 * al costado de la cabeza, por delante para que se vea (0-2, el cuerpo se echa atrás),
 * baja de golpe hacia adelante (3, el impacto: el cuerpo se tira adelante y
 * baja un punto, con un destello y la estela del brazo) y vuelve a apuntar
 * (4-7). El impacto cae a los 0,075 s, justo cuando el golpe cuenta
 * (`impacto` en data/melee.js). Ángulos en el dibujo: 0 es hacia adelante.
 */
const GOLPE = {
  brazo: [-1.0, -1.3, -1.5, 0.35, 0.6, 0.45, 0.25, 0.1],
  inclina: [0, -1, -1, 1, 1, 1, 0, 0],
  baja: [0, 0, 0, 1, 1, 0, 0, 0],
};

/**
 * 🆕 EL WINCHESTER Y LA ESCOPETA, CON LAS DOS MANOS *(Santi: "la escopeta no
 * puede ir en un solo brazo al igual que el Winchester… al moverse, el
 * personaje corra con el arma delante de su cuerpo llevándolo con las dos
 * manos. Si se queda quieto o se cubre con shift lo apunta hacia adelante…
 * Esto no debería condicionar el como se juega, sino simplemente animaciones
 * realistas")*.
 *
 * `empuna` va de 0 a 1 (lo calcula player.js): 0 es CRUZADA delante del
 * pecho (la mano del gatillo en la cadera, el caño arriba y al costado), 1 es
 * APUNTANDO (la culata al hombro, el caño hacia la mira). En el medio, el arma
 * pasa de una a otra (se dibuja en 4 pasos). La mano izquierda sostiene el
 * guardamanos: el brazo libre deja de hamacarse.
 */
const CRUZADA = { lado: { mano: [11, 15], ang: -1.3 }, otra: { mano: [12, 16], ang: -2.15 } };

export function cuadroJugador({ vista, piernas, arma, ang, mochila, fino, golpe, empuna }) {
  if (golpe != null) ang = GOLPE.brazo[golpe];
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
  const baja = (tipo ? PASOS[tipo].baja[k] : piernas === 'agachado' ? 3 : 0) + (golpe != null ? GOLPE.baja[golpe] : 0);
  const deCostado = vista === 'lado' || vista.startsWith('diag');
  const inclina = golpe != null ? (deCostado ? GOLPE.inclina[golpe] : 0) : vista === 'lado' && tipo === 'R' ? 1 : 0;
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
  // El arma larga, con las dos manos: dónde va cada mano, la culata y la boca.
  let larga = null;
  if (arma === 'winchester' || arma === 'escopeta') {
    const t = golpe != null ? 1 : Math.max(0, Math.min(1, empuna ?? 1));
    const P = vista === 'lado' ? CRUZADA.lado : CRUZADA.otra;
    const cadera = [P.mano[0] + inclina + lomo, P.mano[1] + baja];
    const hombro = [hx + dir[0] * 2, hy + dir[1] * 2];
    let da = ang - P.ang;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const A = armaEn(arma, P.ang + da * t);
    const d = [Math.cos(A.angulo), Math.sin(A.angulo)];
    const mano = [Math.round(cadera[0] + (hombro[0] - cadera[0]) * t), Math.round(cadera[1] + (hombro[1] - cadera[1]) * t)];
    const en = (u) => { const [x, y] = A.en(u); return [mano[0] + x, mano[1] + y]; };
    larga = { t, d, mano, A, apoyo: en(APOYO[arma]), en, boca: en(BOCA[arma]) };
  }
  // Apuntando para arriba (hacia el fondo), el brazo va detrás del cuerpo.
  // (En el culatazo nunca: el brazo levantado tiene que verse.) El arma larga
  // cruzada, de espaldas, va delante del pecho: o sea, detrás para nosotros.
  const detras = larga
    ? (larga.t > 0.5 ? dir[1] < -0.35 && golpe == null : vista === 'espalda' || vista === 'diagE')
    : arma && dir[1] < -0.35 && golpe == null;

  let boca = null;
  /** Una manga de dos de alto, de `a` a `b` (el último punto es el puño). */
  const manga = (a, b, lejos) => {
    const pts = [];
    linea(a, b, (x, y) => pts.push([x, y]));
    pts.forEach(([x, y], i) => {
      const puno = i === pts.length - 2 && !lejos;
      poner(x, y, lejos ? C.c : puno ? C.L : C.C);
      poner(x, y + 1, lejos ? C.c : puno ? C.C : C.c);
    });
  };
  const mano = ([x, y], lejos) => { poner(Math.round(x), Math.round(y), lejos ? C.p : C.P); poner(Math.round(x), Math.round(y) + 1, C.p); };
  /** El brazo izquierdo, del hombro al guardamanos. */
  const brazoIzqLarga = () => {
    const S = [VER_BRAZO[vista].hombro[0] + inclina + lomo, VER_BRAZO[vista].hombro[1] + baja];
    manga(S, larga.apoyo, vista === 'lado');
  };
  /** El arma larga y las dos manos. */
  const dibujarLarga = () => {
    if (vista !== 'lado') brazoIzqLarga();
    for (const [x, y, c] of larga.A.puntos) poner(larga.mano[0] + x, larga.mano[1] + y, c);
    manga([hx, hy], larga.mano, false);
    mano(larga.mano, false);
    mano(larga.apoyo, vista === 'lado');
    boca = larga.boca;
  };

  const brazo = () => {
    if (larga) { dibujarLarga(); return; }
    // Sin arma cuelga como el otro: dos puntos de ancho y la mano de 2×2.
    if (!arma) { colgado([hx, hy], 0, 0.1, false); return; }
    const largo = 6;
    const mano = [hx + dir[0] * largo, hy + dir[1] * largo];
    // La manga, de dos de alto; el último punto antes de la mano es el puño (al sol).
    const pts = [];
    linea([hx, hy], mano, (x, y) => pts.push([x, y]));
    pts.forEach(([x, y], i) => {
      const puno = i === pts.length - 2;
      poner(x, y, puno ? C.L : C.C);
      poner(x, y + 1, puno ? C.C : C.c);
    });
    poner(Math.round(mano[0]), Math.round(mano[1]), C.P);
    poner(Math.round(mano[0]), Math.round(mano[1]) + 1, C.p);
    // El revólver (Colt o Schofield), en la dirección del brazo.
    const A = armaEn(ARMAS[arma] ? arma : 'colt', Math.atan2(dir[1], dir[0]));
    const mx = Math.round(mano[0]), my = Math.round(mano[1]);
    for (const [x, y, c] of A.puntos) poner(mx + x, my + y, c);
    const [bx, by] = A.en(BOCA[ARMAS[arma] ? arma : 'colt']);
    boca = [mx + bx, my + by];
    poner(mx, my, C.P);
  };

  /**
   * UN BRAZO QUE CUELGA (el libre, o el del arma cuando no tenés nada): dos
   * puntos de ancho (el de afuera al sol), hombro → codo → mano de 2×2. `a`
   * es cuánto va hacia adelante y `b` cuánto se dobla el codo, en radianes.
   */
  const VB = VER_BRAZO[vista];
  function colgado(S, a, b, atras) {
    const ver = (fx, fy) => [S[0] + Math.round(fx * VB.kx), S[1] + Math.round(fy + fx * VB.ky)];
    const codo = [3 * Math.sin(a), 3 * Math.cos(a)];
    const mano = [codo[0] + 3 * Math.sin(a + b), codo[1] + 3 * Math.cos(a + b)];
    const [afuera, adentro] = atras ? [C.c, C.c] : [C.L, C.C];
    const trazo = (x, y) => { poner(x, y, afuera); poner(x + 1, y, adentro); };
    linea(S, ver(...codo), trazo);
    linea(ver(...codo), ver(...mano), trazo);
    const [mx, my] = ver(...mano);
    poner(mx, my, atras ? C.p : C.P); poner(mx + 1, my, C.p);
    poner(mx, my + 1, C.p); poner(mx + 1, my + 1, C.q);
  }
  /** El brazo libre: de costado va detrás del cuerpo (es el de allá); en las otras vistas, al lado. */
  const brazoLibre = () => {
    const B = tipo ? BRAZO_LIBRE[tipo] : null;
    const ida = B ? B.ida * Math.cos(k * Math.PI / 4) : 0;
    colgado([VB.hombro[0] + inclina + lomo, VB.hombro[1] + baja], ida * 0.9, B ? B.codo : 0.1, vista === 'lado');
  };

  if (vista === 'lado') { if (larga) brazoIzqLarga(); else brazoLibre(); }
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
  /**
   * 🔁 El arma larga cruzada va DEBAJO de la cabeza *(Santi: "hay unos pixeles
   * que se comen el sombrero y no queda bien la perspectiva")*: el caño sube
   * al costado de la cara, y el ala del sombrero, que está más arriba y más
   * cerca de la cámara, lo tapa.
   */
  const bajoLaCabeza = larga && larga.t < 0.5 && !detras;
  if (bajoLaCabeza) brazo();
  dibujarMapa(V.cabeza, baja + cabezaY, inclina + cabezaX);
  if (vista !== 'lado' && !larga) brazoLibre();
  if (mochila && (vista === 'frente' || vista === 'diagF')) {
    for (const [x, y, w, h] of V.mochila) for (let j = 0; j < h; j++) for (let q = 0; q < w; q++) poner(x + q, y + j + baja, C.M);
  }
  if (!detras && !bajoLaCabeza) brazo();
  // El impacto: la estela del brazo (de arriba atrás hacia adelante) y un destello en la punta.
  if (golpe === 3) {
    for (let a = -1.4; a < 0.2; a += 0.16) poner(Math.round(hx + Math.cos(a) * 8), Math.round(hy + Math.sin(a) * 8), 25);
    const px = Math.round(hx + Math.cos(ang) * 9), py = Math.round(hy + Math.sin(ang) * 9);
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) poner(px + dx, py + dy, dx || dy ? 29 : 30);
  }

  // El contorno de un punto, por afuera de todo (con el borde fino, lo traza
  // engine/estiloNuevo.js después de la grilla).
  const lleno = idx.slice();
  if (!fino)
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
  const clave = [o.vista, o.piernas, o.arma || '', Math.round(o.ang * 100), o.mochila || 0, luz, destello ? 1 : 0, o.fino ? 1 : 0, o.golpe ?? '', o.empuna ?? 1].join('|');
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
