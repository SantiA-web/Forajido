// Lámina 72 px, parte 1: colores, el lienzo, las cabezas y los sombreros.
function tono(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

const NEGRO = '#1a120c', OJO_B = '#d8ccb4';
const PIEL = '#b27a52', PIEL_S = '#8a5a3c', PIEL_O = '#6e4630', PIEL_L = '#c89068';
const PELO = '#2a1c14', BARBA = '#4e3222', BIGOTE = '#3a2418';
const HAT = '#4a3626', HAT_L = '#6a4e36', HAT_S = '#34261a', BANDA = '#5a3a24', LATON = '#a88a4a';
const CHAL = '#3e2c1e', CHAL_L = '#56402c', CHAL_S = '#2c2016';
const CAM = '#9a8a6a', CAM_L = '#b0a080', CAM_S = '#7a6c52';
const PAN_R = '#7a2c22', PAN_RL = '#94402e', PAN_RS = '#58201a';
const PANT = '#4e4236', BOTA = '#2a1e16', BOTA_L = '#4a3a2a', ESPUELA = '#8a8278';
const CINTO = '#3a2618', FUNDA = '#5a3a22', CULATA = '#6a4a2a', CULATA_L = '#8a6a42';
const COAT = '#3e4652', COAT_L = '#56606e', COAT_S = '#2c323c', CAP = '#2e343c', VISOR = '#1a1a1e';
const TRAJE = '#5c6058', TRAJE_L = '#747a70', TRAJE_S = '#454a42', BLANCA = '#c8bca4', CORBATA = '#5a2a2a';

/** Lo que cambia de un tipo de persona a otro. */
const ROPA = {
  jugador: { sombrero: 'vaquero', chal: [CHAL, CHAL_L, CHAL_S], manga: [CAM, CAM_L, CAM_S], pant: PANT, cuello: 'panuelo', funda: true, espuela: true, barba: BARBA, barbaP: 34, bigote: 'grande' },
  guardia: { sombrero: 'kepi', chal: [COAT, COAT_L, COAT_S], manga: [COAT, COAT_L, COAT_S], pant: '#34383e', cuello: 'saco', saco: true, botones: LATON, funda: true, barba: null, bigote: 'chico' },
  pasajero: { sombrero: 'bombin', chal: [TRAJE, TRAJE_L, TRAJE_S], manga: [TRAJE, TRAJE_L, TRAJE_S], pant: '#3e3630', cuello: 'corbata', saco: true, botones: '#2a2018', barba: null, bigote: 'chico' },
};

/** `s` = escala: las mismas formas dibujadas más grandes, nítidas (no estiradas). */
function Lienzo(W, H, ox = 1, oy = 1, s = 1, warp = null) {
  const mapa = new Map();
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;
  const poner = (x, y, c) => { const px = x + ox, py = y + oy; mapa.set(px + ',' + py, [px, py, c]); };
  const color = (x, y) => (mapa.get((x + ox) + ',' + (y + oy)) || [])[2];
  const caja = (x, y, w, h, fn) => {
    const x0 = Math.round(x * s), y0 = Math.round(y * s);
    const x1 = Math.max(x0 + 1, Math.round((x + w) * s)), y1 = Math.max(y0 + 1, Math.round((y + h) * s));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) fn(px, py);
  };
  // `warp` deforma el cuerpo (proporciones, inclinación). Las formas grandes se
  // doblan punto por punto; las rayitas finas sólo se corren, para no perder pixeles.
  let actual = warp;
  const W2 = (x, y) => (actual ? actual(x, y) : [x, y]);
  const densa = (pts) => {
    if (!actual) return pts;
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
      for (let k = 0; k < n; k++) out.push(W2(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n));
    }
    return out;
  };
  return {
    rect(x, y, w, h, c) {
      const put = (px, py) => poner(px, py, c);
      if (!actual) return caja(x, y, w, h, put);
      if (h <= 2) {
        const [xl, yc] = W2(x, y + h / 2), [xr] = W2(x + w, y + h / 2);
        return caja(xl, yc - h / 2, Math.max(0.5, xr - xl), h, put);
      }
      if (w <= 2) {
        const [xc, yt] = W2(x + w / 2, y), [, yb] = W2(x + w / 2, y + h);
        return caja(xc - w / 2, yt, w, yb - yt, put);
      }
      this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c);
    },
    elipse(cx, cy, rx, ry, c) {
      if (actual) {
        if (rx > 2.5 || ry > 2.5) {
          const n = Math.max(16, Math.ceil((rx + ry) * 3));
          return this.poly(Array.from({ length: n }, (_, i) => [
            cx + (rx + 0.5) * Math.cos(2 * Math.PI * i / n), cy + (ry + 0.5) * Math.sin(2 * Math.PI * i / n),
          ]), c);
        }
        [cx, cy] = W2(cx, cy);
      }
      cx *= s; cy *= s; rx *= s; ry *= s;
      for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
        const dx = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
        for (let x = Math.round(cx - dx); x <= Math.round(cx + dx); x++) poner(x, y, c);
      }
    },
    poly(pts, c) {
      pts = densa(pts).map(([x, y]) => [x * s, y * s]);
      const ys = pts.map((p) => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) poner(x, y, c);
        }
      }
    },
    sobre(x, y, w, h, de, c, prob = 100) {
      if (actual) {
        const q = [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x, y + h / 2], [x + w, y + h / 2]].map(([a, b]) => W2(a, b));
        const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
        x = Math.min(...xs); y = Math.min(...ys); w = Math.max(...xs) - x; h = Math.max(...ys) - y;
      }
      caja(x, y, w, h, (px, py) => {
        const cc = color(px, py);
        if (cc && de.includes(cc) && hash(px, py) < prob) poner(px, py, c);
      });
    },
    /**
     * Lo que se dibuja adentro NO se deforma: sólo se corre con la inclinación.
     * Es para las cabezas y los sombreros, que tienen su propio dibujo a la medida nueva.
     */
    rigido(fn) {
      const antes = actual;
      if (antes) { const dx = antes(24, 20)[0] - 24; actual = (x, y) => [x + dx, y]; }
      fn();
      actual = antes;
    },
    canvas(despues) {
      // Borde de 2 puntos: el de adentro negro, el de afuera a media sombra.
      const anillo = (lleno) => {
        const out = new Set();
        for (const k of lleno) {
          const [x, y] = k.split(',').map(Number);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const kk = (x + dx) + ',' + (y + dy);
            if (!lleno.has(kk)) out.add(kk);
          }
        }
        return out;
      };
      const cuerpo = new Set(mapa.keys());
      const borde = anillo(cuerpo);
      const borde2 = anillo(new Set([...cuerpo, ...borde]));
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'rgba(12,8,6,0.5)';
      for (const k of borde2) { const [x, y] = k.split(',').map(Number); ctx.fillRect(x, y, 1, 1); }
      ctx.fillStyle = NEGRO;
      for (const k of borde) { const [x, y] = k.split(',').map(Number); ctx.fillRect(x, y, 1, 1); }
      for (const [, [x, y, c]] of mapa) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
      if (despues) despues(ctx);
      return cv;
    },
  };
}

