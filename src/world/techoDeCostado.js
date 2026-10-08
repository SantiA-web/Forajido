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
import { drawSpeedLines } from '../engine/parallax.js';
import { adornoDelDesierto, adornoDeCerca } from './desierto.js';
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
  r.clear(tinte(colors.desiertoDia));
  dibujarSuelo(r, { base, hy, scroll, vel, dia, tinte });
  dibujarHorizonte(r, {
    hy, avance, dia, C, tinte, altoMax: 44, tormenta,
    cielo: tormenta ? [C.tormentaArriba, C.tormentaHorizonte]
      : dia ? [colors.puebloCielo, colors.puebloCieloHorizonte]
        : [C.nocheArriba, C.nocheHorizonte],
  });
  // 🔁 Las capas de rayitas oscuras del asalto se sacaron de acá *(Santi: "hay
  // líneas negras moviéndose con el tren, el piso no parece desierto sino una
  // lámina beige")*: el suelo ahora lo hace `dibujarSuelo`, y los postes del
  // telégrafo van detrás del tren.
  const P = CONFIG.parallax;
  dibujarTelegrafo(r, { base, scroll, vel, dia });
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
  drawSpeedLines(r, scroll * 1.3, r.width, { ...R, color, velocidad: R.velocidad * 1.4 * velTren, desde: base + 10, hasta: r.height - 2, semilla: 3.1 });
}

