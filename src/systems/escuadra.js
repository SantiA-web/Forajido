/**
 * 🤝 LA ESCUADRA — guardias, etapa 2.
 *
 * *(Santi: "los guardias actúan dependiendo de cuántos son, qué armas tienen,
 * qué están haciendo sus compañeros, y dónde y qué está haciendo el
 * jugador")*
 *
 * Los guardias que PELEAN EN UN MISMO VAGÓN son una escuadra. Este módulo no
 * mueve a nadie ni dispara: decide QUIÉN hace QUÉ y le deja la orden puesta al
 * guardia. Lo demás lo hace el combate de siempre (systems/ai.js):
 *
 *   `e.cubriendo`  segundos que le quedan cubriendo: se asoma seguido y tira
 *                  a donde te vio por última vez, aunque ahora no te vea
 *                  (ver `holdCoverAndFire`).
 *   `e.coverPoint` al que avanza se le pone la cobertura nueva y corre hacia
 *                  ella, igual que a cualquier guardia que se reubica.
 *
 * LOS ROLES SALEN DEL ARMA *(Santi: "uno con Winchester no debería ser
 * cubierto, sino que él cubriría")*:
 *
 *   Winchester  cubre. Nunca avanza.
 *   escopeta    avanza primero: es la que necesita estar cerca.
 *   revólver    lo que falte.
 *
 * Y TRES COSAS DEL JUGADOR CAMBIAN LO QUE HACEN:
 *
 *   agachado, o fuera de la vista del que avanza  → avanzan, de a uno.
 *   afuera tirando                                → no avanza nadie: todos
 *                                                   te tiran (el combate de
 *                                                   siempre).
 *   empezó a recargar (y lo vieron u oyeron)      → el que puede, sale ya.
 *
 * ⚠️ DOS REGLAS QUE NO SE PUEDEN ROMPER *(Santi)*:
 *
 *  1. "No pueden estar todos los guardias recargando al mismo tiempo". Con dos
 *     o más en el vagón, siempre queda uno con balas: el que tiene una sola no
 *     la tira mientras otro recarga, y nadie empieza a cargar si otro ya está
 *     cargando (ver `companeroRecargando`, usado en systems/ai.js). Igual se
 *     MIDE (`world.escuadra.todosRecargando`): si alguna vez pasa, es un error.
 *  2. "Un guardia podría saber cuándo empezás a recargar, pero no cuándo
 *     terminaste". Nada de este archivo lee tu recarga: se enteran por un
 *     aviso cuando EMPEZÁS (`jugadorEmpiezaRecarga`), y el que sale a avanzar
 *     llega hasta su cobertura aunque ya tengas el arma llena.
 */

import { CONFIG } from '../data/config.js';
import { ARMAS_GUARDIA } from '../data/armasGuardia.js';
import { distance, hasLineOfSight } from '../engine/collision.js';
import { findCoverPoint } from './cover.js';
import { isHidden } from '../entities/player.js';

/** El estado de las escuadras de un asalto. Va en `world.escuadra`. */
export function crearEscuadra() {
  return {
    porVagon: new Map(),
    // Lo que se mide (ver la regla 1, arriba).
    todosRecargando: 0,     // segundos
    casosTodosRecargando: 0,
    avances: 0,
    avancesPorRecarga: 0,
    coberturasDeRecarga: 0,
    // Por qué no arrancó un avance (para afinar): cuántas veces, por motivo.
    noAvanza: {},
  };
}

function arma(e) {
  return ARMAS_GUARDIA[e.armaEnMano || e.armaId] || ARMAS_GUARDIA.revolver;
}

function balas(e) {
  const a = arma(e);
  return e.municion ? (e.municion[a.id] ?? a.cargador) : a.cargador;
}

/** ¿Pelea con la escuadra? El herido que se va, el rendido o el tirado, no. */
function activo(e) {
  return e.alive && e.state === 'combat' && !e.esJefe && !e.retirandose &&
    !e.rendido && !(e.inconsciente > 0) && !(e.caido > 0) && !e.confinado;
}

function vagonDe(e, world) {
  return world.train ? world.train.wagonAt(e.x) : 0;
}

