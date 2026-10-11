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
import { sombrear } from '../../engine/paleta.js';
import { C, ANCHO, ALTO, OX, OY, cuadroJugador, armaEn, linea } from './jugador.js';

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
      frente: ['BB...........BB', 'BB...........BB', 'BBB.........BBB', 'BBB.........BBB', 'BBBB.BBBBB.BBBB', 'BBBBBBbbbBBBBBB', 'BBBBBB...BBBBBB', '.BBBBBBbBBBBBB.', '.BBBBBBBBBBBBB.', '..BBBBBbBBBBB..', '..BBBBBBBBBBB..', '...BBBBbBBBB...', '....BBBBBBB....', '.....BBbBB.....', '......BBB......'],
      diagF: ['.BB............', '.BB............', '.BBB...........', '.BBB...........', '.BBBB..BBBBB...', '.BBBBBBBbbbBB..', '.BBBBBBB...BB..', '..BBBBBBBbBBB..', '..BBBBBBBBBBB..', '...BBBBBbBBB...', '...BBBBBBBBB...', '....BBBBbBB....', '.....BBBBB.....', '......BbB......', '.......B.......'],
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
  // El de paja del civil: ala ancha que cae un poco en las puntas.
  paja: {
    frente: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    diagF: mapa(0, ['.........hHHHk', '.........bbbbb', '....hhhhHHHHHHHkkkk', '...xkkkkkkkkkkkkkkx']),
    lado: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    diagE: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    espalda: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
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
    lado: mapa(8, ['.......UVVvC', '.......UVVvc', '.......UVVve', '.......UVVvE', '.......UVVvy', '.......UVVvv', '.......VVVvw', '.......VVVvw', '.......WWyWG']),
    diagE: mapa(8, ['.......CVVVCvc', '........UVVcv', '........UVVVv', '........UVVvv', '........UVVvv', '........UVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
    espalda: mapa(8, ['.......CVVCVVc', '........UVcVv', '........UVVVv', '........UVVvv', '........UVVvv', '........VVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
  },
  pasajero: {
    frente: mapa(8, ['.......CURSrVc', '........UCRCv', '........UVyVv', '........UVVvv', '........UVyvv', '........VVVvv', '........VVyvw', '........VVVvw', '........WyGyW']),
    diagF: mapa(8, ['.......CUVRSrc', '........UUCRv', '........UVVyv', '........UVVvv', '........UVVyv', '........UVVvw', '........VVVyw', '........VVVvw', '........WyWGy']),
    lado: mapa(8, ['.......UVVvR', '.......UVVvr', '.......UVVvy', '.......UVVvv', '.......UVVvy', '.......UVVvv', '.......VVVvw', '.......VVVvw', '.......WWyWG']),
    diagE: mapa(8, ['.......CVVVCvc', '........UVVcv', '........UVVVv', '........UVVvv', '........UVVvv', '........UVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
    espalda: mapa(8, ['.......CVVCVVc', '........UVcVv', '........UVVVv', '........UVVvv', '........UVVvv', '........VVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
  },
};

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
  clara: { oscuro: [11, 47], rubio: [12, 11], canas: [15, 14] },
  media: { oscuro: [47, 32], rubio: [11, 47], canas: [15, 14] },
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
  barba: { afeitado: 0.2, completa: 0.3, bigote: 0.25, candado: 0.1, patillas: 0.1, larga: 0.05 },
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
  if (tipo === 'guardia') a.sombrero = elegir(PESO.sombreroGuardia, azar);
  else { a.sombrero = elegir(PESO.sombreroPasajero, azar); a.panuelo = elegir(PESO.panuelo, azar); }
  if (a.sombrero !== 'paja' && a.sombrero !== 'ninguno') a.colorSombrero = elegir(PESO.colorSombrero, azar);
  a.barba = elegir(a.pelo === 'canas' ? PESO.barbaCanas : PESO.barba, azar);
  return a;
}
/** El aspecto de alguien: se sortea la primera vez que se lo dibuja y queda guardado. */
export function aspectoDe(ent, tipo) {
  return ent._aspecto || (ent._aspecto = sortearAspecto(tipo));
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
};
/** 🆕 La otra variante de los sombreros de fieltro: marrón oscuro con la cinta crema *(Santi)*. */
const COLOR_MARRON = { h: 4, H: 3, k: 32, x: 0, b: 16 };
const BASE = {
  guardia: {
    L: 17, C: 16, c: 15,                     // camisa clara
    y: 1, E: 45, e: 29, W: 1, G: 28,         // botones oscuros, la estrella de bronce con su brillo, cinto
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
export function capasPersona({ tipo, vista, sombrero, piel = 'media', pelo = 'castano', uniforme = 'bordo', barba = null, peinado = 'corto', panuelo = 'azul', colorSombrero = 'negro', funda = tipo === 'guardia' }) {
  // `sombrero` null es sin sombrero; sin decir nada, el de cada uno.
  const s = sombrero === undefined ? (tipo === 'guardia' ? 'plano' : 'bombin') : sombrero === 'ninguno' ? null : sombrero;
  const colores = { ...BASE[tipo], ...(tipo === 'guardia' ? UNIFORMES[uniforme] : {}), ...PIELES[piel], ...PELOS[pelo], ...(s ? (colorSombrero === 'marron' && s !== 'paja' ? COLOR_MARRON : COLOR_SOMBRERO[s]) : {}), ...(tipo === 'pasajero' ? COLORES_PANUELO[panuelo] : {}) };
  if (!funda) Object.assign(colores, vista === 'lado' ? { F: colores.I ?? C.I, f: colores.T ?? C.T } : { F: null, f: null });
  const cabeza = [CABEZA[vista]];
  if (tipo === 'pasajero') cabeza.push(PANUELO[vista]);
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
  if (vista === 'lado') return { colores, cabeza: cabeza.map(atrasUno), sombrero: atrasUno(sombreroMapa), torso: TORSOS[tipo][vista] };
  return { colores, cabeza, sombrero: sombreroMapa, torso: TORSOS[tipo][vista] };
}

/**
 * UN CUADRO DE ALGUIEN: lo de la persona (ver capasPersona) y la pose, con los
 * mismos nombres que el jugador: `vista`, `piernas` ('quieto', 'W0'…),
 * `arma`, `ang`, `empuna`, `golpe`, `enfundado`. Devuelve los índices,
 * la boca del caño y el hombro.
 */
/** El dormido de perfil (ver DORMIDO_LADO), con su sombrero en el banco al lado. */
function cuadroDormidoLado(o) {
  const col = { ...C, ...capasPersona(o).colores };
  const idx = new Int16Array(ANCHO * ALTO).fill(-1);
  const poner = (x, y, i) => {
    if (i == null) return;
    x += OX; y += OY;
    if (x >= 0 && y >= 0 && x < ANCHO && y < ALTO) idx[y * ANCHO + x] = i;
  };
  for (const m of [DORMIDO_LADO]) m.filas.forEach((f, j) => {
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
  // 🔁 El rubio y el canoso, del tono del pelo (más claro): con el más oscuro el bigote
  // rubio se leía como una línea sucia *(Santi: "en el rubio noto que queda raro el bigote")*.
  const claro = o.pelo === 'rubio' || o.pelo === 'canas';
  const B = claro ? pelo.A : pelo.B, b = claro ? pelo.B : sombrear(pelo.B, -1);
  const colores = { B, b, X: sombra, x: boca };
  const cara = new Set([piel.P, piel.p, piel.q, piel.n, pelo.A, pelo.a, pelo.B]);
  // La larga cae sobre el cuello y el pecho: también el pañuelo, la camisa y el chaleco.
  if (o.barba === 'larga') {
    const col = capasPersona(o).colores;
    for (const k of 'SRrzLCcUVvwy') if (col[k] != null) cara.add(col[k]);
  }
  const [ox, oy] = BARBAS_FINAS.origen[o.vista];
  const grupos = {};
  M.forEach((f, j) => {
    for (let i = 0; i < f.length; i++) {
      const c = colores[f[i]];
      if (c == null) continue;
      const fx = (ox + q.cabeza[0] + OX) * 3 + i, fy = (oy + q.cabeza[1] + OY) * 3 + j;
      if (!cara.has(q.idx[Math.floor(fy / 3) * ANCHO + Math.floor(fx / 3)])) continue;
      (grupos[c] || (grupos[c] = [])).push(fx, fy);
    }
  });
  return Object.entries(grupos).map(([c, puntos]) => ({ color: +c, puntos }));
}

export function cuadroGente(o) {
  if (o.accion === 'dormido' && o.vista === 'lado') return cuadroDormidoLado(o);
  /**
   * FUMANDO (ver FUMAR): `fuma` el cuadro (0-7) y `fumaModo` 'mano' o 'boca'
   * (con el arma larga). El pasajero sentado lo pide como acción ('fumar', `k`).
   * Si en esa vista no fuma con la mano (el de franco de espaldas), sigue con lo suyo.
   */
  const sentado = o.piernas === 'sentado';
  const fk = o.accion === 'fumar' ? o.k ?? 0 : o.fuma ?? null;
  const modo = o.accion === 'fumar' ? 'mano' : o.fumaModo || 'mano';
  const atras = o.vista === 'lado' ? CABEZA_ATRAS : 0;
  const PF = fk != null && modo === 'mano' ? poseFumar(o.vista, fk, { sentado, cartas: !!o.cartas, atras }) : null;
  const FB0 = fk != null && modo === 'boca' ? FUMAR_BOCA[o.vista] : null;
  const FB = FB0 && atras ? { c: FB0.c && FB0.c.map(([x, y]) => [x - atras, y]), humo: [FB0.humo[0] - atras, FB0.humo[1]] } : FB0;
  // Lo que hace sentado (`accion`, ver poseSentado) se arma acá: así se guarda por nombre.
  let brazos = PF || (o.accion === 'fumar' ? poseSentado('quieto', o.vista)
    : o.accion ? poseSentado(o.accion, o.vista, o.k, o.lleva)
      : fk != null && o.cartas ? 'cartas' : o.brazos);
  const persona = capasPersona(o);
  // Agarrando el sombrero del banco: todavía no lo tiene puesto (está suelto, ver lienzoSombreroSuelto).
  if (brazos && brazos.sinSombrero) persona.sombrero = null;
  const q0 = cuadroJugador({ piernas: 'quieto', ang: 0, ...o, brazos, persona });
  const q = { ...q0, finos: barbaFina(o, q0) };
  const F = PF || FB;
  if (!F) return q;
  // El cigarrillo, encima de todo (el papel crema y la brasa); el humo y el brillo, en el mundo.
  const baja = sentado ? 4 : 0;
  const cig = PF ? PF.cig : FB.c;
  const pita = fk === 5 || fk === 6;
  const en = ([x, y]) => [x + OX, y + OY + baja];
  if (cig) {
    const [p, a] = cig.map(en);
    q.idx[p[1] * ANCHO + p[0]] = 17;
    q.idx[a[1] * ANCHO + a[0]] = pita ? 45 : 44;
  }
  return { ...q, brasa: cig ? en(cig[1]) : null, humo: en(F.humo), fumaK: fk, pita };
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
/** Su sombrero, apoyado en el banco al lado (el bombín de costado). */
/**
 * 🔁 SU SOMBRERO, APOYADO EN EL OTRO LUGAR DEL BANCO *(Santi: "que no quede encima
 * del respaldo y que parezca que está junto al personaje")*: cada banco tiene dos
 * lugares (uno arriba y otro abajo) y él ocupa uno; el sombrero va en el
 * almohadón del otro. Es un dibujo suelto (ver `lienzoSombreroSuelto`): el
 * bombín de costado, con la base en (3, 3).
 */
const SOMBRERO_SUELTO = mapa(0, ['..hHk', '.hHHHk', '.bbbbb', 'hHHHHHk']);

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
const CUADROS_SENTADO = {
  diario: ['regazo', 'medio', 'arriba', 'arriba+', 'arriba', 'hoja', 'arriba+', 'medio'],
  barajar: ['junto', 'abierto', 'cayendo', 'junto', 'abierto', 'cayendo', 'junto', 'junto'],
  equipaje: ['quieto', 'baja', 'abre', 'adentro', 'adentro2', 'adentro', 'abre', 'baja'],
};
/**
 * LA POSE DE UN PASAJERO SENTADO para `cuadroJugador` (`brazos`): `accion`
 * ('diario', 'barajar', 'equipaje', 'dormido'), `k` el cuadro (0-7) y `lleva`
 * ('maleta' o 'bolso', para el equipaje). En las diagonales (se dio vuelta
 * hacia vos) no hace nada: las manos en la falda.
 */
export function poseSentado(accion, vista, k = 0, lleva = 'maleta') {
  const V = vista === 'lado' || vista === 'frente' || vista === 'espalda' ? vista : null;
  // Dormido, los brazos cruzados y la cabeza caída; sin hacer nada, las manos en la falda.
  // Dormido respira: cada tanto la cabeza sube un punto (`k` impar).
  // Al despertarse: en las otras vistas (no se sientan así), quieto.
  if (accion === 'agarraSombrero' || accion === 'agarraSombreroArriba' || accion === 'poneSombrero') return POSES_SENTADO[accion][vista] || { ...POSES_SENTADO.dormido[vista], cabeza: 0, cabezaX: 0, inclina: 0, gacha: null };
  if (accion === 'dormido') { const D = POSES_SENTADO.dormido[vista]; return { ...D, cabeza: D.cabeza - (k % 2) }; }
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
  muerto: { alla: [[12, -2], [17, -5]], aca: [[12, 7], [18, 10]], pierna: [21, 7] },
  desmayado: { alla: [[12, -2], [18, -3]], aca: [[12, 7], [18, 8]], pierna: [21, 5] },
  caido: { alla: [[12, -2], [18, -3]], aca: null, pierna: [21, 5] },
};
const TA = 44, TL = 30, TX = 6, TY = 11;   // el lienzo del tirado, con lugar para el arma
export const PIES_TENDIDO = [TX + 16, TY + 3];
export { TA as ANCHO_TENDIDO, TL as ALTO_TENDIDO };
export function cuadroTendido({ tipo = 'guardia', modo = 'muerto', late = 0, ang = 0, arma = 'colt', fino = false, ...o }) {
  // La almohada (D d) y la frazada (N Z X, lana azul; S s la sábana) de la litera.
  const col = { ...C, ...capasPersona({ tipo, vista: 'frente', ...o }).colores, D: 17, d: 15, N: 20, Z: 19, X: 41, S: 17 };
  if (modo === 'cama') col.s = 16;
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
  const brazo = ([a, b], lejos) => {
    linea(a, b, (x, y) => { poner(x, y, lejos ? col.C : col.L); poner(x, y + 1, lejos ? col.c : col.C); });
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
    const S = [12, 6];
    const A = armaEn(arma, ang);
    const d = [Math.cos(A.angulo), Math.sin(A.angulo)];
    const M = [Math.round(S[0] + d[0] * 6), Math.round(S[1] + d[1] * 5)];
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
  frente: { abajo: [[7, 9], [6, 13], [6, 16]], sube: [[7, 9], [5, 13], [8, 10]], boca: [[7, 9], [4, 11], [9, 6]],
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
function poseFumar(vista, k, { sentado = false, cartas = false, atras = 0 } = {}) {
  const base = atras && FUMAR[vista] ? bocaAtras(FUMAR[vista], atras) : FUMAR[vista];
  const S = sentado ? FUMAR_SENTADO[vista] : null;
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
  const clave = [o.tipo, o.sombrero ?? '', o.colorSombrero ?? '', o.fino ? 1 : 0, luz].join('|');
  let g = sueltos.get(clave);
  if (g) return g;
  const col = { ...C, ...capasPersona({ vista: 'lado', ...o }).colores };
  const W = 9, H = 6, idx = new Int16Array(W * H).fill(-1);
  SOMBRERO_SUELTO.filas.forEach((f, j) => { for (let x = 0; x < f.length; x++) if (f[x] !== '.') idx[(j + 1) * W + x + 1] = col[f[x]]; });
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
  g = { img: cv, base: [4, 5] };
  sueltos.set(clave, g);
  return g;
}

const guardados = new Map();
const CLAVES = ['tipo', 'vista', 'piernas', 'arma', 'ang', 'empuna', 'golpe', 'desenfunda', 'aturdido', 'brazos', 'accion', 'k', 'lleva', 'bandera', 'fuma', 'fumaModo', 'cartas', 'enfundado', 'fino', 'sombrero', 'piel', 'pelo', 'uniforme', 'barba', 'peinado', 'panuelo', 'colorSombrero', 'funda'];
/** El cuadro iluminado, como canvas, con la boca y el hombro (se guarda). `destello`: el balazo que recibió. */
export function lienzoGente(o, luz = 0, destello = false) {
  const clave = CLAVES.map((k) => (k === 'ang' ? Math.round((o.ang || 0) * 100) : o[k] ?? '')).join('|') + '|' + luz + (destello ? '|d' : '');
  let g = guardados.get(clave);
  if (g) return g;
  if (guardados.size > 1500) guardados.clear();
  const q = cuadroGente(o);
  const indices = destello ? q.idx.map((i) => (i > 0 ? sombrear(i, 4) : i)) : q.idx;
  const datos = iluminar({ ancho: ANCHO, alto: ALTO, indices, campo: () => luz });
  const cv = document.createElement('canvas');
  cv.width = ANCHO; cv.height = ALTO;
  cv.getContext('2d').putImageData(new ImageData(datos, ANCHO, ALTO), 0, 0);
  g = { img: cv, boca: q.boca, hombro: q.hombro, brasa: q.brasa || null, humo: q.humo || null, fumaK: q.fumaK ?? null, pita: !!q.pita,
    finos: q.finos && q.finos.map((f) => ({ color: sombrear(f.color, luz), puntos: f.puntos })) };
  guardados.set(clave, g);
  return g;
}
