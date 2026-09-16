/**
 * Una puerta en un enganche del tren.
 *
 * El mapa de tiles nunca cambia durante el asalto (ver world/tilemap.js), así
 * que una puerta no puede ser un tile: es una entidad con estado propio, igual
 * que el botín o los explosivos, parada sobre la pasarela del enganche.
 *
 * LA REGLA QUE LA HACE INTERESANTE: cerrada, tapa la VISTA pero no las balas.
 * Un guardia del otro lado no te ve, pero te puede tirar igual, a ciegas (ver
 * systems/ai.js). Abrirla para vos es gratis — empujarla ya la abre — así que
 * nunca te frena: sólo cambia quién ve a quién mientras cruzás.
 *
 * LA BLINDADA ES LA EXCEPCIÓN A TODO ESO. Es chapa, no madera: frena el paso
 * (`isSolidForMovementAt` en scenes/raidScene.js) Y frena las balas
 * (systems/combat.js), y no se puede empujar desde afuera. Al vagón blindado
 * no se entra ni caminando ni a los tiros: la dinamita es la única llave.
 *
 * UNA PUERTA "NORMAL" SE PUEDE TRABAR (`trabada: true`) — es lo que hace el
 * Cazarrecompensas al despertar (ver `systems/boss.js`, `trabarPuertasDelTren`
 * en raidScene.js). Sigue siendo MADERA: la rompen las mismas balas de
 * siempre, con la misma vida (`CONFIG.doors.health`) — no hace falta
 * dinamita. Lo único que cambia es que empujarla deja de abrirla gratis: hay
 * que romperla, como a cualquier otra cosa que se interponga.
 */

import { CONFIG } from '../data/config.js';
import { estampar, piezaPuerta, piezaTranca } from '../world/piezas.js';
import { dibujarVida } from './figura.js';

export function createDoor(x, y, { kind = 'normal', insideDir = 1 } = {}) {
  return {
    x, y,
    hw: 8, hh: 16,       // tapa una columna, las dos filas del pasillo (32px)
    kind,                // 'normal' | 'blindada'
    insideDir,           // sólo importa para 'blindada': de qué lado es "adentro"
    open: false,
    broken: false,
    trabada: false,
    trabadaDeOrigen: false,   // ver `trabarPuerta`: venía así desde el sorteo
    health: CONFIG.doors.health,
    closeTimer: 0,
  };
}

export function updateDoor(d, dt, world) {
  if (d.broken) return;

  /**
   * Trabada: no la abre empujando ni vos ni un guardia común. Sólo se abre
   * rompiéndola (`dañarPuerta`) — ver `trabarPuertasDelTren` en raidScene.js.
   *
   * LA EXCEPCIÓN ES EL QUE LLEVA LA LLAVE (`tieneLlave`, hoy sólo el
   * Dinamitero del vagón de armas). No es un permiso de lujo: es el único
   * guardia con una ronda que CRUZA puertas, y sin esto una traba del sorteo
   * le partía la vuelta al medio. Medido antes de arreglarlo: con una puerta
   * trabada sobre su recorrido cubría 889 px de 1216 y pasaba 52% del tiempo
   * adentro del vagón de armas en vez de 36% — con dos, 70%. O sea que el
   * modificador lo encerraba justo donde la gracia del vagón es que salga.
   *
   * ABRIR NO ES DESTRABAR, y ahí está la decisión: la puerta se abre mientras
   * él la ocupa y se vuelve a cerrar con el `closeDelay` de siempre, todavía
   * trabada. Para vos sigue siendo un problema y la llave sigue siendo
   * romperla a tiros (ver `trabadaDeOrigen`) — pero si lo venías siguiendo,
   * te deja 1,6 s para colarte detrás suyo.
   */
  const laAbreAlguien = d.trabada ? ocupada(d, world, true) : ocupada(d, world);

  if (laAbreAlguien) {
    d.open = true;
    d.closeTimer = CONFIG.doors.closeDelay;
    return;
  }

  if (d.open) {
    d.closeTimer -= dt;
    if (d.closeTimer <= 0) d.open = false;
  }
}

/**
 * ¿Hay alguien empujándola AHORA MISMO? Para una puerta 'normal', cualquiera
 * de los dos lados la abre. Para la 'blindada', SÓLO cuenta alguien parado del
 * lado de ADENTRO — de afuera no hay forma de abrirla empujando.
 *
 * `soloConLlave` recorta eso a los que pueden abrir una TRABADA: el jugador
 * nunca cuenta ahí (para él la llave sigue siendo el plomo).
 */
