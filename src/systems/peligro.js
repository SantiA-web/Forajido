/**
 * 🧍 LOS GUARDIAS LEEN EL PELIGRO DE LOS FRENOS ROTOS: lo que se va a caer de arriba (la sombra que crece en el aviso),
 * la pila que se va a soltar por el pasillo y lo que ya viene rodando (world/caidas.js, entities/rodante.js).
 *
 * *(Santi eligió que esquiven "casi siempre, a veces no", que dejen de tirarte mientras se salvan, que se avisen a los
 * gritos y que sólo el sheriff, el cazarrecompensas, el pistolero y el dinamitero sean un poco mejores.)* Y dos cosas
 * suyas: **"si están de espaldas las chances de esquivar disminuyen muchísimo"**, y el grito es **"la única forma
 * posible de que un guardia que está de espaldas pueda ver que se aproxima un obstáculo"**.
 *
 * Para que parezcan personas en un tiroteo y no "pasa tal, se mueve a tal":
 *  - **Darse cuenta**: cada uno lo nota a su tiempo (`reaccion`), según para dónde mira: de frente casi siempre, de
 *    costado un poco menos y más tarde, de espaldas casi nunca. El que no se dio cuenta no se da cuenta más (salvo que
 *    otro le grite): lo agarra.
 *  - **Gritar**: el que lo ve grita ("¡CUIDADO ARRIBA!", "¡SE VIENE!") y los que están cerca lo oyen, miren para donde
 *    miren. 🔁 *(Santi: "si un guardia pega un grito, el guardia de espaldas no se aviva al exacto momento, porque no
 *    sabe de dónde viene… se da vuelta en el lugar dónde está y una vez que lo ve ahí recién reacciona")*: el que lo
 *    oye se queda donde está, se da vuelta a buscarlo y, cuando lo tiene de frente, recién ahí arranca.
 *    No grita el que está tirando *(Santi: "si justo se encuentra jalando del gatillo no puede")*, ni por lo liviano
 *    *(Santi: "los obstáculos livianos no provocan gritos")*.
 *  - **El que está en su ráfaga y de espaldas no se salva** *(Santi: "no hay forma de que se salve, ni con un grito,
 *    porque está distraído")*.
 *  - **Salirse**: el paso más corto que lo saca de abajo (o del carril), a donde se pueda pisar, rápido y sin apuntar.
 *    Ya afuera se queda un ratito mirando (`respiro`) antes de volver a tirarte: ese es tu respiro.
 *
 * Es lo mismo para todos los que pelean (guardias, el sheriff y su escolta, el cazarrecompensas): va antes que la IA
 * de cada uno (ver `updateEnemies` en scenes/raidScene.js) y, mientras se está salvando, la reemplaza.
 */
import { CONFIG } from '../data/config.js';
import { moveToward, turnTowards } from './ai.js';
import { zonasDePeligro } from '../world/caidas.js';

/** Los cuatro que reaccionan mejor *(Santi)*. */
const MEJORES = new Set(['sheriff', 'cazarrecompensas', 'pistolero', 'dinamitero']);
function esMejor(e) {
  return e.esSheriff || MEJORES.has(e.type) || (e.esJefe && e.tipo && MEJORES.has(e.tipo.id));
}

/** Los peligros de ahora, cada uno con de dónde viene (para saber si lo ve) y una clave (para leerlo una sola vez). */
// (Una vez por cuadro para todos: `C.reloj` avanza en cada cuadro, ver `actualizarCaidas`.)
let guardado = { C: null, reloj: -1, rodantes: null, lista: null };
function peligros(world) {
  const C = world.caidas, ros = world.rodantes;
  if (C && guardado.C === C && guardado.reloj === C.reloj && guardado.rodantes === ros) return guardado.lista;
  const lista = armarPeligros(world);
  if (C) guardado = { C, reloj: C.reloj, rodantes: ros, lista };
  return lista;
}
function armarPeligros(world) {
  const K = CONFIG.peligro, out = [];
  const C = world.caidas;
  if (C) for (const z of zonasDePeligro(C, world.map.size)) out.push({ ...z, tipo: z.pasillo ? 'pasillo' : 'arriba' });
  for (const ro of world.rodantes || []) {
    // (El cajón de pólvora tiene su propia lectura: ver `reaccionarAlCajon` en systems/ai.js.)
    if (!ro.alive || ro.tipo === 'polvora' || !(ro.velocidad > K.rodanteLento)) continue;
    const largo = Math.min(K.lecturaRodante, ro.velocidad * K.rodanteSegundos);
    out.push({
      clave: ro, tipo: 'rueda', desde: { x: ro.x, y: ro.y },
      x0: ro.dir > 0 ? ro.x - ro.hw : ro.x - largo, x1: ro.dir > 0 ? ro.x + largo : ro.x + ro.hw,
      y0: ro.y - ro.hh - 2, y1: ro.y + ro.hh + 2,
    });
  }
  return out;
}

