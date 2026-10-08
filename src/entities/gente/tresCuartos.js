/**
 * LA GENTE, PARTE 5: EL ESQUELETO DE TRES CUARTOS (etapa E3).
 *
 * *(Santi: "debería mirar a cuatro lugares: este, oeste, abajo sur (hacia la
 * pantalla) y abajo norte (a los jinetes más alejados). No quiero que mire
 * directo a la pantalla o directo a los montes, sino que baje un poco la
 * postura y la vista para apuntar a los jinetes")*. De costado ya había
 * esqueleto (`ladoConHuesos`, en costado.js); acá están las dos vistas
 * giradas: tres cuartos de frente (mira abajo a la derecha, hacia la cámara) y
 * tres cuartos de espaldas (mira arriba a la derecha, hacia el fondo). Las de
 * la izquierda son las mismas en espejo (eso lo hace figura.js).
 *
 * 🦵 LAS PIERNAS SALEN DE UN ESQUELETO EN 3D *(Santi: "algo importante es la
 * forma de los pies y piernas, que no parezca un pingüino")*. El pingüino es
 * lo que había: dos columnas derechas y dos botas mirando a la cámara, una al
 * lado de la otra. Acá cada pierna es cadera, rodilla y tobillo en 3D, con su
 * largo de verdad, vista desde donde está la cámara; LA BOTA APUNTA PARA DONDE
 * MIRA EL CUERPO (la punta sale hacia adelante y se acorta por el giro); la
 * pierna de allá queda un poco más arriba y más oscura, y una raya oscura las
 * separa.
 *
 * El torso y la cabeza son los dibujos de siempre de tres cuartos (frente.js),
 * pegados a sus huesos: el torso se echa adelante desde la cadera y la cabeza
 * va con el cuello. Como en costado, nada se gira como imagen: cada punto se
 * pasa por la cuenta de su hueso antes de pintarlo.
 */
import {
  ROPA, tono, tramo, sombrero, deformar, corrido, armaLarga, armaApuntada,
  OJO_B, PIEL, PIEL_S, CAM, CAM_L, CAM_S, PAN_R, PAN_RL, PAN_RS,
  BOTA, BOTA_L, ESPUELA, CINTO, FUNDA, CULATA, CULATA_L, LATON, BLANCA, CORBATA,
} from './dibujo.js';
import { cabezaFrente, cabezaEspalda } from './cabezas.js';
import { FINAS, piernaFina } from './costado.js';

/** Media cadera: lo que se separa cada pierna del medio. */
const CADERA = 4.5;
/** Cuánto se ve la profundidad como altura: la cámara mira un poco de arriba. */
const HONDO = 0.15;
/** Las proporciones de siempre (piernas largas): ver `deformar`. */
const D = deformar(0);
const CADERA_Y = D(24, 56)[1];
const CUELLO_Y = D(24, 30)[1];

/**
 * LA VISTA: de un punto del cuerpo (adelante, alto, costado) a un punto del
 * dibujo. `psi` es para dónde mira: 0 de costado a la derecha, positivo hacia
 * la cámara, negativo hacia el fondo. El costado es positivo hacia SU
 * izquierda. Lo que queda más cerca de la cámara baja un poco en el dibujo.
 */
function vista(psi) {
  const c = Math.cos(psi), s = Math.sin(psi);
  return {
    c, s,
    p: (f, u, l = 0) => [24 + f * c + l * s, u + (f * s - l * c) * HONDO],
  };
}

/** La cáscara convexa de unos puntos (para la bota vista girada). */
function casco(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const ida = [], vuelta = [];
  for (const q of p) {
    while (ida.length >= 2 && cruz(ida[ida.length - 2], ida[ida.length - 1], q) <= 0) ida.pop();
    ida.push(q);
  }
  for (const q of p.reverse()) {
    while (vuelta.length >= 2 && cruz(vuelta[vuelta.length - 2], vuelta[vuelta.length - 1], q) <= 0) vuelta.pop();
    vuelta.push(q);
  }
  return ida.slice(0, -1).concat(vuelta.slice(0, -1));
}

