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
import { dibujarTendido } from './figura.js';
import { dibujarAnimal, dibujarJinete } from './caballo.js';
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
    dibujarTendido(r, rd.x, rd.y + 4, { tipo: "jineteLey", cinta: "#4a78b8" });
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
  dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, 0, 2, {
    detalles: 'ley',
    destello: rd.hitFlash > 0,
    // Los ojos se ponen rojos mientras apunta, igual que un guardia en combate.
    estado: rd.aimTimer > 0 ? 'alerta' : 'calma',
  }, montura);
  montura.adelante();

  /**
   * El aviso. Es lo mismo que hacen los guardias: se paran en seco y levantan
   * el arma. Acá importa todavía más, porque la respuesta correcta (salirte de
   * la ventanilla) tenés que poder tomarla ANTES de que salga el tiro. Sale
   * del pecho del jinete, hacia el tren.
   *
   * El fuego de contención se avisa distinto: más corto y en otro color, para
   * que se pueda distinguir "me está apuntando a mí" de "le está tirando al
   * lugar donde yo estaba". Son dos amenazas distintas y se responden distinto.
   */
  if (rd.aimTimer > 0) {
    const hacia = rd.side > 0 ? -1 : 1;
    const color = rd.suprimiendo ? '#a8794a' : '#d8cdbb';
    const largo = rd.suprimiendo ? 7 : 11;
    const pecho = rd.y - 12 + trote;
    r.line(rd.x + 4, pecho, rd.x + 4, pecho + hacia * largo, color);
    r.box(rd.x + 4, pecho + hacia * (largo + 2), 1, 1, rd.suprimiendo ? '#c89a5a' : '#fff6d0');
  }
}
