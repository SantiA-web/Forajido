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

  /**
   * EL JACKPOT (ver LOOT_TYPES.strongbox en data/wagons.js) se tira ACÁ, al
   * armar el vagón — el valor ya queda fijo adentro de la caja, como el
   * sorteo normal. No sabés cuál te tocó hasta que la abrís, exactamente
   * igual que con cualquier otra caja fuerte.
   */
  const esJackpot = typeId === 'strongbox' && rng.chance(type.jackpotChance);
  const value = esJackpot
    ? rng.int(type.jackpotMin, type.jackpotMax)
    : rng.int(type.min, type.max);

  return {
    x, y,
    hw: 6, hh: 5,
    typeId,
    name: type.name,
    value,
    jackpot: esJackpot,
    /**
     * Cuánto tarda en abrirse. El tipo puede traer el suyo (`tiempo`, hoy
     * sólo la caja oculta con 8 s); si no, siguen los dos de siempre.
     */
    duration: type.tiempo ?? (typeId === 'strongbox' ? CONFIG.loot.strongboxTime : CONFIG.loot.bagTime),
    noisy: type.noisy,
    progress: 0,
    taken: false,

    /**
     * ESCONDIDO: no se dibuja, no se puede abrir, no existe para el jugador —
     * hasta que algo lo revela. Hoy lo usa la caja fuerte oculta (Fase 5, ver
     * data/paquetes.js), que aparece cuando un pasajero del vagón te dice
     * dónde está.
     *
     * Es una marca del BOTÍN y no una lista aparte en la escena a propósito:
     * así todo lo que ya recorre `world.loot` (el dibujo, el buscador de lo
     * que tenés al alcance, el conteo de resultados) sigue funcionando con un
     * solo chequeo de más, y cualquier cosa que se esconda en el futuro lo
     * hereda gratis.
     */
    oculto: false,

    /**
     * REVENTADA CON DINAMITA (ver `reventarCaja`, más abajo). Una caja fuerte
     * volada ya no hay que forzarla: queda abierta en el piso y lo único que
     * falta es levantar lo que tenía adentro.
     */
    reventada: false,
  };
}

/**
 * LA DINAMITA ABRE CAJAS FUERTES.
 *
 * *(Santi: "si no querés intentar abrirlas, podés explotarla con dinamita")*
 *
 * Es la segunda cerradura que la dinamita rompe en este juego, y por el mismo
 * motivo que la primera (la puerta del blindado): hay cosas que no se abren
 * con paciencia. Lo que cambia es el precio — uno de tus dos cartuchos, y la
 * alarma sonando sí o sí, contra ocho segundos quieto y de espaldas.
 *
 * NO TE REGALA LA PLATA, TE AHORRA EL FORCEJEO. La caja queda abierta y el
 * botín sigue ahí: hay que llegar hasta ella y levantarlo, y eso ahora cuesta
 * lo mismo que una bolsa (`bagTime`). En Forajido la plata siempre se junta
 * yendo hasta ella; volarla no es una excepción, es un atajo.
 *
 * Y si estaba escondida, el estruendo la descubre: no se puede reventar algo
 * y que siga siendo un secreto.
 */
export function reventarCaja(l) {
  if (l.taken || l.reventada) return false;
  l.reventada = true;
  l.oculto = false;
  l.duration = CONFIG.loot.bagTime;
  l.progress = 0;
  return true;
}

/** ¿Es una caja fuerte? (las dos: la de siempre y la oculta) */
export function esCajaFuerte(l) {
  return l.typeId === 'strongbox' || l.typeId === 'cajaOculta';
}

export function drawLootable(r, l) {
  const col = CONFIG.colors;
  // Escondida: no hay nada que ver. Ni una silueta, ni una sombra — si algo
  // se dibujara, dejaría de estar oculta.
  if (l.oculto) return;
  if (l.taken) {
    r.ctx.globalAlpha = 0.35;
    r.box(l.x, l.y + 2, 5, 2, '#2c221c');
    r.ctx.globalAlpha = 1;
    return;
  }

  const isBox = esCajaFuerte(l);
  const base = isBox ? col.strongbox : col.bagLoot;

  if (isBox && l.reventada) {
    /**
     * REVENTADA: la chapa abierta y lo de adentro a la vista.
     *
     * Se dibuja distinta a una cerrada por un motivo concreto: en un vagón
     * donde ya volaste algo, tenés que poder saber de un vistazo cuál caja
     * todavía te va a costar ocho segundos y cuál es levantar y seguir. La
     * puerta doblada hacia un lado es toda la diferencia.
     */
    r.box(l.x, l.y, 7, 6, '#2b2f36');
    r.box(l.x + 1, l.y, 5, 4, base);
    r.rect(l.x - 7, l.y - 5, 3, 8, '#3c4149');   // la tapa arrancada, colgando
    r.box(l.x + 1, l.y, 2, 1, col.bagLoot);      // lo que hay adentro
  } else if (isBox) {
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
