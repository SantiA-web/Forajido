/**
 * EL MINI JEFE — qué ES y cómo se dibuja.
 *
 * Cómo piensa está en systems/boss.js, separado a propósito, igual que
 * entities/enemy.js está separado de systems/ai.js.
 *
 * DECISIÓN TÉCNICA QUE VALE LA PENA ENTENDER: un jefe tiene la MISMA FORMA que
 * un guardia (x, y, hw, hh, alive, health, state, facing, coverPoint…) y vive
 * en la misma lista `world.enemies`. Eso no es pereza: es lo que hace que
 * TODO lo que ya existe lo trate bien sin tocar una línea — tus balas le pegan
 * (systems/combat.js itera `world.enemies`), no se superpone con los guardias
 * (`separateEnemies`), y su cuerpo en el piso pone nerviosos a los demás
 * (`noticeBodies`). Un sistema paralelo habría que enseñárselo a cada uno de
 * esos lugares, y el primero que se olvidara sería un bug silencioso.
 *
 * Lo único que lo distingue para el motor es `esJefe: true`, que hace que
 * `updateEnemy` le pase la pelota a `updateBoss` en vez de correrle la IA de
 * guardia (ver systems/ai.js).
 */

import { CONFIG } from '../data/config.js';
import { dibujarPersona, dibujarTendido, faseDeAndar } from './figura.js';
import { SILUETA_DE_JEFE } from '../data/siluetas.js';

export function createBoss(x, y, tipo, options = {}) {
  return {
    x, y,
    /**
     * Un poco más grande que un guardia (5x5). Se nota al mirarlo y, sobre
     * todo, se nota al dispararle: es un blanco más fácil. Un jefe no tiene
     * que ser difícil de ACERTAR, tiene que ser difícil de sobrevivir.
     */
    hw: 6, hh: 6,

    esJefe: true,
    tipo,
    id: tipo.id,
    name: tipo.name,

    health: tipo.health,
    maxHealth: tipo.health,
    // Para detectar que le pegaron: si bajó desde el cuadro anterior, embiste
    // (ver `reaccionarAlGolpe` en systems/boss.js).
    vidaPrevia: tipo.health,
    alive: true,

    /**
     * Para el resto del motor SIEMPRE está en combate. No es una simplificación:
     * es literal — no patrulla, no sospecha, no investiga. Nace sabiendo a qué
     * vino. Tenerlo en 'combat' además hace que `alertTo` y `alertaEnGuardia`
     * (systems/ai.js) lo ignoren solos, que es lo correcto: a este no hay que
     * avisarle nada.
     */
    state: 'combat',

    /**
     * SU PROPIA MÁQUINA DE ESTADOS, aparte de la de los guardias:
     *
     *   acecho   — te mide desde atrás, sin disparar. Con el que NACE
     *   caza     — sabe en qué vagón estás y va para allá
     *   combate  — te tiene a la vista y te trabaja a tiros
     *   aviso    — se plantó, va a embestir (ver systems/boss.js)
     *   carga    — viene a los pedos en línea recta
     *   aturdido — erró la embestida: tu ventana
     */
    fase: options.fase || 'acecho',
    faseTimer: 0,
    // Cuánto hace que no te ve. Propio, y NO `faseTimer`: ver faseCombate.
    sinVerte: 0,
    // Cada cuánto suena mientras acecha (ver faseAcecho en systems/boss.js).
    sonidoAcechoTimer: 1.0,
    // Cuánto hace que le pegaron: mientras dure, se acerca cubriéndose en vez
    // de correr derecho (ver `reaccionarAlGolpe` y faseCombate, systems/boss.js).
    bajoFuegoTimer: 0,

    facing: options.facing ?? 0,

    // A dónde va cuando no te ve. No es tu posición exacta: es el centro del
    // vagón en el que estás (ver systems/boss.js, `rastrear`).
    destino: { x, y },
    ultimoVagon: -1,

    /**
     * Cobertura. La usa para DOS cosas distintas: para acercarse con ventaja
     * (`avanzarConCobertura`) y, ya en su distancia, para parapetarse de
     * verdad y tirar asomándose (`parapetarse`). Lo segundo es lo que dejó de
     * hacerlo un blanco quieto — ver systems/boss.js.
     */
    coverPoint: null,
    atCover: false,
    peeking: false,
    peekAxis: { x: 0, y: 1 },
    peekSide: 1,
    peekOffset: 5,
    holdTimer: 0,
    repositionTimer: 0,
    stuckTimer: 0,

    // Disparo (los mismos campos que un guardia: los lee el mismo dibujo)
    aimTimer: 0,
    aimDir: 0,
    cooldown: 0,
    burstLeft: 0,
    burstTimer: 0,
    armaActual: 'rifle',

    // Embestida
    embestidaCooldown: tipo.embestida.cooldown,
    cargaDir: { x: 1, y: 0 },
    cargaRecorrido: 0,
    cargaObjetivo: 0,
    yaGolpeoEnEstaCarga: false,

    // Furia
    enFuria: false,
    invulnerable: 0,

    // Ruta (la comparte con los guardias vía `viajarHacia`)
    ruta: null,
    rutaIndex: 0,
    rutaTimer: 0,
    rutaDestino: null,

    // Cosas que el motor toca en cualquier enemigo y tienen que existir
    hitFlash: 0,
    alertMark: 0,
    stagger: 0,
    meleeTimer: 0,
    meleeWindup: 0,
    suspicion: 1,
    lastSeen: null,
    dynamite: 0,
    throwWindup: 0,
    throwCooldown: 0,
    path: [],
    ai: CONFIG.enemy,
  };
}

