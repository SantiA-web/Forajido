/**
 * La ley cabalgando a la par: movimiento y tiro.
 *
 * Cómo piensan, en una línea: cazan la ventanilla o baranda más cercana a vos
 * y se plantan ahí a esperar el tiro. Sí saben de tiles — conocen dónde están
 * TODAS las ventanas y barandas del tren (`ventanasDe`) — pero sólo eso: no
 * te persiguen adentro del vagón, no bajan del caballo y no saben nada de
 * paredes, asientos ni del resto del mapa.
 *
 * ESTO NO SIEMPRE FUE ASÍ. La primera versión los hacía orbitar tu posición
 * con un offset fijo — se movían PORQUE VOS TE MOVÍAS, nunca por sí mismos, y
 * Santi lo notó jugando ("parecen que caminan porque yo camino, no son una
 * amenaza real"). Perseguir ventanas de verdad es lo que los hace leerse como
 * que están cazando un lugar por donde verte, no reflejándote con retraso.
 *
 * LA REGLA QUE LOS HACE JUSTOS: solo disparan si te VEN, y "verte" usa la misma
 * cuenta que los guardias — si estás parapetado y no asomado, no te ven. O sea
 * que meterte debajo de la ventanilla te tapa de ellos, exactamente igual que
 * pegarte a un asiento te tapa de los de adentro. La diferencia es que las dos
 * coberturas no son la misma, y ahí está todo el juego de este sistema.
 */

import { CONFIG } from '../data/config.js';
import { RIDERS, RIDER_SPAWN, RIDER_SEPARACION_MINIMA } from '../data/riders.js';
import { createRider } from '../entities/rider.js';
import { distance, hasLineOfSight } from '../engine/collision.js';
import { isHidden, damagePlayer } from '../entities/player.js';
import { danioDeBala } from './golpe.js';
import { enLaCurva } from '../world/techoGeometria.js';

/**
 * 🎯 C3a · CUÁNTO TE PUEDE PEGAR UN JINETE DE ESTE LADO (`lado` -1 el de
 * allá, +1 el de acá) estando vos arriba del tren. Ver CONFIG.techo.tiroJinetes.
 */
export function chanceContraElTecho(p, lado, altoMapa) {
  const J = CONFIG.techo.tiroJinetes;
  if (!p.enTecho || p.caidaEnganche) return 0;
  if (p.techoColgado) return Math.sign(p.techoColgado.lado) === Math.sign(lado) ? J.colgado : 0;
  const curva = enLaCurva(p.y, altoMapa);
  if (curva.lado !== 0) {
    // El tren en el medio: los del otro lado no te pueden pegar.
    if (curva.lado !== Math.sign(lado)) return 0;
    return p.techoTendido ? J.curva * J.tendidoCurva : J.curva;
  }
  if (p.techoTendido) return J.tendidoMedio;
  if (p.techoAgachado) return J.agazapado;
  return J.parado;
}

/**
 * Arriba del tren o abajo, en píxeles, según de qué lado cabalgue.
 * El carril está afuera de la grilla: entre el borde del vagón y el borde de
 * la pantalla hay unos 28 px, y el jinete mide unos 23 de alto.
 */
export function carrilDe(map, side) {
  return side < 0 ? -14 : map.height + 14;
}

/**
 * Ancla de RESPALDO, sólo para cuando no hay ninguna ventana ni baranda cerca
 * (el vagón blindado no tiene ninguna de las dos). El primero un poco
 * adelante tuyo, el segundo un poco atrás, para que ni en ese caso se pisen.
 * En cualquier otra situación, `seguirAlJugador` apunta a una ventana de
 * verdad — ver `ventanasDe` más abajo — y esto no se usa.
 */
const ANCLAS = [75, -75];