/**
 * ¿OTRO DE SU VAGÓN ESTÁ RECARGANDO? Es lo que hace cumplir la regla 1: lo
 * pregunta systems/ai.js antes de empezar a cargar y antes de tirar la última
 * bala.
 */
export function companeroRecargando(e, world) {
  if (!world.train) return false;
  const w = vagonDe(e, world);
  for (const o of world.enemies) {
    // Cuenta CUALQUIERA vivo de su vagón, no sólo los que pelean: el herido que
    // se retira o el que está tirado en el piso también tienen el arma vacía.
    // 🐛 Contando sólo a los que pelean, en 40 asaltos pasó 3 veces que
    // recargaban todos (uno de ellos, herido yéndose).
    if (o === e || !o.alive || !(o.recargando > 0) || o.esJefe || o.rendido || o.inconsciente > 0) continue;
    if (vagonDe(o, world) === w) return true;
  }
  return false;
}

/**
 * EMPEZASTE A RECARGAR. Se enteran los que te estaban viendo y los que están
 * lo bastante cerca para oír el tambor. Les queda la marca un momento
 * (`vioRecargar`) y la escuadra decide con eso; después NO SE VUELVE A
 * PREGUNTAR: el que salió, sale.
 */
export function jugadorEmpiezaRecarga(world) {
  const p = world.player;
  for (const e of world.enemies) {
    if (!activo(e)) continue;
    const teVe = e.lostTimer < 0.2;
    const teOye = distance(e.x, e.y, p.x, p.y) < CONFIG.escuadra.oyeRecargaRadio;
    if (teVe || teOye) e.vioRecargar = 1;
  }
}

// ------------------------------------------------------------------ roles

/** Cuanto más chico, más le toca avanzar. El Winchester no avanza nunca. */
function prioridadAvance(e) {
  const a = arma(e);
  if (a.id === 'winchester') return null;
  return a.perdigones ? 0 : 1;
}

/** Cuanto más chico, más le toca cubrir. */
function prioridadCubrir(e) {
  const a = arma(e);
  return a.id === 'winchester' ? 0 : a.perdigones ? 2 : 1;
}

function puedeAvanzar(e, world, blanco) {
  if (prioridadAvance(e) == null) return false;
  // Los que tienen una orden de quedarse (la escolta del Sheriff, el que cubre
  // a un herido, el que espera compañero) y el que no se cubre (el Pistolero:
  // ya está en el medio del pasillo) no entran en esto.
  if (e.defensivo || e.cubriendoTimer > 0 || e.esperandoCompanero || e.esSheriff) return false;
  if (e.evitaCobertura || e.yaSeReplego || e.desenfundando > 0 || e.vaHaciaPuerta) return false;
  if (e.recargando > 0 || balas(e) <= 0 || e.rodeoPunto) return false;
  return distance(e.x, e.y, blanco.x, blanco.y) > arma(e).paradaAvance + CONFIG.escuadra.ganaMin;
}

function puedeCubrir(e) {
  return !(e.recargando > 0) && balas(e) > 0 && !!e.lastSeen && !(e.desenfundando > 0) && !e.rodeoPunto;
}

function elegirQuienCubre(miembros, menos) {
  let mejor = null;
  for (const o of miembros) {
    if (o === menos || !puedeCubrir(o)) continue;
    if (!mejor || prioridadCubrir(o) < prioridadCubrir(mejor) ||
        (prioridadCubrir(o) === prioridadCubrir(mejor) && balas(o) > balas(mejor))) mejor = o;
  }
  return mejor;
}

function gritar(e, world, texto) {
  world.bus.emit('guardiaGrita', { guardia: e, texto });
}

/** Le da la orden de cubrir por `seg` segundos. Grita sólo si no estaba cubriendo ya. */
function ponerACubrir(e, world, seg) {
  if (!(e.cubriendo > 0)) gritar(e, world, 'teCubro');
  e.cubriendo = Math.max(e.cubriendo || 0, seg);
}

/**
 * ¿A DÓNDE SE PUEDE ADELANTAR? Una cobertura de verdad (la busca el mismo
 * buscador de siempre, a la distancia que le gusta a su arma), que quede a
 * un tramo de donde está y que lo ACERQUE. Si no hay ninguna, no avanza: no se
 * larga a correr al descubierto.
 */
