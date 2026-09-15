/**
 * Guardias del tren.
 * Este archivo define QUÉ es un guardia y cómo se dibuja.
 * Cómo piensa está en systems/ai.js (separado a propósito).
 */

import { CONFIG } from '../data/config.js';
import { dibujarPersona, dibujarTendido, dibujarAviso, faseDeAndar } from './figura.js';
import { SILUETA_DE_LOOK } from '../data/siluetas.js';
import { GUARD_TYPES, DEFAULT_GUARD_TYPE, guardHealth } from '../data/guards.js';
import { T } from '../text/es.js';

export function createEnemy(x, y, options = {}) {
  const c = CONFIG.enemy;
  const typeId = options.type || DEFAULT_GUARD_TYPE;
  const tipo = GUARD_TYPES[typeId] || GUARD_TYPES[DEFAULT_GUARD_TYPE];
  const health = options.health ?? guardHealth(typeId);

  return {
    x, y,
    hw: c.hw, hh: c.hh,

    // El tipo decide cuánto aguanta y cómo se ve. La dificultad del tren ya
    // vino sumada en `options.health` (ver world/train.js).
    type: typeId,
    look: tipo.look,

    /**
     * NO BUSCA COBERTURA NUNCA (hoy: el Pistolero, ver data/guards.js). Lo lee
     * `doCombat` en systems/ai.js, y con esto puesto el guardia cae siempre en
     * la rama de "sin cobertura" que ya existía: se acerca y se planta a
     * disparar en el medio del pasillo.
     *
     * Sale del TIPO y no de un `options`, para que un guardia de este tipo se
     * comporte igual venga de donde venga — del armado del tren o de una
     * prueba escrita a mano en la consola.
     */
    evitaCobertura: tipo.evitaCobertura || false,

    /**
     * Cuánto lleva SEGUIDO sin poder disparar (no te ve, o tiene un compañero
     * en la línea). Sólo lo usa el que no se cubre: pasado
     * `CONFIG.enemy.descubiertoBloqueoMax` deja de estar plantado y busca
     * cobertura como cualquiera, en vez de quedarse clavado en el pasillo sin
     * hacer nada. Ver `doCombat` en systems/ai.js.
     */
    bloqueadoTimer: 0,
    health,
    maxHealth: health,
    alive: true,

    /**
     * SU PROPIO PERFIL DE IA. Por defecto, una copia llana de CONFIG.enemy —
     * así un guardia sin overrides se comporta exactamente igual que antes.
     * `world/train.js` (`construirPerfilIA`) le suma lo que le toque según
     * la dificultad del tren (puntería, reacción, sospecha, asomada) y el
     * tipo de tren (velocidad de sospecha). Ver systems/ai.js: las partes
     * que varían leen `e.ai`, no `CONFIG.enemy` directamente.
     */
    ai: options.ai || c,

    state: 'patrol',            // patrol | suspicious | combat
    facing: options.facing ?? Math.PI,

    // Ronda: lista de puntos del mundo que recorre en orden.
    path: options.path || [],
    pathIndex: 0,
    waitTimer: 0,

    /**
     * SU PUESTO, si es de los que están plantados en uno (los que conversan,
     * el que vigila una puerta o una caja, un guardaespaldas). Lo usa
     * `volverAlPuesto` (systems/ai.js) para devolverlo si alguien lo corre de
     * ahí — sin esto, un guardia sin ronda que recibe un empujón se queda
     * donde lo dejaron, para siempre.
     */
    puesto: null,
    facingPuesto: undefined,

    // Sospecha: sube mientras te tiene a la vista, baja cuando te perdés.
    suspicion: 0,
    memoryTimer: 0,

    target: { x, y },           // a dónde va cuando investiga
    lastSeen: null,
    lostTimer: 0,

    // Cobertura y fuego
    coverPoint: null,
    atCover: false,
    coverTimer: 0,
    peeking: false,
    peekSide: 1,
    peekAxis: { x: 0, y: 1 },
    peekOffset: CONFIG.enemy.peekSteps[0],
    holdTimer: 0,
    aimTimer: 0,
    aimDir: 0,
    cooldown: 0,
    burstLeft: 0,
    burstTimer: 0,

    // Cuerpo a cuerpo
    meleeTimer: 0,
    meleeWindup: 0,
    stagger: 0,

    /**
     * INCONSCIENTE — lo que deja un culatazo por la espalda (ver data/melee.js).
     *
     * NO es un muerto ni un aturdido: es un tercer estado, y hace falta que sea
     * propio porque se comporta como los dos a la vez. Mientras dura, este
     * guardia está fuera del asalto igual que un cadáver (no ve, no oye, no
     * dispara, no cuenta como compañero de nadie) y **delata igual que un
     * cadáver**: los otros lo ven tirado y dan la alarma, porque de lejos nadie
     * distingue a un muerto de un desmayado.
     *
     * Lo que lo separa del cadáver es lo único que importa: se levanta. Y se
     * levanta sabiendo que alguien lo golpeó — `spooked`, para el resto del
     * asalto. Ahí está lo que el cuchillo cobra 120: que el problema no vuelva.
     */
    inconsciente: 0,

    /**
     * EL REPLIEGUE DEL HERIDO (ver CONFIG.enemy.repliegueVidaUmbral y
     * `considerarRepliegue` en systems/ai.js). Se evalúa CONTINUAMENTE
     * mientras la vida esté en el umbral y nada se haya decidido todavía —
     * ya no hace falta detectar "el golpe que lo dejó ahí", sólo mirar el
     * estado actual cuadro a cuadro.
     */
    retirandose: false,
    yaSeReplego: false,      // pasa una sola vez por guardia: si no, es un bucle
    retiradaTimer: 0,        // tope duro: la retirada no puede durar para siempre
    retiradaDestino: null,
    cubriendoTimer: 0,       // > 0 = está tapando a un compañero que se retira

    /**
     * EL QUE ESTÁ ADELANTE DEL LÍO YA NO SE QUEDA DONDE LO AGARRÓ LA ALERTA:
     * camina hasta la puerta de SU vagón y ahí se pone en rojo de verdad
     * (ver `alertaEnPuerta`, systems/ai.js). Mientras `vaHaciaPuerta` esté
     * puesto, `doCombat` lo dirige hacia `puertaDestino` en vez de hacia
     * vos; al llegar, se marca `defensivo` (permanente) y ahí se queda.
     */
    vaHaciaPuerta: false,
    puertaDestino: null,

    /**
     * LA RENDICIÓN (ver CONFIG.enemy.rendicionChanceBase y `considerarRendicion`
     * en systems/ai.js). Sólo le pasa al que está SOLO cuando le toca el
     * repliegue del herido — el acompañado se repliega, éste no tiene con
     * quién.
     *
     * `soloTimer` cuenta cuánto lleva SEGUIDO sin compañero (se resetea si
     * en el medio aparece uno): tiene que sostenerse
     * `CONFIG.enemy.rendicionSoloMinimo` antes de tirar la moneda, no valer
     * con un solo cuadro de soledad.
     *
     * `yaConsideroRendirse` es el mismo candado que `yaSeReplego`: la tirada se
     * juega una sola vez por guardia, gane o pierda.
     */
    rendido: false,
    soloTimer: 0,
    yaConsideroRendirse: false,

    /**
     * LA TRAICIÓN (ver CONFIG.enemy.traicionCheckCada y `considerarTraicion`
     * en systems/ai.js). Mientras `rendido`, cada tanto tira la moneda; si
     * sale, `traicionLevantando` se prende y `traicionProgreso` empieza a
     * subir — es el tiempo que el jugador tiene para reaccionar antes de que
     * se pare del todo y dispare.
     */
    traicionCheckTimer: 0,
    traicionLevantando: false,
    traicionProgreso: 0,

    /**
     * NINGUNO ENTRA SOLO AL VAGÓN DEL JUGADOR (ver CONFIG.enemy.esperaCompanero
     * y `actualizarEspera` en systems/ai.js). Mientras `esperandoCompanero` esté
     * puesto, este guardia cuenta como `defensivo`: se parapeta en su vagón y no
     * cruza. `yaEsperó` lo limita a una vez, para que perseguirte por medio tren
     * no se vuelva plantarse en cada puerta.
     */
    esperandoCompanero: false,
    esperaTimer: 0,
    yaEsperó: false,

    /**
     * Dinamita. La llevan los cuatro del vagón blindado (se la pone el vagón,
     * `options.dynamite`) y el Dinamitero (se la da su TIPO, data/guards.js).
     *
     * `??` y no `||`: un `options.dynamite: 0` explícito tiene que poder
     * dejar sin dinamita a un tipo que normalmente lleva. Con `||`, el 0 es
     * falsy y se lo devolvería solo, en silencio — el mismo bug que ya nos
     * comimos con `noiseWagons` en entities/player.js.
     */
    dynamite: options.dynamite ?? tipo.dynamite ?? 0,

    /**
     * CUÁNTAS LLEVA CUANDO ESTÁ LLENO. Hasta acá no hacía falta —nadie
     * recargaba, la dinamita era un cartucho y se acababa— pero el Dinamitero
     * repone las suyas cada `CONFIG.enemy.dinamiteroRecarga` segundos (ver
     * `updateEnemy`, systems/ai.js), así que hay que saber hasta dónde. Y lo
     * usa también el dibujo: la bandolera muestra los HUECOS, no sólo lo que
     * queda, que es lo que convierte la recarga en algo que se puede mirar.
     */
    dynamiteMax: options.dynamite ?? tipo.dynamite ?? 0,

    /**
     * NO TIENE ARMA DE FUEGO (hoy: el Dinamitero, ver data/guards.js). Lo leen
     * `tryFire` y los dos disparos a ciegas de systems/ai.js, y decide además
     * dos cosas que sólo tienen sentido para el que no tiene nada más: que
     * tire dinamita aunque NO estés parapetado, y que retroceda en vez de
     * plantarse cuando lo tenés encima.
     */
    sinArmaDeFuego: tipo.sinArmaDeFuego || false,

    throwWindup: 0,
    throwCooldown: 0,

    hitFlash: 0,
    alertMark: 0,

    /**
     * "CONVERSANDO" (Fase 3, data/modifiers.js) — world/train.js pone
     * `conversando: true` en LOS DOS guardias de la pareja (eso mueve la
     * sospecha, ver `updateSuspicion` en systems/ai.js) pero `charlaLider`
     * sólo en UNO (el que de verdad muestra el texto arriba de la cabeza —
     * ver `actualizarCharla`/`drawEnemy` — para que no titilen los dos a la
     * vez, y siempre sea el mismo).
     */
    conversando: false,
    charlaLider: false,
    vigilaLider: false,
    charlaTimer: 0,
    charlaShowUntil: 0,
    charlaTexto: '',

    /**
     * DE FRANCO (vagón de guardias, ver `empezarADesenfundar` acá abajo).
     * `deFranco` lo pone world/train.js; `armado` se prende la primera vez
     * que entra en combate y ya no se apaga; `desenfundando` es el reloj de
     * esos 1,5 s, y `francoQuieto` si los pasa parado o corriendo a cubrirse.
     */
    deFranco: false,
    armado: false,
    desenfundando: 0,
    francoQuieto: undefined,
  };
}