/**
 * Los TRAMOS de 'W' (ventanilla) y 'H' (baranda) del mapa, separados en los
 * de arriba y los de abajo del tren — son las únicas franjas por donde un
 * jinete puede llegar a verte. Se calcula UNA vez por mapa (no cambia durante
 * el asalto) y se cachea: recorrer ~2700 tiles por jinete por cuadro sería
 * tirar plata.
 *
 * OJO: una ventanilla mide DOS tiles de ancho ('WW'), y una baranda puede
 * medir un vagón entero. Si se tratara cada tile como una "ventana" propia,
 * las dos columnas de una misma ventanilla contarían como dos ventanas
 * distintas — y ahí el segundo jinete de un lado terminaba a 14px del
 * primero, la misma superposición que se venía arreglando. Por eso se
 * agrupan los tiles contiguos en un TRAMO (`agruparEnTramos`) antes de elegir.
 */
const ventanasCache = new WeakMap();

function ventanasDe(map) {
  let porLado = ventanasCache.get(map);
  if (porLado) return porLado;

  const mitad = map.rows / 2;
  const colsArriba = new Set();
  const colsAbajo = new Set();
  for (const ch of ['W', 'H']) {
    for (const { col, row } of map.findTiles(ch)) {
      (row < mitad ? colsArriba : colsAbajo).add(col);
    }
  }
  porLado = { arriba: agruparEnTramos(colsArriba, map), abajo: agruparEnTramos(colsAbajo, map) };
  ventanasCache.set(map, porLado);
  return porLado;
}

/** Columnas contiguas → tramos [{min, max}] en píxeles, uno por ventana o
 *  baranda real (en vez de uno por tile). */
function agruparEnTramos(columnas, map) {
  const ordenadas = [...columnas].sort((a, b) => a - b);
  const tramos = [];
  for (const col of ordenadas) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && col === ultimo.colMax + 1) ultimo.colMax = col;
    else tramos.push({ colMin: col, colMax: col });
  }
  return tramos.map((t) => ({
    min: t.colMin * map.size,
    max: (t.colMax + 1) * map.size,
  }));
}

/** El punto de `t` más cercano a `x` (dentro del tramo si `x` cae afuera). */
function puntoEn(t, x) {
  return Math.min(Math.max(x, t.min), t.max);
}

/**
 * A qué tramo se compromete este jinete. NO alcanza con "cada uno calcula el
 * más cercano y el siguiente": los dos jinetes de un lado recalculan solos,
 * cuadro a cuadro, así que cerca del punto medio entre dos tramos "el más
 * cercano" y "el siguiente" se INTERCAMBIAN en el mismo instante — y ahí se
 * cruzan (medido: llegaron a 0,3px de distancia, la misma superposición que
 * se venía arreglando, sólo que por otra causa).
 *
 * Acá cada jinete directamente RECLAMA un tramo (`ocupados` son los que ya
 * están tomados por otro jinete VIVO de su mismo lado) y no lo suelta salvo
 * que uno libre sea claramente mejor (histéresis de 30px) — sin la
 * histéresis, justo en el punto medio volvería a titubear entre dos tramos
 * cuadro a cuadro.
 */
function elegirTramo(tramos, x, actual, ocupados) {
  if (tramos.length === 0) return null;

  const libres = tramos.filter((t) => !ocupados.includes(t));
  // Si no queda ninguno libre (más jinetes que tramos, no debería pasar con
  // el máximo de 2 por lado salvo un mapa rarísimo), comparten antes que
  // quedarse sin rumbo.
  const candidatos = libres.length > 0 ? libres : tramos;

  const dist = (t) => Math.abs(puntoEn(t, x) - x);
  const mejor = candidatos.reduce((a, b) => (dist(b) < dist(a) ? b : a));

  if (actual && candidatos.includes(actual) && dist(actual) <= dist(mejor) + 30) {
    return actual;
  }
  return mejor;
}

