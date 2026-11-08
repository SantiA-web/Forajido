/**
 * 🏜️ EL SUELO DE AFUERA, EN EL ESTILO NUEVO: el mismo que se ve por el portón abierto del cerrado.
 *
 * *(Santi: "al estar dentro del tren se sigue viendo un plano marrón aburrido con líneas negras muy gruesas. Quiero
 * que iguales el dibujo del fondo a cómo se ve dentro del portón abierto de la pared lejana")*. Afuera quedaban las
 * capas del dibujo viejo (las franjas del parallax y las rayas de velocidad), de la resolución vieja. Ahora es tierra
 * vista desde arriba, en la grilla de puntos y con la paleta. Todo pasa a la misma velocidad, la del suelo
 * (`estiloNuevo.desfile`).
 *
 * 🔁 DOS VUELTAS ANTES DE ESTA: primero, granitos de un punto y manchitas de borde comido *(Santi: "al ser tan pequeños
 * los detalles se ve como sucio y hace mucho ruido")*; después, manchas grandes de ruido *(Santi: "está todo como
 * camuflado. Parece que el tren está andando sobre un pantalón militar")*. Entre cuatro opciones *(Santi: "quiero la
 * opción B pero ponele los arbustitos y piedras de la opción C")*: tierra de un solo tono con LAS VETAS DEL VIENTO,
 * largas y finitas a lo largo de la vía (la arena que peina el viento), y encima LAS JARILLAS y LOS GRUPOS DE PIEDRAS,
 * grandes y espaciados. De noche, un escalón entero menos, sin tramado.
 *
 * El dibujo sale de los puntos del MUNDO (columna y fila), así el portón y el afuera son la misma tierra: cada uno
 * pide su pedazo a `pintarSuelo`.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { OBSTACULOS } from './obstaculos.js';
import { CHARCOS, COLOR_CHARCO } from './lluvia.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;
const md = (a, n) => ((a % n) + n) % n;

/** La vuelta del dibujo, en puntos: después se repite (múltiplo de 4 y de 44, para que no se note la costura). */
const VUELTA = 1540;

/** El tramo donde se sortea cada veta (una o ninguna por tramo y por fila) y el cuadro de cada cosa suelta, en puntos. */
const TRAMO = 44, CUADRO = 44, FILAS = 22;

/**
 * 🔁 EL DESIERTO DE ARENA PÁLIDA *(Santi, con una foto de referencia de un desierto de saguaros: "lo veo como con mucho
 * ruido al desierto")*. Había tres cosas que lo ensuciaban: la tierra marrón oscura y saturada, las vetas en todas las
 * filas y las cosas chicas repartidas parejo por todos lados. Ahora:
 *
 *  - LA TIERRA es arena pálida (37), de un tono, y casi sin vetas (una cada tanto, apenas más clara o más oscura).
 *  - LAS PLANTAS VAN EN MANCHONES, como en el desierto de verdad: grupos de jarillas, matas grandes, pasto seco y algún
 *    ocotillo, con mucha arena lisa entre un manchón y otro. Afuera de los manchones, casi nada.
 *  - DEL OTRO LADO DEL TREN, SAGUAROS sueltos (el mismo dibujo del cactus que frena): no se puede ir, así que ahí no
 *    son trampa. De este lado no van: el cactus de este lado es el que te frena.
 *
 * Los mapas ('.' es arena): LA JARILLA (9×6: las hojas claras arriba, el pie oscuro y su sombra), LA MATA GRANDE
 * (15×9, una jarilla vieja y ancha), EL OCOTILLO (13×12: varas secas que se abren desde el pie, con alguna hoja), EL
 * PASTO SECO (dos tamaños), LA PIEDRA (5×4, con una chica al lado) y LOS MEDANITOS (lomos chatos de arena peinada).
 */
const JARILLA = ['...h.h...', '.hgghggh.', 'hggdggdgh', '.gdgggdg.', '..ddgdd..', '...sss...'];
const MATA_G = [
  '....h..h.h.....',
  '..h.hghghgh.h..',
  '.hghggggggghgh.',
  'hgggdggggdggggh',
  '.ggdgggdggggdg.',
  '..ddgdddgdddd..',
  '...ddt.tdt.d...',
  '....t..t..t....',
  '..sssssssssss..',
];
const OCOTILLO = [
  '..t.......t..',
  '..t...t...t..',
  '...t..t..t...',
  '...t..t..tg..',
  '..gt..t..t...',
  '...t..tg.t...',
  '....t.t.t....',
  '....t.t.t....',
  '....tgt.t....',
  '.....ttt.....',
  '.....ttt.....',
  '....sssss....',
];
const PIEDRA_G = ['.aaa.', 'aabbc', 'abbbc', '.sss.'];
const PIEDRA = ['.aa.', 'abbc', '.ss.'];
const PASTO = [
  '.k...k..k..',
  '..k.kk.kk..',
  'k.kkmkkmk.k',
  '.kmkmmkmmk.',
  '..mmmnmmm..',
  '...nmnnm...',
  '....sss....',
];
const PASTO_C = ['.k.k..', 'k.kkk.', '.kmkmk', '.mmnm.', '..ss..'];
const MEDANO = [
  '.....FFFFFFFF.........',
  '..FFFFFFFFFFFFFFFFF...',
  'FFFssFFFFFFFFFssFFFFF.',
  '..sss....sssssss..sss.',
];
const MEDANO_C = ['...FFFFFFF...', 'FFFFFFFFFFFF.', '.sssFFFsssss.'];
// (La sombra en la arena pálida es el 36; las varas secas, el 33; la paja, el 38 en la punta.)
const COLOR = { a: 25, b: 24, c: 23, s: 36, h: 43, g: 27, d: 26, D: 42, t: 33, k: 38, m: 15, n: 14, F: 38 };
/** La arena, y las dos vetas: la que se hunde y la que agarra el sol. */
const ARENA = 37, VETA = [36, 38];
/** Los manchones: uno o ninguno por cuadro grande (154 × 66 puntos), de 20 a 44 puntos de ancho. */
const MANCHON = { an: 154, al: 66, hay: 0.6, radio: [20, 44], celda: [8, 5] };

/**
 * Pinta en 'ind' (Int16Array de 'w'×'h', índices de la paleta) el suelo de los puntos del mundo desde ('p0', 'q0'),
 * corrido 'k' puntos (lo que pasó el tren).
 */
export function pintarSuelo(ind, w, h, p0, q0, k, o = {}) {
  // ('o.via': dónde va la vía, en el mundo; la del asalto si no se dice. 'o.campo': con las cosas del campo abierto.
  //  'o.saguaros': entre qué alturas del mundo (en unidades, [desde, hasta]) van los saguaros, del otro lado del tren.)
  const V = o.via || VIA, enLaVia = fueraDe(V), campo = !!o.campo;
  const U0 = p0 + k;
  const pv = (x, y, i) => { if (x >= 0 && y >= 0 && x < w && y < h) ind[y * w + x] = i; };
  const estampar = (mapa, sx, sy) => {
    for (let j = 0; j < mapa.length; j++) for (let i = 0; i < mapa[j].length; i++) {
      const l = mapa[j][i];
      if (l !== '.') pv(sx + i, sy + j, COLOR[l]);
    }
  };
  const libre = (sy, alto) => !enLaVia((sy + q0) * PASO - 2) && !enLaVia((sy + q0 + alto) * PASO);
  // La arena, de un tono.
  ind.fill(ARENA, 0, w * h);
  // Las vetas, pocas: cada seis filas, y en uno de cada siete tramos.
  for (let y = 0; y < h; y++) {
    const q = q0 + y;
    if (md(q, 6) !== 0 || enLaVia(q * PASO)) continue;
    for (let n = Math.floor(U0 / TRAMO) - 1; n <= Math.floor((U0 + w) / TRAMO) + 1; n++) {
      const nn = md(n, VUELTA / TRAMO), hz = hash(nn * 7 + 3, q * 13 + 1);
      if (hz > 0.14) continue;
      const largo = 10 + Math.floor(hash(nn, q * 5) * 24), x0 = n * TRAMO + Math.floor(hash(q, nn) * (TRAMO - 8)) - U0;
      const col = VETA[hz < 0.07 ? 0 : 1];
      for (let i = 0; i < largo; i++) pv(x0 + i, y, col);
    }
  }
  // (En el campo abierto, debajo de todo: los medanitos y las huellas de carreta.)
  if (campo) pintarMedanos(U0, q0, w, h, enLaVia, estampar);
  if (campo) pintarHuellas(U0, q0, w, h, V, pv);
  // Los manchones de plantas.
  for (let n = Math.floor(U0 / MANCHON.an) - 1; n <= Math.floor((U0 + w) / MANCHON.an) + 1; n++) {
    const nn = md(n, VUELTA / MANCHON.an);
    for (let m = Math.floor(q0 / MANCHON.al) * MANCHON.al - MANCHON.al; m <= q0 + h + MANCHON.al; m += MANCHON.al) {
      if (hash(nn * 31 + m, 5) > MANCHON.hay) continue;
      const rx = MANCHON.radio[0] + Math.floor(hash(nn, m + 11) * (MANCHON.radio[1] - MANCHON.radio[0])), ry = Math.round(rx * 0.4);
      const cx = n * MANCHON.an + rx + Math.floor(hash(nn + 2, m) * (MANCHON.an - 2 * rx));
      const cy = m + ry + Math.floor(hash(m + 1, nn) * Math.max(1, MANCHON.al - 2 * ry));
      const [CX, CY] = MANCHON.celda;
      // (Fila por fila de arriba para abajo: lo de más acá tapa a lo de más allá.)
      for (let j = -ry; j <= ry; j += CY) for (let i = -rx; i <= rx; i += CX) {
        const px = cx + i + Math.floor(hash(nn * 3 + i, m + j) * 5), py = cy + j + Math.floor(hash(m + j, nn + i) * 3);
        const d = Math.hypot(i / rx, j / ry);
        const hz = hash(nn * 97 + i * 7 + j, m * 3 + 17);
        if (d > 1 || hz > 0.95 * (1 - d * 0.55)) continue;
        // (🔁 Más tupidos y con menos matas grandes: ralos se leían como puntitos sueltos, y la mata grande, que
        //  mide la mitad del arbusto que frena, no puede abundar o confunde.)
        const cual = hash(i + 41, j + nn * 13 + m);
        const mapa = cual < 0.38 ? JARILLA : cual < 0.46 ? MATA_G : cual < 0.78 ? PASTO : cual < 0.9 ? PASTO_C : cual < 0.95 ? PIEDRA_G : OCOTILLO;
        const sx = px - U0 - (mapa[0].length >> 1), sy = py - q0 - mapa.length;
        if (!libre(sy, mapa.length)) continue;
        estampar(mapa, sx, sy);
        if (mapa === PIEDRA_G) estampar(PIEDRA, sx + 6, sy + 2);
      }
    }
  }
  // Afuera de los manchones, casi nada: alguna mata de pasto suelta.
  for (let n = Math.floor(U0 / CUADRO) - 1; n <= Math.floor((U0 + w) / CUADRO) + 1; n++) {
    const nn = md(n, VUELTA / CUADRO);
    for (let m = Math.floor((q0 - FILAS) / FILAS) * FILAS; m <= q0 + h; m += FILAS) {
      if (hash(nn * 13 + m, 41) > 0.07) continue;
      const sx = n * CUADRO + Math.round(hash(nn, m) * (CUADRO - 10)) - U0, sy = m + Math.floor(hash(m, nn) * (FILAS - 7)) - q0;
      if (libre(sy, 6)) estampar(PASTO_C, sx, sy);
    }
  }
  // Arriba del horizonte (si lo hay), nada: ahí está el cielo.
  if (o.horizonte != null) {
    const f = Math.min(h, Math.max(0, Math.floor(o.horizonte / PASO) - q0));
    ind.fill(-1, 0, f * w);
  }
  // Las mesetas, al fondo del desierto de allá (sólo en el campo de la cabalgata, que tiene horizonte).
  if (o.horizonte != null) pintarMesetas(U0, q0, w, h, o.horizonte, pv);
  // Los cardones, del otro lado del tren.
  if (o.saguaros != null) pintarSaguaros(U0, q0, w, h, o.saguaros, estampar);
  // Los rastros con historia, también sólo en la cabalgata.
  if (o.saguaros != null) pintarRastros(U0, q0, w, h, o.saguaros, V, libre, pv);
  pintarVia(ind, w, h, U0, q0, pv, V);
}

/**
 * 🌵 LO DE ALLÁ DE LA VÍA, MÁS CHICO *(Santi: "recordá que los cactus y las cosas que hay de aquel lado de la vía tienen
 * que ser más pequeños que lo que hay acá")*. Está más lejos, así que se ve más chico, en dos tamaños *(Santi eligió
 * "dos tamaños")*: en la mitad de allá que está más cerca del tren, a 3/4 de lo de acá; en la mitad del fondo, a la
 * mitad. Cada tamaño es su propio dibujo, hecho a mano (no se achica el de acá: se dibuja de nuevo).
 *
 * LOS CARDONES DE ALLÁ: uno o ninguno por cuadro (110 × 60 puntos).
 */
