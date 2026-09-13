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
  '.': { solid: false, blocksSight: false, blocksBullets: false },  // suelo
  'E': { solid: false, blocksSight: false, blocksBullets: false },  // salida (te espera el caballo)
  '+': { solid: false, blocksSight: false, blocksBullets: false },  // enganche entre vagones
  'X': { solid: true,  blocksSight: true,  blocksBullets: true },   // el vacío: fuera del tren

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
   * 'M' montículo: no se pisa, y tapa la vista y las balas DE LOS DE ADENTRO.
   *    `tapaSoloDeAdentro`: los jinetes cabalgan más alto y tiran desde el
   *    costado, así que para ellos no existe (systems/riders.js y combat.js).
   *    La regla central del juego: la cobertura que te salva de los guardias
   *    es la que te deja expuesto a los de afuera.
   */
  'K': { solid: false, blocksSight: false, blocksBullets: false, freno: 'carbon' },
  'M': { solid: true,  blocksSight: true,  blocksBullets: true, tapaSoloDeAdentro: true },
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
    isSolidAt: (px, py) => TILE_RULES[tileAtPixel(px, py)].solid,
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

    /** ¿Lo que hay acá tapa sólo a los de adentro? (el montículo de carbón, 'M') */
    tapaSoloDeAdentroAt: (px, py) =>
      dentro(px, py) && !!TILE_RULES[tileAtPixel(px, py)].tapaSoloDeAdentro,

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
