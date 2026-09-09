/**
 * Explosivos. Por ahora hay uno solo: la dinamita.
 *
 * POR QUÉ EXISTE ESTO. En NOTAS-DISENO.md está anotado que el sistema de
 * cobertura tiene una debilidad estructural: cuando el jugador entiende cómo
 * parapetarse, el tiroteo se puede volver "esperar detrás de un asiento". La
 * dinamita es la herramienta contra eso, y va en las dos direcciones — vos la
 * usás para sacarlos a ellos de la cobertura, y los guardias del blindado la
 * usan para sacarte a vos.
 *
 * LA DECISIÓN QUE LA HACE INTERESANTE: la mecha corre desde que la ENCENDÉS,
 * no desde que la tirás.
 *
 *   - La tirás enseguida: le quedan casi tres segundos en el piso. Los guardias
 *     la ven caer y se van corriendo. Sirve para moverlos, no para matarlos.
 *   - La "cocinás" y la tirás sobre el final: explota casi al caer y no llegan
 *     a huir. Pero estás más cerca del estruendo, y a un segundo de que te
 *     vuele la mano.
 *
 * Ese es todo el juego de la dinamita, y no hace falta nada más.
 */

export const EXPLOSIVES = {
  dinamita: {
    id: 'dinamita',
    name: 'Dinamita',

    fuse: 3.0,             // segundos de mecha, desde que la encendés

    // Alcance del lanzamiento: 6,5 baldosas. Si apuntás más lejos, cae ahí.
    // Si hay una pared en el medio, cae antes: no atraviesa nada.
    throwRange: 104,
    throwSpeed: 190,       // px por segundo mientras vuela

    /**
     * El radio. Muerte instantánea a 2,5 baldosas; daño hasta 4.
     *
     * Elegido para que mate a dos o tres guardias amontonados (se separan a
     * 13px y se juntan bastante al converger) sin barrer un vagón entero.
     * Y sobre todo: LAS PAREDES Y LOS ASIENTOS FRENAN LA EXPLOSIÓN. Si hay un
     * asiento entre vos y el cartucho, te salvás. Eso es lo que evita que la
     * dinamita vuelva inútil a la cobertura en vez de solamente incomodarla.
     */
    lethalRadius: 40,
    blastRadius: 68,

    /**
     * Daño en el borde. Tiene que ser 1 y no 2: los guardias tienen 2 de vida,
     * así que con 2 el "borde" mataba igual y el radio letal real eran las 4
     * baldosas enteras en vez de las 2,5 que dice arriba. Con 1, el que está
     * en el borde sobrevive herido, que es lo que hace que las dos zonas
     * signifiquen cosas distintas.
     */
    enemyDamage: 1,
    playerDamage: 3,       // de 4 de vida: casi te mata, pero se puede contar
    playerEdgeDamage: 1,

    noise: 900,            // se oye en todo el vagón y en los de al lado
    shake: 7,

    /**
     * CUÁNTOS VAGONES RETUMBA, y es la propiedad que la hace cara de usar.
     *
     * Las armas tienen `noiseWagons` (el Colt, 1). La dinamita tiene 3: una
     * explosión no es "un ruido fuerte", es EL ruido — vuela una puerta de
     * chapa. Con 3, un cartucho en el medio del tren lo despierta casi
     * entero.
     *
     * Y NO DESPIERTA IGUAL QUE UN DISPARO. Un tiro deja a los que lo oyeron
     * sospechando (amarillo); la explosión los deja EN COMBATE (rojo). Ver
     * `retumbaElTren` en scenes/raidScene.js: ese es el precio real de la
     * dinamita, y es lo que la vuelve una decisión en vez de una llave.
     */
    noiseWagons: 3,

    /** Desde tan lejos un guardia decide que esa dinamita es problema suyo. */
    fleeRadius: 78,
  },

  /**
   * EL CAJÓN DE PÓLVORA — Fase 6a, el contenido del vagón de armas.
   *
   * NO SE LANZA: es un bulto quieto que ya está en el mapa. Por eso no tiene
   * `throwRange` ni `throwSpeed` — cuando se prende, nace un explosivo
   * exactamente donde estaba el cajón, con el destino puesto en su propio
   * lugar (`createExplosive` lo resuelve en el primer cuadro y ahí se queda
   * chispeando). O sea que reusa ENTERO el sistema de la dinamita: la mecha
   * que parpadea, el aro de aviso, los guardias que salen corriendo
   * (`fleeRadius`, systems/ai.js) y el estruendo que retumba por el tren.
   *
   * EL DAÑO ES EL DE LA DINAMITA; LOS RADIOS, NO. Un cajón lleno de pólvora
   * revienta más lejos que un cartucho suelto — ver `lethalRadius` para el
   * porqué y para lo que se midió antes de subirlos.
   */
  cajonPolvora: {
    id: 'cajonPolvora',
    name: 'Cajón de pólvora',

    /**
     * LA MECHA, contra los 3,0 s de un cartucho. La primera versión fue 1,2,
     * elegida sobre una tabla de tres (0,4 / 1,2 / 3,0): con 3,0 los guardias
     * la ven y huyen (`fleeRadius`), o sea que el cajón servía para moverlos y
     * no mataba a nadie; con 0,4 no avisaba, y eso rompe la regla que sostiene
     * todo el juego — ningún peligro dispara sin que el cuerpo lo anuncie.
     *
     * 🐛 SUBIDA DE 1,2 A 2,2 s CUANDO CRECIÓ EL ALCANCE. *(Santi, jugándolo:
     * "que una vez se arme la cadena no quede nada en ese vagón")* — y los dos
     * números van atados: con la explosión cubriendo casi todo el vagón, el
     * único refugio pasó a ser SALIR, y del centro al enganche hay 240 px, o
     * sea 3,1 s corriendo. Con 1,2 s no llegaba nadie y el vagón se volvía una
     * trampa sin jugada. Los 2,2 s son lo que hace que siga habiendo una
     * decisión: se sale, pero hay que arrancar apenas ves la chispa.
     */
    fuse: 2.2,

    /**
     * LOS RADIOS SON LOS ÚNICOS QUE NO HEREDA DE LA DINAMITA.
     *
     * 🐛 ERAN 40/68, LOS DEL CARTUCHO, Y DEJABAN DOS ZONAS MUERTAS. Medido con
     * los cinco cajones puestos: la cadena mataba al jugador en todo el centro
     * (x+160 a x+320) pero lo dejaba con 3 de 4 en las puntas, y de los cuatro
     * guardias del vagón sobrevivían dos — los que estaban en x=93 y x=414, o
     * sea fuera del alcance. El vagón tenía dos refugios donde no llegaba nada.
     *
     * Con 68/110 la unión de los cinco cubre de x+26 a x+470 de un vagón de
     * 480: **no queda nada adentro**. Es la diferencia entre una explosión
     * grande y "acá adentro voló todo", que es lo que pidió Santi.
     *
     * Y son de ESTE tipo y no de la dinamita a propósito: un cartucho suelto
     * sigue siendo el arma quirúrgica de siempre. Lo que arrasa es un vagón
     * lleno de pólvora, no la pólvora.
     */
    lethalRadius: 68,
    blastRadius: 110,

    /**
     * Y EL BORDE PEGA EL DOBLE QUE EL DE UN CARTUCHO (2 contra 1).
     *
     * 🐛 CON LOS RADIOS SOLOS NO ALCANZABA. Medido después de subirlos: la
     * cadena mataba al jugador en todo el centro del vagón (x+120 a x+360,
     * contra x+160-x+320 de antes) pero **seguían vivos los mismos dos
     * guardias de las puntas**, a 74 y 76 px del cajón más cercano — o sea
     * justo afuera del radio letal y adentro del borde, donde 1 de daño no
     * alcanza contra sus 2 de vida.
     *
     * Agrandar más los radios habría sido tapar el vagón entero y dejar sin
     * salida al jugador. La perilla correcta era el DAÑO: con 2, el borde mata
     * a un guardia común, así que **no queda nada** — que era el pedido — sin
     * mover un píxel de la geometría ni de la ventana para escapar.
     *
     * Y al jugador le pega igual de fuerte, que es la otra mitad de lo que
     * pidió Santi (*"debería ser casi mortal para el jugador, hoy es más mortal
     * para los guardias que para él"*): en el centro muere, y en las puntas
     * —el único lugar del vagón donde antes se salvaba entero— sale con la
     * mitad de la vida.
     */
    enemyDamage: 2,
    playerDamage: 3,
    playerEdgeDamage: 2,
    noise: 900,
    shake: 7,
    noiseWagons: 3,
    fleeRadius: 78,

    // --- Lo que es del CAJÓN y no de la explosión ---

    /**
     * CUÁNTO AGUANTA A TIROS. 3, el mismo número que un barril del tren veloz
     * (`CONFIG.rodante.vida`), y por el mismo motivo: ya está probado que se
     * lee bien. Es la perilla que decide si el vagón es una lotería o una
     * decisión — con 1, cualquier bala perdida de un tiroteo lo prende y no
     * hay nada que jugar; con 3, hacen falta tres en el MISMO cajón, así que
     * lo que lo prende es un tiroteo sostenido ahí adentro (o vos, a
     * propósito).
     */
    vida: 3,

    /** Cuántos cartuchos te da abrirlo con [E]. */
    recarga: 1,

    /** Lo que tardás en abrirlo: lo mismo que una bolsa (CONFIG.loot.bagTime). */
    abrirHold: 0.6,

    /**
     * EMPUJADO (`F`), CUÁNTAS CHANCES TIENE DE CRUZAR UN ENGANCHE.
     *
     * *(Santi: "yo haría que haya una probabilidad del 30% de que el barril
     * pueda pasar por un enganche y terminar en el vagón vecino")*
     *
     * Un barril suelto normalmente se cae al vacío en la pasarela — es la regla
     * que hace del enganche el único lugar del tren veloz donde los rodantes no
     * te alcanzan, y no se toca. Pero un cajón bien lanzado a veces salta, y
     * eso es lo que convierte al empujón en una jugada de dos vagones: mandarle
     * la bomba al de al lado sin entrar vos.
     *
     * Se tira UNA vez por enganche, así que cruzar dos seguidos es un 9%: la
     * chance existe pero no se puede planear una cadena de vagones.
     */
    cruzaEnganche: 0.30,

    /**
     * CUÁNTO DEJA EN EL PISO A UN GUARDIA ATROPELLADO. Es
     * `CONFIG.rodante.levantarse`, o sea **exactamente lo que te deja a vos**
     * un barril del tren veloz.
     *
     * *(Santi: "si un barril rodando toca a un guardia no explota, sino que lo
     * tumba unos segundos, tal cual pasa con el jugador")*
     *
     * Que sea el mismo número no es pereza: es lo que hace que el arma se
     * entienda sin explicarla. Ya sabés lo que se siente que te lleve puesto un
     * barril, así que sabés exactamente lo que le estás haciendo al otro.
     */
    tumba: 1.5,

    /**
     * LA CADENA. Cuando algo explota adentro del vagón, TODOS sus cajones se
     * prenden — pero no en el mismo cuadro: cada uno arranca `cadena`
     * segundos después del anterior, ordenados por cercanía al estruendo.
     *
     * *(Santi: "un barril explotado, explota todo en el vagón por una
     * explosión en cadena")*
     *
     * EL RETRASO ES LA MITAD DE LA IDEA. Los tres juntos serían un fogonazo
     * único del que no se puede escapar; escalonados 0,35 s **se ve la cadena
     * corriendo por el vagón** y, sobre todo, se puede correr mientras avanza:
     * son 55 px de ventaja por cada eslabón, encima de los 1,2 s del primero.
     * Con 0,8 s ya casi siempre zafás y deja de dar miedo.
     */
    cadena: 0.35,
  },
};

export const DEFAULT_EXPLOSIVE = 'dinamita';
