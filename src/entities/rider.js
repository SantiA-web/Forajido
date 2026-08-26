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
  const col = CONFIG.colors;

  if (!rd.alive) {
    r.ctx.globalAlpha = 0.5;
    r.box(rd.x, rd.y, 6, 2, '#2a2320');
    r.ctx.globalAlpha = 1;
    return;
  }

  // El galope: sube y baja. Sin esto se ve como una caja deslizándose.
  const salto = Math.sin(rd.gallop * 9) * 2;
  const y = rd.y + salto;
  const patas = Math.sin(rd.gallop * 9) > 0 ? 1 : -1;

  // --- El caballo ---
  r.box(rd.x, y + 4, 11, 4, col.horse);                  // el cuerpo
  r.box(rd.x - 9, y + 1, 3, 3, col.horse);               // el cuello
  r.box(rd.x - 12, y - 1, 3, 2, col.horse);              // la cabeza
  r.box(rd.x + 11, y + 2, 2, 2, col.horseMane);          // la cola
  r.rect(rd.x - 8, y + 8, 3, 4 + patas, col.horseDark);  // patas delanteras
  r.rect(rd.x + 5, y + 8, 3, 4 - patas, col.horseDark);  // patas traseras

  // --- El jinete ---
  const cuerpo = rd.hitFlash > 0 ? '#fff' : col.rider;
  r.box(rd.x + 1, y - 4, 4, 5, cuerpo);                  // el torso
  r.rect(rd.x - 5, y - 11, 12, 3, col.riderHat);         // el sombrero de ala ancha
  r.rect(rd.x - 1, y - 9, 4, 2, col.riderHat);           // la copa

  /**
   * El aviso. Es lo mismo que hacen los guardias: se paran en seco y levantan
   * el arma. Acá importa todavía más, porque la respuesta correcta (salirte de
   * la ventanilla) tenés que poder tomarla ANTES de que salga el tiro.
   *
   * El fuego de contención se avisa distinto: más corto y en otro color, para
   * que se pueda distinguir "me está apuntando a mí" de "le está tirando al
   * lugar donde yo estaba". Son dos amenazas distintas y se responden distinto.
   */
  if (rd.aimTimer > 0) {
    const hacia = rd.side > 0 ? -1 : 1;
    const color = rd.suprimiendo ? '#a8794a' : '#d8cdbb';
    const largo = rd.suprimiendo ? 7 : 11;
    r.line(rd.x + 3, y - 1, rd.x + 3, y - 1 + hacia * largo, color);
    r.box(rd.x + 3, y - 1 + hacia * (largo + 2), 1, 1, rd.suprimiendo ? '#c89a5a' : '#fff6d0');
  }
}
