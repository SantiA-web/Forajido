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
 * 🔁 LAS ARMAS, CADA DIRECCIÓN DIBUJADA A MANO *(Santi: "quiero saber si
 * copiaste y pegaste los dibujos de las armas para cada dirección o si en
 * verdad dibujaste a mano a cada una" — no: las armaba el código a partir del
 * dibujo de costado, y hacia arriba y abajo el arma "se acuesta de costado";
 * "a partir de ahora cada dirección de cada cosa se dibujará a mano")*.
 *
 * Cada arma tiene un mapa escrito a mano por dirección, de a 22,5° (de -4,
 * derecho para arriba, a 4, derecho para abajo; 0 es al frente). Hacia la
 * izquierda es el mismo mapa en espejo. Las armas largas tienen además su
 * pose CRUZADA delante del pecho. En cada mapa:
 *   A  la mano del gatillo (el agarre; el punto (0, 0))
 *   S  la mano de apoyo, en el guardamanos (armas largas)
 *   M  la boca del caño (de ahí sale el fogonazo)
 *   1 2 3 d n  el metal, de la luz a lo más oscuro (n: la boca por dentro)
 *   W w v      la madera clara, media y oscura
 *   r s        la madera rojiza de la culata del Colt
 *   b o q      el bronce del Winchester
 *   o          (en la escopeta) la mira de bronce
 *
 * Todas vistas igual: un poco desde arriba. Al frente y en diagonal, de costado
 * (la fila de arriba de cada parte es su cara de arriba). Hacia abajo, el arma
 * apunta a la cámara: se ve desde arriba y acortada (la culata contra el
 * pecho, los caños hacia nosotros, la mano a la altura del pecho). Hacia arriba se aleja: se ve desde arriba
 * y desde atrás (la cantonera hacia nosotros).
 *
 * Largos al frente: Winchester 17, escopeta 14 (un 20% más corta que el
 * rifle), Colt 14, Schofield 11.
 */
