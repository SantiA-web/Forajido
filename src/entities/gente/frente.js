/**
 * LA GENTE, PARTE 3: de frente, tres cuartos y de espaldas.
 *
 * Las ocho direcciones salen de cinco dibujos: frente, tres cuartos, costado,
 * tres cuartos de espaldas y espaldas. Las tres de la izquierda son las mismas
 * en espejo, y eso lo resuelve `entities/figura.js` al estampar.
 */
import {
  ROPA, tono, mover, corrido, apuntar,
  OJO_B, PIEL, PIEL_S, CAM, CAM_L, CAM_S, PAN_R, PAN_RL, PAN_RS,
  BOTA, BOTA_L, ESPUELA, CINTO, FUNDA, CULATA, CULATA_L, LATON, BLANCA, CORBATA,
} from './dibujo.js';
import { cabezaFrente, cabezaEspalda } from './cabezas.js';
import { sombrero } from './dibujo.js';

/**
 * Qué hace el cuerpo en cada cuadro, visto de frente o de espaldas.
 * aI/aD: cuánto sube cada pie. tI/tD: si ese pie va 'adelante' (rodilla arriba)
 * o 'atras' (empujando). mI/mD: cuánto baja (+) o sube (−) cada mano.
 * y: el rebote del cuerpo. I y D son izquierda y derecha DE LA IMAGEN.
 */
const CAMINATA = [
  { aI: 0, aD: 0, mI: 0, mD: 0, y: 0 },
  { aI: 3, aD: 0, mI: 2, mD: -2, y: -1 },
  { aI: 0, aD: 3, mI: -2, mD: 2, y: -1 },
  { aI: 1, aD: 0, mI: 1, mD: -1, y: 0 },
  { aI: 0, aD: 1, mI: -1, mD: 1, y: 0 },
];

/**
 * EL TROTE, que es como se mueve la gente en un asalto *(Santi: "nadie asalta
 * un tren caminando")*. Contacto, apoyo, EMPUJE con la pierna de atrás estirada
 * y un vuelo corto. La pierna de atrás no se encoge: encogida parecía un salto
 * a dos pies.
 */
const espejarTrote = (t4) => t4.concat(t4.map((f) => ({
  aI: f.aD, aD: f.aI, tI: f.tD, tD: f.tI, mI: f.mD, mD: f.mI, y: f.y,
})));
const TROTE = espejarTrote([
  { aI: 0, aD: 3, tD: 'atras', mI: 1, mD: -6, y: 1 },
  { aI: 0, aD: 6, tD: 'adelante', mI: -2, mD: -3, y: 2 },
  { aI: 1, tI: 'atras', aD: 5, tD: 'adelante', mI: -5, mD: 0, y: 0 },
  { aI: 3, tI: 'atras', aD: 2, tD: 'adelante', mI: -6, mD: 1, y: -1 },
]);

export function cuadroFrente(o) {
  if (o.trote != null) return TROTE[o.trote % TROTE.length];
  const f = CAMINATA[(o.paso || 0) % CAMINATA.length];
  // Agachado: el cuerpo baja 5 y las rodillas se abren.
  return o.agachado ? { ...f, y: f.y + 5, abre: 1 } : f;
}

