/**
 * El jugador: el forajido.
 *
 * Tiene dos modos de moverse:
 *  - libre: WASD y disparás cuando querés.
 *  - a cubierto: pegado a una pared o a un asiento. No te pueden ver ni dar
 *    de frente, pero tampoco podés disparar hasta asomarte (clic derecho).
 *
 * El modo cubierto es lo que convierte el tiroteo en una decisión: asomarse
 * cuesta, porque mientras estás asomado sos un blanco.
 */

import { CONFIG } from '../data/config.js';
import { dibujarPersona, dibujarTendido, faseDeAndar } from "./figura.js";
import { WEAPONS, DEFAULT_WEAPON } from '../data/weapons.js';
import { MELEE, DEFAULT_MELEE } from '../data/melee.js';
import { EXPLOSIVES, DEFAULT_EXPLOSIVE } from '../data/explosives.js';
import { moveAndCollide, overlapsSolid } from '../engine/collision.js';
import { findCoverSurface, coverStillValid } from '../systems/cover.js';
import { playerMelee } from '../systems/melee.js';
import { throwTarget } from '../systems/explosives.js';

export function createPlayer(x, y, weaponId = DEFAULT_WEAPON, meleeId = DEFAULT_MELEE) {
  const c = CONFIG.player;
  const weapon = WEAPONS[weaponId];
  // Siempre hay una: la culata es "no tener nada" y por eso es el piso.
  const melee = MELEE[meleeId] || MELEE[DEFAULT_MELEE];

  return {
    x, y,
    hw: c.hw, hh: c.hh,
    health: c.health,
    maxHealth: c.health,
    alive: true,

    aim: 0,
    moving: false,
    sneaking: false,
    // Hacia dónde CAMINÁS (no hacia dónde apuntás) — lo usa la IA para saber
    // si venís derecho hacia un guardia. Ver `updateFree` más abajo.
    moveDirX: 0,
    moveDirY: 0,

    // El techo (ver updateOnRoof más abajo). `techoSalto` > 0 = estás en el
    // aire; `techoCaido` > 0 = te llevaste un cartel por delante y estás en
    // el piso; `techoAgachado` = estás pasando por debajo de algo.
    enTecho: false,
    techoSalto: 0,
    techoCaido: 0,
    techoAgachado: false,

    // Cobertura
    cover: null,       // { nx, ny, sx, sy } normal y eje de deslizamiento
    coverX: x,         // posición pegada a la pared (sin contar la asomada)
    coverY: y,
    peek: 0,           // 0 = escondido, 1 = totalmente asomado
    peekSide: 1,

    /**
     * CUÁNTO ESTÁS APUNTANDO: 0 = suelto, 1 = la mira cerrada del todo.
     *
     * Se mueve solo hacia el clic derecho (ver `actualizarApuntado`), y de él
     * salen dos cosas a la vez: el radio del círculo de la mira y la
     * dispersión real del próximo tiro. Que sean el MISMO número es todo el
     * punto — el círculo no representa la precisión, es la precisión.
     */
    apuntado: 0,

    weapon,
    /** El arma cuerpo a cuerpo equipada (data/melee.js). Nunca es null. */
    melee,
    ammo: weapon.magazine,
    fireTimer: 0,
    reloadTimer: 0,

    meleeTimer: 0,
    meleeSwing: 0,

    // Dinamita. Por ahora la cuenta arranca de cero en cada asalto; cuando haya
    // inventario de verdad, este número va a salir de gameState.
    explosiveId: DEFAULT_EXPLOSIVE,
    dynamite: c.dynamite,
    fuse: 0,             // >0 = tenés una encendida en la mano

    invuln: 0,
    hitFlash: 0,
    muzzle: 0,
    recoil: 0,     // el salto VISUAL del cañón — cosmético, se apaga en un instante
    /**
     * EL RETROCESO MECÁNICO — no confundir con `recoil` de arriba, que sólo
     * mueve la línea del arma en el dibujo. Éste se suma de verdad a
     * `dispersionActual()`, así que ensucia el próximo tiro y se ve en el
     * círculo. Sube con cada disparo (`shoot`, más abajo) y baja solo con el
     * tiempo (`updatePlayer`). Ver CONFIG.mira.retrocesoDecayTiempo.
     */
    retroceso: 0,
    knockX: 0,
    knockY: 0,

    /**
     * Segundos que te quedan en el piso después de que te lleve puesto un
     * barril (ver `tumbar`). Mientras corre no podés hacer NADA: ni moverte,
     * ni disparar, ni cubrirte. Es el equivalente adentro del vagón de lo que
     * `techoCaido` es arriba.
     */
    tumbado: 0,
    tumboDir: 1,

    /**
     * Cuánto te frena la plata que llevás encima (0 = nada, 0,35 = el tope).
     * Lo pisa la escena en cada cuadro y sólo pasa de cero con la alarma
     * sonando: ver `lastreActual` en scenes/raidScene.js y CONFIG.peso.
     */
    lastre: 0,
  };
}

/** ¿Está tapado ahora mismo? Lo usan los guardias para decidir si te ven. */
export function isHidden(p) {
  return !!p.cover && p.peek < 0.4;
}

