/**
 * LA GENTE, PARTE 4: de costado.
 *
 * Es la vista que más cuesta y la que más se ve: el jugador cruza el vagón a lo
 * largo. Tiene pecho y espalda con forma, hombro redondo, el hombro de atrás
 * asomando sobre el pecho y la rodilla que se dobla; sin eso el cuerpo parecía
 * una tabla.
 */
import {
  ROPA, tono, mover, tramo, apuntar, rifle, sombreroLado,
  OJO_B, PIEL, PIEL_O, PIEL_S, CAM, CAM_L, CAM_S, PAN_R, PAN_RL, PAN_RS,
  BOTA, BOTA_L, ESPUELA, CINTO, FUNDA, CULATA, CULATA_L, LATON, BLANCA, CORBATA,
} from './dibujo.js';
import { cabezaLado } from './cabezas.js';

/** Una pierna en dos tramos (muslo y canilla), con la rodilla redonda. */
function pierna(L, cad, rod, tob, c) {
  tramo(L, cad, rod, 3.5, c);
  L.elipse(rod[0], rod[1], 3, 3, c);
  tramo(L, rod, tob, 2.7, c);
}

/** La bota mira hacia adelante. `talon` = el pie que empuja, con el talón arriba. */
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

// Cada pierna: [cadera, rodilla, tobillo, talón arriba]. bC/bL: [codo, muñeca]
// del brazo cercano y del lejano. y = cuánto baja el cuerpo; f = el pañuelo.
function caminataLado(paso) {
  const POSES = [
    { cerca: [[24, 56], [24, 63], [24, 71], 0], lejos: [[22, 56], [22, 63], [21, 71], 0] },
    { cerca: [[25, 57], [28, 64], [31, 71], 0], lejos: [[22, 57], [19, 64], [15, 70], 1] },
    { cerca: [[24, 57], [20, 64], [16, 70], 1], lejos: [[23, 57], [26, 64], [29, 71], 0] },
  ];
  const medio = (a, b) => [0, 1, 2].map((i) => [(a[i][0] + b[i][0]) / 2, (a[i][1] + b[i][1]) / 2]).concat([0]);
  const mitad = (a, b) => ({ cerca: medio(a.cerca, b.cerca), lejos: medio(a.lejos, b.lejos) });
  POSES.push(mitad(POSES[0], POSES[1]), mitad(POSES[0], POSES[2]));
  const p = POSES[paso % POSES.length];
  const s = [0, -4, 4, -2, 2][paso % 5];
  return {
    ...p, y: paso === 1 || paso === 2 ? 1 : 0, f: [0, -1, 1, 0, 0][paso % 5],
    bC: [[24 + s * 0.5, 44], [24 + s, 52]], bL: [[21 - s * 0.5, 44], [21 - s, 52]],
  };
}

/**
 * EL TROTE: contacto adelante, apoyo con la rodilla cargada, EMPUJE con la
 * pierna de atrás estirada (punta en el piso) y un vuelo corto. El pie apoyado
 * se corre 18 puntos para atrás mientras el cuerpo avanza, que es lo que hace
 * que no se vea patinar.
 */
const corre = (p, dx) => [[p[0][0] + dx, p[0][1]], [p[1][0] + dx, p[1][1]], [p[2][0] + dx, p[2][1]], p[3]];
const correB = (b, dx) => b.map(([x, y]) => [x + dx, y]);
const completarTrote = (t4) => t4.concat(t4.map((t) => ({
  cerca: corre(t.lejos, 2), lejos: corre(t.cerca, -2), bC: correB(t.bL, 3), bL: correB(t.bC, -3), y: t.y, f: -t.f,
})));
const TROTE = completarTrote([
  { cerca: [[25, 57], [28, 63], [32, 71], 0], lejos: [[22, 57], [19, 62], [16, 66], 1], y: 1, f: 0,
    bC: [[18, 42], [21, 49]], bL: [[26, 41], [30, 35]] },
  { cerca: [[24, 58], [25, 64], [24, 71], 0], lejos: [[23, 58], [24, 62], [18, 64], 1], y: 2, f: 1,
    bC: [[21, 44], [25, 50]], bL: [[22, 43], [27, 45]] },
  { cerca: [[24, 56], [20, 63], [14, 70], 1], lejos: [[24, 56], [30, 59], [28, 66], 0], y: 0, f: -1,
    bC: [[26, 42], [31, 38]], bL: [[17, 42], [19, 49]] },
  { cerca: [[23, 54], [19, 61], [13, 66], 1], lejos: [[25, 54], [31, 60], [33, 67], 0], y: -1, f: -2,
    bC: [[28, 41], [32, 35]], bL: [[16, 42], [19, 49]] },
]);

