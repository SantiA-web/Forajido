/**
 * Inteligencia de los guardias.
 *
 * Tres estados: patrullar → sospechar → combate.
 *
 * Decisiones de diseño importantes:
 *
 *  1. SOSPECHA PROGRESIVA. No te ven o no te ven: te van viendo. La barrita
 *     sobre la cabeza te dice cuánto te queda para romper el contacto. Eso
 *     convierte el sigilo en algo que se juega, no en una lotería.
 *
 *  2. SE CUBREN. En combate no te vienen a buscar de frente: buscan una
 *     baldosa con un asiento o una pared entre ellos y vos, y disparan
 *     asomándose. Para matarlos hay que moverse y flanquearlos.
 *
 *  3. EL AVISO ES EL CUERPO, NO UNA LÍNEA. Antes de disparar se paran en
 *     seco, levantan el arma y se oye el martillo. No hay línea roja que
 *     marque la trayectoria: hay que leer al guardia.
 *
 *  4. GRITAN. El primero que te ve avisa a los demás. Ya no se puede limpiar
 *     el vagón de a un guardia por vez sin que nadie se entere.
 */

import { CONFIG } from '../data/config.js';
import { moveAndCollide, hasLineOfSight, distance, angleDifference } from '../engine/collision.js';
import { findPath } from '../engine/pathfind.js';
import { findCoverPoint, findCoverAtras, findPeek } from './cover.js';
import { throwTarget } from './explosives.js';
import { EXPLOSIVES, DEFAULT_EXPLOSIVE } from '../data/explosives.js';
import { isHidden, damagePlayer } from '../entities/player.js';
import { gameState } from '../state/gameState.js';
import {
  CONVERSANDO_SUSPICION_MULT, CONVERSANDO_VIEW_ANGLE, CONVERSANDO_VIEW_DISTANCE,
  CONVERSANDO_CONTAGIO,
} from '../data/modifiers.js';
import { T } from '../text/es.js';

/**
 * `isSolidForMovementAt` (si existe) suma la puerta blindada al choque real
 * de moverse, SIN meterla en `isSolidAt` puro — eso es lo que usa
 * `systems/cover.js` para decidir "¿hay una pared al lado?", y una puerta
 * angosta flotando en el aire no debería contar como pared para
 * parapetarse contra ella (rompía el disparo asomándose, ver raidScene.js).
 */
function movSolidAt(map) {
  return map.isSolidForMovementAt || map.isSolidAt;
}

export function updateEnemy(e, dt, world) {
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  if (!e.alive) return;

  e.alertMark = Math.max(0, e.alertMark - dt);
  e.cooldown = Math.max(0, e.cooldown - dt);
  e.meleeTimer = Math.max(0, e.meleeTimer - dt);

  /**
   * ANTES DEL CHEQUEO DE `stagger`, a propósito: si le pegan mientras está
   * aturdido (una estampida, un culatazo) el golpe tiene que contarse igual.
   * Esto no lo mueve — sólo decide y marca; el que camina es `retirarseHerido`,
   * y ése sí corre por dentro de `doCombat`, que el stagger ya frena.
   */
  /**
   * INCONSCIENTE: fuera del asalto hasta que se despierte, y nada más pasa.
   *
   * Va antes que TODO —antes del repliegue, del stagger y de la dinamita— por
   * la misma razón por la que `confinar` va al final: es una regla que no puede
   * depender de que cada rama de abajo se acuerde de respetarla. Un desmayado
   * no huye de una mecha encendida ni se repliega herido.
   */
  if (e.inconsciente > 0) {
    e.inconsciente -= dt;
    if (e.inconsciente <= 0) despertarDelNoqueo(e, world);
    return;
  }

  /**
   * RENDIDO: se quedó quieto, de rodillas. No se mueve, no investiga nada —
   * lo único que puede pasarle desde acá es que lo ataques (systems/melee.js
   * o una bala perdida), que el asalto termine con él vivo (perdonarlo), o
   * que decida jugársela (`considerarTraicion`, más abajo).
   */
  if (e.rendido) {
    considerarTraicion(e, dt, world);
    return;
  }

  considerarRepliegue(e, dt, world);
  actualizarCharla(e, dt, world);

  // Aturdido por un golpe: no puede hacer nada durante un instante.
  if (e.stagger > 0) {
    e.stagger -= dt;
  } else {
    e.throwCooldown = Math.max(0, (e.throwCooldown || 0) - dt);

    // Antes que cualquier otra cosa: si hay una mecha encendida al lado,
    // correr. Ningún plan sobrevive a una dinamita a dos metros.
    const peligro = explosivoPeligroso(e, world);
    if (peligro) {
      huirDe(e, dt, world, peligro);
    } else {
      const player = world.player;
      /**
       * "CONVERSANDO", MIENTRAS SIGUE EN `patrol`: cono más angosto Y más
       * corto, además de sospechar más lento (ver más abajo). Mirando a su
       * compañero en vez de al pasillo, literalmente tiene menos ojo puesto
       * en vos — `undefined` cae solo al cono normal en `canSeeFrom`.
       */
      const conversandoEnCalma = e.conversando && e.state === 'patrol';
      const conoCorto = conversandoEnCalma ? CONVERSANDO_VIEW_DISTANCE : undefined;
      const conoAngosto = conversandoEnCalma ? CONVERSANDO_VIEW_ANGLE : undefined;
      // Los guardias de abajo no te ven a través del techo, pase lo que
      // pase con la geometría de línea de visión: te oyen (oirPisadas,
      // sin cambios) pero nunca te ven.
      const visible = player.alive && !player.enTecho &&
        canSeeFrom(e.x, e.y, e.facing, player, world.map, true, conoCorto, conoAngosto);

      updateSuspicion(e, dt, world, visible);
      contagiarCharla(e, dt);
      if (!visible) oirPisadas(e, dt, world);
      if (!visible && e.state !== 'combat') noticeBodies(e, dt, world);

      switch (e.state) {
        case 'patrol':     doPatrol(e, dt, world); break;
        case 'suspicious': doInvestigate(e, dt, world); break;
        case 'combat':     doCombat(e, dt, world); break;
      }
    }
  }

  // Última palabra, pase lo que pase arriba: un guardia confinado (los del
  // blindado) no cruza el borde de su vagón. No es una regla que dependa de
  // que cada rama de la IA se acuerde de respetarla — se aplica siempre, al
  // final, sobre lo que sea que haya decidido moverlo.
  confinar(e);
}

/**
 * SE DESPIERTA — y no vuelve a ser el de antes.
 *
 * Un tipo al que le partieron la cabeza por la espalda no retoma su ronda
 * silbando: se levanta `spooked` (la misma marca que deja ver un cadáver, ver
 * CONFIG.enemy.bodySightDistance), o sea que ya nunca baja del piso de
 * sospecha y te busca el doble de tiempo. Y arranca mirando el lugar donde
 * estaba cuando lo voltearon, que es lo único que llegó a saber.
 *
 * ES LA MITAD DEL PRECIO DE NO MATAR: la otra mitad es que mientras dormía
 * estuvo tirado delatándote. Noquear no es sigilo gratis — es sigilo prestado.
 */
function despertarDelNoqueo(e, world) {
  e.inconsciente = 0;
  e.spooked = true;
  e.state = 'suspicious';
  e.suspicion = 0.95;
  e.target = { x: e.x, y: e.y };
  e.alertMark = 1;
  e.coverPoint = null;
  e.atCover = false;
  e.peeking = false;
  world.audio.play('cock');
}

/** Un guardia confinado (los del blindado) nunca sale de su propio vagón. */
function confinar(e) {
  if (!e.confinado) return;
  e.x = Math.max(e.confinado.x0, Math.min(e.confinado.x1, e.x));
}

/**
 * Los guardias no pueden ocupar el mismo lugar.
 *
 * Sin esto, tres guardias persiguiendo al mismo objetivo terminan apilados en
 * el mismo píxel, y de esa esquina sale una pared de balas imposible de leer.
 * Se empujan suavemente entre ellos hasta separarse.
 */
export function separateEnemies(enemies, map) {
  const minDist = CONFIG.enemy.separation;

  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    if (!a.alive) continue;

    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j];
      if (!b.alive) continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      if (dist >= minDist) continue;

      // Exactamente encima: los separamos en una dirección cualquiera.
      if (dist < 0.001) { dx = 1; dy = 0; dist = 0.001; }

      /**
       * El empujón se reparte mitad y mitad, y así tiene que ser: si a uno de
       * los dos se lo hiciera inamovible, un tercero que quedara ENTRE dos
       * fijos no tendría cómo salir. Se probó y pasa —dos que conversan dejan
       * 18px entre sí, y el que se mete ahí necesita 13 de cada lado—: el
       * guardia quedaba prensado, sin moverse un píxel.
       *
       * Que al plantado no lo corran de su puesto se resuelve en otro lado y
       * de otra forma: volviendo (ver `volverAlPuesto`, más abajo).
       */
      const push = (minDist - dist) * 0.5;
      const nx = dx / dist;
      const ny = dy / dist;

      moveAndCollide(a, -nx * push, -ny * push, movSolidAt(map));
      moveAndCollide(b, nx * push, ny * push, movSolidAt(map));
    }
  }
}

/** ¿Hay un compañero metido en la línea de tiro? Entonces no dispara. */
function allyInLine(e, world, targetX, targetY) {
  const c = CONFIG.enemy;
  const dx = targetX - e.x;
  const dy = targetY - e.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return false;

  const ux = dx / length;
  const uy = dy / length;

  for (const other of world.enemies) {
    if (other === e || !other.alive) continue;
    const ox = other.x - e.x;
    const oy = other.y - e.y;
    const along = ox * ux + oy * uy;
    if (along <= 0 || along > length) continue;              // detrás o más lejos que el blanco
    if (Math.abs(-ox * uy + oy * ux) < c.allyBlockRadius) return true;
  }
  return false;
}

/**
 * La dispersión crece con la distancia: de lejos son fuego de contención.
 *
 * Lee `e.ai`, no `CONFIG.enemy`: es uno de los cuatro números que cambia la
 * dificultad "dura" (ver data/train.js), y cada guardia lleva su propio
 * perfil. Para uno sin overrides, `e.ai` es una copia llana de CONFIG.enemy,
 * así que el resultado es idéntico al de siempre.
 *
 * `extra` es el sacudón del tren (`world.dispersionExtra`, ver CONFIG.
 * traqueteo): se SUMA, no se multiplica, a propósito — así castiga mucho más
 * al que tira fino (un guardia o vos con el Colt) que al que ya dispersa de
 * por sí. El piso se pone peor para cualquiera parado en él, parejo.
 */
function spreadAt(e, dist, extra = 0) {
  const c = e.ai;
  const span = c.spreadFarDistance - c.spreadNearDistance;
  const t = Math.max(0, Math.min(1, (dist - c.spreadNearDistance) / span));
  return c.spreadNear + (c.spreadFar - c.spreadNear) * t + extra;
}

// ------------------------------------------------------------------ alertas

/** Ruido: un disparo, la caja fuerte, un grito. Va a mirar qué pasó. */
export function alertTo(e, x, y) {
  if (!e.alive || e.state === 'combat') return;
  e.state = 'suspicious';
  e.target = { x, y };
  e.suspicion = Math.max(e.suspicion, 0.5);
  e.alertMark = 0.6;
}

/** Otro guardia gritó: este ya sabe que hay alguien y va directo al combate. */
export function alertCombat(e, x, y, world) {
  if (!e.alive || e.state === 'combat') return;
  e.lastSeen = { x, y };
  enterCombat(e, world, false);
}

/**
 * SE PONE EN GUARDIA, PERO NO VIENE.
 *
 * Es lo que hacen los guardias que están ADELANTE del quilombo. Oyeron el
 * tiroteo igual que los de atrás — sería raro que siguieran silbando — pero no
 * abandonan su vagón: se quedan donde están, despiertos y mirando.
 *
 * Por qué sólo se movilizan los de atrás: el juego es una retirada, y los
 * refuerzos que significan algo son los que te cortan el camino al caballo. Los
 * de adelante no te persiguen; te esperan. Así avanzar sigue teniendo sorpresa
 * sin que se te venga el tren entero encima.
 *
 * Se marca `spooked` (el mismo estado del que vio un cadáver) porque es
 * exactamente eso: un tipo que oyó tiros cerca y ya no se vuelve a confiar.
 */
export function alertaEnGuardia(e) {
  if (!e.alive || e.state === 'combat') return;
  e.state = 'suspicious';
  e.target = { x: e.x, y: e.y };   // su propio puesto: no se mueve de ahí
  e.suspicion = Math.max(e.suspicion, 0.9);
  e.spooked = true;
  e.alertMark = 0.8;
}