export function spawnRider(world, side, opts = {}) {
  const map = world.map;
  const delMismoLado = world.riders.filter((r) => r.alive && r.side === side).length;
  const slot = delMismoLado % ANCLAS.length;
  const slotDx = ANCLAS[slot];

  const rd = createRider(world.player.x + slotDx, carrilDe(map, side), side);
  rd.slot = slot;       // qué ventana le toca perseguir: la más cercana (0) o la siguiente (1)
  rd.slotDx = slotDx;   // respaldo si no hay ninguna ventana cerca

  // Llegan sabiendo más o menos dónde estás: para eso sonó la alarma. Sin esto
  // no tendrían a qué tirarle hasta verte, y el fuego de contención no
  // arrancaría nunca.
  rd.lastSeen = { x: world.player.x, y: world.player.y };
  rd.memoria = rd.tipo.suppressMemory;

  /**
   * EL EMBOSCADOR (ver RIDER_SPAWN.distanciaEmboscada): reclama YA un tramo
   * bien adelante y nace ahí mismo, no al lado tuyo — si apareciera junto a
   * vos y después galopara hacia adelante, verías la emboscada armarse y
   * dejaría de ser una. `seguirAlJugador` no le vuelve a tocar `rd.tramo`
   * mientras esto siga puesto.
   */
  rd.emboscador = !!opts.emboscador;
  if (rd.emboscador) {
    const tramos = side < 0 ? ventanasDe(map).arriba : ventanasDe(map).abajo;
    const ocupados = world.riders
      .filter((r) => r.alive && r.side === side)
      .map((r) => r.tramo)
      .filter(Boolean);
    const objetivo = world.player.x + RIDER_SPAWN.distanciaEmboscada;
    rd.tramo = elegirTramo(tramos, objetivo, null, ocupados);
    rd.x = rd.tramo ? puntoEn(rd.tramo, objetivo) : objetivo;
  }

  // 🐎 Arranca en la línea pegada (`equilibrarCarriles` abre a los que sobran)
  // y con el arma a destiempo: que no tiren todos a la vez.
  rd.carril = 0;
  rd.carrilT = 0;
  rd.cooldown = world.rng.range(0, rd.tipo.fireCooldown);

  world.riders.push(rd);
  world.bus.emit('riderArrived', { x: rd.x, y: rd.y, side });
  return rd;
}

/**
 * 🐎 C3c · CUÁNTO SE PEGA DESDE LA LÍNEA EN LA QUE ESTÁ (`carriles.punteriaAbierto`):
 * 1 pegado, 0,65 abierto, y en el medio mientras viaja. Vale para los dos
 * lados: lo que él te pega y lo que vos le pegás.
 */
export function punteriaPorCarril(rd) {
  const K = CONFIG.techo.carriles;
  return 1 - (1 - K.punteriaAbierto) * (rd.carrilT || 0);
}

/**
 * 🐎 C3c · SE ABRE (lo heriste o le apuntaste un segundo). Si estaba apuntando,
 * se le corta el tiro: se va. Y uno de los abiertos de su lado ENTRA A TIRAR:
 * el aviso arranca ya, todavía abierto, y dispara apenas llega a la pegada
 * (ver `apuntarYDisparar`).
 */
export function abrirJinete(rd, world) {
  if (!rd.alive || rd.carril === 1) return;
  const K = CONFIG.techo.carriles;
  rd.carril = 1;
  rd.huye = K.huye;
  rd.apuntadoT = 0;
  rd.aimTimer = 0;
  rd.entraATirar = false;
  let mejor = null;
  for (const r of world.riders) {
    if (r === rd || !r.alive || r.side !== rd.side || r.carril !== 1 || r.entraATirar || r.huye > 0) continue;
    if (!mejor || (r.carrilT || 0) > (mejor.carrilT || 0)) mejor = r;
  }
  if (!mejor) return;
  mejor.carril = 0;
  mejor.entraATirar = true;
  mejor.suprimiendo = false;
  mejor.aimTimer = 0.1;
  world.audio.play('cock');
}

/**
 * 🐎 C3c · MITAD Y MITAD POR LADO, y si son impares, uno más pegado *(Santi:
 * "si son 7 caballos, 4 irán cerrados y 3 irán abiertos")*. Corre siempre:
 * cuando llega uno nuevo o muere uno, se acomodan solos, sin tirar (entrar a
 * tirar es sólo cuando uno de los pegados se abre). Al que se abrió herido o
 * apuntado no se lo vuelve a pegar hasta que pasa `carriles.huye`.
 */
