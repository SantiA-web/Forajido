/**
 * Colisiones: cajas alineadas a los ejes (AABB) contra el mapa de tiles.
 * No hace falta un motor de físicas para esto.
 *
 * Un "body" es cualquier objeto con { x, y, hw, hh } donde (x, y) es el
 * CENTRO y hw/hh son la media anchura y media altura.
 */

/** ¿La caja está pisando algún tile sólido? */
export function overlapsSolid(body, isSolidAt) {
  const left = body.x - body.hw;
  const right = body.x + body.hw - 0.01;
  const top = body.y - body.hh;
  const bottom = body.y + body.hh - 0.01;

  return (
    isSolidAt(left, top) ||
    isSolidAt(right, top) ||
    isSolidAt(left, bottom) ||
    isSolidAt(right, bottom)
  );
}

/**
 * Mueve el body y lo frena contra las paredes.
 * Resuelve un eje por vez: así uno puede deslizarse a lo largo de una pared
 * en vez de quedarse trabado en ella.
 */
export function moveAndCollide(body, dx, dy, isSolidAt) {
  const hit = { x: false, y: false };
  if (dx === 0 && dy === 0) return hit;

  // Partimos el movimiento en pasitos de máximo 2px para no atravesar paredes.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2));
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let i = 0; i < steps; i++) {
    if (stepX !== 0) {
      body.x += stepX;
      if (overlapsSolid(body, isSolidAt)) { body.x -= stepX; hit.x = true; }
    }
    if (stepY !== 0) {
      body.y += stepY;
      if (overlapsSolid(body, isSolidAt)) { body.y -= stepY; hit.y = true; }
    }
  }
  return hit;
}

/** ¿El punto (px, py) está dentro de la caja del body? */
export function pointInBody(px, py, body) {
  return (
    px >= body.x - body.hw && px <= body.x + body.hw &&
    py >= body.y - body.hh && py <= body.y + body.hh
  );
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/**
 * Línea de visión: ¿se puede trazar una recta entre dos puntos sin que
 * algo la corte? Muestreamos cada 5px; suficiente para tiles de 16.
 *
 * `blocksSightAt.dejaVerDesdeAdentro` (si la función lo trae, ver
 * world/tilemap.js) perdona lo que tapa en la casilla de cualquiera de los dos
 * extremos: la res en la que estás parado no te esconde.
 */
export function hasLineOfSight(x1, y1, x2, y2, blocksSightAt) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(dist / 5);
  if (steps === 0) return true;

  const stepX = (x2 - x1) / steps;
  const stepY = (y2 - y1) / steps;
  const desdeAdentro = blocksSightAt.dejaVerDesdeAdentro;

  for (let i = 1; i < steps; i++) {
    const x = x1 + stepX * i;
    const y = y1 + stepY * i;
    if (!blocksSightAt(x, y)) continue;
    if (desdeAdentro && desdeAdentro(x, y, x1, y1, x2, y2)) continue;
    return false;
  }
  return true;
}

/** Diferencia mínima entre dos ángulos, siempre en el rango -PI..PI. */
export function angleDifference(a, b) {
  let diff = (b - a + Math.PI) % (Math.PI * 2);
  if (diff < 0) diff += Math.PI * 2;
  return diff - Math.PI;
}
