/**
 * Sistema de cobertura, compartido por el jugador y por los guardias.
 *
 * Dos preguntas distintas:
 *  - findCoverSurface: "¿hay una pared acá al lado para pegarme?"  (jugador)
 *  - findCoverPoint:   "¿a qué baldosa me conviene ir para que ese tipo
 *                       no me pueda pegar un tiro?"                (guardias)
 */

import { CONFIG } from '../data/config.js';
import { hasLineOfSight } from '../engine/collision.js';

const DIRECTIONS = [
  { dx: 1, dy: 0, sx: 0, sy: 1 },   // pared a la derecha  -> se desliza en vertical
  { dx: -1, dy: 0, sx: 0, sy: 1 },  // pared a la izquierda
  { dx: 0, dy: 1, sx: 1, sy: 0 },   // pared abajo         -> se desliza en horizontal
  { dx: 0, dy: -1, sx: 1, sy: 0 },  // pared arriba
];

/**
 * Busca la pared más cercana para pegarse.
 * Devuelve la posición pegada, la normal (apuntando LEJOS de la pared) y el eje
 * sobre el que se puede deslizar. null si no hay nada a mano.
 */
export function findCoverSurface(x, y, hw, hh, map, reach) {
  const size = map.size;
  let best = null;

  for (const dir of DIRECTIONS) {
    const half = dir.dx !== 0 ? hw : hh;

    for (let offset = half + 1; offset <= half + reach; offset += 2) {
      const probeX = x + dir.dx * offset;
      const probeY = y + dir.dy * offset;
      if (!map.isSolidAt(probeX, probeY)) continue;

      const col = Math.floor(probeX / size);
      const row = Math.floor(probeY / size);

      let flushX = x, flushY = y;
      if (dir.dx === 1) flushX = col * size - hw - 0.5;
      else if (dir.dx === -1) flushX = (col + 1) * size + hw + 0.5;
      else if (dir.dy === 1) flushY = row * size - hh - 0.5;
      else flushY = (row + 1) * size + hh + 0.5;

      const candidate = {
        x: flushX, y: flushY,
        nx: -dir.dx, ny: -dir.dy,     // normal: hacia el lado descubierto
        sx: dir.sx, sy: dir.sy,       // eje de deslizamiento
        distance: offset,
      };

      if (!best || candidate.distance < best.distance) best = candidate;
      break;   // en esta dirección ya encontramos la pared más cercana
    }
  }

  return best;
}

/** ¿Sigue habiendo pared donde nos pegamos? (te podés haber deslizado hasta el borde) */
export function coverStillValid(x, y, hw, hh, surface, map) {
  const half = surface.nx !== 0 ? hw : hh;
  const probeX = x - surface.nx * (half + 2);
  const probeY = y - surface.ny * (half + 2);
  return map.isSolidAt(probeX, probeY);
}

/**
 * ¿Cómo tiene que asomarse el que está en este punto para tener tiro?
 *
 * Prueba a asomarse cada vez más, y devuelve la PRIMERA asomada que le da
 * línea de tiro. O sea: expone lo mínimo indispensable. Si ni asomándose del
 * todo ve al objetivo, devuelve null y esa cobertura no sirve.
 *
 * Esto es lo que evita el bug de un guardia parapetado detrás de un asiento
 * disparándole a la madera para siempre.
 *
 * `preferSide` decide POR QUÉ LADO prueba primero. Por defecto es siempre el
 * mismo (+1), y eso estaba bien mientras cada guardia peleara por su cuenta:
 * con dos tipos detrás de la misma fila de asientos, los dos se asomaban por
 * el mismo lado y cubrían el mismo ángulo — o sea que el segundo no aportaba
 * nada que el primero no estuviera cubriendo ya. La escolta del Sheriff se
 * reparte los lados (ver `ladoPreferido` en raidScene.js) para que entre los
 * dos tapen las dos salidas en vez de una sola dos veces.
 */
export function findPeek(map, point, targetX, targetY, peekSteps = CONFIG.enemy.peekSteps, preferSide = 1) {
  const dx = targetX - point.x;
  const dy = targetY - point.y;
  // Se asoma perpendicular a la dirección del objetivo.
  const axis = Math.abs(dx) > Math.abs(dy) ? { x: 0, y: 1 } : { x: 1, y: 0 };
  const sides = preferSide < 0 ? [-1, 1] : [1, -1];

  for (const offset of peekSteps) {
    for (const side of sides) {
      const px = point.x + axis.x * offset * side;
      const py = point.y + axis.y * offset * side;
      if (map.isSolidAt(px, py)) continue;
      if (!hasLineOfSight(px, py, targetX, targetY, map.blocksSightAt)) continue;
      return { axis, side, offset };
    }
  }
  return null;
}

