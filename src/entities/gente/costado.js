/**
 * LA GENTE, PARTE 4: de costado.
 *
 * Es la vista que más cuesta y la que más se ve: el jugador cruza el vagón a lo
 * largo. Tiene pecho y espalda con forma, hombro redondo, el hombro de atrás
 * asomando sobre el pecho y la rodilla que se dobla; sin eso el cuerpo parecía
 * una tabla.
 */
import {
  ROPA, tono, mover, tramo, apuntar, rifle, armaLarga, medidasLarga, sombreroLado, deformar, armaApuntada,
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

/**
 * 🦵 AGAZAPADO: el que va arriba del tren *(Santi: "el jugador debería ir
 * agachado ya. Parado corriendo te deberías caer sí o sí")*. El `agachado`
 * de siempre baja la cadera 5 puntos y de costado casi no se distingue de
 * parado; arriba tiene que leerse de un vistazo, porque el cartel le pega al
 * agachado y sólo cuerpo a tierra se pasa. Acá la cadera baja 12, las rodillas
 * van bien adelante (el muslo casi horizontal), las canillas vuelven a los
 * pies, y los brazos van adelante y abajo, haciendo equilibrio. Camina en
 * pasitos cortos.
 */
function agazapadoLado(paso) {
  const s = [0, -3, 3, -1.5, 1.5][paso % 5];
  const sube = [0, 1, 0, 0, 1][paso % 5];        // el pie que avanza se levanta un poco
  return {
    // Las rodillas asoman bien por delante del saco: es lo que dice "agachado".
    cerca: [[24, 67], [37 + s, 62], [30 + s * 1.6, 71 - sube], 0],
    lejos: [[22, 67], [34 - s, 62], [26 - s * 1.6, 71 - (1 - sube)], 0],
    y: 12, dx: 1, f: [0, -1, 1, 0, 0][paso % 5],
    // Los antebrazos adelante, a la altura de la cintura: haciendo equilibrio.
    bC: [[31, 43], [37 + s * 0.3, 46]], bL: [[29, 43], [35 - s * 0.3, 46]],
  };
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
      : o.agazapado ? agazapadoLado(o.paso || 0)
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
    // Agazapado, la funda no puede pasar de los pies: va más corta.
    if (o.agazapado) U.poly([[21, 55], [26, 55], [25, 58], [22, 58]], FUNDA);
    else U.poly([[21, 55], [26, 55], [25, 64], [22, 64]], FUNDA);
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
  } else if (armaLarga(o.arma) && !armaLarga(o.arma).listo) {
    // Cruzado sobre las piernas, apuntando un poco para arriba: derecho se
    // hundía entero detrás del pescuezo del caballo.
    rifle(U, R, [23, 35], [16, 49], [26, 35], [29, 46], [0.974, -0.225], ...medidasLarga(o.arma));
  } else if ((armaLarga(o.arma) || {}).listo) {
    /**
     * Al hombro: la culata contra el hombro y la cara sobre la caja. Va **a la
     * altura del mentón** (y 33) y no del pecho: más abajo lo tapa el pescuezo
     * del animal, que se dibuja después. Ocho unidades de diferencia con la
     * pose cruzada — eso es el aviso.
     */
    const al = armaLarga(o.arma);
    if (al.cadera) rifle(U, R, [24, 34], [23, 45], [25, 36], [33, 43], [0.97, -0.24], ...medidasLarga(o.arma));
    // El Winchester sube a la altura de la cara: la culata al hombro y la
    // mejilla sobre la caja (la cabeza baja, más abajo).
    else if (al.mira) rifle(U, R, [24, 34], [26, 30], [25, 35], [38, 30], [1, 0], ...medidasLarga(o.arma));
    else rifle(U, R, [24, 34], [25, 33], [25, 35], [38, 33], [1, 0], ...medidasLarga(o.arma));
  } else if (o.arma && o.armaDir == null) {
    apuntar(U, R, [24, 34], [37, 38], [1, 0], 9);
  } else {
    // El hombro de adelante, redondo y con luz arriba.
    U.elipse(23.5, 35, 3.5, 3, MS); U.elipse(24, 35, 3, 2.5, M0); U.rect(22, 33, 3, 1, ML);
    brazoLado(U, [24, 34], B.bC[0], B.bC[1], M0, MS, PIEL);
  }

  // El pañuelo blanco del que se rinde, en la mano levantada.
  if (o.panuelo) { U.rect(19, 14, 6, 5, '#e4ddcc'); U.rect(19, 14, 6, 1, '#f4f0e4'); }

  /**
   * 🎯 CON EL WINCHESTER APUNTANDO, LA CABEZA BAJA SOBRE EL ARMA *(Santi: "al
   * apuntar tenga la cabeza más sobre el arma (su ojo más cerca)")*: adelante
   * y abajo, el ojo en la mira. La escopeta no: se tira desde la cadera.
   */
  const conMira = (armaLarga(o.arma) || {}).mira && armaLarga(o.arma).listo;
  const H = conMira ? mover(U, 2, 3) : U;
  L.rigido(() => { cabezaLado(H, o); sombreroLado(H, R.sombrero); });
  // Ver la nota en `frente`: con ángulo, el brazo va por delante de la cabeza.
  if (o.arma === true && o.armaDir != null) apuntar(U, R, [24, 34], [37, 38], [1, 0], 9, o.armaDir);
}

