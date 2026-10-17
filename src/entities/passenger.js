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
import { dibujarPersona, dibujarTendido, dibujarAviso, faseDeAndar, tendidoNuevo } from './figura.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { lienzoSombreroSuelto, cuadroDeFumar, aspectoDe } from './estiloNuevo/gente.js';
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
  // Un tiro o una explosión despiertan al que dormía, asustado (ver CONFIG.passenger.dormidos).
  pa.dormido = false;
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
   * 🆕 DORMIDO (de noche, ver CONFIG.passenger.dormidos): no ve nada. Lo
   * despiertan un tiro o una explosión (`panic`), un grito cerca (la escena) o
   * que le empieces a robar: ahí abre los ojos con el revólver en la cara.
   */
  if (pa.dormido) {
    if (pa.robProgress > 0) pa.dormido = false;
    else return;
  }

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

/**
 * 🆕 QUÉ ESTÁ HACIENDO SENTADO, DE DÍA (P3a) *(Santi eligió la B: cada 6 a 12 s
 * hace algo durante 3 a 6 s)*: mirar por la ventana, leer el diario, barajar o
 * revisar el equipaje, sólo lo que tiene que ver con lo que lleva. Es sólo
 * dibujo (no cambia lo que ve), así que corre con el reloj de la pantalla y se
 * guarda en `_p3`, que nada del juego lee. Los 8 cuadros: dos para empezar
 * (0,15 s cada uno), del 2 al 6 en vuelta mientras dura (0,35 s cada uno) y dos
 * para terminar.
 */
/** Cuánto dura cada uno de los 8 cuadros de comer y de tomar del jarro (en segundos). */
const TIEMPOS_MESA = {
  comer: [0.4, 0.2, 0.35, 0.25, 0.2, 0.4, 0.4, 0.4],
  jarro: [0.8, 0.25, 0.5, 0.5, 0.5, 0.25, 0.8, 0.8],
};
function accionDeDia(pa, ahora) {
  // 🔁 Nunca se queda sin hacer nada: termina una cosa y empieza otra (ver CONFIG.fumar.duracionOtras).
  const s = pa._p3 || (pa._p3 = { accion: null, hasta: ahora });
  if (ahora >= s.hasta) {
    {
      /**
       * 🆕 EL QUE FUMA, FUMA MÁS QUE CUALQUIER OTRA COSA (ver CONFIG.fumar):
       * de cada 10 veces, 6 prende un cigarrillo, que le dura 12-20 s (lo
       * demás, también).
       */
      const F = CONFIG.fumar;
      if (pa._p3Fuma === undefined) pa._p3Fuma = Math.random() < F.fumadores;
      if (pa._p3Fuma && Math.random() < F.pesoPasajero) {
        s.accion = 'fumar';
        s.desde = ahora;
        s.hasta = ahora + F.duracion[0] + Math.random() * (F.duracion[1] - F.duracion[0]);
      } else {
        // (🆕 A la mesa del comedor no mira por la ventana ni revisa la maleta; sin otra cosa, quieto.)
        let hay = pa.enBanco ? [null, 'comer', 'jarro'] : ['ventana'];
        if (pa.diario) hay.push('diario');
        if (pa.mazo) hay.push('barajar');
        if (pa.lleva && !pa.enBanco) hay.push('equipaje');
        // No repite la misma dos veces seguidas si tiene otra.
        if (hay.length > 1) hay = hay.filter((a) => a !== s.accion);
        s.accion = hay[Math.floor(Math.random() * hay.length)];
        s.desde = ahora;
        s.hasta = ahora + F.duracionOtras[0] + Math.random() * (F.duracionOtras[1] - F.duracionOtras[0]);
      }
    }
  }
  if (!s.accion) return null;
  const t = ahora - s.desde, queda = s.hasta - ahora;
  if (s.accion === 'fumar') return { accion: 'fumar', k: cuadroDeFumar(t, CONFIG.fumar.cada, CONFIG.fumar.cuadro), girando: false };
  /**
   * 🆕 COMER Y TOMAR DEL JARRO (a la mesa del comedor): cada cuadro con su tiempo (ver POSES_MESA en
   * gente.js). El que come, cada tres bocados toma un trago del jarro.
   */
  if (s.accion === 'comer' || s.accion === 'jarro') {
    const T = TIEMPOS_MESA;
    const largo = (a) => T[a].reduce((x, y) => x + y, 0);
    let a = s.accion, u = t;
    if (a === 'comer') {
      const vuelta = 3 * largo('comer') + largo('jarro');
      u = t % vuelta;
      if (u >= 3 * largo('comer')) { a = 'jarro'; u -= 3 * largo('comer'); } else u %= largo('comer');
    } else u = t % largo('jarro');
    let k = 0;
    while (k < 7 && u >= T[a][k]) u -= T[a][k++];
    return { accion: a, k, girando: false };
  }
  const k = t < 0.15 ? 0 : t < 0.3 ? 1 : queda < 0.15 ? 0 : queda < 0.3 ? 7 : 2 + (Math.floor((t - 0.3) / 0.35) % 5);
  return { accion: s.accion, k, girando: t < 0.3 || queda < 0.3 };
}

