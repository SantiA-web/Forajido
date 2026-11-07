/**
 * 🦅 LOS BUITRES *(Santi: "pongamos buitres volando y que su sombra se proyecte"; eligió "en círculos" y "un grupito de
 * 2 o 3 cada tanto", y que el lugar sea al azar: "a veces aparecen, y si aparecen el lugar se hace aleatorio")*.
 *
 * Cada tanto aparece un grupito de jotes que da vueltas planeando en lo alto, en un lugar cualquiera de lo que se ve
 * (siempre del otro lado de la vía, sobre el desierto de allá), y se va. Como el que galopa sos vos, el grupo te sigue: el centro de las
 * vueltas se corre con la cámara y se va quedando atrás de a poco. Abajo, en la tierra, sus sombras dan las mismas
 * vueltas, corridas para acá y a la izquierda (el sol viene de allá y un poco de la derecha, como en todo el afuera).
 * Sólo de día: de noche no vuelan, y sin sol no hay sombra.
 *
 * EL DIBUJO: el jote de cabeza negra visto desde arriba, con las alas abiertas (unos 36 puntos de punta a punta), el
 * borde de adelante de las alas pardo, el de atrás negro y los "dedos" de las puntas sueltos, con la mancha clara de
 * las plumas largas. En las 8 direcciones para donde puede ir mirando mientras da la vuelta, cada una en su propio
 * mapa dibujado a mano. Las alas que van de arriba para abajo en la pantalla son más cortas (la cámara mira en
 * diagonal y achica lo que va hacia el fondo). Planean, sin aletear. La sombra es la misma silueta, toda oscura.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;

/** El negro de las plumas, el pardo del borde de adelante del ala, la mancha clara de las puntas y la cabeza. */
const COLOR = { N: 1, M: 47, W: 25, h: 31 };
/** La sombra: la misma silueta en negro, transparente, así oscurece lo que tenga abajo (tierra, tren o caballo). */
const SOMBRA = 1, OSCURO = 0.3;

/** (Para escribir las filas: tantos puntos vacíos, tantas veces una letra.) */
const d = (n) => '.'.repeat(n), R = (c, n) => c.repeat(n);

/**
 * Las 8 direcciones, en el orden de las agujas del reloj desde el Este (mirando para la derecha). En cada fila, el
 * borde de adelante del ala (pardo, M) va del lado para donde vuela, y el de atrás (negro, N) del otro; los "dedos"
 * sueltos en las puntas y la cola abierta atrás. 🔁 Primero tenían el ala finita (3 o 4 puntos de ancho) y de lejos
 * parecían crucecitas: el ala del jote es ancha, casi la cuarta parte de lo que mide de punta a punta.
 */