function coberturaMasCerca(e, world, blanco, lado = 0) {
  const c = CONFIG.escuadra;
  const taken = [];
  for (const o of world.enemies) if (o !== e && o.alive && o.coverPoint) taken.push(o.coverPoint);
  const a = arma(e);
  // `lado`: -1 arriba de donde estás, +1 abajo. Si por ese lado no hay nada,
  // cualquiera: mejor avanzar por el mismo costado que no avanzar.
  const porElLado = lado ? (pt) => Math.sign(pt.y - blanco.y) === lado : null;
  const spot = (porElLado && findCoverPoint(world.map, e.x, e.y, blanco.x, blanco.y, taken, a.distanciaIdeal, a.vistaCombate, porElLado)) ||
    findCoverPoint(world.map, e.x, e.y, blanco.x, blanco.y, taken, a.distanciaIdeal, a.vistaCombate);
  if (!spot) return null;
  if (distance(spot.x, spot.y, e.x, e.y) > c.tramoMax) return null;
  const antes = distance(e.x, e.y, blanco.x, blanco.y);
  if (distance(spot.x, spot.y, blanco.x, blanco.y) > antes - c.ganaMin) return null;
  return spot;
}

/** A dónde creen que estás: lo último que vio el que te vio más recién. */
function blancoDe(miembros) {
  let mejor = null;
  for (const o of miembros) {
    if (o.lastSeen && (!mejor || o.lostTimer < mejor.lostTimer)) mejor = o;
  }
  return mejor ? mejor.lastSeen : null;
}

// --------------------------------------------------------------- el ciclo

