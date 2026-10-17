/**
 * Tilemap: la grilla de tiles del escenario.
 *
 * El mapa NO es una imagen gigante: es una grilla de caracteres que se dibuja
 * tile por tile. Eso es lo que nos va a permitir armar trenes distintos
 * combinando vagones sin dibujar nada nuevo.
 */

import { CONFIG } from '../data/config.js';

/**
 * Qué hace cada carácter del mapa.
 *
 * Las TRES propiedades están separadas por esto: la VENTANILLA ('W') frena el
 * paso pero deja pasar la vista Y las balas. Es el primer tile del juego que
 * hace las tres cosas distintas, y es lo que hace posible que la ley te
 * dispare desde afuera del tren.
 *
 * 'H' (media pared, baranda) se comporta igual que la ventanilla: te podés
 * parapetar detrás, pero no te para una bala. Existe para el vagón de ganado,
 * que va al aire libre.
 *
 * La consecuencia de diseño es la buena: la cobertura que te salva de los
 * guardias de adentro es justo la que te deja expuesto a los de afuera.
 */
const TILE_RULES = {
  '#': { solid: true,  blocksSight: true,  blocksBullets: true },   // pared
  'S': { solid: true,  blocksSight: true,  blocksBullets: true },   // asiento
  'C': { solid: true,  blocksSight: true,  blocksBullets: true },   // carga, cajones, mesas
  'W': { solid: true,  blocksSight: false, blocksBullets: false },  // VENTANILLA
  'H': { solid: true,  blocksSight: false, blocksBullets: false },  // media pared / baranda
  /**
   * 🆕 EL BANCO DEL COMEDOR *(Santi: "haría que los bancos sean obstáculos… el shift se podría usar
   * contra el banco pero haría que se pueda disparar por encima del banco… lo que haría de cobertura
   * es la mesa en realidad: el cuerpo llega hasta el banco, pero la mesa para las balas")*: como la
   * baranda, frena el paso y te podés pegar con Shift, pero es bajo: pasan la vista y las balas. La
   * bala la frena la mesa de al lado.
   *
   * `margenX`: más angosto que la casilla (11 unidades, la tabla dibujada) y **pegado a su mesa**, con
   * una unidad para las piernas: así entre dos bancos vecinos queda más lugar, 24 unidades en vez de
   * 20 *(Santi: "lo que quería es que el espacio entre dos bancos sea un poco más grande")*. Sin mesa
   * al lado, centrado.
   */
  'B': { solid: true,  blocksSight: false, blocksBullets: false, margenX: 2.5 },
  /**
   * 🆕 LA CORTINA CERRADA DEL CAMAROTE (dormitorio, de noche) *(Santi eligió la A: "cerrada tapa la
   * vista pero se puede pasar")*: se atraviesa y la bala pasa (es paño), pero no se ve a través. Desde
   * adentro de la casilla sí (`seVeDesdeAdentro`, como la res): para esconderte, la cortina tiene que
   * estar entre vos y el que mira. Las pone `cerrarCortinas` (world/train.js).
   */
  'Q': { solid: false, blocksSight: true, blocksBullets: false, seVeDesdeAdentro: true },
  '.': { solid: false, blocksSight: false, blocksBullets: false },  // suelo
  'E': { solid: false, blocksSight: false, blocksBullets: false },  // salida (te espera el caballo)
  '+': { solid: false, blocksSight: false, blocksBullets: false },  // enganche entre vagones
  'X': { solid: true,  blocksSight: true,  blocksBullets: true },   // el vacío: fuera del tren

  /**
   * 🌬️ EL AIRE DEL ENGANCHE: a los costados de la pasarela, entre dos vagones.
   * No se pisa (te caerías del tren), pero **ahí no hay pared** *(Santi: "haz
   * que por los enganches se pueda disparar, porque en realidad ahí no hay
   * pared")*: pasan la vista y las balas, como por una ventanilla.
   *
   * Antes era 'X', el vacío ciego, y eso hacía del enganche una caja cerrada:
   * no le podías tirar a un jinete desde ahí, y él a vos tampoco.
   *
   * `sinCobertura`: sigue siendo sólida para caminar, pero **no es una pared
   * contra la que pegarse** (`findCoverSurface`, systems/cover.js). Sin esto
   * te parapetabas contra el aire y los jinetes dejaban de verte.
   */
  'O': { solid: true,  blocksSight: false, blocksBullets: false, sinCobertura: true },

  /**
   * LA RES COLGADA (vagón refrigerado) — lo contrario de la ventanilla.
   *
   * Tapa la vista y NO las balas: un laberinto donde se ve poco y se tira a
   * ciegas. Y se atraviesa, pero frena a la mitad (`CONFIG.casillasQueFrenan`).
   *
   * `seVeDesdeAdentro`: la res en la que estás parado no te tapa. Para
   * esconderte tiene que haber OTRA entre vos y el que mira. Sin esto, pisar
   * cualquier res te hacía invisible desde todos lados: la vista se muestrea
   * cada 5 px, y el último punto antes de llegar a vos caía adentro de tu res.
   */
  'R': { solid: false, blocksSight: true, blocksBullets: false, seVeDesdeAdentro: true, freno: 'reses' },

  /**
   * LA GÓNDOLA (etapa 5) — el carbón llena el vagón hasta arriba, así que su
   * "piso" ES la superficie del carbón. Lo pisan todos, a la mitad.
   *
   * 'K' carbón: se camina, frena (`CONFIG.casillasQueFrenan.carbon`).
   * 'M' montículo: no se pisa, y tapa la vista y las balas, como la carga.
   *    Es otra casilla y no una 'C' sólo por el dibujo. Los jinetes no entran
   *    en la cuenta: las paredes de la góndola son altas (data/wagons.js).
   */
  'K': { solid: false, blocksSight: false, blocksBullets: false, freno: 'carbon' },
  'M': { solid: true,  blocksSight: true,  blocksBullets: true },
};

