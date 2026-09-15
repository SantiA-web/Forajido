// Lámina 72 px, parte 3: de costado (caminar, trotar, agacharse).

/** Un tramo grueso de a hasta b, con el ancho medido de costado a la línea (sirve en cualquier ángulo). */
function tramo(L, a, b, w, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, px = -dy / n * w, py = dx / n * w;
  L.poly([[a[0] + px, a[1] + py], [b[0] + px, b[1] + py], [b[0] - px, b[1] - py], [a[0] - px, a[1] - py]], col);
}

/** Una pierna en dos tramos (muslo y canilla), con la rodilla redonda. */
function pierna(L, cad, rod, tob, c) {
  tramo(L, cad, rod, 3.5, c);
  L.elipse(rod[0], rod[1], 3, 3, c);
  tramo(L, rod, tob, 2.7, c);
}

/** La bota mira hacia adelante (a la derecha). `talon` = el pie que empuja, con el talón arriba. */
function botaLado(L, [x, y], c, talon, espuela) {
  if (talon) {
    L.poly([[x - 3, y - 3], [x + 3, y - 3], [x + 6, y + 3], [x + 6, y + 4], [x - 1, y + 3], [x - 4, y]], c);
    if (espuela) L.rect(x - 6, y, 2, 1, ESPUELA);
  } else {
    L.poly([[x - 3, y - 3], [x + 3, y - 3], [x + 3, y], [x + 7, y + 1], [x + 7, y + 3], [x - 4, y + 3], [x - 4, y]], c);
    if (espuela) L.rect(x - 6, y + 2, 2, 1, ESPUELA);
  }
  L.rect(x - 3, y - 2, 3, 1, BOTA_L);
}

/** Un brazo: hombro, codo y muñeca. Con `borde`, lleva una línea oscura detrás. */
function brazoLado(L, hombro, codo, muneca, c, borde, mano) {
  if (borde) {
    tramo(L, [hombro[0] - 1, hombro[1]], [codo[0] - 1, codo[1]], 3, borde);
    tramo(L, [codo[0] - 1, codo[1]], [muneca[0] - 1, muneca[1]], 2.5, borde);
  }
  tramo(L, hombro, codo, 3, c);
  L.elipse(codo[0], codo[1], 2.5, 2.5, c);
  tramo(L, codo, muneca, 2.5, c);
  const k = 2.5 / (Math.hypot(muneca[0] - codo[0], muneca[1] - codo[1]) || 1);
  L.elipse(muneca[0] + (muneca[0] - codo[0]) * k, muneca[1] + (muneca[1] - codo[1]) * k, 2, 2.5, mano);
}

/**
 * El brazo que apunta con el revólver, igual para todas las vistas: del hombro a la
 * mano, y el caño hacia `dir`. Con el caño corto (hacia la cámara) se ve la boca.
 */
function apuntar(L, R, hombro, mano, dir, largo) {
  const [M0, ML, MS] = R.manga;
  tramo(L, [hombro[0], hombro[1] + 1], [mano[0], mano[1] + 1], 3, MS);
  tramo(L, hombro, mano, 2.6, M0);
  L.rect(Math.round((hombro[0] + mano[0]) / 2), Math.round((hombro[1] + mano[1]) / 2) - 1, 2, 1, ML);
  L.rect(mano[0] - 1, mano[1] + 1, 2, 3, CULATA);
  L.elipse(mano[0], mano[1], 2, 2, PIEL);
  const tambor = [mano[0] + dir[0] * 2, mano[1] + dir[1] * 2];
  if (largo <= 3) {
    L.elipse(tambor[0], tambor[1], 2, 2, '#4a443e');
    L.rect(tambor[0], tambor[1], 1, 1, NEGRO);
    return;
  }
  const fin = [mano[0] + dir[0] * largo, mano[1] + dir[1] * largo];
  L.elipse(tambor[0], tambor[1], 2, 2, '#3a342e');
  tramo(L, tambor, fin, 1.2, '#4a443e');
  L.rect(fin[0], fin[1], 1, 1, '#8a8278');
}

