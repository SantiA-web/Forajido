/**
 * 🧗 EL TECHO VISTO DE COSTADO — etapa C1 del techo nuevo.
 *
 * *(Santi eligió la opción C: "vista lateral. Simple y fácil". Y antes: "las
 * paredes parecen de un juego lateral mientras que el techo parece visto desde
 * arriba" — la mezcla de ayer estaba mal.)*
 *
 * Al subir, el asalto deja de mirar desde arriba y mira COMO EL GALOPE: de
 * costado, con la cámara baja. Todo lo de esta vista va acá; la escena
 * (raidScene.js) sólo decide cuándo usarla.
 *
 * LO QUE NO CAMBIA, y es lo que la hace barata: el tren sigue yendo de
 * izquierda a derecha con LAS MISMAS medidas a lo largo. Un vagón, un hueco o
 * un cartel están en la misma `x` en las dos vistas. El ancho del techo (la
 * `y` de adentro, de 0 a 160) pasa a ser PROFUNDIDAD: el lado de allá queda
 * arriba en la tapa, el de acá abajo.
 *
 * Coordenadas: todo se dibuja en "mundo de costado": `x` la del tren, y la
 * vertical medida con la vía en `base`. La escena pone la cámara.
 */

import { CONFIG } from '../data/config.js';
import { dibujarTrenTresCuartos, MEDIDAS, LADO_GONDOLA, escalarColor } from './trenTresCuartos.js';
import { estamparTapa } from './techoDesdeArriba.js';
import { dibujarHorizonte } from './horizonte.js';
import { drawParallax } from '../engine/parallax.js';

const M = MEDIDAS;
const tono = (hex, f) => escalarColor(hex, f);

/** Lo que mide la tapa de costado (elegido por Santi: 24, un cuerpo). */
export function altoTapa() { return CONFIG.techo.costado.tapa; }

/**
 * DÓNDE ESTÁ LA SUPERFICIE QUE SE PISA en esta `x`: el filo de allá
 * (`arriba`) y el de acá (`abajo`), en la vertical de costado. Los coches y
 * furgones tienen el techo arriba de la caja; la góndola, más baja, arriba de
 * su costado (al pisarla se baja un escalón). Sobre un hueco devuelve null.
 */
export function superficieEn(train, x, base) {
  if (!train || train.tramoAt(x) !== 'vagon') return null;
  const w = train.wagons[train.wagonAt(x)];
  if (!w || w.esCola || !w.tieneTecho) return null;
  const pared = w.carbon ? LADO_GONDOLA : M.caja + M.alero;
  const abajo = base - M.bastidor - pared;
  return { abajo, arriba: abajo - altoTapa(), wagon: w };
}

/** De la `y` de adentro (0 allá … alto del mapa acá) a la vertical de costado. */
export function profundidad(sup, y, altoMapa) {
  const d = Math.max(0, Math.min(1, y / altoMapa));
  return sup.arriba + d * (sup.abajo - sup.arriba);
}

// ------------------------------------------------------------ el fondo

/**
 * EL AFUERA DE COSTADO: el cielo con sus cerros (el mismo del galope y la
 * huida, `dibujarHorizonte`), el campo que vuela hacia la cola y la vía. Va en
 * coordenadas de PANTALLA; `base` es la vía en pantalla.
 */
