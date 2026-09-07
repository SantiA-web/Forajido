/**
 * Estado de alarma del tren.
 *
 * Este sistema existe por una razón concreta: quedarse un rato más tiene que
 * costar algo, si no nunca hay que elegir entre escapar o seguir robando.
 *
 * CÓMO CAMBIÓ. Antes la alarma hacía aparecer guardias de la nada en el
 * enganche de al lado. Eso tenía dos problemas: no era coherente (salían de un
 * vagón que vos ya habías limpiado) y era flojo (peleabas contra uno por vez).
 *
 * Ahora la alarma no inventa a nadie: DESPIERTA a los guardias que ya están en
 * el tren. Suena en el vagón 3 y se enteran los del 1, 2, 3, 4 y 5, y todos
 * esos vienen caminando hasta vos. Si limpiaste el vagón 1, del vagón 1 no
 * viene nadie, porque no queda nadie. Y cada tantos segundos la alarma se
 * propaga un vagón más lejos, así que cuanto más te quedás, más tren se entera.
 *
 * Lo único que entra de afuera viene de la LOCOMOTORA, por la punta de
 * adelante. Nunca por atrás: atrás está el aire libre y tu caballo.
 *
 * El reloj marca cuánto tiempo te queda. La alarma marca cuánto te va a costar.
 */

import { CONFIG } from '../data/config.js';

export function createAlertSystem({ bus, audio, spawnReinforcement, spreadAlarm }) {
  let active = false;
  let timerRefuerzo = 0;
  let spawned = 0;
  let radio = 0;      // en vagones, no en píxeles

  return {
    get active() { return active; },
    get spawned() { return spawned; },
    get radius() { return radio; },
    // Ya no es "se acabaron los refuerzos": ahora dice si ya se mandó el piso
    // garantizado y está en la parte que escalona más rápido. Sigue llegando
    // gente hasta `maxAbsoluto` (el techo técnico, ver CONFIG.alert).
    get exhausted() { return spawned >= CONFIG.alert.maxAbsoluto; },
    get nextIn() { return active && !this.exhausted ? Math.max(0, timerRefuerzo) : Infinity; },

    /**
     * @param centro el vagón donde saltó la alarma
     * @param alcance a cuántos vagones llegó el ruido que la disparó
     */
    trigger(centro, alcance = CONFIG.alert.wagonRadius) {
      if (active) return;
      active = true;
      radio = alcance;
      timerRefuerzo = CONFIG.alert.firstReinforcement;
      audio.play('whistle');
      bus.emit('alarm', { wagon: centro });
      spreadAlarm(radio, centro);
    },

    update(dt) {
      if (!active) return;

      /**
       * La alarma ya NO se propaga sola con el tiempo.
       *
       * Antes crecía un vagón cada 14 segundos hicieras lo que hicieras, así
       * que quedarse callado no servía de nada. Ahora el tren se entera cuando
       * hacés ruido y sólo hasta donde llegue tu arma: la propagación la
       * manejás vos. Lo único que sigue corriendo solo son los de la locomotora.
       */

      if (spawned >= CONFIG.alert.maxAbsoluto) return;
      timerRefuerzo -= dt;
      if (timerRefuerzo > 0) return;

      spawnReinforcement(spawned);
      spawned += 1;
      timerRefuerzo = intervaloDelProximoRefuerzo(spawned);
      audio.play('whistle');
      bus.emit('reinforcement', { number: spawned });
    },

    reset() {
      active = false;
      timerRefuerzo = 0;
      spawned = 0;
      radio = 0;
    },
  };
}

/**
 * CADA VEZ MÁS SEGUIDO, no una cantidad más grande. `n` es cuántos ya
 * entraron (incluido el que acaba de salir). Antes de `max`, el ritmo de
 * siempre; de ahí en más, el intervalo baja `intervalDecay` por cada uno de
 * más, con piso en `intervalMin`.
 */
function intervaloDelProximoRefuerzo(n) {
  const c = CONFIG.alert;
  if (n < c.max) return c.interval;
  return Math.max(c.intervalMin, c.interval - c.intervalDecay * (n - c.max + 1));
}