/**
 * DESDE DÓNDE SE ORDENA AL DIBUJARLO: el que está sentado (con el dibujo nuevo)
 * va delante de su asiento, y el que duerme en la litera, delante de la cama.
 * Si no, el mueble —que se dibuja por su borde de abajo— lo tapaba entero.
 */
export function baseDeDibujo(pa, base) {
  if (!estiloNuevo.activo) return base;
  if (pa.dormido && pa.cama && pa.cama.base) return Math.max(base, pa.cama.base + 0.02);
  const sentado = pa.sentado && (pa.state === 'idle' || pa.state === 'amenazado' || pa.state === 'panic') && !pa.revelando;
  if (sentado && pa.asientoBase) return Math.max(base, pa.asientoBase + 0.02);
  return base;
}

/** La "z" del que duerme, encima de la cabeza; sube despacio. */
function dibujarZ(r, x, arriba) {
  const sube = Math.floor((performance.now() / 600) % 3);
  const z = ['xxx', '..x', '.x.', 'xxx'];
  z.forEach((filaZ, i) => {
    for (let j = 0; j < 3; j++) if (filaZ[j] !== '.') r.rect(x + 4 + j, arriba - 4 - sube + i, 1, 1, '#c8d8f0');
  });
}

/**
 * Dónde se dibuja el sentado respecto del medio de su asiento (en unidades del
 * mundo). 🔁 Despierto, en el borde del almohadón *(Santi: "que los despiertos
 * estén sentados más en el borde del asiento")*; dormido, echado atrás con la
 * cabeza contra el respaldo.
 */
const AJUSTE_ASIENTO = { x: 2.25, y: 0, dormido: -0.5 };
/**
 * 🆕 Cuánto se corre hacia la mesa el que está sentado en un banco del comedor (en unidades): en la
 * orilla de adelante del banco, así las rodillas entran debajo de la mesa y la mesa le tapa las piernas.
 */
const AJUSTE_BANCO = 5.5;

/**
 * Dónde está su sombrero en el banco: en el otro lugar (cada banco tiene dos,
 * uno arriba y otro abajo; `asientoBase` es el borde de abajo del banco). Sobre
 * el almohadón, a la altura de la cadera.
 */
const SEPARA_SOMBRERO = 9; // unidades del mundo entre él y su sombrero (el otro lugar está a 16)
function sombreroEnElBanco(r, pa) {
  const S = CONFIG.tileSize, PASO = CONFIG.estilo.punto / 4;
  const abajoLibre = pa.y + S < pa.asientoBase;           // ¿hay lugar abajo de él en el banco?
  pa.sombreroArriba = !abajoLibre;
  // 🔁 Pegado a él, no en el medio del otro lugar *(Santi: "más cerca del civil dormido")*.
  // 🔁 Arriba de él (sentado del lado de la ventana), dos puntos más allá: el de paja, ancho, le tapaba
  // la cabeza *(Santi: "córrelo un par de pixeles más allá")*.
  const y = (abajoLibre ? pa.y + SEPARA_SOMBRERO : pa.y - SEPARA_SOMBRERO - 2 * PASO) + pa.hh - 5;
  const x = pa.asientoX + 1;
  return {
    antes: !abajoLibre,
    dibujar: () => {
      const luz = estiloNuevo.luzEn ? estiloNuevo.luzEn(x, y) : 0;
      const fino = CONFIG.estilo.bordeGente < CONFIG.estilo.punto;
      const L = lienzoSombreroSuelto({ ...pa._aspecto, tipo: 'pasajero', fino }, luz);
      const ox = Math.round(x / PASO) * PASO - L.base[0] * PASO, oy = Math.round(y / PASO) * PASO - L.base[1] * PASO;
      r.ctx.drawImage(L.img, ox, oy, L.img.width * PASO, L.img.height * PASO);
      if (fino) estiloNuevo.marcarGente(r.ctx, L.img, ox, oy, L.img.width * PASO, L.img.height * PASO);
    },
  };
}