export function dibujarFondoDeCostado(r, { base, hy, avance, scroll, vel, dia, tormenta }) {
  const C = CONFIG.colors.cielo;
  const colors = CONFIG.colors;
  const tinte = (hex) => (dia ? hex : escalarColor(hex, 0.32));
  r.clear(dia ? colors.desiertoDia : escalarColor(colors.desiertoDia, 0.34));
  dibujarHorizonte(r, {
    hy, avance, dia, C, tinte, altoMax: 44, tormenta,
    cielo: tormenta ? [C.tormentaArriba, C.tormentaHorizonte]
      : dia ? [colors.puebloCielo, colors.puebloCieloHorizonte]
        : [C.nocheArriba, C.nocheHorizonte],
  });
  // El campo, de lejos (arriba, lento) a cerca (abajo, rápido): las mismas
  // capas del asalto, repartidas entre el horizonte y la vía, y debajo de la
  // vía las que vuelan.
  const P = CONFIG.parallax;
  const capas = P.capas;
  const lejos = capas.map((c, i) => ({
    ...c, v: c.v * vel * (0.35 + i * 0.12), y: Math.round(hy + 6 + (i / capas.length) * (base - hy - 30)),
  }));
  drawParallax(r, lejos, scroll, r.width);
  const cerca = capas.map((c, i) => ({
    ...c, v: c.v * vel * (1.3 + i * 0.25), y: Math.round(base + 14 + i * ((r.height - base - 16) / capas.length)),
  }));
  drawParallax(r, cerca, scroll, r.width);
  // La vía: el balasto y los durmientes asomando, corriendo a la velocidad del suelo.
  const balasto = dia ? colors.cielo.balasto : escalarColor(colors.cielo.balasto, 0.5);
  r.rect(0, base - 2, r.width, 7, balasto);
  r.rect(0, base - 2, r.width, 1, tono(balasto, 1.2));
  const corre = (scroll * P.suelo * vel) % 12;
  for (let x = -corre; x < r.width; x += 12) r.rect(x, base + 3, 6, 2, tono(balasto, 0.62));
}

// ------------------------------------------------------------ el tren

/**
 * EL TREN DE COSTADO: el del galope tal cual, y encima de cada vagón con techo
 * la TAPA NUESTRA, más honda (`costado.tapa`, 24 en vez de 14), para que se
 * note cuando te corrés hacia un borde. La tapa vieja queda tapada por la
 * nueva, que arranca en el mismo lugar y sube más.
 */
export function dibujarTrenDeCostado(r, train, base, camX, ancho, noche) {
  dibujarTrenTresCuartos(r, train, base, camX, ancho, { noche });
  const L = CONFIG.colors.locomotora;
  const P = CONFIG.colors.costado;
  for (const w of train.wagons) {
    if (w.esCola || !w.tieneTecho) continue;
    if (w.x > camX + ancho + 20 || w.x + w.width < camX - 20) continue;
    const sup = superficieEn(train, w.x + w.width / 2, base);
    if (!sup) continue;
    if (w.carbon) {
      // La góndola: carbón hasta el tope, con terrones con luz.
      r.rect(w.x + 2, sup.arriba, w.width - 4, sup.abajo - sup.arriba, L.carbon);
      for (let i = 0; i < w.width / 3; i++) {
        const x = w.x + 4 + ((i * 37) % (w.width - 8));
        const y = sup.arriba + 1 + ((i * 13) % (altoTapa() - 2));
        r.rect(x, y, 2, 1, L.carbonLuz);
      }
      r.rect(w.x + 2, sup.abajo - 1, w.width - 4, 1, tono(P.gondola, 1.5));
    } else {
      estamparTapa(r, w, sup.arriba, sup.abajo - sup.arriba);
      // El canto del alero de acá, con su luz: separa la tapa de la pared.
      r.rect(w.x, sup.abajo - 0.5, w.width, 0.5, P.tapaLuz);
    }
    if (noche) {
      // De noche la tapa queda a la luz de la luna (la pared ya viene de noche).
      const F = CONFIG.tresCuartos.faroles;
      const b = Math.min(1, F.brilloNoche * CONFIG.techo.sensacion.lunaTecho);
      const canal = (i) => Math.round(255 * Math.min(1, b * F.tinteNoche[i]));
      r.ctx.save();
      r.ctx.globalCompositeOperation = 'multiply';
      r.ctx.fillStyle = `rgb(${canal(0)},${canal(1)},${canal(2)})`;
      r.ctx.fillRect(w.x, sup.arriba, w.width, sup.abajo - sup.arriba);
      r.ctx.restore();
    }
  }
}

// ------------------------------------------------------------ los obstáculos

