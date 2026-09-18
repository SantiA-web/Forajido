/**
 * EL TECHO DEL TREN VISTO DESDE ARRIBA — el que pisás cuando te subís.
 *
 * 🔺 ETAPA 7, LA ÚLTIMA *(Santi: "me gustaría incluir una nueva etapa dedicada
 * especialmente para el techo. Esa será la última")*.
 *
 * Era un rectángulo marrón de un solo color del tamaño del vagón entero, con
 * dos rayas que marcaban la franja por donde se camina y unas líneas de tablas
 * de una unidad de ancho. Lo último del juego que seguía dibujado en bloques
 * de 4 px.
 *
 * Y NO ERA EL MISMO TECHO QUE SE VE DESDE EL CABALLO. Desde el galope los
 * coches de gente llevan la linterna con sus respiraderos y los furgones la
 * pasarela de los guardafrenos (world/trenTresCuartos.js); al subirte, todo
 * eso desaparecía y quedaba una tapa lisa. Ahora es el mismo techo, visto desde
 * arriba: saltás del caballo al techo que venías mirando.
 *
 * CÓMO SE ARMA. Un vagón mide entre 320 y 640 unidades de largo, así que un
 * techo entero guardado costaría hasta 1,6 MB. Pero un techo es casi todo
 * igual a lo largo: se arma en TRAMOS de 32 unidades que se repiten (cuatro
 * variantes, para que no se note el patrón), más las dos PUNTAS y las cosas
 * que hay una sola vez (la garita del cabús, la escotilla del blindado, las
 * bocas del hielo). Es lo mismo que el piso de adentro, que va por casillas.
 *
 * VA AL MISMO GRANO QUE EL TREN DE AFUERA Y QUE EL CABALLO: media unidad por
 * punto, 2 px de pantalla. El techo es la cara de afuera del tren, y tiene que
 * verse como la de afuera.
 *
 * ES SÓLO DIBUJO. La franja pisable, dónde caés y cuándo te caés siguen
 * saliendo de `CONFIG.techo`; acá sólo se dibuja lo que ya estaba.
 */

import { CONFIG } from '../data/config.js';
import { escalarColor, familiaDe } from './trenTresCuartos.js';

const PASO = 0.5;
const TRAMO = 32;
const PUNTA = 12;
const VARIANTES = 4;

const tono = (hex, f) => escalarColor(hex, f);

// ------------------------------------------------------------ el taller

const guardadas = new Map();

/**
 * Una lámina de `ancho` × `alto` UNIDADES, dibujada a media unidad por punto.
 * El pincel `p` pinta en unidades del mundo y redondea a la media unidad, así
 * que el dibujo se escribe con las medidas de siempre y sale el doble de fino.
 */
function lamina(clave, ancho, alto, dibujar) {
  let c = guardadas.get(clave);
  if (!c) {
    if (guardadas.size > 80) guardadas.clear();
    c = document.createElement('canvas');
    c.width = Math.round(ancho / PASO);
    c.height = Math.round(alto / PASO);
    const g = c.getContext('2d');
    const q = (v) => Math.round(v / PASO);
    const p = (x, y, w, h, color) => {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = color;
      g.fillRect(q(x), q(y), Math.max(1, q(w)), Math.max(1, q(h)));
    };
    dibujar(p, ancho, alto);
    guardadas.set(clave, c);
  }
  return c;
}

/** Cuántas láminas de techo hay guardadas y cuánto ocupan. Para poder medirlo. */
export function techosGuardados() {
  let bytes = 0;
  for (const c of guardadas.values()) bytes += c.width * c.height * 4;
  return { cuantas: guardadas.size, kb: Math.round(bytes / 1024) };
}

function estampar(r, img, x, y) {
  r.ctx.drawImage(img, x, y, img.width * PASO, img.height * PASO);
}

/** Un número fijo por tramo: la misma variante siempre para el mismo tramo. */
function variante(a, b) {
  let n = (a * 374761393 + b * 668265263) >>> 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) % VARIANTES;
}

// ------------------------------------------------------------ las partes

/**
 * LO QUE TIENEN TODOS: los dos aleros —el de allá en sombra, el de acá con su
 * canto de luz— y la sombra que tira el alero sobre la franja de abajo. Es lo
 * que dice que el techo termina ahí y que al costado no hay nada.
 */
function aleros(p, ancho, alto, P) {
  p(0, 0, ancho, 3, tono(P.techo, 0.7));
  p(0, 3, ancho, 1, P.techoLuz);
  p(0, alto - 5, ancho, 2, tono(P.tapa, 0.82));
  p(0, alto - 3, ancho, 1, P.tapaLuz);
  p(0, alto - 2, ancho, 2, tono(P.techo, 0.62));
}