/**
 * LA DISPERSIÓN REAL DE ESTE INSTANTE — una sola fuente de verdad.
 *
 * La usan las DOS cosas que tienen que coincidir sí o sí: el radio del círculo
 * de la mira (scenes/raidScene.js) y el ángulo del disparo (`shoot`, más
 * abajo). Si cada uno la calculara por su cuenta, la mira mentiría en cuanto
 * alguien tocara un número — que es exactamente el tipo de error que este
 * proyecto ya se comió dos veces (el comentario decía una cosa y el código
 * hacía otra).
 *
 * `dispersionExtra` es el sacudón del tren veloz (CONFIG.traqueteo) y `p.
 * retroceso` es el kick que dejaron tus últimos disparos (ver CONFIG.mira,
 * `weapons.js` y `shoot()` más abajo) — los dos se SUMAN al final, después de
 * interpolar: te ensucian el tiro apuntes o no. Por eso el círculo se abre en
 * tu cara durante un traqueteo, o después de disparar rápido, aunque tengas
 * el clic derecho apretado — que es justamente lo que se buscaba mostrar.
 */
export function dispersionActual(p, world) {
  const w = p.weapon;
  const suelto = w.spread;
  const apuntado = w.spreadApuntado ?? suelto;
  const t = p.apuntado || 0;
  return suelto + (apuntado - suelto) * t
    + (p.retroceso || 0)
    + ((world && world.dispersionExtra) || 0);
}

