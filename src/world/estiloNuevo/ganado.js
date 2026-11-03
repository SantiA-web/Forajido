/**
 * 🐂 EL VAGÓN DE GANADO, EN EL ESTILO NUEVO *(Santi eligió "corrales al aire libre", "novillos de costado", "se rompe un
 * corral y se escapan", y los cuatro detalles: la paja y la bosta, los bebederos, las moscas y la marca de la estancia)*.
 *
 * Sigue sin techo, como la plataforma, y con las mismas reglas de antes: te ven de afuera y el camino de arriba se corta.
 *
 *  - LOS SEIS CORRALES ('C', data/wagons.js), de tres travesaños sobre postes, con los novillos adentro: 3 o 4, y 5 en los
 *    que tienen tranquera (es lo que sale en la estampida, `CONFIG.estampida.reses`). Cada uno en su pieza, ordenado por
 *    sus pies, entre el fondo y el frente del corral.
 *  - LA TRANQUERA, con su pasador, abierta o cerrada según `train.tranqueras`. El corral abierto queda vacío.
 *  - LAS BARANDAS de los dos costados: las de allá van detrás de todos, las de acá, delante.
 *  - LA PAJA Y LA BOSTA en el piso, LOS BEBEDEROS, LAS MOSCAS sobre la hacienda y EL CARTEL con la marca de la estancia.
 *
 * LA LUZ, como en la plataforma: de día, sol pleno; de noche, la luna (`sueloNoche`).
 */
import { CONFIG } from '../../data/config.js';
import { WAGONS } from '../../data/wagons.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { PALETA, sombrear } from '../../engine/paleta.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';
import { pintarSuelo } from './suelo.js';
import { pintarNovillo, ANCHO_NOVILLO, ALTO_NOVILLO, CUANTOS_PELAJES } from '../../entities/novillo.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;

/** Hasta dónde sube un corral, en puntos. Menos que un novillo: se les ve el lomo por encima. */
const ALTO_CERCO = 18;
/** Letras de 5 de alto para el cartel. */
const LETRAS = {
  L: ['o..', 'o..', 'o..', 'o..', 'ooo'], A: ['.o.', 'o.o', 'ooo', 'o.o', 'o.o'], P: ['oo.', 'o.o', 'oo.', 'o..', 'o..'],
  Z: ['ooo', '..o', '.o.', 'o..', 'ooo'], M: ['o...o', 'oo.oo', 'o.o.o', 'o...o', 'o...o'], T: ['ooo', '.o.', '.o.', '.o.', '.o.'],
  D: ['oo.', 'o.o', 'o.o', 'o.o', 'oo.'], E: ['ooo', 'o..', 'oo.', 'o..', 'ooo'], R: ['oo.', 'o.o', 'oo.', 'o.o', 'o.o'],
  O: ['.o.', 'o.o', 'o.o', 'o.o', '.o.'],
};
/** La marca de la estancia, la que va en el cartel: un círculo con una raya. */
const MARCA = ['.ooo.', 'o...o', 'ooooo', 'o...o', '.ooo.'];
/** Los manojos de paja y la bosta, a mano: se reparten por el piso. */
const PAJAS = [
  ['..a..b.', '.a.ab..', 'b.aa.a.', '.c.b.c.'],
  ['a...b', '.a.b.', '.ccb.', 'b...a'],
  ['.a.b...', 'b.a.a.b', '..ca.c.'],
];
const COL_PAJA = { a: 7, b: 6, c: 5 };
const BOSTAS = [['.ooo.', 'obbbo', 'obsbo', '.ooo.'], ['.oo..', 'obbo.', 'obsbo', '.ooo.']];
const COL_BOSTA = { o: 3, b: 4, s: 5 };
/**
 * 🔁 EL BEBEDERO, A TIERRA *(Santi: "el bebedero de los corrales más lejanos están flotando, quiero que los bajes a
 * tierra")*: la batea con el agua, el frente de tablas, las dos patas que tocan el piso y su sombra debajo.
 */
