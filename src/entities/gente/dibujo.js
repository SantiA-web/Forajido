/**
 * LA GENTE, PARTE 1: colores, ropa, el lienzo y los sombreros.
 *
 * Este módulo y sus hermanos (`cabezas.js`, `frente.js`, `costado.js`) son el
 * dibujo de las personas a 80 px, decidido en `prototipos/gente-80px/` y
 * documentado en NOTAS-DISENO.md ("La gente curtida a 80 px").
 *
 * TODO SE DIBUJA EN "PUNTOS DE DIBUJO", no en unidades del mundo: la figura
 * mide unas 74 filas de alto y 1 punto de dibujo es 1 punto de pantalla (o sea
 * un cuarto de unidad, porque la lupa del juego es ×4). Quien lo usa es
 * `entities/figura.js`, que arma cada dibujo UNA vez, lo guarda y después sólo
 * lo estampa: dibujar esto en cada cuadro para cada persona sería carísimo.
 */

export function tono(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

// ------------------------------------------------------------- los colores
export const NEGRO = '#1a120c', OJO_B = '#d8ccb4';
export const PIEL = '#b27a52', PIEL_S = '#8a5a3c', PIEL_O = '#6e4630', PIEL_L = '#c89068';
export const PELO = '#2a1c14', BARBA = '#4e3222', BIGOTE = '#3a2418';
export const HAT = '#4a3626', HAT_L = '#6a4e36', HAT_S = '#34261a', BANDA = '#5a3a24', LATON = '#a88a4a';
export const CHAL = '#3e2c1e', CHAL_L = '#56402c', CHAL_S = '#2c2016';
export const CAM = '#9a8a6a', CAM_L = '#b0a080', CAM_S = '#7a6c52';
export const PAN_R = '#7a2c22', PAN_RL = '#94402e', PAN_RS = '#58201a';
export const PANT = '#4e4236', BOTA = '#2a1e16', BOTA_L = '#4a3a2a', ESPUELA = '#8a8278';
export const CINTO = '#3a2618', FUNDA = '#5a3a22', CULATA = '#6a4a2a', CULATA_L = '#8a6a42';
export const COAT = '#3e4652', COAT_L = '#56606e', COAT_S = '#2c323c', CAP = '#2e343c', VISOR = '#1a1a1e';
export const TRAJE = '#5c6058', TRAJE_L = '#747a70', TRAJE_S = '#454a42', BLANCA = '#c8bca4', CORBATA = '#5a2a2a';
export const ACERO = '#8a8e94', ORO = '#c8a84a', ROJO_CAPA = '#8e2420';

/**
 * QUIÉN ES QUIÉN. Cada tipo del juego es la misma persona con otra ropa: el
 * sombrero y dos o tres detalles alcanzan para reconocerlo de lejos, que es la
 * regla que pidió Santi desde el principio.
 *
 * `extras` se dibuja encima del torso y recibe la vista —así un detalle puede
 * cambiar de lugar según de dónde se lo mire— y los datos de la figura, para
 * los detalles que dependen de cómo está la persona (los cartuchos que le
 * quedan, por ejemplo).
 */
export const ROPA = {
  jugador: {
    sombrero: 'vaquero', chal: [CHAL, CHAL_L, CHAL_S], manga: [CAM, CAM_L, CAM_S], pant: PANT,
    cuello: 'panuelo', funda: true, espuela: true, barba: BARBA, barbaP: 34, bigote: 'grande',
  },
  guardia: {
    sombrero: 'kepi', chal: [COAT, COAT_L, COAT_S], manga: [COAT, COAT_L, COAT_S], pant: '#34383e',
    cuello: 'saco', saco: true, botones: LATON, funda: true, barba: null, bigote: 'chico',
  },
  pasajero: {
    sombrero: 'bombin', chal: [TRAJE, TRAJE_L, TRAJE_S], manga: [TRAJE, TRAJE_L, TRAJE_S], pant: '#3e3630',
    cuello: 'corbata', saco: true, botones: '#2a2018', barba: null, bigote: 'chico',
  },
  blindado: {
    sombrero: 'kepi', chal: ['#343a44', '#4a525e', '#242a32'], manga: ['#343a44', '#4a525e', '#242a32'],
    pant: '#2c3036', cuello: 'saco', saco: true, botones: ACERO, funda: true, barba: '#5a4432', barbaP: 22,
    bigote: 'chico', extras: placaDePecho,
  },
  pistolero: {
    sombrero: 'plano', chal: ['#7a6a4e', '#948468', '#5e5138'], manga: ['#8a7a5e', '#a2927a', '#6a5c44'],
    pant: '#46403a', cuello: 'panuelo', panueloColor: '#3a3a44', funda: true, espuela: true,
    barba: '#4a3424', barbaP: 30, bigote: 'grande',
  },
  dinamitero: {
    sombrero: 'boina', chal: ['#4a3a2a', '#5e4c38', '#362a1e'], manga: ['#6a5a44', '#7e6e56', '#4e4232'],
    pant: '#443a2e', cuello: 'saco', funda: true, barba: '#3e2a1c', barbaP: 40, bigote: 'grande',
    bandolera: true, extras: bandolera,
  },
  sheriff: {
    sombrero: 'alto', chal: ['#2e2a28', '#464240', '#1e1c1a'], manga: ['#2e2a28', '#464240', '#1e1c1a'],
    pant: '#2a2622', cuello: 'panuelo', panueloColor: '#4a4a52', saco: true, botones: ORO, funda: true,
    espuela: true, barba: '#8a8078', barbaP: 40, bigote: 'grande', extras: estrella,
  },
  rico: {
    sombrero: 'galera', chal: ['#38303c', '#4e4452', '#282230'], manga: ['#38303c', '#4e4452', '#282230'],
    pant: '#2e2830', cuello: 'corbata', saco: true, botones: ORO, barba: null, bigote: 'chico',
    extras: cadenaDeOro,
  },
  cazarrecompensas: {
    sombrero: 'ancho', chal: ['#3a2e26', '#4e4034', '#28201a'], manga: ['#5a4a3a', '#6e5c48', '#42362a'],
    pant: '#3a322a', cuello: 'panuelo', panueloColor: '#6a2420', funda: true, espuela: true,
    barba: '#2e2018', barbaP: 46, bigote: 'grande', capa: ROJO_CAPA, extras: estrella0,
  },
  sheriffJefe: {
    sombrero: 'alto', chal: ['#6e6252', '#867a68', '#524838'], manga: ['#7a6e5c', '#928670', '#5e5444'],
    pant: '#443c32', cuello: 'panuelo', panueloColor: '#4a4a52', funda: true, espuela: true,
    barba: '#9a9088', barbaP: 46, bigote: 'grande', extras: estrellaGrande,
  },
};
// El civil encubierto es un pasajero hasta que saca el arma: ésa es toda la trampa.
ROPA.encubierto = ROPA.pasajero;
ROPA.jineteLey = ROPA.guardia;

/**
 * DEL NOMBRE DEL JUEGO AL NOMBRE DEL DIBUJO. El juego llama a los guardias
 * por su `look` (data/guards.js) y a los jefes por su `id` (data/bosses.js);
 * acá se traducen a la ropa de arriba. Es la tabla que antes vivía en
 * data/siluetas.js, que ya no existe.
 */
export const ROPA_DE_LOOK = {
  normal: 'guardia',
  placa: 'blindado',
  dosRevolveres: 'pistolero',
  bandolera: 'dinamitero',
  civil: 'encubierto',
  estrella: 'sheriff',
};

export const ROPA_DE_JEFE = {
  cazarrecompensas: 'cazarrecompensas',
  sheriff: 'sheriffJefe',
};

// ------------------------------------------------------- los detalles extra
function placaDePecho(L, vista) {
  if (vista === 'espalda') return;
  const x = vista === 'lado' ? 24 : 20;
  L.rect(x, 36, vista === 'lado' ? 6 : 9, 10, ACERO);
  L.rect(x, 36, vista === 'lado' ? 6 : 9, 1, '#b8bcc2');
  L.rect(x + 1, 40, 3, 1, '#5e6268');
}
/**
 * LA BANDOLERA MUESTRA LOS HUECOS, no sólo lo que queda: son siempre cuatro
 * lugares y los gastados se ven vacíos. Así la recarga del Dinamitero (ver
 * `dinamiteroRecarga` en data/config.js) es algo que se puede MIRAR: se le
 * vacía la correa y se le vuelve a llenar.
 */
function bandolera(L, vista, o = {}) {
  const y = vista === 'espalda' ? 36 : 35;
  const quedan = o.cartuchos == null ? 4 : Math.max(0, Math.min(4, o.cartuchos));
  L.poly([[16, y], [22, y], [32, y + 14], [27, y + 15]], '#6a4a2a');
  for (let i = 0; i < 4; i++) {
    // Se gastan de arriba para abajo: el de más arriba es el que agarra.
    const lleno = i >= 4 - quedan;
    L.rect(19 + i * 3, y + 3 + i * 3, 2, 3, lleno ? '#b8603a' : '#4a3018');
  }
}
function estrella(L, vista) {
  if (vista === 'espalda') return;
  L.rect(19, 38, 3, 3, ORO); L.rect(18, 39, 5, 1, ORO); L.rect(20, 37, 1, 5, ORO);
}
function estrella0(L, vista) {
  if (vista === 'espalda') return;
  L.rect(19, 38, 2, 2, '#c8c0a8');
}
function estrellaGrande(L, vista) {
  if (vista === 'espalda') return;
  L.rect(18, 37, 5, 5, ORO); L.rect(17, 39, 7, 1, ORO); L.rect(20, 36, 1, 7, ORO);
  L.rect(19, 38, 3, 3, '#e8d080');
}
function cadenaDeOro(L, vista) {
  if (vista === 'espalda') return;
  L.poly([[21, 40], [27, 40], [24, 45]], ORO);
}

// ------------------------------------------------------------- el lienzo
/**
 * El lienzo donde se arma una figura.
 *
 * `s` es la escala (las mismas formas dibujadas más grandes, nunca estiradas) y
 * `warp` deforma el cuerpo: las piernas largas y la inclinación del trote. Las
 * formas grandes se doblan punto por punto; las rayitas finas sólo se corren,
 * para no perder pixeles.
 */
export function Lienzo(W, H, ox = 1, oy = 1, s = 1, warp = null) {
  const mapa = new Map();
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;
  const poner = (x, y, c) => { const px = x + ox, py = y + oy; mapa.set(px + ',' + py, [px, py, c]); };
  const color = (x, y) => (mapa.get((x + ox) + ',' + (y + oy)) || [])[2];
  const caja = (x, y, w, h, fn) => {
    const x0 = Math.round(x * s), y0 = Math.round(y * s);
    const x1 = Math.max(x0 + 1, Math.round((x + w) * s)), y1 = Math.max(y0 + 1, Math.round((y + h) * s));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) fn(px, py);
  };
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
    /** Recolorea sólo lo que ya es de ciertos colores: sombras y texturas. */
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
    /** Lo de adentro no se deforma, sólo se corre: las cabezas y los sombreros. */
    rigido(fn) {
      const antes = actual;
      if (antes) { const dx = antes(24, 20)[0] - 24; actual = (x, y) => [x + dx, y]; }
      fn();
      actual = antes;
    },
    /**
     * Sale un canvas con la figura y su borde de 2 puntos: el de adentro negro
     * y el de afuera a media sombra. Es lo que la despega del piso del vagón.
     */
    canvas(despues) {
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
export function mover(L, dx, dy) {
  return {
    rect: (x, y, w, h, c) => L.rect(x + dx, y + dy, w, h, c),
    elipse: (cx, cy, rx, ry, c) => L.elipse(cx + dx, cy + dy, rx, ry, c),
    poly: (pts, c) => L.poly(pts.map(([x, y]) => [x + dx, y + dy]), c),
    sobre: (x, y, w, h, de, c, p) => L.sobre(x + dx, y + dy, w, h, de, c, p),
  };
}
export const corrido = (pts, d) => pts.map(([x, y]) => [x + d, y]);

/**
 * LAS PROPORCIONES, ya elegidas jugando: cuerpo normal y PIERNAS LARGAS.
 *
 * Santi, con su muñeco de madera para poses: *"las piernas miden lo que mide el
 * torso + lo que mide la cabeza. En el juego, las piernas apenas llegan a medir
 * lo que mide el torso"*. Eran 19 filas de piernas contra 43 de cabeza y torso
 * (44%). Ahora la cabeza mide 15, el torso 20 y las piernas 27 (77%), sin
 * cambiar el alto total. Con piernas cortas cualquier trote se veía torpe.
 */
const LARGO = { cabeza: 15 / 19, torso: 20 / 24, piernas: 27 };

/**
 * Deforma el cuerpo. `inclina` es cuánto se va para adelante el torso por cada
 * fila de alto: al trotar el cuerpo se tira hacia adelante, de los hombros para
 * arriba cabeza y sombrero se corren JUNTOS (si no, la copa se despegaba y
 * parecía que el sombrero se caía).
 */
export function deformar(inclina = 0) {
  const cab = (y) => (y < 12 ? 1 : y < 16 ? 1 + (LARGO.cabeza - 1) * (y - 12) / 4
    : y <= 30 ? LARGO.cabeza : y < 33 ? LARGO.cabeza + (1 - LARGO.cabeza) * (y - 30) / 3 : 1);
  // De abajo para arriba: los pies no se mueven, las piernas crecen, el torso
  // y la cabeza bajan. Los brazos NO se achican con el torso: quedan al costado.
  const cadera = 74 - LARGO.piernas;
  const cuello = cadera - 25 * LARGO.torso, tope = cuello - 18 * LARGO.cabeza;
  const alto = (y) => (y >= 55 ? 74 - (74 - y) * LARGO.piernas / 19
    : y >= 30 ? cadera - (55 - y) * LARGO.torso
      : y >= 12 ? cuello - (30 - y) * LARGO.cabeza
        : tope - (12 - y));
  return (x, y) => [
    24 + (x - 24) * cab(y) + inclina * (56 - Math.min(56, Math.max(y, 30))),
    alto(y),
  ];
}

// ---------------------------------------------------------- los sombreros
/**
 * Las formas: `ala` es el radio del ala, `copa` el alto y el ancho de la copa.
 * Con esta tabla salen todos los sombreros del juego sin una función por cada
 * uno; el kepí y la boina son los dos que no entran en el molde.
 */
const SOMBREROS = {
  vaquero: { ala: 21, copa: [11, 16], banda: BANDA, chapa: LATON, hundido: true },
  plano: { ala: 19, copa: [8, 17], banda: '#2e2a22', color: '#3a342c', claro: '#544c40' },
  alto: { ala: 18, copa: [15, 13], banda: '#2a2622', chapa: ORO, color: '#2e2a26', claro: '#4a4440' },
  ancho: { ala: 25, copa: [12, 16], banda: '#3a2a20', hundido: true, color: '#3a2e24', claro: '#564636' },
  galera: { ala: 15, copa: [18, 11], banda: '#1e1a20', color: '#2a2430', claro: '#42384a' },
  bombin: { ala: 14, copa: [12, 9], banda: '#221a16', color: '#3a302a', claro: '#56483e', redonda: true },
};

export function sombrero(L, cual, g = 0, atras = false) {
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
  if (cual === 'boina') {
    L.elipse(24 + g, 11, 13, 4, '#5a2a26');
    L.elipse(23 + c2, 8, 10, 4, '#6e342e');
    L.rect(14 + c2, 12, 20, 2, '#3e1e1a');
    L.rect(25 + c2, 3, 3, 3, '#8a4a2e');
    return;
  }
  const S = SOMBREROS[cual] || SOMBREROS.vaquero;
  const base = S.color || HAT, claro = S.claro || HAT_L, oscuro = tono(base, 0.72);
  const [alto, ancho] = S.copa, arriba = 12 - alto;
  L.elipse(24 + g, 13, S.ala, 3, oscuro);
  L.elipse(24 + g, 11, S.ala, 3, base);
  L.elipse(22 + g, 10, S.ala - 5, 1.2, claro);
  const hx = 24 - ancho / 2;
  if (S.redonda) L.elipse(24 + c2, 12 - alto / 2, ancho / 2 + 1, alto / 2 + 1, base);
  else L.poly(corrido([[hx + 1, arriba], [hx + ancho - 1, arriba], [hx + ancho, 11], [hx, 11]], c2), base);
  if (S.hundido) L.poly(corrido([[hx + 4, arriba], [hx + ancho - 4, arriba], [hx + ancho - 5, arriba + 4], [hx + 5, arriba + 4]], c2 + g), oscuro);
  L.rect((atras ? hx + ancho - 3 : hx + 1) + c2, arriba + 2, 2, Math.max(2, alto - 4), claro);
  L.rect(hx + c2, 8, ancho, 3, S.banda);
  if (S.chapa && !atras) L.rect(hx + ancho - 4 + c2, 8, 3, 3, S.chapa);
}

export function sombreroLado(L, cual) {
  if (cual === 'kepi') {
    L.poly([[17, 3], [30, 4], [31, 12], [16, 12]], CAP);
    L.rect(17, 3, 13, 2, tono(CAP, 1.3)); L.rect(16, 10, 15, 2, tono(CAP, 0.75));
    L.poly([[29, 11], [37, 12], [36, 14], [29, 13]], VISOR);
    L.rect(26, 6, 3, 3, LATON);
    return;
  }
  if (cual === 'boina') {
    L.elipse(22, 10, 12, 4, '#6e342e');
    L.rect(14, 12, 18, 2, '#3e1e1a');
    L.rect(12, 6, 3, 3, '#8a4a2e');
    return;
  }
  const S = SOMBREROS[cual] || SOMBREROS.vaquero;
  const base = S.color || HAT, claro = S.claro || HAT_L, oscuro = tono(base, 0.72);
  const [alto, ancho] = S.copa, arriba = 12 - alto;
  // El ala vista un poco desde arriba: un óvalo, no una tabla.
  L.elipse(24, 12, S.ala, 3.5, oscuro);
  L.elipse(24, 11, S.ala, 3, base);
  L.elipse(22, 10, S.ala - 6, 1.2, claro);
  L.rect(24 + S.ala - 8, 14, 7, 1, tono(oscuro, 0.8));
  const hx = 23 - ancho / 2;
  if (S.redonda) L.elipse(23, 12 - alto / 2, ancho / 2 + 1, alto / 2 + 1, base);
  else L.poly([[hx + 1, arriba], [hx + ancho, arriba], [hx + ancho + 1, 11], [hx, 11]], base);
  L.rect(hx, arriba + 1, 2, alto - 2, oscuro);
  L.rect(hx + ancho - 3, arriba + 1, 2, Math.max(2, alto - 5), claro);
  if (S.hundido) L.poly([[hx + 3, arriba], [hx + ancho - 3, arriba], [hx + ancho - 4, arriba + 3], [hx + 4, arriba + 3]], oscuro);
  L.rect(hx - 1, 7, ancho + 2, 3, S.banda);
}

// ------------------------------------------------------------- las caras
/**
 * Las cejas y el ojo. El estado se lee en la cara, que es lo que le faltaba a
 * las sombras cabezonas: tranquilo, de reojo con una ceja arriba cuando te oyó,
 * y con el ceño fruncido cuando te vio.
 */
export function cejasYOjos(L, x, w, estado, izq) {
  if (estado === 'alerta') {
    if (izq) { L.rect(x, 15, 1, 1, PELO); L.rect(x + 1, 16, 2, 1, PELO); L.rect(x + 3, 17, 1, 1, PELO); }
    else { L.rect(x + w - 1, 15, 1, 1, PELO); L.rect(x + w - 3, 16, 2, 1, PELO); L.rect(x, 17, 1, 1, PELO); }
    L.rect(x, 18, w, 1, OJO_B); L.rect(x + 1, 18, 2, 1, NEGRO);
    L.rect(x, 19, w, 1, PIEL_O);
  } else if (estado === 'sospecha') {
    L.rect(x, izq ? 15 : 17, w, 1, PELO);
    L.rect(x, 18, w, 1, OJO_B); L.rect(x + w - 2, 18, 2, 1, NEGRO);
    L.rect(x, 19, w, 1, PIEL_S);
  } else {
    L.rect(x, 16, w, 1, PELO);
    L.rect(x, 17, w, 2, OJO_B); L.rect(x + 1, 17, 2, 2, estado === 'aturdido' ? '#6a6258' : NEGRO);
    L.rect(x, 19, w, 1, PIEL_S);
  }
}

// ------------------------------------------------- brazos, tramos y el arma
/** Un tramo grueso de a hasta b, con el ancho medido de costado a la línea. */
export function tramo(L, a, b, w, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, px = -dy / n * w, py = dx / n * w;
  L.poly([[a[0] + px, a[1] + py], [b[0] + px, b[1] + py], [b[0] - px, b[1] - py], [a[0] - px, a[1] - py]], col);
}

/**
 * El brazo que apunta con el revólver, igual para todas las vistas: del hombro
 * a la mano, y el caño hacia `dir`. Con el caño corto (apuntando hacia la
 * cámara) se ve la boca en vez del caño.
 */
export function apuntar(L, R, hombro, mano, dir, largo) {
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

/**
 * 🔫 EL RIFLE, AGARRADO CON LAS DOS MANOS. Es `apuntar` pero para un arma
 * larga: la mano de atrás en el gatillo, la de adelante en la caña, y un brazo
 * saliendo del hombro hacia cada una.
 *
 * ⚠️ **VA ACÁ ADENTRO Y NO DIBUJADO ENCIMA DEL JINETE**, y eso es todo el
 * asunto. El primer intento lo pintaba en la escena, sobre el muñeco, con dos
 * cuadraditos color piel haciendo de manos mientras los brazos de verdad
 * seguían en las riendas. Santi: *"el rifle se ve horripilante, parece que está
 * levitando junto al guardia. No parece que el guardia lo esté agarrando"*.
 * Tenía razón, y la razón es estructural: un fierro que una persona sostiene
 * tiene que salir de los mismos brazos que el resto del cuerpo. Pintado encima
 * se va a ver pegado siempre, por bien que esté dibujado.
 *
 * Funcionó con el lazo porque una soga puede colgar; un rifle, no.
 *
 * El orden importa: primero el brazo de atrás (queda debajo), después el arma,
 * y **el brazo de adelante encima de todo** — ése es el que se lee agarrando.
 */
export function rifle(L, R, hombroT, manoT, hombroF, manoF, dir, cano, culata = 5) {
  const [M0, ML, MS] = R.manga;
  const [nx, ny] = dir;
  const punto = (p, d) => [p[0] + nx * d, p[1] + ny * d];

  tramo(L, [hombroT[0], hombroT[1] + 1], [manoT[0], manoT[1] + 1], 3, MS);
  tramo(L, hombroT, manoT, 2.6, M0);

  /**
   * ⚠️ VA CLARO, Y NO POR GUSTO. El caballo es marrón oscuro, el desierto de
   * noche también, y **el pescuezo del animal se dibuja DESPUÉS del jinete**
   * (`montura.adelante()`), así que el arma compite con un fondo oscuro que
   * encima la tapa en parte. Con la madera y el fierro en sus tonos reales el
   * rifle desaparecía: no es un arma realista, es un arma que se ve.
   */
  tramo(L, manoT, punto(manoT, -culata), 3.2, CULATA_L);
  tramo(L, manoT, punto(manoT, -culata * 0.55), 1.1, '#b08d5c');

  // La caja entre las dos manos, y el caño para adelante.
  tramo(L, manoT, manoF, 2.4, '#4a443e');
  const boca = punto(manoF, cano);
  if (cano <= 3) {
    // Apuntando a la cámara: se ve la boca, no el caño.
    L.elipse(boca[0], boca[1], 2.2, 2.2, '#6b6258');
    L.rect(Math.round(boca[0]), Math.round(boca[1]), 1, 1, NEGRO);
  } else {
    tramo(L, manoF, boca, 1.6, '#9a9288');
    tramo(L, manoF, punto(manoF, cano * 0.7), 0.8, '#c4bcb0');
    L.rect(Math.round(boca[0]), Math.round(boca[1]), 1, 1, '#e0d8cc');
  }

  tramo(L, [hombroF[0], hombroF[1] + 1], [manoF[0], manoF[1] + 1], 3, MS);
  tramo(L, hombroF, manoF, 2.6, M0);
  L.rect(Math.round((hombroF[0] + manoF[0]) / 2), Math.round((hombroF[1] + manoF[1]) / 2) - 1, 2, 1, ML);
  L.elipse(manoT[0], manoT[1], 2, 2, PIEL);
  L.elipse(manoF[0], manoF[1], 2, 2, PIEL);
}
