/**
 * 🧗 EL TECHO EN VISTA LATERAL — etapa C1 del techo nuevo.
 *
 * *(Santi eligió la opción C: "vista lateral. Simple y fácil".)*
 *
 * 🔁 LA PRIMERA VERSIÓN NO ERA LATERAL, ERA TRES CUARTOS *(Santi: "es vista
 * lateral, no es tan difícil. No parece como la imagen que me diste. Se ve
 * 3/4")*. Tenía razón: se le había puesto al tren una tapa honda (24) vista
 * desde arriba, y el jugador subía y bajaba adentro de ella. Eso es mirar
 * desde arriba. En vista lateral el techo NO se ve por encima: se ve sólo su
 * PERFIL, una franja fina y redondeada encima de la pared. Y se corta todo lo
 * que el dibujo del galope muestra desde arriba (la tapa, la linterna).
 *
 * EL ANCHO DEL TECHO SE VE ASÍ *(la idea de Santi)*: el lomo es la línea de
 * arriba del perfil. Hacia el lado de allá la curva baja DETRÁS del techo: te
 * hundís y queda sólo la cabeza asomando. Hacia el lado de acá la curva baja
 * DELANTE: te ves bajando por ella, hasta el alero. Los dos lados funcionan
 * igual; uno se ve y el otro se percibe.
 *
 * LO QUE NO CAMBIA: el tren va de izquierda a derecha con las MISMAS medidas
 * a lo largo que adentro. Un vagón, un hueco o un cartel están en la misma
 * `x` en las dos vistas. Para los guardias de abajo nada cambia.
 *
 * Coordenadas: `x` la del tren; la vertical con la vía en `base`. La escena
 * pone la cámara.
 */

import { CONFIG } from '../data/config.js';
import { dibujarTrenTresCuartos, MEDIDAS, LADO_GONDOLA, escalarColor } from './trenTresCuartos.js';
import { dibujarHorizonte } from './horizonte.js';
import { drawParallax, drawSpeedLines } from '../engine/parallax.js';
import { geoTecho } from './techoGeometria.js';

const M = MEDIDAS;
const tono = (hex, f) => escalarColor(hex, f);

/**
 * EL PERFIL DEL TECHO en esta `x`: `arriba` es la línea del lomo (lo más alto
 * del techo) y `abajo` el alero de acá, donde termina la pared. La góndola,
 * más baja, tiene el carbón asomando arriba de su costado (al pisarla bajás un
 * escalón). Sobre un hueco devuelve null.
 */
export function superficieEn(train, x, base) {
  if (!train || train.tramoAt(x) !== 'vagon') return null;
  const w = train.wagons[train.wagonAt(x)];
  if (!w || w.esCola || !w.tieneTecho) return null;
  const C = CONFIG.techo.costado;
  const abajo = base - M.bastidor - (w.carbon ? LADO_GONDOLA : M.caja + M.alero);
  return { abajo, arriba: abajo - (w.carbon ? C.carbon : C.perfil), wagon: w };
}

/**
 * DÓNDE VAN TUS PIES según tu `y` de adentro (el ancho del techo), y si estás
 * DETRÁS del techo (del lado de allá: te tapa el perfil y queda la cabeza).
 *
 *   en el lomo        los pies en la línea de arriba
 *   curva de allá     te hundís detrás, hasta `hundeAlla` (queda la cabeza)
 *   curva de acá      bajás por delante, hasta el alero
 */
export function piesEnTecho(sup, y, altoMapa) {
  const g = geoTecho(altoMapa);
  const d = y - g.medio;
  if (Math.abs(d) <= g.lomo) return { pies: sup.arriba, detras: false, escala: 1 };
  const f = Math.min(1, (Math.abs(d) - g.lomo) / g.curva);
  const curva = 1 - Math.cos((f * Math.PI) / 2);     // baja de a poco y después más
  const C = CONFIG.techo.costado;
  // Del lado de allá, además, te achicás un poco: te estás alejando.
  if (d < 0) return { pies: sup.arriba + curva * C.hundeAlla, detras: true, escala: 1 - C.achicaAlla * f };
  return { pies: sup.arriba + curva * (sup.abajo - sup.arriba), detras: false, escala: 1 };
}

