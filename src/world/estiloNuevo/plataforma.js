/**
 * 🪵 LA PLATAFORMA DEL TREN DE CARGA, EN EL ESTILO NUEVO *(Santi eligió: "una carga por plataforma", "estacas con
 * cadenas", "y algo se cae del tren", y los cuatro detalles: la lona que flamea, el aserrín que vuela, el rótulo del
 * destino y las herramientas tiradas)*.
 *
 * Es el primer vagón sin paredes: un piso de tablas a cielo abierto. Detrás del borde de allá se ve la tierra (la de
 * afuera, world/estiloNuevo/suelo.js, que ya está pintada debajo de todo); del lado de acá, el canto de la viga del
 * costado con los bolsillos de fierro de las estacas, y debajo, en la sombra del vagón, la tierra que pasa y los dos
 * bogies con sus ruedas.
 *
 *  - LAS ESTACAS, de madera, metidas en sus bolsillos a lo largo de los dos bordes: las de allá van detrás de todos;
 *    las de acá, delante.
 *  - LA CARGA, en los seis bultos de dos por dos ('C', data/wagons.js), sujeta con cadenas. Como van dos plataformas
 *    por tren, UNA LLEVA MADERA (pilas de tablones y de troncos) Y LA OTRA MAQUINARIA (la caldera, los juegos de ruedas,
 *    un atado de rieles y la máquina tapada), sorteado (~cargaDePlataforma~).
 *  - LA LONA, atada sobre un bulto, con la punta suelta que flamea con el viento del tren (ocho cuadros a mano).
 *  - EL RÓTULO DEL DESTINO, una tablita clavada en el frente de un bulto de adelante.
 *  - LAS HERRAMIENTAS: la barreta y el mazo de las cadenas, tirados en el piso.
 *
 * LA LUZ: de día, sol pleno (el piso y las tapas) y la sombra de cada bulto en el piso, corrida hacia acá y a la
 * izquierda como la del tren (~sombraDelSuelo~); los frentes, que dan la espalda al sol, más oscuros por su color. De
 * noche, la luna: un escalón abajo, sin sombras.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';
import { pintarSuelo } from './suelo.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;

/**
 * Qué lleva cada plataforma del tren: 'madera' o 'maquinaria'. Con dos, una de cada (cuál primero, sorteado con el tren);
 * con una sola, sorteado. Lo usan el dibujo y lo que se cae (world/caidas.js).
 */
export function cargaDePlataforma(train, w) {
  const plats = train.wagons.filter((v) => v.id === 'plataforma');
  const k = plats.indexOf(w), primera = plats.length ? plats[0].colStart : 0;
  return (k + Math.floor(hash(primera, train.wagons.length) * 2)) % 2 === 0 ? 'madera' : 'maquinaria';
}

/** Qué es cada bulto, en el orden en que aparecen (los de atrás de izquierda a derecha, después los de adelante). */
const BULTOS = {
  madera: ['tablones', 'troncos', 'tapado', 'troncos', 'tablones', 'troncos'],
  maquinaria: ['ruedas', 'caldera', 'tapado', 'rieles', 'cajon', 'ruedas'],
};
/** El rótulo: en qué bulto (el del medio de adelante) y qué dice, en dos renglones. */
const ROTULO = { madera: ['MINA', 'EL ORO'], maquinaria: ['MINA', 'LA PLATA'] };
/** Lo alto de cada bulto, en puntos. */
const ALTO = { tablones: 18, troncos: 22, tapado: 24, ruedas: 20, caldera: 22, rieles: 8, cajon: 22 };

/**
 * 🎏 LA PUNTA SUELTA DE LA LONA, ocho cuadros a mano: atada a la derecha (la última columna) y flameando hacia la
 * izquierda, para atrás del tren, que va para la derecha. Una onda que baja por la tela. L tela con luz, l tela, s el
 * doblez en sombra, o contorno.
 */
const FLAMEO = [
  ['..ooooooL', '.oLLLLLLL', '.oLLLLLLL', '..oLlllll', '...ollsss', '....ooooo'],
  ['...oooooL', '..oLLLLLL', '.oLLLLLLL', '.oLLlllll', '..olllsss', '...oooooo'],
  ['....ooooL', '...oLLLLL', '..oLLLLLL', '.oLLLllll', '.olllssss', '..ooooooo'],
  ['...oooooL', '..oLLLLLL', '..oLLLLLL', '..oLLllll', '.oLlllsss', '.oooooooo'],
  ['..ooooooL', '.oLLLLLLL', '..oLLLLLL', '..oLLllll', '..olllsss', '...oooooo'],
  ['.oooooooL', 'oLLLLLLLL', '.oLLLLLLL', '..oLLllll', '...ollsss', '....ooooo'],
  ['..ooooooL', '.oLLLLLLL', 'oLLLLLLLL', '.oLLlllll', '..olllsss', '...oooooo'],
  ['...oooooL', '..oLLLLLL', '.oLLLLLLL', 'oLLLlllll', '.oLllssss', '..ooooooo'],
];
// 🔁 La lona es de hule verde: con los colores de la tela gastada se perdía contra el piso, que es de ese mismo tono.
const COL_LONA = { o: 0, L: 43, l: 27, s: 26 };

