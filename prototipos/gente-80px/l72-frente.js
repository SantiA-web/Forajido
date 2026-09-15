// Lámina 72 px, parte 2: de frente, tres cuartos y de espaldas (caminar, trotar, agacharse).

/**
 * Qué hace el cuerpo en cada cuadro, visto de frente o de espaldas.
 * aI/aD: cuánto sube cada pie. tI/tD: si ese pie va 'adelante' (rodilla arriba) o 'atras' (patada).
 * mI/mD: cuánto baja (+) o sube (−) cada mano. y: rebote del cuerpo (+ abajo).
 * I y D son izquierda y derecha DE LA IMAGEN.
 */
const CAMINATA_FRENTE = [
  { aI: 0, aD: 0, mI: 0, mD: 0, y: 0 },
  { aI: 3, aD: 0, mI: 2, mD: -2, y: -1 },
  { aI: 0, aD: 3, mI: -2, mD: 2, y: -1 },
  { aI: 1, aD: 0, mI: 1, mD: -1, y: 0 },
  { aI: 0, aD: 1, mI: -1, mD: 1, y: 0 },
];
/** El trote: contacto, bajada, paso y vuelo (los dos pies en el aire); después, lo mismo con la otra pierna. */
const TROTE_FRENTE_VIEJO = [
  { aI: 0, aD: 1, mI: 1, mD: -6, y: 1 },
  { aI: 0, aD: 5, tD: 'atras', mI: 0, mD: -4, y: 2 },
  { aI: 0, aD: 6, tD: 'adelante', mI: -4, mD: 0, y: 0 },
  { aI: 3, aD: 4, tD: 'adelante', mI: -6, mD: 1, y: -2 },
];
/** Los 8 cuadros: los 4 de una pierna y los mismos con la otra. */
const espejarTrote = (t4) => t4.concat(t4.map((f) => ({ aI: f.aD, aD: f.aI, tI: f.tD, tD: f.tI, mI: f.mD, mD: f.mI, y: f.y })));
const TROTE_FRENTE_V = espejarTrote(TROTE_FRENTE_VIEJO);
/**
 * EL INTENTO DE PISADA CORTA (descartado: parecía saltar a dos pies). Pisaba 2 cuadros de 4;
 * los otros 2 son en el aire. Menos tiempo en el piso = menos tiempo patinando.
 */
const TROTE_FRENTE_SALTO = espejarTrote([
  { aI: 0, aD: 4, tD: 'atras', mI: 1, mD: -6, y: 1 },
  { aI: 0, aD: 6, tD: 'adelante', mI: -2, mD: -3, y: 2 },
  { aI: 3, tI: 'atras', aD: 5, tD: 'adelante', mI: -5, mD: 0, y: -1 },
  { aI: 5, tI: 'atras', aD: 3, tD: 'adelante', mI: -6, mD: 1, y: -2 },
]);

/**
 * LA PISADA NUEVA: contacto, apoyo, EMPUJE y vuelo corto. La pierna de atrás no se
 * encoge: se queda estirada empujando (apenas el talón arriba) hasta despegar.
 */
const TROTE_FRENTE = espejarTrote([
  { aI: 0, aD: 3, tD: 'atras', mI: 1, mD: -6, y: 1 },
  { aI: 0, aD: 6, tD: 'adelante', mI: -2, mD: -3, y: 2 },
  { aI: 1, tI: 'atras', aD: 5, tD: 'adelante', mI: -5, mD: 0, y: 0 },
  { aI: 3, tI: 'atras', aD: 2, tD: 'adelante', mI: -6, mD: 1, y: -1 },
]);

function cuadroFrente(o) {
  if (o.trote != null) return (PISADA === 'vieja' ? TROTE_FRENTE_V : TROTE_FRENTE)[o.trote];
  const f = CAMINATA_FRENTE[o.paso || 0];
  // Agachado: el cuerpo baja 5 y las rodillas se abren.
  return o.agachado ? { ...f, y: f.y + 5, abre: 1 } : f;
}