/**
 * EL QUE ESTÁ ADELANTE DEL LÍO: ROJO DE VERDAD, ESPERANDO EN SU PROPIA
 * PUERTA — no amarillo y quieto donde lo agarró la alerta.
 *
 * *(pedido de Santi, corrigiendo el comportamiento de siempre: "los guardias
 * deberían estar en rojo esperándote en la puerta de su vagón, no en
 * amarillo". Y: "los guardias del blindado sácalos de la ecuación")*
 *
 * REEMPLAZA A `alertaEnGuardia` para este caso puntual (el de "adelante" en
 * `spreadAlarm`, más abajo). La diferencia no es sólo el color: entra en
 * combate DE VERDAD (`enterCombat`, sin gritar — ya se enteró por la alarma,
 * no hace falta que avise de nuevo y la vuelva a propagar) y camina hasta la
 * puerta de entrada de SU PROPIO vagón antes de plantarse. `doCombat` es
 * quien hace caminar a `e.puertaDestino` mientras `vaHaciaPuerta` esté
 * puesto; al llegar, se marca `defensivo` (la misma marca que ya usa la
 * escolta del Sheriff) y ahí se queda para siempre, cubierto en la entrada,
 * esperándote.
 *
 * LOS DEL BLINDADO QUEDAN AFUERA A PROPÓSITO (`e.confinado`): ya tienen su
 * propia regla ("nunca abandonan el puesto pase lo que pase") y su propia
 * puerta, que no es madera — no hace falta ni tiene sentido mandarlos a
 * caminar a ningún lado. Siguen con el `alertaEnGuardia` de siempre.
 *
 * ⚠️ SIN NINGÚN LLAMADO HOY. `spreadAlarm` (raidScene.js) era su único
 * lugar, y dejó de usarla cuando el vagón "de adelante" pasó a quedar en
 * amarillo (`alertTo`) en vez de en rojo esperando en la puerta — pedido de
 * Santi, para que la alarma de verdad reaccione igual que un disparo suelto.
 * No se borró: el concepto ("alguien se entera pero no cruza a buscarte, se
 * planta armado en su puerta") puede volver a hacer falta para otro sistema
 * más adelante (redada, algún evento de Fase 7). Si en una sesión futura
 * sigue sin ningún llamado, es candidata segura para borrar del todo, junto
 * con `puertaDeEntradaDe` y el chequeo de `vaHaciaPuerta` en `doCombat`.
 */
export function alertaEnPuerta(e, world) {
  if (!e.alive || e.state === 'combat') return;

  if (e.confinado) { alertaEnGuardia(e); return; }

  const destino = puertaDeEntradaDe(e.wagon, world);
  if (!destino) { alertaEnGuardia(e); return; }

  enterCombat(e, world, false);
  e.vaHaciaPuerta = true;
  e.puertaDestino = destino;
}

/**
 * DÓNDE ESTÁ LA PUERTA DE ENTRADA (lado cola) DE UN VAGÓN — no hace falta
 * buscarla en `world.doors`: cada vagón guarda su propio borde de menor `x`
 * (`train.wagons[i].x`, world/train.js), que es exactamente ese lado, porque
 * los vagones se arman en orden creciente de `x` desde la cola hacia la
 * locomotora. `+10` para pararse un paso adentro del marco, no clavado en la
 * línea del enganche.
 */
function puertaDeEntradaDe(wagonIndex, world) {
  const w = world.train && world.train.wagons[wagonIndex];
  if (!w) return null;
  return { x: w.x + 10, y: CONFIG.techo.centroY };
}

function enterCombat(e, world, shout = true) {
  e.state = 'combat';
  e.suspicion = 1;
  e.alertMark = 1;
  e.lostTimer = 0;
  e.coverPoint = null;
  e.atCover = false;
  e.peeking = false;
  e.cooldown = Math.max(e.cooldown, CONFIG.enemy.reactionTime);

  if (shout) {
    world.audio.play('whistle');
    // Va el vagón, no solo la posición: la alarma se propaga por vagones, no
    // por un círculo de píxeles que corta un vagón por la mitad.
    world.bus.emit('guardAlerted', {
      x: e.x, y: e.y,
      wagon: e.wagon,
      radius: CONFIG.enemy.shoutRadius,
    });
  }
}

// ----------------------------------------------------------------- sospecha

function updateSuspicion(e, dt, world, visible) {
  // e.ai: la velocidad de sospecha (suspicionNear/Far) es de las cosas que
  // cambian por guardia — ver data/train.js.
  const c = e.ai;
  const player = world.player;

  if (visible) {
    const dist = distance(e.x, e.y, player.x, player.y);
    const t = Math.min(1, dist / c.viewDistance);
    let rate = c.suspicionNear + (c.suspicionFar - c.suspicionNear) * t;
    if (player.sneaking) rate *= c.suspicionSneak;
    else if (player.moving) rate *= c.suspicionMoving;

    /**
     * CONVERSANDO — Fase 3 ("variedad de lo que pasa en los trenes",
     * data/modifiers.js). Sólo mientras sigue en `patrol`: apenas algo lo
     * saca de ahí (te vio de verdad, entró en `suspicious`/`combat`), este
     * `if` deja de aplicar solo, sin que haga falta apagar `e.conversando`
     * a mano — es independiente de si vos estás agachado o corriendo, así
     * que se multiplica encima, no en vez de.
     */
    if (e.conversando && e.state === 'patrol') rate *= CONVERSANDO_SUSPICION_MULT;

    e.suspicion += rate * dt;
    e.memoryTimer = c.suspicionMemory;
    e.lastSeen = { x: player.x, y: player.y };

    if (e.suspicion >= 1) {
      if (e.state !== 'combat') enterCombat(e, world);
    } else if (e.state === 'patrol' && e.suspicion > 0.3) {
      e.state = 'suspicious';
      e.target = { ...e.lastSeen };
    }
    return;
  }

  if (e.memoryTimer > 0) {
    e.memoryTimer -= dt;
  } else if (e.state !== 'combat') {
    // Un guardia que vio un cadáver ya no se calma: se olvida MUCHO más lento
    // y nunca baja del todo. Antes te disparaba, te escondías dos segundos y
    // volvía a silbar como si nada.
    const freno = e.spooked ? c.spookedDecayFactor : 1;
    const piso = e.spooked ? c.spookedFloor : 0;
    e.suspicion = Math.max(piso, e.suspicion - c.suspicionDecay * freno * dt);
  }
}

/**
 * TUS PISADAS.
 *
 * Oírte no depende de que te vean: un guardia de espaldas te escucha igual, y
 * eso es lo que hace que agacharse sea una decisión y no un adorno. Agachado
 * (Espacio) no hacés absolutamente nada de ruido, así que te podés pegar a la
 * espalda de cualquiera.
 *
 * Sube por acumulación, más rápido cuanto más cerca: se puede leer en la
 * barrita amarilla y se puede jugar en contra (te alejás y deja de subir).
 */
function oirPisadas(e, dt, world) {
  const c = CONFIG.enemy;
  const p = world.player;
  if (!p.alive || !p.moving || p.sneaking) return;

  // `world.train.hearStepRadius`, no `c.hearStepRadius` a secas: una tormenta
  // lo agranda (ver la nota en world/train.js). El RITMO (`hearStepRate`) no
  // cambia con el clima, sólo el alcance.
  const hearStepRadius = world.train ? world.train.hearStepRadius : c.hearStepRadius;
  const dist = distance(e.x, e.y, p.x, p.y);
  if (dist > hearStepRadius) return;

  const cerca = 1 - dist / hearStepRadius;
  e.suspicion += c.hearStepRate * cerca * dt;
  e.memoryTimer = c.suspicionMemory;

  if (e.suspicion >= 1) {
    e.lastSeen = { x: p.x, y: p.y };
    if (e.state !== 'combat') enterCombat(e, world);
  } else if (e.state === 'patrol' && e.suspicion > 0.3) {
    e.state = 'suspicious';
    e.target = { x: p.x, y: p.y };
  }
}

// ----------------------------------------------------------------- dinamita

/** ¿Hay un cartucho encendido que lo puede agarrar a él? */
function explosivoPeligroso(e, world) {
  if (!world.explosives || world.explosives.length === 0) return null;

  for (const ex of world.explosives) {
    if (!ex.alive) continue;
    const dist = distance(e.x, e.y, ex.x, ex.y);
    if (dist > ex.type.fleeRadius) continue;
    // Si hay una pared de por medio, el estruendo no lo alcanza: no se mueve.
    if (!hasLineOfSight(e.x, e.y, ex.x, ex.y, world.map.blocksBulletsAt)) continue;
    return ex;
  }
  return null;
}

/** Sale corriendo en dirección contraria. No busca cobertura: se va y ya. */
function huirDe(e, dt, world, ex) {
  const c = CONFIG.enemy;

  // Deja lo que estaba haciendo: nadie apunta con una mecha encendida al lado.
  e.aimTimer = 0;
  e.burstLeft = 0;
  e.peeking = false;
  e.coverPoint = null;
  e.atCover = false;
  e.ruta = null;
  if (e.state === 'patrol') e.state = 'suspicious';
  e.alertMark = Math.max(e.alertMark, 0.4);

  const ang = Math.atan2(e.y - ex.y, e.x - ex.x);
  moveAndCollide(
    e,
    Math.cos(ang) * c.speed * 1.25 * dt,
    Math.sin(ang) * c.speed * 1.25 * dt,
    movSolidAt(world.map)
  );
  turnTowards(e, ang, dt, 9);
}

/**
 * ¿Este guardia enciende una dinamita?
 *
 * Solo si te ve PARAPETADO. Ese es el punto entero del arma: existe para
 * romper el empate de "yo detrás de un asiento, vos detrás de otro". Si te
 * estás moviendo no la necesita, te dispara y listo.
 *
 * Y no la tira de cerca, porque se volaría él también.
 */
function consideraTirarDinamita(e, dt, world) {
  const c = CONFIG.enemy;
  const p = world.player;

  // Ya la encendió: la sostiene un momento y la tira.
  if (e.throwWindup > 0) {
    e.throwWindup -= dt;
    turnTowards(e, Math.atan2(p.y - e.y, p.x - e.x), dt, 8);
    if (e.throwWindup <= 0) lanzarDinamita(e, world);
    return true;
  }

  if (e.dynamite <= 0 || e.throwCooldown > 0) return false;
  if (!p.alive || !isHidden(p)) return false;

  const dist = distance(e.x, e.y, p.x, p.y);
  if (dist < c.throwMinRange || dist > c.throwMaxRange) return false;
  if (!hasLineOfSight(e.x, e.y, p.x, p.y, world.map.blocksBulletsAt)) return false;

  e.throwWindup = c.throwWindup;
  e.throwCooldown = c.throwCooldown;
  world.audio.play('fuse');
  return true;
}

function lanzarDinamita(e, world) {
  const tipo = EXPLOSIVES[DEFAULT_EXPLOSIVE];
  const p = world.player;

  e.dynamite -= 1;

  const destino = throwTarget(e.x, e.y, p.x, p.y, tipo.throwRange, world.map);
  world.spawnExplosive({
    x: e.x, y: e.y,
    targetX: destino.x, targetY: destino.y,
    typeId: tipo.id, owner: 'enemy',
    // La tira con casi toda la mecha: te da tiempo de salir de ahí. Un guardia
    // que la cocina hasta el final sería imposible de leer y no se podría jugar.
    fuse: tipo.fuse * 0.72,
  });
  world.audio.play('swing');
}

/**
 * Cadáveres.
 *
 * Es lo que evita que el degüello silencioso sea gratis: podés sacar guardias
 * de a uno sin hacer ruido, pero los cuerpos quedan tirados, y el guardia que
 * ve uno da la alarma. Dónde matás importa tanto como a quién.
 */
function noticeBodies(e, dt, world) {
  const c = CONFIG.enemy;
  const body = findVisibleBody(e, world, c);
  if (!body) return;

  // Marcado para el resto del asalto. Un tipo que encontró a un compañero
  // muerto en el piso no vuelve nunca más a su ronda tranquilo.
  e.spooked = true;

  e.suspicion += c.bodySuspicionRate * dt;
  e.memoryTimer = c.suspicionMemory;

  if (e.suspicion >= 1) {
    e.lastSeen = { x: body.x, y: body.y };
    enterCombat(e, world);
  } else if (e.state === 'patrol' && e.suspicion > 0.3) {
    e.state = 'suspicious';
    e.target = { x: body.x, y: body.y };
  }
}

function findVisibleBody(e, world, c) {
  const check = (entity) => {
    /**
     * UN DESMAYADO CUENTA COMO UN CUERPO. De lejos nadie distingue a un muerto
     * de alguien que respira tirado en el piso — y ésa es exactamente la razón
     * por la que noquear no es sigilo gratis (ver `inconsciente` en
     * entities/enemy.js). El que lo encuentra da la alarma igual.
     */
    if (entity.alive && !(entity.inconsciente > 0)) return null;
    const dist = distance(e.x, e.y, entity.x, entity.y);
    if (dist > c.bodySightDistance) return null;
    const angleTo = Math.atan2(entity.y - e.y, entity.x - e.x);
    if (Math.abs(angleDifference(e.facing, angleTo)) > c.viewAngle) return null;
    if (!hasLineOfSight(e.x, e.y, entity.x, entity.y, world.map.blocksSightAt)) return null;
    return entity;
  };

  for (const other of world.enemies) {
    const found = check(other);
    if (found) return found;
  }
  for (const pa of world.passengers) {
    const found = check(pa);
    if (found) return found;
  }
  return null;
}

/**
 * ¿Se ve al jugador desde este punto?
 *
 * ESTAR A CUBIERTO NO TE HACE INVISIBLE: te tapa de los que están del otro lado
 * de la pared, y de nadie más. Pegarse a una pared con un guardia de frente, a
 * la vista, en el mismo pasillo, no debería esconderte de él — apretaste Shift,
 * no te metiste en un armario.
 *
 * Esto ESTABA MAL y es un caso feo: el comentario de esta función ya decía
 * exactamente eso, pero el código no lo hacía. El corte por `coverSightDistance`
 * se aplicaba a todo el mundo antes de mirar de qué lado estaba el guardia, así
 * que a 63 px te volvías invisible aunque el tipo te estuviera mirando de cara.
 *
 * Ahora la distancia corta SOLO para el que está del lado tapado: ese te ve
 * únicamente si te tiene prácticamente encima (te asomó la bota, te oyó
 * respirar). El que está del lado descubierto te ve como a cualquiera.
 */
