/**
 * Guardias del tren.
 * Este archivo define QUÉ es un guardia y cómo se dibuja.
 * Cómo piensa está en systems/ai.js (separado a propósito).
 */

import { CONFIG } from '../data/config.js';
import { GUARD_TYPES, DEFAULT_GUARD_TYPE, guardHealth } from '../data/guards.js';

export function createEnemy(x, y, options = {}) {
  const c = CONFIG.enemy;
  const typeId = options.type || DEFAULT_GUARD_TYPE;
  const health = options.health ?? guardHealth(typeId);

  return {
    x, y,
    hw: c.hw, hh: c.hh,

    // El tipo decide cuánto aguanta y cómo se ve. La dificultad del tren ya
    // vino sumada en `options.health` (ver world/train.js).
    type: typeId,
    look: (GUARD_TYPES[typeId] || GUARD_TYPES[DEFAULT_GUARD_TYPE]).look,
    health,
    maxHealth: health,
    alive: true,

    /**
     * SU PROPIO PERFIL DE IA. Por defecto, una copia llana de CONFIG.enemy —
     * así un guardia sin overrides se comporta exactamente igual que antes.
     * `world/train.js` (`construirPerfilIA`) le suma lo que le toque según
     * la dificultad del tren (puntería, reacción, sospecha, asomada) y el
     * tipo de tren (velocidad de sospecha). Ver systems/ai.js: las partes
     * que varían leen `e.ai`, no `CONFIG.enemy` directamente.
     */
    ai: options.ai || c,

    state: 'patrol',            // patrol | suspicious | combat
    facing: options.facing ?? Math.PI,

    // Ronda: lista de puntos del mundo que recorre en orden.
    path: options.path || [],
    pathIndex: 0,
    waitTimer: 0,

    // Sospecha: sube mientras te tiene a la vista, baja cuando te perdés.
    suspicion: 0,
    memoryTimer: 0,

    target: { x, y },           // a dónde va cuando investiga
    lastSeen: null,
    lostTimer: 0,

    // Cobertura y fuego
    coverPoint: null,
    atCover: false,
    coverTimer: 0,
    peeking: false,
    peekSide: 1,
    peekAxis: { x: 0, y: 1 },
    peekOffset: CONFIG.enemy.peekSteps[0],
    holdTimer: 0,
    aimTimer: 0,
    aimDir: 0,
    cooldown: 0,
    burstLeft: 0,
    burstTimer: 0,

    // Cuerpo a cuerpo
    meleeTimer: 0,
    meleeWindup: 0,
    stagger: 0,

    // Dinamita: solo los guardias del vagón blindado llevan, y una cada uno.
    dynamite: options.dynamite || 0,
    throwWindup: 0,
    throwCooldown: 0,

    hitFlash: 0,
    alertMark: 0,
  };
}

export function damageEnemy(e, amount, fromX, fromY) {
  if (!e.alive) return false;

  /**
   * Medio segundo intocable mientras entra en furia (ver data/bosses.js). Sólo
   * los mini jefes lo usan; un guardia nunca tiene este campo en otra cosa que
   * no sea 0.
   */
  if (e.invulnerable > 0) return false;

  e.health -= amount;
  e.hitFlash = CONFIG.feel.hitFlash;
  e.lastSeen = { x: fromX, y: fromY };

  /**
   * UN MINI JEFE NO PIERDE EL APUNTADO PORQUE LE PEGUEN.
   *
   * Un guardia sí: si le acertás mientras se asoma, se mete atrás de la
   * cobertura, y eso está bien — es lo que premia acertar primero. Pero
   * aplicado a un jefe lo rompía por completo: con el Colt (un tiro cada
   * 0,40 s) y su apuntado de rifle (0,55 s), dispararle sin parar le
   * cancelaba el gesto ANTES de que saliera cada tiro. Nunca llegaba a
   * disparar, o sea que la pelea se ganaba apretando el gatillo sin pensar.
   *
   * Su forma de castigar que le tires es otra, y ya está construida: la
   * embestida. Éste es exactamente el tipo de interacción entre dos sistemas
   * viejos que sólo aparece cuando se juntan.
   */
  if (e.esJefe) {
    if (e.health <= 0) {
      e.health = 0;
      e.alive = false;
      return true;
    }
    return false;
  }

  if (e.state !== 'combat') {
    e.state = 'combat';
    e.suspicion = 1;
    e.alertMark = 1;
    e.cooldown = Math.max(e.cooldown, CONFIG.enemy.reactionTime);
  } else {
    // Si le pegan mientras está asomado, se mete atrás de la cobertura.
    e.peeking = false;
    e.aimTimer = 0;
    e.burstLeft = 0;
    e.holdTimer = Math.max(e.holdTimer, 0.5);
  }

  if (e.health <= 0) {
    e.health = 0;
    e.alive = false;
    return true;
  }
  return false;
}