export function createTilemap(layout) {
  const size = CONFIG.tileSize;
  const rows = layout.length;
  const cols = layout[0].length;

  // Validación temprana: un error de una fila más corta es dificilísimo de
  // encontrar después, así que lo cazamos acá mismo.
  layout.forEach((row, i) => {
    if (row.length !== cols) {
      throw new Error(
        `tilemap: la fila ${i} tiene ${row.length} caracteres y debería tener ${cols}.`
      );
    }
    for (const ch of row) {
      if (!TILE_RULES[ch]) {
        throw new Error(`tilemap: carácter desconocido "${ch}" en la fila ${i}.`);
      }
    }
  });

  const grid = layout.map((row) => row.split(''));

  function tileAt(col, row) {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return '#';
    return grid[row][col];
  }

  function tileAtPixel(px, py) {
    return tileAt(Math.floor(px / size), Math.floor(py / size));
  }

  function dentro(px, py) {
    return px >= 0 && py >= 0 && px < cols * size && py < rows * size;
  }

  function blocksSightAt(px, py) {
    return dentro(px, py) && TILE_RULES[tileAtPixel(px, py)].blocksSight;
  }

  /**
   * ¿Este punto que tapa la vista es la casilla donde está parado alguno de
   * los dos extremos, y es de las que se ven desde adentro? `hasLineOfSight`
   * (engine/collision.js) lo pregunta ANTES de dar la vista por cortada.
   *
   * Va colgado de la función y no como parámetro para no tocar las decenas de
   * lugares que ya pasan `map.blocksSightAt`: quien la envuelva (las puertas,
   * en raidScene.js) tiene que copiarlo.
   */
  blocksSightAt.dejaVerDesdeAdentro = (px, py, ax, ay, bx, by) => {
    const col = Math.floor(px / size);
    const row = Math.floor(py / size);
    if (!TILE_RULES[tileAt(col, row)].seVeDesdeAdentro) return false;
    const enLaMisma = (x, y) => Math.floor(x / size) === col && Math.floor(y / size) === row;
    return enLaMisma(ax, ay) || enLaMisma(bx, by);
  };

  /**
   * Cuánto de cada costado de esta casilla es pasillo: [izquierda, derecha]. El banco va pegado a la
   * mesa que tenga al lado (una unidad para las piernas) y deja el resto del lado de afuera.
   */
  function margenes(col, row) {
    const regla = TILE_RULES[tileAt(col, row)];
    if (!regla.margenX) return [0, 0];
    const libre = 2 * regla.margenX;
    const mesaIzq = tileAt(col - 1, row) === 'C', mesaDer = tileAt(col + 1, row) === 'C';
    if (mesaDer && !mesaIzq) return [libre - 1, 1];
    if (mesaIzq && !mesaDer) return [1, libre - 1];
    return [regla.margenX, regla.margenX];
  }
  /** Sólido en este punto: la casilla, menos los costados de los que son más angostos (el banco). */
  function solidoEn(px, py) {
    const regla = TILE_RULES[tileAtPixel(px, py)];
    if (!regla.solid) return false;
    if (!regla.margenX) return true;
    const col = Math.floor(px / size), [izq, der] = margenes(col, Math.floor(py / size));
    const dx = px - col * size;
    return dx >= izq && dx <= size - der;
  }

  return {
    grid, rows, cols, size,
    width: cols * size,
    height: rows * size,
    bounds: { width: cols * size, height: rows * size },

    tileAt,
    tileAtPixel,

    dentro,

    /**
     * Fuera del mapa es sólido: nadie se puede caer del tren caminando.
     *
     * Pero fuera del mapa NO frena ni la vista ni las balas, y eso es nuevo y
     * necesario: la ley cabalga AFUERA de la grilla, arriba y abajo del tren.
     * Si el afuera bloqueara la vista, los jinetes no podrían ver por la
     * ventanilla; si bloqueara las balas, sus tiros morirían al salir del caño.
     *
     * No afecta a nada de adentro: entre dos puntos del vagón, la recta que los
     * une nunca se sale del rectángulo del mapa.
     */
    isSolidAt: (px, py) => solidoEn(px, py),
    /** ¿Hay acá algo contra lo que pegarse? Lo sólido, menos el aire del enganche. */
    daCoberturaAt: (px, py) => solidoEn(px, py) && !TILE_RULES[tileAtPixel(px, py)].sinCobertura,
    /** Cuánto de cada costado de esta casilla es pasillo, [izquierda, derecha] (el banco). */
    margenes,
    blocksSightAt,
    blocksBulletsAt: (px, py) =>
      dentro(px, py) && TILE_RULES[tileAtPixel(px, py)].blocksBullets,

    /**
     * Por cuánto se multiplica la velocidad de quien está parado acá: 1 en
     * casi todo el tren, 0,5 entre las reses. Frena a TODOS los que caminan
     * (jugador, guardias, pasajeros): lo que se eligió para la góndola.
     */
    frenoAt(px, py) {
      const freno = TILE_RULES[tileAtPixel(px, py)].freno;
      return freno ? CONFIG.casillasQueFrenan[freno] : 1;
    },

    /** Igual que isSolidAt pero en coordenadas de tile, no de píxel. */
    isSolidTile: (col, row) => TILE_RULES[tileAt(col, row)].solid,

    /** Centro en píxeles de un tile. Los datos hablan en tiles; el juego, en píxeles. */
    tileCenter(col, row) {
      return { x: col * size + size / 2, y: row * size + size / 2 };
    },

    /** Todas las posiciones de un tipo de tile (por ejemplo, las puertas). */
    findTiles(char) {
      const found = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col] === char) found.push({ col, row });
        }
      }
      return found;
    },
  };
}
