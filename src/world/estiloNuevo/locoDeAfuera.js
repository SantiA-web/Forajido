/**
 * 🚂 LA LOCOMOTORA Y LA COLA DESDE EL CABALLO, en la misma cámara que los vagones *(Santi: "seguí con la locomotora y la cola")*.
 *
 * La referencia es la locomotora del asalto (estiloNuevo/cabina.js): la misma caldera y las mismas piezas, pero con las medidas del tren de afuera.
 * La pared y lo hondo son los de los vagones (40 y `HONDO`), y la caldera, más angosta que la caja, se ve más baja que el techo de la cabina.
 * De atrás para adelante, igual que adentro: el tanque, el pasillo y el carbón, la cabina, la caldera y el miriñaque, en un solo cuerpo y bajo un solo techo.
 *
 * A mano, en mapas: la cúpula, la campana, la arenera, la chimenea, el faro, el cilindro, los copos de humo (todos de cabina.js), el farol y el
 * estribo de la cola, la tapa del tanque y la boca del carbón. Sale de una cuenta lo que se repite: las chapas, el tubo con sus franjas, el miriñaque,
 * los rayos de las ruedas grandes, las bielas, el piso y las barandas del balcón, la luz del farol y dónde va cada copo de humo.
 */

import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { RGB } from '../../engine/paleta.js';
import { PIEZAS_CALDERA, COL_PIEZAS } from './cabina.js';
import { HONDO, NOCHE, VENTANA, COL_VENTANA, COL_VENTANA_NOCHE, VENTILADOR, COL_FIERRO, ruedasYCarreton } from './trenDeAfuera.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
/** Alto y largo de la lámina, en puntos. La vía, abajo de todo, como en los vagones. */
const H = 107, W = 448;
/** Dónde termina cada parte a lo largo: como adentro, 64 y 200 unidades. */
const X_TENDER = 85, X_CABINA = 267;
/** La caldera. */
const yT = 22, yB = 72, D = yB - yT, xTapa = 248, xHumo = 356, xPunta = 404, xP = 417, yPieLomo = yT + 10;
/** La pared, la misma de los vagones. */
const yAlero = 47, yPared = 51, yBastidor = 91;

/** La noche de los vagones, con el bronce y el rojo. */
const NOCHE_LOCO = { ...NOCHE, 29: 45, 28: 45, 45: 44, 44: 47, 47: 39, 10: 9, 9: 8, 6: 5, 41: 19 };
const ton = (i, noche) => (noche && NOCHE_LOCO[i] !== undefined ? NOCHE_LOCO[i] : i);

const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

function aLienzo(ind, an, al) {
  const datos = new Uint8ClampedArray(an * al * 4);
  for (let k = 0; k < ind.length; k++) {
    if (ind[k] < 0) continue;
    const c = RGB[ind[k]];
    datos[k * 4] = c[0]; datos[k * 4 + 1] = c[1]; datos[k * 4 + 2] = c[2]; datos[k * 4 + 3] = 255;
  }
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  cv.getContext('2d').putImageData(new ImageData(datos, an, al), 0, 0);
  return cv;
}

/** Una hoja de dibujo de `an`×`al` con sus herramientas. */
function hoja(an, al, noche) {
  const ind = new Int16Array(an * al).fill(-1);
  const pon = (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < an && y < al) ind[y * an + x] = ton(i, noche); };
  const r = (x, y, w, h, i) => { for (let j = 0; j < h; j++) for (let q = 0; q < w; q++) pon(x + q, y + j, i); };
  const mapa = (x, y, filas, col = COL_PIEZAS) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') pon(x + q, y + j, col[fila[q]]); });
  return { ind, pon, r, mapa, ver: (x, y) => ind[y * an + x] };
}

/** La tapa del tanque de agua: la del asalto, ovalada, con su manija. */
const TAPA_TANQUE = [
  '...oooooooooo...',
  '.ooHHHHHHHHHHoo.',
  'oHHMMMMMMMMMMHho',
  'oHMMMooooooMMMho',
  'oHMMMoHHHHoMMMho',
  'oHMMMooooooMMMho',
  'oHHMMMMMMMMMMHho',
  '.oohhhhhhhhhhoo.',
  '...oooooooooo...',
];