/** Una vez por cuadro, antes de mover a los guardias. */
export function actualizarEscuadras(world, dt) {
  const E = world.escuadra;
  if (!E || !world.train) return;
  const c = CONFIG.escuadra;
  const p = world.player;

  const grupos = new Map();
  for (const e of world.enemies) {
    if (e.cubriendo > 0) e.cubriendo -= dt;
    if (e.vioRecargar > 0) e.vioRecargar -= dt;
    e.sigueAhi = false;
    if (!activo(e)) continue;
    const w = vagonDe(e, world);
    if (!grupos.has(w)) grupos.set(w, []);
    grupos.get(w).push(e);
  }

  const vagonJugador = world.train.wagonAt(p.x);

  for (const [w, miembros] of grupos) {
    let st = E.porVagon.get(w);
    if (!st) { st = { fase: 'quieto', pausa: 1, timer: 0 }; E.porVagon.set(w, st); }

    // ---- EL QUE RECARGA, CUBIERTO ----
    for (const r of miembros) {
      if (!(r.recargando > 0)) { r.cubiertoAlRecargar = false; continue; }
      if (r.cubiertoAlRecargar) continue;
      r.cubiertoAlRecargar = true;
      const quien = elegirQuienCubre(miembros, r);
      if (quien) { ponerACubrir(quien, world, r.recargando); E.coberturasDeRecarga++; }
    }

    // ---- REGLA 1: NUNCA TODOS RECARGANDO ----
    const todos = miembros.length >= 2 && miembros.every((o) => o.recargando > 0);
    if (todos) {
      E.todosRecargando += dt;
      if (!st.todos) {
        E.casosTodosRecargando++;
        console.warn('[escuadra] todos recargando a la vez en el vagón', w);
      }
    }
    st.todos = todos;

    /**
     * ---- SE PASAN TU POSICIÓN ----
     *
     * 🐛 *(Santi: "me escondo, pasa 1,5, '¡TE RODEO!', sale a buscar, yo no me
     * muevo de la cobertura, se olvidan de mí. Es patético")*. Medido: el que
     * rodeaba te encontraba en 0,6 s y te tiraba, pero los otros dos nunca te
     * habían visto y a los 9 s se olvidaban de vos, con su compañero a los
     * tiros al lado. Ahora, si uno del vagón te ve, todos saben dónde estás.
     *
     * Y `sigueAhi`: si no te moviste de donde te vieron (`sigueAhiRadio`), no
     * se olvidan — saben que estás detrás de ESE cajón. Si te escabullís en
     * silencio, el olvido corre como siempre.
     */
    // También avisa el herido que se retira o el que está tirado: no pelean,
    // pero ven y gritan.
    let fresco = null;
    for (const o of world.enemies) {
      if (!o.alive || o.state !== 'combat' || o.esJefe || vagonDe(o, world) !== w) continue;
      if (o.lastSeen && (!fresco || o.lostTimer < fresco.lostTimer)) fresco = o;
    }
    const sigueAhi = !!fresco && w === vagonJugador && p.alive &&
      distance(p.x, p.y, fresco.lastSeen.x, fresco.lastSeen.y) < c.sigueAhiRadio;
    for (const o of miembros) {
      if (fresco && o !== fresco && o.lostTimer > fresco.lostTimer) o.lastSeen = { ...fresco.lastSeen };
      o.escuadraVioHace = fresco ? fresco.lostTimer : Infinity;
      o.sigueAhi = sigueAhi;
    }

    // ---- EL AVANCE: sólo en el vagón donde estás ----
    if (w !== vagonJugador || !p.alive) { terminarAvance(st); continue; }
    st.pausa -= dt;
    const blanco = blancoDe(miembros);
    if (!blanco) continue;

    actualizarRodeo(st, miembros, world, blanco, E, dt);
    // Mientras uno rodea no arranca un avance: uno por vez.
    if (st.fase === 'quieto' && !st.rodea) empezarAvance(st, miembros, world, blanco, E);
    else if (st.fase === 'cubriendo') {
      if (!st.avanza || !activo(st.avanza) || st.avanza.recargando > 0) { terminarAvance(st); continue; }
      st.timer -= dt;
      if (st.timer <= 0) {
        const a = st.avanza;
        a.coverPoint = st.spot;
        a.atCover = false;
        a.peeking = false;
        a.burstLeft = 0;
        a.aimTimer = 0;
        a.repositionTimer = 0;
        a.avanzando = true;
        gritar(a, world, 'avanzo');
        st.fase = 'avanzando';
        st.timer = c.avanceMax;
      }
    } else if (st.fase === 'avanzando') {
      st.timer -= dt;
      const a = st.avanza;
      // Si el que cubría se quedó sin balas o cayó, otro toma su lugar.
      if (!st.cubre || !activo(st.cubre) || !puedeCubrir(st.cubre)) {
        st.cubre = elegirQuienCubre(miembros, a);
        if (st.cubre) ponerACubrir(st.cubre, world, Math.max(0.5, st.timer));
      }
      if (!a || !activo(a) || a.atCover || a.coverPoint !== st.spot || st.timer <= 0) terminarAvance(st);
    }
  }

  // Las escuadras de los vagones que quedaron vacíos se olvidan.
  for (const [w, st] of E.porVagon) {
    if (!grupos.has(w)) { terminarAvance(st); E.porVagon.delete(w); }
  }
}