// ------------------------------------------------------------ los cuadros
// Cada pierna: [cadera, rodilla, tobillo, talón arriba]. bC/bL: [codo, muñeca] del brazo cercano/lejano.
// y = cuánto baja el cuerpo; f = cómo flamean las puntas del pañuelo.
function caminataLado(paso) {
  const POSES = [
    { cerca: [[24, 56], [24, 63], [24, 71], 0], lejos: [[22, 56], [22, 63], [21, 71], 0] },
    { cerca: [[25, 57], [28, 64], [31, 71], 0], lejos: [[22, 57], [19, 64], [15, 70], 1] },
    { cerca: [[24, 57], [20, 64], [16, 70], 1], lejos: [[23, 57], [26, 64], [29, 71], 0] },
  ];
  const medio = (a, b) => [0, 1, 2].map((i) => [(a[i][0] + b[i][0]) / 2, (a[i][1] + b[i][1]) / 2]).concat([0]);
  const mitad = (a, b) => ({ cerca: medio(a.cerca, b.cerca), lejos: medio(a.lejos, b.lejos) });
  POSES.push(mitad(POSES[0], POSES[1]), mitad(POSES[0], POSES[2]));
  const s = [0, -4, 4, -2, 2][paso];
  return {
    ...POSES[paso], y: paso === 1 || paso === 2 ? 1 : 0, f: [0, -1, 1, 0, 0][paso],
    bC: [[24 + s * 0.5, 44], [24 + s, 52]], bL: [[21 - s * 0.5, 44], [21 - s, 52]],
  };
}

/** El trote: contacto, bajada, paso, vuelo (los dos pies en el aire). Brazos doblados que bombean. */
const TROTE_LADO_VIEJO = [
  { cerca: [[25, 57], [29, 63], [32, 70], 0], lejos: [[22, 57], [18, 63], [13, 68], 1], y: 1, f: 0,
    bC: [[18, 42], [21, 49]], bL: [[26, 41], [30, 35]] },
  { cerca: [[24, 58], [27, 64], [24, 71], 0], lejos: [[22, 58], [18, 63], [12, 61], 1], y: 2, f: 1,
    bC: [[19, 43], [23, 50]], bL: [[24, 43], [29, 40]] },
  { cerca: [[24, 56], [24, 63], [22, 71], 1], lejos: [[23, 56], [30, 59], [26, 66], 0], y: 0, f: -1,
    bC: [[26, 43], [31, 40]], bL: [[17, 43], [20, 50]] },
  { cerca: [[23, 54], [19, 60], [14, 65], 1], lejos: [[25, 54], [31, 58], [32, 65], 0], y: -2, f: -2,
    bC: [[28, 41], [32, 35]], bL: [[16, 42], [19, 49]] },
];
{
  // La segunda mitad es la primera con las piernas y los brazos cambiados de lado.
  const corre = (p, dx) => [[p[0][0] + dx, p[0][1]], [p[1][0] + dx, p[1][1]], [p[2][0] + dx, p[2][1]], p[3]];
  const correB = (b, dx) => b.map(([x, y]) => [x + dx, y]);
  var completarTrote = (t4) => t4.concat(t4.map((t) => ({
    cerca: corre(t.lejos, 2), lejos: corre(t.cerca, -2), bC: correB(t.bL, 3), bL: correB(t.bC, -3), y: t.y, f: -t.f,
  })));
}
const TROTE_LADO_V = completarTrote(TROTE_LADO_VIEJO);

/**
 * EL INTENTO DE PISADA CORTA (descartado: encogía la pierna de atrás y parecía saltar a dos pies).
 * Antes el pie apoyado pisaba 3 cuadros de 4 y se corría 10 pixeles para atrás:
 * mientras avanzabas 15 unidades, él recorría 2,8 y el resto se veía patinar.
 * Ahora pisa 2 cuadros (contacto adelante, apoyo atrás empujando) y se corre 14
 * pixeles: mientras avanzás 10, recorre 3,9. Los otros 2 cuadros van en el aire.
 */
