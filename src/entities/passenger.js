/**
 * Pasajeros.
 *
 * No pelean, pero son el motivo por el que no se puede cruzar el vagón
 * caminando tranquilo: si te ven de cerca, gritan, y el grito trae guardias.
 *
 * También son la semilla del sistema moral. Podés matarlos para que se callen,
 * y más adelante eso va a subir tu recompensa y bajar tu honor. Por ahora el
 * juego solo los cuenta.
 */

import { CONFIG } from '../data/config.js';
import { moveAndCollide, distance, hasLineOfSight, angleDifference } from '../engine/collision.js';
import { isHidden } from './player.js';

export function createPassenger(x, y, facing = Math.PI) {
  return {
    x, y,
    hw: 4, hh: 4,
    alive: true,
    // idle | amenazado | panic | fleeing | cowering
    state: 'idle',
    panicTimer: 0,
    fleeToX: x,
    facing,
    hitFlash: 0,
    shakeTimer: 0,

    // Amenazar: cuánto llevás apretando E, y si ya le sacaste la plata.
    robProgress: 0,
    robado: false,
    yaGrito: false,
  };
}

/** Lo llama la escena cuando pasa algo que asusta (un disparo cerca). */
export function panic(pa) {
  if (!pa.alive) return;
  // Al que ya asaltaste también lo puede sobresaltar un tiro: deja de estar
  // paralizado y arranca a gritar antes de tiempo.
  if (pa.state !== 'idle' && pa.state !== 'amenazado') return;
  pa.state = 'panic';
  pa.panicTimer = CONFIG.passenger.panicDelay;
}

/**
 * Le sacaste la plata. Queda temblando donde está, y en unos segundos va a
 * gritar: ese es el precio de haberlo asaltado en vez de esquivarlo.
 */
export function amenazado(pa) {
  pa.robado = true;
  pa.robProgress = 0;

  // Al que YA gritó no se le da cuenta regresiva: el escándalo ya lo hizo, y
  // una segunda alarma por el mismo tipo no significa nada. Sigue con lo suyo,
  // ahora sin plata.
  if (pa.yaGrito) return;

  pa.state = 'amenazado';
  pa.panicTimer = CONFIG.passenger.robPanicDelay;
}

/**
 * ¿A este se le puede sacar plata?
 *
 * A CUALQUIERA QUE ESTÉ VIVO Y NO LE HAYAS SACADO NADA, esté como esté. También
 * al que ya gritó y salió corriendo: le ponés el revólver encima y afloja igual.
 *
 * Antes sólo valía para los tranquilos, y eso tenía una consecuencia fea que no
 * se veía venir: si la alarma sonaba temprano, TODOS los pasajeros huían y su
 * plata se perdía para siempre, sin que hubiera nada que pudieras hacer. Eso no
 * es un costo, es mala suerte. Ahora perseguirlos cuesta tiempo — que con 145
 * segundos es la moneda cara — y eso sí es una decisión.
 */
export function sePuedeAmenazar(pa) {
  return pa.alive && !pa.robado && pa.state !== 'amenazado';
}

export function updatePassenger(pa, dt, world) {
  pa.hitFlash = Math.max(0, pa.hitFlash - dt);
  if (!pa.alive) return;

  const c = CONFIG.passenger;
  const player = world.player;

  /**
   * MIENTRAS LE ESTÁS APUNTANDO NO SE MUEVE, esté haciendo lo que esté haciendo.
   *
   * Vale también para el que venía corriendo y para el acurrucado en el rincón:
   * frenan en seco. Sin esto no se podría asaltar a nadie que ya haya gritado,
   * porque huyen y el forcejeo nunca llegaría a completarse.
   *
   * Se activa sólo si estás manteniendo [E] (robProgress > 0), no por pasar al
   * lado: cruzar un vagón corriendo no tiene por qué congelar a la gente.
   */
  if (pa.robProgress > 0) {
    pa.facing = Math.atan2(player.y - pa.y, player.x - pa.x);
    pa.shakeTimer += dt * 2;
    return;
  }

  if (pa.state === 'idle') {
    /**
     * ENCAÑONADO: lo tenés a distancia de tocarlo, así que se queda quieto.
     *
     * Sin esta regla, amenazar era imposible y no por balance sino por
     * geometría: acercarte lo suficiente para robarle lo hacía entrar en pánico
     * en 0,35 s, y sacarle la plata lleva 1,4. Nunca llegabas.
     *
     * Y además es lo que uno esperaría: nadie se pone a los gritos con un
     * revólver en la cara. Grita cuando te alejás, que es justo lo que hace
     * interesante amenazar — el escándalo no se evita, se posterga.
     */
    const encanonado = player.alive &&
      distance(pa.x, pa.y, player.x, player.y) <= CONFIG.loot.radius;
    if (encanonado) {
      pa.facing = Math.atan2(player.y - pa.y, player.x - pa.x);
      return;
    }

    const seesPlayer = player.alive && !isHidden(player) && noticesPlayer(pa, player, world, c);

    // Un cadáver al lado también los descompone.
    if (seesPlayer || seesBody(pa, world, c)) panic(pa);
    return;
  }

  /**
   * Amenazado: le sacaste la plata y se quedó helado con las manos arriba.
   * No grita todavía — pero el reloj corre. Es tu ventana para irte, para
   * seguir robando o para callarlo.
   */
  if (pa.state === 'amenazado') {
    pa.panicTimer -= dt;
    pa.shakeTimer += dt * 1.6;
    if (pa.panicTimer <= 0) {
      pa.state = 'panic';
      pa.panicTimer = c.panicDelay;
    }
    return;
  }

  if (pa.state === 'panic') {
    pa.panicTimer -= dt;
    pa.shakeTimer += dt;
    if (pa.panicTimer <= 0) {
      // Grita: los guardias que lo oigan van para allá.
      pa.yaGrito = true;
      world.audio.play('scream');
      world.bus.emit('scream', { x: pa.x, y: pa.y, radius: c.shoutRadius });

      // Corre hacia el extremo más cercano del vagón.
      pa.fleeToX = pa.x < world.map.width / 2 ? 24 : world.map.width - 24;
      pa.state = 'fleeing';
    }
    return;
  }

  if (pa.state === 'fleeing') {
    const dx = Math.sign(pa.fleeToX - pa.x);
    pa.facing = dx > 0 ? 0 : Math.PI;
    moveAndCollide(pa, dx * c.speed * dt, 0, world.map.isSolidForMovementAt || world.map.isSolidAt);
    if (Math.abs(pa.x - pa.fleeToX) < 6) pa.state = 'cowering';
  }
}