// ------------------------------------------------------------ el esqueleto

/**
 * 🦴 EL ESQUELETO DE COSTADO — etapa E1 *(Santi: "el esqueleto lo quiero usar
 * para todo: caminar, portar arma, disparar, correr, saltar, agachado,
 * cubrirse, apuntar"; arranca sólo con el jugador)*.
 *
 * Por qué: el dibujo de costado tenía brazos y piernas articulados, pero el
 * torso, la cabeza y la ropa eran piezas fijas, siempre derechas. Para echarse
 * adelante se las EMPUJABA de costado (un corte en diagonal, "deformar"): de
 * ahí el agazapado torcido. Y acostarlas no se podía, por eso el cuerpo a
 * tierra se dibujó aparte, a mano, y quedó como manchas.
 *
 * Acá se suman tres huesos que GIRAN de verdad, y cada prenda va pegada al
 * suyo:
 *
 *   raíz    todo el cuerpo, alrededor de un punto (para acostarse o caerse)
 *   torso   desde la cadera: chaleco, camisa, cinto, funda, pañuelo, brazos
 *   cabeza  desde el cuello: la cara y el sombrero
 *
 * Brazos y piernas ya eran huesos (hombro, codo, mano; cadera, rodilla,
 * tobillo) y quedan colgados del torso y de la raíz.
 *
 * CÓMO SE DIBUJA GIRADO SIN QUE SE VEA BORROSO: no se gira una imagen. Cada
 * pieza se vuelve a pintar punto por punto en su lugar nuevo (el lienzo pasa
 * cada coordenada por la cuenta del hueso antes de pintar), así que sigue
 * siendo pixel art limpio, con el mismo borde.
 *
 * Con los huesos derechos sale el mismo dibujo que "lado": así se comprobó
 * que no se perdía nada antes de agregar posturas nuevas.
 */