const TROTE_LADO_SALTO = completarTrote([
  { cerca: [[25, 57], [29, 63], [31, 71], 0], lejos: [[22, 57], [18, 62], [13, 64], 1], y: 1, f: 0,
    bC: [[18, 42], [21, 49]], bL: [[26, 41], [30, 35]] },
  { cerca: [[24, 58], [23, 64], [17, 71], 1], lejos: [[23, 58], [29, 60], [27, 67], 0], y: 2, f: 1,
    bC: [[26, 43], [31, 40]], bL: [[17, 43], [20, 50]] },
  { cerca: [[23, 54], [19, 60], [13, 65], 1], lejos: [[25, 54], [31, 58], [33, 64], 0], y: -1, f: -1,
    bC: [[28, 41], [32, 35]], bL: [[16, 42], [19, 49]] },
  { cerca: [[23, 53], [20, 60], [15, 62], 1], lejos: [[25, 53], [31, 59], [33, 67], 0], y: -2, f: -2,
    bC: [[27, 42], [31, 37]], bL: [[17, 42], [20, 49]] },
]);

/** Agachado: la caminata con las caderas 5 más abajo y las rodillas adelante. */
function agachadoLado(paso) {
  const c = caminataLado(paso);
  const baja = (p) => [[p[0][0], p[0][1] + 5], [p[1][0] + 3, p[1][1] + 3], p[2], p[3]];
  return { ...c, cerca: baja(c.cerca), lejos: baja(c.lejos), y: c.y + 5, dx: 1 };
}

/**
 * LA PISADA NUEVA: contacto adelante, apoyo con la rodilla cargada, EMPUJE con la
 * pierna de atrás estirada (punta en el piso) y un vuelo corto. El pie apoyado se
 * corre 18 pixeles para atrás en 3 cuadros, y con las piernas largas eso crece.
 */
const TROTE_LADO = completarTrote([
  { cerca: [[25, 57], [28, 63], [32, 71], 0], lejos: [[22, 57], [19, 62], [16, 66], 1], y: 1, f: 0,
    bC: [[18, 42], [21, 49]], bL: [[26, 41], [30, 35]] },
  { cerca: [[24, 58], [25, 64], [24, 71], 0], lejos: [[23, 58], [24, 62], [18, 64], 1], y: 2, f: 1,
    bC: [[21, 44], [25, 50]], bL: [[22, 43], [27, 45]] },
  { cerca: [[24, 56], [20, 63], [14, 70], 1], lejos: [[24, 56], [30, 59], [28, 66], 0], y: 0, f: -1,
    bC: [[26, 42], [31, 38]], bL: [[17, 42], [19, 49]] },
  { cerca: [[23, 54], [19, 61], [13, 66], 1], lejos: [[25, 54], [31, 60], [33, 67], 0], y: -1, f: -2,
    bC: [[28, 41], [32, 35]], bL: [[16, 42], [19, 49]] },
]);

