/**
 * Guardias del tren.
 * Este archivo define QUÉ es un guardia y cómo se dibuja.
 * Cómo piensa está en systems/ai.js (separado a propósito).
 */

import { CONFIG } from '../data/config.js';
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
  };
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

export function drawEnemy(r, e) {
  const col = CONFIG.colors;

  if (!e.alive) {
    r.box(e.x, e.y, 6, 4, col.blood);
    r.box(e.x, e.y, 5, 3, col.enemyDead);
    return;
  }

  /**
   * DESMAYADO: tirado, pero SIN el charco de sangre.
   *
   * Se dibuja igual que un cuerpo salvo por eso, y es la única señal que lo
   * distingue — que es exactamente lo que tiene que ser: **vos sabés que está
   * vivo porque lo noqueaste vos**, y los otros guardias no distinguen de lejos
   * (por eso delata igual, ver `findVisibleBody` en systems/ai.js).
   *
   * Y respira: el cuerpo late despacio. Es lo que te avisa, si volvés a pasar
   * por al lado, que ese sigue siendo un problema que se va a levantar.
   */
  if (e.inconsciente > 0) {
    const respira = Math.sin(e.inconsciente * 3) * 0.5;
    r.box(e.x, e.y, 5, 3 + respira, col.enemy);
    return;
  }

  /**
   * RENDIDO: de rodillas, con las manos arriba. Ni el gris de patrulla ni el
   * rojo de combate — un color propio (`enemyRendido`) para que se lea de
   * lejos como "esto ya no es una pelea", sin depender de que te acerques a
   * leer el cuerpo.
   *
   * LA TRAICIÓN SE LEE EN EL CUERPO, NO EN UN ÍCONO (ver CONFIG.enemy.
   * traicionDuracion): mientras `traicionLevantando` corre, `t` interpola de
   * 0 a 1 y el guardia crece de la pose arrodillada a la de pie de siempre, y
   * pasado el punto medio el color salta a `enemyAlert` — el mismo aviso que
   * ya usa el resto del juego, ahora aplicado a "esto ya no es un rendido".
   * Es TODO el aviso a propósito: no hay brazo que se levanta aparte, el
   * cuerpo entero parándose tiene que alcanzar para leerse y reaccionar.
   */
  if (e.rendido) {
    const t = e.traicionLevantando
      ? Math.min(1, e.traicionProgreso / CONFIG.enemy.traicionDuracion)
      : 0;
    const halfH = e.hh * 0.7 + (e.hh - e.hh * 0.7) * t;
    const yOff = (1 - t);
    const color = t > 0.5 ? col.enemyAlert : col.enemyRendido;
    r.box(e.x, e.y + yOff, e.hw, halfH, color);
    r.line(e.x - e.hw * 0.7, e.y, e.x - e.hw * 0.9, e.y - 7, color, 0.9);
    r.line(e.x + e.hw * 0.7, e.y, e.x + e.hw * 0.9, e.y - 7, color, 0.9);
    return;
  }

  if (e.state !== 'combat') drawVisionCone(r, e);

  r.ctx.globalAlpha = 0.25;
  r.box(e.x, e.y + 6, 5, 2, '#000');
  r.ctx.globalAlpha = 1;

  const bodyColor = e.hitFlash > 0
    ? '#fff'
    : e.stagger > 0 ? '#c9c2b4'
    : e.state === 'combat' ? col.enemyAlert
    : e.suspicion > 0.05 ? col.enemySus
    : col.enemy;

  // Mecha encendida en la mano: el aviso de que te va a tirar una dinamita.
  // Tiene que verse de lejos y sin ambigüedad, porque la respuesta correcta
  // (salir de la cobertura ya mismo) es contraria a todo lo demás que aprendiste.
  if (e.throwWindup > 0) {
    const parpadeo = Math.floor(e.throwWindup * 22) % 2 === 0;
    r.box(e.x, e.y - 10, 2, 2, col.dynamite);
    if (parpadeo) r.box(e.x, e.y - 14, 2, 2, '#fff4c0');
    r.text('!', e.x + 7, e.y - 14, '#ff7a4a');
  }

  // Levanta el brazo antes de pegarte: ese es el aviso del cuerpo a cuerpo.
  if (e.meleeWindup > 0) {
    const c = CONFIG.enemy;
    r.line(
      e.x, e.y,
      e.x + Math.cos(e.facing) * c.meleeRange,
      e.y + Math.sin(e.facing) * c.meleeRange,
      '#ff8a5c', 0.75
    );
  }

  // El único aviso de que va a disparar: se para en seco y levanta el arma.
  // (Antes había una línea roja marcando la trayectoria; era demasiado fácil.)
  const gunLength = e.aimTimer > 0 ? 11 : 8;
  r.line(
    e.x, e.y,
    e.x + Math.cos(e.facing) * gunLength,
    e.y + Math.sin(e.facing) * gunLength,
    e.aimTimer > 0 ? '#d8cdbb' : '#2a2622'
  );
  if (e.aimTimer > 0) {
    r.box(e.x + Math.cos(e.facing) * 12, e.y + Math.sin(e.facing) * 12, 1, 1, '#fff6d0');
  }

  // El tamaño sale de `e.hw/e.hh` (CONFIG.enemy), no de un número aparte: el
  // sprite que se ve siempre es exactamente la caja que puede recibir la bala.
  r.box(e.x, e.y, e.hw, e.hh, bodyColor);

  /**
   * 🐛 LA CABEZA QUE FALTABA — SIN ELLA, EL GUARDIA SE LEÍA COMO UN CONO.
   *
   * *(Santi, jugando: "el jugador parece que mata conos en vez de guardias
   * de ley")*
   *
   * El ala del sombrero (`hatH`, angosta) tocaba directo el cuerpo: cero
   * píxeles de transición. Sin una cabeza que separe "sombrero" de "torso",
   * y con el cuerpo pintado del color de ESTADO (nunca de piel), la silueta
   * entera eran dos bloques apilados — ala ancha arriba, base angosta abajo,
   * el mismo perfil que un cono o un hongo. Medí el recorte de la hitbox de
   * la vuelta anterior (10x8 → 9x7, 1px de diferencia) y no alcanzaba para
   * explicarlo: el problema era viejo, sólo que ahora se mira con más
   * atención.
   *
   * `hatW` YA NO ES UN NÚMERO FIJO (era 12 siempre): escala con `e.hw`, la
   * misma regla que ya usa el sombrero del jugador. Así el ala nunca vuelve
   * a desproporcionarse si el tamaño del cuerpo cambia de nuevo — que es
   * justo lo que pasó acá.
   */
  /**
   * EL CIVIL ENCUBIERTO NO LLEVA SOMBRERO DE GUARDIA: lleva el mismo
   * sombrerito de los pasajeros (`drawPassenger`, mismo tamaño y mismo
   * color). Es toda su silueta, y es a propósito — el que se te levantó del
   * asiento sigue pareciendo lo que parecía. Lo que cambió no es su ropa: es
   * que ahora el cuerpo se pinta con los colores de ESTADO del tren, o sea
   * que está en rojo y te viene a buscar.
   */
  const esCivil = e.look === 'civil';
  const hatW = esCivil ? 8 : e.hw * 2 + 2;
  const hatH = esCivil ? 2 : 1.5;
  r.rect(e.x - hatW / 2, e.y - 6, hatW, hatH, esCivil ? '#6a4a58' : '#4a4038');

  const headTop = e.y - 6 + hatH;
  const headBottom = e.y - e.hh;
  if (headBottom > headTop) {
    r.rect(e.x - e.hw * 0.6, headTop, e.hw * 1.2, headBottom - headTop, col.enemyPiel);
  }

  /**
   * El TIPO de guardia se lee en la silueta, nunca en el color del cuerpo.
   * El color ya está ocupado diciendo el ESTADO (gris/amarillo/rojo), que es la
   * información más importante del juego momento a momento. Si el tipo pisara
   * ese color, ganaríamos saber quién es y perderíamos saber si te vio.
   */
  if (e.look === 'placa') {
    r.rect(e.x - e.hw, e.y - 2, e.hw * 2, 5, '#59616b');
    r.rect(e.x - e.hw, e.y - 2, e.hw * 2, 1, '#7d8794');
    r.rect(e.x - (e.hw * 2 + 4) / 2, e.y - 7, e.hw * 2 + 4, 2, '#3a332c');   // sombrero más ancho
  }

  /**
   * EL PISTOLERO: dos revólveres. La seña tiene que funcionar en los dos
   * momentos en que lo mirás, y por eso son DOS marcas y no una:
   *
   *   - Quieto, de lejos: las dos culatas al cinto, una de cada lado del
   *     torso. Es lo único que lo distingue antes de que pase nada.
   *   - Disparando: el SEGUNDO caño, al lado del que ya dibuja cualquier
   *     guardia. Es el momento en que importa saber qué tenés enfrente, y ahí
   *     la silueta cambia sola sin que haya que agregarle un ícono.
   *
   * 🐛 LAS CULATAS ERAN CARTUCHERAS A LOS COSTADOS, Y NO SE VEÍAN. Marrón
   * (`#6b4a2e`) al lado del cuerpo, o sea SOBRE EL PISO del vagón, que es
   * marrón: mirando la captura ampliada no se distinguían de una tabla del
   * suelo. Ahora van ENCIMA del torso y en claro — el mismo lugar y la misma
   * idea que la placa del blindado o la bandolera del dinamitero, que sí se
   * leen. Este bug no se podía encontrar midiendo: sólo mirándolo.
   *
   * Sigue la regla de este archivo: nada de esto toca el color del cuerpo,
   * que sigue diciendo el ESTADO (gris/amarillo/rojo).
   */
  if (e.look === 'dosRevolveres') {
    r.rect(e.x - e.hw, e.y, 2, 3, '#d8cdbb');
    r.rect(e.x + e.hw - 2, e.y, 2, 3, '#d8cdbb');

    const nx = -Math.sin(e.facing);
    const ny = Math.cos(e.facing);
    const largo = e.aimTimer > 0 ? 11 : 8;
    r.line(
      e.x + nx * 3, e.y + ny * 3,
      e.x + nx * 3 + Math.cos(e.facing) * largo,
      e.y + ny * 3 + Math.sin(e.facing) * largo,
      e.aimTimer > 0 ? '#d8cdbb' : '#2a2622'
    );
  }

  /**
   * EL DINAMITERO: la bandolera cruzada, con los cartuchos a la vista.
   *
   * Van del color de la dinamita (`col.dynamite`, el mismo de la mecha
   * encendida y del cartucho en el piso) a propósito: lo que hay que leer no
   * es "éste es de otro tipo" sino "éste lleva ESO encima", y ese color ya
   * significa exactamente eso en todo el juego.
   */
  if (e.look === 'bandolera') {
    r.rect(e.x - e.hw, e.y - 1, e.hw * 2, 2, '#6b4a2e');
    for (let i = 0; i < 3; i++) {
      r.rect(e.x - e.hw + 1 + i * 3, e.y - 1, 1, 2, col.dynamite);
    }
  }

  /**
   * EL SHERIFF: la estrella. Es lo único dorado que lleva una persona en todo
   * el tren, así que se lo distingue de un vistazo sin tocar el color del
   * cuerpo (que sigue diciendo el estado, como manda la regla de arriba).
   *
   * La cruz de cinco píxeles no es pereza: a esta escala una estrella
   * "de verdad" (con puntas en diagonal) se lee como una mancha. Lo que la
   * hace reconocible es que sea SIMÉTRICA y del color que no usa nadie más.
   */
  if (e.look === 'estrella') {
    r.rect(e.x - (e.hw * 2 + 6) / 2, e.y - 7, e.hw * 2 + 6, 2, '#3a332c');   // ala del sombrero, ancha
    r.rect(e.x - 1, e.y - 3, 3, 5, '#e8c34a');    // la estrella: palo vertical
    r.rect(e.x - 3, e.y - 1, 7, 2, '#e8c34a');    // y el travesaño
    r.rect(e.x - 1, e.y - 4, 1, 1, '#fff2b8');    // un brillo arriba
  }

  /**
   * Cuánto le queda, solo cuando ya está herido.
   *
   * Hace falta ahora que la vida va de 2 a 4 según el tipo y la dificultad del
   * tren: sin esto no hay forma de saber si a este tipo le queda un tiro o
   * tres. Aparece recién al primer impacto para no llenar la pantalla de
   * barritas cuando todavía no pasó nada.
   */
  if (e.health < e.maxHealth) {
    const ancho = 3;
    const total = e.maxHealth * (ancho + 1) - 1;
    for (let i = 0; i < e.maxHealth; i++) {
      r.rect(
        e.x - total / 2 + i * (ancho + 1), e.y - 17, ancho, 2,
        i < e.health ? '#e0c44a' : '#4a3a2a'
      );
    }
  }

  if (e.state === 'combat') {
    if (e.alertMark > 0) r.text('!', e.x, e.y - 14, '#ffd84a');
  } else if (e.suspicion > 0.04) {
    // Barrita de sospecha: te muestra cuánto te queda para romper el contacto.
    const w = 12;
    r.rect(e.x - w / 2, e.y - 13, w, 2, '#1a1512');
    r.rect(e.x - w / 2, e.y - 13, w * Math.min(1, e.suspicion), 2,
      e.suspicion > 0.66 ? '#e07a4a' : '#e0c44a');
  } else if (e.vigilaLider) {
    /**
     * "VIGILANDO" (puerta o caja fuerte) — un ESTADO, no una frase suelta:
     * se muestra fijo todo el tiempo que dure (mientras siga en `patrol`,
     * que es justo la condición con la que se llega a esta rama), igual
     * que "AGACHADO"/"A CUBIERTO" en el HUD. Mismo color que el gris de
     * patrulla (`col.enemy`): es información de estado, no una alerta.
     *
     * *(Santi: "quiero que encima de los guardias que vigilan una puerta o
     * una caja fuerte, diga 'vigilando'")*
     */
    r.text(T.ambiente.vigilando, e.x, e.y - 16, col.enemy);
  } else if (e.charlaLider && e.charlaShowUntil > 0) {
    /**
     * LA CHARLA — a diferencia de "vigilando" (un estado fijo), esto SÍ es
     * una frase suelta que aparece y se corta, como charla de verdad (ver
     * `actualizarCharla`, systems/ai.js).
     */
    r.text(e.charlaTexto, e.x, e.y - 16, col.enemy);
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
