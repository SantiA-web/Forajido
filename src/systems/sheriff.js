/**
 * EL SHERIFF — cómo piensa, su escolta, y el aura que arrastra.
 *
 * Separado de systems/boss.js a propósito, porque no se le parece en nada. El
 * Cazarrecompensas es una PELEA (vida propia, embestida, furia, máquina de
 * estados entera). El Sheriff es un GUARDIA con tres particularidades, y todo
 * lo demás lo hereda de la IA de guardia de siempre:
 *
 *  1. **No te viene a buscar: se repliega.** Apenas suena la alarma sale hacia
 *     la locomotora. Se defiende si lo encarás —dispara, se cubre— pero NUNCA
 *     avanza hacia vos. Lo difícil no es matarlo, es LLEGAR.
 *  2. **Tres guardias no se le despegan.** No es una IA de formación nueva:
 *     son guardias normales cuya ronda, en vez de un camino fijo, es él, y que
 *     pelean en modo defensivo (`defensivo` en systems/ai.js): se cubren, se
 *     asoman por lados opuestos y se turnan, pero no te cargan.
 *  3. **Los de su vagón pelean mejor.** El aura se mueve con él, así que el
 *     peor vagón del tren es siempre donde esté parado.
 *
 * Nada de esto necesita una entidad nueva: el Sheriff ES un `createEnemy`
 * (data/bosses.js, `spawnComo: 'guardia'`), así que las balas, la separación,
 * los cadáveres y el conteo por vagón ya lo tratan bien sin tocar una línea.
 */

import { CONFIG } from '../data/config.js';
import { DIFICULTADES } from '../data/train.js';
import { updateEnemy, viajarHacia, turnTowards, canSeeFrom, doCombat } from './ai.js';
import { distance } from '../engine/collision.js';

/**
 * CUÁNTO SIGUE PELEANDO DESPUÉS DE PERDERTE DE VISTA, antes de retomar el
 * repliegue. Corto a propósito: si fuera largo se quedaría plantado en medio
 * del vagón y dejaría de replegarse, que es lo único que lo define. Lo justo
 * para que no se dé media vuelta en el mismo cuadro en que te tapás detrás de
 * un asiento — eso se leería como que se asusta de una sombra.
 */
const AGUANTE_SIN_VERTE = 1.4;

/**
 * ¿YA SE ESTÁ YENDO?
 *
 * La alarma es el disparador y no "que te vea", por dos motivos: es el mismo
 * instante en que el resto del tren reacciona (así todo pasa a la vez y se
 * lee como una sola cosa), y evita el caso raro de un Sheriff que te ve de
 * lejos, se va, y vos nunca te enteraste de por qué.
 */
function debeReplegarse(e, world) {
  return !!world.alarmaActiva;
}

export function updateSheriff(e, dt, world) {
  if (!e.alive) {
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    return;
  }

  if (!debeReplegarse(e, world)) {
    // Todavía nadie gritó: patrulla como cualquier guardia del tren.
    updateEnemy(e, dt, world);
    return;
  }

  // Un aviso, una sola vez: sin esto, un guardia que de golpe sale caminando
  // para el otro lado se lee como que la IA se rompió, no como una decisión.
  if (!e.yaSeReplegaba) {
    e.yaSeReplegaba = true;
    // Arranca "sin verte" cumplido para que el primer gesto sea SALIR, no
    // plantarse: lo primero que tiene que leerse es que se va.
    e.sinVerteTimer = AGUANTE_SIN_VERTE;
    world.bus.emit('sheriffSeRepliega', { sheriff: e });
  }

  replegarse(e, dt, world);
}

/**
 * REPLEGARSE — camina hacia la locomotora, pero se defiende si lo encarás.
 *
 * 🐛 LA PRIMERA VERSIÓN NO TENÍA UNA SOLA LÍNEA DE COMBATE, y jugándolo se
 * rompía por los dos lados.
 *
 * *(Santi: "el Sheriff sí puede disparar. No es que él se queda bugeado
 * contra una pared sin hacer nada")*
 *
 * La idea era buena —el precio se paga en distancia hasta la salida, no en
 * vida— pero llevada al literal producía un tipo que te daba la espalda
 * mientras le vaciabas el tambor y que, al llegar al fondo del tren, se
 * quedaba mirando la pared para siempre. Eso no se lee como una decisión
 * suya: se lee como una IA rota. Y de paso mataba la escena que el sistema
 * entero buscaba, que es alcanzarlo y que ahí pase algo.
 *
 * AHORA: **se repliega, y si te tiene a la vista se planta y te dispara.**
 * Lo que NO hace, y es lo que le conserva la identidad frente al
 * Cazarrecompensas, es **avanzar hacia vos** — para eso está `defensivo`
 * (systems/ai.js), la misma marca que llevan sus tres guardias. Él nunca te
 * viene a buscar; el terreno lo ganás vos, y ése sigue siendo todo el precio.
 *
 * Cuando te pierde de vista retoma la caminata, así que esconderte no te da
 * un respiro: te lo aleja. Y al llegar al fondo se queda ahí peleando, que es
 * exactamente el duelo que él quería tener — en el último vagón, con vos lo
 * más lejos posible del caballo.
 *
 * Usa `viajarHacia` (el mismo buscador de rutas de los guardias que te
 * persiguen), así que cruza puertas y vagones enteros sin quedarse trabado.
 */
