/**
 * 🏚️ EL PUEBLO NUEVO: EL PLANO.
 *
 * *(Santi: "a ambos lados de la calle hayan casas y lugares y añadir dos o tres caminos secundarios en forma vertical", "algo
 * desolado en la frontera, no que haya pasado una peste")*. Una calle principal, tres caminos que la cruzan y una calle de atrás.
 *
 * Por ahora son BLOQUES, para caminarlo y corregir las distancias antes de dibujar nada.
 *
 * LAS MEDIDAS DE CADA EDIFICIO, en esta cámara: `x` es el medio; `frente`, la línea del piso donde está la puerta. Para atrás mide
 * `fondo` y para arriba `alto`, así que el techo empieza en frente - fondo - alto. 🔁 Ese techo TAPA un pedazo de lo que tiene atrás
 * *(Santi: "el techo de algunos lugares deberían tapar un poco la calle que tiene detrás, es una cuestión de perspectiva")*.
 *
 * `puertas`: dónde están, desde el medio (por defecto una sola, en el medio). `atras`: las de la parte de atrás, que se usan desde
 * el otro lado *(Santi: "Hay lugares que deberían tener más de una puerta como la cantina y el comedor")*.
 *
 * Los espacios angostos entre edificios son a propósito: *(Santi: "generan callejones que serán importantes en la historia")*.
 *
 * `tipo`: 'tienda' (se entra), 'casa' (gente que vive ahí) o 'lugar' (cosas para la historia, más adelante).
 */

export const PLANO = {
  ancho: 1100,
  alto: 430,
  calle: { y1: 205, y2: 268 },
  // 🔁 Angosta: es una calle secundaria *(Santi: "La calle de más abajo es demasiado ancha")*.
  calleAtras: { y1: 332, y2: 358 },
  caminos: [
    { x1: 374, x2: 410, y1: 110, y2: 358 },
    // 🔁 La de la iglesia, más ancha y con sus árboles *(Santi: "debería ser más protagonista [...] que termine en una calle secundaria
    // pero que esa calle sea un poquito más ancha")*.
    { x1: 600, x2: 656, y1: 100, y2: 205, principal: true },
    { x1: 610, x2: 646, y1: 268, y2: 358 },
    { x1: 896, x2: 932, y1: 110, y2: 358 },
  ],
  caballo: { x: 60, y: 236 },
};

const FILA_ARRIBA = 205, FONDO = 36;
const arriba = (id, x, ancho, alto, tipo, nombre, frase, extra) => ({ id, x, ancho, alto, tipo, nombre, frase, frente: FILA_ARRIBA, fondo: FONDO, ...extra });
const FILA_ABAJO = 330;
const abajo = (id, x, ancho, tipo, nombre, frase, extra) => ({ id, x, ancho, alto: 32, tipo, nombre, frase, frente: FILA_ABAJO, fondo: 40, ...extra });
const suelta = (id, x, frente, ancho, alto, tipo, nombre, frase, extra) => ({ id, x, ancho, alto, tipo, nombre, frase, frente, fondo: 30, ...extra });