export function canSeeFrom(fromX, fromY, facing, player, map, useCone, viewDistance, viewAngle) {
  const c = CONFIG.enemy;
  const dist = distance(fromX, fromY, player.x, player.y);
  /**
   * `viewDistance` es opcional y sólo lo usan los mini jefes: un guardia
   * siempre ve hasta `CONFIG.enemy.viewDistance` y nada cambió para ellos.
   * Existe porque el Cazarrecompensas carga un rifle que llega a 300 px, y
   * mirar con los ojos de un guardia (118) lo dejaba caminando de frente sin
   * enterarse de que estaba en una pelea — ver `viewDistance` en
   * data/bosses.js.
   */
  const alcanceVista = viewDistance || c.viewDistance;
  if (dist > alcanceVista) return false;

  /**
   * `viewAngle` es opcional, mismo patrón que `viewDistance` de acá arriba:
   * por defecto el cono de siempre (`CONFIG.enemy.viewAngle`), y sólo lo
   * angosta quien lo pase — hoy, un guardia "conversando" mientras sigue en
   * `patrol` (ver `updateEnemy` y data/modifiers.js, `CONVERSANDO_VIEW_ANGLE`).
   */
  const anguloVision = viewAngle || c.viewAngle;

  if (isHidden(player)) {
    const towardWatcher = {
      x: (fromX - player.x) / (dist || 1),
      y: (fromY - player.y) / (dist || 1),
    };
    /**
     * `exposure` mide de qué lado del plano de la pared está el que mira.
     * Positivo = del lado tuyo, el descubierto. Negativo = detrás de la pared.
     *
     * El umbral es 0 y no 0,25 por algo concreto: con 0,25 se consideraba
     * "tapado" a todo el que no estuviera casi de frente, incluido **un guardia
     * parado a tu costado en el mismo pasillo**, que te está viendo entero. Una
     * pared te tapa de lo que hay detrás de ella, no de lo que tenés al lado.
     */
    const exposure = towardWatcher.x * player.cover.nx + towardWatcher.y * player.cover.ny;
    if (exposure < 0 && dist > c.coverSightDistance) return false;
  }

  /**
   * A QUEMARROPA TE SIENTEN AUNQUE NO TE MIREN... SALVO QUE VENGAS AGACHADO.
   *
   * El corte de 26px existe para que no se pueda estar parado ENCIMA de un
   * guardia y ser invisible: a esa distancia lo tenés respirando al lado y da
   * igual para dónde mire.
   *
   * Pero se aplicaba a TODOS, y eso rompía en silencio la promesa central del
   * sigilo, escrita en tres lugares de este proyecto: *"agachado no hacés
   * ningún ruido, así que te podés pegar a la espalda de cualquiera"*. El
   * degüello necesita estar a 15px (`melee.range`), o sea SIEMPRE adentro de
   * los 26 — así que acercarse por atrás para degollar despertaba al guardia
   * antes de llegar, hiciera lo que hiciera el jugador. Medido: agachado y por
   * la espalda, la sospecha arrancaba justo al cruzar los 26px.
   *
   * Es el mismo tipo de error que el de la cobertura hace unas vueltas: el
   * comentario decía lo correcto y el código hacía otra cosa. Agachado, el
   * cono manda siempre — y por eso la espalda vuelve a ser un lugar seguro.
   */
  const loSienteEncima = dist <= 26 && !player.sneaking;

  if (useCone && !loSienteEncima) {
    const angleToPlayer = Math.atan2(player.y - fromY, player.x - fromX);
    if (Math.abs(angleDifference(facing, angleToPlayer)) > anguloVision) return false;
  }

  return hasLineOfSight(fromX, fromY, player.x, player.y, map.blocksSightAt);
}

// ---------------------------------------------------------------- movimiento

export function turnTowards(e, angle, dt, rate = 7) {
  e.facing += angleDifference(e.facing, angle) * Math.min(1, rate * dt);
}

export function moveToward(e, targetX, targetY, speed, dt, map) {
  const angle = Math.atan2(targetY - e.y, targetX - e.x);
  const before = { x: e.x, y: e.y };
  moveAndCollide(e, Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt, movSolidAt(map));
  turnTowards(e, angle, dt);
  return Math.hypot(e.x - before.x, e.y - before.y);
}

/**
 * Ir hasta un punto que puede estar MUY lejos, incluso en otro vagón.
 *
 * Antes alcanzaba con caminar derecho hacia el objetivo: guardia y jugador
 * estaban siempre en el mismo vagón. Ahora un guardia del vagón 4 tiene que
 * llegar al 1, y caminar derecho contra eso es quedarse trabado contra un
 * asiento para siempre.
 *
 * Calcula una ruta por el mapa y la sigue de esquina en esquina. La recalcula
 * cada tanto (el objetivo se mueve), no en cada cuadro: eso sería tirar trabajo.
 *
 * Devuelve cuánto se movió, para que el de afuera pueda detectar atascos.
 */
export function viajarHacia(e, dt, world, targetX, targetY, speed) {
  const map = world.map;

  const destinoCambio = !e.rutaDestino ||
    distance(e.rutaDestino.x, e.rutaDestino.y, targetX, targetY) > 40;

  e.rutaTimer = (e.rutaTimer || 0) - dt;

  if (!e.ruta || destinoCambio || e.rutaTimer <= 0) {
    e.ruta = findPath(
      map,
      { col: Math.floor(e.x / map.size), row: Math.floor(e.y / map.size) },
      { col: Math.floor(targetX / map.size), row: Math.floor(targetY / map.size) }
    );
    e.rutaIndex = 0;
    e.rutaTimer = CONFIG.enemy.routeRefresh;
    e.rutaDestino = { x: targetX, y: targetY };
  }

  // Sin ruta (o ya la terminamos): los últimos metros, derecho.
  if (!e.ruta || e.rutaIndex >= e.ruta.length) {
    return moveToward(e, targetX, targetY, speed, dt, map);
  }

  // Nos comemos las esquinas ya alcanzadas en el mismo cuadro: si no, cada
  // esquina costaba un cuadro quieto y el guardia parecía trabado.
  while (e.rutaIndex < e.ruta.length &&
         distance(e.x, e.y, e.ruta[e.rutaIndex].x, e.ruta[e.rutaIndex].y) < 7) {
    e.rutaIndex++;
  }
  if (e.rutaIndex >= e.ruta.length) {
    return moveToward(e, targetX, targetY, speed, dt, map);
  }

  const esquina = e.ruta[e.rutaIndex];
  return moveToward(e, esquina.x, esquina.y, speed, dt, map);
}

/** Primero en X y después en Y: así los guardias pasan por los huecos entre asientos. */
function moveAxisAligned(e, targetX, targetY, speed, dt, map) {
  const dx = targetX - e.x;
  const dy = targetY - e.y;

  if (Math.abs(dx) > 3) {
    const step = Math.sign(dx) * speed * dt;
    moveAndCollide(e, step, 0, movSolidAt(map));
    turnTowards(e, dx > 0 ? 0 : Math.PI, dt);
    return false;
  }
  if (Math.abs(dy) > 3) {
    const step = Math.sign(dy) * speed * dt;
    moveAndCollide(e, 0, step, movSolidAt(map));
    turnTowards(e, dy > 0 ? Math.PI / 2 : -Math.PI / 2, dt);
    return false;
  }
  return true;   // llegó
}

// ---------------------------------------------------------------- patrullar

/**
 * EL QUE TIENE UN PUESTO VUELVE A SU PUESTO.
 *
 * *(Santi, jugándolo: "hay veces que dos guardias parecen que están hablando
 * entre ellos, pero en realidad uno de esos guardias empuja al otro o no sé
 * qué pasa, pero es un bug")*
 *
 * EL BUG, MEDIDO: los guardias plantados por un comportamiento (los dos que
 * conversan, el que vigila una puerta o una caja, el guardaespaldas) no
 * tienen ronda, así que **nada los devolvía a ningún lado**. Y el sistema de
 * separación (`separateEnemies`) empuja a cualquier par que se acerque a
 * menos de 13px — así que el compañero que patrulla les pasa por encima, los
 * corre, y ahí se quedan. En el vagón de correo (dos charlando y un tercero
 * patrullando) medí que en 30 segundos se desplazaban hasta 326px y
 * terminaban a **260px uno del otro**, mirando para cualquier lado. Desde
 * afuera se ve exactamente como lo describió Santi: uno empujando al otro por
 * el pasillo.
 *
 * 🐛 EL PRIMER ARREGLO FUE PEOR: hacer inamovible al plantado. Un tercero que
 * quedaba ENTRE dos plantados (que dejan 18px entre sí, y él necesita 13 de
 * cada lado) no tenía cómo salir — medido, se quedaba prensado sin moverse un
 * píxel. Por eso el empujón sigue repartiéndose mitad y mitad como siempre, y
 * lo que se arregla es la vuelta.
 *
 * ASÍ QUE SE MUEVE COMO CUALQUIERA — lo empujan, se corre — pero después
 * **vuelve caminando a donde tiene que estar**, y al llegar recupera hacia
 * dónde miraba. Un tipo al que le pasan por delante se corre y vuelve a su
 * lugar: eso es lo que hace una persona, y de paso resuelve el bug sin
 * romperle el paso a nadie.
 */
function volverAlPuesto(e, dt, world) {
  if (!e.puesto) return;
  const d = distance(e.x, e.y, e.puesto.x, e.puesto.y);
  // Un par de píxeles de tolerancia: si no, corrige para siempre y tiembla.
  if (d < 2) {
    if (e.facingPuesto !== undefined) e.facing = e.facingPuesto;
    return;
  }
  moveToward(e, e.puesto.x, e.puesto.y, CONFIG.enemy.patrolSpeed, dt, world.map);
}

function doPatrol(e, dt, world) {
  const c = CONFIG.enemy;

  /**
   * "CONVERSANDO" NO GIRA LA CABEZA — Santi: "no debería moverse la cara (el
   * cono de los guardias para localizar)". Cualquier otro guardia quieto
   * (el centinela del blindado, uno "vigilando puerta") sigue con el
   * `scan()` de siempre — están solos, mirar alrededor tiene sentido. Estos
   * dos se están mirando ENTRE ELLOS: girar la cabeza les rompería
   * exactamente lo que se acaba de arreglar (que se vean de frente), y de
   * paso les corriría el cono para cualquier lado sin que se note por qué.
   */
  if (e.path.length === 0) {
    volverAlPuesto(e, dt, world);
    if (!e.conversando) scan(e, dt);
    return;
  }

  if (e.waitTimer > 0) {
    e.waitTimer -= dt;
    scan(e, dt);
    return;
  }

  const waypoint = e.path[e.pathIndex];
  /**
   * `e.ai.patrolSpeed` y no `CONFIG.enemy.patrolSpeed`: un guardia sin perfil
   * propio se comporta exactamente igual que siempre (su `e.ai` ES una copia
   * de CONFIG.enemy), pero la escolta del Sheriff necesita la suya — a 24 px/s
   * no le seguiría el paso a un Sheriff que se repliega a 64 y lo perdería en
   * el primer vagón. Mismo patrón que ya usan la puntería y la sospecha.
   */
  const velocidad = e.ai.patrolSpeed ?? c.patrolSpeed;
  const arrived = moveAxisAligned(e, waypoint.x, waypoint.y, velocidad, dt, world.map);

  if (arrived) {
    e.pathIndex = (e.pathIndex + 1) % e.path.length;
    e.waitTimer = 0.9;   // se para y mira alrededor: ahí es donde te descubre
  }
}

/** Gira la cabeza mientras espera. Sin esto, los pasillos serían seguros. */
function scan(e, dt) {
  e.waitPhase = (e.waitPhase || 0) + dt;
  e.facing += Math.sin(e.waitPhase * 2.2) * 1.4 * dt;
}

function doInvestigate(e, dt, world) {
  const c = CONFIG.enemy;

  // Un guardia marcado nunca baja del piso de sospecha, así que sigue de ronda
  // pero alerta en vez de volver a silbar tranquilo.
  const umbralCalma = e.spooked ? c.spookedFloor + 0.01 : 0.02;
  if (e.suspicion <= umbralCalma) {
    e.state = 'patrol';
    e.stuckTimer = 0;
    e.ruta = null;
    return;
  }

  /**
   * UN DEFENSIVO NO VA A INVESTIGAR: mira desde donde está.
   *
   * Es la otra mitad del arreglo de `doCombat`. Sin esto, la escolta del
   * Sheriff se le despegaba igual, sólo que un paso más tarde: te perdían de
   * vista, pasaban a `suspicious` y se iban caminando hasta el último lugar
   * donde te vieron, que puede ser otro vagón. Custodiar a alguien es
   * quedarse con él, incluso cuando algo se movió allá lejos.
   */
  const dist = distance(e.x, e.y, e.target.x, e.target.y);
  if (dist < 14 || esDefensivo(e)) {
    scan(e, dt);
    const freno = e.spooked ? c.spookedDecayFactor : 1;
    const piso = e.spooked ? c.spookedFloor : 0;
    e.suspicion = Math.max(piso, e.suspicion - c.suspicionDecay * 0.7 * freno * dt);
    return;
  }

  // Con ruta: el objetivo puede estar a cuatro vagones de acá.
  const moved = viajarHacia(e, dt, world, e.target.x, e.target.y, c.speed * 0.8);
  e.stuckTimer = moved < 0.2 ? (e.stuckTimer || 0) + dt : 0;
  if (e.stuckTimer > 2.5) {
    e.state = 'patrol';
    e.stuckTimer = 0;
    e.ruta = null;
  }
}