/**
 * EL DE FRANCO DESCUELGA EL ARMA — sólo la primera vez que entra en combate.
 *
 * Hay dos puertas por las que un guardia pasa a combate (`enterCombat` en
 * systems/ai.js, y que le peguen, en `damageEnemy` acá abajo), y las dos
 * tienen que cobrar lo mismo: por eso vive en una función y no copiado.
 *
 * `francoQuieto` se sortea después, en `updateEnemy` (systems/ai.js), porque
 * éste archivo no tiene el generador de azar a mano.
 */
export function empezarADesenfundar(e) {
  if (!e.deFranco || e.armado) return;
  e.armado = true;
  e.desenfundando = CONFIG.enemy.francoDesenfundar;
  e.francoQuieto = undefined;
  e.cooldown = Math.max(e.cooldown, CONFIG.enemy.francoDesenfundar);
}

export function damageEnemy(e, amount, fromX, fromY) {
  if (!e.alive) return false;

  /**
   * Medio segundo intocable mientras entra en furia (ver data/bosses.js). Sólo
   * los mini jefes lo usan; un guardia nunca tiene este campo en otra cosa que
   * no sea 0.
   */
  if (e.invulnerable > 0) return false;

  e.health -= amount;
  e.hitFlash = CONFIG.feel.hitFlash;
  e.lastSeen = { x: fromX, y: fromY };

  /**
   * UN MINI JEFE NO PIERDE EL APUNTADO PORQUE LE PEGUEN.
   *
   * Un guardia sí: si le acertás mientras se asoma, se mete atrás de la
   * cobertura, y eso está bien — es lo que premia acertar primero. Pero
   * aplicado a un jefe lo rompía por completo: con el Colt (un tiro cada
   * 0,40 s) y su apuntado de rifle (0,55 s), dispararle sin parar le
   * cancelaba el gesto ANTES de que saliera cada tiro. Nunca llegaba a
   * disparar, o sea que la pelea se ganaba apretando el gatillo sin pensar.
   *
   * Su forma de castigar que le tires es otra, y ya está construida: la
   * embestida. Éste es exactamente el tipo de interacción entre dos sistemas
   * viejos que sólo aparece cuando se juntan.
   */
  if (e.esJefe) {
    if (e.health <= 0) {
      e.health = 0;
      e.alive = false;
      return true;
    }
    return false;
  }

  if (e.state !== 'combat') {
    e.state = 'combat';
    e.suspicion = 1;
    e.alertMark = 1;
    e.cooldown = Math.max(e.cooldown, CONFIG.enemy.reactionTime);
    empezarADesenfundar(e);
  } else {
    // Si le pegan mientras está asomado, se mete atrás de la cobertura.
    e.peeking = false;
    e.aimTimer = 0;
    e.burstLeft = 0;
    e.holdTimer = Math.max(e.holdTimer, 0.5);
  }

  if (e.health <= 0) {
    e.health = 0;
    e.alive = false;
    return true;
  }
  return false;
}

