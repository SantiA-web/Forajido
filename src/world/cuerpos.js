/**
 * 🎯 DÓNDE LE PEGA UNA BALA A UNA PERSONA (en el campo: conductores, pasajeros, escopeteros, la escolta y tú).
 *
 * 🔁 2026-11-26 *(Santi: "fijate la hitbox de los guardias, sobre todo el que va sentado al lado del conductor. Veo como
 * si las balas no le pegaran siempre cuando sí debería")*. Antes cada uno era una bolita alrededor del pecho: al sentado
 * no se le pegaba en los hombros, la cabeza ni el sombrero (casi la mitad del dibujo); al de pie, no en las piernas; y al
 * jinete la bolita le quedaba arriba del sombrero. Ahora cada uno es una **columna** del tamaño de lo que se ve: de cerca
 * del suelo (o de la silla) hasta la cabeza, con `radio` de ancho para cada lado. Las medidas, del dibujo
 * (`CAMPO.carretas.guardias.columna`): de pie 1,72 m con el sombrero, agachado 1,48, sentado 1,42 (desde donde apoya los
 * pies), y el jinete de 0,5 m bajo la silla a 1,1 m sobre ella.
 *
 * Todo en unidades del mundo, con la `y` de la pantalla (crece hacia abajo): `abajo` > `arriba`.
 */

/** La columna de una persona con los pies en (x, pies): `postura` 'pie', 'agachado' o 'sentado'. `K`: la `columna` de los datos. */
export function columnaDe(x, pies, postura, K, M) {
  return { x, abajo: pies - K.abajo * M, arriba: pies - K[postura] * M, radio: K.radio * M };
}

/** La de un jinete, desde su silla (sx, sy). */
export function columnaMontado(sx, sy, K, M) {
  return { x: sx, abajo: sy - K.montado[0] * M, arriba: sy - K.montado[1] * M, radio: K.radio * M };
}

/** Lo más cerca que pasa el punto (px, py) del tramo (ax, ay)→(bx, by): { t (0 a 1, en el tramo), d }. */
function alTramo(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
  return { t, d: Math.hypot(ax + vx * t - px, ay + vy * t - py) };
}

/**
 * Si el tramo de bala (x0, y0)→(x1, y1) toca la columna `col`: en qué parte del tramo (0, al salir; 1, al final), para
 * saber a quién le pega primero cuando hay dos en el camino. null si no la toca.
 */
export function tocaCuerpo(x0, y0, x1, y1, col) {
  if (!col) return null;
  const { x, abajo, arriba, radio } = col;
  // (La cruza: el tramo pasa por la x de la columna entre la cabeza y los pies.)
  if (x1 !== x0) {
    const t = (x - x0) / (x1 - x0);
    if (t >= 0 && t <= 1) { const y = y0 + (y1 - y0) * t; if (y >= arriba && y <= abajo) return t; }
  }
  // (Si no, la pasa cerca: lo más cerca entre las puntas de uno y el otro.)
  let mejor = null;
  const ver = (t, d) => { if (d <= radio && (mejor === null || t < mejor)) mejor = t; };
  const a = alTramo(x0, y0, x, arriba, x, abajo); ver(0, a.d);
  const b = alTramo(x1, y1, x, arriba, x, abajo); ver(1, b.d);
  const c = alTramo(x, arriba, x0, y0, x1, y1); ver(c.t, c.d);
  const d = alTramo(x, abajo, x0, y0, x1, y1); ver(d.t, d.d);
  return mejor;
}

/** Si el punto (px, py) cae sobre la columna (para saber a quién le apuntabas). */
export function enCuerpo(px, py, col) {
  return !!col && alTramo(px, py, col.x, col.arriba, col.x, col.abajo).d <= col.radio;
}