const CARDON_34 = [
  '.......dg.......',
  '......Ddgh......',
  '......Ddgh..dh..',
  '......Ddgh.Ddh..',
  '.dh...Ddgh.Ddh..',
  'Ddh...Ddgh.Ddh..',
  'Ddh...Ddgh.Ddh..',
  'Ddh...Ddgh.Ddh..',
  'Ddh...Ddgh.Ddh..',
  'Ddh...Ddgh.Ddh.h',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...Ddgh.DdhDh',
  'Ddh...DdghhhhhDh',
  'Ddh...Ddghggd.Dh',
  'Ddh...Ddgh....Dh',
  'Ddh...Ddghhhhhhh',
  'DdhhhhDdghgggggd',
  '.dddddDdgh......',
  '......Ddgh......',
  '......Ddgh......',
  '......Ddgh......',
  '....ssDdghss....',
  '..ssssssssss....',
  '.ssssssss.......',
];
const CARDON_12 = [
  '....dg.....',
  '....Ddh....',
  '....Ddh.dh.',
  '.h..Ddh.Dh.',
  'Dh..Ddh.Dh.',
  'Dh..Ddh.Dh.',
  'Dh..Ddh.Dhh',
  'Dh..Ddh.Dhh',
  'Dh..Ddh.Dhh',
  'Dh..Ddh.Dhh',
  'Dh..Ddh.Dhh',
  'Dh..Ddh.Dhh',
  'Dh..Ddh.Dhh',
  'Dh..Ddhhhhh',
  'Dh..Ddhgd.h',
  'DhhhDdhhhhh',
  '.dddDdhddd.',
  '....Ddh....',
  '....Ddh....',
  '..ssDdhss..',
  '.sssssss...',
];

/** El tamaño que le toca a lo de allá según dónde tiene el pie (en filas): el de 3/4 o el de la mitad. */
const deCerca = (pieY, [desde, hasta]) => pieY * PASO > (desde + hasta) / 2;

function pintarSaguaros(U0, q0, w, h, franja, estampar) {
  const AN = 110, AL = 60, [desde, hasta] = franja;
  const filaTope = Math.floor(hasta / PASO), filaPiso = Math.ceil(desde / PASO);
  for (let m = Math.floor(q0 / AL) * AL - AL; m <= Math.min(q0 + h + 40, filaTope); m += AL) {
    for (let n = Math.floor(U0 / AN) - 1; n <= Math.floor((U0 + w) / AN) + 1; n++) {
      const nn = md(n, VUELTA / AN);
      if (hash(nn * 5 + m, 77) > 0.35) continue;
      const pieX = n * AN + Math.floor(hash(nn, m + 9) * (AN - 22)), pieY = m + Math.floor(hash(m + 4, nn) * AL);
      if (pieY > filaTope || pieY < filaPiso) continue;
      const [mapa, pc, pf] = deCerca(pieY, franja) ? [CARDON_34, 7, 29] : [CARDON_12, 5, 19];
      estampar(mapa, pieX - pc - U0, pieY - pf - q0);
    }
  }
}

/**
 * ⛰️ LAS MESETAS DE COLORES, PARADAS EN EL DESIERTO *(Santi: "las mesetas altas esas ponelas en el desierto de siempre,
 * que no queden 'detrás'")*. Antes eran parte del fondo pintado; ahora están al fondo del desierto de allá, con el
 * pie en la arena, cerca del horizonte, y pasan con el suelo como todo lo demás. Detrás de ellas, el cielo y las
 * montañas en silueta (world/estiloNuevo/horizonte.js).
 *
 * Son tres, altas como el tren y más (🔁 primero eran de la mitad y de lejos no llegaban al techo del tren): LA GRANDE
 * (200 puntos de ancho y 84 de alto), LA DE DOS PISOS (150, con una repisa al sol en el medio) y EL CERRO SOLO (80, alto
 * y angosto). Las
 * tres con su talud de piedras caídas, que se abre abajo.
 * 🔁 TERCERA VUELTA, FORMAS NATURALES *(Santi: "que no se vean tan estructurados, que su forma no se cierre a 'frente'
 * y 'costados', sino que tengan mordeduras, texturas, formas naturales")*. Puestos a mano: el borde izquierdo y derecho
 * de cada fila, de qué fila arranca la tapa en cada tramo (con una muesca), las mordeduras de los bordes (que dejan
 * pilares medio sueltos), las canaletas que bajan serpenteando, las repisas cortadas y una aguja de piedra suelta al
 * costado de cada una. Por regla (función meseta, en el borrador): la luz y la sombra salen de cada borde y de cada
 * canaleta (lo que mira a la derecha al sol, lo que mira a la izquierda en sombra, lo de arriba como tapa), las
 * rayitas de erosión de la pared, el borde de arriba del talud en onda y sus piedras. 🌈 Van en franjas, como los cerros del norte *(Santi eligió
 * "cerros de colores")*: cada fila tiene su franja (una letra por fila, a mano) y la tapa al sol (T), la pared (W) y la
 * sombra con las grietas (X) salen del color de la franja.
 */
