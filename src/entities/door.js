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
import { estampar, piezaPuerta, piezaTranca, PUNTO } from '../world/piezas.js';
import { dibujarDanio, etapaDeDanio } from './danio.js';
import { PALETA, sombrear } from '../engine/paleta.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';

export function createDoor(x, y, { kind = 'normal', insideDir = 1 } = {}) {
  return {
    x, y,
    /**
     * 🔁 FINITA *(Santi: "una puerta no puede ser un cuadrado cuando la ves desde arriba")*: la hoja mide 6 de
     * grueso (`hw` 3), no la columna entera. Lo que choca, frena balas y tapa la vista es la hoja. Seis y no
     * menos: las balas avanzan de a 4 y la vista se mira cada 5, y con menos alguna la salteaba.
     * `alcance`: desde dónde se la empuja, el de siempre (media columna), aparte del grueso.
     */
    hw: 3, hh: 16, alcance: 8,
    // `abre`: cuánto está abierta, de 0 a 1, para que gire de a poco; `dir`: para qué lado (lejos del que empuja).
    abre: 0, dir: 1,
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

  // 🆕 La hoja gira de a poco (rápido al abrir, más despacio al volver), hacia el lado contrario del que empuja.
  if (laAbreAlguien && d.abre < 0.1) d.dir = laAbreAlguien.x < d.x ? 1 : -1;
  // (La blindada, lenta y pesada: es chapa.)
  const [rAbre, rCierra] = d.kind === 'blindada' ? [2.2, 1.4] : [7, 3];
  d.abre = d.open || laAbreAlguien ? Math.min(1, d.abre + dt * rAbre) : Math.max(0, d.abre - dt * rCierra);

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
  const margenX = soloConLlave ? 32 : (d.alcance ?? d.hw);
  const cerca = (e) =>
    e && e.alive !== false &&
    Math.abs(e.x - d.x) < margenX + (e.hw || 6) &&
    Math.abs(e.y - d.y) < d.hh + (e.hh || 6);

  const ladoDeAdentro = (e) => Math.sign(e.x - d.x || d.insideDir) === d.insideDir;
  // (🧪 `empujable`: el atajo [4] deja empujar la blindada desde afuera, para mirarla por dentro.)
  const cuenta = (e) => d.kind !== 'blindada' || d.empujable || ladoDeAdentro(e);

  // (🆕 Devuelve quién la empuja, para saber para qué lado gira la hoja.)
  if (!soloConLlave && cerca(world.player) && cuenta(world.player)) return world.player;
  for (const e of world.enemies) {
    if (soloConLlave && !e.tieneLlave) continue;
    if (cerca(e) && cuenta(e)) return e;
  }
  return null;
}

/**
 * 🆕 LAS HOJAS ABIERTAS CHOCAN *(Santi: "la puerta abierta debería tener colisión")*: cada hoja, a lo largo, como una
 * pared finita, por donde quedó girada (la de madera, dos de 12; la blindada, una de 24). Sólo la puerta del estilo
 * nuevo (`fina`) y abierta más de la mitad: cerrada o cerrándose, la que manda es la puerta de siempre. Medio grueso de
 * 0,25: abiertas quedan a 68 y a 92 de alto, y los dos carriles del pasillo (72 y 88, con medio cuerpo de 3,5) pasan a
 * 0,5 de ellas (con 0,5 de medio grueso el roce quedaba justo en el límite y trababa).
 */
export function hojaChoca(d, x, y) {
  if (!d.fina || d.broken || (d.abre || 0) < 0.5) return false;
  const chapa = d.kind === 'blindada', MARCO = chapa ? CONFIG.doors.marcoBlindado : 4, LARGO = d.hh - MARCO;
  const ang = ((d.abre || 0) * Math.PI) / 2, sx = Math.sin(ang) * (d.dir || 1), cy = Math.cos(ang);
  const hojas = chapa ? [[d.y - d.hh + MARCO, 1, 2 * LARGO]] : [[d.y - d.hh + MARCO, 1, LARGO], [d.y + d.hh - MARCO, -1, LARGO]];
  for (const [hy, dirY, largo] of hojas) {
    // Una banda a lo largo de la hoja (de la bisagra a la punta): 0,25 del lado del pasillo y 3 del lado de afuera de la
    // abertura (hacia el marco). Finita sola, el que camina (1,3 por cuadro) se la salteaba entre un cuadro y el otro.
    const ex = sx * largo, ey = cy * dirY * largo, px = x - d.x, py = y - hy;
    const t = (px * ex + py * ey) / (largo * largo);
    if (t < 0 || t > 1) continue;
    let nx = -ey / largo, ny = ex / largo;
    if (ny * dirY > 0 || (ny === 0 && nx * dirY > 0)) { nx = -nx; ny = -ny; }
    const lado = (px - ex * t) * nx + (py - ey * t) * ny;
    if (lado > -0.25 && lado < 3) return true;
  }
  return false;
}

/**
 * 🆕 ¿UNA BALA EN ESTE PUNTO LE PEGA A UNA HOJA ABIERTA? *(Santi: "los tiros que le pegues a la puerta abierta deberían
 * contar dentro de las tres vidas")*: a menos de 2 de la hoja, de cualquier lado (las balas avanzan de a 4). Sólo
 * abierta más de un tercio: cerrada, le pega la puerta de siempre.
 */
export function hojaGolpeada(d, x, y) {
  if (!d.fina || d.broken || (d.abre || 0) < 0.33) return false;
  const chapa = d.kind === 'blindada', MARCO = chapa ? CONFIG.doors.marcoBlindado : 4, LARGO = d.hh - MARCO;
  const ang = ((d.abre || 0) * Math.PI) / 2, sx = Math.sin(ang) * (d.dir || 1), cy = Math.cos(ang);
  const hojas = chapa ? [[d.y - d.hh + MARCO, 1, 2 * LARGO]] : [[d.y - d.hh + MARCO, 1, LARGO], [d.y + d.hh - MARCO, -1, LARGO]];
  for (const [hy, dirY, largo] of hojas) {
    const ex = sx * largo, ey = cy * dirY * largo, px = x - d.x, py = y - hy;
    const t = Math.max(0, Math.min(1, (px * ex + py * ey) / (largo * largo)));
    if (Math.hypot(px - ex * t, py - ey * t) < 2) return true;
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
  // (🆕 La del estilo nuevo, también abierta: el balazo en la hoja abierta cuenta *(Santi)*. Ver `hojaGolpeada`.)
  if (d.broken || (d.open && !d.fina) || d.kind === 'blindada') return;
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

/**
 * 🆕 LA PUERTA DEL ESTILO NUEVO, FINITA *(Santi: "quiero que las puertas se vean más finitas, una puerta no puede ser
 * un cuadrado cuando la ves desde arriba")*: desde arriba, la pared del fondo del vagón se ve de canto, y la puerta
 * también: dos hojas finitas, con la bisagra en las puntas de la abertura, que al empujarlas GIRAN hacia el lado
 * contrario del que empuja y vuelven solas (como la puertita vaivén de la barra, world/porton.js). Cerrada se ve el
 * canto de arriba y el frente de la hoja de adelante; abriéndose, la cara.
 *  - DE MADERA: las tablas y el travesaño. DE CHAPA (la blindada): más gruesa, gris, con remaches.
 *  - TRABADA: el tablón rojo cruzado. CON DAÑO: los agujeros en el canto. ROTA: una hoja colgando de la bisagra de
 *    arriba y astillas en el piso.
 * Con los colores de la paleta y la luz del lugar.
 */
/**
 * 🆕 LAS DOS PARTES DE LA PUERTA, CADA UNA CON SU `base` *(Santi: "es como si la puerta fuera humo y el personaje queda
 * con la silueta… la puerta abierta debería ser como cualquier objeto con colisión")*: la de ATRÁS (el marco de atrás y
 * la hoja que cuelga de él; la blindada, su única hoja) y la de ADELANTE (la otra hoja y el marco de adelante). Se
 * mezclan con la gente cada una por donde está: con una sola, en el pie de la abertura, la hoja de atrás quedaba
 * dibujada delante del que pasaba por delante de ella. La hoja de atrás, por su punta más cercana a la pantalla; la
 * arrancada de la blindada, tirada en el piso, debajo de todos.
 */
export function partesDePuerta(d) {
  const chapa = d.kind === 'blindada', MARCO = chapa ? CONFIG.doors.marcoBlindado : 4, LARGO = d.hh - MARCO;
  const y0 = d.y - d.hh, y1 = d.y + d.hh, a = d.broken ? 0.5 : ((d.abre || 0) * Math.PI) / 2;
  const largo = chapa ? 2 * LARGO : LARGO * (d.broken ? 0.8 : 1);
  const atras = d.broken && chapa ? y0 : Math.min(y0 + MARCO + Math.cos(a) * largo, y1 - 0.02);
  return [{ parte: 'atras', base: atras }, { parte: 'adelante', base: y1 }];
}

/**
 * 🆕 LA PUERTA DEL ESTILO NUEVO, FINITA *(Santi: "quiero que las puertas se vean más finitas, una puerta no puede ser
 * un cuadrado cuando la ves desde arriba")*: desde arriba, la pared del fondo del vagón se ve de canto, y la puerta
 * también: dos hojas finitas, con la bisagra en las puntas de la abertura, que al empujarlas GIRAN hacia el lado
 * contrario del que empuja y vuelven solas (como la puertita vaivén de la barra, world/porton.js).
 *  - DE MADERA: las tablas y los travesaños. DE CHAPA (la blindada): más gruesa, gris, con remaches.
 *  - TRABADA: el tablón rojo cruzado. ROTA: una hoja colgando de la bisagra de arriba y astillas en el piso.
 *  - 🆕 EL DAÑO, TAMBIÉN ABIERTA *(Santi: "los tiros que le pegues a la puerta abierta deberían contar dentro de las
 *    tres vidas… y tener tres estados reflejados en dibujos al estar la puerta abierta")*: intacta, dañada (agujeros
 *    en la cara de las hojas) y muy dañada (más agujeros y una rajadura); después, rota.
 * 🔁 SE DIBUJA EN SU LIENZO Y DESPUÉS SE ESTAMPA, como los muebles: así le tapa a la gente que queda detrás su borde
 * finito (`taparGente`). Pintada directo, el borde se veía a través de la hoja: "la silueta".
 * `parte`: 'atras', 'adelante' o 'todo' (ver `partesDePuerta`). Con los colores de la paleta y la luz del lugar.
 */
let lienzoPuerta = null;
function dibujarPuertaNueva(r, d, colors, parte = 'todo') {
  const PASO = CONFIG.estilo.punto / 4;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(d.x, d.y) || 0) : 0;
  const chapa = d.kind === 'blindada';
  // (🔁 Del alto de una persona *(Santi: "debería verse más alta")*: `altoPuerta`, data/config.js.)
  const ALTO = CONFIG.tresCuartos.altoPuerta + (chapa ? 2 : 0), GRUESO = chapa ? 5 : 3;
  const C = chapa ? { canto: 25, cara: 24, osc: 23, marca: 30 } : { canto: 6, cara: 5, osc: 3, marca: 4 };
  const y0 = d.y - d.hh, y1 = d.y + d.hh, alto = ALTO * PASO, x0 = d.x - (GRUESO * PASO) / 2;
  const abre = d.broken ? 0 : d.abre || 0;
  // El lienzo: la abertura entera, con lugar para las hojas abiertas a los dos lados y lo alto de la puerta.
  const ox = Math.round((d.x - 32) / PASO), oy = Math.round((y0 - alto - 8) / PASO);
  const CW = Math.ceil(64 / PASO), CH = Math.ceil((y1 - y0 + alto + 16) / PASO);
  if (!lienzoPuerta) lienzoPuerta = document.createElement('canvas');
  const cv = lienzoPuerta;
  if (cv.width !== CW || cv.height !== CH) { cv.width = CW; cv.height = CH; }
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, CW, CH);
  const punto = (x, y, w, h, i) => {
    ctx.fillStyle = PALETA[i === 0 ? 0 : sombrear(i, luz)];
    ctx.fillRect(Math.round(x / PASO) - ox, Math.round(y / PASO) - oy, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  const atras = parte !== 'adelante', adelante = parte !== 'atras';
  /**
   * 🔁 HOJAS MÁS ANGOSTAS, CON MARCO *(Santi eligió la B, a "las puertas no deberían ser más cortas al abrirse?")*:
   * cada hoja mide `MARCO` menos que media abertura, y en las dos puntas de la abertura va el marco, un poste del
   * alto de la puerta y un poco más grueso que la hoja.
   * 🔁 LA BLINDADA, UNA SOLA HOJA *(Santi)*, de 24 y más gruesa, con el marco de chapa de 4 a cada lado, que choca (ver
   * `marcoBlindado`, scenes/raidScene.js). Se abre lenta (sólo desde adentro). Volada con dinamita, queda ARRANCADA:
   * tirada en el piso, adentro, y el marco chamuscado.
   */
  const MARCO = chapa ? CONFIG.doors.marcoBlindado : 4, LARGO = d.hh - MARCO, h0 = y0 + MARCO, h1 = y1 - MARCO;
  const marco = (ya) => {
    // De arriba: el canto del poste, de ya a ya + MARCO; de frente, su cara.
    const G2 = GRUESO + 2, xm = d.x - (G2 * PASO) / 2;
    punto(xm - PASO, ya - alto - PASO, G2 + 2, (MARCO + 2 * PASO) / PASO, 0);
    punto(xm, ya - alto, G2, MARCO / PASO, chapa ? 24 : 4);
    punto(xm, ya - alto, G2, 1, chapa ? 25 : 5);
    punto(xm - PASO, ya + MARCO - alto, G2 + 2, ALTO + 1, 0);
    punto(xm, ya + MARCO - alto, G2, ALTO, chapa ? 23 : 3);
    punto(xm, ya + MARCO - alto, 1, ALTO, chapa ? 24 : 4);
    if (chapa) for (let q = 3; q < ALTO - 1; q += 5) punto(xm + PASO, ya + MARCO - alto + q * PASO, 1, 1, 30);   // los remaches
  };
  if (atras) marco(y0);
  const todas = chapa
    ? (d.broken ? [] : [{ hy: h0, ang: (abre * Math.PI) / 2, dirY: 1, largo: 2 * LARGO, unica: true }])
    : d.broken
      ? [{ hy: h0, ang: 0.5, dirY: 1, largo: LARGO * 0.8 }]
      : [{ hy: h0, ang: (abre * Math.PI) / 2, dirY: 1, largo: LARGO }, { hy: h1, ang: (abre * Math.PI) / 2, dirY: -1, largo: LARGO }];
  const hojas = todas.filter((h) => (h.dirY > 0 ? atras : adelante));
  // El daño de la madera: 0 intacta, 1 dañada, 2 muy dañada (ver entities/danio.js).
  const etapa = chapa || d.broken ? 0 : etapaDeDanio(d.health, CONFIG.doors.health);
  const AGUJEROS = [[0.35, 0.4], [0.7, 0.25], [0.55, 0.7], [0.2, 0.75]];
  // Primero el contorno, después la hoja.
  for (const pasada of [0, 1]) for (const h of hojas) {
    const dx = Math.sin(h.ang) * (d.dir || 1), dy = Math.cos(h.ang) * h.dirY;
    // 🔁 La cara siempre, del ancho que tenga: se achica de a poco al cerrarse. Con un umbral, a cierto ángulo
    // desaparecía de golpe y quedaba el canto: el "corte" al cerrarse *(Santi)*. Los detalles de la cara (travesaños,
    // remaches, picaporte, agujeros), sólo cuando se la ve de frente: de canto se amontonaban en diagonal.
    const frente = Math.abs(dx) > 0.35, n = Math.max(1, Math.round(h.largo / PASO));
    let k = 0;
    for (let s = 0; s <= h.largo; s += PASO, k++) {
      const x = x0 + dx * s, y = h.hy + dy * s;
      if (pasada === 0) { punto(x - PASO, y - alto - PASO, GRUESO + 2, ALTO + 2, 0); continue; }
      punto(x, y - alto, GRUESO, 1, s < PASO ? C.canto : C.cara);                       // el canto de arriba
      punto(x, y - alto + PASO, 1, ALTO - 1, C.cara);                                  // la cara
      if (!frente) continue;
      for (const t of [0.33, 0.66]) punto(x, y - alto + PASO * Math.floor(ALTO * t), 1, 1, C.osc);   // los travesaños (o las juntas)
      if (chapa && k % 3 === 1) { punto(x, y - alto + PASO * 2, 1, 1, C.marca); punto(x, y - PASO * 2, 1, 1, C.marca); }   // los remaches
      if (!chapa && k === n - 2) punto(x, y - alto + PASO * Math.floor(ALTO * 0.5), 1, 2, 7);   // el picaporte
      // Los balazos: agujeros (y en la muy dañada, una rajadura de arriba abajo).
      for (let q = 0; q < (etapa === 1 ? 1 : etapa === 2 ? AGUJEROS.length : 0); q++) {
        const [fs_, fa] = AGUJEROS[q];
        if (k === Math.round(fs_ * n)) { punto(x, y - alto + PASO * Math.floor(ALTO * fa), 1, 2, 0); punto(x, y - alto + PASO * (Math.floor(ALTO * fa) - 1), 1, 1, 6); }
      }
      if (etapa === 2 && k === Math.round(0.45 * n)) punto(x, y - alto + PASO * 3, 1, ALTO - 7, C.osc);
    }
    if (pasada === 1) {
      punto(x0 - PASO, h.hy - alto, 1, 2, chapa ? 25 : 7);                             // la bisagra
      // Abierta, el volante en el medio de la cara.
      if (frente && h.unica) {
        const vx = x0 + dx * h.largo * 0.55, vy = h.hy + dy * h.largo * 0.55 - alto + PASO * Math.floor(ALTO / 2 - 2);
        punto(vx - PASO * 2, vy, 5, 5, 0); punto(vx - PASO, vy + PASO, 3, 3, 25); punto(vx, vy + PASO * 2, 1, 1, 23);
      }
    }
  }
  // El marco de adelante, delante de la hoja de adelante.
  if (adelante) marco(h1);
  if (atras && d.broken && chapa) {
    // La hoja arrancada, tirada en el piso adentro del vagón, un poco torcida: de arriba se le ve la cara, con los
    // remaches y el volante. Y el marco, chamuscado.
    const lado = d.insideDir || 1, ANCHO = 17, L0 = y0 + MARCO + 2, L1 = y1 - MARCO - 2;
    for (const pas of [0, 1]) for (let y = L0; y <= L1; y += PASO) {
      const t = (y - L0) / (L1 - L0), xa = d.x + lado * (3 + t * 4) * PASO * 1.2;
      const xs = lado > 0 ? xa : xa - ANCHO * PASO;
      if (pas === 0) { punto(xs - PASO, y - PASO, ANCHO + 2, 3, 0); continue; }
      punto(xs, y, ANCHO, 1, y < L0 + PASO ? 25 : 24);
      if (Math.round((y - L0) / PASO) % 4 === 2) for (let q = 2; q < ANCHO - 1; q += 4) punto(xs + q * PASO, y, 1, 1, 30);   // los remaches
    }
    const cy = (L0 + L1) / 2, cx = d.x + lado * (5 * PASO * 1.2 + (ANCHO * PASO) / 2);
    punto(cx - PASO * 2, cy - PASO * 2, 5, 5, 0); punto(cx - PASO, cy - PASO, 3, 3, 25); punto(cx, cy, 1, 1, 23);   // el volante
    for (const [ax, ay] of [[-2, -6], [2, -4], [-3, 1], [1, 3], [-1, 8], [3, 10]]) punto(d.x + ax * PASO, y0 + ay * PASO * 2 - alto * 0.5, 2, 1, 0);   // lo chamuscado
  } else if (atras && d.broken) {
    for (const [ax, ay] of [[2, -1], [-3, -2], [4, 3], [-1, 5]]) punto(d.x + ax * PASO, y1 - PASO * (2 + ay), 2, 1, chapa ? 23 : 4);   // astillas
  } else if (atras) {
    // Cerrada y con daño: también los agujeros en el canto.
    if (!chapa && abre < 0.2) {
      const lugares = [0.3, 0.7, 0.15, 0.55, 0.85, 0.45];
      for (let q = 0; q < Math.min(lugares.length, etapa * 2); q++) punto(x0, h0 + lugares[q] * 2 * LARGO - alto, GRUESO, 1, 0);
    }
    /**
     * 🏪 LA DEL ALMACÉN: LA BARRA DE FIERRO, PUESTA *(Santi eligió "las puertas con la barra de fierro puesta: viaja
     * cerrado")*. Atraviesa la abertura de punta a punta, apoyada en dos horquillas clavadas en los marcos, con el
     * candado colgando en el medio. Se rompe igual que la otra, a tiros.
     */
    if (d.trabada && d.barra && abre < 0.2) {
      for (const hy of [y0 + MARCO * 0.5, y1 - MARCO * 0.5]) { punto(d.x - PASO * 4, hy - alto * 0.55 - PASO * 2, 9, 5, 0); punto(d.x - PASO * 3, hy - alto * 0.55 - PASO, 7, 3, 23); }
      punto(d.x - PASO * 3, y0 + MARCO * 0.5 - alto * 0.55, 7, (y1 - y0 - MARCO) / PASO, 0);
      punto(d.x - PASO * 2, y0 + MARCO * 0.5 - alto * 0.55, 5, (y1 - y0 - MARCO) / PASO, 24);
      punto(d.x - PASO * 2, y0 + MARCO * 0.5 - alto * 0.55, 1, (y1 - y0 - MARCO) / PASO, 25);
      punto(d.x + PASO * 2, y0 + MARCO * 0.5 - alto * 0.55, 1, (y1 - y0 - MARCO) / PASO, 31);
      const cy = (y0 + y1) / 2 - alto * 0.55;
      punto(d.x - PASO * 3, cy - PASO, 7, 8, 0); punto(d.x - PASO * 2, cy, 5, 6, 7); punto(d.x - PASO * 2, cy, 5, 1, 28); punto(d.x, cy + PASO * 2, 1, 2, 0);
    } else if (d.trabada && abre < 0.2) {
      const ty = d.y - alto * 0.5;
      punto(d.x - PASO * 6, ty - PASO, 13, 4, 0);
      punto(d.x - PASO * 5, ty, 11, 2, 9);
      punto(d.x - PASO * 5, ty, 11, 1, 10);
    }
  }
  // Se estampa, y le tapa el borde finito a la gente que queda detrás (como los muebles).
  const wx = ox * PASO, wy = oy * PASO, ww = CW * PASO, wh = CH * PASO;
  r.ctx.drawImage(cv, wx, wy, ww, wh);
  estiloNuevo.taparGente(r.ctx, cv, wx, wy, ww, wh);
}

export function drawDoor(r, d, colors, parte) {
  // 🆕 En el estilo nuevo, la puerta finita (ver arriba); rota también se dibuja (la hoja colgando). (Sólo en los vagones
  // nuevos: `fina`, world/train.js.)
  if (estiloNuevo.activo && d.fina) { dibujarPuertaNueva(r, d, colors, parte); return; }
  if (d.broken) return; // rota: no queda nada que dibujar, es pasarela pelada
  // (El dibujo viejo sigue de una columna: `hw` ahora es el grueso de la hoja.)
  const ANCHO = 8;

  /**
   * 🔁 DOS HOJAS DE VERDAD (etapa 3). Era un rectángulo de un color con una
   * raya al medio, y abierta era ese mismo rectángulo a medio borrar: en pleno
   * tiroteo no se distinguía de una cerrada. Ahora la madera tiene sus tablas y
   * su cruz, la blindada sus remaches y su volante, y ABIERTA las hojas se
   * pliegan contra las paredes — el paso se ve libre porque lo está.
   */
  const color = d.kind === 'blindada' ? '#626a74' : colors.wall;
  const img = piezaPuerta(d.kind, color, d.open);
  estampar(r, img, d.x - ANCHO, d.y - d.hh);

  /**
   * TRABADA: un tablón clavado en diagonal, en el rojo que usa el juego para
   * "esto ya no es gratis" (`enemyAlert`). Tiene que leerse de lejos y sin
   * ambigüedad: es la diferencia entre "la empujo y listo" y "la tengo que
   * romper a tiros", y confundir una con otra sale caro. Abierta no va: si se
   * abrió, la traba ya no está mandando.
   */
  if (d.trabada && !d.open) {
    estampar(r, piezaTranca(colors ? colors.enemyAlert : '#c86a52'), d.x - ANCHO, d.y - d.hh);
  }

  /**
   * 🪵 EL DAÑO EN LA MADERA, NO EN UNA BARRITA *(Santi: "textura: intacta,
   * dañada, muy dañada, rota")*: agujeros, rajaduras y astillas (ver
   * entities/danio.js). Abierta no: las hojas plegadas contra la pared ya no
   * son lo que hay que romper.
   */
  if (d.kind !== 'blindada' && !d.open) {
    dibujarDanio(r, d, d.x - ANCHO, d.y - d.hh, img.width * PUNTO, img.height * PUNTO,
      etapaDeDanio(d.health, CONFIG.doors.health));
  }
}