/** ¿El guardia está adentro (con su cuerpo) de la zona? */
function adentro(e, z, margen = 0) {
  return e.x + e.hw > z.x0 - margen && e.x - e.hw < z.x1 + margen && e.y + e.hh > z.y0 - margen && e.y - e.hh < z.y1 + margen;
}

/** De frente, de costado o de espaldas a lo que viene: 0, 1 o 2. */
function comoLoMira(e, z) {
  const d = z.desde || { x: (z.x0 + z.x1) / 2, y: (z.y0 + z.y1) / 2 };
  let a = Math.atan2(d.y - e.y, d.x - e.x) - (e.facing || 0);
  a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  return a < Math.PI / 3 ? 0 : a < (Math.PI * 2) / 3 ? 1 : 2;
}

/** Está tirando: apuntando para el tiro o en el medio de su ráfaga. */
function disparando(e) {
  return e.aimTimer > 0 || e.burstLeft > 0;
}

/**
 * Lo nota o no, y cuándo. `oido`: se lo gritaron (no importa para dónde mira). Lo que cae junto (las bolsas de una
 * torre, las cajas de un estante) se lee junto (`grupo`): o ve todo o no ve nada; si no, cada bolsa era otra chance de
 * no verla y a la quinta lo agarraba.
 */
function notar(e, z, world, oido, lista) {
  const K = CONFIG.peligro, rng = world.rng, bueno = esMejor(e);
  // (🔁 El que levantó la vista con el chirrido no lo lee como el que lo vio venir de frente *(Santi: "me parece
  // muchísimo que se salven un 84%… quiero ese número cerca de 60%")*: miró, pero entre el sacudón y el ruido no
  // siempre se da cuenta de qué se viene: `falla.mirando`.)
  const mira = comoLoMira(e, z), miro = e.miroArriba && !oido;
  e.miroArriba = false;
  const vista = oido ? 'oido' : miro && mira === 0 ? 'mirando' : ['frente', 'costado', 'espaldas'][mira];
  const junto = lista.filter((q) => q.tipo === z.tipo && cerca(q, z, K.grupo));
  for (const q of junto) e.lecturas.set(q.clave, true);
  // (En su ráfaga y de espaldas: ni lo ve ni oye el grito.)
  if (mira === 2 && disparando(e)) return;
  if (rng.chance(K.falla[vista] * (bueno ? K.mejorFalla : 1))) return;
  for (const q of junto) e.lecturas.set(q.clave, 'vio');
  const [a, b] = K.reaccion[oido ? 'trasGirar' : vista === 'mirando' ? 'frente' : vista];
  e.peligro = {
    z, claves: new Set(junto.map((q) => q.clave)), t: rng.range(a, b) * (bueno ? K.mejorReaccion : 1), oido, girar: oido,
    // (Lo liviano no se grita: sólo lo que te tira al piso o te mata.)
    liviano: junto.every((q) => q.peso === 'liviano'),
  };
}
function cerca(a, b, d) {
  return a.x0 < b.x1 + d && a.x1 > b.x0 - d && a.y0 < b.y1 + d && a.y1 > b.y0 - d;
}

/**
 * El paso más corto que lo saca de abajo de todo lo que vio, a un lugar que se pueda pisar: prueba alrededor, de
 * cerca a lejos. (Lo que rueda: salirse del carril, para arriba o para abajo; no correr delante de él.)
 */