/** 🎨 EL PASAJERO CON EL DIBUJO NUEVO (P3a). */
function pasajeroNuevo(r, pa, pies) {
  const espejoTirado = (Math.floor(pa.x / 3) & 1) === 1;
  const aspecto = aspectoDe(pa, 'pasajero');
  if (!pa.alive) { tendidoNuevo(r, pa.x, pa.y, { tipo: 'pasajero', modo: 'muerto', sangre: true, espejo: espejoTirado, aspecto }); return; }
  // Durmiendo en la litera del dormitorio.
  // (La almohada de la litera está a la izquierda: la cabeza va ahí.)
  const ahora = performance.now() / 1000;
  /**
   * 🆕 EN LA CAMA VERTICAL DEL DORMITORIO NUEVO, acostado como el del banco del comedor *(Santi: "arma la
   * cama para el cuerpo parado de un personaje"; el tapado con la frazada "se ve mal")*: el pasajero de
   * frente, a lo largo de la cama, con la cabeza en la almohada (arriba), una mano en el pecho y la otra
   * colgando del lado libre de la cama, y respira como él. Sin sombrero: está en el perchero.
   */
  if (pa.dormido && pa.cama && pa.cama.vertical && estiloNuevo.activo) {
    const PASO = CONFIG.estilo.punto / 4;
    const t = (ahora + pa.cama.x * 0.37) % 4.5;
    const aire = t < 0.3 ? 'Medio' : t < 1.7 ? 'Aire' : t < 2.9 ? 'Medio' : '';
    const figA = dibujarPersona(r, {
      tipo: 'pasajero', x: pa.cama.x, pies: pa.cama.arriba + 23 * PASO, angulo: Math.PI / 2, interior: true,
      nuevo: { arma: null, funda: false, aspecto: { ...aspecto, sombrero: 'ninguno' }, piernas: 'quieto', brazos: (pa.cama.libre > 0 ? 'acostadoDer' : 'acostado') + aire },
      destello: pa.hitFlash > 0,
    });
    pa._p3Desde = { x: pa.cama.x, t: ahora };
    dibujarZ(r, figA.x + 4, figA.arriba);
    return;
  }
  if (pa.dormido && pa.cama) {
    tendidoNuevo(r, pa.cama.x - 6, pa.cama.y, { tipo: 'pasajero', modo: 'cama', aspecto });
    pa._p3Desde = { x: pa.cama.x - 6, t: ahora };
    return;
  }

  /**
   * 🆕 EN EL COMEDOR, EL QUE DUERME SE ACUESTA EN SU BANCO *(Santi: "la misma silueta que un pasajero
   * de frente solo que tumbada, una mano [colgando] y la otra sobre el pecho, el sombrero sobre la
   * cabeza y nada más")*: el pasajero de frente, a lo largo del banco (la cabeza hacia la pared del
   * fondo), con el brazo de afuera colgando (ver `acostado` en BRAZOS, jugador.js). Nada más cambia.
   */
  if (pa.dormido && pa.enBanco && pa.state === 'idle') {
    const S = CONFIG.tileSize, PASO = CONFIG.estilo.punto / 4;
    // (🔁 Un poco más cerca del piso *(Santi)*: el brazo que cuelga queda en el aire, no contra el banco.)
    // El sombrero no va puesto: va encima de la cara, visto desde arriba (ver SOMBRERO_ARRIBA).
    // 🆕 Respira *(Santi)*: toma aire rápido (la mano del pecho sube), se queda un momento con el pecho
    // lleno y lo suelta despacio, bajando de a un punto. Una vez cada 4,5 segundos, cada uno a su ritmo
    // (corrido por su posición).
    const t = (ahora + pa.asientoX * 0.37) % 4.5;
    const aire = t < 0.3 ? 'Medio' : t < 1.7 ? 'Aire' : t < 2.9 ? 'Medio' : '';
    const figA = dibujarPersona(r, {
      tipo: 'pasajero', x: pa.asientoX + pa.enBanco * 1.5, pies: pa.asientoBase - 2 * S + 23,
      angulo: Math.PI / 2, interior: true,
      // (Con el sombrero en la cara, sin la barba: va en la capa fina, encima de todo, y se veía a través del sombrero.)
      nuevo: { arma: null, funda: false, aspecto: { ...aspecto, sombrero: 'ninguno', barba: aspecto.sombrero === 'bombin' || aspecto.sombrero === 'paja' ? null : aspecto.barba }, piernas: 'quieto', brazos: (pa.enBanco > 0 ? 'acostado' : 'acostadoDer') + aire },
      destello: pa.hitFlash > 0,
    });
    if (aspecto.sombrero === 'bombin' || aspecto.sombrero === 'paja') {
      const fino = CONFIG.estilo.bordeGente < CONFIG.estilo.punto;
      const hx = figA.x, hy = figA.arriba + 4 * PASO;
      const luz = estiloNuevo.luzEn ? estiloNuevo.luzEn(hx, hy) : 0;
      const L = lienzoSombreroSuelto({ ...aspecto, tipo: 'pasajero', fino, arriba: true }, luz);
      const ox = Math.round(hx / PASO) * PASO - L.base[0] * PASO, oy = Math.round(hy / PASO) * PASO - L.base[1] * PASO;
      r.ctx.drawImage(L.img, ox, oy, L.img.width * PASO, L.img.height * PASO);
      if (fino) estiloNuevo.marcarGente(r.ctx, L.img, ox, oy, L.img.width * PASO, L.img.height * PASO);
    }
    pa._p3Desde = { x: pa.asientoX, t: ahora };
    dibujarZ(r, figA.x + 4, figA.arriba);
    return;
  }

  const fase = faseDeAndar(pa);
  r.ctx.globalAlpha = 0.25;
  r.box(pa.x, pies, 4, 2, '#000');
  r.ctx.globalAlpha = 1;
  const tiembla = pa.state === 'panic' || pa.state === 'amenazado';
  const shake = tiembla ? Math.sin(pa.shakeTimer * 40) * 1 : 0;
  const revelaT = pa.revelando ? Math.min(1, pa.revelaProgreso / ENCUBIERTO_DURACION) : 0;
  /**
   * 🆕 EN EL PÁNICO SE TIRA AL PISO *(Santi: "una pose que es como que se cubren en el piso…
   * mirando hacia el pasillo"; eligió la B)*: de rodillas junto a su asiento, las manos en la
   * cabeza, hasta que grita y huye. Los de arriba (contra la pared del fondo) miran de frente;
   * los de abajo, de espaldas. (Se ordena como el sentado, delante de su asiento.)
   */
  const cubierto = pa.state === 'panic' && pa.sentado && !pa.revelando && !pa.dormido;
  const sentado = pa.sentado && (pa.state === 'idle' || pa.state === 'amenazado' || pa.state === 'panic') && !pa.revelando && !cubierto;
  const nuevo = { arma: null, funda: false, aspecto };
  let angulo = pa.facing;
  if (sentado) nuevo.piernas = 'sentado';
  if (pa.state === 'cowering') { nuevo.piernas = 'agachado'; nuevo.accion = 'quieto'; }
  if (cubierto) { nuevo.piernas = 'rodillas'; nuevo.brazos = 'cubrirse'; angulo = pa.y < 5 * CONFIG.tileSize ? Math.PI / 2 : -Math.PI / 2; }
  /**
   * 🆕 AL DESPERTARSE SE PONE EL SOMBRERO *(Santi)*: dormido lo tiene en el banco
   * al lado; en 0,6 s lo agarra (0,3) y se lo pone (0,3).
   */
  if (pa.dormido) pa._p3Dormia = true;
  else if (pa._p3Dormia) { pa._p3Dormia = false; pa._p3Desperto = ahora; }
  /**
   * El bombín y el de paja tienen su dibujo suelto en el banco (🆕 B6, el de paja); el
   * que no usa sombrero se despierta sin buscarlo.
   */
  const sombreroSuelto = aspecto.sombrero === 'bombin' || aspecto.sombrero === 'paja';
  const despertando = sombreroSuelto && sentado && pa._p3Desperto != null && ahora - pa._p3Desperto < 0.6;
  if (pa.dormido) { nuevo.accion = 'dormido'; nuevo.k = Math.floor(ahora / 1.4) % 2; }
  else if (pa.state === 'amenazado') nuevo.brazos = 'arriba';
  else if (despertando) nuevo.accion = ahora - pa._p3Desperto < 0.3 ? (pa.sombreroArriba ? 'agarraSombreroArriba' : 'agarraSombrero') : 'poneSombrero';
  else if (pa.revelando) {
    // Saca el revólver de adentro del saco (los cuadros del desenfundar) y te apunta.
    const d = Math.floor(revelaT / 0.2);
    if (d < 3) { nuevo.arma = 'colt'; nuevo.desenfunda = d; } else { nuevo.arma = 'colt'; nuevo.empuna = revelaT > 0.8 ? 1 : 0; }
  } else if (sentado && pa.state === 'idle' && !(pa.robProgress > 0)) {
    const A = accionDeDia(pa, ahora);
    // (🆕 A la mesa del comedor no mira por la ventana ni revisa la maleta: queda quieto.)
    if (!A || (pa.enBanco && (A.accion === 'ventana' || A.accion === 'equipaje'))) nuevo.accion = 'quieto';
    else if (A.accion === 'ventana') {
      // Mira por la ventana: se da vuelta hacia el vidrio (arriba o abajo del vagón).
      const arriba = pa.y < 5 * CONFIG.tileSize;
      const vidrio = arriba ? -Math.PI / 2 : Math.PI / 2;
      angulo = A.girando ? Math.atan2(Math.sin(vidrio), Math.cos(pa.facing) >= 0 ? 1 : -1) : vidrio;
      nuevo.accion = 'quieto';
    } else { nuevo.accion = A.accion; nuevo.k = A.k; nuevo.lleva = pa.lleva; }
  } else if (sentado) nuevo.accion = 'quieto';

  // Hacia dónde mira, en el piso (sólo el despierto y tranquilo: el que duerme no ve).
  if (pa.state === 'idle' && !pa.dormido) {
    r.line(pa.x, pa.y, pa.x + Math.cos(pa.facing) * 7, pa.y + Math.sin(pa.facing) * 7, '#7a5a68');
  }
  // Sentado en el almohadón, la espalda contra el respaldo (que está a la izquierda del asiento).
  // (🆕 En el banco del comedor, en el medio de la tabla, que está corrida hacia la mesa.)
  let xDibujo = sentado && pa.asientoX != null
    ? pa.asientoX + (pa.enBanco ? pa.enBanco * AJUSTE_BANCO : pa.dormido ? AJUSTE_ASIENTO.dormido : AJUSTE_ASIENTO.x) : pa.x;
  /**
   * 🐛 AL LEVANTARSE NO SALTA *(Santi: "al despertarse aparecen tan lejos")*: el
   * que estaba sentado o en la litera (que se dibujan sobre el mueble, no donde
   * está su caja) camina hasta su lugar en 0,4 s en vez de aparecer ahí.
   */
  if (sentado) pa._p3Desde = { x: xDibujo, t: ahora };
  else if (pa._p3Desde && ahora - pa._p3Desde.t < 0.4) {
    const t = (ahora - pa._p3Desde.t) / 0.4;
    xDibujo = pa._p3Desde.x + (pa.x - pa._p3Desde.x) * t;
  }
  const piesDibujo = sentado && pa.asientoX != null ? pies + AJUSTE_ASIENTO.y : pies;
  // 🆕 A la mesa del comedor: desde qué columna del dibujo empieza la mesa (ver `mesa` en cuadroGente).
  if (sentado && pa.enBanco) nuevo.mesa = 10 + Math.ceil(Math.abs(pa.asientoX + pa.enBanco * 8.75 - xDibujo) / (CONFIG.estilo.punto / 4));
  /**
   * SU SOMBRERO EN EL BANCO (dormido, o recién despierto agarrándolo): en el
   * almohadón del otro lugar del banco. Si está más allá (arriba), va antes que
   * él; si está más acá (abajo), después.
   */
  const sinSombrero = pa.dormido || (despertando && ahora - pa._p3Desperto < 0.3);
  const sombrero = sombreroSuelto && sentado && sinSombrero && pa.asientoX != null ? sombreroEnElBanco(r, pa) : null;
  if (sombrero && sombrero.antes) sombrero.dibujar();
  const fig = dibujarPersona(r, {
    tipo: 'pasajero', x: xDibujo, pies: piesDibujo, angulo, fase: sentado ? null : fase,
    modo: pa.state === 'fleeing' ? 'trotar' : 'caminar',
    interior: true, nuevo,
    sacudida: shake,
    destello: pa.hitFlash > 0,
  });
  if (sombrero && !sombrero.antes) sombrero.dibujar();
  // (Corrida a la derecha: arriba de la cabeza del que duerme sentado puede estar su sombrero.)
  if (pa.dormido) dibujarZ(r, fig.x + (sentado ? 4 : 0), fig.arriba);
  if (pa.state === 'amenazado') {
    const c = CONFIG.passenger;
    const queda = Math.max(0, pa.panicTimer / c.robPanicDelay);
    r.rect(pa.x - 5, fig.arriba - 4, 10, 2, '#241c18');
    r.rect(pa.x - 5, fig.arriba - 4, 10 * queda, 2, queda > 0.4 ? CONFIG.colors.bagLoot : CONFIG.colors.enemyAlert);
  }
  if (revelaT > 0.5) dibujarAviso(r, pa.x, fig.arriba, 'alerta');
  else if (pa.state === 'panic') r.text('!', pa.x, fig.arriba - 5, '#ff8a5c');
  else if (pa.state === 'fleeing') r.text('!', pa.x, fig.arriba - 5, '#ffd0b0');
}