/** El mismo lienzo corrido: sirve para que el cuerpo suba o baje al caminar. */
function mover(L, dx, dy) {
  return {
    rect: (x, y, w, h, c) => L.rect(x + dx, y + dy, w, h, c),
    elipse: (cx, cy, rx, ry, c) => L.elipse(cx + dx, cy + dy, rx, ry, c),
    poly: (pts, c) => L.poly(pts.map(([x, y]) => [x + dx, y + dy]), c),
    sobre: (x, y, w, h, de, c, p) => L.sobre(x + dx, y + dy, w, h, de, c, p),
  };
}
const corrido = (pts, d) => pts.map(([x, y]) => [x + d, y]);

/**
 * LAS PROPORCIONES. No se redibuja nada: el cuerpo se deforma por franjas.
 * A = como estaba; B = moderada (ala +15%, hombros +9%, cintura −10%, piernas +3);
 * C = fuerte. Las piernas crecen hacia abajo, así la cabeza no se sale del dibujo.
 */
/** Qué pisada usa el trote: 'nueva' (2 cuadros apoyado, 2 en el aire) o 'vieja' (3 y 1), para comparar. */
let PISADA = 'nueva';

/**
 * EL LARGO DE LAS PIERNAS, en filas de pixeles. Hoy: cabeza 19, torso 24, piernas 19
 * (las piernas miden el 44% de cabeza + torso; en una persona, cerca del 100%).
 * Para no cambiar el alto total, al alargar las piernas se achican cabeza y torso.
 */
const LARGOS = {
  hoy: { cabeza: 1, torso: 1, piernas: 19 },
  1: { cabeza: 15 / 19, torso: 20 / 24, piernas: 27 },
  2: { cabeza: 13 / 19, torso: 18 / 24, piernas: 31 },
};