const BEBEDERO = [
  '..oooooooooooooooooooooooooooooo..',
  '.oMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMo.',
  '.oMwwwwwwwwwwwwwwwwwwwwwwwwwwwwMo.',
  '.oMWWWWbWWWWWWbWWWWWWbWWWWWWWWWMo.',
  '.oMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMo.',
  '.oFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFo.',
  '.oFFFFFFFFFFFFFFjFFFFFFFFFFFFFFFo.',
  '.offffffffffffffffffffffffffffffo.',
  '.oooooooooooooooooooooooooooooooo.',
  '.oPPossssssssssssssssssssssssoPPo.',
  '.oPPossssssssssssssssssssssssoPPo.',
  'soooossssssssssssssssssssssssoooos',
  'ssssssssssssssssssssssssssssssssss',
];
const COL_BEBEDERO = { o: 0, M: 5, w: 21, W: 20, b: 22, F: 5, f: 4, j: 3, P: 3, s: 32 };
/** El cerco que cede: las puntas astilladas de los tres travesaños, a un lado y al otro del hueco, y la tabla que quedó tirada. */
const PUNTAS_IZQ = [
  ['oooo..', 'LLLLo.', 'DDDoo.', 'ooo...'],
  ['ooo...', 'LLLo..', 'DDDDo.', 'oooo..'],
  ['oooooo', 'LLLLLo', 'DDDoo.', 'ooo...'],
];
const PUNTAS_DER = [
  ['...ooo', '..oLLL', '.oDDDD', '..oooo'],
  ['..oooo', '.oLLLL', 'ooDDDD', '.ooooo'],
  ['....oo', '...oLL', '..oDDD', '..oooo'],
];
const TABLA_ROTA = ['oooooooo..oooo', 'oLLLLLLLooLLDo', 'oDDDDDDDoooooo', 'oooooooo......'];
const COL_CERCO = { o: 0, L: 36, D: 34 };
/** Los lugares de los novillos en un corral (fracción de lo ancho y lo hondo). Primero los que siempre están. */
// (🔁 Los de atrás, corridos a la derecha: delante del bebedero lo tapaban entero.)
const LUGARES = [[0.62, 0.42], [1, 0.5], [0.42, 0.86], [0.92, 0.88], [0, 0.84]];

/** Lo que se dibuja cuando ya no hay nada: el corral abierto se queda sin novillos ni moscas. */
const NADA = document.createElement('canvas');
NADA.width = NADA.height = 1;

/** Los novillos ya pintados, uno por cuadro, para no armarlos cada vez. */
const hechos = new Map();
export function lienzoNovillo(lado, pelaje, cuadro, modo, marca, luz, sombra) {
  const clave = [lado, pelaje, cuadro, modo, marca ? 1 : 0, luz, sombra ? 1 : 0].join();
  let cv = hechos.get(clave);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = ANCHO_NOVILLO; cv.height = ALTO_NOVILLO + 1;
  const c = cv.getContext('2d');
  const R = (x, y, ww, hh, i) => { c.fillStyle = PALETA[i === 0 ? 0 : sombrear(i, luz)]; c.fillRect(x, y, ww, hh); };
  // (De día, la sombra chata debajo de la panza: se va con él cuando se va del corral.)
  if (sombra) { c.fillStyle = PALETA[14]; c.fillRect(3, ALTO_NOVILLO - 3, ANCHO_NOVILLO - 8, 4); }
  pintarNovillo(R, lado, pelaje, cuadro, modo, 0, 0, marca);
  hechos.set(clave, cv);
  return cv;
}

/** Lo que choca de las puntas, del ganado y de la plataforma: una franja finita, de la baranda hasta el marco de la tranquera. */
export function finosDePunta(w, map) {
  const S = map.size, G = CONFIG.tresCuartos.paredPunta, cols = Math.round(w.width / S), finos = [];
  for (const [c, xa, xb] of [[0, w.x, w.x + G], [cols - 1, w.x + w.width - G, w.x + w.width]]) {
    for (const [f0, f1] of [[1, 3], [6, 8]]) finos.push({ celdas: [w.colStart + c, w.colStart + c, f0, f1], rects: [[xa, f0 * S, xb, (f1 + 1) * S]] });
  }
  return finos;
}