function replegarse(e, dt, world) {
  // Los timers que normalmente adelanta `updateEnemy`: acá no pasa por ahí,
  // así que hay que correrlos a mano o el disparo nunca se destraba.
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.alertMark = Math.max(0, e.alertMark - dt);
  e.cooldown = Math.max(0, e.cooldown - dt);
  e.meleeTimer = Math.max(0, e.meleeTimer - dt);

  // Aturdido (una estampida, un culatazo): tampoco se mueve. Es un guardia.
  if (e.stagger > 0) {
    e.stagger -= dt;
    return;
  }

  // Que se le vea en la cara que ya sabe: rojo, como cualquiera en alerta.
  e.state = 'combat';
  e.suspicion = 1;

  const player = world.player;
  /**
   * `useCone: false` — como el Cazarrecompensas y por el mismo motivo, pero
   * con una justificación propia: está retrocediendo de cara a la locomotora
   * con alguien atrás. Un cono le haría ignorar al que lo persigue por la
   * espalda, que es la única posición desde la que se lo puede perseguir, y
   * volveríamos al tipo que come balas sin enterarse. Lo que SÍ lo tapa es lo
   * mismo que a todos: una pared, un asiento, una puerta cerrada.
   */
  const teVe = player.alive && !player.enTecho &&
    canSeeFrom(e.x, e.y, e.facing, player, world.map, false);

  if (teVe) {
    e.lastSeen = { x: player.x, y: player.y };
    e.sinVerteTimer = 0;
  } else {
    e.sinVerteTimer = (e.sinVerteTimer || 0) + dt;
  }

  // Te tiene (o te acaba de tener) a la vista: se planta y pelea como un
  // guardia parapetado. `defensivo` es lo que le impide dar un paso hacia vos.
  if (e.sinVerteTimer < AGUANTE_SIN_VERTE) {
    doCombat(e, dt, world);
    return;
  }

  // Soltó la pelea: vuelve a caminar. Si algo de la maquinaria de combate
  // quedara prendido, seguiría apuntando mientras se va.
  e.aimTimer = 0;
  e.burstLeft = 0;
  e.coverPoint = null;
  e.atCover = false;
  e.peeking = false;

  const meta = destinoDelRepliegue(e, world);

  // ¿Ya llegó al fondo? Se queda ahí, mirando para atrás: es el último lugar
  // del tren al que puede llegar, y si lo seguiste hasta acá es exactamente
  // donde él quería.
  if (Math.abs(e.x - meta.x) < 20) {
    turnTowards(e, Math.PI, dt, 4);
    return;
  }

  viajarHacia(e, dt, world, meta.x, meta.y, e.sheriffVelocidad);
}

/**
 * HASTA DÓNDE PUEDE REPLEGARSE DE VERDAD.
 *
 * 🐛 ACÁ ESTABA EL "SE QUEDA BUGEADO CONTRA UNA PARED", y la causa no tenía
 * nada que ver con el combate: **era la puerta de chapa del vagón blindado.**
 *
 * El destino era siempre `puntaLocomotora`, o sea la punta del tren. Pero si
 * el blindado queda entre el Sheriff y la locomotora —y queda casi siempre,
 * porque va del vagón 3 para adelante— esa puerta le corta el paso: es la
 * única del tren que frena el movimiento, no se empuja desde afuera y la
 * única llave es la dinamita, que él no lleva. Se estrellaba contra la chapa
 * y se quedaba ahí para siempre, con `findPath` devolviéndole un camino que
 * no existía. Medido: 70 segundos replegándose para terminar clavado a 14 px
 * de una puerta que nunca iba a abrir.
 *
 * AHORA SE REPLIEGA HASTA DONDE DE VERDAD LLEGA, y eso resultó ser mejor
 * diseño que el destino original: se planta de espaldas a la chapa, en el
 * último metro de tren que le queda, y ahí te espera. No es que se rindió —
 * es que no hay más tren. Y si vos volaste esa puerta con dinamita antes, el
 * camino se le abre y sigue: se recalcula cada cuadro, así que la puerta rota
 * (o la que reventó una embestida) deja de contar sola.
 */
