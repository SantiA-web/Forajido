/**
 * 🎨 ESTILO NUEVO · P1 — EL VAGÓN DE PASAJEROS POR DENTRO.
 *
 * La maqueta que aprobó Santi (*"uuuufffff. Espectacular. Me encantó"*), hecha
 * de verdad: el piso de madera gastada, la pared del fondo con sus ventanales y
 * sus faroles, los asientos de cuero rojo y la pared de adelante. De día el sol
 * entra por los ventanales del fondo; de noche se prenden los faroles. Todo en
 * la grilla de puntos (`PASO` unidades del mundo por punto) y con los 48
 * colores de la paleta (engine/paleta.js), iluminado por escalones
 * (engine/luz.js). Sólo se ve con la prueba prendida ([F9]).
 *
 * EL BORDE DE LAS PAREDES ES DEL COLOR DEL VAGÓN *(Santi: "pondría el color de
 * como se ve ese mismo vagón en el galope. O sea, si el vagón se ve morado, el
 * borde es morado. Y así con cualquier vagón")*: sale de
 * `CONFIG.colors.costado.coche`, llevado al color más parecido de la paleta.
 *
 * CADA VAGÓN SE DIBUJA E ILUMINA UNA SOLA VEZ (de día y de noche, por
 * separado) y se guarda en piezas: el piso, la pared del fondo, cada asiento y
 * la pared de adelante. La escena mezcla las piezas altas con la gente,
 * ordenadas por `base`, igual que el dibujo de siempre. Iluminar cuesta (15 ms
 * cada 60.000 puntos); estampar lo ya iluminado, nada.
 *
 * 🔻 Simplificaciones de esta etapa: la luz no se hamaca con el meneo del tren
 * (ya está iluminada y guardada) y la gente todavía es la de antes, sin la luz
 * nueva (eso es P2).
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { masCercano, sombrear } from '../../engine/paleta.js';

/** Cuántas unidades del mundo mide un punto de la grilla (0,75 con puntos de 3). */
export const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;

/** Qué vagones ya se dibujan en el estilo nuevo. */
const NUEVOS = new Set(['pasajeros']);

/**
 * LOS VAGONES DEL ESTILO NUEVO de este tren: sus columnas (para que el dibujo
 * viejo las saltee), sus tramos en x (para que las luces viejas no les caigan
 * encima) y sus piezas ya iluminadas.
 */
export function vagonesNuevos(train, dia) {
  const clave = dia ? 'd' : 'n';
  if (train._estiloNuevo && train._estiloNuevo.clave === clave) return train._estiloNuevo;
  const cols = new Set();
  const tramos = [];
  const piso = [], altas = [];
  for (const w of train.wagons) {
    if (!NUEVOS.has(w.id)) continue;
    const cuantas = Math.round(w.width / train.map.size);
    for (let c = w.colStart; c < w.colStart + cuantas; c++) cols.add(c);
    tramos.push([w.x, w.x + w.width]);
    const v = vagon(train, w, dia);
    piso.push(...v.piso);
    altas.push(...v.altas);
  }
  train._estiloNuevo = { clave, cols, tramos, piso, altas };
  return train._estiloNuevo;
}

/** Una pieza: un canvas ya iluminado, dónde va (en el mundo) y su `base`. */
function pieza(datos, ancho, alto, x, y, base) {
  const cv = document.createElement('canvas');
  cv.width = ancho; cv.height = alto;
  cv.getContext('2d').putImageData(new ImageData(datos, ancho, alto), 0, 0);
  return { img: cv, x, y, w: ancho * PASO, h: alto * PASO, base };
}

/** Estampa una pieza en el mundo (la cámara ya está puesta y alineada). */
export function estamparPieza(r, p) {
  r.ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
}

