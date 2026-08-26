/**
 * Explosivos: los mueve, les quema la mecha y resuelve el estruendo.
 *
 * No dibuja nada y no sabe qué escena está corriendo: avisa por el bus
 * ('explosion', 'enemyKilled', 'noise') y quien tenga que reaccionar reacciona.
 *
 * LA REGLA QUE IMPORTA: la explosión NO atraviesa paredes ni asientos. Se
 * pregunta lo mismo que preguntan las balas (`blocksBulletsAt`), así que un
 * asiento entre vos y el cartucho te salva. Sin esa regla, la dinamita
 * convertiría la cobertura en un adorno; con ella, la incomoda, que es lo que
 * queríamos: te obliga a cambiar de cobertura, no a dejar de usarla.
 */

import { distance, hasLineOfSight } from '../engine/collision.js';
import { damageEnemy } from '../entities/enemy.js';
import { damagePlayer } from '../entities/player.js';
import { volarPuerta } from '../entities/door.js';

export function updateExplosives(explosives, dt, world) {
  for (const ex of explosives) {
    if (!ex.alive) continue;

    ex.spin += dt;
    ex.fuse -= dt;

    if (ex.flying) moverEnVuelo(ex, dt, world);

    if (ex.fuse <= 0) explode(ex, world);
  }

  for (let i = explosives.length - 1; i >= 0; i--) {
    if (!explosives[i].alive) explosives.splice(i, 1);
  }
}

/** Vuela hacia donde cae. Si choca con algo antes, se queda ahí. */
function moverEnVuelo(ex, dt, world) {
  const falta = distance(ex.x, ex.y, ex.targetX, ex.targetY);
  const paso = ex.type.throwSpeed * dt;

  if (falta <= paso) {
    ex.x = ex.targetX;
    ex.y = ex.targetY;
    ex.flying = false;
    return;
  }

  const ang = Math.atan2(ex.targetY - ex.y, ex.targetX - ex.x);
  const nx = ex.x + Math.cos(ang) * paso;
  const ny = ex.y + Math.sin(ang) * paso;

  // isSolidForMovementAt: un cartucho tirado contra la puerta blindada se
  // frena ahí, igual que contra cualquier pared — y ahí explota, que es lo
  // que la abre.
  const solidoAt = world.map.isSolidForMovementAt || world.map.isSolidAt;
  if (solidoAt(nx, ny)) { ex.flying = false; return; }

  ex.x = nx;
  ex.y = ny;
}

/**
 * ¿Alcanza el estruendo a este punto? Devuelve 'letal', 'borde' o null.
 * Exportada porque la IA la usa para decidir si tiene que salir corriendo.
 */
export function blastAt(ex, x, y, map) {
  const d = distance(ex.x, ex.y, x, y);
  const t = ex.type;
  if (d > t.blastRadius) return null;
  if (!hasLineOfSight(ex.x, ex.y, x, y, map.blocksBulletsAt)) return null;
  return d <= t.lethalRadius ? 'letal' : 'borde';
}

export function explode(ex, world) {
  if (!ex.alive) return;
  ex.alive = false;

  const t = ex.type;
  const map = world.map;
  const porJugador = ex.owner === 'player';

  // --- Guardias ---
  for (const e of world.enemies) {
    if (!e.alive) continue;
    const efecto = blastAt(ex, e.x, e.y, map);
    if (!efecto) continue;

    if (efecto === 'letal') {
      e.alive = false;
      e.health = 0;
      world.bus.emit('impact', { x: e.x, y: e.y, kind: 'flesh' });
      world.bus.emit('enemyKilled', { enemy: e, byPlayer: porJugador });
    } else {
      const murio = damageEnemy(e, t.enemyDamage, ex.x, ex.y);
      world.bus.emit('impact', { x: e.x, y: e.y, kind: 'flesh' });
      if (murio) world.bus.emit('enemyKilled', { enemy: e, byPlayer: porJugador });
    }
  }

  // --- Pasajeros: la dinamita no distingue ---
  for (const pa of world.passengers) {
    if (!pa.alive) continue;
    if (!blastAt(ex, pa.x, pa.y, map)) continue;
    pa.alive = false;
    world.bus.emit('impact', { x: pa.x, y: pa.y, kind: 'flesh' });
    world.bus.emit('passengerKilled', { passenger: pa, byPlayer: porJugador });
  }

  // --- Vos ---
  const p = world.player;
  if (p.alive) {
    const efecto = blastAt(ex, p.x, p.y, map);
    if (efecto) {
      const daño = efecto === 'letal' ? t.playerDamage : t.playerEdgeDamage;
      // Salta la invulnerabilidad: si te comés el estruendo, te lo comés.
      p.invuln = 0;
      if (damagePlayer(p, daño, ex.x, ex.y)) {
        world.bus.emit('playerHit', { x: p.x, y: p.y });
        if (!p.alive) world.bus.emit('playerDown', {});
      }
    }
  }

  /**
   * LA PUERTA BLINDADA ES INMUNE A LAS BALAS: la dinamita es la única forma
   * de abrirla desde afuera. Acá es donde se hace: si el estruendo la
   * alcanza, vuela para siempre (no se vuelve a cerrar).
   */
  if (world.doors) {
    for (const d of world.doors) {
      if (d.kind === 'blindada' && !d.broken && blastAt(ex, d.x, d.y, map)) {
        volarPuerta(d);
      }
    }
  }

  world.camera.shake(t.shake, 0.4);
  world.audio.play('explosion');
  /**
   * `porJugador` y `wagons` viajan en el evento porque el estruendo hace algo
   * que ningún otro ruido hace: pone al tren en COMBATE, no en sospecha (ver
   * `retumbaElTren` en scenes/raidScene.js). Y sólo cuenta si la tiraste vos:
   * la dinamita de un guardia del blindado ya pasa en pleno tiroteo, y usarla
   * para delatar tu posición sería regalarles información que no tienen.
   */
  world.bus.emit('explosion', {
    x: ex.x, y: ex.y, radius: t.lethalRadius,
    porJugador, wagons: t.noiseWagons,
  });
  world.bus.emit('noise', { x: ex.x, y: ex.y, radius: t.noise });
}

/**
 * A qué punto llega el lanzamiento.
 *
 * Se apunta con el mouse, pero el brazo llega hasta donde llega: si apuntás más
 * lejos que el alcance, cae en el alcance. Y si hay una pared en el medio, cae
 * antes de la pared en vez de atravesarla, que es lo que uno espera de algo que
 * se tira con la mano.
 */
export function throwTarget(fromX, fromY, aimX, aimY, range, map) {
  const solidoAt = map.isSolidForMovementAt || map.isSolidAt;
  const dist = Math.min(range, distance(fromX, fromY, aimX, aimY));
  const ang = Math.atan2(aimY - fromY, aimX - fromX);

  let ultimoX = fromX;
  let ultimoY = fromY;

  // Muestreamos cada 5px y, al final, el punto exacto: si no, el alcance real
  // quedaba hasta 5px corto del que dice la ficha del arma.
  for (let d = 6; d <= dist + 5; d += 5) {
    const paso = Math.min(d, dist);
    const x = fromX + Math.cos(ang) * paso;
    const y = fromY + Math.sin(ang) * paso;
    if (solidoAt(x, y)) break;
    ultimoX = x;
    ultimoY = y;
    if (paso >= dist) break;
  }

  return { x: ultimoX, y: ultimoY };
}