function salida(e, zonas, map) {
  const m = CONFIG.peligro.margen, rueda = zonas.some((z) => z.tipo === 'rueda');
  const libre = (x, y) => !map.isSolidAt(x - e.hw, y) && !map.isSolidAt(x + e.hw, y) && !map.isSolidAt(x, y - e.hh) && !map.isSolidAt(x, y + e.hh);
  for (let d = 6; d <= 90; d += 4) {
    let mejor = null;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, dx = Math.cos(a) * d, dy = Math.sin(a) * d;
      if (rueda && Math.abs(dy) < Math.abs(dx) * 1.5) continue;
      const x = e.x + dx, y = e.y + dy, p = { x, y, hw: e.hw + m, hh: e.hh + m };
      if (zonas.some((z) => adentro(p, z)) || !libre(x, y)) continue;
      // (En la misma distancia, el que menos se acerca a lo que cae.)
      const lejos = Math.min(...zonas.map((z) => Math.hypot(x - (z.x0 + z.x1) / 2, y - (z.y0 + z.y1) / 2)));
      if (!mejor || lejos > mejor.lejos) mejor = { x, y, lejos };
    }
    if (mejor) return mejor;
  }
  return null;
}

/**
 * 🆕 EL CHIRRIDO: el que no está peleando levanta la vista *(Santi: "agregá esa idea tuya")*. Cada uno a su tiempo, un
 * ratito, se queda quieto y mira para lo que tenga más cerca que se puede venir (la repisa que se sacude, la pila de
 * la puerta); si no hay nada, mira y sigue. Mirando para ahí, lo ve como cualquiera que lo tiene de frente.
 */
export function mirarAlChirrido(enemigos, rng) {
  const K = CONFIG.peligro;
  for (const e of enemigos) {
    if (!e.alive || e.state === 'combat' || disparando(e) || e.tirado > 0 || e.inconsciente > 0 || e.rendido || e.dormido) continue;
    e.mirando = { demora: rng.range(K.mirarDemora[0], K.mirarDemora[1]), t: rng.range(K.mirarDura[0], K.mirarDura[1]) };
  }
}
function mirarArriba(e, dt, lista) {
  const M = e.mirando;
  if (M.demora > 0) { M.demora -= dt; return false; }
  M.t -= dt;
  if (M.t <= 0) { e.mirando = null; return false; }
  let mejor = null, dmin = CONFIG.peligro.mirarHasta;
  for (const z of lista) {
    const d = z.desde || { x: (z.x0 + z.x1) / 2, y: (z.y0 + z.y1) / 2 }, dist = Math.hypot(d.x - e.x, d.y - e.y);
    if (dist < dmin) { dmin = dist; mejor = d; }
  }
  if (mejor) {
    const a = Math.atan2(mejor.y - e.y, mejor.x - e.x);
    turnTowards(e, a, dt, 5);
    // (Ya lo tiene de frente: ahora sí lo lee, de frente.)
    let dif = a - (e.facing || 0);
    dif = Math.abs(Math.atan2(Math.sin(dif), Math.cos(dif)));
    if (dif < CONFIG.peligro.loTieneDeFrente) { e.mirando = null; e.miroArriba = true; }
  }
  return true;
}

/**
 * Cada cuadro, antes de la IA de cada uno. Devuelve true si este cuadro lo pasa salvándose (la IA no corre).
 */
