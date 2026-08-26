/**
 * La ley cabalgando a la par del tren.
 *
 * POR QUÉ EXISTEN. El sistema de cobertura tiene una debilidad estructural
 * anotada desde la fase 1: una vez que entendés cómo parapetarte, el interior
 * del vagón se vuelve manejable y el tiroteo se puede convertir en esperar
 * detrás de un asiento. Un tirador DESDE AFUERA rompe eso, porque la cobertura
 * que te salva de los guardias es justo la que te deja servido a la ventanilla.
 *
 * NO SON UNA FUENTE DE DAÑO, SON UNA FUENTE DE MOVIMIENTO. Tienen que ser muy
 * difíciles de acertar: con el arma inicial, un tirador de afuera preciso haría
 * el juego imposible. Su trabajo es que no te puedas quedar quieto, no matarte.
 * De ahí salen los números de abajo: dispersión enorme, apuntan lento y avisan.
 *
 * Hoy entran DOS y nada más, para probar el sistema. Las reglas finales de
 * aparición van a depender también de tu recompensa, que todavía no existe.
 */

/**
 * Separación mínima, EN PÍXELES, entre dos jinetes del mismo lado — igual de
 * espíritu que `enemy.separation` para los guardias (`config.js`), pero en
 * una sola dimensión porque los jinetes viven en un carril fijo.
 *
 * Hace falta AUNQUE cada jinete persiga una ventana distinta
 * (`elegirTramo` en systems/riders.js lo garantiza): mientras se acercan a
 * sus objetivos, las TRAYECTORIAS se pueden cruzar igual — uno viene y el
 * otro va, y en el cruce coinciden un instante aunque vayan a lugares
 * distintos. Medido: sin esto llegaron a 0,08px de distancia.
 */
export const RIDER_SEPARACION_MINIMA = 45;