export function updatePlayer(p, dt, world) {
  p.fireTimer = Math.max(0, p.fireTimer - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hitFlash = Math.max(0, p.hitFlash - dt);
  p.muzzle = Math.max(0, p.muzzle - dt);
  p.recoil = Math.max(0, p.recoil - dt * 12);
  /**
   * El retroceso baja LINEAL, a la velocidad propia del arma equipada: un
   * solo kick tarda exactamente `retrocesoDecayTiempo` en llegar a cero (ver
   * CONFIG.mira). Si se acumularon dos kicks seguidos, tarda el doble — no
   * hay timer que se reinicia por tiro, es una cantidad que sube y baja.
   */
  p.retroceso = Math.max(0, (p.retroceso || 0) -
    dt * (p.weapon.retroceso / CONFIG.mira.retrocesoDecayTiempo));
  p.meleeTimer = Math.max(0, p.meleeTimer - dt);
  p.meleeSwing = Math.max(0, p.meleeSwing - dt);
  p.stepPhase = (p.stepPhase || 0) + dt;

  if (!p.alive) return;

  // Caminando por el techo es un modo aparte, no una variación del libre:
  // ahí no hay cobertura, ni arma, ni dinamita. Sólo caminar una franja
  // angosta esquivando obstáculos.
  if (p.enTecho) { updateOnRoof(p, dt, world); return; }

  // Te llevó puesto un barril: estás en el piso y no hacés nada hasta
  // levantarte. Va ANTES que todo lo demás justamente por eso.
  if (p.tumbado > 0) { updateTumbado(p, dt, world); return; }

  /**
   * REVOLVIENDO LA MOCHILA ([TAB]) — no te movés, no apuntás y no disparás.
   *
   * *(Santi: "yo podría elegir soltar cosas que ya no me sirven o cambiarlas por
   * otras. Debería aparecer un cursor cuando veo el interior de la mochila")*
   *
   * Y EL MUNDO SIGUE ANDANDO. Es la decisión central de todo esto: la mochila
   * no es una pantalla de gestión con el tiempo detenido, es **un tipo parado
   * en un pasillo con la bolsa abierta**. Los guardias siguen caminando, el
   * reloj sigue bajando y los jinetes siguen tirando por la ventanilla.
   *
   * O SEA QUE CUESTA LO MISMO QUE TODO LO DEMÁS ACÁ: tiempo y exposición. Es la
   * misma familia que la caja fuerte (ocho segundos quieto, de espaldas) y que
   * el barril que te tumba. Reacomodar la carga en el medio de un tiroteo se
   * paga; hacerlo en un vagón vacío es gratis, y elegir dónde hacerlo es parte
   * del juego.
   *
   * Se congela con `return`, igual que `tumbado`, y por el mismo motivo: es más
   * seguro no dejar correr nada que acordarse de apagar cada cosa. `moving` en
   * false es lo que apaga el aro del ruido de las pisadas — parado revolviendo
   * no hacés ruido de caminar.
   */
  if (world.revolviendo) {
    p.moving = false;
    p.moveDirX = 0;
    p.moveDirY = 0;
    return;
  }

  p.aim = Math.atan2(world.aimY - p.y, world.aimX - p.x);

  const input = world.input;
  let dx = 0, dy = 0;
  if (input.anyDown('KeyA', 'ArrowLeft')) dx -= 1;
  if (input.anyDown('KeyD', 'ArrowRight')) dx += 1;
  if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
  if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;

  // La barra espaciadora es AGACHARSE. Cubrirse quedó solo en Shift: antes la
  // barra hacía las dos cosas y no se podía tener una en cada mano.
  p.sneaking = input.isDown('Space');

  const wantsCoverToggle = input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight');

  // El apuntado va ANTES de moverse: es lo que decide a qué velocidad caminás
  // este cuadro (ver `updateFree`).
  actualizarApuntado(p, dt, world);

  if (p.cover) updateInCover(p, dt, world, dx, dy, wantsCoverToggle);
  else updateFree(p, dt, world, dx, dy, wantsCoverToggle);

  /**
   * Degollar con la ruedita del mouse.
   *
   * Alcanza con moverla apenas, en cualquier dirección. La gracia es que la
   * mano del mouse ya está apuntando: no tenés que soltar el apuntado ni
   * estirar el meñique para matar a alguien que tenés pegado a la espalda.
   * F sigue funcionando como respaldo.
   */
  /**
   * Y `F` TIENE UN SEGUNDO USO: EMPUJAR UN CAJÓN DE PÓLVORA (Fase 6a).
   *
   * Si tenés uno al lado, `F` lo destraba y sale rodando hacia la cola en vez
   * de dar un culatazo al aire. Es el mismo criterio contextual que ya tiene
   * `[E]` —que roba, amenaza, abre una tranquera o escapa según qué tengas más
   * cerca— y la escena es la que sabe qué hay alrededor, así que la decisión
   * vive allá (`world.empujarCajon`) y acá sólo se pregunta.
   *
   * LA RUEDITA NO EMPUJA NUNCA, sólo `F`. Así las dos formas de pegar dejan de
   * ser idénticas pero ninguna se pierde: al lado de un cajón, la ruedita
   * sigue siendo el cuchillo.
   */
  const quiereCuchillo = input.wheelMoved() || input.wasPressed('KeyF');
  if (quiereCuchillo && p.meleeTimer <= 0) {
    const empujó = input.wasPressed('KeyF') && world.empujarCajon && world.empujarCajon();
    if (!empujó) playerMelee(p, world);
  }

  // La dinamita va ANTES que el arma y puede quedarse con el clic: si tenés una
  // encendida en la mano, el clic izquierdo la lanza en vez de disparar.
  const lanzó = updateDynamite(p, dt, world);
  if (!lanzó) updateWeapon(p, dt, world);
}

// ---------------------------------------------------------------- dinamita

/**
 * Encender con Q, lanzar con clic izquierdo.
 *
 * La mecha corre desde que la encendés, no desde que la tirás. Si te quedás
 * pensando, te explota en la mano. Esa es toda la tensión del arma: cocinarla
 * un segundo más significa que no lleguen a correrse, y también que estés a un
 * segundo de volarte vos.
 *
 * A cubierto valen las mismas reglas que para disparar: primero hay que
 * asomarse (clic derecho). Tiene sentido — nadie tira nada con la espalda
 * pegada a una pared.
 *
 * Devuelve true si este cuadro se consumió lanzando, para que el revólver no
 * dispare también con el mismo clic.
 */
function updateDynamite(p, dt, world) {
  const input = world.input;
  const tipo = EXPLOSIVES[p.explosiveId];

  // --- Encender ---
  if (input.wasPressed('KeyQ') && p.fuse <= 0 && p.dynamite > 0) {
    p.fuse = tipo.fuse;
    p.dynamite -= 1;
    world.audio.play('fuse');
    world.bus.emit('fuseLit', { x: p.x, y: p.y });
  }

  if (p.fuse <= 0) return false;

  p.fuse -= dt;

  // --- Se te quemó entera en la mano ---
  if (p.fuse <= 0) {
    p.fuse = 0;
    world.spawnExplosive({
      x: p.x, y: p.y, targetX: p.x, targetY: p.y,
      typeId: p.explosiveId, owner: 'player', fuse: 0.0001,
    });
    return true;
  }

  // --- Lanzar ---
  const puedeLanzar = !p.cover || p.peek >= CONFIG.player.peekShootAt;
  if (input.mouse.pressed && puedeLanzar) {
    const destino = throwTarget(
      p.x, p.y, world.aimX, world.aimY, tipo.throwRange, world.map
    );
    world.spawnExplosive({
      x: p.x, y: p.y,
      targetX: destino.x, targetY: destino.y,
      typeId: p.explosiveId, owner: 'player', fuse: p.fuse,
    });
    p.fuse = 0;
    world.audio.play('swing');
    return true;
  }

  return false;
}

// -------------------------------------------------------------------- techo

/**
 * CAMINANDO POR EL TECHO.
 *
 * No usa `moveAndCollide` contra el tilemap: el techo no es un segundo mapa
 * de paredes, es una franja angosta con bordes físicos (`CONFIG.techo.ancho`).
 * Por eso no choca con los asientos de adentro del vagón — ahí está la
 * respuesta a "arriba no chocás con las paredes de adentro" de las notas.
 *
 * LAS TECLAS CAMBIAN ACÁ ARRIBA, a propósito. Abajo, Espacio es agacharse y
 * Shift es cubrirse. Acá no existe la cobertura (no hay contra qué), así que
 * Shift queda libre para AGACHARSE y Espacio pasa a ser SALTAR, que es lo
 * único que hace saltar en cualquier juego del mundo. Son las dos respuestas
 * posibles a lo que te viene de frente, y por eso están una en cada mano.
 *
 * Los obstáculos NO se chequean acá: los maneja la escena (`updateTecho` en
 * raidScene.js), porque chocarse tiene que despertar guardias y esta función
 * no sabe nada del tren.
 */
function updateOnRoof(p, dt, world) {
  const cp = CONFIG.player;
  const ct = CONFIG.techo;
  const input = world.input;

  p.aim = 0;
  p.techoSalto = Math.max(0, p.techoSalto - dt);

  // En el piso después de un golpe: no se mueve ni se agacha, sólo se
  // levanta. Ese medio segundo largo es el castigo real de chocar.
  if (p.techoCaido > 0) {
    p.techoCaido -= dt;
    p.moving = false;
    p.sneaking = false;
    p.techoAgachado = false;
    return;
  }

  // Agacharse y saltar se excluyen: en el aire no te podés agachar.
  p.techoAgachado = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
  if (p.techoSalto > 0) p.techoAgachado = false;

  if (input.wasPressed('Space') && p.techoSalto <= 0) {
    p.techoSalto = ct.saltoDuracion;
    p.techoAgachado = false;
    world.audio.play('swing');
  }

  let dx = 0, dy = 0;
  if (input.anyDown('KeyA', 'ArrowLeft')) dx -= 1;
  if (input.anyDown('KeyD', 'ArrowRight')) dx += 1;
  if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
  if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;

  p.moving = dx !== 0 || dy !== 0;

  // Agachado vas lento (y hacés menos ruido, igual que abajo). En el aire vas
  // MÁS rápido, y eso no es un adorno: es lo que hace que un salto corrido
  // cruce el hueco entre dos vagones y uno parado no.
  let speed = p.techoAgachado ? cp.sneakSpeed : cp.speed;
  if (p.techoSalto > 0) speed *= ct.saltoBoost;

  // Por arriba de la góndola se camina sobre el mismo carbón: frena igual.
  const tren = world.train;
  if (tren && tren.tramoAt(p.x) === 'vagon' && (tren.wagons[tren.wagonAt(p.x)] || {}).carbon) {
    speed *= CONFIG.casillasQueFrenan.carbon;
  }

  // Agachado no hacés ruido de pisadas, igual que abajo (systems/ai.js lo lee
  // de `sneaking`). Es lo que te deja cruzar un vagón sin que te oigan.
  p.sneaking = p.techoAgachado;

  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv; dy *= inv;
  }

  p.x = Math.max(p.hw, Math.min(world.map.width - p.hw, p.x + dx * speed * dt));
  p.y = Math.max(ct.centroY - ct.ancho, Math.min(ct.centroY + ct.ancho, p.y + dy * speed * dt));
}

