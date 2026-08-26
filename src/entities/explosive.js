/**
 * Un cartucho de dinamita encendido, ya en el aire o en el piso.
 *
 * Este archivo solo dice QUÉ es y cómo se dibuja. Qué hace al explotar está en
 * systems/explosives.js, igual que el guardia y su IA viven separados.
 */

import { CONFIG } from '../data/config.js';
import { EXPLOSIVES } from '../data/explosives.js';

export function createExplosive({ x, y, targetX, targetY, typeId, owner, fuse }) {
  const type = EXPLOSIVES[typeId];

  return {
    x, y,
    typeId,
    type,
    owner,                 // 'player' | 'enemy'
    fuse,                  // lo que le queda de mecha
    alive: true,

    // Vuelo: va hasta el punto donde cae y ahí se queda, chispeando.
    targetX, targetY,
    flying: true,

    // Solo para el dibujo: da vueltas en el aire y sube y baja.
    spin: 0,
    flightTotal: Math.hypot(targetX - x, targetY - y) || 1,
  };
}

/**
 * Dibuja el cartucho.
 *
 * La mecha se ve: cuanto menos le queda, más rápido parpadea y más grande es la
 * chispa. Es la única información que el jugador necesita para decidir si se
 * queda o se va, y tiene que leerse sin contar segundos.
 */
export function drawExplosive(r, ex) {
  const c = CONFIG.colors;
  const t = ex.type;
  const restante = Math.max(0, ex.fuse) / t.fuse;

  // Mientras vuela describe un arco: sube y baja. Es puro dibujo.
  let altura = 0;
  if (ex.flying) {
    const falta = Math.hypot(ex.targetX - ex.x, ex.targetY - ex.y);
    const avance = 1 - Math.min(1, falta / ex.flightTotal);
    altura = Math.sin(avance * Math.PI) * 9;
  }

  const y = ex.y - altura;

  // Sombra en el piso: sin esto no se entiende que está por el aire.
  if (altura > 0.5) {
    r.ctx.globalAlpha = 0.3;
    r.box(ex.x, ex.y + 3, 3, 1, '#000');
    r.ctx.globalAlpha = 1;
  }

  // El cartucho.
  r.box(ex.x, y, 3, 2, c.dynamite);
  r.box(ex.x, y, 1, 2, c.dynamiteBand);

  // La chispa: parpadea cada vez más rápido a medida que se acaba la mecha.
  const ritmo = 6 + (1 - restante) * 26;
  const encendida = Math.floor(ex.spin * ritmo) % 2 === 0;
  if (encendida) {
    const tam = 1 + Math.round((1 - restante) * 2);
    r.box(ex.x, y - 4, tam, tam, restante < 0.35 ? '#fff4c0' : '#ffb45c');
  }

  // En el piso y a punto de reventar, un aro de aviso.
  if (!ex.flying && restante < 0.45) {
    r.circle(ex.x, ex.y, t.lethalRadius, '#ff7a4a', 0.16 + (1 - restante) * 0.2);
  }
}