// ------------------------------------------------------------ el fondo

/**
 * EL AFUERA DE COSTADO: el cielo con sus cerros (el mismo del galope y la
 * huida, `dibujarHorizonte`), el campo que vuela hacia la cola y la vía. Va en
 * coordenadas de PANTALLA; `base` es la vía en pantalla.
 */
export function dibujarFondoDeCostado(r, { base, hy, avance, scroll, vel: velTren, dia, tormenta }) {
  // 💨 Arriba va rapidísimo: el campo corre a más del doble (`velocidadFondo`).
  const vel = velTren * CONFIG.techo.costado.velocidadFondo;
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
  // Las rayas de velocidad: en el campo de atrás y en el de adelante, nunca
  // sobre el tren.
  const R = CONFIG.techo.costado.rayas;
  const color = dia ? R.color : escalarColor(R.color, 0.45);
  drawSpeedLines(r, scroll, r.width, { ...R, color, velocidad: R.velocidad * velTren, desde: hy + 4, hasta: base - 90 });
  drawSpeedLines(r, scroll * 1.3, r.width, { ...R, color, velocidad: R.velocidad * 1.4 * velTren, desde: base + 10, hasta: r.height - 2, semilla: 3.1 });
}

// ------------------------------------------------------------ el tren

/**
 * EL TREN DE PERFIL: el del galope, pero RECORTADO justo encima de la pared de
 * cada vagón cerrado, para que no se vea nada de arriba (la tapa, la linterna,
 * la garita). Encima, el PERFIL del techo: una franja redondeada con su luz
 * arriba y el alero abajo. La góndola, recortada sobre su costado, con el
 * montón de carbón asomando.
 */
export function dibujarTrenDeCostado(r, train, base, camX, ancho, noche) {
  const P = CONFIG.colors.costado;
  const L = CONFIG.colors.locomotora;
  const visibles = train.wagons.filter((w) => !w.esCola && w.x < camX + ancho + 20 && w.x + w.width > camX - 20);
  const corte = (w) => {
    if (w.carbon) return base - M.bastidor - LADO_GONDOLA;
    if (w.tieneTecho || w.id === 'ganado') return base - M.bastidor - M.caja - M.alero;
    return null;
  };

  // El recorte: toda la pantalla MENOS lo que queda arriba de cada pared.
  const ctx = r.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.rect(camX - 100, -2000, ancho + 200, 4000);
  for (const w of visibles) {
    const y = corte(w);
    if (y !== null) ctx.rect(w.x, -2000, w.width, 2000 + y);
  }
  ctx.clip('evenodd');
  dibujarTrenTresCuartos(r, train, base, camX, ancho, { noche });
  ctx.restore();

  for (const w of visibles) {
    if (!w.tieneTecho) continue;
    const sup = superficieEn(train, w.x + w.width / 2, base);
    if (!sup) continue;
    const alto = sup.abajo - sup.arriba;
    if (w.carbon) {
      // El montón de carbón sobre el costado: un lomo irregular con terrones.
      for (let x = w.x + 3, i = 0; x < w.x + w.width - 3; x += 2, i++) {
        const h = alto * (0.55 + 0.45 * Math.sin(i * 0.21) * Math.sin(i * 0.07 + 1));
        r.rect(x, sup.abajo - h, 2, h, noche ? tono(L.carbon, 0.7) : L.carbon);
        if (i % 3 === 0) r.rect(x, sup.abajo - h, 1, 1, noche ? tono(L.carbonLuz, 0.6) : L.carbonLuz);
      }
      r.rect(w.x + 2, sup.abajo - 1, w.width - 4, 1, tono(P.gondola, noche ? 0.8 : 1.5));
      continue;
    }
    // El perfil del techo: las puntas redondeadas (dos escalones) y bandas
    // horizontales de luz: arriba agarra el sol, abajo se oscurece hacia el alero.
    const base0 = noche ? 0.55 : 1;
    for (let k = 0; k < alto; k++) {
      const u = k / alto;
      const meter = k < 1 ? 3 : k < 2 ? 1 : 0;
      const luz = (1.25 - u * 0.5) * base0;
      r.rect(w.x + meter, sup.arriba + k, w.width - meter * 2, 1, tono(P.techo, luz));
    }
    r.rect(w.x + 3, sup.arriba, w.width - 6, 0.5, tono(P.techoLuz, 1.3 * base0));
    // El alero: sobresale un poco y tira su sombra sobre la pared.
    r.rect(w.x - 1, sup.abajo - 1, w.width + 2, 1.5, tono(P.techo, 0.6 * base0));
    r.ctx.save();
    r.ctx.globalAlpha = 0.35;
    r.rect(w.x, sup.abajo + 0.5, w.width, 2, '#000');
    r.ctx.restore();
  }
}