/**
 * LA BOTA, GIRADA CON EL CUERPO. Es la misma bota de costado (la caña y el pie,
 * cada uno una pieza), con su ancho, vista desde donde está la cámara: de tres
 * cuartos de frente la punta sale hacia adelante y abajo a la derecha, de
 * espaldas se ve el talón y la punta se va hacia el fondo.
 */
const CANA = [[-3, -3], [3, -3], [3, 0], [-4, 0]];
const PIE = [[-4, 0], [3, 0], [7, 1], [7, 3], [-4, 3]];
const EMPUJA = [[-3, -3], [3, -3], [6, 3], [6, 4], [-1, 3], [-4, 0]];

function botaGirada(L, V, [f, u], lat, talon, color, espuela, F) {
  const k = F.bota, ancho = 2.2 * k;
  // Achicada desde la suela, como `botaFina`.
  const punto = ([bx, by], dl) => V.p(f + bx * k, u + 3 + (by - 3) * k, lat + dl);
  for (const pieza of talon ? [EMPUJA] : [CANA, PIE]) {
    const pts = [];
    for (const q of pieza) pts.push(punto(q, -ancho), punto(q, ancho));
    L.poly(casco(pts), color);
  }
  // La luz: arriba de la caña y sobre el empeine, que la cámara ve un poco
  // desde arriba. Es lo que dice para dónde apunta el pie.
  const luz = -ancho * 0.4;
  tramo(L, punto([-2.5, -2.4], luz), punto([1.5, -2.4], luz), 0.5, BOTA_L);
  if (!talon) tramo(L, punto([3.5, 0.6], luz), punto([6, 1.4], luz), 0.5, BOTA_L);
  if (espuela) {
    const e = punto([-5, talon ? 0.5 : 2], 0);
    L.rect(e[0] - 1, e[1], 2, 1, ESPUELA);
  }
}

/**
 * LA POSE DE CADA VISTA. Cada pierna es cadera, rodilla y tobillo como
 * [adelante, alto, costado] (costado positivo hacia SU izquierda), y si empuja
 * con la punta. `echa` es cuánto se echa adelante el torso.
 *
 * 🔁 AGAZAPADO, LAS PIERNAS SE ABREN. Se probó primero con las mismas piernas
 * del agazapado de costado (las rodillas bien adelante, los muslos casi
 * acostados) y girado no se leía: los dos muslos quedaban uno encima del otro,
 * una mancha, y parecía sentado. De tres cuartos se lee la postura de quien
 * se planta a tirar: las piernas abiertas, las rodillas dobladas hacia
 * adelante y un poco afuera, la cadera atrás.
 */
function poseGirada(o) {
  const paso = o.paso || 0;
  const s = [0, -1, 1, -0.5, 0.5][paso % 5];
  if (o.agazapado) {
    const sube = [0, 1, 0, 0, 1][paso % 5];
    const pierna = (lado, k, levanta) => ({
      cad: [-2, 64, lado * CADERA],
      rod: [9 + 2.5 * k, 65 - levanta, lado * 10],
      tob: [1 + 3 * k, 71 - levanta, lado * 7.5],
      talon: false,
    });
    return { der: pierna(-1, s, sube), izq: pierna(1, -s, 1 - sube), echa: 0.65, s };
  }
  // Parado: la de allá un poquito adelante (descansa el peso en la de acá).
  const pierna = (lado, k, adelante) => ({
    cad: [0, 56, lado * CADERA],
    rod: [1 + adelante + 3 * k, 63.5, lado * 5],
    tob: [adelante + 4 * k, 71 - (Math.abs(k) > 0.7 ? 1 : 0), lado * 5.5],
    talon: k < -0.7,
  });
  return { der: pierna(-1, s, 0), izq: pierna(1, -s, 1.5), echa: 0, s };
}

/**
 * EL HUESO DEL TORSO: se echa adelante `th` desde la cadera (hacia la cámara
 * de frente, hacia el fondo de espaldas) y se va con la cadera de la pose.
 * Echado hacia la cámara se ve más corto; cada fila se corre, no se gira, así
 * que las rayas finas siguen derechas.
 */