function ocupada(d, world, soloConLlave = false) {
  /**
   * El de la llave la abre desde un poco más lejos, y no es un lujo: una
   * trabada FRENA EL PASO (`bloqueaPuertaCerrada`, scenes/raidScene.js), así
   * que el colisionador lo clava a ~25 px del centro de la hoja — bastante
   * antes de los 12,5 px del empujón normal. Medido: se quedaba oscilando en
   * x=1313 contra la puerta de 1288, sin alcanzarla nunca. Con el margen de
   * siempre, la llave sólo habría servido si además pudiera atravesarla, que
   * es exactamente lo que no puede hacer.
   *
   * 32 px son dos baldosas: estira la mano y la abre antes de chocarla.
   */
  const margenX = soloConLlave ? 32 : d.hw;
  const cerca = (e) =>
    e && e.alive !== false &&
    Math.abs(e.x - d.x) < margenX + (e.hw || 6) &&
    Math.abs(e.y - d.y) < d.hh + (e.hh || 6);

  const ladoDeAdentro = (e) => Math.sign(e.x - d.x || d.insideDir) === d.insideDir;
  const cuenta = (e) => d.kind !== 'blindada' || ladoDeAdentro(e);

  if (!soloConLlave && cerca(world.player) && cuenta(world.player)) return true;
  for (const e of world.enemies) {
    if (soloConLlave && !e.tieneLlave) continue;
    if (cerca(e) && cuenta(e)) return true;
  }
  return false;
}

/** ¿Tapa la vista ahora mismo? Sólo si está cerrada y entera. */
export function puertaTapaVision(d) {
  return !d.broken && !d.open;
}

/**
 * Una puerta común la atraviesa la bala, y de paso la castiga: encajar
 * suficientes la rompe. A la blindada no le llega ninguna — la bala muere
 * contra la chapa antes (systems/combat.js) — pero el corte por `kind` se
 * queda igual, como red de seguridad por si alguna vez la llaman de otro lado.
 */
export function dañarPuerta(d, amount) {
  if (d.broken || d.open || d.kind === 'blindada') return;
  d.health -= amount;
  if (d.health <= 0) {
    d.broken = true;
    d.open = true;
  }
}

/** La dinamita, desde afuera, es la única forma de abrir la blindada. */
export function volarPuerta(d) {
  d.broken = true;
  d.open = true;
}

/**
 * TRABAR / DESTRABAR EL TREN — lo que hace el Cazarrecompensas al despertar,
 * y lo que se deshace si lo matás. Sólo toca puertas de madera enteras: la
 * blindada ya tiene su propia llave (la dinamita) y no necesita ésta.
 */
export function trabarPuerta(d, deOrigen = false) {
  if (d.kind === 'blindada' || d.broken) return;
  d.trabada = true;
  /**
   * `deOrigen`: esta puerta ya viajaba trabada antes de que subieras — el
   * modificador `puertaBloqueada` (Fase 4, ver data/modifiers.js), no un jefe
   * cerrando el tren. La diferencia importa una sola vez, pero importa:
   * matar al Cazarrecompensas destraba lo que él trabó, y no tendría por qué
   * abrir una puerta que ya estaba así cuando llegó. Ver `destrabarPuerta`.
   */
  if (deOrigen) d.trabadaDeOrigen = true;
  // Se cierra de golpe, esté quien esté parado en el marco — es un cierre
  // de emergencia, no el vaivén de siempre. Si no, una puerta que justo
  // estaba abierta se quedaba abierta para siempre (`updateDoor` no la
  // vuelve a tocar mientras `trabada` sea true).
  d.open = false;
  d.closeTimer = 0;
}

export function destrabarPuerta(d) {
  // La que venía trabada de fábrica no la suelta nadie: sigue siendo un
  // problema tuyo, y la única llave sigue siendo romperla a tiros.
  if (d.trabadaDeOrigen) return;
  d.trabada = false;
}

export function drawDoor(r, d, colors) {
  if (d.broken) return; // rota: no queda nada que dibujar, es pasarela pelada

  /**
   * 🔁 DOS HOJAS DE VERDAD (etapa 3). Era un rectángulo de un color con una
   * raya al medio, y abierta era ese mismo rectángulo a medio borrar: en pleno
   * tiroteo no se distinguía de una cerrada. Ahora la madera tiene sus tablas y
   * su cruz, la blindada sus remaches y su volante, y ABIERTA las hojas se
   * pliegan contra las paredes — el paso se ve libre porque lo está.
   */
  const color = d.kind === 'blindada' ? '#626a74' : colors.wall;
  estampar(r, piezaPuerta(d.kind, color, d.open), d.x - d.hw, d.y - d.hh);

  /**
   * TRABADA: un tablón clavado en diagonal, en el rojo que usa el juego para
   * "esto ya no es gratis" (`enemyAlert`). Tiene que leerse de lejos y sin
   * ambigüedad: es la diferencia entre "la empujo y listo" y "la tengo que
   * romper a tiros", y confundir una con otra sale caro. Abierta no va: si se
   * abrió, la traba ya no está mandando.
   */
  if (d.trabada && !d.open) {
    estampar(r, piezaTranca(colors ? colors.enemyAlert : '#c86a52'), d.x - d.hw, d.y - d.hh);
  }

  // Las muescas de daño, las mismas que la vida de un guardia (figura.js).
  if (d.kind !== 'blindada' && d.health < CONFIG.doors.health) {
    dibujarVida(r, d.x, d.y - d.hh - 2, d.health, CONFIG.doors.health, { ancho: 14 });
  }
}