const COLOR_ARMA = { 1: 25, 2: 24, 3: 23, d: 31, n: 0, W: 6, w: 5, v: 4, r: 11, s: 47, b: 45, o: 28, q: 44, M: 24 };
const DIBUJOS_ARMAS = {
  // EL COLT de caño largo: martillo con espuela, tambor más alto que el caño, varilla debajo.
  colt: {
    '-4': ['.M.', '.13', '.13', '.13', '.13', '213', '32d', '.d.', '.A.', '...', '.r.', '.s.'],
    '-3': ['...M.', '...13', '..13.', '..13.', '.13..', '.13..', '213..', '.d...', '.A...', '.....', '.r...', '.s...'],
    '-2': ['..........M.', '.........13.', '........13..', '.......13...', '......13....', '.....13d....', '....13d.....', 'dd.12d......', '..A23.......', '...d........', '..r.........', '.ss.........'],
    '-1': ['............2', '...........1M', '.d.......1133', '..d12..1133..', '..A231133....', '...3d33dd....', '.srdddd......', 'ss...........', 's............'],
    0: ['.d...........', '..d12.......2', '..A231111111M', '...3d33333333', '.srdddddd....', 'ss...........', 's............'],
    1: ['.d...........', '..d12........', '..A2311......', '...3d3311....', '.srdddd3311.2', 'ss.....dd331M', 's..........33'],
    2: ['.d.........', '..d1.......', '..A21......', 'sr.321.....', 's..d31.....', '....d31....', '.....d31...', '......d31..', '........31.', '.........3M'],
    3: ['.d...', '.A...', 'r....', '213..', '.13..', '..13.', '..M3.'],
    4: ['.d.', '.A.', '...', '213', '.13', '.13', '.M3'],
  },
  // EL SMITH & WESSON SCHOFIELD: la traba arriba atrás, el caño más corto, culata de madera.
  smith: {
    '-4': ['.M.', '.13', '.13', '213', '.d2', '.A.', '...', '.W.', '.w.'],
    '-3': ['..M.', '..13', '.13.', '.13.', '213.', '.d2.', '.A..', '....', '.W..', '.w..'],
    '-2': ['........M.', '.......13.', '......13..', '.....13...', '.2..13d...', '.d.12d....', '..A23.....', '...d......', '..W.......', '.vw.......'],
    '-1': ['..........2', '..2......1M', '..d12..1133', '..A231133..', '...3d33....', '.wWdddd....', 'vw.........', 'v..........'],
    0: ['..2.......', '..d12....2', '..A231111M', '...3d33333', '.wWdddd...', 'vw........', 'v.........'],
    1: ['..2........', '..d12......', '..A2311....', '...3d3311.2', '.wWdddd331M', 'vw.......33', 'v..........'],
    2: ['...2......', '...d1.....', '...A21....', '.wW.321...', 'vw..d31...', '.....d31..', '.......31.', '........3M'],
    3: ['.2..', '.d..', '.A..', 'W...', '213.', '.13.', '.M3.'],
    4: ['.2.', '.d.', '.A.', '...', '213', '.13', '.M3'],
  },
  // EL WINCHESTER 1873: culata larga con cantonera, cajón de bronce, palanca en anillo larga y
  // fina, guardamanos de madera, caño pavonado con su mira y el tubo del cargador.
  winchester: {
    '-4': ['M.', '2d', '2d', 'Sv', 'Ww', 'bo', 'Aq', '.w', 'Ww', 'wv', 'dd'],
    '-3': ['...M.', '...2.', '..2d.', '..Sv.', '.Ww..', '.bo..', '.Aq..', 'W....', 'Ww...', 'wv...', 'dd...'],
    '-2': ['.............M', '............2d', '...........2d.', '..........2d..', '.........2w...', '........Sw....', '.......2w.....', '......bq......', '.....Aod......', '....Wwd.......', '...Wwd........', '..Ww..........', '.Wvv..........', 'ddv...........', '.d............'],
    '-1': ['................2', '................M', '..............22d', '............22dd.', '..........22wd...', '........2Sww.....', '......bbww.......', '.....Aoq.........', '...WW.d..........', '...wwd...........', '.WWvd............', 'dvw..............', 'dv...............', 'd................'],
    0: ['................2', '...WWAbb2S222222M', 'dWWww.oqwwwwwdddd', 'dvwv..d..........', 'dv.ddd...........'],
    1: ['d................', 'dWWWW............', 'dvwwwA...........', '.v.v..bb.........', '...dd.oq2S.......', '.....dd.ww22.....', '..........ww22...', '............wd222', '..............ddM', '................d'],
    2: ['dd............', 'dwW...........', '.vwW..........', '.vvwW.........', '...vAb........', '...d.ob.......', '....ddw2......', '.......S2.....', '........w2....', '.........d2...', '..........d2..', '...........d2.', '............dM'],
    3: ['dd....', '.Ww...', '..Av..', '.d.b..', '..bo..', '...Sw.', '....2d', '.....M'],
    4: ['dd', 'Ww', 'Av', '.v', 'bo', 'Sv', '2d', 'M.'],
    // Cruzada delante del pecho: la mano del gatillo en la cadera, el caño arriba a la izquierda.
    cruzada: ['M......', '2d.....', '.2d....', '.2d....', '..2d...', '..Sw...', '...wv..', '...od..', '...bd..', '...A...', '....w..', '....Ww.', '.....v.', '.....dd'],
  },
  // LA ESCOPETA con culata, de un solo caño a la vista *(Santi: "mejor no haz la escopeta así,
  // prefiero que se vea un solo cañón que vista desde arriba")*: el caño grueso (dos de alto: la
  // cara de arriba con luz y el costado), el martillo, la mira de bronce, el guardamanos y la
  // culata, la misma del Winchester. Más corta que el rifle (14 contra 17).
  escopeta: {
    '-4': ['M.', '13', 'S3', 'w3', 'd2', 'A3', '.w', 'Ww', 'wv', 'dd'],
    '-3': ['...M.', '..13.', '..S3.', '.w3..', '.d2..', '.A3..', 'W....', 'Ww...', 'wv...', 'dd...'],
    '-2': ['...........oM3', '...........13.', '..........13..', '.........13...', '........1S....', '.......1w.....', '.....d23......', '.....A3d......', '....Ww........', '...Ww.........', '..Ww..........', '.Wvv..........', 'ddv...........', '.d............'],
    '-1': ['............o.', '............1M', '..........1133', '......d.1S33..', '......2233w...', '.....A33ww....', '...WW.d.......', '...ww.........', '.WWv..........', 'dvw...........', 'dv............', 'd.............'],
    0: ['.....d........', '......d.....o.', '...WWA221S111M', 'dWWww.33333333', 'dvwv..ddwww...', 'dv....d.......'],
    1: ['d.............', 'dWWWWd........', 'dvwwwAd.......', '.v.v..22......', '......331S....', '......d.3311o.', '........ww331M', '..........w.33'],
    2: ['dd..........', 'dwW.........', '.vwW........', '.vvwWd......', '...vA2......', '.....32.....', '.....dw1....', '.......S1...', '........31o.', '.........31.', '..........3M'],
    3: ['dd....', '.Ww...', '..Ad..', '...2..', '..23..', '...S3.', '....13', '.....M'],
    4: ['dd', 'Ww', 'Ad', '.2', '23', 'S3', '13', 'M.'],
    cruzada: ['M......', '13.....', '.13....', '.S3....', '..w3...', '..d2...', '...3d..', '...A...', '....w..', '....Ww.', '.....v.', '.....dd'],
  },
};