function marcoDelTorso(V, cad, th) {
  const [cx, cy] = D(...V.p(cad[0], cad[1], 0));
  const corre = Math.sin(th) * V.c;
  const alto = Math.cos(th) - Math.sin(th) * V.s * HONDO;
  return (x, y) => {
    const [X, Y] = D(x, y);
    // Lo de debajo de la cadera (la funda) va con la cadera, sin echarse.
    const h = Math.max(0, CADERA_Y - Y);
    return [cx + (X - 24) + h * corre, cy - h * alto + Math.max(0, Y - CADERA_Y)];
  };
}

/** Un marco que sólo corre: lo que está en (ax, ay) del dibujo va a parar a `a`. */
const corridoA = (ax, ay, a) => (x, y) => [a[0] + x - ax, a[1] + y - ay];

// ---------------------------------------------------------------- el torso

function torsoDeFrente(L, R, o, g) {
  const d = g * 2, [C0, CL, CS] = R.chal;
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
  if (o.mochila) { L.rect(18 + g, 33, 2, 17, '#6a4a2a'); L.rect(28 + g, 33, 2, 17, '#6a4a2a'); }
  if (R.funda) {
    L.poly([[31 - g, 55], [36 - g, 55], [35 - g, 62], [32 - g, 62]], FUNDA);
    L.poly([[32 - g, 49], [36 - g, 49], [37 - g, 55], [33 - g, 55]], CULATA); L.rect(33 - g, 50, 2, 1, CULATA_L);
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
}

function torsoDeEspaldas(L, R, o, g) {
  const [C0, CL, CS] = R.chal;
  const largo = R.saco ? 57 : 55;
  L.poly([[13 + g, 32], [35 - g, 32], [34 - g, largo], [14 + g, largo]], C0);
  L.sobre(13, 32, 23, 26, [C0], CS, 14);
  L.rect(24 + g, 33, 1, largo - 34, CS); L.rect(31 - g, 34, 2, 19, CL);
  if (!R.saco) L.rect(14 + g, 53, 20 - g, 3, CINTO);
  else L.rect(14 + g, 45, 20 - 2 * g, 2, CS);
  if (R.extras) R.extras(L, 'espalda', o);
  if (o.mochila) {
    const h = 10 + o.mochila * 2;
    L.rect(17, 36, 14, h, '#6a4a2a');
    L.rect(17, 36, 14, 2, '#8a6440');
    L.rect(19, 38, 3, h - 4, '#54381f');
    L.rect(26, 38, 3, h - 4, '#54381f');
  }
  // La funda en la cadera del arma (la de acá), como de costado: en la otra
  // asomaba agazapado como una cola.
  if (R.funda) {
    L.poly([[31 - g, 55], [36 - g, 55], [35 - g, 62], [32 - g, 62]], FUNDA);
    L.poly([[32 - g, 49], [36 - g, 49], [37 - g, 55], [32 - g, 55]], CULATA);
  }
}

function panueloDeEspaldas(L, R) {
  if (R.cuello === 'panuelo') {
    const pr = R.panueloColor || PAN_R;
    const ps = R.panueloColor ? tono(pr, 0.72) : PAN_RS;
    L.poly([[17, 30], [31, 30], [30, 33], [18, 33]], pr);
    L.rect(22, 32, 4, 3, ps);
    L.poly([[23, 34], [26, 34], [27, 42], [24, 38], [21, 42]], pr);
  } else if (R.cuello === 'corbata') L.rect(19, 29, 11, 3, BLANCA);
  else L.rect(18, 29, 13, 4, R.chal[2]);
}

// ------------------------------------------------------------ el esqueleto

/**
 * 🦴 TRES CUARTOS CON HUESOS. `o.vista` es 'diagF' (de frente) o 'diagE' (de
 * espaldas); `o.g` cuánto gira (1 tres cuartos; menos, más hacia la cámara:
 * la "submirada" a la línea abierta de acá); `o.vistaBaja` cuánto baja la
 * vista (1 a los jinetes de la línea pegada, 0 a la altura de la cámara, para
 * la línea abierta de allá); `o.armaDir` el ángulo del arma, en pantalla.
 *
 * Devuelve dónde quedaron la boca del caño y el hombro del arma (en el dibujo).
 */
export function tresCuartosConHuesos(L, o = {}, usar) {
  o = { tipo: 'jugador', ...o };
  const R = ROPA[o.tipo];
  const PT = R.pant, [M0, ML, MS] = R.manga;
  const atras = o.vista === 'diagE';
  const g = o.g ?? 1;
  const psi = (atras ? -1 : 1) * (Math.PI / 2 - g * Math.PI / 4);
  const V = vista(psi);
  const F = FINAS[o.finas ?? 1] || FINAS[1];
  const P = poseGirada(o);
  const al = armaLarga(o.arma);

  // La cadera de esta pose (el medio de las dos) y el torso colgado de ella.
  const cad = [(P.der.cad[0] + P.izq.cad[0]) / 2, (P.der.cad[1] + P.izq.cad[1]) / 2];
  // De espaldas se echa más: el torso se inclina hacia el blanco, al fondo.
  const T = marcoDelTorso(V, cad, atras && o.agazapado ? 0.45 : P.echa);
  // Hacia qué lado del dibujo queda la pierna de allá: ahí va la raya que las separa.
  const haciaAlla = atras ? -1 : 1;

  /**
   * LA CABEZA, con el cuello. "Baja la vista" *(Santi)*: la cabeza se va un
   * punto adelante y abajo, y el ala del sombrero un poco más, sobre los ojos.
   * Con el Winchester baja más: el ojo va sobre la caja.
   */
  const [nx, ny] = T(24, 30);
  const baja = o.vistaBaja ?? 1;
  const mira = al && al.listo && al.mira ? 1.5 : 0;
  const cabezaEn = [nx - 24 + baja + mira, ny - CUELLO_Y + baja + mira];
  const sombreroEn = [cabezaEn[0] + (atras ? 0.5 : 0) * baja, cabezaEn[1] + (atras ? 0 : 1) * baja];
  const cabeza = (x, y) => [x + cabezaEn[0], y + cabezaEn[1]];
  const ala = (x, y) => [x + sombreroEn[0], y + sombreroEn[1]];

  /**
   * UNA PIERNA. La de acá lleva una raya oscura del lado de la otra: sin eso
   * las dos se pegaban en una sola columna (el contorno negro sólo va por
   * afuera de la figura, no entre dos partes que se tapan).
   */
  const pierna = (p, color, cerca) => {
    const q = (pt) => V.p(pt[0], pt[1], pt[2]);
    const dibujar = (c, cb, dx) => {
      usar((x, y) => { const [X, Y] = D(x, y); return [X + dx, Y]; });
      piernaFina(L, q(p.cad), q(p.rod), q(p.tob), c, F);
      botaGirada(L, V, [p.tob[0], p.tob[1]], p.tob[2], p.talon, cb, cerca && R.espuela, F);
    };
    if (cerca) dibujar(tono(PT, 0.45), '#120c08', haciaAlla);
    dibujar(color, cerca ? BOTA : tono(BOTA, 0.75), 0);
    if (cerca) {
      usar(D);
      const r = q(p.rod);
      L.rect(r[0] - 1, r[1] - 2, 2, 2, tono(color, 1.15));
    }
  };

  /**
   * LOS HOMBROS. El brazo del arma es siempre el del lado derecho del dibujo:
   * de frente es el de allá y de espaldas el de acá, pero en los dos sale hacia
   * afuera del cuerpo, hacia donde está el blanco, y nunca lo cruza.
   */
  const hArma = atras ? [34, 34] : [33, 34];
  const hLibre = atras ? [14, 34] : [15, 34];
  const SA = T(...hArma), SL = T(...hLibre);

  /**
   * EL BRAZO LIBRE: colgando, o adelante haciendo equilibrio si va
   * agazapado, como de costado. Se piensa en el dibujo (para dónde va en la
   * pantalla), colgado del hombro.
   */
  const brazoLibre = () => {
    if (al) return;   // con un arma larga, las dos manos van al arma
    usar((x, y) => [x, y]);
    const s = P.s;
    const dos = o.arma === true && o.armaDir != null;
    let C, M;
    if (dos) {
      /**
       * 🎯 APUNTANDO, CON LAS DOS MANOS: la otra mano va debajo de la del
       * revólver. 🔁 Primero se probó con la mano apoyada en la rodilla, y de
       * tres cuartos el cuerpo se leía parado; con los dos brazos juntando el
       * arma se lee "plantado a tirar". De espaldas, el cuerpo tapa casi todo
       * ese brazo: asoma la mano.
       */
      const a = o.armaDir;
      M = [SA[0] + Math.cos(a) * 14.5, SA[1] + Math.sin(a) * 14.5 + 1];
      C = [(SL[0] + M[0]) / 2 - 1, (SL[1] + M[1]) / 2 + 4];
    } else if (o.agazapado && !atras) {
      // 🦵 Agazapado de frente, LA MANO SE APOYA EN LA RODILLA de acá: es lo
      // que dice "plantado a tirar", y deja ver el torso.
      const [rx, ry] = D(...V.p(...P.der.rod));
      M = [rx - 0.5, ry - 2];
      C = [(SL[0] + M[0]) / 2 - 3.5, (SL[1] + M[1]) / 2];
    } else {
      const [codo, mano] = o.agazapado ? [[2 + s, 7], [7 + s, 6]] : [[s * 1.5, 9], [s * 3, 18]];
      C = [SL[0] + codo[0], SL[1] + codo[1]];
      M = [SL[0] + mano[0], SL[1] + mano[1]];
    }
    const color = atras ? MS : M0;
    tramo(L, SL, C, 2.8, color);
    L.elipse(C[0], C[1], 2.2, 2.2, color);
    tramo(L, C, M, 2.4, color);
    if (!atras || !o.agazapado || dos) L.elipse(M[0], M[1] + 0.5, 2, 2.5, atras ? PIEL_S : PIEL);
  };

  /** EL BRAZO DEL ARMA, apuntando: su marco sólo corre (el ángulo es de pantalla). */
  let boca = null;
  const brazoDelArma = () => {
    if (!o.arma || o.armaDir == null) return;
    const ancla = corridoA(...hArma, SA);
    usar(ancla);
    const enMarco = (c) => [hArma[0] + c[0] - SA[0], hArma[1] + c[1] - SA[1]];
    const b = armaApuntada(L, R, o.armaDir, {
      hombroT: hArma, hombroF: enMarco(SL), cadera: enMarco(T(atras ? 33 : 32, 47)),
      arma: o.arma, cano: 7,
    });
    boca = ancla(...b);
  };

  if (atras) {
    // De espaldas, lo que va adelante queda DETRÁS del cuerpo: las dos piernas
    // (agazapado, las rodillas se van al fondo), el brazo libre y el del arma.
    pierna(P.izq, tono(PT, 0.74), false);
    pierna(P.der, PT, true);
    brazoLibre();
    brazoDelArma();
    usar(T);
    torsoDeEspaldas(L, R, o, g);
    usar(cabeza);
    cabezaEspalda(L, o, g);
    usar(T);
    panueloDeEspaldas(L, R);
    usar(ala);
    sombrero(L, R.sombrero, g, true);
  } else {
    pierna(P.izq, tono(PT, 0.74), false);
    usar(T);
    torsoDeFrente(L, R, o, g);
    pierna(P.der, PT, true);
    // Un arma larga, debajo de la cabeza: la cara se apoya en la culata y se
    // sigue viendo. El revólver, encima.
    if (al) brazoDelArma();
    usar(cabeza);
    cabezaFrente(L, o, g);
    usar(ala);
    sombrero(L, R.sombrero, g, false);
    brazoLibre();
    if (!al) brazoDelArma();
  }
  return { boca, hombro: SA };
}
