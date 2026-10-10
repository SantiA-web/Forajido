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
const COLORES = {
  h: 6, H: 5, k: 4, K: 3, x: 1, b: 32, l: 25,       // el sombrero: luz, base, sombra, honda; la cinta y su adorno de plata
  P: 12, p: 11, q: 47, B: 47, n: 13,                 // la piel (bajo el ala, en sombra), la barba
  S: 10, R: 9, r: 8, z: 39,                          // el pañuelo
  U: 34, V: 33, v: 32, w: 1, y: 5,                   // el chaleco de cuero y sus botones
  L: 16, C: 15, c: 14, s: 2,                         // la camisa (L el puño, al sol)
  W: 3, G: 28,                                       // el cinto y la hebilla (las balas son `y`)
  I: 20, T: 19, t: 41,                               // el pantalón de lona: luz, base, sombra
  Q: 6, O: 5, o: 4,                                  // las botas (Q la luz); la suela es `K`
  F: 4, f: 3,                                        // la funda
  N: 10, Z: 9, X: 8, e: 17, E: 16, i: 15,            // la manta enrollada: la lana roja (luz, base, sombra) y sus rayas claras
  J: 6, M: 5, m: 4, g: 3, Y: 45,                     // el morral de cuero: luz, base, sombra, la tira y la hebilla
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
    hombro: [7, 9],   // 🔁 la mano derecha (diestro): a la izquierda de la pantalla
    piernas: {
      quieto: mapa(17, [
        '......FIITTTtt',
        '......FIIT.Ttt',
        '......FIIT.Ttt',
        '.......fIT..Tt',
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
    hombro: [7, 9],   // 🔁 la mano derecha (diestro): a la izquierda de la pantalla
    piernas: {
      quieto: mapa(17, [
        '......FIITTttt',
        '......FIIT.ttt',
        '......FIIT..tt',
        '.......fIT..tt',
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

/**
 * 🆕 SENTADO (P3a: el guardia de franco, el pasajero en su asiento), cada vista
 * a mano: la cadera 4 puntos más abajo (`baja`), los pies en el piso. De
 * costado el muslo va derecho hacia adelante y la pierna baja al piso; de
 * frente y en diagonal de frente el muslo viene hacia nosotros (se ve corto)
 * y asoman las rodillas; de espaldas el asiento tapa los muslos y se ven las
 * botas abajo.
 * 🆕 DE RODILLAS (el guardia rendido, siempre de frente): 5 puntos más abajo,
 * los muslos derechos hasta las rodillas en el piso; los pies quedan atrás.
 */
VISTAS.lado.piernas.sentado = mapa(21, ['.......IFFTTTTT', '.......tFfTTTTTt', '.............ITt', '.............IT', '............QOOOO', '............KKKKK']);
VISTAS.frente.piernas.sentado = mapa(21, ['......FIITTTtt', '......FIITTTtt', '......fIIT.Ttt', '.......IIT.TTt', '.......QOO.OOo', '.......KKK.KKK']);
VISTAS.diagF.piernas.sentado = mapa(21, ['......FIITTttt', '......FIITTtttt', '......fIITT.ttt', '........IIT..tt', '........QOO..OOo', '........KKKK.KKKK']);
VISTAS.espalda.piernas.sentado = mapa(21, ['.......IITTTttF', '.......IITTTttF', '........IT..Ttf', '........IT..Tt', '.......OOO..OOO', '.......KKK..KKK']);
VISTAS.diagE.piernas.sentado = mapa(21, ['.......tttTTTF', '.......tttTTTTF', '.......tt..IITf', '.......tt...IT', '.......OOo..QOOO', '.......KKK..KKKK']);
/**
 * 🆕 EN EL PISO, APUNTANDO (el guardia tumbado por un tiro en la pierna) *(Santi:
 * "debería tener las piernas estiradas, pero su cuerpo inclinado hacia arriba
 * y adelante para disparar")*: sentado en el piso, la cadera 8 puntos más
 * abajo, las piernas estiradas hacia adelante (de costado, derechas en el piso
 * con las botas de punta para arriba; de frente vienen hacia nosotros y se ven
 * las suelas; de espaldas el cuerpo las tapa), y el torso echado adelante.
 */
VISTAS.lado.piernas.piso = mapa(23, ['..................OOK', '..................QOK', '.......IIIIIIIIIIIOOK', '.......tTTTTTTTTTTTt']);
VISTAS.frente.piernas.piso = mapa(25, ['.......IITTTtt', '......IIT..Ttt', '......IIT..Ttt', '.....IIT....Ttt', '.....IIT....Ttt', '....KKKK....KKKK', '....KOOK....KOOK']);   // las piernas abiertas en V, hacia nosotros
VISTAS.diagF.piernas.piso = mapa(25, ['.......IITTttt', '........IITtttt', '.........IITttt', '..........IITtt', '..........KKKKK', '..........KOOKK']);
VISTAS.espalda.piernas.piso = mapa(25, ['.......IITTTtt', '.......tttttt']);
VISTAS.diagE.piernas.piso = mapa(25, ['.......tttTTII', '........tttTT']);
VISTAS.frente.piernas.rodillas = mapa(22, ['......FIITTTtt', '......FIIT.Ttt', '......fIIT.TTt', '.......III.TTt', '.......ttt.ttt']);

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
  frente: ['......FIITTTtt', '......F'],
  espalda: ['.......IITTTttF', '..............F'],
  diagF: ['......FIITTttt', '......F'],
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
  frente: { hombro: [13, 9], kx: 0.15, ky: 0.35, derecha: true },
  espalda: { hombro: [6, 9], kx: -0.15, ky: -0.35 },
  diagF: { hombro: [13, 9], kx: 0.5, ky: 0.3, derecha: true },
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
    '-4': ['.M.', '.13', '.13', '.13', '.13', '213', '32d', '.d.', '.r.', '.A.', '...', '.s.'],
    '-3': ['...M.', '...13', '..13.', '..13.', '.13..', '.13..', '213..', '.d...', '.r...', '.A...', '.....', '.s...'],
    '-2': ['..........M.', '.........13.', '........13..', '.......13...', '......13....', '.....13d....', '....13d.....', 'dd.12d......', '..r23.......', '..rd........', '..A.........', 'ss..........'],
    '-1': ['...........1M', '.........1133', '.......1133..', '...121133....', '.dd2333dd....', '..r3ddd......', '..rdd........', '.sA..........', '.s...........', 's............'],
    0: ['.d...........', '..d12.......2', '..r231111111M', '..r3d33333333', '.sAdddddd....', 'ss...........', 's............'],
    1: ['.d...........', '..d12........', '..r12........', '..r23........', '.sA3d11......', 'ss.dd3311....', 's....dd3311..', '.......dd331M', '...........33'],
    2: ['.d.........', '..d1.......', '..r21......', 'sA.321.....', 's..d31.....', 's...d31....', '.....d31...', '......d31..', '........31.', '.........3M'],
    3: ['.d...', '.A...', 'r....', '213..', '.13..', '..13.', '..M3.'],
    4: ['.d.', '.A.', '...', '213', '.13', '.13', '.M3'],
  },
  // EL SMITH & WESSON SCHOFIELD: la traba arriba atrás, el caño más corto, culata de madera.
  smith: {
    '-4': ['.M.', '.13', '.13', '213', '.d2', '.W.', '.A.', '...', '.w.'],
    '-3': ['..M.', '..13', '.13.', '.13.', '213.', '.d2.', '.W..', '.A..', '....', '.w..'],
    '-2': ['........M.', '.......13.', '......13..', '.....13...', '.2..13d...', '.d.12d....', '..W23.....', '..Wd......', '..A.......', 'vv........'],
    '-1': ['.........M', '.......113', '..2121133.', '..d2333...', '..W3ddd...', '..Wdd.....', '.wA.......', '.w........', 'v.........'],
    0: ['..2.......', '..d12....2', '..W231111M', '..W3d33333', '.wAdddd...', 'vw........', 'v.........'],
    1: ['..2.......', '..d.......', '..W12.....', '..W23.....', '.wA3d11...', 'vw.dd3311.', 'v....dd33M', '.........3'],
    2: ['...2......', '...d1.....', '...W21....', '.wA.321...', 'vw..d31...', '.....d31..', '.......31.', '........3M'],
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
  // EL CUCHILLO DE MONTE: la hoja de acero (1 la luz, 3 la sombra, M la punta), la guarda de
  // bronce (o) y el mango de madera (w). La A es la mano en el mango.
  cuchillo: {
    '-4': ['.M.', '31.', '31.', '31.', 'ooo', '.A.', '.w.'],
    '-3': ['...M', '..13', '..1.', '.13.', 'oo..', '.A..', 'w...'],
    '-2': ['.....M', '....13', '...13.', '..o3..', '.Ao...', 'w.....'],
    '-1': ['......1M', '..o.113.', 'wAo13...', '..o.....'],
    0: ['..o.....', 'wAo1111M', '..o333..'],
    1: ['..o.....', 'wAo13...', '..o.113.', '......1M'],
    2: ['w.....', '.Ao...', '..o1..', '...13.', '....13', '.....M'],
    3: ['w...', '.A..', 'oo..', '.13.', '..1.', '..13', '...M'],
    4: ['.w.', '.A.', 'ooo', '.13', '.13', '.13', '.M.'],
  },
  // LA ESCOPETA con culata, de un solo caño a la vista *(Santi: "mejor no haz la escopeta así,
  // prefiero que se vea un solo cañón que vista desde arriba")*: el caño grueso (dos de alto: la
  // cara de arriba con luz y el costado), el martillo, la mira de bronce, el guardamanos y la
  // culata, la misma del Winchester. Más corta que el rifle (14 contra 17). La mira, oscura
  // *(Santi: "la mira de la escopeta la quiero color negro/gris, no naranja")*.
  escopeta: {
    '-4': ['M.', '13', 'S3', 'w3', 'd2', 'A3', '.w', 'Ww', 'wv', 'dd'],
    '-3': ['...M.', '..13.', '..S3.', '.w3..', '.d2..', '.A3..', 'W....', 'Ww...', 'wv...', 'dd...'],
    '-2': ['...........dM3', '...........13.', '..........13..', '.........13...', '........1S....', '.......1w.....', '.....d23......', '.....A3d......', '....Ww........', '...Ww.........', '..Ww..........', '.Wvv..........', 'ddv...........', '.d............'],
    '-1': ['............d.', '............1M', '..........1133', '......d.1S33..', '......2233w...', '.....A33ww....', '...WW.d.......', '...ww.........', '.WWv..........', 'dvw...........', 'dv............', 'd.............'],
    0: ['.....d........', '......d.....d.', '...WWA221S111M', 'dWWww.33333333', 'dvwv..ddwww...', 'dv....d.......'],
    1: ['d.............', 'dWWWWd........', 'dvwwwAd.......', '.v.v..22......', '......331S....', '......d.3311d.', '........ww331M', '..........w.33'],
    2: ['dd..........', 'dwW.........', '.vwW........', '.vvwWd......', '...vA2......', '.....32.....', '.....dw1....', '.......S1...', '........31d.', '.........31.', '..........3M'],
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
// Para la gente del tren (gente.js): el mismo cuerpo, las mismas piernas y los mismos colores.
export { VISTAS, COLORES as C, VER_BRAZO, linea, OX, OY };

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
 * 🆕 EL CULATAZO CON EL ARMA LARGA, distinto para cada una *(Santi: "estas
 * dos armas pegarían distinto con la culata"; aprobó los cuadros)*. 8 cuadros
 * en 0,28 s (`armaLarga` en data/melee.js); el impacto es el cuadro 3.
 * Cada cuadro, puesto a mano: `r` hacia dónde apunta el CAÑO (de a 22,5°,
 * mirando a la derecha: 0 adelante, -4 arriba, 8 atrás; pasado 4 o -4 es el
 * dibujo del arma en espejo, con la culata adelante), `mano` dónde va la mano
 * del gatillo desde el hombro, y el cuerpo (`inclina`, `baja`). `cruzada`
 * es volver a llevarla cruzada. En el impacto, `estela` (puntos desde el
 * hombro) y `destello` (desde la mano, en la culata).
 *
 *  EL WINCHESTER, EN ARCO: lo lleva atrás (la culata detrás de la cadera),
 *  la culata viene por abajo y sube hasta la cabeza del otro con el caño
 *  apuntando atrás y abajo; sigue un poco y vuelve a cruzarlo.
 *  LA ESCOPETA, DE UN EMPUJÓN: la recoge contra el pecho con la culata
 *  adelante y la empuja derecho con los dos brazos, como un ariete; el cuerpo
 *  se tira adelante, y en vez de estela, líneas rectas de velocidad.
 */
/**
 * 🆕 EL TAJO DEL CUCHILLO, en 8 cuadros (`tajo` 0-7, en 0,34 s; el impacto
 * es el 3) *(Santi aprobó el plan: "sí, vamos con la B y quiero la vaina")*.
 * Con la MANO LIBRE, sin soltar el arma de fuego: la saca de la vaina, la
 * lleva atrás a la altura del hombro, corta cruzando por delante a la altura
 * del cuello del otro (estela finita y un brillo en la punta), frena y la
 * guarda. Con el arma larga, la mano izquierda suelta el guardamanos y el
 * arma queda cruzada en la otra. Cada cuadro, puesto a mano: `mano` desde el
 * hombro del brazo libre (mirando a la derecha), `r` hacia dónde apunta la
 * hoja (de a 22,5°; pasado 4 o -4, el dibujo en espejo), `delante` si el
 * brazo va por delante del cuerpo, `vaina` si la mano está en la vaina.
 *
 * 🔁 LA CURVA BLANCA DEL TAJO *(Santi: "no quiero que esté esa línea abajo
 * blanca, sino una curva blanca que indique el movimiento del cuchillo")*: el
 * rastro de la PUNTA del cuchillo, una curva que pasa por donde estuvo la
 * punta en los dos cuadros anteriores y llega a donde está ahora (`curva`,
 * del cuadro 2 al 5). Blanca, con la cola gris; sólo en el aire, nunca por
 * encima del cuerpo, la cara o el arma (por detrás de la cabeza se corta,
 * como el cuchillo).
 */
const TAJO = [
  { vaina: true, r: 4, inclina: 0, baja: 0 },
  // En diagonal de frente el brazo izquierdo es el de allá: lo levanta por encima
  // de su hombro (llevado atrás, el cuchillo asomaba del otro lado de la cara).
  { mano: [-3, 0], r: -6, inclina: -1, baja: 0, diagF: { mano: [1, -2], r: -4 } },
  // De frente, a la altura del pecho y acostado: más arriba le cruzaba la cara.
  { mano: [3, -1], r: -1, inclina: 0, baja: 0, delante: true, curva: true, frente: { mano: [2, 2], r: 0 } },
  { mano: [7, -1], r: 0, inclina: 1, baja: 1, delante: true, curva: true, brillo: true },
  { mano: [6, 3], r: 2, inclina: 1, baja: 0, delante: true, curva: true },
  { mano: [4, 5], r: 3, inclina: 0, baja: 0, delante: true, curva: true },
  { mano: [1, 5], r: 4, inclina: 0, baja: 0, delante: true, haciaVaina: true },
  { vaina: true, r: 4, inclina: 0, baja: 0 },
];
/**
 * 🆕 LA VAINA DEL CUCHILLO, colgada del lado IZQUIERDO de la cintura, con el
 * mango asomando arriba *(Santi: "quiero la vaina"; "debería buscar el cuchillo
 * en la izquierda de su cintura y guardarlo allí también")*: si compraste el
 * cuchillo, se ve que lo llevás. De frente queda del otro lado de la mano
 * libre, así que la mano cruza por delante del cuerpo para sacarlo. Puesta a
 * mano por vista; de costado queda del lado de allá, tapada por el cuerpo. `mano` es dónde la agarra la mano. Las
 * dos primeras filas son el mango: mientras cortás, no están.
 */
const VAINA = {
  frente: { mapa: mapa(14, ['...........y', '...........Y', '...........J', '...........M', '...........M', '...........m']), mano: [11, 14] },
  diagF: { mapa: mapa(14, ['...........y', '...........Y', '...........J', '...........M', '...........M', '...........m']), mano: [11, 14] },
  espalda: { mapa: mapa(14, ['........y', '........Y', '........J', '........M', '........M', '........m']), mano: [8, 14] },
  diagE: { mapa: mapa(14, ['........y', '........Y', '........J', '........M', '........M', '........m']), mano: [8, 14] },
  lado: { mapa: null, mano: [8, 15] },
};
const GOLPE_LARGA = {
  winchester: [
    { r: -2, mano: [-1, 3], inclina: -1, baja: 0 },
    { r: -4, mano: [2, 3], inclina: -1, baja: 0 },
    { r: -6, mano: [1, 2], inclina: 0, baja: 0 },
    { r: 7, mano: [3, -1], inclina: 1, baja: 1,
      estela: [[4, 7], [6, 7], [8, 6], [9, 5], [10, 3], [11, 1], [11, -1]], destello: [6, -2] },
    { r: 7, mano: [3, -2], inclina: 1, baja: 1 },
    { r: 8, mano: [2, 0], inclina: 1, baja: 0 },
    { r: -3, mano: [2, 3], inclina: 0, baja: 0 },
    { cruzada: true, inclina: 0, baja: 0 },
  ],
  escopeta: [
    { r: 8, mano: [0, 2], inclina: 0, baja: 0 },
    { r: 8, mano: [-2, 2], inclina: -1, baja: 0 },
    { r: 7, mano: [2, 1], inclina: 0, baja: 0 },
    { r: 7, mano: [6, 0], inclina: 1, baja: 1,
      estela: [[-4, -3], [-5, -3], [-6, -3], [-3, 0], [-4, 0], [-5, 0], [-6, 0], [-7, 0], [-4, 3], [-5, 3], [-6, 3]], destello: [6, -2] },
    { r: 7, mano: [5, 0], inclina: 1, baja: 1 },
    { r: 8, mano: [4, 1], inclina: 1, baja: 0 },
    { r: 8, mano: [1, 2], inclina: 0, baja: 0 },
    { cruzada: true, inclina: 0, baja: 0 },
  ],
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
/**
 * 🆕 EL BRAZO DEL REVÓLVER, puesto a mano por dirección (de -4, derecho para
 * arriba, a 4, derecho para abajo; hacia la izquierda en espejo): dónde van el
 * codo y la mano, en puntos desde el hombro, mirando a la derecha. BAJO: el
 * codo doblado y el revólver tres puntos más abajo que con el brazo recto de
 * antes, a la altura del pecho. RECTO (apuntando o recién disparaste): el
 * brazo estirado y el revólver un punto más arriba que antes.
 */
const BRAZO_REVOLVER = {
  bajo: [
    { codo: [1, 4], mano: [0, 2] },   // -4 derecho para arriba
    { codo: [1, 4], mano: [2, 1] },   // -3
    { codo: [2, 4], mano: [4, 1] },   // -2
    { codo: [2, 4], mano: [6, 2] },   // -1
    { codo: [1, 4], mano: [6, 5] },   //  0 al frente
    { codo: [1, 5], mano: [6, 7] },   //  1
    { codo: [0, 5], mano: [3, 7] },   //  2
    { codo: [0, 4], mano: [2, 6] },   //  3
    { codo: [0, 4], mano: [0, 6] },   //  4 derecho para abajo
  ],
  recto: [
    { mano: [0, -2] }, { mano: [2, -3] }, { mano: [5, -2] }, { mano: [7, -2] },
    { mano: [6, 1] },
    { mano: [6, 4] }, { mano: [3, 4] }, { mano: [2, 2] }, { mano: [0, 1] },
  ],
};
/**
 * 🔁 LA MOCHILA: UNA MANTA ENROLLADA ARRIBA Y UN MORRAL DE CUERO *(Santi: "la
 * mochila es un cuadrado marrón sin textura… no se parece a un personaje de
 * Among Us"; "prefiero que no se vean las correas por sobre el chaleco")*.
 * Antes, de espaldas ni se veía: se dibujaba antes que el torso y el chaleco
 * la tapaba.
 *
 * 🔁 Entre los brazos, sin pisarlos *(Santi: la manta larga y clara "se
 * confunde con el brazo y el brazo con la manta, haciendo parecer otra vez que
 * tiene una espalda ancha"; eligió la 2b y pidió que "los brazos no se
 * superpongan a la manta en las diagonales" y que el morral "se sienta como
 * que está separado del cuerpo")*. La manta es un rollo corto de lana roja
 * (luz arriba, sombra abajo) con dos rayas claras y las puntas oscuras, un
 * punto más abajo que el pañuelo, así entre los dos asoma el chaleco y no se
 * leen como un cuello. El morral va debajo, con solapa y hebilla, y un borde
 * oscuro a los costados y abajo que lo despega del chaleco. CRECE para abajo
 * con lo que llevás (`mochila` de 1 a 4), nunca a los costados, que es donde
 * están los brazos. Cada vista y cada tamaño, dibujado a mano; hacia la
 * izquierda, en espejo. De frente no se ve.
 */
const MOCHILA = {
  espalda: {
    punta: [10, 8],
    manta: mapa(9, [
      '.......XeNNNeX',
      '.......NEZZZEN',
      '.......XiXXXiX',
    ]),
    morral: [null,
      mapa(12, ['........MJJJM', '........MMYMM', '........mmmmm', '.........mmm', '.........www']),
      mapa(12, ['........MJJJM', '........MMYMM', '........mmmmm', '........JMMMm', '.........mmm', '.........www']),
      mapa(12, ['........MJJJM', '........MMYMM', '........mmmmm', '........JMMMm', '........JMMMm', '.........mmm', '.........www']),
      mapa(12, ['........MJJJM', '........MMYMM', '........mmmmm', '........JMMMm', '........JMMMm', '........JMMMm', '.........mmm', '.........www']),
    ],
  },
  // Tres cuartos de espaldas: la manta, justo entre los brazos (no los pisa),
  // con la punta de acá vista de frente (el espiral, a la derecha); el morral
  // muestra el costado, en sombra.
  diagE: {
    punta: [11, 8],
    manta: mapa(9, [
      '........XeNeZ',
      '........NEZEN',
      '........XiXiZ',
    ]),
    morral: [null,
      mapa(12, ['........MJJJg', '........MMYMg', '........mmmmg', '.........mmg', '.........www']),
      mapa(12, ['........MJJJg', '........MMYMg', '........mmmmg', '........JMMmg', '.........mmg', '.........www']),
      mapa(12, ['........MJJJg', '........MMYMg', '........mmmmg', '........JMMmg', '........JMMmg', '.........mmg', '.........www']),
      mapa(12, ['........MJJJg', '........MMYMg', '........mmmmg', '........JMMmg', '........JMMmg', '........JMMmg', '.........mmg', '.........www']),
    ],
  },
  // De costado, detrás de la espalda: la punta roja de la manta con su espiral, arriba del morral.
  lado: {
    manta: mapa(7, [
      '...NZNX',
      '...ZXZX',
      '...XZXX',
    ]),
    morral: [null,
      mapa(10, ['...JJJJ', '...mMMM', '...mMYM', '....mmm']),
      mapa(10, ['...JJJJ', '...mMMM', '...mMYM', '...mMMM', '....mmm']),
      mapa(10, ['...JJJJ', '..mMMMM', '..mMMYM', '..mMMMM', '..mMMMM', '...mmmm']),
      mapa(10, ['...JJJJ', '..mMMMM', '..mMMYM', '.mJMMMM', '.mJMMMM', '.mMMMMM', '..mmmmm']),
    ],
  },
};
/**
 * 🆕 EL REVÓLVER ENFUNDADO (P3a: el guardia patrulla con el revólver en la
 * funda y lo saca al entrar en combate *(Santi: "el revólver va enfundado")*):
 * la culata asoma de la funda, por encima del cinto, inclinada hacia atrás.
 * Puesta a mano por vista, en los colores del arma (W w la madera clara, d el
 * metal). De costado la funda está en la cadera de acá; de frente y en
 * diagonal de frente, a la izquierda de la pantalla (la cadera derecha).
 */
const CULATA_ENFUNDADA = {
  lado: mapa(15, ['......Ww', '.......wd']),
  frente: mapa(14, ['.....W', '.....ww', '......d']),
  diagF: mapa(14, ['.....W', '.....ww', '......d']),
  espalda: mapa(14, ['...............W', '..............ww', '..............d']),
  diagE: mapa(14, ['..............W', '.............ww', '.............d']),
};
/**
 * 🆕 DESENFUNDAR (P3a, el guardia la primera vez que pelea): `desenfunda` 0-2,
 * y después la pose de siempre. 0 la mano agarra la culata (todavía en la
 * funda); 1 lo saca para arriba, el caño apuntando al piso; 2 lo trae hacia
 * adelante, a mitad de camino de la pose. `culata` es dónde está la culata
 * enfundada, en puntos desde el hombro del arma, por vista.
 */
const DESENFUNDE = { culata: { lado: [-2, 6], frente: [-1, 6], diagF: [-1, 6], espalda: [1, 6], diagE: [0, 6] } };
/**
 * 🆕 ATURDIDO (P3a: el guardia que recibe un golpe), 4 cuadros: 0 el golpe lo
 * echa atrás (el cuerpo y la cabeza para atrás, los brazos sueltos), 1 se le
 * aflojan las piernas (baja un punto), 2 y 3 se tambalea (la cabeza de un lado
 * al otro) hasta que se repone. El arma cae: el revólver apunta al piso
 * (`r`, de a 22,5°) y el arma larga queda cruzada. `ida` es el brazo libre.
 */
const ATURDIDO = [
  { inclina: -1, baja: 0, cabeza: -1, r: 3, ida: -0.6 },
  { inclina: -1, baja: 1, cabeza: -1, r: 3, ida: -0.4 },
  { inclina: 0, baja: 1, cabeza: -1, r: 3, ida: 0.2 },
  { inclina: 0, baja: 1, cabeza: 1, r: 3, ida: -0.2 },
];
/**
 * 🆕 LOS BRAZOS EN OTRAS POSES (P3a), puestos a mano por vista: cada brazo es
 * hombro → codo → mano, en puntos del dibujo; `atras` si va detrás del cuerpo
 * (el de allá). El primero es siempre el derecho.
 *  arriba  las manos arriba (el rendido, el pasajero asaltado): los codos
 *          afuera y las manos a los costados del ala; el derecho puede llevar
 *          el pañuelo blanco (`bandera`).
 *  cartas  sentado jugando: las dos manos juntas delante de la panza con las
 *          cartas (de espaldas no se ven: el cuerpo las tapa).
 */
const BRAZOS = {
  arriba: {
    lado: [{ p: [[10, 9], [12, 7], [12, 3]] }, { p: [[9, 9], [10, 7], [10, 3]], atras: true }],
    frente: [{ p: [[7, 9], [4, 7], [4, 3]] }, { p: [[13, 9], [16, 7], [16, 3]] }],
    diagF: [{ p: [[7, 9], [4, 7], [5, 3]] }, { p: [[13, 9], [16, 7], [15, 3]], atras: true }],
    espalda: [{ p: [[13, 9], [16, 7], [16, 3]] }, { p: [[6, 9], [3, 7], [3, 3]] }],
    diagE: [{ p: [[13, 9], [16, 7], [16, 3]] }, { p: [[6, 9], [3, 7], [4, 3]], atras: true }],
  },
  cartas: {
    lado: [{ p: [[10, 9], [11, 13], [13, 13]] }, { p: [[9, 9], [10, 13], [12, 12]], atras: true }],
    frente: [{ p: [[7, 9], [7, 12], [8, 14]] }, { p: [[13, 9], [13, 12], [11, 14]] }],
    diagF: [{ p: [[7, 9], [8, 13], [10, 14]] }, { p: [[13, 9], [13, 12], [12, 13]], atras: true }],
    espalda: [{ p: [[13, 9], [14, 12], [13, 14]] }, { p: [[6, 9], [5, 12], [6, 14]] }],
    diagE: [{ p: [[13, 9], [14, 12], [14, 14]] }, { p: [[6, 9], [5, 12], [6, 14]] }],
  },
};
/** Las cartas en la mano (blancas con un punto rojo: crema se perdían contra la camisa), por vista; de espaldas no se ven. */
const CARTAS = {
  lado: mapa(11, ['.............Lk', '.............LL']),
  frente: mapa(12, ['.........LkL', '.........LLL']),
  diagF: mapa(12, ['..........LkL', '..........LLL']),
};
/** El pañuelo blanco del rendido, arriba de la mano derecha (desde la mano). */
const PANUELO_BLANCO = [[-1, -3, 30], [0, -3, 30], [1, -3, 29], [-1, -2, 30], [0, -2, 30], [1, -2, 25], [0, -1, 25]];
const CRUZADA = { lado: { mano: [11, 15], ang: -1.3 }, otra: { mano: [12, 16], ang: -2.15 }, frontal: { mano: [8, 16], ang: -0.99 } };

/**
 * `persona` (P3a, la gente del tren): otro personaje sobre el mismo esqueleto.
 * `colores` cambia qué color es cada letra (una letra en null no se dibuja),
 * `cabeza` es la lista de mapas que va en lugar de la cabeza del jugador
 * (cara, pelo, barba, sombrero…) y `torso` el torso. `enfundado`: el
 * revólver en la funda (ver CULATA_ENFUNDADA).
 */
export function cuadroJugador({ vista, piernas, arma, ang, mochila, fino, golpe, empuna, tajo, vaina, persona, enfundado, desenfunda, aturdido, brazos, bandera }) {
  const C = persona ? { ...COLORES, ...persona.colores } : COLORES;
  const TJ = tajo != null ? TAJO[tajo] : null;
  /**
   * 🔁 DIESTRO EN TODAS LAS VISTAS *(Santi: "la vaina está del lado izquierdo de
   * la cintura y el personaje debería buscar el cuchillo justamente con su mano
   * izquierda"; eligió la A)*. De frente y en diagonal de frente el arma estaba
   * dibujada en la mano izquierda; ahora va en la derecha, que para nosotros
   * queda a la izquierda de la pantalla, y la izquierda queda libre para el
   * cuchillo. De frente, los golpes (culatazos y tajo) salen hacia afuera, del
   * lado de la mano que pega (`sx` -1): hacia adentro el brazo le taparía la
   * cara. En diagonal de frente salen hacia adelante, como de costado.
   */
  const frontal = vista === 'frente' || vista === 'diagF';
  const sx = vista === 'frente' ? -1 : 1;
  const espejoAng = (a) => (sx < 0 ? Math.PI - a : a);
  // El culatazo: con el arma larga, su cuadro (GOLPE_LARGA); si no, el del revólver.
  const GL = golpe != null && GOLPE_LARGA[arma] ? GOLPE_LARGA[arma][golpe] : null;
  if (golpe != null) ang = GL ? (GL.cruzada ? -1.3 : espejoAng(GL.r * Math.PI / 8)) : espejoAng(GOLPE.brazo[golpe]);
  const AT = aturdido != null ? ATURDIDO[aturdido] : null;
  if (AT) { ang = espejoAng(AT.r * Math.PI / 8); empuna = 0; }
  const V = VISTAS[vista];
  const idx = new Int16Array(ANCHO * ALTO).fill(-1);
  const poner = (x, y, i) => {
    if (i == null) return;
    x += OX; y += OY;
    if (x >= 0 && y >= 0 && x < ANCHO && y < ALTO) idx[y * ANCHO + x] = i;
  };
  const dibujarMapa = (m, dy = 0, dx = 0, tabla = C) => m.filas.forEach((fila, j) => {
    const corre = typeof dx === 'function' ? dx(j) : dx;
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') poner(x + corre, m.y + j + dy, tabla[fila[x]]);
  });
  /**
   * Cuánto baja el cuerpo: lo dice cada cuadro (PASOS). Agachado y quieto, 3.
   * Trotando, de costado el cuerpo va inclinado un punto hacia adelante.
   */
  const tipo = PASOS[piernas[0]] && /^\d$/.test(piernas.slice(1)) ? piernas[0] : null;
  const k = tipo ? +piernas[1] : 0;
  const baja = (tipo ? PASOS[tipo].baja[k] : piernas === 'agachado' ? 3 : piernas === 'sentado' ? 4 : piernas === 'rodillas' ? 5 : piernas === 'piso' ? 8 : 0) + (GL ? GL.baja : golpe != null ? GOLPE.baja[golpe] : TJ ? TJ.baja : AT ? AT.baja : 0);
  const deCostado = vista === 'lado' || vista.startsWith('diag');
  const inclina = AT ? (deCostado ? AT.inclina : 0) : TJ ? (deCostado ? TJ.inclina : 0) : golpe != null ? (deCostado ? (GL ? GL.inclina : GOLPE.inclina[golpe]) : 0) : vista === 'lado' && tipo === 'R' ? 1 : piernas === 'piso' && deCostado ? 1 : 0;
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
  const cabezaX = (encorva ? (vista === 'lado' ? 2 : vista.startsWith('diag') ? 1 : 0) : 0) + (AT ? AT.cabeza : 0);
  const cabezaY = encorva ? 1 : 0;
  const [hx, hy] = [V.hombro[0] + inclina + lomo, V.hombro[1] + baja];
  const dir = [Math.cos(ang), Math.sin(ang)];
  // El arma larga, con las dos manos: dónde va cada mano, la culata y la boca.
  let larga = null;
  if (arma === 'winchester' || arma === 'escopeta') {
    const t = AT ? 0 : GL ? (GL.cruzada ? 0 : 1) : golpe != null ? 1 : TJ ? 0 : Math.max(0, Math.min(1, empuna ?? 1));
    const P = vista === 'lado' ? CRUZADA.lado : frontal ? CRUZADA.frontal : CRUZADA.otra;
    const cadera = [P.mano[0] + inclina + lomo, P.mano[1] + baja];
    // Apuntando, la mano adelante del hombro; de frente un poco más, así la culata
    // queda apoyada en el hombro y no asoma al lado de la cara.
    const adelante = frontal ? 4 : 2;
    const hombro = [hx + dir[0] * adelante, hy + dir[1] * adelante];
    let da = ang - P.ang;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    // Del todo cruzada, su propio dibujo (de costado, en espejo); si no, el de la dirección.
    const A = t === 0 ? armaCruzada(arma, vista === 'lado' || frontal) : GL ? armaEn(arma, espejoAng(GL.r * Math.PI / 8)) : armaEn(arma, P.ang + da * t);
    const d = [Math.cos(A.angulo), Math.sin(A.angulo)];
    const mano = GL && !GL.cruzada ? [hx + GL.mano[0] * sx, hy + GL.mano[1]]
      : [Math.round(cadera[0] + (hombro[0] - cadera[0]) * t), Math.round(cadera[1] + (hombro[1] - cadera[1]) * t)];
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
  const detras = !arma || golpe != null || desenfunda != null ? false
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
    manga(S, larga.apoyo, vista === 'lado' || vista === 'diagF');
  };
  /** El arma larga y las dos manos. */
  const dibujarLarga = () => {
    if (vista !== 'lado' && !TJ) brazoIzqLarga();
    for (const [x, y, c] of larga.A.puntos) poner(larga.mano[0] + x, larga.mano[1] + y, c);
    manga([hx, hy], larga.mano, false);
    mano(larga.mano, false);
    if (!TJ) mano(larga.apoyo, vista === 'lado' || vista === 'diagF');
    boca = larga.boca;
  };

  const brazo = () => {
    if (larga) { dibujarLarga(); return; }
    // Sin arma cuelga como el otro: dos puntos de ancho y la mano de 2×2.
    // (De frente, el derecho cuelga por fuera del cuerpo, del lado izquierdo de la pantalla.)
    // Caminando, se hamaca al revés del brazo libre (el guardia con el revólver enfundado).
    if (!arma) { colgado(frontal ? [hx - 1, hy] : [hx, hy], -idaLibre(), tipo ? BRAZO_LIBRE[tipo].codo : 0.1, false, frontal ? 'izq' : null); return; }
    // Apuntando hacia nosotros o lejos, el brazo se ve más corto (en escorzo).
    /**
     * Dónde cae la mano, puesto a mano para cada dirección: en el mismo
     * escalón que el dibujo del arma (a 22,5° sube 1 cada 2), así brazo y arma
     * forman una sola línea. Apuntando hacia nosotros o lejos, más corto (en
     * escorzo). En el culatazo el brazo sigue su ángulo.
     */
    /**
     * 🔁 EL BRAZO DEL REVÓLVER, en dos poses puestas a mano para cada dirección
     * (ver BRAZO_REVOLVER) *(Santi: "lo agarra desde más arriba de la
     * empuñadura… que lo lleve desde la empuñadura… el brazo más abajo, como
     * si estuviera flexionando el codo y cuando apunta (click derecho), que
     * ahí ponga recto el brazo y se levante apenas")*. La mano agarra la
     * culata (la A de cada mapa). `empuna` va de 0 (codo doblado) a 1 (recto),
     * con un paso en el medio. En el culatazo el brazo sigue su ángulo.
     */
    const ri = Math.max(-4, Math.min(4, rArma)) + 4;
    const B = BRAZO_REVOLVER.bajo[ri], R = BRAZO_REVOLVER.recto[ri];
    // Desenfundando (ver DESENFUNDE): de la funda a la pose, la mano y el revólver.
    if (desenfunda != null) {
      const cu = DESENFUNDE.culata[vista];
      const base = [hx + cu[0], hy + cu[1]];
      const lx = dir[0] < -0.01 ? -1 : 1;
      let m = base, a = null;
      // De costado, un punto adelante: sobre el chaleco se ve; sobre el pantalón gris, no.
      if (desenfunda === 1) { m = [base[0] + (vista === 'lado' ? 1 : 0), base[1] - 3]; a = Math.PI / 2; }
      else if (desenfunda === 2) {
        m = [Math.round((base[0] + hx + B.mano[0] * lx) / 2), Math.round((base[1] - 2 + hy + B.mano[1]) / 2)];
        // A mitad de camino entre el piso y adonde apunta.
        // (Apuntando hacia el fondo, todavía hacia el piso: a mitad de camino quedaba de costado.)
        a = dir[1] < -0.5 ? Math.PI / 2 : Math.atan2(1 + dir[1], dir[0] + 0.001 * lx);
      }
      manga([hx, hy], m, false);
      if (a != null) {
        const A = armaEn(DIBUJOS_ARMAS[arma] ? arma : 'colt', a);
        for (const [x, y, c] of A.puntos) poner(m[0] + x, m[1] + y, c);
        boca = [m[0] + A.boca[0], m[1] + A.boca[1]];
      }
      poner(m[0], m[1], C.P); poner(m[0] + 1, m[1], C.p);
      poner(m[0], m[1] + 1, C.p); poner(m[0] + 1, m[1] + 1, C.q);
      return;
    }
    const t = Math.max(0, Math.min(1, empuna ?? 0));
    const lx = dir[0] < -0.01 ? -1 : 1;
    const desde = (p) => [hx + p[0] * lx, hy + p[1]];
    let mano, codo = null;
    if (golpe != null) mano = [hx + dir[0] * 6, hy + dir[1] * 6];
    else {
      mano = desde([B.mano[0] + (R.mano[0] - B.mano[0]) * t, B.mano[1] + (R.mano[1] - B.mano[1]) * t]);
      // El codo va de doblado a quedar en la línea del brazo recto.
      const medio = [R.mano[0] / 2, R.mano[1] / 2];
      if (t < 1) codo = desde([B.codo[0] + (medio[0] - B.codo[0]) * t, B.codo[1] + (medio[1] - B.codo[1]) * t]);
    }
    mano = [Math.round(mano[0]), Math.round(mano[1])];
    if (codo) codo = [Math.round(codo[0]), Math.round(codo[1])];
    // La manga, de dos de alto, en uno o dos tramos; el último punto antes de la mano es el puño (al sol).
    const pts = [];
    if (codo) { linea([hx, hy], codo, (x, y) => pts.push([x, y])); pts.pop(); }
    linea(codo || [hx, hy], mano, (x, y) => pts.push([x, y]));
    pts.forEach(([x, y], i) => {
      const puno = i === pts.length - 2;
      poner(x, y, puno ? C.L : C.C);
      poner(x, y + 1, puno ? C.C : C.c);
    });
    // El revólver (Colt o Schofield), en la dirección del brazo, y encima el puño de 2×2 en la culata.
    const A = armaEn(DIBUJOS_ARMAS[arma] ? arma : 'colt', Math.atan2(dir[1], dir[0]));
    const [mx, my] = mano;
    for (const [x, y, c] of A.puntos) poner(mx + x, my + y, c);
    boca = [mx + A.boca[0], my + A.boca[1]];
    poner(mx, my, C.P); poner(mx - lx, my, C.P);
    poner(mx, my + 1, C.p); poner(mx - lx, my + 1, C.p);
  };

  /**
   * UN BRAZO QUE CUELGA (el libre, o el del arma cuando no tenés nada): dos
   * puntos de ancho (el de afuera al sol), hombro → codo → mano de 2×2. `a`
   * es cuánto va hacia adelante y `b` cuánto se dobla el codo, en radianes.
   */
  const VB = VER_BRAZO[vista];
  function colgado(S, a, b, atras, lado = null) {
    // `lado` 'izq': el brazo del lado izquierdo de la pantalla aunque el libre esté a la derecha.
    const der = lado ? lado === 'der' : VB.derecha;
    const kx = vista === 'frente' && !der ? -Math.abs(VB.kx) : VB.kx;
    const ver = (fx, fy) => [S[0] + Math.round(fx * kx), S[1] + Math.round(fy + fx * VB.ky)];
    const codo = [3 * Math.sin(a), 3 * Math.cos(a)];
    const mano = [codo[0] + 3 * Math.sin(a + b), codo[1] + 3 * Math.cos(a + b)];
    const [afuera, adentro] = atras ? [C.c, C.c] : [C.L, C.C];
    const trazo = der
      ? (x, y) => { poner(x, y, atras ? C.c : C.C); poner(x + 1, y, C.c); }
      : (x, y) => { poner(x, y, afuera); poner(x + 1, y, adentro); };
    linea(S, ver(...codo), trazo);
    linea(ver(...codo), ver(...mano), trazo);
    const [mx, my] = ver(...mano);
    poner(mx, my, atras ? C.p : C.P); poner(mx + 1, my, C.p);
    poner(mx, my + 1, C.p); poner(mx + 1, my + 1, C.q);
  }
  /** El brazo del cuchillo (ver TAJO): del hombro libre a la mano, y el cuchillo en la mano. */
  const cuadroTajo = (i) => ({ ...TAJO[i], ...(TAJO[i][vista] || {}) });
  const brazoCuchillo = () => {
    const TJ = cuadroTajo(tajo);
    const S = [VB.hombro[0] + inclina + lomo, VB.hombro[1] + baja];
    const V2 = [VAINA[vista].mano[0] + inclina + lomo, VAINA[vista].mano[1] + baja];
    let M = TJ.vaina ? V2 : [S[0] + TJ.mano[0] * sx, S[1] + TJ.mano[1]];
    // Volviendo a guardarlo, la mano ya va camino de la vaina (de frente queda del otro lado).
    if (TJ.haciaVaina && VAINA[vista].mapa) M = [Math.round((M[0] + V2[0]) / 2), Math.round((M[1] + V2[1]) / 2)];
    const lejosTajo = (vista === 'lado' || vista === 'diagF') && !TJ.delante && !TJ.vaina;
    manga(S, M, lejosTajo);
    const K = armaEn('cuchillo', espejoAng(TJ.r * Math.PI / 8));
    // En la vaina, la mano agarra el mango que ya dibuja la vaina.
    if (!(TJ.vaina && VAINA[vista].mapa)) for (const [x, y, c] of K.puntos) poner(M[0] + x, M[1] + y, c);
    mano(M, lejosTajo);
    if (TJ.curva) {
      // Dónde está la punta en cada cuadro del tajo.
      const punta = (i) => {
        const T = cuadroTajo(i), Q = armaEn('cuchillo', espejoAng(T.r * Math.PI / 8));
        return [S[0] + T.mano[0] * sx + Q.boca[0], S[1] + T.mano[1] + Q.boca[1]];
      };
      // El recorrido: arranca arriba y adelante del sombrero (por detrás de la
      // cabeza no se vería) y pasa por la punta de cada cuadro, del 3 al 6. En
      // cada cuadro se dibujan los dos últimos tramos, hasta donde está la punta.
      // Entre el impacto y el cuadro siguiente la punta baja de golpe: un punto
      // más afuera, en el medio, para que la curva doble redonda.
      const [p3, p4] = [punta(3), punta(4)];
      const camino = [[S[0] + 5 * sx, S[1] - 10], punta(2), p3, [Math.round((p3[0] + p4[0]) / 2) + 2 * sx, Math.round((p3[1] + p4[1]) / 2)], p4, punta(5)];
      const hasta = { 2: 1, 3: 2, 4: 4, 5: 5 }[tajo], desde = Math.max(0, hasta - 2);
      const en = (i) => camino[Math.max(0, Math.min(camino.length - 1, i))];
      const pts = [];
      for (let i = desde; i < hasta; i++) {
        const [p0, p1, p2, p3] = [en(i - 1), en(i), en(i + 1), en(i + 2)];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8, t2 = t * t, t3 = t2 * t;
          const q = [0, 1].map((c) => Math.round(0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)));
          const ult = pts[pts.length - 1];
          if (ult) linea(ult, q, (x, y) => { if (x !== ult[0] || y !== ult[1]) pts.push([x, y]); });
          else pts.push(q);
        }
      }
      // La cola (gris) y el resto (blanco), sólo en el aire.
      pts.forEach(([x, y], i) => {
        const [ex, ey] = [x + OX, y + OY];
        if (ex >= 0 && ey >= 0 && ex < ANCHO && ey < ALTO && idx[ey * ANCHO + ex] < 0) poner(x, y, i < pts.length / 3 ? 25 : 30);
      });
    }
    if (TJ.brillo) {
      const [px, py] = [M[0] + K.boca[0], M[1] + K.boca[1]];
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0]]) poner(px + dx, py + dy, dx ? 29 : 30);
    }
  };
  /** La vaina en el cinto (ver VAINA); mientras cortás, sin el mango. */
  const dibujarVaina = () => {
    const Va = VAINA[vista].mapa;
    if (!Va) return;
    const sinMango = TJ && !TJ.vaina;
    dibujarMapa(sinMango ? { y: Va.y + 2, filas: Va.filas.slice(2) } : Va, baja, inclina + lomo);
  };
  /** El brazo libre: de costado va detrás del cuerpo (es el de allá); en las otras vistas, al lado. */
  function idaLibre() { if (AT) return AT.ida; return tipo ? BRAZO_LIBRE[tipo].ida * Math.cos(k * Math.PI / 4) * 0.9 : 0; }
  const brazoLibre = () => {
    const B = tipo ? BRAZO_LIBRE[tipo] : null;
    colgado([VB.hombro[0] + inclina + lomo, VB.hombro[1] + baja], idaLibre(), B ? B.codo : 0.1, vista === 'lado' || vista === 'diagF');
  };

  /**
   * La mochila (ver MOCHILA), en su lugar del orden (de frente no se ve): de
   * costado, detrás de la espalda; de tres
   * cuartos de espaldas, delante del cuerpo y del brazo libre; de espaldas,
   * delante de todo (es lo más cerca de la cámara).
   */
  const dibujarMochila = () => {
    const Mo = MOCHILA[vista];
    const corre = inclina + lomo;
    // De espaldas, la punta del pañuelo que cuelga queda tapada por la manta
    // (si se ve, pañuelo y manta forman una cruz roja).
    if (Mo.punta) poner(Mo.punta[0] + corre, Mo.punta[1] + baja, C.V);
    dibujarMapa(Mo.manta, baja, corre);
    if (Mo.morral) dibujarMapa(Mo.morral[Math.max(1, Math.min(4, mochila))], baja, corre);
  };
  /**
   * Los brazos en otra pose (ver BRAZOS): reemplazan a los de siempre. Dos de
   * ancho (el de afuera al sol, el de allá en sombra) y la mano de 2×2.
   */
  /**
   * `brazos` puede ser el nombre de una pose (BRAZOS) o una pose armada por
   * quien dibuja (las cosas que hacen los pasajeros, ver gente.js): `lista`
   * los brazos, `props` lo que tiene en la mano o al lado (`m` el mapa,
   * `tabla` sus colores, `capa` 'fondo' detrás del cuerpo o 'frente' delante
   * de todo, `piso` si está en el piso y no se mueve con el cuerpo),
   * `inclina` cuánto se echa adelante y `cabeza` cuánto baja la cabeza.
   */
  const BRo = brazos ? (typeof brazos === 'string' ? { lista: BRAZOS[brazos][vista] } : brazos) : null;
  const BR = BRo && BRo.lista;
  const bi = BRo ? (vista === 'lado' || vista.startsWith('diag') ? BRo.inclina || 0 : 0) : 0;
  const bc = BRo ? BRo.cabeza || 0 : 0;
  const props = (capa) => (BRo && BRo.props || []).forEach((p) => {
    if ((p.capa || 'frente') === capa) dibujarMapa(p.m, p.piso ? 0 : baja, p.piso ? 0 : inclina + lomo + bi, p.tabla);
  });
  const brazoPose = (b, i) => {
    const pts = b.p.map(([x, y]) => [x + inclina + lomo + bi, y + baja]);
    const trazo = (x, y) => { poner(x, y, b.atras ? C.c : C.L); poner(x + 1, y, b.atras ? C.c : C.C); };
    linea(pts[0], pts[1], trazo);
    linea(pts[1], pts[2], trazo);
    const [mx, my] = pts[2];
    poner(mx, my, b.atras ? C.p : C.P); poner(mx + 1, my, C.p);
    poner(mx, my + 1, C.p); poner(mx + 1, my + 1, C.q);
    if (bandera && i === 0) for (const [dx, dy, c] of PANUELO_BLANCO) poner(mx + dx, my + dy, c);
  };
  if (BR) {
    BR.forEach((b, i) => { if (b.atras) brazoPose(b, i); });
    props('fondo');
    if (vista === 'lado' && mochila) dibujarMochila();
    const PB = V.piernas[piernas] || V.piernas.quieto;
    dibujarMapa(PB);
    if (baja < 0 || baja === 2) dibujarMapa({ y: PB.y - 1, filas: [PB.filas[0]] });
    dibujarMapa(persona ? persona.torso : V.torso, baja, (j) => inclina + bi + (j < 5 ? lomo : 0));
    if (enfundado) dibujarMapa(CULATA_ENFUNDADA[vista], baja, inclina + lomo + bi, COLOR_ARMA);
    const cartasAntes = brazos === 'cartas';
    if (!cartasAntes) for (const m of persona ? persona.cabeza : [V.cabeza]) dibujarMapa(m, baja + cabezaY + bc, inclina + cabezaX + bi);
    if (vaina) dibujarVaina();
    BR.forEach((b, i) => { if (!b.atras) brazoPose(b, i); });
    if (cartasAntes && CARTAS[vista]) dibujarMapa(CARTAS[vista], baja, inclina + lomo, { L: 30, k: 9 });
    if (cartasAntes) for (const m of persona ? persona.cabeza : [V.cabeza]) dibujarMapa(m, baja + cabezaY + bc, inclina + cabezaX + bi);
    props('frente');
  } else {
  if (vista === 'lado') { if (TJ) { if (!TJ.delante) brazoCuchillo(); } else if (larga) brazoIzqLarga(); else brazoLibre(); }
  // En diagonal de frente, el brazo libre (el izquierdo) es el de allá: detrás del cuerpo.
  const libreDetras = vista === 'diagF';
  if (libreDetras) { if (TJ) { if (!TJ.delante && !TJ.vaina) brazoCuchillo(); } else if (!larga) brazoLibre(); }
  if (detras) brazo();
  if (mochila && vista === 'lado') dibujarMochila();
  const P = V.piernas[piernas] || V.piernas.quieto;
  dibujarMapa(P);
  // Cuando el cuerpo sube 1 (pasando un paso, en el aire o agachado), la cadera se estira un punto para que no
  // quede un hueco entre el cinto y el pantalón.
  if (baja < 0 || baja === 2) dibujarMapa({ y: P.y - 1, filas: [P.filas[0]] });
  dibujarMapa(persona ? persona.torso : V.torso, baja, (j) => inclina + (j < 5 ? lomo : 0));
  if (enfundado) dibujarMapa(CULATA_ENFUNDADA[vista], baja, inclina + lomo, COLOR_ARMA);
  /**
   * 🔁 El arma larga cruzada va DEBAJO de la cabeza *(Santi: "hay unos pixeles
   * que se comen el sombrero y no queda bien la perspectiva")*: el caño sube
   * al costado de la cara, y el ala del sombrero, que está más arriba y más
   * cerca de la cámara, lo tapa.
   */
  const bajoLaCabeza = larga && larga.t < 0.5 && !detras;
  if (bajoLaCabeza) brazo();
  for (const m of persona ? persona.cabeza : [V.cabeza]) dibujarMapa(m, baja + cabezaY, inclina + cabezaX);
  if (vaina) dibujarVaina();
  if (vista !== 'lado' && TJ && !TJ.delante && !(libreDetras && !TJ.vaina)) brazoCuchillo();
  else if (vista !== 'lado' && !libreDetras && !larga && !TJ) brazoLibre();
  if (mochila && vista === 'diagE') dibujarMochila();
  if (!detras && !bajoLaCabeza) brazo();
  if (TJ && TJ.delante) brazoCuchillo();
  if (mochila && vista === 'espalda') dibujarMochila();
  }
  // El impacto: la estela del brazo (de arriba atrás hacia adelante) y un destello en la punta.
  if (GL && GL.estela) {
    // El impacto del arma larga: su estela (el arco del Winchester, las líneas
    // rectas de la escopeta) y el destello en la culata.
    for (const [x, y] of GL.estela) poner(hx + x * sx, hy + y, 25);
    const [px, py] = [larga.mano[0] + GL.destello[0] * sx, larga.mano[1] + GL.destello[1]];
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) poner(px + dx, py + dy, dx || dy ? 29 : 30);
  } else if (golpe === 3 && !GL) {
    for (let a = -1.4; a < 0.2; a += 0.16) poner(Math.round(hx + Math.cos(a) * 8 * sx), Math.round(hy + Math.sin(a) * 8), 25);
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
  const clave = [o.vista, o.piernas, o.arma || '', Math.round(o.ang * 100), o.mochila || 0, luz, destello ? 1 : 0, o.fino ? 1 : 0, o.golpe ?? '', o.empuna ?? 1, o.tajo ?? '', o.vaina ? 1 : 0].join('|');
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