function equilibrarCarriles(riders) {
  for (const lado of [1, -1]) {
    const vivos = riders.filter((r) => r.alive && r.side === lado);
    const objetivo = Math.ceil(vivos.length / 2);
    const pegados = vivos.filter((r) => r.carril === 0);
    if (pegados.length > objetivo) {
      const r = pegados.find((x) => !x.entraATirar && !(x.aimTimer > 0));
      if (r) r.carril = 1;
    } else if (pegados.length < objetivo) {
      const r = vivos.find((x) => x.carril === 1 && !(x.huye > 0) && !(x.aimTimer > 0));
      if (r) r.carril = 0;
    }
  }
}

export function updateRiders(riders, dt, world) {
  // 🐎 Arriba, entre el aviso de un jinete y el del siguiente pasa un rato:
  // que no tiren todos juntos (`carriles.entreAvisos`).
  world.esperaAviso = Math.max(0, (world.esperaAviso || 0) - dt);
  for (const rd of riders) {
    if (!rd.alive) {
      // El caballo sigue de largo con el cuerpo encima y sale de escena.
      rd.muerto = (rd.muerto || 0) + dt;
      rd.x += 120 * dt;
      rd.hitFlash = Math.max(0, rd.hitFlash - dt);
      continue;
    }

    rd.gallop += dt;
    rd.hitFlash = Math.max(0, rd.hitFlash - dt);
    rd.cooldown = Math.max(0, rd.cooldown - dt);
    if (rd.settle > 0) rd.settle -= dt;

    // 🐎 Las dos líneas sólo existen con vos arriba; adentro, todos pegados.
    if (world.player.enTecho) {
      if (rd.huye > 0) rd.huye -= dt;
      const meta = rd.carril || 0;
      const paso = dt / CONFIG.techo.carriles.cambio;
      rd.carrilT = (rd.carrilT || 0) + Math.sign(meta - (rd.carrilT || 0)) * Math.min(paso, Math.abs(meta - (rd.carrilT || 0)));
    } else {
      rd.carril = 0; rd.carrilT = 0; rd.entraATirar = false; rd.huye = 0;
    }

    seguirAlJugador(rd, dt, world);
    apuntarYDisparar(rd, dt, world);
  }

  if (world.player.enTecho) equilibrarCarriles(riders);
  separarJinetes(riders);

  for (let i = riders.length - 1; i >= 0; i--) {
    if (!riders[i].alive && riders[i].muerto > 2.5) riders.splice(i, 1);
  }
}

/**
 * Empuje mínimo entre jinetes del mismo lado, igual de espíritu que
 * `separateEnemies` en systems/ai.js. Corre DESPUÉS de que cada uno se movió
 * hacia su ventana — apuntar a ventanas distintas no evita que se crucen de
 * paso, esto es lo que lo evita.
 */
function separarJinetes(riders) {
  for (let i = 0; i < riders.length; i++) {
    const a = riders[i];
    if (!a.alive) continue;

    for (let j = i + 1; j < riders.length; j++) {
      const b = riders[j];
      if (!b.alive || b.side !== a.side) continue;
      // 🐎 De distinta línea se pueden superponer: el de más lejos pasa por detrás.
      if ((a.carril || 0) !== (b.carril || 0)) continue;

      let d = b.x - a.x;
      const dist = Math.abs(d);
      if (dist >= RIDER_SEPARACION_MINIMA) continue;
      if (dist < 0.001) d = 1; // exactamente encima: los separamos igual

      const push = (RIDER_SEPARACION_MINIMA - dist) / 2;
      const dir = Math.sign(d);
      a.x -= dir * push;
      b.x += dir * push;
    }
  }
}