/**
 * DIBUJARLO.
 *
 * La restricción de siempre (data/guards.js): el color del cuerpo dice el
 * ESTADO, nunca el tipo. Acá se respeta igual — lo que dice "éste no es un
 * guardia" es la SILUETA: es más alto, lleva un poncho que le llega abajo, el
 * sombrero es el más ancho del juego y lleva el rifle cruzado a la espalda
 * cuando está usando el revólver.
 *
 * Y hay un color propio que sí es suyo (`tipo.color`, un rojo terroso): no
 * pisa la escala gris/amarillo/rojo de los guardias porque el jefe NUNCA está
 * tranquilo ni sospechando. No hay ambigüedad posible: si lo ves, te está
 * cazando.
 */
export function drawBoss(r, bo) {
  const t = bo.tipo;
  /**
   * EN SOMBRA CABEZONA (ver entities/figura.js y data/siluetas.js), del mismo
   * alto que cualquiera: el Cazarrecompensas con la capa roja y el
   * Sheriff con el guardapolvo y la estrella grande. Los pies van en el borde de
   * abajo de su caja (`bo.hh`), que no cambió.
   */
  const pies = bo.y + bo.hh;
  /**
   * 🔁 SIN AGRANDAR. Era 1,15 alrededor de los pies, y con siluetas de un
   * píxel no funciona: la escala no entera mezcla cada borde con el piso y el
   * jefe se veía marrón y transparente en vez de negro. Lo que lo distingue es
   * lo suyo: la capa o el guardapolvo, los ojos ámbar y la barra de vida que
   * lleva siempre.
   */
  const tipo = SILUETA_DE_JEFE[bo.id] || 'cazarrecompensas';
  const cinta = tipo === 'sheriffJefe' ? '#e8c34a' : '#c8302a';

  if (!bo.alive) {
    // Un cuerpo más grande que el de un guardia, y con el sombrero al lado:
    // tiene que poder leerse desde el otro lado del vagón que ESE lo mataste.
    dibujarTendido(r, bo.x, bo.y, { sangre: true, grande: true, cinta });
    return;
  }

  const fase = faseDeAndar(bo);

  r.ctx.globalAlpha = 0.3;
  r.box(bo.x, pies, 7, 2, '#000');
  r.ctx.globalAlpha = 1;

  const cargando = bo.fase === 'carga';
  const avisando = bo.fase === 'aviso';
  const acechando = bo.fase === 'acecho';

  /**
   * SU ESTADO, QUE ANTES ERA EL COLOR DE TODO EL CUERPO, va ahora en la ORILLA
   * de la silueta y en los ojos:
   *
   *  - aturdido: orilla gris (y las estrellitas de siempre)
   *  - invulnerable: orilla dorada
   *  - furioso: orilla y ojos rojos
   *  - ACECHANDO VA APAGADO: los ojos casi no brillan. No es un efecto de
   *    distancia: es la diferencia entre "está ahí" y "viene por vos". Cuando
   *    se despierta, los ojos se prenden — ese cambio ES el aviso.
   */
  const orilla = bo.fase === 'aturdido' ? '#c9c2b4'
    : bo.invulnerable > 0 ? '#ffd8a0'
    : bo.enFuria ? '#e0653f'
    : null;
  const ojos = acechando ? '#5a4030' : bo.enFuria ? '#ff5a2a' : '#ffb030';

  // La estela de la carga: lo mismo que le da lectura a un barril rodando
  // (ver entities/rodante.js). Si viene a los pedos, tiene que VERSE que viene
  // a los pedos aunque estés mirando otra cosa.
  if (cargando) {
    for (let i = 1; i <= 3; i++) {
      r.ctx.globalAlpha = 0.26 - i * 0.06;
      r.rect(bo.x - bo.cargaDir.x * i * 7 - 6, pies - bo.cargaDir.y * i * 7 - 20, 12, 20, t.color);
    }
    r.ctx.globalAlpha = 1;
  }

  /**
   * EL AVISO DE LA EMBESTIDA — el gesto más grande del juego, a propósito: una
   * línea gruesa en el piso que marca POR DÓNDE va a pasar, parpadeando. La
   * respuesta correcta (salirte de la línea, ya) tiene medio segundo largo.
   */
  if (avisando) {
    const parpadeo = Math.floor(bo.faseTimer * 18) % 2 === 0;
    const largo = t.embestida.alcanceMax;
    r.line(
      bo.x, bo.y,
      bo.x + bo.cargaDir.x * largo, bo.y + bo.cargaDir.y * largo,
      parpadeo ? '#ff8a4a' : '#8a3a22',
      parpadeo ? 0.85 : 0.4
    );
    if (parpadeo) r.text('!!', bo.x, pies - 30, '#ff8a4a');
  }

  /**
   * EL ARMA: el mismo lenguaje que un guardia (se para en seco y levanta el
   * arma), pero el caño es más largo con el rifle. Acechando la lleva BAJA: se
   * ve corta. Mientras carga no apunta.
   */
  const conRifle = bo.armaActual === 'rifle';
  const gunLength = acechando ? 5
    : bo.aimTimer > 0 ? (conRifle ? 13 : 9)
    : (conRifle ? 10 : 7);
  const angulo = cargando ? Math.atan2(bo.cargaDir.y, bo.cargaDir.x) : bo.facing;

  const fig = dibujarPersona(r, {
    tipo, x: bo.x, pies, angulo,
    fase: avisando ? null : fase,
    ojos, orilla,
    destello: bo.hitFlash > 0,
    arma: cargando ? null : {
      angulo: bo.facing,
      largo: gunLength,
      color: bo.aimTimer > 0 ? '#e8dcc4' : '#8a8074',
      punta: bo.aimTimer > 0 ? '#fff6d0' : null,
    },
  });

  // El rifle cruzado a la espalda cuando está con el revólver: es lo que dice
  // "este tipo tiene otra arma" antes de que la saque.
  if (bo.armaActual === 'revolver' && !cargando) {
    r.line(bo.x - 6, fig.pechoY + 4, bo.x + 5, fig.pechoY - 5, '#8a6a4a');
  }

  const arriba = fig.arriba;

  // --- Cuánto le queda ---
  // Siempre visible, desde el primer cuadro y no recién al herirlo como a un
  // guardia: contra un jefe, saber cuánto falta ES la pelea.
  /**
   * ANCHO FIJO, y el segmento se calcula a partir de él — no al revés: con 8 de
   * vida y muescas de 5 px la barra flotaba sobre medio vagón. Y el paso va en
   * PÍXELES ENTEROS: con 3,25 las muescas se agrupaban de a 2-4-2.
   */
  const paso = bo.maxHealth > 5 ? 3 : 6;
  const anchoSeg = paso - 1;
  const totalBarra = bo.maxHealth * paso - 1;
  for (let i = 0; i < bo.maxHealth; i++) {
    r.rect(
      Math.round(bo.x - totalBarra / 2) + i * paso, arriba - 6, anchoSeg, 3,
      i < bo.health ? (bo.enFuria ? '#ff6a3a' : '#e0c44a') : '#3a2a1c'
    );
  }

  if (bo.fase === 'aturdido') {
    // Las estrellitas de siempre: es la señal de "pegale AHORA".
    const giro = bo.faseTimer * 9;
    for (let i = 0; i < 3; i++) {
      const a = giro + (i * Math.PI * 2) / 3;
      r.box(bo.x + Math.cos(a) * 8, arriba - 10 + Math.sin(a) * 3, 1, 1, '#ffe066');
    }
  }
}
