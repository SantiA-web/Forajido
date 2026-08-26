/**
 * Máquina de estados de escenas.
 *
 * Una escena es cualquier objeto con { enter?, exit?, update?, render? }.
 * El juego siempre tiene exactamente una escena activa: menú, asalto,
 * resultados, campamento, mapa...
 */

export function createSceneManager() {
  const registry = new Map();
  let current = null;
  let currentName = null;

  return {
    register(name, scene) {
      registry.set(name, scene);
      return scene;
    },

    goTo(name, params) {
      const next = registry.get(name);
      if (!next) throw new Error(`Escena desconocida: "${name}"`);

      if (current && current.exit) current.exit();
      current = next;
      currentName = name;
      if (current.enter) current.enter(params || {});
    },

    update(dt) { if (current && current.update) current.update(dt); },
    render(renderer) { if (current && current.render) current.render(renderer); },

    get name() { return currentName; },
  };
}
