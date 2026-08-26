/**
 * Event bus: el sistema nervioso del juego.
 *
 * Los sistemas no se llaman entre sí. Combat no sabe que existe Reputación;
 * simplemente avisa bus.emit('enemyKilled', ...) y quien le interese escucha.
 * Esto es lo que evita que el código se convierta en un plato de fideos
 * cuando agreguemos fama, recompensa, honor, relaciones y misiones.
 */

export function createBus() {
  const listeners = new Map();

  return {
    /** Devuelve una función para darse de baja. */
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => this.off(type, fn);
    },

    off(type, fn) {
      const set = listeners.get(type);
      if (set) set.delete(fn);
    },

    emit(type, payload) {
      const set = listeners.get(type);
      if (!set) return;
      // Copiamos la lista por si un listener se da de baja durante el emit.
      for (const fn of [...set]) fn(payload);
    },

    clear() { listeners.clear(); },
  };
}
