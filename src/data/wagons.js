/**
 * Plantillas de vagón.
 *
 * Cada plantilla es UN vagón suelto de 40x10 tiles. El tren se arma pegando
 * varios uno al lado del otro (world/train.js). Por eso todas las coordenadas
 * de acá son LOCALES al vagón (columna 0 a 39): el que arma el tren se encarga
 * de correrlas al lugar que le toque.
 *
 * Leyenda del mapa (cada carácter = 1 tile de 16px):
 *   #  pared                (frena el paso, la vista y las balas)
 *   S  asiento              (ídem: es cobertura)
 *   C  carga, mesa, corral  (ídem, pero se dibuja distinto según el vagón)
 *   .  suelo libre
 *   +  plataforma de enganche (el paso de un vagón al siguiente, al aire libre)
 *   X  el vacío             (fuera del tren: no se puede pisar)
 *   E  salida               (la plataforma trasera: ahí está tu caballo)
 *
 * REGLAS DE FORMA, para que los vagones se puedan enganchar entre sí:
 *   - 10 filas de alto, siempre.
 *   - el ancho lo elige cada vagón, pero todas SUS filas tienen que medir lo
 *     mismo. Si te equivocás, el juego te avisa en la consola (F12).
 *   - las filas 0 y 9 son todas pared.
 *   - las filas 4 y 5 empiezan y terminan con '+' (por ahí se sale al enganche).
 *
 * LOS VAGONES NO MIDEN TODOS LO MISMO, y es a propósito: si todos miden igual,
 * el tren no tiene ritmo — cruzar el de ganado (una bolsa, un guardia) cuesta
 * lo mismo que cruzar el blindado (dos cajas fuertes, cuatro guardias duros).
 * Anchos actuales: pasajeros 40, comedor 34, correo 32, blindado 30, ganado 24.
 *
 * Entre vagón y vagón, el tren mete un TRAMO DE ENGANCHE (más abajo) que no es
 * un vagón: es aire libre. Ahí empezás el asalto y ahí no hay dónde esconderse.
 */