/**
 * Los pasajeros solo miran para adelante. Se los puede rodear por atrás,
 * y esa es la diferencia entre cruzar el vagón en silencio o no.
 */
function noticesPlayer(pa, player, world, c) {
  const dist = distance(pa.x, pa.y, player.x, player.y);
  if (dist > c.noticeRadius) return false;

  if (dist > c.noticeBehind) {
    const angleTo = Math.atan2(player.y - pa.y, player.x - pa.x);
    if (Math.abs(angleDifference(pa.facing, angleTo)) > c.noticeAngle) return false;
  }

  return hasLineOfSight(pa.x, pa.y, player.x, player.y, world.map.blocksSightAt);
}

function seesBody(pa, world, c) {
  const check = (entity) =>
    !entity.alive &&
    entity !== pa &&
    distance(pa.x, pa.y, entity.x, entity.y) < c.noticeRadius * 0.85 &&
    hasLineOfSight(pa.x, pa.y, entity.x, entity.y, world.map.blocksSightAt);

  return world.enemies.some(check) || world.passengers.some(check);
}

export function drawPassenger(r, pa) {
  const col = CONFIG.colors;

  if (!pa.alive) {
    r.box(pa.x, pa.y, 5, 3, col.blood);
    r.box(pa.x, pa.y, 4, 2, '#3a2a30');
    return;
  }

  r.ctx.globalAlpha = 0.25;
  r.box(pa.x, pa.y + 5, 4, 2, '#000');
  r.ctx.globalAlpha = 1;

  // Tiembla mientras entra en pánico, y más fuerte si lo acabás de asaltar.
  const tiembla = pa.state === 'panic' || pa.state === 'amenazado';
  const shake = tiembla ? Math.sin(pa.shakeTimer * 40) * 1 : 0;
  const color = pa.hitFlash > 0
    ? '#fff'
    : pa.state === 'idle' ? col.civilian : col.civilianRun;

  // Hacia dónde mira: hay que poder leerlo para rodearlo por atrás.
  if (pa.state === 'idle') {
    r.line(pa.x, pa.y, pa.x + Math.cos(pa.facing) * 7, pa.y + Math.sin(pa.facing) * 7, '#7a5a68');
  }

  r.box(pa.x + shake, pa.y, 4, 4, color);
  r.rect(pa.x + shake - 4, pa.y - 5, 8, 2, '#6a4a58');

  /**
   * El que ya asaltaste lleva las manos arriba Y un reloj encima de la cabeza.
   * Ese reloj es la información más importante que da este sistema: es cuánto
   * te queda antes de que se ponga a gritar. Sin verlo, amenazar sería una
   * trampa en vez de una decisión.
   */
  if (pa.state === 'amenazado') {
    const c = CONFIG.passenger;
    const queda = Math.max(0, pa.panicTimer / c.robPanicDelay);
    r.rect(pa.x - 5, pa.y - 11, 10, 2, '#241c18');
    r.rect(pa.x - 5, pa.y - 11, 10 * queda, 2, queda > 0.4 ? col.bagLoot : col.enemyAlert);
    // Los brazos en alto
    r.rect(pa.x + shake - 5, pa.y - 3, 2, 3, color);
    r.rect(pa.x + shake + 3, pa.y - 3, 2, 3, color);
  }

  if (pa.state === 'panic') r.text('!', pa.x, pa.y - 12, '#ff8a5c');
  else if (pa.state === 'fleeing') r.text('!', pa.x, pa.y - 12, '#ffd0b0');
}
