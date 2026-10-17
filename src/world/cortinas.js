/**
 * 🆕 LAS CORTINAS DE LOS CAMAROTES (dormitorio, de noche) *(Santi: "una vez abierta quede abierta" y
 * "le hacen huecos y la rompen como a una puerta")*.
 *
 * Cerrada es la casilla 'Q' (ver world/tilemap.js): tapa la vista, se atraviesa y la bala pasa, así que
 * el guardia que sabe que estás detrás te tira a ciegas, como contra una puerta (`soloTapaLaVista` en
 * systems/ai.js). Además:
 *  - **SE ABRE AL PASAR Y QUEDA ABIERTA**: cualquiera que se mete en la abertura (vos, un guardia, un
 *    pasajero) la corre, y ya no se cierra.
 *  - **LOS TIROS LA AGUJEREAN Y LA ROMPEN**: cada bala que la cruza le saca una vida (una vez por bala,
 *    como a la puerta); con la mitad, se ven los agujeros; sin vida, queda rasgada y caída.
 * Abierta o rota, la casilla vuelve a ser piso: ya no tapa nada. El dibujo de cada estado lo arma
 * world/estiloNuevo/vagones.js.
 */
import { CONFIG } from '../data/config.js';

/** De noche, cada abertura de dos casillas entre tabiques del dormitorio pasa a ser una cortina cerrada. */
export function cerrarCortinas(train) {
  const { map } = train, S = map.size;
  train.cortinas = [];
  train.cortinasPorClave = {};
  for (const w of train.wagons) {
    if (w.id !== 'dormitorio') continue;
    const cuantas = Math.round(w.width / S);
    for (let f = 1; f < map.rows - 1; f++) for (let c = w.colStart + 2; c < w.colStart + cuantas - 2; c++) {
      const g = map.grid[f];
      if (!(g[c - 1] === '#' && g[c] === '.' && g[c + 1] === '.' && g[c + 2] === '#')) continue;
      g[c] = 'Q'; g[c + 1] = 'Q';
      const k = { col: c, fila: f, x: (c + 1) * S, y: (f + 0.5) * S, hw: S, hh: S / 2, vida: CONFIG.cortinas.vida, estado: 'cerrada' };
      train.cortinas.push(k);
      train.cortinasPorClave[c + ',' + f] = k;
    }
  }
}

function dejarPasar(map, k, estado) {
  k.estado = estado;
  map.grid[k.fila][k.col] = '.';
  map.grid[k.fila][k.col + 1] = '.';
}

/** Cualquiera que se mete en una abertura cerrada corre la cortina, y queda abierta. */
export function cortinasAlPasar(map, cortinas, cuerpos) {
  if (!cortinas || !cortinas.length) return;
  for (const k of cortinas) {
    if (k.estado !== 'cerrada') continue;
    for (const b of cuerpos) {
      if (!b || b.alive === false) continue;
      if (Math.abs(b.x - k.x) < k.hw && Math.abs(b.y - k.y) < k.hh) { dejarPasar(map, k, 'abierta'); break; }
    }
  }
}

/** Una bala que la cruza: le saca una vida; sin vida, queda rota (y deja de tapar). */
export function dañarCortina(map, k) {
  if (k.estado !== 'cerrada') return;
  k.vida -= 1;
  if (k.vida <= 0) dejarPasar(map, k, 'rota');
}
