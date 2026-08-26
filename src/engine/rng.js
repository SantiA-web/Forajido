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
  };
}