/** LA BOCA DEL CARBÓN, a mano: un brocal de chapa en el techo y abajo los terrones. Es lo único del carbón que se ve desde afuera. */
const BOCA_CARBON = [
  '.oooooooooooooooooooooooooooooooooooooo.',
  'oHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHho',
  'oHooooooooooooooooooooooooooooooooooooho',
  'oHnnmonnnonnmonnonnmnonnnonmonnnonnmonho',
  'oHnmMnonmnnonnmMnonnonmMnonnonmnnMmonnho',
  'oHonnmMmonnmonnonmnnmMmonnonmMmnonnmonho',
  'oHnmonnonmMnonnmMmonnonnmonnmonmMnonnmho',
  'oHonmMmnonnonmonnonmMnonmMmonnmnonmMmoho',
  'oHnnonnmonmMonnmonnnonnononmMnonnmonnnho',
  'oHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHho',
  'oMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmo',
  '.oooooooooooooooooooooooooooooooooooooo.',
];

/** LA CALDERA: el tubo, los aros, los caños y lo que va parado encima. Va primero: la cabina y el estribo la pisan. */
function laminaCaldera(noche) {
  const h = hoja(W, H, noche), { pon, r, mapa } = h, F = PIEZAS_CALDERA;
  // La plataforma de chapa delante de la caldera, por debajo del tubo.
  {
    const yAl = yB + 6 - HONDO.puntos + 4, yAc = yB + 6;
    r(xP - 40, yAl, 40, yAc - yAl, 31); r(xP - 40, yAl, 40, 1, 0); r(xP - 40, yAl + 1, 40, 1, 24);
    for (let y = yAl + 6; y < yAc; y += 8) pon(xP - 4, y, 24);
  }
  const t = (y) => (y - yT) / D;
  const banda = (lista, q) => { for (let i = 0; i < lista.length; i++) if (q < lista[i][0]) return i; return lista.length - 1; };
  // Entre franja y franja, las hileras se mezclan: un corte recto se vería como dos tubos pegados.
  const hilera = (lista, x, y) => {
    const i = banda(lista, t(y)), c = lista[i][1], mezcla = (j) => j !== i && lista[j][1] !== 0 && c !== 0 && t(y) < 0.95;
    const j1 = banda(lista, t(y + 1)), j0 = banda(lista, t(y - 1));
    if (mezcla(j1)) return (x + y) % 2 ? lista[j1][1] : c;
    if (mezcla(j0)) return (x + 2 * (y % 2)) % 4 === 0 ? lista[j0][1] : c;
    return c;
  };
  const xCentro = (xTapa + xPunta) / 2, mitad = (xPunta - xTapa) / 2;
  const redondo = (y) => Math.sqrt(Math.max(0, 1 - (2 * t(y) - 1) ** 2));
  const curva = (x, y) => Math.round(((x - xCentro) / mitad) * 3 * redondo(y));
  for (let y = yT; y < yB; y++) {
    const xH = xHumo + curva(xHumo, y), xPu = xPunta + curva(xPunta, y), xd = xPu + Math.round(6 * redondo(y));
    for (let x = xTapa; x < xH; x++) pon(x, y, hilera(F.FRANJAS, x, y));
    for (let x = xH; x < xPu; x++) pon(x, y, hilera(F.FRANJAS_HUMO, x, y));
    for (let x = xPu; x <= xd; x++) pon(x, y, x === xd ? 0 : hilera(F.FRANJAS_TAPA, x, y));
    pon(xPu - 1, y, 0); pon(xH, y, 0);
  }
  // Los aros: abrazan el tubo y se apagan abajo.
  const aro = (x, a, c) => { for (let y = yT + 1; y < yB - 1; y++) { const xc = x + curva(x, y); for (let q = 0; q < a; q++) pon(xc + q, y, c(t(y))); } };
  const bronce = (q) => (q < 0.06 ? 45 : q < 0.33 ? 28 : q < 0.57 ? 45 : q < 0.72 ? 44 : q < 0.86 ? 47 : 39);
  for (const x of [X_CABINA + 16, X_CABINA + 44, X_CABINA + 72]) aro(x, 2, bronce);
  aro(xHumo - 8, 6, (q) => (q < 0.06 ? 9 : q < 0.33 ? 10 : q < 0.57 ? 9 : q < 0.86 ? 8 : 39));
  // El brocal, donde la caldera sale de la cabina.
  aro(X_CABINA + 2, 5, (q) => (q < 0.06 ? 23 : q < 0.33 ? 24 : q < 0.57 ? 23 : q < 0.72 ? 31 : 1));
  // El pasamanos, con sus soportes de bronce.
  {
    const yC = yT + 18, x1 = X_CABINA + 8, x2 = xHumo - 14;
    r(x1, yC, x2 - x1, 1, 0); r(x1, yC + 1, x2 - x1, 1, 25); r(x1, yC + 2, x2 - x1, 1, 0);
    for (const x of [X_CABINA + 8, X_CABINA + 42, x2 - 2]) { r(x, yC - 1, 3, 6, 0); r(x + 1, yC, 1, 4, 45); }
  }
  // El caño del agua, en la parte de la caldera que ya está en sombra.
  {
    const yC = yT + 34, x1 = X_CABINA + 8, x2 = xHumo - 22;
    r(x1, yC, x2 - x1, 1, 0); r(x1, yC + 1, x2 - x1, 1, 24); r(x1, yC + 2, x2 - x1, 1, 31); r(x1, yC + 3, x2 - x1, 1, 0);
    for (const x of [X_CABINA + 22, X_CABINA + 50]) { r(x, yC - 1, 3, 6, 0); r(x + 1, yC, 1, 4, 47); }
    mapa(x2, yC, F.CODO);
  }
  // Lo que va parado encima, sobre el lomo: apoya al 20 % del tubo y asoma por encima del borde. La sombra le cae hacia acá.
  const encima = (m, x) => {
    const an = m[0].length;
    for (let q = 2; q < an - 2; q++) for (let j = 0; j < 4; j++) { const c = h.ver(x + q, yPieLomo + j), o = F.OSCURO[c]; if (c > 0 && o !== undefined) h.ind[(yPieLomo + j) * W + x + q] = o; }
    mapa(x, yPieLomo - m.length + 1, m);
  };
  encima(F.DOMO, X_CABINA + 2);
  encima(F.CAMPANA, X_CABINA + 34);
  encima(F.ARENERA, X_CABINA + 54);
  encima(F.CHIMENEA, xHumo + 8);
  encima(F.FARO, xPunta - 13);
  // La panza en sombra, detrás de las ruedas.
  r(X_CABINA, yB, xP - X_CABINA, 22, 1); r(X_CABINA, yB + 22, xP - X_CABINA, 1, 0);
  return aLienzo(h.ind, W, H);
}

