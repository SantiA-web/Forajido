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
import { CONFIG } from '../data/config.js';
import { pasarAsalto, completarBanda, encarcelar, MIEMBRO, BANDA } from '../data/banda.js';
import { REPARTO, LIBRETA } from '../data/libreta.js';
import { pagarDeudaConJmc, cobrarJmc } from '../systems/libreta.js';
import { pasar } from '../systems/tiempo.js';
import { TIEMPO } from '../data/tiempo.js';
import { completarCampamento, cerrarAsalto } from '../data/momentos.js';
import { despuesDelAsalto } from '../systems/animoEnJuego.js';
import { rumorDeCarga } from '../systems/horario.js';

export function createResultsScene(services) {
  const { input, scenes, hud } = services;
  const overlay = document.getElementById('overlay');

  let capturado = false;

  function enter(summary) {
    hud.hide();
    // Si te agarraron, de acá no se vuelve al campamento: se va a la cárcel.
    // Escapaste o no es la única bifurcación del juego que cambia a dónde vas.
    // Una prueba no te manda a ningún lado: volvés al campamento.
    capturado = summary.outcome !== 'escaped' && !summary.prueba;
    /**
     * 🔥 Para el campamento (ver data/momentos.js): un asalto más, cuánto trajiste (la pelea por el reparto), y la
     * banda pasa la noche: los heridos se curan un poco y los papeles se vacían. Las pruebas no cuentan.
     */
    if (!summary.prueba) {
      gameState.campamento = completarCampamento(gameState.campamento);
      gameState.campamento.asaltos++;
      // 🎭 Y lo que la banda va a saber (etapa 6): civiles muertos, quién quedó herido y si el caballo llegó tarde.
      gameState.ultimoAsalto = {
        // 🐛 Lo que de verdad trajiste a casa (`money`: después de la huida, con las bolsas que se cayeron y lo que
        // rescataste), no lo que agarraste en el tren (`collected`) *(Santi: "me decía que perdía exactamente el dinero
        // que tenía… los NPC no tienen en cuenta el dinero que me lleve, sino el dinero con el que llegué en la huida")*.
        botin: summary.outcome === 'escaped' ? summary.money || 0 : 0, recien: true,
        civiles: summary.civilians || 0, heridos: summary.heridos || [], caballoTarde: summary.caballoTarde || null,
        // 📖 (Lo que llevaba ese tren para la historia: ver systems/historia.js.)
        historia: (gameState.trenDelGolpe && gameState.trenDelGolpe.historia) || [],
      };
      delete gameState.trenDelGolpe;
      completarBanda(gameState.banda);
      // 🙂 Lo que vivió la banda en el asalto, y el puesto de cada uno cuenta como un uso de su habilidad.
      despuesDelAsalto(gameState, summary);
      // ⛓️ El pasajero de la banda que quedó en el tren, preso (ver `pasajeroFinal` en scenes/raidScene.js).
      if (summary.preso && gameState.banda[summary.preso]) {
        encarcelar(gameState.banda, summary.preso, gameState.tiempo ? gameState.tiempo.dia : 0);
        (gameState.campamento.noticias = gameState.campamento.noticias || []).push('preso:' + summary.preso);
      }
      // 🐎 El de los caballos que se separó en la huida ([F]) y lo agarró la ley.
      if (summary.presoHuida && gameState.banda[summary.presoHuida]) {
        encarcelar(gameState.banda, summary.presoHuida, gameState.tiempo ? gameState.tiempo.dia : 0);
        (gameState.campamento.noticias = gameState.campamento.noticias || []).push('preso:' + summary.presoHuida);
      }
      cerrarAsalto(gameState);
      // ✉️ J.Mc. EN CUOTAS (data/libreta.js, `JMC`): de lo que trajiste, primero lo que le debías.
      if (summary.outcome === 'escaped') {
        const pago = pagarDeudaConJmc(gameState);
        if (pago) (gameState.campamento.noticias = gameState.campamento.noticias || []).push('jmcDeuda:' + pago);
      }
      // 💰 EL REPARTO, POR CABEZA (BANDA-NUEVA.md): quién fue a un papel se anota ANTES de vaciar los papeles; la
      // pantalla se abre al llegar al campamento (scenes/reparto.js). Sólo si trajiste algo.
      if (REPARTO.activo && LIBRETA.activa && gameState.ultimoAsalto.botin > 0) {
        gameState.campamento.reparto = {
          botin: gameState.ultimoAsalto.botin,
          // { id: papel } de los que fueron.
          fueron: Object.fromEntries(BANDA.map((m) => [m.id, gameState.banda[m.id] && gameState.banda[m.id].papel]).filter(([, p]) => p)),
        };
      } else if (summary.outcome === 'escaped') {
        // (✉️ Sin reparto —no trajiste nada—, J.Mc. cobra igual: sale todo de deuda o de tu bolsa. Con reparto, cobra
        // al repartir: scenes/reparto.js.)
        const jmc = cobrarJmc(gameState);
        if (jmc) (gameState.campamento.noticias = gameState.campamento.noticias || []).push('jmcCobro:' + jmc.lleva + ':' + jmc.deuda);
      }
      pasarAsalto(gameState.banda);
      // 📅 El asalto y la vuelta al campamento (el viaje de ida se gastó al salir del mapa).
      // (🔁 🚂 La vuelta cuesta lo mismo que la ida: lo lejos que queda la vía, ver systems/horario.js.)
      pasar(gameState, 1 + (gameState.viajeDeVuelta || TIEMPO.cuesta.asaltoYVuelta - 1));
      // 📋 (Volvieron: desde ahora salen otra vez a las tareas de la pizarra.)
      if (gameState.campamento) gameState.campamento.golpeEnCurso = false;
      // 🃏 (Las cartas en la cantina, una vez entre golpe y golpe: ya se puede de nuevo.)
      if (gameState.campamento) gameState.campamento.cartasYa = false;
      // 🗞️ La hoja de ruta del encargado (ver `takeLoot` en scenes/raidScene.js): un tren de carga de la semana.
      if (summary.hojaDeRuta) {
        const tren = rumorDeCarga(gameState, 7, 'papeles');
        if (tren) gameState.campamento.noticias.push('rumorHoja:' + tren.id);
      }
    }
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
    scenes.goTo(capturado ? 'prision' : 'camp', capturado ? undefined : { desde: 'asalto' });
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
  const rendido = s.outcome === 'rendicion';
  const title = escaped ? T.results.escaped : rendido ? T.results.rendicion : T.results.capturedTime;
  const subtitle = s.prueba ? T.results.subPrueba(s.prueba)
    : escaped
    ? T.results.subEscaped
    : rendido ? T.results.subRendicion
    : s.outcome === 'capturedDead' ? T.results.subDead : T.results.subTime;

  const rows = [
    row(T.results.loot, `$${escaped ? s.collected : 0}`, escaped),
    /**
     * La mercadería va JUSTO DEBAJO del botín en plata y sin un precio al
     * lado: son las dos caras de "qué sacaste del tren", y la de la derecha
     * todavía no es plata. Sólo aparece si de verdad trajiste algo.
     */
    (s.objetos || []).length
      ? (escaped
        ? row(T.results.objetos(s.objetos.length), T.results.objetosSinVender, true)
        : row(T.results.objetosCaballo(s.objetos.length), T.results.objetosMarcados, true))
      : '',
    /**
     * LA HUIDA va justo debajo del botín: es lo que se le cayó por el camino.
     * Si no te tocaron, lo dice igual — salir de una persecución sin soltar
     * nada también es algo que pasó.
     */
    s.huida ? row(T.results.huida(s.huida.bolsas), s.huida.perdido > 0 ? `−$${s.huida.perdido}` : '', s.huida.bolsas === 0, s.huida.bolsas > 0) : '',
    s.huida && s.huida.derribados > 0 ? row(T.results.huidaJinetes(s.huida.derribados), String(s.huida.derribados)) : '',
    /**
     * LOS QUE TIRASTE DEL CABALLO FORCEJEANDO van aparte de los muertos: no
     * los mataste, así que no suman recompensa ni cuentan como muertes.
     */
    s.huida && s.huida.tirados > 0 ? row(T.results.huidaTirados(s.huida.tirados), String(s.huida.tirados), true) : '',
    // 📡 🔭 Cómo le fue al del telégrafo y al vigía (BANDA-NUEVA.md: todo lo que cuenta se ve, con su motivo).
    ...['telegrafo', 'vigia'].map((p) => {
      const x = s.papeles && s.papeles[p];
      return x && MIEMBRO[x.id] ? row(T.results.papel[p](MIEMBRO[x.id].corto), T.results.papelRes[p][x.res], x.res === 'bien', x.res === 'mal') : '';
    }),
    s.huida && s.huida.fin === 'llegaste' && s.huida.lugar
      ? row(T.results.huidaQuebrada, T.results.huidaQuebradaSi(s.huida.lugar), true) : '',
    /**
     * Y LO QUE TE DIO ESE REFUGIO. La quebrada devuelve plata; el bosque, en
     * cambio, se ve en la fila de la recompensa —lo que no subió—, así que acá
     * se dice con cuánto se ahorró.
     */
    s.huida && s.huida.devueltas > 0
      ? row(T.results.huidaPremioBolsa(s.huida.devueltas), `+$${s.huida.plata}`, true) : '',
    s.huida && s.huida.recogidas > 0
      ? row(T.results.huidaRecogidas(s.huida.recogidas), `+$${s.huida.plataRecogida}`, true) : '',
    // 🐎 El que se separó con [F]: si lo dejaste solo, o si lo agarraron.
    s.abandonado ? row(T.results.huidaAbandonado(MIEMBRO[s.abandonado.id].corto), T.results.huidaAbandonadoComo[s.abandonado.como], false, s.abandonado.como !== 'sano') : '',
    s.presoHuida && !s.abandonado ? row(T.results.huidaPreso(MIEMBRO[s.presoHuida].corto), T.results.huidaPresoComo, false, true) : '',
    s.huida && s.killsSinTestigos > 0 && s.bountyAhorrado > 0
      ? row(T.results.huidaPremioBosque(s.killsSinTestigos), `−$${s.bountyAhorrado}`, true) : '',
    s.cleanBonus > 0 ? row(T.results.clean, `+$${s.cleanBonus}`, true) : '',
    s.rachaBonus > 0 ? row(T.results.racha(s.racha), `+$${s.rachaBonus}`, true) : '',
    s.rachaPerdida > 0 ? row(T.results.rachaPerdida(s.rachaPerdida), '', false, true) : '',
    !escaped && s.rescate > 0 ? row(T.results.rescate, `+$${s.rescate}`, true) : '',
    row(T.results.lost, `$${s.leftBehind + (escaped ? 0 : s.collected - s.rescate)}`),
    row(T.results.kills, String(s.kills)),
    row(T.results.civilians, String(s.civilians)),
    // 🤝 El compañero: cómo terminó y los que mató él (no te suben tu recompensa).
    s.companero ? row(T.results.companero, T.results.companeroFinal[s.companero]) : '',
    s.companero && (s.killsCompanero || s.civilesCompanero)
      ? row(T.results.companeroMuertos, String(s.killsCompanero + s.civilesCompanero)) : '',
    // 🎒 Lo que robó él: si escaparon los dos, ya está sumado a lo tuyo; si te agarraron, se lo llevó él.
    s.botinCompanero ? row(s.botinCompanero.tuyo ? T.results.companeroTrajo : T.results.companeroSeLlevo,
      T.results.companeroBotin(s.botinCompanero.plata, s.botinCompanero.cosas)) : '',
    row(T.results.alarm, s.alarm ? T.results.alarmYes : T.results.alarmNo),
    row(T.results.time, formatTime(s.timeUsed)),
    row(T.results.boarded, String(s.boardedAt)),
    row(T.results.deepest, String(s.deepest)),
    row(T.results.total, `$${gameState.money}`, true),
    // 📣 (La fama del Cuervo que dio este golpe: data/historia.js, `fama`.)
    s.famaGolpe > 0 ? row(T.results.famaCuervo, `+${s.famaGolpe}`, true) : '',
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
    // Lo que te ahorraste levantando las manos (ver CONFIG.rendicion).
    rendido ? row(T.results.rendicionAhorro, `$${CONFIG.bounty.capturaFlat}`, true) : '',
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
      ${escaped || s.prueba ? '' : `<p class="note">${T.results.jailNote}</p>`}
      <button>${escaped || s.prueba ? T.results.retry : T.results.verJail}</button>
    </div>
  `;
}

function row(label, value, gold = false, danger = false) {
  const cls = gold ? 'gold' : danger ? 'danger' : '';
  return `<div><dt>${label}</dt><dd class="${cls}">${value}</dd></div>`;
}
