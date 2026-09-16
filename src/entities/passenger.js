/**
 * Pasajeros.
 *
 * No pelean, pero son el motivo por el que no se puede cruzar el vagón
 * caminando tranquilo: si te ven de cerca, gritan, y el grito trae guardias.
 *
 * También son la semilla del sistema moral. Podés matarlos para que se callen,
 * y más adelante eso va a subir tu recompensa y bajar tu honor. Por ahora el
 * juego solo los cuenta.
 */

import { CONFIG } from '../data/config.js';
import { dibujarPersona, dibujarTendido, dibujarAviso, faseDeAndar } from './figura.js';
import { moveAndCollide, distance, hasLineOfSight, angleDifference } from '../engine/collision.js';
import { isHidden } from './player.js';
import {
  ENCUBIERTO_RADIO, ENCUBIERTO_COSENO, ENCUBIERTO_ESPERA, ENCUBIERTO_DURACION,
} from '../data/modifiers.js';

export function createPassenger(x, y, facing = Math.PI) {
  const c = CONFIG.passenger;
  return {
    x, y,
    hw: c.hw, hh: c.hh,
    alive: true,
    // idle | amenazado | panic | fleeing | cowering
    state: 'idle',
    panicTimer: 0,
    fleeToX: x,
    facing,
    hitFlash: 0,
    shakeTimer: 0,

    // Amenazar: cuánto llevás apretando E, y si ya le sacaste la plata.
    robProgress: 0,
    robado: false,
    yaGrito: false,

    /**
     * CIVIL ENCUBIERTO (Fase 4, ver data/modifiers.js). Hasta que se revela es
     * un pasajero igual a todos: se lo puede rodear, asustar y robar, y no hay
     * nada en pantalla que lo distinga — ésa es toda la idea.
     *
     * `espaldaTimer` cuenta cuánto lleva SEGUIDO con tu espalda de frente
     * (se corta apenas te das vuelta); `revelando`/`revelaProgreso` son el
     * aviso: el segundo largo en que saca el arma y se le ve venir.
     */
    encubierto: false,
    espaldaTimer: 0,
    revelando: false,
    revelaProgreso: 0,

    /**
     * LOS PAQUETES (Fase 5, ver data/paquetes.js). Un pasajero común no tiene
     * nada de esto puesto y se comporta exactamente igual que siempre.
     *
     * `botin` (min/max) y `robTime` los pone el pasajero RICO: afloja mucho
     * más, pero hay que quedarse quieto más tiempo para sacárselo.
     *
     * `sabeDeCaja` es la caja fuerte oculta DEL TREN — puede estar en
     * cualquier vagón, no necesariamente en éste. Cuando terminás de robarle,
     * además de la plata te suelta la pista (`pistaCaja`: en qué vagón y
     * debajo de qué). La caja NO se marca en pantalla: la información es todo
     * lo que te llevás, y encontrarla es tu problema.
     */
    botin: null,
    robTime: null,
    sabeDeCaja: null,
    pistaCaja: null,
  };
}

/**
 * EL CIVIL ENCUBIERTO — ¿le estás dando la espalda lo suficiente como para
 * que se anime?
 *
 * Devuelve `true` cuando este pasajero ya no tiene que seguir comportándose
 * como pasajero (está sacando el arma): ahí `updatePassenger` corta.
 *
 * TRES CONDICIONES, Y LAS TRES A LA VEZ:
 *  1. Cerca (`ENCUBIERTO_RADIO`) y con línea de visión — no te dispara desde
 *     la otra punta del vagón ni a través de un asiento.
 *  2. Le estás dando la espalda de verdad (`ENCUBIERTO_COSENO`, medido contra
 *     tu MIRA). Encañonado no se anima a nada, igual que el rendido.
 *  3. Sostenido `ENCUBIERTO_ESPERA` segundos. Darte vuelta un instante corta
 *     el reloj y lo devuelve a cero.
 *
 * 🐛 AL PRINCIPIO SÓLO SE ANIMABA ESTANDO `idle` O `amenazado`, Y ASÍ NO SE
 * ACTIVABA CASI NUNCA. Medido: para que te dé la espalda tenés que estar
 * cerca, y estando cerca te ve — y si te ve, entra en pánico como cualquier
 * pasajero, o sea que quedaba inhabilitado justo en el único momento en que
 * podía servir. La condición se contradecía sola.
 *
 * Y LA CORRECCIÓN NO ES UN PARCHE, ES LO QUE EL PERSONAJE ES: un agente
 * encubierto FINGE. El pánico, el grito y el temblor son su disfraz, no su
 * estado de ánimo — por eso puede estar "muerto de miedo" y sacar el arma en
 * cuanto te das vuelta. Lo único que lo frena es que lo tengas encañonado
 * robándole (`robProgress`), y ahí no lo frena el miedo: lo frena que le
 * estás apuntando.
 */