/**
 * EL COCHE DE GENTE: techo de tela alquitranada, con las costuras a lo largo,
 * y en el medio LA LINTERNA — la sobreelevación con sus ventanitas, la misma
 * que se ve desde el caballo. Se camina por encima de ella: la franja pisable
 * cae justo sobre su tapa.
 */
function tramoCoche(p, ancho, alto, v, P, c) {
  const base = tono(P.tapa, 0.94 + v * 0.03);
  p(0, 0, ancho, alto, base);
  // Cada paño de tela con su tono, y alguna mancha de alquitrán: una tela
  // del mismo gris de punta a punta se leía como una chapa lisa.
  for (let y = 4, k = 0; y < alto - 6; y += 9, k++) p(0, y, ancho, 9, tono(base, 0.96 + ((k * 5 + v) % 4) * 0.025));
  for (let k = 0; k < 3; k++) {
    const mx = (v * 11 + k * 13) % (ancho - 6), my = 12 + ((v * 29 + k * 47) % (alto - 30));
    if (Math.abs(my - c.centroY) > c.ancho + 8) p(mx, my, 4 + k, 2, tono(base, 0.86));
  }
  for (let y = 10; y < alto - 6; y += 9) {
    p(0, y, ancho, 0.5, tono(base, 0.8));
    p(0, y + 0.5, ancho, 0.5, tono(base, 1.08));
  }
  // La linterna: la tapa clara con sus costuras y la cara de acá en sombra.
  const y0 = c.centroY - c.ancho - 5, y1 = c.centroY + c.ancho + 1;
  p(0, y0 - 1, ancho, 1, tono(P.techo, 0.6));
  p(0, y0, ancho, y1 - y0, tono(P.tapaLuz, 0.96 + v * 0.02));
  for (let y = y0 + 4; y < y1 - 1; y += 5) p(0, y, ancho, 0.5, tono(P.tapaLuz, 0.86));
  p(0, y1, ancho, 5, tono(P.techo, 1.05));
  // Las ventanitas de la linterna, en la cara de acá, y un respiradero.
  for (let x = 4; x < ancho - 4; x += 14) {
    p(x, y1 + 1, 6, 3, P.marco);
    p(x + 1, y1 + 1.5, 4, 2, tono(P.vidrioDia, 0.8));
  }
  if (v % 2 === 0) {
    p(ancho - 10, y0 - 7, 5, 5, tono(P.techo, 0.8));
    p(ancho - 9.5, y0 - 7, 4, 1.5, P.techoLuz);
  }
  aleros(p, ancho, alto, P);
}

/**
 * EL FURGÓN: chapa con costillas cruzadas y, en el medio, LA PASARELA de los
 * guardafrenos — tablones de madera cruzados sobre dos largueros. Es la misma
 * pasarela que se ve desde el galope, y es exactamente por donde se camina.
 */
function tramoFurgon(p, ancho, alto, v, P, c, madera) {
  const base = madera ? tono(madera, 0.9 + v * 0.03) : tono(P.tapa, 0.92 + v * 0.03);
  p(0, 0, ancho, alto, base);
  for (let x = 0; x < ancho; x += 8) {
    p(x, 4, 1, alto - 8, tono(base, 1.14));
    p(x + 1, 4, 0.5, alto - 8, tono(base, 0.78));
  }
  const y0 = c.centroY - c.ancho - 1, y1 = c.centroY + c.ancho + 1;
  // Los largueros y su sombra sobre la chapa.
  p(0, y1, ancho, 2, tono(P.techo, 0.55));
  // Los tablones, cada uno con su tono y un clavo en cada punta.
  for (let x = 0, i = 0; x < ancho; x += 3, i++) {
    const t = tono(P.pasarela, 0.9 + ((i * 7 + v * 3) % 5) * 0.05);
    p(x, y0, 2.5, y1 - y0, t);
    p(x, y0, 2.5, 0.5, tono(t, 1.25));
    p(x + 1, y0 + 1.5, 0.5, 0.5, P.remache);
    p(x + 1, y1 - 2, 0.5, 0.5, P.remache);
  }
  aleros(p, ancho, alto, P);
}

/** EL BLINDADO: chapas grandes remachadas, y la franja de chapa estriada. */
function tramoBlindado(p, ancho, alto, v, P, c) {
  const base = tono(P.blindado, 1.05 + v * 0.02);
  p(0, 0, ancho, alto, base);
  // Las juntas de las chapas y sus remaches.
  for (const y of [4, 40, 118, alto - 6]) {
    p(0, y, ancho, 1, tono(base, 0.7));
    for (let x = 2; x < ancho; x += 4) p(x, y - 1.5, 0.5, 0.5, P.remache);
  }
  p(ancho - 1, 4, 1, alto - 8, tono(base, 0.72));
  const y0 = c.centroY - c.ancho - 1, y1 = c.centroY + c.ancho + 1;
  p(0, y0, ancho, y1 - y0, tono(base, 0.9));
  // La chapa estriada: rombitos en diagonal, que es lo que la hace antideslizante.
  for (let y = y0 + 1.5, f = 0; y < y1 - 1; y += 2.5, f++) {
    for (let x = (f % 2) * 2; x < ancho; x += 4) p(x, y, 1.5, 0.5, tono(base, 1.25));
  }
  aleros(p, ancho, alto, P);
}