/**
 * Te llevaste un cartel por delante.
 *
 * NO te teletransporta a ningún lado: te caés ahí mismo, sobre el techo, y
 * tardás en levantarte. Lo caro no es la vida (que también) — es que el
 * porrazo suena tanto que los guardias de abajo dejan de estar adivinando y
 * pasan a saber exactamente dónde estás (lo resuelve la escena).
 */
/**
 * TE LLEVÓ PUESTO UN BARRIL.
 *
 * NO SACA VIDA — decidido así a propósito. El precio es tiempo y exposición:
 * segundo y medio tirado en el piso, sin poder disparar ni cubrirte, en un
 * vagón donde hay gente apuntándote. Eso ya es de los castigos más caros del
 * juego; sumarle daño encima lo volvería el peor castigo por el error más
 * fácil de cometer, y este juego cobra los errores en posición y en reloj
 * mucho más que en vida (ver el salto sucio, o pisar el vacío del techo).
 *
 * Te suelta de la cobertura, y tiene que ser así: no se puede seguir pegado a
 * una pared cuando te acaban de barrer del piso.
 */
export function tumbar(p, desdeX, world) {
  if (!p.alive || p.tumbado > 0) return false;
  const c = CONFIG.rodante;

  p.tumbado = c.levantarse;
  p.tumboDir = p.x < desdeX ? -1 : 1;   // salís despedido para el lado contrario
  p.cover = null;
  p.peek = 0;
  p.sneaking = false;
  p.fuse = 0;
  p.knockX = p.tumboDir * c.empuje;
  p.knockY = 0;

  world.audio.play('hitWall');
  world.camera.shake(CONFIG.feel.shakeHit, 0.3);
  return true;
}

/** En el piso: sólo te seguís deslizando por el envión, y nada más. */
function updateTumbado(p, dt, world) {
  p.tumbado -= dt;
  p.moving = false;

  // `solidoParaJugador`: el carbón es pared hasta que trepás (scenes/raidScene.js).
  const solid = world.solidoParaJugador || world.map.isSolidForMovementAt || world.map.isSolidAt;
  moveAndCollide(p, p.knockX * dt, p.knockY * dt, solid);
  p.knockX *= 0.82;
  p.knockY *= 0.82;

  if (p.tumbado <= 0) {
    p.tumbado = 0;
    p.knockX = 0;
    p.knockY = 0;
  }
}

export function golpearEnTecho(p, x, y, world) {
  if (p.techoCaido > 0) return false;
  p.techoCaido = CONFIG.techo.levantarse;
  p.techoSalto = 0;
  p.techoAgachado = false;
  damagePlayer(p, CONFIG.techo.obstaculoDanio, x, y);
  world.audio.play('hitWall');
  return true;
}

// ---------------------------------------------------------------- movimiento