function piernasFrente(L, R, g, f, atras) {
  const PT = R.pant, c1 = atras ? tono(PT, 0.8) : PT, c2 = atras ? PT : tono(PT, 0.8);
  const top = 55 + Math.min(0, f.y), ab = f.abre || 0;
  const xi = 15 + g - ab, xd = 25 + ab;
  const pierna = (x, a, t, col, der) => {
    // Una patada para atrás, vista de frente, se esconde detrás del muslo.
    const c = t === 'atras' && !atras ? tono(col, 0.8) : col;
    const fondo = 70 - a;
    L.poly(der ? [[x, top], [x + 8, top], [x + 6, fondo], [x, fondo]] : [[x, top], [x + 9, top], [x + 8, fondo], [x + 2, fondo]], c);
    if (a >= 3 && t !== 'atras') L.rect(x + (der ? 2 : 3), 60, 4, 3, tono(c, 1.22));
    else if (a) L.rect(x + (der ? 2 : 3), 61, 4, 2, tono(c, 1.15));
    return c;
  };
  const k1 = pierna(xi, f.aI, f.tI, c1, false);
  const k2 = pierna(xd, f.aD, f.tD, c2, true);
  if (ab) { L.rect(xi, 62, 2, 3, tono(k1, 1.2)); L.rect(xd + 6, 62, 2, 3, tono(k2, 1.2)); }
  L.rect(24, top, 1, 6, tono(PT, 0.7));
  L.rect(xi + 3, 60, 3, 1, tono(PT, 0.75)); L.rect(xd + 2, 64, 3, 1, tono(PT, 0.7));
  L.sobre(12, top, 25, 18, [c1, c2, k1, k2], tono(PT, 0.86), 12);
  const bota = (x, a, der) => {
    L.poly(der ? [[x, 69 - a], [x + 6, 69 - a], [x + 8, 74 - a], [x - 1, 74 - a]] : [[x + 1, 69 - a], [x + 8, 69 - a], [x + 9, 74 - a], [x - 1, 74 - a]], BOTA);
    L.rect(x + 1, 70 - a, 4, 1, BOTA_L);
    if (atras) L.rect(x + 1, 72 - a, 5, 2, '#20160f');
    if (atras && a) L.rect(x, 74 - a, 8, 1, '#5a4a3a');
  };
  bota(xi, f.aI, false); bota(xd, f.aD, true);
  if (R.espuela) { L.rect(xi - 3, 73 - f.aI, 2, 1, ESPUELA); L.rect(xd + 8, 73 - f.aD, 2, 1, ESPUELA); }
}

/** La capa del Cazarrecompensas, que vuela detrás del cuerpo. */
function capa(L, color, f, atras) {
  const v = Math.round((f.mI - f.mD) / 2);
  L.poly([[13, 33], [35, 33], [38 + v, 58], [33, 62], [24, 58], [15, 62], [10 + v, 58]], color);
  L.sobre(10, 33, 30, 30, [color], tono(color, 0.75), 30);
  if (!atras) L.rect(14, 34, 20, 2, tono(color, 1.2));
}

/** Las manos arriba del pasajero al que ya asaltaste: los dos brazos en alto. */
export function brazosArriba(L, R, g) {
  const [M0, ML, MS] = R.manga;
  L.poly([[10 + g, 33], [15 + g, 32], [13 + g, 20], [9 + g, 21]], M0);
  L.rect(11 + g, 24, 2, 8, ML);
  L.poly([[33, 32], [38, 33], [39, 21], [35, 20]], MS);
  L.elipse(11 + g, 18, 2.5, 2.5, PIEL);
  L.elipse(37, 18, 2.5, 2.5, PIEL_S);
}

/** La mochila: el botín que llevás encima, que se ve y que te frena. */
function mochilaDetras(L, nivel) {
  const h = 10 + nivel * 2;
  L.rect(17, 36, 14, h, '#6a4a2a');
  L.rect(17, 36, 14, 2, '#8a6440');
  L.rect(19, 38, 3, h - 4, '#54381f');
  L.rect(26, 38, 3, h - 4, '#54381f');
}
function correasDeMochila(L, g) {
  L.rect(18 + g, 33, 2, 17, '#6a4a2a');
  L.rect(28 + g, 33, 2, 17, '#6a4a2a');
}

/**
 * SENTADO, de franco: las piernas se van hacia la cámara, cortas y anchas, y
 * los pies quedan donde estarían parados. El torso baja 6.
 */
function piernasSentado(L, R) {
  const PT = R.pant;
  L.poly([[16, 60], [24, 60], [24, 67], [15, 67]], PT);
  L.poly([[25, 60], [33, 60], [34, 67], [25, 67]], tono(PT, 0.85));
  L.rect(15, 66, 19, 2, tono(PT, 0.7));
  L.rect(16, 67, 7, 4, tono(PT, 0.78));
  L.rect(26, 67, 7, 4, tono(PT, 0.72));
  L.poly([[15, 70], [23, 70], [24, 74], [14, 74]], BOTA);
  L.poly([[25, 70], [33, 70], [34, 74], [24, 74]], BOTA);
  L.rect(16, 71, 5, 1, BOTA_L); L.rect(27, 71, 5, 1, BOTA_L);
}