// ------------------------------------------- el repliegue del herido

/**
 * ¿ESTE GUARDIA SE QUEDA DONDE ESTÁ EN VEZ DE AVANZAR?
 *
 * Dos motivos, el mismo comportamiento: `defensivo` (permanente, la escolta del
 * Sheriff) y `cubriendoTimer` (temporal, el que está tapando a un compañero que
 * se retira). Un solo lugar donde preguntarlo, para que las dos ramas de la IA
 * que lo consultan —`doCombat` y `doInvestigate`— no se puedan desincronizar.
 */
function esDefensivo(e) {
  return !!e.defensivo || e.cubriendoTimer > 0 || !!e.esperandoCompanero;
}

/**
 * NINGÚN GUARDIA ENTRA SOLO AL VAGÓN DONDE ESTÁS.
 *
 * Ver el porqué completo y las mediciones en CONFIG.enemy.esperaCompanero. El
 * resumen: el combate del juego era 258 de 258 muestras de un guardia peleando
 * solo, porque el jugador mata a cada uno (0,42 s con el Colt) antes de que
 * llegue el siguiente.
 *
 * NO HAY UNA RAMA DE MOVIMIENTO NUEVA, y es a propósito: lo único que hace esta
 * función es encender `esperandoCompanero`, que `esDefensivo` ya convierte en
 * "busca cobertura donde está y pelea desde ahí". Es exactamente la conducta que
 * el juego ya tenía para los guardias de adelante (`alertaEnGuardia`) y para la
 * escolta del Sheriff. Lo nuevo es el motivo y el reloj, no el comportamiento.
 *
 * LA CONDICIÓN ES DE VAGÓN, no de distancia: el corte natural del tren es la
 * puerta, no un círculo de píxeles. Un guardia que ya está en tu vagón no
 * espera a nadie — ya está adentro, la decisión de entrar ya la tomó.
 */
function actualizarEspera(e, dt, world) {
  const c = CONFIG.enemy;
  const train = world.train;

  // Los que pelean en formación tienen su propia orden, y el herido que se
  // retira está haciendo justo lo contrario de entrar.
  if (!train || e.defensivo || e.retirandose || e.yaEsperó || e.esJefe || e.esSheriff) {
    e.esperandoCompanero = false;
    return;
  }

  const vJugador = train.wagonAt(world.player.x);
  const vGuardia = train.wagonAt(e.x);
  if (vJugador == null || vGuardia == null || vJugador === vGuardia) {
    e.esperandoCompanero = false;   // ya está adentro: pelea
    return;
  }

  if (tieneConQuienEntrar(e, world)) {
    // Llegó el compañero: entran, y de ahí en más se turnan para asomarse.
    if (e.esperandoCompanero) emparejar(e, world);
    e.esperandoCompanero = false;
    e.yaEsperó = true;
    return;
  }

  if (!e.esperandoCompanero) {
    e.esperandoCompanero = true;
    e.esperaTimer = c.esperaCompanero;
    // Suelta la ruta: si la conserva, al destrabarse sigue caminando hacia una
    // esquina vieja en vez de recalcular desde donde terminó esperando.
    e.ruta = null;
    llamarCompaneros(e, world);
  }

  e.esperaTimer -= dt;
  if (e.esperaTimer <= 0) {
    // Nadie vino. Entra solo, y no vuelve a esperar en toda la partida.
    e.esperandoCompanero = false;
    e.yaEsperó = true;
    e.ruta = null;
  }
}

/**
 * EL QUE NO QUIERE ENTRAR SOLO, LLAMA.
 *
 * 🔍 SALIÓ DE MEDIR POR QUÉ LA ESPERA NO ALCANZABA. De las 13 veces que un
 * guardia terminó de esperar, **5 tenían un compañero a menos de 120px que
 * seguía dormido**: 4 patrullando y 1 investigando. O sea que el que esperaba
 * se plantaba cuatro segundos al lado de alguien que le habría servido, y se
 * iba solo igual porque el otro no se había enterado de nada.
 *
 * Es la conducta más humana de todo este sistema y la más barata: se para en la
 * puerta y **grita para que venga otro**. No hace falta ningún mecanismo nuevo
 * — los gritos existen desde que existe la alarma (`enterCombat`, `alertCombat`,
 * `guardAlerted`), y esto es un grito más, sólo que con un motivo nuevo.
 *
 * ALCANCE CORTO A PROPÓSITO (`radioGrupo`, 120px, no `shoutRadius` 320): está
 * llamando al de al lado para cruzar una puerta, no dando la alarma general. Si
 * usara el radio del grito normal, cada guardia que se planta despertaría medio
 * tren y el sigilo perdería sentido — quedarse callado tiene que seguir sirviendo.
 */
function llamarCompaneros(e, world) {
  const radio = CONFIG.enemy.radioLlamado;
  if (radio <= 0) return;                     // apagado: espera, pero no llama
  const donde = e.lastSeen || { x: world.player.x, y: world.player.y };
  let llamados = 0;

  for (const o of world.enemies) {
    if (o === e || !o.alive || o.esJefe || o.esSheriff || o.escoltaDe) continue;
    if (o.state === 'combat' || o.confinado || o.inconsciente > 0) continue;
    if (distance(e.x, e.y, o.x, o.y) > radio) continue;
    alertCombat(o, donde.x, donde.y, world);
    llamados++;
  }

  if (llamados > 0) world.audio.play('whistle');
}

/** ¿Hay otro guardia peleando lo bastante cerca como para cruzar la puerta juntos? */
function tieneConQuienEntrar(e, world) {
  const radio = CONFIG.enemy.radioGrupo;
  for (const o of world.enemies) {
    if (o === e || !o.alive || o.esJefe || o.retirandose || o.inconsciente > 0) continue;
    if (o.state !== 'combat') continue;
    if (distance(e.x, e.y, o.x, o.y) <= radio) return true;
  }
  return false;
}

/**
 * UNO ENTRA Y EL OTRO CUBRE — reusando entero el turnarse de la escolta del
 * Sheriff (`grupoDefensa`, `companerosAsomados`, `MAX_ASOMADOS`,
 * `ladoPreferido`), que ya está construido y jugado.
 *
 * El grupo es un objeto vacío que sólo sirve de identidad compartida: lo único
 * que `companerosAsomados` hace con él es comparar por igualdad. Y los lados se
 * reparten para que tapen dos ángulos y no dos veces el mismo — la misma razón
 * por la que la escolta lo hace (ver `preferSide` en systems/cover.js).
 */
function emparejar(e, world) {
  const radio = CONFIG.enemy.radioGrupo;
  const grupo = e.grupoDefensa || {};
  e.grupoDefensa = grupo;
  e.ladoPreferido = e.ladoPreferido || 1;

  for (const o of world.enemies) {
    if (o === e || !o.alive || o.esJefe || o.grupoDefensa) continue;
    if (o.state !== 'combat') continue;
    if (distance(e.x, e.y, o.x, o.y) > radio) continue;
    o.grupoDefensa = grupo;
    o.ladoPreferido = -e.ladoPreferido;
    break;                                  // de a dos: es una pareja, no un pelotón
  }
}

/**
 * EL QUE CORTA LA CHARLA ARRASTRA AL OTRO.
 *
 * *(pedido de Santi, jugándolo: "cuando los guardias están hablando y uno se
 * pone en amarillo, después de un segundo, el otro también se tiene que
 * poner en amarillo")*
 *
 * Si el tipo con el que estás hablando corta la frase por la mitad y se queda
 * mirando el pasillo, mirás para donde mira. Antes los dos estaban distraídos
 * por separado y podía pasar que uno te cazara mientras el otro seguía
 * contando su historia — que es exactamente lo que hace que se lean como dos
 * muñecos y no como dos tipos charlando.
 *
 * EL SEGUNDO DE DEMORA (`CONVERSANDO_CONTAGIO`) ES LA MITAD DE LA IDEA: sin
 * él la pareja se alerta junta y en el mismo cuadro, que se ve como un
 * interruptor. Con él se ve la CADENA — uno corta, y recién después el otro
 * se da vuelta —, y ese segundo es la ventana para resolver al primero antes
 * de que sean dos.
 *
 * REUSA `alertTo`, el mismo aviso que ya se pasan los guardias cuando alguien
 * oye un ruido: lo pone amarillo y lo manda a mirar hacia donde su compañero
 * estaba sospechando. Y `alertTo` ya se protege sola de pisar a alguien que
 * está en combate, así que un compañero que ya te vio no se degrada.
 *
 * Se avisa UNA sola vez (`yaAvisoCharla`): pasado eso, cada uno sigue su
 * propio camino. Si el primero se olvida de vos y vuelve a la calma, no hay
 * que "desavisar" nada — el otro ya tiene su propia sospecha, que sube y baja
 * sola como la de cualquiera.
 */
function contagiarCharla(e, dt) {
  if (!e.conversando || e.yaAvisoCharla) return;
  const otro = e.companeroCharla;
  if (!otro || !otro.alive) return;

  // "Se puso en amarillo" es exactamente lo que dibuja `drawEnemy`: la
  // barrita de sospecha aparece pasado 0,04. Se usa el mismo umbral para que
  // el aviso salga cuando el jugador VE que el otro se alertó, no antes.
  const seAlerto = e.state !== 'patrol' || e.suspicion > 0.04;
  if (!seAlerto) { e.charlaAvisoTimer = 0; return; }

  e.charlaAvisoTimer = (e.charlaAvisoTimer || 0) + dt;
  if (e.charlaAvisoTimer < CONVERSANDO_CONTAGIO) return;

  e.yaAvisoCharla = true;
  const donde = e.lastSeen || e.target || { x: e.x, y: e.y };
  alertTo(otro, donde.x, donde.y);
}

/**
 * LA CHARLA — fragmentos sueltos sobre la cabeza de un guardia "conversando"
 * (data/modifiers.js, Fase 3), mientras sigue sin sospechar.
 *
 * *(pedido de Santi, jugando: "debería aparecer el diálogo entre ellos, pero
 * que sea medio cortado, no tan explícito" — para que se note DE UN VISTAZO
 * qué está haciendo, sin escribir una charla entera)*
 *
 * Sólo `charlaLider` (uno de la pareja, world/train.js) corre esto — así no
 * titilan dos textos pegados. Alterna entre un pozo de silencio
 * (`charlaTimer` bajando) y una frase visible (`charlaShowUntil`, un reloj
 * aparte): no es una frase fija pegada arriba de la cabeza todo el rato,
 * aparece y se corta, como charla de verdad.
 *
 * SE APAGA SOLA EN CUANTO ALGO LO SACA DE `patrol` — no hace falta
 * resetear nada a mano: la próxima vez que vuelva a patrullar, arranca un
 * pozo de silencio nuevo antes de la primera frase.
 *
 * `vigilaLider` (vigilando puerta o caja fuerte) NO pasa por acá: es un
 * ESTADO, no una frase suelta — Santi: "quiero que encima de los guardias
 * que vigilan una puerta o una caja fuerte, diga 'vigilando'", fijo, todo
 * el tiempo que dure. Se dibuja directo en `drawEnemy` leyendo `e.state`,
 * sin ningún reloj propio.
 */
function actualizarCharla(e, dt, world) {
  if (!e.charlaLider || e.state !== 'patrol') {
    e.charlaShowUntil = 0;
    return;
  }

  if (e.charlaShowUntil > 0) {
    e.charlaShowUntil -= dt;
    return;
  }

  e.charlaTimer -= dt;
  if (e.charlaTimer <= 0) {
    e.charlaTexto = world.rng.pick(T.ambiente.charla);
    e.charlaShowUntil = 1.8;
    e.charlaTimer = world.rng.range(2.5, 4.5);
  }
}

/**
 * ¿LE ACABAN DE PEGAR, LE QUEDA UN TIRO Y TIENE A ALGUIEN AL LADO?
 *
 * Ver el porqué completo de los cuatro números en CONFIG.enemy.
 * repliegueVidaUmbral. Acá sólo la mecánica.
 *
 * SE EVALÚA CADA CUADRO mientras la vida siga en el umbral y nada se haya
 * decidido todavía — no sólo en el instante del golpe que lo dejó ahí. Hace
 * falta para `soloTimer` (ver abajo): "estuvo solo" tiene que poder medirse
 * sostenido en el tiempo, no en un único cuadro.
 */
