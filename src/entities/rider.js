/**
 * Un jinete de la ley, galopando al costado del tren.
 *
 * Este archivo dice QUÉ es y cómo se dibuja. Cómo se comporta está en
 * systems/riders.js, igual que el guardia y su IA viven separados.
 *
 * Ojo: vive FUERA de la grilla de tiles, arriba o abajo del tren. No colisiona
 * con nada, no busca camino y no se pisa con nadie. Por eso no es un enemigo
 * más de `world.enemies`: mezclarlo ahí adentro rompería la IA de los guardias
 * (separación, coberturas, alarma por vagón) para no ganar nada.
 */

import { CONFIG } from '../data/config.js';
import { dibujarTendido, caidaNueva, polvoNuevo } from './figura.js';
import { dibujarAnimal, dibujarJinete, dibujarSilla, asientoNuevo } from './caballo.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { gameState } from '../state/gameState.js';
import { CAIDA_DURA } from './estiloNuevo/caida.js';
import { dibujarFogonazo } from './bullet.js';
import { RIDERS } from '../data/riders.js';

export function createRider(x, y, side, typeId = 'ley') {
  const tipo = RIDERS[typeId];

  return {
    x, y,
    // Caja de impacto acorde al dibujo: son bultos grandes, un hombre a caballo.
    hw: 9, hh: 7,
    typeId,
    tipo,

    side,                  // -1 = arriba del tren, +1 = abajo
    health: tipo.health,
    alive: true,

    settle: tipo.settleTime,
    aimTimer: 0,
    aimDir: 0,
    cooldown: 1.0,

    // Dónde te vieron por última vez: es a lo que le siguen tirando cuando
    // te escondés.
    lastSeen: null,
    memoria: 0,
    suprimiendo: false,

    hitFlash: 0,
    gallop: Math.random() * 6.28,
  };
}

export function drawRider(r, rd) {
  if (!rd.alive) {
    // (La sombra del jinete en la pared, `r.plano`, no la tiene el que se cayó.)
    if (r.plano) return;
    if (estiloNuevo.activo && r.ctx) { dibujarCaida(r, rd); return; }
    dibujarTendido(r, (rd.cuerpoX ?? rd.x) + (rd.cuerpoDx || 0), rd.y + 4, { tipo: "jineteLey", cinta: "#4a78b8" });
    return;
  }

  /**
   * EL MISMO CABALLO DEL GALOPE (entities/caballo.js), con el jinete de la ley
   * encima EN SOMBRA: negro, con la cinta azul en el sombrero y la insignia.
   * *(Santi eligió para el galope "un caballo normal, como el de ahora, pero el
   * jugador sí es negro"; los jinetes de la ley siguen la misma regla.)*
   * Corre hacia la derecha, que es hacia donde va el tren al que le sigue el
   * paso.
   *
   * El galope sale de `rd.gallop` (segundos, lo avanza systems/riders.js): una
   * zancada de 0,56 s, a fondo. Los cascos en `rd.y + 7`.
   */
  r.ctx.globalAlpha = 0.25;
  r.box(rd.x, rd.y + 7, 11, 2, '#000');
  r.ctx.globalAlpha = 1;

  const T = 0.56;
  const zancada = { t: ((rd.gallop % T) + T) % T, T };
  const trote = Math.round(Math.cos((zancada.t / T - 0.15) * Math.PI * 2) * 1.2);
  const montura = dibujarAnimal(r, rd.x, rd.y, zancada, trote, 1, 0);
  // El jinete amortigua el rebote del lomo, igual que el jugador en el galope.
  const rebote = Math.cos((zancada.t / T - 0.25) * Math.PI * 2) * 1.2 * 0.5;
  const fig = dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, 0, 2, {
    detalles: 'ley',
    ent: rd,
    // 🆕 E4: cuánto tiene el rifle afuera y hacia dónde apunta (ver sacarElRifle en systems/riders.js).
    empuna: rd.empuna || 0,
    ang: rd.aimDir || 0,
    destello: rd.hitFlash > 0,
    // Los ojos se ponen rojos mientras apunta, igual que un guardia en combate.
    estado: rd.aimTimer > 0 ? 'alerta' : 'calma',
  }, montura);
  montura.adelante();

  // (🆕 E4: dónde iba sentado, por si se cae: la caída arranca en la silla. Ver `dibujarCaida`.)
  const asiento = asientoNuevo(montura);
  if (asiento) rd._asiento = { dx: asiento.x - rd.x, dy: asiento.y - rd.y };

  /**
   * 🆕 E4 · EL FOGONAZO, DE LA BOCA DEL CAÑO DIBUJADO *(Santi: "vamos con el fogonazo")*: el dibujo anota dónde quedó
   * (`_boca`, como los guardias de a pie con `_p3Boca`), la bala sale de ahí (`disparar` en systems/riders.js) y el
   * fogonazo es el mismo del jugador y los guardias (`dibujarFogonazo`), hacia donde apuntó, mientras dure `rd.fogonazo`.
   */
  // (La sombra del jinete en la pared, `r.plano` en raidScene.js, no anota la boca ni tiene fogonazo.)
  const boca = !r.plano && fig && fig.boca;
  if (boca) rd._boca = { dx: boca.x - rd.x, dy: boca.y - rd.y, t: performance.now() };
  if (boca && rd.fogonazo > 0) dibujarFogonazo(r, boca.x, boca.y, rd.aimDir || 0, rd.fogonazo / CONFIG.feel.muzzleTime, boca.hacia);

  /**
   * 🔁 E4 · EL AVISO YA NO ES UNA RAYA *(Santi: "sacala")*: antes salía una raya del pecho del jinete hacia el tren
   * (más corta y de otro color en el fuego de contención). Ahora el aviso es verlo sacar el rifle, darse vuelta en
   * la silla y apoyar la cabeza en la culata (`sacarElRifle` en systems/riders.js), que dura lo mismo.
   */
}