/**
 * COBERTURA PARA REPLEGARSE — la que está DETRÁS, no la mejor para pelear.
 *
 * `findCoverPoint` (abajo) contesta "¿a qué baldosa voy para tirarle bien a
 * ese tipo?", y por eso **arrastra al guardia HACIA el jugador**: puntúa
 * `Math.abs(distToTarget - 80)`, o sea que su cobertura ideal está a 80px del
 * blanco, y encima descarta todo lo que quede a más de `viewDistance` (118).
 *
 * 🐛 ESO ROMPÍA EL REPLIEGUE DEL HERIDO, y fue lo que Santi vio jugando:
 * *"no se repliega hasta una cobertura más atrás"*. Medido, con el guardia ya
 * replegado a 110px, la cobertura que el buscador normal le daba estaba **a 45
 * px del jugador**: el tipo se retiraba y a continuación caminaba 65px hacia
 * adelante para "cubrirse". Los dos sistemas estaban bien cada uno por su lado
 * y se contradecían: uno lo alejaba y el otro lo traía.
 *
 * ESTA FUNCIÓN CONTESTA LA OTRA PREGUNTA: "¿a qué baldosa me arrastro para que
 * no me rematen?". Tres diferencias, y las tres son el punto:
 *
 *  1. **Sólo mira lo que lo aleja.** Una baldosa que no esté más lejos del
 *     jugador que donde ya está, no es un repliegue.
 *  2. **No tiene tope de `viewDistance`.** Puede terminar donde ya no te ve — y
 *     está bien: se está escondiendo, no buscando ángulo de tiro. Es lo que
 *     hace que herirlo te lo saque de encima de verdad.
 *  3. **Puntúa al revés:** premia alejarse y penaliza tener que caminar mucho
 *     para lograrlo. La de `findCoverPoint` premia acercarse al blanco.
 *
 * Todo lo demás lo comparte con el buscador normal, y a propósito: el mismo
 * escudo a 13px en la dirección del jugador, el mismo `findPeek` (o sea que
 * sigue siendo una cobertura desde la que se puede pelear, no un rincón donde
 * mirar la pared) y el mismo respeto por la cobertura que ya eligió otro.
 */
export function findCoverAtras(map, fromX, fromY, targetX, targetY, occupied = [], radio = 170) {
  const c = CONFIG.enemy;
  const size = map.size;
  const distActual = Math.hypot(fromX - targetX, fromY - targetY);
  const radiusInTiles = Math.ceil(radio / size);

  const centerCol = Math.floor(fromX / size);
  const centerRow = Math.floor(fromY / size);

  let best = null;
  let bestScore = Infinity;

  for (let row = centerRow - radiusInTiles; row <= centerRow + radiusInTiles; row++) {
    for (let col = centerCol - radiusInTiles; col <= centerCol + radiusInTiles; col++) {
      if (map.isSolidTile(col, row)) continue;

      const point = map.tileCenter(col, row);
      const distToSelf = Math.hypot(point.x - fromX, point.y - fromY);
      if (distToSelf > radio) continue;

      // LA REGLA DE ESTA FUNCIÓN: tiene que alejarlo. Si no, no es replegarse.
      const distToTarget = Math.hypot(point.x - targetX, point.y - targetY);
      if (distToTarget <= distActual) continue;

      if (occupied.some((o) => Math.hypot(o.x - point.x, o.y - point.y) < c.coverSpacing)) continue;

      // Mismo escudo que el buscador normal: algo sólido entre él y el jugador.
      const angle = Math.atan2(targetY - point.y, targetX - point.x);
      if (!map.isSolidAt(point.x + Math.cos(angle) * 13, point.y + Math.sin(angle) * 13)) continue;

      // Y que siga siendo un lugar desde el que se puede pelear.
      const peek = findPeek(map, point, targetX, targetY);
      if (!peek) continue;

      // Premia ganar distancia; castiga tener que cruzar medio vagón para eso.
      const score = distToSelf * 0.8 - (distToTarget - distActual) * 0.6 + peek.offset;
      if (score < bestScore) {
        bestScore = score;
        best = { x: point.x, y: point.y, peek };
      }
    }
  }

  return best;
}

/**
 * Busca una baldosa desde la que se pueda disparar al objetivo estando tapado.
 * Recorre las baldosas cercanas y se queda con la que tenga un obstáculo justo
 * en la dirección del objetivo Y desde la que se pueda asomar a tirar.
 */
export function findCoverPoint(map, fromX, fromY, targetX, targetY, occupied = []) {
  const c = CONFIG.enemy;
  const size = map.size;
  const radiusInTiles = Math.ceil(c.coverSearchRadius / size);

  const centerCol = Math.floor(fromX / size);
  const centerRow = Math.floor(fromY / size);

  let best = null;
  let bestScore = Infinity;

  for (let row = centerRow - radiusInTiles; row <= centerRow + radiusInTiles; row++) {
    for (let col = centerCol - radiusInTiles; col <= centerCol + radiusInTiles; col++) {
      // Antes preguntaba por '#' y 'S' a mano. Ahora que hay más tipos de tile
      // sólido (carga, mesas, corrales) preguntamos por la propiedad.
      if (map.isSolidTile(col, row)) continue;

      const point = map.tileCenter(col, row);
      const distToSelf = Math.hypot(point.x - fromX, point.y - fromY);
      if (distToSelf > c.coverSearchRadius) continue;

      const distToTarget = Math.hypot(point.x - targetX, point.y - targetY);
      if (distToTarget < c.coverMinDistance || distToTarget > c.viewDistance) continue;

      // Si ya la eligió un compañero, que se busque otra: si no, terminan
      // los tres amontonados detrás del mismo asiento.
      if (occupied.some((o) => Math.hypot(o.x - point.x, o.y - point.y) < c.coverSpacing)) continue;

      // La clave: justo delante, en la dirección del objetivo, tiene que haber algo.
      const angle = Math.atan2(targetY - point.y, targetX - point.x);
      const shieldX = point.x + Math.cos(angle) * 13;
      const shieldY = point.y + Math.sin(angle) * 13;
      if (!map.isSolidAt(shieldX, shieldY)) continue;

      // Y tiene que poder asomarse a tirar desde ahí. Si no, no es cobertura:
      // es un rincón donde quedarse a mirar la pared.
      const peek = findPeek(map, point, targetX, targetY);
      if (!peek) continue;

      // Preferimos coberturas cercanas, a media distancia y que expongan poco.
      const score = distToSelf * 0.7 + Math.abs(distToTarget - 80) * 0.6 + peek.offset * 1.2;
      if (score < bestScore) {
        bestScore = score;
        best = { x: point.x, y: point.y, peek };
      }
    }
  }

  return best;
}