const PROPORCIONES = {
  A: { sombrero: 1, hombros: 1, cintura: 1, piernas: 0 },
  Bs: { sombrero: 1.15, hombros: 1.05, cintura: 1, piernas: 2 },
  B: { sombrero: 1.15, hombros: 1.09, cintura: 0.9, piernas: 3 },
  C: { sombrero: 1.3, hombros: 1.18, cintura: 0.85, piernas: 6 },
};
/** `inclina` = cuánto se va para adelante el torso por cada pixel de alto (al trotar). */
function deformar(prop = 'A', inclina = 0, largo = 'hoy') {
  const P = PROPORCIONES[prop], Lg = LARGOS[largo];
  if (prop === 'A' && !inclina && largo === 'hoy') return null;
  const nudos = [[9, P.sombrero], [16, 1], [30, 1], [35, P.hombros], [53, P.cintura], [58, 1]];
  const factor = (y) => {
    if (y <= nudos[0][0]) return nudos[0][1];
    for (let i = 1; i < nudos.length; i++) if (y <= nudos[i][0]) {
      const [y0, f0] = nudos[i - 1], [y1, f1] = nudos[i];
      return f0 + (f1 - f0) * (y - y0) / (y1 - y0);
    }
    return 1;
  };
  // El torso se ensancha o se afina; los brazos NO: siguen a la misma distancia del cuerpo
  // (antes se achicaban con la cintura y quedaban los codos metidos para adentro).
  const ancho = (dx, f, orilla) => {
    const a = Math.abs(dx);
    return Math.sign(dx) * (a <= orilla ? a * f : orilla * f + (a - orilla));
  };
  // La inclinación dobla sólo el torso: de los hombros para arriba, cabeza y sombrero
  // se corren juntos, como una pieza (antes la copa se corría más que la cabeza y "se caía").
  // La cabeza achicada también se afina un poco, para que la cara no quede aplastada.
  // El sombrero (arriba de la fila 12) no se toca.
  const cab = (y) => (y < 12 ? 1 : y < 16 ? 1 + (Lg.cabeza - 1) * (y - 12) / 4
    : y <= 30 ? Lg.cabeza : y < 33 ? Lg.cabeza + (1 - Lg.cabeza) * (y - 30) / 3 : 1);
  // De abajo para arriba: los pies no se mueven, las piernas crecen, el torso y la cabeza bajan.
  const piernas = Lg.piernas + P.piernas, pie = 74 + P.piernas, cadera = pie - piernas;
  const cuello = cadera - 25 * Lg.torso, tope = cuello - 18 * Lg.cabeza;
  const alto = (y) => (y >= 55 ? pie - (74 - y) * piernas / 19
    : y >= 30 ? cadera - (55 - y) * Lg.torso
      : y >= 12 ? cuello - (30 - y) * Lg.cabeza
        : tope - (12 - y));
  return (x, y) => [
    24 + ancho(x - 24, factor(y) * cab(y), y < 16 ? Infinity : 11) + inclina * (56 - Math.min(56, Math.max(y, 30))),
    alto(y),
  ];
}

// ------------------------------------------------------------ sombreros
/** g = 0 de frente, 1 girado tres cuartos. `atras` = visto de espaldas. */
function sombrero(L, cual, g = 0, atras = false) {
  const c2 = g * 2;
  if (cual === 'kepi') {
    L.poly(corrido([[15, 4], [33, 4], [34, 12], [14, 12]], c2), CAP);
    L.rect(15 + c2, 4, 19, 2, tono(CAP, 1.3));
    L.rect(14 + c2, 10, 21, 2, tono(CAP, 0.75));
    if (atras) { L.rect(14 + c2, 12, 21, 1, tono(CAP, 0.6)); return; }
    L.poly(corrido([[13, 12], [35, 12], [37, 15], [11, 15]], c2 + g), VISOR);
    L.rect(14 + c2, 12, 20, 1, '#3a3a42');
    L.rect(22 + c2 + g, 6, 5, 3, LATON); L.rect(23 + c2 + g, 7, 3, 1, '#d8b860');
    return;
  }
  if (cual === 'bombin') {
    L.elipse(24 + g, 13, 14, 2, '#2e2620');
    L.elipse(24 + g, 12, 14, 2, '#3a302a');
    L.elipse(24 + c2, 7, 9, 6, '#3a302a');
    L.rect(15 + c2, 9, 19, 2, '#221a16');
    L.rect((atras ? 26 : 19) + c2, 3, 3, 2, '#56483e');
    return;
  }
  L.elipse(24 + g, 13, 21, 3, HAT_S);
  L.elipse(24 + g, 11, 21, 3, HAT);
  L.elipse(22 + g, 10, 16, 1, HAT_L);
  L.poly(corrido([[17, 0], [31, 0], [33, 11], [15, 11]], c2), HAT);
  L.poly(corrido([[21, 0], [27, 0], [26, 4], [22, 4]], c2 + g), HAT_S);
  L.rect((atras ? 29 : 18) + c2, 2, 2, 7, HAT_L);
  L.sobre(15, 0, 21, 11, [HAT], '#3e2e20', 10);
  L.rect(15 + c2, 8, 19, 3, BANDA);
  if (!atras) L.rect(29 + c2, 8, 3, 3, LATON);
}