/**
 * EL CARTEL DE COSTADO: un poste delante del tren (de la vía para arriba), un
 * brazo que cruza por encima del techo, y colgando de él un CARTEL A LA ALTURA
 * DE LA CABEZA que tapa la tapa entera. Se ve sin pensar que te pega arriba:
 * agachate. Su sombra cruza la tapa. `antes` dibuja lo que va detrás de vos;
 * `despues`, lo que va delante (el cartel te pasa por delante de la cara).
 */
export function dibujarPorticoDeCostado(r, ob, sup, base, parte) {
  const P = CONFIG.colors.costado;
  const madera = P.pasarela;
  const x = ob.x;
  const viga = sup.arriba - CONFIG.techo.costado.alturaViga;
  const ancho = CONFIG.techo.costado.anchoCartel;
  const alto = CONFIG.techo.costado.altoCartel;
  const tapa = sup.abajo - sup.arriba;
  if (parte === 'antes') {
    // La sombra del cartel sobre la tapa, corrida hacia la cola.
    r.ctx.save();
    r.ctx.globalAlpha = 0.28;
    r.rect(x - ancho / 2 - 3, sup.arriba + 2, ancho, tapa - 2, '#000');
    r.ctx.restore();
    return;
  }
  // El poste de acá, de la vía hasta arriba del techo, y el brazo que cruza.
  const tope = viga - 10;
  r.rect(x + ancho / 2 - 1, tope, 4, base + 4 - tope, madera);
  r.rect(x + ancho / 2 - 1, tope, 1, base + 4 - tope, tono(madera, 1.3));
  r.rect(x - ancho / 2 - 2, tope, ancho + 6, 3, tono(madera, 0.9));
  r.rect(x - ancho / 2 - 2, tope, ancho + 6, 1, tono(madera, 1.3));
  // Las cadenas y el cartel, colgando a la altura de la cabeza.
  for (const cx of [x - ancho / 2 + 2, x + ancho / 2 - 3]) r.rect(cx, tope + 3, 1, viga - tope - 3, '#3a3430');
  r.rect(x - ancho / 2, viga, ancho, alto, tono(madera, 1.05));
  r.rect(x - ancho / 2, viga, ancho, 1, tono(madera, 1.4));
  r.rect(x - ancho / 2, viga + alto - 1, ancho, 1, tono(madera, 0.55));
  r.rect(x - ancho / 2 + 2, viga + 3, ancho - 4, 1, tono(madera, 0.7));
  r.rect(x - ancho / 2 + 2, viga + 6, ancho - 6, 1, tono(madera, 0.7));
}

/**
 * EL CAJÓN DE COSTADO: amarrado sobre el LOMO (sólo en el medio del ancho),
 * con su tapa arriba y su cara de acá. Bajo: se ve que te pega en los pies.
 */
export function dibujarCajonDeCostado(r, ob, sup, altoMapa) {
  const P = CONFIG.colors.costado;
  const madera = P.pasarela;
  const lomo = CONFIG.techo.superficie.lomo;
  const ya = profundidad(sup, altoMapa * (1 - lomo) / 2, altoMapa);
  const yb = profundidad(sup, altoMapa * (1 + lomo) / 2, altoMapa);
  const alto = CONFIG.techo.costado.altoCajon;
  const w = CONFIG.techo.obstaculoAncho;
  r.ctx.save();
  r.ctx.globalAlpha = 0.3;
  r.rect(ob.x - w + 2, yb - 1, w * 2, 2, '#000');
  r.ctx.restore();
  r.rect(ob.x - w, ya - alto, w * 2, yb - ya, tono(madera, 1.2));     // la tapa
  r.rect(ob.x - w, ya - alto, w * 2, 0.5, tono(madera, 1.45));
  r.rect(ob.x - w, yb - alto, w * 2, alto, madera);                    // la cara de acá
  r.rect(ob.x - w, yb - 0.5, w * 2, 0.5, tono(madera, 0.5));
  for (const sx of [ob.x - w * 0.4, ob.x + w * 0.4]) r.rect(sx, ya - alto, 1, yb - ya + alto, '#b89a64');
  return yb - alto - (yb - ya);
}