// ---------------------------------------------------------------- dibujo
function lado(L, o = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo];
  const [C0, CL, CS] = R.chal, [M0, ML, MS] = R.manga, PT = R.pant;
  const P0 = o.trote != null ? (PISADA === 'vieja' ? TROTE_LADO_V : TROTE_LADO)[o.trote] : o.agachado ? agachadoLado(o.paso || 0) : caminataLado(o.paso || 0);
  // Piernas más largas = zancada más larga: rodilla y tobillo se abren desde la cadera
  // (lo vertical ya lo estira la deformación).
  const kl = (o.piernas || 19) / 19;
  const abre = (p) => [p[0], [p[0][0] + (p[1][0] - p[0][0]) * kl, p[1][1]], [p[0][0] + (p[2][0] - p[0][0]) * kl, p[2][1]], p[3]];
  const P = { ...P0, cerca: abre(P0.cerca), lejos: abre(P0.lejos) };
  const U = mover(L, P.dx || 0, P.y);

  // Lo de atrás, en sombra: la pierna y el brazo lejanos.
  pierna(L, P.lejos[0], P.lejos[1], P.lejos[2], tono(PT, 0.7));
  botaLado(L, P.lejos[2], '#22180f', P.lejos[3], false);
  brazoLado(U, [21, 34], P.bL[0], P.bL[1], MS, null, PIEL_O);

  // El torso: pecho adelante, espalda un poco curva.
  const largo = R.saco ? 58 : 55;
  U.poly([[17, 32], [28, 32], [31, 36], [31, largo - 5], [30, largo], [16, largo], [15, 44], [16, 36]], C0);
  U.sobre(15, 32, 17, 27, [C0], CS, 14);
  U.rect(16, 34, 2, largo - 36, CS);
  U.sobre(15, largo - 6, 17, 6, [C0], CS, 45);
  if (R.saco) {
    U.rect(29, 34, 1, largo - 35, CS); U.rect(26, 34, 1, largo - 40, CL);
    if (R.cuello === 'corbata') { U.rect(29, 33, 2, 9, BLANCA); U.rect(30, 34, 1, 6, CORBATA); }
    for (const by of [40, 46, 52]) U.rect(30, by, 1, 2, R.botones);
    if (R.cuello !== 'corbata') U.rect(15, 52, 17, 2, '#2a2018');
  } else {
    U.poly([[27, 33], [30, 35], [31, 50], [30, 53], [27, 53]], CAM);
    U.rect(27, 34, 1, 19, CAM_S); U.rect(29, 36, 1, 12, CAM_L); U.rect(26, 33, 1, 19, CL);
    U.rect(29, 38, 1, 1, OJO_B); U.rect(30, 45, 1, 1, OJO_B);
    U.rect(16, 53, 15, 3, CINTO); U.rect(29, 53, 2, 3, LATON);
  }
  U.poly([[25, 32], [29, 32], [31, 35], [28, 37], [25, 35]], MS);

  // La pierna cercana
  pierna(L, P.cerca[0], P.cerca[1], P.cerca[2], PT);
  L.sobre(8, 52, 32, 23, [PT], tono(PT, 0.86), 12);
  L.rect(P.cerca[1][0], P.cerca[1][1] - 2, 2, 2, tono(PT, 1.15));
  botaLado(L, P.cerca[2], BOTA, P.cerca[3], R.espuela);
  if (R.funda) {
    U.poly([[21, 55], [26, 55], [25, 64], [22, 64]], FUNDA);
    U.poly([[22, 49], [26, 48], [27, 55], [23, 55]], CULATA); U.rect(23, 50, 2, 1, CULATA_L);
  }

  // El cuello y lo que lleva
  U.rect(21, 29, 6, 4, PIEL_S);
  if (R.cuello === 'panuelo') {
    U.poly([[18, 31], [30, 31], [31, 34], [19, 34]], PAN_R);
    U.rect(19, 31, 8, 1, PAN_RL);
    U.poly([[25, 33], [32, 33], [29, 40]], PAN_R); U.rect(28, 35, 1, 3, PAN_RS);
    const f = P.f;
    U.rect(17, 31, 3, 3, PAN_RS);
    U.poly([[18, 31], [11, 28 + f], [13, 31 + f], [18, 33]], PAN_R);
    U.poly([[18, 33], [10, 36 - f], [13, 34 - f], [18, 34]], PAN_RS);
  } else if (R.cuello === 'corbata') U.rect(20, 30, 10, 2, BLANCA);
  else U.rect(19, 30, 11, 3, CS);

  // El brazo cercano (o apuntando, si te vio).
  if (o.arma) {
    apuntar(U, R, [24, 34], [37, 38], [1, 0], 9);
  } else {
    U.elipse(23.5, 35, 3.5, 3, MS); U.elipse(24, 35, 3, 2.5, M0); U.rect(22, 33, 3, 1, ML);
    brazoLado(U, [24, 34], P.bC[0], P.bC[1], M0, MS, PIEL);
  }

  L.rigido(() => { cabezaLado(U, o); sombreroLado(U, R.sombrero); });
}
