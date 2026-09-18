/**
 * Pantalla de resultados del asalto.
 *
 * Es DOM puro, y desde la fase 3 ya no devuelve al galope: **devuelve al
 * campamento**. Ese cambio de una línea es lo que cierra el ciclo — antes el
 * juego era un asalto que se repetía en círculo, ahora es un lugar del que
 * salís y al que volvés con lo que hayas juntado (y con la ley detrás).
 */

import { T } from '../text/es.js';
import { gameState } from '../state/gameState.js';
import { formatTime } from '../ui/hud.js';

export function createResultsScene(services) {
  const { input, scenes, hud } = services;
  const overlay = document.getElementById('overlay');

  let capturado = false;

  function enter(summary) {
    hud.hide();
    // Si te agarraron, de acá no se vuelve al campamento: se va a la cárcel.
    // Escapaste o no es la única bifurcación del juego que cambia a dónde vas.
    capturado = summary.outcome !== 'escaped';
    overlay.classList.remove('hidden');
    overlay.innerHTML = buildPanel(summary);

    const button = overlay.querySelector('button');
    if (button) button.addEventListener('click', continuar);
  }

  function exit() {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  function continuar() {
    scenes.goTo(capturado ? 'prision' : 'camp');
  }

  function update() {
    if (input.wasPressed('KeyR')) continuar();
  }

  function render(r) {
    r.clear('#0d0b0c');
  }

  return { enter, exit, update, render };
}

function buildPanel(s) {
  const escaped = s.outcome === 'escaped';
  const title = escaped ? T.results.escaped : T.results.capturedTime;
  const subtitle = escaped
    ? T.results.subEscaped
    : s.outcome === 'capturedDead' ? T.results.subDead : T.results.subTime;

  const rows = [
    row(T.results.loot, `$${escaped ? s.collected : 0}`, escaped),
    /**
     * La mercadería va JUSTO DEBAJO del botín en plata y sin un precio al
     * lado: son las dos caras de "qué sacaste del tren", y la de la derecha
     * todavía no es plata. Sólo aparece si de verdad trajiste algo.
     */
    (s.objetos || []).length
      ? row(T.results.objetos(s.objetos.length), T.results.objetosSinVender, true)
      : '',
    /**
     * LA HUIDA va justo debajo del botín: es lo que se le cayó por el camino.
     * Si no te tocaron, lo dice igual — salir de una persecución sin soltar
     * nada también es algo que pasó.
     */
    s.huida ? row(T.results.huida(s.huida.bolsas), s.huida.perdido > 0 ? `−$${s.huida.perdido}` : '', s.huida.bolsas === 0, s.huida.bolsas > 0) : '',
    s.huida && s.huida.derribados > 0 ? row(T.results.huidaJinetes(s.huida.derribados), String(s.huida.derribados)) : '',
    s.cleanBonus > 0 ? row(T.results.clean, `+$${s.cleanBonus}`, true) : '',
    s.rachaBonus > 0 ? row(T.results.racha(s.racha), `+$${s.rachaBonus}`, true) : '',
    s.rachaPerdida > 0 ? row(T.results.rachaPerdida(s.rachaPerdida), '', false, true) : '',
    !escaped && s.rescate > 0 ? row(T.results.rescate, `+$${s.rescate}`, true) : '',
    row(T.results.lost, `$${s.leftBehind + (escaped ? 0 : s.collected - s.rescate)}`),
    row(T.results.kills, String(s.kills)),
    row(T.results.civilians, String(s.civilians)),
    row(T.results.alarm, s.alarm ? T.results.alarmYes : T.results.alarmNo),
    row(T.results.time, formatTime(s.timeUsed)),
    row(T.results.boarded, String(s.boardedAt)),
    row(T.results.deepest, String(s.deepest)),
    row(T.results.total, `$${gameState.money}`, true),
    s.bountyGain > 0 ? row(T.results.bounty, `+$${s.bountyGain}`, false, true) : '',
    /**
     * El premio del cazarrecompensas va DESPUÉS de lo que subió y ANTES del
     * total, porque ése es el orden en que pasó: primero te identificaron,
     * después le ganaste al que vino a cobrarla. Leído así, el total de abajo
     * se explica solo.
     */
    s.jefeMuerto && s.bountyBajada > 0
      ? row(T.results.jefe(s.jefeNombre), `−$${s.bountyBajada}`, true) : '',
    s.jefeMuerto && s.bountyBajada <= 0
      ? row(T.results.jefe(s.jefeNombre), T.results.jefeSinRebaja, true) : '',
    s.famaGanada > 0 ? row(T.results.fama, `+${s.famaGanada}`, true) : '',
    row(T.results.bountyTotal, `$${gameState.bounty}`, false, gameState.bounty > 0),
    /**
     * `honorGain` puede ir para cualquier lado (a diferencia de `bountyGain`,
     * que sólo sube) — por eso lleva el signo siempre, y sólo se oculta si el
     * asalto no lo tocó para ningún lado.
     */
    s.honorGain ? row(T.results.honor, `${s.honorGain > 0 ? '+' : ''}${s.honorGain}`, s.honorGain > 0, s.honorGain < 0) : '',
    row(T.results.honorTotal, `${gameState.honor > 0 ? '+' : ''}${gameState.honor}`, gameState.honor > 0, gameState.honor < 0),
  ].join('');

  return `
    <div class="panel">
      <h1 class="${escaped ? 'good' : 'bad'}">${title}</h1>
      <p class="subtitle">${subtitle}</p>
      <dl>${rows}</dl>
      ${escaped ? '' : `<p class="note">${T.results.jailNote}</p>`}
      <button>${escaped ? T.results.retry : T.results.verJail}</button>
    </div>
  `;
}

function row(label, value, gold = false, danger = false) {
  const cls = gold ? 'gold' : danger ? 'danger' : '';
  return `<div><dt>${label}</dt><dd class="${cls}">${value}</dd></div>`;
}