function considerarRepliegue(e, dt, world) {
  e.cubriendoTimer = Math.max(0, e.cubriendoTimer - dt);

  if (e.retirandose || e.yaSeReplego || e.rendido || e.yaConsideroRendirse) return;
  if (e.health > CONFIG.enemy.repliegueVidaUmbral) return; // todavía le sobra

  /**
   * LOS QUE PELEAN EN FORMACIÓN NO SE VAN. La escolta del Sheriff existe para
   * no despegarse de él —fue un bug que Santi encontró jugando y costó dos
   * arreglos—, así que un guardia herido que abandona su puesto lo
   * reintroduciría por la puerta de atrás. El Sheriff y el Cazarrecompensas
   * tienen su propia lógica de repliegue y de furia; ninguno pasa por acá.
   */
  if (e.esJefe || e.esSheriff || e.escoltaDe) return;

  const companero = buscarCompanero(e, world);
  if (companero) {
    e.retirandose = true;
    e.yaSeReplego = true;
    e.retiradaTimer = CONFIG.enemy.repliegueCubrirTiempo;
    e.retiradaDestino = destinoDeRetirada(e, world);
    e.ruta = null;

    companero.cubriendoTimer = CONFIG.enemy.repliegueCubrirTiempo;
    return;
  }

  /**
   * SIN COMPAÑERO: no alcanza con estarlo ESTE cuadro — tiene que sostenerse
   * `rendicionSoloMinimo` segundos seguidos (ver la nota completa en
   * CONFIG.enemy.rendicionChanceBase, el 🐛 de la bajada de frecuencia).
   * Si en el medio aparece un compañero, la rama de arriba lo agarra el
   * cuadro siguiente y esto nunca llega a acumularse — no hace falta
   * resetear nada acá.
   */
  e.soloTimer += dt;
  if (e.soloTimer < CONFIG.enemy.rendicionSoloMinimo) return;

  considerarRendicion(e, world);
}

/**
 * SOLO, ACORRALADO, SIN CON QUIÉN REPLEGARSE: se rinde, o no.
 *
 * Ver el porqué completo en CONFIG.enemy.rendicionChanceBase. Acá sólo la
 * mecánica: la chance sube o baja con `gameState.honor` (cómo te ven), así
 * que la rendición termina siendo la primera cosa jugable que ese número
 * mueve de verdad.
 */
function considerarRendicion(e, world) {
  e.yaConsideroRendirse = true;

  const c = CONFIG.enemy;
  const chance = Math.max(
    c.rendicionChanceMin,
    Math.min(c.rendicionChanceMax, c.rendicionChanceBase + gameState.honor * c.rendicionPorHonor)
  );
  if (!world.rng.chance(chance)) return;

  e.rendido = true;
  e.peeking = false;
  e.aimTimer = 0;
  e.burstLeft = 0;
  e.ruta = null;
  e.traicionCheckTimer = CONFIG.enemy.traicionCheckCada;
  world.bus.emit('enemySurrendered', { enemy: e });
}

/**
 * LA TRAICIÓN — ver el porqué completo en CONFIG.enemy.traicionCheckCada.
 * Acá sólo la mecánica: mientras sigue rendido, re-chequea cada tanto (y
 * sólo si te alejaste); si sale, arranca a pararse, y el propio `dt` que se
 * suma en `traicionProgreso` es la ventana de reacción del jugador.
 */
function considerarTraicion(e, dt, world) {
  const c = CONFIG.enemy;

  if (e.traicionLevantando) {
    e.traicionProgreso += dt;
    if (e.traicionProgreso >= c.traicionDuracion) dispararPorLaEspalda(e, world);
    return;
  }

  e.traicionCheckTimer -= dt;
  if (e.traicionCheckTimer > 0) return;
  e.traicionCheckTimer = c.traicionCheckCada;

  // "Por la espalda" necesita que se la hayas dado de verdad — encañonado no se anima a nada.
  if (distance(e.x, e.y, world.player.x, world.player.y) < c.traicionRadioMinimo) return;

  const chance = Math.max(
    c.traicionChanceMin,
    Math.min(c.traicionChanceMax, c.traicionChanceBase + gameState.bounty * c.traicionPorBounty)
  );
  if (!world.rng.chance(chance)) return;

  e.traicionLevantando = true;
  e.traicionProgreso = 0;
  world.audio.play('cock');
}

/** Terminó de pararse sin que lo tocaras: el tiro por la espalda de verdad. */
function dispararPorLaEspalda(e, world) {
  e.rendido = false;
  e.traicionLevantando = false;
  e.state = 'combat';
  e.suspicion = 1;
  e.alertMark = 1;
  e.facing = Math.atan2(world.player.y - e.y, world.player.x - e.x);

  world.audio.play('enemyShot');
  world.bus.emit('noise', { x: e.x, y: e.y, radius: world.train ? world.train.hearRadius : CONFIG.enemy.hearRadius });

  const p = world.player;
  if (!p.alive) return;
  // Punto en blanco, sin apuntado ni dispersión: el aviso ya era el cuerpo
  // parándose, no un ángulo que se pueda esquivar corriendo.
  const hurt = damagePlayer(p, 1, e.x, e.y);
  if (hurt) {
    world.bus.emit('impact', { x: p.x, y: p.y, kind: 'flesh' });
    world.bus.emit('playerHit', { x: p.x, y: p.y });
    if (!p.alive) world.bus.emit('playerDown', {});
  }
}

/**
 * EL COMPAÑERO QUE LO CUBRE: el más cercano dentro del radio.
 *
 * NO PUEDE ESTAR PATRULLANDO. Un tipo que todavía silba tranquilo no te está
 * cubriendo nada, aunque esté al lado — pedirle que cuente sería inventar una
 * coordinación que el jugador no puede ver. Alcanza con que esté enterado
 * (`suspicious` o `combat`), que es lo normal a 90px de un tiroteo: el disparo
 * que hirió a éste se oye a `hearRadius` (230).
 *
 * Y no puede estar retirándose él mismo: dos heridos yéndose no son una
 * maniobra, son una desbandada.
 */
function buscarCompanero(e, world) {
  const radio = CONFIG.enemy.repliegueRadioCompanero;
  let mejor = null;
  let mejorDist = Infinity;

  for (const o of world.enemies) {
    if (o === e || !o.alive || o.esJefe || o.inconsciente > 0 || o.rendido) continue;
    if (o.retirandose || o.state === 'patrol') continue;

    const d = distance(e.x, e.y, o.x, o.y);
    if (d > radio || d >= mejorDist) continue;
    mejor = o;
    mejorDist = d;
  }
  return mejor;
}

/**
 * HACIA DÓNDE SE VA: a lo largo del pasillo, alejándose del jugador.
 *
 * Es la misma lección que dejó la escolta del Sheriff (ver `puestoDeEscolta` en
 * systems/sheriff.js): **el tren no es un espacio abierto, es un CORREDOR de
 * dos filas de alto**. Retroceder "en la dirección opuesta al jugador" a secas
 * mandaría al guardia contra una fila de asientos cada vez que lo tengas de
 * costado, y se quedaría trabado empujando una pared. Se retira por el eje del
 * pasillo (`techo.centroY`), que es el único lugar por el que el tren entero se
 * puede recorrer.
 *
 * EL DESTINO SE FIJA UNA SOLA VEZ, al empezar. Recalcularlo cada cuadro haría
 * que `viajarHacia` tirara la ruta y la rehiciera sin parar (compara contra el
 * destino anterior con un margen de 40px), y de paso volvería la retirada
 * infinita mientras lo persigas. Si lo seguís, lo que corta la maniobra es el
 * reloj (`retiradaTimer`), no la geometría.
 */
function destinoDeRetirada(e, world) {
  /**
   * 🐛 PRIMERO UNA COBERTURA DE VERDAD — antes esta función devolvía SIEMPRE un
   * punto del eje del pasillo (`techo.centroY`), o sea el lugar más expuesto del
   * vagón. El guardia se replegaba... al descubierto.
   *
   * *(Santi: "no se repliega hasta una cobertura más atrás")*
   *
   * `findCoverAtras` (systems/cover.js) es el buscador escrito para esto: sólo
   * mira baldosas que lo ALEJEN del jugador, al revés del buscador normal, que
   * puntúa la cobertura ideal a 80px del blanco y por eso lo traía de vuelta.
   */
  const ocupadas = [];
  for (const o of world.enemies) {
    if (o !== e && o.alive && o.coverPoint) ocupadas.push(o.coverPoint);
  }

  const cobertura = findCoverAtras(
    world.map, e.x, e.y, world.player.x, world.player.y, ocupadas
  );
  if (cobertura) return { x: cobertura.x, y: cobertura.y, cobertura };

  /**
   * SIN COBERTURA ATRÁS, se retira igual por el pasillo — el comportamiento
   * viejo, ahora como red de seguridad y no como plan principal. Hay vagones
   * enteros donde no hay de dónde agarrarse (el de ganado, los tramos vacíos
   * del correo), y ahí "no puede replegarse a ningún lado" no puede significar
   * que se quede parado recibiendo el tiro de gracia.
   */
  const dir = e.x >= world.player.x ? 1 : -1;
  return {
    x: e.x + dir * CONFIG.enemy.repliegueDistancia,
    y: CONFIG.techo.centroY,
    cobertura: null,
  };
}

/**
 * CAMINA SIN DISPARAR HASTA SACARSE DEL MEDIO.
 *
 * Igual que `reagruparse` (systems/sheriff.js) y por la misma razón: mientras
 * se va está expuesto, y ésa es tu ventana para castigarlo. Todo lo que hace un
 * enemigo en este juego tiene un momento en que se le puede pegar.
 *
 * Y ESO ES TAMBIÉN LA ÚNICA SEÑAL, a propósito: no hay ícono ni marca nueva
 * sobre la cabeza. Un guardia rojo que te da la espalda y camina para el otro
 * lado sin tirar un tiro ya dice todo lo que hay que entender. El juego reserva
 * los avisos dibujados para lo que te puede lastimar (la mecha, la embestida,
 * el arma levantada); esto es lo contrario de un peligro.
 *
 * TERMINA POR DISTANCIA O POR RELOJ. El reloj es el que evita el caso feo: un
 * guardia del blindado está `confinado` a su vagón, así que puede llegar al
 * borde y no poder alejarse un píxel más — sin tope, se quedaría empujando la
 * pared para siempre.
 */
function retirarseHerido(e, dt, world) {
  const c = CONFIG.enemy;
  e.retiradaTimer -= dt;

  const meta = e.retiradaDestino;

  /**
   * SI VA HACIA UNA COBERTURA, LA META ES LLEGAR — no alejarse N píxeles.
   *
   * Antes el único criterio de fin era la distancia al jugador
   * (`repliegueDistancia`), y con una cobertura como destino eso cortaba la
   * retirada A MITAD DE CAMINO: el guardia cruzaba los 110px un paso antes de
   * llegar al asiento, la IA normal retomaba y ya nunca terminaba de meterse
   * detrás. Es la otra mitad de lo que Santi vio ("no termina de llegar").
   */
  if (meta && meta.cobertura) {
    if (distance(e.x, e.y, meta.x, meta.y) < 6) {
      e.retirandose = false;
      e.ruta = null;
      e.defensivo = true;
      // Se queda EN la cobertura a la que se replegó: se la damos hecha, con su
      // asomada ya calculada, para que no salga a buscar otra (y termine
      // eligiendo una más adelante, que es de donde venía el bug).
      e.coverPoint = { x: meta.x, y: meta.y };
      e.atCover = true;
      e.peeking = false;
      e.repositionTimer = 0;
      e.holdTimer = world.rng.range(c.coverHoldMin, c.coverHoldMax);
      choosePeekSide(e, world, world.player);
      return;
    }
  }

  const lejos = !(meta && meta.cobertura) &&
    distance(e.x, e.y, world.player.x, world.player.y) >= c.repliegueDistancia;

  if (lejos || e.retiradaTimer <= 0 || !e.retiradaDestino) {
    e.retirandose = false;
    e.ruta = null;
    e.repositionTimer = c.repositionAfter;   // que se busque cobertura ya mismo

    /**
     * 🐛 EL QUE SE REPLEGÓ NO VUELVE A AVANZAR — y sin esta línea, deshacía
     * el repliegue entero delante de tus ojos.
     *
     * *(Santi, jugándolo: "cuando un guardia se repliega es como que no termina
     * de replegarse. Camina hacia la cobertura de atrás pero no termina de
     * llegar y ya se devuelve a exactamente donde estaba")*
     *
     * LA CAUSA, medida cuadro a cuadro: la retirada termina en
     * `repliegueDistancia` (110px)... y ahí `doCombat` retoma el mando, ve que
     * 110 > 92 y **lo camina de vuelta hacia el jugador hasta los 92px**, que es
     * el umbral de acercamiento que esta función ya tenía desde siempre. Medido:
     * se alejaba a 111 y volvía a 92 — **19px de retroceso deshecho**, y encima
     * quedaba plantado ahí sin cobertura.
     *
     * O sea que el 110 estaba elegido del lado equivocado de un número que ya
     * existía: se miró `spreadFarDistance` (130) y no se miró este 92. Dos
     * sistemas tirando del mismo guardia para lados opuestos.
     *
     * SE ARREGLA CON LA CONDUCTA, NO CON EL NÚMERO. Subir los 110 por encima de
     * 92 lo haría caminar menos de vuelta, pero seguiría caminando de vuelta.
     * Un tipo que se acaba de quebrar y salir del tiroteo **no vuelve a cargar
     * de frente**: se queda donde llegó, peleando parapetado. Es `defensivo`, la
     * misma marca de la escolta del Sheriff, y ahora también la cicatriz de
     * haberse replegado — la única que no se apaga nunca.
     *
     * Y le da al jugador algo concreto por haberlo herido: **ese guardia deja de
     * presionarte**. Sigue tirando, pero ya no te viene encima.
     */
    e.defensivo = true;
    return;
  }

  // Suelta la pelea entera: nadie retrocede apuntando.
  e.aimTimer = 0;
  e.burstLeft = 0;
  e.peeking = false;
  e.coverPoint = null;
  e.atCover = false;

  viajarHacia(e, dt, world, e.retiradaDestino.x, e.retiradaDestino.y, c.speed);
}

