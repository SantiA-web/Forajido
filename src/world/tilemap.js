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
  /**
   * 🆕 EL MOSTRADOR DE LA BARRA (primera clase) *(Santi: "una mesa bar con un bartender")*: frena el paso
   * y las balas (madera maciza: es cobertura), pero es bajo y se ve por encima (al bartender, detrás).
   */
  'T': { solid: true, blocksSight: false, blocksBullets: true, cubreBajo: true },
  /**
   * 🆕 LA MESITA DE PRIMERA CLASE *(Santi: "añadeles colisión como la de los bancos")*: frena el paso y
   * te podés pegar con Shift, pero es baja: pasan la vista y las balas. Más angosta que la casilla (la
   * tapa dibujada, de 18 puntos).
   */
  'N': { solid: true, blocksSight: false, blocksBullets: false, margenX: 1.25 },
  /**
   * 🆕 EL CAJÓN DE MUNICIÓN DONDE SE SIENTA EL GUARDIA DE FRANCO (vagón de guardias) *(Santi: "debería
   * funcionar como los asientos: siempre está ahí, al lado de la mesa, y no importa si hay guardias
   * sentados o no, siempre tienen que tener colisión")*: frena el paso; es bajo, pasan la vista y las
   * balas, como el banco del comedor. Del tamaño del cajón dibujado (`margenX`; `margenY`, arriba y abajo:
   * 7 de largo por 2,25 de fondo, bajo, debajo de los muslos del que está sentado: más hondo y más alto,
   * asomaba detrás de la espalda y parecía sentado al costado *(Santi: "que el guardia se siente en la parte de
   * arriba del cajón, no al costado")*). El guardia sentado arriba sí sale y vuelve: su cajón no lo frena
   * a él (`cajon`, ver `movSolidAt` en systems/ai.js).
   */
  'J': { solid: true, blocksSight: false, blocksBullets: false, margenX: 4.5, margenY: [8.5, 5.25] },
  /**
   * 🆕 LAS CAJAS DE MUNICIÓN APILADAS (vagón de guardias) *(Santi: "todos los cajones de munición… deberían
   * tener colisión")*: como la carga, frenan el paso, la vista y las balas.
   */
  'U': { solid: true, blocksSight: true, blocksBullets: true },
  /**
   * 🆕 EL PERCHERO DE LAS SACAS Y LA BALANZA DE LOS PAQUETES (vagón de correo): frenan el paso; son de fierro
   * y huecos, pasan la vista y las balas.
   */
  'P': { solid: true, blocksSight: false, blocksBullets: false },
  /**
   * 🆕 LA SILLA (el escritorio del caboose): del tamaño de la silla dibujada; baja, pasan la vista y las balas.
   */
  'Y': { solid: true, blocksSight: false, blocksBullets: false, margenX: 3.5, margenY: [6, 2] },
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
    // (Sólo el banco va pegado a la mesa: el cajón de munición y la silla, centrados.)
    if (tileAt(col, row) !== 'B') return [regla.margenX, regla.margenX];
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
    // (🆕 `margenY`: también más corto que la casilla de arriba a abajo, el cajón; [arriba, abajo] si no es parejo.)
    const [ma, mb] = Array.isArray(regla.margenY) ? regla.margenY : [regla.margenY || 0, regla.margenY || 0];
    const dy = py - Math.floor(py / size) * size;
    return dx >= izq && dx <= size - der && dy >= ma && dy <= size - mb;
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
     * 🆕 LA COBERTURA BAJA (`cubreBajo`: hoy el mostrador de la barra; mañana sillones, mesas o lo que
     * sea bajo) *(Santi: "al apuntar desde detrás de la barra con click derecho el personaje o guardia
     * pueda tirar y las balas no peguen contra la madera… y prepararía esta mecánica para que en un
     * futuro también se pueda implementar en sillones, mesas o cosas del estilo")*.
     *
     * Acá, sólo "¿le tapa al que tira por encima?" (no: a ninguna distancia, de ningún lado), para que el
     * guardia sepa que puede tirar; la regla entera, con las piernas del que está detrás, es `tapaLaBala` en
     * systems/combat.js. Para sumar un mueble, se le pone `cubreBajo: true` a su casilla.
     */
    balasTapanDesde: (sx, sy, porEncima) => (px, py) => {
      if (!dentro(px, py)) return false;
      const regla = TILE_RULES[tileAtPixel(px, py)];
      if (!regla.blocksBullets) return false;
      return !(porEncima && regla.cubreBajo);
    },
    /** ¿Es cobertura baja? (ver `tapaLaBala` en systems/combat.js) */
    cubreBajoAt: (px, py) => dentro(px, py) && !!TILE_RULES[tileAtPixel(px, py)].cubreBajo,

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