function empezarAvance(st, miembros, world, blanco, E) {
  const c = CONFIG.escuadra;
  const p = world.player;
  const porRecarga = miembros.some((o) => o.vioRecargar > 0);
  if (!porRecarga && st.pausa > 0) return;

  /**
   * ¿Quién avanza? La escopeta primero; entre iguales, el que está más lejos
   * de donde le gusta pelear.
   *
   * 🔁 PERO NO EL MISMO DOS VECES SEGUIDAS si hay otro que pueda *(Santi: "a
   * veces el de revólver se queda sin saber qué hacer y estorba")*: con un
   * Winchester cubriendo y una escopeta avanzando, al revólver no le quedaba
   * papel. Ahora, cuando la escopeta llega, avanza él — y por el OTRO
   * costado (ver `coberturaMasCerca`): se ve el salto de a dos.
   */
  const candidatos = miembros.filter((o) => puedeAvanzar(o, world, blanco));
  const otros = candidatos.filter((o) => o !== st.ultimoAvanzo);
  const pool = otros.length ? otros : candidatos;
  let avanza = null, falta = -Infinity;
  for (const o of pool) {
    const exceso = distance(o.x, o.y, blanco.x, blanco.y) - arma(o).paradaAvance;
    if (!avanza || prioridadAvance(o) < prioridadAvance(avanza) ||
        (prioridadAvance(o) === prioridadAvance(avanza) && exceso > falta)) {
      avanza = o; falta = exceso;
    }
  }
  const no = (m) => { E.noAvanza[m] = (E.noAvanza[m] || 0) + 1; };
  if (!avanza) {
    const yaCerca = miembros.some((o) => prioridadAvance(o) != null &&
      distance(o.x, o.y, blanco.x, blanco.y) <= arma(o).paradaAvance + c.ganaMin);
    no(yaCerca ? 'yaCerca' : 'nadiePuede');
    st.pausa = 0.5;
    return;
  }

  if (porRecarga) {
    // Te vieron (u oyeron) empezar a recargar: sale ya, con o sin quien lo
    // cubra. Y se les borra la marca — no se van a enterar de cuándo terminás.
    for (const o of miembros) o.vioRecargar = 0;
  } else {
    // Si estás afuera y él te ve, no es momento de correr: es momento de tirar.
    const solo = miembros.length < 2;
    if (solo) { no('solo'); st.pausa = 0.5; return; }   // solo no avanza salvo que recargues
    const teVe = avanza.lostTimer < 0.3;
    if (teVe && !isHidden(p)) { no('teVe'); st.pausa = 0.3; return; }
  }

  // El segundo en avanzar va por el costado contrario al del primero.
  const lado = st.ultimoAvanzo && st.ultimoAvanzo !== avanza && st.ladoUltimo ? -st.ladoUltimo : 0;
  const spot = coberturaMasCerca(avanza, world, blanco, lado);
  if (!spot) { no('sinCobertura'); st.pausa = 1; return; }

  const cubre = elegirQuienCubre(miembros, avanza);
  if (!cubre && !porRecarga) { no('sinQuienCubra'); st.pausa = 0.5; return; }

  st.avanza = avanza;
  st.cubre = cubre;
  st.spot = spot;
  st.ultimoAvanzo = avanza;
  st.ladoUltimo = Math.sign(spot.y - blanco.y) || 1;
  st.fase = 'cubriendo';
  st.timer = porRecarga ? 0.15 : c.preAviso;
  if (cubre) ponerACubrir(cubre, world, st.timer + c.avanceMax);
  E.avances++;
  if (porRecarga) E.avancesPorRecarga++;
}

// ----------------------------------------------------------- el rodeo

/**
 * 🔄 ¿QUIÉN SALE A BUSCARTE? La escopeta o el revólver; el Winchester sólo si
 * no hay de otro tipo en la escuadra. Entre iguales, el que está más cerca.
 */
function quienRodea(miembros, world, blanco) {
  const puede = (o) => !o.defensivo && !(o.cubriendoTimer > 0) && !o.esperandoCompanero &&
    !o.esSheriff && !o.yaSeReplego && !(o.desenfundando > 0) && !o.vaHaciaPuerta &&
    !(o.recargando > 0) && balas(o) > 0 && !o.avanzando;
  const libres = miembros.filter(puede);
  const noRifle = libres.filter((o) => arma(o).id !== 'winchester');
  const hayOtroTipo = miembros.some((o) => arma(o).id !== 'winchester');
  const pool = noRifle.length ? noRifle : (hayOtroTipo ? [] : libres);
  let mejor = null;
  for (const o of pool) {
    if (!mejor || distance(o.x, o.y, blanco.x, blanco.y) < distance(mejor.x, mejor.y, blanco.x, blanco.y)) mejor = o;
  }
  return mejor;
}

/**
 * ¿DESDE DÓNDE TE VERÍA? Recorre las baldosas libres cerca de él y se queda con
 * la más cercana que: esté en tu vagón, a una distancia que su arma alcance
 * (y no encima tuyo), con la vista Y el tiro libres hasta vos, y —si estás
 * agachado detrás de algo— del lado descubierto de tu cobertura.
 */