export const RIDERS = {
  ley: {
    id: 'ley',
    name: 'La ley',

    health: 2,

    /**
     * SUBIÓ DE 62 A 92. El comentario original decía "van y vienen a la par
     * tuyo", pero 62 es MENOS que tu velocidad corriendo (`player.speed`,
     * 78): si corrías sostenido en una dirección, nunca te alcanzaban y la
     * distancia crecía sin techo — dejaban de apretar y pasaban a
     * literalmente alejarse. Con 92 pueden cerrar la distancia incluso
     * corriendo vos a fondo.
     */
    speed: 92,             // px/s relativos al tren

    /**
     * PUNTERÍA — rediseñada de cero. La vieja (0,52 rad fijo) no era en el
     * fondo un problema de puntería: era geométrico. Medido con el mapa
     * real: la ventana cae justo sobre un hueco de DOS baldosas entre los
     * asientos (el "recoveco" — ver `data/wagons.js`), y una bala tiene que
     * quedarse DENTRO de esas 32px durante varias filas antes de llegar al
     * pasillo. Con 0,52 rad casi ninguna se mantenía adentro: por eso el 88%
     * moría contra el asiento de al lado, no porque apuntaran mal.
     *
     * DOS BUGS QUE HABÍA QUE ARREGLAR ANTES DE PODER TOCAR ESTE NÚMERO:
     * 1. El jinete seguía hamacándose (`keepDistance`) DESPUÉS de fijar el
     *    ángulo de tiro, así que para cuando disparaba (0,5s después) ya se
     *    había corrido de donde apuntó. Arreglado: no se mueve mientras
     *    apunta (`seguirAlJugador`, guard de `rd.aimTimer > 0`).
     * 2. Geométricamente esto ya alcanza: apenas 10-20px de offset entre
     *    vos y la ventana (más o menos "diagonal") y el jinete DIRECTAMENTE
     *    no consigue línea de tiro — el recoveco es angosto. O sea que "tiro
     *    diagonal" ya es mucho más difícil por sí solo, sin tocar un número.
     *
     * Escala con la distancia — igual de espíritu que `enemy.spreadNear` /
     * `spreadFar` — y empeora si te estás moviendo. Pedido de Santi: de 20
     * tiros, entre 1 y 3 deberían pegar, según ángulo/distancia/si te movés.
     * Medido (con los dos bugs de arriba ya arreglados, que si no cualquier
     * número acá mide otra cosa): tiro recto y quieto ~12% (2,5/20); recto y
     * moviéndote ~8% (1,5/20); con 10px de offset, ~10-11% (2/20) tanto
     * quieto como moviéndote. Los cuatro casos caen en el rango pedido.
     */
    spreadNear: 0.25,
    spreadFar: 0.45,
    spreadNearDistance: 40,
    spreadFarDistance: 150,  // == range: más lejos que esto, directamente no tiran

    /** Si te movés cuando disparan, se suma esto a la dispersión de arriba. */
    movingPenalty: 0.16,

    /**
     * EL AVISO ANTES DE DISPARAR. Bajó de 0,85 a 0,50.
     *
     * Es el número que decide si son justos o no, así que no se toca a ojo.
     * Por qué 0,50 y no menos:
     *
     *  - Una reacción humana simple son ~250 ms. Con 500 te quedan otros 250
     *    para actuar, que a 78 px/s alcanzan para salir del marco de una
     *    ventanilla (16 px). Es ajustado, que es la idea; no imposible.
     *  - Sigue siendo casi el doble que el aviso de un guardia de adentro
     *    (0,30). El de afuera tiene que ser el más leíble de los dos, porque
     *    viene de donde no estás mirando.
     *
     * Medido antes de bajarlo: con 0,85 los jinetes acertaban 2,6% de sus tiros
     * (1 de cada 40). No hay riesgo de que esto los vuelva letales; el riesgo
     * real es de LEGIBILIDAD — que el gesto de levantar el arma dure tan poco
     * que no se llegue a ver. Eso hay que mirarlo jugando, no midiendo.
     */
    aimTime: 0.50,

    /**
     * TARDAN EN LLEGAR, PERO CUANDO LLEGAN NO PARAN.
     *
     * La cadencia bajó de 2,2 a 1,2 y la puntería NO se tocó, a propósito: lo
     * que buscamos es caos, no letalidad quirúrgica. Un jinete que tira seguido
     * y erra casi siempre te obliga a moverte todo el tiempo, que es su trabajo.
     * Uno que apunta bien te mata, que no lo es.
     *
     * Ojo con el efecto secundario: aunque la puntería sea la misma, el doble
     * de balas es el doble de impactos. Si estos números se vuelven la causa
     * principal de muerte, lo que hay que tocar es la dispersión o el aviso
     * (aimTime), NUNCA subir la cadencia todavía más.
     */
    fireCooldown: 1.2,

    /**
     * FUEGO DE CONTENCIÓN. No esperan a verte: tiran igual, a la ventanilla
     * donde te vieron por última vez, "por si volvés a asomarte ahí".
     *
     * Es lo que hace que la ventanilla siga siendo un lugar incómodo aunque
     * estés escondido, en vez de un problema que se resuelve una sola vez.
     * Apuntan mucho peor (no te están viendo) y tardan más entre tiro y tiro.
     *
     * Lo que impide que esto vuelva mortal a la cobertura: las balas que entran
     * por la ventanilla pasan POR ENCIMA del que está agachado contra la pared
     * (systems/combat.js). Agachado seguís a salvo; lo que perdés es tiempo.
     */
    suppressSpread: 0.75,
    suppressAimTime: 0.45,
    suppressCooldown: 1.4,
    suppressDrift: 22,     // cuánto se corren del punto donde te vieron
    /**
     * Cuánto siguen castigando ese lugar sin verte. Es el número que decide si
     * agacharse resuelve el problema o solo lo posterga: con 15 segundos,
     * esconderse funciona pero te cuesta un pedazo grande del asalto, que es lo
     * que queremos. Si se hace eterno, la ventanilla deja de ser jugable.
     */
    suppressMemory: 15,

    bulletSpeed: 240,
    damage: 1,

    /** Solo disparan dentro de esta franja horizontal. Más lejos ni lo intentan. */
    range: 150,

    /**
     * EL HAMACADO. Antes de esto, `keepDistance` era la amplitud de la
     * oscilación con la que "orbitaban" tu posición — el problema era que
     * orbitar tu posición es orbitar TU POSICIÓN: se movían porque vos te
     * movías, nunca por sí mismos. Ahora apuntan a la ventana (o baranda) más
     * cercana de verdad (`ventanasDe` en systems/riders.js) y esto es sólo un
     * hamacado chico alrededor de ESA ventana, para que no se vean clavados
     * como estacas. Bajó de 26 a 8: tiene que quedar corto para no salirse del
     * ancho de la ventana que eligieron.
     */
    keepDistance: 8,

    /** Cuánto tardan en trepar hasta ponerse a tiro después de aparecer. */
    settleTime: 1.2,
  },
};

