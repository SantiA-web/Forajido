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
import { findCoverPoint, findPeek } from './cover.js';
import { throwTarget } from './explosives.js';
import { EXPLOSIVES, DEFAULT_EXPLOSIVE } from '../data/explosives.js';
import { isHidden, damagePlayer } from '../entities/player.js';

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
      // Los guardias de abajo no te ven a través del techo, pase lo que
      // pase con la geometría de línea de visión: te oyen (oirPisadas,
      // sin cambios) pero nunca te ven.
      const visible = player.alive && !player.enTecho &&
        canSeeFrom(e.x, e.y, e.facing, player, world.map, true);

      updateSuspicion(e, dt, world, visible);
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

  const dist = distance(e.x, e.y, p.x, p.y);
  if (dist > c.hearStepRadius) return;

  const cerca = 1 - dist / c.hearStepRadius;
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
    if (entity.alive) return null;
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
export function canSeeFrom(fromX, fromY, facing, player, map, useCone, viewDistance) {
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
    if (Math.abs(angleDifference(facing, angleToPlayer)) > c.viewAngle) return false;
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

function doPatrol(e, dt, world) {
  const c = CONFIG.enemy;

  if (e.path.length === 0) { scan(e, dt); return; }

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

  const dist = distance(e.x, e.y, e.target.x, e.target.y);
  if (dist < 14) {
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

// ------------------------------------------------------------------ combate

function peekPosition(e) {
  return {
    x: e.coverPoint.x + e.peekAxis.x * e.peekOffset * e.peekSide,
    y: e.coverPoint.y + e.peekAxis.y * e.peekOffset * e.peekSide,
  };
}

function doCombat(e, dt, world) {
  // e.ai: acá se lee coverHoldMin/Max, que también cambia por guardia.
  const c = e.ai;
  const player = world.player;

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

  // --- Buscar cobertura ---
  e.repositionTimer = (e.repositionTimer || 0) + dt;
  const needsCover = !e.coverPoint || (e.atCover && e.repositionTimer > c.repositionAfter);

  if (needsCover) {
    const taken = [];
    for (const other of world.enemies) {
      if (other !== e && other.alive && other.coverPoint) taken.push(other.coverPoint);
    }
    const spot = findCoverPoint(world.map, e.x, e.y, aimAt.x, aimAt.y, taken);

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
    return;
  }

  if (e.coverPoint && e.atCover) {
    holdCoverAndFire(e, dt, world, engaged, aimAt);
    return;
  }


  // --- Sin cobertura: avanza y dispara ---
  // Si el objetivo está lejos (otro vagón), va con ruta. De cerca, derecho:
  // calcular una ruta para tres pasos sería tonto y se vería robótico.
  const dist = distance(e.x, e.y, aimAt.x, aimAt.y);
  if (dist > c.routeDistance) {
    viajarHacia(e, dt, world, aimAt.x, aimAt.y, c.speed);
  } else if (dist > 92) {
    moveToward(e, player.x, player.y, c.speed, dt, world.map);
  }

  if (engaged) tryFire(e, dt, world, aimAt);
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
  const peek = findPeek(world.map, e.coverPoint, aimAt.x, aimAt.y, e.ai.peekSteps);
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

function holdCoverAndFire(e, dt, world, engaged, aimAt) {
  const c = e.ai;   // coverHoldMin/Max: cuánto se esconde entre ráfaga y ráfaga
  const anchor = e.peeking ? peekPosition(e) : e.coverPoint;

  // Se mueve entre estar tapado y estar asomado.
  moveToward(e, anchor.x, anchor.y, c.speed * 1.4, dt, world.map);
  turnTowards(e, Math.atan2(aimAt.y - e.y, aimAt.x - e.x), dt, 10);

  if (e.peeking) {
    tryFire(e, dt, world, aimAt);
    if (e.burstLeft <= 0 && e.aimTimer <= 0 && e.cooldown > 0) {
      e.peeking = false;
      e.holdTimer = world.rng.range(c.coverHoldMin, c.coverHoldMax);
    }
    return;
  }

  e.holdTimer -= dt;
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

    // Si desde acá ya no hay tiro, choosePeekSide abandona la cobertura sola.
    if (!choosePeekSide(e, world, aimAt)) return;

    // Con un compañero en el medio no dispara: espera y prueba de nuevo.
    if (allyInLine(e, world, aimAt.x, aimAt.y)) {
      e.holdTimer = 0.35;
      e.repositionTimer = c.repositionAfter;   // que se busque otro ángulo
      return;
    }

    e.peeking = true;
    e.burstLeft = c.burstSize;
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
function tryFire(e, dt, world, aimAt) {
  const c = CONFIG.enemy;

  if (e.aimTimer > 0) {
    e.aimTimer -= dt;
    if (e.aimTimer <= 0) {
      fire(e, world);
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

  if (e.cooldown <= 0 && !e.coverPoint) {
    if (allyInLine(e, world, aimAt.x, aimAt.y)) {
      e.cooldown = 0.3;   // hay un compañero adelante: aguanta el tiro
      return;
    }
    e.burstLeft = c.burstSize;
    startAim(e, world, aimAt);
  }
}

function fire(e, world) {
  const c = CONFIG.enemy;
  const dist = distance(e.x, e.y, world.player.x, world.player.y);
  const angle = e.aimDir + world.rng.spread(spreadAt(e, dist, world.dispersionExtra || 0));

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
  world.bus.emit('noise', { x: e.x, y: e.y, radius: c.hearRadius });
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
 */
function dispararACiegasPorPuerta(e, dt, world) {
  const c = CONFIG.enemy;
  const target = e.lastSeen;
  if (!target) return;

  e.doorFireCooldown = Math.max(0, (e.doorFireCooldown || 0) - dt);

  if (e.doorAimTimer > 0) {
    e.doorAimTimer -= dt;
    if (e.doorAimTimer <= 0) {
      fireDoorBlind(e, world, target);
      e.doorBurstLeft -= 1;
      if (e.doorBurstLeft > 0) e.doorAimTimer = 0.12;
      else e.doorFireCooldown = c.doorFireCooldown;
    }
    return;
  }

  if (e.doorFireCooldown > 0) return;
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
  world.bus.emit('noise', { x: e.x, y: e.y, radius: c.hearRadius });
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
      fireTechoBlind(e, world, target);
      e.techoBurstLeft -= 1;
      if (e.techoBurstLeft > 0) e.techoAimTimer = 0.12;
      else e.techoFireCooldown = c.techoFireCooldown;
    }
    return;
  }

  if (e.techoFireCooldown > 0) return;

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
  world.bus.emit('noise', { x: e.x, y: e.y, radius: c.hearRadius });
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
