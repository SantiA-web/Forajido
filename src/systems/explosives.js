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
import { reventarCaja, esCajaFuerte } from '../entities/lootable.js';
import { EXPLOSIVES } from '../data/explosives.js';

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

  /**
   * --- Y LAS CAJAS FUERTES: la dinamita también es una llave para ellas ---
   *
   * *(Santi: "si no querés intentar abrirlas, podés explotarla con
   * dinamita")*
   *
   * Mismo lugar y misma idea que la puerta del blindado, tres líneas más
   * arriba: hay cerraduras que no se abren con paciencia. La caja no
   * desaparece ni te da la plata sola — queda REVENTADA, con el botín a la
   * vista, y levantarlo cuesta lo mismo que una bolsa. La dinamita te ahorra
   * los ocho segundos de forcejeo, no el viaje hasta ahí.
   *
   * Vale para las dos cajas del juego, incluida la oculta: si el estruendo la
   * alcanza deja de estar escondida — no se puede reventar algo y que siga
   * siendo un secreto.
   */
  if (world.loot) {
    for (const l of world.loot) {
      if (!esCajaFuerte(l) || l.taken || l.reventada) continue;
      if (!blastAt(ex, l.x, l.y, map)) continue;
      reventarCaja(l);
    }
  }

  /**
   * --- Y LOS CAJONES DE PÓLVORA: la cadena (Fase 6a) ---
   *
   * *(Santi: "las dinamitas lanzadas también hacen que exploten los barriles.
   * Un barril explotado, explota todo en el vagón por una explosión en
   * cadena")*
   *
   * Va después de todo lo demás a propósito: esta explosión ya resolvió a
   * quién mató y qué abrió, y recién ahí prende a los demás. Cada uno de
   * ellos hará lo mismo cuando le toque su turno, así que no hace falta
   * ninguna lógica especial de "explosión múltiple" — es la misma explosión
   * de siempre, varias veces.
   */
  encadenar(ex, world);

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
 * PRENDER UN CAJÓN DE PÓLVORA (entities/cajon.js).
 *
 * El cajón deja de existir como cajón y nace un explosivo exactamente donde
 * estaba. Todo lo que sigue —la mecha que parpadea, el aro de aviso, los
 * guardias que salen corriendo, el estruendo que retumba tres vagones— es el
 * sistema de la dinamita sin una línea nueva.
 *
 * `owner` viaja desde lo que lo prendió (tu bala, tu cartucho, el de un
 * guardia) y es lo que decide si los muertos cuentan como tuyos y si la
 * explosión te delata (ver `retumbaElTren` en scenes/raidScene.js). El que
 * hizo saltar la mecha se hace cargo de lo que pase después, incluso de lo
 * que voló en cadena tres cajones más allá.
 */
export function prenderCajon(cajon, world, owner, fuse) {
  if (!cajon.alive) return;
  cajon.alive = false;
  soltarExplosivo(cajon.x, cajon.y, world, owner, fuse);
}

/**
 * NACE UNA MECHA ENCENDIDA EN ESTE PUNTO.
 *
 * Va aparte de `prenderCajon` porque hay dos cosas que pueden prenderse y sólo
 * una es un cajón quieto: la otra es un cajón EMPUJADO, que para entonces ya
 * es un `rodante` y ya lo marcó como roto `dañarRodante`. Las dos terminan en
 * el mismo lugar — un explosivo puesto donde estaba, con todo lo que eso trae
 * gratis (la chispa que parpadea, el aro de aviso, los guardias que salen
 * corriendo y el estruendo que retumba tres vagones).
 */
export function soltarExplosivo(x, y, world, owner, fuse) {
  const t = EXPLOSIVES.cajonPolvora;
  world.spawnExplosive({
    // No se lanza: nace donde estaba. `createExplosive` resuelve el vuelo de
    // cero en el primer cuadro y se queda ahí chispeando.
    x, y, targetX: x, targetY: y,
    typeId: t.id,
    owner,
    fuse: fuse ?? t.fuse,
  });
  world.audio.play('fuse');
}

/**
 * LA CADENA — una explosión adentro de un vagón prende TODOS sus cajones.
 *
 * DOS DECISIONES QUE IMPORTAN:
 *
 * 1. ES POR VAGÓN, NO POR RADIO. Los tres cajones del vagón de armas están
 *    repartidos a lo largo de 480 px y la explosión alcanza 68: por cercanía
 *    no se prenderían nunca entre ellos, y "explota todo en el vagón" no
 *    pasaría. La cadena no es física, es del lugar.
 *
 * 2. Y TIENE QUE PASAR ADENTRO DEL VAGÓN (`tramoAt`), no en el enganche de al
 *    lado. Si valiera desde la pasarela, se podría volar el vagón entero
 *    desde afuera sin entrar nunca — y este vagón existe para que entrar sea
 *    la decisión.
 *
 * Se ordenan por cercanía y se les da una mecha creciente: el más cerca del
 * estruendo primero. Así la cadena AVANZA en una dirección legible en vez de
 * ser un fogonazo, y cada eslabón te regala los píxeles que alcanzás a correr
 * mientras llega.
 */
function encadenar(ex, world) {
  const train = world.train;
  const cajones = world.cajones;
  if (!train || !cajones || cajones.length === 0) return;
  if (train.tramoAt(ex.x) !== 'vagon') return;

  const vagon = train.wagonAt(ex.x);
  // `c.cargado`: los que ya vaciaste no entran en la cadena. Es lo que hace
  // que sacarles el cartucho sea desactivarlos y no sólo cobrar la dinamita.
  const enElVagon = cajones
    .filter((c) => c.alive && c.cargado && c.wagon === vagon)
    .sort((a, b) =>
      distance(ex.x, ex.y, a.x, a.y) - distance(ex.x, ex.y, b.x, b.y));

  const paso = EXPLOSIVES.cajonPolvora.cadena;
  enElVagon.forEach((c, i) => prenderCajon(c, world, ex.owner, paso * (i + 1)));
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