function piernasFrente(L, R, g, f, atras) {
  const PT = R.pant, c1 = atras ? tono(PT, 0.8) : PT, c2 = atras ? PT : tono(PT, 0.8);
  const top = 55 + Math.min(0, f.y), ab = f.abre || 0;
  const xi = 15 + g - ab, xd = 25 + ab;
  const pierna = (x, a, t, col, der) => {
    // Una patada para atrás, vista de frente, se esconde detrás del muslo: más oscura.
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

function torsoFrente(L, R, o, g, f) {
  const d = g * 2, [C0, CL, CS] = R.chal, [M0, ML, MS] = R.manga;
  // Los brazos: el de la izquierda entero; el otro, girado, casi tapado.
  L.poly([[9 + g, 33], [14 + g, 32], [14 + g, 53 + f.mI], [9 + g, 54 + f.mI]], M0);
  L.rect(10 + g, 34, 3, 1, ML); L.rect(11 + g, 38, 1, 8 + Math.min(0, f.mI), MS);
  if (!o.arma) {
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
      for (const by of [42, 47, 52]) { L.rect(21 + d, by, 2, 2, R.botones); L.rect(26 + d, by, 2, 2, R.botones); }
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
  if (R.funda) {
    L.poly([[31 - g, 55], [36 - g, 55], [35 - g, 64], [32 - g, 64]], FUNDA);
    L.poly([[32 - g, 49], [36 - g, 49], [37 - g, 55], [33 - g, 55]], CULATA); L.rect(33 - g, 50, 2, 1, CULATA_L);
  }
  // Una mano que sube viene hacia adelante: se ve un poco más grande.
  const mano = (x, m, c) => L.elipse(x, 56 + m, m <= -4 ? 2.5 : 2, m <= -4 ? 3 : 3, c);
  mano(11 + g + (f.mI <= -4 ? 1 : 0), f.mI, PIEL);
  if (!o.arma) mano((g ? 35 : 37) - (f.mD <= -4 ? 1 : 0), f.mD, PIEL_S);
  L.rect(21 + d, 29, 7, 4, PIEL_S);
  if (R.cuello === 'panuelo') {
    L.poly(corrido([[16, 31], [32, 31], [31, 34], [25, 42], [23, 42], [17, 34]], d), PAN_R);
    L.rect(24 + d, 34, 1, 7, PAN_RS); L.rect(20 + d, 32, 1, 4, PAN_RS); L.rect(28 + d, 32, 1, 4, PAN_RS);
    L.rect(18 + d, 31, 6, 1, PAN_RL);
  } else if (R.cuello === 'corbata') L.rect(19 + d, 30, 11, 2, BLANCA);
  else L.rect(18 + d, 30, 13, 3, CS);
  // Apuntando: de frente el caño viene hacia la cámara; girado, en diagonal.
  if (o.arma) {
    if (g) apuntar(L, R, [33, 34], [40, 44], [0.7, 0.7], 6);
    else apuntar(L, R, [34, 34], [30, 44], [0, 1], 3);
  }
}

function frente(L, o = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo], g = o.g || 0, f = cuadroFrente(o);
  piernasFrente(L, R, g, f, false);
  const U = mover(L, 0, f.y);
  torsoFrente(U, R, o, g, f);
  L.rigido(() => { cabezaFrente(U, o, g); sombrero(U, R.sombrero, g, false); });
}

function espalda(L, o = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo], g = o.g || 0, f = cuadroFrente(o);
  const [C0, CL, CS] = R.chal, [M0, , MS] = R.manga;
  piernasFrente(L, R, g, f, true);
  const U = mover(L, 0, f.y);
  if (g) U.poly([[12, 34], [15, 33], [15, 52], [12, 53 + f.mI]], MS);
  else U.poly([[9, 33], [14, 32], [14, 53], [9, 54 + f.mI]], MS);
  if (!o.arma) U.poly([[34 - g, 32], [39 - g, 33], [39 - g, 54 + f.mD], [34 - g, 53]], M0);
  const largo = R.saco ? 57 : 55;
  U.poly([[13 + g, 32], [35 - g, 32], [34 - g, largo], [14 + g, largo]], C0);
  U.sobre(13, 32, 23, 26, [C0], CS, 14);
  U.rect(24 + g, 33, 1, largo - 34, CS); U.rect(31 - g, 34, 2, 19, CL);
  if (!R.saco) U.rect(14 + g, 53, 20 - g, 3, CINTO);
  else U.rect(14 + g, 45, 20 - 2 * g, 2, CS);
  if (R.funda) {
    U.poly([[12 + g, 55], [17 + g, 55], [16 + g, 64], [13 + g, 64]], FUNDA);
    U.poly([[12 + g, 49], [16 + g, 49], [16 + g, 55], [11 + g, 55]], CULATA);
  }
  U.elipse(g ? 13 : 11, 56 + f.mI, 2, 3, PIEL_S); if (!o.arma) U.elipse(37 - g, 56 + f.mD, 2, 3, PIEL);
  L.rigido(() => cabezaEspalda(U, o, g));
  if (R.cuello === 'panuelo') {
    U.poly([[17, 30], [31, 30], [30, 33], [18, 33]], PAN_R);
    U.rect(22, 32, 4, 3, PAN_RS);
    // Las puntas del nudo, que se mueven con el rebote.
    const v = Math.round((f.mI - f.mD) / 3);
    U.poly([[23, 34], [26, 34], [27 - v, 42 - Math.max(0, -f.y)], [24, 38], [21 - v, 42 - Math.max(0, -f.y)]], PAN_R);
  } else if (R.cuello === 'corbata') U.rect(19, 29, 11, 3, BLANCA);
  else U.rect(18, 29, 13, 4, CS);
  // Apuntando de espaldas: el brazo se va para arriba, al costado de la cabeza.
  if (o.arma) {
    if (g) apuntar(U, R, [33, 33], [39, 27], [0.6, -0.8], 6);
    else apuntar(U, R, [34, 33], [35, 25], [0, -1], 5);
  }
  L.rigido(() => sombrero(U, R.sombrero, g, true));
}