function sombreroLado(L, cual) {
  if (cual === 'kepi') {
    L.poly([[17, 3], [30, 4], [31, 12], [16, 12]], CAP);
    L.rect(17, 3, 13, 2, tono(CAP, 1.3)); L.rect(16, 10, 15, 2, tono(CAP, 0.75));
    L.poly([[29, 11], [37, 12], [36, 14], [29, 13]], VISOR);
    L.rect(26, 6, 3, 3, LATON);
    return;
  }
  if (cual === 'bombin') {
    L.poly([[10, 12], [36, 12], [37, 14], [9, 14]], '#2e2620');
    L.elipse(23, 7, 9, 6, '#3a302a');
    L.rect(14, 9, 18, 2, '#221a16'); L.rect(24, 3, 3, 2, '#56483e');
    return;
  }
  // El ala se ve un poco desde arriba: un óvalo, no una tabla.
  L.elipse(24, 12, 21, 3.5, HAT_S);
  L.elipse(24, 11, 21, 3, HAT);
  L.elipse(22, 10, 15, 1.2, HAT_L);
  L.rect(37, 14, 7, 1, tono(HAT_S, 0.8));
  // La copa: luz adelante, sombra atrás.
  L.poly([[17, 0], [30, 0], [31, 10], [16, 10]], HAT);
  L.rect(16, 1, 2, 9, HAT_S); L.rect(27, 1, 2, 7, HAT_L);
  L.poly([[20, 0], [26, 0], [25, 3], [21, 3]], HAT_S);
  L.rect(16, 7, 15, 3, BANDA);
}

// -------------------------------------------------------------- cabezas
function cejasYOjos(L, x, w, estado, izq) {
  if (estado === 'alerta') {
    // El ceño: las cejas bajan hacia el medio y el ojo se achica a una línea.
    if (izq) { L.rect(x, 15, 1, 1, PELO); L.rect(x + 1, 16, 2, 1, PELO); L.rect(x + 3, 17, 1, 1, PELO); }
    else { L.rect(x + w - 1, 15, 1, 1, PELO); L.rect(x + w - 3, 16, 2, 1, PELO); L.rect(x, 17, 1, 1, PELO); }
    L.rect(x, 18, w, 1, OJO_B); L.rect(x + 1, 18, 2, 1, NEGRO);
    L.rect(x, 19, w, 1, PIEL_O);
  } else if (estado === 'sospecha') {
    // Una ceja arriba y la otra abajo; los ojos miran de reojo.
    L.rect(x, izq ? 15 : 17, w, 1, PELO);
    L.rect(x, 18, w, 1, OJO_B); L.rect(x + w - 2, 18, 2, 1, NEGRO);
    L.rect(x, 19, w, 1, PIEL_S);
  } else {
    L.rect(x, 16, w, 1, PELO);
    L.rect(x, 17, w, 2, OJO_B); L.rect(x + 1 + (w > 3 ? 0 : 0), 17, 2, 2, NEGRO);
    L.rect(x, 19, w, 1, PIEL_S);
  }
}

function cabezaFrente(L, o, g = 0) {
  const R = ROPA[o.tipo], d = g * 3;
  L.elipse(16 + g, 20, 1.5, 2.5, PIEL_S);
  if (!g) L.elipse(32, 20, 1.5, 2.5, PIEL_S);
  L.elipse(24 + g, 21, 7, 9, PIEL);
  L.sobre(16, 12, 18, 4, [PIEL], PIEL_O);
  L.sobre(16, 16, 18, 1, [PIEL], PIEL_S);
  L.sobre(28 + g * 2, 18, 6, 10, [PIEL], PIEL_S);
  L.rect(17 + g, 15, 2, 7, PELO); if (!g) L.rect(30, 15, 2, 7, PELO);
  if (R.barba) L.sobre(17, 22, 16, 9, [PIEL, PIEL_S], R.barba, R.barbaP);
  cejasYOjos(L, 19 + d, 4, o.estado, true);
  cejasYOjos(L, 26 + d, g ? 3 : 4, o.estado, false);
  L.rect(23 + d, 18, 1, 5, PIEL_L); L.rect(24 + d, 19, 2, 4, PIEL_S);
  L.rect(22 + d, 23, 2, 1, PIEL_O); L.rect(25 + d, 23, 2, 1, PIEL_O);
  const big = R.bigote === 'grande'
    ? [[19, 24], [30, 24], [31, 28], [28, 26], [24, 25], [20, 26], [17, 28]]
    : [[20, 24], [28, 24], [29, 26], [24, 25], [19, 26]];
  L.poly(corrido(big, d), BIGOTE);
  if (o.estado === 'alerta') { L.rect(21 + d, 27, 7, 2, '#3a1a12'); L.rect(22 + d, 27, 5, 1, '#cfc4ae'); }
  else if (o.estado === 'sospecha') { L.rect(22 + d, 27, 5, 1, '#4a2418'); L.rect(27 + d, 26, 1, 1, '#4a2418'); }
  else L.rect(21 + d, 27, 7, 1, '#4a2418');
  L.sobre(17, 29, 16, 2, [PIEL, PIEL_S, R.barba].filter(Boolean), PIEL_O);
}

