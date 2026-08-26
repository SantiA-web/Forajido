/**
 * Cuerpo a cuerpo.
 *
 * Existe por dos motivos de diseño:
 *
 *  1. Le da al sigilo un premio. Acercarse por la espalda a un guardia que no
 *     te vio y bajarlo en silencio es la única forma de sacar a alguien del
 *     tablero sin que suene un tiro. Es lo que hace que jugar callado sea una
 *     estrategia y no una limitación.
 *
 *  2. Tapa un agujero del tiroteo. Antes, pegarse a un guardia era seguro
 *     porque el guardia seguía con su ciclo de apuntar. Ahora, de cerca,
 *     los dos se pegan.
 *
 * El degüello por la espalda no es gratis: el cuerpo queda en el piso, y un
 * guardia que ve un cuerpo da la alarma. Dónde matás importa tanto como a quién.
 */

import { CONFIG } from '../data/config.js';
import { distance, angleDifference, moveAndCollide } from '../engine/collision.js';
import { damageEnemy } from '../entities/enemy.js';

export function playerMelee(p, world) {
  const m = CONFIG.melee;

  p.meleeTimer = m.cooldown;
  p.meleeSwing = m.swingTime;
  world.audio.play('swing');

  const target = findTarget(p, world, m);

  if (!target) {
    world.bus.emit('noise', { x: p.x, y: p.y, radius: 40 });
    return;
  }

  world.camera.shake(1.6, 0.12);

  // --- Pasajero ---
  if (target.kind === 'passenger') {
    const pa = target.entity;
    pa.alive = false;
    world.audio.play('takedown');
    world.bus.emit('impact', { x: pa.x, y: pa.y, kind: 'flesh' });
    world.bus.emit('passengerKilled', { passenger: pa, byPlayer: true, silent: true });
    world.bus.emit('noise', { x: pa.x, y: pa.y, radius: m.quietNoise });
    return;
  }

  // --- Guardia ---
  const e = target.entity;

  if (isFromBehind(p, e, m) && e.state !== 'combat') {
    // Degüello: silencioso, instantáneo, y solo si no te vio venir.
    e.alive = false;
    e.health = 0;
    world.audio.play('takedown');
    world.bus.emit('impact', { x: e.x, y: e.y, kind: 'flesh' });
    world.bus.emit('enemyKilled', { enemy: e, byPlayer: true, silent: true });
    world.bus.emit('noise', { x: e.x, y: e.y, radius: m.quietNoise });
    return;
  }

  // Golpe de frente: hace daño y lo aturde, pero es un escándalo.
  const died = damageEnemy(e, m.damage, p.x, p.y);
  e.stagger = m.stagger;
  e.aimTimer = 0;
  e.peeking = false;
  e.cooldown = Math.max(e.cooldown, 0.5);

  // Lo empuja para atrás: te da un respiro para el segundo golpe o para huir.
  const angle = Math.atan2(e.y - p.y, e.x - p.x);
  moveAndCollide(
    e,
    Math.cos(angle) * m.knockback * 0.12,
    Math.sin(angle) * m.knockback * 0.12,
    world.map.isSolidForMovementAt || world.map.isSolidAt
  );

  world.audio.play('melee');
  world.bus.emit('impact', { x: e.x, y: e.y, kind: 'flesh' });
  if (died) world.bus.emit('enemyKilled', { enemy: e, byPlayer: true });
  world.bus.emit('noise', { x: p.x, y: p.y, radius: m.loudNoise });
}

/** El blanco más cercano dentro del arco del golpe. Los guardias tienen prioridad. */
function findTarget(p, world, m) {
  let best = null;
  let bestDist = m.range;

  const consider = (entity, kind) => {
    if (!entity.alive) return;
    const d = distance(p.x, p.y, entity.x, entity.y);
    if (d > bestDist) return;
    const angleTo = Math.atan2(entity.y - p.y, entity.x - p.x);
    if (Math.abs(angleDifference(p.aim, angleTo)) > m.arc) return;
    bestDist = d;
    best = { entity, kind };
  };

  for (const e of world.enemies) consider(e, 'enemy');
  if (!best) for (const pa of world.passengers) consider(pa, 'passenger');

  return best;
}

/** ¿El jugador está a espaldas del guardia? */
function isFromBehind(p, e, m) {
  const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);
  return Math.abs(angleDifference(e.facing, angleToPlayer)) > Math.PI - m.backArc;
}
