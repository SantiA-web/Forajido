/**
 * Generador de números aleatorios CON SEMILLA (algoritmo mulberry32).
 *
 * ¿Por qué no usar Math.random()? Porque con semilla podemos repetir un
 * asalto exactamente igual para encontrar un bug, y más adelante generar
 * trenes y eventos reproducibles a partir del estado de la partida.
 */

export function createRng(seed = Date.now()) {
  let state = seed >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    get seed() { return seed; },

    /** Decimal entre 0 y 1. */
    next,

    /** Decimal entre min y max. */
    range: (min, max) => min + next() * (max - min),

    /** Entero entre min y max, ambos incluidos. */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),

    /** true con probabilidad p (0..1). */
    chance: (p) => next() < p,

    /** Un elemento cualquiera de un array. */
    pick: (arr) => arr[Math.floor(next() * arr.length)],

    /** Decimal entre -amount y +amount. Útil para dispersión y partículas. */
    spread: (amount) => (next() * 2 - 1) * amount,

    /**
     * COMO `spread`, PERO PARA TIROS DE VERDAD — el círculo de la mira
     * muestra `amount` como lo más probable, no como un techo absoluto.
     *
     * *(idea de Santi: "¿y si hacemos que la dispersión de las balas de
     * cualquier arma en realidad pueda salir del círculo? El círculo es una
     * idea de lo que puede pasar, no una garantía")*
     *
     * Con probabilidad `p` el pulso se va de verdad, y la dispersión de ESE
     * tiro sale multiplicada por `mult` — pero sigue siendo uniforme adentro
     * de ese rango más ancho, la misma regla de siempre (ver el porqué de la
     * uniformidad en CONFIG.mira). Lo único que cambia es CUÁL es el rango:
     * la mayoría de las veces el de siempre, a veces uno más grande que
     * nunca se dibuja. Por eso el círculo pasa de ser una promesa a ser una
     * expectativa: sigue siendo la referencia correcta la mayor parte del
     * tiempo, y por eso vale la pena mirarlo, pero ya no es un seguro.
     *
     * No reemplaza a `spread()`: eso lo siguen usando la cámara, la deriva de
     * los jinetes y todo lo que no es un gatillo — tocar `spread()` en sí
     * habría cambiado esas cosas también, sin que nadie lo pidiera.
     */
    spreadDeTiro: (amount, p, mult) => {
      const magnitud = next() < p ? amount * mult : amount;
      return (next() * 2 - 1) * magnitud;
    },
  };
}