/** La cinta del sombrero de cada tipo: es lo que se ve del que quedó tirado. */
const CINTA_DE = {
  guardia: '#4a78b8', blindado: '#4a78b8', pistolero: '#b8ad98',
  dinamitero: '#e03a2a', encubierto: '#3fa870', sheriff: '#e8c34a',
};

export function drawEnemy(r, e) {
  const col = CONFIG.colors;
  /**
   * EN SOMBRA CABEZONA (ver entities/figura.js y data/siluetas.js). Los pies
   * en el borde de abajo de la caja con la que choca (`e.hh`), que no cambió:
   * la bala sigue pegando donde pegaba.
   *
   * EL TIPO SE LEE EN LA SILUETA Y SUS DETALLES (la gorra, la placa, las
   * culatas, la bandolera, la estrella). EL ESTADO, que antes era el color de
   * todo el cuerpo, ahora está en los ojos (blancos, amarillos, rojos) y en el
   * aviso encima de la cabeza: "?" con la barrita o "!" fijo.
   */
  const pies = e.y + e.hh;
  const tipo = SILUETA_DE_LOOK[e.look] || 'guardia';
  const cinta = CINTA_DE[tipo];

  if (!e.alive) {
    dibujarTendido(r, e.x, e.y, { sangre: true, cinta });
    return;
  }

  /**
   * DESMAYADO: tirado, pero SIN el charco de sangre, y con la "z".
   *
   * **Vos sabés que está vivo porque lo noqueaste vos**, y los otros guardias
   * no distinguen de lejos (por eso delata igual, ver `findVisibleBody` en
   * systems/ai.js).
   *
   * Y respira: el cuerpo late despacio. Es lo que te avisa, si volvés a pasar
   * por al lado, que ese sigue siendo un problema que se va a levantar.
   */
  if (e.inconsciente > 0) {
    dibujarTendido(r, e.x, e.y, {
      cinta, dormido: true, respira: Math.sin(e.inconsciente * 3) * 0.5,
    });
    return;
  }

  const fase = faseDeAndar(e);

  /**
   * RENDIDO: de rodillas, con las manos arriba y un pañuelo blanco en la mano.
   *
   * LA TRAICIÓN SE LEE EN EL CUERPO (ver CONFIG.enemy.traicionDuracion):
   * mientras `traicionLevantando` corre, `t` va de 0 a 1. Primero suelta el
   * pañuelo (con las manos todavía arriba) y a mitad de camino se para con los
   * ojos rojos y el "!". Soltar el pañuelo es la mitad temprana del aviso: la
   * que premia estar mirando.
   */
  if (e.rendido) {
    const t = e.traicionLevantando
      ? Math.min(1, e.traicionProgreso / CONFIG.enemy.traicionDuracion)
      : 0;
    const levantado = t > 0.5;
    const fig = dibujarPersona(r, {
      tipo, x: e.x, pies, angulo: Math.PI / 2,
      postura: levantado ? 'pie' : 'rendido',
      panuelo: t < 0.25,
      estado: levantado ? 'alerta' : 'calma',
      destello: e.hitFlash > 0,
    });
    if (levantado) dibujarAviso(r, e.x, fig.arriba, 'alerta');
    return;
  }

  if (e.state !== 'combat') drawVisionCone(r, e);

  r.ctx.globalAlpha = 0.25;
  r.box(e.x, pies, 5, 2, '#000');
  r.ctx.globalAlpha = 1;

  // Levanta el brazo antes de pegarte: ese es el aviso del cuerpo a cuerpo.
  // Va en el piso, como el cono: marca hasta dónde llega el golpe.
  if (e.meleeWindup > 0) {
    const c = CONFIG.enemy;
    r.line(
      e.x, e.y,
      e.x + Math.cos(e.facing) * c.meleeRange,
      e.y + Math.sin(e.facing) * c.meleeRange,
      '#ff8a5c', 0.75
    );
  }

  /**
   * DE FRANCO: sentado en su banquito, con las cartas en la mano y el arma
   * colgada al costado — mientras siga tranquilo y en su lugar. Apenas se
   * levanta a mirar algo, o entra en combate, se dibuja de pie como cualquiera.
   *
   * Y MIENTRAS DESCUELGA EL ARMA (`desenfundando`) NO HAY CAÑO: ése es el
   * aviso de que todavía no te puede tirar. Cuando el caño aparece, ya puede.
   */
  const sentado = e.deFranco && !e.armado && e.state === 'patrol' && e.puesto &&
    Math.abs(e.x - e.puesto.x) < 3 && Math.abs(e.y - e.puesto.y) < 3;

  if (sentado) {
    r.rect(e.x - 4, pies - 4, 8, 4, '#4a3526');
    r.rect(e.x - 4, pies - 4, 8, 1, '#6b4d36');
    // Las cartas sobre la mesa las pone uno solo de la pareja, para no pintarlas dos veces.
    if (e.charlaLider && e.mesa) {
      r.rect(e.mesa.x - 7, e.mesa.y - 3, 3, 4, '#efe6d2');
      r.rect(e.mesa.x - 2, e.mesa.y - 1, 3, 4, '#efe6d2');
      r.rect(e.mesa.x + 4, e.mesa.y - 4, 4, 5, '#d9cfb8');
      r.rect(e.mesa.x + 5, e.mesa.y - 3, 2, 3, '#b8452f');
    }
  }

  const estado = e.stagger > 0 ? 'aturdido'
    : e.state === 'combat' ? 'alerta'
    : e.suspicion > 0.05 ? 'sospecha'
    : 'calma';

  // El único aviso de que va a disparar: se para en seco y levanta el arma.
  // (Antes había una línea roja marcando la trayectoria; era demasiado fácil.)
  const conArma = !sentado && !(e.desenfundando > 0);
  const fig = dibujarPersona(r, {
    tipo, x: e.x, pies, angulo: e.facing,
    fase: sentado ? null : fase,
    postura: sentado ? 'sentado' : 'pie',
    estado,
    destello: e.hitFlash > 0,
    cartuchos: { cargados: e.dynamite || 0, total: e.dynamiteMax || 0 },
    arma: conArma ? {
      angulo: e.facing,
      largo: e.aimTimer > 0 ? 10 : 7,
      color: e.aimTimer > 0 ? '#d8cdbb' : '#6a625a',
      punta: e.aimTimer > 0 ? '#fff6d0' : null,
      // EL PISTOLERO: el SEGUNDO caño, que aparece junto al primero. Es el
      // momento en que importa saber qué tenés enfrente.
      doble: e.look === 'dosRevolveres',
    } : null,
  });

  if (sentado || e.desenfundando > 0) {
    // El arma colgada al costado, en gris: sobre el negro, oscura no se vería.
    r.rect(fig.x + 6, fig.manoY - 2, 1, 4, '#8a8074');
  }
  if (sentado) {
    // Las cartas en la mano, hacia su compañero.
    r.rect(fig.x + Math.round(Math.cos(e.facing) * 5) - 1, fig.manoY - 1, 3, 2, '#efe6d2');
  }

  // Mecha encendida en la mano, en alto: el aviso de que te va a tirar una
  // dinamita. Tiene que verse de lejos y sin ambigüedad, porque la respuesta
  // correcta (salir de la cobertura ya mismo) es contraria a todo lo demás.
  if (e.throwWindup > 0) {
    const parpadeo = Math.floor(e.throwWindup * 22) % 2 === 0;
    r.rect(fig.x + 7, fig.top - 1, 1, 3, col.dynamite);
    if (parpadeo) r.rect(fig.x + 7, fig.top - 3, 1, 1, '#fff4c0');
    r.text('!', fig.x + 12, fig.top - 3, '#ff7a4a');
  }

  /**
   * LO QUE VA ENCIMA DE LA CABEZA, apilado de abajo hacia arriba: primero las
   * muescas de vida (sólo si está herido: la vida va de 2 a 4 según el tipo y
   * la dificultad, y sin esto no se sabe si le queda un tiro o tres), y arriba
   * de todo el aviso de estado o lo que dice.
   */
  let arriba = fig.arriba;
  if (e.health < e.maxHealth) {
    const anchoMuesca = 3;
    const total = e.maxHealth * (anchoMuesca + 1) - 1;
    for (let i = 0; i < e.maxHealth; i++) {
      r.rect(
        e.x - total / 2 + i * (anchoMuesca + 1), arriba - 3, anchoMuesca, 2,
        i < e.health ? '#e0c44a' : '#4a3a2a'
      );
    }
    arriba -= 3;
  }

  if (e.state === 'combat') {
    // 🔁 FIJO MIENTRAS PELEA: antes duraba un segundo (`alertMark`), y con el
    // cuerpo negro no quedaba nada más que dijera "este te está peleando".
    dibujarAviso(r, e.x, arriba, 'alerta');
  } else if (e.suspicion > 0.04) {
    // "?" y la barrita de cuánto te queda para romper el contacto.
    dibujarAviso(r, e.x, arriba, 'sospecha', e.suspicion);
  } else if (e.vigilaLider) {
    /**
     * "VIGILANDO" (puerta o caja fuerte) — un ESTADO, no una frase suelta: se
     * muestra fijo mientras dure. *(Santi: "quiero que encima de los guardias
     * que vigilan una puerta o una caja fuerte, diga 'vigilando'")*
     */
    r.text(T.ambiente.vigilando, e.x, arriba - 5, col.enemy);
  } else if (e.charlaLider && e.charlaShowUntil > 0) {
    // LA CHARLA: una frase suelta que aparece y se corta (ver `actualizarCharla`).
    r.text(e.charlaTexto, e.x, arriba - 5, col.enemy);
  }
}

function drawVisionCone(r, e) {
  const c = CONFIG.enemy;
  const ctx = r.ctx;

  ctx.save();
  ctx.globalAlpha = 0.07 + e.suspicion * 0.13;
  ctx.fillStyle = e.suspicion > 0.5 ? '#ffb98a' : '#ffe9a8';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const a = e.facing - c.viewAngle + (c.viewAngle * 2 * i) / steps;
    ctx.lineTo(e.x + Math.cos(a) * c.viewDistance, e.y + Math.sin(a) * c.viewDistance);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