/**
 * A DÓNDE VAN: a la ventana (o baranda) más cercana a vos, no a "tu posición
 * más un número". Antes orbitaban tu `x` con un offset fijo, así que se
 * movían PORQUE VOS TE MOVÍAS — nunca decidían nada, sólo te reflejaban. Con
 * esto, se quedan clavados en la ventana que eligieron hasta que otra
 * distinta pase a ser la más cercana; recién ahí se reubican. Eso es lo que
 * los hace leerse como que están cazando un lugar por donde verte, no
 * siguiéndote como un espejo.
 *
 * Cada jinete RECLAMA un tramo y ningún otro de su mismo lado se lo puede
 * tomar mientras esté vivo (`elegirTramo`) — así no colisionan sobre la
 * misma ventana. Si no hay NINGUNA ventana ni baranda cerca (adentro del
 * blindado, que no tiene ninguna), vuelven al ancla vieja (`rd.slotDx`) para
 * no quedarse sin rumbo.
 *
 * NO SE MUEVE MIENTRAS APUNTA (`rd.aimTimer > 0`). `rd.aimDir` se calcula
 * UNA vez, al empezar a apuntar, con la posición de ese instante — si
 * después seguía hamacándose, para cuando el tiro salía (0,5s más tarde) ya
 * se había corrido de donde apuntó, y esa diferencia de posición metía un
 * error de ángulo que la dispersión ni siquiera necesitaba aportar. Un
 * tirador de verdad se queda quieto para el tiro; esto hace lo mismo.
 */
function seguirAlJugador(rd, dt, world) {
  if (rd.aimTimer > 0) return;

  const t = rd.tipo;
  const p = world.player;

  if (rd.emboscador) {
    /**
     * SE QUEDA CLAVADO EN EL TRAMO QUE RECLAMÓ AL NACER — no lo vuelve a
     * elegir cuadro a cuadro, que es lo que lo hace "esperar" en vez de
     * "perseguir". En cuanto lo alcanzás (`p.x` llegó a su tramo), deja de
     * ser una emboscada y pasa a perseguir como cualquier otro desde acá en
     * adelante.
     */
    if (rd.tramo && p.x >= rd.tramo.min) rd.emboscador = false;
  } else {
    const tramos = rd.side < 0 ? ventanasDe(world.map).arriba : ventanasDe(world.map).abajo;
    const ocupados = world.riders
      .filter((r) => r !== rd && r.alive && r.side === rd.side)
      .map((r) => r.tramo)
      .filter(Boolean);

    rd.tramo = elegirTramo(tramos, p.x, rd.tramo, ocupados);
  }

  // 🎯 Con vos arriba no buscan ventanillas: cabalgan a tu altura, uno un poco
  // adelante y otro un poco atrás.
  const centro = p.enTecho ? p.x + Math.sign(rd.slotDx) * CONFIG.techo.tiroJinetes.separacion
    : rd.tramo ? puntoEn(rd.tramo, p.x) : (p.x + rd.slotDx);

  // Un hamacado chico para que no se vean clavados como estacas, sin salirse
  // del ancho de la ventana que eligieron.
  const deseado = centro + Math.sin(rd.gallop * 0.6) * t.keepDistance;
  const dx = deseado - rd.x;

  const paso = Math.sign(dx) * Math.min(Math.abs(dx), t.speed * dt);
  rd.x += paso;

  // El carril vertical es fijo: cabalgan al lado de la vía, no se acercan.
  rd.y += (carrilDe(world.map, rd.side) - rd.y) * Math.min(1, 4 * dt);
}