export function drawEnemy(r, e) {
  const col = CONFIG.colors;

  if (!e.alive) {
    r.box(e.x, e.y, 6, 4, col.blood);
    r.box(e.x, e.y, 5, 3, col.enemyDead);
    return;
  }

  if (e.state !== 'combat') drawVisionCone(r, e);

  r.ctx.globalAlpha = 0.25;
  r.box(e.x, e.y + 6, 5, 2, '#000');
  r.ctx.globalAlpha = 1;

  const bodyColor = e.hitFlash > 0
    ? '#fff'
    : e.stagger > 0 ? '#c9c2b4'
    : e.state === 'combat' ? col.enemyAlert
    : e.suspicion > 0.05 ? col.enemySus
    : col.enemy;

  // Mecha encendida en la mano: el aviso de que te va a tirar una dinamita.
  // Tiene que verse de lejos y sin ambigüedad, porque la respuesta correcta
  // (salir de la cobertura ya mismo) es contraria a todo lo demás que aprendiste.
  if (e.throwWindup > 0) {
    const parpadeo = Math.floor(e.throwWindup * 22) % 2 === 0;
    r.box(e.x, e.y - 10, 2, 2, col.dynamite);
    if (parpadeo) r.box(e.x, e.y - 14, 2, 2, '#fff4c0');
    r.text('!', e.x + 7, e.y - 14, '#ff7a4a');
  }

  // Levanta el brazo antes de pegarte: ese es el aviso del cuerpo a cuerpo.
  if (e.meleeWindup > 0) {
    const c = CONFIG.enemy;
    r.line(
      e.x, e.y,
      e.x + Math.cos(e.facing) * c.meleeRange,
      e.y + Math.sin(e.facing) * c.meleeRange,
      '#ff8a5c', 0.75
    );
  }

  // El único aviso de que va a disparar: se para en seco y levanta el arma.
  // (Antes había una línea roja marcando la trayectoria; era demasiado fácil.)
  const gunLength = e.aimTimer > 0 ? 11 : 8;
  r.line(
    e.x, e.y,
    e.x + Math.cos(e.facing) * gunLength,
    e.y + Math.sin(e.facing) * gunLength,
    e.aimTimer > 0 ? '#d8cdbb' : '#2a2622'
  );
  if (e.aimTimer > 0) {
    r.box(e.x + Math.cos(e.facing) * 12, e.y + Math.sin(e.facing) * 12, 1, 1, '#fff6d0');
  }

  r.box(e.x, e.y, 5, 5, bodyColor);
  r.rect(e.x - 6, e.y - 6, 12, 3, '#4a4038');

  /**
   * El TIPO de guardia se lee en la silueta, nunca en el color del cuerpo.
   * El color ya está ocupado diciendo el ESTADO (gris/amarillo/rojo), que es la
   * información más importante del juego momento a momento. Si el tipo pisara
   * ese color, ganaríamos saber quién es y perderíamos saber si te vio.
   */
  if (e.look === 'placa') {
    r.rect(e.x - 5, e.y - 2, 10, 5, '#59616b');
    r.rect(e.x - 5, e.y - 2, 10, 1, '#7d8794');
    r.rect(e.x - 7, e.y - 7, 14, 2, '#3a332c');   // sombrero más ancho
  }

  /**
   * EL SHERIFF: la estrella. Es lo único dorado que lleva una persona en todo
   * el tren, así que se lo distingue de un vistazo sin tocar el color del
   * cuerpo (que sigue diciendo el estado, como manda la regla de arriba).
   *
   * La cruz de cinco píxeles no es pereza: a esta escala una estrella
   * "de verdad" (con puntas en diagonal) se lee como una mancha. Lo que la
   * hace reconocible es que sea SIMÉTRICA y del color que no usa nadie más.
   */
  if (e.look === 'estrella') {
    r.rect(e.x - 8, e.y - 7, 16, 2, '#3a332c');   // ala del sombrero, ancha
    r.rect(e.x - 1, e.y - 3, 3, 5, '#e8c34a');    // la estrella: palo vertical
    r.rect(e.x - 3, e.y - 1, 7, 2, '#e8c34a');    // y el travesaño
    r.rect(e.x - 1, e.y - 4, 1, 1, '#fff2b8');    // un brillo arriba
  }

  /**
   * Cuánto le queda, solo cuando ya está herido.
   *
   * Hace falta ahora que la vida va de 2 a 4 según el tipo y la dificultad del
   * tren: sin esto no hay forma de saber si a este tipo le queda un tiro o
   * tres. Aparece recién al primer impacto para no llenar la pantalla de
   * barritas cuando todavía no pasó nada.
   */
  if (e.health < e.maxHealth) {
    const ancho = 3;
    const total = e.maxHealth * (ancho + 1) - 1;
    for (let i = 0; i < e.maxHealth; i++) {
      r.rect(
        e.x - total / 2 + i * (ancho + 1), e.y - 17, ancho, 2,
        i < e.health ? '#e0c44a' : '#4a3a2a'
      );
    }
  }

  if (e.state === 'combat') {
    if (e.alertMark > 0) r.text('!', e.x, e.y - 14, '#ffd84a');
  } else if (e.suspicion > 0.04) {
    // Barrita de sospecha: te muestra cuánto te queda para romper el contacto.
    const w = 12;
    r.rect(e.x - w / 2, e.y - 13, w, 2, '#1a1512');
    r.rect(e.x - w / 2, e.y - 13, w * Math.min(1, e.suspicion), 2,
      e.suspicion > 0.66 ? '#e07a4a' : '#e0c44a');
  }
}

function drawVisionCone(r, e) {
  const c = CONFIG.enemy;
  const ctx = r.ctx;

  ctx.save();
  ctx.globalAlpha = 0.07 + e.suspicion * 0.13;
  ctx.fillStyle = e.suspicion > 0.5 ? '#ffb98a' : '#ffe9a8';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const a = e.facing - c.viewAngle + (c.viewAngle * 2 * i) / steps;
    ctx.lineTo(e.x + Math.cos(a) * c.viewDistance, e.y + Math.sin(a) * c.viewDistance);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