/** EL ESTRIBO, EL CILINDRO Y EL MIRIÑAQUE: encima de las ruedas, que se les ve sólo lo de abajo. */
function laminaEstribo(noche) {
  const h = hoja(W, H, noche), { pon, r, mapa } = h, ancho = xP - X_CABINA;
  mapa(xHumo + 2, yB + 17, PIEZAS_CALDERA.CILINDRO);
  r(X_CABINA, yB, ancho, 6, 23); r(X_CABINA, yB, ancho, 2, 1);
  for (let x = X_CABINA + 3; x < xP; x += 6) pon(x + (x % 12 ? 0 : 2), yB + 4, 24);
  r(X_CABINA, yB + 6, ancho, 1, 25); r(X_CABINA, yB + 7, ancho, 1, 0);
  for (let y = yB + 8; y < yB + 14; y++) for (let x = X_CABINA; x < xP; x++) pon(x, y, (x - X_CABINA) % 32 === 0 ? 0 : 31);
  r(X_CABINA, yB + 10, ancho, 1, 10); r(X_CABINA, yB + 14, ancho, 1, 0);
  const yAl = yB + 6 - HONDO.puntos + 4, yAc = yB + 6;
  // El miriñaque: una tapa a nivel, con la punta sobre el eje de la vía, y debajo del borde de acá bajan los barrotes.
  const xFinC = W - 12, largo = xFinC - xP, yPu = Math.round((yAl + yAc) / 2);
  const mezcla = (a, b, q) => a + (b - a) * q;
  for (let x = xP; x <= xFinC; x++) {
    const q = (x - xP) / largo, yA = Math.round(mezcla(yAl, yPu, q)), yC = Math.round(mezcla(yAc, yPu, q)), alto = Math.round(mezcla(25, 15, q));
    for (let y = yA; y <= yC; y++) pon(x, y, y === yA || x === xFinC ? 0 : y === yC ? 10 : (y - yPu + 96) % 9 === 0 ? 8 : 9);
    for (let j = 1; j <= alto; j++) pon(x, yC + j, j === alto || x === xFinC ? 0 : (x - xP) % 5 < 2 ? 39 : j < 3 ? 8 : 1);
    pon(x, yC + alto + 1, 0);
  }
  // La viga: atraviesa la tapa de lado a lado.
  r(xP, yAl - 1, 5, yAc - yAl + 2, 0); r(xP + 1, yAl, 3, yAc - yAl, 8); r(xP + 1, yAl, 1, yAc - yAl, 10);
  return aLienzo(h.ind, W, H);
}