export function vagonGanado(train, w, dia) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  const x0 = Math.floor(w.x / PASO) * PASO, yArriba = -tc.alturaPared;
  const yAbajo = map.rows * S + 2 * S;
  const W = Math.ceil((w.x + w.width - x0) * PX), H = Math.round((yAbajo - yArriba) * PX);
  const ax = (u) => Math.round((u - x0) * PX), ay = (u) => Math.round((u - yArriba) * PX);
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  const X = (c) => ax(w.x + c * S), Y = (f) => ay(f * S);
  const h = (a, b) => hash(a + w.colStart * 3, b);
  const yAllá = Y(0), yAcá = Y(map.rows), yViga = yAcá + 12, yBajo = yViga + 4;
  const NOCHE = tc.sueloNoche;
  const luzCarga = dia ? 0 : NOCHE;

  // ---- los corrales: cada grupo de cinco por tres de 'C'
  const corrales = [];
  for (let f = 0; f < map.rows; f++) for (let c = 0; c < cols; c++) {
    if (casilla(c, f) !== 'C' || casilla(c - 1, f) === 'C' || casilla(c, f - 1) === 'C') continue;
    let ca = c; while (casilla(ca + 1, f) === 'C') ca++;
    let fa = f; while (casilla(c, fa + 1) === 'C') fa++;
    corrales.push({ c, f, cols: ca - c + 1, filas: fa - f + 1, x0: X(c) + 2, x1: X(ca + 1) - 2, y0: Y(f) + 3, y1: Y(fa + 1) - 1 });
  }
  // La tranquera de cada corral (data/wagons.js): `lado: 'arriba'`, en su frente; 'abajo', en su fondo.
  for (const def of WAGONS.ganado.tranqueras || []) {
    const co = corrales.find((k) => def.col >= k.c && def.col < k.c + k.cols && (def.lado === 'arriba' ? k.f < map.rows / 2 : k.f >= map.rows / 2));
    if (co) { co.puerta = def; co.px = Math.min(X(def.col) + 2, co.x1 - 29); }
  }
  // (Por dónde cede el que no tiene tranquera: el cerco que da al pasillo, en la punta, lejos del bebedero y del cartel.)
  for (const co of corrales) if (co.px == null) co.px = co.x1 - 27;
  // (La de este corral, en este tren: en los que no traen estampida no hay, y queda siempre cerrada.)
  const tranquera = (co) => (co.puerta && (train.tranqueras || []).find((t) => t.wagon === w.index && Math.abs(t.x - (w.x + (co.puerta.col + 0.5) * S)) < S)) || null;
  // 🐂 Lo que le pasa a cada corral (world/caidas.js y la estampida): guardado en el tren, y no acá, porque el dibujo se rehace.
  const estados = train._corrales || (train._corrales = {});
  for (const co of corrales) {
    const clave = w.index + ':' + co.c + ',' + co.f;
    co.est = estados[clave] || (estados[clave] = { roto: false, susto: 0, apilo: 0, hacia: 1, salieron: 0, cuantos: 0, novillos: [], sx: 0 });
    co.tr = tranquera(co);
    if (co.tr) co.tr.est = co.est;
    co.est.sx = x0 + (co.px + 11) * PASO;
  }
  w._corrales = corrales;

  // ---- las capas
  const capa = () => ({ i: new Int16Array(W * H).fill(-1), m: new Uint8Array(W * H) });
  const PISO = capa(), FRENTE = capa();
  const pone = (cp) => (x, y, i) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; cp.i[y * W + x] = i; };
  const rect = (cp) => { const p = pone(cp); return (x, y, ww, hh, i) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) p(x + q, y + j, i); }; };
  const mapa = (p, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') p(x + q, y + j, col[fila[q]]); });

  // ===== EL PISO: tablas a lo largo, gastadas y sucias, con las juntas; arriba, la arena y la paja; y en los corrales, más paja
  {
    const r = rect(PISO), p = pone(PISO);
    const juntaDe = (tabla) => Math.floor(h(tabla * 7 + 3, 41) * 120);
    for (let y = yAllá; y < yAcá; y++) {
      const tabla = Math.floor((y - yAllá) / 8), off = juntaDe(tabla);
      for (let x = 0; x < W; x++) p(x, y, (y - yAllá) % 8 === 7 || (x + off) % 120 === 0 ? 14 : 15);
    }
    for (let y = yAllá; y < yAcá - 8; y += 8) {
      const tabla = Math.floor((y - yAllá) / 8), off = juntaDe(tabla);
      for (let x = 0; x < W; x++) {
        const k = h(x, tabla * 13 + 5);
        if (k > 0.03) continue;
        const largo = 3 + Math.floor(h(x, tabla) * 6), fila = 1 + Math.floor(k * 1000) % 5;
        for (let q = 0; q < largo; q++) if ((x + q + off) % 120 !== 0) p(x + q, y + fila, h(tabla, x) < 0.5 ? 16 : 14);
      }
    }
    /**
     * 🔁 ARENA Y PAJA EN TODO EL PISO *(Santi preguntó si no debería ser todo tierra, le conté que estos vagones llevaban arena
     * y paja sobre las tablas para que los animales no resbalen, y eligió "tu recomendación")*: tapa el vagón entero, y sólo en
     * el pasillo, donde más se pisa, asoman tablas sueltas, a tramos largos y con las puntas desparejas.
     */
    const yP0 = Y(4), yP1 = Y(6);
    for (let y = yAllá; y < yAcá; y++) for (let x = 0; x < W; x++) {
      const tira = Math.floor((y - yAllá) / 8), n = h(Math.floor((x + h(tira, 5) * 30 + h(y, 3) * 6) / 28), tira);
      if (y >= yP0 && y < yP1 && n < 0.4) continue;
      const fila = Math.floor(y / 3), m = h(Math.floor((x + h(fila, 9) * 40) / 13), fila);
      p(x, y, m < 0.22 ? 35 : 36);
    }
    // Adentro de cada corral, la tierra pisada de la hacienda.
    for (const co of corrales) for (let y = co.y0; y < co.y1; y++) for (let x = co.x0; x < co.x1; x++) {
      // (🔁 A rayones largos y corridos en cada fila: punto por punto parecía estática de televisor, y a manchones parejos, un tablero.)
      const fila = Math.floor(y / 3), m = h(Math.floor((x + h(fila, 9) * 40) / 13), fila);
      p(x, y, m < 0.2 ? 33 : 34);
    }
    r(0, yAllá - 2, W, 2, 0); r(0, yAllá, W, 1, 33);
    r(0, yAcá - 1, W, 1, 16);
    for (const xx of [0, W - 4]) { r(xx, yAllá, 4, yAcá - yAllá, 33); r(xx === 0 ? 3 : xx, yAllá, 1, yAcá - yAllá, 0); }
    r(0, yAcá, W, 1, 0); r(0, yAcá + 1, W, 1, 35);
    for (let y = yAcá + 2; y < yViga - 1; y++) for (let x = 0; x < W; x++) p(x, y, x % 24 === 0 ? 32 : 33);
    r(0, yViga - 1, W, 1, 32); r(0, yViga, W, 1, 0);
    r(0, yViga + 1, W, yBajo - yViga - 1, 1);
    // 🌾 La paja y la bosta: mucha en los corrales, y alguna suelta en el pasillo.
    const adentro = (x, y) => corrales.some((co) => x >= co.x0 - 4 && x < co.x1 + 4 && y >= co.y0 - 4 && y < co.y1 + 4);
    for (let k = 0; k < cols * 12; k++) {
      const x = 6 + Math.floor(h(k, 3) * (W - 18)), y = yAllá + 6 + Math.floor(h(k, 7) * (yAcá - yAllá - 12));
      if (!adentro(x, y) && h(k, 11) > 0.14) continue;
      mapa(p, x, y, PAJAS[k % PAJAS.length], COL_PAJA);
    }
    for (const co of corrales) for (let k = 0; k < 5; k++) {
      mapa(p, co.x0 + 4 + Math.floor(h(k + co.c, co.f) * (co.x1 - co.x0 - 12)), co.y0 + 6 + Math.floor(h(co.f + 9, k + co.c) * (co.y1 - co.y0 - 10)), BOSTAS[k % 2], COL_BOSTA);
    }
    for (let k = 0; k < cols / 3; k++) mapa(p, 8 + Math.floor(h(k, 21) * (W - 20)), Y(4) + 4 + Math.floor(h(k, 23) * (Y(6) - Y(4) - 10)), BOSTAS[k % 2], COL_BOSTA);
  }

  // ===== LAS BARANDAS: postes cada dos casillas y tres travesaños
  const baranda = (r, yPie) => {
    for (const z of [20, 13, 6]) { r(0, yPie - z - 1, W, 4, 0); r(0, yPie - z, W, 1, 36); r(0, yPie - z + 1, W, 1, 34); }
    for (let c = 1; c < cols; c += 2) { const x = X(c) + 6; r(x - 1, yPie - 24, 5, 24, 0); r(x, yPie - 23, 1, 23, 36); r(x + 1, yPie - 23, 1, 23, 35); r(x + 2, yPie - 23, 1, 23, 34); }
  };
  baranda(rect(PISO), yAllá + 2);
  baranda(rect(FRENTE), yAcá + 2);

  // (🔁 Sin ruedas *(Santi)*: la vía pasa debajo del piso, muy adentro del borde: la pared de acá las tapa.)

  // ===== LOS CORRALES, en dos piezas: el fondo (con el bebedero) y el frente; los novillos van entre las dos
  const lienzo = (datos, ww, hh) => {
    const cv = document.createElement('canvas'); cv.width = ww; cv.height = hh;
    cv.getContext('2d').putImageData(new ImageData(datos, ww, hh), 0, 0);
    return cv;
  };
  const pieza = (px, py, pw, ph, dibuja) => {
    const cp = { i: new Int16Array(pw * ph).fill(-1), m: new Uint8Array(pw * ph) };
    const pa = (x, y, i) => { x = Math.round(x) - px; y = Math.round(y) - py; if (x < 0 || y < 0 || x >= pw || y >= ph) return; cp.i[y * pw + x] = i; };
    const ra = (x, y, ww, hh, i) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) pa(x + q, y + j, i); };
    dibuja(ra, pa);
    return lienzo(iluminar({ ancho: pw, alto: ph, indices: cp.i, marcas: cp.m, campo: () => luzCarga }), pw, ph);
  };
  // Un cerco a lo largo: tres travesaños y los postes. `abierta`: dónde está la tranquera y si está abierta.
  const cerco = (ra, xa, xb, yPie, puerta = null, abierta = false, rota = false) => {
    const fuera = (x) => puerta && x >= puerta && x < puerta + 22;
    for (const z of [ALTO_CERCO - 1, 11, 5]) for (let x = xa; x < xb; x++) {
      if (fuera(x)) continue;
      ra(x, yPie - z - 1, 1, 4, 0); ra(x, yPie - z, 1, 1, 36); ra(x, yPie - z + 1, 1, 1, 34);
    }
    const postes = [xa, xb - 3];
    for (let x = xa + 24; x < xb - 12; x += 24) if (!fuera(x) && !fuera(x + 3)) postes.push(x);
    for (const x of postes) { ra(x - 1, yPie - ALTO_CERCO - 3, 5, ALTO_CERCO + 3, 0); ra(x, yPie - ALTO_CERCO - 2, 1, ALTO_CERCO + 2, 36); ra(x + 1, yPie - ALTO_CERCO - 2, 2, ALTO_CERCO + 2, 34); }
    if (!puerta) return;
    // El cerco que cedió: las puntas astilladas y una tabla tirada.
    if (rota) {
      const pa = (x, y, i) => ra(x, y, 1, 1, i);
      [ALTO_CERCO - 1, 11, 5].forEach((z, k) => {
        mapa(pa, puerta, yPie - z - 1, PUNTAS_IZQ[k], COL_CERCO);
        mapa(pa, puerta + 16, yPie - z - 1, PUNTAS_DER[k], COL_CERCO);
      });
      mapa(pa, puerta + 4, yPie + 2, TABLA_ROTA, COL_CERCO);
      return;
    }
    // La tranquera: de postes más gruesos, con la cruz y el pasador. Abierta, pegada de costado contra su poste.
    for (const x of [puerta - 2, puerta + 22]) { ra(x - 1, yPie - ALTO_CERCO - 4, 6, ALTO_CERCO + 4, 0); ra(x, yPie - ALTO_CERCO - 3, 2, ALTO_CERCO + 3, 35); ra(x + 2, yPie - ALTO_CERCO - 3, 2, ALTO_CERCO + 3, 33); }
    if (abierta) {
      ra(puerta - 7, yPie - ALTO_CERCO, 5, ALTO_CERCO + 8, 0); ra(puerta - 6, yPie - ALTO_CERCO + 1, 3, ALTO_CERCO + 6, 6); ra(puerta - 6, yPie - ALTO_CERCO + 1, 1, ALTO_CERCO + 6, 7);
      for (const z of [4, 10, 16]) ra(puerta - 6, yPie - ALTO_CERCO + z, 3, 1, 3);
      return;
    }
    for (const z of [ALTO_CERCO - 2, 11, 5]) { ra(puerta + 2, yPie - z - 1, 20, 4, 0); ra(puerta + 2, yPie - z, 20, 1, 7); ra(puerta + 2, yPie - z + 1, 20, 1, 5); }
    for (let q = 0; q < 18; q++) { const y = yPie - 4 - Math.round((q * (ALTO_CERCO - 7)) / 18); ra(puerta + 3 + q, y - 1, 2, 3, 0); ra(puerta + 3 + q, y, 2, 1, 6); }
    ra(puerta + 16, yPie - 12, 8, 4, 0); ra(puerta + 17, yPie - 11, 6, 2, 24); ra(puerta + 17, yPie - 11, 6, 1, 25);   // el pasador
  };
  const bebedero = (ra, pa, xb, yb) => {
    mapa(pa, xb - 2, yb - 1, BEBEDERO, COL_BEBEDERO);
  };
  const cartel = (ra, pa, co) => {
    const l1 = 'LA PAZ', l2 = 'MATADERO';
    const largo = (txt) => [...txt].reduce((s, ch) => s + (LETRAS[ch] ? LETRAS[ch][0].length + 1 : 3), 0) - 1;
    const ancho = largo(l2) + 11, tx = Math.round((co.x0 + co.x1) / 2 - ancho / 2), ty = co.y1 - ALTO_CERCO - 1;
    ra(tx - 1, ty - 1, ancho + 2, 15, 0); ra(tx, ty, ancho, 13, 37); ra(tx, ty, ancho, 1, 38); ra(tx, ty + 12, ancho, 1, 36);
    pa(tx + 1, ty + 1, 23); pa(tx + ancho - 2, ty + 1, 23);
    MARCA.forEach((fila, j) => { for (let q = 0; q < 5; q++) if (fila[q] === 'o') pa(tx + 3 + q, ty + 4 + j, 3); });
    [l1, l2].forEach((txt, j) => {
      let lx = tx + 9 + Math.round((largo(l2) - largo(txt)) / 2);
      for (const ch of txt) {
        const L = LETRAS[ch];
        if (L) L.forEach((fila, q) => { for (let u = 0; u < fila.length; u++) if (fila[u] === 'o') pa(lx + u, ty + 1 + j * 6 + q, 0); });
        lx += L ? L[0].length + 1 : 3;
      }
    });
  };
  const enMundo = (x, y) => [x0 + x * PASO, yArriba + y * PASO];
  const altas = [];
  const rotulado = corrales.find((co) => !co.puerta && co.f < map.rows / 2) || corrales[0];
  for (const co of corrales) {
    const px = co.x0 - 10, py = co.y0 - ALTO_CERCO - 8, pw = co.x1 - co.x0 + 20, ph = co.y1 - py + 12;
    const [mx, my] = enMundo(px, py);
    // (Lo que da al pasillo: el frente en los de arriba, el fondo en los de abajo. Con su tranquera, o con el cerco que cede.)
    const arriba = co.f < map.rows / 2, e = co.est, nada = !co.puerta;
    const salida = (abierta) => (co.puerta || abierta ? co.px : null);
    co.bebe = (([bx, by]) => ({ x: bx, y: by }))(enMundo(co.x0 + 21, co.y0 + 7));
    const fondo = (abierta) => pieza(px, py, pw, ph, (ra, pa) => {
      cerco(ra, co.x0, co.x1, co.y0 + 1, arriba ? null : salida(abierta), abierta, nada && abierta);
      bebedero(ra, pa, co.x0 + 6, co.y0 + 5);
    });
    const frente = (abierta) => pieza(px, py, pw, ph, (ra, pa) => {
      // Los costados, a lo hondo.
      for (const x of [co.x0, co.x1 - 3]) {
        ra(x - 1, co.y0 - ALTO_CERCO, 5, co.y1 - co.y0 + ALTO_CERCO - 1, 0);
        ra(x, co.y0 - ALTO_CERCO, 1, co.y1 - co.y0 + 1, 36); ra(x + 1, co.y0 - ALTO_CERCO, 2, co.y1 - co.y0 + 1, 34);
        for (let y = co.y0 - ALTO_CERCO + 12; y < co.y1 - ALTO_CERCO; y += 16) ra(x, y, 3, 1, 33);
      }
      cerco(ra, co.x0, co.x1, co.y1, arriba ? salida(abierta) : null, abierta, nada && abierta);
      if (co === rotulado) cartel(ra, pa, co);
    });
    const fondos = [fondo(false), arriba ? null : fondo(true)], frentes = [frente(false), arriba ? frente(true) : null];
    const abierta = () => e.roto;
    altas.push({ x: mx, y: my, w: pw * PASO, h: ph * PASO, base: co.f * S + 0.001, get img() { return (abierta() && fondos[1]) || fondos[0]; } });
    altas.push({ x: mx, y: my, w: pw * PASO, h: ph * PASO, base: (co.f + co.filas) * S - 0.005, get img() { return (abierta() && frentes[1]) || frentes[0]; } });

    // Los novillos.
    const cuantos = co.puerta ? CONFIG.estampida.reses : 3 + Math.floor(h(co.c, co.f + 31) * 2);
    e.cuantos = cuantos;
    // (Se amontonan para el lado del golpe, o contra el hueco si el corral cedió.)
    const minX = co.x0 + 4, maxX = co.x1 - 4 - ANCHO_NOVILLO, hueco = Math.max(minX, Math.min(maxX, co.px + 11 - Math.round(ANCHO_NOVILLO / 2)));
    const an = co.x1 - co.x0 - 8 - ANCHO_NOVILLO, hondo = co.y1 - co.y0 - 6;
    for (let k = 0; k < cuantos; k++) {
      const [fx, fy] = LUGARES[k % LUGARES.length];
      const nx = co.x0 + 4 + Math.round(fx * an), pie = co.y0 + 10 + Math.round(fy * (hondo - 10));
      const lado = h(k * 3 + co.c, co.f) < 0.5 ? 'E' : 'O', pelaje = Math.floor(h(k * 5 + co.c, co.f + 7) * CUANTOS_PELAJES);
      const marca = h(k + co.c, co.f + 13) < 0.5, atraso = h(k + co.f, co.c) * 8;
      const [vx, vy] = enMundo(nx, pie - ALTO_NOVILLO);
      e.novillos[k] = { pelaje, marca };
      const meta = () => (e.roto ? hueco : e.hacia > 0 ? maxX : minX);
      altas.push({
        get x() {
          if (!e.apilo) return vx;
          // (Se corre para donde se amontona, y asustado no se queda quieto.)
          const tiembla = e.susto > 0 ? (Math.floor(performance.now() / 70) + k) % 2 : 0;
          return vx + (Math.round(e.apilo * 0.55 * (meta() - nx)) + tiembla) * PASO;
        },
        y: vy, w: ANCHO_NOVILLO * PASO, h: (ALTO_NOVILLO + 1) * PASO, base: yArriba + pie * PASO,
        get img() {
          // (Salen de a uno: primero los últimos de la lista. El que se fue es el novillo que corre por el pasillo.)
          if (k >= e.cuantos - e.salieron) return NADA;
          if (e.susto > 0) return lienzoNovillo(meta() > nx ? 'E' : 'O', pelaje, Math.floor(performance.now() / 70 + atraso) % 8, 'susto', marca, luzCarga, dia);
          // (Tranquilos, a su ritmo: un cuadro cada un cuarto de segundo, cada uno por su lado.)
          return lienzoNovillo(lado, pelaje, Math.floor(performance.now() / 250 + atraso) % 8, 'quieto', marca, luzCarga, dia);
        },
      });
    }

    // 🪰 Las moscas: unos puntitos que dan vueltas sobre la hacienda, ocho cuadros.
    const mw = co.x1 - co.x0, mh = co.y1 - co.y0 + 16;
    const moscas = [0, 1, 2, 3, 4].map((m) => ({ cx: 4 + Math.round(h(m, co.c + 3) * (mw - 8)), cy: 4 + Math.round(h(co.f + 5, m) * (mh - 8)), v: 1 + m % 2, rx: 3 + m % 3, ry: 2 + (m + 1) % 2 }));
    const vuelo = (abre) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
      const cv = document.createElement('canvas'); cv.width = mw; cv.height = mh;
      const c = cv.getContext('2d'); c.fillStyle = PALETA[0];
      for (const m of moscas) { const t = (k * m.v * Math.PI) / 4; c.fillRect(Math.round(m.cx + m.rx * abre * Math.cos(t)), Math.round(m.cy + m.ry * abre * Math.sin(t)), 1, 1); }
      return cv;
    });
    // (Con el susto se abren: dan vueltas mucho más grandes, hasta que la hacienda se calma.)
    const cuadros = vuelo(1), espantadas = vuelo(5);
    const [ox, oy] = enMundo(co.x0, co.y0 - 16);
    altas.push({
      x: ox, y: oy, w: mw * PASO, h: mh * PASO, base: (co.f + co.filas) * S - 0.004,
      get img() { return e.salieron >= e.cuantos ? NADA : (e.susto > 0 ? espantadas : cuadros)[Math.floor(performance.now() / 110) % 8]; },
    });
  }

  // ===== LAS PIEZAS
  const iluminado = (cp, campo) => iluminar({ ancho: W, alto: H, indices: cp.i, marcas: cp.m, campo });
  const recorte = (datos, x, y, ww, hh) => {
    const out = new Uint8ClampedArray(ww * hh * 4);
    for (let j = 0; j < hh; j++) out.set(datos.subarray(((y + j) * W + x) * 4, ((y + j) * W + x + ww) * 4), j * ww * 4);
    return out;
  };
  const campoPiso = dia ? (x, y) => (y > yAcá ? -1 : 0) : (x, y) => (y > yViga ? NOCHE - 1 : NOCHE);
  const resultado = {
    piso: [], altas: [],
    luz: (ux, uy) => Math.round(campoPiso(ax(ux), ay(Math.min(uy, map.rows * S - 1)))),
  };
  // La tierra de debajo, en la sombra: la misma de afuera, pasando.
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
  // (🔁 De noche, las tablas en los marrones oscuros, como las de la plataforma: la madera gastada, bajando, se va al violeta.)
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
  resultado.altas.push(...altas);
  /**
   * 🔁 LAS VALLAS DE LAS PUNTAS *(Santi: "las vallas del costado deberían cubrir toda la plataforma, no solo el norte y el
   * sur"; y "siguen teniendo la altura de las paredes, tienes que bajarlas para que luzcan como las de arriba y abajo")*: los
   * mismos postes de frente, de 24, cada dos casillas, y los travesaños, que de canto se ven como una sola línea finita entre
   * un poste y el otro. La de allá va detrás de la gente del pasillo y la de acá, delante.
   */
  for (const xc of [ax(w.x + tc.paredPunta / 2), ax(w.x + w.width - tc.paredPunta / 2)]) {
    for (const [pies, base] of [[[yAllá + 2, Y(2), Y(4)], 4 * S - 0.01], [[Y(6), Y(8), yAcá + 2], 6 * S - 0.01]]) {
      const arriba = pies[0] - 24, ph = pies[2] - arriba + 1, [mx, my] = enMundo(xc - 3, arriba - 1);
      resultado.altas.push({
        x: mx, y: my, w: 8 * PASO, h: (ph + 1) * PASO, base,
        img: pieza(xc - 3, arriba - 1, 8, ph + 1, (ra) => {
          const y0 = pies[0] - 21, largo = pies[2] - 3 - y0;
          ra(xc - 2, y0, 4, largo, 0); ra(xc - 1, y0, 1, largo, 36); ra(xc, y0, 1, largo, 34);
          for (const pie of pies) { ra(xc - 2, pie - 24, 5, 24, 0); ra(xc - 1, pie - 23, 1, 23, 36); ra(xc, pie - 23, 1, 23, 35); ra(xc + 1, pie - 23, 1, 23, 34); }
        }),
      });
    }
  }
  // El borde choca donde está dibujada la baranda, como las estacas de la plataforma.
  {
    const G = CONFIG.plataforma.bordeGrueso, lista = [];
    for (const [f, y0, y1] of [[0, 0, G], [map.rows - 1, map.rows * S - G, map.rows * S]]) {
      lista.push({ celdas: [w.colStart + 1, w.colStart + cols - 2, f, f], rects: [[w.x + S, y0, w.x + (cols - 1) * S, y1]] });
    }
    lista.push(...finosDePunta(w, map));
    map.ponerChoquesFinos('ganado:' + w.colStart, lista);
  }
  // La baranda de acá y la viga, delante de todos.
  {
    const fr = iluminado(FRENTE, dia ? (x, y) => (y > yAcá ? -1 : 0) : () => NOCHE);
    const yF = yAcá - 26, [mx, my] = enMundo(0, yF);
    resultado.altas.push({ img: lienzo(recorte(fr, 0, yF, W, yViga + 2 - yF), W, yViga + 2 - yF), x: mx, y: my, w: W * PASO, h: (yViga + 2 - yF) * PASO, base: map.rows * S + 0.01 });
  }
  return resultado;
}