/** ¿Hay una ventanilla libre entre este jinete y el jugador? */
function tieneTiro(rd, world) {
  const p = world.player;
  if (!p.alive) return false;

  // Demasiado lejos en horizontal: ni lo intenta.
  if (Math.abs(p.x - rd.x) > rd.tipo.range) return false;

  /**
   * 🧗 COLGADO DEL ALERO estás afuera, contra la pared de su lado: los
   * jinetes de ese costado te ven sin nada en el medio. Los del otro lado,
   * no: tienen el tren entero entre vos y ellos.
   */
  if (p.enTecho) return chanceContraElTecho(p, rd.side, world.map.height) > 0;

  /**
   * Parapetado no te ve. Es la misma regla que usan los guardias: si estás
   * pegado a la pared y no asomado, del otro lado no hay nada que ver.
   * Acá es lo que hace que meterse debajo de la ventanilla sirva.
   */
  if (isHidden(p)) return false;

  // Y tiene que haber una línea limpia: la ventanilla ('W') y la baranda ('H')
  // no frenan la vista; la pared, el asiento y la carga sí.
  return hasLineOfSight(rd.x, rd.y, p.x, p.y, world.map.blocksSightAt);
}

function apuntarYDisparar(rd, dt, world) {
  const t = rd.tipo;
  const p = world.player;

  if (rd.memoria > 0) rd.memoria -= dt;

  // Mientras te vean, van actualizando dónde estás. Ese punto es al que le van
  // a seguir tirando cuando te escondas.
  const aTiro = tieneTiro(rd, world);
  if (aTiro) {
    rd.lastSeen = { x: p.x, y: p.y };
    rd.memoria = t.suppressMemory;
  }

  /**
   * 🐎 ENTRA A TIRAR: el aviso ya está (desde que arrancó, todavía abierto) y
   * dispara apenas llega a la línea pegada.
   */
  if (rd.entraATirar) {
    if ((rd.carrilT || 0) <= 0.02) {
      rd.entraATirar = false;
      rd.aimTimer = 0;
      disparar(rd, world);
    } else {
      rd.aimTimer = Math.max(rd.aimTimer, 0.1);
    }
    return;
  }

  // Ya está apuntando: termina el gesto aunque te hayas escondido. Si te
  // metiste a tiempo, el tiro sale igual y pasa de largo. Esa es la ventana
  // que te da el aviso, y es lo que hace que valga la pena mirarlos.
  if (rd.aimTimer > 0) {
    rd.aimTimer -= dt;
    if (rd.aimTimer <= 0) disparar(rd, world);
    return;
  }

  if (rd.settle > 0 || rd.cooldown > 0) return;
  // 🐎 Cambiando de línea no empiezan a apuntar; y si otro acaba de avisar, esperan.
  if (p.enTecho && Math.abs((rd.carrilT || 0) - (rd.carril || 0)) > 0.02) return;
  if (p.enTecho && world.esperaAviso > 0) return;

  // --- Tiro apuntado: te ven ---
  if (aTiro) {
    rd.aimTimer = t.aimTime;
    if (p.enTecho) world.esperaAviso = CONFIG.techo.carriles.entreAvisos;
    rd.aimDir = Math.atan2(p.y - rd.y, p.x - rd.x);
    rd.suprimiendo = false;
    world.audio.play('cock');
    return;
  }

  // --- Fuego de contención: no te ven, pero le tiran al lugar igual ---
  // Arriba no: el tiro al techo va por probabilidad, y a ciegas no se tira.
  if (p.enTecho) return;
  if (!rd.lastSeen || rd.memoria <= 0) return;
  if (Math.abs(rd.lastSeen.x - rd.x) > t.range) return;

  // Le tiran a la zona, no al punto: se corren un poco cada vez, como quien
  // barre la ventanilla por la que te vio meterse.
  const destinoX = rd.lastSeen.x + world.rng.spread(t.suppressDrift);
  const destinoY = rd.lastSeen.y;

  // Si desde acá esa zona ni siquiera se ve (pared de por medio), no gastan bala.
  if (!hasLineOfSight(rd.x, rd.y, destinoX, destinoY, world.map.blocksSightAt)) return;

  rd.aimTimer = t.suppressAimTime;
  rd.aimDir = Math.atan2(destinoY - rd.y, destinoX - rd.x);
  rd.suprimiendo = true;
  world.audio.play('cock');
}