/**
 * EL CUERPO: el techo que tapa el tanque, el pasillo, el carbón y la cabina, y la pared de acá, de punta a punta. Va encima de todo: la cabina tapa
 * dónde arranca la caldera, y las dos cajas les tapan lo de arriba a las ruedas.
 */
function laminaCuerpo(noche) {
  const an = X_CABINA + 2, h = hoja(an, H, noche), { pon, r, mapa } = h;
  const yTapa = yAlero - HONDO.puntos, entra = [14, 10, 7, 5, 3, 2, 1, 1];

  // ===== EL TECHO, UNO SOLO DE PUNTA A PUNTA: el tanque, el pasillo y el carbón van abajo, como la cabina *(Santi: "yo pensaba que esa parte del carbón
  // estaba dentro de la locomotora, debajo del techo")*. Una tapa lisa con la curva alrededor, igual que los vagones.
  const CURVA = [25, 24, 23, 31], jLisa = 6, jAca = HONDO.puntos - 16;
  for (let y = yTapa; y < yAlero; y++) {
    const j = y - yTapa, m = entra[j] || 0;
    const nivelY = j < 3 ? 2 : j < jLisa ? 1 : j < jAca ? 0 : j < jAca + 6 ? 1 : j < jAca + 11 ? 2 : 3;
    for (let x = m; x < an - m; x++) {
      const e = Math.min(x, an - 1 - x), nivelX = e < 5 ? 2 : e < 11 ? 1 : 0, nivel = Math.max(nivelX, nivelY);
      pon(x, y, nivel === 0 && hash(x >> 3, y) < 0.14 ? 24 : CURVA[nivel]);
    }
    pon(m, y, 0); pon(an - 1 - m, y, 0);
  }
  r(14, yTapa, an - 28, 1, 0);
  for (let x = 14; x < an - 14; x += 3) { pon(x, yTapa + jLisa, 31); pon(x, yTapa + jAca, 31); }
  for (let x = 12, n = 0; x < an - 12; x += 24, n++) {
    r(x, yTapa + 2, 1, HONDO.puntos - 3, 31);
    for (let y = yTapa + 3; y < yAlero - 1; y += 3) { pon(x + 1, y, 25); pon(x - 1, y, 23); }
    for (let k = 0; k < 2; k++) if (hash(n, 80 + k) < 0.7) {
      const q = x + 3 + Math.floor(hash(n, 84 + k) * 19), y0 = yTapa + jAca + 1, largo = 2 + Math.floor(hash(n, 92 + k) * 9);
      for (let j = 0; j < largo && y0 + j < yAlero - 1; j++) pon(q, y0 + j, j < 2 ? 11 : 4);
    }
  }
  // Lo que dice qué hay abajo, en el mismo lugar que adentro: la tapa del tanque del lado de allá, la boca del carbón del lado de acá.
  mapa(24, yTapa + 7, TAPA_TANQUE);
  mapa(30, yTapa + 16, BOCA_CARBON);
  mapa(X_TENDER + 90, yTapa + jAca - 8, VENTILADOR, COL_FIERRO);

  // ===== LA PARED DE ACÁ, de punta a punta: chapa remachada con la franja roja, como en el asalto
  for (let y = yPared; y < yBastidor; y++) for (let x = 0; x < an; x++) pon(x, y, x % 32 === 0 ? 0 : x % 32 === 1 ? 31 : 23);
  for (let x = 0; x < an; x += 32) for (const q of [-3, 4]) for (const y of [yPared + 4, yBastidor - 3]) if (x + q >= 0) pon(x + q, y, 24);
  r(0, yBastidor - 9, an, 2, 10);
  // El borde que agarra la luz: el alero con su sombra.
  r(0, yAlero, an, 1, 0); r(0, yAlero + 1, an, 1, 25); r(0, yAlero + 2, an, 1, 24); r(0, yAlero + 3, an, 1, 0);
  r(0, yPared, an, 2, 31);
  for (let x = 0; x < an; x += 2) pon(x, yPared + 2, 31);
  // La ventana de la cabina y la chapa de bronce del fabricante.
  mapa(X_TENDER + 96, yPared + 5, VENTANA, noche ? COL_VENTANA_NOCHE : COL_VENTANA);
  {
    const cx = X_TENDER + 28, cy = yPared + 9;
    r(cx, cy, 34, 13, 0); r(cx + 1, cy + 1, 32, 11, 45); r(cx + 1, cy + 1, 32, 1, 28); r(cx + 4, cy + 4, 26, 1, 44); r(cx + 4, cy + 7, 26, 1, 44);
  }
  // Abajo: la viga, y debajo la sombra.
  r(0, yBastidor, an, 1, 0); r(0, yBastidor + 1, an, 2, 31); r(0, yBastidor + 1, an, 1, 24); r(0, yBastidor + 3, an, 1, 0);
  for (let x = 48; x < an - 40; x++) { pon(x, yBastidor + 4, 1); pon(x, yBastidor + 5, 1); if ((x + yBastidor) % 2) pon(x, yBastidor + 6, 1); }

  // Las esquinas redondas, vistas desde arriba: en las dos puntas, la línea del borde y la del piso suben.
  const c = 12, fondo = yBastidor + 3;
  for (let d = 0; d < c; d++) {
    const L = Math.round(c - Math.sqrt(c * c - (c - d) * (c - d)));
    if (!L) continue;
    for (const x of [d, an - 1 - d]) {
      for (let y = yAlero; y <= fondo; y++) h.ind[(y - L) * an + x] = h.ind[y * an + x];
      for (let y = fondo - L + 1; y <= fondo + 3; y++) h.ind[y * an + x] = -1;
    }
  }
  return aLienzo(h.ind, an, H);
}

