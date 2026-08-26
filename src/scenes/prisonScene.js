/**
 * LA CÁRCEL — lo que pasa después de que te agarran.
 *
 * Es DOM puro, como la pantalla de resultados, y no un lugar caminable. El
 * motivo es de orden, no de pereza: **la fuga jugable es la razón por la que
 * esto va a querer ser un lugar algún día**, y construir la celda antes de
 * que la fuga esté diseñada es pagar el terreno de un sistema que no existe.
 * La pantalla no cierra esa puerta; la deja para cuando haga falta.
 *
 * ACÁ NO SE ELIGE NADA, y es a propósito: estás preso. La pantalla te cuenta
 * qué te hicieron. Toda la decisión ya la tomaste antes — cuánto ruido
 * hiciste, a cuánta gente mataste, y cuánta plata guardaste en vez de
 * gastarla.
 *
 * La lógica no vive acá sino en `state/gameState.js` (`resolverPrision`),
 * porque es una mutación del estado que sobrevive al asalto. Esta escena sólo
 * la cuenta.
 */

import { CONFIG } from '../data/config.js';
import { T } from '../text/es.js';
import { gameState, resolverPrision, faltaParaLaHorca, resetGame } from '../state/gameState.js';

export function createPrisonScene(services) {
  const { input, scenes, hud, audio } = services;
  const overlay = document.getElementById('overlay');

  let resultado = null;

  function enter() {
    hud.hide();

    // Se resuelve UNA vez, al entrar. Después de esto el estado ya cambió.
    resultado = resolverPrision();

    overlay.classList.remove('hidden');
    overlay.innerHTML = resultado.horca ? panelHorca() : panelCarcel(resultado);
    audio.play(resultado.horca ? 'captured' : 'escape');

    const boton = overlay.querySelector('button');
    if (boton) boton.addEventListener('click', continuar);
  }

  function exit() {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  /**
   * Si te colgaron, se termina la partida: se borra todo y arranca una nueva.
   * Si zafaste, volvés al campamento — más pobre, y con lo que quedó de tu
   * deuda todavía encima.
   */
  function continuar() {
    if (resultado.horca) resetGame();
    scenes.goTo('camp');
  }

  function update() {
    if (input.wasPressed('KeyR') || input.wasPressed('Enter')) continuar();
  }

  function render(r) {
    r.clear('#0d0b0c');
  }

  return { enter, exit, update, render };
}

// ------------------------------------------------------------------ paneles

function panelCarcel(res) {
  const umbral = CONFIG.prision.umbralHorca;
  const falta = faltaParaLaHorca();

  const subtitulo = res.libre ? T.prision.subPago
    : res.pagado > 0 ? T.prision.subDeuda
    : T.prision.subNada;

  const filas = [
    fila(T.prision.deuda, `$${res.deuda}`),
    fila(T.prision.pagado, `−$${res.pagado}`, res.pagado > 0),
    res.restante > 0 ? fila(T.prision.restante, `$${res.restante}`, false, true) : '',
    fila(T.prision.queda, `$${gameState.money}`, true),
  ].join('');

  /**
   * LA CUENTA REGRESIVA, y es la parte que no puede faltar.
   *
   * Es la misma regla que obligó a dibujar el aro del ruido de las pisadas:
   * un sistema que no se ve se siente tramposo aunque sea perfectamente
   * justo. Acá el jugador se entera de que la horca existe y de cuánto le
   * falta, en el único momento en que seguro está mirando.
   */
  const aviso = res.libre
    ? T.prision.margenLimpio(umbral)
    : T.prision.margen(falta, umbral);

  return `
    <div class="panel">
      <h1 class="bad">${T.prision.titulo}</h1>
      <p class="subtitle">${subtitulo}</p>
      <dl>${filas}</dl>
      <p class="note ${falta <= umbral * (1 - CONFIG.prision.avisoCerca) ? 'urgente' : ''}">${aviso}</p>
      <button>${T.prision.salir}</button>
    </div>
  `;
}

function panelHorca() {
  const s = gameState.stats;
  const filas = [
    fila(T.prision.asaltos, String(s.raids)),
    fila(T.prision.escapes, String(s.escapes)),
    fila(T.prision.muertos, String(s.kills + s.civilians)),
    fila(T.prision.robado, `$${s.bestLoot}`, true),
  ].join('');

  return `
    <div class="panel">
      <h1 class="bad">${T.prision.tituloHorca}</h1>
      <p class="subtitle">${T.prision.subHorca}</p>
      <dl>${filas}</dl>
      <p class="note">${T.prision.notaHorca}</p>
      <button>${T.prision.deNuevo}</button>
    </div>
  `;
}

function fila(etiqueta, valor, oro = false, peligro = false) {
  const cls = oro ? 'gold' : peligro ? 'danger' : '';
  return `<div><dt>${etiqueta}</dt><dd class="${cls}">${valor}</dd></div>`;
}