/**
 * La dispersión de un tiro APUNTADO (no de contención, que sigue con su
 * propio número fijo — no te están viendo, así que no hay "cercanía" que
 * premiarles). Escala con la distancia real al jugador, igual de espíritu
 * que `enemy.spreadNear`/`spreadFar`, y empeora si te movés: un blanco que
 * se mueve es más difícil, aunque la dispersión de base sea la misma.
 */
function dispersionEfectiva(rd, world) {
  const t = rd.tipo;
  const d = distance(rd.x, rd.y, world.player.x, world.player.y);
  const f = Math.min(1, Math.max(0, (d - t.spreadNearDistance) / (t.spreadFarDistance - t.spreadNearDistance)));
  const base = t.spreadNear + f * (t.spreadFar - t.spreadNear);
  return base + (world.player.moving ? t.movingPenalty : 0);
}

/**
 * 🎯 C3a · EL TIRO AL TECHO. Arriba no viaja una bala por la grilla de adentro
 * (ahí las paredes del vagón lo tapaban todo y el tiro salía casi al azar): se
 * sortea con la probabilidad del lugar donde estás CUANDO SALE el tiro. La
 * escena lo dibuja de costado con `tiroAlTecho`: el trazo, el fogonazo y dónde
 * pegó (en vos, en la chapa o de largo).
 */
function dispararAlTecho(rd, world) {
  const p = world.player;
  // A destiempo: cada uno con su ritmo, que no tiren todos juntos.
  rd.cooldown = rd.tipo.fireCooldown * world.rng.range(0.75, 1.4);
  // 🐎 Desde la línea abierta se pega menos (`punteriaPorCarril`).
  const chance = chanceContraElTecho(p, rd.side, world.map.height) * punteriaPorCarril(rd);
  let pego = false;
  if (chance > 0 && world.rng.chance(chance)) {
    const { puntos } = danioDeBala({ owner: 'enemy' }, p, 'jugador', world.rng);
    pego = damagePlayer(p, puntos, rd.x, rd.y);
  }
  world.audio.play('enemyShot');
  world.camera.shake(0.5, 0.08);
  world.bus.emit('tiroAlTecho', { tirador: rd, pego, tapado: chance === 0 });
  if (pego) {
    world.bus.emit('playerHit', { x: p.x, y: p.y });
    if (!p.alive) world.bus.emit('playerDown', {});
  }
}

function disparar(rd, world) {
  if (world.player.enTecho && !rd.suprimiendo) { dispararAlTecho(rd, world); return; }
  const t = rd.tipo;
  const dispersion = rd.suprimiendo ? t.suppressSpread : dispersionEfectiva(rd, world);
  rd.cooldown = rd.suprimiendo ? t.suppressCooldown : t.fireCooldown;

  // `spreadDeTiro`: a los jinetes también se les puede ir el pulso de vez en
  // cuando, parejo con todo el resto. Ver CONFIG.mira.fallaChance.
  const mira = CONFIG.mira;
  const angulo = rd.aimDir + world.rng.spreadDeTiro(dispersion, mira.fallaChance, mira.fallaMultiplicador);
  world.spawnBullet({
    x: rd.x,
    y: rd.y - rd.side * 4,
    angle: angulo,
    speed: t.bulletSpeed,
    damage: t.damage,
    range: 260,
    owner: 'enemy',
    fromRider: true,
    tirador: rd,
  });

  world.audio.play('enemyShot');
  world.camera.shake(0.5, 0.08);

  /**
   * LOS DE ADENTRO VEN ENTRAR LAS BALAS.
   *
   * Un guardia que ve pasar plomo por su vagón no sigue silbando: mira para
   * dónde está tirando el de afuera y va a ver qué hay ahí. Sin esto, el jinete
   * podía estar acribillando un vagón entero mientras sus propios compañeros
   * patrullaban tranquilos a tres metros, que es de las cosas que más rompen la
   * ilusión de que el tren está vivo.
   *
   * El ruido va al PUNTO AL QUE APUNTA, no al jinete: lo que mueve a los
   * guardias es ver dónde pegan las balas, no oír el disparo de afuera.
   *
   * `deJinete` existe para que esto NO cuente como que vos te delataste. El
   * jinete puede estar tirando a ciegas al lugar donde te vio hace diez
   * segundos; si eso fijara tu "última posición conocida", el tren entero
   * sabría dónde estás por un tiro que erró, y eso es adivinación.
   */
  const destino = rd.lastSeen || world.player;
  world.bus.emit('noise', {
    x: destino.x,
    y: destino.y,
    radius: world.train ? world.train.hearRadius : CONFIG.enemy.hearRadius,
    deJinete: true,
  });
}