/**
 * 🆕 E4 · EL QUE SE CAE DEL CABALLO (el movimiento, en `caerDelCaballo` de systems/riders.js; los cuadros, en
 * entities/estiloNuevo/caida.js). Primero el caballo, que sigue galopando con la silla vacía y, a partir de
 * `CAE.abreDesde`, se abre del tren (de tu lado, en diagonal hacia la cámara; del otro, hacia el fondo). Después el
 * jinete, que arranca donde iba sentado y cae para atrás, y al terminar queda el tirado de siempre. El polvo, encima.
 */
function dibujarCaida(r, rd) {
  const t = rd.muerto || 0;
  const T = 0.56;
  const zancada = { t: ((rd.gallop % T) + T) % T, T };
  const trote = Math.round(Math.cos((zancada.t / T - 0.15) * Math.PI * 2) * 1.2);
  const pose = t > 0.3 ? rd.side * 2 : 0;
  const yCaballo = rd.y + (rd.caballoY || 0);
  r.ctx.globalAlpha = 0.25;
  r.box(rd.x, yCaballo + 7, 11, 2, '#000');
  r.ctx.globalAlpha = 1;
  const montura = dibujarAnimal(r, rd.x, yCaballo, zancada, trote, 1, pose);
  dibujarSilla(r, montura);
  if (montura.adelante) montura.adelante();

  const a = rd._asiento || { dx: -2, dy: -13 };
  const x = (rd.cuerpoX ?? rd.x) + (rd.cuerpoDx || 0) + a.dx, y = rd.y + a.dy;
  const aspecto = rd._aspecto || {};
  // (Al terminar, el tirado de costado: el "cuadro" 8, ver TIRADO en estiloNuevo/caida.js.)
  caidaNueva(r, { x, y, k: t < CAIDA_DURA ? Math.min(7, Math.floor(t / CAIDA_DURA * 8)) : 8, aspecto });
  const noche = !gameState.esDeDia;
  for (const q of rd.polvo || []) polvoNuevo(r, q.x, q.y, Math.floor(q.t / 0.1), noche);
}