function updateFree(p, dt, world, dx, dy, toggle) {
  const c = CONFIG.player;
  p.moving = dx !== 0 || dy !== 0;

  // Agachado (barra espaciadora): la mitad de velocidad, pero tardan mucho más
  // en descubrirte. El estado lo fija updatePlayer, para que valga también
  // estando a cubierto y no quede "pegado" al salir de la cobertura.
  //
  // `p.lastre` (0..1) es lo que pesa la plata que llevás encima, y sólo existe
  // después de que suene la alarma (lo calcula `lastreActual` en raidScene,
  // ver CONFIG.peso). Un tren limpio no te frena nunca; uno despierto te cobra
  // cada botín que cargues.
  //
  // Y apuntando (clic derecho) caminás a `CONFIG.mira.velocidad`, que es el
  // MISMO 40 que ya cuestan agacharse y deslizarse pegado a una pared: el
  // juego tiene un solo precio de movimiento y esto no inventa otro. Se aplica
  // proporcional a `p.apuntado`, así que el frenazo entra junto con el cierre
  // de la mira en vez de golpear en el cuadro en que apretás.
  let base = p.sneaking ? c.sneakSpeed : c.speed;
  if (p.apuntado > 0) {
    base = base + (CONFIG.mira.velocidad - base) * p.apuntado;
  }

  /**
   * RECARGANDO CAMINÁS COMO SI FUERAS DE COSTADO.
   *
   * *(pedido de Santi, jugándolo: "recargar debería penalizar el movimiento,
   * debería quedar como si caminara de costado, con esa velocidad")*
   *
   * Reusa `direccionCostado` (0,70) en vez de inventar un número nuevo: es el
   * precio que el juego ya tiene escrito para "estás haciendo otra cosa con
   * el cuerpo mientras caminás". Recargar un revólver con las dos manos
   * mientras corrés es exactamente eso.
   *
   * SE MULTIPLICA, no se pisa: si además vas agachado, apuntando o de
   * espaldas, los precios se suman como se suman todos los de este juego —
   * recargar de espaldas y agachado es lo más lento que podés ir, y tiene que
   * serlo. Y cobra en lo mismo de siempre: tiempo y exposición, nunca vida.
   *
   * No frena el resto: seguís pudiendo cubrirte, agacharte y moverte. Lo
   * único que no podés es disparar, que ya era así.
   */
  if (p.reloadTimer > 0) base *= c.direccionCostado;

  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv; dy *= inv;
  }

  /**
   * HACIA DÓNDE CAMINÁS — no hacia dónde apuntás. Lo lee la IA de los
   * guardias para decidir si "venís hacia él" (ver `CONFIG.enemy.panicoCoseno`
   * y `doCombat` en systems/ai.js): con mouse+WASD podés apuntar para un lado
   * y correr para otro, así que el gesto de "cargar" tiene que leerse del
   * movimiento, no de la mira. Vector unitario, o (0,0) si estás quieto.
   */
  p.moveDirX = dx;
  p.moveDirY = dy;

  /**
   * DE COSTADO O DE ESPALDAS RESPECTO A TU PROPIA MIRA, CAMINÁS MÁS LENTO.
   * Ver CONFIG.player.direccionCostado/direccionAtras para el porqué completo.
   *
   * `dx,dy` ya es unitario (recién normalizado arriba si es diagonal), y
   * `(cos(p.aim), sin(p.aim))` también — el producto punto de dos vectores
   * unitarios ES el coseno del ángulo entre ambos, sin `atan2` ni comparar
   * ángulos: 1 de frente, 0 de costado, −1 de espaldas.
   *
   * Quieto (`dx=dy=0`) el coseno da 0 y no importa: no hay velocidad que
   * penalizar.
   */
  if (p.moving) {
    const coseno = dx * Math.cos(p.aim) + dy * Math.sin(p.aim);
    const factorDireccion = coseno >= 0
      ? c.direccionCostado + (1 - c.direccionCostado) * coseno
      : c.direccionCostado + (c.direccionCostado - c.direccionAtras) * coseno;
    base *= factorDireccion;
  }

  // Entre las reses del refrigerado, a la mitad (world/tilemap.js, `frenoAt`).
  const freno = world.map.frenoAt ? world.map.frenoAt(p.x, p.y) : 1;
  const speed = base * (1 - (p.lastre || 0)) * freno;

  const moveX = dx * speed * dt + p.knockX * dt;
  const moveY = dy * speed * dt + p.knockY * dt;
  p.knockX *= 0.86;
  p.knockY *= 0.86;

  // isSolidForMovementAt (si existe) suma la puerta blindada al choque real,
  // sin meterla en isSolidAt puro — eso es lo que usa el sistema de
  // cobertura, y una puerta angosta flotando en el aire no debería contar
  // como pared para pegarse (systems/cover.js).
  moveAndCollide(p, moveX, moveY, world.solidoParaJugador || world.map.isSolidForMovementAt || world.map.isSolidAt);

  if (toggle) tryEnterCover(p, world);
}

function tryEnterCover(p, world) {
  const c = CONFIG.player;
  const surface = findCoverSurface(p.x, p.y, p.hw, p.hh, world.map, c.coverReach);
  if (!surface) return;

  p.cover = { nx: surface.nx, ny: surface.ny, sx: surface.sx, sy: surface.sy };
  p.coverX = surface.x;
  p.coverY = surface.y;
  p.x = surface.x;
  p.y = surface.y;
  p.peek = 0;
  p.knockX = 0;
  p.knockY = 0;
  world.bus.emit('playerCover', { entered: true });
}

function leaveCover(p, world) {
  p.cover = null;
  p.peek = 0;
  world.bus.emit('playerCover', { entered: false });
}

/**
 * APUNTAR CON EL CLIC DERECHO — y por qué a cubierto es instantáneo.
 *
 * Suelto en el pasillo, la mira tarda `CONFIG.mira.tiempoCierre` en cerrarse y
 * lo mismo en volver a abrirse. Ése es el precio de apuntar, junto con caminar
 * a media velocidad: sin los dos, "apuntá siempre" sería la respuesta correcta
 * a todo y el clic derecho sería un botón que hay que tener apretado, no una
 * decisión.
 *
 * A CUBIERTO, EN CAMBIO, LA MIRA YA ESTÁ CERRADA — pedido de Santi, y encaja
 * con una regla que este juego ya tenía escrita en otro lado: *estar pegado a
 * una pared es estar afianzado*. Es exactamente el mismo motivo por el que el
 * sacudón del tren veloz no te arrastra si estás cubierto (CONFIG.traqueteo).
 * Un tipo apoyado contra un marco no necesita ese tercio de segundo: ya tiene
 * dónde apoyar el brazo.
 *
 * Y eso le da a la cobertura, por primera vez, una razón OFENSIVA para
 * existir. Hasta acá cubrirse era puramente defensivo —te tapa, pero no podés
 * disparar hasta asomarte— así que la única pregunta era cuándo salir. Ahora
 * también es el lugar desde donde mejor se tira. El contrapeso ya está
 * construido y no hubo que agregar ninguno: asomado sos un blanco, los jinetes
 * de afuera te cazan en la ventanilla, y los guardias del blindado te tiran
 * dinamita justamente cuando te ven parapetado.
 *
 * Ojo con el orden: se pone en 1 mientras estás EN COBERTURA, no mientras
 * estás asomado. Escondido y sin asomarte, la mira se ve cerrada pero en rojo
 * (no podés disparar): estás listo, te falta salir.
 */