function destinoDelRepliegue(e, world) {
  const punta = world.train && world.train.puntaLocomotora;
  let x = punta ? punta.x : world.map.width - 40;
  let y = punta ? punta.y : e.y;

  if (world.doors) {
    for (const d of world.doors) {
      if (d.kind !== 'blindada' || d.broken || d.open) continue;
      if (d.x <= e.x) continue;                 // ésa ya la dejó atrás
      const tope = d.x - d.hw - 14;             // se para ANTES, no encima
      if (tope < x) { x = tope; y = CONFIG.techo.centroY; }
    }
  }

  return { x, y };
}

/**
 * CUÁNTO SE PUEDEN ALEJAR DEL SHERIFF ANTES DE VOLVER A SU PUESTO.
 *
 * El puesto más lejano de la fila está a 52 px (`escolta.radio * 2`) y el
 * radio de búsqueda de cobertura es 108, así que con 90 pueden elegir un
 * asiento a su alrededor sin quedarse a un vagón de distancia. Es la correa
 * que hace que sigan siendo una escolta aunque estén peleando.
 */
const CORREA = 90;

/**
 * LA ESCOLTA — tres guardias cuya ronda es una persona.
 *
 * Se llama en lugar de `updateEnemy` para ellos, y lo único que hace de más es
 * reescribirles el `path` cada cuadro con un punto alrededor del Sheriff y
 * traerlos de vuelta si se alejaron. Todo lo demás —ver, sospechar, gritar,
 * cubrirse, disparar, morir— sigue siendo la IA de guardia sin tocar.
 *
 * 🐛 ANTES EL PUESTO SÓLO SE REESCRIBÍA MIENTRAS NO ESTABAN EN COMBATE, y ahí
 * estaba el problema que Santi vio jugando ("los guardias del Sheriff no
 * deberían ir a atacar"): apenas te veían, la IA de guardia común los mandaba
 * a buscarte por el pasillo y **dejaban solo justo al tipo que tenían que
 * custodiar**. Ahora el puesto se les recuerda siempre, y `defensivo`
 * (systems/ai.js) les saca la parte de avanzar: pelean desde donde están.
 *
 * Cuando el Sheriff muere dejan de ser defensivos y pasan a ser guardias
 * normales de ese vagón — que además es una consecuencia buena de matarlo:
 * los tres que te tenían clavado detrás de un asiento salen a buscarte, o sea
 * que el tren se te viene encima justo cuando ganaste. No lo vengan: es que ya
 * no tienen a quién cuidar.
 */
export function updateEscolta(e, dt, world) {
  const jefe = e.escoltaDe;

  if (!jefe || !jefe.alive) {
    e.defensivo = false;
    updateEnemy(e, dt, world);
    return;
  }

  const puesto = puestoDeEscolta(e, jefe);
  e.path = [puesto];
  e.pathIndex = 0;
  // Sin esto se quedarían plantados 0,9 s en cada punto (el `waitTimer` de
  // una patrulla normal) y el Sheriff se les iría de a poco.
  e.waitTimer = 0;

  /**
   * Se quedó atrás (el Sheriff se replegó, o la pelea lo corrió): antes que
   * nada, volver. Un guardaespaldas a un vagón de distancia no es un
   * guardaespaldas.
   *
   * CON HISTÉRESIS: una vez que arrancó a reagruparse sigue hasta LLEGAR al
   * puesto, no hasta rozar la correa. Sin esto se quedaban orbitando exacto en
   * los 90 px —cruzaban el umbral, daban un paso, volvían a pelear, se
   * atrasaban otra vez— y nunca terminaban de pegarse al Sheriff. Medido: se
   * pasaban entre el 3 y el 14% del tiempo fuera de la correa, oscilando.
   */
  if (distance(e.x, e.y, jefe.x, jefe.y) > CORREA) e.reagrupando = true;
  if (e.reagrupando) {
    if (distance(e.x, e.y, puesto.x, puesto.y) < 14) e.reagrupando = false;
    else { reagruparse(e, dt, world, puesto); return; }
  }

  updateEnemy(e, dt, world);
}

/**
 * VOLVER AL PUESTO. Suelta la cobertura y camina, sin disparar en el camino:
 * mientras se reagrupa está expuesto, y ésa es tu ventana para castigarlo.
 * Mismo espíritu que el resto del juego — todo lo que hace un enemigo tiene un
 * momento en que se le puede pegar.
 */