const MESA_A = [
  '.......................................................................TTTTTTTTTTTTTTTTTTTT.............................................................................................................',
  '.......................................................................TTTTTTTTTTTTTTTTTTTT....TTTTTT.....TTTTTTTTTTTTTTT...............................................................................',
  '.......................................................................XXXWWLWWWWWWWWWWLGGXTTTTTTTTTT.....TTTTTTTTTTTTTTT....TTTTTTTTTTTTTTTT...........................................................',
  '................................................................TTTTTTTWWWWWWWWWWWWWWWWLGGXTTTTWWWWLL.....XXXWWWWWWWWWWLL....TTTTTTTTTTTTTTTTTTTTTT.....................................................',
  '................................................................TTTTTTTGXXWWWWWWWWWWWWWLGGXXXLLWWWWLL.....XXWXWWWWWWWWWWWTTTTWWWWWWWWWWWWLGGXTTTTTT.....................................................',
  '................................................................XXXWWLGGXXWWWWWWWWWWWWWLGGXXXLLWWWWWLT...TXWXWWWWWWWWWWWWTTTTXWWWWWWWWWWWLGGXXXWWLL.....................................................',
  '........................................................TTTTTTTTWWWWWLGGXXWWWWWWWWWWXXWWLGGXXWWWWWWWLT...TXXWWXWWWWWXWWWWLGGXXWWWWWWWWWWWLGGXXWWWLL.....................................................',
  '.........................................................TTTTTTTWWWWWLGGXXWWWWWWWWWWXXWWLGGXXWWWWWWWLL...XXWXWXWWWWWXWWWWLGGXXWWWWWWWWWWLGGXXXWWWWWTTTTT................................................',
  '........................................................TXWXWWWWWWWWWLGGXXWWWWWWWWWWXXWWLGGXXWWWWWWWWWTTTXXWWWXWWWWWXWWWWLGGXXWWWWWWWWWWLGGXXXWWWWWTTTTTT...............................................',
  '.......................................................TTWXWWWWWWWWWLGGXXWWWWWWWWWWWWWWWLGGXXWWWWLWWWWTTTXXWWWWWWWWWWWWWWLGGXXWWWWWWLWWWLGGXXWWWWWXWWXWWTT..............................................',
  '.......................................................TXXWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWLGGXXWWWWLWWWWLGGXXWWWWWWWWWWWWWWWLGGXXWWWWWLWWWLGGXXWWWWWXWWXWLL...............................................',
  '...........................................................XXWXWWWWWLGGXXWWWWWWWWWWWWWWWLGGXXWWWWLWWWWLGGXXWWWWWWWWWWWWWWWLGGXXWWWWWLWWWLGGXXWWWWWXWWLL.................................................',
  '...........................................................XXXWXWWWWLGGXXWWXWWWXWWWWWWWWLGGXXWWWWWWWWWLGGXXWWWWWWWWWWWWLWWLGGXXWWWWWWWWWLGGXXWWWWWWWLL..................................................',
  '...........................................................XXWXXWWWWLGGXXWWXWWWXWWWWWWWWLGGXXWWWWWWWWLGGXXWWWWWWWWWWWWWLWWLGGXXWWWWWWWWLGGXXWWWWWWWWWWTT................................................',
  '......................................................TTTTTWWWWXWWWWLGGXXWWXWWWXWWWWWWWLWLGGXXWWWWWWWLGGXXWWWWWWWWWWWWWLWWLGGXXWWWWWWWWLGGXXWWWWWWWWWWTTTT..............................................',
  '.....................................................TTTTTTWWWWWWWWWLGGXXWWWWWWWWWWLWWWWWLGGXXWWWWWWWLGGXXWWWWWLWWWWWWWWWWLGGXXWWWWWWWWLGGXXWWWWXWLWWXWWTTT.............................................',
  '.....................................................TXXWWWWWWWWWWWWLGGXXWWWWWWWWWWLWWWWWLGGXXWWWWWWWLGGXXWWWWWLWWWWWWWWWWLGGXXWWWWWWWWLGGXXWWWWXWLWWXWWLLT.............................................',
  '......................................................XXXWWWWWWWWWWLGGXXWWWWWWWWWWWLWWWWWLGGXXWWWWWWWLGGXXWWWWWLWWWWWWWWWWLGGXXWWWWWWWWLGGXXWWWWXWLWWXWWLL..............................................',
  '....................................................TTWXWWWWXWWWWWWLGGXXWXWWWWWWWLWWWWWWWLGGXXWWWWWWWLGGXXWWWWWWWWWWWWWLWWWLGGXXWWWWWWWLGGXXWWWXWWWWWWWWWWTT............................................',
  '...................................................TTTXWWWWWXWWWWWWLGGXXWXWWWWWWWLWWWWWWWLGGXXWWWWWWWLGGXXWWWWWWWWWWWWWLWWWLGGXXWWWWWWWWLGGXXWWXWWWWWWWWWWTTT...........................................',
  '...................................................TXXWWWWWWXWWWWWWLGGXXWXWWWWWWWLWWWWWWWLGGXXWWWWWWWLGGXXWWWWWWWWWWWWWLWWWLGGXXWWWWWWWWLGGXXWWXWWWWWLL.....T...........................................',
  '....................................................XXXWWWWWWWWWWWWLGGXXWWWWXWWWWWWWXWWWLGGXXWWWWWWWLGGXXWWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWLGGXXWWWLWWWWLL.................................................',
  '..................................................TTWXWWWWWWTTTTTTWLGGXXTTTTTTTTTTTTTTTWLGGXXTTTTTTWLGGXXWWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWLGGXXWWWLWWWWLL.....TT..........................................',
  '.................................................TTTXWWWWWWWXXXXXXWLGGXXXXXXXXXXXXXXXXXWLGGXXXXXXXXWLGGXXWWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWWLGGXXWWLWWWWLL.....TTT.........................................',
  '...................................................XXXWWWWWWWWLWWWWWLGGXXWWWWWWWWWWWLWWWLGGXXXWWWWWWLGGXXWWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWWLGGXXWWXWWWWLL.....XXT.........................................',
  '...................................................XXWXWWWWWWWLWWWWWLGGXXWWWWWWWWWWWLWWLGGXXWXWWWWWWLGGXXWWWWWWWXWWWWWWWWWLGGXXWWWWWWWWWWLGGXXWWXWWWWLL.....XX.......TT.................................',
  '...................................................XXXWWWWWWWWLWWWWWLGGXXWWWWWWWWWWWLWWLGGXXWXWWWWWWLGGXXWWWWWWWXWWWWWWWWWLGGXXWWWWWWWWWWLGGXXWWXWWWWLL.....X........TT.................................',
  '...................................................XXWXWWWWWWWWWLWWWLGGXXWWWWWWWWWXWWWWLGGXXWWWWWXWWLGGXXXWWWWXWWWWWWWWWWWLGGXXWXLWXWWWWWLGGXXWWWWLWWLL.....XTT.....TXXT................................',
  '...................................................XXXWWWWWWWWWWLWWWLGGXXWWWWWWWWWXWWWWLGGXXWWWWWXWWWLGGXXWWWWXWWWWWWWWWWWLGGXXWXLWXWWWWWWLGGXXWWWLWWLL.....XTTTT...TXLT................................',
  '...................................................XXWXWWWWWWWWWLWWWLGGXXWWWWWWWWWXWWWLGGXXWWWWWWXWWWLGGXXWWWWXWWWWWWWWWWWLGGXXWXLWXWWWWWWLGGXXWWWLWWLL.....XXXTT...XXXL................................',
  '...................................................XXXWWWWWWWXWWWWWWLGGXXWWWWWLWWWWWWWLGGXXWWWWWWWWXWLGGXXWWWXWLWWWWLWXWWWLGGXXWWWWWWWWWWWLGGXXWWWWWWLL.....XXLX....XXLX................................',
  '...................................................XXWXWWWWWWXWWWWWWLGGXXWWWWWLWWWWWWWLGGXXWWWWWWWWXWLGGXXWWWXWLWWWWLWXWWLGGXXWWWWWWWWWWWWLGGXXWWWWWWLL.....XXX.....XXXL................................',
  '.............................................T.....XXXWWWWWWWXWWWWWWWLGGXXWWWWLWWWWWWWLGGXXWWWWWWWWXWLGGXXWWWXWLWWWWLWXWWLGGXXWWWWWWWWWWWWLGGXXWWWWWWLL.....XXWTT...XXLX................................',
  '............................................TT.....XXWXXWWWWXLWWWWWWWLGGXXLWLWWWXWWWWWLGGXXWXWWWWWWWWWLGGXXWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWLGGXXWWWWWXLL.....XXXTTT..XXXL................................',
  '............................................TXTTTTTWWWXXWWWWXLWWWWWWWLGGXXLWLWWWXWWWWWWLGGXXXWWWWWWWWWLGGXXWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWLGGXXWWWWWXLL.....XXWXLT..XXLX................................',
  '.............................................XTTTTTWWWXXWWWWXLWWWWWWWLGGXXLWLWWWXWWWWWWLGGXXXWWWWWWWWWLGGXXWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWLGGXXWWWWWWXWWTTTTTWWWLL...XXXL................................',
  '..............................................XXXXWWLWWWWXWWXWWWWWWWWLGGXXWWWWWWWWWWWWWLGGXXWWWWWWXWWWLGGXXWWWWWWWWLWWWWLGGXXWWWWWWWWWWWWLGGXXWLWWWWWWWTTTTTXWLL....XXLX................................',
  '............................................TTXWXWWWLWWWWXWWXWWWWWWWLGGXXWWWWWWWWWWWWWWLGGXXWWWWWWXWWWLGGXXWTTTTTTTTTTTWLGGXXTTTTTTTTTTTWLGGXXTTTTTTTTTWWWWXXWWWTT..XXXL................................',
  '..........................................TTTTWWXWWWLWWWWXWWXWWWWWWWLGGXXWWWWWWWWWWWWWWLGGXXWWWWWWXWWWWLGGXXXXXXXXXXXXXWLGGXXXXXXXXXXXXXWLGGXXXXXXXXXXXWWWWXXWWWTTTTWWLL................................',
  '.........................................TTTXWWWWWWWWWWWWWWWWWWWWWWWLGGXXXWWWWWWLWWWWWWLGGXXLWWXWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWXLWWWLWWWWWLGGXXWWWWWWWXWWWLLWWWWWWWTTWWLL................................',
  '.........................................TXXWWWWWWWWWWWWWWWWWWWWWWWWLGGXXXWWWWWWLWWWWWWLGGXXLWWXWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWXLWWWLWWWWWLGGXXWWWWWWWXWWWLLWWWWWWWWWWWLL................................',
  '..........................................XXXWWWWWWWWWWWWWWWWWWWWWWLGGXXWXWWWWWWLWWWWWWWLGGXXWWXWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWXLWWWLWWWWWLGGXXWWWWWWWXWWWLLWWWWWWWWWWWLL................................',
  '........................................TTWXWWWWWWWWXWWWWWWWWWWXWWWLGGXXWWWWWWWWWXWWWWLWLGGXXWWWWWWWWLWLGGXXWWWWWWXWWWWWWWWWWWWWWWWWWWWWWLGGXXXWWWWWWWWWWWWWWWWWWWWWWWLL................................',
  '.......................................TTTXWWWWWWWWWXWWWWWWWWWWXWWWLGGXXWWWWWWWWWXWWWWLWLGGXXWWWWWWWWLWLGGXXWWWWWWXWWWWWWWWWWWWWWWWWWWWWLGGXXWXWWWWWWWWWWWWWWWWWWWWWWWLL................................',
  '......................................TTWXWWWWWWWWTTTTTTTTTTTTTTTTWLGGXXTTTTTTTTTTTTTWLWLGGXXWWWWWWWWWLGGXXWWWWWWWXWWWWWWWWWWWWWWWWWWWWWLGGXXWXWWWWWWWWWWWWWWWWWWWWWWWLL................................',
  '......................................TXXWWWWWWXWWXXXXXXXXXXXXXXXWLGGXXXXXXXXXXXXXXXXWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWWWWWXWWWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWLWWWWWWWLL................................',
  '.......................................XXXPPWWWXWWWWWXWWWWWWWWWWWWLGGXXWWWWWWWXWWWWWWWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWWWWWXWWWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWPPRPPPWWWWWWLL................................',
  '.....................................SSPRPPPPPRXWWWWWXWWWWWWWWWWWWLGGXXWWWWWWWXWWWWWWWWWWWWXWWWWWWWWWWLGGXXWPWWWWWWWWWWXWWWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWPPPRPPPPPPWWWWWLT...............................',
  '....................................SSSXPPPPPRPPWWWWWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWPPPPPRPPSWWWWWWWLPPPPPPPSPPWWWWWWWWWWXWWWWWWWWWWWWWWWWWWWWWWXWWWPRPPPPPPPPPPRPWWWWTT..............................',
  '...................................SSPXPPPPPPPPPPPWWWWWWWWWWWWWWWLGGXXLWWWWWWWWWWWWWPPSPPPSPPPPPPPPPPPPPPPPRPPPPPPPWWWWWWWWXWWWWWWWWWWWWWWWWWWWWWWXWPPPPPPPPPPPPPPPPPWWWWTT.............................',
  '..................................SSPXPPPPPPPPPPPPPPPWWWWWPPPPPPPLGGXXLWWWWWWWWWWWWPPPPPPPPSPPPPPPPPPPPRPPRPPPPPPPPPWWWWWWWXWWWWWWWWWWPSPPPPWWWWWWPPPRPPPPPPPPPPPPPPPPPWWWTT............................',
  '.................................SSPXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPWWWWWWWWWWWWWPPPSPPPPPPPPPRPPRPRRPPPPPPPPPPRPPPPPPWWWWWWWWWWWWWPPPRRPPPPPPPPPPPSSPPPPPPPPPPPPPPSPPPPRPPTTS..........................',
  '...............................SSSPPPPPPPRPPPPRPPPSPPPPPPPPPPRPPPPPRPPWWWWWWWWWPPRPPPPPPPSPPPPPPPPPPRPPSPPPPPPPPSPPPPPPWWWWWWWWWPPPPPPPPPPPPPPPPPPPPSPSPPPPPRPPPPRPPPPPPPPPPSSS.........................',
  '.............................SSSSPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPPPSPPPPPPWWWWPPPPPPPRPPRPPPPPPPPPPRPPPPPPPPPPRPPPPPPPPPPPPWWWPPPPPRPPPPPPSPPPPPPPPPPPPRPPRPPPPPPPPPPPPPPPPPPPPSSS.......................',
  '...........................SSSSPPPPPPPPPPSPRSPPPPPPPSRPPPPPPPPPSPPPPPPPPPPPPPPPPPPSPPPPPPPPPRPPPPPRPPPPPPPPSPPSPRPPPPPRRPPPPPPPPPRPPPPPPPPPPPPPRPPPRPPPPPPRPPPPPPPPRPPPPPPSPPPPSSSS.....................',
  '..........................SSSPPPPPPPPRSPPPPRPPPPPPPPPPPPPSPPPPPPPPPPPPPPPSRPPPPPRPPPPPPPPPPPPPPPPRPSPPPPPPSPPPPPRPPPPPPPPPSPPPPPPPPRPPPPPPPPPPPPPPSSPPPPPPPPPPPPPPPPRPPPPPPPPPPPPSSS....................',
  '........................SSSRPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPSPPPPRPPPPPPSPPPPPPPPPPRPPPPPPPPPRPPSPPPPPPRPPPPPPRPPPSPPPPPPPPPPPPPRRPPPPSPRPSPPPPPPPRPPRPSSS..................',
  '.......................SSSXPPPPPPPPPPPPPPRPPPPPPPPPPPPPPSPPPPRPPPPPPPPPPPPPPPRPPPPPPPPPSPRPPPPPPPRPPPPPPPPPRRPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPPRPPPPPRSSS.................',
  '.....................SSSPPRPSRPPPRPPPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPRPRSPPPPPPPSPPPPRPPPPPPPPPRPPRPPPPPPPPPPPPRPPPPRPPPPPPPPPPRPPPPPPSPPRRRSRRPPPPPPPPPPPPPRPPPPPPRRPPPPPPPPSSS...............',
  '....................SSSPPPPPPRPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPRPPPPRPPPPPSPPPPPPRPPPPPRPPPPPRPRPPPPPPPPSPPPPPPPRRPPPPPPPSPPRPPPSPPPPPPPPPPPPRPPPPPPPPPPPPRPPPPPPPPRPPPPPSRSSS..............',
  '..................SSSXPRPRPPPPPPPPPPRPPPPPPPPSRPPPPPPPPPPPPPPPPPPPRPPPPPPRPPPPRPPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPRPPPPRPPRPPPPPPPPPRPPPPPRPPPRPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPSSS............',
  '.................SSSXPPPRPRPPPPPPPPPPPRPPPSPPPPPPPPPSPPPPPPPRPPPPPPPPPPPPPPPPRPPPRPPPPPPPPPPPPPSPPPPPPPPPRPPPPSPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPRPPPRPPPPPPPPPPPPPPRPPPSSS...........',
  '...............SSSPPPPPPPPPPPPPPPPRPPPPPPRPPPPPPPPPPPPPPPPPPPRPPRPPPPPPPPPPPPPRPPPPPPPPSPPPPPPPPPPPPRPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPPPPPPPPPPPRSPPPPSSS..........',
  '..............SSSPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPSPPPPPPPPPRPPPPPPPPPPPPPPRPPRPPPPPPSSRPPPPPPPPPPPPPPPRPPPPPPPPPPPPPRPRPRPPPPPPPPPPPPPPPPPPPPPPPPRPPPPRRPPRRPRPPPPPRPPPPPSPPPPPPPPPPRPPPRPPSSS.........',
  '.............SSXPPPPPPPRSPPPPPPPRPPPRPPPPPPPPRPPPPPSSPRPPPPPPPPPPPPPPPPPRSRPRPPPPPPPPPPPPPPPRPRPPPPPPPPPRPPPPPSPPPRPPPRPPPPPPPPPPPPPRPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPRSS........',
  '............SSXPPSPPPPPPPRPPPPPPPPPPPPPPPRPPRPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPRPPPSRPPPPPPPRPPPRPPPPRPSPPPPPPPPPPPPPPPPPRPPPPPPPPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPSSS.......',
  '..........SSSXPPRPPPPPPPPPRRRPPPPRPRPPPPPPPPPPRPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPPPPPPPPPPSPPPPPRPPPPPPSPPPPPPPPSPPPPPPPPPPSPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPSSS......',
  '.........SSSXPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPRSPPPRPPPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPSPPPPSPPPPPPPPSPRPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPRPPPPPPPPPPPPSSS.....',
  '........SSPXPPPRPRSRPPPPPPPPPPPPPPRPRPPPPPRRPRPRPPPPPPPRPPPPPPRSPPPPSPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPRPPPSPPPPPRPPPPPPRPPPPPRPPPPPPPPSPPPSPPRPPPPSPRPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPPPPPPSSS....',
  '.......SSPXPPPPPPPPPRSPPSPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPSPPPPPPPPPPPPPPPPPPPRPPPRPPPPPPPPPPPPPSPPPPPPRPPPPPPPPPPPPRPPPPPPPRPPPPPRPPPPPPPPPPPPSRPPPPPPPSPPPPPPSPPPPPPPPPPPPPPPPPPPPPPPPSSS...',
  '......SSPXPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPSPPRRPPPPPPPPPPPRPPSPPPPPPPPPPPPPPPSPPRPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPRPPPPRPRPPRPPPPPPPPPPPPPPPPPPSRPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPSSS..',
  '.....SSPXRPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPRPPSPPPPPPPRPPPPPPPPSPPRPPPPPPPPPPPPRPPPPPPRPSRPPPPPPPPPPPPPPPPPPRPPPPPPPRPPPRPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPRPPPPPPPPRPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPSPPSSS..',
  '....SSPXPPPPPPPPPPPSPRPPRPPRPRPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPSPPPPPSPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPRPPPPPPPPPPPPRRPPPPPPPPPPPPRPPRPPPSRPPPPPPPPPPPSPPPPPPPPPPPPPPSPPPPPPRPPPPPPPPPPPPPPRPPPPPPPPPRPPSSS.',
  '....SXXPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPRPSRPPPPPRPPPSPPPPPPPPPPPPPPPRPSPPPPPPPPPRPPPPRRPRPPPPPPPPPPPPPPPSPPPPPPPPPPPPPPPPPPPSSS.',
  '...SXXSPPPPPPPPPPPPPPRPPPRPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPRRPSPPSPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPRPPPPPPPPPPPPPPPPRPPPPRPPRPPPPPPPPPRPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPRPPPPSPPPPRPPPPPRRPPSSS',
  '...SXPRRPPPPPPPPPPPPPPPPPPPPPPPRRPPPPPPSPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPRPPPPPPRSPPPPPPPPPPPRPPPPRPPPPPPPSPPPRRPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPRPSSS',
  '..SXPXPPPPPPPPPPPSPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPSPPPPPPPPPPPRPSPPPPPPPPPRPPPPPSPPPPPPPPPPPPPPPPPPRPPRPPRPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPPPPRPPPPPPPPPPPPPPPPPPPRPPSPPPPPPPPPPPPPPPPPPPPSSS',
  '..SXXPPPSPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPSPPPPPRRPSPPPPPPPPPSPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPRSPRPPPPPPRPPPPPPPPRSPPPPPPPPPPPPRPPPPPPPPPPPPRPPPPPRPPPPPPPPPPPPPPPSSS',
  '.SXSPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPSPPPPPPPPPPPPPPRPPPPPPSPPRRPPPPPPPPPPRPRPPPPPPPPPPRPPPPPPRPPPPPPPPPPRPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPRPPPPRPPPPPPPPPPSPSSS',
  '.SXPXPPRPPPPPPRSPPPPPRPPPPPPRPPPPPPPPPPPPPRRPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPRPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPSPPPSPPPRPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPRPPPPPPPPPPPPPPPPPPPPPPPPPRSR',
  'SXPXPSPPSPPPPPPRSRPPRPRPRPPPPPPPPPPPPPPPSPPPPPPPPRPPRPPPPSPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPRPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPSPPPPPPPPPPPSPSPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPRPPPPPPSSS',
  'SXXPPPPPRPPPPPPPSPPRRPSPPPRPPPPRPRPPPPPPPPPSRPPPRPPPPPPPPSPPPPPRPPPSPPPPPPPPRPPPPPPPPRPPPPPPPPPPPSPPPPPPPRPPRPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPSPPPPPPPPPPPPSPPPPPPPPRPPPPPPPPRRPPPPPPPPPSPPPPPPPPPPPPRSSSS',
  'XXPXPPPPPPPPPPPPPPPPPPSPPPPPPPPRPSPPPPSPPPPPPPPRPPPRPPPPPPPPPPPSPPRPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPRPPPPPPPPPPPPPRPSPPPPRPPPPPPPPPPPPSPPPPPPRPPPPRPPPPPPPPPSPPRPPPPPPPPPPPPPPPPPPPPPPPPPPSSS',
  'XXXPPPPPRPPPPPRPPPSPPPPPPPPPPRPPPPPPPPPPPRPPSPPPPPPPPPPPPSPPPPPPPPRPPPPPPPPPPPPPRPPPPPPPPPSPPPPPRPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPRPPPRPPPPPPPPPPPRPPPSPPPPPPPPPPSSPPPPRSPPPPRPPSPPPPPRPPRPPPRPSPSSS',
];
const MESA_B = [
  '.....................................................TTTTTTTTTTTTTTTTTT...............................................................................',
  '.....................................................TTTTTTTTTTTTTTTTTT.....TTTTTTTT.....TTTTTTTTTT...................................................',
  '.....................................................XXXWLWLGGXXWWWWWLL.....TTTTTTTT.....TTTTTTTTTT...................................................',
  '.....................................................XXWXXWLGGXXWWWWWWWTTTTTWLGGXXLL.....XWLGGXXWLL...................................................',
  '............................................TTTTTTTTTWWWWXWLGGXXWWWWWWWTTTTTWWLGGXXWTTTTTWWLGGXXWLL...................................................',
  '..............................................TTTTTTTWWWWXWLGGXXWWWWWWWWWWWWWWLGGXXWTTTTTWWLGGXXWWWTTTTTTTT...........................................',
  '.............................................TXXWXWWWWXWWWLGGXXWWWWWWWWWXWWWWWLGGXXWXXWWWWWLGGXXWWWTTTTTTT............................................',
  '............................................TTXWWXWWWWXWWWLGGXXWWWWWWWWWXWWWWWLGGXXWXXWWWWWLGGXXWWWWWLWWWLT...........................................',
  '............................................TXWXWXWWWWXWWWLGGXXWWWWWWWWWXWWWWWLGGXXWXXWWWWWLGGXXWWWWWLL....T..........................................',
  '.............................................XXWXWWWWWWWWWLGGXXWWWWWWWWWWWWWWWLGGXXWWWWWWWLGGXXWWLWWWLL....TT.........................................',
  '...............................................XXXWWWWWWWWLGGXXWWWWWWWWWWWWWWWWLGGXXWWWWWWLGGXXWWLWWWLL....XT.........................................',
  '..............................................TXXWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWLGGXXWWWWWWLGGXXWWLWWWLL...............................................',
  '............................................TTTXWWWWWWWWWLGGXXWXWWWWWWLWWWWXWWWLGGXXWWWLWWLGGXXWWWWWWLL...............................................',
  '............................................TTXXWWWWWWWWWLGGXXWXWWWWWWLWWWWXWWWLGGXXWWWLWWLGGXXWWWWWWLL....T..........................................',
  '............................................XXWXWWWWWWWWWLGGXXWXWWWWWWLWWWWXWWWLGGXXWWWLWWLGGXXWWWWWWLL....TT.........................................',
  '............................................XXXWWWTTTTTTWLGGXXTTTTTTTTTTTTTTTWLGGXXTTTWWWWLGGXXWWWWWWLL....XTT........................................',
  '.............................................XXXWWXXXXXXXWLGGXXXXXXXXXXXXXXXXWLGGXXXXXWWWWLGGXXWWWWWWLL....XXT........................................',
  '............................................TXXWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWLGGXXLWWWWWWLGGXXWWWWWWWWTTTTLL.........................................',
  '............................................TXWXWWWWWWWWWWLGGXXWWWWWWWWWWXWWWWLGGXXWWWWWLWLGGXXWWWWWXWWTTTTWWTT.......................................',
  '............................................XXXWWWWWWWWWWWLGGXXWWWWWWWWWWXWWWLGGXXWWWWWWWLGGXXWWWWWWXWWWWWWWWTTT......................................',
  '............................................XXWXWWWWWWWWWWWLGGXXWWWWWWWWWXWWWLGGXXWWWWWWWLGGXXWWWWWWXWWWWWWWWWLT......................................',
  '............................................XXXWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWLGGXXWWXWWWWLGGXXWWWWWXWWWWWWWWWLL.......................................',
  '............................................XXWXWWWWWWWWWWWLGGXXWWWWWWWWWWWWWLGGXXWWXWWWWLGGXXWWWWWXWWWWWWWWLL........................................',
  '............................................XXXWWWWWWWWWWWWLGGXXWWWWWWWWWWWWLGGXXWWWXWWWWLGGXXWWWWWXWWWWWWWWWWTT......................................',
  '............................................XXWXWWWWWWWWWWWWLGGXXWWWWWWWWWWWLGGXXWWWLWWWWLGGXXWWWWWWWWWWWWWWWWTTT.....................................',
  '............................................XXXWWWWWWWWWWWWWLGGXXWWWWWWWWWWWLGGXXWWWLWWWWWWWWXWWWWWWWWWWWWWWWWWLT.....................................',
  '............................................XXWXWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWWLWWWWWWWWXWWWWWWWWWWWWWWWWLL......................................',
  '............................................XXXWWWWWWWWWWWWWWWWWLWWWWWWWWWWWWWWWWWXWWWWWWWWWWWWWWXWWWWWWWXWWWWXLT.....................................',
  '..........................TTTTTTTTTTTTTTTTTTWWWWWWWWWWWWWWWWWWWWLWWWWWWWWWWWWWWWWWXWWWWWWWWWWWWWWXWWWWWWWXWWWWXWTTTTTTTTTTTTT.........................',
  '.......................TTTTTTTTTTTTTTTTTTTTTWWWWWWWWWWWWWWWWWWWWLWWWWWWWWWWWWWWWWWXWWWWWWWWWWWWWWXWWWWWWWXWWWWXWWTTTTTTTTTTTTTTT......................',
  '......................TTTTWWWWWWWWWWWWWLWWWWWWWWWWWWWWWWWWWWWXWWWWWWWWWWWWWWWWLWWWWWWWWWWWWWWWWWWWWXWWWWXWWWWXWLWWWWLWXWWWWWWTTTT.....................',
  '...........TT........TTWXWWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWXWWWWWWWLGGXXWWWWLWWWWWWWWWWWWWWWWWWWWXWWWWXWWWWXWLWWWWLWXWWWWWWWLL......................',
  '...........TT.........XXWXWWWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWXWWWWWWWLGGXXWWWWLWWWWWWWWWWWWWWWWWWWWXWWWWLGGXXXWLWWWWLWXWWWWWWLL.......................',
  '..........TXXT..........XXXWWWWWWWWLWWWLGGXXWWWWWWWWWWXXWWWWXLWWWWWWWLGGXXLWLWWWXWWWWWWWWWWWXWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWTT.....................',
  '..........TXLT.............XXXWWWWWLWWLGGXXWWWWWWWWWWWXXWWWWXLWWWWWWWLGGXXLWLWWWXWWWWWWWWWWWXWWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWTTT....................',
  '..........XXXL.......T.....XXWXWWWWLWWLGGXXWWWWWWWWWWWXXWWWWXLWWWWWWWWLGGXXWLWWWXWWWWWWWWWWWXWWWWWWWWWWLGGXXWWWWWWWWWWWWWWWWWWWWLT....................',
  '..........XXLX......TT.....XXXWWWWWWWWLGGXXWWWWWXWWWLWWWWXWWXWWWWWWWWWLGGXXWWWWWWWWWWWXWWWWWWWWWWWXWWWWLGGXXWWWWWWWLWWWWWXWLWWWLL.....................',
  '..........XXXL......TX.....XXWXWWWWWWWLGGXXWWWWWXWWWLWWWWXWWXWWWWWWWWWLGGXXWWWWWWWWWWWXWWWWWWWWWWWXWWWWLGGXXWWWWWWWLWWWWWXWLWWWWWTT...................',
  '..........XXLX.......X.....XXXWWWWWWWLGGXXWWWWWWXWWWLWWWWXWWXWWWWWWWWWLGGXXWWWWWWWWWWWXWWWWWWWWWWWXWWWWLGGXXWWWWWWWLWWWWWXWLWWWWWTTT..................',
  '..........XXXL.....TTL.....XXWXWWXWWWLGGXXWWWWWWWWWWWWWWWWWWWWWWWWWWXWLGGXXWWWWWLWWWWWWWXWWWLWWXWWWWWWLGGXXWWWWWWWWWWWWWWWWWWWXLWLL...................',
  '..........XXLX....TTTX.....XXXWWWXWWWLGGXXWWWWWWWWWWWWWWWWWWWWWWWWWWXWLGGXXWWWWWLWWWWWWWXWWWLWWXWWWWWWLGGXXWWWWWWWWWWWWWWWWWWWXLLL....................',
  '..........XXXL.....XXL.....XXWXWWXWWWLGGXXWWWWWWWWWWWWWWWWWWWWWWWWWWXWLGGXXWWWWWLWWWWWWWXWWWLWWXWWWWWWLGGXXWWWWWWWWWWWWWWWWWWWXLWWTT..................',
  '..........XXLX......XX.....XXXWWWWWWXWLGGXXWWWWWWWWWXWWWWWWWWWWXWWWWWWLGGXXWWWWWWXWWWWLWWWWWLWWWWWWWWLWLGGXXWWWWWWXWWWWWWWWWWWWWWWTTT.................',
  '..........XXXL....TTXWTTTTTWWWWWWWWWXWLGGXXWWWWWWWWWXWWWWWWWWWWXWWWWWWWLGGXXWWWWWXWWWWLWWWWWLWWWWWWWWLWLGGXXWWWWWWXWWWWWWWWWWWWWWWWLT.................',
  '..........XXLX...TTTWWTTTTTWWWWWWWWWXWWLGGXXWWWWWWWWXWWWWWWWWWWXWWWWWWWLGGXXWWWWWXWWWWLWWWWWLWWWWWWWWLWWLGGXXWWWWWXWWWWWWWWWWWWWWWLL..................',
  '..........XXXL...TXXXWWWWWWWWWWWWWWWXWWLGGXXWWWXWWWWWXWWWWWWWWWWWWWWWWWLGGXXWWXWWWWWWWWWWWWXWWWWWWWWWWWWLGGXXWWWWWWWWWWXWWWWWWWWWWWWTT................',
  '..........XXLX....XXWXWWWWWWWWWWWWWWXWWPPPPPWWWXWWWWWXWWWWWWWWWWWWWWWWWLGGXXWWXWWWWWWWWWWWWXWWWWWWWWWWWWLGGXXWWWWWWWWWWXWWWWWWWWWWWWTTT...............',
  '..........XXXL..TTXXWWWWWWWWWWWWWWWWXPPPRPPPPPRXWWWWWXWWWWWWWWWWWWWWWWWLGGXXWWXWWWWWWWWWWWWXWWWWWWWWWWWWWLGGPXWWWWWWWWWXWWWWWWWWWWWWLL................',
  '..........XXLX.TTTWWWWWWLWWLXWWWWWWPPPPPPPPPPRPPWWWWWWWWWWWWWWWWWWWWWWLWWWWWWWWWWWWWWWPPPPPRPPSWWWWWWWWPPPPPPPSPPWWWWWWWWWWXWWWWWWWWWLT...............',
  '..........XXXL.TXWXWWWWWLWWLXWWWWPPPSPPPPPPPPPPPPPWWWWWWWWWWWWWWWWWWWWLWWWWWWWWWWWWWPPSPPPSPPPPPPPPPPPPPPPPRPPPPPPPWWWWWWWWXWWWWWWWWWWTT..............',
  '..........XXWXTWWWWWWWWWLWWLXWWWPPPPPPPPPPPPPPPPPPPPPWWWWWPPPPPPPWWWWWLWWWWWWWWWWWWPPPPPPPPSPPPPPPPPPPPRPPRPPPPPPPPPWWWWWWWXWWWWWWWWWWSSS.............',
  '..........XXXWTPPPPPPPRPPWWWWPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPWWWWWWWWWWWWWPPPSPPPPPPPPPRPPRPRRPPPPPPPPPPRPPPPPPWWWWWWWWWWWWWPPPRRSS............',
  '............XXPXPPPPRPPPPPSPRSPPPPPPPPPPPRPPPPRPPPSPPPPPPPPPPRPPPPPRPPWWWWWWWWWPPRPPPPPPPSPPPPPPPPPPRPPSPPPPPPPPSPPPPPPWWWWWWWWWPPPPPPPPSSS...........',
  '...........SXPXPPPPPPSPPPPPPSRPPPPPPPPPPPPPPPPPPPPPPSPPPPPPPPPPPPPSPPPPPPWWWWPPPPPPPRPPRPPPPPPPPPPRPPPPPPPPPPRPPPPPPPPPPPPWWWPPPPPRPPPPPPSSS..........',
  '..........SSPXPPRRPPPPPPPPPPPPPPPPPPPPPPPSPRSPPPPPPPSRPPPPPPPPPSPPPPPPPPPPPPPPPPPPSPPPPPPPPPRPPPPPRPPPPPPPPSPPSPRPPPPPRRPPPPPPPPPRPPPPPPPPSSS.........',
  '.........SSPXPPPPPPPPPPPPPPPPPPPPPPPPRSPPPPRPPPPPPPPPPPPPSPPPPPPPPPPPPPPPSRPPPPPRPPPPPPPPPPPPPPPPRPSPPPPPPSPPPPPRPPPPPPPPPSPPPPPPPPRPPPPPPPSSS........',
  '........SSPXPPPPPPPRPPPSPPPRPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPSPPPPRPPPPPPSPPPPPPPPPPRPPPPPPPPPRPPSPPPPPPRPPPPPPRPSSS.......',
  '.......SSPXPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPSPPPPRPPPPPPPPPPPPPPPRPPPPPPPPPSPRPPPPPPPRPPPPPPPPPRRPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPSSS......',
  '......SSPXPPPPPPPPPPPPPPPPRPSRPPPRPPPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPRPRSPPPPPPPSPPPPRPPPPPPPPPRPPRPPPPPPPPPPPPRPPPPRPPPPPPPPPPRPPPPPSSS.....',
  '.....SSPXRPPPPPPPPPPPPPPPPPPPRPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPPRPPPPRPPPPPSPPPPPPRPPPPPRPPPPPRPRPPPPPPPPSPPPPPPPRRPPPPPPPSPPRPPPSPPSSS....',
  '....SSPRPPPPPPPPPPPPPPPRPRPPPPPPPPPPRPPPPPPPPSRPPPPPPPPPPPPPPPPPPPRPPPPPPRPPPPRPPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPRPPPPRPPRPPPPPPPPSRS....',
  '....SXXPPRPPPPPRPPRPPPPPRPRPPPPPPPPPPPRPPPSPPPPPPPPPSPPPPPPPRPPPPPPPPPPPPPPPPRPPPRPPPPPPPPPPPPPSPPPPPPPPPRPPPPSPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPPPSSS...',
  '...SRXPPPPPRPPPPRPPPPPPPPPPPPPPPPPRPPPPPPRPPPPPPPPPPPPPPPPPPPRPPRPPPPPPPPPPPPPRPPPPPPPPSPPPPPPPPPPPPRPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPSSS...',
  '...SXPXPPPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPSPPPPPPPPPRPPPPPPPPPPPPPPRPPRPPPPPPSSRPPPPPPPPPPPPPPPRPPPPPPPPPPPPPRPRPRPPPPPPPPPPPPPPPPPPPPPPPSRS..',
  '..SXPXPPPPPPPPRPPPPPPPPRSPPPPPPPRPPPRPPPPPPPPRPPPPPSSPRPPPPPPPPPPPPPPPPPRSRPRPPPPPPPPPPPPPPPRPRPPPPPPPPPRPPPPPSPPPRPPPRPPPPPPPPPPPPPRPPPPPPPPPPPPRSS..',
  '..SXXPPPRPPPPPPPPSPPPPPPPRPPPPPPPPPPPPPPPRPPRPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPRPPPSRPPPPPPPRPPPRPPPPRPSPPPPPPPPPPPPPPPPPRPPPPPPPPSPPPSSS.',
  '.SXXPPPPPPPPPPPPRPPPPPPPPPRRRPPPPRPRPPPPPPPPPPRPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPRPPPPPPPPPPSPPPPPRPPPPPPSPPPPPPPPSPPPPPPPPPPSPSSS.',
  '.SXPRPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPRSPPPRPPPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPSPPPPSPPPPPPPPSPRPPPPPPPPPPSSS',
  'SXPXPPPPRPPPPPPRPRSRPPPPPPPPPPPPPPRPRPPPPPRRPRPRPPPPPPPRPPPPPPRSPPPPSPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPRPPPSPPPPPRPPPPPPRPPPPPRPPPPPPPPSPPPSPPRPPPPSPRSS',
  'SXXPPPPPRPPPPPPPPPPPRSPPSPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPSPPPPPPPPPPPPPPPPPPPRPPPRPPPPPPPPPPPPPSPPPPPPRPPPPPPPPPPPPRPPPPPPPRPPPPPRPPPPPPSSS',
];
const MESA_C = [
  '..................................TTTTT...TTT...................................',
  '..................................TTTTT...TTT...................................',
  '..................................XXWXL...WLGTTT................................',
  '............................TTTTTTLGGXXTTTWLGTTT................................',
  '...........................TTTTTTTLGGXXTTTWLGGXXTTTTTT..........................',
  '............................XXXWWWLGGXXWWWWLGGXXTTTTT...........................',
  '.............................XXXWWLGGXXWWWWWLGGXXXLL............................',
  '............................TXXWWWLGGXXWWWWWLGGXXXWLT...........................',
  '...........................TTXWWWLGGXXWWWWWWLGGXXXWWTT..........................',
  '..........................TTXWWWWLGGXXWWWWWWLGGXXWWWWTT.........................',
  '..........................TXWXWWWLGGXXWWWWWWLGGXX...............................',
  '...........................XXWXWWLGGXXWWWWWWLGGXX...............................',
  '..........................TXWXWLWLGGXXWWWWWWLGGXX...............................',
  '.........................TTWXWWLWLGGXXWWWWWWLGGXX...............................',
  '.........................TXXWWWLWLGGXXWWWWWWWLGGX...............................',
  '..........................XXXWWWWLGGXXWWWWWWWLGGX...............................',
  '........................TTWXWWWWLGGXXWWWWWWWWLGGX...............................',
  '.......................TTTXWWWWWLGGXXWWWWWWWWLGGXTTTTTTT........................',
  '........................XXWXWWWWLGGXXWWWWWWWWLGGXTTTTTT.........................',
  '.........................XXLXWWWLGGXXWWWWWWWWLGGXXWWWWLT........................',
  '........................TXWXWWWWLGGXXWWWWWWWWLGGXXWWWWWTT.......................',
  '.......................TTWXWWWWWLGGXXWWLWWWWLGGXXWWWWWWWTT......................',
  '......................TTWXWWWWWWLGGXXWWLWWWWLGGXXWWWWWWWLT......................',
  '......................TXXWWWWWWWLGGXXWWLWWWWLGGXXWWWWWWLL.......................',
  '.......................XXXWXXWWWWLGGXXWXWWWWLGGXXWWWWWLL........................',
  '........................XXXXXWWWWLGGXXWXWWWWLGGXXWWWWWWLT.......................',
  '.......................TXXTTTTTTWLGGXXTTTTTWLGGXXTTWWWWWTT......................',
  '......................TTXLXXXXXXWLGGXXXXXXWLGGXXXXXWWWWWWTT.....................',
  '.....................TTXWLWWWWWWWLGGXXWWXWWLGGXXWWWWWWWWWLT.....................',
  '.....................TXWXLWWWWWWWLGGXXWWXWWLGGXXWWWWWWWWLL......................',
  '......................X....XXXWWWWLGGXXLWWWLGGXXWWWWWWWLL.......................',
  '...........................XXWXWWWLGGXXLWWWLGGXXWWWWWWWWLT......................',
  '......................T....XXXWWWWLGGXXLWWWLGGXXWWWWWWWWWTT.....................',
  '.....................TT....XXWXWWWLGGXXXWWLGGXXWWWWWWWXXWWTT....................',
  '....................TTL....XXXWWWWLGGXXXWWLGGXXWWWWWWWXXWWLT....................',
  '....................TXX....XXWXWWWLGGXXXWWLGGXXWWWWWWWXXWLL.....................',
  '.....................XX....XXXWWWWLGGXXWWWLGGXXWXWWWLWWWWXLT....................',
  '....................TXX....XXWXWWWWLGGXXWWLGGXXWXWWWLWWWWXWTT...................',
  '...................TTXL....XXXWWWWWLGGXXWWLGGXXWXWWWLWWWWXWLT......TT...........',
  '...................TXWXTTTTWWWWWWXWLGGXXXWLGGXXWWWWWWWWWWWLL.......TT...........',
  '....................XXXTTTTWWWWWWXWLGGXXXWWLGGXXWWWWWWWWWLL.......TXLT..........',
  '.....................XXWXWWWWWWWWXWLGGXXXWWLGGXXWWWWWWWWWWLT......TXXT..........',
  '....................TXWXWWWWWWWWWWWLGGXXWWWLGGXXWWWWXWWWWWWTT.....XXLX..........',
  '...................TTWXWWWWWWWWWWWWLGGXXWWWLGGXXWWWWXWWWWWWWTT....XXXL..........',
  '..................TTWXWWWWWWWWWWWWLGGXXWWWWLGGXXWWWWXWWWWWWWLT....XXLX..........',
  '..................TXXWWWWWWWWWWWWWLGGXXWWWWLGGXXWWWWWXWWWWWLL.....XXXL..........',
  '...................XXXWWWWWWWWWWWWLGGXXWWWWLGGXXWWWWWXWWWWWWLT....XXLX..........',
  '..................TXXWWWWWWWWWWWWWLGGXXWWWWLGGXXWWWWWXWWWWWWWTT...XXXL..........',
  '.................TTXWWWWLWWLXWWWWWLGGXXWWWWWLGGXXWWWWWWWWWWWWLT...XXLX..........',
  '.................TXWXWWWLWWLXWWWWWLGGXXWWWWWLGGXXWWWWWWWWWWWLL....XXXL..........',
  '..................XXWXWWLWWLXWWWWWLGGXXWWWWWLGGXXWWWWWWWWWWLL.....XXLX..........',
  '.................TXWXLWWWWWWWWWWWLGGXXWWWWWWLGGXXWWWXWWWWWWWLT....XXXL..........',
  '................TTWXWLWWWWWWWWWWWLGGXXWPPRPPLGGXXWWWXWWWWWWWWTT...XXLX..........',
  '................TXXWWLWWWWWWWWWWWLGGXPPPPPPPPPPWWWWWXWWWWWWWWWTT..XXXL..........',
  '.................XXXWWWWXWWLWWWWWLGPPPPPPSPRSPPPWWWWWWWWWLWWWWLT..XXLX..........',
  '................TXXWWWWWXWWLWWWWWPPPPRSPPPPRPPPPPPWWWWWWWLWWWLL...XXXL..........',
  '...............TTXWWWWWWXWWLWWWWPPRPPPPPPPPPPPPPPPPPPWWWWLPPPPSSS.XXLX..........',
  '..............TSXPPPPPPPPWWWWPPPPPPPPPPPPRPPPPPPPPPPPPPPSPPPPRPSSSPSLL..........',
  '.............SSXPPPPPPPPPPRPSRPPPRPPPSPPPPPPPPPPPPPPPPPPPPPPPPPPPSPSSS..........',
  '............SSXPPPPPPPPPPPPPPRPSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSSS............',
  '...........SSXPPPPPPPPPRPRPPPPPPPPPPRPPPPPPPPSRPPPPPPPPPPPPPPPPPPPRSS...........',
  '..........SSXPPRPPRPPPPPRPRPPPPPPPPPPPRPPPSPPPPPPPPPSPPPPPPPRPPPPPPSSS..........',
  '.........SSRPPPPRPPPPPPPPPPPPPPPPPRPPPPPPRPPPPPPPPPPPPPPPPPPPRPPRPPPSSS.........',
  '........SSSPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPSPPPPPPPPPRPPPPPPPPSSS........',
  '.......SSXPPPPRPPPPPPPPRSPPPPPPPRPPPRPPPPPPPPRPPPPPSSPRPPPPPPPPPPPPPPPSSS.......',
  '......SSRPPPPPPPPSPPPPPPPRPPPPPPPPPPPPPPPRPPRPRPPPPPPPPPPPPPPPPPPPPPPPPSSS......',
  '.....SSXPPPPPPPPRPPPPPPPPPRRRPPPPRPRPPPPPPPPPPRPPPPPPPPPPPPPPPPPRPPPPPPPSSS.....',
  '....SSRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSPPPPPRSPPPRPPPPPPPRPPPPPRPPPPPPPPPPSSS....',
  '....SXPXRPPPPPPRPRSRPPPPPPPPPPPPPPRPRPPPPPRRPRPRPPPPPPPRPPPPPPRSPPPPSPPPPSSS....',
  '...SXPXPRPPPPPPPPPPPRSPPSPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPSPPPPPSSS...',
  '...SXXPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPSPPRRPPPPPPPPPPPRPPSPPPPPPPSSS...',
  '..SXXPPPPRPPPPPRPPPPPRPPPPPPPPPPPPPPPPPPPRPPSPPPPPPPRPPPPPPPPSPPRPPPPPPPPPPSSS..',
  '..SRRXPPPPPPPPPPPPPSPRPPRPPRPRPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPSPPPPPSPPPPPPSSS..',
  '.SSPXPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPRPPPPPRPPPPPPPPSSS.',
  '.SXXPPSPPPPPPPPPPPPPPRPPPRPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPRRPSPPSPPPPPPPPSSS.',
  'SXXPPPRRPPPPPPPPPPPPPPPPPPPPPPPRRPPPPPPSPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPSSS',
  'SXPXPPPPPPPPPPPPPSPPPPPPPPPPPPPPPPPPPPPRPPPPPPPPPPSPPPPPPPPPPPRPSPPPPPPPPPRPPSSS',
  'XXXPPPPPSPPPPPPPPPPPPPPPPPPRPPPPPPPPPPPPPPPPPPPPPPPPPPPPRPPPPPSPPPPPRRPSPPPPPSSS',
];
const MESAS = [MESA_A, MESA_B, MESA_C];
const FRANJAS_MESAS = [
  'rrrrrrooooooovvvvvvoooooorrrrrrrlllllloooooorrrrrrrvvvvvoooooorrrrrrllllllooooorrrrr',
  'rrrrroooooollllloooooorrrrrrvvvvvoooooorrrrrrrlllllloooooorrrrrroooooo',
  'rrrrrroooooovvvvvoooooorrrrrrlllllloooooorrrrrrrvvvvvoooooorrrrrrllllllooooooo',
];
/**
 * Las franjas: [al sol, pared, sombra]. 🔁 APAGADAS *(Santi: "parece una bandera: son muy distintos los tonos y no hay
 * suavidad entre ellos"; eligió "los 4 colores, apagados")*: antes eran el rojo, el ocre, el lila y el verde vivos de
 * la paleta; ahora son los de al lado, más grises y más parecidos entre sí en lo claro y lo oscuro.
 */
