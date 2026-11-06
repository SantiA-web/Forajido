/**
 * 🎨 ESTILO NUEVO · P3 — LA GENTE DEL TREN: GUARDIAS Y PASAJEROS.
 *
 * El mismo cuerpo que el jugador (27 puntos: cabeza 8, torso 9, piernas 10),
 * las mismas piernas y el mismo paso (las toma de jugador.js), y encima lo
 * suyo, dibujado a mano en cada vista: la cabeza (pelo y cara), el sombrero,
 * la barba y la ropa. Cada cosa es un mapa aparte y se apilan, así las
 * variantes se combinan sin dibujar cada combinación *(Santi: "variables que
 * harían que los personajes sean más únicos: barba, sombrero, ropa, color de
 * cabello y formas mínimas de cuerpo… para añadir más realismo y humanidad")*.
 *
 * PASO 1 (hoja de prueba): el guardia y el pasajero base en las 5 vistas, y
 * algunas variantes de frente y en diagonal de frente para ver si se
 * distinguen. Todavía no se usa en el juego.
 *
 * Los mapas usan las letras de colores del jugador (ver C en jugador.js) más
 * tres nuevas: `A` y `a` el pelo (base y sombra) y `E` la estrella. Cada
 * personaje cambia qué color es cada letra (ver COLORES), y una letra puesta
 * en null no se dibuja (así el pasajero no lleva funda).
 */
import { iluminar } from '../../engine/luz.js';
import { sombrear, RGB } from '../../engine/paleta.js';
import { C, ANCHO, ALTO, OX, OY, PARTE, cuadroJugador, armaEn, linea, bordeBrazos, montado, bordeSilla, puntosDeSilla, RIENDAS_SUELTAS } from './jugador.js';

const mapa = (y, filas) => ({ y, filas });

// ------------------------------------------------------------------ cabezas
/**
 * LA CABEZA SIN SOMBRERO, con el pelo CORTO: la cara (3 filas, de la 4 a la
 * 6) y el cuello. De frente se ve la cara entera con el pelo en las sienes;
 * de costado, la nuca con pelo y la nariz adelante; de espaldas, todo pelo.
 */
const CABEZA = {
  frente: mapa(2, [
    '.........aAa',
    '........aAAAa',
    '........apppa',
    '........pPPPp',
    '........qpPpq',
    '.........qpq',
  ]),
  diagF: mapa(2, [
    '..........aAa',
    '.........aAAAa',
    '........aappp',
    '........apPPPp',
    '.........qpPPq',
    '..........qpq',
  ]),
  lado: mapa(2, [
    '.........aAa',
    '........aAAAA',
    '........aappp',
    '........aaPPPn',
    '.........apPq',
    '.........qpq',
  ]),
  diagE: mapa(2, [
    '.........aAa',
    '........aAAAa',
    '........aAAAp',
    '........aAAap',
    '.........ppp',
    '.........ppp',
  ]),
  espalda: mapa(2, [
    '.........aAa',
    '........aAAAa',
    '........aAAAa',
    '........aAAAa',
    '.........ppp',
    '.........ppp',
  ]),
};

/**
 * OTROS PEINADOS (sin sombrero se ven): `costado` peinado al costado, con la
 * raya; `pelado` sin pelo arriba, sólo en las sienes. Por ahora de frente y
 * en diagonal de frente (hoja de prueba).
 */
const PEINADOS = {
  // 🔁 Al costado: más alto y con volumen hacia un lado, la raya marcada (se
  // distingue por la silueta) *(Santi: "los cortes de pelo no se distinguen")*.
  costado: {
    frente: mapa(1, ['..........AAa', '........aAAAAA', '.......aAAaAAAa', '.......a.....a']),
    diagF: mapa(1, ['...........AAa', '.........aAAAAA', '........aAAaAAAa', '........a......']),
    lado: mapa(1, ['.........AAa', '.......aAAAAA', '.......aAAAAAA', '.......aa']),
    diagE: mapa(1, ['.........aAA', '.......aAAAAA', '.......aAAAAAa', '.......aa....a']),
    espalda: mapa(1, ['.........aAA', '.......aAAAAAa', '.......aAAAAAa', '.......aa...aa']),
  },
  // Corto: pegado a la cabeza, se ven las sienes.
  corto: {
    frente: mapa(2, ['.........aAa', '........aAAAa', '........ppppp']),
    diagF: mapa(2, ['..........aAa', '.........aAAAa', '........apppp']),
    lado: mapa(2, ['.........aAa', '........aAAAa', '........appp']),
    diagE: mapa(2, ['.........aAa', '........aAAAa', '........aAAAp']),
    espalda: mapa(2, ['.........aAa', '........aAAAa', '........aAAAa']),
  },
  // Pelado: arriba la piel, el pelo sólo en las sienes y la nuca.
  pelado: {
    frente: mapa(2, ['.........pPp', '........pPPPp']),
    diagF: mapa(2, ['..........pPp', '.........pPPPp']),
    lado: mapa(2, ['.........pPp', '........aPPPp']),
    diagE: mapa(2, ['.........pPp', '........pPPPp', '........aAAAp']),
    espalda: mapa(2, ['.........pPp', '........pPPPp', '........aAAAa']),
  },
};
/**
 * LAS BARBAS, sobre la cara (`B`, del color del pelo, un poco más oscuro):
 * bigote, candado (bigote y barbilla), patillas, completa corta. Afeitado es
 * no dibujar nada. Por ahora de frente y en diagonal de frente.
 */
const BARBAS = {
  bigote: { frente: mapa(5, ['.........BBB']), diagF: mapa(5, ['..........BBB']) },
  candado: { frente: mapa(5, ['.........BBB', '..........B']), diagF: mapa(5, ['..........BBB', '...........B']) },
  patillas: { frente: mapa(4, ['........B...B', '........B...B']), diagF: mapa(4, ['.........B', '.........B']) },
  completa: { frente: mapa(4, ['........B...B', '........BBBBB', '.........BBB']), diagF: mapa(4, ['.........B', '.........BBBB', '..........BBB']) },
};

/**
 * 🧪 LAS BARBAS CON PUNTOS MÁS CHICOS (prueba) *(Santi: "las barbas no se
 * distinguen casi nada y pensé que para los detalles de la cara podrías usar
 * pixeles de 2x2 o 1x1")*. Van encima de la cara después de la grilla, como el
 * borde fino. `origen` es el punto de arriba a la izquierda de la cara (de
 * frente, la columna 8 de la fila 4); cada letra es un punto de pantalla (1×1)
 * o un cuadrado de 2×2. `B` la barba, `b` su sombra (más oscura).
 */
export const BARBAS_FINAS = {
  // 🆕 P3b · B2: de costado (con la cabeza ya corrida un punto atrás: la oreja y el
  // pelo en 7-8, la cara en 9-11, la nariz en 12) y en diagonal de espaldas (sólo
  // asoma el borde de la mejilla). De espaldas no se ven.
  origen: { frente: [8, 4], diagF: [9, 4], lado: [7, 4], diagE: [11, 4] },
  // De a 1×1: la cara de frente mide 15 × 9.
  1: {
    bigote: {
      frente: ['...............', '...............', '...............', '...............', '.....BBBBB.....', '....BBbbbBB....', '....B.....B....'],
      diagF: ['...............', '...............', '...............', '...............', '........BBBBB..', '.......BBbbbB..', '.......B....B..'],
      lado: ['..................', '..................', '..................', '..................', '..................', '..................', '...........BBBB...', '...........BbB....', '...........B......'],
      diagE: ['......', '......', '......', '......', '......', '.....B', '....BB', '....B.'],
    },
    candado: {
      frente: ['...............', '...............', '...............', '...............', '.....BBBBB.....', '....BBbbbBB....', '....B.....B....', '......BbB......', '.......B.......'],
      diagF: ['...............', '...............', '...............', '...............', '........BBBBB..', '.......BBbbbB..', '.......B....B..', '.........BbB...', '..........B....'],
      lado: ['..................', '..................', '..................', '..................', '..................', '..................', '...........BBBB...', '...........BbB.B..', '............BBB...'],
      diagE: ['......', '......', '......', '......', '......', '.....B', '....BB', '....B.', '.....B'],
    },
    patillas: {
      // 🔁 Grandes, como las de San Martín *(Santi)*: anchas, de la sien hasta la
      // línea de la boca, más gruesas abajo y redondeadas, sin barbilla.
      frente: ['BB...........BB', 'BBB.........BBB', 'BBB.........BBB', 'BbBB.......BBbB', 'BbBB.......BBbB', 'BbBBB.....BBBbB', 'BBbBB.....BBbBB', '.BBB.......BBB.'],
      diagF: ['.BB............', '.BBB...........', '.BBB...........', '.BbBB..........', '.BbBB..........', '.BbBBB.........', '.BBbBB.........', '..BBB..........'],
      // De costado, delante de la oreja, de la sien a la línea de la boca.
      lado: ['.....BB...........', '.....BBB..........', '.....BBB..........', '.....BbBB.........', '.....BbBB.........', '.....BbBBB........', '.....BBbBB........', '......BBB.........'],
      diagE: ['...BB.', '...BBB', '...BBB', '...BbB', '...BbB', '...BBB', '....BB'],
    },
    completa: {
      // 🔁 De pocos días: una sombra en la mandíbula un poco más oscura que la
      // piel (`X`, y `x` más oscura en la boca), no un bloque del color del pelo
      // *(Santi: "la barba de pocos días negra es tan contundente que parece que
      // tiene mucha barba")*. Cubre la barbilla y las comisuras.
      frente: ['...............', '...............', 'X.............X', 'X.............X', 'XX...........XX', 'XX..XXXXXXX..XX', 'XXX.XxxxxxX.XXX', '.XXXXXXXXXXXXX.', '..XXXXXXXXXXX..'],
      diagF: ['...............', '...............', '.X.............', '.X.............', '.XX............', '.XX...XXXXXX...', '.XXX..XxxxxX...', '..XXXXXXXXXXX..', '...XXXXXXXXX...'],
      // De costado, la mandíbula de la oreja a la barbilla, y la boca.
      lado: ['..................', '..................', '..................', '......X...........', '......XX..........', '......XXX.........', '......XXXX.XXXX...', '.......XXXXXxxX...', '........XXXXXXX...'],
      diagE: ['......', '......', '.....X', '....XX', '....XX', '...XXX', '..XXX.', '.XXX..'],
    },
    /**
     * 🆕 LARGA, QUE TAPA EL CUELLO *(Santi: "con una probabilidad de 5: barba larga, que
     * tapa el cuello. Más común en gente con canas")*: de las patillas a la barbilla,
     * con el bigote y la boca adentro, y cae en punta sobre el cuello y el pecho
     * (6 puntos finos más abajo que la cara: pasa por encima del pañuelo y de la
     * camisa). Las `b`, mechones más oscuros.
     */
    larga: {
      frente: ['BB...........BB', 'BB...........BB', 'BBB.........BBB', 'BBB.........BBB', 'BBBB.BBBBB.BBBB', 'BBBBBBbbbBBBBBB', 'BBBBBB...BBBBBB', '.BBBBBBBBBBBBB.', '.BBBBBBBBBBBBB.', '..BBBBBBBBBBB..', '..BBBBBBBBBBB..', '...BBBBBBBBB...', '....BBBBBBB....', '.....BBBBB.....', '......BBB......'],
      diagF: ['.BB............', '.BB............', '.BBB...........', '.BBB...........', '.BBBB..BBBBB...', '.BBBBBBBbbbBB..', '.BBBBBBB...BB..', '..BBBBBBBBBBB..', '..BBBBBBBBBBB..', '...BBBBBBBBB...', '...BBBBBBBBB...', '....BBBBBBB....', '.....BBBBB.....', '......BBB......', '.......B.......'],
      lado: ['.....BB...........', '.....BBB..........', '.....BBB..........', '.....BBBB.........', '.....BBBBB........', '.....BBBBBB.......', '.....BBBBBBBBBBB..', '......BBBBBBBbB...', '......BBBBBBBBBB..', '.......BBBBBBBBB..', '.......BBBBBBBB...', '........BBBBBBB...', '.........BBBBB....', '..........BBB.....', '...........B......'],
      diagE: ['...BB.', '...BBB', '...BBB', '...BBB', '..BBBB', '..BBBB', '.BBBBB', '.BBBB.', '.BBBB.', '..BBB.', '..BB..', '..B...'],
    },
  },
  // De a 2×2: la cara de frente mide 7 × 4 cuadrados (y medio).
  2: {
    bigote: {
      frente: ['.......', '.......', '..BbB..', '.B...B.'],
      diagF: ['.......', '.......', '....BbB', '...B..B'],
    },
    candado: {
      frente: ['.......', '.......', '..BbB..', '.B...B.', '...B...'],
      diagF: ['.......', '.......', '....BbB', '...B..B', '.....B.'],
    },
    patillas: {
      frente: ['B.....B', 'B.....B', 'b.....b'],
      diagF: ['B......', 'B......', 'b......'],
    },
    completa: {
      frente: ['B.....B', 'B.....B', 'BbBbBbB', '.BbbbB.', '..BBB..'],
      diagF: ['B......', 'B......', 'BbBBbBb', '.BbbbB.', '..BBBB.'],
    },
  },
};

// ------------------------------------------------------------------ sombreros
/**
 * LOS SOMBREROS, de la fila 0 a la 3 (tapan el pelo de arriba). `h H k` el
 * fieltro o la paja de la luz a la sombra, `x` la punta del ala en sombra,
 * `b` la cinta.
 *  plano  el del guardia: copa baja y ala ancha y derecha, que deja ver la cara.
 *  bombin el del pasajero: copa redonda y ala corta.
 */
const SOMBREROS = {
  plano: {
    frente: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
    diagF: mapa(0, ['.........hHHHk', '.........bbbbb', '....hhhhHHHHHHHkkkk', '.....xkkkkkkkkkkkx']),
    lado: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
    diagE: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
    espalda: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
  },
  // 🔁 El otro del guardia, el de Arthur Morgan sin la soga *(Santi: "la foto de
  // Arthur Morgan es el sombrero que quiero para los guardias (el curvo), pero
  // sin la piola. Hoy el sombrero parece más unos cuernitos de toro")*: copa más
  // alta con el pliegue arriba, ala más ancha que sube en las puntas pegada al
  // ala (no sueltas, que parecían cuernos). De costado el ala cae adelante y atrás.
  /**
   * 🔁 Con las fotos de referencia de Santi *("el sombrero no tiene curva hacia
   * arriba, es un desastre")*: la copa con el pliegue de dos bultos y la cinta;
   * el ala con las dos puntas bien arriba a los costados y el centro de
   * adelante más abajo (el borde de abajo hace una U). Va dos puntos más arriba
   * (desde la fila -2) para que la caída del ala no tape la cara.
   */
  curvo: {
    // 🔁 Dos puntos más angosto *(Santi: "reduce el tamaño unos 2 o 3 pixeles")*,
    // y la copa un punto más chata y pareja arriba, sin las dos montañitas del
    // pliegue *("elimina unos 2 o 3 pixeles de la copa para que quede más chata")*.
    frente: mapa(-1, ['........hHHHk', '.....hh.hHHHk.kk', '.....hhhbbbbbkkk', '......hHHHHHHHk', '.......xkkkkkx']),
    diagF: mapa(-1, ['.........hHHHk', '.....hh..hHHHk.kk', '.....hhhhbbbbbkkk', '......hhHHHHHHk', '.......xkkkkkx']),
    lado: mapa(-1, ['........hHHHk', '....h...hHHHk...k', '....hh..bbbbb..kk', '.....hhhHHHHHkkk', '......xkkkkkx']),
    diagE: mapa(-1, ['........hHHHk', '.....hh.hHHHk.kk', '.....hhhbbbbbkkk', '......hHHHHHHHk', '.......xkkkkkx']),
    espalda: mapa(-1, ['........hHHHk', '.....hh.hHHHk.kk', '.....hhhbbbbbkkk', '......hHHHHHHHk', '.......xkkkkkx']),
  },
  /**
   * 🆕 P4 · LA GALERA DEL RICO (primera clase): la copa alta y derecha, la cinta y el ala angosta.
   */
  galera: {
    frente: mapa(-3, ['........hHHHk', '........hHHHk', '........hHHHk', '........hHHHk', '........bbbbb', '......hhHHHHHkk', '.......xkkkkkx']),
    diagF: mapa(-3, ['.........hHHHk', '.........hHHHk', '.........hHHHk', '.........hHHHk', '.........bbbbb', '.......hhHHHHHkk', '........xkkkkkx']),
    lado: mapa(-3, ['........hHHHk', '........hHHHk', '........hHHHk', '........hHHHk', '........bbbbb', '......hhHHHHHkk', '.......xkkkkkx']),
    diagE: mapa(-3, ['........hHHHk', '........hHHHk', '........hHHHk', '........hHHHk', '........bbbbb', '......hhHHHHHkk', '.......xkkkkkx']),
    espalda: mapa(-3, ['........hHHHk', '........hHHHk', '........hHHHk', '........hHHHk', '........bbbbb', '......hhHHHHHkk', '.......xkkkkkx']),
  },
  // El de paja del civil: ala ancha que cae un poco en las puntas.
  paja: {
    frente: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    diagF: mapa(0, ['.........hHHHk', '.........bbbbb', '....hhhhHHHHHHHkkkk', '...xkkkkkkkkkkkkkkx']),
    lado: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    diagE: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    espalda: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
  },
  /** 🚂 LA GORRA DEL MAQUINISTA, a rayas, con la visera. */
  maquinista: {
    frente: mapa(0, ['.........hHhk', '........hHhHhk', '.......hHhHhHhk', '.......bbbbbbbb']),
    diagF: mapa(0, ['..........hHhk', '.........hHhHhk', '........hHhHhHk', '.......bbbbbbbbb']),
    lado: mapa(0, ['.........hHhk', '........hHhHhk', '.......hHhHhHk', '.......hHhHbbbbb']),
    diagE: mapa(0, ['.........hHhk', '........hHhHhk', '.......hHhHhHk', '.......hHhHhHk']),
    espalda: mapa(0, ['.........hHhk', '........hHhHhk', '.......hHhHhHhk', '.......hHhHhHhk']),
  },
  /** 🚂 EL PAÑUELO DEL FOGONERO, atado a la cabeza; atrás le cuelga la punta. */
  panuelo: {
    frente: mapa(1, ['.........hHHk', '........hHHHHk', '........bbbbb']),
    diagF: mapa(1, ['..........hHHk', '.........hHHHHk', '.........bbbbb']),
    lado: mapa(1, ['.........hHHk', '........hHHHHk', '........bbbbbb', '.......hb.....', '.......h......']),
    diagE: mapa(1, ['.........hHHk', '........hHHHHk', '.......hbbbbb', '.......h.....']),
    espalda: mapa(1, ['.........hHHk', '........hHHHHk', '........bbbbb', '..........hk..', '..........hk..']),
  },
  /** 🆕 EL GORRO DE TELA DEL DINAMITERO *(Santi eligió el minero)*: sin ala, blando y caído para un costado. */
  minero: {
    frente: mapa(0, ['..........hHk', '........hhHHHk', '.......hHHHHHHk', '.......bbbbbbbk']),
    diagF: mapa(0, ['...........hHk', '.........hhHHHk', '........hHHHHHHk', '........bbbbbbbk']),
    lado: mapa(0, ['..........hHk', '.......hhHHHHk', '......hHHHHHHk', '.......bbbbbbk']),
    diagE: mapa(0, ['.........hHk', '........hHHHkk', '.......hHHHHHHk', '.......bbbbbbbk']),
    espalda: mapa(0, ['.........hHk', '........hHHHkk', '.......hHHHHHHk', '.......bbbbbbbk']),
  },
  bombin: {
    frente: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
    diagF: mapa(0, ['..........hHk', '.........hHHHk', '.........bbbbb', '........hHHHHHk']),
    lado: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
    diagE: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
    espalda: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
  },
};

/**
 * EL PAÑUELO AL CUELLO de los civiles *(Santi: "la corbata debería quedar para
 * los civiles ricos. En cambio debería estar los pañuelos")*: anudado al
 * cuello (fila 7), con la punta del nudo sobre el pecho (en el torso). `S R r z`
 * de la luz a la sombra; el color lo pone cada uno.
 */
/**
 * 🆕 P3c · LA GORRA DEL ENCARGADO, la de plato *(Santi eligió la B)*: la copa un poco más ancha
 * arriba que abajo, la cinta con la chapa dorada adelante (`G`) y la visera (`x k`), que de
 * costado sale para adelante y de espaldas no se ve.
 */
SOMBREROS.gorra = {
  frente: mapa(-1, ['......hhhHHHkk', '......hhHHHHHk', '.......hHHHHk', '.......bbbGbb', '........xkkkx']),
  diagF: mapa(-1, ['.......hhhHHHkk', '.......hhHHHHHk', '........hHHHHk', '........bbbbGb', '..........xkkkk']),
  lado: mapa(-1, ['.......hhHHHHkk', '.......hhHHHHHk', '........hHHHHk', '........bbbbbG', '.............kkk']),
  diagE: mapa(-1, ['......hhhHHHkk', '......hhHHHHHk', '.......hHHHHk', '.......bbbbbb']),
  espalda: mapa(-1, ['......hhhHHHkk', '......hhHHHHHk', '.......hHHHHk', '.......bbbbbb']),
};

/**
 * 🆕 P3c · EL SOMBRERO DEL SHERIFF: la copa alta abollada arriba *(Santi eligió la D)* con su
 * estrella adelante (`E e`, la misma de la placa) *(Santi: "en el sombrero también lleva una
 * estrella")*, la cinta y el ala ancha. De espaldas, sin estrella.
 */