/** LAS RUEDAS Y LAS BIELAS: 16 cuadros por vuelta (rayos, contrapeso y bielas salen de la cuenta de cada cuadro, como en el asalto). */
const RUEDA = 18, RY = 15;
function cuadrosRuedas(noche) {
  const xI = X_CABINA, yI = yB + 8, AN = xP - xI, AL = H - yI, q1 = 18, q2 = 58, yC = H - 15 - yI, xCil = xHumo + 2 - xI, yCil = yB + 17 - yI;
  const cuadros = [];
  for (let k = 0; k < 16; k++) {
    const ind = new Int16Array(AN * AL).fill(-1), a = (k / 16) * Math.PI * 2;
    const p = (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < AN && y < AL) ind[y * AN + x] = ton(i, noche); };
    const r = (x, y, w2, h2, i) => { for (let j = 0; j < h2; j++) for (let q = 0; q < w2; q++) p(x + q, y + j, i); };
    const rueda = (cx, cy, R, Ry, ang, rayos, contrapeso) => {
      const paso = (Math.PI * 2) / rayos;
      for (let y = -Ry; y <= Ry; y++) for (let x = -R; x <= R; x++) {
        const v = (y * R) / Ry, d = Math.hypot(x, v);
        if (d > R + 0.4) continue;
        if (d > R - 1 || (d <= R - 3 && d > R - 4)) { p(cx + x, cy + y, 0); continue; }
        if (d > R - 3) { p(cx + x, cy + y, y < 0 ? 25 : 23); continue; }
        if (d <= R * 0.2) { p(cx + x, cy + y, 24); continue; }
        let th = Math.atan2(v, x) - ang;
        th = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (contrapeso && Math.abs(th - Math.PI) < 0.8 && d > R * 0.42) { p(cx + x, cy + y, 1); continue; }
        const m = ((th % paso) + paso) % paso, lejos = Math.min(m, paso - m) * d;
        if (lejos < 0.75) p(cx + x, cy + y, 10); else p(cx + x, cy + y, 1);
      }
    };
    rueda(q1, yC, RUEDA, RY, a, 6, true); rueda(q2, yC, RUEDA, RY, a, 6, true);
    rueda(xHumo + 8 - xI, H - 8 - yI, 9, 8, a * 2, 5, false); rueda(xHumo + 32 - xI, H - 8 - yI, 9, 8, a * 2, 5, false);
    // La biela que une las dos ruedas va siempre derecha; su altura sube y baja con la manivela.
    const dx = 9 * Math.cos(a), dy = 7.5 * Math.sin(a), yP = Math.round(yC + dy);
    r(Math.round(q1 + dx), yP - 2, q2 - q1, 4, 0); r(Math.round(q1 + dx), yP - 1, q2 - q1, 1, 25); r(Math.round(q1 + dx), yP, q2 - q1, 1, 24);
    for (const q of [q1, q2]) { const xq = Math.round(q + dx); r(xq - 3, yP - 3, 6, 6, 0); r(xq - 2, yP - 2, 4, 4, 28); }
    // La biela larga y el vástago: la cruceta va y viene derecho, entrando y saliendo del cilindro.
    const xc = xCil - 8 + dx, ya = yCil + 8, xq2 = q2 + dx, n = Math.max(1, Math.round(xc - xq2));
    for (let i = 0; i <= n; i++) { const x = xq2 + i, y = yP + ((ya - yP) * i) / n; r(Math.round(x), Math.round(y) - 1, 1, 3, 0); p(x, y, 25); }
    r(Math.round(xc), ya - 1, xCil + 4 - Math.round(xc), 3, 0); r(Math.round(xc), ya, xCil + 4 - Math.round(xc), 1, 25);
    r(Math.round(xc) - 3, ya - 3, 6, 7, 0); r(Math.round(xc) - 2, ya - 2, 4, 5, 24);
    cuadros.push(aLienzo(ind, AN, AL));
  }
  return { cuadros, x: xI, y: yI, an: AN, al: AL };
}