/** Lee un mapa: los puntos con su color, y dónde quedan la mano de apoyo y la boca (respecto de la A). */
function leerArma(filas, espejo) {
  let ax = 0, ay = 0;
  filas.forEach((f, y) => { const x = f.indexOf('A'); if (x >= 0) { ax = x; ay = y; } });
  const puntos = [];
  let apoyo = null, boca = null;
  filas.forEach((f, y) => {
    for (let x = 0; x < f.length; x++) {
      const ch = f[x];
      if (ch === '.' || ch === 'A') continue;
      const px = (x - ax) * (espejo ? -1 : 1), py = y - ay;
      if (ch === 'S') { apoyo = [px, py]; continue; }
      if (ch === 'M') boca = [px, py];
      puntos.push([px, py, COLOR_ARMA[ch]]);
    }
  });
  return { puntos, apoyo, boca };
}

/**
 * EL ARMA APUNTANDO EN UNA DIRECCIÓN: el mapa de la dirección más cercana (de
 * a 22,5°); hacia la izquierda, en espejo. Devuelve los puntos, la mano de
 * apoyo, la boca y el ángulo de verdad de ese dibujo. Se guarda.
 */
const armasGuardadas = new Map();
export function armaEn(id, angulo) {
  let r = Math.round(angulo / (Math.PI / 8));
  r = ((r % 16) + 16) % 16;
  if (r > 8) r -= 16;                       // de -7 a 8
  const espejo = r > 4 || r < -4;
  const rd = espejo ? (r > 0 ? 8 - r : -8 - r) : r;   // la dirección del lado derecho
  const clave = id + '|' + r;
  let g = armasGuardadas.get(clave);
  if (g) return g;
  g = { ...leerArma(DIBUJOS_ARMAS[id][rd], espejo), angulo: r * Math.PI / 8, r: rd };
  armasGuardadas.set(clave, g);
  return g;
}
/** El arma larga cruzada delante del pecho (de costado, en espejo). */
export function armaCruzada(id, espejo) {
  const clave = id + '|cruzada|' + (espejo ? 1 : 0);
  let g = armasGuardadas.get(clave);
  if (g) return g;
  g = { ...leerArma(DIBUJOS_ARMAS[id].cruzada, espejo), angulo: espejo ? -1.3 : -2.15, r: -3 };
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
    // Del todo cruzada, su propio dibujo (de costado, en espejo); si no, el de la dirección.
    const A = t === 0 ? armaCruzada(arma, vista === 'lado') : armaEn(arma, P.ang + da * t);
    const d = [Math.cos(A.angulo), Math.sin(A.angulo)];
    const mano = [Math.round(cadera[0] + (hombro[0] - cadera[0]) * t), Math.round(cadera[1] + (hombro[1] - cadera[1]) * t)];
    const en = (p) => [mano[0] + p[0], mano[1] + p[1]];
    larga = { t, d, mano, A, apoyo: en(A.apoyo), boca: en(A.boca) };
  }
  // Apuntando para arriba (hacia el fondo), el brazo va detrás del cuerpo.
  // (En el culatazo nunca: el brazo levantado tiene que verse.) El arma larga
  // cruzada, de espaldas, va delante del pecho: o sea, detrás para nosotros.
  /**
   * 🔁 DELANTE O DETRÁS DEL CUERPO, por vista *(Santi: "se superponen a los
   * pixeles del personaje (cuando está de espaldas)")*. De espaldas, apuntando
   * hacia arriba, el arma está delante del pecho: para nosotros, detrás. En
   * tres cuartos de espaldas el brazo del arma es el de acá: va delante, salvo
   * apuntando casi derecho para arriba. De costado, siempre delante (es el
   * brazo de acá). La cruzada, de espaldas, detrás. En el culatazo, nunca.
   */
  const rArma = Math.round(Math.atan2(dir[1], dir[0]) / (Math.PI / 8));
  const detras = !arma || golpe != null ? false
    : larga && larga.t < 0.5 ? vista === 'espalda' || vista === 'diagE'
      : vista === 'espalda' ? rArma < 0
        : vista === 'lado' ? false
          // 🔁 De tres cuartos de espaldas, el arma larga va entera detrás del
          // cuerpo *(Santi: "el brazo izquierdo se ve, cuando debería estar
          // hacia adelante… la culata… también quedó como el brazo")*: se ve
          // la espalda limpia y asoma el caño por encima del hombro.
          : vista === 'diagE' && larga ? true
            : rArma <= -3;

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
    // Apuntando hacia nosotros o lejos, el brazo se ve más corto (en escorzo).
    const largo = [6, 6, 6, 3, 2][Math.min(4, Math.abs(rArma))];
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
    const A = armaEn(DIBUJOS_ARMAS[arma] ? arma : 'colt', Math.atan2(dir[1], dir[0]));
    const mx = Math.round(mano[0]), my = Math.round(mano[1]);
    for (const [x, y, c] of A.puntos) poner(mx + x, my + y, c);
    boca = [mx + A.boca[0], my + A.boca[1]];
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