/**
 * RENDIDO: de rodillas. Los muslos bajan cortos hasta las rodillas apoyadas y
 * los pies quedan doblados hacia atrás, asomando a los costados: sin eso se
 * leía como alguien parado y bajito.
 */
function piernasRendido(L, R) {
  const PT = R.pant;
  L.poly([[17, 65], [24, 65], [25, 73], [16, 73]], PT);
  L.poly([[25, 65], [32, 65], [33, 73], [24, 73]], tono(PT, 0.85));
  L.rect(16, 72, 17, 3, tono(PT, 0.68));            // las rodillas, apoyadas
  // Los pies doblados atrás asoman A LOS COSTADOS del saco: si no, un guardia
  // de saco largo se leía como alguien parado y bajito.
  L.poly([[7, 72], [17, 72], [17, 75], [6, 75]], BOTA);
  L.poly([[32, 72], [42, 72], [43, 75], [32, 75]], BOTA);
  L.rect(9, 73, 5, 1, BOTA_L); L.rect(35, 73, 5, 1, BOTA_L);
}

/**
 * El pañuelo blanco del que se rinde, colgando de la mano levantada. Va al
 * costado y por debajo del ala del sombrero, que si no lo tapa entero.
 */
export function panueloBlanco(L, g) {
  L.poly([[4 + g, 18], [12 + g, 17], [13 + g, 24], [3 + g, 23]], '#e4ddcc');
  L.rect(4 + g, 17, 8, 1, '#f4f0e4');
  L.rect(6 + g, 23, 5, 2, '#c8c0ae');
}

function torsoFrente(L, R, o, g, f) {
  const d = g * 2, [C0, CL, CS] = R.chal, [M0, ML, MS] = R.manga;
  if (R.capa) capa(L, R.capa, f, false);
  // Los brazos: el de la izquierda entero; el otro, girado, casi tapado.
  if (!o.manosArriba) {
    L.poly([[9 + g, 33], [14 + g, 32], [14 + g, 53 + f.mI], [9 + g, 54 + f.mI]], M0);
    L.rect(10 + g, 34, 3, 1, ML); L.rect(11 + g, 38, 1, 8 + Math.min(0, f.mI), MS);
  }
  if (!o.arma && !o.manosArriba) {
    if (g) L.poly([[33, 33], [36, 34], [36, 53 + f.mD], [33, 52]], MS);
    else L.poly([[34, 32], [39, 33], [39, 54 + f.mD], [34, 53 + f.mD]], MS);
  }
  if (R.saco) {
    L.poly([[12 + g, 32], [36 - g, 32], [35 - g, 57], [13 + g, 57]], C0);
    L.sobre(12, 32, 25, 26, [C0], CS, 10);
    L.rect(14 + g, 34, 2, 20, CL);
    L.poly([[20 + d, 32], [24 + d, 40], [28 + d, 32]], R.cuello === 'corbata' ? BLANCA : CS);
    L.rect(24 + d, 40, 1, 17, CS);
    if (R.cuello === 'corbata') {
      L.rect(23 + d, 33, 2, 6, CORBATA);
      for (const by of [45, 51]) L.rect(26 + d, by, 2, 2, R.botones);
    } else {
      if (R.botones) for (const by of [42, 47, 52]) { L.rect(21 + d, by, 2, 2, R.botones); L.rect(26 + d, by, 2, 2, R.botones); }
      L.rect(13 + g, 54, 23 - 2 * g, 2, '#2a2018');
    }
  } else {
    L.poly([[13 + g, 32], [35 - g, 32], [34 - g, 55], [14 + g, 55]], C0);
    L.sobre(13, 32, 23, 24, [C0], CS, 14);
    L.rect(15 + g, 34, 2, 19, CL);
    L.poly([[20 + d, 33], [28 + d, 33], [27 + d, 55], [21 + d, 55]], CAM);
    L.rect(21 + d, 35, 1, 19, CAM_L); L.rect(26 + d, 35, 1, 19, CAM_S);
    for (const by of [38, 44, 50]) L.rect(24 + d, by, 1, 1, OJO_B);
    L.rect(28 + d, 35, 1, 20, CS);
    L.rect(14 + g, 53, 20 - g, 3, CINTO); L.rect(22 + d, 53, 5, 3, LATON); L.rect(23 + d, 54, 3, 1, CINTO);
  }
  if (R.extras) R.extras(L, g ? 'diagF' : 'frente', o);
  if (o.mochila) correasDeMochila(L, g);
  if (R.funda) {
    L.poly([[31 - g, 55], [36 - g, 55], [35 - g, 64], [32 - g, 64]], FUNDA);
    L.poly([[32 - g, 49], [36 - g, 49], [37 - g, 55], [33 - g, 55]], CULATA); L.rect(33 - g, 50, 2, 1, CULATA_L);
  }
  // Una mano que sube viene hacia adelante: se ve un poco más grande.
  const mano = (x, m, c) => L.elipse(x, 56 + m, m <= -4 ? 2.5 : 2, 3, c);
  if (o.manosArriba) brazosArriba(L, R, g);
  else {
    mano(11 + g + (f.mI <= -4 ? 1 : 0), f.mI, PIEL);
    if (!o.arma) mano((g ? 35 : 37) - (f.mD <= -4 ? 1 : 0), f.mD, PIEL_S);
  }
  L.rect(21 + d, 29, 7, 4, PIEL_S);
  if (R.cuello === 'panuelo') {
    const pr = R.panueloColor || PAN_R;
    const ps = R.panueloColor ? tono(pr, 0.72) : PAN_RS;
    const pl = R.panueloColor ? tono(pr, 1.2) : PAN_RL;
    L.poly(corrido([[16, 31], [32, 31], [31, 34], [25, 42], [23, 42], [17, 34]], d), pr);
    L.rect(24 + d, 34, 1, 7, ps); L.rect(20 + d, 32, 1, 4, ps); L.rect(28 + d, 32, 1, 4, ps);
    L.rect(18 + d, 31, 6, 1, pl);
  } else if (R.cuello === 'corbata') L.rect(19 + d, 30, 11, 2, BLANCA);
  else L.rect(18 + d, 30, 13, 3, CS);
  // Apuntando: de frente el caño viene hacia la cámara; girado, en diagonal.
  if (o.arma) {
    if (g) apuntar(L, R, [33, 34], [40, 44], [0.7, 0.7], 6);
    else apuntar(L, R, [34, 34], [30, 44], [0, 1], 3);
  }
}