function actualizarApuntado(p, dt, world) {
  if (p.cover) { p.apuntado = 1; return; }

  const m = CONFIG.mira;
  const paso = dt / m.tiempoCierre;
  const objetivo = world.input.mouse.right ? 1 : 0;

  if (p.apuntado < objetivo) p.apuntado = Math.min(objetivo, p.apuntado + paso);
  else if (p.apuntado > objetivo) p.apuntado = Math.max(objetivo, p.apuntado - paso);
}

function updateInCover(p, dt, world, dx, dy, toggle) {
  const c = CONFIG.player;
  const cover = p.cover;

  // Deslizarse pegado a una pared no es "cargar" a nadie.
  p.moveDirX = 0;
  p.moveDirY = 0;

  if (toggle) { leaveCover(p, world); return; }

  // Apretar en dirección contraria a la pared te despega.
  if (dx * cover.nx + dy * cover.ny > 0.5) { leaveCover(p, world); return; }

  // Deslizarse a lo largo de la pared.
  const slide = dx * cover.sx + dy * cover.sy;
  p.moving = slide !== 0;

  const anchor = { x: p.coverX, y: p.coverY, hw: p.hw, hh: p.hh };
  moveAndCollide(
    anchor,
    cover.sx * slide * c.coverSpeed * dt,
    cover.sy * slide * c.coverSpeed * dt,
    world.solidoParaJugador || world.map.isSolidForMovementAt || world.map.isSolidAt
  );
  p.coverX = anchor.x;
  p.coverY = anchor.y;

  // Si te deslizaste hasta el borde y ya no hay pared detrás, se acabó la cobertura.
  if (!coverStillValid(p.coverX, p.coverY, p.hw, p.hh, cover, world.map)) {
    leaveCover(p, world);
    return;
  }

  // Asomarse: clic derecho. Te asomás hacia el lado al que estés apuntando.
  const wantsPeek = world.input.mouse.right;
  const aimSlide = Math.cos(p.aim) * cover.sx + Math.sin(p.aim) * cover.sy;
  if (wantsPeek && Math.abs(aimSlide) > 0.05) p.peekSide = Math.sign(aimSlide);

  // No se asoma del todo: solo hasta peekMax. Menos cuerpo expuesto = menos
  // castigo por asomarse, pero también más difícil pegarle al que se asoma.
  const target = wantsPeek ? c.peekMax : 0;
  p.peek += (target - p.peek) * Math.min(1, c.peekSpeed * dt);
  if (p.peek < 0.01) p.peek = 0;

  const desiredX = p.coverX + cover.sx * c.peekOffset * p.peek * p.peekSide;
  const desiredY = p.coverY + cover.sy * c.peekOffset * p.peek * p.peekSide;

  const previous = { x: p.x, y: p.y };
  p.x = desiredX;
  p.y = desiredY;
  if (overlapsSolid(p, world.solidoParaJugador || world.map.isSolidForMovementAt || world.map.isSolidAt)) {
    p.x = previous.x;
    p.y = previous.y;
  }
}

// ------------------------------------------------------------------ el arma

function updateWeapon(p, dt, world) {
  const input = world.input;

  if (p.reloadTimer > 0) {
    p.reloadTimer -= dt;
    if (p.reloadTimer <= 0) p.ammo = p.weapon.magazine;
    return;
  }

  if (input.wasPressed('KeyR') && p.ammo < p.weapon.magazine) {
    startReload(p);
    return;
  }

  // Escondido detrás de una pared no se puede disparar: primero hay que asomarse.
  const canShoot = !p.cover || p.peek >= CONFIG.player.peekShootAt;

  if (input.mouse.down && p.fireTimer <= 0 && canShoot) {
    if (p.ammo > 0) shoot(p, world);
    else startReload(p);
  }
}

function startReload(p) {
  p.reloadTimer = p.weapon.reloadTime;
}

function shoot(p, world) {
  const w = p.weapon;
  /**
   * La dispersión sale de `dispersionActual`, la MISMA función que le da el
   * radio al círculo de la mira — el arma, cuánto estás apuntando y el
   * sacudón del tren (CONFIG.traqueteo), que se suma para vos igual que para
   * los guardias.
   *
   * `spreadDeTiro` en vez de `spread`: el círculo es la referencia, no un
   * techo. La mayoría de los tiros usan exactamente esa dispersión, y de vez
   * en cuando (`CONFIG.mira.fallaChance`) se te va el pulso de verdad. Ver
   * el porqué completo en CONFIG.mira y en `rng.spreadDeTiro`.
   */
  const angle = p.aim + world.rng.spreadDeTiro(
    dispersionActual(p, world), CONFIG.mira.fallaChance, CONFIG.mira.fallaMultiplicador
  );

  world.spawnBullet({
    x: p.x + Math.cos(p.aim) * 8,
    y: p.y + Math.sin(p.aim) * 8,
    angle,
    speed: w.bulletSpeed,
    damage: w.damage,
    range: w.range,
    owner: 'player',
  });

  p.ammo -= 1;
  p.fireTimer = w.fireRate;
  p.muzzle = CONFIG.feel.muzzleTime;
  p.recoil = 1;

  /**
   * EL KICK DE ESTE DISPARO — se suma DESPUÉS de haber calculado el ángulo de
   * arriba, a propósito: el retroceso de un tiro afecta al PRÓXIMO, no a sí
   * mismo (así funciona de verdad un arma). Apuntando pesa la mitad —misma
   * regla que ya usa `spreadApuntado`— interpolada por `p.apuntado` en vez de
   * un golpe seco al cruzar el umbral, para que no salte de golpe justo
   * cuando la mira termina de cerrar.
   */
  const kick = w.retroceso * (1 - 0.5 * (p.apuntado || 0));
  p.retroceso = Math.min(CONFIG.mira.retrocesoMax, (p.retroceso || 0) + kick);

  world.camera.shake(CONFIG.feel.shakeShoot, 0.1);
  world.audio.play('playerShot');

  // El ruido va con DOS alcances y son cosas distintas: `radius` es en píxeles
  // y sirve para que los de alrededor vengan a mirar qué pasó; `wagons` es en
  // vagones y es el que despierta el tren cuando la alarma ya está sonando.
  // El segundo sale del arma, no de una constante — y el tren le puede sumar
  // algo encima: el veloz retumba un vagón más lejos que lo que ya dice el
  // arma (`ruidoExtra`, ver data/train.js), sin tocar el número del arma.
  world.bus.emit('noise', {
    x: p.x, y: p.y,
    radius: world.train ? world.train.hearRadius : CONFIG.enemy.hearRadius,
    // 🐛 `?? 1`, NO `|| 1` — con `||`, un arma en `noiseWagons: 0` (el Colt y
    // el Smith, ahora) se leía como "no puesto" y volvía a subir a 1 solo,
    // porque 0 es falsy en JS. `??` sólo cae al default con `undefined`/`null`.
    wagons: (w.noiseWagons ?? 1) + (world.train ? world.train.ruidoExtra : 0),
  });
}

