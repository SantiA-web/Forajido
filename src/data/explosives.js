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
   * LOS RADIOS Y EL DAÑO SON LOS DE LA DINAMITA, a propósito. Es la misma
   * pólvora: si un cajón matara más lejos que un cartucho, habría que
   * aprender dos alcances distintos para la misma cosa. Lo único que cambia
   * es la mecha, y por un motivo que se puede contar (ver `fuse`).
   */
  cajonPolvora: {
    id: 'cajonPolvora',
    name: 'Cajón de pólvora',

    /**
     * MECHA DE 1,2 s, contra los 3,0 de un cartucho. Elegida sobre una tabla
     * de tres (0,4 / 1,2 / 3,0) por lo que deja hacer a cada uno:
     *
     *  - Con 3,0 s los guardias la ven y HUYEN (`fleeRadius`, 78 px): a 46
     *    px/s les sobra para salir del radio, así que el cajón sirve para
     *    moverlos y no mata a nadie. Eso ya lo hace la dinamita.
     *  - Con 1,2 s vos cubrís 94 px y la explosión llega a 68: **te salvás si
     *    corrés apenas la ves**. Un guardia, con su tiempo de reacción,
     *    cubre ~55 px: no llega.
     *  - Con 0,4 s no avisa, y eso rompe la regla que sostiene todo el juego
     *    — ningún peligro dispara sin que el cuerpo lo anuncie primero.
     */
    fuse: 1.2,

    lethalRadius: 40,
    blastRadius: 68,
    enemyDamage: 1,
    playerDamage: 3,
    playerEdgeDamage: 1,
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
