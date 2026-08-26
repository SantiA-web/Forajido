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
};

export const DEFAULT_EXPLOSIVE = 'dinamita';