const DIRECCIONES = {
  E: [
    d(5) + 'N.N.N.N' + d(5),
    d(5) + 'N.N.N.N' + d(5),
    d(4) + 'NNWNWNWM' + d(5),
    d(4) + 'NNWWWWMM' + d(5),
    d(4) + 'NNNWWMMM' + d(5),
    d(3) + 'NNNNNNMMM' + d(5),
    d(3) + 'NNNNNNMMM' + d(5),
    d(3) + 'NNNNNNMMMM' + d(4),
    d(3) + 'NNNNNNMMMM' + d(4),
    d(3) + 'NNNNNNMMMM' + d(4),
    d(1) + 'NNNNNNNNNMMMM' + d(3),
    'NNNNNNNNNNNNNNh' + d(2),
    'NNNNNNNNNNNNNNhhh',
    'NNNNNNNNNNNNNNh' + d(2),
    d(1) + 'NNNNNNNNNMMMM' + d(3),
    d(3) + 'NNNNNNMMMM' + d(4),
    d(3) + 'NNNNNNMMMM' + d(4),
    d(3) + 'NNNNNNMMMM' + d(4),
    d(3) + 'NNNNNNMMM' + d(5),
    d(3) + 'NNNNNNMMM' + d(5),
    d(4) + 'NNNWWMMM' + d(5),
    d(4) + 'NNWWWWMM' + d(5),
    d(4) + 'NNWNWNWM' + d(5),
    d(5) + 'N.N.N.N' + d(5),
    d(5) + 'N.N.N.N' + d(5),
  ],
  SE: [
    d(28) + 'N.N.N' + d(1),
    d(25) + 'NWNWNWN.N',
    d(9) + 'NN' + d(11) + 'NNNWWWWWMMMM',
    d(7) + 'NNNNN' + d(9) + 'NNNNNWWWMMMMM',
    d(5) + 'NNNNNNN' + d(8) + 'NNNNNNNNMMMM' + d(2),
    d(4) + 'NNNNNNNNN' + d(5) + 'NNNNNNNNNMMMM' + d(3),
    d(7) + 'NNNNNNN' + d(2) + 'NNNNNNNNNMMMM' + d(5),
    d(10) + 'NNNNN' + 'NNNNNNNNNMMMM' + d(6),
    d(13) + 'NNNNNNNNNMMMM' + d(8),
    d(12) + 'NNNNNNNNNMMMM' + d(9),
    d(10) + 'NNNNNNNNNMMMM' + d(11),
    d(8) + 'NNNNNNNNNMMNNN' + d(12),
    d(7) + 'NNNNNNNNNMMM' + 'NNN' + d(12),
    d(5) + 'NNNNNNNNNMMMM' + d(2) + 'Nhhh' + d(10),
    d(4) + 'NNNNNNNNNMMMM' + d(5) + 'hhh' + d(9),
    d(2) + 'NNNNNNNNNMMMM' + d(8) + 'h' + d(10),
    'NNNNNNNNNMMMM' + d(21),
    'NNNNWWWMMMMM' + d(22),
    'NWWWWWMMM' + d(25),
    'N.NWNWN' + d(27),
    '.N.N.N' + d(28),
  ],
  S: [
    d(16) + 'NNNNN' + d(16),
    d(15) + 'NNNNNNN' + d(15),
    d(16) + 'NNNNN' + d(16),
    '.N.N.N' + R('N', 25) + 'N.N.N.',
    'N.NWNW' + R('N', 25) + 'WNWN.N',
    '.NWWWW' + R('N', 25) + 'WWWWN.',
    '..NWWW' + R('N', 25) + 'WWWN..',
    '...MMM' + R('M', 10) + 'NNNNN' + R('M', 10) + 'MMM...',
    '....MM' + R('M', 10) + 'NNNNN' + R('M', 10) + 'MM....',
    d(6) + R('M', 10) + 'NNNNN' + R('M', 10) + d(6),
    d(16) + 'NNNNN' + d(16),
    d(17) + 'hhh' + d(17),
    d(18) + 'h' + d(18),
  ],
  SW: [
    d(1) + 'N.N.N' + d(28),
    'N.NWNWNWN' + d(25),
    'MMMMWWWWWNNN' + d(11) + 'NN' + d(9),
    'MMMMMWWWNNNNN' + d(9) + 'NNNNN' + d(7),
    d(2) + 'MMMMNNNNNNNN' + d(8) + 'NNNNNNN' + d(5),
    d(3) + 'MMMMNNNNNNNNN' + d(5) + 'NNNNNNNNN' + d(4),
    d(5) + 'MMMMNNNNNNNNN' + d(2) + 'NNNNNNN' + d(7),
    d(6) + 'MMMMNNNNNNNNN' + 'NNNNN' + d(10),
    d(8) + 'MMMMNNNNNNNNN' + d(13),
    d(9) + 'MMMMNNNNNNNNN' + d(12),
    d(11) + 'MMMMNNNNNNNNN' + d(10),
    d(12) + 'NNNMMNNNNNNNNN' + d(8),
    d(12) + 'NNN' + 'MMMNNNNNNNNN' + d(7),
    d(10) + 'hhhN' + d(2) + 'MMMMNNNNNNNNN' + d(5),
    d(9) + 'hhh' + d(5) + 'MMMMNNNNNNNNN' + d(4),
    d(10) + 'h' + d(8) + 'MMMMNNNNNNNNN' + d(2),
    d(21) + 'MMMMNNNNNNNNN',
    d(22) + 'MMMMMWWWNNNN',
    d(25) + 'MMMWWWWWN',
    d(27) + 'NWNWN.N',
    d(28) + 'N.N.N.',
  ],
  W: [
    d(5) + 'N.N.N.N' + d(5),
    d(5) + 'N.N.N.N' + d(5),
    d(5) + 'MWNWNWNN' + d(4),
    d(5) + 'MMWWWWNN' + d(4),
    d(5) + 'MMMWWNNN' + d(4),
    d(5) + 'MMMNNNNNN' + d(3),
    d(5) + 'MMMNNNNNN' + d(3),
    d(4) + 'MMMMNNNNNN' + d(3),
    d(4) + 'MMMMNNNNNN' + d(3),
    d(4) + 'MMMMNNNNNN' + d(3),
    d(3) + 'MMMMNNNNNNNNN' + d(1),
    d(2) + 'hNNNNNNNNNNNNNN',
    'hhhNNNNNNNNNNNNNN',
    d(2) + 'hNNNNNNNNNNNNNN',
    d(3) + 'MMMMNNNNNNNNN' + d(1),
    d(4) + 'MMMMNNNNNN' + d(3),
    d(4) + 'MMMMNNNNNN' + d(3),
    d(4) + 'MMMMNNNNNN' + d(3),
    d(5) + 'MMMNNNNNN' + d(3),
    d(5) + 'MMMNNNNNN' + d(3),
    d(5) + 'MMMWWNNN' + d(4),
    d(5) + 'MMWWWWNN' + d(4),
    d(5) + 'MWNWNWNN' + d(4),
    d(5) + 'N.N.N.N' + d(5),
    d(5) + 'N.N.N.N' + d(5),
  ],
  NW: [
    d(28) + 'N.N.N.',
    d(27) + 'NWNWN.N',
    d(25) + 'MMMWWWWWN',
    d(22) + 'MMMMMWWWNNNN',
    d(21) + 'MMMMNNNNNNNNN',
    d(10) + 'h' + d(8) + 'MMMMNNNNNNNNN' + d(2),
    d(9) + 'hhh' + d(5) + 'MMMMNNNNNNNNN' + d(4),
    d(10) + 'hhhN' + d(2) + 'MMMMNNNNNNNNN' + d(5),
    d(12) + 'NNN' + 'MMMNNNNNNNNN' + d(7),
    d(12) + 'NNNMMNNNNNNNNN' + d(8),
    d(11) + 'MMMMNNNNNNNNN' + d(10),
    d(9) + 'MMMMNNNNNNNNN' + d(12),
    d(8) + 'MMMMNNNNNNNNN' + d(13),
    d(6) + 'MMMMNNNNNNNNN' + 'NNNNN' + d(10),
    d(5) + 'MMMMNNNNNNNNN' + d(2) + 'NNNNNNN' + d(7),
    d(3) + 'MMMMNNNNNNNNN' + d(5) + 'NNNNNNNNN' + d(4),
    d(2) + 'MMMMNNNNNNNN' + d(8) + 'NNNNNNN' + d(5),
    'MMMMMWWWNNNNN' + d(9) + 'NNNNN' + d(7),
    'MMMMWWWWWNNN' + d(11) + 'NN' + d(9),
    'N.NWNWNWN' + d(25),
    d(1) + 'N.N.N' + d(28),
  ],
  N: [
    d(18) + 'h' + d(18),
    d(17) + 'hhh' + d(17),
    d(16) + 'NNNNN' + d(16),
    d(6) + R('M', 10) + 'NNNNN' + R('M', 10) + d(6),
    '....MM' + R('M', 10) + 'NNNNN' + R('M', 10) + 'MM....',
    '...MMM' + R('M', 10) + 'NNNNN' + R('M', 10) + 'MMM...',
    '..NWWW' + R('N', 25) + 'WWWN..',
    '.NWWWW' + R('N', 25) + 'WWWWN.',
    'N.NWNW' + R('N', 25) + 'WNWN.N',
    '.N.N.N' + R('N', 25) + 'N.N.N.',
    d(16) + 'NNNNN' + d(16),
    d(15) + 'NNNNNNN' + d(15),
    d(16) + 'NNNNN' + d(16),
  ],
  NE: [
    '.N.N.N' + d(28),
    'N.NWNWN' + d(27),
    'NWWWWWMMM' + d(25),
    'NNNNWWWMMMMM' + d(22),
    'NNNNNNNNNMMMM' + d(21),
    d(2) + 'NNNNNNNNNMMMM' + d(8) + 'h' + d(10),
    d(4) + 'NNNNNNNNNMMMM' + d(5) + 'hhh' + d(9),
    d(5) + 'NNNNNNNNNMMMM' + d(2) + 'Nhhh' + d(10),
    d(7) + 'NNNNNNNNNMMM' + 'NNN' + d(12),
    d(8) + 'NNNNNNNNNMMNNN' + d(12),
    d(10) + 'NNNNNNNNNMMMM' + d(11),
    d(12) + 'NNNNNNNNNMMMM' + d(9),
    d(13) + 'NNNNNNNNNMMMM' + d(8),
    d(10) + 'NNNNN' + 'NNNNNNNNNMMMM' + d(6),
    d(7) + 'NNNNNNN' + d(2) + 'NNNNNNNNNMMMM' + d(5),
    d(4) + 'NNNNNNNNN' + d(5) + 'NNNNNNNNNMMMM' + d(3),
    d(5) + 'NNNNNNN' + d(8) + 'NNNNNNNNMMMM' + d(2),
    d(7) + 'NNNNN' + d(9) + 'NNNNNWWWMMMMM',
    d(9) + 'NN' + d(11) + 'NNNWWWWWMMMM',
    d(25) + 'NWNWNWN.N',
    d(28) + 'N.N.N' + d(1),
  ],
};
const ORDEN = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