export function damageRider(rd, amount) {
  if (!rd.alive) return false;
  rd.health -= amount;
  rd.hitFlash = CONFIG.feel.hitFlash;
  if (rd.health <= 0) {
    rd.health = 0;
    rd.alive = false;
    rd.muerto = 0;
    return true;
  }
  return false;
}

/**
 * El reloj de aparición. Solo corre con la alarma sonando: la ley reacciona al
 * quilombo, así que una partida en silencio no los ve nunca.
 *
 * `max` es el techo de jinetes para ESTE asalto, resuelto una sola vez por
 * quien crea el watch (raidScene, con `maxJinetesPara(gameState.bounty)`) a
 * partir de la recompensa que ya traías al subir al tren. Por defecto es el
 * piso de la tabla (2), para que llamarlo sin `max` siga dando el
 * comportamiento de siempre.
 */
export function createRiderWatch({ bus, audio, max = RIDER_SPAWN.maxPorRecompensa[0].max }) {
  let timer = 0;
  let salieron = 0;
  let corriendo = false;

  return {
    get salieron() { return salieron; },

    arrancar() {
      if (corriendo) return;
      corriendo = true;
      timer = RIDER_SPAWN.firstAfterAlarm;
    },

    update(dt, world) {
      if (!corriendo || salieron >= RIDER_SPAWN.maxAbsoluto) return;
      timer -= dt;
      if (timer > 0) return;

      /**
       * LA PRIMERA TANDA LLEGA DE A DOS, UNO POR LADO.
       *
       * Antes salían de a uno (25 s el primero, 15 más para el segundo), así
       * que la mitad del tiempo sólo tenías un lado cubierto y encima tardaba
       * el doble en sentirse la amenaza completa. Ahora, cuando les toca
       * salir, aparecen juntos — y recién los que sobran por encima del piso
       * de 2 (si la recompensa da para más) llegan de a uno, cada `interval`.
       */
      if (salieron === 0) {
        const cuantos = Math.min(2, max);
        for (let i = 0; i < cuantos; i++) {
          const side = i === 0 ? 1 : -1;
          spawnRider(world, side);
          salieron += 1;
          bus.emit('riderSpawned', { number: salieron, side });
        }
      } else {
        const side = salieron % 2 === 0 ? 1 : -1;
        // Más allá del piso que fija la recompensa (`max`): éste ya es de
        // la escalada, así que nace emboscador en vez de perseguidor (ver
        // RIDER_SPAWN.distanciaEmboscada).
        const emboscador = salieron >= max;
        spawnRider(world, side, { emboscador });
        salieron += 1;
        bus.emit('riderSpawned', { number: salieron, side, emboscador });
      }

      timer = intervaloDelProximoJinete(salieron, max);
      audio.play('whistle');
    },

    reset() { timer = 0; salieron = 0; corriendo = false; },
  };
}

/**
 * CADA VEZ MÁS SEGUIDO más allá de `max` (el piso que fija la recompensa) —
 * mismo mecanismo que `intervaloDelProximoRefuerzo` en systems/alert.js, acá
 * aplicado a los jinetes de afuera. `salieron` es cuántos ya salieron
 * (incluido el que acaba de salir).
 */
function intervaloDelProximoJinete(salieron, max) {
  if (salieron < max) return RIDER_SPAWN.interval;
  return Math.max(
    RIDER_SPAWN.intervalMin,
    RIDER_SPAWN.interval - RIDER_SPAWN.intervalDecay * (salieron - max + 1)
  );
}