function vagon(train, w, dia) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  // El origen, alineado a la grilla: si no, el vagón quedaría corrido medio
  // punto de todo lo demás y la grilla lo partiría.
  const x0 = Math.floor(w.x / PASO) * PASO;
  const yArriba = -tc.alturaPared;
  const yAbajo = map.rows * S + tc.alturaCaraAfuera;
  const W = Math.ceil((w.x + w.width - x0) * PX);
  const H = Math.round((yAbajo - yArriba) * PX);
  const ax = (u) => Math.round((u - x0) * PX);
  const ay = (u) => Math.round((u - yArriba) * PX);
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];

  // ---- los colores (índices de la paleta)
  const cc = CONFIG.colors.costado;
  const hex = cc.coche[w.id] || cc.coche.pasajeros;
  const n = parseInt(hex.slice(1), 16);
  const BORDE = masCercano((n >> 16) & 255, (n >> 8) & 255, n & 255);
  const BORDE_L = sombrear(BORDE, 1), BORDE_S = sombrear(BORDE, -1), BORDE_SS = sombrear(BORDE, -2);

  // ---- las capas: una por pieza, todas del tamaño del vagón
  const capa = () => ({ i: new Int16Array(W * H).fill(-1), m: new Uint8Array(W * H) });
  const PISO = capa(), FONDO = capa(), FRENTE = capa(), ASIENTOS = capa();
  const pone = (c) => (x, y, i, emite) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    c.i[y * W + x] = i; c.m[y * W + x] = emite ? 1 : 0;
  };
  const rect = (c) => { const p = pone(c); return (x, y, ww, hh, i, emite) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) p(x + q, y + j, i, emite); }; };
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;

  // ---- dónde están las cosas
  const corridas = (fila) => {
    const out = [];
    for (let c = 0; c < cols; c++) {
      if (casilla(c, fila) !== 'W' || casilla(c - 1, fila) === 'W') continue;
      let d = c; while (casilla(d + 1, fila) === 'W') d++;
      out.push([c, d]);
    }
    return out;
  };
  const ventanasFondo = corridas(0), ventanasFrente = corridas(map.rows - 1);
  const yPisoArriba = 2 * S, yPisoAbajo = (map.rows - 2) * S;   // 32 y 128: el adentro

  /**
   * LOS FAROLES, EN LA PARED DEL FONDO, uno cada `faroles.cadaColumnas`
   * columnas como los de siempre, corridos a la tabla más cercana si les toca
   * un ventanal. (Los de siempre colgaban sobre el pasillo y sólo se veía la
   * luz; en la maqueta que aprobó Santi van en la pared.)
   */
  const F = CONFIG.tresCuartos.faroles;
  const cuantos = Math.max(1, Math.floor((cols - 2) / F.cadaColumnas));
  const sobra = cols - cuantos * F.cadaColumnas;
  const faroles = [];
  for (let q = 0; q < cuantos; q++) {
    let c = Math.round(sobra / 2 + (q + 0.5) * F.cadaColumnas);
    for (let d = 0; d < 4 && casilla(c, 0) === 'W'; d++) c += (d % 2 ? -(d + 1) : d + 1);
    faroles.push(ax(w.x + (c + 0.5) * S));
  }

  // ===== EL PISO: tablas a lo largo del vagón, de madera gastada
  {
    const r = rect(PISO), p = pone(PISO);
    const y0 = ay(yPisoArriba), y1 = ay(yPisoAbajo + 3);
    for (let y = y0; y < y1; y++) {
      const tabla = Math.floor((y - y0) / 6), off = (tabla * 37 + w.colStart * 11) % 83;
      for (let x = 0; x < W; x++) {
        let i = (y - y0) % 6 === 5 ? 32 : (tabla % 2 ? 33 : 34);
        if ((x + off) % 83 === 0) i = 32;
        if ((y - y0) % 6 === 0 && i !== 32) i = 35;
        if ((x + off) % 83 === 3 && (y - y0) % 6 === 2) i = 36;          // el clavo
        if (i !== 32 && hash(x, y) < 3) i = 33;                           // el gastado
        p(x, y, i);
      }
    }
    r(0, y0, W, 2, 32);                                                   // la sombra de la pared del fondo
    // Las puntas del vagón (las paredes de los costados, vistas desde arriba).
    for (let c = 0; c < cols; c++) for (let f = 2; f < map.rows - 2; f++) {
      if (casilla(c, f) !== '#') continue;
      const x = ax(w.x + c * S), x2 = ax(w.x + (c + 1) * S), y = ay(f * S), y2 = ay((f + 1) * S);
      r(x, y, x2 - x, y2 - y, 0);
      r(x + 1, y, x2 - x - 2, y2 - y, BORDE);
      r(x + 1, y, 2, y2 - y, BORDE_L);
      if (casilla(c, f + 1) !== '#') r(x + 1, y2 - 4, x2 - x - 2, 3, BORDE_S);
    }
  }

  // ===== LA PARED DEL FONDO: el borde del color del vagón y la cara de tablas
  const filete = (r, y) => {
    r(0, y, W, 1, 0); r(0, y + 1, W, 2, BORDE_L); r(0, y + 3, W, 3, BORDE); r(0, y + 6, W, 1, BORDE_S); r(0, y + 7, W, 1, 0);
  };
  {
    const r = rect(FONDO), p = pone(FONDO);
    const yCara = 8, yPie = ay(yPisoArriba);
    filete(r, 0);
    for (let x = 0; x < W; x++) for (let y = yCara; y < yPie; y++) p(x, y, x % 8 === 0 ? 1 : (Math.floor(x / 8) % 2 ? 4 : 3));
    for (let x = 4; x < W; x += 8) { p(x, yCara + 2, 5); p(x, yPie - 4, 5); }
    r(0, yPie - 2, W, 2, 1);
    for (const [c0, c1] of ventanasFondo) {
      const vx = ax(w.x + c0 * S) + 3, vw = ax(w.x + (c1 + 1) * S) - 3 - vx;
      const vy = yCara + 10, vh = Math.round((yPie - yCara) * 0.55);
      r(vx - 1, vy - 1, vw + 2, vh + 2, 0);
      r(vx, vy, vw, vh, 5);
      r(vx + 2, vy + 2, vw - 4, vh - 4, dia ? 21 : 18);
      r(vx + Math.floor(vw / 2) - 1, vy + 2, 2, vh - 4, 5);
      r(vx + 2, vy + Math.floor(vh / 2), vw - 4, 1, 5);
      if (dia) {
        for (let q = 0; q < 5; q++) p(vx + 4 + q, vy + 3 + q, 22);
        for (let q = 0; q < 3; q++) p(vx + Math.floor(vw / 2) + 3 + q, vy + Math.floor(vh / 2) + 2 + q, 22);
      } else {
        p(vx + 5, vy + 4, 21); p(vx + vw - 6, vy + 6, 20); p(vx + 9, vy + vh - 6, 20);
      }
    }
    for (const fx of faroles) {
      const y = yCara + 12;
      r(fx - 3, y - 2, 7, 1, 0); r(fx - 1, y - 1, 3, 1, 28);
      r(fx - 3, y, 7, 9, 0);
      r(fx - 2, y + 1, 5, 7, dia ? 25 : 29, !dia);
      r(fx, y + 2, 1, 5, dia ? 24 : 30, !dia);
      r(fx - 3, y + 8, 7, 1, 28); r(fx - 1, y + 9, 3, 1, 6);
    }
  }

  // ===== LOS ASIENTOS: respaldo a la izquierda, almohadón de cuero y patas
  const asientos = [];
  {
    const r = rect(ASIENTOS);
    const sube = Math.round(tc.alturaAsiento * 1.7 * PX);
    for (let c = 0; c < cols; c++) for (let f = 1; f < map.rows - 1; f++) {
      if (casilla(c, f) !== 'S' || casilla(c, f - 1) === 'S') continue;
      let fin = f; while (casilla(c, fin + 1) === 'S') fin++;
      const x = ax(w.x + c * S), x2 = ax(w.x + (c + 1) * S);
      const y = ay(f * S) - sube, y2 = ay((fin + 1) * S);
      const bw = x2 - x, bh = y2 - y;
      // El contorno va por pieza (respaldo y almohadón): con uno solo para la
      // caja entera, arriba del almohadón quedaba un bloque negro.
      r(x, y, 7, bh - 3, 0);
      r(x + 5, y + sube - 3, bw - 5, bh - sube, 0);
      r(x + 1, y + 1, 5, bh - 8, 8);                           // el respaldo
      r(x + 1, y + 1, 5, 1, 10); r(x + 2, y + 2, 1, bh - 10, 9);
      r(x + 6, y + sube - 2, bw - 7, bh - sube - 6, 9);        // el almohadón
      r(x + 6, y + sube - 2, bw - 7, 1, 10);
      for (let q = y + sube + 3; q < y + bh - 10; q += 7) r(x + 9 + (q % 2) * 4, q, 1, 1, 8);
      r(x + 1, y + bh - 8, bw - 2, 4, 39);                     // la cara de adelante
      r(x + 1, y + bh - 8, bw - 2, 1, 8);
      r(x + 2, y + bh - 4, 2, 3, 3); r(x + bw - 4, y + bh - 4, 2, 3, 3);   // las patas
      asientos.push({ x, y, w: bw, h: bh, base: (fin + 1) * S - 0.01 });
    }
  }

  // ===== LA PARED DE ADELANTE: el borde y, debajo, su cara de afuera
  {
    const r = rect(FRENTE), p = pone(FRENTE);
    const yTope = ay(yPisoAbajo - tc.alturaParedBaja), yCaraFin = ay(map.rows * S + tc.alturaCaraAfuera) - 1;
    filete(r, yTope);
    for (let x = 0; x < W; x++) for (let y = yTope + 8; y < yCaraFin - 3; y++) p(x, y, x % 6 === 0 ? BORDE_SS : (Math.floor(x / 6) % 2 ? BORDE : BORDE_S));
    r(0, yCaraFin - 3, W, 3, 31); r(0, yCaraFin, W, 1, 0);
    /**
     * Las ventanillas de afuera, más chicas y arriba, como las ve el galope.
     * 🔁 Primero ocupaban casi toda la cara, y la pared de afuera —que está de
     * espaldas al sol y no es donde se juega— le ganaba al adentro.
     */
    for (const [c0, c1] of ventanasFrente) {
      const vx = ax(w.x + c0 * S) + 5, vw = ax(w.x + (c1 + 1) * S) - 5 - vx;
      const vy = yTope + 14, vh = Math.max(6, Math.round((yCaraFin - yTope - 14) * 0.42));
      r(vx - 1, vy - 1, vw + 2, vh + 2, 0);
      // De noche, desde afuera las ventanillas se ven prendidas (como en el galope).
      r(vx, vy, vw, vh, dia ? 19 : 44, !dia);
      if (!dia) r(vx + 1, vy + 1, vw - 2, vh - 2, 28, true);
      r(vx + Math.floor(vw / 2) - 1, vy, 2, vh, 0);
      if (dia) for (let q = 0; q < 3; q++) p(vx + 2 + q, vy + 1 + q, 20);
    }
  }

  // ===== LA LUZ, por escalones
  const tope = ay(yPisoAbajo);
  const campo = dia
    ? (x, y) => {
      if (y < 8) return 0;
      let f = y < ay(yPisoArriba) ? -1 : 0;
      // La cara de afuera de la pared de adelante da la espalda al sol.
      if (y >= ay(yPisoAbajo - tc.alturaParedBaja) + 8) return -1;
      if (y >= ay(yPisoAbajo - tc.alturaParedBaja)) return 0;
      // El sol que entra por cada ventanal del fondo y cae en diagonal al piso.
      const y0 = ay(yPisoArriba);
      for (const [c0, c1] of ventanasFondo) {
        const vx = ax(w.x + c0 * S) + 3, vw = ax(w.x + (c1 + 1) * S) - 3 - vx;
        if (y > y0 && y < tope) {
          const xs = vx + 4 - (y - y0) * 0.5;
          const dentro = Math.min(x - xs, xs + vw - 6 - x, y - y0, (tope - 8) - y);
          f += Math.max(0, Math.min(1, dentro / 5));
        }
      }
      return f;
    }
    : (x, y) => {
      if (y >= ay(yPisoAbajo - tc.alturaParedBaja) + 8) return -2;
      let f = -1.6;
      const yCharco = ay(yPisoArriba) + Math.round((tope - ay(yPisoArriba)) * 0.32);
      for (const fx of faroles) {
        f += 2.2 * Math.max(0, 1 - Math.hypot((x - fx) / 80, (y - yCharco) / 50));
        f += 2.0 * Math.max(0, 1 - Math.hypot((x - fx) / 26, (y - 26) / 18));
      }
      return f;
    };

  const iluminado = (c) => iluminar({ ancho: W, alto: H, indices: c.i, marcas: c.m, campo });
  const recorte = (datos, x, y, ww, hh) => {
    const out = new Uint8ClampedArray(ww * hh * 4);
    for (let j = 0; j < hh; j++) out.set(datos.subarray(((y + j) * W + x) * 4, ((y + j) * W + x + ww) * 4), j * ww * 4);
    return out;
  };
  const enMundo = (x, y) => [x0 + x * PASO, yArriba + y * PASO];

  const resultado = { piso: [], altas: [] };
  resultado.piso.push(pieza(iluminado(PISO), W, H, x0, yArriba, 0));
  const yPie = ay(yPisoArriba);
  resultado.altas.push(pieza(recorte(iluminado(FONDO), 0, 0, W, yPie), W, yPie, x0, yArriba, yPisoArriba - 0.01));
  const asi = iluminado(ASIENTOS);
  for (const a of asientos) {
    const [mx, my] = enMundo(a.x, a.y);
    resultado.altas.push(pieza(recorte(asi, a.x, a.y, a.w, a.h), a.w, a.h, mx, my, a.base));
  }
  const yF = ay(yPisoAbajo - tc.alturaParedBaja);
  const [, myF] = enMundo(0, yF);
  resultado.altas.push(pieza(recorte(iluminado(FRENTE), 0, yF, W, H - yF), W, H - yF, x0, myF, map.rows * S - 0.01));
  return resultado;
}