export const EDIFICIOS = [
  // ── La calle principal, del lado de arriba: lo que más se usa.
  arriba('establo', 153, 86, 34, 'tienda', 'ESTABLO'),
  arriba('armeria', 249, 78, 40, 'tienda', 'ARMERÍA'),
  arriba('almacen', 331, 62, 34, 'lugar', 'ALMACÉN', 'Estantes con poco y un cartel: "No se fía".'),
  arriba('cantina', 468, 96, 44, 'tienda', 'CANTINA', undefined, { puertas: [-26, 26], atras: [0] }),
  arriba('casa1', 560, 60, 30, 'casa', 'CASA', 'Una cortina se mueve y vuelve a su lugar.'),
  arriba('funeraria', 694, 60, 36, 'lugar', 'CARPINTERO', 'Hace muebles y cajones. Más cajones que muebles.'),
  arriba('sheriff', 777, 74, 36, 'tienda', 'SHERIFF'),
  arriba('perista', 857, 58, 28, 'tienda', 'EMPEÑOS'),
  arriba('casaVacia', 974, 64, 30, 'lugar', 'CASA ABANDONADA', 'La puerta está clavada con dos tablas.'),

  // ── Del lado de abajo: se ve el techo, y la puerta da a la calle de atrás.
  abajo('comedor', 170, 80, 'lugar', 'COMEDOR', 'Huele a guiso aguado.', { puertas: [-20, 20], atras: [0] }),
  abajo('casa2', 270, 70, 'casa', 'CASA', 'Alguien tose adentro.'),
  abajo('telegrafo', 455, 70, 'lugar', 'TELÉGRAFO', 'La línea anda cuando quiere.'),
  // 🔁 *(Santi: "el banco lo eliminaría o pondría el banco pero clausurado")*.
  abajo('banco', 704, 78, 'lugar', 'BANCO CLAUSURADO', 'Tablas clavadas en la puerta. Hace años que no hay nada que guardar.'),
  abajo('casa7', 973, 74, 'casa', 'CASA', 'Un perro te ladra desde adentro.'),

  // ── 🪢 La horca, a la vista de todos y enfrente del sheriff *(Santi: "un lugar público dónde cuelgan a los criminales")*.
  { id: 'horca', x: 820, ancho: 40, alto: 38, tipo: 'lugar', nombre: 'HORCA', frente: 312, fondo: 10, sinPuerta: true },

  // ── La iglesia, al final de su calle.
  suelta('iglesia', 628, 100, 96, 56, 'lugar', 'IGLESIA', 'El campanario está, la campana no.'),

  // ── Las pocas casas pobres que quedan lejos de la calle.
  suelta('pobre1', 500, 100, 64, 26, 'casa', 'CASA POBRE', 'Hay un banquito afuera, gastado de tanto usarlo.'),
  suelta('pobre2', 790, 100, 50, 26, 'casa', 'CASA POBRE', 'Abandonada hace rato.'),
  suelta('pobre3', 300, 404, 60, 24, 'casa', 'CASA POBRE', 'Una mujer te mira y entra.'),
  suelta('pobre4', 820, 404, 60, 24, 'casa', 'CASA POBRE', 'El viento hace sonar una chapa suelta.'),
];

/** Los cercos (x1, y1, x2, y2), con sus tranqueras abiertas. */
export const CERCOS = [
  // El cementerio, al final del primer camino.
  [318, 30, 418, 34], [318, 30, 322, 100], [414, 30, 418, 100], [318, 96, 382, 100], [402, 96, 418, 100],
  // El corral, al final del tercero.
  [866, 40, 962, 44], [866, 40, 870, 100], [958, 40, 962, 100], [866, 96, 904, 100], [924, 96, 962, 100],
  // 🎯 El patio de atrás de la armería: se entra por el callejón de la izquierda.
  [204, 62, 294, 66], [204, 62, 208, 104], [290, 62, 294, 134],
];

/** Los lugares al aire libre. */
export const SITIOS = [
  { id: 'cementerio', x: 392, y: 112, frase: 'Cruces de madera, algunas ya caídas. Nadie viene a arreglarlas.', nombre: 'CEMENTERIO', zona: [322, 34, 414, 96] },
  { id: 'corral', x: 914, y: 112, frase: 'Un corral grande para tan pocos animales.', nombre: 'CORRAL', zona: [870, 44, 958, 96] },
  // *(Santi: "detrás de la armería pondría un pequeño espacio al aire libre dónde el vendedor dejará al jugador que pruebe las armas")*.
  { id: 'tiro', x: 249, y: 104, frase: 'Unas botellas sobre un tablón. Acá el armero te deja probar lo que vende.', nombre: 'PATIO DE TIRO', zona: [208, 66, 290, 130] },
  { id: 'horca', x: 820, y: 262, frase: 'Madera vieja y una soga nueva.', nombre: 'HORCA', zona: [760, 272, 880, 328], sinRotulo: true },
];
export const POZO = { id: 'pozo', x: 690, y: 118, ancho: 26, fondo: 14, frase: 'El balde sale con barro y un poco de agua.', nombre: 'POZO' };

/** Los árboles flacos que acompañan la calle de la iglesia. */
export const ARBOLES = [[606, 130], [650, 130], [606, 165], [650, 165]];

/** Lo que no se puede atravesar. Con el pie un poco adentro del techo: desde atrás, la casa te tapa las piernas. */
export function solidos() {
  const lista = EDIFICIOS.map((e) => [e.x - e.ancho / 2, e.frente - e.fondo - e.alto + 12, e.x + e.ancho / 2, e.frente]);
  lista.push(...CERCOS);
  lista.push([POZO.x - POZO.ancho / 2, POZO.y - POZO.fondo, POZO.x + POZO.ancho / 2, POZO.y]);
  for (const [x, y] of ARBOLES) lista.push([x - 3, y - 2, x + 3, y]);
  return lista;
}
