/**
 * LA REGIÓN DESIERTO — el mapa de rutas.
 *
 * Es un mapa de la época: papel envejecido, tinta marrón y símbolos. No es
 * una pantalla de selección de nivel con la palabra "mapa" encima, y la
 * diferencia no es estética sino de diseño:
 *
 *   - **Las vías se dibujan con el travesaño clásico** (la línea con las
 *     rayitas cruzadas). Es EL símbolo de ferrocarril en cualquier mapa de
 *     1880, y se reconoce sin que nadie lo explique. Una línea pelada sería
 *     un camino.
 *   - **Los trenes se mueven de verdad por el riel.** "Ver si hay un tren
 *     andando" no es un cartel que lo diga: es un puntito con humo avanzando
 *     por la línea. Un mapa donde algo se mueve es un mapa vivo; uno donde
 *     todo está quieto es una ilustración.
 *   - **Hay ramales sin servicio.** Si todas las líneas sirvieran siempre,
 *     el mapa sería una lista de botones dibujada bonita. Que uno esté
 *     muerto es lo que convierte mirar el mapa en leerlo.
 *
 * LAS VÍAS SON CIRCUITOS, NO IDAS Y VUELTAS. Un tren no llega a un punto y se
 * vuelve marcha atrás por donde vino: hace un CIRCUITO — sale de una estación,
 * para en unas cuantas, y termina volviendo a la misma de donde salió. Por eso
 * cada ruta circular tiene su `puntos` cerrado (el último punto es el primero),
 * su `terminal` (de dónde sale y a dónde vuelve) y sus `paradas`.
 *
 * Y ESO ES LO QUE MUEVE EL SORTEO. El tren no es algo que inventa el cursor
 * cuando mirás: es un objeto que da vueltas y va cambiando solo.
 *
 *   - Al completar la vuelta entera (vuelve a su terminal) → se sortea de
 *     nuevo QUÉ TIPO DE TREN es. Es otro tren: otra formación, otra carga.
 *   - Al pasar por una parada → se sortea de nuevo la DIFICULTAD. Puede subir,
 *     bajar o quedarse igual: en cada estación sube y baja escolta.
 *
 * Consecuencia buena, y sale sola de la geometría: **como todos los trenes
 * andan a la misma velocidad real, el tamaño del circuito decide cada cuánto
 * cambia el tren.** El circuito chico da la vuelta en ~25s y cambia de tipo
 * seguido; el grande tarda más de un minuto y es "el tren de esa línea"
 * durante toda tu visita. El tamaño dejó de ser decoración.
 *
 * MÁS LAS QUE VIENEN DE OTRA REGIÓN (`entraDesdeAfuera`). No son circuitos:
 * entran por el borde derecho del papel, cruzan y se pierden por otro lado.
 * Cuando se van, esa vía queda sin tren un rato hasta que aparece OTRO
 * (`esperaMin`/`esperaMax`), y ése viene con tipo y dificultad nuevos. Son la
 * costura con las regiones que todavía no existen, y de paso le enseñan al
 * mapa algo que ninguna otra vía puede: que a veces no hay nada que robar y
 * hay que esperar.
 *
 * Todo está en coordenadas de la vista (384x216): el mapa se ve entero, sin
 * cámara. Un mapa que hay que arrastrar para ver es un mapa que no se puede
 * leer de un vistazo, y de un vistazo es exactamente como hay que leerlo.
 */

