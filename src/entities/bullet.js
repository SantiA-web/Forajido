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

/** Un punto de dibujo: un cuarto de unidad, con la lupa de ×4. */
const PUNTO = 0.25;

/**
 * 🔁 LA BALA, A LA RESOLUCIÓN NUEVA (etapa 4).
 *
 * Era un cuadrado de UNA UNIDAD con una estela de una unidad de ancho: con la
 * lupa eso son cuatro por cuatro puntos de bala y una raya tan gruesa como el
 * brazo del que disparó. Una bala no es un objeto que se mira: es un destello
 * que cruza. Ahora la estela es de un punto y la bala es un grano con el
 * núcleo encendido.
 */
export function drawBullet(r, b) {
  const col = CONFIG.colors;
  const color = b.owner === 'player' ? col.bulletP : col.bulletE;

  // La estela hace que se vea de dónde viene sin tener que dibujar sprites.
  r.line(b.trailX, b.trailY, b.x, b.y, color, 0.5, PUNTO);
  r.line(b.trailX, b.trailY, b.x, b.y, '#fff2c8', 0.22, PUNTO);
  r.box(b.x, b.y, 2 * PUNTO, 2 * PUNTO, color);
  r.box(b.x, b.y, PUNTO, PUNTO, '#fff6d8');
}

/**
 * EL FOGONAZO, en la punta del caño.
 *
 * 🔁 Era un cuadrado de 4×4 unidades pegado a la mano —dieciséis por dieciséis
 * puntos, casi un cuarto de una persona—: a la resolución vieja era un destello
 * y a la nueva es un ladrillo amarillo. Ahora es lo que es: TRES LENGUAS de
 * fuego, una por el caño y dos abiertas, que es lo que lo hace leer como fuego
 * y no como una raya, con el núcleo blanco adentro.
 *
 * Lo usan el jugador y los guardias: el fogonazo es del ARMA, no de quién la
 * tiene, y si cada uno tuviera el suyo habría que aprender dos.
 */
export function dibujarFogonazo(r, x, y, angulo, fuerza = 1) {
  const f = Math.max(0, Math.min(1, fuerza));
  if (f <= 0) return;
  const largo = (5 + f * 5) * PUNTO;
  for (const [da, esc] of [[0, 1], [-0.55, 0.62], [0.55, 0.62]]) {
    const a = angulo + da;
    r.line(x, y, x + Math.cos(a) * largo * esc, y + Math.sin(a) * largo * esc,
      '#ffca62', 0.85 * f + 0.15, PUNTO);
  }
  r.box(x, y, 2 * PUNTO, 2 * PUNTO, '#ffe9a8');
  r.box(x, y, PUNTO, PUNTO, '#fffbe8');
}