function actualizarEncubierto(pa, dt, world) {
  const p = world.player;

  // Ya empezó a sacar el arma: no hay vuelta atrás. Lo único que lo corta es
  // que le pegues antes de que termine — igual que la traición del rendido.
  if (pa.revelando) {
    pa.revelaProgreso += dt;
    pa.facing = Math.atan2(p.y - pa.y, p.x - pa.x);
    pa.shakeTimer = 0;
    if (pa.revelaProgreso >= ENCUBIERTO_DURACION) {
      // La escena lo saca de la lista de pasajeros y lo mete como guardia:
      // de acá en adelante pelea con la IA de combate de siempre.
      world.bus.emit('civilRevelado', { pasajero: pa });
    }
    return true;
  }

  if (!p.alive || pa.robProgress > 0) { pa.espaldaTimer = 0; return false; }

  if (distance(pa.x, pa.y, p.x, p.y) > ENCUBIERTO_RADIO ||
      !hasLineOfSight(pa.x, pa.y, p.x, p.y, world.map.blocksSightAt)) {
    pa.espaldaTimer = 0;
    return false;
  }

  // El coseno entre hacia dónde APUNTÁS y dónde está él. −1 = está justo a
  // tus espaldas; +1 = lo tenés en la mira.
  const hacia = Math.atan2(pa.y - p.y, pa.x - p.x);
  if (Math.cos(hacia - p.aim) > ENCUBIERTO_COSENO) { pa.espaldaTimer = 0; return false; }

  pa.espaldaTimer += dt;
  if (pa.espaldaTimer >= ENCUBIERTO_ESPERA) {
    pa.revelando = true;
    pa.revelaProgreso = 0;
    // El martillo del revólver: el aviso llega por el oído antes que por el
    // ojo, que es lo único justo cuando el peligro está a tus espaldas.
    world.audio.play('cock');
    return true;
  }
  return false;
}

/** Lo llama la escena cuando pasa algo que asusta (un disparo cerca). */
export function panic(pa) {
  if (!pa.alive) return;
  // Al que ya asaltaste también lo puede sobresaltar un tiro: deja de estar
  // paralizado y arranca a gritar antes de tiempo.
  if (pa.state !== 'idle' && pa.state !== 'amenazado') return;
  pa.state = 'panic';
  pa.panicTimer = CONFIG.passenger.panicDelay;
}

/**
 * Le sacaste la plata. Queda temblando donde está, y en unos segundos va a
 * gritar: ese es el precio de haberlo asaltado en vez de esquivarlo.
 */
export function amenazado(pa) {
  pa.robado = true;
  pa.robProgress = 0;

  // Al que YA gritó no se le da cuenta regresiva: el escándalo ya lo hizo, y
  // una segunda alarma por el mismo tipo no significa nada. Sigue con lo suyo,
  // ahora sin plata.
  if (pa.yaGrito) return;

  pa.state = 'amenazado';
  pa.panicTimer = CONFIG.passenger.robPanicDelay;
}

/**
 * ¿A este se le puede sacar plata?
 *
 * A CUALQUIERA QUE ESTÉ VIVO Y NO LE HAYAS SACADO NADA, esté como esté. También
 * al que ya gritó y salió corriendo: le ponés el revólver encima y afloja igual.
 *
 * Antes sólo valía para los tranquilos, y eso tenía una consecuencia fea que no
 * se veía venir: si la alarma sonaba temprano, TODOS los pasajeros huían y su
 * plata se perdía para siempre, sin que hubiera nada que pudieras hacer. Eso no
 * es un costo, es mala suerte. Ahora perseguirlos cuesta tiempo — que con 145
 * segundos es la moneda cara — y eso sí es una decisión.
 */
export function sePuedeAmenazar(pa) {
  return pa.alive && !pa.robado && pa.state !== 'amenazado';
}