export function frente(L, o = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo], g = o.g || 0, f = cuadroFrente(o);
  const a = o.asomado || { dx: 0, dy: 0 };
  // Sentado y rendido cambian las piernas y bajan el cuerpo; el resto es igual.
  // Asomado, las piernas acompañan un poco: el cuerpo se inclina, no se parte.
  const quieto = piernasDePostura(mover(L, Math.round(a.dx / 3), 0), R, o, g, f, false);
  // Asomado: los pies quedan clavados en el reparo y sale el cuerpo.
  const U = mover(L, a.dx, (quieto ? quieto.baja : f.y) + a.dy);
  const cuadro = quieto ? CAMINATA[0] : f;
  torsoFrente(U, R, { ...o, manosArriba: (quieto && quieto.rendido) || o.manosArriba }, g, cuadro);
  if (o.panuelo) panueloBlanco(U, g);
  L.rigido(() => { cabezaFrente(U, o, g); sombrero(U, R.sombrero, g, false); });
}

/**
 * Las piernas según la postura. Devuelve `null` si está de pie (y entonces
 * mandan los cuadros de la caminata), o cuánto baja el cuerpo si no.
 */
function piernasDePostura(L, R, o, g, f, atras) {
  if (o.postura === 'rendido') { piernasRendido(L, R); return { baja: 14, rendido: true }; }
  if (o.postura === 'sentado') { piernasSentado(L, R); return { baja: 6, rendido: false }; }
  piernasFrente(L, R, g, f, atras);
  return null;
}