const ESTRATOS = {
  r: [12, 11, 47],  // rojo apagado: el rojizo de la piel curtida
  o: [36, 35, 34],  // ocre apagado: el de la madera gastada
  l: [25, 24, 46],  // lila apagado: el gris con algo de lila (🔁 con el lila de la paleta todavía saltaba)
  v: [15, 14, 33],  // verde apagado: el oliva grisáceo
};
/** T: lo que mira para arriba (tapa, repisas, el borde de arriba de cada cosa), L: lo que mira a la luz (a la
 * derecha), W: la pared, X: la sombra, G: el fondo de las canaletas; y en el talud S (al sol), P (el medio) y R (las
 * piedras caídas, que hacen sombra). */
const PARTE = { T: 0, L: 0, S: 0, W: 1, P: 1, X: 2, G: 2, R: 2 };
/** El tramado de 4×4: dónde se mezclan dos franjas que se tocan, punto por punto. */
const PARTE_TALUD = new Set(['S', 'P', 'R']);
const TRAMA = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Una o ninguna por tramo de 385 puntos, con el pie entre 3 y 10 filas abajo del horizonte. 🔁 LAS FRANJAS EN ONDA Y
 * MEZCLADAS: cada punto toma la franja de su fila corrida un poco para arriba o para abajo según la columna (una onda
 * larga y una corta: las capas de roca nunca son derechas), y donde dos franjas se tocan se mezclan con el tramado en
 * unas dos filas, así pasan de una a otra sin corte (eso es el "paso" entre colores).
 */
