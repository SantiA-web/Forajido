/**
 * Punto de entrada.
 *
 * Arma las piezas del motor, registra las escenas y arranca el bucle.
 * Este archivo debería quedarse corto para siempre: si empieza a crecer,
 * es señal de que algo debería vivir en un sistema o en una escena.
 */

import { CONFIG } from './data/config.js';
import { createRenderer } from './engine/renderer.js';
import { activarPantallaCompleta } from './engine/pantallaCompleta.js';
import { createInput } from './engine/input.js';
import { createBus } from './engine/bus.js';
import { createRng } from './engine/rng.js';
import { createLoop } from './engine/loop.js';
import { createSceneManager } from './engine/scene.js';
import { createAudio } from './engine/audio.js';
import { createHud } from './ui/hud.js';
import { createCampScene } from './scenes/campScene.js';
import { createTownScene } from './scenes/townScene.js';
import { createMapScene } from './scenes/mapScene.js';
import { createInteriorScene } from './scenes/interiorScene.js';
import { createShopScene } from './scenes/shopScene.js';
import { createRideScene } from './scenes/rideScene.js';
import { createRaidScene } from './scenes/raidScene.js';
import { createHuidaScene } from './scenes/huidaScene.js';
import { createResultsScene } from './scenes/resultsScene.js';
import { createPrisonScene } from './scenes/prisonScene.js';
import { gameState, resetGame } from './state/gameState.js';

const canvas = document.getElementById('game');

const renderer = createRenderer(canvas, {
  ideal: CONFIG.vistaIdeal, minimo: CONFIG.view, anchoMaximo: CONFIG.vistaAnchoMaximo,
});
activarPantallaCompleta();
const input = createInput(canvas, () => renderer.densidad);
const bus = createBus();
const rng = createRng();
const scenes = createSceneManager();
const hud = createHud();
const audio = createAudio();

// "services" es la caja de herramientas que reciben todas las escenas.
const services = { renderer, input, bus, rng, scenes, hud, audio };

scenes.register('camp', createCampScene(services));
scenes.register('town', createTownScene(services));
scenes.register('mapa', createMapScene(services));
scenes.register('interior', createInteriorScene(services));
scenes.register('tienda', createShopScene(services));
scenes.register('ride', createRideScene(services));
scenes.register('raid', createRaidScene(services));
scenes.register('huida', createHuidaScene(services));
scenes.register('results', createResultsScene(services));
scenes.register('prision', createPrisonScene(services));

/**
 * El juego empieza EN EL CAMPAMENTO, no galopando.
 *
 * Hasta la fase 2 el juego era un asalto suelto: arrancabas al lado del tren
 * y la pantalla de resultados te devolvía al mismo galope, en un círculo sin
 * afuera. Ahora el ciclo es campamento → galope → asalto → resultados →
 * campamento, y ese "volver" es lo que hace que un asalto tenga consecuencias
 * en el siguiente.
 *
 * Para saltear el campamento y probar un asalto directo, sigue estando la
 * consola: FORAJIDO.services.scenes.goTo('ride')
 */
scenes.goTo('camp');

const loop = createLoop(
  (dt) => {
    scenes.update(dt);
    input.endFrame();
  },
  () => {
    // Si la ventana cambió de tamaño, el canvas se acomoda ANTES de dibujar
    // (ver `fitToScreen` en engine/renderer.js). Si no cambió, no hace nada.
    renderer.fitToScreen();
    // La lupa del mundo, cada cuadro (ver DENSIDAD en engine/renderer.js).
    renderer.nuevoCuadro();
    scenes.render(renderer);
  }
);

loop.start();

/**
 * Consola del navegador (F12): FORAJIDO.state, FORAJIDO.config, FORAJIDO.reset()
 *
 * Y `loop`, QUE ES EL QUE FALTABA PARA PODER MIRAR ALGO CON CALMA. El bucle
 * corre con `requestAnimationFrame`, así que entre dos llamadas a la consola el
 * mundo avanza solo — y eso arruinó media docena de capturas: se sacaba la foto
 * y el asalto ya había terminado. Con `FORAJIDO.loop.stop()` el mundo queda
 * congelado exactamente donde está, se puede pisar cuadro a cuadro a mano
 * (`services.scenes.update(1/60)` + `services.input.endFrame()`), dibujar con
 * `services.scenes.render(services.renderer)` y sacar la foto sin que nada se
 * mueva en el medio. `FORAJIDO.loop.start()` lo devuelve a la vida.
 */
window.FORAJIDO = { state: gameState, config: CONFIG, services, reset: resetGame, loop };