export function updatePassenger(pa, dt, world) {
  pa.hitFlash = Math.max(0, pa.hitFlash - dt);
  if (!pa.alive) return;

  const c = CONFIG.passenger;
  const player = world.player;

  /**
   * ¿ES UNO DE LOS QUE NO ERAN PASAJEROS? Se pregunta ANTES que todo lo
   * demás: mientras saca el arma ya no le corresponde ninguna de las
   * conductas de abajo (ni el pánico, ni huir, ni quedarse quieto porque lo
   * encañonás).
   */
  if (pa.encubierto && actualizarEncubierto(pa, dt, world)) return;

  /**
   * MIENTRAS LE ESTÁS APUNTANDO NO SE MUEVE, esté haciendo lo que esté haciendo.
   *
   * Vale también para el que venía corriendo y para el acurrucado en el rincón:
   * frenan en seco. Sin esto no se podría asaltar a nadie que ya haya gritado,
   * porque huyen y el forcejeo nunca llegaría a completarse.
   *
   * Se activa sólo si estás manteniendo [E] (robProgress > 0), no por pasar al
   * lado: cruzar un vagón corriendo no tiene por qué congelar a la gente.
   */
  if (pa.robProgress > 0) {
    pa.facing = Math.atan2(player.y - pa.y, player.x - pa.x);
    pa.shakeTimer += dt * 2;
    return;
  }

  if (pa.state === 'idle') {
    /**
     * ENCAÑONADO: lo tenés a distancia de tocarlo, así que se queda quieto.
     *
     * Sin esta regla, amenazar era imposible y no por balance sino por
     * geometría: acercarte lo suficiente para robarle lo hacía entrar en pánico
     * en 0,35 s, y sacarle la plata lleva 1,4. Nunca llegabas.
     *
     * Y además es lo que uno esperaría: nadie se pone a los gritos con un
     * revólver en la cara. Grita cuando te alejás, que es justo lo que hace
     * interesante amenazar — el escándalo no se evita, se posterga.
     */
    const encanonado = player.alive &&
      distance(pa.x, pa.y, player.x, player.y) <= CONFIG.loot.radius;
    if (encanonado) {
      pa.facing = Math.atan2(player.y - pa.y, player.x - pa.x);
      return;
    }

    const seesPlayer = player.alive && !isHidden(player) && noticesPlayer(pa, player, world, c);

    // Un cadáver al lado también los descompone.
    if (seesPlayer || seesBody(pa, world, c)) panic(pa);
    return;
  }

  /**
   * Amenazado: le sacaste la plata y se quedó helado con las manos arriba.
   * No grita todavía — pero el reloj corre. Es tu ventana para irte, para
   * seguir robando o para callarlo.
   */
  if (pa.state === 'amenazado') {
    pa.panicTimer -= dt;
    pa.shakeTimer += dt * 1.6;
    if (pa.panicTimer <= 0) {
      pa.state = 'panic';
      pa.panicTimer = c.panicDelay;
    }
    return;
  }

  if (pa.state === 'panic') {
    pa.panicTimer -= dt;
    pa.shakeTimer += dt;
    if (pa.panicTimer <= 0) {
      // Grita: los guardias que lo oigan van para allá.
      pa.yaGrito = true;
      world.audio.play('scream');
      world.bus.emit('scream', { x: pa.x, y: pa.y, radius: c.shoutRadius });

      // Corre hacia el extremo más cercano del vagón.
      //
      // 🔻 El de adelante ya no es el borde del mapa: desde la etapa 2 de los
      // trenes nuevos el mapa termina en la LOCOMOTORA, que es sólida, y
      // `map.width - 24` caía adentro de ella — el que huía se quedaba
      // empujando una pared. Ahora corre a la punta por donde entra la gente de
      // la locomotora, que es exactamente donde caía antes (el último enganche).
      const puntaAdelante = world.train && world.train.puntaLocomotora
        ? world.train.puntaLocomotora.x
        : world.map.width - 24;
      pa.fleeToX = pa.x < world.map.width / 2 ? 24 : puntaAdelante;
      pa.state = 'fleeing';
    }
    return;
  }

  if (pa.state === 'fleeing') {
    const dx = Math.sign(pa.fleeToX - pa.x);
    pa.facing = dx > 0 ? 0 : Math.PI;
    const freno = world.map.frenoAt ? world.map.frenoAt(pa.x, pa.y) : 1;
    moveAndCollide(pa, dx * c.speed * freno * dt, 0, world.map.isSolidForMovementAt || world.map.isSolidAt);
    if (Math.abs(pa.x - pa.fleeToX) < 6) pa.state = 'cowering';
  }
}

/**
 * Los pasajeros solo miran para adelante. Se los puede rodear por atrás,
 * y esa es la diferencia entre cruzar el vagón en silencio o no.
 */
function noticesPlayer(pa, player, world, c) {
  const dist = distance(pa.x, pa.y, player.x, player.y);
  if (dist > c.noticeRadius) return false;

  if (dist > c.noticeBehind) {
    const angleTo = Math.atan2(player.y - pa.y, player.x - pa.x);
    if (Math.abs(angleDifference(pa.facing, angleTo)) > c.noticeAngle) return false;
  }

  return hasLineOfSight(pa.x, pa.y, player.x, player.y, world.map.blocksSightAt);
}