export function damagePlayer(p, amount, fromX, fromY) {
  if (!p.alive || p.invuln > 0) return false;

  p.health -= amount;
  p.invuln = CONFIG.player.invulnTime;
  p.hitFlash = CONFIG.feel.hitFlash;

  if (!p.cover) {
    const angle = Math.atan2(p.y - fromY, p.x - fromX);
    p.knockX = Math.cos(angle) * CONFIG.player.knockback;
    p.knockY = Math.sin(angle) * CONFIG.player.knockback;
  }

  if (p.health <= 0) {
    p.health = 0;
    p.alive = false;
  }
  return true;
}

// ------------------------------------------------------------------- dibujo

export function drawPlayer(r, p, hearStepRadius = CONFIG.enemy.hearStepRadius) {
  const col = CONFIG.colors;

  if (!p.alive) {
    dibujarTendido(r, p.x, p.y, { tipo: "jugador", sangre: true, cinta: CINTA_JUGADOR });
    return;
  }

  if (p.enTecho) { drawPlayerOnRoof(r, p, col, hearStepRadius); return; }

  /**
   * TIRADO EN EL PISO. Se dibuja acostado y con el sombrero volado al lado:
   * de un vistazo tiene que quedar clarísimo que no estás peleando, porque
   * durante ese segundo y medio no podés hacer nada y hay que entender por
   * qué. La rayita que se vacía arriba es cuánto falta para levantarte —
   * mismo lenguaje que la barra de sospecha de los guardias.
   */
  if (p.tumbado > 0) {
    r.ctx.globalAlpha = 0.25;
    r.box(p.x, p.y + 5, 7, 2, '#000');
    r.ctx.globalAlpha = 1;

    dibujarTendido(r, p.x, p.y + 1, {
      tipo: "jugador", color: p.hitFlash > 0 ? "#fff" : undefined, cinta: CINTA_JUGADOR,
    });

    const falta = p.tumbado / CONFIG.rodante.levantarse;
    r.rect(p.x - 7, p.y - 10, 14, 2, '#241c18');
    r.rect(p.x - 7, p.y - 10, 14 * (1 - falta), 2, col.text);
    return;
  }

  /**
   * El aro del ruido de tus pisadas.
   *
   * Sin esto el sigilo sería adivinanza: te descubrirían por el ruido y no
   * tendrías forma de saber por qué. El aro muestra exactamente hasta dónde te
   * están oyendo, y desaparece del todo al agacharte. Un sistema de sigilo que
   * no se ve se siente injusto, aunque sea perfectamente justo.
   */
  if (p.moving && !p.sneaking) {
    const pulso = (p.stepPhase % 0.75) / 0.75;
    r.circle(p.x, p.y, hearStepRadius * (0.45 + pulso * 0.55), col.noiseRing, 0.28 * (1 - pulso));
  }

  if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) return;

  const retro = p.recoil * 1.5;
  const bx = p.x - Math.cos(p.aim) * retro;
  const by = p.y - Math.sin(p.aim) * retro;

  /**
   * VOS, CON EL ARTE NUEVO (ver entities/figura.js y entities/gente/):
   * sombrero de vaquero y pañuelo rojo. Los pies van en el borde de abajo de la
   * caja con la que chocás (`p.hh`), que no cambió: la bala sigue pegando donde
   * pegaba.
   *
   * 🔁 PEGADO A LA COBERTURA NO SE APLASTA: SE AGACHA. Asomado (`peek`) se para
   * y apunta. Y también va agachado en sigilo, que es la otra forma de no hacer
   * ruido que ya tenías.
   *
   * 🔁 EL COLOR "A CUBIERTO" DEL CUERPO SE FUE con el cuerpo negro: lo sigue
   * diciendo la raya verde sobre la pared que te tapa, y la postura agachada.
   */
  const pies = by + p.hh;
  const agachado = p.sneaking || (p.cover && p.peek <= 0.15);

  r.ctx.globalAlpha = 0.25;
  r.box(p.x, p.y + p.hh, 5, 2, '#000');
  r.ctx.globalAlpha = 1;

  const llenado = p.mochila || 0;
  const bulto = llenado > 0 ? 1 + Math.round(llenado * 3) : 0;
  const fig = dibujarPersona(r, {
    tipo: 'jugador', x: bx, pies, angulo: p.aim,
    // A cubierto no caminás: los pies se quedan pegados a la pared y lo que
    // sale a asomarse es el cuerpo (ver `ancla` en figura.js).
    fase: p.cover ? null : faseDeAndar(p),
    ancla: p.cover ? { x: p.coverX, pies: p.coverY + p.hh } : null,
    postura: agachado ? 'agachado' : 'pie',
    destello: p.hitFlash > 0,
    arma: !p.cover || p.peek > 0.15 ? { angulo: p.aim, largo: 7, color: ARMA_JUGADOR } : null,
    mochila: bulto,
  });
  const manoY = fig.manoY;

  // Marca de que estás a cubierto: una línea sobre la pared que te tapa.
  if (p.cover) {
    const c = p.cover;
    r.line(
      p.coverX - c.nx * 7 - c.sx * 7, p.coverY - c.ny * 7 - c.sy * 7,
      p.coverX - c.nx * 7 + c.sx * 7, p.coverY - c.ny * 7 + c.sy * 7,
      '#9fd8b8', 0.8
    );
  }

  if (p.muzzle > 0) {
    // A la altura de la mano, donde termina el caño (ver `dibujarPersona`).
    r.box(bx + Math.cos(p.aim) * 10, manoY + Math.sin(p.aim) * 10, 2, 2, '#fff3b0');
  }

  /**
   * La dinamita encendida en la mano.
   *
   * La chispa parpadea cada vez más rápido a medida que se acaba la mecha, y
   * sobre el final aparece el aro de lo que va a volar. Es la misma información
   * que ve el jugador en el cartucho tirado en el piso, para que no haya que
   * aprender dos lenguajes distintos para la misma cosa.
   */
  if (p.fuse > 0) {
    const tipo = EXPLOSIVES[p.explosiveId];
    const restante = p.fuse / tipo.fuse;
    const hx = p.x + Math.cos(p.aim) * 7;
    const hy = manoY + Math.sin(p.aim) * 7 - 2;

    r.box(hx, hy, 2, 3, col.dynamite);
    const ritmo = 6 + (1 - restante) * 26;
    if (Math.floor(p.stepPhase * ritmo) % 2 === 0) {
      r.box(hx, hy - 4, 1 + Math.round((1 - restante) * 2), 1, '#fff4c0');
    }
    if (restante < 0.4) {
      r.circle(p.x, p.y, tipo.lethalRadius, '#ff7a4a', 0.14 + (1 - restante) * 0.25);
    }
  }

  drawKnifeArc(r, p);
}