/** La punta de un techo: la tabla del borde, el canto y los pasamanos. */
function punta(p, alto, P, izquierda) {
  const x = izquierda ? 0 : PUNTA - 3;
  p(0, 0, PUNTA, alto, 'rgba(0,0,0,0)');
  p(x, 2, 3, alto - 4, tono(P.techo, 0.75));
  p(izquierda ? 2.5 : x, 2, 0.5, alto - 4, P.techoLuz);
  // Los dos pasamanos de hierro, para agarrarse al subir.
  for (const y of [22, alto - 26]) {
    p(izquierda ? 4 : PUNTA - 9, y, 5, 1, tono(P.remache, 1.5));
    p(izquierda ? 4 : PUNTA - 9, y + 1, 5, 0.5, P.remache);
  }
}

// ------------------------------------------------------------ lo que hay una vez

/** La garita del cabús, al costado de la franja: vidrios y su propio techito. */
function garita(r, x, P, c) {
  const img = lamina('garita', 40, 50, (p) => {
    p(2, 2, 36, 30, tono(P.caboose, 0.9));
    p(2, 2, 36, 2, tono(P.caboose, 1.3));
    for (let y = 8; y < 30; y += 6) p(2, y, 36, 0.5, tono(P.caboose, 0.75));
    p(0, 32, 40, 4, P.techo);
    p(0, 32, 40, 1, P.techoLuz);
    p(2, 36, 36, 10, P.caboose);                      // la cara de acá
    for (const vx of [6, 24]) { p(vx, 38, 10, 6, P.marco); p(vx + 1, 38.5, 8, 5, P.vidrioDia); }
    p(0, 46, 40, 2, tono(P.techo, 0.5));
  });
  estampar(r, img, x - 20, c.centroY - c.ancho - 52);
}

/** La escotilla del blindado: la tapa gruesa con remaches, cerrada. */
function escotilla(r, x, P, c) {
  const img = lamina('escotilla', 26, 20, (p) => {
    p(0, 0, 26, 20, tono(P.blindado, 0.72));
    p(2, 2, 22, 14, tono(P.blindado, 1.25));
    p(2, 2, 22, 1, tono(P.blindado, 1.5));
    for (let rx = 3; rx < 24; rx += 4) { p(rx, 3, 0.5, 0.5, P.remache); p(rx, 14.5, 0.5, 0.5, P.remache); }
    p(11, 7, 4, 3, P.remache);
    p(0, 18, 26, 2, tono(P.blindado, 0.5));
  });
  estampar(r, img, x - 13, c.centroY - c.ancho - 30);
}

/** Las bocas del hielo del refrigerado: dos tapas en cada punta. */
function bocasDeHielo(r, x, P, c) {
  const img = lamina('hielo', 14, 12, (p) => {
    p(0, 0, 14, 12, tono(P.techo, 0.8));
    p(1, 1, 12, 8, P.refrigerado);
    p(1, 1, 12, 1, tono(P.refrigerado, 1.1));
    p(5, 4, 4, 2, P.remache);
    p(0, 10, 14, 2, tono(P.techo, 0.5));
  });
  for (const y of [c.centroY - c.ancho - 20, c.centroY + c.ancho + 10]) estampar(r, img, x, y);
}

// ------------------------------------------------------------ el techo entero

/**
 * EL TECHO DE UN VAGÓN, en su lugar. `w` es el vagón armado (world/train.js);
 * `alto` es el fondo del vagón (el alto del mapa).
 */
