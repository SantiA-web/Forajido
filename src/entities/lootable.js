/**
 * Botín: cualquier cosa que se pueda robar manteniendo [E].
 *
 * La clave de diseño es que el botín cuesta TIEMPO. Una bolsa son 0,6s;
 * la caja fuerte son 4s parado en el peor lugar del vagón y haciendo ruido.
 * De ahí sale la tensión: cada segundo robando es un segundo menos para huir.
 */

import { CONFIG } from '../data/config.js';
import { LOOT_TYPES } from '../data/wagons.js';

export function createLootable(x, y, typeId, rng) {
  const type = LOOT_TYPES[typeId];

  return {
    x, y,
    hw: 6, hh: 5,
    typeId,
    name: type.name,
    value: rng.int(type.min, type.max),
    duration: typeId === 'strongbox' ? CONFIG.loot.strongboxTime : CONFIG.loot.bagTime,
    noisy: type.noisy,
    progress: 0,
    taken: false,
  };
}

export function drawLootable(r, l) {
  const col = CONFIG.colors;
  if (l.taken) {
    r.ctx.globalAlpha = 0.35;
    r.box(l.x, l.y + 2, 5, 2, '#2c221c');
    r.ctx.globalAlpha = 1;
    return;
  }

  const isBox = l.typeId === 'strongbox';
  const base = isBox ? col.strongbox : col.bagLoot;

  if (isBox) {
    r.box(l.x, l.y, 7, 6, '#3c4149');
    r.box(l.x, l.y, 6, 5, base);
    r.box(l.x, l.y, 2, 2, '#3c4149');
  } else {
    r.box(l.x, l.y, 5, 4, '#7a5f1e');
    r.box(l.x, l.y - 1, 4, 3, base);
  }

  // Barra de progreso mientras lo estás abriendo.
  if (l.progress > 0) {
    const w = 16;
    r.rect(l.x - w / 2, l.y - 12, w, 3, '#1a1512');
    r.rect(l.x - w / 2, l.y - 12, w * (l.progress / l.duration), 3, col.bagLoot);
  }
}
