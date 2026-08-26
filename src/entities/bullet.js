/** Una bala. Un punto que viaja y desaparece. */

import { CONFIG } from '../data/config.js';

export function createBullet({ x, y, angle, speed, damage, range, owner, fromRider }) {
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    owner,                 // 'player' | 'enemy'
    // Las balas que entran por la ventanilla desde afuera se marcan aparte:
    // pasan por encima del que está agachado contra la pared, debajo del marco.
    fromRider: !!fromRider,
    life: range / speed,   // segundos hasta agotarse
    alive: true,
    trailX: x,
    trailY: y,
  };
}

export function drawBullet(r, b) {
  const col = CONFIG.colors;
  const color = b.owner === 'player' ? col.bulletP : col.bulletE;

  // La estela hace que se vea de dónde viene sin tener que dibujar sprites.
  r.line(b.trailX, b.trailY, b.x, b.y, color, 0.45);
  r.box(b.x, b.y, 1, 1, color);
}
