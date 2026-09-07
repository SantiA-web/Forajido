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

/**
 * EL ARMA DECIDE QUÉ TAN FUERTE Y QUÉ TAN RÁPIDO — NO CÓMO FUNCIONA ESTO.
 *
 * Las dos situaciones (por la espalda / de frente) son las mismas para las
 * tres armas y no cambiaron: lo único que el catálogo aporta es el daño, la
 * velocidad y si el golpe por la espalda mata o noquea. Ver data/melee.js.
 *
 * Lo que NO sale del arma sigue en CONFIG.melee, porque es del SISTEMA y no de
 * lo que tengas en la mano: el alcance, el arco del golpe, cuánto aturde, el
 * empujón y cuánto ruido hace cada situación. Un cuchillo y un hacha no
 * cambian a qué distancia podés alcanzar a alguien de un manotazo.
 */
export function playerMelee(p, world) {
  const m = CONFIG.melee;
  const arma = p.melee || { damage: m.damage, cooldown: m.cooldown, swingTime: m.swingTime, noquea: false };

  p.meleeTimer = arma.cooldown;
  p.meleeSwing = arma.swingTime;
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

  /**
   * POR LA ESPALDA, A ALGUIEN QUE NO TE VIO — la ejecución silenciosa.
   *
   * `e.inconsciente > 0` cuenta como "no te vio" por lo obvio: está desmayado.
   * Eso permite REMATAR con el filo a alguien que noqueaste con la culata, que
   * es la jugada que conecta las dos armas — noqueás rápido para sacarlo del
   * medio, y si te sobra un segundo volvés a asegurarlo.
   */
  if ((isFromBehind(p, e, m) && e.state !== 'combat') || e.inconsciente > 0 || e.rendido) {
    /**
     * DE QUÉ SITUACIÓN VIENE, ANTES DE TOCAR NADA — hace falta para el
     * honor (ver `honorDelta`, state/gameState.js): rematar a alguien que se
     * había rendido pesa distinto que rematar a alguien que noqueaste vos, y
     * los dos son distintos de un degüello normal a quien nunca te vio.
     */
    /**
     * SI YA SE ESTABA PARANDO PARA TRAICIONARTE, matarlo no es rematar a un
     * indefenso — el aviso ya sonó (ver CONFIG.enemy.traicionDuracion) y esto
     * es defenderte de algo que viste venir. Por eso `eraRendido` exige que
     * NO esté en medio de la traición.
     */
    const eraRendido = e.rendido && !e.traicionLevantando;
    const eraNoqueado = e.inconsciente > 0;

    if (arma.noquea) {
      /**
       * LA CULATA NO MATA: lo deja tirado, respirando, por
       * `CONFIG.melee.noqueoDuracion`. Sigue `alive`, así que no cuenta como
       * muerto en ningún lado (ni en las estadísticas, ni en la recompensa).
       *
       * PERO SÍ MUEVE `honor`, UN POCO, SI ES UN NOQUEO LIMPIO — la mitad
       * que faltaba de la idea original ("noquear en vez de matar, por la
       * espalda" — ver la tabla en NOTAS-DISENO.md, sección de honor):
       * elegiste dejarlo vivo cuando el cuchillo lo hubiera matado igual de
       * silencioso. `limpio` exige que NO fuera ya un remate (ni estaba
       * rendido ni ya noqueado) — culatear a alguien que ya se había
       * entregado o que ya estaba en el piso es la zona neutra de siempre,
       * no suma nada para ningún lado.
       */
      const limpio = !eraRendido && !eraNoqueado;

      e.inconsciente = m.noqueoDuracion;
      e.rendido = false;
      e.stagger = 0;
      e.aimTimer = 0;
      e.burstLeft = 0;
      e.peeking = false;
      e.coverPoint = null;
      e.atCover = false;
      world.audio.play('takedown');
      world.bus.emit('impact', { x: e.x, y: e.y, kind: 'flesh' });
      world.bus.emit('enemyKnockedOut', { enemy: e, limpio });
      world.bus.emit('noise', { x: e.x, y: e.y, radius: m.quietNoise });
      return;
    }

    // Con filo: degüello de siempre — silencioso e instantáneo.
    e.alive = false;
    e.health = 0;
    e.inconsciente = 0;
    world.audio.play('takedown');
    world.bus.emit('impact', { x: e.x, y: e.y, kind: 'flesh' });
    world.bus.emit('enemyKilled', {
      enemy: e, byPlayer: true, silent: true, rendido: eraRendido, indefenso: eraNoqueado,
    });
    world.bus.emit('noise', { x: e.x, y: e.y, radius: m.quietNoise });
    return;
  }

  // Golpe de frente: hace daño y lo aturde, pero es un escándalo.
  const died = damageEnemy(e, arma.damage, p.x, p.y);
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