export function drawPassenger(r, pa) {
  const col = CONFIG.colors;
  /**
   * CON EL ARTE NUEVO (ver entities/figura.js y entities/gente/), con los
   * pies en el borde de abajo de su caja (`pa.hh`), que no cambió.
   *
   * EL PASAJERO: bombín con flor y bufanda verde. EL RICO (Fase 5, ver
   * data/paquetes.js): galera con cinta morada, monóculo y cadena de oro. *(Santi
   * eligió que "se note de lejos")*: es la figura más alta de todo el tren a
   * propósito, asoma por encima de los respaldos.
   */
  const pies = pa.y + pa.hh;
  const tipo = pa.botin ? 'rico' : 'pasajero';

  // 🎨 Con el dibujo nuevo (P3a, [F9]): el pasajero común (el rico sigue con el viejo hasta primera clase).
  if (estiloNuevo.activo && tipo === 'pasajero' && r.ctx) { pasajeroNuevo(r, pa, pies); return; }

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
  if (pa.state === 'idle' && !pa.dormido) {
    r.line(pa.x, pa.y, pa.x + Math.cos(pa.facing) * 7, pa.y + Math.sin(pa.facing) * 7, '#7a5a68');
  }

  const fig = dibujarPersona(r, {
    tipo, x: pa.x, pies, angulo: pa.facing, fase, modo: "caminar",
    // El que ya asaltaste lleva las manos arriba.
    manosArriba: pa.state === 'amenazado',
    sacudida: shake,
    destello: pa.hitFlash > 0,
    ojos: revelaT > 0.5 ? '#ff3a2a' : undefined,
    // Al sacar el arma se le pone cara de alerta: es el aviso que te queda.
    estado: revelaT > 0.5 ? 'alerta' : undefined,
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
  // Con el dibujo viejo no se lo ve dormido: la "z" lo dice.
  if (pa.dormido) dibujarZ(r, pa.x, fig.arriba);
}