/** Agachado: la caminata con las caderas 5 más abajo y las rodillas adelante. */
function agachadoLado(paso) {
  const c = caminataLado(paso);
  const baja = (p) => [[p[0][0], p[0][1] + 5], [p[1][0] + 3, p[1][1] + 3], p[2], p[3]];
  return { ...c, cerca: baja(c.cerca), lejos: baja(c.lejos), y: c.y + 5, dx: 1 };
}

/** SENTADO de costado: el muslo sale hacia adelante y la canilla baja. */
function piernasSentadoLado(L, R) {
  const PT = R.pant;
  tramo(L, [21, 60], [29, 60], 3.2, tono(PT, 0.7));
  tramo(L, [29, 61], [29, 69], 2.6, tono(PT, 0.65));
  botaLado(L, [29, 70], '#22180f', false, false);
  tramo(L, [21, 62], [32, 62], 4, PT);
  L.elipse(32, 62, 3.5, 3.5, PT);
  tramo(L, [32, 63], [32, 70], 3, tono(PT, 0.88));
  botaLado(L, [32, 71], BOTA, false, R.espuela);
}

/**
 * MONTADO de costado. 🔻 *(Santi: "el jinete está horrible. Es como que
 * agarraste el que está en el tren y lo pegaste encima del caballo")*. Tenía
 * razón, era literal: iba con `postura: 'sentado'`, la misma que usa un
 * pasajero en el banco del vagón.
 *
 * Y un pasajero no se parece en nada a un jinete. Sentado en un banco las
 * rodillas van JUNTAS Y ADELANTE y los pies apoyan en el piso. A caballo se va
 * A HORCAJADAS: el muslo cae por el costado del animal, la canilla queda casi
 * vertical y —lo que más lo delata— EL TALÓN VA ABAJO y la punta arriba,
 * porque el pie empuja contra el estribo.
 *
 * La pierna de allá casi no se dibuja: la tapa el caballo. Sólo asoma el muslo.
 */
function piernasMontadoLado(L, R) {
  const PT = R.pant;
  tramo(L, [21, 58], [26, 64], 3.2, tono(PT, 0.55));
  tramo(L, [22, 58], [32, 65], 4.4, PT);
  L.elipse(32, 65, 3.4, 3.4, tono(PT, 1.15));
  tramo(L, [32, 66], [30, 73], 3.2, tono(PT, 0.68));
  botaLado(L, [30, 74], BOTA, false, R.espuela);
}

/** RENDIDO de costado: de rodillas, con la pierna doblada hacia atrás. */
function piernasRendidoLado(L, R) {
  const PT = R.pant;
  tramo(L, [22, 65], [24, 73], 3.4, tono(PT, 0.7));
  tramo(L, [24, 73], [15, 74], 2.8, tono(PT, 0.65));
  tramo(L, [23, 66], [26, 74], 3.6, PT);
  L.elipse(26, 74, 3, 2.5, PT);
  tramo(L, [26, 74], [16, 74], 2.8, tono(PT, 0.88));
  botaLado(L, [14, 73], BOTA, true, R.espuela);
}