const guardados = new Map();
function lienzo(dir, sombra) {
  const clave = dir + '|' + sombra;
  if (guardados.has(clave)) return guardados.get(clave);
  const mapa = DIRECCIONES[dir], an = mapa[0].length, al = mapa.length;
  const indices = new Int16Array(an * al).fill(-1);
  mapa.forEach((fila, j) => {
    for (let i = 0; i < an; i++) if (fila[i] !== '.') indices[j * an + i] = sombra ? SOMBRA : COLOR[fila[i]];
  });
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: an, alto: al, indices, campo: () => 0 }), an, al), 0, 0);
  guardados.set(clave, cv);
  return cv;
}

/**
 * CUÁNDO: el tiempo se parte en tramos de 20 segundos; en 3 de cada 4 aparece un grupo, en un momento al azar del
 * tramo, y se queda 13 segundos (entra y sale transparentándose, 1,5 s). DÓNDE: en un lugar al azar de lo que se ve.
 * CÓMO: de 2 a 3 buitres en la misma vuelta, repartidos, a unas 70 unidades de alto (unos 6 m sobre la sombra).
 * 🔁 Primero eran tramos de 30 segundos y la suerte era siempre la misma: como la cabalgata dura unos 40, en ninguna
 * salían buitres. Ahora cada cabalgata tira su propia suerte (nuevaSuerteDeBuitres, al empezar).
 */