/**
 * Cuándo aparecen. Por ahora: con la alarma sonando, y nada más.
 *
 * Es coherente (la ley reacciona al quilombo) y además significa que una
 * partida en silencio no los ve nunca, que es como tiene que ser.
 */
export const RIDER_SPAWN = {
  /**
   * CUÁNTOS, SEGÚN CUÁNTO PESE TU CABEZA.
   *
   * `gameState.bounty` es la fama que te precede: lo que dejaste acumulado en
   * asaltos ANTERIORES, no lo que hagas en este. Se mira una sola vez, al
   * sonar la alarma de este asalto, y fija el techo de jinetes para todo el
   * asalto — no sube ni baja mientras jugás.
   *
   * El piso es 2 (uno por lado) con recompensa 0, así que un forajido nuevo
   * juega exactamente el sistema que ya se probó. De ahí para arriba, cuanto
   * más te conocen, más mandan a buscarte.
   *
   * Números de arranque, para ajustar jugando (ver maxJinetesPara más abajo):
   * con pesoCivil=110 y pesoGuardia=15 (data/config.js), 300 de recompensa es
   * un asalto con alarma y un par de civiles muertos, o una captura sola.
   *
   * El escalón 1000→5 se agregó junto con `pesoAmenaza` (amenazar a un
   * pasajero también suma recompensa, CONFIG.bounty): sin un techo nuevo,
   * los 600 de antes se quedaban cortos apenas empezaste a acumular
   * recompensa entre varios asaltos, y de ahí para arriba nunca pasaba nada
   * más.
   */
  maxPorRecompensa: [
    { bounty: 0, max: 2 },
    { bounty: 300, max: 3 },
    { bounty: 700, max: 4 },
    { bounty: 1000, max: 5 },
  ],

  /**
   * Tardan bastante en aparecer, y es a propósito: la ley no está pegada al
   * tren, tiene que llegar. Con 12 segundos se metían en el medio del primer
   * tiroteo y no se distinguían de los guardias; con 25 llegan cuando el asalto
   * ya se te complicó, que es cuando dan miedo de verdad.
   *
   * LLEGAN EN TANDA, NO DE A UNO. A los `firstAfterAlarm` segundos aparecen
   * LOS DOS del piso juntos (uno por lado): antes salían de a uno y hasta
   * que no pasaban otros `interval` segundos sólo tenías un lado cubierto,
   * lo cual hacía que la amenaza completa tardara el doble en sentirse. De
   * ahí para arriba, si la recompensa da para más de 2, los que sobran
   * llegan de a uno, cada `interval` segundos (ver createRiderWatch).
   *
   * Ninguno de los dos escala con la recompensa a propósito: es ritmo ya
   * medido y jugado, y la recompensa sólo debía tocar la cantidad.
   */
  firstAfterAlarm: 25,     // segundos desde que suena la alarma hasta la tanda de 2
  interval: 15,            // y cada cuánto llega uno más, por encima de esos 2
};

/** El techo de jinetes para un asalto que arranca con esta recompensa. */
export function maxJinetesPara(bounty) {
  let max = RIDER_SPAWN.maxPorRecompensa[0].max;
  for (const tier of RIDER_SPAWN.maxPorRecompensa) {
    if (bounty >= tier.bounty) max = tier.max;
  }
  return max;
}
