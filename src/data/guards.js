/**
 * Tipos de guardia.
 *
 * La idea: la dificultad NO sube por un multiplicador escondido, sube porque
 * en el tren viaja gente distinta. Un guardia que el asalto pasado moría con
 * dos tiros y hoy necesita cuatro, sin haber cambiado de aspecto, se siente
 * como un error del juego. Un tipo con otra silueta se siente como progresión.
 *
 * Por eso cada tipo tiene que verse. Y hay una restricción importante para eso:
 *
 *   EL COLOR DEL CUERPO YA ESTÁ OCUPADO. Dice el ESTADO (gris = tranquilo,
 *   amarillo = sospecha, rojo = combate), que es la información más importante
 *   del juego momento a momento. Así que el tipo se distingue por la SILUETA,
 *   nunca por el color del cuerpo.
 *
 * El techo de vida es 4 y es un compromiso, no un detalle: el Rifle de Caza
 * saca 5, así que mata de un tiro a cualquier guardia del juego. Si algún día
 * aparece un tipo con 5 de vida, esa promesa se rompe en silencio.
 */

export const MAX_GUARD_HEALTH = 4;

export const GUARD_TYPES = {
  normal: {
    id: 'normal',
    name: 'Guardia',
    health: 2,
    look: 'normal',
  },

  blindado: {
    id: 'blindado',
    name: 'Guardia blindado',
    health: 3,
    look: 'placa',      // se le ve la placa en el pecho
  },

  /**
   * EL SHERIFF (data/bosses.js). Aguanta EXACTAMENTE lo mismo que un guardia
   * común —"solo es apenas un guardia"— y su tipo existe sólo para que se vea
   * distinto: la estrella en el pecho.
   *
   * Es el caso que mejor defiende la regla de arriba: lo peligroso de este
   * tipo no es cuánto aguanta, es lo que le hace al resto del tren mientras
   * respira. Si su amenaza estuviera en la vida, habría que subírsela; como
   * está en otro lado, la silueta alcanza.
   */
  sheriff: {
    id: 'sheriff',
    name: 'El Sheriff',
    health: 2,
    look: 'estrella',
  },
};

export const DEFAULT_GUARD_TYPE = 'normal';

/**
 * La vida final de un guardia = la de su tipo + lo que sume la dificultad del
 * tren, con tope en MAX_GUARD_HEALTH.
 *
 * En un tren tranquilo: guardia común 2, blindado 3.
 * En un tren escoltado: guardia común 3, blindado 4.
 */
export function guardHealth(typeId, vidaExtra = 0) {
  const tipo = GUARD_TYPES[typeId] || GUARD_TYPES[DEFAULT_GUARD_TYPE];
  return Math.min(MAX_GUARD_HEALTH, tipo.health + vidaExtra);
}