const TRAMO = 20, DURA = 13, ASOMA = 1.5, ALTO = 70;
/** Cuánto se achata la vuelta vista desde la cámara (🔁 era 0,6; con 0,5 entra mejor en la franja de allá). */
const ACHATA = 0.5;
let suerte = 0;
/** Cada cabalgata, otra suerte: otros momentos y otros lugares. */
export function nuevaSuerteDeBuitres() {
  suerte = 1 + Math.floor(Math.random() * 100000);
}

/** Los buitres que hay ahora: dónde va cada uno, su sombra, para dónde mira y qué tan visible está. */
function buitresAhora(t, camX, camY, vistaW, vistaH, franja) {
  const k = Math.floor(t / TRAMO) + suerte * 50;
  if (hash(k, 3) > 0.75) return [];
  const t0 = Math.floor(t / TRAMO) * TRAMO + hash(k, 5) * (TRAMO - DURA), tt = t - t0;
  if (tt < 0 || tt > DURA) return [];
  const alfa = Math.min(1, tt / ASOMA, (DURA - tt) / ASOMA);
  const cuantos = hash(k, 7) < 0.5 ? 2 : 3, radio = 34 + hash(k, 11) * 16, vuelta = 0.45 + hash(k, 13) * 0.2;
  // (El centro: al azar en lo que se ve, y se queda atrás despacio, 4 unidades por segundo.)
  // 🔁 SÓLO DEL OTRO LADO DE LA VÍA *(Santi: "quiero que aparezcan del otro lado de la vía, sí o sí")*: las sombras
  // dan vueltas en la franja de desierto de allá ('franja', de arriba a abajo), y el centro se elige en la parte de esa
  // franja que se está viendo (si no se ve nada de ella, en el medio). Los pájaros quedan 70 más arriba, sobre el cielo.
  const [desde, hasta] = franja, alto = (radio * 1.2 * ACHATA) + 2;
  const lo = Math.max(desde + alto, camY + alto), hi = Math.min(hasta - alto, camY + vistaH - alto);
  const cx = camX + vistaW * (0.15 + 0.7 * hash(k, 17)) - 4 * tt;
  const cy = lo <= hi ? lo + (hi - lo) * hash(k, 19) : (desde + hasta) / 2;
  const lista = [];
  for (let b = 0; b < cuantos; b++) {
    const r = radio * (0.8 + 0.4 * hash(k * 7 + b, 23)), a = vuelta * tt + (b * 2 * Math.PI) / cuantos;
    // (La vuelta, achatada como todo lo que va hacia el fondo, y la dirección para donde va: la del recorrido.)
    const x = cx + r * Math.cos(a), y = cy + r * ACHATA * Math.sin(a);
    const dx = -Math.sin(a), dy = ACHATA * Math.cos(a);
    const dir = ORDEN[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
    lista.push({ x, y, dir, alfa });
  }
  return lista;
}

const dibujar = (ctx, cv, x, y, alfa) => {
  const sx = Math.round(x / PASO) * PASO - Math.floor(cv.width / 2) * PASO, sy = Math.round(y / PASO) * PASO - Math.floor(cv.height / 2) * PASO;
  ctx.globalAlpha = alfa;
  ctx.drawImage(cv, sx, sy, cv.width * PASO, cv.height * PASO);
};

/** Las sombras ('ctx' con la cámara puesta; después del tren y del caballo, antes de los buitres). Sólo de día. */
export function dibujarSombrasDeBuitres(ctx, { t, camX, camY, vistaW, vistaH, dia, franja }) {
  if (!dia) return;
  const prevS = ctx.imageSmoothingEnabled, prevA = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false;
  for (const b of buitresAhora(t, camX, camY, vistaW, vistaH, franja)) dibujar(ctx, lienzo(b.dir, true), b.x - ALTO * 0.3, b.y, b.alfa * OSCURO);
  ctx.globalAlpha = prevA;
  ctx.imageSmoothingEnabled = prevS;
}

/** Los buitres, en lo alto ('ctx' con la cámara puesta; arriba de todo). Sólo de día. */
export function dibujarBuitres(ctx, { t, camX, camY, vistaW, vistaH, dia, franja }) {
  if (!dia) return;
  const prevS = ctx.imageSmoothingEnabled, prevA = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false;
  for (const b of buitresAhora(t, camX, camY, vistaW, vistaH, franja)) dibujar(ctx, lienzo(b.dir, false), b.x, b.y - ALTO, b.alfa);
  ctx.globalAlpha = prevA;
  ctx.imageSmoothingEnabled = prevS;
}