function pintarMesetas(U0, q0, w, h, horizonte, pv) {
  const AN = 385, piso = Math.floor(horizonte / PASO);
  for (let n = Math.floor(U0 / AN) - 1; n <= Math.floor((U0 + w) / AN) + 1; n++) {
    const nn = md(n, VUELTA / AN);
    if (hash(nn * 13 + 1, 59) > 0.8) continue;
    const k = Math.floor(hash(nn, 61) * MESAS.length), mapa = MESAS[k], franjas = FRANJAS_MESAS[k];
    const sx = n * AN + Math.floor(hash(61, nn) * (AN - mapa[0].length)) - U0;
    const sy = piso + 3 + Math.floor(hash(nn + 5, 7) * 8) - mapa.length - q0;
    for (let i = 0; i < mapa[0].length; i++) {
      const onda = 1.6 * Math.sin(i / 21 + k * 2) + 0.8 * Math.sin(i / 7.3 + k);
      for (let j = 0; j < mapa.length; j++) {
        const l = mapa[j][i];
        if (l === '.') continue;
        // (El talus son piedras caídas de todas las capas: ahí la mezcla es mucho más ancha, granulada.)
        const mezcla = (TRAMA[(j & 3) * 4 + (i & 3)] / 16 - 0.5) * (PARTE_TALUD.has(l) ? 4.5 : 2.2);
        const jj = Math.max(0, Math.min(mapa.length - 1, Math.floor(j + onda + mezcla + 0.5)));
        pv(sx + i, sy + j, ESTRATOS[franjas[jj]][PARTE[l]]);
      }
    }
  }
}