export function lado(L, o = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo];
  const [C0, CL, CS] = R.chal, [M0, ML, MS] = R.manga, PT = R.pant;
  // Sentado y rendido cambian las piernas y bajan el cuerpo; el resto es igual.
  const postura = o.postura === 'sentado' || o.postura === 'rendido' || o.postura === 'montado'
    ? o.postura : null;
  if (postura === 'rendido') o = { ...o, manosArriba: true };
  const P0 = postura ? caminataLado(0)
    : o.trote != null ? TROTE[o.trote % TROTE.length]
      : o.agachado ? agachadoLado(o.paso || 0) : caminataLado(o.paso || 0);
  // Asomado: los pies quedan clavados en el reparo y sale el cuerpo.
  const a = o.asomado || { dx: 0, dy: 0 };
  const baja = postura === 'rendido' ? 14 : postura ? 6 : P0.y;
  const U = mover(L, (P0.dx || 0) + a.dx, baja + a.dy);
  const P = P0;

  /**
   * LOS BRAZOS DEL JINETE VAN A LAS RIENDAS *(Santi: "debería… sujetar un par
   * de riendas básicas")*. Iban con la pose de CAMINAR: colgando al costado,
   * balanceándose. Y una rienda que sale de una mano que cuelga no ata nada —
   * era una cuerda flotando al lado del jinete.
   *
   * Ahora los dos codos bajan pegados al cuerpo y las dos manos quedan juntas
   * adelante, arriba de la cruz, que es donde van las de cualquiera que lleve
   * un caballo. De ahí salen las riendas (ver `mano` en figura.js).
   */
  const B = postura === 'montado'
    ? { bC: [[27, 42], [33, 46]], bL: [[25, 42], [31, 47]] }
    : P;

  // Asomado, las piernas acompañan un poco: el cuerpo se inclina, no se parte.
  const LP = a.dx ? mover(L, Math.round(a.dx / 3), 0) : L;

  // Lo de atrás, en sombra: la pierna y el brazo lejanos.
  if (postura === 'rendido') piernasRendidoLado(LP, R);
  else if (postura === 'montado') piernasMontadoLado(LP, R);
  else if (postura === 'sentado') piernasSentadoLado(LP, R);
  else {
    pierna(LP, P.lejos[0], P.lejos[1], P.lejos[2], tono(PT, 0.7));
    botaLado(LP, P.lejos[2], '#22180f', P.lejos[3], false);
  }
  if (o.manosArriba) { tramo(U, [21, 33], [19, 19], 2.6, MS); U.elipse(19, 17, 2.5, 2.5, PIEL_O); }
  else brazoLado(U, [21, 34], B.bL[0], B.bL[1], MS, null, PIEL_O);
  // La mochila va detrás del cuerpo: asoma por la espalda.
  if (o.mochila) {
    const h = 10 + o.mochila * 2;
    U.rect(12, 36, 7, h, '#6a4a2a');
    U.rect(12, 36, 7, 2, '#8a6440');
    U.rect(18, 38, 2, h - 6, '#54381f');
  }
  if (R.capa) {
    const v = Math.round(P.f * 2);
    U.poly([[17, 33], [26, 33], [22 + v, 58], [14 + v, 60], [15, 45]], R.capa);
    U.sobre(13, 33, 16, 28, [R.capa], tono(R.capa, 0.75), 30);
  }

  // El torso: pecho adelante, espalda un poco curva.
  const largo = R.saco ? 58 : 55;
  U.poly([[17, 32], [28, 32], [31, 36], [31, largo - 5], [30, largo], [16, largo], [15, 44], [16, 36]], C0);
  U.sobre(15, 32, 17, 27, [C0], CS, 14);
  U.rect(16, 34, 2, largo - 36, CS);
  U.sobre(15, largo - 6, 17, 6, [C0], CS, 45);
  if (R.saco) {
    U.rect(29, 34, 1, largo - 35, CS); U.rect(26, 34, 1, largo - 40, CL);
    if (R.cuello === 'corbata') { U.rect(29, 33, 2, 9, BLANCA); U.rect(30, 34, 1, 6, CORBATA); }
    if (R.botones) for (const by of [40, 46, 52]) U.rect(30, by, 1, 2, R.botones);
    if (R.cuello !== 'corbata') U.rect(15, 52, 17, 2, '#2a2018');
  } else {
    // El chaleco abierto deja ver la camisa por delante.
    U.poly([[27, 33], [30, 35], [31, 50], [30, 53], [27, 53]], CAM);
    U.rect(27, 34, 1, 19, CAM_S); U.rect(29, 36, 1, 12, CAM_L); U.rect(26, 33, 1, 19, CL);
    U.rect(29, 38, 1, 1, OJO_B); U.rect(30, 45, 1, 1, OJO_B);
    U.rect(16, 53, 15, 3, CINTO); U.rect(29, 53, 2, 3, LATON);
  }
  // El hombro de atrás asoma arriba del pecho: sin esto el cuerpo es una tabla.
  U.poly([[25, 32], [29, 32], [31, 35], [28, 37], [25, 35]], MS);
  if (R.extras) R.extras(U, 'lado', o);

  // La pierna cercana
  if (!postura) {
    pierna(LP, P.cerca[0], P.cerca[1], P.cerca[2], PT);
    LP.sobre(8, 52, 32, 23, [PT], tono(PT, 0.86), 12);
    LP.rect(P.cerca[1][0], P.cerca[1][1] - 2, 2, 2, tono(PT, 1.15));
    botaLado(LP, P.cerca[2], BOTA, P.cerca[3], R.espuela);
  }
  if (R.funda) {
    U.poly([[21, 55], [26, 55], [25, 64], [22, 64]], FUNDA);
    U.poly([[22, 49], [26, 48], [27, 55], [23, 55]], CULATA); U.rect(23, 50, 2, 1, CULATA_L);
  }

  // El cuello y lo que lleva
  U.rect(21, 29, 6, 4, PIEL_S);
  if (R.cuello === 'panuelo') {
    const pr = R.panueloColor || PAN_R;
    const ps = R.panueloColor ? tono(pr, 0.72) : PAN_RS;
    const pl = R.panueloColor ? tono(pr, 1.2) : PAN_RL;
    U.poly([[18, 31], [30, 31], [31, 34], [19, 34]], pr);
    U.rect(19, 31, 8, 1, pl);
    U.poly([[25, 33], [32, 33], [29, 40]], pr); U.rect(28, 35, 1, 3, ps);
    // Las dos puntas del nudo flamean para atrás: finitas y separadas, como tela.
    const f = P.f;
    U.rect(17, 31, 3, 3, ps);
    U.poly([[18, 31], [11, 28 + f], [13, 31 + f], [18, 33]], pr);
    U.poly([[18, 33], [10, 36 - f], [13, 34 - f], [18, 34]], ps);
  } else if (R.cuello === 'corbata') U.rect(20, 30, 10, 2, BLANCA);
  else U.rect(19, 30, 11, 3, CS);

  // El brazo cercano, o el que apunta.
  if (o.manosArriba) {
    tramo(U, [24, 33], [22, 19], 2.6, M0);
    U.elipse(22, 17, 2.5, 2.5, PIEL);
  } else if (o.arma === 'rifle') {
    // Cruzado sobre las piernas, apuntando un poco para arriba: derecho se
    // hundía entero detrás del pescuezo del caballo.
    rifle(U, R, [23, 35], [16, 49], [26, 35], [29, 46], [0.974, -0.225]);
  } else if (o.arma === 'rifleListo') {
    /**
     * Al hombro: la culata contra el hombro y la cara sobre la caja. Va **a la
     * altura del mentón** (y 33) y no del pecho: más abajo lo tapa el pescuezo
     * del animal, que se dibuja después. Ocho unidades de diferencia con la
     * pose cruzada — eso es el aviso.
     */
    rifle(U, R, [24, 34], [25, 33], [25, 35], [38, 33], [1, 0]);
  } else if (o.arma) {
    apuntar(U, R, [24, 34], [37, 38], [1, 0], 9);
  } else {
    // El hombro de adelante, redondo y con luz arriba.
    U.elipse(23.5, 35, 3.5, 3, MS); U.elipse(24, 35, 3, 2.5, M0); U.rect(22, 33, 3, 1, ML);
    brazoLado(U, [24, 34], B.bC[0], B.bC[1], M0, MS, PIEL);
  }

  // El pañuelo blanco del que se rinde, en la mano levantada.
  if (o.panuelo) { U.rect(19, 14, 6, 5, '#e4ddcc'); U.rect(19, 14, 6, 1, '#f4f0e4'); }

  L.rigido(() => { cabezaLado(U, o); sombreroLado(U, R.sombrero); });
}
