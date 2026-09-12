/**
 * HUD: la interfaz de arriba.
 * Es HTML normal, no dibujo en canvas. Cambiar cómo se ve es tocar CSS.
 */

import { T } from '../text/es.js';

export function createHud() {
  const root = document.getElementById('hud');
  const healthEl = document.getElementById('hud-health');
  const ammoEl = document.getElementById('hud-ammo');
  const timerEl = document.getElementById('hud-timer');
  const alarmEl = document.getElementById('hud-alarm');
  const moneyEl = document.getElementById('hud-money');
  const coverEl = document.getElementById('hud-cover');
  const wagonEl = document.getElementById('hud-wagon');
  const exitEl = document.getElementById('hud-exit');
  const dynamiteEl = document.getElementById('hud-dynamite');

  return {
    show() { root.classList.remove('hidden'); },
    hide() { root.classList.add('hidden'); },

    update(data) {
      // Vida
      let health = '';
      for (let i = 0; i < data.maxHealth; i++) {
        health += i < data.health ? '<span>●</span>' : '<span class="hurt">●</span>';
      }
      healthEl.innerHTML = health;

      // Balas
      if (data.reloading) {
        ammoEl.textContent = T.hud.reloading;
        ammoEl.classList.add('reloading');
      } else {
        ammoEl.classList.remove('reloading');
        let ammo = '';
        for (let i = 0; i < data.magazine; i++) {
          ammo += i < data.ammo ? '<span>▮</span>' : '<span class="spent">▮</span>';
        }
        ammoEl.innerHTML = ammo;
      }

      // Dinamita: un cartucho por cada una que te queda.
      let dyn = '';
      for (let i = 0; i < data.maxDynamite; i++) {
        dyn += i < data.dynamite ? '<span>▬</span>' : '<span class="spent">▬</span>';
      }
      dynamiteEl.innerHTML = dyn;
      dynamiteEl.classList.toggle('lit', data.fuseLit);

      // Reloj + estado de alarma
      timerEl.textContent = formatTime(data.timeLeft);
      timerEl.classList.toggle('urgent', data.urgent);

      /**
       * ALARMA o LIMPIO — el mismo lugar dice las dos caras del mismo estado.
       *
       * Antes acá no había nada mientras no sonara la alarma, y el premio por
       * salir limpio (el DOBLE de botín) no se veía por ningún lado hasta la
       * pantalla de resultados. Ahora la racha está a la vista todo el asalto:
       * es lo que convierte "no me descubrieron" en algo que estás cuidando y
       * no en algo de lo que te enterás al final.
       */
      alarmEl.textContent = data.alarm ? T.hud.alarm : T.hud.limpio;
      alarmEl.classList.toggle('on', !!data.alarm);
      alarmEl.classList.toggle('limpio', !data.alarm);

      // Dinero del asalto y cobertura. Con la alarma sonando, la plata encima
      // pesa: el porcentaje dice cuánta velocidad te está costando cargarla.
      const lastrePct = Math.round((data.lastre || 0) * 100);
      /**
       * LA MERCADERÍA, AL LADO DE LA PLATA. Se muestra como "3/5" y no como un
       * precio, por lo mismo que el cartelito al levantarla: todavía no sabés
       * cuánto vale. Lo que sí tenés que saber de un vistazo es **cuánto lugar
       * te queda**, que es la decisión del tren de carga.
       *
       * Y no aparece si no llevás ninguna: en el tren de pasajeros no hay
       * objetos, y un contador en cero es ruido.
       */
      const carga = data.objetos > 0 ? `  ${data.objetos}/${data.objetosMax}` : '';
      moneyEl.textContent = lastrePct > 0
        ? `${T.hud.money(data.money)}${carga}  ${T.hud.lastre(lastrePct)}`
        : `${T.hud.money(data.money)}${carga}`;
      moneyEl.classList.toggle('pesado', lastrePct > 0);
      coverEl.textContent = data.inCover ? T.hud.cover : data.sneaking ? T.hud.sneak : '';

      // Dónde estás dentro del tren y cuánto te falta para el caballo.
      // El 0 es la plataforma de cola, que no es un vagón y no tiene nombre.
      // (No se puede usar toExit para esto: con el caballo adelante, estar a
      // cero vagones de la salida es lo más común del asalto.)
      wagonEl.textContent = data.wagon === 0
        ? ''
        : data.enTecho
          ? T.prompts.techo
          : data.afuera
            ? T.prompts.coupling
            : `${T.hud.wagon(data.wagon)} · ${data.wagonName}`;
      exitEl.textContent = T.hud.toExit(data.toExit);
      exitEl.classList.toggle('close', data.toExit <= 1);
      exitEl.classList.toggle('far', data.toExit >= 4);
    },
  };
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