/**
 * 🆕 LOS RASTROS CON HISTORIA *(Santi eligió "rastros con historia": que el desierto sea inconfundible)*. Pocas
 * cosas, sueltas y lejos unas de otras, que cuentan que por acá pasó gente. 🔁 SEGUNDA VUELTA *(Santi: "tienes que
 * arreglar los detalles históricos que agregaste: se ven chicos o no entran donde deberían")*: estaban en el medio
 * del desierto de allá, del tamaño de un juguete, y la carreta quedaba tapada por los cables. Ahora:
 *
 *  - LOS POSTES DEL TELÉGRAFO van pegados a la vía, del otro lado, como los de verdad: de unos 8 m (a 3/4, por la
 *    distancia), uno cada 220 puntos. El tren les tapa el pie, y por arriba del techo asoman la punta y los dos cables
 *    que cuelgan de poste a poste.
 *  - LA CARRETA ABANDONADA (con los arcos del toldo pelados, uno roto, una tabla menos y una rueda sin dos rayos), LA
 *    CRUZ de madera sobre su montoncito de piedras y LA APACHETA (piedras apiladas con un trapo rojo en un palo), del
 *    tamaño de verdad: a 3/4 cerca del tren y a la mitad al fondo.
 *  - DE ESTE LADO, SÓLO COSAS CHATAS, que no se confunden con lo que te frena, y más grandes: LA OSAMENTA de una vaca
 *    (la calavera con los cuernos, el espinazo, las costillas abiertas y las patas sueltas) y UNA RUEDA DE CARRETA
 *    tirada (vista de arriba, se ve aplastada).
 */
const POSTE = [
  'i.i..i.i',
  'AAAAAAAA',
  'qqqqqqqq',
  '...pP...',
  '...pP...',
  '...pP...',
  '..ipPi..',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '...pP...',
  '..spPss.',
  '.ssss...',
];
const CARRETA_34 = [
  '........qq.........qq.........qq..................',
  '.......q..q.......q..q.......q..q.................',
  '.......q..q.......q..q.......q..q.................',
  '.......q..q.......q..q.......q..q.................',
  '.......q..q.......q..q.......q..q.................',
  '.......q..q.......q..q.......q..q.......q.........',
  '.......q..q.......q..q.......q..q.......q.........',
  '.......q..q.......q..q.......q..q.......q..q......',
  '.......q..q.......q..q.......q..q.......q..q......',
  '.......q..q.......q..q.......q..q.......q..q......',
  'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
  'pppppppppppppppppppppppppppppppppppppppppppppppppp',
  'ppppppppppppqppppppppppppqpppppppppppqpppppppppppp',
  'qqqqqqqqRRRRRqqqqqqqqqqqqqqqqqqqqqqqqRRRRRqqqqqqqq',
  'ppppppRRpprpqRRppppppppppqHHHHHHpppRRqprppRRpppppp',
  'pppppRpppprpqppRpppppppppqHHHHHHppRppqprppppRppppp',
  'ppppRprppprppprpRppppppppppppppppRprppprpppppppppp',
  'qqqqRqqrqqrqqrqqRqqqqqqqqqqqqqqqqRqqrqqrqqqqqqqqqq',
  '...R.qqqrqrqrqqqqRqqqqqqqqqqqqqqRqqqqrqrqqqqq.....',
  '...R.....rrr.....R..............R.....rrr....R....',
  '...RrrrrrrHrrrrrrR..............RrrrrrrHrrrrrrR...',
  '...R.....rrr.....R..............R.....rrr.....R...',
  '...R....r.r.r....R..............R......r......R...',
  '....R..r..r..r..R................R.....r.....R....',
  '....R.r...r...r.R................R.....r.....R....',
  '.....R....r....R..................R....r....R.....',
  '......RR..r..RR....................RR..r..RR......',
  '........RRRRR........................RRRRR........',
  '..ssssssssssssssssssssssssssssssssssssssssssssss..',
  '....ssssssssssssssssssssssssssssssssssssssss......',
];
const CARRETA_12 = [
  '...q........................',
  '...q......q.................',
  '...q......q......q..........',
  'PPPPPP....q......q..........',
  'pppRRRRRPPPP.....q..........',
  'qpRpprppRpppPPPPPP..........',
  'pRprprqrpRppppppppPPPPPPq...',
  'qRqqrrrppRppqpppppppppppPPPP',
  '.RrrrHrrrRqqppppppqppppppppp',
  '.R..rrr..R..qqqqqqppppppqppp',
  '.R.r.r.r.R........qqqqqqpppp',
  '..R..r..R.........ssssssqqqq',
  '.ssRRRRRsssssssssssssssssss.',
];
const CRUZ_34 = [
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '.PPPPPPPPPq.',
  '.qqqqqqqqqq.',
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '.....Pq.....',
  '..aaaPqaa...',
  '.aabbbbbbbc.',
  'abbbbbbbbbcc',
  '.ssssssssss.',
];
const CRUZ_12 = [
  '....Pq...',
  '....Pq...',
  '.PPPPPPPq',
  '.qqqqqqqq',
  '...Pq....',
  '...Pq....',
  '...Pq....',
  '...Pq....',
  '...Pq....',
  '.aaPqaa..',
  'aabbbbbc.',
  '.ssssss..',
];
const APACHETA_34 = [
  '......tee....',
  '......teee...',
  '......tee....',
  '......t......',
  '......t......',
  '......t......',
  '.....aac.....',
  '....aabcc....',
  '....abbbc....',
  '...aabbbcc...',
  '...abbbbbc...',
  '..aabbbbbcc..',
  '..abbbbbbbc..',
  '.aabbbbbbbcc.',
  'aabbbbbbbbbcc',
  '.sssssssssss.',
];
const APACHETA_12 = [
  '...tee...',
  '...teee..',
  '...t.....',
  '...t.....',
  '..aatc...',
  '..abbc...',
  '.aaabbc..',
  '.abbbbcc.',
  'aaabbbbcc',
  'abbbbbccc',
  '.sssssss.',
];
const OSAMENTA = [
  'B.......B...............................',
  'BB.....BB.....O..O..O..O..O.............',
  '.BBOOOBB.....O..O..O..O..O..O...........',
  '..OkOkO......O..O..O..O..O..O.....OOO...',
  '..OOOOO.....O..O..O..O..O..O.....OBBBO..',
  '...OOO..OOOOOOOOOOOOOOOOOOOOOOOOOOBkBO..',
  '...OkO.....BB.BB.BB.BB.BB.BB.....OBBBO..',
  '....O.......O..O..O..O..O..O......OOO...',
  '.............O..O..O..O..O..O...O.....O.',
  '..ssss.......sssssssssssssssss..O.....O.',
  '..............................ssss...ss.',
];
const RUEDA_TIRADA = [
  '......WWWWWWWWWWW......',
  '...WWW....w.w....WWW...',
  '.WW..w....w.w....w..WW.',
  'W.....w...w.w...w.....W',
  'W.......w.www.w.......W',
  'WwwwwwwwwxxxxxwwwwwwwwW',
  'W.......w.www.w.......W',
  'W.....w...w.w...w.....W',
  '.WW..w....w.w....w..WW.',
  '...WWW....w.w....WWW...',
  '......WWWWWWWWWWW......',
  '.......sssssssss.......',
];
// (La madera: al sol, de costado y en sombra; los fierros, los huesos, las piedras, el trapo y los aisladores.)
const COLOR_RASTROS = {
  P: 35, p: 34, q: 33, A: 34, R: 32, r: 35, H: 32, t: 33, i: 17,
  a: 25, b: 24, c: 23, e: 10, O: 30, o: 34, B: 16, k: 34, W: 23, w: 5, x: 6, s: 36,
};
const CABLE = 31;
/** Las cosas de allá, en sus dos tamaños: [de 3/4, de la mitad]. */
const DE_ALLA = [[CARRETA_34, CARRETA_12], [CRUZ_34, CRUZ_12], [APACHETA_34, APACHETA_12]];

