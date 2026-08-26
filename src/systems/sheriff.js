/**
 * EL SHERIFF — cómo piensa, su escolta, y el aura que arrastra.
 *
 * Separado de systems/boss.js a propósito, porque no se le parece en nada. El
 * Cazarrecompensas es una PELEA (vida propia, embestida, furia, máquina de
 * estados entera). El Sheriff es un GUARDIA con tres particularidades, y todo
 * lo demás lo hereda de la IA de guardia de siempre:
 *
 *  1. **No pelea: se repliega.** Apenas suena la alarma sale hacia la
 *     locomotora y no vuelve a disparar nunca. Lo difícil no es matarlo —
 *     aguanta lo mismo que cualquiera — es LLEGAR.
 *  2. **Tres guardias no se le despegan.** No es una IA de formación nueva:
 *     son guardias normales cuya ronda, en vez de un camino fijo, es él.
 *  3. **Los de su vagón pelean mejor.** El aura se mueve con él, así que el
 *     peor vagón del tren es siempre donde esté parado.
 *
 * Nada de esto necesita una entidad nueva: el Sheriff ES un `createEnemy`
 * (data/bosses.js, `spawnComo: 'guardia'`), así que las balas, la separación,
 * los cadáveres y el conteo por vagón ya lo tratan bien sin tocar una línea.
 */

import { DIFICULTADES } from '../data/train.js';
import { updateEnemy, viajarHacia, turnTowards } from './ai.js';
import { distance } from '../engine/collision.js';

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
    world.bus.emit('sheriffSeRepliega', { sheriff: e });
  }

  replegarse(e, dt, world);
}

/**
 * REPLEGARSE — camina hacia la locomotora y nada más.
 *
 * No dispara, no se cubre, no se asoma: **no tiene una sola línea de combate**.
 * Ésa es toda su definición como jefe, y es lo que hace que perseguirlo sea
 * una decisión de posición en vez de un tiroteo — el precio no lo pagás en
 * vida, lo pagás en los vagones que te alejaste del caballo.
 *
 * Usa `viajarHacia` (el mismo buscador de rutas de los guardias que te
 * persiguen), así que cruza puertas y vagones enteros sin quedarse trabado.
 */
function replegarse(e, dt, world) {
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.alertMark = Math.max(0, e.alertMark - dt);

  // Aturdido (una estampida, un culatazo): tampoco se mueve. Es un guardia.
  if (e.stagger > 0) {
    e.stagger -= dt;
    return;
  }

  // Que se le vea en la cara que ya sabe: rojo, como cualquiera en alerta.
  e.state = 'combat';
  e.suspicion = 1;
  // Pero sin nada de la maquinaria de combate: si algo de esto quedara
  // prendido, empezaría a apuntar y a disparar como un guardia común.
  e.aimTimer = 0;
  e.burstLeft = 0;
  e.coverPoint = null;
  e.atCover = false;
  e.peeking = false;

  const meta = world.train && world.train.puntaLocomotora;
  const destinoX = meta ? meta.x : world.map.width - 40;
  const destinoY = meta ? meta.y : e.y;

  // ¿Ya llegó al fondo? Se queda ahí, mirando para atrás: es el último lugar
  // del tren, y si lo seguiste hasta acá es exactamente donde él quería.
  if (Math.abs(e.x - destinoX) < 20) {
    turnTowards(e, Math.PI, dt, 4);
    return;
  }

  viajarHacia(e, dt, world, destinoX, destinoY, e.sheriffVelocidad);
}

/**
 * LA ESCOLTA — tres guardias cuya ronda es una persona.
 *
 * Se llama en lugar de `updateEnemy` para ellos, y lo único que hace de más
 * es reescribirles el `path` cada cuadro con un punto alrededor del Sheriff.
 * Todo lo demás —ver, sospechar, gritar, cubrirse, disparar, morir— sigue
 * siendo la IA de guardia sin tocar: si te ven, te pelean como cualquiera.
 *
 * Cuando el Sheriff muere, se quedan con la última ronda que tenían y pasan a
 * ser guardias normales de ese vagón. No hacen nada especial por vengarlo:
 * son escolta, no fanáticos.
 */
export function updateEscolta(e, dt, world) {
  const jefe = e.escoltaDe;

  if (jefe && jefe.alive && e.state !== 'combat') {
    const p = puestoDeEscolta(e, jefe);
    e.path = [p];
    e.pathIndex = 0;
    // Sin esto se quedarían plantados 0,9 s en cada punto (el `waitTimer` de
    // una patrulla normal) y el Sheriff se les iría de a poco.
    e.waitTimer = 0;
  }

  updateEnemy(e, dt, world);
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
