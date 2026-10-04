/** Una bala. Un punto que viaja y desaparece. */

import { CONFIG } from '../data/config.js';

export function createBullet({ x, y, angle, speed, damage, range, owner, fromRider, alto, distancia, zona, apuntado, caida, factor, perdigon }) {
  return {
    x, y,
    /**
     * 🎯 A QUÉ ALTURA VA, sólo para dibujarla (ver systems/golpe.js). La bala
     * viaja por el piso —así la frenan las paredes y la cobertura—, pero sale
     * a la altura del arma y, si le apuntaste a alguien, llega a la altura a la
     * que le apuntaste. Sin esto, el tiro a la cabeza se veía ir a los pies.
     */
    x0: x, y0: y,
    altoSalida: CONFIG.golpe.alturaArma,
    altoFinal: alto ?? null,
    distancia: distancia ?? 0,
    /**
     * La parte del cuerpo a la que apuntaste. Si le pega ahí o en la de al
     * lado lo decide `danioDeBala` (systems/golpe.js) al llegar.
     */
    zona: zona || 'torso',
    /** Si la zona la eligió la mira (o no tenías a nadie bajo la mira). */
    zonaElegida: !!zona,
    /** Cuánto alcance tiene (para saber qué tan lejos llegó al pegar). */
    rango: range,
    /** Qué tan cerrada estaba la mira al tirar, de 0 a 1: apuntar acierta más. */
    apuntado: apuntado || 0,
    /** Cuánto pierde con la distancia (`caida` del arma; si no hay, la de los guardias). */
    caida: caida || null,
    // Un perdigón de escopeta pega una parte de una bala (`factor`), y los del
    // mismo disparo comparten número (`perdigon`): ver systems/combat.js.
    factor: factor ?? 1,
    perdigon: perdigon ?? null,
    /**
     * `damage` sigue en TIROS (1 = un tiro): es lo que les saca a las cosas
     * —puertas, cajones, barriles— y a los jinetes. A la gente le saca
     * `danioDeBala`, en la escala de 100.
     */
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
/**
 * A qué altura va la bala en este punto de su camino, en unidades sobre el
 * piso: sale a la del arma y llega a la que apuntaste.
 */
export function altoDeBala(b) {
  if (b.altoFinal == null || !(b.distancia > 0)) return b.altoSalida;
  const t = Math.min(1, Math.hypot(b.x - b.x0, b.y - b.y0) / b.distancia);
  return b.altoSalida + (b.altoFinal - b.altoSalida) * t;
}

/**
 * Dónde se ve la bala en la pantalla. Sale del centro de la caja del que
 * tira, que está `PIES_DE_LA_CAJA` sobre sus pies; de ahí se levanta lo que
 * tenga de altura.
 */
const PIES_DE_LA_CAJA = 3.5;
export function yDeBala(b) {
  return b.y + PIES_DE_LA_CAJA - altoDeBala(b);
}

export function drawBullet(r, b) {
  const col = CONFIG.colors;
  const color = b.owner === 'player' ? col.bulletP : col.bulletE;
  const sube = PIES_DE_LA_CAJA - altoDeBala(b);
  const y = b.y + sube;
  const yEstela = b.trailY + sube;

  // La estela hace que se vea de dónde viene sin tener que dibujar sprites.
  r.line(b.trailX, yEstela, b.x, y, color, 0.5, PUNTO);
  r.line(b.trailX, yEstela, b.x, y, '#fff2c8', 0.22, PUNTO);
  r.box(b.x, y, 2 * PUNTO, 2 * PUNTO, color);
  r.box(b.x, y, PUNTO, PUNTO, '#fff6d8');
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