export function esquivarPeligro(e, dt, world) {
  if (!e.alive || e.tirado > 0 || e.inconsciente > 0 || e.rendido || e.stagger > 0 || e.dormido) { e.peligro = null; return false; }
  const K = CONFIG.peligro;
  if (!e.lecturas) e.lecturas = new Map();
  if (e.respiro > 0) {
    // Ya afuera: un ratito sin tirarte, mirando lo que cae.
    e.respiro -= dt;
    e.aimTimer = 0; e.burstLeft = 0;
    e.cooldown = Math.max(e.cooldown || 0, 0.1);
  }

  const lista = peligros(world);
  // Lo que se terminó (cayó, se paró) se olvida.
  for (const k of e.lecturas.keys()) if (!lista.some((z) => z.clave === k)) e.lecturas.delete(k);
  // 🐛 Lo que ya vio y sigue por caer: si vuelve a meterse abajo (la IA lo lleva a su cobertura), se sale de nuevo,
  // sin pensarlo ni gritar. Antes, pasado el respiro, volvía caminando y lo agarraba igual.
  if (!e.peligro && e.lecturas.size) {
    const vistas = lista.filter((z) => e.lecturas.get(z.clave) === 'vio');
    const z = vistas.find((q) => adentro(e, q, K.margen));
    if (z) e.peligro = { z, claves: new Set(vistas.map((q) => q.clave)), t: 0, grito: true };
  }
  if (e.peligro && !lista.some((z) => e.peligro.claves.has(z.clave))) e.peligro = null;

  // Lo nuevo que lo amenaza: lo ve o no lo ve, una vez. (El que está levantando la vista, cuando termina de mirar.)
  if (!e.peligro && !e.mirando) for (const z of lista) {
    if (e.lecturas.has(z.clave) || !adentro(e, z, K.margen)) continue;
    notar(e, z, world, false, lista);
    if (e.peligro) break;
  }
  if (!e.peligro) return e.mirando ? mirarArriba(e, dt, lista) : false;
  e.mirando = null;

  const P = e.peligro;
  // Actualizado (lo que rueda se mueve).
  P.z = lista.find((z) => z.clave === P.z.clave) || P.z;
  const zonas = lista.filter((z) => P.claves.has(z.clave));
  const d = P.z.desde || { x: (P.z.x0 + P.z.x1) / 2, y: (P.z.y0 + P.z.y1) / 2 };
  const hacia = Math.atan2(d.y - e.y, d.x - e.x);
  if (P.girar) {
    // Se lo gritaron: quieto, se da vuelta a buscarlo; recién cuando lo tiene de frente empieza a reaccionar.
    e.aimTimer = 0; e.burstLeft = 0; e.peeking = false;
    e.cooldown = Math.max(e.cooldown || 0, 0.1);
    turnTowards(e, hacia, dt, K.giro);
    let dif = hacia - (e.facing || 0);
    dif = Math.abs(Math.atan2(Math.sin(dif), Math.cos(dif)));
    if (dif < K.loTieneDeFrente) P.girar = false;
    return true;
  }
  if (P.t > 0) { P.t -= dt; return !!P.oido; }

  // Se dio cuenta: grita una vez (si no se lo gritaron a él, si no está tirando y si no es algo liviano) y avisa a los
  // de cerca.
  if (!P.grito) {
    P.grito = true;
    if (!P.oido && !P.liviano && !disparando(e)) {
      world.bus.emit('guardiaGrita', { guardia: e, texto: P.z.tipo === 'arriba' ? 'cuidadoArriba' : 'seViene' });
      for (const o of world.enemies || []) {
        if (o === e || !o.alive || o.peligro || Math.hypot(o.x - e.x, o.y - e.y) > K.oyeGrito) continue;
        if (!o.lecturas) o.lecturas = new Map();
        // (Al que ya no lo vio, el grito le da otra oportunidad.)
        if (adentro(o, P.z, K.margen)) notar(o, P.z, world, true, lista);
      }
    }
  }

  if (!zonas.some((z) => adentro(e, z, 1))) {
    // Salvado.
    e.peligro = null;
    e.respiro = world.rng.range(K.respiro[0], K.respiro[1]);
    e.coverPoint = null; e.atCover = false;
    return false;
  }
  // Salirse: suelta lo que estaba haciendo y va.
  e.aimTimer = 0; e.burstLeft = 0; e.peeking = false;
  e.cooldown = Math.max(e.cooldown || 0, 0.1);
  if (!P.a) P.a = salida(e, zonas, world.map);
  if (!P.a) return false;
  const vel = ((e.ai && e.ai.speed) || CONFIG.enemy.speed) * K.apuro;
  const movido = moveToward(e, P.a.x, P.a.y, vel, dt, world.map);
  // Trabado contra algo: prueba otra salida.
  if (movido < 0.05) P.a = null;
  turnTowards(e, hacia, dt, 6);
  return true;
}