export function dibujarTechoDesdeArriba(r, w, alto) {
  const P = CONFIG.colors.costado;
  const c = CONFIG.techo;
  const familia = familiaDe({ id: w.id, carbon: w.carbon });
  // El techo del cabús es gris como el de los demás: rojo es la caja, que desde
  // arriba no se ve (la garita sí, y va roja). Un techo entero rojo no
  // coincidía con el que se ve desde el caballo.
  const madera = null;
  const hacer = familia === 'coche' ? tramoCoche
    : familia === 'blindado' ? tramoBlindado
      : tramoFurgon;

  // Los tramos, a lo largo, cada uno con su variante fija.
  const cuantos = Math.ceil((w.width - PUNTA * 2) / TRAMO);
  for (let i = 0; i < cuantos; i++) {
    const v = variante(w.index || 0, i);
    const img = lamina(`${familia}|${v}|${alto}`, TRAMO, alto,
      (p, an, al) => hacer(p, an, al, v, P, c, madera));
    const x = w.x + PUNTA + i * TRAMO;
    const sobra = w.x + w.width - PUNTA - x;
    if (sobra >= TRAMO) estampar(r, img, x, 0);
    else r.ctx.drawImage(img, 0, 0, sobra / PASO, img.height, x, 0, sobra, alto);
  }
  // Las puntas: el techo sigue hasta el borde, y ahí termina en su tabla.
  for (const izq of [true, false]) {
    const base = lamina(`${familia}|0|${alto}`, TRAMO, alto, (p, an, al) => hacer(p, an, al, 0, P, c, madera));
    const x = izq ? w.x : w.x + w.width - PUNTA;
    r.ctx.drawImage(base, 0, 0, PUNTA / PASO, base.height, x, 0, PUNTA, alto);
    estampar(r, lamina(`punta|${izq}|${alto}`, PUNTA, alto, (p) => punta(p, alto, P, izq)), x, 0);
  }

  // Lo que hay una sola vez.
  const medio = w.x + w.width / 2;
  if (familia === 'caboose') garita(r, medio, P, c);
  else if (familia === 'blindado') escotilla(r, medio, P, c);
  else if (familia === 'refrigerado') {
    bocasDeHielo(r, w.x + PUNTA + 4, P, c);
    bocasDeHielo(r, w.x + w.width - PUNTA - 18, P, c);
  }
}

// ------------------------------------------------------------ los obstáculos

/**
 * LOS OBSTÁCULOS, COMO COSAS. Eran un rectángulo gris con un ▲ o un ▼ encima.
 * El ▲▼ se queda —es lo que te dice a tiempo qué hacer—, pero ahora lo de
 * abajo se reconoce:
 *
 *   agachar  una viga de madera que cruza POR ENCIMA, colgada de dos postes a
 *            los costados, y su SOMBRA atravesando la franja. La sombra es el
 *            aviso más claro de que algo te pasa por arriba de la cabeza.
 *   saltar   un cajón amarrado, bajo, que cruza la franja: con su tapa y su
 *            cara, como los del vagón de carga.
 */
export function dibujarObstaculoTecho(r, ob, colores) {
  const P = CONFIG.colors.costado;
  const c = CONFIG.techo;
  const y = c.centroY;
  const w = c.obstaculoAncho;

  if (ob.tipo === 'agachar') {
    const img = lamina('viga', w * 2 + 8, c.ancho * 2 + 26, (p, an) => {
      const top = 0, franja = 14;
      // La sombra de la viga sobre la franja, corrida por el sol.
      p(6, franja + 2, an - 8, c.ancho * 2 - 4, 'rgba(0,0,0,0.3)');
      // Los postes, afuera de la franja, y el travesaño arriba.
      for (const px of [1, an - 4]) {
        p(px, top + 6, 3, c.ancho * 2 + 16, tono(P.pasarela, 0.7));
        p(px, top + 6, 1, c.ancho * 2 + 16, tono(P.pasarela, 1.1));
      }
      p(0, top + 2, an, 5, P.pasarela);
      p(0, top + 2, an, 1, tono(P.pasarela, 1.35));
      p(0, top + 6, an, 1, tono(P.pasarela, 0.55));
      for (let x = 3; x < an - 2; x += 5) p(x, top + 3.5, 0.5, 0.5, P.remache);
    });
    estampar(r, img, ob.x - w - 4, y - c.ancho - 14);
    if (!ob.resuelto) r.text('▼', ob.x, y - c.ancho - 18, colores.enemySus);
  } else {
    const img = lamina('bulto', w * 2, 14, (p, an) => {
      p(1, 12, an - 2, 2, 'rgba(0,0,0,0.3)');       // su sombra en el techo
      p(0, 0, an, 5, tono(P.pasarela, 1.2));        // la tapa
      p(0, 0, an, 1, tono(P.pasarela, 1.45));
      p(0, 5, an, 7, P.pasarela);                   // la cara de acá
      for (let x = 4; x < an - 2; x += 5) p(x, 5, 0.5, 7, tono(P.pasarela, 0.7));
      p(0, 11, an, 1, tono(P.pasarela, 0.5));
      // La soga que lo amarra.
      for (const x of [an * 0.3, an * 0.7]) p(x, 0, 1, 12, '#b89a64');
    });
    estampar(r, img, ob.x - w, y - 8);
    if (!ob.resuelto) r.text('▲', ob.x, y - 14, colores.bagLoot);
  }
}