/** Los rastros: los postes pegados a la vía, lo de allá entre 'desde' y 'hasta' (en el mundo), lo de acá abajo de la vía. */
function pintarRastros(U0, q0, w, h, franja, V, libre, pv) {
  const estampar = (mapa, sx, sy) => {
    for (let j = 0; j < mapa.length; j++) for (let i = 0; i < mapa[j].length; i++) {
      const l = mapa[j][i];
      if (l !== '.') pv(sx + i, sy + j, COLOR_RASTROS[l]);
    }
  };
  const [desde, hasta] = franja, filaTope = Math.floor(hasta / PASO), filaPiso = Math.ceil(desde / PASO);
  // Las cosas de allá: una o ninguna por tramo de 385 puntos.
  const AN = 385;
  for (let n = Math.floor(U0 / AN) - 1; n <= Math.floor((U0 + w) / AN) + 1; n++) {
    const nn = md(n, VUELTA / AN), hz = hash(nn * 11 + 5, 91);
    if (hz > 0.75) continue;
    const cual = DE_ALLA[hz < 0.25 ? 0 : hz < 0.5 ? 1 : 2];
    const pieY = filaPiso + 16 + Math.floor(hash(nn, 37) * Math.max(1, filaTope - filaPiso - 20));
    const mapa = cual[deCerca(pieY, franja) ? 0 : 1];
    const sx = n * AN + 60 + Math.floor(hash(37, nn) * (AN - 160)) - U0;
    estampar(mapa, sx, pieY - mapa.length + 2 - q0);
  }
  // Los postes del telégrafo, con el pie pegado a la vía (detrás del tren), y sus cables.
  const CADA = 220, pieP = Math.floor((V.piedra[0] - 3) / PASO), arriba = pieP - POSTE.length + 2 - q0;
  for (let n = Math.floor(U0 / CADA) - 1; n <= Math.floor((U0 + w) / CADA) + 1; n++) {
    const x = n * CADA + 40 - U0;
    // (Los dos cables cuelgan de poste a poste y bajan 8 puntos en el medio: uno del aislador de la punta y otro de
    //  la clavija de más abajo, para que no se monten. De dos puntos de grueso: de lejos el campo se achica a la
    //  mitad, y uno de un punto se veía cortado.)
    for (const [c, f] of [[0, 0], [5, 6]]) for (let i = 0; i <= CADA; i++) {
      const t = i / CADA, y = arriba + f + Math.round(8 * 4 * t * (1 - t));
      pv(x + c + i, y, CABLE); pv(x + c + i, y + 1, CABLE);
    }
    estampar(POSTE, x, arriba);
  }
  // Las de acá, chatas: una o ninguna por cuadro de 385 × 110 puntos, abajo de la vía.
  const AL = 110, filaVia = Math.ceil(V.piedra[1] / PASO) + 6;
  for (let n = Math.floor(U0 / AN) - 1; n <= Math.floor((U0 + w) / AN) + 1; n++) {
    const nn = md(n, VUELTA / AN);
    for (let m = Math.floor(q0 / AL) * AL - AL; m <= q0 + h; m += AL) {
      const hz = hash(nn * 23 + m, 61);
      if (hz > 0.3) continue;
      const mapa = hz < 0.17 ? OSAMENTA : RUEDA_TIRADA;
      const sx = n * AN + 30 + Math.floor(hash(nn + 7, m) * (AN - 80)) - U0, py = m + Math.floor(hash(m, nn + 3) * AL);
      if (py < filaVia) continue;
      const sy = py - q0 - mapa.length;
      if (libre(sy, mapa.length)) estampar(mapa, sx, sy);
    }
  }
}

/**
 * 🆕 LOS MEDANITOS: uno o ninguno por cada cuadro grande (110 × 44 puntos), grandes o chicos. Pocos y separados: las
 * manchas de arena por todos lados ya se probaron y parecía un pantalón militar.
 */
function pintarMedanos(U0, q0, w, h, enLaVia, estampar) {
  const AN = 110, AL = 44;
  for (let n = Math.floor(U0 / AN) - 1; n <= Math.floor((U0 + w) / AN) + 1; n++) {
    const nn = md(n, VUELTA / AN);
    for (let m = Math.floor(q0 / AL) * AL - AL; m <= q0 + h; m += AL) {
      const hz = hash(nn * 17 + m, 83);
      if (hz > 0.3) continue;
      const mapa = hz < 0.12 ? MEDANO : MEDANO_C;
      const sx = n * AN + Math.round(hash(nn, m + 7) * (AN - 20)) - U0, sy = m + Math.floor(hash(m + 3, nn) * (AL - 6)) - q0;
      if (enLaVia((sy + q0) * PASO - 4) || enLaVia((sy + q0 + 6) * PASO)) continue;
      estampar(mapa, sx, sy);
    }
  }
}

/**
 * 🆕 LAS HUELLAS DE CARRETA: un camino de dos surcos que va a lo largo de la vía, de este lado, serpenteando apenas.
 * Los surcos están a 20 puntos uno del otro (lo que abre una carreta, con esta cámara, al lado de la trocha de la vía,
 * que son 21). Cada surco: el hundido en sombra (33) y el borde de acá, que agarra el sol, más claro (36). No va
 * entero: se corta a tramos, donde el viento lo tapó.
 */
const HUELLAS = { desde: 70, cada: 150, separa: 20 };
function pintarHuellas(U0, q0, w, h, V, pv) {
  const fila0 = Math.round((V.piedra[1] + HUELLAS.desde) / PASO);
  for (const fila of [fila0, fila0 + Math.round(HUELLAS.cada / PASO)]) {
    for (let x = 0; x < w; x++) {
      const u = md(U0 + x, VUELTA);
      // Los cortes: tramos de 22 puntos, y en cada uno se sortea si está tapado.
      if (hash(Math.floor(u / 22) + fila, 61) < 0.28) continue;
      // El serpenteo: dos ondas que cierran justo en la vuelta (para que no se note la costura).
      const dy = Math.round(3 * Math.sin((u / VUELTA) * Math.PI * 2 * 3) + 2 * Math.sin((u / VUELTA) * Math.PI * 2 * 7 + fila));
      for (const s of [0, HUELLAS.separa]) {
        const y = fila + dy + s - q0;
        if (y < 0 || y >= h - 1) continue;
        // (🔁 De dos puntos de hondo: de uno se confundía con una veta.)
        pv(x, y, 35); pv(x, y + 1, 36);
        if (hash(u, fila + s) < 0.85) pv(x, y + 2, 38);
      }
    }
  }
}

/**
 * 🛤️ LA VÍA, EN EL ESTILO NUEVO *(Santi: "revisá todo lo de las vías: texturas, colores, formas… teniendo en cuenta la
 * perspectiva de la cámara"; eligió las recomendaciones)*. Se ve sólo por los huecos (los enganches), pero va pintada
 * en el mismo suelo, así pasa con él. Antes era el dibujo viejo: puntos tres veces más chicos que los del resto (la
 * grava se leía como polvo), colores fuera de la paleta, los durmientes borroneados en una franja y los rieles dos rayas
 * centradas con el piso del vagón. Ahora, de arriba para abajo (en el mundo, `VIA`):
 *
 *  - TODO CORRIDO PARA ABAJO, unos 9: el piso del vagón va levantado sobre las ruedas, como un metro, y con esta
 *    cámara lo alto se dibuja más arriba y lo bajo más abajo. La vía está en el suelo, debajo del vagón.
 *  - EL TERRAPLÉN es un lomo de piedra: arriba plano, con los durmientes, y una ladera a cada lado. La de allá le da la
 *    espalda a la cámara y casi no se ve (una tirita); la de acá le da la cara y se ve entera *(Santi: "debería haber
 *    más debajo por una cuestión de perspectiva")*. Las dos de la misma piedra gris, con piedras que se distinguen
 *    (la cara de arriba clara, la de abajo en sombra) y el borde mordido contra la tierra.
 *  - LOS DURMIENTES, de madera, cruzados, uno cada 44 puntos: pasan con el suelo (a 5 unidades por cuadro se siguen
 *    con la vista; el borroneado era de cuando el suelo saltaba 15). El sol viene de allá y un poco de la derecha (la
 *    luz de los ventanales cae corriéndose a la izquierda): el canto derecho agarra luz, la sombra cae a la izquierda,
 *    y el canto de acá, el que da a la cámara, más oscuro. Con su veta.
 *  - LOS RIELES, encima, cada uno sobre su placa de asiento en cada durmiente: la cara de arriba que brilla, el costado
 *    que da a la cámara, más oscuro, y la sombra que tiran hacia acá.
 */
const VIA = { piedra: [28, 158], durmiente: [38, 140], rieles: [53, 125] };
const fueraDe = (V) => (y) => y >= V.piedra[0] - 2 && y < V.piedra[1] + 2;
const enLaVia = fueraDe(VIA);
const DURMIENTE = 44, ANCHO_DURMIENTE = 12;
const PIEDRAS_VIA = [['.l', 'dl'], ['.ll', 'dl.', 'd..'], ['ll', 'dd'], ['.l.', 'dll', '.d.']];
function pintarVia(ind, w, h, U0, q0, pv, VIA) {
  const Y = (u) => Math.round(u / PASO) - q0;
  const B0 = Y(VIA.piedra[0]), B1 = Y(VIA.piedra[1]), T0 = Y(VIA.durmiente[0]), T1 = Y(VIA.durmiente[1]);
  if (B1 < 0 || B0 >= h) return;
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? ind[y * w + x] : -1);
  // 1. La piedra: gris (23), con el borde mordido de a dos puntos arriba y abajo.
  for (let x = 0; x < w; x++) {
    const u = md(U0 + x, VUELTA), b = u >> 1;
    const arriba = B0 + Math.floor(hash(b, 3) * 3), abajo = B1 - Math.floor(hash(b, 9) * 4);
    for (let y = arriba; y < abajo; y++) pv(x, y, 23);
  }
  // 2. Las piedras sueltas del balasto, de tres formas (todas iguales se leían como rayitas): la luz arriba a la
  //    derecha (24), de donde viene el sol, y la sombra abajo a la izquierda (31).
  const CX = 5, CY = 4;
  for (let n = Math.floor(U0 / CX) - 1; n <= Math.floor((U0 + w) / CX) + 1; n++) {
    const nn = md(n, VUELTA / CX);
    for (let m = Math.floor((B0 + q0) / CY) * CY; m < B1 + q0; m += CY) {
      const hz = hash(nn * 11 + 5, m * 7 + 2);
      if (hz > 0.55) continue;
      const sx = n * CX + Math.floor(hash(nn, m + 1) * 3) - U0, sy = m + Math.floor(hash(m, nn + 3) * 2) - q0;
      const forma = PIEDRAS_VIA[Math.floor(hz / 0.55 * PIEDRAS_VIA.length) % PIEDRAS_VIA.length];
      let libre = true;
      for (let j = 0; j < forma.length && libre; j++) for (let i = 0; i < forma[j].length; i++) if (forma[j][i] !== '.' && get(sx + i, sy + j) !== 23) { libre = false; break; }
      if (!libre) continue;
      for (let j = 0; j < forma.length; j++) for (let i = 0; i < forma[j].length; i++) {
        const l = forma[j][i];
        if (l !== '.') pv(sx + i, sy + j, l === 'l' ? 24 : 31);
      }
    }
  }
  // 3. Los durmientes.
  const rieles = VIA.rieles.map(Y);
  for (let n = Math.floor(U0 / DURMIENTE) - 1; n <= Math.floor((U0 + w) / DURMIENTE) + 1; n++) {
    const nn = md(n, VUELTA / DURMIENTE), x0 = n * DURMIENTE - U0, x1 = x0 + ANCHO_DURMIENTE;
    // (Cada uno apenas distinto: corrido un punto para arriba o para abajo, y alguno más gastado.)
    const dy = Math.floor(hash(nn, 17) * 3) - 1, gastado = hash(nn, 29) < 0.3;
    const t0 = T0 + dy, t1 = T1 + dy;
    for (let y = t0 + 1; y <= t1 + 1; y++) pv(x0 - 1, y, 31);                       // la sombra, a la izquierda
    for (let y = t0; y < t1; y++) for (let x = x0; x < x1; x++) pv(x, y, gastado ? 34 : 33);
    for (let y = t0; y < t1; y++) pv(x1 - 1, y, gastado ? 35 : 34);                 // el canto que agarra el sol
    for (let x = x0; x < x1; x++) { pv(x, t1, 32); pv(x, t1 + 1, 32); }            // el canto de acá
    // La veta: dos rayas a lo largo, cortadas.
    for (const vx of [x0 + 3, x0 + 7]) {
      for (let y = t0 + 2; y < t1 - 2; y++) if (hash(nn * 5 + vx - x0, y + q0) < 0.7) pv(vx, y, 32);
    }
    // Las placas de asiento, debajo de cada riel, con sus clavos.
    for (const ry of rieles) {
      for (let y = ry - 3; y <= ry + 3; y++) for (let x = x0 - 1; x <= x1; x++) pv(x, y, 31);
      pv(x0 + 1, ry - 3, 24); pv(x1 - 2, ry + 3, 24);
    }
  }
  // 4. Los rieles: la cara de arriba (25), su borde (24), el costado que da a la cámara (23) y la sombra hacia acá.
  for (const ry of rieles) {
    for (let x = 0; x < w; x++) {
      pv(x, ry - 2, 25); pv(x, ry - 1, 24); pv(x, ry, 23); pv(x, ry + 1, 23);
      const debajo = get(x, ry + 2);
      pv(x, ry + 2, debajo === 33 || debajo === 34 || debajo === 35 ? 32 : 31);
    }
  }
}

/**
 * EL AFUERA ENTERO: una tira de suelo de una vuelta de ancho, pintada una sola vez por cada luz (de día, de noche, la
 * sombra), que se estampa corrida. La noche es la misma tierra con menos luz *(la noche sale del mismo dibujo)*.
 */
const ARRIBA = Math.floor(-240 / PASO), ALTO = Math.ceil(720 / PASO);
const tiras = {};
let indices = null;
/** La tira con `luz` escalones de luz (0 de día; menos, de noche o en la sombra). */
function tira(luz) {
  if (tiras[luz]) return tiras[luz];
  if (!indices) { indices = new Int16Array(VUELTA * ALTO); pintarSuelo(indices, VUELTA, ALTO, 0, ARRIBA, 0); }
  const cv = document.createElement('canvas'); cv.width = VUELTA; cv.height = ALTO;
  // (En la vía, la mitad de escalones: el gris tiene la escala corta y se iba al negro.)
  const campo = (x, y) => (enLaVia((ARRIBA + y) * PASO) ? Math.floor(luz / 2) : luz);
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: VUELTA, alto: ALTO, indices, campo }), VUELTA, ALTO), 0, 0);
  return (tiras[luz] = cv);
}