/** Letras de 5 de alto para el rótulo (de 3 de ancho; la M y la N, más anchas: de 3 no se leían). */
const LETRAS = {
  M: ['o...o', 'oo.oo', 'o.o.o', 'o...o', 'o...o'], I: ['ooo', '.o.', '.o.', '.o.', 'ooo'], N: ['o..o', 'oo.o', 'o.oo', 'o..o', 'o..o'],
  A: ['.o.', 'o.o', 'ooo', 'o.o', 'o.o'], E: ['ooo', 'o..', 'oo.', 'o..', 'ooo'], L: ['o..', 'o..', 'o..', 'o..', 'ooo'],
  O: ['.o.', 'o.o', 'o.o', 'o.o', '.o.'], R: ['oo.', 'o.o', 'oo.', 'o.o', 'o.o'], P: ['oo.', 'o.o', 'oo.', 'o..', 'o..'],
  T: ['ooo', '.o.', '.o.', '.o.', '.o.'],
};

export function vagonPlataforma(train, w, dia) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  const x0 = Math.floor(w.x / PASO) * PASO, yArriba = -tc.alturaPared;
  const yAbajo = map.rows * S + 2 * S;
  const W = Math.ceil((w.x + w.width - x0) * PX), H = Math.round((yAbajo - yArriba) * PX);
  const ax = (u) => Math.round((u - x0) * PX), ay = (u) => Math.round((u - yArriba) * PX);
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  const X = (c) => ax(w.x + c * S), Y = (f) => ay(f * S);
  const h = (a, b) => hash(a + w.colStart * 3, b);
  const carga = cargaDePlataforma(train, w);
  w._carga = carga;

  // ---- dónde va cada cosa, en puntos
  const yAllá = Y(0), yAcá = Y(map.rows);              // los dos bordes del piso
  const yViga = yAcá + 12;                              // el pie de la viga del costado
  const yBajo = yViga + 4;                              // el bastidor, en la sombra

  // ---- los bultos: cada grupo de dos por dos de 'C'
  const bultos = [];
  for (let f = 0; f < map.rows; f++) for (let c = 0; c < cols; c++) {
    if (casilla(c, f) !== 'C' || casilla(c - 1, f) === 'C' || casilla(c, f - 1) === 'C') continue;
    bultos.push({ c, f });
  }
  bultos.forEach((b, k) => {
    b.que = BULTOS[carga][k % 6];
    b.rotulo = k === 4;
    b.x0 = X(b.c) + 2; b.x1 = X(b.c + 2) - 2;
    b.y0 = Y(b.f) + 2; b.y1 = Y(b.f + 2) - 1;
    b.alto = ALTO[b.que];
    b.clave = 'plat:' + (w.colStart + b.c) + ',' + b.f;
    // 🛑 Lo que necesita la caída (world/caidas.js), en unidades del mundo: el bulto, sus troncos por capa y sus ruedas.
    const mx = (v) => x0 + v * PASO, an = b.x1 - b.x0, sep = Math.floor((an - 2) / 4);
    b.mundo = { x0: mx(b.x0), x1: mx(b.x1), yc: (b.f + 1) * S };
    b.troncos = [];
    for (const [L, n] of [[0, 4], [1, 3], [2, 2]]) for (let i = 0; i < n; i++) b.troncos.push({ L, x: mx(b.x0 + 6 + Math.round((i + L / 2) * sep)), z: Math.round(L * 8.5) * PASO });
    b.ruedas = [mx(b.x0 + 10), mx(b.x1 - 11)];
  });
  w._bultos = bultos;

  // ===== LA LUZ
  // La sombra de un bulto en el piso: hacia acá y corrida a la izquierda, medio punto por punto que baja, del largo de
  // dos tercios de su alto.
  const sombraDe = (x, y, y0, y1, x0, x1, alto) => {
    const L = Math.round(alto * 0.7);
    for (let d = 1; d <= L; d++) {
      const yy = y - d, xx = x + d * 0.5;
      if (yy >= y0 && yy <= y1 && xx >= x0 && xx <= x1) return true;
    }
    return false;
  };
  const enSombra = (x, y, sin = null) => bultos.some((b) => b !== sin && sombraDe(x, y, b.y0, b.y1, b.x0, b.x1, b.alto));
  // 🔁 De noche, la luz de la luna: lo mismo que la tierra de afuera (`sueloNoche`), porque la plataforma está a cielo
  // abierto como ella. Con un escalón solo, el piso gastado seguía claro y no parecía de noche *(Santi: "al estar arriba
  // de la plataforma cuando es de noche, no parece de noche")*.
  const NOCHE = CONFIG.tresCuartos.sueloNoche;
  const campoPiso = dia ? (x, y) => (y > yAcá ? -1 : enSombra(x, y) ? -1 : 0) : (x, y) => (y > yViga ? NOCHE - 1 : NOCHE);
  const campoCarga = dia ? () => 0 : () => NOCHE;

  // ---- las capas
  const capa = () => ({ i: new Int16Array(W * H).fill(-1), m: new Uint8Array(W * H) });
  const PISO = capa(), FRENTE = capa();
  const pone = (cp) => (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; cp.i[y * W + x] = i; };
  const rect = (cp) => { const p = pone(cp); return (x, y, ww, hh, i) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) p(x + q, y + j, i); }; };
  const mapa = (p, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') p(x + q, y + j, col[fila[q]]); });

  // ===== EL PISO: tablas a lo largo, gastadas por el sol (grises), con sus juntas y los clavos
  {
    const r = rect(PISO), p = pone(PISO);
    // 🔁 Dónde cae la junta de cada tabla, sorteado: corrida siempre lo mismo de una tabla a la otra, las juntas
    // hacían escalera y el piso se veía en diagonal *(Santi: "los tablones están en diagonal y no derechos")*.
    const juntaDe = (tabla) => Math.floor(h(tabla * 7 + 3, 41) * 120);
    for (let y = yAllá; y < yAcá; y++) {
      const tabla = Math.floor((y - yAllá) / 8), off = juntaDe(tabla);
      for (let x = 0; x < W; x++) p(x, y, (y - yAllá) % 8 === 7 || (x + off) % 120 === 0 ? 14 : 15);
    }
    for (let y = yAllá; y < yAcá - 8; y += 8) {
      const tabla = Math.floor((y - yAllá) / 8), off = juntaDe(tabla);
      for (let x = 0; x < W; x++) {
        // (Los clavos de la junta, salteados: todos juntos se leían como dos puntos.)
        if ((x + off) % 120 === 0) { if (h(x, tabla) < 0.4) for (const dx of [-2, 2]) { p(x + dx, y + 2, 23); p(x + dx, y + 5, 23); } continue; }
        const k = h(x, tabla * 13 + 5);
        if (k > 0.03) continue;
        const largo = 3 + Math.floor(h(x, tabla) * 6), fila = 1 + Math.floor(k * 1000) % 5;
        for (let q = 0; q < largo; q++) if ((x + q + off) % 120 !== 0) p(x + q, y + fila, h(tabla, x) < 0.5 ? 16 : 14);
      }
    }
    // Los dos bordes: el canto de la viga de allá (se ve su tapa) y el de acá.
    r(0, yAllá - 2, W, 2, 0); r(0, yAllá, W, 1, 33);
    r(0, yAcá - 1, W, 1, 16);
    // Las puntas: el cabezal de cada extremo, más oscuro.
    for (const xx of [0, W - 4]) { r(xx, yAllá, 4, yAcá - yAllá, 33); r(xx === 0 ? 3 : xx, yAllá, 1, yAcá - yAllá, 0); }
    // La viga del costado, de este lado: madera oscura con el filo de arriba claro y la sombra abajo.
    r(0, yAcá, W, 1, 0); r(0, yAcá + 1, W, 1, 35);
    for (let y = yAcá + 2; y < yViga - 1; y++) for (let x = 0; x < W; x++) p(x, y, x % 24 === 0 ? 32 : 33);
    r(0, yViga - 1, W, 1, 32); r(0, yViga, W, 1, 0);
    // El bastidor, debajo, en la sombra.
    r(0, yViga + 1, W, yBajo - yViga - 1, 1);
  }

  // ===== LAS ESTACAS, en sus bolsillos de fierro, una cada dos casillas en los dos bordes
  const estacas = [];
  for (let c = 1; c < cols - 1; c += 2) estacas.push(X(c) + 8);
  const estaca = (r, p, x, yPie) => {
    const alto = 18;
    r(x - 1, yPie - alto - 1, 5, alto + 1, 0);
    r(x, yPie - alto, 1, alto, 6); r(x + 1, yPie - alto, 1, alto, 5); r(x + 2, yPie - alto, 1, alto, 4);
    r(x, yPie - alto, 3, 1, 7);                          // la punta cortada, que agarra el sol
    if (h(x, yPie) < 0.5) p(x + 1, yPie - alto + 5 + Math.floor(h(yPie, x) * 8), 4);   // un nudo
    r(x - 2, yPie - 4, 7, 4, 0); r(x - 1, yPie - 3, 5, 2, 23); r(x - 1, yPie - 3, 5, 1, 24);   // el bolsillo
  };
  {
    const r = rect(PISO), p = pone(PISO);
    for (const x of estacas) estaca(r, p, x, yAllá + 2);
  }
  {
    const r = rect(FRENTE), p = pone(FRENTE);
    for (const x of estacas) {
      estaca(r, p, x, yAcá + 2);
      // Y su bolsillo en la cara de la viga.
      r(x - 2, yAcá + 2, 7, 8, 0); r(x - 1, yAcá + 3, 5, 6, 23); r(x - 1, yAcá + 3, 1, 6, 24); p(x + 1, yAcá + 7, 31);
    }
  }

  // ===== LAS HERRAMIENTAS, tiradas en el piso, delante de un bulto de adelante: la barreta y el mazo
  {
    const p = pone(PISO);
    const ad = bultos.filter((b) => b.f > map.rows / 2);
    const b = ad[0];
    if (b) {
      const tx = b.x1 + 6, ty = Y(b.f + 2) + 6;
      // La barreta: larga y en diagonal, con la uña en la punta.
      for (let q = 0; q < 22; q++) { const xx = tx + q, yy = ty + Math.floor(q / 4); p(xx, yy - 1, 0); p(xx, yy, 24); p(xx, yy + 1, 0); }
      p(tx - 1, ty - 1, 0); p(tx - 1, ty, 24); p(tx - 2, ty - 1, 24); p(tx - 2, ty - 2, 0);
      // El mazo: el cabo de madera y la cabeza de fierro.
      const mx = tx + 4, my = ty + 9;
      for (let q = 0; q < 13; q++) { p(mx + q, my - 1, 0); p(mx + q, my, 6); p(mx + q, my + 1, 0); }
      mapa(p, mx + 12, my - 3, ['oooo', 'oGgo', 'oggo', 'oggo', 'oggo', 'oooo', '.ss.'], { o: 0, G: 24, g: 23, s: 14 });
    }
  }

  // ===== LA CARGA: cada bulto en su pieza, delante de quien quede detrás
  const piezas = [];
  // (`etapa`: lo que le queda con los frenos rotos: ver `plataforma` en world/caidas.js. 0, entero y con sus cadenas.)
  const dibujarBulto = (b, ra, pa, etapa = 0) => {
    const { x0: bx0, x1: bx1, y0: by0, y1: by1, alto } = b;
    const t0 = by0 - alto, t1 = by1 - alto;            // la tapa
    const an = bx1 - bx0;
    const cadenas = (xs, yTop) => {
      // (Cortadas: lo que queda de cada una, tirada en el piso al pie del bulto.)
      if (etapa > 0) { for (const cx of xs) for (let q = -3; q < 5; q++) pa(cx + q, by1, q & 1 ? 24 : 0); return; }
      for (const cx of xs) {
        for (let y = yTop; y < by1; y++) { const k = (y - yTop) % 3; pa(cx, y, k === 0 ? 0 : k === 1 ? 24 : 23); pa(cx + 1, y, k === 2 ? 0 : 31); }
        // La palanca que la tensa, en el frente.
        const py = t1 + Math.floor((by1 - t1) / 3);
        ra(cx - 2, py - 1, 6, 4, 0); ra(cx - 1, py, 4, 2, 23); pa(cx + 2, py, 24);
      }
    };
    if (b.que === 'tablones') {
      ra(bx0 - 1, t0 - 1, an + 2, by1 - t0 + 2, 0);
      // La tapa: las tablas a lo largo, de seis, con su junta; las puntas desparejas a la izquierda.
      for (let y = t0; y < t1; y++) {
        const fila = Math.floor((y - t0) / 6), corre = Math.floor(h(fila, b.c) * 4);
        for (let x = bx0 + corre; x < bx1; x++) pa(x, y, (y - t0) % 6 === 5 ? 36 : 37);
        if ((y - t0) % 6 !== 5) pa(bx0 + corre, y, 38);
      }
      for (let k = 0; k < 6; k++) { const vx = bx0 + 4 + Math.floor(h(k, b.c + 7) * (an - 10)), vy = t0 + 1 + Math.floor(h(b.c, k) * (t1 - t0 - 3)); for (let q = 0; q < 4; q++) pa(vx + q, vy, 36); }
      // El frente: las capas de tablas de canto, con los separadores cada cuatro.
      for (let y = t1; y < by1; y++) {
        const k = (y - t1) % 3;
        for (let x = bx0; x < bx1; x++) pa(x, y, k === 2 ? 34 : 36);
        pa(bx0, y, k === 2 ? 34 : 37); pa(bx1 - 1, y, k === 2 ? 34 : 37);
      }
      for (let y = t1 + 11; y < by1 - 1; y += 12) for (const sx of [bx0 + 3, Math.round((bx0 + bx1) / 2) - 1, bx1 - 6]) { ra(sx, y - 1, 3, 2, 33); }
      cadenas([bx0 + 8, bx1 - 10], t0);
      return;
    }
    if (b.que === 'troncos') {
      /**
       * Troncos cortos, CRUZADOS (de allá para acá), en pirámide: cuatro abajo, tres, dos arriba. De arriba se ve la
       * corteza de los de arriba de todo, a lo hondo; de frente, la punta cortada de cada uno, redonda, con sus anillos.
       * Así se cargaban los troncos cortos, y así se leen como troncos (acostados a lo largo parecían cajones).
       */
      const R = 5, sep = Math.floor((an - 2) / 4);
      const troncos = [];
      for (const [L, n] of [[0, 4], [1, 3], [2, 2]].filter(([L]) => L <= 2 - etapa)) for (let i = 0; i < n; i++) troncos.push({ L, cx: bx0 + R + 1 + Math.round((i + L / 2) * sep), z: R + Math.round(L * 8.5) });
      for (const T of troncos) {
        const cx = T.cx, yFr = by1 - T.z, yAt = by0 - T.z;
        // La corteza, a lo hondo: la luz arriba al medio, los costados en sombra, las vetas a lo largo.
        for (let y = yAt - R; y < yFr; y++) for (let x = -R; x <= R; x++) {
          const a = Math.abs(x);
          let i = a === R ? 0 : a >= R - 1 ? 3 : a >= 3 ? 4 : x <= 0 && x > -3 ? 5 : 4;
          if (a < R && h(cx + x, Math.floor(y / 3) + T.L) < 0.12) i = 3;
          if (i === 5 && h(cx + x, y) < 0.15) i = 6;
          pa(cx + x, y, i);
        }
        for (let x = -R; x <= R; x++) pa(cx + x, yAt - R - 1, 0);
        // La punta cortada, de frente: el anillo de corteza, la madera clara con los anillos y el corazón.
        for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) {
          const d = Math.hypot(x, y);
          if (d > R + 0.6) continue;
          const i = d > R - 0.4 ? 0 : d > R - 1.4 ? 4 : d < 1 ? 35 : Math.round(d) === 3 ? 36 : x + y < -2 ? 38 : 37;
          pa(cx + x, yFr + y, i);
        }
        if (h(cx, T.L) < 0.5) { pa(cx + 1, yFr - 1, 35); pa(cx + 2, yFr - 2, 35); }   // una rajadura
      }
      cadenas([bx0 + 8, bx1 - 10], by0 - 2 * R - 17);
      return;
    }
    if (b.que === 'tapado') {
      /**
       * La máquina tapada con la lona (la punta que flamea va aparte): la tela cae sobre algo con lomos, así que el borde
       * de arriba no es recto; arriba agarra el sol en los lomos y se hunde entre ellos, y por el frente cae en pliegues
       * hasta el ruedo, atada con dos sogas.
       */
      const lomo = (x) => Math.round(3 * Math.max(0, Math.sin(((x - bx0) / an) * Math.PI * 2 + 0.6)) + 2 * Math.sin(((x - bx0) / an) * Math.PI));
      for (let x = bx0; x < bx1; x++) {
        const tope = t0 - lomo(x), borde = x === bx0 || x === bx1 - 1;
        pa(x, tope - 1, 0);
        for (let y = tope; y < by1; y++) {
          const enTapa = y < t1 - lomo(x) + 2;
          const ola = Math.sin((x - bx0) * 0.45 + (y - t0) * 0.08 + b.c);
          let i = enTapa ? (ola > 0.7 ? 43 : ola > -0.6 ? 27 : 26) : (y - t1 < 2 ? 27 : (Math.sin((x - bx0) * 0.7) > 0.85 ? 42 : 26));
          if (borde) i = 0;
          pa(x, y, i);
        }
      }
      ra(bx0, by1, an, 1, 0);
      for (let x = bx0 + 1; x < bx1 - 1; x++) if (Math.sin(x * 0.9) > 0.2) pa(x, by1 - 1, 42);   // el ruedo arrugado
      // Las sogas: cruzan la tapa y bajan por el frente, con el nudo.
      for (const sx of [bx0 + 9, bx1 - 11]) {
        for (let y = t0 - lomo(sx); y < by1; y++) { pa(sx, y, (y & 1) ? 6 : 5); pa(sx + 1, y, 3); }
        ra(sx - 1, t1 + 4, 4, 3, 5); pa(sx, t1 + 5, 6);
      }
      return;
    }
    if (b.que === 'caldera') {
      /**
       * La caldera acostada CRUZADA (de allá para acá) sobre dos cunas de madera, como los troncos: de arriba se ve el
       * lomo largo, con la luz al medio y las costuras remachadas; de frente, la tapa redonda del hogar con su puertita.
       * 🔁 Acostada a lo largo se leía como un ropero negro.
       */
      const R = Math.min(13, Math.floor(an / 2) - 2), cx = Math.round((bx0 + bx1) / 2), z = R + 3;
      const yFr = by1 - z, yAt = by0 - z;
      // Las cunas: dos maderas que asoman abajo, la de allá y la de acá.
      for (const cy of [by0 + 3, by1 - 3]) { ra(cx - R - 2, cy - 3, 2 * R + 5, 5, 0); ra(cx - R - 1, cy - 2, 2 * R + 3, 3, 5); ra(cx - R - 1, cy - 2, 2 * R + 3, 1, 6); }
      // El lomo, a lo hondo.
      for (let y = yAt - R; y < yFr; y++) for (let x = -R; x <= R; x++) {
        const a = Math.abs(x);
        let i = a === R ? 0 : a >= R - 2 ? 31 : a >= R - 5 ? 23 : x < 0 && x > -5 ? 25 : 24;
        if (a < R && (y - (yAt - R)) % 9 === 4) i = 0;                              // la costura
        else if (a < R - 2 && (y - (yAt - R)) % 9 === 5 && (x & 1)) i = 25;         // los remaches
        pa(cx + x, y, i);
      }
      for (let x = -R; x <= R; x++) pa(cx + x, yAt - R - 1, 0);
      // El domo, sobre el lomo, a la mitad.
      const dy = Math.round((yAt + yFr) / 2) - R;
      ra(cx - 5, dy - 4, 11, 8, 0); ra(cx - 4, dy - 3, 9, 6, 23); ra(cx - 3, dy - 3, 4, 2, 25); ra(cx - 4, dy + 1, 9, 1, 31);
      // La tapa redonda del hogar: el aro remachado, la chapa oscura y la puertita con su manija.
      for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) {
        const d = Math.hypot(x, y);
        if (d > R + 0.6) continue;
        let i = d > R - 0.4 ? 0 : d > R - 2.4 ? (x + y < 0 ? 24 : 23) : x + y < -R ? 23 : 31;
        if (d > R - 2.4 && d <= R - 0.4 && Math.round(Math.atan2(y, x) * 6 / Math.PI * 2) % 2 === 0 && Math.abs(d - (R - 1.4)) < 0.5) i = 25;
        pa(cx + x, yFr + y, i);
      }
      ra(cx - 4, yFr - 2, 9, 8, 0); ra(cx - 3, yFr - 1, 7, 6, 23); ra(cx - 3, yFr - 1, 7, 1, 24); pa(cx + 2, yFr + 2, 25); pa(cx + 2, yFr + 3, 25);
      // Un poco de óxido en el lomo.
      for (let k = 0; k < 8; k++) { const rx = cx - R + 3 + Math.floor(h(k, b.c) * (2 * R - 6)), ry = yAt - R + 2 + Math.floor(h(b.c, k) * (yFr - yAt)); pa(rx, ry, 11); }
      // Las cadenas: cruzan el lomo de lado a lado y bajan por los costados hasta la plataforma.
      for (const yc of [yAt - R + 4, yFr - R - 5]) {
        for (let x = -R - 1; x <= R + 1; x++) { const k = (x + R + 1) % 3; pa(cx + x, yc, k === 0 ? 0 : k === 1 ? 24 : 23); pa(cx + x, yc + 1, k === 2 ? 0 : 31); }
        for (const s of [-1, 1]) for (let y = yc; y < yc + z + R; y++) { const k = (y - yc) % 3; pa(cx + s * (R + 1), y, k === 0 ? 0 : k === 1 ? 24 : 23); }
      }
      return;
    }
    if (b.que === 'ruedas') {
      // Dos juegos de ruedas de vagón, parados: la rueda de allá, el eje y la de acá; calzados con cuñas.
      const rueda = (cx, cy) => {
        const R = 9;
        for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
          const d = Math.hypot(x, y);
          if (d > R + 0.4) continue;
          let i = d > R - 1 ? 0 : d > R - 3 ? (y < -2 ? 25 : 24) : d > 3.2 ? (x + y < -4 ? 24 : 23) : d > 1.5 ? 31 : 25;
          if (d <= R - 3 && d > 3.2 && (Math.abs(x) < 0.6 || Math.abs(y) < 0.6)) i = 31;   // los rayos
          pa(cx + x, cy + y, i);
        }
      };
      // (Etapa 1: se fue el juego de la derecha; 2: el de la izquierda.)
      for (const cx of [bx0 + 10, bx1 - 11].filter((_, n) => !etapa || n === etapa - 1)) {
        const yAtras = by0 + 4 - 9, yAdel = by1 - 2 - 9;
        rueda(cx, yAtras);
        ra(cx - 2, yAtras, 5, yAdel - yAtras, 0); ra(cx - 1, yAtras, 3, yAdel - yAtras, 23); ra(cx - 1, yAtras, 1, yAdel - yAtras, 24);
        rueda(cx, yAdel);
        for (const s of [-1, 1]) { const qx = cx + s * 8 - (s < 0 ? 4 : 0); ra(qx, by1 - 5, 5, 4, 0); ra(qx + 1, by1 - 4, 3, 2, 5); pa(qx + (s < 0 ? 3 : 1), by1 - 5, 0); }
      }
      return;
    }
    if (b.que === 'rieles') {
      // Un atado de rieles a lo largo, sobre durmientes: de arriba, las cabezas que brillan y los patines; de frente, el
      // perfil del de adelante.
      ra(bx0 - 1, t0 - 1, an + 2, by1 - t0 + 2, 0);
      for (let y = t0; y < t1; y++) {
        const k = (y - t0) % 7;
        const corre = Math.floor(h(Math.floor((y - t0) / 7), b.c) * 5);
        for (let x = bx0; x < bx1; x++) pa(x, y, x < bx0 + corre ? 0 : k === 0 ? 0 : k === 1 ? 25 : k === 2 ? 24 : k < 5 ? 23 : 31);
      }
      for (let y = t1; y < by1; y++) {
        const k = y - t1;
        for (let x = bx0; x < bx1; x++) pa(x, y, k === 0 ? 25 : k === 1 ? 24 : k < 5 ? 31 : k < 7 ? 23 : 0);
      }
      for (const sx of [bx0 + 4, bx1 - 9]) { ra(sx - 1, by1 - 3, 7, 4, 0); ra(sx, by1 - 2, 5, 2, 33); }
      cadenas([bx0 + 8, bx1 - 10], t0);
      return;
    }
    if (b.que === 'cajon') {
      // El cajón grande de los repuestos: tablas, los listones de las esquinas y la cruz del refuerzo.
      ra(bx0 - 1, t0 - 1, an + 2, by1 - t0 + 2, 0);
      for (let y = t0; y < t1; y++) for (let x = bx0; x < bx1; x++) pa(x, y, (x - bx0) % 7 === 6 ? 4 : 5);
      ra(bx0, t0, an, 1, 6);
      for (let y = t1; y < by1; y++) for (let x = bx0; x < bx1; x++) pa(x, y, (y - t1) % 6 === 5 ? 3 : 4);
      ra(bx0, t1, an, 1, 6);
      for (const ex of [bx0, bx1 - 3]) { ra(ex, t1, 3, by1 - t1, 5); pa(ex + 1, t1 + 1, 6); }
      const fh = by1 - t1;
      for (let q = 0; q < an - 6; q++) { const yy = t1 + Math.round(q * (fh - 2) / (an - 6)); pa(bx0 + 3 + q, yy, 5); pa(bx0 + 3 + q, yy + 1, 3); }
      cadenas([bx0 + 8, bx1 - 10], t0);
    }
  };
  const rotulo = (b, ra, pa) => {
    const [l1, l2] = ROTULO[carga];
    const largo = (txt) => [...txt].reduce((s, ch) => s + (LETRAS[ch] ? LETRAS[ch][0].length + 1 : 3), 0) - 1;
    const ancho = Math.max(largo(l1), largo(l2)) + 4, tx = Math.round((b.x0 + b.x1) / 2 - ancho / 2), ty = b.y1 - b.alto + 3;
    ra(tx - 1, ty - 1, ancho + 2, 15, 0); ra(tx, ty, ancho, 13, 37); ra(tx, ty, ancho, 1, 38); ra(tx, ty + 12, ancho, 1, 36);
    pa(tx + 1, ty + 1, 23); pa(tx + ancho - 2, ty + 1, 23);                    // los clavos
    [l1, l2].forEach((txt, j) => {
      let lx = Math.round(tx + ancho / 2 - largo(txt) / 2);
      for (const ch of txt) {
        const L = LETRAS[ch];
        if (L) L.forEach((fila, q) => { for (let u = 0; u < fila.length; u++) if (fila[u] === 'o') pa(lx + u, ty + 1 + j * 6 + q, 0); });
        lx += L ? L[0].length + 1 : 3;
      }
    });
  };
  for (const b of bultos) {
    const px = b.x0 - 3, py = b.y0 - b.alto - 9, pw = b.x1 - b.x0 + 6, ph = b.y1 - py + 2;
    // 🛑 Lo que se suelta con los frenos rotos tiene un dibujo por etapa; lo demás, uno solo. (Los tablones, cada etapa
    // una capa menos; el rótulo se queda donde estaba, clavado.)
    const alto0 = b.alto;
    const capas = [];
    for (let e = 0; e < (b.que === 'troncos' || b.que === 'tablones' || b.que === 'ruedas' ? 3 : 1); e++) {
      const cp = { i: new Int16Array(pw * ph).fill(-1), m: new Uint8Array(pw * ph) };
      const pa = (x, y, i) => { x = Math.round(x) - px; y = Math.round(y) - py; if (x < 0 || y < 0 || x >= pw || y >= ph) return; cp.i[y * pw + x] = i; };
      const ra = (x, y, ww, hh, i) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) pa(x + q, y + j, i); };
      if (b.que === 'tablones') b.alto = alto0 - e * 6;
      dibujarBulto(b, ra, pa, e);
      b.alto = alto0;
      if (b.rotulo) rotulo(b, ra, pa);
      capas.push(cp);
    }
    piezas.push({ px, py, pw, ph, base: (b.f + 2) * S - 0.01, cp: capas[0], capas, clave: b.clave });
    // 🎏 La punta suelta de la lona del bulto tapado: ocho cuadros que pasan solos.
    if (b.que === 'tapado') {
      const fx = b.x0 - 8, fy = b.y0 - b.alto + 1;
      const cuadros = FLAMEO.map((F) => {
        const c2 = { i: new Int16Array(9 * 6).fill(-1), m: new Uint8Array(9 * 6) };
        F.forEach((fila, j) => { for (let q = 0; q < 9; q++) if (fila[q] !== '.') c2.i[j * 9 + q] = COL_LONA[fila[q]]; });
        return c2;
      });
      piezas.push({ px: fx, py: fy, pw: 9, ph: 6, base: (b.f + 2) * S - 0.005, cuadros, reloj: 0.07 });
    }
  }

  // ===== DEBAJO: la tierra que pasa, en la sombra del vagón, y los dos bogies con sus ruedas
  const BOGIES = capa();
  {
    const r = rect(BOGIES);
    const rueda = (cx, cy) => {
      const R = 7;
      for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
        const d = Math.hypot(x, y);
        if (d > R + 0.4) continue;
        BOGIES.i[(cy + y) * W + cx + x] = d > R - 1 ? 0 : d > R - 2.5 ? (y < 0 ? 24 : 23) : d > 2 ? 31 : 23;
      }
    };
    for (const bc of [3, cols - 3]) {
      const cx = X(bc), cy = yBajo + 7;
      r(cx - 20, yBajo, 40, 6, 0); r(cx - 19, yBajo + 1, 38, 4, 31); r(cx - 19, yBajo + 1, 38, 1, 23);   // el bastidor
      rueda(cx - 11, cy); rueda(cx + 11, cy);
      r(cx - 3, yBajo + 2, 6, 6, 0); r(cx - 2, yBajo + 3, 4, 4, 23);              // la caja del resorte
    }
  }

  // ===== LAS PIEZAS
  const iluminado = (cp, campo) => iluminar({ ancho: W, alto: H, indices: cp.i, marcas: cp.m, campo });
  const lienzo = (datos, ww, hh) => {
    const cv = document.createElement('canvas'); cv.width = ww; cv.height = hh;
    cv.getContext('2d').putImageData(new ImageData(datos, ww, hh), 0, 0);
    return cv;
  };
  const recorte = (datos, x, y, ww, hh) => {
    const out = new Uint8ClampedArray(ww * hh * 4);
    for (let j = 0; j < hh; j++) out.set(datos.subarray(((y + j) * W + x) * 4, ((y + j) * W + x + ww) * 4), j * ww * 4);
    return out;
  };
  const enMundo = (x, y) => [x0 + x * PASO, yArriba + y * PASO];
  const resultado = {
    piso: [], altas: [],
    luz: (ux, uy) => Math.round(campoPiso(ax(ux), ay(Math.min(uy, map.rows * S - 1)))),
  };

  // La tierra de debajo, en la sombra: la misma de afuera, pasando (como la del portón del cerrado).
  {
    const vy = yBajo, vh = H - yBajo, [mx, my] = enMundo(0, vy);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = vh;
    const cx = cv.getContext('2d'), ind = new Int16Array(W * vh), marcas = new Uint8Array(W * vh);
    let hecho = null;
    resultado.piso.push({
      x: mx, y: my, w: W * PASO, h: vh * PASO, base: 0,
      get img() {
        const k = Math.round((estiloNuevo.desfile || 0) * PX);
        if (k !== hecho) {
          hecho = k;
          pintarSuelo(ind, W, vh, Math.round(mx / PASO), Math.round(my / PASO), k);
          cx.putImageData(new ImageData(iluminar({ ancho: W, alto: vh, indices: ind, marcas, campo: () => (dia ? -2 : -3) }), W, vh), 0, 0);
        }
        return cv;
      },
    });
  }
  /**
   * 🔁 LAS TABLAS DE NOCHE, MADERA OSCURA *(Santi: "ahora la plataforma no parece de noche, sino que parece que la
   * madera está pintada color violeta")*: la escala de la madera gastada, bajando, se va al violeta. De noche las
   * tablas pasan a los marrones oscuros de la madera (los que tiene el piso de adentro de noche), a la par de la tierra
   * de afuera, y los brillos de la veta quedan grises, de luna. (Probé los grises fríos: parecía piso de cemento.) Lo
   * demás del piso (las estacas, el fierro, las herramientas) baja como siempre.
   */
  let indPiso = PISO.i, campoDelPiso = campoPiso;
  if (!dia) {
    const LUNA = { 15: 33, 14: 32, 16: 14 };
    indPiso = PISO.i.slice();
    const deLuna = new Uint8Array(W * H);
    for (let y = yAllá; y < yAcá; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x, c = LUNA[indPiso[k]];
      if (c !== undefined) { indPiso[k] = c; deLuna[k] = 1; }
    }
    campoDelPiso = (x, y) => (deLuna[y * W + x] ? 0 : campoPiso(x, y));
  }
  resultado.piso.push({ img: lienzo(iluminar({ ancho: W, alto: H, indices: indPiso, marcas: PISO.m, campo: campoDelPiso }), W, H), x: x0, y: yArriba, w: W * PASO, h: H * PASO, base: 0 });
  /**
   * 🛑 LA SOMBRA DE LO QUE SE SUELTA, DE DÍA: el piso ya viene con las sombras pintadas, y cuando la carga se iba la suya
   * quedaba en el piso, sin nada que la hiciera. Cada bulto que se suelta lleva un parche de piso por etapa, con la sombra
   * de lo que le queda: más corta cuanto más bajo, y la de un solo juego de ruedas.
   */
  if (dia) {
    const altos = { tablones: [18, 12, 6], troncos: [22, 16, 10], ruedas: [20, 20, 20] };
    for (const b of bultos) {
      if (!altos[b.que]) continue;
      const L = Math.round(b.alto * 0.7), px = b.x0 - Math.ceil(L / 2) - 1, py = b.y0, pw = b.x1 - px + 1, ph = Math.min(b.y1 + L + 1, yAcá) - py;
      const ind = new Int16Array(pw * ph);
      for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) ind[y * pw + x] = PISO.i[(y + py) * W + x + px];
      const mitad = (b.x0 + b.x1) >> 1;
      const imgs = [0, 1, 2].map((e) => {
        // (De los dos juegos de ruedas, en la etapa 1 queda el de la izquierda y en la 2 el de la derecha.)
        const x0b = b.que === 'ruedas' && e === 2 ? mitad : b.x0, x1b = b.que === 'ruedas' && e === 1 ? mitad : b.x1;
        const campo = (x, y) => (enSombra(x + px, y + py, b) || sombraDe(x + px, y + py, b.y0, b.y1, x0b, x1b, altos[b.que][e]) ? -1 : 0);
        return lienzo(iluminar({ ancho: pw, alto: ph, indices: ind, campo }), pw, ph);
      });
      resultado.piso.push({
        x: x0 + px * PASO, y: yArriba + py * PASO, w: pw * PASO, h: ph * PASO, base: 0,
        get img() { const q = train._platEtapas && train._platEtapas[b.clave]; return imgs[q ? q.etapa : 0]; },
      });
    }
  }
  {
    const bo = iluminado(BOGIES, () => (dia ? -1 : NOCHE));
    const [mx, my] = enMundo(0, yBajo);
    resultado.altas.push({ img: lienzo(recorte(bo, 0, yBajo, W, H - yBajo), W, H - yBajo), x: mx, y: my, w: W * PASO, h: (H - yBajo) * PASO, base: map.rows * S + 0.02 });
  }
  for (const q of piezas) {
    const [mx, my] = enMundo(q.px, q.py);
    const campo = (x, y) => campoCarga(x + q.px, y + q.py);
    if (q.cuadros) {
      const imgs = q.cuadros.map((c2) => lienzo(iluminar({ ancho: q.pw, alto: q.ph, indices: c2.i, marcas: c2.m, campo }), q.pw, q.ph));
      resultado.altas.push({ x: mx, y: my, w: q.pw * PASO, h: q.ph * PASO, base: q.base, get img() { return imgs[Math.floor(performance.now() / 1000 / q.reloj) % imgs.length]; } });
      continue;
    }
    const imgs = q.capas.map((c2) => lienzo(iluminar({ ancho: q.pw, alto: q.ph, indices: c2.i, marcas: c2.m, campo }), q.pw, q.ph));
    if (imgs.length > 1) {
      // 🛑 En qué etapa va el bulto, y el temblor del aviso, antes de soltarse: los anota world/caidas.js.
      const estado = () => (train._platEtapas && train._platEtapas[q.clave]) || null;
      resultado.altas.push({
        y: my, w: q.pw * PASO, h: q.ph * PASO, base: q.base, clave: q.clave,
        get x() { const e = estado(); return mx + (e && e.tiembla && Math.floor(performance.now() / 45) % 2 ? PASO : 0); },
        get img() { const e = estado(); return imgs[e ? e.etapa : 0]; },
      });
      continue;
    }
    resultado.altas.push({ x: mx, y: my, w: q.pw * PASO, h: q.ph * PASO, base: q.base, clave: q.clave, img: imgs[0] });
  }
  /**
   * 🔁 EL BORDE CHOCA DONDE ESTÁ DIBUJADO *(Santi: "al ir hacia arriba o hacia abajo choco antes de llegar al borde")*:
   * las filas de arriba y de abajo son baranda ('H') en el plano, una casilla entera, pero las estacas son finitas
   * y están en la punta del piso. Ahí sólo choca una franja del grueso de la estaca, así se camina hasta el borde.
   */
  {
    const G = CONFIG.plataforma.bordeGrueso, lista = [];
    for (const [f, y0, y1] of [[0, 0, G], [map.rows - 1, map.rows * S - G, map.rows * S]]) {
      const c0 = w.colStart + 1, c1 = w.colStart + cols - 2;
      lista.push({ celdas: [c0, c1, f, f], rects: [[w.x + S, y0, w.x + (cols - 1) * S, y1]] });
    }
    map.ponerChoquesFinos('plataforma:' + w.colStart, lista);
  }
  // Las estacas de acá y la viga, delante de todos.
  {
    const fr = iluminado(FRENTE, dia ? (x, y) => (y > yAcá ? -1 : 0) : () => NOCHE);
    const yF = yAcá - 22, [mx, my] = enMundo(0, yF);
    resultado.altas.push({ img: lienzo(recorte(fr, 0, yF, W, yViga + 2 - yF), W, yViga + 2 - yF), x: mx, y: my, w: W * PASO, h: (yViga + 2 - yF) * PASO, base: map.rows * S + 0.01 });
  }
  return resultado;
}