function seesBody(pa, world, c) {
  const check = (entity) =>
    !entity.alive &&
    entity !== pa &&
    distance(pa.x, pa.y, entity.x, entity.y) < c.noticeRadius * 0.85 &&
    hasLineOfSight(pa.x, pa.y, entity.x, entity.y, world.map.blocksSightAt);

  return world.enemies.some(check) || world.passengers.some(check);
}

export function drawPassenger(r, pa) {
  const col = CONFIG.colors;
  /**
   * EN SOMBRA CABEZONA (ver entities/figura.js y data/siluetas.js), con los
   * pies en el borde de abajo de su caja (`pa.hh`), que no cambió.
   *
   * EL PASAJERO: bombín con flor y bufanda verde. EL RICO (Fase 5, ver
   * data/paquetes.js): galera con cinta morada, monóculo y cadena de oro. *(Santi
   * eligió que "se note de lejos")*: es la silueta más alta de todo el tren a
   * propósito, asoma por encima de los respaldos.
   */
  const pies = pa.y + pa.hh;
  const tipo = pa.botin ? 'rico' : 'pasajero';

  if (!pa.alive) {
    dibujarTendido(r, pa.x, pa.y, { tipo, sangre: true, cinta: pa.botin ? '#a050c0' : '#3fa870' });
    return;
  }

  const fase = faseDeAndar(pa);

  r.ctx.globalAlpha = 0.25;
  r.box(pa.x, pies, 4, 2, '#000');
  r.ctx.globalAlpha = 1;

  // Tiembla mientras entra en pánico, y más fuerte si lo acabás de asaltar.
  const tiembla = pa.state === 'panic' || pa.state === 'amenazado';
  const shake = tiembla ? Math.sin(pa.shakeTimer * 40) * 1 : 0;
  /**
   * SACANDO EL ARMA (el civil encubierto, ver `actualizarEncubierto`).
   *
   * El aviso está construido igual que el del rendido que te traiciona, y a
   * propósito: es el mismo momento del juego —alguien que parecía inofensivo
   * dejando de serlo— así que tiene que leerse igual. Pasado el punto medio,
   * se le ponen los ojos rojos y le salta el "!". Antes de eso sólo se ve el
   * arma saliendo del saco, que es la mitad temprana del aviso — la que premia
   * estar atento.
   */
  const revelaT = pa.revelando
    ? Math.min(1, pa.revelaProgreso / ENCUBIERTO_DURACION)
    : 0;

  // Hacia dónde mira, en el piso: hay que poder leerlo para rodearlo por atrás.
  // El cuerpo ya mira hacia un lado, pero ocho direcciones siguen siendo
  // gruesas para saber si te ve o no; la raya dice el ángulo exacto.
  if (pa.state === 'idle') {
    r.line(pa.x, pa.y, pa.x + Math.cos(pa.facing) * 7, pa.y + Math.sin(pa.facing) * 7, '#7a5a68');
  }

  const fig = dibujarPersona(r, {
    tipo, x: pa.x, pies, angulo: pa.facing, fase, modo: "caminar",
    // El que ya asaltaste lleva las manos arriba.
    manosArriba: pa.state === 'amenazado',
    sacudida: shake,
    destello: pa.hitFlash > 0,
    ojos: revelaT > 0.5 ? '#ff3a2a' : undefined,
    // El arma que sale de adentro del saco: crece hacia vos mientras dura.
    arma: pa.revelando ? {
      angulo: pa.facing,
      largo: 3 + 8 * revelaT,
      color: revelaT > 0.5 ? '#d8cdbb' : '#8a7a84',
    } : null,
  });

  /**
   * Y un reloj encima de la cabeza: cuánto te queda antes de que se ponga a
   * gritar. Sin verlo, amenazar sería una trampa en vez de una decisión.
   */
  if (pa.state === 'amenazado') {
    const c = CONFIG.passenger;
    const queda = Math.max(0, pa.panicTimer / c.robPanicDelay);
    r.rect(pa.x - 5, fig.arriba - 4, 10, 2, '#241c18');
    r.rect(pa.x - 5, fig.arriba - 4, 10 * queda, 2, queda > 0.4 ? col.bagLoot : col.enemyAlert);
  }

  if (revelaT > 0.5) dibujarAviso(r, pa.x, fig.arriba, 'alerta');
  else if (pa.state === 'panic') r.text('!', pa.x, fig.arriba - 5, '#ff8a5c');
  else if (pa.state === 'fleeing') r.text('!', pa.x, fig.arriba - 5, '#ffd0b0');
}
