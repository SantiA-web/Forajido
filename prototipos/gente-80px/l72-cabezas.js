// Lámina 72 px, parte 4: LAS CABEZAS A LA MEDIDA NUEVA (piernas opción 1).
//
// Con las piernas largas la cabeza pasó de 19 a 15 filas. Achicarla deformando
// borraba filas: el ala tapaba los ojos y bigote, boca y mentón quedaban pegados.
// Estas cabezas están dibujadas de nuevo a 15 filas (de la 12 a la 27) y reemplazan
// a las de l72-base.js. Cejas y ojos quedan igual que antes (filas 16 a 19);
// lo que se acomodó es de la nariz para abajo.

function cabezaFrente(L, o, g = 0) {
  const R = ROPA[o.tipo], d = g * 3;
  L.elipse(16 + g, 19, 1.5, 2.5, PIEL_S);
  if (!g) L.elipse(32, 19, 1.5, 2.5, PIEL_S);
  L.elipse(24 + g, 19.5, 7, 7.5, PIEL);
  L.sobre(16, 12, 18, 4, [PIEL], PIEL_O);
  L.sobre(16, 16, 18, 1, [PIEL], PIEL_S);
  L.sobre(28 + g * 2, 17, 6, 9, [PIEL], PIEL_S);
  L.rect(17 + g, 15, 2, 6, PELO); if (!g) L.rect(30, 15, 2, 6, PELO);
  if (R.barba) L.sobre(17, 20, 16, 8, [PIEL, PIEL_S], R.barba, R.barbaP);
  cejasYOjos(L, 19 + d, 4, o.estado, true);
  cejasYOjos(L, 26 + d, g ? 3 : 4, o.estado, false);
  // Nariz corta (3 filas), bigote, boca y mentón, sin pisarse.
  L.rect(23 + d, 18, 1, 3, PIEL_L); L.rect(24 + d, 19, 2, 2, PIEL_S);
  L.rect(22 + d, 21, 2, 1, PIEL_O); L.rect(25 + d, 21, 2, 1, PIEL_O);
  const big = R.bigote === 'grande'
    ? [[19, 22], [30, 22], [31, 25], [28, 24], [24, 23], [20, 24], [17, 25]]
    : [[20, 22], [28, 22], [29, 24], [24, 23], [19, 24]];
  L.poly(corrido(big, d), BIGOTE);
  if (o.estado === 'alerta') { L.rect(21 + d, 24, 7, 2, '#3a1a12'); L.rect(22 + d, 24, 5, 1, '#cfc4ae'); }
  else if (o.estado === 'sospecha') { L.rect(22 + d, 24, 5, 1, '#4a2418'); L.rect(27 + d, 23, 1, 1, '#4a2418'); }
  else L.rect(21 + d, 24, 7, 1, '#4a2418');
  L.sobre(17, 26, 16, 2, [PIEL, PIEL_S, R.barba].filter(Boolean), PIEL_O);
}

function cabezaEspalda(L, o, g = 0) {
  const R = ROPA[o.tipo];
  L.rect(21, 25, 7, 4, PIEL_S);
  if (!g) L.elipse(16, 19, 1.5, 2.5, PIEL_S);
  L.elipse(32, 19, 1.5, 2.5, PIEL_S);
  if (g) {
    // Girado: asoma la mejilla, con la barba, del lado de adelante.
    L.poly([[27, 15], [32, 17], [32, 24], [28, 26]], PIEL);
    L.sobre(27, 15, 6, 3, [PIEL], PIEL_O);
    if (R.barba) L.sobre(27, 20, 6, 7, [PIEL], R.barba, R.barbaP + 20);
    L.rect(31, 21, 2, 2, BIGOTE);
  }
  L.elipse(24 - g * 2, 19.5, 7, 7, PELO);
  for (const [mx, largo] of [[19, 6], [22, 7], [25, 7], [28, 5]]) L.rect(mx - g * 2, 17, 1, largo, '#3a2a1e');
  L.rect(18 - g * 2, 25, 13, 1, '#3a2a1e');
  L.rect(20 - g, 25, 9, 2, PIEL_S);
}

function cabezaLado(L, o) {
  const R = ROPA[o.tipo];
  L.elipse(23, 19.5, 7, 7.5, PIEL);
  L.poly([[29, 17], [31, 19], [31, 21], [29, 21]], PIEL);
  L.rect(30, 20, 1, 1, PIEL_S);
  L.sobre(16, 12, 17, 4, [PIEL], PIEL_O); L.sobre(16, 16, 17, 1, [PIEL], PIEL_S);
  L.sobre(19, 21, 4, 5, [PIEL], PIEL_S);
  L.poly([[16, 13], [21, 13], [21, 15], [19, 23], [16, 22]], PELO);
  L.elipse(21, 19, 1.5, 2, PIEL_S); L.rect(21, 18, 1, 2, PIEL_O);
  L.rect(23, 15, 1, 5, PELO);
  if (R.barba) {
    L.sobre(17, 20, 15, 8, [PIEL, PIEL_S], R.barba, R.barbaP);
    L.poly([[22, 23], [29, 23], [29, 26], [23, 27]], tono(R.barba, 1.05));
  }
  const alerta = o.estado === 'alerta', duda = o.estado === 'sospecha';
  if (alerta) { L.rect(25, 15, 2, 1, PELO); L.rect(27, 16, 3, 1, PELO); L.rect(27, 18, 2, 1, OJO_B); L.rect(28, 18, 1, 1, NEGRO); }
  else {
    L.rect(26, duda ? 15 : 16, 4, 1, PELO);
    L.rect(27, 17, 2, 2, OJO_B); L.rect(28, 17, 1, 2, NEGRO);
  }
  L.rect(26, 19, 3, 1, PIEL_S);
  L.rect(25, 20, 2, 1, PIEL_L);
  L.poly(R.bigote === 'grande' ? [[25, 21], [31, 21], [31, 23], [27, 23], [25, 25]] : [[26, 21], [31, 21], [30, 22], [26, 22]], BIGOTE);
  if (alerta) L.rect(28, 23, 3, 1, '#cfc4ae'); else L.rect(28, 24, 2, 1, '#4a2418');
  L.sobre(17, 26, 14, 2, [PIEL, PIEL_S, R.barba].filter(Boolean), PIEL_O);
}