function reagruparse(e, dt, world, puesto) {
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.alertMark = Math.max(0, e.alertMark - dt);
  e.cooldown = Math.max(0, e.cooldown - dt);
  e.meleeTimer = Math.max(0, e.meleeTimer - dt);

  if (e.stagger > 0) { e.stagger -= dt; return; }

  e.coverPoint = null;
  e.atCover = false;
  e.peeking = false;
  e.aimTimer = 0;
  e.burstLeft = 0;

  viajarHacia(e, dt, world, puesto.x, puesto.y, e.ai.patrolSpeed);
}

/**
 * DÓNDE SE PARA CADA UNO — y por qué NO es un círculo.
 *
 * La primera versión los repartía en círculo alrededor del Sheriff (tres
 * ángulos a 120°). Medido, dos de los tres quedaban en `y = 57` y `y = 103`,
 * o sea **fuera del pasillo, adentro de las filas de asientos** — y ahí se
 * trababan sin moverse ni un píxel en seis segundos.
 *
 * El tren no es un espacio abierto: es un CORREDOR de dos filas de alto
 * (`techo.centroY` ± 16). Una formación tiene que repartirse a lo largo, no
 * alrededor. Ahora uno va adelante, uno atrás y el tercero pegado al hombro,
 * los tres dentro del pasillo — que además se lee mejor: una escolta de
 * verdad camina en fila por un pasillo, no rodeando a alguien en rueda.
 */
function puestoDeEscolta(e, jefe) {
  const c = e.escoltaConfig;
  /**
   * LOS TRES VAN POR EL EJE DEL PASILLO, sólo separados a lo largo.
   *
   * La segunda versión ponía al tercero 13px arriba del centro (al hombro) y
   * medido se quedaba a 511px del Sheriff mientras los otros dos lo seguían
   * pegados: desplazado del centro se traba en los enganches, que son más
   * angostos que el pasillo. Un puesto que a veces funciona es peor que uno
   * aburrido que siempre funciona.
   *
   * Y `separateEnemies` (systems/ai.js) los despega solo si se apilan, así
   * que no hace falta que el puesto los separe: alcanza con darles distintos
   * lugares en la fila.
   */
  const offsets = [c.radio, -c.radio, c.radio * 2];
  const dx = offsets[e.escoltaSlot % offsets.length];

  return { x: jefe.x + dx, y: jefe.y };
}

/**
 * EL AURA — los guardias del vagón donde está el Sheriff pelean mejor.
 *
 * Los números no se inventaron acá: son los de `DIFICULTADES.dura.aiOverrides`
 * (data/train.js), la dificultad "Alta vigilancia" que estaba construida y
 * apagada (`peso: 0`) desde que se hicieron los tipos de tren. Éste es su
 * primer uso real, y es mejor que sortearla: en vez de un tren que viene
 * difícil sin motivo visible, hay un tipo con una estrella al que le podés
 * ver la causa y matarla.
 *
 * SE RECALCULA CADA TANTO, no cada cuadro: es un barrido por todos los
 * guardias y no cambia nada entre un cuadro y el siguiente. Y se guarda el
 * perfil original (`_aiSinAura`) para poder devolverlo — un guardia que sale
 * del vagón del Sheriff tiene que volver a pelear como el que era.
 */
export function actualizarAuraDelSheriff(sheriff, world) {
  const dif = DIFICULTADES[sheriff.auraTipo];
  const overrides = dif && dif.aiOverrides;
  if (!overrides) return;

  const train = world.train;
  const vagonDelSheriff = sheriff.alive && train ? train.wagonAt(sheriff.x) : -1;

  for (const e of world.enemies) {
    if (e === sheriff || e.esJefe) continue;

    const dentro = e.alive && sheriff.alive && train &&
      train.wagonAt(e.x) === vagonDelSheriff;

    if (dentro && !e._conAura) {
      e._aiSinAura = e.ai;
      e.ai = { ...e.ai, ...overrides };
      e._conAura = true;
    } else if (!dentro && e._conAura) {
      e.ai = e._aiSinAura || e.ai;
      e._conAura = false;
    }
  }
}

/** Al morir el Sheriff: todo el tren vuelve a pelear como siempre. */
export function apagarAura(world) {
  for (const e of world.enemies) {
    if (!e._conAura) continue;
    e.ai = e._aiSinAura || e.ai;
    e._conAura = false;
  }
}

/** ¿Está vivo el Sheriff de este asalto? Lo usa el alcance del ruido. */
export function sheriffVivo(sheriff) {
  return !!(sheriff && sheriff.alive);
}
