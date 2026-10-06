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
import { escalarColor, familiaDe, dibujarCostadoAlto } from './trenTresCuartos.js';
import { geoTecho, yEnTecho } from './techoGeometria.js';
import { WAGONS } from '../data/wagons.js';

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
 * 🧗 EL TECHO NUEVO: ANGOSTO, LISO Y CURVO.
 *
 * *(Santi: "el techo hoy se ve más grande de lo que debería ser o el personaje
 * más chico" — y "la parte plana no tiene que ser algo que resalte hacia
 * arriba, todo tiene que ser liso, a la misma altura, y la curva se nota por
 * la perspectiva y sombras")*.
 *
 * Antes la tapa iba de −SOBRE al fondo del vagón (180 unidades: nueve
 * personas de ancho) y encima tenía cosas con alto —la linterna con su cara de
 * vidrios, la pasarela con su canto, la garita—. Ahora:
 *
 *  - LA TAPA MIDE `superficie.ancho` (88) desde `superficie.arriba` (−SOBRE),
 *    y debajo va la pared del costado (`dibujarCostadoAlto`, la del galope).
 *  - ES TODA LISA. En el medio, el LOMO, plano y con la misma luz de punta a
 *    punta. A los costados, LAS CURVAS, que se notan por dos cosas: la luz (la
 *    de allá se va a la sombra, la de acá agarra un brillo y se oscurece en el
 *    filo) y la PERSPECTIVA: las costuras se van juntando a medida que la
 *    chapa dobla hacia abajo.
 *  - Lo que antes sobresalía queda AL RAS: la pasarela son tablas pintadas
 *    sobre la chapa, la escotilla es una tapa sin canto. La linterna y la
 *    garita se fueron.
 */
const SOBRE = CONFIG.tresCuartos.alturaPared;
const ANCHO = CONFIG.techo.superficie.ancho;
const LOMO0 = (ANCHO * (1 - CONFIG.techo.superficie.lomo)) / 2;   // donde empieza el lomo
const LOMO1 = ANCHO - LOMO0;                                         // donde termina

/**
 * CUÁNTA LUZ AGARRA LA TAPA A ESTA ALTURA (0 = el borde de allá, ANCHO = el de
 * acá). El lomo es plano: la misma luz en todo su ancho, que es justamente lo
 * que lo hace leerse plano.
 */
function luz(y) {
  // La de allá se va a la sombra: le da la espalda a la cámara y al sol.
  if (y < LOMO0) {
    const t = (LOMO0 - y) / LOMO0;                  // 0 en el lomo, 1 en el filo
    return 1.1 - 0.72 * t ** 1.3;
  }
  // La de acá primero agarra un brillo (mira de frente al sol) y después se
  // oscurece fuerte en el filo, donde dobla hacia abajo.
  if (y > LOMO1) {
    const t = (y - LOMO1) / (ANCHO - LOMO1);
    return 1.1 + 0.2 * Math.sin(Math.min(1, t * 1.6) * Math.PI) - 0.62 * t ** 2.4;
  }
  return 1.1;
}

/**
 * LAS COSTURAS, A LO LARGO. En el lomo van parejas; en las curvas se juntan
 * hacia el filo (salen de repartir el ARCO en partes iguales y proyectarlo:
 * `sin`), que es lo que hace que la curva se lea como curva sin dibujarle alto.
 */
function costuras(paso) {
  const ys = [];
  for (let y = LOMO0 + paso; y < LOMO1 - 1; y += paso) ys.push(y);
  const R = LOMO0;
  const d = paso / R;
  for (let a = d; a < Math.PI / 2 - 0.05; a += d) {
    ys.push(LOMO0 - R * Math.sin(a));
    ys.push(LOMO1 + R * Math.sin(a));
  }
  return ys;
}

/** El fondo: bandas de una unidad, cada una con su luz. */
function fondo(p, ancho, base, variar) {
  for (let y = 0; y < ANCHO; y += 1) p(0, y, ancho, 1, tono(base, luz(y + 0.5) * (variar ? variar(y) : 1)));
}

/**
 * LOS DOS FILOS. El de allá, una raya oscura contra el desierto. El de acá, el
 * canto del alero con su luz y debajo su sombra: ahí arranca la pared.
 */
function filos(p, ancho, P) {
  p(0, 0, ancho, 1, tono(P.techo, 0.5));
  p(0, 1, ancho, 0.5, tono(P.techoLuz, 0.8));
  p(0, ANCHO - 2, ancho, 0.5, P.tapaLuz);
  p(0, ANCHO - 1.5, ancho, 1.5, tono(P.techo, 0.6));
}

/** EL COCHE DE GENTE: tela alquitranada en paños, lisa de borde a borde. */
function tramoCoche(p, ancho, v, P) {
  const base = tono(P.tapa, 0.98 + v * 0.008);
  // Cada paño con su tono, apenas: de un solo gris se leía como chapa.
  fondo(p, ancho, base, (y) => 0.97 + ((Math.floor(y / 11) * 5 + v) % 4) * 0.015);
  for (const y of costuras(11)) p(0, y, ancho, 0.5, tono(base, luz(y) * 0.82));
  // Alguna mancha de alquitrán, chata.
  for (let k = 0; k < 2; k++) {
    const mx = (v * 11 + k * 13) % (ancho - 6), my = 8 + ((v * 29 + k * 31) % (ANCHO - 16));
    p(mx, my, 4 + k, 1.5, tono(base, luz(my) * 0.88));
  }
  filos(p, ancho, P);
}

/**
 * EL FURGÓN: chapa con sus costillas cruzadas, que siguen la curva con su luz,
 * y en el lomo LA PASARELA AL RAS: los tablones pintados sobre la chapa, sin
 * canto ni sombra.
 */
function tramoFurgon(p, ancho, v, P) {
  const base = tono(P.tapa, 0.97 + v * 0.008);
  fondo(p, ancho, base);
  for (let x = 0; x < ancho; x += 8) {
    for (let y = 0; y < ANCHO; y += 1) {
      const a = luz(y + 0.5);
      p(x, y, 1, 1, tono(base, a * 1.14));
      p(x + 1, y, 0.5, 1, tono(base, a * 0.8));
    }
  }
  const medio = ANCHO / 2, mitad = 8;
  for (let x = 0, i = 0; x < ancho; x += 3, i++) {
    const t = tono(P.pasarela, (0.9 + ((i * 7 + v * 3) % 5) * 0.05) * 1.05);
    p(x, medio - mitad, 2.5, mitad * 2, t);
    p(x + 2.5, medio - mitad, 0.5, mitad * 2, tono(P.pasarela, 0.7));
    p(x + 1, medio - mitad + 1.5, 0.5, 0.5, P.remache);
    p(x + 1, medio + mitad - 2, 0.5, 0.5, P.remache);
  }
  filos(p, ancho, P);
}

/** EL BLINDADO: chapas remachadas, y en el lomo la chapa estriada, al ras. */
function tramoBlindado(p, ancho, v, P) {
  const base = tono(P.blindado, 1.08 + v * 0.008);
  fondo(p, ancho, base);
  for (const y of costuras(15)) {
    p(0, y, ancho, 0.5, tono(base, luz(y) * 0.7));
    for (let x = 2; x < ancho; x += 4) p(x, y + 1, 0.5, 0.5, P.remache);
  }
  for (let y = 0; y < ANCHO; y += 1) p(ancho - 1, y, 1, 1, tono(base, luz(y) * 0.72));
  const medio = ANCHO / 2, mitad = 9;
  for (let y = medio - mitad + 1, f = 0; y < medio + mitad - 1; y += 2.5, f++) {
    for (let x = (f % 2) * 2; x < ancho; x += 4) p(x, y, 1.5, 0.5, tono(base, 1.22));
  }
  filos(p, ancho, P);
}

/**
 * La punta de un techo: la tabla del borde siguiendo la curva con su luz, y
 * los pasamanos de hierro, chatos, para agarrarse al subir.
 */
function punta(p, P, izquierda) {
  const x = izquierda ? 0 : PUNTA - 3;
  for (let y = 0; y < ANCHO; y += 1) p(x, y, 3, 1, tono(P.techo, 0.72 * luz(y + 0.5)));
  for (let y = 0; y < ANCHO; y += 1) p(izquierda ? 2.5 : x, y, 0.5, 1, tono(P.techoLuz, luz(y + 0.5)));
  for (const y of [LOMO0 - 6, LOMO1 + 4]) {
    p(izquierda ? 4 : PUNTA - 9, y, 5, 1, tono(P.remache, 1.5));
    p(izquierda ? 4 : PUNTA - 9, y + 1, 5, 0.5, P.remache);
  }
}

// ------------------------------------------------------------ lo que hay una vez

/** La escotilla del blindado, AL RAS: la tapa con sus remaches, sin canto. */
function escotilla(r, x) {
  const P = CONFIG.colors.costado;
  const img = lamina('escotilla2', 22, 14, (p) => {
    p(0, 0, 22, 14, tono(P.blindado, 1.22));
    p(0, 0, 22, 0.5, tono(P.blindado, 1.45));
    p(0, 13.5, 22, 0.5, tono(P.blindado, 0.75));
    for (let rx = 1; rx < 22; rx += 4) { p(rx, 1, 0.5, 0.5, P.remache); p(rx, 12.5, 0.5, 0.5, P.remache); }
    p(9, 5.5, 4, 3, P.remache);
  });
  estampar(r, img, x - 11, -SOBRE + ANCHO / 2 - 7);
}

/** Las bocas del hielo del refrigerado, al ras: dos tapas en cada punta. */
function bocasDeHielo(r, x) {
  const P = CONFIG.colors.costado;
  const img = lamina('hielo2', 12, 8, (p) => {
    p(0, 0, 12, 8, P.refrigerado);
    p(0, 0, 12, 0.5, tono(P.refrigerado, 1.1));
    p(0, 7.5, 12, 0.5, tono(P.refrigerado, 0.7));
    p(4, 3, 4, 2, P.remache);
  });
  for (const y of [LOMO0 - 4, LOMO1 - 4]) estampar(r, img, x, -SOBRE + y);
}

// ------------------------------------------------------------ el techo entero

/**
 * EL TECHO DE UN VAGÓN, en su lugar: la tapa (de −SOBRE, `ANCHO` de alto) y
 * debajo la pared del costado hasta la vía. `alto` es el alto del mapa.
 */
export function dibujarTechoDesdeArriba(r, w, alto, noche) {
  const P = CONFIG.colors.costado;
  const familia = familiaDe({ id: w.id, carbon: w.carbon });
  const hacer = familia === 'coche' ? tramoCoche
    : familia === 'blindado' ? tramoBlindado
      : tramoFurgon;
  const y0 = -SOBRE;

  // La pared de abajo primero: el alero de la tapa le tira sombra encima.
  const vagon = WAGONS[w.id] || { id: w.id, carbon: w.carbon, layout: [] };
  dibujarCostadoAlto(r, vagon, w.x, w.width, y0 + ANCHO, alto + CONFIG.tresCuartos.alturaCaraAfuera, noche);
  r.ctx.save();
  r.ctx.globalAlpha = 0.45;
  r.rect(w.x, y0 + ANCHO, w.width, 2, '#000');
  r.ctx.globalAlpha = 0.2;
  r.rect(w.x, y0 + ANCHO + 2, w.width, 4, '#000');
  r.ctx.restore();

  const cuantos = Math.ceil((w.width - PUNTA * 2) / TRAMO);
  for (let i = 0; i < cuantos; i++) {
    const v = variante(w.index || 0, i);
    const img = lamina(`${familia}|${v}|${ANCHO}`, TRAMO, ANCHO, (p) => hacer(p, TRAMO, v, P));
    const x = w.x + PUNTA + i * TRAMO;
    const sobra = w.x + w.width - PUNTA - x;
    if (sobra >= TRAMO) estampar(r, img, x, y0);
    else r.ctx.drawImage(img, 0, 0, sobra / PASO, img.height, x, y0, sobra, ANCHO);
  }
  const base = lamina(`${familia}|0|${ANCHO}`, TRAMO, ANCHO, (p) => hacer(p, TRAMO, 0, P));
  for (const izq of [true, false]) {
    const x = izq ? w.x : w.x + w.width - PUNTA;
    r.ctx.drawImage(base, 0, 0, PUNTA / PASO, base.height, x, y0, PUNTA, ANCHO);
    estampar(r, lamina(`punta2|${izq}`, PUNTA, ANCHO, (p) => punta(p, P, izq)), x, y0);
  }

  const medio = w.x + w.width / 2;
  if (familia === 'blindado') escotilla(r, medio);
  else if (familia === 'refrigerado') {
    bocasDeHielo(r, w.x + PUNTA + 4);
    bocasDeHielo(r, w.x + w.width - PUNTA - 16);
  }
}

/**
 * 🧗 LA TAPA DEL TECHO VISTA DE COSTADO (la vista del techo de ahora, la del
 * galope): la misma tapa lisa y curva, ACHATADA en `alto` unidades. Achatarla
 * es justamente lo que hace la perspectiva: la curva de allá queda arriba y en
 * sombra, la de acá abajo con su brillo, y las costuras se juntan solas.
 */
export function estamparTapa(r, w, yArriba, alto) {
  const P = CONFIG.colors.costado;
  const familia = familiaDe({ id: w.id, carbon: w.carbon });
  const hacer = familia === 'coche' ? tramoCoche
    : familia === 'blindado' ? tramoBlindado
      : tramoFurgon;
  const cuantos = Math.ceil((w.width - PUNTA * 2) / TRAMO);
  for (let i = 0; i < cuantos; i++) {
    const v = variante(w.index || 0, i);
    const img = lamina(`${familia}|${v}|${ANCHO}`, TRAMO, ANCHO, (p) => hacer(p, TRAMO, v, P));
    const x = w.x + PUNTA + i * TRAMO;
    const ancho = Math.min(TRAMO, w.x + w.width - PUNTA - x);
    r.ctx.drawImage(img, 0, 0, ancho / PASO, img.height, x, yArriba, ancho, alto);
  }
  const base = lamina(`${familia}|0|${ANCHO}`, TRAMO, ANCHO, (p) => hacer(p, TRAMO, 0, P));
  for (const izq of [true, false]) {
    const x = izq ? w.x : w.x + w.width - PUNTA;
    r.ctx.drawImage(base, 0, 0, PUNTA / PASO, base.height, x, yArriba, PUNTA, alto);
    const pt = lamina(`punta2|${izq}`, PUNTA, ANCHO, (p) => punta(p, P, izq));
    r.ctx.drawImage(pt, 0, 0, pt.width, pt.height, x, yArriba, PUNTA, alto);
  }
}

/**
 * LA GÓNDOLA DESDE ARRIBA: la boca llena de carbón hasta el tope, entre sus
 * dos bordes de chapa, y la pared baja del costado. Se camina por encima del
 * carbón; los costados tienen pared, así que ahí no se resbala.
 */
export function dibujarGondolaDesdeArriba(r, w, alto, noche) {
  const P = CONFIG.colors.costado;
  const L = CONFIG.colors.locomotora;
  const y0 = -SOBRE;
  const vagon = WAGONS[w.id] || { id: w.id, carbon: true, layout: [] };
  dibujarCostadoAlto(r, vagon, w.x, w.width, y0 + ANCHO, alto + CONFIG.tresCuartos.alturaCaraAfuera, noche);
  r.rect(w.x, y0, w.width, ANCHO, L.carbon);
  // El montón: terrones con luz, más apretados hacia los bordes (la pila baja).
  for (let i = 0; i < w.width / 2; i++) {
    const x = w.x + 3 + ((i * 37) % (w.width - 6));
    const y = y0 + 3 + ((i * 53) % (ANCHO - 6));
    r.rect(x, y, 2, 1, L.carbonLuz);
  }
  r.ctx.save();
  r.ctx.globalAlpha = 0.35;
  r.rect(w.x, y0, w.width, 6, '#000');
  r.ctx.restore();
  r.rect(w.x, y0, w.width, 2, P.gondola);
  r.rect(w.x, y0 + ANCHO - 3, w.width, 3, escalarColor(P.gondola, 1.5));
  r.rect(w.x, y0, 2, ANCHO, P.gondola);
  r.rect(w.x + w.width - 2, y0, 2, ANCHO, P.gondola);
}

// ------------------------------------------------------------ los obstáculos

/**
 * LOS OBSTÁCULOS, COMO COSAS, en el techo nuevo.
 *
 *   agachar  el pórtico: una viga que cruza POR ENCIMA de punta a punta del
 *            techo —no hay por dónde rodearla—, colgada de un poste de cada
 *            lado de la vía, y su SOMBRA atravesando la tapa entera.
 *   saltar   un cajón amarrado que ocupa SÓLO EL LOMO *(elegido con Santi)*:
 *            se puede saltar, o rodear por la curva arriesgándote a resbalar.
 *
 * `yDe` pasa de la `y` de adentro a la dibujada (world/techoGeometria.js).
 */
export function dibujarObstaculoTecho(r, ob, colores, alto) {
  const P = CONFIG.colors.costado;
  const c = CONFIG.techo;
  const w = c.obstaculoAncho;
  const y0 = -SOBRE;

  if (ob.tipo === 'agachar') {
    const img = lamina('portico2', w * 2 + 8, ANCHO + 60, (p, an) => {
      const arriba = 26;                         // la viga, levantada sobre el techo
      // Su sombra sobre la tapa, corrida por el sol.
      p(7, arriba + 8, an - 9, ANCHO - 4, 'rgba(0,0,0,0.28)');
      // Los postes: uno detrás del techo, el otro delante de la pared.
      for (const [py, ph] of [[0, arriba + 4], [arriba + ANCHO - 2, 34]]) {
        p(an / 2 - 2, py, 4, ph, tono(P.pasarela, 0.68));
        p(an / 2 - 2, py, 1, ph, tono(P.pasarela, 1.1));
      }
      // La viga, cruzando de punta a punta.
      p(0, arriba - 6, an, ANCHO + 10, tono(P.pasarela, 0.92));
      p(0, arriba - 6, 1.5, ANCHO + 10, tono(P.pasarela, 1.35));
      p(an - 1.5, arriba - 6, 1.5, ANCHO + 10, tono(P.pasarela, 0.55));
      for (let y = arriba - 3; y < arriba + ANCHO; y += 6) p(an / 2 - 0.5, y, 1, 1, P.remache);
    });
    estampar(r, img, ob.x - w - 4, y0 - 26);
    if (!ob.resuelto) r.text('▼', ob.x, y0 - 36, colores.enemySus);
  } else {
    const g = geoTecho(alto);
    const ya = yEnTecho(g.medio - g.lomo, alto);
    const yb = yEnTecho(g.medio + g.lomo, alto);
    const h = yb - ya;
    const img = lamina(`bulto2|${Math.round(h)}`, w * 2 + 3, h + 10, (p, an) => {
      const ancho = an - 3;
      p(3, 5, ancho, h + 4, 'rgba(0,0,0,0.3)');         // su sombra en la tapa
      p(0, 0, ancho, h, tono(P.pasarela, 1.2));          // la tapa, vista de arriba
      p(0, 0, ancho, 1, tono(P.pasarela, 1.45));
      for (let x = 4; x < ancho - 2; x += 5) p(x, 0, 0.5, h, tono(P.pasarela, 0.95));
      p(0, h, ancho, 6, P.pasarela);                     // la cara de acá
      p(0, h + 5.5, ancho, 0.5, tono(P.pasarela, 0.5));
      for (const x of [ancho * 0.3, ancho * 0.7]) p(x, 0, 1, h + 6, '#b89a64');   // la soga
    });
    estampar(r, img, ob.x - w, ya - 2);
    if (!ob.resuelto) r.text('▲', ob.x, ya - 8, colores.bagLoot);
  }
}