/** EL HUMO: una columna gorda que sale de la chimenea y se la lleva el viento hacia la cola. Los copos son a mano; dónde va cada uno, de una cuenta. */
const AN_H = 370, AL_H = 112;
function cuadrosHumo(noche) {
  const COPOS = 26, xB = AN_H - 24, yBo = AL_H - 10, H_ = PIEZAS_CALDERA.HUMO, cuadros = [];
  const copoDe = (q) => (q < 0.03 ? 'm' : q < 0.08 ? 'g' : q < 0.2 ? 'x' : q < 0.86 ? 'X' : q < 0.94 ? 'x' : 'g');
  for (let f = 0; f < 8; f++) {
    const ind = new Int16Array(AN_H * AL_H).fill(-1);
    const pinta = (c, cx, cy, col) => H_[c].forEach((fila, j) => { for (let q = 0; q < fila.length; q++) {
      const x = Math.round(cx) + q, y = Math.round(cy) + j;
      if (fila[q] !== '.' && x >= 0 && y >= 0 && x < AN_H && y < AL_H) ind[y * AN_H + x] = col[fila[q]];
    } });
    for (let i = COPOS - 1; i >= 0; i--) {
      const q = (i + f / 8) / COPOS, c = copoDe(q), an = H_[c][0].length, al = H_[c].length;
      const col = !noche
        ? (q < 0.1 ? { o: 1, H: 24, h: 31 } : q < 0.24 ? { o: 31, H: 24, h: 23 } : { o: 23, H: 25, h: 24 })
        : q < 0.1 ? { o: 1, H: 31, h: 1 } : q < 0.24 ? { o: 1, H: 23, h: 31 } : { o: 31, H: 24, h: 23 };
      const x = xB - Math.pow(q, 1.2) * (AN_H - 60), y = yBo - Math.pow(q, 0.5) * 66, abre = Math.min(1, q * 4);
      pinta(c, x - an / 2 + Math.sin(q * 19) * 5 * abre, y - al / 2 + Math.cos(q * 14) * 5 * abre, col);
      if (q > 0.08) pinta(c, x - an / 2 + 8 + Math.sin(q * 31 + 1) * 6, y - al / 2 + 6 + Math.cos(q * 23 + 2) * 5, col);
    }
    cuadros.push(aLienzo(ind, AN_H, AL_H));
  }
  return cuadros;
}

const hecho = new Map();
function piezasDe(noche) {
  const k = (noche ? 'n' : 'd') + HONDO.puntos;
  if (!hecho.has(k)) hecho.set(k, { caldera: laminaCaldera(noche), estribo: laminaEstribo(noche), cuerpo: laminaCuerpo(noche), ruedas: cuadrosRuedas(noche), humo: cuadrosHumo(noche) });
  return hecho.get(k);
}