/** Un número fijo para cada par (siempre el mismo): para sembrar sin azar. */
function revolver(a, b) {
  let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** Mezcla dos colores (#rrggbb): `t` 0 es el primero, 1 el segundo. */
function mezclar(a, b, t) {
  const n = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * 🏜️ CUÁNTO MIDE Y A QUÉ VELOCIDAD PASA lo que está apoyado en el suelo a esta
 * altura de la pantalla: 1 es junto a la vía; menos, más lejos; más, entre la
 * vía y la cámara. Está calibrado para que **el suelo de los jinetes de allá
 * mida lo mismo que ellos** (`allaEscala`): un cactus a su lado es tan chico
 * como ellos, y por eso se leen lejos y no chiquitos. Entre el horizonte y
 * ellos se achica rápido; debajo de la vía crece y vuela.
 */
export function profundidadDelSuelo(y, { base, hy, alto }) {
  const C = CONFIG.techo.costado;
  const yJ = base - C.allaSobreLaVia + 7;
  const kJ = C.allaEscala;
  if (y <= yJ) return 0.1 + (kJ - 0.1) * Math.max(0, (y - hy) / Math.max(1, yJ - hy));
  if (y <= base) return kJ + (1 - kJ) * (y - yJ) / Math.max(1, base - yJ);
  return 1 + 1.3 * (y - base) / Math.max(1, alto - base);
}

/**
 * 🏜️ EL SUELO DEL DESIERTO, CON PROFUNDIDAD *(Santi: "el piso no parece
 * desierto sino una lámina beige")*. Tres cosas lo hacen un lugar:
 *
 *  - LA LUZ: lejos es más claro y lavado (la bruma del aire), cerca más cálido.
 *  - LO QUE HAY ENCIMA, A SU TAMAÑO: pasto, piedras, matas y, del lado de allá,
 *    cactus; cada fila de suelo con el tamaño y la velocidad de su distancia
 *    (`profundidadDelSuelo`). Lo de lejos pasa lento; lo de cerca, volando.
 *  - LA TIERRA: motas de tierra que, cerca de la cámara, se estiran con la
 *    velocidad. Del color del suelo, nunca negras.
 *
 * Sin azar: cada cosa sale de un número fijo por fila y por celda.
 */
function dibujarSuelo(r, { base, hy, scroll, vel, dia, tinte }) {
  const colors = CONFIG.colors;
  const C = colors.cielo;
  const ctx = r.ctx;
  const g = ctx.createLinearGradient(0, hy, 0, r.height);
  g.addColorStop(0, tinte(mezclar(colors.desiertoDia, C.bruma, 0.6)));
  g.addColorStop(0.3, tinte(mezclar(colors.desiertoDia, C.bruma, 0.15)));
  g.addColorStop(0.55, tinte(colors.desiertoDia));
  g.addColorStop(1, tinte(escalarColor(colors.desiertoDia, 0.8)));
  ctx.fillStyle = g;
  ctx.fillRect(0, hy, r.width, r.height - hy);

  const geo = { base, hy, alto: r.height };
  const P = CONFIG.parallax;
  const motaOscura = tinte(C.tierraOscura);
  const motaClara = tinte(mezclar(colors.desiertoDia, C.bruma, 0.7));
  let fila = 0;
  for (let y = hy + 1; y < r.height; fila++) {
    const k = profundidadDelSuelo(y, geo);
    const corre = scroll * P.suelo * vel * k;
    // Lejos (o debajo del tren, donde casi no se ve) va menos tierra: la bruma
    // y la distancia la borran.
    const celda = 9 * Math.max(0.5, k);
    const i0 = Math.floor(corre / celda) - 1;
    const i1 = Math.ceil((corre + r.width) / celda) + 1;
    const estira = k > 1.15 ? Math.min(14, (k - 1) * 9) : 0;
    for (let i = i0; i <= i1; i++) {
      const h = revolver(i, fila * 31 + 7);
      const x = i * celda + (h % 97) / 97 * celda - corre;
      const que = (h >>> 8) % 100;
      if (que < 22) {
        // Una mota de tierra; cerca de la cámara, estirada por la velocidad.
        ctx.globalAlpha = 0.35 + 0.35 * Math.min(1, k);
        r.rect(x, y, Math.max(1, k) + estira, Math.max(0.5, k * 0.6), (h >>> 16) & 1 ? motaOscura : motaClara);
        ctx.globalAlpha = 1;
      } else if (y > base + 4 && que < 27) {
        // 🌾 Entre la vía y la cámara: matas, yuyos y piedras de costado, con
        // el doble de puntos (van a la mitad) para que de cerca sigan finas.
        const tipos = ['matita', 'yuyos', 'yuyos', 'piedra'];
        const tipo = tipos[(h >>> 20) % tipos.length];
        const img = adornoDeCerca(tipo, h >>> 26, C, !dia);
        const e = 0.125 * Math.min(k, 2.3);
        const w = img.width * e, alto = img.height * e;
        if (estira) {
          // Lo que pasa volando se ve corrido: una copia apagada detrás.
          ctx.globalAlpha = 0.25;
          ctx.drawImage(img, x - w / 2 + estira * 0.6, y - alto, w, alto);
          ctx.globalAlpha = 1;
        }
        ctx.drawImage(img, x - w / 2, y - alto, w, alto);
      } else if (que < 25 + (y < base ? 0 : 1)) {
        // Una cosa del suelo, a su tamaño. Los cactus, sólo del lado de allá:
        // de este lado tapan a los jinetes de acá.
        // Cerca de la cámara, sólo pasto y piedritas: las matas agrandadas se
        // veían como ladrillos verdes.
        const tipos = y < base ? ['pasto', 'piedrita', 'mata', 'cactus', 'pasto'] : ['pasto', 'pasto', 'piedrita'];
        const tipo = tipos[(h >>> 20) % tipos.length];
        const img = adornoDelDesierto(tipo, C, !dia);
        // Agrandadas de más se pixelan: tope un poco arriba del tamaño natural.
        const e = 0.25 * Math.min(k, 1.15) * (tipo === 'cactus' ? 1.1 : 0.9);
        const w = img.width * e, alto = img.height * e;
        if (estira) {
          // Lo que pasa volando se ve corrido: dos copias apagadas detrás.
          ctx.globalAlpha = 0.25;
          ctx.drawImage(img, x - w / 2 + estira * 0.6, y - alto, w, alto);
          ctx.globalAlpha = 1;
        }
        ctx.drawImage(img, x - w / 2, y - alto, w, alto);
      }
    }
    y += Math.max(1.5, 2.2 * k);
  }
}

/**
 * 📡 LOS POSTES DEL TELÉGRAFO, del lado de allá de la vía, con sus cables:
 * pasan rapidísimo y asoman por encima del techo. Es de lo que más hace sentir
 * la velocidad en las películas de trenes del oeste. Van detrás del tren (el
 * tren los tapa de la mitad para abajo; en los huecos se ven enteros).
 */
function dibujarTelegrafo(r, { base, scroll, vel, dia }) {
  const C = CONFIG.techo.costado.telegrafo;
  const P = CONFIG.parallax;
  const k = C.profundidad;
  const sep = C.separacion * k;
  const corre = (scroll * P.suelo * vel * k) % sep;
  const pie = base - 4;
  const tope = base - C.alto;
  const madera = dia ? C.color : escalarColor(C.color, 0.45);
  const ctx = r.ctx;
  // Los cables: cuelgan entre poste y poste.
  ctx.save();
  ctx.strokeStyle = madera;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 0.5;
  for (let x = -corre - sep; x < r.width + sep; x += sep) {
    for (const dy of [2, 5]) {
      ctx.beginPath();
      ctx.moveTo(x, tope + dy);
      ctx.quadraticCurveTo(x + sep / 2, tope + dy + C.comba, x + sep, tope + dy);
      ctx.stroke();
    }
  }
  ctx.restore();
  for (let x = -corre - sep; x < r.width + sep; x += sep) {
    r.rect(x - 1, tope, 2, pie - tope, madera);
    r.rect(x - 5, tope + 1.5, 10, 1, madera);
    r.rect(x - 4, tope + 4.5, 8, 1, madera);
    // Los aisladores de vidrio, que agarran la luz.
    for (const dx of [-4, -1.5, 1.5, 4]) r.rect(x + dx - 0.5, tope + 0.5, 1, 1, dia ? '#9fc4c8' : '#3a5254');
  }
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
