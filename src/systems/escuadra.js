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
import { distance } from '../engine/collision.js';
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
  if (e.recargando > 0 || balas(e) <= 0) return false;
  return distance(e.x, e.y, blanco.x, blanco.y) > arma(e).paradaAvance + CONFIG.escuadra.ganaMin;
}

function puedeCubrir(e) {
  return !(e.recargando > 0) && balas(e) > 0 && !!e.lastSeen && !(e.desenfundando > 0);
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
function coberturaMasCerca(e, world, blanco) {
  const c = CONFIG.escuadra;
  const taken = [];
  for (const o of world.enemies) if (o !== e && o.alive && o.coverPoint) taken.push(o.coverPoint);
  const a = arma(e);
  const spot = findCoverPoint(world.map, e.x, e.y, blanco.x, blanco.y, taken, a.distanciaIdeal, a.vistaCombate);
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

    // ---- EL AVANCE: sólo en el vagón donde estás ----
    if (w !== vagonJugador || !p.alive) { terminarAvance(st); continue; }
    st.pausa -= dt;
    const blanco = blancoDe(miembros);
    if (!blanco) continue;

    if (st.fase === 'quieto') empezarAvance(st, miembros, world, blanco, E);
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

  // ¿Quién avanza? La escopeta primero; entre iguales, el que está más lejos
  // de donde le gusta pelear.
  let avanza = null, falta = -Infinity;
  for (const o of miembros) {
    if (!puedeAvanzar(o, world, blanco)) continue;
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

  const spot = coberturaMasCerca(avanza, world, blanco);
  if (!spot) { no('sinCobertura'); st.pausa = 1; return; }

  const cubre = elegirQuienCubre(miembros, avanza);
  if (!cubre && !porRecarga) { no('sinQuienCubra'); st.pausa = 0.5; return; }

  st.avanza = avanza;
  st.cubre = cubre;
  st.spot = spot;
  st.fase = 'cubriendo';
  st.timer = porRecarga ? 0.15 : c.preAviso;
  if (cubre) ponerACubrir(cubre, world, st.timer + c.avanceMax);
  E.avances++;
  if (porRecarga) E.avancesPorRecarga++;
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