/** La locomotora entera. `x0`: donde arranca la cabina del tramo, que es donde arranca el ténder; `recorrido`: cuánto corrió el tren, para las ruedas. */
export function dibujarLocoNueva(ctx, x0, base, recorrido, t, noche) {
  const P = piezasDe(noche), x = Math.floor(x0 / PASO) * PASO, yP = base - H * PASO;
  const liso = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(P.caldera, x, yP, W * PASO, H * PASO);
  // Las ruedas del ténder y de la cabina, y las grandes.
  ruedasYCarreton(ctx, x, [36, 128, 226], base, recorrido, noche);
  const R = P.ruedas, k = Math.floor((recorrido / (Math.PI * 2 * RUEDA * PASO)) * 16);
  ctx.drawImage(R.cuadros[((k % 16) + 16) % 16], x + R.x * PASO, yP + R.y * PASO, R.an * PASO, R.al * PASO);
  ctx.drawImage(P.estribo, x, yP, W * PASO, H * PASO);
  ctx.drawImage(P.cuerpo, x, yP, (X_CABINA + 2) * PASO, H * PASO);
  // El humo va por encima de todo: anda alto.
  const yBoca = yPieLomo - PIEZAS_CALDERA.CHIMENEA.length + 6, xBoca = xHumo + 19;
  ctx.drawImage(P.humo[Math.floor(t * 9) % 8], x + (xBoca - (AN_H - 24)) * PASO, yP + (yBoca - (AL_H - 10)) * PASO, AN_H * PASO, AL_H * PASO);
  ctx.imageSmoothingEnabled = liso;
  // El haz del faro, apenas, de noche.
  if (noche) {
    const fx = x + (xPunta + 2) * PASO, fy = yP + (yPieLomo - 7) * PASO;
    ctx.save();
    ctx.fillStyle = '#ffe7a8';
    const TRAMOS = 72, largo = 4 * PASO;
    for (let i = 0; i < TRAMOS; i++) {
      const q0 = (i * largo) / 170, arriba = Math.round((fy - 22 * q0) / PASO) * PASO, abajo = Math.round((fy + 34 * q0) / PASO) * PASO;
      ctx.globalAlpha = 0.14 * (1 - Math.floor(i / 12) / 6);
      ctx.fillRect(fx + i * largo, arriba, largo, Math.max(PASO, abajo - arriba));
    }
    ctx.restore();
  }
}

// ----------------------------------------------------------------- la cola

/** EL FAROL DE COLA, a mano: rojo, en su poste. */
const FAROL_COLA = [
  '..ooooo..',
  '.oHHHHHo.',
  '.ooooooo.',
  '.oRRrroo.',
  '.oRrrqoM.',
  '.orrqqoM.',
  '.ooooooo.',
  '.oMMMMmo.',
  '..ooooo..',
];
/** EL ESCALÓN DE LA COLA, a mano: por acá se sube desde la vía. */
const ESCALON = [
  'ooooooooooooooo',
  'oHHHHHHHHHHHHho',
  'oMMMMMMMMMMMMmo',
  'ooooooooooooooo',
  '.oMo.......oMo.',
  '.oMo.......oMo.',
  '.ooooooooooooo.',
  '.oHHHHHHHHHHho.',
  '.ooooooooooooo.',
];

/**
 * LA LUZ DEL FAROL ROJO, DE NOCHE *(Santi: "quiero que ilumine bastante por la noche")*: una mancha grande por escalones, con el borde tramado como la luz del resto del
 * juego (engine/luz.js), que suma rojo a lo que hay debajo (también al vagón y al suelo: por eso se dibuja después de todo el tren). Sale de una cuenta.
 */
const R_LUZ = 120, BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], FUERZA = [0, 0.13, 0.22, 0.32, 0.44, 0.58];
let luzRoja = null;
function laminaLuzRoja() {
  if (luzRoja) return luzRoja;
  const lado = R_LUZ * 2, datos = new Uint8ClampedArray(lado * lado * 4);
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
    const d = Math.hypot(x - R_LUZ, y - R_LUZ) / R_LUZ;
    if (d > 1) continue;
    const a = FUERZA[Math.floor(4.6 * Math.pow(1 - d, 1.5) + BAYER[y & 3][x & 3] / 16)], k = (x + y * lado) * 4;
    datos[k] = 255; datos[k + 1] = 30; datos[k + 2] = 20; datos[k + 3] = Math.round(a * 255);
  }
  luzRoja = document.createElement('canvas');
  luzRoja.width = luzRoja.height = lado;
  luzRoja.getContext('2d').putImageData(new ImageData(datos, lado, lado), 0, 0);
  return luzRoja;
}