SOMBREROS.alto = {
  // 🔁 Sin la cinta y la estrella en el medio de la copa *(Santi: "la estrella del sombrero debería
  // estar en el medio del sombrero ... elimina la cuerda del sombrero")*: la cruz de los guardias.
  frente: mapa(-3, ['.........hHk', '........hHkHk', '........hHEHk', '........hEeEk', '........hHEHk', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
  diagF: mapa(-3, ['..........hHk', '.........hHkHk', '.........hHHEk', '.........hHEeE', '.........hHHEk', '....hhhhHHHHHHHkkkk', '.....xkkkkkkkkkkkx']),
  lado: mapa(-3, ['.........hHk', '........hHkHk', '........hHHHE', '........hHHEe', '........hHHHE', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
  diagE: mapa(-3, ['.........hHk', '........hHkHk', '........hHHHk', '........hHHHk', '........hHHHk', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
  espalda: mapa(-3, ['.........hHk', '........hHkHk', '........hHHHk', '........hHHHk', '........hHHHk', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
};

/**
 * 🆕 P3c · EL SOMBRERO DEL CAZARRECOMPENSAS *(Santi eligió la A de tres siluetas)*: el ala plana más
 * ancha del juego (21 puntos de punta a punta), la copa baja y abollada, y la cinta roja de la capa.
 */
SOMBREROS.ancho = {
  frente: mapa(-2, ['.........h.Hk', '........hHHHHk', '.......hbbbbbbk', 'hhhhhhhHHHHHHHkkkkkkk', '..xkkkkkkkkkkkkkkkx']),
  diagF: mapa(-2, ['..........h.Hk', '.........hHHHHk', '........hbbbbbbk', '.hhhhhhhHHHHHHHkkkkkkk', '...xkkkkkkkkkkkkkkkx']),
  lado: mapa(-2, ['.........h.Hk', '........hHHHHk', '.......hbbbbbbk', 'hhhhhhhHHHHHHHkkkkkkk', '..xkkkkkkkkkkkkkkkx']),
  diagE: mapa(-2, ['.........h.Hk', '........hHHHHk', '.......hbbbbbbk', 'hhhhhhhHHHHHHHkkkkkkk', '..xkkkkkkkkkkkkkkkx']),
  espalda: mapa(-2, ['.........h.Hk', '........hHHHHk', '.......hbbbbbbk', 'hhhhhhhHHHHHHHkkkkkkk', '..xkkkkkkkkkkkkkkkx']),
};

const PANUELO = {
  frente: mapa(7, ['.......zRRSRRr']),
  diagF: mapa(7, ['........zRRSRRr']),
  lado: mapa(7, ['.........rRRS']),
  diagE: mapa(7, ['........rRRSRRr']),
  espalda: mapa(7, ['.......rRRSRRr']),
};
// 🔁 Apagados *(Santi: "el amarillo del pañuelo de los civiles parece dorado. Los colores de los pañuelos deberían ser más apagados")*.
export const COLORES_PANUELO = {
  rojo: { S: 9, R: 8, r: 39, z: 0 },
  azul: { S: 19, R: 41, r: 18, z: 40 },
  ocre: { S: 6, R: 5, r: 4, z: 3 },
  verde: { S: 27, R: 26, r: 42, z: 0 },
  pardo: { S: 15, R: 14, r: 2, z: 1 },
};

// ------------------------------------------------------------------ torsos
/**
 * LOS TORSOS, de la fila 8 a la 16 (la 16 es el cinto). `L C c` la camisa,
 * `U V v w` el chaleco, `y` los botones, `E` la estrella, `R` la corbata.
 *  guardia  chaleco de la compañía abierto en V sobre la camisa, con la
 *           estrella del lado izquierdo del pecho (de frente, a la derecha de
 *           la pantalla).
 *  pasajero chaleco sobre la camisa y la corbata.
 */
const TORSOS = {
  guardia: {
    frente: mapa(8, ['.......CUCCCVc', '........UVCEv', '........UVEeE', '........UVyEv', '........UVVvv', '........VVyvv', '........VVVvw', '........VVyvw', '........WyGyW']),
    diagF: mapa(8, ['.......CUVCCvc', '........UUVCE', '........UVVEe', '........UVVyE', '........UVVvv', '........UVVyw', '........VVVvw', '........VVVyw', '........WyWGy']),
    // (🔁 De costado, la columna de adelante es el pecho, que asoma delante del brazo: limpia, del color del
    // chaleco a la sombra, con sólo la estrella de canto *(Santi eligió la B: "que quede apenas más centrado en
    // el cuerpo")*. Antes la tapaba el brazo y tenía la estrella y los botones apilados.) Y la punta del hombro (la
    // manga, arriba) un punto atrás, sobre el brazo: si no, el hombro salía del lugar de antes *(Santi)*.
    lado: mapa(8, ['.......UVVCv', '.......UVVvv', '.......UVVvv', '.......UVVvE', '.......UVVvv', '.......UVVvv', '.......VVVvw', '.......VVVvw', '.......WWyWG']),
    diagE: mapa(8, ['.......CVVVCvc', '........UVVcv', '........UVVVv', '........UVVvv', '........UVVvv', '........UVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
    espalda: mapa(8, ['.......CVVCVVc', '........UVcVv', '........UVVVv', '........UVVvv', '........UVVvv', '........VVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
  },
  pasajero: {
    frente: mapa(8, ['.......CURSrVc', '........UCRCv', '........UVyVv', '........UVVvv', '........UVyvv', '........VVVvv', '........VVyvw', '........VVVvw', '........WyGyW']),
    diagF: mapa(8, ['.......CUVRSrc', '........UUCRv', '........UVVyv', '........UVVvv', '........UVVyv', '........UVVvw', '........VVVyw', '........VVVvw', '........WyWGy']),
    // (🔁 El pecho de costado, limpio y sin botones, como el del guardia.)
    lado: mapa(8, ['.......UVVvR', '.......UVVvr', '.......UVVvv', '.......UVVvv', '.......UVVvv', '.......UVVvv', '.......VVVvw', '.......VVVvw', '.......WWyWG']),
    diagE: mapa(8, ['.......CVVVCvc', '........UVVcv', '........UVVVv', '........UVVvv', '........UVVvv', '........UVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
    espalda: mapa(8, ['.......CVVCVVc', '........UVcVv', '........UVVVv', '........UVVvv', '........UVVvv', '........VVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
  },
};

/**
 * 🆕 P3c · EL ENCARGADO DEL TREN: el torso del guardia, sin la estrella, con la correa de cuero
 * cruzada (`g`) y la cartera colgando de la cadera del lado contrario a la funda (`J M m Y`: la
 * tapa a la luz, el cuero, la sombra y la hebilla). De costado la cartera queda detrás de la cadera;
 * de espaldas, del otro lado. Los colores (el saco azul marino de botones dorados) en BASE.
 */
const CARTERA_ENCARGADO = {
  frente: { correa: [[8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [12, 14]], x: 13, y: 15, filas: ['JJJM', 'MYMm', 'MMMm', 'mmmm'] },
  diagF: { correa: [[9, 9], [10, 10], [11, 11], [12, 12], [12, 13], [13, 14]], x: 13, y: 15, filas: ['JJJM', 'MYMm', 'MMMm', 'mmmm'] },
  lado: { correa: [[10, 8], [9, 9], [9, 10], [8, 11], [8, 12], [7, 13]], x: 5, y: 14, filas: ['JJM', 'MYm', 'MMm', 'mmm'] },
  diagE: { correa: [[12, 9], [11, 10], [10, 11], [9, 12], [9, 13], [8, 14]], x: 4, y: 15, filas: ['JJJM', 'MYMm', 'MMMm', 'mmmm'] },
  espalda: { correa: [[12, 9], [11, 10], [10, 11], [9, 12], [9, 13], [8, 14]], x: 4, y: 15, filas: ['JJJM', 'MYMm', 'MMMm', 'mmmm'] },
};
function torsoEncargado(vista) {
  const t = TORSOS.guardia[vista], K = CARTERA_ENCARGADO[vista];
  const alto = Math.max(t.filas.length, K.y + K.filas.length - t.y);
  // (El cinto, la última fila del torso, con los remaches oscuros: con los botones dorados era un bloque dorado.)
  // (De costado, en el lugar de la estrella, un botón dorado: es lo único que asoma en el pecho.)
  const g = Array.from({ length: alto }, (_, j) => (t.filas[j] || '').replace(/[Ee]/g, vista === 'lado' ? 'y' : 'V').replace(/y/g, (c) => (j === t.filas.length - 1 ? 'W' : c)).padEnd(18, '.').split(''));
  for (const [x, y] of K.correa) if (g[y - t.y] && g[y - t.y][x] !== '.') g[y - t.y][x] = 'g';
  K.filas.forEach((fila, j) => { for (let x = 0; x < fila.length; x++) g[K.y + j - t.y][K.x + x] = fila[x]; });
  return { y: t.y, filas: g.map((f) => f.join('').replace(/\.+$/, '')) };
}
/**
 * 🆕 P3c · EL GUARDIA BLINDADO *(Santi eligió la B: peto y espaldar)*: el uniforme del guardia con
 * la placa de acero sobre el pecho y la espalda (`1 2 3 4`: luz, base, sombra, borde; con letras
 * se mezclaba con el pelo), un punto más
 * ancha que el chaleco a cada lado (de frente la tapan los brazos; de costado se ve más grueso,
 * adelante y atrás, con las correas del chaleco entre las dos placas). La estrella de la compañía,
 * encima de la placa. [desde la columna, filas desde la 9] por vista.
 */
const PLACA_BLINDADO = {
  frente: [7, ['.112223.', '11222234', '12222234', '12222234', '22222334', '.444444.']],
  diagF: [7, ['.112223.', '11222234', '12222234', '12222234', '22222334', '.444444.']],
  lado: [6, ['.2VV12.', '42VV123', '42VV123', '42VV123', '42VV233', '.4VV44.']],
  diagE: [7, ['.112223.', '11222234', '12222234', '12222234', '22222334', '.444444.']],
  espalda: [7, ['.112223.', '11222234', '12222234', '12222234', '22222334', '.444444.']],
};
function torsoBlindado(vista) {
  const t = TORSOS.guardia[vista], [x0, filas] = PLACA_BLINDADO[vista];
  const g = t.filas.map((f) => f.padEnd(18, '.').split(''));
  filas.forEach((fila, j) => {
    const r = g[9 + j - t.y];
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.' && !'Ee'.includes(r[x0 + x])) r[x0 + x] = fila[x];
  });
  return { y: t.y, filas: g.map((f) => f.join('').replace(/\.+$/, '')) };
}
/**
 * 🆕 P3c · EL PISTOLERO: un pistolero a sueldo, no de la compañía: el cuerpo del civil (chaleco,
 * camisa y el pañuelo anudado), dos fundas (ver SEGUNDA_FUNDA en jugador.js) y sus colores
 * (BASE.pistolero, de negro).
 */
TORSOS.pistolero = TORSOS.pasajero;
/**
 * 🆕 P3c · EL SHERIFF (jefe, siempre el mismo): el cuerpo del civil con el pañuelo, el saco largo
 * cerrado y la **estrella grande** en el pecho *(Santi: "misma estrella que los guardias, pero más
 * grande")*. El saco es continuo, cerrado hasta la rodilla y del ancho del cuerpo, que es el normal
 * *(Santi: "el Sheriff quiero que tenga cuerpo normal, olvidate del cuerpo de hombros anchos")*.
 * [columna, filas desde la 17] por vista.
 */
const ESTRELLA_SHERIFF = {
  // 🔁 Una estrella de cinco puntas de verdad (5×4): la cruz agrandada quedaba fea *(Santi)*.
  frente: [8, 9, ['..E..', 'EEeEE', '.EeE.', '.E.E.']],
  diagF: [9, 9, ['..E..', 'EEeEE', '.EeE.', '.E.E.']],
  // (🔁 De costado, de canto: dos puntos en el pecho que asoma delante del brazo; los tres apilados eran
  // una raya dorada.)
  lado: [11, 11, ['E', 'e']],
};
// 🔁 Continuo *(Santi: "parece que tiene unos muslos enormes. El saco debería ser continuo")*: cerrado
// hasta abajo, con la raya oscura donde se juntan los dos lados.
const FALDON_SHERIFF = {
  // 🔁 Cerrado y del ancho del cuerpo, entre las manos *(Santi: "debería ser más angosto el saco,
  // ahora parece una heladera. El Sheriff quiero que tenga cuerpo normal")*.
  frente: [7, ['UVVVwvw', 'UVVVwvw', 'UVVVwvw', 'vvvvwww']],
  diagF: [7, ['UVVVwvw', 'UVVVwvw', 'UVVVwvw', 'vvvvwww']],
  lado: [7, ['UVVvw', 'UVVvw', 'UVVvw', 'vvvww']],   // (alineado con la espalda: un punto más atrás parecían glúteos)
  diagE: [7, ['UVVVVvw', 'UVVVVvw', 'UVVwVvw', 'vvvwvww']],
  espalda: [7, ['UVVVVvw', 'UVVVVvw', 'UVVwVvw', 'vvvwvww']],
};
/**
 * 🔁 El saco cuelga recto *(Santi: "no se tiene que ver ni un solo pixel de espacio entre las
 * costillas y el brazo")*: del pecho al cinto, el torso va siempre del ancho del faldón, esté donde
 * esté el brazo (apuntando, el faldón quedaba como un escalón). Va sobre el cuadro terminado porque
 * los brazos se acomodan recién en `darForma`. (Con el cuerpo normal ya no queda aire entre el
 * brazo y las costillas; el relleno de huecos chicos que había para los hombros anchos llenaba de
 * saco el lugar entre el cuerpo y el rifle: *(Santi: "hay un cuadrado ... que no pinta nada")*.)
 */
function sacoSinHuecos(idx, vista, corre = false, B = BASE.sheriff, letras = ['U', 'V', 'v', 'w']) {
  const out = idx.slice(), A = 44;
  // (Todo se mide desde el cinto de cada cuadro: corriendo, el cuerpo sube y baja hasta 2 puntos.)
  let cinto = 16 + 6;
  for (let y = 12 + 6; y <= 20 + 6; y++) { let n = 0; for (let x = 0; x < A; x++) if (out[y * A + x] === B.W) n++; if (n >= 2) { cinto = y; break; } }
  // (🆕 La tela: el guardapolvo del Sheriff, `U V v w`; el saco del rico, `L C c`.)
  const tela = new Set(letras.map((l) => B[l])), yF = cinto + 1;
  let a = A, b = -1;
  for (let x = 0; x < A; x++) if (tela.has(out[yF * A + x])) { a = Math.min(a, x); b = Math.max(b, x); }
  if (vista !== 'lado') for (let y = cinto - 5; y < yF; y++) for (let x = a; x <= b; x++) if (out[y * A + x] < 0) out[y * A + x] = x < (a + b) / 2 ? B[letras[0]] : B[letras[2]];
  faldonSigueLasPiernas(out, tela, corre, vista, cinto);
  // (Un punto vacío encerrado entre la mano y el saco salía como un agujero negro: se tapa con lo de al lado.)
  for (let y = cinto - 8; y <= cinto + 4; y++) for (let x = 1; x < A - 1; x++) {
    const k = y * A + x;
    if (out[k] >= 0) continue;
    const v = [out[k - 1], out[k + 1], out[k - A], out[k + A]].filter((c) => c >= 0);
    if (v.length >= 3) out[k] = v.find((c) => tela.has(c)) ?? v[0];
  }
  return out;
}
/**
 * 🆕 El faldón se abre con el paso *(Santi: "cuando la pierna va hacia atrás, podrías hacer que se
 * mueva la parte baja del saco?")*: si debajo del saco una pierna sale más allá del borde (atrás o
 * adelante), el borde de abajo se corre hacia ese lado, hasta 2 puntos, más abajo que arriba (la tela
 * se abre desde la cadera). Vale para todas las vistas y todos los pasos.
 */
function faldonSigueLasPiernas(out, tela, corre, vista, cinto) {
  // 🔁 Corriendo, mucho más *(Santi: "al correr, que es dónde más se debería marcar el movimiento de
  // la gabardina, no lo marca")*: hasta 4 puntos, la pierna más abajo (la zancada ya se abrió) y, de
  // costado, la cola vuela siempre para atrás aunque la pierna esté adelante.
  const tope = corre ? 4 : 2;
  // (Corriendo se abre desde el cinto: la diagonal es pareja, sin escalones.)
  const A = 44, y0 = corre ? cinto : cinto + 1, yAbajo = cinto + 4, yPierna = yAbajo + (corre ? 3 : 2);
  let a = A, b = -1;
  for (let x = 0; x < A; x++) if (tela.has(out[yAbajo * A + x])) { a = Math.min(a, x); b = Math.max(b, x); }
  if (b < 0) return;
  // La pierna un punto debajo del saco (justo debajo todavía no se separó): lo que sigue pegado a lo que está debajo.
  let la = A, lb = -1;
  for (let x = a; x <= b; x++) if (out[yPierna * A + x] >= 0) { la = Math.min(la, x); lb = Math.max(lb, x); }
  if (lb < 0) { la = a; lb = b; }   // (con las piernas muy abiertas no hay nada justo debajo: igual vuela la cola)
  while (la > 0 && out[yPierna * A + la - 1] >= 0) la--;
  while (lb < A - 1 && out[yPierna * A + lb + 1] >= 0) lb++;
  let izq = Math.min(tope, Math.max(0, a - la));
  const der = Math.min(tope, Math.max(0, lb - b));
  if (corre && vista === 'lado') izq = Math.max(izq, 3);
  const filas = yAbajo - y0;
  for (let k = 1; k <= filas; k++) {
    const y = y0 + k, r = y * A;
    let ra = A, rb = -1;
    for (let x = 0; x < A; x++) if (tela.has(out[r + x])) { ra = Math.min(ra, x); rb = Math.max(rb, x); }
    if (rb < 0) continue;
    const di = Math.round(izq * k / filas), dd = Math.round(der * k / filas);
    for (let x = ra - di; x < ra; x++) if (x >= 0) out[r + x] = out[r + ra];
    for (let x = rb + 1; x <= rb + dd; x++) if (x < A) out[r + x] = out[r + rb];
  }
}
function torsoSheriff(vista) {
  const t = TORSOS.pasajero[vista];
  // (El cinto con los remaches oscuros, como el Encargado: con los botones dorados era un bloque dorado.)
  const g = Array.from({ length: 13 }, (_, j) => (t.filas[j] || '').replace(/y/g, (c) => (j === t.filas.length - 1 ? 'W' : c)).padEnd(18, '.').split(''));
  const E = ESTRELLA_SHERIFF[vista];
  // (Sin los botones al lado de la estrella: se mezclaban con ella.)
  if (E) E[2].forEach((fila, j) => { const r = g[E[1] + j - t.y]; r.forEach((c, x) => { if (c === 'y') r[x] = 'V'; }); for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') r[E[0] + x] = fila[x]; });
  const [x0, filas] = FALDON_SHERIFF[vista];
  filas.forEach((fila, j) => { for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') g[17 + j - t.y][x0 + x] = fila[x]; });
  return { y: t.y, filas: g.map((f) => f.join('').replace(/\.+$/, '')) };
}
TORSOS.sheriff = Object.fromEntries(['frente', 'diagF', 'lado', 'diagE', 'espalda'].map((v) => [v, torsoSheriff(v)]));
/**
 * 🆕 P4 · EL RICO DE PRIMERA CLASE *(Santi eligió: galera negra, saco largo oscuro, chaleco claro con la
 * cadena del reloj y corbata)*: el cuerpo del civil con el SACO (`L C c`: las mangas, los hombros y los
 * bordes del torso; de espaldas, todo) abierto sobre el CHALECO claro (`U V v`, con los botones y la
 * cadena dorados, `y`), el cuello blanco con la corbata negra (`R S r`) y el saco que sigue hasta las
 * rodillas, abierto adelante (FALDON_RICO; se mueve con las piernas, ver `sacoSinHuecos`). Los colores,
 * en BASE.rico y los que se sortean (SACOS_RICO, CHALECOS_RICO).
 */
const FALDON_RICO = {
  frente: [7, ['LCCcCcc', 'LCC.Ccc', 'LCC.Ccc', 'ccc.ccc']],
  diagF: [7, ['LCCcCcc', 'LCC.Ccc', 'LCC.Ccc', 'ccc.ccc']],
  lado: [7, ['LCCcc', 'LCCcc', 'LCCcc', 'ccccc']],
  diagE: [7, ['LCCCCcc', 'LCCCCcc', 'LCCcCcc', 'ccccccc']],
  espalda: [7, ['LCCCCcc', 'LCCCCcc', 'LCCcCcc', 'ccccccc']],
};
const CADENA_RICO = { frente: [[11, 12], [11, 13]], diagF: [[12, 12], [12, 13]] };
function torsoRico(vista, faldon = FALDON_RICO, cadena = CADENA_RICO) {
  const t = TORSOS.pasajero[vista];
  const ult = t.filas.length - 1;
  const g = Array.from({ length: 13 }, (_, j) => (t.filas[j] || '').padEnd(18, '.').split(''));
  for (let j = 0; j < ult; j++) {
    const r = g[j];
    const xs = r.map((c, x) => (c !== '.' ? x : -1)).filter((x) => x >= 0);
    if (!xs.length) continue;
    if (vista === 'frente' || vista === 'diagF') {
      // Los bordes del saco abierto (la fila de los hombros ya trae el saco en las puntas).
      if (j > 0) { r[xs[0]] = 'L'; r[xs[xs.length - 1]] = 'c'; }
    } else if (vista === 'lado') {
      // De costado, el saco cubre todo menos el frente (el chaleco y los botones).
      for (const x of xs.slice(0, -1)) r[x] = { U: 'L', V: 'C', v: 'c', w: 'c' }[r[x]] || r[x];
    } else {
      for (const x of xs) r[x] = { U: 'L', V: 'C', v: 'c', w: 'c' }[r[x]] || r[x];
    }
  }
  for (const [x, y] of (cadena && cadena[vista]) || []) if (g[y - t.y] && g[y - t.y][x] !== '.') g[y - t.y][x] = 'G';
  const F = faldon && faldon[vista];
  if (F) F[1].forEach((fila, j) => { for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') g[17 + j - t.y][F[0] + x] = fila[x]; });
  return { y: t.y, filas: g.map((f) => f.join('').replace(/\.+$/, '')) };
}
TORSOS.rico = Object.fromEntries(['frente', 'diagF', 'lado', 'diagE', 'espalda'].map((v) => [v, torsoRico(v)]));
/**
 * 🆕 P4 · LOS GUARDAESPALDAS DE LOS RICOS *(Santi: "que los guardaespaldas sean diferentes a los guardias
 * normales: saco negro, camisa blanca")*: gente contratada, no de la compañía (sin la estrella). El
 * saco negro corto (el del rico sin el faldón ni la cadena), abierto sobre la camisa blanca (`U V v`)
 * con la corbata negra, el bombín negro y la funda (ver BASE.escolta).
 */
/**
 * 🔁 La corbata, una franja negra por el medio de la camisa, del nudo al pecho; sin los botones de la
 * camisa (eran "unos puntitos negros en cualquier lado"); y la fila de los hombros, de saco: con la
 * camisa de punta a punta era "una línea blanca larga que le corta el cuello" *(Santi)*.
 */
const CORBATA = { frente: 10, diagF: 11 };
function torsoEscolta(vista) {
  const t = torsoRico(vista, null, null);
  const filas = t.filas.map((f) => f.split(''));
  const ult = TORSOS.pasajero[vista].filas.length - 1;
  filas.forEach((r, j) => {
    if (j >= ult) return;
    for (let x = 0; x < r.length; x++) if (r[x] === 'y') r[x] = 'V';
    if (j === 0 && (vista === 'frente' || vista === 'diagF')) for (let x = 0; x < r.length; x++) {
      if (r[x] === 'U') r[x] = 'L';
      if (r[x] === 'V') r[x] = 'c';
    }
    const cx = CORBATA[vista];
    if (cx != null && j >= 1 && j <= 5 && r[cx] && r[cx] !== '.') r[cx] = 'S';
  });
  return { y: t.y, filas: filas.map((r) => r.join('')) };
}
TORSOS.escolta = Object.fromEntries(['frente', 'diagF', 'lado', 'diagE', 'espalda'].map((v) => [v, torsoEscolta(v)]));
/**
 * 🆕 P4 · EL BARTENDER DE PRIMERA CLASE *(Santi: "una mesa bar con un bartender")*: el chaleco negro sobre
 * la camisa blanca, el moño negro y el DELANTAL blanco hasta las rodillas (sólo de frente y de costado:
 * de espaldas, el chaleco). Sin sombrero, peinado al costado.
 */
// (🔁 Hasta las rodillas: de cuatro filas parecía un pañito en la cintura.)
const DELANTAL = {
  frente: [8, ['LLCCc', 'LLCCc', 'LLCCc', 'LLCCc', 'LLCCc', 'ccccc']],
  diagF: [8, ['LLCCc', 'LLCCc', 'LLCCc', 'LLCCc', 'LLCCc', 'ccccc']],
  // (🔁 De costado, un punto más adelante: delante del delantal asomaba el pantalón *(Santi: "no lo
  // agrandes, corrélo")*.)
  lado: [10, ['Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'cc']],
};
function torsoBartender(vista) {
  const t = TORSOS.pasajero[vista];
  // (🔁 Sin la V de la camisa debajo del moño: eran dos puntos blancos sueltos sobre el chaleco *(Santi: "pixeles
  // blancos sobre el pecho… pintados sueltos")*. La camisa blanca se ve en las mangas.)
  // (Y de espaldas, el cuello de la camisa que asomaba en el medio de la espalda: lo de adentro de las dos
  // primeras filas, salvo las puntas, que son el comienzo de las mangas.)
  const sinCamisa = (f) => { const a = f.search(/[^.]/), z = f.length - 1; return f.split('').map((ch, x) => (x > a && x < z && (ch === 'C' || ch === 'c') ? 'V' : ch)).join(''); };
  const g = Array.from({ length: 15 }, (_, j) => (j === 1 ? sinCamisa((t.filas[j] || '').replace(/C/g, 'V')) : j === 0 && (vista === 'espalda' || vista === 'diagE') ? sinCamisa(t.filas[j] || '') : t.filas[j] || '').padEnd(18, '.').split(''));
  const F = DELANTAL[vista];
  if (F) F[1].forEach((fila, j) => { for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') g[17 + j - t.y][F[0] + x] = fila[x]; });
  return { y: t.y, filas: g.map((f) => f.join('').replace(/\.+$/, '')) };
}
TORSOS.bartender = Object.fromEntries(['frente', 'diagF', 'lado', 'diagE', 'espalda'].map((v) => [v, torsoBartender(v)]));
/**
 * 🔁 LA CAMISA DEL GUARDAESPALDAS, RECTA, SEA CUAL SEA EL CUERPO *(Santi: "se ve raro en el de hombros
 * anchos porque se ve una terminación en V, en vez de ser recta como en el de cuerpo normal")*: los
 * cuerpos ensanchan el torso corriendo los bordes (con los hombros anchos la camisa salía en V; en el
 * gordito, la panza la mandaba a los costados). Se vuelve a pintar sobre el torso ya armado (sólo lo que
 * es torso: no los brazos, que pueden cruzar el pecho): todo saco, y en el medio la franja de la camisa,
 * de tres puntos, sin corbata (con sus botones). De frente y en diagonal (de costado y de espaldas no se
 * ve la camisa).
 */
function camisaRecta(q, col, vista, cuerpo) {
  const out = q.idx.slice(), A = 44, dueno = q.duenio;
  const camisa = new Set([col.U, col.V, col.v, col.R, col.r]);
  const esTorso = (k) => !dueno || dueno[k] === PARTE.cuerpo;
  // De perfil y de atrás no se ve la camisa: lo que asomaba (un punto blanco adelante, una franja en el de
  // hombros anchos) es saco *(Santi: "hay un punto blanco cuando se ve de perfil que no debería estar")*.
  // (El de hombros anchos sí: su pecho inflado pasa el saco *(Santi)*.)
  if (vista !== 'frente' && vista !== 'diagF') {
    if (cuerpo === 'anchos') return out;
    for (let k = 0; k < out.length; k++) if (esTorso(k) && camisa.has(out[k])) out[k] = col.c;
    return out;
  }
  let cinto = 22;
  for (let y = 16; y <= 26; y++) { let n = 0; for (let x = 0; x < A; x++) if (out[y * A + x] === col.W) n++; if (n >= 2) { cinto = y; break; } }
  const cx = OX + (vista === 'frente' ? 10 : 11) + (q.cabeza ? q.cabeza[0] : 0);
  for (let y = cinto - 8; y < cinto; y++) for (let x = 0; x < A; x++) {
    const k = y * A + x;
    if (!esTorso(k) || out[k] < 0) continue;
    if (Math.abs(x - cx) <= 1) out[k] = franjaCamisa(x - cx, y - (cinto - 8), col);
    else if (camisa.has(out[k])) out[k] = x < cx ? col.L : col.c;
  }
  return out;
}
/**
 * La franja del medio del pecho (3 puntos: `dx` -1, 0, 1; `j` la fila desde el cuello, 0 a 7): la camisa
 * sin corbata, con sus botones en el medio, uno cada dos filas *(Santi eligió esto entre corbata, moño,
 * nada y chaleco gris: "vamos con la C y oscurece un punto a los botones")*.
 */
function franjaCamisa(dx, j, col) {
  if (dx === 0 && j >= 2 && j % 2 === 0) return 23;   // los botones, grises oscuros
  return dx < 0 ? col.U : dx > 0 ? col.v : col.V;
}
/**
 * 🆕 EL DELANTAL ENTRE LAS PIERNAS, de espaldas *(Santi: "un espacio de aire que también sería delantal entre
 * la pierna y el delantal"; "cuando estaba de espaldas y en la estantería")*: el delantal cuelga por delante,
 * así que por el hueco entre las dos piernas se ve su parte de atrás, en sombra. De la cintura a donde termina
 * el delantal (las rodillas, ver DELANTAL).
 */
function delantalEntrePiernas(q, vista) {
  const out = q.idx.slice(), y0 = OY + 18, y1 = OY + 22;
  for (let y = y0; y <= y1; y++) {
    let a = -1, z = -1;
    for (let x = 0; x < ANCHO; x++) if (out[y * ANCHO + x] >= 0 && q.duenio[y * ANCHO + x] === PARTE.piernas) { if (a < 0) a = x; z = x; }
    if (a < 0) continue;
    for (let x = a + 1; x < z; x++) if (out[y * ANCHO + x] < 0) out[y * ANCHO + x] = y === y1 ? 15 : 16;
  }
  /**
   * 🆕 Y LA TIRA ATADA ATRÁS, como el pañuelo del jugador de espaldas (ver CARA_ASALTO en jugador.js) *(Santi:
   * "un pequeño nudo como el del jugador con su pañuelo… una tira blanca de un pixel alrededor del cuerpo que
   * termina en el nudo")*: en la cintura, de punta a punta del cuerpo, una tira de un punto, blanca en el medio
   * y en sombra en los bordes; el nudo, un punto más oscuro en el medio, con la punta colgando debajo.
   */
  // (La cintura, en la fila donde esté: caminando, el cuerpo sube o baja un punto.)
  let yc = -1, a = -1, z = -1;
  for (let y = OY + 14; y <= OY + 18 && yc < 0; y++) {
    let n = 0, a1 = -1, z1 = -1;
    for (let x = 0; x < ANCHO; x++) if (out[y * ANCHO + x] === 1) { n++; if (a1 < 0) a1 = x; z1 = x; }
    if (n >= 3) { yc = y; a = a1; z = z1; }
  }
  if (yc >= 0) {
    // De punta a punta de lo que es cuerpo en esa fila (no las manos).
    let i0 = -1, i1 = -1;
    for (let x = 0; x < ANCHO; x++) if (out[yc * ANCHO + x] >= 0 && q.duenio[yc * ANCHO + x] === PARTE.cuerpo) { if (i0 < 0) i0 = x; i1 = x; }
    // (En la diagonal, el nudo un punto hacia el lado contrario al que giró: ahí queda el medio de la espalda
    // *(Santi)*. Girado para el otro lado es el mismo dibujo en espejo.)
    const cx = Math.round((a + z) / 2) - (vista === 'diagE' ? 1 : 0);
    for (let x = i0; x <= i1; x++) out[yc * ANCHO + x] = x === i0 || x === i1 ? 17 : 30;
    out[yc * ANCHO + cx] = 16;                               // el nudo
    // La punta, colgando, del color de la tira (en sombra se confundía con el delantal entre las piernas).
    if (out[(yc + 1) * ANCHO + cx] >= 0) out[(yc + 1) * ANCHO + cx] = 17;
  }
  return out;
}
/**
 * El bartender gordito: la panza estiraba la cintura del delantal y, de costado, se pintaba del color de la
 * camisa (ver los dos arreglos adentro).
 */
function bartenderGordito(q, vista) {
  const out = q.idx.slice(), yC = OY + 17, es = (k) => out[k] >= 0 && q.duenio[k] === PARTE.cuerpo;
  // De frente y en diagonal: la primera fila del delantal (la cintura), del ancho del resto del delantal; lo
  // que la panza la estiraba de más es chaleco (quedaba una franja blanca en T).
  if (vista === 'frente' || vista === 'diagF') {
    let a = -1, z = -1;
    for (let x = 0; x < ANCHO; x++) if (es((yC + 1) * ANCHO + x)) { if (a < 0) a = x; z = x; }
    if (a >= 0) for (let x = 0; x < ANCHO; x++) { const k = yC * ANCHO + x; if (es(k) && (x < a || x > z)) out[k] = x < a ? 31 : 0; }
  }
  // De costado: la panza, del chaleco y no de la camisa (parecía un bulto de delantal).
  if (vista === 'lado' || vista === 'diagE') for (let y = OY + 9; y < yC; y++) for (let x = 0; x < ANCHO; x++) {
    const k = y * ANCHO + x;
    // (🔁 También la sombra que el brazo deja en la panza al pasar, `15`: quedaba un punto claro.)
    if (es(k) && (out[k] === 17 || out[k] === 16 || out[k] === 15)) out[k] = out[k] === 17 ? 31 : 0;
  }
  // Y la cintura del delantal, de costado, sin el punto que la panza empujaba hacia adelante (quedaba un escalón).
  if (vista === 'lado') {
    let z = -1;
    for (let x = 0; x < ANCHO; x++) if (es((yC + 1) * ANCHO + x)) z = x;
    if (z >= 0) for (let x = z + 1; x < ANCHO; x++) if (es(yC * ANCHO + x)) out[yC * ANCHO + x] = -1;
  }
  return out;
}
/**
 * 🆕 SIN PUNTOS SUELTOS (el bartender) *(Santi: "hay pixeles que están volando")*: con las manos arriba,
 * secando, quedaban pedacitos de uno o dos puntos despegados del cuerpo (la punta del cuello en el flaco, la
 * cadera al lado del delantal). Se borra todo lo que no esté pegado al resto de la figura y tenga `max`
 * puntos o menos.
 */
function sinSueltos(idx, max = 3) {
  const out = idx.slice(), visto = new Uint8Array(ANCHO * ALTO);
  for (let k0 = 0; k0 < out.length; k0++) {
    if (out[k0] < 0 || visto[k0]) continue;
    const pila = [k0], suyos = []; visto[k0] = 1;
    while (pila.length) {
      const k = pila.pop(); suyos.push(k);
      const x = k % ANCHO, y = (k - x) / ANCHO;
      for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (a < 0 || b < 0 || a >= ANCHO || b >= ALTO) continue;
        const kk = b * ANCHO + a;
        if (!visto[kk] && out[kk] >= 0) { visto[kk] = 1; pila.push(kk); }
      }
    }
    if (suyos.length <= max) for (const k of suyos) out[k] = -1;
  }
  return out;
}
/** Lo que se sortea del rico: el saco y el chaleco. */
const SACOS_RICO = {
  negro: { L: 23, C: 31, c: 0 },
  gris: { L: 24, C: 23, c: 31 },
  marron: { L: 4, C: 3, c: 1 },
};
/** Los guantes (las manos: `mP mp mq`, ver `cuadroJugador` en jugador.js). */
const GUANTES_RICO = {
  blancos: { mP: 30, mp: 17, mq: 16 },
  grises: { mP: 25, mp: 24, mq: 23 },
};
const CHALECOS_RICO = {
  crema: { U: 17, V: 16, v: 15, w: 14 },
  perla: { U: 25, V: 24, v: 23, w: 31 },
};
/**
 * El Sheriff es siempre el mismo (Santi, la C del sorteo): canoso y de cuerpo normal. 🔁 La barba,
 * cualquiera *(Santi: "que la barba pueda ser de cualquier tipo, lo único que queda es el color del
 * pelo")*: se sortea con los pesos de los canosos.
 */
export function aspectoSheriff(azar = Math.random) {
  return { piel: 'media', pelo: 'canas', peinado: 'corto', barba: elegir(PESO.barbaCanas, azar), sombrero: 'alto', cuerpo: 'normal', chaqueta: false, arremangada: false };
}
/**
 * 🆕 P3c · EL CAZARRECOMPENSAS (el jefe que sube por vos; siempre el mismo): el cuerpo del civil con
 * el chaleco de cuero negro, la camisa clara, el pañuelo rojo, **hombros anchos** y **la capa roja
 * larga** hasta las rodillas *(Santi eligió la B de tres capas y la A de dos para el frente)*.
 */
TORSOS.cazarrecompensas = TORSOS.pasajero;
export function aspectoCazador() {
  return { piel: 'media', pelo: 'negro', peinado: 'corto', barba: 'completa', sombrero: 'ancho', cuerpo: 'anchos', chaqueta: false, arremangada: false };
}
/**
 * LA CAPA, sobre el cuadro terminado (se arma con la forma del cuerpo de cada cuadro). Cuelga de los
 * hombros (siete filas arriba del cinto) hasta las rodillas (cuatro abajo).
 *  - **De frente, en diagonal hacia abajo y de costado va DETRÁS del cuerpo** *(Santi: "tiene que estar
 *    muy bien hecha y que se distinga que está detrás del cuerpo")*: sólo llena lo vacío, y es el
 *    rojo más oscuro (el forro en la sombra), con el borde de afuera un tono más claro (la tela que
 *    da vuelta). Asoma un punto más allá de los brazos, entre el brazo y las costillas y entre las piernas.
 *  - **De espaldas y de tres cuartos de espaldas va ENCIMA** (tapa la espalda y los brazos que
 *    cuelgan): el rojo vivo, con luz a la izquierda, sombra a la derecha, los pliegues que bajan y
 *    el ruedo oscuro. Se abre en campana.
 *  - Caminando se abre un poco; **corriendo vuela**: hacia atrás de costado y más abierta de espaldas.
 */
const CAPA = { luz: 10, base: 9, sombra: 8, forro: 39 };
// Cuánto asoma a cada lado del cinto, arriba y abajo: [[izquierda arriba, abajo], [derecha arriba, abajo]].
// 🔁 Se angosta hacia los hombros y se abre abajo, sin agrandarse *(Santi: "de frente la capa es muy
// cuadrada… no la agrandaría, sino que achicaría a medida que se acerca a los hombros")*.
const ASOMA_CAPA = {
  frente: [[2, 5], [2, 5]], diagF: [[2, 5], [1, 4]], lado: [[1, 4], [-99, -99]],
  diagE: [[4, 5], [4, 5]], espalda: [[4, 5], [4, 5]],
};
/**
 * 🆕 DE COSTADO CORRIENDO, LA CAPA VUELA, DIBUJADA A MANO *(Santi: "cuando corre de perfil… parece un
 * cuadrado o una escalera. Debería elevarse y quedar algo más parecido a la imagen")*: angosta en los
 * hombros y cada vez más ancha hacia atrás; el borde de arriba sube, el de abajo baja en diagonal
 * mostrando el forro, y la punta ondea. Dos dibujos que se turnan (flamea). La columna 12 es la
 * espalda (el borde de atrás del cinto); la fila 2, los hombros.
 * `l` la luz arriba, `b` el rojo, `s` la sombra, `f` el forro.
 */
const CAPA_VUELA = [
  ['lll...........', 'bbbllllllllll.', 'bbbbbbbbbbbbb.', 'bbbbbbbbbbbbl.', 'sbbbbbbbbbbbb.', 'bsbbbbbbbbbs..', 'bbsbbbbbbff...', 'sbbsbbbfff....', '.sbbbfff......', '..fff.........'],
  ['..ll..........', '.lbblllllllll.', 'lbbbbbbbbbbbb.', 'bbbbbbbbbbbbl.', 'bbbbbbbbbbbbb.', 'sbbbbbbbbbbs..', '.sbbbbbbbff...', 'bbsbbbbfff....', 'sbbbbfff......', '.fff..........'],
];
function capaCazador(idx, vista, paso) {
  const out = idx.slice(), A = 44, B = BASE.cazarrecompensas;
  let cinto = 16 + 6, wa = 99, wb = -1;
  for (let y = 12 + 6; y <= 20 + 6; y++) {
    let n = 0;
    for (let x = 0; x < A; x++) if (idx[y * A + x] === B.W) n++;
    if (n >= 2) { cinto = y; break; }
  }
  for (let x = 0; x < A; x++) if (idx[cinto * A + x] === B.W || idx[cinto * A + x] === B.G) { wa = Math.min(wa, x); wb = Math.max(wb, x); }
  if (wb < 0) { wa = 19; wb = 25; }
  /**
   * 🐛 De costado el cinto casi no se ve (lo tapa el brazo): en la mitad de los cuadros se agarraba
   * otro punto y la capa salía corrida, pegada al cuerpo en más de cinco puntos *(Santi: "en R0, R2, R4
   * y R6 la capa sale raro… muy ancha al salir")*. De costado se mide desde el chaleco: su primera fila
   * son los hombros y su borde de atrás, la espalda.
   */
  let hombros = cinto - 8;
  if (vista === 'lado') {
    // (Desde debajo del pañuelo: el sombrero tiene los colores del chaleco y, con el cuerpo abajo, el
    // ala caía donde se buscaba.)
    let arriba = -1, panuelo = 10;
    for (let y = 6; y < 30; y++) if ([B.S, B.R].some((c) => idx.subarray(y * A, y * A + A).includes(c))) { panuelo = y; break; }
    for (let y = panuelo + 1; y < 30 && arriba < 0; y++) for (let x = 0; x < A; x++) if (idx[y * A + x] === B.U || idx[y * A + x] === B.V) { arriba = y; break; }
    if (arriba >= 0) {
      cinto = arriba + 8; hombros = arriba; wa = 99;
      for (let y = arriba; y <= arriba + 8; y++) for (let x = 0; x < A; x++) if (idx[y * A + x] === B.U || idx[y * A + x] === B.V) { wa = Math.min(wa, x); break; }
    }
  }
  const encima = vista === 'espalda' || vista === 'diagE';
  const y0 = cinto - (encima ? 8 : 7), y1 = cinto + 4;   // (encima, desde arriba del hombro: si no, asomaba la manga)
  // De costado corriendo, la capa dibujada a mano (detrás del cuerpo: llena sólo lo vacío).
  if (vista === 'lado' && paso && paso[0] === 'R') {
    const M = CAPA_VUELA[(Number(paso.slice(1)) >> 1) & 1], col = { l: CAPA.luz, b: CAPA.base, s: CAPA.sombra, f: CAPA.forro };
    M.forEach((fila, j) => { for (let i = 0; i < fila.length; i++) {
      // (Como en los cuadros que salían bien: un punto detrás de la espalda y una fila arriba del
      // chaleco, así la tocan unos 3 puntos y no le sale de la cabeza.)
      const x = wa - 13 + i, y = hombros - 2 + j, k = y * A + x;
      if (fila[i] !== '.' && x >= 0 && x < A && out[k] < 0) out[k] = col[fila[i]];
    } });
    return out;
  }
  // 🔁 Con el paso, un punto y sólo hacia atrás *(Santi: "cuando corre o camina en diagonal… se
  // ensancha mucho hacia el lado que está viendo")*: corriendo; caminando, sólo de costado.
  const vuela = paso && paso[0] === 'R' ? 1 : paso && paso[0] === 'W' && vista === 'lado' ? 1 : 0;
  const [[i0, i1], [d0, d1]] = ASOMA_CAPA[vista];
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / (y1 - y0);
    const extra = Math.round(vuela * t);
    // (Se abre de a poco arriba y más abajo: la orilla hace la curva de la tela.)
    const u2 = Math.sqrt(t);
    const a = wa - Math.round(i0 + (i1 - i0) * u2) - extra;
    const b = d0 < -50 ? Math.floor((wa + wb) / 2) : wb + Math.round(d0 + (d1 - d0) * u2) + (vista === 'espalda' ? extra : 0);
    for (let x = Math.max(0, a); x <= Math.min(A - 1, b); x++) {
      const k = y * A + x;
      if (!encima) {
        if (out[k] >= 0) continue;
        out[k] = x === a || x === b ? CAPA.sombra : CAPA.forro;
        continue;
      }
      // (Arriba sigue la forma de los hombros del cuerpo: no se pinta afuera de ellos.)
      if (y <= y0 + 1 && out[k] < 0) continue;
      // Encima: la luz a la izquierda, la sombra a la derecha, los pliegues abajo y el ruedo.
      const u = (x - a) / Math.max(1, b - a);
      let c = u < 0.2 ? CAPA.luz : u > 0.78 ? CAPA.sombra : CAPA.base;
      if (y === y1) c = CAPA.sombra;
      // Dos pliegues que bajan desde la mitad, a un tercio de cada lado.
      else if (t > 0.45 && c === CAPA.base && (x === Math.round(a + (b - a) / 3) || x === Math.round(a + 2 * (b - a) / 3))) c = CAPA.sombra;
      out[k] = c;
    }
  }
  return out;
}
TORSOS.blindado = Object.fromEntries(['frente', 'diagF', 'lado', 'diagE', 'espalda'].map((v) => [v, torsoBlindado(v)]));

/** De dónde a dónde va la correa (la vuelve a trazar `darForma` en jugador.js con el cuerpo ensanchado). */
function correaEncargado(vista) { const c = CARTERA_ENCARGADO[vista] && CARTERA_ENCARGADO[vista].correa; return c ? [c[0], c[c.length - 1]] : null; }
TORSOS.encargado = Object.fromEntries(['frente', 'diagF', 'lado', 'diagE', 'espalda'].map((v) => [v, torsoEncargado(v)]));

/**
 * 🆕 EL DINAMITERO *(Santi eligió el minero)*: sin uniforme, la camisa arremangada, los tiradores (`J j`) y la bandolera roja
 * cruzada. Los puntos 5 a 8 son LOS CARTUCHOS: se vacían cuando los tira y vuelven en los 5 s de recarga (ver `capasPersona`). De
 * espaldas se ve sólo la correa (`9`). Sin funda: no tiene arma de fuego.
 */
/** 🚂 EL MAQUINISTA: camisa clara, el pañuelo rojo al cuello y la pechera del mameluco azul, con su botón de bronce. Sin funda. */
TORSOS.maquinista = {
  frente: mapa(8, ['.......CLCCCCc', '........55567', '........J5JJj', '........JJJJj', '........J9J9j', '........JJJJj', '........JJJJj', '........jJJjj', '........WyGyW']),
  diagF: mapa(8, ['.......CLCCCCc', '........L5556', '........LJ5Jj', '........LJJJj', '........LJ9Jj', '........LJJJj', '........CJJJj', '........CjJjj', '........WyWGy']),
  lado: mapa(8, ['.......LCCCc', '.......L5556', '.......LCJ5j', '.......LCJJj', '.......LCJ9j', '.......LCJJj', '.......CJJJj', '.......CJjJj', '.......WWyWG']),
  diagE: mapa(8, ['.......CLLLCCc', '........L5556', '........LJCJj', '........LJCJj', '........LJCJj', '........LJJJj', '........LJJJj', '........CjJjj', '........WWWWW']),
  espalda: mapa(8, ['.......CLLCLLc', '........L555c', '........LJCJc', '........LCJCc', '........LCJCc', '........JJJJj', '........JJJJj', '........jJJjj', '........WWWWW']),
};
/** 🚂 EL FOGONERO: la camiseta gris tiznada, con la mancha de carbón (`9`) y los tiradores. Sin funda y con los brazos al aire. */
TORSOS.fogonero = {
  frente: mapa(8, ['.......CLCCCCc', '........J9CCJ', '........JC9CJ', '........JCCCJ', '........J9CCJ', '........JCC9J', '........JCCcJ', '........jCCcj', '........WyGyW']),
  diagF: mapa(8, ['.......CLCCCCc', '........LJ9CJ', '........LJC9J', '........LJCCJ', '........LJ9CJ', '........LJC9J', '........CJCCJ', '........CjCCj', '........WyWGy']),
  lado: mapa(8, ['.......LCCCc', '.......LCJ9c', '.......LCJCc', '.......L9JCc', '.......LCJ9c', '.......LCJCc', '.......CCJCc', '.......CCjCc', '.......WWyWG']),
  diagE: mapa(8, ['.......CLLLCCc', '........9LJCJ', '........LLJ9J', '........LLJCJ', '........9LJCJ', '........LLJ9J', '........LLJCJ', '........CCjCj', '........WWWWW']),
  espalda: mapa(8, ['.......CLLCLLc', '........J9CCJ', '........JLC9J', '........LJCJC', '........LJ9JC', '........LJCJ9', '........LJCJC', '........CjCjC', '........WWWWW']),
};
/**
 * 🚂 LA PALA DEL FOGONERO, a mano, en seis posturas: arriba o abajo, adelante o atrás. `dx` y `dy` son dónde queda la mano de adelante
 * dentro del mapa. Cada cuadro de cada vista elige la suya, así que entre los 40 cuadros los dibujos de la pala se repiten.
 */
const PALA = {
  arriba: { dx: 2, dy: 11, filas: ['.HHh.', '.HHh.', '.HHh.', '.HHh.', '.hhh.', '..m..', '..m..', '..m..', '..m..', '..m..', '..m..', '..m..', '..m..', '..M..', '..M..'] },
  abajo: { dx: 2, dy: 3, filas: ['..M..', '..M..', '..m..', '..m..', '..m..', '..m..', '..m..', '..m..', '..m..', '.hhh.', '.HHh.', '.HHh.', '.HHh.', '.HHh.'] },
  atrasAlta: { dx: 8, dy: 8, filas: ['HH.........', 'HHh........', 'HHhm.......', '.hhmm......', '....mm.....', '.....mm....', '......mm...', '.......mm..', '........mm.', '.........MM', '..........M'] },
  adelanteAlta: { dx: 2, dy: 8, filas: ['.........HH', '........hHH', '.......mhHH', '......mmhh.', '.....mm....', '....mm.....', '...mm......', '..mm.......', '.mm........', 'MM.........', 'M..........'] },
  adelante: { dx: 3, dy: 2, filas: ['..........hHHH', '..........hHHH', 'MMMmmmmmmmhHHH', '..........hHHH', '..........hHHH'] },
  abajoAdelante: { dx: 3, dy: 3, filas: ['MM.........', '.MM........', '..mm.......', '...mm......', '....mm.....', '.....mm....', '......mmh..', '.......hHH.', '........HHH', '.........HH'] },
};
const COL_PALA = { H: 24, h: 23, m: 5, M: 4, n: 0 };
/** Cada cuadro del golpe, en cada vista: [mano de adelante], [la otra], la postura de la pala y si queda atrás del cuerpo. */
const GOLPE_PALA = {
  frente: { hombros: [[7, 9], [13, 9]], capa: 'frente', cuadros: [
    [[12, 12], [8, 12], 'arriba'], [[14, 10], [6, 11], 'arriba'], [[15, 6], [7, 7], 'arriba'], [[12, 4], [8, 4], 'arriba'],
    [[12, 6], [8, 6], 'arriba'], [[12, 11], [8, 11], 'abajo'], [[12, 13], [8, 13], 'abajo'], [[12, 12], [8, 12], 'abajo'],
  ] },
  diagF: { hombros: [[7, 9], [13, 9]], capa: 'frente', cuadros: [
    [[14, 12], [10, 13], 'adelanteAlta'], [[15, 9], [8, 11], 'arriba'], [[13, 5], [6, 7], 'atrasAlta'], [[14, 4], [9, 5], 'arriba'],
    [[15, 7], [10, 8], 'adelanteAlta'], [[16, 10], [11, 11], 'adelante'], [[15, 12], [10, 13], 'abajoAdelante'], [[14, 12], [10, 13], 'abajoAdelante'],
  ] },
  lado: { hombros: [[10, 9], [9, 9]], capa: 'frente', cuadros: [
    [[13, 12], [11, 13], 'adelanteAlta'], [[12, 8], [10, 9], 'arriba'], [[10, 4], [8, 5], 'atrasAlta'], [[12, 5], [10, 6], 'arriba'],
    [[14, 8], [12, 9], 'adelanteAlta'], [[15, 10], [13, 11], 'adelante'], [[15, 12], [13, 12], 'abajoAdelante'], [[14, 12], [12, 13], 'adelanteAlta'],
  ] },
  diagE: { hombros: [[13, 9], [6, 9]], capa: 'fondo', cuadros: [
    [[13, 12], [8, 12], 'adelanteAlta'], [[15, 9], [6, 10], 'arriba'], [[14, 5], [7, 6], 'atrasAlta'], [[14, 4], [8, 5], 'arriba'],
    [[15, 7], [9, 8], 'adelanteAlta'], [[16, 10], [9, 11], 'adelante'], [[15, 12], [9, 12], 'abajoAdelante'], [[14, 12], [9, 12], 'abajoAdelante'],
  ] },
  espalda: { hombros: [[13, 9], [6, 9]], capa: 'fondo', cuadros: [
    [[12, 12], [7, 12], 'arriba'], [[14, 10], [5, 11], 'arriba'], [[15, 6], [6, 7], 'arriba'], [[12, 4], [7, 4], 'arriba'],
    [[12, 6], [7, 6], 'arriba'], [[12, 11], [7, 11], 'abajo'], [[12, 13], [7, 13], 'abajo'], [[12, 12], [7, 12], 'abajo'],
  ] },
};
/** Palear, de perfil: agacharse, cargar y tirar al fogón. El cuarto dato (`true`): con carbón en la hoja. */
const PALEO = [
  [[13, 14], [11, 13], 'abajoAdelante', false],
  [[14, 14], [11, 13], 'abajoAdelante', false],
  [[14, 12], [11, 12], 'adelante', true],
  [[15, 10], [12, 11], 'adelante', true],
  [[15, 8], [12, 9], 'adelanteAlta', false],
  [[15, 8], [12, 9], 'adelanteAlta', false],
  [[14, 11], [11, 11], 'adelante', false],
  [[13, 13], [11, 12], 'abajoAdelante', false],
];
function posePala(hombros, capa, [m1, m2, cual, carbon], inclina) {
  const P = PALA[cual], x = m1[0] - P.dx, y = m1[1] - P.dy;
  const filas = P.filas.map((f) => '.'.repeat(Math.max(0, x)) + f);
  const props = [{ m: mapa(y, filas), tabla: COL_PALA, capa }];
  if (carbon) props.push({ m: mapa(m1[1] - 3, ['.'.repeat(m1[0] + 8) + 'nnn']), tabla: COL_PALA, capa });
  const codo = (h, m) => [Math.round((h[0] + m[0]) / 2) + (m[0] >= h[0] ? 1 : -1), Math.round((h[1] + m[1]) / 2) + 1];
  return {
    lista: [{ p: [hombros[0], codo(hombros[0], m1), m1] }, { p: [hombros[1], codo(hombros[1], m2), m2], atras: capa === 'fondo' || m2[0] < m1[0] - 3 }],
    props, inclina,
  };
}
/** 🚂 En los mandos, de perfil y mirando para adelante: la mano de adelante en la palanca del vapor, la otra abajo, en el freno. Mueve apenas el vapor, despacio. */
const MANDOS = [10, 10, 10, 9, 9, 9, 10, 10];
const poseMandos = (k) => ({ lista: [{ p: [[10, 9], [14, 11], [18, MANDOS[k]]] }, { p: [[9, 9], [11, 12], [14, 14]], atras: true }] });
/** 🚂 CON LAS MANOS ARRIBA, en cada vista, temblando: [hombro, codo, mano] de cada brazo. */
const MANOS_ARRIBA = {
  frente: [[[7, 9], [5, 6], [5, 2]], [[13, 9], [15, 6], [15, 2]]],
  diagF: [[[7, 9], [5, 6], [6, 2]], [[13, 9], [15, 6], [15, 2]]],
  lado: [[[10, 9], [12, 6], [12, 2]], [[9, 9], [8, 6], [8, 2]]],
  diagE: [[[13, 9], [15, 6], [15, 2]], [[6, 9], [4, 6], [5, 2]]],
  espalda: [[[13, 9], [15, 6], [15, 2]], [[6, 9], [4, 6], [4, 2]]],
};
const TIEMBLA = [0, 0, 1, 1, 0, 0, 1, 0];
function poseManos(vista, k) {
  return { lista: MANOS_ARRIBA[vista].map(([h, c, m], i) => ({ p: [h, c, [m[0] + (i ? -TIEMBLA[k] : TIEMBLA[(k + 2) % 8]) * 0, m[1] + TIEMBLA[(k + i * 3) % 8]]], atras: i === 1 && vista === 'lado' })) };
}
TORSOS.dinamitero = {
  frente: mapa(8, ['.......CLCCCCc', '........J5CCJ', '........JC6CJ', '........JCC7J', '........JCC8J', '........JCC9J', '........JCCcJ', '........jCCcj', '........WyGyW']),
  diagF: mapa(8, ['.......CLCCCCc', '........LJ5CJ', '........LJ6CJ', '........LJC7J', '........LJC8J', '........LJC9J', '........CJCCJ', '........CjCCj', '........WyWGy']),
  lado: mapa(8, ['.......LCCCc', '.......LCJ5c', '.......LCJ6c', '.......LCJ7c', '.......LCJ8c', '.......LCJ9c', '.......CCJCc', '.......CCjCc', '.......WWyWG']),
  diagE: mapa(8, ['.......CLLLCCc', '........9LJCJ', '........L9JCJ', '........LL9CJ', '........LLJ9J', '........LLJC9', '........LLJCJ', '........CCjCj', '........WWWWW']),
  espalda: mapa(8, ['.......CLLCLLc', '........9JCCJ', '........L9CCJ', '........LJ9JC', '........LCJ9C', '........LCJC9', '........LCJCC', '........CCjCC', '........WWWWW']),
};
/**
 * 🧨 TIRAR LAS DOS DINAMITAS, en 8 cuadros y en cada vista: 0, las dos en las manos, abajo (también es cómo las lleva peleando); 1 a 4
 * las sube; 5 se queda arriba con las mechas prendidas; 6 y 7 las larga para adelante. [hombro, codo, mano] de cada brazo.
 */
const TIRAR_DINAMITA = {
  frente: [
    [[[7, 9], [6, 12], [6, 14]], [[13, 9], [14, 12], [14, 14]]],
    [[[7, 9], [5, 11], [5, 12]], [[13, 9], [15, 11], [15, 12]]],
    [[[7, 9], [4, 9], [4, 8]], [[13, 9], [16, 9], [16, 8]]],
    [[[7, 9], [4, 7], [4, 5]], [[13, 9], [16, 7], [16, 5]]],
    [[[7, 9], [4, 5], [4, 2]], [[13, 9], [16, 5], [16, 2]]],
    [[[7, 9], [4, 5], [4, 2]], [[13, 9], [16, 5], [16, 2]]],
    [[[7, 9], [5, 5], [6, 2]], [[13, 9], [15, 5], [14, 2]]],
    [[[7, 9], [6, 7], [7, 6]], [[13, 9], [14, 7], [13, 6]]],
  ],
  diagF: [
    [[[7, 9], [8, 12], [9, 14]], [[13, 9], [13, 12], [13, 13]]],
    [[[7, 9], [6, 11], [7, 12]], [[13, 9], [15, 11], [15, 12]]],
    [[[7, 9], [5, 9], [5, 8]], [[13, 9], [16, 9], [16, 8]]],
    [[[7, 9], [4, 7], [4, 5]], [[13, 9], [16, 7], [16, 5]]],
    [[[7, 9], [4, 5], [4, 2]], [[13, 9], [16, 5], [16, 2]]],
    [[[7, 9], [4, 5], [4, 2]], [[13, 9], [16, 5], [16, 2]]],
    [[[7, 9], [6, 5], [7, 2]], [[13, 9], [15, 5], [14, 2]]],
    [[[7, 9], [8, 7], [9, 6]], [[13, 9], [14, 7], [14, 6]]],
  ],
  lado: [
    [[[10, 9], [11, 12], [13, 13]], [[9, 9], [10, 12], [12, 13]]],
    [[[10, 9], [12, 11], [13, 11]], [[9, 9], [11, 11], [12, 11]]],
    [[[10, 9], [12, 9], [13, 8]], [[9, 9], [11, 9], [12, 8]]],
    [[[10, 9], [12, 6], [12, 4]], [[9, 9], [10, 6], [10, 4]]],
    [[[10, 9], [10, 5], [9, 2]], [[9, 9], [8, 5], [7, 2]]],
    [[[10, 9], [10, 5], [9, 2]], [[9, 9], [8, 5], [7, 2]]],
    [[[10, 9], [12, 5], [13, 2]], [[9, 9], [11, 5], [12, 2]]],
    [[[10, 9], [13, 7], [15, 6]], [[9, 9], [12, 7], [14, 6]]],
  ],
  diagE: [
    [[[13, 9], [14, 12], [14, 14]], [[6, 9], [5, 12], [6, 14]]],
    [[[13, 9], [15, 11], [15, 12]], [[6, 9], [4, 11], [4, 12]]],
    [[[13, 9], [16, 9], [16, 8]], [[6, 9], [3, 9], [3, 8]]],
    [[[13, 9], [16, 7], [16, 5]], [[6, 9], [3, 7], [3, 5]]],
    [[[13, 9], [16, 5], [16, 2]], [[6, 9], [3, 5], [3, 2]]],
    [[[13, 9], [16, 5], [16, 2]], [[6, 9], [3, 5], [3, 2]]],
    [[[13, 9], [15, 5], [14, 2]], [[6, 9], [4, 5], [5, 2]]],
    [[[13, 9], [14, 7], [13, 6]], [[6, 9], [5, 7], [6, 6]]],
  ],
  espalda: [
    [[[13, 9], [14, 12], [14, 14]], [[6, 9], [5, 12], [5, 14]]],
    [[[13, 9], [15, 11], [15, 12]], [[6, 9], [4, 11], [4, 12]]],
    [[[13, 9], [16, 9], [16, 8]], [[6, 9], [3, 9], [3, 8]]],
    [[[13, 9], [16, 7], [16, 5]], [[6, 9], [3, 7], [3, 5]]],
    [[[13, 9], [16, 5], [16, 2]], [[6, 9], [3, 5], [3, 2]]],
    [[[13, 9], [16, 5], [16, 2]], [[6, 9], [3, 5], [3, 2]]],
    [[[13, 9], [14, 5], [13, 2]], [[6, 9], [5, 5], [6, 2]]],
    [[[13, 9], [13, 7], [12, 6]], [[6, 9], [6, 7], [7, 6]]],
  ],
};
/** El brazo de allá va detrás del cuerpo, en estas vistas. */
const DINAMITA_ATRAS = { lado: true, diagF: true, diagE: true };
/** Las dos manos con su cartucho: el rojo, la mecha y, desde que la prende (cuadro 2), la chispa que titila. */
function poseDinamita(vista, k) {
  const brazos = TIRAR_DINAMITA[vista][k];
  const tabla = { D: 10, d: 8, M: 17, B: k % 2 ? 45 : 29 };
  const lista = brazos.map((p, i) => ({ p, atras: i === 1 && !!DINAMITA_ATRAS[vista] }));
  const props = brazos.map((p, i) => {
    const [mx, my] = p[2], ax = '.'.repeat(Math.max(0, mx));
    return { m: mapa(my - 5, [k >= 2 ? ax + 'B' : '.', ax + 'M', ax + 'Dd', ax + 'Dd', ax + 'Dd']), tabla, capa: i === 1 && DINAMITA_ATRAS[vista] ? 'fondo' : 'frente' };
  });
  return { lista, props };
}

// ------------------------------------------------------------------ colores
/**
 * DE QUÉ COLOR ES CADA LETRA, por personaje (sobre los del jugador). Los
 * números son de la paleta de 48 y van por escalas, así la luz los mueve sin
 * inventar colores (ver engine/paleta.js).
 */
const PIELES = {
  clara: { P: 13, p: 12, q: 11, n: 17 },
  media: { P: 12, p: 11, q: 47, n: 13 },
  oscura: { P: 11, p: 47, q: 1, n: 12 },
};
/**
 * ⚠️ REGLA PARA EL SORTEO DE VARIANTES *(Santi: "el rubio nunca debe ir con piel
 * negra")*: estas combinaciones no salen nunca.
 */
/**
 * EL COLOR DE LA BARBA DE POCOS DÍAS: la piel en sombra (un paso más oscura
 * que su sombra), y en los rubios y canosos, el pelo en sombra.
 */
const BARBA_CORTA = {
  // [la sombra de la barba, la boca] según la piel; rubio y canas, más suaves.
  // 🔁 El rubio, dorado: con la sombra de la piel se fundía con la cara sin sombrero y sólo
  // resaltaba la boca, como un bigote clarito *(Santi; eligió dorado en clara y dorado oscuro en media)*.
  clara: { oscuro: [11, 47], rubio: [6, 5], canas: [15, 14] },
  media: { oscuro: [47, 32], rubio: [5, 4], canas: [15, 14] },
  oscura: { oscuro: [32, 0], rubio: [47, 32], canas: [14, 32] },   // 🔁 del negro cálido, no azulada
};
export function colorBarbaCorta(piel, pelo) {
  const t = BARBA_CORTA[piel];
  return pelo === 'rubio' ? t.rubio : pelo === 'canas' ? t.canas : t.oscuro;
}
export const NUNCA = [{ pelo: 'rubio', piel: 'oscura' }];
/**
 * CUÁNTO SALE CADA PIEL en el sorteo (P3b) *(Santi: "al ser una zona de
 * frontera (Texas o Arizona), debería haber más probabilidad de piel media y
 * oscura que piel clara")*. Propuesta de arranque, a confirmar.
 */
export const PESO_PIEL = { clara: 0.2, media: 0.4, oscura: 0.4 };
/**
 * 🆕 P3b · B1, EL SORTEO *(Santi: "primero quiero que metas las variantes con las
 * que no tienes que dibujar… y pone la probabilidad de las pieles"; la piel,
 * 20/40/40)*: cada guardia y cada pasajero sale con su aspecto, que no cambia en
 * todo el asalto. Sólo lo que ya está dibujado en las 5 vistas: piel, pelo,
 * peinado (se ve sin sombrero), sombrero y su color, y el pañuelo del civil.
 * Las barbas, la ropa y los cuerpos vienen después (B2-B4). Los guardias,
 * siempre con sombrero y el uniforme bordó.
 */
const PESO = {
  pelo: { negro: 0.35, castano: 0.35, rubio: 0.15, canas: 0.15 },
  peinado: { corto: 0.45, costado: 0.35, pelado: 0.2 },
  sombreroGuardia: { plano: 0.5, curvo: 0.5 },
  // 'ninguno': sin sombrero (no puede ser null: en la clave del dibujo guardado, null y "el de siempre" son lo mismo).
  sombreroPasajero: { bombin: 0.5, paja: 0.3, ninguno: 0.2 },
  colorSombrero: { negro: 0.5, marron: 0.5 },
  panuelo: { rojo: 0.2, azul: 0.2, ocre: 0.2, verde: 0.2, pardo: 0.2 },
  /**
   * 🆕 B2, LAS BARBAS *(Santi eligió la B de tres, igual para guardias y pasajeros, y
   * sumó la larga con 5)*: la larga sale del afeitado (25 → 20). Con canas, la larga
   * es más común: 25 (sale del afeitado, la de pocos días, el bigote y el candado).
   */
  /**
   * 🆕 B3, LA ROPA *(Santi: "Chaleco: 40, Tiradores: 30, Camisa: 30. Larga: 40.
   * Arremangada: 60. Si es de noche es al revés"; "los de chaleco también pueden tener
   * la camisa arremangada")*: la ropa, sólo el civil (el guardia, el chaleco de la
   * compañía); la manga, los dos, según la hora del asalto (ver fijarHoraDelSorteo).
   */
  ropa: { chaleco: 0.4, tiradores: 0.3, camisa: 0.3 },
  cuerpoBlindado: { normal: 0.5, anchos: 0.5 },   // 🆕 P3c: el blindado, mitad y mitad (Santi, la B)
  /** 🆕 B4: los cuerpos (la B: normal 55, gordito, flaco y hombros anchos 15 cada uno) y la chaqueta del guardia (1 de cada 2). */
  cuerpo: { normal: 0.55, gordito: 0.15, flaco: 0.15, anchos: 0.15 },
  chaqueta: 0.5,
  mangaDia: { larga: 0.4, arremangada: 0.6 },
  mangaNoche: { larga: 0.6, arremangada: 0.4 },
  barba: { afeitado: 0.2, completa: 0.3, bigote: 0.25, candado: 0.1, patillas: 0.1, larga: 0.05 },
  // 🆕 P4: el saco y el chaleco del rico.
  sacoRico: { negro: 0.4, gris: 0.35, marron: 0.25 },
  cuerpoEscolta: { anchos: 0.5, normal: 0.3, gordito: 0.2 },   // 🆕 P4: el guardaespaldas, más de hombros anchos
  chalecoRico: { crema: 0.6, perla: 0.4 },
  // 🆕 Los guantes del rico *(Santi: "los ricos civiles podrían llevar guantes… agregar al sorteo")*.
  guantesRico: { ninguno: 0.45, blancos: 0.35, grises: 0.2 },
  // 🆕 El rico: más bigote y candado que las demás *(Santi: "que se haga más común el bigote y el candado")*.
  barbaRico: { bigote: 0.35, candado: 0.3, afeitado: 0.1, completa: 0.1, patillas: 0.08, larga: 0.07 },
  barbaCanas: { afeitado: 0.15, completa: 0.25, bigote: 0.2, candado: 0.05, patillas: 0.1, larga: 0.25 },
};
function elegir(pesos, azar) {
  let r = azar(), ultimo = null;
  for (const [k, p] of Object.entries(pesos)) { ultimo = k; if ((r -= p) < 0) return k; }
  return ultimo;
}
export function sortearAspecto(tipo, azar = Math.random) {
  const a = { piel: elegir(PESO_PIEL, azar), peinado: elegir(PESO.peinado, azar) };
  do a.pelo = elegir(PESO.pelo, azar);
  while (NUNCA.some((n) => n.pelo === a.pelo && n.piel === a.piel));
  if (tipo === 'guardia' || tipo === 'blindado') a.sombrero = elegir(PESO.sombreroGuardia, azar);
  else if (tipo === 'pistolero') a.sombrero = 'plano';   // 🆕 P3c: el sombrero plano del pistolero
  else if (tipo === 'encargado') a.sombrero = 'gorra';   // 🆕 P3c: siempre con su gorra
  else if (tipo === 'rico') { a.sombrero = 'galera'; a.saco = elegir(PESO.sacoRico, azar); a.chaleco = elegir(PESO.chalecoRico, azar); a.guantes = elegir(PESO.guantesRico, azar); }
  else if (tipo === 'escolta') { a.sombrero = 'bombin'; a.colorSombrero = 'negro'; }      // 🆕 P4: el guardaespaldas
  else if (tipo === 'maquinista') a.sombrero = 'maquinista';
  else if (tipo === 'fogonero') a.sombrero = 'panuelo';
  else if (tipo === 'dinamitero') a.sombrero = 'minero';       // 🆕 siempre con su gorro de tela
  else if (tipo === 'bartender') a.sombrero = 'ninguno';       // 🆕 P4: el bartender, sin sombrero (el pelo, cualquiera *(Santi)*)
  else { a.sombrero = elegir(PESO.sombreroPasajero, azar); a.panuelo = elegir(PESO.panuelo, azar); }
  if (a.sombrero !== 'paja' && a.sombrero !== 'ninguno' && a.sombrero !== 'gorra' && a.sombrero !== 'galera' && a.sombrero !== 'minero' && a.sombrero !== 'maquinista' && a.sombrero !== 'panuelo' && tipo !== 'escolta') a.colorSombrero = elegir(PESO.colorSombrero, azar);
  a.barba = elegir(tipo === 'rico' ? PESO.barbaRico : a.pelo === 'canas' ? PESO.barbaCanas : PESO.barba, azar);
  if (tipo === 'pasajero') a.ropa = elegir(PESO.ropa, azar);
  // 🆕 P3c: el blindado, sólo normal u hombros anchos (Santi, la C).
  a.cuerpo = elegir(tipo === 'blindado' ? PESO.cuerpoBlindado : tipo === 'escolta' ? PESO.cuerpoEscolta : PESO.cuerpo, azar);
  if (tipo === 'dinamitero' || tipo === 'maquinista' || tipo === 'fogonero') a.cuerpo = 'normal';
  a.chaqueta = tipo === 'guardia' && azar() < PESO.chaqueta;
  // Con la chaqueta, la manga larga (la chaqueta tapa la camisa).
  // (🆕 El rico, de saco: siempre la manga larga.)
  a.arremangada = !a.chaqueta && tipo !== 'encargado' && tipo !== 'rico' && tipo !== 'escolta' && elegir(horaDelSorteo.dia ? PESO.mangaDia : PESO.mangaNoche, azar) === 'arremangada';
  if (tipo === 'dinamitero' || tipo === 'fogonero') a.arremangada = true;
  return a;
}
/** De día o de noche: la pone el asalto al empezar (de noche, más mangas largas). */
const horaDelSorteo = { dia: true };
export function fijarHoraDelSorteo(dia) { horaDelSorteo.dia = !!dia; }
/** El aspecto de alguien: se sortea la primera vez que se lo dibuja y queda guardado. */
export function aspectoDe(ent, tipo) {
  // 🆕 P3c: el Sheriff es siempre el mismo (sólo la barba se sortea, ver aspectoSheriff).
  return ent._aspecto || (ent._aspecto = tipo === 'sheriff' ? aspectoSheriff() : tipo === 'cazarrecompensas' ? aspectoCazador() : sortearAspecto(tipo));
}
const PELOS = {
  // 🔁 El negro cálido, marrón casi negro *(Santi eligió el 2 de tres; los negros
  // de la paleta tiran a violeta)*.
  negro: { A: 32, a: 0, B: 32 },
  castano: { A: 4, a: 3, B: 3 },
  rubio: { A: 6, a: 5, B: 5 },
  canas: { A: 15, a: 14, B: 14 },
};
/** Los tres colores de compañía que se prueban en la hoja: chaleco y pantalón. */
export const UNIFORMES = {
  gris: { U: 25, V: 24, v: 23, w: 31, I: 24, T: 23, t: 31 },
  verde: { U: 43, V: 27, v: 26, w: 42, I: 27, T: 26, t: 42 },
  bordo: { U: 10, V: 9, v: 8, w: 39, I: 24, T: 23, t: 31 },
};
/** El color de cada sombrero (el del guardia y el bombín, negros; el de paja, claro con cinta). */
const COLOR_SOMBRERO = {
  // 🔁 Negros neutros, de la escala de los grises *(Santi: "los sombreros parecen morados y no negros")*.
  // Con `colorSombrero: 'marron'`, marrón oscuro con la cinta crema (ver COLOR_MARRON).
  plano: { h: 23, H: 31, k: 0, x: 0, b: 32 },
  curvo: { h: 23, H: 31, k: 0, x: 0, b: 32 },
  bombin: { h: 23, H: 31, k: 0, x: 0, b: 32 },
  paja: { h: 38, H: 37, k: 6, x: 5, b: 33 },
  gorra: { h: 41, H: 18, k: 40, x: 0, b: 40 },
  alto: { h: 4, H: 3, k: 32, x: 0, b: 16 },
  galera: { h: 24, H: 31, k: 0, x: 0, b: 23 },   // 🆕 la del rico: negra, con la cinta apenas más clara
  maquinista: { h: 19, H: 30, k: 41, x: 0, b: 0 },   // 🚂 la gorra a rayas azules y blancas
  panuelo: { h: 9, H: 10, k: 8, x: 0, b: 39 },       // 🚂 el pañuelo colorado del fogonero
  minero: { h: 24, H: 23, k: 31, x: 0, b: 31 },   // 🆕 el gorro del Dinamitero: tela gris gastada
  ancho: { h: 33, H: 32, k: 0, x: 0, b: 8 },     // 🆕 el del Cazarrecompensas: negro pardo con la cinta roja     // 🆕 el del Sheriff: marrón oscuro con la cinta crema   // 🆕 la del Encargado: azul marino, cinta y visera oscuras
};
/** 🆕 La otra variante de los sombreros de fieltro: marrón oscuro con la cinta crema *(Santi)*. */
const COLOR_MARRON = { h: 4, H: 3, k: 32, x: 0, b: 16 };
const BASE = {
  // 🆕 El Dinamitero: la camisa gastada, el pantalón de trabajo, el cuero de los tiradores y la bandolera roja.
  // 🚂 El maquinista, de mameluco azul; el fogonero, de camiseta gris tiznada y pantalón oscuro.
  maquinista: { L: 25, C: 30, c: 24, U: 30, V: 30, v: 24, w: 24, y: 41, W: 1, G: 25, E: 30, e: 30, I: 19, T: 41, t: 18, J: 41, j: 18, 5: 10, 6: 9, 7: 8, 9: 28 },
  fogonero: { L: 24, C: 25, c: 23, U: 25, V: 25, v: 23, w: 23, y: 33, W: 1, G: 25, E: 25, e: 25, I: 33, T: 32, t: 0, J: 33, j: 32, 9: 23 },
  dinamitero: { L: 16, C: 15, c: 14, U: 16, V: 15, v: 14, w: 13, y: 33, W: 1, G: 25, E: 15, e: 15, I: 34, T: 33, t: 32, J: 32, j: 0, 9: 39 },
  guardia: {
    L: 17, C: 16, c: 15,                     // camisa clara
    y: 1, E: 45, e: 29, W: 1, G: 28,         // botones oscuros, la estrella de bronce con su brillo, cinto
  },
  // 🆕 P3c: el Sheriff: el guardapolvo de cuero marrón (Santi pasó la foto), el pañuelo gris, la estrella grande.
  sheriff: { U: 35, V: 34, v: 33, w: 32, y: 28, L: 35, C: 34, c: 33, S: 25, R: 24, r: 23, z: 31, E: 45, e: 29, W: 1, G: 28, I: 24, T: 23, t: 31 },
  // 🆕 P3c: el Pistolero.
  // De negro *(Santi eligió el negro de tres)*: chaleco gris oscuro de botones plateados, camisa rojo
  // vino, pañuelo negro y pantalón marrón: no se confunde con el guardia (bordó) ni con el civil (marrón).
  pistolero: { U: 24, V: 23, v: 31, w: 0, y: 25, L: 10, C: 9, c: 8, S: 31, R: 0, r: 0, z: 0, I: 34, T: 33, t: 32, W: 32, G: 25 },
  // 🆕 P3c: el Cazarrecompensas: chaleco de cuero negro con botones de plata, camisa clara, el pañuelo
  // rojo como la capa, pantalón gris oscuro.
  cazarrecompensas: { U: 33, V: 32, v: 0, w: 0, y: 25, L: 16, C: 15, c: 14, S: 10, R: 9, r: 8, z: 39, W: 1, G: 25, I: 24, T: 23, t: 31 },
  // 🆕 P3c: el blindado, el guardia con la placa de acero (ver PLACA_BLINDADO).
  blindado: {
    L: 17, C: 16, c: 15, y: 1, E: 45, e: 29, W: 1, G: 28,
    1: 25, 2: 24, 3: 23, 4: 31,              // el acero: luz, base, sombra, borde
  },
  // 🆕 P3c: el Encargado, de saco azul marino cerrado (también las mangas) con botones dorados; sin estrella.
  encargado: {
    U: 19, V: 41, v: 18, w: 40, y: 28,       // el saco y sus botones
    L: 19, C: 41, c: 18,                     // las mangas del saco
    E: 41, e: 41, W: 1, G: 28,               // (la estrella del tirado, tapada) el cinto
  },
  // 🆕 P4: el rico (ver torsoRico); el saco y el chaleco se sortean (SACOS_RICO, CHALECOS_RICO).
  rico: {
    // (Los botones oscuros y sólo la cadena dorada, `G`: todos dorados tapaban el chaleco crema.)
    L: 23, C: 31, c: 0, U: 17, V: 16, v: 15, w: 14, y: 31,
    z: 17, R: 30, S: 31, r: 16,             // el cuello blanco y la corbata negra
    W: 32, G: 28, I: 24, T: 23, t: 31,
    // 🆕 Los zapatos elegantes, negros y lustrados *(Santi: "unos mocasines o zapatos elegantes de la época")*.
    // (🔁 Negros del todo, con sólo el brillo: con el gris oscuro "parece parte del pantalón".)
    Q: 23, O: 0, o: 0, K: 0,
  },
  // 🆕 P4: el guardaespaldas (ver TORSOS.escolta): el saco y el pantalón negros, la camisa blanca.
  escolta: {
    L: 23, C: 31, c: 0, U: 30, V: 17, v: 16, w: 15, y: 31,
    z: 17, R: 30, S: 31, r: 16,             // el cuello blanco y la corbata negra
    W: 32, G: 25, I: 23, T: 31, t: 0,
  },
  // 🆕 P4: el bartender (ver TORSOS.bartender): la camisa y el delantal blancos, el chaleco negro, el moño.
  bartender: {
    // (🔁 El chaleco negro parejo, con los botones negros: con el lado de la luz gris y los
    // botones claros, el pecho se veía "gris manchado de pixeles blancos" *(Santi)*.)
    L: 30, C: 17, c: 16, U: 31, V: 31, v: 0, w: 0, y: 0,
    z: 16, R: 31, S: 0, r: 31,              // el moño negro
    W: 1, G: 25, I: 24, T: 23, t: 31,
  },
  pasajero: {
    L: 17, C: 16, c: 15,                     // camisa clara
    U: 35, V: 34, v: 33, w: 32, y: 1,        // chaleco marrón
    W: 1, G: 25,                             // cinto
    I: 24, T: 23, t: 31,                     // pantalón gris
  },
};

// ------------------------------------------------------------------ dibujo
/**
 * 🔁 P3a: LO DE CADA PERSONA, PARA PONER SOBRE EL ESQUELETO DEL JUGADOR. El
 * guardia y el pasajero usan el mismo cuerpo que el jugador (cuadroJugador en
 * jugador.js): los brazos, las armas dibujadas a mano en cada dirección, las
 * poses del revólver, la cruzada del rifle, los golpes y las piernas de 8
 * cuadros. Acá sólo se arma lo que va encima: los colores de cada letra, la
 * cabeza (cara, pañuelo, peinado, barba y sombrero, en ese orden) y el torso.
 *
 * `funda`: si lleva funda en la cadera (el guardia sí, el pasajero no). Sin
 * funda, de costado la funda está encima del pantalón: ahí se pinta pantalón;
 * en las otras vistas cuelga al costado y no se dibuja.
 */
/** Un mapa corrido un punto a la izquierda (atrás, mirando a la derecha). */
const atrasUno = (m) => m && { y: m.y, filas: m.filas.map((f) => (f.startsWith('.') ? f.slice(1) : f)) };
/** Cuánto más atrás va la cabeza de costado, en toda la gente (lo usa lo que va a la boca o al sombrero: se corre con ella). */
const CABEZA_ATRAS = 1;
/**
 * 🆕 B3: LA ROPA DEL CIVIL. `camisa`: el chaleco pasa a camisa, del mismo tono claro
 * que las mangas (si no, parecía un chaleco color hueso) y la línea de botones suave;
 * el cinto (la última fila) queda. `tiradores`: la camisa y dos tiras de cuero oscuro
 * de los hombros al cinto ([columna, de la fila, a la fila] por vista; de costado se
 * ve una; de espaldas se juntan en Y) *(Santi: "el otro debería ir un pixel más
 * abierto"; "el cinturón tiene que seguir estando")*.
 */
const A_CAMISA = { U: 'L', V: 'L', v: 'C', w: 'c', y: 'C' };
const TIRADORES = {
  frente: [[8, 8, 15], [12, 8, 15]],
  diagF: [[9, 8, 15], [12, 8, 15]],
  lado: [[9, 8, 15]],
  diagE: [[10, 8, 15], [12, 8, 15]],
  espalda: [[9, 8, 10], [12, 8, 10], [10, 11, 11], [11, 11, 11], [10, 12, 15]],
};
const torsosDeRopa = {};
function torsoConRopa(torso, vista, ropa) {
  const clave = vista + ropa;
  if (torsosDeRopa[clave]) return torsosDeRopa[clave];
  const ultima = torso.filas.length - 1;
  const filas = torso.filas.map((f, j) => (j === ultima ? f : f.replace(/[UVvwy]/g, (c) => A_CAMISA[c])).split(''));
  if (ropa === 'tiradores') for (const [x, y1, y2] of TIRADORES[vista]) for (let y = y1; y <= y2; y++) {
    const r = filas[y - torso.y];
    if (r && r[x] && r[x] !== '.') r[x] = y === y2 ? 'j' : 'J';
  }
  return (torsosDeRopa[clave] = { y: torso.y, filas: filas.map((r) => r.join('')) });
}
export function capasPersona({ tipo, vista, sombrero, piel = 'media', pelo = 'castano', uniforme = 'bordo', barba = null, peinado = 'corto', panuelo = 'azul', colorSombrero = 'negro', funda = tipo === 'guardia' || tipo === 'encargado' || tipo === 'blindado' || tipo === 'pistolero' || tipo === 'sheriff' || tipo === 'cazarrecompensas' || tipo === 'escolta', ropa = 'chaleco', saco = 'negro', chaleco = 'crema', guantes = 'ninguno', cartuchos = 4 }) {
  // `sombrero` null es sin sombrero; sin decir nada, el de cada uno.
  const s = sombrero === undefined ? (tipo === 'guardia' || tipo === 'blindado' || tipo === 'pistolero' ? 'plano' : tipo === 'encargado' ? 'gorra' : tipo === 'sheriff' ? 'alto' : tipo === 'cazarrecompensas' ? 'ancho' : tipo === 'rico' ? 'galera' : tipo === 'bartender' ? null : tipo === 'dinamitero' ? 'minero' : tipo === 'maquinista' ? 'maquinista' : tipo === 'fogonero' ? 'panuelo' : 'bombin') : sombrero === 'ninguno' ? null : sombrero;
  // (El Encargado: el pantalón de la compañía y encima su saco.)
  const colores = { ...(tipo === 'encargado' ? UNIFORMES[uniforme] : {}), ...BASE[tipo], ...(tipo === 'guardia' || tipo === 'blindado' ? UNIFORMES[uniforme] : {}), ...PIELES[piel], ...PELOS[pelo], ...(s ? (colorSombrero === 'marron' && s !== 'paja' ? COLOR_MARRON : COLOR_SOMBRERO[s]) : {}), ...(tipo === 'pasajero' ? COLORES_PANUELO[panuelo] : {}) };
  // 🧨 Los cartuchos de la bandolera: el que ya tiró deja la correa sola.
  if (tipo === 'dinamitero') for (let i = 0; i < 4; i++) colores[5 + i] = i < 4 - cartuchos ? 39 : 10;
  if (!funda) Object.assign(colores, vista === 'lado' ? { F: colores.I ?? C.I, f: colores.T ?? C.T } : { F: null, f: null });
  if (tipo === 'rico') Object.assign(colores, SACOS_RICO[saco] || SACOS_RICO.negro, CHALECOS_RICO[chaleco] || CHALECOS_RICO.crema, GUANTES_RICO[guantes] || {});
  const cabeza = [CABEZA[vista]];
  // (🆕 El guardaespaldas, sin el cuello alto *(Santi: "no queda muy bien con el arma")*.)
  if (tipo === 'pasajero' || tipo === 'pistolero' || tipo === 'sheriff' || tipo === 'cazarrecompensas' || tipo === 'rico' || tipo === 'bartender') cabeza.push(PANUELO[vista]);
  if (PEINADOS[peinado] && PEINADOS[peinado][vista]) cabeza.push(PEINADOS[peinado][vista]);
  // (La barba va en puntos finos, encima: ver barbaFina.)
  // El sombrero va aparte: con la cabeza gacha baja más que la cara y la tapa (ver `gacha` en jugador.js).
  const sombreroMapa = s && SOMBREROS[s] && SOMBREROS[s][vista] ? SOMBREROS[s][vista] : null;
  /**
   * 🔁 DE COSTADO, LA CABEZA UN PUNTO MÁS ATRÁS (P3b) *(Santi: "quiero ver si la
   * cabeza se puede centrar más en el torso para que no parezca encorvado";
   * "pasá un punto hacia atrás la cabeza"; "cambiáselo al pasajero también y a
   * partir de ahora todas las personas que dibujemos serán así")*: la cara, el
   * pelo, el pañuelo y el sombrero, centrados sobre el torso. Ver CABEZA_ATRAS.
   */
  const conRopa = tipo === 'pasajero' && ropa !== 'chaleco';
  const torso = conRopa ? torsoConRopa(TORSOS[tipo][vista], vista, ropa) : TORSOS[tipo][vista];
  if (ropa === 'tiradores') Object.assign(colores, { J: 32, j: 0 });
  if (vista === 'lado') return { colores, cabeza: cabeza.map(atrasUno), sombrero: atrasUno(sombreroMapa), torso };
  return { colores, cabeza, sombrero: sombreroMapa, torso };
}

/**
 * UN CUADRO DE ALGUIEN: lo de la persona (ver capasPersona) y la pose, con los
 * mismos nombres que el jugador: `vista`, `piernas` ('quieto', 'W0'…),
 * `arma`, `ang`, `empuna`, `golpe`, `enfundado`. Devuelve los índices,
 * la boca del caño y el hombro.
 */
/** El dormido de perfil (ver DORMIDO_LADO), con su sombrero en el banco al lado. */
function cuadroDormidoLado(o, apoyado = false) {
  const col = { ...C, ...capasPersona(o).colores };
  const idx = new Int16Array(ANCHO * ALTO).fill(-1);
  const poner = (x, y, i) => {
    if (i == null) return;
    x += OX; y += OY;
    if (x >= 0 && y >= 0 && x < ANCHO && y < ALTO) idx[y * ANCHO + x] = i;
  };
  for (const m of [apoyado ? DORMIDO_LADO_APOYADO : DORMIDO_LADO]) m.filas.forEach((f, j) => {
    for (let x = 0; x < f.length; x++) if (f[x] !== '.') poner(x, m.y + j, col[f[x]]);
  });
  if (!o.fino) {
    const lleno = idx.slice();
    for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
      if (lleno[y * ANCHO + x] >= 0) continue;
      const v = (a, b) => a >= 0 && b >= 0 && a < ANCHO && b < ALTO && lleno[b * ANCHO + a] >= 0;
      if (v(x - 1, y) || v(x + 1, y) || v(x, y - 1) || v(x, y + 1)) idx[y * ANCHO + x] = 0;
    }
  }
  return { idx, boca: null, hombro: null };
}

/**
 * 🆕 LA BARBA EN PUNTOS FINOS (P3b · B2) *(Santi eligió 1×1)*: `B` del color de la
 * barba (el pelo), `b` un tono más oscura; `X` la sombra de la de pocos días y `x`
 * la boca (ver colorBarbaCorta). Se pinta en la capa fina, encima de la grilla,
 * sólo sobre la cabeza (la cara o el pelo: no sobre un brazo o el arma). Devuelve
 * grupos { color, puntos } en puntos finos del lienzo (×3).
 */
function barbaFina(o, q) {
  const M = o.barba && BARBAS_FINAS[1][o.barba] && BARBAS_FINAS[1][o.barba][o.vista];
  if (!M || !q.cabeza) return null;
  const pelo = PELOS[o.pelo || 'castano'], piel = PIELES[o.piel || 'media'];
  const [sombra, boca] = colorBarbaCorta(o.piel || 'media', o.pelo || 'castano');
  const colores = { B: pelo.B, b: sombrear(pelo.B, -1), X: sombra, x: boca };
  const cara = new Set([piel.P, piel.p, piel.q, piel.n, pelo.A, pelo.a, pelo.B]);
  // La larga cae sobre el cuello y el pecho: también el pañuelo, la camisa y el chaleco.
  if (o.barba === 'larga') {
    const col = capasPersona(o).colores;
    for (const k of 'SRrzLCcUVvwy') if (col[k] != null) cara.add(col[k]);
  }
  const [ox, oy] = BARBAS_FINAS.origen[o.vista];
  const grupos = {}, vacios = {};
  M.forEach((f, j) => {
    for (let i = 0; i < f.length; i++) {
      const c = colores[f[i]];
      if (c == null) continue;
      const fx = (ox + q.cabeza[0] + OX) * 3 + i, fy = (oy + q.cabeza[1] + OY) * 3 + j;
      const k = Math.floor(fy / 3) * ANCHO + Math.floor(fx / 3);
      // 🔁 La larga también donde no hay nada (debajo del mentón, delante del cuello angosto):
      // si no, quedaba un hueco *(Santi: "un hueco de un pixel entre el mentón y el hombro")*.
      if (!cara.has(q.idx[k]) && !(o.barba === 'larga' && q.idx[k] < 0)) continue;
      if (q.idx[k] < 0) vacios[k] = (vacios[k] || 0) + 1;
      (grupos[c] || (grupos[c] = [])).push(fx, fy);
    }
  });
  // Los puntos vacíos que la barba cubre casi enteros pasan a ser barba en el dibujo (así el borde la rodea).
  for (const [k, n] of Object.entries(vacios)) if (n >= 5) q.idx[k] = colores.B;
  return Object.entries(grupos).map(([c, puntos]) => ({ color: +c, puntos }));
}

export function cuadroGente(o) {
  if (o.accion === 'dormido' && o.vista === 'lado') return cuadroDormidoLado(o, o.piernas === 'sentadoApoyado');
  /**
   * FUMANDO (ver FUMAR): `fuma` el cuadro (0-7) y `fumaModo` 'mano' o 'boca'
   * (con el arma larga). El pasajero sentado lo pide como acción ('fumar', `k`).
   * Si en esa vista no fuma con la mano (el de franco de espaldas), sigue con lo suyo.
   */
  const sentado = o.piernas === 'sentado' || o.piernas === 'sentadoApoyado';
  const fk = o.accion === 'fumar' ? o.k ?? 0 : o.fuma ?? null;
  const modo = o.accion === 'fumar' ? 'mano' : o.fumaModo || 'mano';
  const atras = o.vista === 'lado' ? CABEZA_ATRAS : 0;
  const PF0 = fk != null && modo === 'mano' ? poseFumar(o.vista, fk, { sentado, cartas: !!o.cartas, atras, mesa: !!o.mesa }) : null;
  const echado = o.recostado && o.vista === 'lado';
  const PF = echado && PF0 ? reclinar(PF0) : PF0;
  const FB0 = fk != null && modo === 'boca' ? FUMAR_BOCA[o.vista] : null;
  const FB = FB0 && atras ? { c: FB0.c && FB0.c.map(([x, y]) => [x - atras, y]), humo: [FB0.humo[0] - atras, FB0.humo[1]] } : FB0;
  // Lo que hace sentado (`accion`, ver poseSentado) se arma acá: así se guarda por nombre.
  const GP = o.pala != null && GOLPE_PALA[o.vista];
  let brazos = o.dinamita != null ? poseDinamita(o.vista, o.dinamita) : GP ? posePala(GP.hombros, GP.capa, GP.cuadros[o.pala]) : o.paleo != null ? posePala(GOLPE_PALA.lado.hombros, 'frente', PALEO[o.paleo], [1, 1, 0, 0, 0, 0, 0, 1][o.paleo]) : o.mandos != null ? poseMandos(o.mandos) : o.manos != null ? poseManos(o.vista, o.manos) : PF || (o.accion === 'fumar' ? poseSentado('quieto', o.vista, 0, 'maleta', !!o.mesa)
    : o.accion ? poseSentado(o.accion, o.vista, o.k, o.lleva, !!o.mesa)
      : fk != null && o.cartas ? 'cartas' : o.brazos);
  if (echado && brazos && typeof brazos === 'object' && brazos !== PF) brazos = reclinar(brazos);
  const persona0 = capasPersona(o);
  // (Una copia: capasPersona puede guardarla para los demás cuadros.)
  const persona = echado && persona0.torso ? { ...persona0, torso: torsoEchado(persona0.torso) } : persona0;
  // Agarrando el sombrero del banco: todavía no lo tiene puesto (está suelto, ver lienzoSombreroSuelto).
  if (brazos && brazos.sinSombrero) persona.sombrero = null;
  const forma = { cuerpo: o.cuerpo || 'normal', chaqueta: !!o.chaqueta, conChaleco: o.tipo !== 'dinamitero' && o.tipo !== 'maquinista' && o.tipo !== 'fogonero' && (o.tipo === 'guardia' || (o.ropa || 'chaleco') === 'chaleco'), estrella: o.tipo === 'guardia' || o.tipo === 'blindado' || o.tipo === 'sheriff',
    // 🆕 P3c: el Encargado, con el saco cerrado (sin la panza del chaleco abierto) y la correa cruzada.
    panza: o.tipo !== 'encargado' && o.tipo !== 'bartender' && o.tipo !== 'dinamitero' && o.tipo !== 'maquinista' && o.tipo !== 'fogonero', correa: o.tipo === 'encargado' ? correaEncargado(o.vista) : null };
  const q0 = cuadroJugador({ piernas: 'quieto', ang: 0, ...o, brazos, persona, forma });
  if (o.tipo === 'sheriff') q0.idx = sacoSinHuecos(q0.idx, o.vista, /^R/.test(o.piernas || ''));
  if (o.tipo === 'rico') q0.idx = sacoSinHuecos(q0.idx, o.vista, /^R/.test(o.piernas || ''), { ...C, ...persona.colores }, ['L', 'C', 'c']);
  if (o.tipo === 'escolta') q0.idx = camisaRecta(q0, persona.colores, o.vista, o.cuerpo);
  if (o.tipo === 'cazarrecompensas') q0.idx = capaCazador(q0.idx, o.vista, o.piernas || '');
  if (o.tipo === 'bartender' && o.cuerpo === 'gordito') q0.idx = bartenderGordito(q0, o.vista);
  if (o.tipo === 'bartender' && (o.vista === 'espalda' || o.vista === 'diagE')) q0.idx = delantalEntrePiernas(q0, o.vista);
  if (o.tipo === 'bartender') q0.idx = sinSueltos(q0.idx);
  /**
   * 🆕 SENTADO A LA MESA DEL COMEDOR: lo que cae debajo de la tapa (las piernas, desde la columna `mesa`
   * y de la fila 16 para abajo) no se dibuja. Él va encima de la mesa (así se le ven los brazos
   * apoyados) y la mesa le tapa las piernas.
   */
  if (o.mesa) {
    q0.idx = q0.idx.slice();
    for (let y = OY + 16; y < ALTO; y++) for (let x = OX + o.mesa; x < ANCHO; x++) q0.idx[y * ANCHO + x] = -1;
    // (🆕 Lo que está sobre la mesa —el plato, el jarro, la cuchara en el plato— va encima: no se corta.)
    const sobre = brazos && brazos.props ? brazos.props.filter((p) => p.sobreMesa) : [];
    for (const p of sobre) p.m.filas.forEach((fila, j) => { for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') q0.idx[(OY + 4 + p.m.y + j) * ANCHO + OX + x] = p.tabla[fila[x]]; });
  }
  // 🆕 El borde fino entre el brazo y el cuerpo (ver bordeBrazos en jugador.js).
  const borde = bordeBrazos(q0);
  const barba = barbaFina(o, q0);
  const q = { ...q0, finos: borde ? [...(barba || []), { color: 0, puntos: borde, fijo: true }] : barba };
  const F = PF || FB;
  if (!F) return q;
  // El cigarrillo, encima de todo (el papel crema y la brasa); el humo y el brillo, en el mundo.
  const baja = sentado ? 4 : 0;
  const cig = PF ? PF.cig : FB.c;
  const pita = fk === 5 || fk === 6;
  const en = ([x, y]) => [x + OX, y + OY + baja];
  if (cig) {
    const [p, a] = cig.map(en);
    if (o.tipo === 'rico') {
      /**
       * 🆕 EL PURO DEL RICO, distinto del cigarrillo *(Santi: "el puro se tiene que ver diferente al
       * cigarro")*: un punto más largo (sigue la línea del cigarrillo), marrón tabaco en vez del papel
       * crema, y la punta de ceniza gris que sólo se pone naranja cuando pita.
       */
      const e = [2 * a[0] - p[0], 2 * a[1] - p[1]];
      q.idx[p[1] * ANCHO + p[0]] = 5;
      q.idx[a[1] * ANCHO + a[0]] = 5;
      q.idx[e[1] * ANCHO + e[0]] = pita ? 45 : 24;
      return { ...q, brasa: pita ? e : null, humo: en(F.humo), fumaK: fk, pita };
    }
    q.idx[p[1] * ANCHO + p[0]] = 17;
    q.idx[a[1] * ANCHO + a[0]] = pita ? 45 : 44;
  }
  return { ...q, brasa: cig ? en(cig[1]) : null, humo: en(F.humo), fumaK: fk, pita };
}

/**
 * 🆕 EL RICO ECHADO HACIA ATRÁS EN SU SILLÓN, despierto, como cuando duerme *(Santi: "que en las poses
 * esté tirado hacia atrás como cuando duerme")*: el torso apoyado en el respaldo, en diagonal, de la cadera
 * (que no se mueve) a los hombros, cuatro puntos más atrás (`RECLINA`, fila por fila del torso), y la
 * cabeza con ellos. Los brazos y lo que tiene en la mano (el diario, el cigarrillo) se corren con la fila
 * del torso a la que están pegados: siguen siendo las mismas poses, echadas atrás. Sólo de costado.
 */
const RECLINA = [-4, -4, -3, -3, -2, -2, -1, -1, 0];
// (Lo que está a la altura de la cara —la mano en la boca, la copa, el puro— va con la cabeza, un punto más.)
const reclinaEn = (y) => (y < 8 ? RECLINA[0] - 1 : RECLINA[Math.min(RECLINA.length - 1, y - 8)]);
function correrFila(fila, d) {
  if (d >= 0) return '.'.repeat(d) + fila;
  let i = 0; while (i < -d && fila[i] === '.') i++;
  return fila.slice(i);
}
/**
 * 🔁 EL TORSO ECHADO, SIN ADELGAZAR *(Santi: "el torso se hizo más flaco al estar echado… el dormido se
 * ve bien")*: en diagonal, el mismo ancho por fila se ve más angosto. Como el dormido (6 y 7 puntos de
 * ancho), cada fila suma un punto de espalda (su primer color, atrás) y las del pecho, uno de saco en el
 * medio. La diagonal ya viene en `recline` (las filas se corren al dibujarlo).
 */
function torsoEchado(T) {
  return mapa(T.y, T.filas.map((f, j) => {
    let i = 0; while (i < f.length && f[i] === '.') i++;
    if (i >= f.length || i === 0) return f;
    let r = f.slice(0, i - 1) + f[i] + f.slice(i);
    if (j < 8 && r[i + 1] === 'C') r = r.slice(0, i + 1) + 'C' + r.slice(i + 1);
    return r;
  }));
}
function reclinar(B) {
  const pt = ([x, y]) => [x + reclinaEn(y), y];
  // (🔁 La cabeza, un punto más atrás que los hombros *(Santi: "tira hacia atrás la cabeza un pixel")*.)
  const out = { ...B, recline: RECLINA, cabezaX: (B.cabezaX || 0) + RECLINA[0] - 1 };
  if (B.lista) out.lista = B.lista.map((b) => ({ ...b, p: b.p.map(pt) }));
  if (B.props) out.props = B.props.map((p) => ({ ...p, m: mapa(p.m.y, p.m.filas.map((f, j) => correrFila(f, reclinaEn(p.m.y + j)))) }));
  if (B.cig) out.cig = B.cig.map(pt);
  if (B.humo) out.humo = pt(B.humo);
  return out;
}

// ------------------------------------------------- lo que hacen sentados
/**
 * 🆕 LO QUE HACEN LOS PASAJEROS SENTADOS (P3a) *(Santi: "cuando sea de día y
 * vayan sentados tengan algunos movimientos como mirar por la ventana,
 * revisar su equipaje (bolso, maleta), leer el diario, barajar un mazo de
 * cartas para cortar el aburrimiento")*. Cada una en 8 cuadros, puestos a mano
 * en las tres vistas en que se sientan (de costado en el vagón de pasajeros;
 * de frente y de espaldas en el dormitorio): dónde van los brazos (hombro →
 * codo → mano) y la cosa que tienen (el diario, el mazo, la maleta o el bolso).
 * Mirar por la ventana no tiene dibujo propio: se dan vuelta hacia el vidrio
 * (ver drawPassenger).
 *
 *  diario   0 en la falda, 1 lo levanta, 2-4 lee (sube y baja apenas), 5 da
 *           vuelta la hoja, 6 lee, 7 lo baja.
 *  barajar  0 el mazo junto, 1 lo abre en dos, 2 las cartas caen de una mano a
 *           la otra; y otra vez (3-5); 6-7 lo junta.
 *  equipaje la maleta o el bolso en el piso, al lado: 0 sentado, 1 se agacha,
 *           2 la abre, 3-5 revuelve adentro (la mano va y viene), 6 la cierra,
 *           7 vuelve.
 *  dormido  sentado, los brazos cruzados y la cabeza caída (no se mueve: el
 *           que duerme lleva la "z" encima). `quieto`: igual pero despierto.
 */
const PAPEL = { P: 17, p: 16, l: 24 };
const NAIPES = { L: 30, k: 9 };
const CUERO_MALETA = { J: 35, M: 34, m: 33, h: 32, n: 31, y: 28 };
const CUERO_BOLSO = { J: 5, M: 4, m: 3, h: 32, n: 31, y: 28 };
const b = (p, atras) => ({ p, atras });
const POSES_SENTADO = {
  diario: {
    lado: {
      regazo: { lista: [b([[10, 9], [11, 12], [12, 14]]), b([[9, 9], [10, 12], [13, 14]], true)], papel: mapa(14, ['............pPPPp']) },
      medio: { lista: [b([[10, 9], [11, 12], [12, 11]]), b([[9, 9], [10, 12], [13, 11]], true)], papel: mapa(9, ['.............PP', '.............Pl', '.............PP', '.............Pl', '.............pp']) },
      arriba: { lista: [b([[10, 9], [11, 12], [12, 9]]), b([[9, 9], [10, 11], [13, 8]], true)], papel: mapa(4, ['.............PP', '.............Pl', '.............PP', '.............Pl', '.............PP', '.............Pl', '.............PP', '.............pp']) },
      hoja: { lista: [b([[10, 9], [11, 12], [12, 9]]), b([[9, 9], [10, 11], [14, 7]], true)], papel: mapa(4, ['.............PPPP', '.............PlPl', '.............PPPP', '.............PlPl', '.............PPPP', '.............PlPl', '.............PPpp', '.............pp']) },
    },
    frente: {
      regazo: { lista: [b([[7, 9], [7, 12], [8, 15]]), b([[13, 9], [13, 12], [11, 15]])], papel: mapa(16, ['........PPPP']) },
      medio: { lista: [b([[7, 9], [5, 12], [5, 11]]), b([[13, 9], [15, 12], [14, 11]])], papel: mapa(10, ['.......PPPPPPP', '.......PlllllP', '.......PPPPPPP', '.......PlllllP', '.......ppppppp']) },
      arriba: { lista: [b([[7, 9], [4, 11], [4, 8]]), b([[13, 9], [16, 11], [15, 8]])], papel: mapa(5, ['......PPPPPPPPP', '......PlllPlllP', '......PPPPPPPPP', '......PlllPlllP', '......PPPPPPPPP', '......PlllPlllP', '......PPPPPPPPP', '......PlllPlllP', '......ppppppppp']) },
      hoja: { lista: [b([[7, 9], [4, 11], [4, 8]]), b([[13, 9], [16, 11], [15, 7]])], papel: mapa(5, ['......PPPPPPPpp', '......PlllPlppP', '......PPPPPPpPP', '......PlllPlplP', '......PPPPPPpPP', '......PlllPlplP', '......PPPPPPpPP', '......PlllPlplP', '......ppppppppp']) },
    },
    espalda: {
      regazo: { lista: [b([[13, 9], [14, 12], [13, 14]]), b([[6, 9], [5, 12], [6, 14]])] },
      medio: { lista: [b([[13, 9], [15, 12], [14, 11]]), b([[6, 9], [4, 12], [5, 11]])] },
      // De espaldas, el diario abierto delante de la cara asoma a los dos lados de la cabeza y por encima de los hombros.
      arriba: { lista: [b([[13, 9], [16, 10], [17, 7]]), b([[6, 9], [3, 10], [2, 7]])], papel: mapa(3, ['..pPPPPPPPPPPPPPPp', '..pPlllPPPPPPlllPp', '..pPPPPPPPPPPPPPPp', '..pPlllPPPPPPlllPp', '..pPPPPPPPPPPPPPPp', '..pPlllPPPPPPlllPp', '..pppppppppppppppp']), fondo: true },
      hoja: { lista: [b([[13, 9], [16, 10], [17, 6]]), b([[6, 9], [3, 10], [2, 7]])], papel: mapa(3, ['..pPPPPPPPPPPPPPpp', '..pPlllPPPPPPllppP', '..pPPPPPPPPPPPPpPP', '..pPlllPPPPPPllpPP', '..pPPPPPPPPPPPPpPP', '..pPlllPPPPPPllpPP', '..pppppppppppppppp']), fondo: true },
    },
  },
  barajar: {
    lado: {
      junto: { lista: [b([[10, 9], [11, 12], [13, 13]]), b([[9, 9], [10, 12], [12, 12]], true)], cartas: mapa(11, ['.............Lk', '.............LL']) },
      abierto: { lista: [b([[10, 9], [12, 12], [15, 13]]), b([[9, 9], [10, 12], [11, 12]], true)], cartas: mapa(11, ['...........LL..Lk', '...........LL..LL']) },
      cayendo: { lista: [b([[10, 9], [12, 12], [15, 13]]), b([[9, 9], [10, 12], [11, 12]], true)], cartas: mapa(10, ['.............L', '...........LL..Lk', '...........LL..LL']) },
    },
    frente: {
      junto: { lista: [b([[7, 9], [7, 12], [8, 14]]), b([[13, 9], [13, 12], [11, 14]])], cartas: mapa(12, ['.........LkL', '.........LLL']) },
      abierto: { lista: [b([[7, 9], [6, 12], [6, 14]]), b([[13, 9], [14, 12], [13, 14]])], cartas: mapa(12, ['......LL.....LL', '......Lk.....LL']) },
      cayendo: { lista: [b([[7, 9], [6, 12], [6, 14]]), b([[13, 9], [14, 12], [13, 14]])], cartas: mapa(11, ['.........LL', '......LL.....LL', '......Lk.....LL']) },
    },
    espalda: {
      junto: { lista: [b([[13, 9], [14, 12], [13, 14]]), b([[6, 9], [5, 12], [6, 14]])] },
      abierto: { lista: [b([[13, 9], [15, 12], [14, 14]]), b([[6, 9], [4, 12], [5, 14]])] },
      cayendo: { lista: [b([[13, 9], [15, 12], [14, 14]]), b([[6, 9], [4, 12], [5, 14]])] },
    },
  },
  equipaje: {
    lado: {
      quieto: { lista: [b([[10, 9], [11, 12], [13, 14]]), b([[9, 9], [10, 12], [12, 13]], true)] },
      baja: { lista: [b([[10, 9], [13, 13], [16, 16]]), b([[9, 9], [10, 12], [12, 13]], true)], inclina: 1, cabeza: 1 },
      abre: { lista: [b([[10, 9], [13, 13], [17, 17]]), b([[9, 9], [10, 12], [12, 13]], true)], inclina: 1, cabeza: 1 },
      adentro: { lista: [b([[10, 9], [14, 14], [18, 18]]), b([[9, 9], [10, 12], [12, 13]], true)], inclina: 1, cabeza: 1 },
      adentro2: { lista: [b([[10, 9], [14, 14], [19, 18]]), b([[9, 9], [10, 12], [12, 13]], true)], inclina: 1, cabeza: 1 },
    },
    frente: {
      quieto: { lista: [b([[7, 9], [7, 12], [8, 15]]), b([[13, 9], [13, 12], [11, 15]])] },
      baja: { lista: [b([[7, 9], [7, 12], [8, 15]]), b([[13, 9], [15, 12], [16, 15]])], cabeza: 1 },
      abre: { lista: [b([[7, 9], [7, 12], [8, 15]]), b([[13, 9], [15, 12], [16, 16]])], cabeza: 1 },
      adentro: { lista: [b([[7, 9], [7, 12], [8, 15]]), b([[13, 9], [16, 13], [16, 17]])], cabeza: 1 },
      adentro2: { lista: [b([[7, 9], [7, 12], [8, 15]]), b([[13, 9], [16, 13], [18, 17]])], cabeza: 1 },
    },
    espalda: {
      quieto: { lista: [b([[13, 9], [14, 12], [13, 14]]), b([[6, 9], [5, 12], [6, 14]])] },
      baja: { lista: [b([[13, 9], [15, 12], [16, 15]]), b([[6, 9], [5, 12], [6, 14]])], cabeza: 1 },
      abre: { lista: [b([[13, 9], [15, 12], [16, 16]]), b([[6, 9], [5, 12], [6, 14]])], cabeza: 1 },
      adentro: { lista: [b([[13, 9], [16, 13], [16, 17]]), b([[6, 9], [5, 12], [6, 14]])], cabeza: 1 },
      adentro2: { lista: [b([[13, 9], [16, 13], [18, 17]]), b([[6, 9], [5, 12], [6, 14]])], cabeza: 1 },
    },
  },
  // 🔁 Dormido *(Santi: "cuando duermen sentados no tienen una pose clara")*: echado
  // contra el respaldo (de costado el torso un punto para atrás), la cabeza caída
  // sobre el pecho (dos puntos abajo; de costado, hacia adelante, y en las otras
  // vistas, ladeada) y los brazos cruzados.
  /**
   * 🆕 AL DESPERTARSE (de costado, 0,6 s): agarra el sombrero del banco (la mano
   * de acá, hacia el almohadón donde está) y se lo pone (la mano en el ala).
   */
  agarraSombrero: { lado: { lista: [b([[10, 9], [12, 12], [13, 15]]), b([[9, 9], [10, 12], [12, 13]], true)], sinSombrero: true } },
  agarraSombreroArriba: { lado: { lista: [b([[10, 9], [12, 7], [13, 4]]), b([[9, 9], [10, 12], [12, 13]], true)], sinSombrero: true } },
  poneSombrero: { lado: { lista: [b([[10, 9], [12, 6], [11, 2]]), b([[9, 9], [10, 12], [12, 13]], true)] } },
  dormido: {
    // 🔁 Mirando para abajo, a las rodillas *(Santi: "que sus ojos apunten a sus
    // rodillas")*: el sombrero baja más que la cabeza (`gacha`, [abajo, adelante])
    // y el ala le tapa la cara; de costado se va además para adelante.
    lado: { lista: [b([[10, 9], [11, 12], [12, 13]]), b([[9, 9], [10, 12], [12, 12]], true)], cabeza: 2, cabezaX: 2, inclina: -1, gacha: [2, 1] },
    frente: { lista: [b([[7, 9], [7, 12], [10, 13]]), b([[13, 9], [13, 12], [9, 14]])], cabeza: 2, cabezaX: 1, gacha: [2, 0] },
    espalda: { lista: [b([[13, 9], [14, 12], [12, 13]]), b([[6, 9], [5, 12], [7, 13]])], cabeza: 2, cabezaX: -1, gacha: [1, 0] },
    diagF: { lista: [b([[7, 9], [8, 13], [10, 14]]), b([[13, 9], [13, 12], [12, 13]], true)], cabeza: 2, cabezaX: 1, inclina: -1, gacha: [2, 1] },
    diagE: { lista: [b([[13, 9], [14, 12], [13, 14]]), b([[6, 9], [5, 12], [7, 13]], true)], cabeza: 2, cabezaX: 1, inclina: -1, gacha: [1, 1] },
  },
};
/**
 * 🔁 DORMIDO SENTADO, DE PERFIL, dibujado entero a mano sobre la silueta que
 * aprobó Santi *(Santi: "piernas normales, pero el torso y la cabeza tirados
 * hacia atrás para apoyarse en el respaldo, dejando un hueco de aire entre la
 * espalda del personaje y el asiento"; "que el sombrero esté ahí a su lado y que
 * no lo tenga puesto… cuando se levanta, se lo pone")*: la cadera un poco
 * adelante, el torso echado atrás en diagonal (la espalda apoya sólo arriba y
 * queda la cuña de aire), la cabeza apoyada atrás con la cara mirando para
 * arriba y la nariz que sobresale, los brazos cruzados, las piernas de sentado.
 * El sombrero, apoyado en el banco al lado, en el hueco de la espalda. Los sentados
 * sólo miran a la derecha (los asientos del vagón de pasajeros): no hacen falta
 * otras vistas.
 */
const DORMIDO_LADO = mapa(6, [
  '..................',
  '...aAAa',
  '..aAAAPp',
  '..aAAPPPn',
  '...aPPPq',
  '...qpPq',
  '....pRRS',
  '....UVVVv',
  '....UVVVVv',
  '.....UVVVVv',
  '.....ULCCCcP',
  '......UCCCcPp',
  '......VVVvw',
  '.......VVVvw',
  '.......WWyWG',
  '........IIIIIIIIT',
  '........tTTTTTTTT',
  '..............ITt',
  '..............ITt',
  '.............QOOOO',
  '.............KKKKK',
]);
/**
 * 🆕 Y EL RICO, DORMIDO CON LOS PIES EN EL BANQUITO (ver `sentadoApoyado` en jugador.js): el mismo,
 * con la pierna derecha hacia adelante y el zapato parado.
 */
const DORMIDO_LADO_APOYADO = mapa(6, [
  ...DORMIDO_LADO.filas.slice(0, 11),
  DORMIDO_LADO.filas[11].padEnd(20, '.') + 'OK',
  DORMIDO_LADO.filas[12].padEnd(20, '.') + 'OQK',
  DORMIDO_LADO.filas[13].padEnd(20, '.') + 'OOK',
  DORMIDO_LADO.filas[14].padEnd(12, '.') + 'tttttttt' + 'OOK',
  '........IIIIIIIIIIIIIOK',
  '........tTTTTTTTTTTTTOK',
]);
/** Su sombrero, apoyado en el banco al lado (el bombín de costado). */
/**
 * 🔁 SU SOMBRERO, APOYADO EN EL OTRO LUGAR DEL BANCO *(Santi: "que no quede encima
 * del respaldo y que parezca que está junto al personaje")*: cada banco tiene dos
 * lugares (uno arriba y otro abajo) y él ocupa uno; el sombrero va en el
 * almohadón del otro. Es un dibujo suelto (ver `lienzoSombreroSuelto`): el
 * bombín de costado, con la base en (3, 3).
 */
/**
 * 🆕 B6 · EL DE PAJA TAMBIÉN *(Santi eligió la B)*: visto en tres cuartos, un poco desde
 * arriba: la copa, el ala de atrás asomando a los costados, la cinta y el ala de adelante
 * (su cara de arriba, a la luz). La luz, arriba a la izquierda.
 */
const SOMBRERO_SUELTO = {
  bombin: mapa(0, ['..hHk', '.hHHHk', '.bbbbb', 'hHHHHHk']),
  // 🆕 La galera del rico, parada en el piso al lado de su sillón mientras duerme *(Santi)*.
  galera: mapa(0, ['.hHHHk', '.hHHHk', '.hHHHk', '.hHHHk', '.hHHHk', '.bbbbb', 'hHHHHHk']),
  paja: mapa(0, ['.....hHHk.....', '..hhhHHHHkkk..', 'hhhhbbbbbbkkkk', '.hhHHHHHHHkkk.']),
};

/**
 * 🆕 EL SOMBRERO VISTO DESDE ARRIBA, sobre la cara del que duerme acostado en el banco del comedor
 * *(Santi: "el sombrero tiene que estar visto desde arriba y taparle la cara")*: la copa redonda y el
 * ala alrededor (el bombín, de ala angosta; el de paja, ancha, con la cinta). La luz, arriba a la
 * izquierda.
 */
const SOMBRERO_ARRIBA = {
  bombin: mapa(0, ['..kkkkk..', '.kHHHHHk.', 'kHhhHHHHk', 'kHhHHHHHk', 'kHHHHHHkk', '.kHHHHkk.', '..kkkkk..']),
  paja: mapa(0, ['....hhhhh....', '..hhhhhhhhh..', '.hhhHHHHHhhh.', 'hhhHbbbbbHhhk', 'hhhHbHHHbHhhk', 'hhhHbbbbbHhkk', '.hhhHHHHHhhk.', '..hhhhhhhkk..', '....kkkkk....']),
};

/** La maleta y el bolso, en el piso al lado (`[cerrada, abierta]`), por vista. */
const EQUIPAJE = {
  maleta: {
    lado: [mapa(21, ['...................hh', '.................MMMMMM', '.................JJyJJJ', '.................MMMMMM', '.................MMMMMM', '.................mmmmmm']),
      mapa(18, ['.................J', '.................JM', '.................JM', '.................JM', '.................nnnnnn', '.................MMMMMM', '.................MMyMMM', '.................MMMMMM', '.................mmmmmm'])],
    frente: [mapa(21, ['................hh', '...............MMMMMM', '...............JJyJJJ', '...............MMMMMM', '...............MMMMMM', '...............mmmmmm']),
      mapa(19, ['...............JJJJJJ', '...............JMMMMJ', '...............JJJJJJ', '...............nnnnnn', '...............MMMMMM', '...............MMyMMM', '...............MMMMMM', '...............mmmmmm'])],
  },
  bolso: {
    lado: [mapa(22, ['..................hh', '.................MMMM', '.................JyJJ', '.................MMMM', '.................mmmm']),
      mapa(21, ['.................J..J', '.................JnnJ', '.................MMMM', '.................MyMM', '.................MMMM', '.................mmmm'])],
    frente: [mapa(22, ['................hh', '...............MMMM', '...............JyJJ', '...............MMMM', '...............mmmm']),
      mapa(21, ['...............J..J', '...............JnnJ', '...............MMMM', '...............MyMM', '...............MMMM', '...............mmmm'])],
  },
};
/**
 * 🆕 A LA MESA DEL COMEDOR, DE COSTADO *(Santi: "las poses actuales se deberían ajustar para que los
 * brazos la hagan encima de la mesa… ajustar los brazos solamente")*: las mismas poses, con los brazos
 * hacia adelante sobre la mesa. Sentado el cuerpo baja 4, y la tapa de la mesa queda en la fila 11 (15
 * en el dibujo); su borde, unos 4 puntos delante de la cadera. Lo de las piernas que cae debajo de la
 * mesa no se dibuja (ver `mesa` en cuadroGente).
 */
const POSES_MESA = {
  quieto: { lista: [b([[10, 9], [12, 11], [16, 11]]), b([[9, 9], [11, 11], [15, 11]], true)] },
  diario: {
    regazo: { lista: [b([[10, 9], [12, 11], [15, 11]]), b([[9, 9], [11, 11], [18, 11]], true)], papel: mapa(10, ['..............pPPPPp']) },
    medio: { lista: [b([[10, 9], [13, 11], [14, 9]]), b([[9, 9], [12, 11], [15, 9]], true)], papel: mapa(6, ['..............PP', '..............Pl', '..............PP', '..............Pl', '..............pp']) },
    arriba: { lista: [b([[10, 9], [13, 11], [13, 7]]), b([[9, 9], [12, 11], [14, 6]], true)], papel: mapa(3, ['..............PP', '..............Pl', '..............PP', '..............Pl', '..............PP', '..............Pl', '..............PP', '..............pp']) },
    hoja: { lista: [b([[10, 9], [13, 11], [13, 7]]), b([[9, 9], [12, 11], [15, 5]], true)], papel: mapa(3, ['..............PPPP', '..............PlPl', '..............PPPP', '..............PlPl', '..............PPPP', '..............PlPl', '..............PPpp', '..............pp']) },
  },
  barajar: {
    junto: { lista: [b([[10, 9], [12, 11], [15, 11]]), b([[9, 9], [11, 11], [16, 11]], true)], cartas: mapa(10, ['...............Lk', '...............LL']) },
    abierto: { lista: [b([[10, 9], [12, 11], [15, 11]]), b([[9, 9], [11, 11], [18, 11]], true)], cartas: mapa(10, ['...............LL.Lk', '...............LL.LL']) },
    cayendo: { lista: [b([[10, 9], [12, 11], [15, 11]]), b([[9, 9], [11, 11], [18, 11]], true)], cartas: mapa(9, ['................L', '...............LL.Lk', '...............LL.LL']) },
  },
};
/**
 * 🆕 COMER Y TOMAR DEL JARRO, A LA MESA DEL COMEDOR *(Santi eligió: cuchara y plato hondo de lata; come
 * con pausas, mastica; el jarro, cosa aparte, y el que come toma un trago cada tanto)*. El plato y el
 * jarro están sobre la mesa, delante de él (`sobreMesa`: no los corta la mesa, ver cuadroGente); la
 * cuchara y el jarro, en la mano cuando los levanta.
 */
const LATA_MESA = { b: 20, w: 17, s: 16, c: 3, h: 4 };
const PLATO_MESA = { m: mapa(12, ['.................bbbbb', '................bwchcwb', '................bwhchwb', '.................bbbbb']), tabla: LATA_MESA, sobreMesa: true };
const JARRO_MESA = { m: mapa(8, ['.......................bbb', '.......................wwwb', '.......................swwb', '.......................sww']), tabla: LATA_MESA, sobreMesa: true };
const cuchara = (y, fila, sobreMesa = false) => ({ m: mapa(y, [fila]), tabla: LATA_MESA, sobreMesa });
const OTRA_PLATO = b([[9, 9], [12, 11], [16, 11]], true);
const OTRA_JARRO = b([[9, 9], [11, 11], [15, 11]], true);
POSES_MESA.comer = {
  carga: { lista: [b([[10, 9], [13, 11], [18, 11]]), OTRA_PLATO], props: [PLATO_MESA, JARRO_MESA, cuchara(13, '....................s', true)] },
  sube: { lista: [b([[10, 9], [15, 11], [16, 8]]), OTRA_PLATO], props: [PLATO_MESA, JARRO_MESA, cuchara(7, '..............ss')] },
  boca: { lista: [b([[10, 9], [15, 10], [14, 6]]), OTRA_PLATO], props: [PLATO_MESA, JARRO_MESA, cuchara(6, '.............s')] },
  mastica: { lista: [b([[10, 9], [13, 11], [17, 11]]), OTRA_PLATO], props: [PLATO_MESA, JARRO_MESA, cuchara(13, '...................s', true)] },
  mastica1: { lista: [b([[10, 9], [13, 11], [17, 11]]), OTRA_PLATO], props: [PLATO_MESA, JARRO_MESA, cuchara(13, '...................s', true)], cabeza: 1 },
};
POSES_MESA.jarro = {
  apoya: { lista: [b([[10, 9], [14, 11], [21, 9]]), OTRA_JARRO], props: [PLATO_MESA, JARRO_MESA] },
  sube: { lista: [b([[10, 9], [15, 11], [16, 8]]), OTRA_JARRO], props: [PLATO_MESA, { m: mapa(6, ['..................bbb', '..................wwwb', '..................swwb', '..................sww']), tabla: LATA_MESA }] },
    // (La cabeza, un punto hacia atrás *(Santi)*. Probamos que mirara hacia arriba —girada por código,
    // como imagen y dibujada a mano— y en la grilla se veía mal: "que no mire hacia arriba".)
    boca: { lista: [b([[10, 9], [14, 9], [12, 5]]), OTRA_JARRO], props: [PLATO_MESA, { m: mapa(4, ['............bwww', '............bwwws', '.............www']), tabla: LATA_MESA }], cabezaX: -1 },
};

/** Fumar a la mesa: la mano descansa sobre la mesa y, al pitar, el codo queda apoyado. */
const FUMAR_MESA = {
  abajo: [[10, 9], [12, 11], [15, 11]], sube: [[10, 9], [13, 11], [14, 8]], boca: [[10, 9], [13, 11], [13, 6]],
  c: { abajo: [[16, 11], [17, 11]], sube: [[15, 8], [16, 7]], boca: [[15, 6], [16, 6]] },
  otra: b([[9, 9], [11, 11], [15, 11]], true),
};
/**
 * 🆕 LA COPA DEL RICO (vino tinto), en su sillón, de costado *(Santi: "el puro y la copa")*: en la falda,
 * agarrada del tallo; la sube al pecho; a la boca, inclinada, con la cabeza un punto atrás (como el jarro
 * del comedor). La mano tapa el tallo. Echado hacia atrás se corre con él (ver `reclinar`).
 * Y 🆕 EL BARTENDER SECANDO UNA COPA con el trapo, de frente detrás de la barra: la copa vacía en una mano
 * a la altura del pecho (más abajo la tapa la barra) y el trapo que le da la vuelta.
 */
// (El trapo, beige: blanco se perdía contra las mangas de la camisa.)
const VIDRIO = { v: 22, w: 30, R: 9, T: 16, t: 15 };
const OTRA_COPA = b([[9, 9], [10, 12], [12, 13]], true);
const POSES_COPA = {
  falda: { lista: [b([[10, 9], [11, 12], [13, 12]]), OTRA_COPA], props: [{ m: mapa(9, ['............vRv', '............vRv', '.............v.', '..............', '..............', '............vvv']), tabla: VIDRIO }] },
  sube: { lista: [b([[10, 9], [14, 12], [14, 9]]), OTRA_COPA], props: [{ m: mapa(6, ['.............vRv', '.............vRv', '..............v.', '................', '................', '.............vvv']), tabla: VIDRIO }] },
  boca: { lista: [b([[10, 9], [16, 8], [15, 4]]), OTRA_COPA], props: [{ m: mapa(2, ['.................v', '................vv', '...............v..', '.............vRv..', '.............RR...']), tabla: VIDRIO }], cabezaX: -1 },
};
// (La copa a la altura de la panza, justo encima de la barra; el trapo le da la vuelta: izquierda, arriba, derecha, abajo.)
// (🔁 Las manos a la altura de la panza y los antebrazos en diagonal, así el brazo queda de dos puntos hasta la
// mano y el chaleco se ve en el pecho. Y SIN TOCARSE: el trapo frota la copa con un punto de aire; con las
// manos juntas los dos brazos eran una sola pieza, no se acomodaban a cada cuerpo y quedaban huecos y puntos
// sueltos *(Santi: "tiene el brazo ancho al principio… en el antebrazo queda con un minipixel"; "el flaco se ve
// muy mal… hay pixeles que están volando")*.)
// (La mano del trapo no sube más que el codo: más arriba el antebrazo quedaba acostado, de un punto de alto.)
const POSES_SECAR = [[9, 14], [9, 13], [9, 13], [9, 14], [8, 14], [8, 13], [8, 13], [8, 14]].map((m) => ({
  // (Los dos hombros parejos con el medio del cuerpo: el de la izquierda en 6, como el de la derecha en 13.)
  lista: [b([[6, 9], [6, 12], m]), b([[13, 9], [14, 12], [13, 14]])],
  props: [
    { m: mapa(11, ['...........vwv', '...........vvv', '............v.']), tabla: VIDRIO },
    // El trapo, en la mano que frota, al lado de la copa.
    { m: mapa(m[1] - 1, ['.'.repeat(m[0] - 1) + 'TT', '.'.repeat(m[0] - 1) + 'Tt']), tabla: VIDRIO, capa: 'frente' },
  ],
  inclina: 0, cabeza: 0,
}));
/**
 * 🆕 EL BARTENDER SIRVE (de frente, detrás de la barra): la copa vacía en la mano de la izquierda; con la
 * otra levanta la botella (verde, parada), la inclina sobre la copa, cae el vino y la copa queda llena;
 * vuelve a pararla. El chorro toca la copa pero no la botella (en diagonal no se pegan): así cada brazo
 * sigue siendo una pieza aparte y se acomoda a cada cuerpo (ver POSES_SECAR).
 */
const BOTELLA = { ...VIDRIO, g: 27, G: 43, n: 26 };
const COPA_IZQ = (llena) => ({ m: mapa(11, ['......v' + (llena ? 'R' : 'w') + 'v', '......v' + (llena ? 'R' : 'v') + 'v']), tabla: VIDRIO });
const BRAZO_COPA_IZQ = b([[6, 9], [5, 12], [7, 13]]);
const POSES_SERVIR = {
  alza: (llena) => ({ lista: [BRAZO_COPA_IZQ, b([[13, 9], [14, 12], [12, 11]])], props: [COPA_IZQ(llena), { m: mapa(6, ['............n', '............gG', '............gG', '............gg']), tabla: BOTELLA }] }),
  inclina: (llena) => ({ lista: [BRAZO_COPA_IZQ, b([[13, 9], [14, 12], [11, 10]])], props: [COPA_IZQ(llena), { m: mapa(9, ['.........nggG']), tabla: BOTELLA }] }),
  sirve: (llena) => ({ lista: [BRAZO_COPA_IZQ, b([[13, 9], [14, 12], [11, 10]])], props: [COPA_IZQ(llena), { m: mapa(9, ['.........nggG', '........R']), tabla: BOTELLA }] }),
};
const CUADROS_SERVIR = [['alza', 0], ['inclina', 0], ['sirve', 0], ['sirve', 0], ['sirve', 1], ['inclina', 1], ['alza', 1], ['alza', 1]];
/**
 * 🆕 EL RICO TOMA DE PIE EN LA BARRA, de espaldas (mira a la barra): la copa en la mano de la derecha, a la
 * altura del pecho, que asoma al costado del cuerpo; la sube y se la lleva a la boca (el codo afuera, la
 * copa al lado de la cabeza). Los mismos cuadros que la copa sentado.
 */
const POSES_COPA_PIE = {
  falda: { lista: [b([[13, 9], [15, 12], [15, 13]]), b([[6, 9], [5, 13], [5, 16]])], props: [{ m: mapa(11, ['..............vRv', '..............vRv']), tabla: VIDRIO }] },
  sube: { lista: [b([[13, 9], [16, 11], [15, 10]]), b([[6, 9], [5, 13], [5, 16]])], props: [{ m: mapa(8, ['..............vRv', '..............vRv']), tabla: VIDRIO }] },
  boca: { lista: [b([[13, 9], [16, 10], [14, 7]]), b([[6, 9], [5, 13], [5, 16]])], props: [{ m: mapa(5, ['..............RRv', '...............vv']), tabla: VIDRIO }] },
};
/**
 * 🆕 LA CHARLA *(Santi: "cuando un rico se acerca a hablar con otro… que hable hacia el que está sentado,
 * esto deja lugar a dos poses (de espalda y de frente)")*: el que habla mueve la mano (abajo, a media altura,
 * arriba, y otra vez), el otro escucha. De pie, de frente o de espaldas (según de qué lado del pasillo está
 * el sillón), y sentado de costado (echado, ver `reclinar`).
 */
const POSES_CHARLA = {
  frente: {
    abajo: { lista: [b([[7, 9], [6, 13], [6, 16]]), b([[13, 9], [14, 13], [14, 16]])] },
    medio: { lista: [b([[7, 9], [6, 13], [7, 12]]), b([[13, 9], [14, 13], [14, 16]])] },
    arriba: { lista: [b([[7, 9], [5, 12], [5, 10]]), b([[13, 9], [14, 13], [14, 16]])] },
  },
  espalda: {
    abajo: { lista: [b([[13, 9], [14, 13], [14, 16]]), b([[6, 9], [5, 13], [5, 16]])] },
    medio: { lista: [b([[13, 9], [15, 12], [16, 12]]), b([[6, 9], [5, 13], [5, 16]])] },
    arriba: { lista: [b([[13, 9], [16, 11], [17, 9]]), b([[6, 9], [5, 13], [5, 16]])] },
  },
  lado: {
    abajo: { lista: [b([[10, 9], [11, 12], [13, 13]]), b([[9, 9], [10, 12], [12, 13]], true)] },
    medio: { lista: [b([[10, 9], [12, 12], [14, 11]]), b([[9, 9], [10, 12], [12, 13]], true)] },
    arriba: { lista: [b([[10, 9], [12, 11], [14, 9]]), b([[9, 9], [10, 12], [12, 13]], true)] },
  },
};
const CUADROS_CHARLA = ['abajo', 'medio', 'arriba', 'medio', 'arriba', 'medio', 'abajo', 'abajo'];
/**
 * 🆕 EL BARTENDER ORDENA EL ESTANTE, de espaldas *(Santi: "no te compliques con la nueva pose, solo está de
 * espaldas y mueve los brazos")*: una mano arriba, en el estante, y la otra abajo; y al revés.
 */
const POSES_ORDENAR = {
  der: { lista: [b([[13, 9], [15, 7], [14, 4]]), b([[6, 9], [5, 13], [5, 16]])] },
  medio: { lista: [b([[13, 9], [14, 12], [13, 13]]), b([[6, 9], [5, 12], [6, 13]])] },
  izq: { lista: [b([[13, 9], [14, 13], [14, 16]]), b([[6, 9], [4, 7], [5, 4]])] },
};
const CUADROS_ORDENAR = ['der', 'der', 'medio', 'izq', 'izq', 'izq', 'medio', 'der'];
const CUADROS_SENTADO = {
  copa: ['falda', 'sube', 'boca', 'boca', 'boca', 'sube', 'falda', 'falda'],
  diario: ['regazo', 'medio', 'arriba', 'arriba+', 'arriba', 'hoja', 'arriba+', 'medio'],
  barajar: ['junto', 'abierto', 'cayendo', 'junto', 'abierto', 'cayendo', 'junto', 'junto'],
  equipaje: ['quieto', 'baja', 'abre', 'adentro', 'adentro2', 'adentro', 'abre', 'baja'],
  // 🆕 A la mesa del comedor (ver POSES_MESA.comer y .jarro).
  comer: ['carga', 'sube', 'boca', 'boca', 'sube', 'mastica', 'mastica1', 'mastica'],
  jarro: ['apoya', 'sube', 'boca', 'boca', 'boca', 'sube', 'apoya', 'apoya'],
};
/**
 * LA POSE DE UN PASAJERO SENTADO para `cuadroJugador` (`brazos`): `accion`
 * ('diario', 'barajar', 'equipaje', 'dormido'), `k` el cuadro (0-7) y `lleva`
 * ('maleta' o 'bolso', para el equipaje). En las diagonales (se dio vuelta
 * hacia vos) no hace nada: las manos en la falda.
 */
export function poseSentado(accion, vista, k = 0, lleva = 'maleta', mesa = false) {
  const V = vista === 'lado' || vista === 'frente' || vista === 'espalda' ? vista : null;
  // 🆕 A la mesa del comedor (de costado): los brazos sobre la mesa.
  if (mesa && vista === 'lado') {
    if (accion === 'quieto') return { ...POSES_MESA.quieto, cabeza: 0, cabezaX: 0, inclina: 0, gacha: null };
    if (POSES_MESA[accion]) {
      let nombre = CUADROS_SENTADO[accion][k % 8];
      const baja1 = nombre.endsWith('+');
      if (baja1) nombre = nombre.slice(0, -1);
      const P = POSES_MESA[accion][nombre];
      const lista = baja1 ? P.lista.map((x) => ({ ...x, p: x.p.map(([a, c], i) => (i === 2 ? [a, c + 1] : [a, c])) })) : P.lista;
      const props = [];
      if (P.papel) props.push({ m: baja1 ? mapa(P.papel.y + 1, P.papel.filas) : P.papel, tabla: PAPEL, capa: 'frente' });
      if (P.cartas) props.push({ m: P.cartas, tabla: NAIPES });
      if (P.props) props.push(...P.props);
      return { lista, props, inclina: 0, cabeza: P.cabeza || 0, cabezaX: P.cabezaX || 0 };
    }
  }
  // Dormido, los brazos cruzados y la cabeza caída; sin hacer nada, las manos en la falda.
  // Dormido respira: cada tanto la cabeza sube un punto (`k` impar).
  // Al despertarse: en las otras vistas (no se sientan así), quieto.
  if (accion === 'agarraSombrero' || accion === 'agarraSombreroArriba' || accion === 'poneSombrero') return POSES_SENTADO[accion][vista] || { ...POSES_SENTADO.dormido[vista], cabeza: 0, cabezaX: 0, inclina: 0, gacha: null };
  if (accion === 'dormido') { const D = POSES_SENTADO.dormido[vista]; return { ...D, cabeza: D.cabeza - (k % 2) }; }
  // 🆕 La copa del rico (de costado) y el bartender secando (de frente).
  if (accion === 'copa') {
    if (vista !== 'lado') return { ...POSES_SENTADO.dormido[vista], cabeza: 0, cabezaX: 0, inclina: 0, gacha: null };
    const P = POSES_COPA[CUADROS_SENTADO.copa[k % 8]];
    return { lista: P.lista, props: P.props, inclina: 0, cabeza: 0, cabezaX: P.cabezaX || 0 };
  }
  if (accion === 'secar') return vista === 'frente' ? POSES_SECAR[k % 8] : null;
  if (accion === 'servir') { if (vista !== 'frente') return null; const [n, llena] = CUADROS_SERVIR[k % 8]; return { ...POSES_SERVIR[n](!!llena), inclina: 0, cabeza: 0 }; }
  if (accion === 'ordenar') { const P = vista === 'espalda' && POSES_ORDENAR[CUADROS_ORDENAR[k % 8]]; return P ? { ...P, inclina: 0, cabeza: 0 } : null; }
  if (accion === 'copaPie') { const P = vista === 'espalda' && POSES_COPA_PIE[CUADROS_SENTADO.copa[k % 8]]; return P ? { ...P, inclina: 0, cabeza: 0 } : null; }
  if (accion === 'charla') { const P = POSES_CHARLA[vista] && POSES_CHARLA[vista][CUADROS_CHARLA[k % 8]]; return P ? { ...P, inclina: 0, cabeza: 0 } : null; }
  if (accion === 'quieto') return { ...POSES_SENTADO.dormido[vista], cabeza: 0, cabezaX: 0, inclina: 0, gacha: null };
  if (!V || !POSES_SENTADO[accion]) return null;
  let nombre = CUADROS_SENTADO[accion][k % 8];
  const baja1 = nombre.endsWith('+');
  if (baja1) nombre = nombre.slice(0, -1);
  const P = POSES_SENTADO[accion][V][nombre];
  const lista = baja1 ? P.lista.map((x) => ({ ...x, p: x.p.map(([a, c], i) => (i === 2 ? [a, c + 1] : [a, c])) })) : P.lista;
  const props = [];
  if (P.papel) props.push({ m: baja1 ? mapa(P.papel.y + 1, P.papel.filas) : P.papel, tabla: PAPEL, capa: P.fondo ? 'fondo' : 'frente' });
  if (P.cartas) props.push({ m: P.cartas, tabla: NAIPES });
  if (accion === 'equipaje') {
    const E = EQUIPAJE[lleva] || EQUIPAJE.maleta;
    const abierta = nombre === 'adentro' || nombre === 'adentro2';
    props.push({ m: (E[V] || E.frente)[abierta ? 1 : 0], tabla: lleva === 'bolso' ? CUERO_BOLSO : CUERO_MALETA, piso: true, capa: V === 'espalda' ? 'fondo' : 'frente' });
  }
  return { lista, props, inclina: P.inclina || 0, cabeza: P.cabeza || 0 };
}

// ------------------------------------------------------------- en el piso
/**
 * 🆕 TIRADO EN EL PISO (P3a): muerto, desmayado o caído apuntando. Visto desde
 * arriba, boca arriba, con la cabeza a la izquierda (a la derecha es el mismo
 * dibujo en espejo): el sombrero volado al lado de la cabeza, la cara mirando
 * para arriba, el chaleco abierto con la estrella, los brazos a los costados,
 * las piernas y las botas con la punta para arriba. Mide 30 puntos de largo.
 *  muerto     un brazo y una pierna abiertos (el charco lo pone el juego).
 *  desmayado  derecho, entero; respira (`late`: el pecho sube un punto).
 *  cama       (el pasajero que duerme en el dormitorio) sin sombrero, la cabeza
 *             en la almohada y tapado con la frazada hasta el cuello; sólo se
 *             ven la cabeza y el bulto de los pies.
 *  caido      (un tiro en la pierna) el sombrero puesto, se apoya y apunta: el
 *             brazo de acá sale del hombro hacia donde apunta, con el arma
 *             dibujada a mano en esa dirección.
 */
/**
 * Las piezas (fila 0 = arriba del torso). La cabeza: el pelo del lado de la
 * coronilla (izquierda), la cara mirando para arriba y la pera hacia el
 * cuerpo. El torso: el chaleco abierto con la estrella y la camisa al medio.
 * Los brazos y las piernas se trazan (ver `cuadroTendido`).
 */
const TENDIDO = {
  cabeza: mapa(1, ['aaPPq', 'aaPPp', 'aAPPp', 'aaPpp', 'aapqq']),          // desde x 5
  cuello: mapa(2, ['p', 'p', 'p']),                                        // en x 10
  torso: mapa(0, ['CUUUEUUUv', 'CUUEeEUVv', 'CVVVEVVVv', 'LCCyCCyCC', 'CVVVVVVVv', 'CVVVVVVVv', 'CvvvvvvVw']),   // desde x 11
  cinto: mapa(0, ['W', 'W', 'W', 'G', 'W', 'W', 'W']),                    // en x 20
  sombrero: mapa(-4, ['.kkk.', 'kHhHk', 'kbbbk', '.kkk.']),                // volado, desde x 0
  puesto: mapa(0, ['.kkk.', 'kHHhk', 'kHhhk', 'kbbbk', 'kHHHk', 'kHHHk', '.kkk.']),   // puesto, desde x 2
};
/** Brazos (hombro → mano) y la pierna de acá (cadera → tobillo), por modo. */
const POSE_TENDIDO = {
  // 🔁 El muerto, los brazos con codo (dos tramos rectos): en uno solo, en diagonal, parecían fideos *(los jueces)*.
  muerto: { alla: [[12, -2], [14, -5], [18, -6]], aca: [[12, 7], [14, 10], [18, 11]], pierna: [21, 7] },
  desmayado: { alla: [[12, -2], [18, -3]], aca: [[12, 7], [18, 8]], pierna: [21, 5] },
  caido: { alla: [[12, -2], [18, -3]], aca: null, pierna: [21, 5] },
};
// (🔁 Más alto: el caído apuntando para arriba o para abajo se cortaba en el borde.)
const TA = 44, TL = 42, TX = 6, TY = 18;   // el lienzo del tirado, con lugar para el arma
export const PIES_TENDIDO = [TX + 16, TY + 3];
export { TA as ANCHO_TENDIDO, TL as ALTO_TENDIDO };
export function cuadroTendido({ tipo = 'guardia', modo = 'muerto', late = 0, ang = 0, arma = 'colt', fino = false, ...o }) {
  // La almohada (D d) y la frazada (N Z X, lana azul; S s la sábana) de la litera.
  const col = { ...C, ...capasPersona({ tipo, vista: 'frente', ...o }).colores, D: 17, d: 15, N: 20, Z: 19, X: 41, S: 17 };
  if (modo === 'cama') col.s = 16;
  // 🆕 P3c: el blindado tirado, con la placa de acero en el pecho (donde va el chaleco).
  if (tipo === 'blindado') Object.assign(col, { U: 25, V: 24, v: 23 });
  const idx = new Int16Array(TA * TL).fill(-1);
  const poner = (x, y, i) => {
    if (i == null) return;
    x += TX; y += TY;
    if (x >= 0 && y >= 0 && x < TA && y < TL) idx[y * TA + x] = i;
  };
  const dibujar = (m, dx = 0, dy = 0) => m.filas.forEach((fila, k) => {
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') poner(x + dx, m.y + k + dy, col[fila[x]]);
  });
  if (modo === 'cama') {
    // 🔁 La cabeza sobre la almohada de la litera (la cama ya tiene la suya *(Santi:
    // "debería estar sin sombrero y con la cara descubierta")*): la cara entera,
    // el pelo sólo en la coronilla. Y la frazada de lana con el borde de la sábana doblado.
    dibujar(mapa(1, ['aPPPq', 'aPPPp', 'aPPPp', 'aPPpp', 'aPpqq']), 5, 0);
    dibujar(mapa(-1, [
      '..........SSNNNNNNNNNNNNNNNNNNN',
      '..........SSNNNNNNNNNNNNNNNNNNNN',
      '..........SsZNNNNNNNNNNNNNNNNNNN',
      '..........SsZZNNNNNNNNNNNNNNNNNN',
      '..........SsZZZNNNNNNNNNNNNNNNNN',
      '..........SsZZZZZZZZZZZZZZZZZZZN',
      '..........SsZZZZZZZZZZZZZZZZZZZZ',
      '..........SsZZZZZZZZZZZZZZZZZZZZ',
      '..........SsXXXXXXXXXXXXXXXXXXXX',
    ]), 0, 0);
  } else {
  const P = POSE_TENDIDO[modo];
  // Una pierna: tres de ancho (luz, base, sombra) y la bota con la punta para arriba.
  const pierna = (y0, y1) => {
    linea([21, y0], [29, y1], (x, y) => { poner(x, y - 1, col.I); poner(x, y, col.T); poner(x, y + 1, col.t); });
    poner(30, y1 - 1, col.O); poner(30, y1, col.Q); poner(30, y1 + 1, col.O);
    poner(31, y1 - 1, col.K); poner(31, y1, col.K); poner(31, y1 + 1, col.K);
  };
  // Un brazo: dos de alto (la manga, con luz arriba) y la mano de 2×2.
  const brazo = (puntos, lejos) => {
    const b = puntos[puntos.length - 1];
    for (let i = 1; i < puntos.length; i++) linea(puntos[i - 1], puntos[i], (x, y) => { poner(x, y, lejos ? col.C : col.L); poner(x, y + 1, lejos ? col.c : col.C); });
    poner(b[0] + 1, b[1], col.P); poner(b[0] + 2, b[1], col.p);
    poner(b[0] + 1, b[1] + 1, col.p); poner(b[0] + 2, b[1] + 1, col.q);
  };
  const late1 = late && modo === 'desmayado' ? -1 : 0;
  pierna(1, 1);
  pierna(5, P.pierna[1]);
  brazo(P.alla, true);
  dibujar(TENDIDO.torso, 11, 0);
  // Respira: el pecho se levanta (un punto más de chaleco arriba).
  if (late1) dibujar(mapa(-1, ['.UUUUUU']), 11, 0);
  dibujar(TENDIDO.cinto, 20, 0);
  dibujar(TENDIDO.cuello, 10, 0);
  dibujar(TENDIDO.cabeza, 5, 0);
  if (modo === 'caido') dibujar(TENDIDO.puesto, 2, 0);
  else dibujar(TENDIDO.sombrero, 0, 0);
  if (P.aca) brazo(P.aca, false);
  }
  let boca = null;
  if (modo === 'caido') {
    // Se apoya y apunta: el brazo de acá sale del hombro hacia donde apunta (en
    // el mismo paso de 22,5° que el dibujo del arma).
    // 🔁 El brazo sale por FUERA del cuerpo (por abajo, o por arriba si apunta hacia arriba): a lo
    // largo del cuerpo el revólver quedaba gris sobre el pantalón y no se veía que apuntaba *(los jueces)*.
    const A = armaEn(arma, ang);
    const d = [Math.cos(A.angulo), Math.sin(A.angulo)];
    const arriba = d[1] < -0.3;
    const S = arriba ? [12, -3] : [12, 7];
    const afuera = Math.abs(d[0]) > 0.9 ? (arriba ? -3 : 4) : 0;
    const M = [Math.round(S[0] + d[0] * 6), Math.round(S[1] + d[1] * 5 + afuera)];
    linea(S, M, (x, y) => { poner(x, y, col.L); poner(x, y + 1, col.C); });
    for (const [x, y, c] of A.puntos) poner(M[0] + x, M[1] + y, c);
    poner(M[0], M[1], col.P); poner(M[0] - Math.sign(d[0] || 1), M[1], col.P);
    poner(M[0], M[1] + 1, col.p); poner(M[0] - Math.sign(d[0] || 1), M[1] + 1, col.p);
    boca = [M[0] + A.boca[0] + TX, M[1] + A.boca[1] + TY];
  }
  if (!fino) {
    const lleno = idx.slice();
    for (let y = 0; y < TL; y++) for (let x = 0; x < TA; x++) {
      if (lleno[y * TA + x] >= 0) continue;
      const v = (a, b) => a >= 0 && b >= 0 && a < TA && b < TL && lleno[b * TA + a] >= 0;
      if (v(x - 1, y) || v(x + 1, y) || v(x, y - 1) || v(x, y + 1)) idx[y * TA + x] = 0;
    }
  }
  return { idx, boca };
}
const tendidos = new Map();
/** El tirado iluminado, como canvas (se guarda). */
export function lienzoTendido(o, luz = 0) {
  const clave = ['tipo', 'modo', 'late', 'ang', 'arma', 'fino', 'piel', 'pelo', 'sombrero', 'uniforme', 'panuelo', 'peinado', 'colorSombrero'].map((k) => (k === 'ang' ? Math.round((o.ang || 0) * 100) : o[k] ?? '')).join('|') + '|' + luz;
  let g = tendidos.get(clave);
  if (g) return g;
  if (tendidos.size > 300) tendidos.clear();
  const q = cuadroTendido(o);
  const datos = iluminar({ ancho: TA, alto: TL, indices: q.idx, campo: () => luz });
  const cv = document.createElement('canvas');
  cv.width = TA; cv.height = TL;
  cv.getContext('2d').putImageData(new ImageData(datos, TA, TL), 0, 0);
  g = { img: cv, boca: q.boca };
  tendidos.set(clave, g);
  return g;
}

// ------------------------------------------------- fumar
/**
 * 🆕 FUMAR (P3a) *(Santi: "que los guardias vigilando, jugando cartas y los
 * civiles despiertos tengan la animación más frecuente del juego: fumar
 * cigarrillo")*, sobre las siluetas que aprobó: el brazo abajo
 * con el cigarrillo entre los dedos, lo sube, en la boca pita (la brasa se
 * enciende), lo baja y suelta el humo (16 cuadros, ver LUGARES; el humo
 * y el brillo de la brasa no van en el dibujo: los pone figura.js encima, sin
 * la luz del lugar, para que la brasa se vea en lo oscuro).
 *
 * Por vista: los tres lugares de la mano que fuma (hombro → codo → mano;
 * `atras` si va detrás del cuerpo), el cigarrillo en cada uno ([papel,
 * brasa]; de espaldas, en la boca, no se ve), de dónde sale el humo y el otro
 * brazo. Las vistas de la izquierda son el espejo de las de la derecha, como
 * el resto de las poses de la gente.
 */
const FUMAR = {
  lado: { abajo: [[10, 9], [11, 13], [12, 15]], sube: [[10, 9], [14, 12], [14, 9]], boca: [[10, 9], [14, 12], [13, 6]],
    c: { abajo: [[14, 15], [15, 15]], sube: [[16, 9], [17, 8]], boca: [[15, 6], [16, 6]] }, humo: [16, 6], otra: b([[9, 9], [9, 13], [9, 16]], true) },
  // 🔁 De frente, el codo abajo y delante del pecho, el antebrazo casi vertical hasta la boca: con el
  // codo afuera a la altura del hombro parecía un ala *(los jueces)*.
  frente: { abajo: [[7, 9], [6, 13], [6, 16]], sube: [[7, 9], [6, 12], [8, 10]], boca: [[7, 9], [8, 11], [9, 6]],
    c: { abajo: [[6, 18], [6, 19]], sube: [[7, 10], [6, 10]], boca: [[8, 5], [7, 4]] }, humo: [14, 7], otra: b([[13, 9], [14, 13], [14, 16]]) },
  diagF: { abajo: [[7, 9], [6, 13], [7, 16]], sube: [[7, 9], [8, 13], [10, 10]], boca: [[7, 9], [6, 12], [10, 6]],
    c: { abajo: [[9, 17], [10, 17]], sube: [[12, 10], [13, 9]], boca: [[12, 7], [13, 7]] }, humo: [15, 6], otra: b([[13, 9], [13, 13], [13, 16]], true) },
  diagE: { abajo: [[13, 9], [14, 13], [14, 16]], sube: [[13, 9], [16, 12], [15, 9]], boca: [[13, 9], [16, 11], [13, 6]],
    c: { abajo: [[16, 17], [17, 17]], sube: [[17, 9], [18, 8]], boca: [[15, 5], [16, 5]] }, humo: [17, 5], otra: b([[6, 9], [6, 13], [6, 16]], true) },
  espalda: { abajo: [[13, 9], [14, 13], [14, 16]], sube: [[13, 9], [16, 12], [15, 9]], boca: [[13, 9], [16, 11], [13, 6]], bocaAtras: true,
    c: { abajo: [[14, 18], [14, 19]], sube: [[16, 8], [16, 7]], boca: null }, humo: [15, 5], otra: b([[6, 9], [5, 13], [5, 16]]) },
};
/** Sentado (el cuerpo 4 más abajo): la mano descansa en el muslo y no cuelga; el otro brazo, en la falda. */
const FUMAR_SENTADO = {
  lado: { otra: b([[9, 9], [10, 12], [12, 13]], true) },
  frente: { abajo: [[7, 9], [6, 12], [8, 14]], c: { abajo: [[8, 16], [8, 17]] }, otra: b([[13, 9], [13, 12], [11, 15]]) },
  espalda: { abajo: [[13, 9], [14, 12], [13, 14]], c: { abajo: null }, otra: b([[6, 9], [5, 12], [6, 14]]) },
};
/** El de franco: las cartas en la otra mano (sólo de costado y de frente; si no, juega sin fumar). */
const FUMAR_CARTAS = {
  lado: { otra: b([[9, 9], [10, 13], [12, 12]], true), cartas: mapa(11, ['.............LL', '..............L']) },
  frente: { otra: b([[13, 9], [13, 12], [11, 14]]), cartas: mapa(13, ['..........LL', '..........L']) },
};
/** Con el arma larga en las manos: el cigarrillo queda en la boca todo el tiempo ([papel, brasa]) *(Santi: de acuerdo)*. */
const FUMAR_BOCA = {
  lado: { c: [[13, 6], [14, 6]], humo: [15, 6] },
  diagF: { c: [[13, 6], [14, 6]], humo: [15, 6] },
  frente: { c: [[12, 6], [13, 6]], humo: [14, 7] },
  diagE: { c: [[13, 6], [14, 6]], humo: [16, 5] },
  espalda: { c: null, humo: [15, 5] },
};
/** Qué cuadro de fumar toca, `t` segundos después de empezar: una pitada cada `cada` segundos (8 cuadros), y entre pitadas el brazo abajo. */
export function cuadroDeFumar(t, cada = 6, cuadro = 0.15) {
  const k = Math.floor((t % cada) / cuadro);
  return k > 15 ? 0 : k;
}
/**
 * 🔁 16 CUADROS, NO 8 *(Santi: "lo veo muy tildado, no sé por qué si en teoría
 * son 8")*: con 8, el brazo tenía sólo 3 lugares (había cuadros repetidos) y
 * cada uno duraba 0,3 s, así que saltaba. Ahora pasa por la mitad del camino
 * entre cada lugar puesto a mano (`a` → `b`; el punto del medio se redondea),
 * cada cuadro dura 0,15 s y la pitada sigue durando 2,4 s:
 *   0 abajo · 1 subiendo · 2 a mitad · 3 llegando · 4-6 en la boca (5 y 6 pita,
 *   la brasa se enciende) · 7 dejando la boca · 8 a mitad · 9 bajando ·
 *   10-15 abajo, mientras suelta la bocanada (ver HUMO en figura.js).
 */
const LUGARES = ['abajo', ['abajo', 'sube'], 'sube', ['sube', 'boca'], 'boca', 'boca', 'boca', ['boca', 'sube'], 'sube', ['sube', 'abajo']];
const medio = (p, q) => [Math.round((p[0] + q[0]) / 2), Math.round((p[1] + q[1]) / 2)];
function lugarDeFumar(v, k) {
  const L = LUGARES[k] || 'abajo';
  if (typeof L === 'string') return { pts: v[L], c: v.c[L], atras: L === 'boca' && !!v.bocaAtras };
  const [a, b] = L;
  const pts = v[a].map((p, i) => medio(p, v[b][i]));
  // El cigarrillo a mitad de camino: el papel en el medio y la brasa hacia donde apuntaba en `a`.
  let c = null;
  if (v.c[a] && v.c[b]) {
    const papel = medio(v.c[a][0], v.c[b][0]);
    c = [papel, [papel[0] + v.c[a][1][0] - v.c[a][0][0], papel[1] + v.c[a][1][1] - v.c[a][0][1]]];
  }
  return { pts, c, atras: !!v.bocaAtras && (a === 'boca' || b === 'boca') };
}
/** La pose de fumar con la mano (los brazos y el cigarrillo); null si en esa vista no fuma así. */
function poseFumar(vista, k, { sentado = false, cartas = false, atras = 0, mesa = false } = {}) {
  const base = atras && FUMAR[vista] ? bocaAtras(FUMAR[vista], atras) : FUMAR[vista];
  // (🆕 A la mesa del comedor, de costado: ver FUMAR_MESA.)
  const S = sentado ? (mesa && vista === 'lado' ? FUMAR_MESA : FUMAR_SENTADO[vista]) : null;
  const CA = cartas ? FUMAR_CARTAS[vista] : null;
  if (!base || (sentado && !S) || (cartas && !CA)) return null;
  const v = S ? { ...base, ...S, c: { ...base.c, ...(S.c || {}) } } : base;
  const L = lugarDeFumar(v, k);
  const otra = CA ? CA.otra : v.otra;
  return {
    lista: [b(L.pts, L.atras), otra],
    props: CA ? [{ m: CA.cartas, tabla: NAIPES }] : [],
    cig: L.c, humo: v.humo,
  };
}

/** La pose de fumar con la boca `d` puntos más atrás: la mano en la boca, el cigarrillo y el humo. */
function bocaAtras(v, d) {
  return {
    ...v,
    boca: v.boca.map((p, i) => (i === 2 ? [p[0] - d, p[1]] : p)),
    c: { ...v.c, boca: v.c.boca && v.c.boca.map(([x, y]) => [x - d, y]) },
    humo: [v.humo[0] - d, v.humo[1]],
  };
}

const sueltos = new Map();
/** El sombrero suelto, iluminado (con su borde); `base` es dónde apoya, en puntos del lienzo. */
export function lienzoSombreroSuelto(o, luz = 0) {
  const clave = [o.tipo, o.sombrero ?? '', o.colorSombrero ?? '', o.fino ? 1 : 0, o.arriba ? 1 : 0, luz].join('|');
  let g = sueltos.get(clave);
  if (g) return g;
  const col = { ...C, ...capasPersona({ vista: 'lado', ...o }).colores };
  // (🆕 `arriba`: visto desde arriba, para el que duerme acostado; ver SOMBRERO_ARRIBA.)
  const M = (o.arriba ? SOMBRERO_ARRIBA : SOMBRERO_SUELTO)[o.sombrero] || (o.arriba ? SOMBRERO_ARRIBA : SOMBRERO_SUELTO).bombin;
  const W = Math.max(...M.filas.map((f) => f.length)) + 2, H = M.filas.length + 2, idx = new Int16Array(W * H).fill(-1);
  M.filas.forEach((f, j) => { for (let x = 0; x < f.length; x++) if (f[x] !== '.') idx[(j + 1) * W + x + 1] = col[f[x]]; });
  if (!o.fino) {
    const lleno = idx.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (lleno[y * W + x] >= 0) continue;
      const v = (a, b) => a >= 0 && b >= 0 && a < W && b < H && lleno[b * W + a] >= 0;
      if (v(x - 1, y) || v(x + 1, y) || v(x, y - 1) || v(x, y + 1)) idx[y * W + x] = 0;
    }
  }
  const datos = iluminar({ ancho: W, alto: H, indices: idx, campo: () => luz });
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  cv.getContext('2d').putImageData(new ImageData(datos, W, H), 0, 0);
  g = { img: cv, base: [Math.floor(W / 2), o.arriba ? Math.floor(H / 2) : H - 1] };
  sueltos.set(clave, g);
  return g;
}

/**
 * 🆕 EL JINETE DE LA LEY, montado *(Santi eligió "Como los guardias" y el rifle "En la funda de la silla")*: la
 * misma persona que un guardia del tren, con su aspecto sorteado (`aspecto`, ver aspectoDe), sentada como el
 * jugador (las piernas, la silla y las dos manos en las riendas, ver `montado` en jugador.js) y con el rifle
 * enfundado al costado de la silla. Devuelve también `mano`, de donde salen las riendas.
 */
const jinetes = new Map();
/** 🆕 E4 · Desde qué ángulo (en el dibujo) el jinete de perfil se da vuelta en la silla para apuntar. */
const GIRA_EN = Math.PI * 3 / 8 - 0.01;
/**
 * 🆕 E4 · LOS BRAZOS Y EL RIFLE DEL JINETE DADO VUELTA, dibujados a mano punto por punto (con los del guardia de a
 * pie, derecho para arriba o para abajo, el rifle no se veía: *(Santi: "por ahora solo el jinete, dependiendo como
 * queda probamos en el guardia de pie")*). Cada punto: [x, y, letra], en el lienzo de la persona.
 * 🔁 *(Santi: "parece que está apuntando hacia arriba... apunte normal, de última el rifle no se ve pero se ve toda
 * la dirección del cuerpo, y podrías hacer que ponga la cabeza como apoyándola en la culata")*: antes el caño subía
 * por arriba del sombrero y parecía que le tiraba al cielo. Ahora apunta derecho al tren, que en esta cámara es
 * hacia adentro de la pantalla: del rifle casi no se ve nada, y lo que se lee es el cuerpo dado vuelta, los codos
 * levantados y la cabeza (`cabeza`: cuánto se corre) caída sobre la culata.
 *  - espalda (te apunta desde tu lado del tren): la culata en el hombro derecho, la mano en la empuñadura y apenas la
 *    punta del caño junto a la cabeza (`detras`: la tapa lo que esté). El brazo izquierdo va adelante, tapado.
 *  - frente (desde el otro lado): la culata en el hombro, la mejilla encima, y el caño hacia vos: la boca, un
 *    cuadradito claro con el agujero oscuro, y la mano izquierda debajo.
 * Primero con el cuerpo normal *(Santi: "Primero hacelo únicamente con el cuerpo normal")* y después, aprobado, en
 * los cuatro cuerpos y con chaqueta.
 * El brazo de cada lado, del hombro (que cambia con el cuerpo) al codo, se completa con una línea (`brazoHasta`).
 * Letras: L C c la manga (claro, medio, oscuro), P la mano; G g el caño (g, el claro), o la boca, r el guardamano, d la culata,
 * y el bronce del cajón.
 */
const GIRO_ARMAS = {
  espalda: {
    cabeza: [1, 1],
    detras: [[26, 11, 'G'], [26, 12, 'y'], [25, 13, 'd'], [26, 13, 'd']],
    delante: [[27, 12, 'P'], [28, 13, 'c'], [20, 12, 'c'], [19, 12, 'C'], [18, 12, 'C'], [17, 13, 'c']],
    codos: { izq: [17, 13], der: [28, 13] },
    boca: [26, 11],
  },
  frente: {
    cabeza: [-1, 1],
    detras: [],
    delante: [[19, 15, 'd'], [20, 15, 'y'], [20, 16, 'G'], [21, 16, 'g'], [22, 16, 'g'], [21, 17, 'g'], [22, 17, 'o'],
      [17, 14, 'c'], [18, 15, 'C'], [19, 16, 'P'], [27, 15, 'c'], [26, 16, 'C'], [25, 17, 'C'], [24, 17, 'C'], [23, 17, 'P']],
    codos: { izq: [17, 14], der: [27, 15] },
    boca: [22, 17],
  },
};
const COLOR_RIFLE = { G: 24, g: 25, o: 0, r: 5, d: 4, y: 45 };
function brazoHasta(q, desde, hasta, color) {
  let [x, y] = desde;
  const [x1, y1] = hasta;
  while (x !== x1 || y !== y1) {
    const k = y * ANCHO + x;
    q.idx[k] = color; q.duenio[k] = PARTE.brazo;
    if (x !== x1) x += Math.sign(x1 - x);
    if (y !== y1 && Math.abs(y1 - y) >= Math.abs(x1 - x)) y += Math.sign(y1 - y);
  }
}
function armasDadoVuelta(q, girado, colores) {
  const A = GIRO_ARMAS[girado];
  const color = (l) => (COLOR_RIFLE[l] ?? colores[l]);
  // Los hombros: la fila 14 del cuerpo, de punta a punta.
  let x0 = ANCHO, x1 = -1;
  for (let x = 0; x < ANCHO; x++) if (q.idx[14 * ANCHO + x] >= 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  // La cabeza, caída sobre la culata.
  const [cx, cy] = A.cabeza;
  const cabeza = [];
  for (let k = 0; k < ANCHO * ALTO; k++) if (q.idx[k] >= 0 && q.duenio[k] === PARTE.cabeza) { cabeza.push([k, q.idx[k]]); q.idx[k] = -1; q.duenio[k] = 0; }
  for (const [k, c] of cabeza) { const n = k + cy * ANCHO + cx; q.idx[n] = c; q.duenio[n] = PARTE.cabeza; }
  // Y las líneas finas de la cara (el bigote, los ojos), que van de a tercios de punto: las que quedan arriba de los hombros.
  q.finos = (q.finos || []).map((f) => {
    let deCabeza = true;
    for (let n = 1; n < f.puntos.length; n += 2) if (f.puntos[n] >= 14 * 3) { deCabeza = false; break; }
    return deCabeza ? { ...f, puntos: f.puntos.map((v, n) => v + (n % 2 ? cy : cx) * 3) } : f;
  });
  for (const [x, y, l] of A.detras) {
    const k = y * ANCHO + x;
    if (q.idx[k] < 0) { q.idx[k] = color(l); q.duenio[k] = PARTE.brazo; }
  }
  brazoHasta(q, [x0 - 1, 14], A.codos.izq, colores.C);
  brazoHasta(q, [x1 + 1, 14], A.codos.der, colores.C);
  for (const [x, y, l] of A.delante) { const k = y * ANCHO + x; q.idx[k] = color(l); q.duenio[k] = PARTE.brazo; }
  q.boca = A.boca;
}
/**
 * 🆕 E4 · APUNTANDO *(Santi eligió "las dos manos")*: con `empuna` (0 el rifle recién sacado y cruzado, 1 encarado) y
 * `ang` (hacia dónde, en el dibujo), suelta las riendas y apunta como el guardia de a pie, con los brazos del arma.
 * Sentado derecho, la silla debajo y la funda vacía. Las riendas quedan sobre la cabeza de la silla.
 */
export function lienzoJineteGente({ aspecto = {}, tipo = 'guardia', vista = 'lado', cuadro = null, silla = true, rifle = true, fino = false, empuna = null, ang = 0 }, luz = 0, destello = false) {
  const clave = [JSON.stringify(aspecto), tipo, vista, cuadro ?? 'Q', silla, rifle, fino, luz, destello, empuna ?? '', empuna != null ? Math.round(ang * 100) : ''].join('|');
  let g = jinetes.get(clave);
  if (g) return g;
  if (jinetes.size > 600) jinetes.clear();
  const apunta = empuna != null;
  const M = montado(vista, cuadro, { silla, rifle });
  const { piernas } = M;
  const mano = apunta ? RIENDAS_SUELTAS[vista] : M.mano;
  /**
   * 🆕 E4 · SE DA VUELTA EN LA SILLA *(Santi eligió la 1: "las piernas deberían quedar en su lugar y solo que se
   * mueva el torso")*: de perfil, apuntando muy para arriba o muy para abajo, el rifle quedaba escondido detrás del
   * cuerpo. Ahí las piernas siguen de costado sobre el caballo, y de la cintura para arriba va el guardia de espaldas
   * (apunta para arriba) o de frente (para abajo), que es como gira el de a pie.
   */
  // (Recién sacado, con el rifle todavía cruzado, sigue de costado: se da vuelta al encararlo.)
  const girado = apunta && empuna >= 0.5 && vista === 'lado' && Math.abs(ang) >= GIRA_EN ? (ang < 0 ? 'espalda' : 'frente') : null;
  let q;
  if (girado) {
    const torso = cuadroGente({ ...aspecto, tipo, vista: girado, piernas: 'M0', ang: 0, brazos: { lista: [], props: [] }, fino });
    const patas = cuadroGente({ ...aspecto, tipo, vista, piernas, ang: 0, brazos: M.brazos, fino });
    q = { ...torso, idx: new Array(ANCHO * ALTO).fill(-1), duenio: new Array(ANCHO * ALTO).fill(0) };
    for (let k = 0; k < ANCHO * ALTO; k++) {
      if (patas.idx[k] >= 0 && patas.duenio[k] === PARTE.piernas) { q.idx[k] = patas.idx[k]; q.duenio[k] = PARTE.piernas; }
      if (torso.idx[k] >= 0 && torso.duenio[k] !== PARTE.piernas) { q.idx[k] = torso.idx[k]; q.duenio[k] = torso.duenio[k]; }
    }
    // (Con chaqueta, las mangas de lona, como las pinta darForma en jugador.js.)
    const colores = capasPersona({ ...aspecto, tipo, vista: girado }).colores;
    armasDadoVuelta(q, girado, aspecto.chaqueta ? { ...colores, L: 37, C: 36, c: 35 } : colores);
  } else {
    q = apunta
      ? cuadroGente({ ...aspecto, tipo, vista, piernas, ang, arma: 'winchester', empuna, fino })
      : cuadroGente({ ...aspecto, tipo, vista, piernas, ang: 0, brazos: M.brazos, fino });
  }
  if (apunta && silla) {
    // La silla, debajo de todo lo que ya está dibujado.
    q.idx = q.idx.slice(); q.duenio = q.duenio.slice();
    for (const [x, y, c] of puntosDeSilla(vista, { rifle, vacia: true })) {
      const k = y * ANCHO + x;
      if (x < 0 || y < 0 || x >= ANCHO || y >= ALTO || q.idx[k] >= 0) continue;
      q.idx[k] = c; q.duenio[k] = PARTE.silla;
    }
  }
  const indices = destello ? q.idx.map((i) => (i > 0 ? sombrear(i, 4) : i)) : q.idx;
  const cv = document.createElement('canvas');
  cv.width = ANCHO; cv.height = ALTO;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: ANCHO, alto: ALTO, indices, campo: () => luz }), ANCHO, ALTO), 0, 0);
  const finos = (q.finos || []).map((f) => ({ color: f.fijo ? f.color : sombrear(f.color, luz), puntos: f.puntos }));
  const borde = bordeSilla(q);
  if (borde) finos.push({ color: 0, puntos: borde });
  // (`hacia`: si te apunta de frente o de espaldas, el fogonazo es otro dibujo; ver dibujarFogonazo en entities/bullet.js.)
  g = { img: cv, mano, finos, boca: q.boca || null, hacia: girado };
  jinetes.set(clave, g);
  return g;
}
/** 🆕 Los colores de una persona (el jinete chico de la ley se pinta con ellos, ver lienzoJineteChico). */
export function coloresDe(aspecto = {}, tipo = 'guardia', vista = 'lado') {
  return capasPersona({ ...aspecto, tipo, vista }).colores;
}

const guardados = new Map();
const CLAVES = ['pala', 'paleo', 'mandos', 'manos', 'dinamita', 'cartuchos', 'tipo', 'vista', 'piernas', 'arma', 'ang', 'empuna', 'golpe', 'desenfunda', 'aturdido', 'brazos', 'accion', 'k', 'lleva', 'bandera', 'fuma', 'fumaModo', 'cartas', 'enfundado', 'fino', 'sombrero', 'piel', 'pelo', 'uniforme', 'barba', 'peinado', 'panuelo', 'colorSombrero', 'funda', 'ropa', 'arremangada', 'cuerpo', 'chaqueta', 'doble', 'dobleModo', 'orilla', 'orillaLado', 'mesa', 'saco', 'chaleco', 'guantes', 'recostado'];
/** El cuadro iluminado, como canvas, con la boca y el hombro (se guarda). `destello`: el balazo que recibió. */
export function lienzoGente(o, luz = 0, destello = false) {
  const clave = CLAVES.map((k) => (k === 'ang' ? Math.round((o.ang || 0) * 100) : o[k] ?? '')).join('|') + '|' + luz + (destello ? '|d' : '');
  let g = guardados.get(clave);
  if (g) return g;
  if (guardados.size > 1500) guardados.clear();
  const q = cuadroGente(o);
  const indices = destello ? q.idx.map((i) => (i > 0 ? sombrear(i, 4) : i)) : q.idx;
  const datos = iluminar({ ancho: ANCHO, alto: ALTO, indices, campo: () => luz });
  /**
   * 🆕 P3c · EL ESTADO DEL JEFE EN LA ORILLA (`orilla`, un color de la paleta) *(Santi eligió la A:
   * "pondría que la luz solo aparezca del lado dónde está la luz")*: el último punto de la figura del
   * lado de la luz (`orillaLado` 1 a la derecha, -1 a la izquierda) se pinta de ese color, sin
   * oscurecerse con la luz del lugar.
   */
  if (o.orilla != null && o.orillaLado) {
    const [cr, cg, cb] = RGB[o.orilla], L = o.orillaLado;
    for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
      const k = y * ANCHO + x, xv = x + L;
      if (indices[k] < 0 || (xv >= 0 && xv < ANCHO && indices[k + L] >= 0)) continue;
      datos[k * 4] = cr; datos[k * 4 + 1] = cg; datos[k * 4 + 2] = cb;
    }
  }
  const cv = document.createElement('canvas');
  cv.width = ANCHO; cv.height = ALTO;
  cv.getContext('2d').putImageData(new ImageData(datos, ANCHO, ALTO), 0, 0);
  g = { img: cv, boca: q.boca, hombro: q.hombro, brasa: q.brasa || null, humo: q.humo || null, fumaK: q.fumaK ?? null, pita: !!q.pita,
    finos: q.finos && q.finos.map((f) => ({ color: f.fijo ? f.color : sombrear(f.color, luz), puntos: f.puntos })) };
  guardados.set(clave, g);
  return g;
}