export const REGION = {
  nombre: 'REGIÓN DESIERTO',

  /** El marco del papel. Todo lo demás vive adentro. */
  marco: { x: 6, y: 6, w: 372, h: 204 },

  /**
   * LOS LUGARES. No son visitables todavía (el pueblo que existe es uno solo,
   * `scenes/townScene.js`), pero son lo que le da sentido a que una vía vaya
   * de un lado a otro: sin puntas, las líneas no van a ninguna parte.
   *
   * No son todos pueblos, y eso importa: una MINA y un PUESTO explican por qué
   * hay ramales que no unen dos ciudades. En 1880 el ferrocarril iba a buscar
   * mineral tanto como gente.
   *
   * `etiqueta` es de qué lado del símbolo va el nombre, para que ninguno se
   * pise con otro ni con una vía.
   */
  /**
   * `etiqueta` es de qué lado del símbolo va el nombre, y NO es decoración:
   * cada uno está puesto en la única dirección donde no le pasa una vía por
   * encima. Si se mueve una ruta, hay que volver a mirar los nombres.
   */
  lugares: [
    /**
     * El oeste es el único lado de Piedra Roja sin una vía encima (le entran
     * cuatro ramales: noroeste, noreste, este y sudoeste), así que el nombre
     * va sí o sí ahí — y "PIEDRA ROJA" mide 54px, o sea que el pueblo no
     * puede estar más cerca del borde que esto o el nombre se sale del papel.
     */
    { id: 'piedraroja',   tipo: 'pueblo', nombre: 'PIEDRA ROJA',   x: 76,  y: 74,  etiqueta: 'izq' },
    { id: 'alamoseco',    tipo: 'pueblo', nombre: 'ÁLAMO SECO',    x: 296, y: 36,  etiqueta: 'arriba' },
    { id: 'fuertebravo',  tipo: 'pueblo', nombre: 'FUERTE BRAVO',  x: 340, y: 108, etiqueta: 'abajo' },
    { id: 'sancristobal', tipo: 'pueblo', nombre: 'SAN CRISTÓBAL', x: 72,  y: 174, etiqueta: 'abajo' },
    { id: 'pasodeloro',   tipo: 'pueblo', nombre: 'PASO DEL ORO',  x: 186, y: 104, etiqueta: 'arriba' },
    { id: 'laviuda',      tipo: 'mina',   nombre: 'MINA LA VIUDA', x: 92,  y: 28,  etiqueta: 'arriba' },
    { id: 'puestoseco',   tipo: 'puesto', nombre: 'PUESTO SECO',   x: 232, y: 126, etiqueta: 'der' },
  ],

  /** Dónde estás vos. Marcado con una carpita, como corresponde. */
  campamento: { x: 112, y: 80, nombre: 'TU CAMPAMENTO' },

  /**
   * A QUÉ VELOCIDAD REAL ANDAN LOS TRENES, en píxeles de mapa por segundo.
   *
   * Es UNA sola para todos, y ahí está el truco: como el circuito chico mide
   * la tercera parte que el grande, darle la vuelta le lleva la tercera parte
   * del tiempo — y como la vuelta completa es lo que sortea de nuevo el tipo
   * de tren, el circuito chico cambia de tren tres veces más seguido. No hace
   * falta escribirle un número a cada ruta: sale de su tamaño.
   */
  velocidadTren: 7,

  /**
   * EL TERRENO. Puro símbolo de mapa viejo: sierras en chevrones, un río, un
   * par de mesetas y cactus sueltos. No afecta a nada mecánicamente — y aun
   * así es lo que hace que esto se lea como una región y no como un diagrama
   * de cuatro líneas.
   */
  terreno: [
    /**
     * LAS SIERRAS ESTÁN PUESTAS DONDE PASAN LOS TÚNELES, no al revés.
     * Un túnel dibujado en el llano se lee como un error de imprenta; lo que
     * lo explica es la montaña encima. Si se mueve un túnel, hay que mover su
     * sierra — están atadas por la vista, aunque el código no lo obligue.
     */
    { tipo: 'sierra', puntos: [[102, 38], [114, 34]] },    // túnel de la Línea del Norte
    { tipo: 'sierra', puntos: [[337, 53], [349, 45]] },    // túnel del Ramal del Río

    // Y unas sierras decorativas, sin vía, para que la cordillera no parezca
    // hecha sólo de los pedazos que le hacían falta al ferrocarril.
    { tipo: 'sierra', puntos: [[236, 56]] },
    { tipo: 'sierra', puntos: [[318, 76]] },

    { tipo: 'rio', puntos: [[370, 18], [364, 50], [370, 84], [362, 116], [368, 148], [360, 180]] },

    { tipo: 'meseta', x: 248, y: 102, w: 32, h: 12 },
    { tipo: 'meseta', x: 96, y: 110, w: 26, h: 11 },

    { tipo: 'cactus', x: 68, y: 46 },
    { tipo: 'cactus', x: 166, y: 58 },
    { tipo: 'cactus', x: 306, y: 72 },
    { tipo: 'cactus', x: 150, y: 190 },
    { tipo: 'cactus', x: 60, y: 122 },
    { tipo: 'dunas', x: 232, y: 92 },
    { tipo: 'dunas', x: 110, y: 152 },
    { tipo: 'dunas', x: 330, y: 100 },
  ],

  /**
   * LAS RUTAS.
   *
   * `puntos` es la polilínea por donde corre la vía.
   *
   *   circular       el último punto ES el primero: el tren da la vuelta y
   *                  sigue, no rebota. `puntos[0]` es la terminal.
   *   terminal       id del lugar de donde sale y a donde vuelve. Al pasar por
   *                  acá se sortea de nuevo QUÉ TIPO DE TREN es.
   *   paradas        `{ i, lugar }` — `i` es el índice dentro de `puntos`, así
   *                  que mover una coordenada no obliga a recalcular nada. Al
   *                  pasar por una parada se sortea de nuevo la DIFICULTAD.
   *   entraDesdeAfuera  no es un circuito: entra por el borde derecho del
   *                  papel, cruza y se va. Cuando se va, la vía queda vacía
   *                  entre `esperaMin` y `esperaMax` segundos, y después
   *                  aparece OTRO tren (tipo y dificultad nuevos).
   *   servicio       false = ramal muerto, nunca tiene tren.
   *   tuneles        tramos por donde la vía va bajo tierra, en fracciones
   *                  del recorrido (0 a 1).
   */
  rutas: [
    {
      /**
       * EL CIRCUITO DE LA MINA — el más chico del mapa, y por eso el que
       * cambia de tren más seguido: da la vuelta en unos 25 segundos. Sube el
       * mineral de La Viuda hasta Piedra Roja y vuelve por el faldeo.
       */
      id: 'mina',
      nombre: 'CIRCUITO DE LA MINA',
      circular: true,
      terminal: 'piedraroja',
      /**
       * Sale de Piedra Roja hacia el NOROESTE y vuelve por el NORESTE. Los dos
       * ramales tienen que llegar al pueblo con ángulos bien distintos: en la
       * primera versión éste y la Vía del Desierto entraban los dos desde el
       * este, casi paralelos, y se leían como una sola vía gruesa.
       */
      puntos: [
        [76, 74], [62, 54], [54, 36], [72, 28], [92, 28],
        [100, 44], [94, 58], [86, 68], [76, 74],
      ],
      paradas: [{ i: 4, lugar: 'laviuda' }],
      tuneles: [],
    },
    {
      /**
       * LA LÍNEA DEL NORTE — el circuito grande: más de un minuto de vuelta.
       * Es "el tren de esa línea" durante toda tu visita al mapa, porque no
       * llega a completar el giro mientras lo mirás.
       */
      id: 'norte',
      nombre: 'LÍNEA DEL NORTE',
      circular: true,
      terminal: 'alamoseco',
      /**
       * Va por el filo de arriba y vuelve por un arco alto que pasa BIEN por
       * encima del Paso del Oro sin tocarlo. Bajarla hasta el Paso le habría
       * dado una parada más, pero ese pueblo ya recibe cuatro ramales y el
       * quinto convertía el cruce en un borrón.
       */
      puntos: [
        [296, 36], [252, 42], [204, 46], [158, 46], [120, 40], [92, 28],
        [118, 52], [150, 70], [186, 76], [222, 72], [258, 58], [296, 36],
      ],
      paradas: [{ i: 5, lugar: 'laviuda' }],
      // Se mete bajo la sierra justo antes de llegar a la mina.
      tuneles: [[0.33, 0.375]],
    },
    {
      /**
       * LA VÍA DEL DESIERTO — el circuito del sur. Baja de Piedra Roja a San
       * Cristóbal, cruza al Paso del Oro y vuelve por el llano.
       */
      id: 'desierto',
      nombre: 'VÍA DEL DESIERTO',
      circular: true,
      terminal: 'piedraroja',
      puntos: [
        [76, 74], [46, 98], [44, 132], [56, 154], [72, 174],
        [108, 170], [136, 150], [162, 128], [186, 104],
        [152, 112], [116, 104], [94, 88], [76, 74],
      ],
      paradas: [{ i: 4, lugar: 'sancristobal' }, { i: 8, lugar: 'pasodeloro' }],
      tuneles: [],
    },
    {
      /**
       * EL RAMAL DEL RÍO — circuito corto del este, entre Fuerte Bravo y
       * Álamo Seco, con el río al costado y un túnel en la garganta.
       */
      id: 'rio',
      nombre: 'RAMAL DEL RÍO',
      circular: true,
      terminal: 'fuertebravo',
      /**
       * Los dos ramales salen de Fuerte Bravo hacia ARRIBA (noreste y
       * oeste-noroeste), y eso es a propósito: deja el sur del pueblo
       * despejado para su nombre, que si no queda cruzado por la propia vía.
       */
      puntos: [
        [340, 108], [362, 84], [354, 56], [332, 42], [296, 36],
        [284, 58], [284, 84], [302, 100], [340, 108],
      ],
      paradas: [{ i: 4, lugar: 'alamoseco' }],
      tuneles: [[0.29, 0.35]],
    },

    /**
     * LAS DOS QUE VIENEN DE AFUERA.
     *
     * Entran por la derecha del papel, cruzan la región y se pierden por otro
     * lado. No dan la vuelta: se van, y esa vía queda muerta un rato hasta que
     * asoma el próximo. Son la única parte del mapa que a veces NO tiene nada
     * que robar, y esperar a que aparezca uno es una jugada como cualquier
     * otra.
     */
    {
      id: 'territorio',
      nombre: 'LÍNEA DEL TERRITORIO',
      entraDesdeAfuera: true,
      // Roza el norte de la región y se va por arriba. No para en ningún lado:
      // es un expreso que pasa, no un tren de acá.
      puntos: [[382, 30], [344, 24], [306, 18], [268, 14], [232, 12], [196, 12], [168, 10]],
      paradas: [],
      esperaMin: 16, esperaMax: 32,
      tuneles: [],
    },
    {
      id: 'llanuras',
      nombre: 'LÍNEA DE LAS LLANURAS',
      entraDesdeAfuera: true,
      // Cruza el sur entero de este a oeste y se va por el borde izquierdo.
      /**
       * Va casi horizontal por el sur, y tiene que pasar por el pasillo que
       * queda entre el nombre de Fuerte Bravo y el techo del cartucho: son
       * unos pocos píxeles de aire, y por eso este trazado se afinó mirando
       * el dibujo, no calculándolo.
       */
      puntos: [
        [382, 128], [350, 134], [318, 138], [286, 140], [256, 142],
        [228, 142], [200, 140], [172, 138], [144, 134], [112, 130],
        [76, 128], [14, 126],
      ],
      paradas: [],
      esperaMin: 20, esperaMax: 38,
      tuneles: [],
    },

    {
      /**
       * EL RAMAL MUERTO. Existe para que el mapa se LEA en vez de mirarse: si
       * todas las líneas tuvieran tren, elegir sería apretar cualquiera. Que
       * termine en un puesto abandonado y no en un pueblo lo explica solo.
       */
      id: 'puesto',
      nombre: 'RAMAL DEL PUESTO',
      servicio: false,
      puntos: [[186, 104], [210, 116], [232, 126]],
      paradas: [],
      tuneles: [],
    },
  ],
};