// ------------------------------------------------------------ los obstáculos

/**
 * EL CARTEL (agacharse): un poste delante del tren, un brazo que cruza por
 * encima, y colgando de él un CARTEL A LA ALTURA DE LA CABEZA. Parado te pega
 * en la cara; agachado pasás por debajo. Se dibuja delante tuyo.
 */
export function dibujarPorticoDeCostado(r, ob, sup, base) {
  const P = CONFIG.colors.costado;
  const C = CONFIG.techo.costado;
  const madera = P.pasarela;
  const x = ob.x;
  const viga = sup.arriba - C.alturaViga;
  const ancho = C.anchoCartel;
  const alto = C.altoCartel;
  const tope = viga - 10;
  r.rect(x + ancho / 2 - 1, tope, 4, base + 4 - tope, madera);
  r.rect(x + ancho / 2 - 1, tope, 1, base + 4 - tope, tono(madera, 1.3));
  r.rect(x - ancho / 2 - 2, tope, ancho + 6, 3, tono(madera, 0.9));
  r.rect(x - ancho / 2 - 2, tope, ancho + 6, 1, tono(madera, 1.3));
  for (const cx of [x - ancho / 2 + 2, x + ancho / 2 - 3]) r.rect(cx, tope + 3, 1, viga - tope - 3, '#3a3430');
  r.rect(x - ancho / 2, viga, ancho, alto, tono(madera, 1.05));
  r.rect(x - ancho / 2, viga, ancho, 1, tono(madera, 1.4));
  r.rect(x - ancho / 2, viga + alto - 1, ancho, 1, tono(madera, 0.55));
  r.rect(x - ancho / 2 + 2, viga + 3, ancho - 4, 1, tono(madera, 0.7));
  r.rect(x - ancho / 2 + 2, viga + 6, ancho - 6, 1, tono(madera, 0.7));
}

/**
 * EL CAJÓN (saltar): de perfil, apoyado en el lomo, con sus tablas y las dos
 * sogas. Bajo: se ve que te pega en los pies. Devuelve dónde está su tope.
 */
export function dibujarCajonDeCostado(r, ob, sup) {
  const madera = CONFIG.colors.costado.pasarela;
  const alto = CONFIG.techo.costado.altoCajon;
  const w = CONFIG.techo.obstaculoAncho;
  const y = sup.arriba - alto;
  r.rect(ob.x - w, y, w * 2, alto, madera);
  r.rect(ob.x - w, y, w * 2, 1, tono(madera, 1.4));
  r.rect(ob.x - w, sup.arriba - 1, w * 2, 1, tono(madera, 0.5));
  for (let x = ob.x - w + 5; x < ob.x + w - 1; x += 6) r.rect(x, y + 1, 0.5, alto - 2, tono(madera, 0.7));
  for (const sx of [ob.x - w * 0.45, ob.x + w * 0.45]) r.rect(sx, y, 1, alto, '#b89a64');
  return y;
}