// ------------------------------------------------------------------ combate

function peekPosition(e) {
  return {
    x: e.coverPoint.x + e.peekAxis.x * e.peekOffset * e.peekSide,
    y: e.coverPoint.y + e.peekAxis.y * e.peekOffset * e.peekSide,
  };
}

/**
 * CUÁNTOS DE SU GRUPO ESTÁN EXPUESTOS AHORA MISMO.
 *
 * Sólo tiene sentido para los que pelean en formación (hoy: el Sheriff y su
 * escolta, marcados con `grupoDefensa`). Ver `MAX_ASOMADOS` más abajo.
 */
function companerosAsomados(e, world) {
  let n = 0;
  for (const o of world.enemies) {
    if (o === e || !o.alive || o.grupoDefensa !== e.grupoDefensa) continue;
    if (o.peeking) n++;
  }
  return n;
}

/**
 * CUÁNTOS DE UN GRUPO PUEDEN ESTAR ASOMADOS A LA VEZ.
 *
 * *(Santi: "también cubrirse entre ellos: si uno se asoma del lado izquierdo,
 * otro lo cubre del lado derecho")*
 *
 * Dos, y no uno, a propósito. Con uno solo la formación entera dispara un
 * cuarto del tiempo y deja de ser una amenaza; con todos, es un pelotón de
 * fusilamiento y no hay nadie cubriendo. Dos es lo que se lee como lo que
 * Santi pidió: una pareja expuesta, cada uno por su lado (ver `preferSide` en
 * systems/cover.js), y el resto tapado esperando su turno.
 */
const MAX_ASOMADOS = 2;

/**
 * EL CUPO ES PROPORCIONAL AL TAMAÑO DEL GRUPO — la mitad, redondeando arriba.
 *
 * Antes era la constante 2, y estaba bien porque el único grupo del juego era
 * el Sheriff con sus tres (4 miembros → 2, idéntico a hoy: **este cambio no le
 * toca un solo número a esa pelea, que ya está afinada y jugada**).
 *
 * Pero ahora también hay PAREJAS (`emparejar`), y con un cupo fijo de 2 los dos
 * miembros de una pareja se asomaban a la vez: o sea nadie cubría a nadie, que
 * es exactamente lo que la pareja venía a resolver. Con la mitad, un dúo tiene
 * cupo 1 —uno se asoma, el otro lo tapa— y el cuarteto del Sheriff conserva su 2.
 */
function cupoDeAsomados(e, world) {
  let miembros = 0;
  for (const o of world.enemies) {
    if (o.alive && o.grupoDefensa === e.grupoDefensa) miembros++;
  }
  return Math.max(1, Math.min(MAX_ASOMADOS, Math.ceil(miembros / 2)));
}

export function doCombat(e, dt, world) {
  // e.ai: acá se lee coverHoldMin/Max, que también cambia por guardia.
  const c = e.ai;
  const player = world.player;

  /**
   * ANTES QUE NADA: si le queda un tiro de vida y alguien lo está cubriendo, se
   * está yendo. Es la única conducta que le gana a todo el resto del combate —
   * incluida la ráfaga de pánico, que es la respuesta del guardia que decide
   * quedarse. Ver CONFIG.enemy.repliegueVidaUmbral.
   */
  if (e.retirandose) {
    retirarseHerido(e, dt, world);
    if (e.retirandose) return;
  }

  /**
   * ¿Está por cruzar al vagón donde estás, y viene solo? Entonces espera. No
   * retorna: sólo enciende `esperandoCompanero`, y el resto de esta función ya
   * lo trata como defensivo (busca cobertura y pelea desde donde está).
   */
  actualizarEspera(e, dt, world);

  /**
   * VA HACIA SU PUERTA (ver `alertaEnPuerta`, más arriba). Tiene que resolverse
   * ACÁ, antes que nada más — si esperara a la rama normal de movimiento (más
   * abajo), el reloj de "hace cuánto que no te veo" (`lostTimer`/`loseTargetTime`)
   * correría en paralelo sin que `engaged` sea nunca `true` (nunca te vio: sólo
   * lo alertó la alarma), y a los pocos segundos lo devolvería solo a
   * `suspicious` — deshaciendo el rojo antes de que llegue a la puerta.
   *
   * Mientras camina no dispara (no tiene sentido buscarle línea de tiro a un
   * blanco que todavía no vio): sólo llega. Al entrar en los 6px del marco, se
   * marca `defensivo` (permanente, la misma marca que ya usa la escolta del
   * Sheriff) y ESTE MISMO CUADRO sigue de largo a la lógica normal de combate,
   * ya plantado — no hace falta esperar al cuadro siguiente.
   */
  if (e.vaHaciaPuerta) {
    if (distance(e.x, e.y, e.puertaDestino.x, e.puertaDestino.y) < 6) {
      e.vaHaciaPuerta = false;
      e.defensivo = true;
    } else {
      viajarHacia(e, dt, world, e.puertaDestino.x, e.puertaDestino.y, c.speed);
      return;
    }
  }

  // Desde dónde mira: si está parapetado, mira desde donde se asomaría.
  const probe = e.atCover && e.coverPoint ? peekPosition(e) : { x: e.x, y: e.y };
  const engaged = player.alive &&
    canSeeFrom(probe.x, probe.y, e.facing, player, world.map, false);

  if (engaged) {
    e.lostTimer = 0;
    e.lastSeen = { x: player.x, y: player.y };
    e.suppressionLeft = 1;   // se guarda una ráfaga para cuando te pierda
  } else {
    e.lostTimer += dt;
    // El que vio un cadáver te busca el doble de tiempo antes de aflojar.
    const paciencia = c.loseTargetTime * (e.spooked ? c.spookedPatience : 1);
    if (e.lostTimer > paciencia) {
      e.state = 'suspicious';
      e.target = e.lastSeen ? { ...e.lastSeen } : { x: e.x, y: e.y };
      e.suspicion = 0.9;
      e.coverPoint = null;
      e.atCover = false;
      e.peeking = false;
      e.aimTimer = 0;
      return;
    }
    // No te ve, pero si lo único que se interpone es una puerta cerrada
    // (no una pared, no un asiento), le sigue tirando a través. Corre en
    // paralelo a todo lo demás: no hace falta estar parapetado para esto.
    dispararACiegasPorPuerta(e, dt, world);
    dispararACiegasPorTecho(e, dt, world);
  }

  // De cerca no dispara: te caga a golpes. En el techo esto no aplica: un
  // guardia adentro del vagón no te puede alcanzar a golpes ahí arriba.
  if (player.alive && !player.enTecho && distance(e.x, e.y, player.x, player.y) < c.meleeRange) {
    doEnemyMelee(e, dt, world);
    return;
  }
  if (e.meleeWindup > 0) e.meleeWindup = 0;

  // ¿Te tiene parapetado y tiene con qué sacarte de ahí? Entonces la dinamita.
  if (consideraTirarDinamita(e, dt, world)) return;

  const aimAt = e.lastSeen || player;
  turnTowards(e, Math.atan2(aimAt.y - e.y, aimAt.x - e.x), dt, 10);

  /**
   * EL PÁNICO — tercera versión. Ya no es "está cerca": es "lo vi, está
   * expuesto, y viene derecho hacia mí". Ver CONFIG.enemy.panicoCoseno para
   * el porqué completo de las tres condiciones y la historia de las dos
   * versiones anteriores.
   */
  let enPanico = false;
  if (engaged && !isHidden(player)) {
    // 🐛 Iba al revés: "hacia el guardia" tiene que medirse DESDE el
    // jugador (e - player), no desde el guardia hacia el jugador
    // (player - e). Con el signo invertido, el coseno daba NEGATIVO justo
    // cuando el jugador cargaba de verdad — el pánico nunca se activaba.
    const dx = e.x - player.x, dy = e.y - player.y;
    const dist = Math.hypot(dx, dy);
    const mag = Math.hypot(player.moveDirX || 0, player.moveDirY || 0);
    if (dist > 0.01 && mag > 0.01) {
      // Coseno del ángulo entre "hacia dónde camina" y "hacia el guardia".
      const dot = (player.moveDirX / mag) * (dx / dist) + (player.moveDirY / mag) * (dy / dist);
      enPanico = dot > c.panicoCoseno;
    }
  }

  // --- Buscar cobertura ---
  e.repositionTimer = (e.repositionTimer || 0) + dt;
  /**
   * EL QUE SE REPLEGÓ SE AFERRA A SU COBERTURA: sólo busca una si no tiene
   * ninguna, nunca por reubicarse.
   *
   * 🐛 Sin esto, el arreglo del repliegue se pasaba de largo para el otro lado.
   * `repositionAfter` (7 s) lo mandaba a buscar otra cobertura, y como para un
   * replegado el buscador sólo acepta las que lo ALEJAN, se iba retrocediendo en
   * escalones cada siete segundos — medido: 130 → 149 → 167 px, hasta terminar
   * sin cobertura ninguna, caminando de espaldas para siempre.
   *
   * Replegarse es UN movimiento, no una huida permanente: se mete detrás de algo
   * y ahí se queda. Perdió el terreno, no lo recupera — y tampoco sigue cediendo.
   */
  /**
   * EL QUE NO SE CUBRE (hoy: el Pistolero, ver data/guards.js) SE QUEDA AL
   * DESCUBIERTO **MIENTRAS TENGA TIRO**.
   *
   * *(Santi, definiéndolo: "se cubre poco, se suele parar en medio del
   * pasillo")*
   *
   * Mientras te tiene a tiro no se le busca ninguna cobertura, así que
   * `coverPoint` queda en null y cae solo en la rama de "sin cobertura" del
   * final de esta misma función — la que se acerca hasta unos 92px y ahí
   * dispara parado. Esa rama existe desde la fase 2 para el guardia al que no
   * le quedaba ninguna cobertura libre; acá es el plan, no el resto.
   *
   * 🐛 PERO SI NO TIENE TIRO, ANTES SE QUEDABA CLAVADO SIN HACER NADA.
   *
   * *(Santi, jugándolo: "hay veces que se para en medio del pasillo y empieza
   * a dispararme. Pero luego se frena, no sé qué será eso. Si es un bug
   * soluciónalo, sino lo es: que se meta detrás de una cobertura")*
   *
   * ERA UN BUG, Y NACÍA DE SU PROPIA VIRTUD. Plantarse en el medio del
   * pasillo lo pone justo donde caminan sus compañeros para llegar hasta vos,
   * así que cada dos por tres uno se le cruza por delante. Con un compañero
   * en la línea, `tryFire` no dispara (`allyInLine`) — y como este guardia
   * nunca busca cobertura ni se reubica, tampoco hacía nada para resolverlo:
   * se quedaba ahí parado. Medido, con un compañero metido en el medio: de
   * **2,6 balas por segundo a 0,2**, y **100% del tiempo quieto**. Un guardia
   * normal sale de eso solo, cambiando de cobertura (ver `holdCoverAndFire`,
   * que ante un compañero en la línea se manda a buscar otro ángulo).
   *
   * SON DOS PROBLEMAS DISTINTOS Y TIENEN DOS RESPUESTAS DISTINTAS:
   *
   *  - **No te ve** (te cubriste, cruzaste una puerta, se cortó la línea):
   *    ahí no hay nada que hacer parado en el medio del pasillo, así que
   *    después de `descubiertoBloqueoMax` segundos se cubre como cualquiera
   *    — es lo que pidió Santi. Apenas te vuelve a ver, suelta la cobertura
   *    y vuelve al pasillo: no pierde su identidad, la recupera enseguida.
   *  - **Te ve pero tiene un compañero en la línea**: ahí SÍ hay algo que
   *    hacer, y esconderse no es. Se corre al costado para recuperar el
   *    ángulo (más abajo, en la rama de "sin cobertura"). Buscar cobertura
   *    tampoco lo resolvería: medido, en el medio del pasillo muchas veces
   *    no hay ninguna libre, y se quedaba clavado igual — el reloj de
   *    bloqueo llegaba a 9 segundos y `findCoverPoint` devolvía null.
   */
  let tapadoPorCompanero = false;
  if (e.evitaCobertura) {
    tapadoPorCompanero = engaged && allyInLine(e, world, aimAt.x, aimAt.y);
    if (engaged) {
      e.bloqueadoTimer = 0;
      // Vuelve al medio del pasillo: suelta lo que haya tomado mientras no veía.
      if (e.coverPoint) {
        e.coverPoint = null;
        e.atCover = false;
        e.peeking = false;
      }
    } else {
      e.bloqueadoTimer = (e.bloqueadoTimer || 0) + dt;
    }
  }

  /**
   * OJO QUE NADA DE ESTO LE SACA EL REPLIEGUE DEL HERIDO: `retirarseHerido`
   * le pone un `coverPoint` por su cuenta, más arriba, y desde ahí sigue el
   * camino de siempre. Un pistolero al que le queda un tiro de vida y tiene
   * quién lo cubra se retira igual que cualquiera — lo que no hace es
   * cuidarse mientras está entero y con tiro.
   */
  const alDescubierto = e.evitaCobertura &&
    (e.bloqueadoTimer || 0) < CONFIG.enemy.descubiertoBloqueoMax;

  const needsCover = !alDescubierto && (
    !e.coverPoint ||
    (!e.yaSeReplego && e.atCover && e.repositionTimer > c.repositionAfter)
  );

  if (needsCover) {
    const taken = [];
    for (const other of world.enemies) {
      if (other !== e && other.alive && other.coverPoint) taken.push(other.coverPoint);
    }
    /**
     * EL QUE YA SE REPLEGÓ NO VUELVE A GANAR TERRENO, NI CAMBIANDO DE COBERTURA.
     *
     * 🐛 Ésta era la tercera vía por la que se deshacía el repliegue, y la más
     * escondida: aunque quedara `defensivo` (o sea sin caminar hacia el jugador)
     * y aunque llegara a su cobertura, a los `repositionAfter` (7 s) la IA lo
     * mandaba a buscar otra — y `findCoverPoint` puntúa su cobertura ideal a
     * 80px del blanco, así que la "mejor" era casi siempre una más adelante.
     * Se replegaba, y medio minuto después estaba otra vez encima tuyo, sin que
     * se viera ninguna decisión de por medio.
     *
     * Ahora un replegado sólo acepta coberturas que NO lo acerquen; si no hay
     * ninguna, se queda con la que tiene. Perdió el terreno y no lo recupera.
     */
    const spot = e.yaSeReplego
      ? (findCoverAtras(world.map, e.x, e.y, aimAt.x, aimAt.y, taken) || e.coverPoint)
      : findCoverPoint(world.map, e.x, e.y, aimAt.x, aimAt.y, taken);

    // El contador se reinicia SIEMPRE que se buscó. Si no, cuando la mejor
    // cobertura resultaba ser la que ya tenía, el guardia volvía a buscar en
    // cada cuadro y no se reubicaba nunca.
    e.repositionTimer = 0;

    if (!spot) {
      e.coverPoint = null;
    } else if (!e.coverPoint || distance(spot.x, spot.y, e.coverPoint.x, e.coverPoint.y) > 8) {
      e.coverPoint = spot;
      e.atCover = false;
      e.peeking = false;
    }
  }

  if (e.coverPoint && !e.atCover) {
    const moved = moveToward(e, e.coverPoint.x, e.coverPoint.y, c.speed, dt, world.map);
    e.stuckTimer = moved < 0.2 ? (e.stuckTimer || 0) + dt : 0;

    if (distance(e.x, e.y, e.coverPoint.x, e.coverPoint.y) < 6) {
      e.atCover = true;
      e.stuckTimer = 0;
      e.holdTimer = world.rng.range(c.coverHoldMin * 0.4, c.coverHoldMax * 0.6);
      choosePeekSide(e, world, aimAt);
    } else if (e.stuckTimer > 1.2) {
      e.coverPoint = null;      // no llega: que pelee a campo abierto
      e.stuckTimer = 0;
    }

    /**
     * "SI EL GUARDIA ESTÁ SIN COBERTURA, DISPARARÁ LA RÁFAGA MIENTRAS SE
     * MUEVE A UNA" — no abandona el plan de llegar a cubrirse, dispara A LA
     * VEZ que camina. `turnTowards` hacia el jugador de nuevo porque
     * `moveToward` ya giró a `e.facing` hacia la cobertura (hacia dónde
     * camina), y si va a disparar tiene que vérselo apuntando a quien le
     * está tirando, no a la silla.
     */
    if (enPanico && engaged) {
      turnTowards(e, Math.atan2(aimAt.y - e.y, aimAt.x - e.x), dt, 10);
      tryFire(e, dt, world, aimAt, enPanico);
    }
    return;
  }

  if (e.coverPoint && e.atCover) {
    holdCoverAndFire(e, dt, world, engaged, aimAt, enPanico);
    return;
  }


  // --- Sin cobertura: avanza y dispara ---
  // Si el objetivo está lejos (otro vagón), va con ruta. De cerca, derecho:
  // calcular una ruta para tres pasos sería tonto y se vería robótico.
  //
  /**
   * SALVO QUE SEA DEFENSIVO: ÉSOS NO AVANZAN NUNCA.
   *
   * *(Santi: "los guardias del Sheriff no deberían ir a atacar, deberían estar
   * en estado defensivo: esperar cubiertos, asomarse y disparar")*
   *
   * Era el bug que los despegaba del Sheriff: `updateEscolta` sólo les
   * reescribe la ronda mientras NO están en combate, así que apenas te veían
   * caían en esta rama y te cargaban de frente por el pasillo — dejando solo
   * justo al tipo que tenían que custodiar. Un defensivo se queda donde está,
   * busca cobertura ahí nomás y te trabaja a tiros; el terreno lo tenés que
   * ganar vos. Todo lo demás (ver, sospechar, gritar, cubrirse, disparar,
   * morir) sigue siendo la IA de guardia de siempre, sin una línea aparte.
   *
   * Y AHORA TIENE UN SEGUNDO USO, temporal: el guardia que está cubriendo a un
   * compañero herido que se retira (`cubriendoTimer`, ver `esDefensivo`).
   * Quedarse plantado sosteniendo el pasillo ES cubrir; si avanzara hacia vos,
   * dejaría al que se está yendo con la espalda descubierta. La misma conducta
   * ya construida, con otro motivo y con reloj.
   */
  const dist = distance(e.x, e.y, aimAt.x, aimAt.y);
  if (tapadoPorCompanero) {
    /**
     * SE CORRE AL COSTADO PARA RECUPERAR EL ÁNGULO.
     *
     * Sólo lo hace el que no se cubre (el Pistolero): plantarse en el medio
     * del pasillo lo pone justo donde caminan sus compañeros, así que cada
     * dos por tres tiene a uno tapándole el tiro — y sin esto se quedaba
     * esperando, quieto y sin disparar, hasta que el otro se corriera solo.
     *
     * Un paso perpendicular a la línea de tiro es lo que haría cualquiera, y
     * además lo saca del centro del pasillo, que es de donde venía el
     * problema. Si choca contra algo (un asiento, la pared), prueba el otro
     * lado — así no se queda empujando una pared para siempre.
     *
     * No es una conducta que haya que apagar cuando el compañero se corre:
     * apenas recupera la línea, `tapadoPorCompanero` es false y esta rama
     * deja de correr sola.
     */
    if (!e.ladoEsquive) e.ladoEsquive = world.rng.chance(0.5) ? 1 : -1;
    const ang = Math.atan2(aimAt.y - e.y, aimAt.x - e.x);
    const nx = -Math.sin(ang) * e.ladoEsquive;
    const ny = Math.cos(ang) * e.ladoEsquive;
    const movido = moveToward(e, e.x + nx * 24, e.y + ny * 24, c.speed, dt, world.map);
    if (movido < 0.2) {
      /**
       * NO PUDO CORRERSE: el pasillo es angosto y a los costados hay
       * asientos. Entonces se ADELANTA — la única salida que siempre existe,
       * porque el camino hacia el jugador está abierto por definición (es por
       * donde vino el compañero). Medido: sin esto, en un pasillo cerrado el
       * paso al costado chocaba contra el asiento, cambiaba de lado, chocaba
       * contra el otro, y se quedaba oscilando en el lugar el 93% del tiempo.
       *
       * Y es lo que haría este personaje: el que no se cubre tampoco espera
       * turno.
       */
      e.ladoEsquive = -e.ladoEsquive;
      moveToward(e, aimAt.x, aimAt.y, c.speed, dt, world.map);
    }
    turnTowards(e, ang, dt, 10);
  } else if (esDefensivo(e)) {
    // Nada: se queda en su puesto. Si tiene tiro, dispara igual (abajo).
  } else if (dist > c.routeDistance) {
    viajarHacia(e, dt, world, aimAt.x, aimAt.y, c.speed);
  } else if (dist > 92) {
    moveToward(e, player.x, player.y, c.speed, dt, world.map);
  }

  if (engaged) tryFire(e, dt, world, aimAt, enPanico);
  else e.aimTimer = 0;
}

