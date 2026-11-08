/** Una bala. Un punto que viaja y desaparece. */

import { CONFIG } from '../data/config.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { PALETA } from '../engine/paleta.js';

export function createBullet({ x, y, angle, speed, damage, range, owner, fromRider, alto, distancia, zona, apuntado, caida, factor, perdigon, tirador, alTecho, altoSalida, porEncima }) {
  return {
    x, y,
    /**
     * 🎯 A QUÉ ALTURA VA, sólo para dibujarla (ver systems/golpe.js). La bala
     * viaja por el piso —así la frenan las paredes y la cobertura—, pero sale
     * a la altura del arma y, si le apuntaste a alguien, llega a la altura a la
     * que le apuntaste. Sin esto, el tiro a la cabeza se veía ir a los pies.
     */
    x0: x, y0: y,
    // (Quien sabe dónde está la boca del caño dibujado la manda: `altoSalida`.)
    altoSalida: altoSalida ?? CONFIG.golpe.alturaArma,
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
    // 🆕 Tirada por encima de la cobertura baja que tiene pegada (ver `balasTapanDesde`, world/tilemap.js).
    porEncima: !!porEncima,
    // 🧗 Un tiro a ciegas hacia el techo: en la vista lateral se ve como astillas.
    alTecho: !!alTecho,
    perdigon: perdigon ?? null,
    // Quién la disparó: un guardia, un jefe o un jinete. Sólo para saber de
    // dónde vino cada herida (la lee el aviso de impacto).
    tirador: tirador || null,
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
export function dibujarFogonazo(r, x, y, angulo, fuerza = 1, hacia = null, paso = null) {
  const f = Math.max(0, Math.min(1, fuerza));
  if (f <= 0) return;
  // (🆕 `paso`: el tamaño del punto; el del jinete chico de la huida es el doble.)
  if (estiloNuevo.activo) return fogonazoEnLaGrilla(r, x, y, angulo, f, hacia, paso);
  const largo = (5 + f * 5) * PUNTO;
  for (const [da, esc] of [[0, 1], [-0.55, 0.62], [0.55, 0.62]]) {
    const a = angulo + da;
    r.line(x, y, x + Math.cos(a) * largo * esc, y + Math.sin(a) * largo * esc,
      '#ffca62', 0.85 * f + 0.15, PUNTO);
  }
  r.box(x, y, 2 * PUNTO, 2 * PUNTO, '#ffe9a8');
  r.box(x, y, PUNTO, PUNTO, '#fffbe8');
}

/**
 * 🆕 E4 · EL FOGONAZO EN LA GRILLA NUEVA *(Santi: "vamos con el fogonazo")*. El de arriba es de rayas de un cuarto
 * de punto: la grilla de 3×3 se queda con un píxel de cada nueve y se lo comía casi entero (al jinete no se le veía
 * nada, y al jugador apenas). Éste se dibuja directo en puntos de la grilla.
 *
 * Es la misma forma de siempre —una lengua larga por el caño y dos abiertas, con el blanco en la boca—, dibujada en
 * cada una de las 8 direcciones, y en dos cuadros: el tiro (`fuerte`) y lo que queda el cuadro siguiente (`debil`).
 * El punto de la boca es `ancla` (columna, fila): el dibujo arranca un punto más allá del caño.
 *   W blanco · a amarillo claro · y amarillo · n naranja
 */
const COLOR_FOGONAZO = { W: 30, a: 29, y: 28, n: 45 };
const FOGONAZO = {
  E: {
    fuerte: { ancla: [0, 2], mapa: [
      '..n....',
      '.y..n..',
      'WWaayyn',
      '.y..n..',
      '..n....'] },
    debil: { ancla: [0, 1], mapa: [
      '.n..',
      'Wayn',
      '.n..'] },
  },
  SE: {
    fuerte: { ancla: [0, 0], mapa: [
      'WWyn.',
      'Wa...',
      'y.an.',
      'n.ny.',
      '....n'] },
    debil: { ancla: [0, 0], mapa: [
      'Wn.',
      'na.',
      '..n'] },
  },
  S: {
    fuerte: { ancla: [2, 0], mapa: [
      '..W..',
      '.yWy.',
      'n.a.n',
      '..a..',
      '.nyn.',
      '..y..',
      '..n..'] },
    debil: { ancla: [1, 0], mapa: [
      '.W.',
      'nan',
      '.y.',
      '.n.'] },
  },
  SO: {
    fuerte: { ancla: [4, 0], mapa: [
      '.nyWW',
      '...aW',
      '.na.y',
      '.yn.n',
      'n....'] },
    debil: { ancla: [2, 0], mapa: [
      '.nW',
      '.an',
      'n..'] },
  },
  O: {
    fuerte: { ancla: [6, 2], mapa: [
      '....n..',
      '..n..y.',
      'nyyaaWW',
      '..n..y.',
      '....n..'] },
    debil: { ancla: [3, 1], mapa: [
      '..n.',
      'nyaW',
      '..n.'] },
  },
  NO: {
    fuerte: { ancla: [4, 4], mapa: [
      'n....',
      '.yn.n',
      '.na.y',
      '...aW',
      '.nyWW'] },
    debil: { ancla: [2, 2], mapa: [
      'n..',
      '.an',
      '.nW'] },
  },
  N: {
    fuerte: { ancla: [2, 6], mapa: [
      '..n..',
      '..y..',
      '.nyn.',
      '..a..',
      'n.a.n',
      '.yWy.',
      '..W..'] },
    debil: { ancla: [1, 3], mapa: [
      '.n.',
      '.y.',
      'nan',
      '.W.'] },
  },
  /**
   * Y cuando el caño apunta a la cámara o para el otro lado (el jinete dado vuelta en la silla, ver GIRO_ARMAS en
   * estiloNuevo/gente.js), la lengua no se ve de largo: de frente es una estrella alrededor de la boca, y de espaldas
   * apenas el resplandor que asoma detrás. Las dos van sobre la boca misma, no un punto más allá.
   */
  frente: {
    fuerte: { ancla: [3, 3], mapa: [
      'n..y..n',
      '.n.a.n.',
      '..aWa..',
      'yaWWWay',
      '..aWa..',
      '.n.a.n.',
      'n..y..n'] },
    debil: { ancla: [1, 1], mapa: [
      '.n.',
      'nWn',
      '.n.'] },
  },
  espalda: {
    fuerte: { ancla: [2, 2], mapa: [
      'n.y.n',
      '.aWa.',
      '..W..'] },
    debil: { ancla: [1, 1], mapa: [
      '.a.',
      'nWn'] },
  },
  NE: {
    fuerte: { ancla: [0, 4], mapa: [
      '....n',
      'n.ny.',
      'y.an.',
      'Wa...',
      'WWyn.'] },
    debil: { ancla: [0, 2], mapa: [
      '..n',
      'na.',
      'Wn.'] },
  },
};
// Hacia dónde, de a octavos de vuelta (el ángulo crece hacia abajo, como en el mundo), y un punto más allá del caño.
const OCTAVOS = [['E', 1, 0], ['SE', 1, 1], ['S', 0, 1], ['SO', -1, 1], ['O', -1, 0], ['NO', -1, -1], ['N', 0, -1], ['NE', 1, -1]];

/**
 * 🆕 EL BRILLO DEL CAÑO, JUSTO ANTES DEL TIRO *(Santi: "haría algo más que avise que está por disparar"; eligió "el
 * pequeño brillo")*: el sol que pega en el caño del rifle que te apunta. 8 cuadros a mano: nace un punto, se abre en
 * cruz, llega a la estrella con sus diagonales y se apaga. W el blanco, Y el amarillo claro y y el dorado. El centro
 * del mapa cae en la boca.
 */
const BRILLO = [
  ['.......', '.......', '.......', '...Y...', '.......', '.......', '.......'],
  ['.......', '.......', '...y...', '..yWy..', '...y...', '.......', '.......'],
  ['.......', '...y...', '...Y...', '.yYWYy.', '...Y...', '...y...', '.......'],
  ['...y...', '...Y...', '..yWy..', 'yYWWWYy', '..yWy..', '...Y...', '...y...'],
  ['...y...', '.y.Y.y.', '..YWY..', 'yYWWWYy', '..YWY..', '.y.Y.y.', '...y...'],
  ['.......', '...Y...', '..yWy..', '.YWWWY.', '..yWy..', '...Y...', '.......'],
  ['.......', '.......', '...Y...', '..YWY..', '...Y...', '.......', '.......'],
  ['.......', '.......', '.......', '...W...', '.......', '.......', '.......'],
];
const COLOR_BRILLO = { W: 30, Y: 29, y: 28 };
/** El cuadro `k` (0 a 7) del brillo, con el centro en `x`, `y` (el centro de un punto) y puntos de `paso`. */
export function brilloDelCano(r, x, y, k, paso) {
  const m = BRILLO[Math.max(0, Math.min(7, k))];
  const x0 = x - paso / 2 - 3 * paso, y0 = y - paso / 2 - 3 * paso;
  for (let fila = 0; fila < 7; fila++) {
    for (let col = 0; col < 7; col++) {
      const c = COLOR_BRILLO[m[fila][col]];
      if (c != null) r.rect(x0 + col * paso, y0 + fila * paso, paso, paso, PALETA[c]);
    }
  }
}

function fogonazoEnLaGrilla(r, x, y, angulo, f, hacia, paso = null) {
  const PASO = paso ?? CONFIG.estilo.punto / 4;
  const o = ((Math.round(angulo / (Math.PI / 4)) % 8) + 8) % 8;
  const [dir, dx, dy] = hacia ? [hacia, 0, 0] : OCTAVOS[o];
  const { ancla, mapa } = FOGONAZO[dir][f > 0.5 ? 'fuerte' : 'debil'];
  // La boca es el centro de un punto del dibujo: su esquina, y desde ahí punto por punto.
  const x0 = x - PASO / 2 + (dx - ancla[0]) * PASO;
  const y0 = y - PASO / 2 + (dy - ancla[1]) * PASO;
  for (let fila = 0; fila < mapa.length; fila++) {
    for (let col = 0; col < mapa[fila].length; col++) {
      const c = COLOR_FOGONAZO[mapa[fila][col]];
      if (c != null) r.rect(x0 + col * PASO, y0 + fila * PASO, PASO, PASO, PALETA[c]);
    }
  }
}
