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
 * 🔻 EL TECHO EN TRES CUARTOS *(Santi: "la parte del techo también debería
 * verse en 3/4, porque ahora se ve como algo plano cuando no debería serlo")*.
 *
 * La primera versión cubría sólo el piso del vagón (de 0 al alto del mapa), y
 * eso tenía tres consecuencias que lo aplastaban:
 *
 *  1. POR ENCIMA ASOMABA LA PARED DE ADENTRO, con sus ventanillas vistas desde
 *     el pasillo: el techo parecía una lámina tirada en el piso del vagón y no
 *     una tapa arriba de las paredes. Ahora el techo SUBE `SOBRE` unidades —el
 *     alto de la pared del fondo (`CONFIG.tresCuartos.alturaPared`)— y la tapa.
 *  2. ERA DEL MISMO TONO DE PUNTA A PUNTA. Un techo de tren es curvo: la
 *     mitad de allá se aleja y queda en sombra, el lomo agarra la luz y la
 *     mitad de acá baja hacia vos (`arco`). Es lo que le da el volumen.
 *  3. LO DE ENCIMA NO TENÍA ALTO. La linterna, la pasarela y la garita eran
 *     casi planas; ahora cada una tiene su cara de acá, con su alto, y su
 *     sombra sobre el techo.
 *
 * Y el alero de acá SOBRESALE: tira sombra sobre la pared de afuera del vagón,
 * que en el asalto cuelga por debajo del piso.
 *
 * Nada de esto mueve la franja pisable: sigue en `CONFIG.techo.centroY`, que
 * cae casi justo en el lomo del techo nuevo. Ni el jugador, ni las balas, ni los
 * jinetes se corrieron un punto.
 */
const SOBRE = CONFIG.tresCuartos.alturaPared;

/**
 * CUÁNTA LUZ AGARRA CADA FRANJA DEL TECHO CURVO. 1 en el lomo; bajando hacia
 * el alero de allá se oscurece más que hacia el de acá, porque la mitad de acá
 * mira a la cámara y al sol.
 */
function arco(y, alto, c) {
  const cima = c.centroY;
  if (y < cima) {
    const d = (cima - y) / (cima + SOBRE);
    return 1.14 - 0.52 * d ** 1.2;
  }
  const d = (y - cima) / (alto - cima);
  return 1.14 - 0.3 * d ** 1.2;
}

/**
 * Pinta una franja horizontal del techo en coordenadas del MUNDO (de −SOBRE al
 * alto del mapa); la lámina empieza en −SOBRE, así que se corre sola.
 */
function pincelMundo(p) {
  return (x, y, w, h, color) => p(x, y + SOBRE, w, h, color);
}

/** El techo curvo de fondo: franjas de dos unidades, cada una con su luz. */
function fondoCurvo(q, ancho, alto, c, base, variar) {
  for (let y = -SOBRE, k = 0; y < alto; y += 2, k++) {
    q(0, y, ancho, 2, tono(base, arco(y, alto, c) * (variar ? variar(y, k) : 1)));
  }
}

/**
 * LOS DOS ALEROS. El de allá es un filo oscuro contra el afuera. El de acá
 * tiene su canto con luz y, abajo, el borde grueso de la tapa: es la cara que
 * sobresale sobre la pared.
 */
function aleros(q, ancho, alto, P) {
  q(0, -SOBRE, ancho, 1.5, tono(P.techo, 0.55));
  q(0, -SOBRE + 1.5, ancho, 0.5, tono(P.techoLuz, 0.9));
  q(0, alto - 4, ancho, 1, P.tapaLuz);
  q(0, alto - 3, ancho, 3, tono(P.techo, 0.8));
  q(0, alto - 0.5, ancho, 0.5, tono(P.techo, 0.5));
}

/**
 * EL COCHE DE GENTE: tela alquitranada en paños, curva, y en el lomo LA
 * LINTERNA — la sobreelevación con sus ventanitas, la misma que se ve desde el
 * caballo. Ahora tiene alto: su tapa arriba, su cara de acá con los vidrios y la
 * sombra que tira sobre el techo. Se camina por encima de su tapa.
 */
function tramoCoche(p, ancho, alto, v, P, c) {
  const q = pincelMundo(p);
  const base = tono(P.tapa, 0.98 + v * 0.008);
  // Cada paño de tela con su tono: una tela del mismo gris de punta a punta se
  // leía como una chapa lisa.
  fondoCurvo(q, ancho, alto, c, base, (y) => 0.97 + ((Math.floor((y + SOBRE) / 9) * 5) % 4) * 0.02);
  for (let y = -SOBRE + 9; y < alto - 6; y += 9) q(0, y, ancho, 0.5, tono(base, arco(y, alto, c) * 0.8));
  for (let k = 0; k < 3; k++) {
    const mx = (v * 11 + k * 13) % (ancho - 6), my = -SOBRE + 10 + ((v * 29 + k * 47) % (alto));
    if (Math.abs(my - c.centroY) > c.ancho + 12) q(mx, my, 4 + k, 2, tono(base, arco(my, alto, c) * 0.86));
  }
  // La linterna: la tapa (donde se pisa), la cara de acá y su sombra.
  const tapa0 = c.centroY - c.ancho - 6, tapa1 = c.centroY + c.ancho + 2;
  const CARA = 10;
  q(0, tapa0 - 1, ancho, 1, tono(P.techo, 0.6));
  for (let y = tapa0; y < tapa1; y += 2) q(0, y, ancho, 2, tono(P.tapaLuz, 0.98 - (y - tapa0) * 0.002));
  for (let y = tapa0 + 5; y < tapa1 - 1; y += 5) q(0, y, ancho, 0.5, tono(P.tapaLuz, 0.86));
  q(0, tapa1, ancho, 0.5, tono(P.tapaLuz, 1.15));
  q(0, tapa1 + 0.5, ancho, CARA, tono(P.techo, 1.05));
  for (let x = 4; x < ancho - 4; x += 14) {
    q(x, tapa1 + 1.5, 7, CARA - 3, P.marco);
    q(x + 1, tapa1 + 2, 5, CARA - 4, tono(P.vidrioDia, 0.82));
    q(x + 1, tapa1 + 2, 2, 1, tono(P.vidrioDia, 1.1));
  }
  q(0, tapa1 + CARA + 0.5, ancho, 2, tono(base, arco(tapa1 + CARA, alto, c) * 0.6));
  // Un respiradero de hongo, con su sombra.
  if (v % 2 === 0) {
    const ry = tapa0 - 16;
    q(ancho - 11, ry + 5, 6, 2, tono(base, arco(ry, alto, c) * 0.6));
    q(ancho - 10, ry, 4, 5, tono(P.techo, 0.85));
    q(ancho - 11, ry - 1, 6, 2, P.techoLuz);
  }
  aleros(q, ancho, alto, P);
}

/**
 * EL FURGÓN: chapa curva con sus costillas cruzadas y, en el lomo, LA PASARELA
 * de los guardafrenos levantada sobre sus largueros: tablones cruzados, el canto
 * de acá con alto y la sombra que tira sobre la chapa.
 */
function tramoFurgon(p, ancho, alto, v, P, c) {
  const q = pincelMundo(p);
  const base = tono(P.tapa, 0.97 + v * 0.008);
  fondoCurvo(q, ancho, alto, c, base);
  // Las costillas: cada una con su filo de luz y su sombra, siguiendo la curva.
  for (let x = 0; x < ancho; x += 8) {
    for (let y = -SOBRE + 2; y < alto - 4; y += 2) {
      const a = arco(y, alto, c);
      q(x, y, 1, 2, tono(base, a * 1.16));
      q(x + 1, y, 0.5, 2, tono(base, a * 0.76));
    }
  }
  const y0 = c.centroY - c.ancho - 1, y1 = c.centroY + c.ancho + 1;
  // La sombra de la pasarela sobre la chapa, y el canto de los largueros.
  q(0, y1 + 2, ancho, 3, tono(base, arco(y1, alto, c) * 0.55));
  q(0, y1, ancho, 2, tono(P.pasarela, 0.55));
  // Los tablones, cada uno con su tono y un clavo en cada punta.
  for (let x = 0, i = 0; x < ancho; x += 3, i++) {
    const t = tono(P.pasarela, 0.9 + ((i * 7 + v * 3) % 5) * 0.05);
    q(x, y0, 2.5, y1 - y0, t);
    q(x, y0, 2.5, 0.5, tono(t, 1.25));
    q(x + 1, y0 + 1.5, 0.5, 0.5, P.remache);
    q(x + 1, y1 - 2, 0.5, 0.5, P.remache);
    q(x, y1, 2.5, 2, tono(t, 0.62));                  // el canto de cada tablón
  }
  aleros(q, ancho, alto, P);
}

/** EL BLINDADO: chapas remachadas y curvas, y la franja de chapa estriada. */
function tramoBlindado(p, ancho, alto, v, P, c) {
  const q = pincelMundo(p);
  const base = tono(P.blindado, 1.08 + v * 0.008);
  fondoCurvo(q, ancho, alto, c, base);
  // Las juntas de las chapas y sus remaches.
  for (const y of [-SOBRE + 4, 30, 122, alto - 8]) {
    q(0, y, ancho, 1, tono(base, arco(y, alto, c) * 0.7));
    for (let x = 2; x < ancho; x += 4) q(x, y - 1.5, 0.5, 0.5, P.remache);
  }
  for (let y = -SOBRE + 4; y < alto - 4; y += 2) q(ancho - 1, y, 1, 2, tono(base, arco(y, alto, c) * 0.72));
  const y0 = c.centroY - c.ancho - 1, y1 = c.centroY + c.ancho + 1;
  q(0, y0, ancho, y1 - y0, tono(base, 0.92));
  // La chapa estriada: rombitos en diagonal, que es lo que la hace antideslizante.
  for (let y = y0 + 1.5, f = 0; y < y1 - 1; y += 2.5, f++) {
    for (let x = (f % 2) * 2; x < ancho; x += 4) q(x, y, 1.5, 0.5, tono(base, 1.25));
  }
  q(0, y1, ancho, 1.5, tono(base, 0.6));                // el borde, un poco levantado
  aleros(q, ancho, alto, P);
}

/**
 * La punta de un techo: la tabla del borde, que acá termina CURVA —su alto
 * sigue el lomo—, y los dos pasamanos de hierro para agarrarse al subir.
 */
function punta(p, alto, P, izquierda, c) {
  const q = pincelMundo(p);
  const x = izquierda ? 0 : PUNTA - 3;
  for (let y = -SOBRE + 1; y < alto - 1; y += 2) q(x, y, 3, 2, tono(P.techo, 0.7 * arco(y, alto, c)));
  for (let y = -SOBRE + 1; y < alto - 1; y += 2) q(izquierda ? 2.5 : x, y, 0.5, 2, tono(P.techoLuz, arco(y, alto, c)));
  for (const y of [8, alto - 30]) {
    q(izquierda ? 4 : PUNTA - 9, y, 5, 1, tono(P.remache, 1.5));
    q(izquierda ? 4 : PUNTA - 9, y + 1, 5, 0.5, P.remache);
    q(izquierda ? 4 : PUNTA - 9, y + 1.5, 5, 1, 'rgba(0,0,0,0.25)');
  }
}

// ------------------------------------------------------------ lo que hay una vez

/**
 * La garita del cabús, del lado de allá de la franja: su techito arriba, su
 * cara de acá con los dos vidrios —con alto, como una caja parada en el
 * techo— y la sombra que tira hacia vos.
 */
function garita(r, x, P, c) {
  const img = lamina('garita', 40, 58, (p) => {
    p(0, 0, 40, 5, P.techo);
    p(0, 0, 40, 1, P.techoLuz);
    p(1, 5, 38, 12, tono(P.caboose, 0.9));           // su techito, visto de arriba
    for (let y = 8; y < 17; y += 4) p(1, y, 38, 0.5, tono(P.caboose, 0.75));
    p(1, 17, 38, 1, tono(P.caboose, 1.3));
    p(1, 18, 38, 20, P.caboose);                     // la cara de acá, con su alto
    for (let y = 22; y < 38; y += 4) p(1, y, 38, 0.5, tono(P.caboose, 0.82));
    for (const vx of [6, 24]) { p(vx, 22, 10, 9, P.marco); p(vx + 1, 23, 8, 7, P.vidrioDia); p(vx + 1, 23, 3, 1, tono(P.vidrioDia, 1.2)); }
    p(0, 38, 40, 2, tono(P.techo, 0.6));
    p(2, 40, 36, 6, 'rgba(0,0,0,0.3)');              // su sombra sobre el techo
  });
  estampar(r, img, x - 20, c.centroY - c.ancho - 58);
}

/** La escotilla del blindado: la tapa gruesa con remaches, con su canto de alto. */
function escotilla(r, x, P, c) {
  const img = lamina('escotilla', 26, 24, (p) => {
    p(2, 2, 22, 14, tono(P.blindado, 1.25));
    p(2, 2, 22, 1, tono(P.blindado, 1.5));
    for (let rx = 3; rx < 24; rx += 4) { p(rx, 3, 0.5, 0.5, P.remache); p(rx, 14.5, 0.5, 0.5, P.remache); }
    p(11, 7, 4, 3, P.remache);
    p(2, 16, 22, 4, tono(P.blindado, 0.7));          // el canto, con alto
    p(3, 20, 22, 3, 'rgba(0,0,0,0.3)');
  });
  estampar(r, img, x - 13, c.centroY - c.ancho - 32);
}

/** Las bocas del hielo del refrigerado: dos tapas levantadas en cada punta. */
function bocasDeHielo(r, x, P, c) {
  const img = lamina('hielo', 14, 14, (p) => {
    p(1, 1, 12, 7, P.refrigerado);
    p(1, 1, 12, 1, tono(P.refrigerado, 1.1));
    p(5, 3.5, 4, 2, P.remache);
    p(1, 8, 12, 3, tono(P.refrigerado, 0.7));
    p(2, 11, 12, 2, 'rgba(0,0,0,0.3)');
  });
  for (const y of [c.centroY - c.ancho - 24, c.centroY + c.ancho + 12]) estampar(r, img, x, y);
}

// ------------------------------------------------------------ el techo entero

/**
 * EL TECHO DE UN VAGÓN, en su lugar. `w` es el vagón armado (world/train.js);
 * `alto` es el fondo del vagón (el alto del mapa). Se dibuja de −SOBRE a
 * `alto`: sube hasta tapar la pared del fondo.
 */
export function dibujarTechoDesdeArriba(r, w, alto) {
  const P = CONFIG.colors.costado;
  const c = CONFIG.techo;
  const familia = familiaDe({ id: w.id, carbon: w.carbon });
  const hacer = familia === 'coche' ? tramoCoche
    : familia === 'blindado' ? tramoBlindado
      : tramoFurgon;
  const altoLamina = alto + SOBRE;

  // Los tramos, a lo largo, cada uno con su variante fija.
  const cuantos = Math.ceil((w.width - PUNTA * 2) / TRAMO);
  for (let i = 0; i < cuantos; i++) {
    const v = variante(w.index || 0, i);
    const img = lamina(`${familia}|${v}|${alto}`, TRAMO, altoLamina, (p) => hacer(p, TRAMO, alto, v, P, c));
    const x = w.x + PUNTA + i * TRAMO;
    const sobra = w.x + w.width - PUNTA - x;
    if (sobra >= TRAMO) estampar(r, img, x, -SOBRE);
    else r.ctx.drawImage(img, 0, 0, sobra / PASO, img.height, x, -SOBRE, sobra, altoLamina);
  }
  // Las puntas: el techo sigue hasta el borde, y ahí termina en su tabla.
  const base = lamina(`${familia}|0|${alto}`, TRAMO, altoLamina, (p) => hacer(p, TRAMO, alto, 0, P, c));
  for (const izq of [true, false]) {
    const x = izq ? w.x : w.x + w.width - PUNTA;
    r.ctx.drawImage(base, 0, 0, PUNTA / PASO, base.height, x, -SOBRE, PUNTA, altoLamina);
    estampar(r, lamina(`punta|${izq}|${alto}`, PUNTA, altoLamina, (p) => punta(p, alto, P, izq, c)), x, -SOBRE);
  }

  /**
   * LA SOMBRA DEL ALERO SOBRE LA PARED DE AFUERA. El alero de acá sobresale, y
   * la pared que cuelga debajo del vagón queda a oscuras justo abajo de él. Es
   * la raya que despega el techo de la pared: sin ella, las dos se leían como
   * un mismo plano.
   */
  r.ctx.save();
  r.ctx.globalAlpha = 0.4;
  r.rect(w.x, alto, w.width, 2, '#000');
  r.ctx.globalAlpha = 0.18;
  r.rect(w.x, alto + 2, w.width, 3, '#000');
  r.ctx.restore();

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