export function espalda(L, o = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo], g = o.g || 0, f = cuadroFrente(o);
  const [C0, CL, CS] = R.chal, [M0, , MS] = R.manga;
  const a = o.asomado || { dx: 0, dy: 0 };
  const quieto = piernasDePostura(mover(L, Math.round(a.dx / 3), 0), R, o, g, f, true);
  /**
   * 🐛 ARREGLADO: ESTA LÍNEA REVENTABA EL JUEGO. Decía `f = CAMINATA[0]`, y `f`
   * es una constante — asignarle algo tira "Assignment to constant variable" y
   * se corta el cuadro entero. Nunca había saltado porque hasta ahora NADIE se
   * dibujaba de espaldas y sentado: los pasajeros sentados miran a la cámara y
   * los caídos usan otro dibujo. El primero fue el JINETE de la etapa 5, que se
   * da vuelta cuando el caballo gira para el lado de las vías — o sea que el
   * juego se tildaba al apretar W.
   *
   * La vista de frente ya lo hacía bien (`const cuadro = quieto ? ... : f`), así
   * que ésta hace lo mismo: quieto, las piernas no llevan cuadro de caminata.
   */
  if (quieto) o = { ...o, manosArriba: quieto.rendido || o.manosArriba };
  const cuadro = quieto ? CAMINATA[0] : f;
  const U = mover(L, a.dx, (quieto ? quieto.baja : cuadro.y) + a.dy);
  if (R.capa) capa(U, R.capa, cuadro, true);
  if (!o.manosArriba) {
    if (g) U.poly([[12, 34], [15, 33], [15, 52], [12, 53 + cuadro.mI]], MS);
    else U.poly([[9, 33], [14, 32], [14, 53], [9, 54 + cuadro.mI]], MS);
    if (!o.arma) U.poly([[34 - g, 32], [39 - g, 33], [39 - g, 54 + cuadro.mD], [34 - g, 53]], M0);
  }
  const largo = R.saco ? 57 : 55;
  U.poly([[13 + g, 32], [35 - g, 32], [34 - g, largo], [14 + g, largo]], C0);
  U.sobre(13, 32, 23, 26, [C0], CS, 14);
  U.rect(24 + g, 33, 1, largo - 34, CS); U.rect(31 - g, 34, 2, 19, CL);
  if (!R.saco) U.rect(14 + g, 53, 20 - g, 3, CINTO);
  else U.rect(14 + g, 45, 20 - 2 * g, 2, CS);
  if (R.extras) R.extras(U, 'espalda', o);
  if (o.mochila) mochilaDetras(U, o.mochila);
  if (R.funda) {
    U.poly([[12 + g, 55], [17 + g, 55], [16 + g, 64], [13 + g, 64]], FUNDA);
    U.poly([[12 + g, 49], [16 + g, 49], [16 + g, 55], [11 + g, 55]], CULATA);
  }
  if (o.manosArriba) brazosArriba(U, R, g);
  else {
    U.elipse(g ? 13 : 11, 56 + cuadro.mI, 2, 3, PIEL_S);
    if (!o.arma) U.elipse(37 - g, 56 + cuadro.mD, 2, 3, PIEL);
  }
  L.rigido(() => cabezaEspalda(U, o, g));
  if (R.cuello === 'panuelo') {
    const pr = R.panueloColor || PAN_R;
    const ps = R.panueloColor ? tono(pr, 0.72) : PAN_RS;
    U.poly([[17, 30], [31, 30], [30, 33], [18, 33]], pr);
    U.rect(22, 32, 4, 3, ps);
    // Las puntas del nudo, que se mueven con el rebote.
    const v = Math.round((cuadro.mI - cuadro.mD) / 3);
    U.poly([[23, 34], [26, 34], [27 - v, 42 - Math.max(0, -cuadro.y)], [24, 38], [21 - v, 42 - Math.max(0, -cuadro.y)]], pr);
  } else if (R.cuello === 'corbata') U.rect(19, 29, 11, 3, BLANCA);
  else U.rect(18, 29, 13, 4, CS);
  // Apuntando de espaldas: el brazo se va para arriba, al costado de la cabeza.
  if (o.arma) {
    if (g) apuntar(U, R, [33, 33], [39, 27], [0.6, -0.8], 6);
    else apuntar(U, R, [34, 33], [35, 25], [0, -1], 5);
  }
  if (o.panuelo) panueloBlanco(U, g);
  L.rigido(() => sombrero(U, R.sombrero, g, true));
}