/** Golpe cuerpo a cuerpo del guardia: levanta el brazo y después pega. */
function doEnemyMelee(e, dt, world) {
  const c = CONFIG.enemy;
  const player = world.player;

  e.aimTimer = 0;
  e.peeking = false;
  e.burstLeft = 0;
  turnTowards(e, Math.atan2(player.y - e.y, player.x - e.x), dt, 12);

  if (e.meleeWindup > 0) {
    e.meleeWindup -= dt;
    if (e.meleeWindup <= 0) {
      e.meleeTimer = c.meleeCooldown;
      // Si te corriste a tiempo, pega al aire.
      if (distance(e.x, e.y, player.x, player.y) < c.meleeRange + 5) {
        if (damagePlayer(player, c.meleeDamage, e.x, e.y)) {
          world.audio.play('melee');
          world.bus.emit('playerHit', { x: player.x, y: player.y });
          if (!player.alive) world.bus.emit('playerDown', {});
        }
      } else {
        world.audio.play('swing');
      }
    }
    return;
  }

  if (e.meleeTimer <= 0) {
    e.meleeWindup = c.meleeWindup;
    world.audio.play('swing');
  }
}

/**
 * Recalcula cómo asomarse (el objetivo se mueve).
 * Devuelve false si desde esta cobertura ya no hay tiro posible: entonces el
 * guardia la abandona y busca otra en vez de quedarse trabado.
 */
function choosePeekSide(e, world, aimAt) {
  // `ladoPreferido` sólo lo traen los que pelean en formación (la escolta del
  // Sheriff): se reparten los lados para tapar dos ángulos y no dos veces el
  // mismo. Un guardia suelto no lo tiene y prueba en el orden de siempre.
  const peek = findPeek(
    world.map, e.coverPoint, aimAt.x, aimAt.y, e.ai.peekSteps, e.ladoPreferido || 1
  );
  if (!peek) {
    e.coverPoint = null;
    e.atCover = false;
    e.peeking = false;
    e.repositionTimer = 0;
    return false;
  }
  e.peekAxis = peek.axis;
  e.peekSide = peek.side;
  e.peekOffset = peek.offset;
  return true;
}

function holdCoverAndFire(e, dt, world, engaged, aimAt, enPanico) {
  const c = e.ai;   // coverHoldMin/Max: cuánto se esconde entre ráfaga y ráfaga
  const anchor = e.peeking ? peekPosition(e) : e.coverPoint;

  // Se mueve entre estar tapado y estar asomado.
  moveToward(e, anchor.x, anchor.y, c.speed * 1.4, dt, world.map);
  turnTowards(e, Math.atan2(aimAt.y - e.y, aimAt.x - e.x), dt, 10);

  if (e.peeking) {
    tryFire(e, dt, world, aimAt, enPanico);
    if (e.burstLeft <= 0 && e.aimTimer <= 0 && e.cooldown > 0) {
      e.peeking = false;
      /**
       * EN PÁNICO NO VUELVE A ESCONDERSE — ver CONFIG.enemy.panicoDistancia.
       * `holdTimer` en 0 significa que la próxima vuelta de `holdCoverAndFire`
       * se asoma apenas se cumpla `e.cooldown` (el mismo que separa cualquier
       * ráfaga de la siguiente): no hay una segunda espera encima.
       */
      e.holdTimer = enPanico ? 0 : world.rng.range(c.coverHoldMin, c.coverHoldMax);
    }
    return;
  }

  e.holdTimer -= dt;
  // Con la paciencia agotada, no hace falta ni terminar de contar: si te
  // cruzaste de cerca a mitad de la espera, la espera se corta ahí mismo.
  if (enPanico) e.holdTimer = Math.min(e.holdTimer, 0);

  if (e.holdTimer <= 0 && e.cooldown <= 0) {
    /**
     * No dispara a ciegas.
     *
     * Antes, un guardia parapetado seguía asomándose y tirando a tu última
     * posición conocida durante más de tres segundos, aunque estuvieras en la
     * otra punta del vagón. Ahora solo dispara si te ve; lo único que se
     * permite es UNA ráfaga de contención al lugar donde te vio por última
     * vez, justo después de perderte. Después se queda quieto y va a buscarte.
     */
    if (!engaged) {
      const puedeTirarDeContencion = e.suppressionLeft > 0 && e.lostTimer < 0.9;
      if (!puedeTirarDeContencion) return;
      e.suppressionLeft = 0;
    }

    /**
     * SE TURNAN PARA ASOMARSE. Mientras el cupo del grupo esté lleno, éste se
     * queda tapado — que es exactamente lo que significa cubrir a otro. Ver
     * `MAX_ASOMADOS`. Sólo aplica a los que pelean en formación
     * (`grupoDefensa`); un guardia suelto no tiene a quién esperar.
     */
    if (e.grupoDefensa && companerosAsomados(e, world) >= cupoDeAsomados(e, world)) {
      e.holdTimer = 0.3;
      return;
    }

    // Si desde acá ya no hay tiro, choosePeekSide abandona la cobertura sola.
    if (!choosePeekSide(e, world, aimAt)) return;

    // Con un compañero en el medio no dispara: espera y prueba de nuevo.
    if (allyInLine(e, world, aimAt.x, aimAt.y)) {
      e.holdTimer = 0.35;
      e.repositionTimer = c.repositionAfter;   // que se busque otro ángulo
      return;
    }

    e.peeking = true;
    // En pánico, la ráfaga larga: `panicoBurstSize` (5) es el mismo número
    // que ya usa el disparo ciego por la puerta para decir "no apunta con
    // cuidado" — no hizo falta inventar uno nuevo.
    e.burstLeft = enPanico ? c.panicoBurstSize : c.burstSize;
    startAim(e, world, aimAt);
  }
}