function puntoConAngulo(e, world, blanco) {
  const c = CONFIG.escuadra;
  const map = world.map, size = map.size;
  const p = world.player;
  const a = arma(e);
  const lejos = Math.min(a.vistaCombate, a.alcance) * 0.85;
  const w = world.train.wagonAt(blanco.x);
  const tapa = p.cover && distance(p.x, p.y, blanco.x, blanco.y) < 20 ? p.cover : null;
  const taken = [];
  for (const o of world.enemies) if (o !== e && o.alive && o.coverPoint) taken.push(o.coverPoint);
  const r = Math.ceil(c.rodeoRadio / size);
  const c0 = Math.floor(e.x / size), r0 = Math.floor(e.y / size);
  let mejor = null, mejorD = Infinity;
  for (let row = r0 - r; row <= r0 + r; row++) {
    for (let col = c0 - r; col <= c0 + r; col++) {
      if (map.isSolidTile(col, row)) continue;
      const pt = map.tileCenter(col, row);
      const dYo = distance(pt.x, pt.y, e.x, e.y);
      if (dYo > c.rodeoRadio || dYo >= mejorD) continue;
      const dVos = distance(pt.x, pt.y, blanco.x, blanco.y);
      if (dVos < c.rodeoMin || dVos > lejos) continue;
      if (world.train.wagonAt(pt.x) !== w) continue;
      if (taken.some((o) => distance(o.x, o.y, pt.x, pt.y) < 12)) continue;
      if (tapa) {
        const dx = (pt.x - blanco.x) / dVos, dy = (pt.y - blanco.y) / dVos;
        if (dx * tapa.nx + dy * tapa.ny < 0.15) continue;
      }
      if (!hasLineOfSight(pt.x, pt.y, blanco.x, blanco.y, map.blocksSightAt)) continue;
      if (!hasLineOfSight(pt.x, pt.y, blanco.x, blanco.y, map.blocksBulletsAt)) continue;
      mejor = pt; mejorD = dYo;
    }
  }
  return mejor;
}

function actualizarRodeo(st, miembros, world, blanco, E, dt) {
  const c = CONFIG.escuadra;
  st.pausaRodeo = (st.pausaRodeo ?? 1) - dt;

  // Uno rodeando: ¿terminó? (llegó, te vio, se le acabó el tiempo, cayó)
  if (st.rodea) {
    const r = st.rodea;
    if (!activo(r) || !r.rodeoPunto) {
      if (r.alive) r.rodeoPunto = null;
      st.rodea = null;
      st.pausaRodeo = c.pausaEntreRodeos;
    }
    return;
  }
  if (st.pausaRodeo > 0 || st.fase !== 'quieto') return;
  // ¿Alguien te está viendo? Entonces no hace falta buscarte.
  if (miembros.some((o) => o.lostTimer < c.rodeoSinVer)) return;

  const quien = quienRodea(miembros, world, blanco);
  if (!quien) { st.pausaRodeo = 0.5; return; }
  const punto = puntoConAngulo(quien, world, blanco);
  if (!punto) { (E.noRodea = E.noRodea || {}).sinLugar = (E.noRodea.sinLugar || 0) + 1; st.pausaRodeo = 1; return; }

  quien.rodeoPunto = punto;
  quien.rodeoTimer = c.rodeoMax;
  quien.coverPoint = null;
  quien.atCover = false;
  quien.peeking = false;
  quien.ruta = null;
  st.rodea = quien;
  gritar(quien, world, 'teRodeo');
  // Los demás lo cubren: te tiran a donde te vieron, para que no te muevas.
  // Grita uno solo: tres "¡TE CUBRO!" encimados no se leen.
  let primero = true;
  for (const o of miembros) {
    if (o === quien || !puedeCubrir(o)) continue;
    if (primero) ponerACubrir(o, world, c.rodeoMax);
    else o.cubriendo = Math.max(o.cubriendo || 0, c.rodeoMax);
    primero = false;
  }
  E.rodeos = (E.rodeos || 0) + 1;
}

function terminarAvance(st) {
  if (st.avanza) st.avanza.avanzando = false;
  if (st.cubre && st.cubre.cubriendo > 0.3) st.cubre.cubriendo = 0.3;
  if (st.fase !== 'quieto') st.pausa = CONFIG.escuadra.pausaEntreAvances;
  st.fase = 'quieto';
  st.avanza = null;
  st.cubre = null;
  st.spot = null;
}