function cabezaEspalda(L, o, g = 0) {
  const R = ROPA[o.tipo];
  L.rect(21, 27, 7, 6, PIEL_S);
  if (!g) L.elipse(16, 20, 1.5, 2.5, PIEL_S);
  L.elipse(32, 20, 1.5, 2.5, PIEL_S);
  if (g) {
    // Girado: asoma la mejilla, con la barba, del lado de adelante.
    L.poly([[27, 15], [32, 18], [32, 27], [28, 29]], PIEL);
    L.sobre(27, 15, 6, 3, [PIEL], PIEL_O);
    if (R.barba) L.sobre(27, 22, 6, 8, [PIEL], R.barba, R.barbaP + 20);
    L.rect(31, 23, 2, 2, BIGOTE);
  }
  L.elipse(24 - g * 2, 20, 7, 8, PELO);
  // Mechones que bajan, en vez de puntitos sueltos.
  for (const [mx, largo] of [[19, 7], [22, 9], [25, 9], [28, 6]]) L.rect(mx - g * 2, 17, 1, largo, '#3a2a1e');
  L.rect(18 - g * 2, 27, 13, 1, '#3a2a1e');
  L.rect(20 - g, 27, 9, 2, PIEL_S);
}

function cabezaLado(L, o) {
  const R = ROPA[o.tipo];
  L.elipse(23, 21, 7, 9, PIEL);
  // La nariz: un bulto chico, no un pico.
  L.poly([[29, 18], [31, 20], [31, 23], [29, 23]], PIEL);
  L.rect(30, 22, 1, 1, PIEL_S);
  // Pómulo con luz y mandíbula en sombra: le da redondez a la cara.
  L.rect(25, 20, 3, 1, PIEL_L);
  L.sobre(19, 23, 4, 6, [PIEL], PIEL_S);
  L.sobre(16, 12, 17, 4, [PIEL], PIEL_O); L.sobre(16, 16, 17, 1, [PIEL], PIEL_S);
  // Nuca y patilla
  L.poly([[16, 13], [21, 13], [21, 16], [19, 26], [16, 25]], PELO);
  L.elipse(21, 20, 1.5, 2.5, PIEL_S); L.rect(21, 19, 1, 2, PIEL_O);
  L.rect(23, 15, 1, 6, PELO);
  if (R.barba) {
    L.sobre(17, 22, 15, 9, [PIEL, PIEL_S], R.barba, R.barbaP);
    L.poly([[22, 26], [29, 26], [29, 29], [23, 30]], tono(R.barba, 1.05));
  }
  const alerta = o.estado === 'alerta', duda = o.estado === 'sospecha';
  if (alerta) { L.rect(25, 15, 2, 1, PELO); L.rect(27, 16, 3, 1, PELO); L.rect(27, 18, 2, 1, OJO_B); L.rect(28, 18, 1, 1, NEGRO); }
  else {
    L.rect(26, duda ? 15 : 16, 4, 1, PELO);
    L.rect(27, 17, 2, 2, OJO_B); L.rect(28, 17, 1, 2, NEGRO);
  }
  L.rect(26, 19, 3, 1, PIEL_S);
  L.poly(R.bigote === 'grande' ? [[25, 24], [31, 24], [31, 26], [27, 26], [25, 28]] : [[26, 24], [31, 24], [30, 25], [26, 25]], BIGOTE);
  if (alerta) { L.rect(28, 26, 3, 1, '#cfc4ae'); } else L.rect(28, 27, 2, 1, '#4a2418');
  L.sobre(17, 29, 14, 2, [PIEL, PIEL_S, R.barba].filter(Boolean), PIEL_O);
}