/**
 * Estampa el suelo en la pantalla (`ctx` en unidades del mundo, sin la cámara): `camX`, `camY` es el mundo que queda
 * en la esquina de arriba a la izquierda; `desfile`, lo que corrió el suelo (en unidades).
 */
export function dibujarSueloDeAfuera(ctx, camX, camY, ancho, alto, desfile, noche, luz) {
  const T = tira(luz ?? (noche ? CONFIG.tresCuartos.sueloNoche : 0)), k = Math.round(desfile / PASO);
  const p0 = Math.floor(camX / PASO), q0 = Math.floor(camY / PASO);
  const x0 = p0 * PASO - camX, y0 = q0 * PASO - camY;
  const cols = Math.ceil(ancho / PASO) + 2;
  const f0 = Math.max(0, q0 - ARRIBA), f1 = Math.min(ALTO, q0 - ARRIBA + Math.ceil(alto / PASO) + 2);
  if (f1 <= f0) return;
  const yD = y0 + (f0 - (q0 - ARRIBA)) * PASO, hF = f1 - f0;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (let hecho = 0; hecho < cols;) {
    const c = md(p0 + k + hecho, VUELTA), n = Math.min(cols - hecho, VUELTA - c);
    ctx.drawImage(T, c, f0, n, hF, x0 + hecho * PASO, yD, n * PASO, hF * PASO);
    hecho += n;
  }
  ctx.imageSmoothingEnabled = prev;
}

/**
 * 🆕 EL CAMPO DE LA CABALGATA *(Santi: "hagamos el fondo de la cabalgata primero")*: la misma tierra del asalto
 * (pintada con `pintarSuelo`, las vetas, las jarillas y las piedras salen de los mismos sorteos) con las cosas del
 * campo abierto, y la vía puesta donde corre el tren visto desde afuera: el riel de acá justo debajo de las ruedas
 * (que pisan en `base`), el de allá 21 puntos más arriba, tapado por el vagón salvo en los enganches, y el terraplén
 * con su ladera de acá.
 * `ctx` en unidades del mundo, sin la cámara; `camX`, `camY`, el mundo de la esquina de arriba; `desfile`, lo que
 * corrió el suelo; `base`, el pie del tren.
 */
const campos = {};
export function dibujarCampo(ctx, camX, camY, ancho, alto, desfile, noche, base, saguaros, horizonte, mojado = false) {
  // ('saguaros': entre qué alturas del mundo van los saguaros del otro lado del tren; 'horizonte': dónde termina el
  //  desierto: arriba, transparente, salvo los saguaros. 'mojado': ⛈️ con tormenta, la arena un escalón más oscura y
  //  con charcos, ver world/estiloNuevo/lluvia.js.)
  const luz = noche ? CONFIG.tresCuartos.sueloNoche : mojado ? -1 : 0;
  const clave = base + '|' + luz + '|' + String(saguaros) + '|' + horizonte + '|' + (mojado ? 1 : 0);
  if (!campos[clave]) campos[clave] = tiraDeCampo(base, luz, saguaros, horizonte, mojado);
  const { cv, arriba, filas } = campos[clave], k = Math.round(desfile / PASO);
  const p0 = Math.floor(camX / PASO), q0 = Math.floor(camY / PASO);
  const x0 = p0 * PASO - camX, y0 = q0 * PASO - camY;
  const cols = Math.ceil(ancho / PASO) + 2;
  const f0 = Math.max(0, q0 - arriba), f1 = Math.min(filas, q0 - arriba + Math.ceil(alto / PASO) + 2);
  if (f1 <= f0) return;
  const yD = y0 + (f0 - (q0 - arriba)) * PASO, hF = f1 - f0;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (let hecho = 0; hecho < cols;) {
    const c = md(p0 + k + hecho, VUELTA), n = Math.min(cols - hecho, VUELTA - c);
    ctx.drawImage(cv, c, f0, n, hF, x0 + hecho * PASO, yD, n * PASO, hF * PASO);
    hecho += n;
  }
  ctx.imageSmoothingEnabled = prev;
}
/** La vía de la cabalgata, en el mundo, desde el pie del tren (ver `VIA` para cada parte). */
export const viaDeCampo = (base) => ({ piedra: [base - 22, base + 7], durmiente: [base - 19, base + 3.5], rieles: [base - 15, base + 1.25] });
function tiraDeCampo(base, luz, saguaros, horizonte, mojado) {
  const arriba = Math.floor(-300 / PASO), filas = Math.ceil((base + 760) / PASO);
  const V = viaDeCampo(base), enV = fueraDe(V);
  const ind = new Int16Array(VUELTA * filas);
  pintarSuelo(ind, VUELTA, filas, 0, arriba, 0, { via: V, campo: true, saguaros, horizonte });
  if (mojado) pintarCharcos(ind, VUELTA, filas, arriba, V, horizonte);
  const cv = document.createElement('canvas'); cv.width = VUELTA; cv.height = filas;
  const campo = (x, y) => (enV((arriba + y) * PASO) ? Math.floor(luz / 2) : luz);
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: VUELTA, alto: filas, indices: ind, campo }), VUELTA, filas), 0, 0);
  return { cv, arriba, filas };
}

/**
 * 🏇 EL SUELO DE LA HUIDA *(Santi: "una vez tenemos todo eso lo pasás a la huida")*: el mismo desierto del galope
 * (la arena pálida, los manchones de plantas, los medanitos y las huellas de carreta), pero en campo abierto, sin vía
 * y para cualquier lado. Se pinta de a baldosas de 256 × 256 puntos que se guardan (las que quedan lejos se tiran),
 * con la misma cuenta que el galope: cada baldosa sabe qué hay en el mundo, así se pegan sin costura.
 */
const BALDOSA = 256, TOPE_BALDOSAS = 48;
const SIN_VIA = { piedra: [-1e9, -1e9 + 1], durmiente: [-1e9, -1e9 + 1], rieles: [-1e9, -1e9 + 1] };
const baldosas = new Map();

export function dibujarSueloAbierto(ctx, camX, camY, ancho, alto, noche, mojado = false) {
  const luz = noche ? CONFIG.tresCuartos.sueloNoche : mojado ? -1 : 0;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const B = BALDOSA * PASO;
  for (let ty = Math.floor(camY / B); ty * B < camY + alto; ty++) {
    for (let tx = Math.floor(camX / B); tx * B < camX + ancho; tx++) {
      const clave = tx + '|' + ty + '|' + luz + '|' + (mojado ? 1 : 0);
      let cv = baldosas.get(clave);
      if (!cv) {
        const ind = new Int16Array(BALDOSA * BALDOSA);
        pintarSuelo(ind, BALDOSA, BALDOSA, tx * BALDOSA, ty * BALDOSA, 0, { via: SIN_VIA, campo: true });
        if (mojado) pintarCharcosAbiertos(ind, BALDOSA, BALDOSA, tx * BALDOSA, ty * BALDOSA);
        cv = document.createElement('canvas'); cv.width = BALDOSA; cv.height = BALDOSA;
        cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: BALDOSA, alto: BALDOSA, indices: ind, campo: () => luz }), BALDOSA, BALDOSA), 0, 0);
        if (baldosas.size >= TOPE_BALDOSAS) baldosas.delete(baldosas.keys().next().value);
        baldosas.set(clave, cv);
      }
      ctx.drawImage(cv, tx * B, ty * B, B, B);
    }
  }
  ctx.imageSmoothingEnabled = prev;
}

/** Los charcos de la huida: los tres por todos lados (no hay "allá" de la vía), por cuadro del mundo, sin costura. */
function pintarCharcosAbiertos(ind, w, h, p0, q0) {
  const CW = 130, CH = 70;
  const h1 = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  for (let cy = Math.floor(q0 / CH) - 1; cy * CH < q0 + h; cy++) for (let cx = Math.floor(p0 / CW) - 1; cx * CW < p0 + w; cx++) {
    if (h1(cx, cy + 301) < 0.3) continue;
    const m = CHARCOS[Math.floor(h1(cx + 3, cy + 5) * CHARCOS.length)];
    const x0 = cx * CW + Math.floor(h1(cx + 7, cy) * (CW - 36)) - p0, y0 = cy * CH + Math.floor(h1(cx, cy + 11) * (CH - 6)) - q0;
    for (let j = 0; j < m.length; j++) for (let i = 0; i < m[j].length; i++) {
      const l = m[j][i], x = x0 + i, y = y0 + j;
      if (l === '.' || x < 0 || y < 0 || x >= w || y >= h || ind[y * w + x] !== ARENA) continue;
      ind[y * w + x] = COLOR_CHARCO[l];
    }
  }
}

/**
 * ⛈️ LOS CHARCOS (los dibujos, en world/estiloNuevo/lluvia.js): de este lado los tres, uno o ninguno por cuadro de
 * 130 × 70 puntos; del otro lado, más lejos, sólo el chico (los grandes allá se verían del tamaño de los de acá).
 * Se pintan sólo sobre arena lisa: no tapan plantas, piedras ni la vía.
 */
function pintarCharcos(ind, w, h, arriba, V, horizonte) {
  const CW = 130, CH = 70;
  const yAca = Math.ceil((V.piedra[1] + 6) / PASO) - arriba, yAlla = Math.floor((V.piedra[0] - 6) / PASO) - arriba;
  const yTope = Math.ceil(((horizonte ?? -300) + 20) / PASO) - arriba;
  const h1 = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  for (let cy = 0; cy * CH < h; cy++) for (let cx = 0; cx * CW < w; cx++) {
    if (h1(cx, cy + 301) < 0.3) continue;
    const x0 = cx * CW + Math.floor(h1(cx + 7, cy) * (CW - 22)), y0 = cy * CH + Math.floor(h1(cx, cy + 11) * (CH - 6));
    const alla = y0 < yAlla;
    if (!alla && y0 < yAca) continue;
    if (alla && y0 < yTope) continue;
    const m = CHARCOS[alla ? 1 : Math.floor(h1(cx + 3, cy + 5) * CHARCOS.length)];
    if (alla && y0 + m.length > yAlla) continue;
    for (let j = 0; j < m.length; j++) for (let i = 0; i < m[j].length; i++) {
      const l = m[j][i], x = (x0 + i) % w, y = y0 + j;
      if (l === '.' || y >= h || ind[y * w + x] !== ARENA) continue;
      ind[y * w + x] = COLOR_CHARCO[l];
    }
  }
}

/**
 * Dónde termina abajo la pared de adelante de un vagón (su pie, en el mundo): el borde del mapa, o más abajo si el
 * vagón tiene una sola fila de pared abajo (la misma cuenta que `yAbajo` en world/estiloNuevo/vagones.js).
 */
function pieDelVagon(map, w) {
  const S = map.size, medio = w.colStart + Math.floor(Math.round(w.width / S) / 2);
  const pared = (f) => { const t = (map.grid[f] || [])[medio]; return t === '#' || t === 'W'; };
  let fb = 0; while (fb < map.rows && pared(map.rows - 1 - fb)) fb++;
  return map.rows * S + Math.max(0, 2 - fb) * S;
}

/**
 * 🌗 LA SOMBRA DEL TREN, DEL LADO DE ACÁ *(Santi: "si la luz viene de arriba la sombra no debería proyectarse abajo
 * del tren?")*. 🔁 Iba del lado de allá, y eso contradecía la luz de adentro: el sol que entra por los ventanales del
 * fondo cae en diagonal hacia la pantalla, así que viene de allá y de arriba, y la sombra del tren cae de este lado,
 * corrida hacia la izquierda con la misma inclinación que esa luz (medio punto por punto que baja). Se asoma por
 * debajo de la pared de adelante: la parte de más oscura, pegada al tren, y una más clara en la punta. Se estira con
 * el sol (`sol`, de 1 a 0), como siempre. Por escalones, sobre la misma tierra (nada transparente).
 */
export function sombraDelSuelo(ctx, train, camX, camY, ancho, alto, desfile, sol, corr = () => 0) {
  const c = CONFIG.techo.sensacion.sombra, map = train.map;
  const largo = c.largo * (1 + c.estiraAlAtardecer * (1 - sol));
  const desde = map.rows * map.size;
  for (const [luz, d0, d1] of [[-1, largo * 0.6, largo], [-2, -Infinity, largo * 0.6]]) {
    ctx.save();
    ctx.beginPath();
    let hay = false;
    for (const w of train.wagons) {
      if (w.x - camX > ancho || w.x + w.width - camX < -largo) continue;
      const pie = pieDelVagon(map, w);
      /**
       * 🐛 Corrida con su vagón *(Santi: "cuidado con la sombra: no va parejo al movimiento del tren")*: con los
       * enganches cada vagón se dibuja corrido de su lugar (`corrDibujo`, raidScene.js), y la sombra se quedaba quieta
       * en el lugar de siempre mientras el vagón iba y venía encima. Y desde el mismo punto de la grilla que su dibujo.
       */
      const dx = corr(w.x + w.width / 2);
      const xa = Math.floor(w.x / PASO) * PASO + dx, xb = xa + Math.round(w.width / PASO) * PASO;
      for (let y = Math.round(desde / PASO) * PASO; y < pie + d1; y += PASO) {
        const d = y - pie;
        if (d < d0) continue;
        const corre = Math.round(Math.max(0, d) * 0.5 / PASO) * PASO;
        ctx.rect(xa - corre - camX, y - camY, xb - xa, PASO);
        hay = true;
      }
    }
    if (hay) {
      ctx.clip();
      dibujarSueloDeAfuera(ctx, camX, camY, ancho, alto, desfile, false, luz);
    }
    ctx.restore();
  }
}