const CINTA_JUGADOR = '#c8342a';
/** Gris y no negro: sobre la silueta negra un caño oscuro no se vería. */
const ARMA_JUGADOR = '#8a8074';
/**
 * EL JUGADOR EN EL TECHO.
 *
 * Las tres posturas tienen que leerse de un vistazo, porque el juego de acá
 * arriba es elegir la correcta a tiempo:
 *
 *  - **Saltando:** el cuerpo se despega y la sombra se queda abajo y se
 *    achica. Ver la sombra separada es lo que dice "estás en el aire" sin
 *    ningún cartel que lo explique.
 *  - **Agachado:** el cuerpo se dobla y el sombrero baja.
 *  - **Caído:** tirado, parpadeando mientras te levantás.
 */
function drawPlayerOnRoof(r, p, col, hearStepRadius) {
  const ct = CONFIG.techo;

  if (p.techoCaido > 0) {
    r.ctx.globalAlpha = 0.3;
    r.box(p.x, p.y + 5, 6, 2, '#000');
    r.ctx.globalAlpha = 1;
    dibujarTendido(r, p.x, p.y + 2, {
      tipo: "jugador", color: p.hitFlash > 0 ? "#fff" : undefined, cinta: CINTA_JUGADOR,
    });
    if (Math.floor(p.techoCaido * 10) % 2 === 0) {
      r.text('!', p.x, p.y - 12, col.enemyAlert);
    }
    return;
  }

  const enElAire = p.techoSalto > 0;
  // Una parábola: sube y baja a lo largo del salto.
  const t = enElAire ? 1 - p.techoSalto / ct.saltoDuracion : 0;
  const alto = enElAire ? Math.sin(t * Math.PI) * 9 : 0;

  // La sombra se queda en el techo y se achica: es el aviso de altura.
  r.ctx.globalAlpha = 0.25 + (enElAire ? -0.1 * (alto / 9) : 0);
  r.box(p.x, p.y + 6, 5 - (alto / 9) * 1.5, 2, '#000');
  r.ctx.globalAlpha = 1;

  if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) return;

  // El aro del ruido, igual que abajo: agachado no hacés ninguno.
  if (p.moving && !p.techoAgachado && !enElAire) {
    const pulso = (p.stepPhase % 0.75) / 0.75;
    r.circle(p.x, p.y, hearStepRadius * (0.45 + pulso * 0.55), col.noiseRing, 0.28 * (1 - pulso));
  }

  const by = p.y - alto;

  // Igual que abajo: agachado se dobla, saltando sube entero.
  dibujarPersona(r, {
    tipo: 'jugador', x: p.x, pies: by + p.hh, angulo: p.aim,
    fase: enElAire ? null : faseDeAndar(p),
    postura: p.techoAgachado ? 'agachado' : 'pie',
    destello: p.hitFlash > 0,
    arma: { angulo: p.aim, largo: 7, color: ARMA_JUGADOR },
  });
}

function drawKnifeArc(r, p) {
  // Arco del cuchillo.
  if (p.meleeSwing > 0) {
    const m = CONFIG.melee;
    const progress = 1 - p.meleeSwing / m.swingTime;
    const angle = p.aim - m.arc * 0.7 + m.arc * 1.4 * progress;
    r.line(
      p.x, p.y,
      p.x + Math.cos(angle) * m.range,
      p.y + Math.sin(angle) * m.range,
      '#fff6d0', 0.9
    );
  }
}