function startAim(e, world, aimAt) {
  const c = e.ai;   // aimTime: cuánto avisa antes de disparar
  e.aimTimer = c.aimTime;
  e.aimDir = Math.atan2(aimAt.y - e.y, aimAt.x - e.x);
  world.audio.play('cock');
}

/** Ciclo de apuntar y disparar. El primer tiro de la ráfaga es el que avisa. */
function tryFire(e, dt, world, aimAt, enPanico) {
  /**
   * 🐛 ACÁ DECÍA `CONFIG.enemy`, Y ESO HACÍA QUE LA CADENCIA DE UN TIPO DE
   * GUARDIA NO EXISTIERA.
   *
   * *(Santi, jugando el Pistolero: "no siento que dispare rápido
   * verdaderamente")* — y tenía razón: medido, disparaba 1,40 balas por
   * segundo contra 1,13 de un guardia común. Un 24% más, no el doble largo
   * que decía su ficha.
   *
   * ESTA FUNCIÓN ES LA QUE MANEJA `burstSize`, `burstDelay` y `fireCooldown`
   * — o sea LOS TRES NÚMEROS que definen "gatillo rápido" — y era la única
   * del combate que seguía leyendo la constante global en vez del perfil del
   * guardia (`e.ai`). El agujero no se había notado nunca porque hasta ahora
   * nadie los sobreescribía: los `aiOverrides` de "Alta vigilancia" tocan
   * puntería, reacción, sospecha y asomada, y todos ésos SÍ se leen de
   * `e.ai` (ver `spreadAt`, `startAim`, `updateSuspicion`,
   * `holdCoverAndFire`). El primero que quiso cambiar la CADENCIA fue el
   * Pistolero, y ahí saltó.
   *
   * `e.ai` es, por defecto, una copia llana de `CONFIG.enemy`, así que para
   * todo guardia que no traiga overrides esto no cambia absolutamente nada.
   */
  const c = e.ai;

  if (e.aimTimer > 0) {
    e.aimTimer -= dt;
    if (e.aimTimer <= 0) {
      fire(e, world, enPanico);
      e.burstLeft -= 1;
      e.burstTimer = c.burstDelay;
      if (e.burstLeft <= 0) e.cooldown = c.fireCooldown;
    }
    return;
  }

  if (e.burstLeft > 0) {
    e.burstTimer -= dt;
    if (e.burstTimer <= 0) {
      // Los tiros siguientes de la ráfaga salen casi seguidos.
      e.aimTimer = 0.09;
      e.aimDir = Math.atan2(aimAt.y - e.y, aimAt.x - e.x);
    }
    return;
  }

  /**
   * `|| enPanico`: sin esto, un guardia que YA tiene una cobertura elegida
   * pero todavía no llegó nunca podía arrancar una ráfaga acá — este chequeo
   * está pensado para el guardia genuinamente sin plan (`!e.coverPoint`), y
   * el que va en camino a cubrirse ahora también dispara mientras camina
   * (ver el llamado a `tryFire` en `doCombat`), así que tiene que poder
   * arrancar el ciclo de apuntado aunque `e.coverPoint` siga puesto.
   */
  if (e.cooldown <= 0 && (!e.coverPoint || enPanico)) {
    if (allyInLine(e, world, aimAt.x, aimAt.y)) {
      e.cooldown = 0.3;   // hay un compañero adelante: aguanta el tiro
      return;
    }
    // Mismo criterio que en holdCoverAndFire: en pánico, ráfaga larga.
    e.burstLeft = enPanico ? c.panicoBurstSize : c.burstSize;
    startAim(e, world, aimAt);
  }
}

function fire(e, world, enPanico) {
  const c = CONFIG.enemy;
  const dist = distance(e.x, e.y, world.player.x, world.player.y);
  /**
   * EN PÁNICO TIRA MÁS SUCIO — `panicoSpreadExtra` se suma igual que el
   * sacudón del tren (`world.dispersionExtra`): está encañonando a alguien
   * que se le viene encima, no apuntando con pulso.
   */
  const extra = (world.dispersionExtra || 0) + (enPanico ? c.panicoSpreadExtra : 0);
  // `spreadDeTiro`, no `spread`: al guardia también se le puede ir el pulso
  // de vez en cuando — parejo con el jugador. Ver CONFIG.mira.fallaChance.
  const mira = CONFIG.mira;
  const angle = e.aimDir + world.rng.spreadDeTiro(spreadAt(e, dist, extra), mira.fallaChance, mira.fallaMultiplicador);

  world.spawnBullet({
    x: e.x + Math.cos(angle) * 9,
    y: e.y + Math.sin(angle) * 9,
    angle,
    speed: c.bulletSpeed,
    damage: 1,
    range: c.viewDistance + 80,
    owner: 'enemy',
  });

  world.audio.play('enemyShot');
  world.camera.shake(0.4, 0.08);
  // `world.train.hearRadius`, no `c.hearRadius` a secas: una tormenta lo agranda.
  world.bus.emit('noise', { x: e.x, y: e.y, radius: world.train ? world.train.hearRadius : c.hearRadius });
}

// -------------------------------------------------------- puertas cerradas

/**
 * DISPARAR A CIEGAS A TRAVÉS DE UNA PUERTA CERRADA.
 *
 * Sólo entra en juego cuando NO te ve pero tiene una idea de dónde estás
 * (`e.lastSeen`) y lo único que se interpone es una puerta cerrada — no una
 * pared, no un asiento; eso lo filtra `puertaEsLoUnicoQueTapa`. Usa sus
 * propios timers (`doorFireCooldown`/`doorAimTimer`/`doorBurstLeft`), separados
 * de los del tiro normal, porque puede pasar en paralelo a todo lo demás: no
 * hace falta estar parapetado para vaciar el cargador contra la madera.
 *
 * 🐛 DOS AGUJEROS QUE HUBO QUE TAPAR, Y LOS DOS SALIERON JUGANDO.
 *
 * *(Santi: "hay veces que hacen ráfagas largas de disparo, cuando sólo
 * deberían hacerlo cuando se encuentran con una puerta y saben que el jugador
 * está del otro lado. Estas ráfagas terminan matando a los guardias")*
 *
 *  1. **NO MIRABA SI HABÍA UN COMPAÑERO EN EL MEDIO.** El disparo normal sí lo
 *     hace desde siempre (`allyInLine`); éste no, y es el que más lo necesita:
 *     son CINCO balas con `doorSpread` 0,6 —el doble de sucio que cualquier
 *     otro tiro del juego— por un pasillo donde los guardias caminan en fila.
 *     Ahí estaban los guardias que se mataban entre ellos.
 *  2. **NO MEDÍA DISTANCIA.** Tiraba hacia `e.lastSeen` estuviera donde
 *     estuviera, y como el tren es un pasillo recto, "lo único que me tapa es
 *     una puerta" se cumplía con una puerta a tres vagones. O sea que no era
 *     el caso que el sistema quería —*sé que estás detrás de ESTA puerta*—
 *     sino cualquier tiro largo por el corredor. El tope es `viewDistance +
 *     80`, que no es un número nuevo: es exactamente hasta dónde vuela su
 *     propia bala (ver `fireDoorBlind`). Nadie vacía el cargador hacia un
 *     lugar al que su arma no llega.
 */
function dispararACiegasPorPuerta(e, dt, world) {
  const c = CONFIG.enemy;
  const target = e.lastSeen;
  if (!target) return;

  e.doorFireCooldown = Math.max(0, (e.doorFireCooldown || 0) - dt);

  if (e.doorAimTimer > 0) {
    e.doorAimTimer -= dt;
    if (e.doorAimTimer <= 0) {
      // El compañero se revisa TIRO A TIRO y no sólo al empezar la ráfaga:
      // en cinco balas hay tiempo de sobra para que alguien se le cruce.
      // Aguanta ese tiro, pero la ráfaga sigue corriendo igual.
      if (!allyInLine(e, world, target.x, target.y)) fireDoorBlind(e, world, target);
      e.doorBurstLeft -= 1;
      if (e.doorBurstLeft > 0) e.doorAimTimer = 0.12;
      else e.doorFireCooldown = c.doorFireCooldown;
    }
    return;
  }

  if (e.doorFireCooldown > 0) return;
  if (distance(e.x, e.y, target.x, target.y) > c.viewDistance + 80) return;
  if (allyInLine(e, world, target.x, target.y)) return;
  if (!puertaEsLoUnicoQueTapa(e, target, world)) return;

  e.doorBurstLeft = c.doorBurstSize;
  e.doorAimTimer = 0.4;
  world.audio.play('cock');
}

function fireDoorBlind(e, world, target) {
  const c = CONFIG.enemy;
  const angle = Math.atan2(target.y - e.y, target.x - e.x) + world.rng.spread(c.doorSpread);

  world.spawnBullet({
    x: e.x + Math.cos(angle) * 9,
    y: e.y + Math.sin(angle) * 9,
    angle,
    speed: c.bulletSpeed,
    damage: 1,
    range: c.viewDistance + 80,
    owner: 'enemy',
  });

  world.audio.play('enemyShot');
  // `world.train.hearRadius`, no `c.hearRadius` a secas: una tormenta lo agranda.
  world.bus.emit('noise', { x: e.x, y: e.y, radius: world.train ? world.train.hearRadius : c.hearRadius });
}

/**
 * DISPARAR A CIEGAS HACIA ARRIBA, A TRAVÉS DEL TECHO.
 *
 * Mismo patrón que la puerta cerrada, con timers propios
 * (`techoFireCooldown`/`techoAimTimer`/`techoBurstLeft`) para no pisar los
 * de la puerta. Sólo entra en juego si el jugador está en el techo Y en el
 * MISMO vagón que este guardia — cruzar de vagón por arriba te saca de la
 * línea de tiro de los de abajo, igual que cruzar una puerta te saca de la
 * de quien quedó del otro lado.
 *
 * Y REVISA COMPAÑEROS, igual que la puerta: son cinco balas igual de sucias
 * (`techoSpread` 0,6) y el pasillo es el mismo. Ver el porqué completo en
 * `dispararACiegasPorPuerta`.
 */
function dispararACiegasPorTecho(e, dt, world) {
  const c = CONFIG.enemy;
  const p = world.player;
  if (!p.enTecho) return;

  const target = e.lastSeen;
  if (!target) return;
  if (!world.train || world.train.wagonAt(e.x) !== world.train.wagonAt(p.x)) return;

  e.techoFireCooldown = Math.max(0, (e.techoFireCooldown || 0) - dt);

  if (e.techoAimTimer > 0) {
    e.techoAimTimer -= dt;
    if (e.techoAimTimer <= 0) {
      if (!allyInLine(e, world, target.x, target.y)) fireTechoBlind(e, world, target);
      e.techoBurstLeft -= 1;
      if (e.techoBurstLeft > 0) e.techoAimTimer = 0.12;
      else e.techoFireCooldown = c.techoFireCooldown;
    }
    return;
  }

  if (e.techoFireCooldown > 0) return;
  if (allyInLine(e, world, target.x, target.y)) return;

  e.techoBurstLeft = c.techoBurstSize;
  e.techoAimTimer = 0.4;
  world.audio.play('cock');
}

function fireTechoBlind(e, world, target) {
  const c = CONFIG.enemy;
  const angle = Math.atan2(target.y - e.y, target.x - e.x) + world.rng.spread(c.techoSpread);

  world.spawnBullet({
    x: e.x + Math.cos(angle) * 9,
    y: e.y + Math.sin(angle) * 9,
    angle,
    speed: c.bulletSpeed,
    damage: 1,
    range: c.viewDistance + 80,
    owner: 'enemy',
  });

  world.audio.play('enemyShot');
  // `world.train.hearRadius`, no `c.hearRadius` a secas: una tormenta lo agranda.
  world.bus.emit('noise', { x: e.x, y: e.y, radius: world.train ? world.train.hearRadius : c.hearRadius });
}

/**
 * ¿Lo único que corta la línea es una puerta cerrada, y no una pared o un
 * asiento? `world.tileBlocksSightAt` es la versión SIN puertas (raidScene.js
 * la guarda ahí antes de envolver `map.blocksSightAt`), así que comparar las
 * dos dice exactamente qué es lo que está tapando.
 *
 * Con una salvedad: si la que tapa es una puerta BLINDADA, no dispara. Esa es
 * chapa y frena las balas (systems/combat.js), así que tirarle sería vaciar
 * el cargador contra un muro — se leería como un bug, no como desesperación.
 * Contra una puerta común, que es madera y la bala atraviesa, sí tira.
 */
function puertaEsLoUnicoQueTapa(e, target, world) {
  if (!world.tileBlocksSightAt) return false;
  const libreSinPuertas = hasLineOfSight(e.x, e.y, target.x, target.y, world.tileBlocksSightAt);
  if (!libreSinPuertas) return false;
  if (!hasLineOfSight(e.x, e.y, target.x, target.y, world.map.blocksSightAt)) {
    return !hayBlindadaEnMedio(e, target, world);
  }
  return false;
}

/** ¿Hay una puerta blindada entera y cerrada cruzada en esta línea de tiro? */
function hayBlindadaEnMedio(e, target, world) {
  if (!world.doors) return false;
  const bloquea = (x, y) => world.doors.some((d) => (
    d.kind === 'blindada' && !d.broken && !d.open &&
    Math.abs(x - d.x) < d.hw && Math.abs(y - d.y) < d.hh
  ));
  return !hasLineOfSight(e.x, e.y, target.x, target.y, bloquea);
}