export const WAGONS = {
  // -------------------------------------------------------------- pasajeros
  //
  // Los asientos van PEGADOS a la pared, sin carril libre por el borde. Antes
  // se podía recorrer el vagón entero caminando por arriba o por abajo sin
  // cruzarse con nadie, y eso hacía que la mitad del mapa no existiera.
  //
  // El pasillo mide DOS baldosas: entran tres personas de ancho y ni una más.
  // Cuatro baldosas de pasillo eran un galpón, no un vagón. Las filas de arriba
  // y abajo son pared doble, así que el interior es de verdad más chico.
  //
  // Entre bloque y bloque de asientos hay un HUECO DE DOS BALDOSAS DE ANCHO Y
  // DOS DE FONDO, catorce en total. Son la única forma de salirse del pasillo y
  // son callejones sin salida: sirven para cubrirse y para romper la línea de
  // visión de alguien que viene por el pasillo, pero no para avanzar.
  //
  // El fondo de dos baldosas es lo que los hace servir de verdad: metido hasta
  // el fondo, el que camina por el pasillo solo te ve cuando pasa justo por
  // delante de tu hueco. Con un solo tile de fondo quedabas a la vista igual.
  pasajeros: {
    id: 'pasajeros',
    name: 'Vagón de pasajeros',
    short: 'PASAJEROS',
    hint: 'Pasillo angosto, muchos rincones.',
    // Las VENTANILLAS ('W') caen justo sobre los recovecos, y eso es a
    // propósito: el hueco donde te metés para taparte de los guardias de
    // adentro es exactamente el lugar donde te ve la ley de afuera.
    // Atraviesan las dos filas de pared, si no la bala moriría en la de afuera.
    layout: [
      '####WW###WW###WW###WW###WW###WW###WW####',
      '####WW###WW###WW###WW###WW###WW###WW####',
      '#SSS..SSS..SSS..SSS..SSS..SSS..SSS..SSS#',
      '#SSS..SSS..SSS..SSS..SSS..SSS..SSS..SSS#',
      '+......................................+',
      '+......................................+',
      '#SSS..SSS..SSS..SSS..SSS..SSS..SSS..SSS#',
      '#SSS..SSS..SSS..SSS..SSS..SSS..SSS..SSS#',
      '####WW###WW###WW###WW###WW###WW###WW####',
      '####WW###WW###WW###WW###WW###WW###WW####',
    ],
    // Las rondas van por el pasillo: los huecos son pozos sin salida, no se
    // puede patrullar por ahí. Para cubrirse en combate sí los usan.
    enemies: [
      { path: [[6, 4], [16, 4], [16, 5], [6, 5]] },
      { path: [[24, 5], [34, 5], [34, 4], [24, 4]] },
    ],
    passengers: [
      { col: 4, row: 2, facing: 'right' },
      { col: 19, row: 3, facing: 'left' },
      { col: 29, row: 6, facing: 'right' },
      { col: 34, row: 7, facing: 'left' },
    ],
    loot: [
      { col: 9, row: 3, type: 'bag' },
      { col: 25, row: 6, type: 'bag' },
      { col: 34, row: 2, type: 'bag' },
    ],
  },

  // ---------------------------------------------------------------- comedor
  // Mesas grandes y mucha gente. El peligro no son los guardias: son los gritos.
  comedor: {
    id: 'comedor',
    name: 'Vagón comedor',
    short: 'COMEDOR',
    hint: 'Lleno de gente. Un solo guardia.',
    // Acá los pasillos de arriba y abajo tocan la pared, así que las
    // ventanillas se alcanzan desde cualquier lado. Es el vagón más expuesto
    // del tren a los jinetes de afuera.
    layout: [
      '#WW###WW###WW###WW###WW###WW###WW#',
      '#................................#',
      '#..CCC...CCC...CCC...CCC...CCC...#',
      '#..CCC...CCC...CCC...CCC...CCC...#',
      '+................................+',
      '+................................+',
      '#..CCC...CCC...CCC...CCC...CCC...#',
      '#..CCC...CCC...CCC...CCC...CCC...#',
      '#................................#',
      '#WW###WW###WW###WW###WW###WW###WW#',
    ],
    enemies: [
      { path: [[8, 1], [18, 1], [18, 8], [8, 8]] },
    ],
    passengers: [
      { col: 2, row: 4, facing: 'right' },
      { col: 7, row: 2, facing: 'left' },
      { col: 13, row: 7, facing: 'right' },
      { col: 20, row: 3, facing: 'left' },
      { col: 26, row: 5, facing: 'left' },
    ],
    loot: [
      { col: 6, row: 3, type: 'bag' },
      { col: 19, row: 6, type: 'bag' },
      { col: 31, row: 4, type: 'bag' },
    ],
  },

  // ----------------------------------------------------------------- correo
  // Cargamento apilado contra las paredes. Sin pasajeros, con más guardia,
  // y una caja fuerte al fondo.
  correo: {
    id: 'correo',
    name: 'Vagón de correo',
    short: 'CORREO',
    hint: 'Sin pasajeros. Guardia seria.',
    // Las ventanillas van alineadas con los huecos entre pilas de carga: hay
    // que meterse entre los cajones para llegar hasta ellas.
    layout: [
      '#####WW###WW###WW###WW###WW#####',
      '#.CCC..CCC..CCC..CCC..CCC..CCC.#',
      '#.CCC..CCC..CCC..CCC..CCC..CCC.#',
      '#..............................#',
      '+..............................+',
      '+..............................+',
      '#..............................#',
      '#.CC....CC....CC....CC....CC...#',
      '#.CC....CC....CC....CC....CC...#',
      '####WW####WW####WW####WW####WW##',
    ],
    enemies: [
      { path: [[6, 3], [16, 3], [16, 6], [6, 6]] },
      { path: [[28, 6], [28, 3], [20, 3], [20, 6]] },
      { path: [[8, 5], [29, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 10, row: 6, type: 'bag' },
      { col: 22, row: 3, type: 'bag' },
      { col: 30, row: 6, type: 'strongbox' },
    ],
  },

  // ----------------------------------------------------------------- ganado
  // Corrales. Cobertura por todos lados y casi nada que robar: es un vagón
  // para cruzar, no para quedarse. Sirve al ritmo del tren.
  ganado: {
    id: 'ganado',
    name: 'Vagón de ganado',
    short: 'GANADO',
    hint: 'Corrales. Casi nada que robar.',
    // El más corto del tren, y a propósito: es un vagón de paso. Cuando medía
    // lo mismo que los demás eran 640 px de casi nada en el medio de la
    // retirada, y eso es tiempo muerto.
    //
    // VA AL AIRE LIBRE: no tiene techo ni paredes, solo BARANDAS ('H') a los
    // costados. Te podés parapetar detrás, pero no te paran una bala. O sea que
    // es el vagón donde la ley de afuera te tiene servido de punta a punta.
    //
    // Y como no tiene techo, TAMPOCO SE PUEDE CAMINAR POR ARRIBA. Este flag lo
    // hace real: el techo del tren se corta acá, y si el ganado cayó en el medio
    // de la composición, el camino de arriba queda partido en dos. Elegir la
    // ruta del techo pasa a depender de cómo salió sorteado el tren.
    sinTecho: true,
    layout: [
      '#HHHHHHHHHHHHHHHHHHHHHH#',
      '#..CCCCC..CCCCC..CCCCC.#',
      '#..C...C..C...C..C...C.#',
      '#..CCCCC..CCCCC..CCCCC.#',
      '+......................+',
      '+......................+',
      '#..CCCCC..CCCCC..CCCCC.#',
      '#..C...C..C...C..C...C.#',
      '#..CCCCC..CCCCC..CCCCC.#',
      '#HHHHHHHHHHHHHHHHHHHHHH#',
    ],
    enemies: [
      { path: [[3, 4], [20, 4], [20, 5], [3, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 16, row: 7, type: 'bag' },
    ],

    /**
     * LAS TRANQUERAS DE LOS CORRALES.
     *
     * Sólo existen en los trenes que traen `estampida` (hoy el de carga, ver
     * data/train.js): el mismo vagón, en el tren estándar, sigue siendo el
     * pasillo de paso de siempre. Así el ganado pasa a ser una herramienta de
     * UN tipo de tren en vez de una regla nueva del juego entero.
     *
     * DÓNDE ESTÁN NO ES CASUAL: cada una está pegada a un hueco entre corrales
     * (los `..` de las filas 1-3 y 6-8). Abrir la tranquera y quedarse en el
     * pasillo es que te lleve puesto tu propia manada, así que tiene que haber
     * SIEMPRE un lugar donde meterse a un paso o dos — si el hueco más cercano
     * quedara a media docena de baldosas, la jugada sería una trampa en vez de
     * una decisión.
     *
     * `lado` es de qué corral salen las reses; se dibuja y se interactúa desde
     * el borde del pasillo.
     */
    tranqueras: [
      { col: 7,  lado: 'arriba' },
      { col: 14, lado: 'abajo' },
    ],
  },

  // --------------------------------------------------------------- blindado
  // El premio y la trampa: dos cajas fuertes, cuatro guardias y un pasillo
  // angosto donde no hay dónde meterse.
  blindado: {
    id: 'blindado',
    name: 'Vagón blindado',
    short: 'BLINDADO',
    hint: 'Dos cajas fuertes. Cuatro guardias duros.',

    // Acá viajan los GUARDIAS BLINDADOS: aguantan un tiro más que el resto del
    // tren. Es lo que hace que el nombre del vagón signifique algo.
    guardType: 'blindado',

    // Corto y denso: la caja apretada del tren.
    layout: [
      '##############################',
      '#CCCCCCCCCCCCCCCCCCCCCCCCCCCC#',
      '#CC........................CC#',
      '#CC..CC....CC....CC....CC..CC#',
      '+............................+',
      '+............................+',
      '#CC..CC....CC....CC....CC..CC#',
      '#CC........................CC#',
      '#CCCCCCCCCCCCCCCCCCCCCCCCCCCC#',
      '##############################',
    ],
    // Los únicos guardias del tren que llevan dinamita: una cada uno. No están
    // obligados a usarla. La encienden cuando te ven parapetado y a tiro, que
    // es exactamente para lo que sirve: sacarte de atrás de un asiento.
    enemies: [
      { path: [[7, 4], [7, 2], [13, 2], [13, 4]], dynamite: 1 },
      { path: [[16, 5], [16, 7], [22, 7], [22, 5]], dynamite: 1 },
      { path: [[25, 4], [25, 2], [19, 2], [19, 4]], dynamite: 1 },
      { path: [], facing: 'left', dynamite: 1 },   // centinela junto a una caja
    ],
    passengers: [],
    loot: [
      { col: 8, row: 2, type: 'strongbox' },
      { col: 26, row: 7, type: 'strongbox' },
    ],
  },

  // ============================================================ TREN VELOZ
  //
  // Variantes CORTAS, escritas a mano — no son las de arriba recortadas por
  // código. Cerca de la mitad de ancho, con la misma geometría de siempre
  // (pasillo de 2 baldosas, huecos de cobertura de 2x2, ventanillas
  // alineadas con los recovecos): recortar un layout ya afinado por código
  // rompe esa geometría, así que cada una se dibujó de cero.
  //
  // Y con menos espacio, menos gente adentro: donde el original patrullaba
  // con dos guardias por un pasillo largo, acá alcanza con uno. No es un
  // ajuste de dificultad — es que no entra otra cosa.

  pasajeros_corto: {
    id: 'pasajeros_corto',
    name: 'Vagón de pasajeros (corto)',
    short: 'PASAJEROS',
    hint: 'Corto y angosto.',
    layout: [
      '####WW###WW###WW####',
      '####WW###WW###WW####',
      '#SSS..SSS..SSS..SSS#',
      '#SSS..SSS..SSS..SSS#',
      '+..................+',
      '+..................+',
      '#SSS..SSS..SSS..SSS#',
      '#SSS..SSS..SSS..SSS#',
      '####WW###WW###WW####',
      '####WW###WW###WW####',
    ],
    enemies: [
      { path: [[4, 4], [15, 4], [15, 5], [4, 5]] },
    ],
    passengers: [
      { col: 4, row: 2, facing: 'right' },
      { col: 14, row: 7, facing: 'left' },
    ],
    loot: [
      { col: 4, row: 3, type: 'bag' },
      { col: 14, row: 6, type: 'bag' },
    ],
  },

  comedor_corto: {
    id: 'comedor_corto',
    name: 'Vagón comedor (corto)',
    short: 'COMEDOR',
    hint: 'Poca mesa, poco tiempo.',
    layout: [
      '#WW#####WW#####WW#',
      '#................#',
      '#...CCC....CCC...#',
      '#...CCC....CCC...#',
      '+................+',
      '+................+',
      '#...CCC....CCC...#',
      '#...CCC....CCC...#',
      '#................#',
      '#WW#####WW#####WW#',
    ],
    enemies: [
      { path: [[3, 1], [14, 1], [14, 8], [3, 8]] },
    ],
    passengers: [
      { col: 2, row: 4, facing: 'right' },
      { col: 9, row: 1, facing: 'left' },
      { col: 15, row: 7, facing: 'right' },
    ],
    loot: [
      { col: 8, row: 5, type: 'bag' },
      { col: 9, row: 8, type: 'bag' },
    ],
  },

  correo_corto: {
    id: 'correo_corto',
    name: 'Vagón de correo (corto)',
    short: 'CORREO',
    hint: 'Sin pasajeros. Guardia seria.',
    layout: [
      '##WW#####WW#####WW##',
      '#....CCC....CCC....#',
      '#....CCC....CCC....#',
      '#..................#',
      '+..................+',
      '+..................+',
      '#..................#',
      '#....CCC....CCC....#',
      '#....CCC....CCC....#',
      '##WW#####WW#####WW##',
    ],
    enemies: [
      { path: [[2, 3], [17, 3]] },
      { path: [[17, 6], [2, 6]] },
    ],
    passengers: [],
    loot: [
      { col: 9, row: 1, type: 'bag' },
      { col: 9, row: 7, type: 'strongbox' },
    ],
  },

  ganado_corto: {
    id: 'ganado_corto',
    name: 'Vagón de ganado (corto)',
    short: 'GANADO',
    hint: 'Corrales chicos. Casi nada.',
    sinTecho: true,
    layout: [
      '#HHHHHHHHHHHH#',
      '#.CCCC..CCCC.#',
      '#.C..C..C..C.#',
      '#.CCCC..CCCC.#',
      '+............+',
      '+............+',
      '#.CCCC..CCCC.#',
      '#.C..C..C..C.#',
      '#.CCCC..CCCC.#',
      '#HHHHHHHHHHHH#',
    ],
    enemies: [
      { path: [[2, 4], [11, 4], [11, 5], [2, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 4, row: 7, type: 'bag' },
    ],
  },

  blindado_corto: {
    id: 'blindado_corto',
    name: 'Vagón blindado (corto)',
    short: 'BLINDADO',
    hint: 'Dos cajas fuertes. Cuatro guardias duros, apretados.',
    guardType: 'blindado',
    layout: [
      '##################',
      '#CCCCCCCCCCCCCCCC#',
      '#CC............CC#',
      '#CC..CC....CC..CC#',
      '+................+',
      '+................+',
      '#CC..CC....CC..CC#',
      '#CC............CC#',
      '#CCCCCCCCCCCCCCCC#',
      '##################',
    ],
    // Los mismos cuatro guardias del blindado de siempre, con su dinamita
    // cada uno — sólo el vagón se achicó, no la guardia ni el arma.
    enemies: [
      { path: [[4, 4], [4, 2], [8, 2], [8, 4]], dynamite: 1 },
      { path: [[9, 5], [9, 7], [13, 7], [13, 5]], dynamite: 1 },
      { path: [[13, 4], [13, 2], [9, 2], [9, 4]], dynamite: 1 },
      { path: [], facing: 'left', dynamite: 1, col: 13, row: 6 },   // centinela junto a una caja
    ],
    passengers: [],
    loot: [
      { col: 6, row: 2, type: 'strongbox' },
      { col: 11, row: 7, type: 'strongbox' },
    ],
  },

  // ============================================================ TREN DE CARGA
  //
  // La misma medida y la misma pinta que el correo de siempre — sólo que
  // viaja liviano: UN guardia en vez de tres, y el botín ya no está
  // concentrado en una caja fuerte: son bolsas repartidas por todo el vagón.
  // Es la pieza que responde a la nota "el botín está demasiado concentrado"
  // (NOTAS-DISENO.md): en vez de una apuesta grande en un solo punto, varias
  // chicas a lo largo del vagón.
  correo_liviano: {
    id: 'correo_liviano',
    name: 'Vagón de correo (liviano)',
    short: 'CORREO',
    hint: 'Poca guardia. Botín repartido.',
    layout: [
      '#####WW###WW###WW###WW###WW#####',
      '#.CCC..CCC..CCC..CCC..CCC..CCC.#',
      '#.CCC..CCC..CCC..CCC..CCC..CCC.#',
      '#..............................#',
      '+..............................+',
      '+..............................+',
      '#..............................#',
      '#.CC....CC....CC....CC....CC...#',
      '#.CC....CC....CC....CC....CC...#',
      '####WW####WW####WW####WW####WW##',
    ],
    enemies: [
      { path: [[8, 5], [29, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 4, row: 3, type: 'bag' },
      { col: 10, row: 6, type: 'bag' },
      { col: 16, row: 3, type: 'bag' },
      { col: 22, row: 6, type: 'bag' },
      { col: 28, row: 3, type: 'bag' },
    ],
  },

};

/**
 * TRAMOS que no son vagones.
 *
 * Estos son los pedazos al aire libre del tren. No tienen guardias ni botín:
 * son el espacio negro entre un vagón y el siguiente. Importan por dos motivos.
 *
 * Uno: ahí empezás el asalto. Antes aparecías adentro de un vagón y te podías
 * encontrar de cara con un guardia sin haber hecho nada mal, que es la peor
 * forma de empezar cualquier cosa.
 *
 * Dos: no hay dónde cubrirse. Cruzar de un vagón a otro te expone, siempre.
 */
export const TRAMOS = {
  /** La plataforma trasera. Acá te espera el caballo y es la única salida. */
  salida: {
    id: 'salida',
    layout: [
      'XXXXXXXX',
      'XXXXXXXX',
      'XXXXXXXX',
      'XXXXXXXX',
      'EEEE++++',
      'EEEE++++',
      'XXXXXXXX',
      'XXXXXXXX',
      'XXXXXXXX',
      'XXXXXXXX',
    ],
  },

  /** El enganche entre dos vagones: tres columnas de aire libre. */
  enganche: {
    id: 'enganche',
    layout: [
      'XXX',
      'XXX',
      'XXX',
      'XXX',
      '+++',
      '+++',
      'XXX',
      'XXX',
      'XXX',
      'XXX',
    ],
  },
};

/** El centinela del blindado necesita un lugar donde plantarse. */
WAGONS.blindado.enemies[3].col = 26;
WAGONS.blindado.enemies[3].row = 5;

/**
 * Tipos de botín. El valor se sortea entre min y max.
 *
 * La caja fuerte NO dice cuánto tiene hasta que la abrís, y el rango es ancho a
 * propósito: $150 es una decepción y $600 es el asalto de tu vida. Antes valía
 * siempre ~$330, y eso no era una decisión sino una cuenta: el que sabía los
 * números iba siempre. Una apuesta se juega; una cuenta se resuelve.
 */
export const LOOT_TYPES = {
  bag: {
    id: 'bag',
    name: 'Bolsillos',
    min: 30, max: 65,
    noisy: false,
  },
  strongbox: {
    id: 'strongbox',
    name: 'Caja fuerte',
    min: 150, max: 600,
    noisy: true,   // abrirla se oye en todo el vagón
  },
};