export function dibujarLuzDeCola(ctx, x0, base, t) {
  const x = Math.floor(x0 / PASO) * PASO, yP = base - H * PASO, cx = x + 5 * PASO, cy = yP + 68 * PASO, lado = R_LUZ * 2 * PASO;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.93 + Math.sin(t * 5) * 0.07;
  ctx.drawImage(laminaLuzRoja(), cx - lado / 2, cy - lado / 2, lado, lado);
  ctx.restore();
}

/**
 * LA COLA: el balcón del último vagón, de chapa y fierro *(Santi: "la cola debería ser de chapa no de madera")*. Un piso de chapa estriada visto desde
 * arriba, hondo como los vagones, con la baranda de allá, la de acá y la de atrás, que cierra *(Santi: "hay una baranda que no cierra")*, el farol rojo y el escalón.
 */
const colas = new Map();
function laminaCola(ancho, noche) {
  const an = Math.round(ancho / PASO) + 2, k = an + (noche ? 'n' : 'd') + HONDO.puntos;
  if (colas.has(k)) return colas.get(k);
  const h = hoja(an, H, noche), { pon, r, mapa } = h;
  const yCanto = 86, yPiso = yCanto - HONDO.puntos, alto = 13;
  const baranda = (yB) => {
    r(4, yB - alto, an - 4, 3, 24); r(4, yB - alto, an - 4, 1, 25); r(4, yB - alto + 3, an - 4, 1, 0); r(4, yB - alto - 1, an - 4, 1, 0);
    r(4, yB - alto + 7, an - 4, 2, 23); r(4, yB - alto + 9, an - 4, 1, 0);
    for (const x of [4, 22, an - 4]) { r(x, yB - alto - 2, 3, alto + 2, 23); pon(x + 1, yB - alto - 2, 25); r(x - 1, yB - alto - 2, 1, alto + 2, 0); r(x + 3, yB - alto - 2, 1, alto + 2, 0); }
  };
  baranda(yPiso);
  // El piso: chapa estriada en paños, con la sombra de la baranda de allá.
  r(3, yPiso - 1, an - 3, 1, 0);
  for (let y = yPiso; y < yCanto; y++) for (let x = 3; x < an; x++) {
    const j = y - yPiso, junta = x % 32 === 0;
    pon(x, y, junta ? 0 : j % 4 === 1 && (x + (j >> 2) * 2) % 4 !== 3 ? 24 : 23);
  }
  r(3, yPiso, an - 3, 2, 31);
  // La baranda de atrás, de allá para acá: de arriba se ve su canto, entero.
  const y0 = yPiso - alto, y1 = yCanto - alto;
  for (let y = y0; y < y1; y++) { pon(2, y, 0); pon(3, y, 25); pon(4, y, 24); pon(5, y, 23); pon(6, y, 0); }
  // El frente del piso, remachado, y la viga.
  r(3, yCanto, an - 3, 1, 0); r(3, yCanto + 1, an - 3, 1, 25); r(3, yCanto + 2, an - 3, 3, 23); r(3, yCanto + 5, an - 3, 1, 0);
  for (let x = 8; x < an; x += 8) pon(x, yCanto + 3, 24);
  for (let x = 4; x < an; x++) { pon(x, yCanto + 6, 1); if ((x + yCanto) % 2) pon(x, yCanto + 7, 1); }
  mapa(14, yCanto + 6, ESCALON);
  baranda(yCanto);
  // El farol, en el poste de acá.
  mapa(1, yCanto - alto - 9, FAROL_COLA, { ...COL_PIEZAS, R: 10, r: 9, q: 8 });
  // De noche está prendido: el vidrio no se apaga con el resto.
  if (noche) FAROL_COLA.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if ('Rrq'.includes(fila[q])) h.ind[(yCanto - alto - 9 + j) * an + 1 + q] = fila[q] === 'q' ? 10 : 45; });
  const lam = { img: aLienzo(h.ind, an, H), an };
  colas.set(k, lam);
  return lam;
}

export function dibujarColaNueva(ctx, x0, ancho, base, noche) {
  const L = laminaCola(ancho, noche), x = Math.floor(x0 / PASO) * PASO, yP = base - H * PASO;
  const liso = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(L.img, x, yP, L.an * PASO, H * PASO);
  ctx.imageSmoothingEnabled = liso;
}