/** Un giro de 'a' radianes alrededor de (cx, cy). */
function girar(cx, cy, a) {
  if (!a) return (p) => p;
  const c = Math.cos(a), s = Math.sin(a);
  return ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

/**
 * Las cuentas de cada hueso: de la coordenada del dibujo (la de "lado") a la
 * del lienzo. 'huesos' = { torso, cabeza, raiz: { x, y, ang } }, en radianes;
 * 'cuerpo' = { dx, baja } (lo que el cuerpo se corre y baja en esta pose).
 */
export function huesosDeLado(huesos = {}, cuerpo = { dx: 0, baja: 0 }, piernasDx = 0) {
  /**
   * 🔁 LAS INCLINACIONES CHICAS VAN CORTADAS EN DIAGONAL, NO GIRADAS *(Santi:
   * "cuando está agachado dentro del tren se ve un poco borroso")*. Un giro
   * chico vuelve a pintar cada línea con escalones irregulares, y de lejos se
   * lee como borroso. El corte en diagonal de siempre (`deformar`) deja las
   * filas derechas. Para agacharse, trotar y galopar va 'inclina'; girar
   * (`torso`) queda para las posturas grandes.
   */
  const D = deformar(huesos.inclina || 0);
  const corteCabeza = D(24, 20)[0] - 24;
  const { dx, baja } = cuerpo;
  const [hx, hy] = D(23 + dx, 56 + baja);
  // La raíz gira todo el cuerpo (por defecto desde la cadera) y después lo corre.
  const R0 = huesos.raiz;
  const giroRaiz = R0 ? girar(R0.x ?? hx, R0.y ?? hy, R0.ang || 0) : null;
  const raiz = R0 ? (p) => { const [x, y] = giroRaiz(p); return [x + (R0.dx || 0), y + (R0.dy || 0)]; } : (p) => p;
  const torso = girar(hx, hy, huesos.torso || 0);
  // La cabeza no se estira con las proporciones: sólo se corre (como "rigido").
  // Gira desde el cuello, y con el torso.
  const cabeza = girar(24 + dx, 29 + baja, huesos.cabeza || 0);
  return {
    cuerpo: (x, y) => raiz(torso(D(x + dx, y + baja))),
    cabeza: (x, y, mx = 0, my = 0) => raiz(torso(cabeza([x + dx + mx + corteCabeza, y + baja + my]))),
    // Las piernas no se cortan: la diagonal empieza en la cadera.
    piernas: (x, y) => raiz(D(x + piernasDx, y)),
  };
}

/**
 * 🦵 LAS PIERNAS MÁS FINAS *(Santi: "hacer la zona de la pantorrilla y la
 * canilla más chica al igual que las botas, para que se vea más limpio el
 * dibujo")*. Tres grosores para elegir (`CONFIG.esqueleto.piernas`): 0 el de
 * siempre, 1 y 2 más finos. El muslo no cambia.
 */
export const FINAS = [
  { canilla: 2.7, rodilla: 3, bota: 1 },
  { canilla: 2.2, rodilla: 2.6, bota: 0.86 },
  { canilla: 1.9, rodilla: 2.3, bota: 0.76 },
];

export function piernaFina(L, cad, rod, tob, c, F) {
  tramo(L, cad, rod, 3.5, c);
  L.elipse(rod[0], rod[1], F.rodilla, F.rodilla, c);
  tramo(L, rod, tob, F.canilla, c);
}

/** La bota de siempre, achicada desde la suela (si no, quedaría flotando). */
function botaFina(L, [x, y], c, talon, espuela, F) {
  if (F.bota === 1) return botaLado(L, [x, y], c, talon, espuela);
  const k = F.bota, sx = x, sy = y + 3;
  const P = ([px, py]) => [sx + (px - sx) * k, sy + (py - sy) * k];
  botaLado({
    poly: (pts, col) => L.poly(pts.map(P), col),
    rect: (rx, ry, w, h, col) => { const [qx, qy] = P([rx, ry]); L.rect(qx, qy, Math.max(1, w * k), Math.max(1, h * k), col); },
  }, [x, y], c, talon, espuela);
}

/**
 * 🦵 AGAZAPADO DE VERDAD (E2): las piernas del agazapado de siempre, pero el
 * torso ahora se dobla desde la cadera (antes se cortaba en diagonal) y la
 * cabeza vuelve a mirar adelante. Los brazos cuelgan hacia adelante, para el
 * equilibrio.
 */
/**
 * Un brazo pensado EN EL MUNDO (para dónde va el brazo y para dónde el
 * antebrazo, como se ven en pantalla), pasado al marco del torso, que está
 * girado 'th'. Así un brazo "adelante" sigue adelante aunque el torso se doble.
 */
function brazoEnElMundo(th, hombro, haciaCodo, largo1, haciaMano, largo2) {
  const enTorso = ([x, y]) => [x * Math.cos(th) + y * Math.sin(th), -x * Math.sin(th) + y * Math.cos(th)];
  const unidad = (v) => { const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; };
  const a = enTorso(unidad(haciaCodo)), b = enTorso(unidad(haciaMano));
  const codo = [hombro[0] + a[0] * largo1, hombro[1] + a[1] * largo1];
  return [codo, [codo[0] + b[0] * largo2, codo[1] + b[1] * largo2]];
}

function agazapadoHuesos(paso) {
  const s = [0, -2.5, 2.5, -1.2, 1.2][paso % 5];
  const sube = [0, 1, 0, 0, 1][paso % 5];
  /**
   * 🔁 TRES VUELTAS HASTA LEERSE AGAZAPADO, y las tres enseñan algo:
   *  1. Con las piernas del agazapado viejo, las rodillas quedaban a la altura
   *     del pecho y el torso doblado las tapaba.
   *  2. Con una sentadilla de verdad seguía pareciendo "parado con piernas
   *     cortas": el brazo colgaba derecho (por la gravedad) y tapaba el frente
   *     del torso, así que el ojo veía una línea vertical.
   *  3. Con los brazos ADELANTE y doblados, haciendo equilibrio, se ve el
   *     torso doblado, y debajo los muslos y las rodillas. Ésa quedó.
   */
  const th = 0.68;
  return {
    cerca: [[21, 60], [37 + s, 62], [32 + s * 1.4, 71 - sube], 0],
    lejos: [[19, 60], [34 - s, 62.5], [28 - s * 1.4, 71 - (1 - sube)], 0],
    y: 4, dx: -3, f: [0, -1, 1, 0, 0][paso % 5],
    bC: brazoEnElMundo(th, [24, 34], [0.5, 0.87], 9, [1, 0.2 + s * 0.04], 8),
    bL: brazoEnElMundo(th, [21, 34], [0.45, 0.9], 9, [1, 0.3 - s * 0.04], 7),
    huesos: { torso: th, cabeza: -0.55 },
  };
}

/**
 * 🦵 CUERPO A TIERRA (E2): el cuerpo entero acostado boca abajo (la raíz gira
 * 87°: la cabeza queda adelante y los pies atrás), el pecho apenas levantado y
 * la cabeza arriba, mirando lo que viene. Se arrastra: un codo adelante y la
 * rodilla del otro lado encogida, y después al revés.
 *
 * Las poses se piensan con el cuerpo PARADO y después se acuestan: lo que en
 * la pose va "para arriba" termina hacia adelante, y lo que va "hacia el
 * frente" termina contra el piso.
 */
function tierraHuesos(paso) {
  const s = [0, -1, 1, -0.5, 0.5][paso % 5];
  // 🔁 Más grande *(Santi: "cuando está arrastrándose debería mover sus brazos
  // y piernas")*: la rodilla sube hasta la cintura y el pie se levanta atrás;
  // el brazo que avanza se estira entero y el otro tira, con el codo atrás.
  // (Pose parada que después se acuesta: "arriba" es adelante y "atrás" es
  // arriba. La rodilla avanza por el piso y el pie se levanta detrás.)
  const dobla = (b) => [[24, 56], [25 + 1.5 * b, 64 - 7 * b], [24 - 8 * b, 71 - 4 * b], 0];
  return {
    cerca: dobla(Math.max(0, s)), lejos: dobla(Math.max(0, -s)),
    y: 0, f: 0,
    bC: [[30, 37 + 3 * s], [31, 27 - 7 * s]], bL: [[29, 38 - 3 * s], [30, 29 + 7 * s]],
    huesos: { raiz: { ang: 1.52, dx: 4, dy: 17 }, torso: -0.12, cabeza: -1.1 },
  };
}

/**
 * 🕳️ CAYENDO AL ENGANCHE (E2): los brazos arriba, agitándose, y las piernas
 * encogidas. El cuerpo entero gira (`giro`, que manda la escena) punto por
 * punto, en vez de girar la imagen (que la dejaba borrosa).
 */
function cayendoHuesos(paso, giro) {
  const a = paso % 2 ? 1 : -1;
  return {
    cerca: [[24, 56], [30, 61], [27, 69], 0], lejos: [[22, 56], [18, 63], [16, 70], 1],
    y: 0, f: a,
    bC: [[29, 26 + a], [34, 18 - 2 * a]], bL: [[18, 27 - a], [14, 20 + 2 * a]],
    huesos: { raiz: { ang: giro || 0 }, torso: 0.1 },
  };
}

/**
 * EL MISMO DIBUJO DE "lado", CON HUESOS. 'usar(cuenta)' cambia la cuenta con
 * la que el lienzo pasa cada punto (ver figura.js), y antes de cada parte del
 * cuerpo se elige la de su hueso.
 */
export function ladoConHuesos(L, o = {}, usar, huesos = {}) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo];
  const [C0, CL, CS] = R.chal, [M0, ML, MS] = R.manga, PT = R.pant;
  const postura = o.postura === 'sentado' || o.postura === 'rendido' || o.postura === 'montado'
    ? o.postura : null;
  if (postura === 'rendido') o = { ...o, manosArriba: true };
  // 'o.pose' manda una pose armada a mano (sirve para probar variantes).
  const P0 = o.pose ? o.pose
    : o.postura === 'tierra' ? tierraHuesos(o.paso || 0)
    : o.postura === 'cayendo' ? cayendoHuesos(o.paso || 0, o.giro)
      : postura ? caminataLado(0)
        : o.trote != null ? TROTE[o.trote % TROTE.length]
          : o.agazapado ? agazapadoHuesos(o.paso || 0)
            : o.agachado ? agachadoLado(o.paso || 0) : caminataLado(o.paso || 0);
  const a = o.asomado || { dx: 0, dy: 0 };
  const baja = postura === 'rendido' ? 14 : postura ? 6 : P0.y;
  const P = P0;
  // Las posturas que traen sus propios huesos mandan sobre la inclinación de afuera.
  const H = huesosDeLado(P0.huesos ? { ...huesos, inclina: 0, ...P0.huesos } : huesos,
    { dx: (P0.dx || 0) + a.dx, baja: baja + a.dy }, a.dx ? Math.round(a.dx / 3) : 0);
  const F = FINAS[o.finas ?? 0] || FINAS[0];
  const cuerpo = () => usar(H.cuerpo);
  const piernas = () => usar(H.piernas);
  /**
   * 🎯 E3 · APUNTANDO A UN ÁNGULO (`o.armaDir`, de pantalla): el brazo del
   * arma va al final, en un marco que sólo corre hasta el hombro. Si se
   * dibujara en el del torso, agazapado (torso girado 0,68) el arma apuntaría
   * 39° más abajo que la mira.
   */
  const apunta = o.armaDir != null && (o.arma === true || !!armaLarga(o.arma)) && o.postura !== 'cayendo';
  // Con el revólver hacia adelante (no para atrás, corriendo), sin estar acostado
  // y sin caballo (a caballo esa mano lleva las riendas).
  const dosManos = apunta && o.arma === true && Math.cos(o.armaDir) > 0.2 && o.postura !== 'tierra' && o.postura !== 'montado';

  const B = postura === 'montado'
    ? { bC: [[27, 42], [33, 46]], bL: [[25, 42], [31, 47]] }
    : P;

  // Lo de atrás, en sombra: la pierna y el brazo lejanos.
  piernas();
  if (postura === 'rendido') piernasRendidoLado(L, R);
  else if (postura === 'montado') piernasMontadoLado(L, R);
  else if (postura === 'sentado') piernasSentadoLado(L, R);
  else {
    piernaFina(L, P.lejos[0], P.lejos[1], P.lejos[2], tono(PT, 0.7), F);
    botaFina(L, P.lejos[2], '#22180f', P.lejos[3], false, F);
  }
  cuerpo();
  if (o.manosArriba) { tramo(L, [21, 33], [19, 19], 2.6, MS); L.elipse(19, 17, 2.5, 2.5, PIEL_O); }
  // Con un arma larga apuntada, el brazo de allá va a la caña (lo pone `armaApuntada`).
  else if (apunta && armaLarga(o.arma)) { /* nada */ }
  else if (dosManos) {
    /**
     * 🎯 E3 · EL REVÓLVER CON LAS DOS MANOS, como de tres cuartos: la mano de
     * allá va debajo de la del arma. El brazo pasa por detrás del torso (se
     * dibuja antes) y asoma la mano. Se piensa en la pantalla, colgado del hombro.
     */
    const SL = H.cuerpo(21, 34), SA = H.cuerpo(24, 34);
    const M = [SA[0] + Math.cos(o.armaDir) * 14.5, SA[1] + Math.sin(o.armaDir) * 14.5 + 1];
    const C = [(SL[0] + M[0]) / 2, (SL[1] + M[1]) / 2 + 4];
    usar((x, y) => [x, y]);
    tramo(L, SL, C, 2.8, MS);
    L.elipse(C[0], C[1], 2.2, 2.2, MS);
    tramo(L, C, M, 2.4, MS);
    L.elipse(M[0], M[1] + 0.5, 2, 2.5, PIEL_O);
    cuerpo();
  } else brazoLado(L, [21, 34], B.bL[0], B.bL[1], MS, null, PIEL_O);
  if (o.mochila) {
    const h = 10 + o.mochila * 2;
    L.rect(12, 36, 7, h, '#6a4a2a');
    L.rect(12, 36, 7, 2, '#8a6440');
    L.rect(18, 38, 2, h - 6, '#54381f');
  }
  if (R.capa) {
    const v = Math.round(P.f * 2);
    L.poly([[17, 33], [26, 33], [22 + v, 58], [14 + v, 60], [15, 45]], R.capa);
    L.sobre(13, 33, 16, 28, [R.capa], tono(R.capa, 0.75), 30);
  }

  // El torso: pecho adelante, espalda un poco curva.
  const largo = R.saco ? 58 : 55;
  L.poly([[17, 32], [28, 32], [31, 36], [31, largo - 5], [30, largo], [16, largo], [15, 44], [16, 36]], C0);
  L.sobre(15, 32, 17, 27, [C0], CS, 14);
  L.rect(16, 34, 2, largo - 36, CS);
  L.sobre(15, largo - 6, 17, 6, [C0], CS, 45);
  if (R.saco) {
    L.rect(29, 34, 1, largo - 35, CS); L.rect(26, 34, 1, largo - 40, CL);
    if (R.cuello === 'corbata') { L.rect(29, 33, 2, 9, BLANCA); L.rect(30, 34, 1, 6, CORBATA); }
    if (R.botones) for (const by of [40, 46, 52]) L.rect(30, by, 1, 2, R.botones);
    if (R.cuello !== 'corbata') L.rect(15, 52, 17, 2, '#2a2018');
  } else {
    L.poly([[27, 33], [30, 35], [31, 50], [30, 53], [27, 53]], CAM);
    L.rect(27, 34, 1, 19, CAM_S); L.rect(29, 36, 1, 12, CAM_L); L.rect(26, 33, 1, 19, CL);
    L.rect(29, 38, 1, 1, OJO_B); L.rect(30, 45, 1, 1, OJO_B);
    L.rect(16, 53, 15, 3, CINTO); L.rect(29, 53, 2, 3, LATON);
  }
  L.poly([[25, 32], [29, 32], [31, 35], [28, 37], [25, 35]], MS);
  if (R.extras) R.extras(L, 'lado', o);

  // La pierna cercana
  if (!postura) {
    piernas();
    piernaFina(L, P.cerca[0], P.cerca[1], P.cerca[2], PT, F);
    L.sobre(8, 52, 32, 23, [PT], tono(PT, 0.86), 12);
    L.rect(P.cerca[1][0], P.cerca[1][1] - 2, 2, 2, tono(PT, 1.15));
    botaFina(L, P.cerca[2], BOTA, P.cerca[3], R.espuela, F);
  }
  cuerpo();
  if (R.funda) {
    if (o.agazapado) L.poly([[21, 55], [26, 55], [25, 58], [22, 58]], FUNDA);
    else L.poly([[21, 55], [26, 55], [25, 64], [22, 64]], FUNDA);
    L.poly([[22, 49], [26, 48], [27, 55], [23, 55]], CULATA); L.rect(23, 50, 2, 1, CULATA_L);
  }

  // El cuello y lo que lleva
  L.rect(21, 29, 6, 4, PIEL_S);
  if (R.cuello === 'panuelo') {
    const pr = R.panueloColor || PAN_R;
    const ps = R.panueloColor ? tono(pr, 0.72) : PAN_RS;
    const pl = R.panueloColor ? tono(pr, 1.2) : PAN_RL;
    L.poly([[18, 31], [30, 31], [31, 34], [19, 34]], pr);
    L.rect(19, 31, 8, 1, pl);
    L.poly([[25, 33], [32, 33], [29, 40]], pr); L.rect(28, 35, 1, 3, ps);
    const f = P.f;
    L.rect(17, 31, 3, 3, ps);
    L.poly([[18, 31], [11, 28 + f], [13, 31 + f], [18, 33]], pr);
    L.poly([[18, 33], [10, 36 - f], [13, 34 - f], [18, 34]], ps);
  } else if (R.cuello === 'corbata') L.rect(20, 30, 10, 2, BLANCA);
  else L.rect(19, 30, 11, 3, CS);

  // El brazo cercano, o el que apunta.
  if (o.manosArriba) {
    tramo(L, [24, 33], [22, 19], 2.6, M0);
    L.elipse(22, 17, 2.5, 2.5, PIEL);
  } else if (apunta) {
    // El hombro, y el brazo va al final (`armaApuntada`).
    L.elipse(23.5, 35, 3.5, 3, MS); L.elipse(24, 35, 3, 2.5, M0); L.rect(22, 33, 3, 1, ML);
  } else if (armaLarga(o.arma) && !armaLarga(o.arma).listo) {
    rifle(L, R, [23, 35], [16, 49], [26, 35], [29, 46], [0.974, -0.225], ...medidasLarga(o.arma));
  } else if ((armaLarga(o.arma) || {}).listo) {
    const al = armaLarga(o.arma);
    if (al.cadera) rifle(L, R, [24, 34], [23, 45], [25, 36], [33, 43], [0.97, -0.24], ...medidasLarga(o.arma));
    else if (al.mira) rifle(L, R, [24, 34], [26, 30], [25, 35], [38, 30], [1, 0], ...medidasLarga(o.arma));
    else rifle(L, R, [24, 34], [25, 33], [25, 35], [38, 33], [1, 0], ...medidasLarga(o.arma));
  } else if (o.arma && o.armaDir == null && o.postura !== 'tierra' && o.postura !== 'cayendo') {
    apuntar(L, R, [24, 34], [37, 38], [1, 0], 9);
  } else {
    L.elipse(23.5, 35, 3.5, 3, MS); L.elipse(24, 35, 3, 2.5, M0); L.rect(22, 33, 3, 1, ML);
    brazoLado(L, [24, 34], B.bC[0], B.bC[1], M0, MS, PIEL);
  }

  if (o.panuelo) { L.rect(19, 14, 6, 5, '#e4ddcc'); L.rect(19, 14, 6, 1, '#f4f0e4'); }

  // La cabeza y el sombrero, en su hueso: no se estiran, sólo se corren y giran.
  const conMira = (armaLarga(o.arma) || {}).mira && armaLarga(o.arma).listo;
  let [mx, my] = conMira ? [2, 3] : [0, 0];
  /**
   * 🎯 LA VISTA VA CON EL ARMA *(Santi: "que baje un poco la postura y la
   * vista para apuntar")*: apuntando abajo la cabeza se va un punto adelante y
   * abajo; apuntando arriba, sube. Se corre, no se gira: girada se veía borrosa.
   */
  if (apunta && o.postura !== 'montado' && Math.cos(o.armaDir) > 0) {
    const s = Math.sin(o.armaDir);
    if (s > 0.3) { mx += 1; my += s > 0.6 ? 2 : 1; } else if (s < -0.3) my -= 1;
  }
  const S = H.cuerpo(24, 34);
  let boca = null;
  const arma = () => {
    const ancla = (x, y) => [S[0] + x - 24, S[1] + y - 34];
    const enMarco = (c) => [24 + c[0] - S[0], 34 + c[1] - S[1]];
    usar(ancla);
    const b = armaApuntada(L, R, o.armaDir, {
      hombroT: [24, 34], hombroF: enMarco(H.cuerpo(22, 35)), cadera: enMarco(H.cuerpo(25, 46)), arma: o.arma,
    });
    boca = ancla(...b);
  };
  // Un arma larga va DEBAJO de la cabeza (la cara apoyada en la culata, como
  // en la pose de siempre); el revólver, encima (el brazo pasa por delante).
  if (apunta && armaLarga(o.arma)) arma();
  usar((x, y) => H.cabeza(x, y, mx, my));
  cabezaLado(L, o);
  sombreroLado(L, R.sombrero);
  cuerpo();
  if (apunta && !armaLarga(o.arma)) arma();
  return { boca, hombro: S };
}
