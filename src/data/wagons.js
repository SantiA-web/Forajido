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
    /**
     * ACÁ VAN EN EL PASILLO (filas 4-5) Y NO CONTRA LA PARED. Ver
     * `cajonesExtra` en el correo para qué son.
     *
     * *(Santi, después de jugarlo: "los barriles en el comedor ponlos dónde
     * todos: en el pasillo")*
     *
     * En todos los demás vagones van en las filas 3 y 6, que están pegadas al
     * corredor: se ven al entrar y se usan de cobertura. Acá no se puede —esas
     * dos filas son las mesas— así que la primera versión los mandó a las filas
     * 1 y 8, contra la pared. El resultado era que quedaban **detrás de dos
     * hileras de mesas**: no se veían al pasar, no servían de cobertura y no
     * entraban en ninguna decisión. Estaban puestos donde había lugar, no donde
     * importaban.
     *
     * En el pasillo un barril no frena el paso (como cualquier barril), pero
     * está en el camino de todos: tuyo, de los guardias y de la gente que sale
     * corriendo. Y de paso es la única cobertura de un vagón que no tenía
     * ninguna a la altura del corredor.
     *
     * Ninguno cae sobre un pasajero: los del comedor viajan en (2,4) y (26,5).
     */
    cajonesExtra: [
      { col: 10, row: 4 },
      { col: 17, row: 5 },
      { col: 29, row: 4 },
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
    /**
     * BARRILES DE PÓLVORA, PERO SÓLO SI EL TREN LLEVA VAGÓN DE ARMAS.
     *
     * *(Santi: "cuando hay un vagón de armas en el tren, no sólo ahí dentro
     * habrían barriles de dinamita, sino que afectaría a todo el tren")*
     *
     * ES UNA REGLA DE TREN, NO DE VAGÓN, y por eso las posiciones viven acá
     * pero la decisión de usarlas vive en `buildTrain` (world/train.js). El
     * mismo vagón de correo, en un tren sin armas, no lleva ni un barril — es
     * el mismo patrón que las tranqueras del ganado, que sólo existen en el
     * tren de carga.
     *
     * De cuántas se usan y cuáles se encarga el sorteo: son CANDIDATAS, no una
     * lista fija, así que dos asaltos al mismo tipo de vagón no tienen la
     * pólvora en el mismo lugar.
     *
     * Van en las filas 3 y 6, fuera del corredor, donde iría la carga.
     *
     * 🐛 Y FUERA DE LAS RONDAS, QUE ES LO QUE FALTABA. Las tres posiciones
     * viejas —(13,3), (25,6) y (6,6)— le cruzaban el camino a los dos guardias
     * que patrullan las filas 3 y 6, y **(6,6) era literalmente un punto de la
     * ronda del guardia 0**: a un waypoint tapado por un bulto sólido no se
     * puede "llegar" nunca, así que ese guardia se quedaba empujando el barril
     * el asalto entero (ver la nota de `doPatrol`, systems/ai.js).
     *
     * Las nuevas caen en los huecos que las dos rondas no pisan: el guardia 0
     * hace las columnas 6-16 y el 1 las 20-28, así que 17-19 y 1-5 quedan
     * libres. El 2 patrulla la fila 5 (el corredor), que nunca lleva cajones.
     *
     * El arreglo de la IA ya evita que se cuelgue pase lo que pase; esto es
     * para que la ronda dibujada sea la ronda que se camina.
     */
    cajonesExtra: [
      { col: 18, row: 3 },
      { col: 18, row: 6 },
      { col: 3,  row: 6 },
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

    /**
     * SUS DOS PUERTAS SON DE CHAPA: frenan el paso Y las balas, y desde afuera
     * no se empujan. La única llave es la dinamita.
     *
     * Va como marca de la plantilla y no deducido del tipo de guardia, porque
     * son dos cosas distintas que sólo por casualidad coincidían en este vagón:
     * el almacén del tren de carga lleva guardias blindados y puertas de
     * madera. Lo leen la creación de las puertas y la ronda del Dinamitero
     * (world/train.js) — los dos únicos lugares a los que les importa.
     */
    puertasBlindadas: true,

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
    /**
     * Ver `cajonesExtra` en el correo. Acá hay una regla de más: van LEJOS DE
     * LAS PUERTAS, en el centro del vagón.
     *
     * La puerta del blindado es de chapa y tiene UNA sola llave, que es tu
     * dinamita. Un barril explotando cerca se la volaría gratis desde adentro
     * y le sacaría al vagón lo que lo hace el vagón blindado. Desde la columna
     * 14 hasta la puerta más cercana hay 224 px y la explosión alcanza 110.
     */
    cajonesExtra: [
      { col: 14, row: 3 },
      { col: 20, row: 6 },
      { col: 9,  row: 6 },
    ],
  },

  // ------------------------------------------------------------------ armas
  //
  // FASE 6a del plan "variedad de lo que pasa en los trenes". El vagón que el
  // Dinamitero venía esperando desde la Fase 4: es de acá de donde sale su
  // cartucho.
  //
  // LO QUE LO HACE DISTINTO NO ES LO QUE TIENE, ES QUE SIRVE PARA DOS COSAS
  // OPUESTAS. Los cajones de pólvora (`cajones`, más abajo) se abren con [E] y
  // te llevás un cartucho — es el único lugar del juego donde se repone algo—,
  // y también revientan si les pegás tres tiros, encadenándose con el resto
  // del vagón. Lo que te sirve es lo que te puede matar, que es la misma forma
  // que ya tiene la cobertura (te salva de los de adentro y te entrega a los
  // de afuera).
  //
  // NO LLEVA CAJA FUERTE, por pedido de Santi. Su tensión no es quedarse ocho
  // segundos quieto: es el Dinamitero que da vueltas por acá (ver
  // `rondaDinamitero` en world/train.js) y la cadena. Las cinco bolsas dan
  // ~$237, la mitad de lo que da el correo, que es el vagón con el que se lo
  // va a comparar (mismo tamaño, mismos tres guardias).
  //
  // Y TIENE VENTANILLAS, cuatro pares. Podría no tenerlas —es un furgón de
  // carga— pero estar a salvo de los jinetes de afuera es la identidad del
  // vagón blindado, y esa no se la puede robar otro vagón.
  armas: {
    id: 'armas',
    name: 'Vagón de armas',
    short: 'ARMAS',
    hint: 'Cajones de pólvora. Acá no conviene tirotear.',
    /**
     * Los huecos entre estanterías caen justo sobre las ventanillas, como en
     * el correo: para llegar al vidrio hay que meterse entre los cajones.
     *
     * SE ACORTÓ A 24 COLUMNAS Y PERDIÓ SUS ISLAS DE COBERTURA.
     *
     * *(Santi: "el vagón de armas pasaría a ser un vagón de paso como el de
     * ganado, a pesar que sí tendría un par de guardias y más barriles")*
     *
     * Es el mismo largo que el ganado y por el mismo motivo: **es un vagón para
     * cruzar, no para quedarse**. Dejó de ser el depósito donde estaba toda la
     * pólvora del tren —ahora hay barriles repartidos por casi todos los
     * vagones— y pasó a ser el lugar donde hay MÁS, con lo justo para robar.
     *
     * LAS FILAS 3 Y 6 QUEDARON PELADAS, y no es un olvido: las siete islas
     * escalonadas se fueron con las 30 columnas. Lo que ocupa su lugar son LOS
     * BARRILES, que ya frenaban balas — o sea que la única cobertura del vagón
     * pasa a ser la cosa que explota. Es mejor de lo que había: antes podías
     * elegir entre una isla verde segura y un barril; ahora te cubrís detrás de
     * una bomba o no te cubrís.
     *
     * LOS HUECOS ENTRE ESTANTERÍAS SIGUEN CAYENDO SOBRE LAS VENTANILLAS, como
     * en el correo: para llegar al vidrio hay que meterse entre los cajones.
     *
     * Y EL CORREDOR 4-5 SIGUE LIBRE DE TILES SÓLIDOS. Por ahí pasan las rondas
     * —incluida la del Dinamitero, que cruza este vagón de punta a punta por la
     * fila 4— y un tile sólido en el camino de una ronda traba al guardia
     * (`moveAxisAligned` empuja en X y no rodea).
     */
    layout: [
      '####WW######WW######WW##',
      '#CCC..CCCCCC..CCCCCC..C#',
      '#CCC..CCCCCC..CCCCCC..C#',
      '#......................#',
      '+......................+',
      '+......................+',
      '#......................#',
      '#CC..CCCCCC..CCCCCC..CC#',
      '#CC..CCCCCC..CCCCCC..CC#',
      '###WW######WW######WW###',
    ],
    /**
     * ACÁ NO SALE NINGUNA VARIANTE DE GUARDIA (data/modifiers.js).
     *
     * *(Santi, viendo el problema antes de que existiera: "si por lo menos uno
     * de esos guardias es un dinamitero sería una catástrofe, porque una sola
     * dinamita lanzada acabaría con todo en el vagón")*
     *
     * Un Dinamitero plantado acá adentro volaría los tres cajones en su primer
     * ataque, siempre, en todos los trenes: el peligro dejaría de tener
     * posición y no habría nada que decidir. El de este vagón **da vueltas por
     * afuera** (ver `rondaDinamitero` en world/train.js), que es lo que
     * convierte la amenaza en algo que se puede mirar y esperar.
     *
     * Es una llave por vagón, no un `if` con el nombre escrito en el código:
     * cualquier vagón futuro donde una variante rompa las reglas del lugar la
     * puede usar igual.
     */
    sinVariantes: true,

    /**
     * Tres guardias: DOS que patrullan medio vagón cada uno y UNO plantado
     * junto a la pólvora. Todos comunes, por lo de arriba.
     *
     * LAS RONDAS VAN POR EL CORREDOR 4-5, y antes dos de ellas usaban las
     * filas 3 y 6. Se mudaron cuando esas filas pasaron a llevar las islas de
     * cobertura: un guardia que patrulla contra un tile sólido se queda
     * empujándolo. No se pierde nada — un guardia en combate igual se mete
     * entre las islas, porque el buscador de cobertura no mira las rondas.
     *
     * 🐛 Y LAS RONDAS VAN TODAS POR LA FILA 5, NUNCA POR LA 4. Ésa es la clave,
     * y costó dos intentos encontrarla.
     *
     * PRIMER INTENTO: las tres rondas al corredor, recorriéndolo entero. Medido
     * sobre 150 s: el Dinamitero **dejó de poder cruzar el vagón** —se clavaba
     * en el borde izquierdo, recorrido real 817-1614 sobre una ronda de
     * 448-1616— y pasaba el 61% del tiempo adentro contra el 39% de antes.
     *
     * SEGUNDO INTENTO: dos rondas y un centinela, pensando que el problema era
     * la cantidad. Peor: recorrido 1056-1614, o sea que ni siquiera entraba a
     * la mitad izquierda, y 80% del tiempo adentro. **Dos cuerpos yendo y
     * viniendo por un corredor de dos baldosas alcanzan para taponarlo.**
     *
     * LO QUE LO RESUELVE NO ES CUÁNTOS SINO EN QUÉ FILA. El corredor tiene dos
     * filas y `CONFIG.enemy.separation` es 13 px: dos guardias en filas
     * distintas están a 16 px de centro a centro, así que **no se empujan**.
     * El Dinamitero cruza siempre por la fila 4 (`rondaDinamitero` la calcula
     * ahí), así que alcanza con dejarle esa fila libre: las rondas de este
     * vagón van por la 5 y se cruzan con él sin tocarlo.
     *
     * Por eso son de ida y vuelta en línea recta y no rectángulos: un
     * rectángulo tiene que pasar por las dos filas. Mismo patrón que la ronda
     * larga del correo (`[[8,5],[29,5]]`), que existe desde la fase 2.
     */
    enemies: [
      { path: [[3, 5], [11, 5]] },
      { path: [[20, 5], [13, 5]] },
    ],
    passengers: [],
    /**
     * UNA SOLA BOLSA, como el ganado — y ahí está la parte "de paso".
     *
     * Eran cinco (~$237). Un vagón donde te quedás a juntar cinco bolsas no es
     * un vagón de paso por más corto que sea: lo que te hace quedarte es el
     * botín, no los metros. Con una sola, entrás por la pólvora o entrás
     * porque está en el camino.
     *
     * Metida en un hueco entre estanterías: hay que salirse del corredor.
     */
    loot: [
      { col: 12, row: 1, type: 'bag' },
    ],

    /**
     * LOS CAJONES DE PÓLVORA — ver data/explosives.js (`cajonPolvora`) y
     * entities/cajon.js.
     *
     * CUATRO, en un vagón de 24 columnas — la mayor concentración del tren,
     * que es lo que le queda de identidad ahora que hay pólvora repartida por
     * casi todos los vagones (ver `cajonesExtra`, más abajo, y la regla de tren
     * en world/train.js). Eran cinco en 30 columnas: quedan MÁS juntos que
     * antes, no menos.
     *
     * NO TODOS TRAEN UN CARTUCHO PARA LLEVARSE (`chanceCartucho`): todos
     * explotan, pero de la pólvora suelta no se saca nada. Por eso cuatro acá
     * no son cuatro dinamitas.
     *
     * ALTERNAN FILA 3 Y FILA 6, y ahora eso hace dos trabajos en vez de uno: la
     * cadena cruza en zigzag —no es una línea recta— y de paso **son la única
     * cobertura del vagón**, desde que se fueron las islas. Cubrirse acá es
     * elegir una bomba.
     *
     * DÓNDE VAN NO ES DECORACIÓN: entre las columnas 5 y 18, o sea a cinco
     * baldosas de la punta izquierda y cinco de la derecha. La explosión
     * alcanza 68 px (4,25 baldosas) y las puertas viven en los bordes — si un
     * barril quedara pegado a una punta y el blindado cayera al lado, la cadena
     * le reventaría la puerta de chapa desde afuera, y esa puerta tiene UNA
     * sola llave, que es tu dinamita. Esos mismos tiles libres de cada punta
     * son **la salida**: el único lugar del vagón al que la cadena no llega.
     *
     * 🐛 Y CADA UNO TIENE DOS BALDOSAS LIBRES A CADA LADO en su propia fila.
     * La primera versión (con islas) los puso pegados a los bloques de
     * cobertura y eso los volvía trampas mortales: el que estaba sacando un
     * cartucho, al prenderse la mecha, chocaba contra la isla y no podía huir.
     * Medido entonces: terminó a TRES píxeles de donde arrancó, muerto. Sin
     * islas el problema no puede volver, pero el criterio se queda escrito.
     */
    cajones: [
      { col: 5,  row: 6 },
      { col: 9,  row: 3 },
      { col: 14, row: 6 },
      { col: 18, row: 3 },
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
    puertasBlindadas: true,
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
  // ---------------------------------------------------------------- almacén
  /**
   * EL VAGÓN ALMACÉN — el depósito del tren de carga.
   *
   * *(Santi: "agregaría el vagón 'almacén' para el tren de carga [...] el objeto
   * raro sólo se PUEDE LLEGAR a encontrar en el almacén (abriendo las cajas
   * fuertes) o las cajas fuertes ocultas")*
   *
   * VIAJA SIEMPRE, no se sortea (`composition` en data/train.js). Es la
   * diferencia con el vagón de armas, y es a propósito: el de armas es una
   * sorpresa que te cambia el plan del día, y éste es **la razón por la que
   * subís a un tren de carga**. Algo que decide la identidad económica de un
   * tren no puede aparecer una de cada cuatro veces.
   *
   * MIDE LO MISMO QUE EL CORREO LIVIANO AL QUE REEMPLAZA (32 columnas), así que
   * el tren de carga no cambia de largo ni un píxel y su reloj de 165 s sigue
   * valiendo exactamente lo que valía.
   *
   * DOS CAJAS FUERTES, que es lo que lo separa de todo lo demás de este tren.
   * El de carga reparte su botín en bolsas (ésa fue su respuesta al botín
   * concentrado) y acá se concentra otra vez, a propósito: es el único lugar
   * del tren donde vale la pena quedarse ocho segundos quieto, dos veces.
   *
   * LAS ESTANTERÍAS SON MÁS GRUESAS que las del correo (cuatro columnas contra
   * tres) y dejan pasillos más angostos: adentro se pelea peor. Es un depósito,
   * no un furgón de reparto.
   *
   * SIN PASAJEROS, como todo este tren. Y eso es justamente lo que obliga a que
   * la pista de la caja fuerte oculta acá sea otra cosa — no hay a quién
   * amenazar (ver data/train.js, `gente`).
   */
  almacen: {
    id: 'almacen',
    name: 'Vagón almacén',
    short: 'ALMACÉN',
    hint: 'El depósito. Dos cajas fuertes y nadie a quien preguntarle.',
    layout: [
      '#####WW###WW###WW###WW###WW#####',
      '#.CCCC..CCCC..CCCC..CCCC..CCC..#',
      '#.CCCC..CCCC..CCCC..CCCC..CCC..#',
      '#..............................#',
      '+..............................+',
      '+..............................+',
      '#..............................#',
      '#.CCCC..CCCC..CCCC..CCCC..CCC..#',
      '#.CCCC..CCCC..CCCC..CCCC..CCC..#',
      '####WW####WW####WW####WW####WW##',
    ],
    /**
     * DOS RONDAS PARALELAS, una por cada fila de carga, y las dos rectas.
     *
     * Rectas a propósito: las columnas que NO pisan (1-4 y 27-30) son las que
     * quedan libres para los barriles de pólvora, y con rondas en L eso se
     * vuelve mucho más difícil de garantizar. Es la lección del vagón de correo
     * aplicada al escribir en vez de descubierta jugando — ver `revisarRondas`
     * en world/train.js, que ahora lo chequea solo.
     */
    /**
     * VIAJA CERRADO CON LLAVE — sus dos puertas nacen trabadas (ver
     * `puertasTrabadas` en world/train.js).
     *
     * *(Santi, jugándolo: "hay un problema que encuentro con el almacén es que
     * al haber tan pocos guardias, casi que te regalan esas cajas fuertes")*
     *
     * Y NO SON DE CHAPA. La blindada frena las balas y sólo la abre la
     * dinamita; éstas son madera y se rompen a tiros como cualquier otra —
     * **pero eso hace ruido**. El precio de las dos cajas dejó de ser matar a
     * los guardias que las cuidan (que en este tren son pocos) y pasó a ser el
     * precio de siempre del juego: entrar acá **no se puede hacer callado**.
     *
     * Y le da a la dinamita un segundo uso en un tren que se quedó sin vagón
     * blindado: volar la puerta es instantáneo y carísimo en ruido; los tiros
     * son baratos pero tardan y suenan varias veces.
     */
    puertasTrabadas: true,

    /**
     * CUATRO GUARDIAS, Y ES UNA COMPENSACIÓN MEDIDA, no una corazonada.
     *
     * Sacar el vagón blindado del tren de carga le sacó **4 guardias de 12 y
     * los cuatro duros**. Con el almacén en 2 guardias, el tren quedaba en 8:
     * más vacío todavía que el que motivó el pedido. Subirlo a 4 lo devuelve a
     * 11 y —esto es lo importante— los pone **justo donde estaba el problema**,
     * cuidando lo único que de verdad vale la pena de este tren.
     *
     * Las dos rondas nuevas van por el corredor (filas 4 y 5), que es la única
     * franja del vagón donde nunca hay pólvora.
     */

    /**
     * Y SON GUARDIAS BLINDADOS — *(pedido de Santi: "agrega que los guardias del
     * vagón almacén sean de los guardias blindados")*.
     *
     * Con el vagón blindado fuera del tren de carga, éstos son los únicos duros
     * que le quedan: aguantan un tiro más (3, o 4 en un tren escoltado) y se les
     * ve la placa en el pecho. Y es coherente con lo que el vagón es — la
     * compañía no pone al peón nuevo a cuidar la caja.
     *
     * EL TIPO DE GUARDIA ARRASTRA TRES COSAS MÁS, y las tres caen bien acá:
     *
     *  - **No abandonan el vagón nunca** (`confinado`). Ya estaban sellados por
     *    las puertas trabadas, así que no cambia nada y de paso lo garantiza.
     *  - **La estampida se frena en su puerta.** Correcto: está cerrada.
     *  - **Una redada no los duplica.** La guarnición de la caja es la que es.
     *
     * Lo que NO arrastra es la dinamita: ésa se la da la plantilla del vagón
     * blindado guardia por guardia (`dynamite: 1`), no el tipo.
     */
    guardType: 'blindado',
    enemies: [
      { path: [[5, 3], [26, 3]] },
      { path: [[26, 6], [5, 6]] },
      { path: [[6, 4], [25, 4]] },
      { path: [[25, 5], [6, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 30, row: 3, type: 'strongbox' },
      { col: 30, row: 6, type: 'strongbox' },
      { col: 10, row: 6, type: 'bag' },
      { col: 20, row: 3, type: 'bag' },
      { col: 15, row: 6, type: 'bag' },
    ],
    /** En las columnas que ninguna de las dos rondas pisa. */
    cajonesExtra: [
      { col: 28, row: 3 },
      { col: 2,  row: 6 },
      { col: 28, row: 6 },
    ],
  },

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

    /**
     * BARRILES DE PÓLVORA, PERO SÓLO SI EL TREN LLEVA VAGÓN DE ARMAS — ver la
     * nota completa en `correo`, que es de donde salen estas posiciones (los
     * dos vagones comparten el layout exacto).
     *
     * HUBO QUE AGREGÁRSELAS AL MUDAR EL VAGÓN DE ARMAS AL TREN DE CARGA. La
     * pólvora repartida por todo el tren la llevan los vagones que tienen
     * `cajonesExtra`, y hasta ahora eran tres: comedor, correo y blindado. De
     * ésos, el tren de carga sólo lleva comedor y blindado — o sea que el
     * sistema entero se le habría caído a dos vagones de ocho, y "un tren
     * distinto de punta a punta" habría pasado a ser "un tren con pólvora en
     * dos lugares".
     *
     * Y es el vagón donde más sentido tiene: un furgón de correo liviano es
     * literalmente carga estibada. Si algo lleva pólvora, es esto.
     *
     * Elegidas para no pisar ninguna de las cinco bolsas de este vagón (que
     * están en las columnas 4, 10, 16, 22 y 28).
     */
    cajonesExtra: [
      { col: 13, row: 3 },
      { col: 25, row: 6 },
      { col: 6,  row: 6 },
    ],
  },

  // ======================================================== LOS TRENES NUEVOS
  //
  // *(Santi: "me gustaría cambiar el sistema de los vagones de los trenes.
  // Añadiendo vagones más especiales y selectivos")* — cada decisión, con su
  // tabla de opciones, está en NOTAS-DISENO.md ("EN DISEÑO · Los trenes nuevos").
  //
  // ETAPA 1: PLANTILLAS CON MECÁNICAS QUE YA EXISTEN. El vigía del caboose, las
  // reses del refrigerado (ya están: etapa 3), el carbón de la góndola, los
  // guardias de franco y las puertas de los camarotes llegan cada uno en su
  // etapa, solos — para que
  // cuando algo se sienta mal se sepa qué fue. Hasta entonces cada vagón nuevo se
  // juega con piezas conocidas, y los anchos son los que se usaron para calcular
  // el largo del tren (y de ahí los 180 s del reloj).

  // ---------------------------------------------------------------- caboose
  /**
   * EL VAGÓN DE OBSERVACIÓN — la cola de los DOS trenes, siempre el vagón 1.
   *
   * CORTO, 20 columnas: es el vagón de la tripulación, no de la carga. Una
   * estufa y un escritorio contra la pared de un lado, dos literas del otro.
   * Una bolsa: lo que el guardafrenos tiene encima.
   *
   * ⚠️ TODAVÍA NO TIENE VIGÍA (etapa 6). Su guardia patrulla como cualquiera.
   * El que mira para atrás, se da vuelta al azar con aviso y te puede ver
   * galopando llega solo, cuando lo demás ya esté jugado.
   */
  caboose: {
    id: 'caboose',
    name: 'Vagón de observación',
    short: 'CABOOSE',
    hint: 'La tripulación. Desde acá se mira la vía.',
    layout: [
      '####WW####WW####WW##',
      '#CC..............SS#',
      '#CC..............SS#',
      '#.....CC....CC.....#',
      '+..................+',
      '+..................+',
      '#.....CC....CC.....#',
      '#SS..............CC#',
      '#SS..............CC#',
      '###WW####WW####WW###',
    ],
    enemies: [
      { path: [[3, 4], [16, 4], [16, 5], [3, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 9, row: 2, type: 'bag' },
    ],
    /** Sólo en el de carga hay vagón de armas; fuera de la ronda (filas 4-5). */
    cajonesExtra: [
      { col: 3,  row: 3 },
      { col: 16, row: 6 },
    ],
  },

  // ------------------------------------------------------------- dormitorio
  /**
   * EL VAGÓN DORMITORIO — camarotes.
   *
   * DE DÍA, porque dormir necesita la noche y la noche está postergada (ver la
   * Fase 4 en NOTAS-DISENO.md). Acá nadie duerme: es gente encerrada en su
   * cabina que no quiere que la molesten.
   *
   * CINCO CAMAROTES ARRIBA Y CINCO ABAJO, cada uno con su litera ('S') y una
   * abertura de dos baldosas al pasillo. Y en cada punta, un rincón abierto.
   * Adentro de un camarote no te ve nadie del pasillo; asomado a la abertura
   * te ve todo el vagón. Las ventanillas caen sobre las cabinas, así que la
   * ley de afuera sí te ve ahí adentro — la regla de siempre.
   *
   * ⚠️ LAS ABERTURAS NO TIENEN PUERTA TODAVÍA (etapa 7): hoy las puertas sólo
   * existen en los bordes de un vagón, y ponerlas en otro lugar es lo más
   * riesgoso del plan. Si sale caro, el plan B son cortinas.
   *
   * CUATRO PASAJEROS, uno por camarote ocupado, mirando hacia su abertura: son
   * testigos de lo que pasa en el pasillo, no de lo que pasa en la cabina de al
   * lado.
   */
  dormitorio: {
    id: 'dormitorio',
    name: 'Vagón dormitorio',
    short: 'DORMITORIO',
    hint: 'Camarotes. Gente que no quiere ser molestada.',
    layout: [
      '###WW#####WW#####WW#####WW#####WW#######',
      '#SS....#SS....#SS....#SS....#SS....#...#',
      '#SS....#SS....#SS....#SS....#SS....#...#',
      '###..###..###..###..###..###..###..#...#',
      '+......................................+',
      '+......................................+',
      '#...###..###..###..###..###..###..###..#',
      '#...#....SS#....SS#....SS#....SS#....SS#',
      '#...#....SS#....SS#....SS#....SS#....SS#',
      '#######WW#####WW#####WW#####WW#####WW###',
    ],
    enemies: [
      { path: [[4, 4], [35, 4], [35, 5], [4, 5]] },
    ],
    passengers: [
      { col: 4,  row: 1, facing: 'down' },
      { col: 18, row: 2, facing: 'down' },
      { col: 13, row: 8, facing: 'up' },
      { col: 27, row: 7, facing: 'up' },
    ],
    loot: [
      { col: 10, row: 2, type: 'bag' },
      { col: 32, row: 2, type: 'bag' },
      { col: 20, row: 7, type: 'bag' },
    ],
  },

  // --------------------------------------------------------------- guardias
  /**
   * EL VAGÓN DE GUARDIAS — uno de los dos especiales del tren de pasajeros
   * (el otro es primera clase; sale uno u otro, ver `sustituciones` en
   * data/train.js).
   *
   * CUATRO GUARDIAS, y es a propósito: es la versión militar del especial.
   * Cuando sale, el tren de pasajeros sube de 16 a 18 guardias.
   *
   * ⚠️ TODAVÍA NO ESTÁN DE FRANCO (etapa 4). Hoy patrullan como cualquiera. El
   * diseño es que estén sentados jugando a las cartas, distraídos (el
   * "Conversando" que ya existe) y que tarden 1,5 s en descolgar el arma.
   *
   * LAS RONDAS VAN POR LAS FILAS 2 Y 7, no por el pasillo, y rectas: son las
   * dos franjas libres enteras del vagón, y así el pasillo queda para cruzar.
   * Es la lección del vagón de armas — cuatro cuerpos yendo y viniendo por un
   * corredor de dos baldosas lo taponan.
   */
  guardias: {
    id: 'guardias',
    name: 'Vagón de guardias',
    short: 'GUARDIAS',
    hint: 'La escolta del tren. Mesas de cartas y catres.',
    layout: [
      '#####WW###WW###WW###WW###WW#####',
      '#SSS..SSS..SSS..SSS..SSS..SSS..#',
      '#..............................#',
      '#....CC......CC......CC........#',
      '+..............................+',
      '+..............................+',
      '#........CC......CC......CC....#',
      '#..............................#',
      '#..SSS..SSS..SSS..SSS..SSS..SSS#',
      '####WW####WW####WW####WW####WW##',
    ],
    enemies: [
      { path: [[2, 2], [14, 2]] },
      { path: [[29, 2], [17, 2]] },
      { path: [[2, 7], [14, 7]] },
      { path: [[29, 7], [17, 7]] },
    ],
    passengers: [],
    loot: [
      { col: 3, row: 6, type: 'bag' },
    ],
  },

  // ----------------------------------------------------------- primera clase
  /**
   * PRIMERA CLASE — el otro especial del tren de pasajeros.
   *
   * SE QUEDÓ CON EL PASAJERO RICO. Antes era un paquete que podía caer en
   * cualquier vagón con gente (`PAQUETES.pasajeroRico`, data/paquetes.js); ahora
   * los ricos viven acá y el paquete está apagado: una mecánica, una casa.
   *
   * TRES RICOS (`rico: true`), que llevan los números del paquete de siempre
   * ($150-250, 2,2 s para aflojar) y el sombrero de copa. ~$600 entre los tres:
   * el segundo vagón más rico del tren, detrás del express (~$750), sin
   * competirle. Sin bolsas: ellos son el botín.
   *
   * DOS GUARDAESPALDAS (`vigila: true`), plantados en el pasillo con el cartel
   * de VIGILANDO — la misma pista que ya usaba el paquete.
   *
   * Y DOS LLAVES CERRADAS, por lo que harían los sorteos con los guardaespaldas:
   *  - `sinComportamiento`: "Conversando" reubica a los dos primeros guardias
   *    del vagón, y se llevaría a los guardaespaldas lejos de los ricos.
   *  - `sinVariantes`: un Pistolero no se queda quieto al lado de nadie.
   */
  primeraClase: {
    id: 'primeraClase',
    name: 'Primera clase',
    short: '1ª CLASE',
    hint: 'Sillones de terciopelo. Gente que viaja con custodia.',
    sinComportamiento: true,
    sinVariantes: true,
    layout: [
      '#WW##WW##WW##WW##WW##WW##WW##WW#',
      '#..............................#',
      '#.SS....SS....SS....SS....SS...#',
      '#..............................#',
      '+..............................+',
      '+..............................+',
      '#..............................#',
      '#...SS....SS....SS....SS....SS.#',
      '#..............................#',
      '#WW##WW##WW##WW##WW##WW##WW##WW#',
    ],
    enemies: [
      { path: [], col: 12, row: 4, facing: 'left',  vigila: true },
      { path: [], col: 21, row: 5, facing: 'right', vigila: true },
    ],
    passengers: [
      { col: 10, row: 2, facing: 'down', rico: true },
      { col: 24, row: 2, facing: 'down', rico: true },
      { col: 18, row: 7, facing: 'up',   rico: true },
    ],
    loot: [],
  },

  // -------------------------------------------------------------- plataforma
  /**
   * LA PLATAFORMA — el lugar más expuesto del tren de carga.
   *
   * SIN TECHO Y SIN PAREDES: barandas ('H') a los dos costados, como el
   * ganado, así que los jinetes te ven de punta a punta y el camino de arriba
   * se corta acá.
   *
   * LA CARGA AMARRADA TE TAPA DE LOS GUARDIAS, NO DE LOS JINETES. Son bultos
   * de 2×2 en las filas 2-3 y 6-7: parapetado detrás de uno te cubrís del que
   * viene por el pasillo, pero la línea desde la baranda de tu costado sigue
   * libre. La regla central del juego, puesta en geometría.
   *
   * Hay dos por tren, y pueden salir pegadas (elegido por Santi): algunos
   * trenes traen 48 casillas seguidas sin paredes.
   */
  plataforma: {
    id: 'plataforma',
    name: 'Plataforma',
    short: 'PLATAFORMA',
    hint: 'Carga amarrada a cielo abierto. Te ven de todos lados.',
    sinTecho: true,
    layout: [
      '#HHHHHHHHHHHHHHHHHHHHHH#',
      '#......................#',
      '#...CC......CC......CC.#',
      '#...CC......CC......CC.#',
      '+......................+',
      '+......................+',
      '#.CC......CC......CC...#',
      '#.CC......CC......CC...#',
      '#......................#',
      '#HHHHHHHHHHHHHHHHHHHHHH#',
    ],
    enemies: [
      { path: [[2, 4], [21, 4], [21, 5], [2, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 8,  row: 2, type: 'bag' },
      { col: 15, row: 7, type: 'bag' },
      { col: 21, row: 6, type: 'bag' },
    ],
    cajonesExtra: [
      { col: 9,  row: 7 },
      { col: 16, row: 2 },
    ],
  },

  // ----------------------------------------------------------------- góndola
  /**
   * LA GÓNDOLA — carbón.
   *
   * *(Santi: "sin techo y no es un vagón al que podés 'entrar'. El carbón
   * funciona como un techo. Pasar por aquí reduce el movimiento")*
   *
   * ⚠️ HOY ES SÓLO SU FORMA (etapa 5). Lo que la hace la góndola todavía no
   * existe: el carbón que frena a todos a la mitad, cruzarla por encima, subir
   * al techo desde el pasillo, y partir `sinTecho` en dos (acá se camina por
   * arriba como un techo, pero llueve encima). Mientras tanto es un vagón
   * abierto con montículos, y corta el camino de arriba como el ganado.
   *
   * NADIE VIVE EN EL CARBÓN: cero guardias y cero botín. Sólo se cruza.
   */
  gondola: {
    id: 'gondola',
    name: 'Góndola',
    short: 'GÓNDOLA',
    hint: 'Carbón. Se cruza por encima, y cuesta.',
    sinTecho: true,
    sinComportamiento: true,
    layout: [
      '#HHHHHHHHHHHHHHHHHHHHHHHHHH#',
      '#..........................#',
      '#..CCC.......CCC.......CC..#',
      '#..CCC.......CCC.......CC..#',
      '+..........................+',
      '+..........................+',
      '#.......CCC.......CCC......#',
      '#.......CCC.......CCC......#',
      '#..........................#',
      '#HHHHHHHHHHHHHHHHHHHHHHHHHH#',
    ],
    enemies: [],
    passengers: [],
    loot: [],
  },

  // ------------------------------------------------------------- refrigerado
  /**
   * EL VAGÓN REFRIGERADO — reses colgadas.
   *
   * LAS RESES SON LA CASILLA 'R' (etapa 3, ver world/tilemap.js): tapan la
   * vista pero NO las balas, y se atraviesan a media velocidad. Un laberinto
   * donde se ve poco y se tira a ciegas — los guardias también: si te pierden
   * entre las reses, le tiran a donde te vieron por última vez.
   *
   * Para esconderte tiene que haber una res ENTRE vos y el guardia; la que
   * pisás no cuenta. Por eso las hileras tienen tres de fondo: metido hasta la
   * del fondo, las otras dos te tapan del pasillo.
   *
   * HILERAS DE UNA BALDOSA CON PASILLOS DE UNA, escalonadas arriba y abajo.
   * Dos guardias, para que haya a quién tirarle a ciegas entre las reses.
   *
   * POCAS VENTILACIONES, NO NINGUNA. Un vagón refrigerado de verdad va aislado,
   * pero estar a salvo de los jinetes es la identidad del blindado — y ésa no
   * se la roba otro vagón.
   *
   * SIN BARRILES DE PÓLVORA: en pasillos de una baldosa un barril que se
   * prende no deja por dónde huir (la lección del vagón de armas, que midió a
   * alguien muerto a tres píxeles de donde arrancó). Y la explosión atraviesa
   * las reses, igual que las balas. Decidido en la etapa 3.
   */
  refrigerado: {
    id: 'refrigerado',
    name: 'Vagón refrigerado',
    short: 'REFRIGERADO',
    hint: 'Reses colgadas. Se ve poco.',
    layout: [
      '#######WW#############WW########',
      '#.R.R.R.R.R.R.R.R.R.R.R.R.R.R..#',
      '#.R.R.R.R.R.R.R.R.R.R.R.R.R.R..#',
      '#.R.R.R.R.R.R.R.R.R.R.R.R.R.R..#',
      '+..............................+',
      '+..............................+',
      '#..R.R.R.R.R.R.R.R.R.R.R.R.R.R.#',
      '#..R.R.R.R.R.R.R.R.R.R.R.R.R.R.#',
      '#..R.R.R.R.R.R.R.R.R.R.R.R.R.R.#',
      '####WW######################WW##',
    ],
    enemies: [
      { path: [[3, 4], [14, 4]] },
      { path: [[28, 5], [17, 5]] },
    ],
    passengers: [],
    loot: [
      { col: 3,  row: 2, type: 'bag' },
      { col: 16, row: 7, type: 'bag' },
      { col: 27, row: 2, type: 'bag' },
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

  /**
   * LA LOCOMOTORA — etapa 2 de los trenes nuevos. Se ve, no se entra.
   *
   * *(decidido con Santi al diseñar los trenes: "se ve, pero no se entra")* —
   * entrar y frenar el tren quedó anotado para más adelante.
   *
   * ES UN TRAMO DEL MAPA Y NO UN DIBUJO SUELTO, y no por prolijidad: en el
   * asalto la cámara no pasa del borde del mapa (`map.bounds`), así que una
   * locomotora dibujada más allá del último enganche no se vería nunca. Como
   * tramo, la cámara llega hasta ella sola, en el asalto y en el galope.
   *
   * TODO 'X': el vacío, sólido y ciego. Nadie la pisa, nadie ve a través, las
   * balas mueren ahí. El dibujo de verdad —ténder, cabina, caldera, chimenea,
   * miriñaque— lo hace `drawLocomotora` (world/train.js) encima de estas
   * casillas, que por ser 'X' no pintan nada.
   *
   * 30 COLUMNAS (480 px) Y NO CUENTAN PARA EL RELOJ: la regla de ~40 s cada
   * 1.000 px mide tren que se JUEGA, y acá no se juega nada.
   *
   * La gente de la locomotora sigue entrando por el mismo lugar de siempre, el
   * centro del último enganche (`puntaLocomotora`): o sea que ahora se ve de
   * dónde sale.
   */
  locomotora: {
    id: 'locomotora',
    layout: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
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
 * EL VAGÓN CERRADO COMÚN DEL TREN DE CARGA (etapa 1 de los trenes nuevos).
 *
 * ES EL CORREO LIVIANO CON OTRO NOMBRE, a propósito: sus bolsas, su guardia,
 * sus rondas y sus barriles ya están medidos, y lo que cambió es cómo se llama
 * en un tren de carga — un "boxcar", no un furgón de correo. Se arma copiando
 * la plantilla en vez de duplicar el layout, así que si alguna vez se retoca el
 * correo liviano, éste se mueve con él.
 *
 * El almacén es "uno de los tres cerrados" en el diseño, pero no sale de acá:
 * tiene su propia plantilla desde que existe.
 */
WAGONS.cerrado = {
  ...WAGONS.correo_liviano,
  id: 'cerrado',
  name: 'Vagón cerrado',
  short: 'CERRADO',
  hint: 'Mercadería estibada. Poca guardia.',
};

/**
 * Tipos de botín. El valor se sortea entre min y max.
 *
 * La caja fuerte NO dice cuánto tiene hasta que la abrís, y el rango es ancho a
 * propósito: $150 es una decepción y $600 es una buena tarde. Antes valía
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

    /**
     * EL JACKPOT — de verdad el asalto de tu vida, no una figura del habla.
     *
     * *(pedido de Santi, siguiendo el plan del "efecto casino": "ahora vamos
     * con el jackpot raro en la caja fuerte")*
     *
     * SE JUEGA AL CREAR EL VAGÓN (`createLootable`), no al abrirla — el valor
     * ya está fijo adentro de la caja como todo lo demás; simplemente no lo
     * sabés hasta que la abrís. `jackpotChance` (5%, 1 de cada 20) y el rango
     * ($2500-4000) los eligió Santi sobre una tabla de tres opciones
     * calculadas: unas 8-9 veces el promedio normal (~$375), lo bastante raro
     * para seguir sorprendiendo, lo bastante grande para sentirse como lo que
     * es.
     */
    jackpotChance: 0.05,
    jackpotMin: 2500,
    jackpotMax: 4000,
  },

  /**
   * LA CAJA FUERTE OCULTA — Fase 5, ver `PAQUETES.cajaOculta` en
   * data/paquetes.js.
   *
   * No viaja en el catálogo de ningún vagón: la pone un paquete, escondida, y
   * no se ve ni se puede abrir hasta que un pasajero te dice dónde está.
   *
   * VALE MÁS Y TARDA MÁS QUE UNA CAJA NORMAL, y las dos cosas por el mismo
   * motivo: estaba escondida porque adentro hay algo que no querían que
   * viajara a la vista. 400-900 contra 150-600, y 8 segundos contra 6,5 —
   * ocho segundos quieto, de espaldas, en un vagón que ya sabe que estás.
   *
   * NO TIENE JACKPOT a propósito. El golpe de suerte ya vive en la caja
   * normal (1 de cada 20), y ahí funciona porque todas se ven iguales: la
   * gracia es que no sabés cuál te tocó. Ésta ya ES el hallazgo —el premio de
   * haber encontrado algo que estaba escondido— y meterle otra lotería
   * encima sería premiar dos veces la misma jugada.
   */
  cajaOculta: {
    id: 'cajaOculta',
    name: 'Caja fuerte oculta',
    min: 400, max: 900,
    noisy: true,
    /** Ocho segundos, contra los 6,5 de `CONFIG.loot.strongboxTime`. */
    tiempo: 8,
  },
};
