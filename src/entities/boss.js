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
  const col = CONFIG.colors;
  const t = bo.tipo;

  if (!bo.alive) {
    // Un cuerpo más grande que el de un guardia, y con el sombrero al lado:
    // tiene que poder leerse desde el otro lado del vagón que ESE lo mataste.
    r.box(bo.x, bo.y, 8, 5, col.blood);
    r.box(bo.x, bo.y, 7, 4, col.enemyDead);
    r.rect(bo.x + 6, bo.y + 1, 7, 2, '#2a2118');
    return;
  }

  r.ctx.globalAlpha = 0.3;
  r.box(bo.x, bo.y + 7, 6, 2, '#000');
  r.ctx.globalAlpha = 1;

  const cargando = bo.fase === 'carga';
  const avisando = bo.fase === 'aviso';

  // La estela de la carga: lo mismo que le da lectura a un barril rodando
  // (ver entities/rodante.js). Si viene a los pedos, tiene que VERSE que viene
  // a los pedos aunque estés mirando otra cosa.
  if (cargando) {
    for (let i = 1; i <= 3; i++) {
      r.ctx.globalAlpha = 0.26 - i * 0.06;
      r.box(bo.x - bo.cargaDir.x * i * 7, bo.y - bo.cargaDir.y * i * 7, 5, 5, t.color);
    }
    r.ctx.globalAlpha = 1;
  }

  const acechando = bo.fase === 'acecho';

  const bodyColor = bo.hitFlash > 0 ? '#fff'
    : bo.fase === 'aturdido' ? '#c9c2b4'
    : bo.invulnerable > 0 ? '#ffd8a0'
    : bo.enFuria ? '#e0653f'
    /**
     * ACECHANDO VA MÁS APAGADO. No es un efecto de distancia: es la
     * diferencia entre "está ahí" y "viene por vos", y tiene que poder leerse
     * desde el otro lado del vagón sin contar sus pasos. Cuando se despierta,
     * el color salta al suyo pleno — ese cambio ES el aviso.
     */
    : acechando ? '#7d4433'
    : t.color;

  /**
   * EL AVISO DE LA EMBESTIDA — el gesto más grande del juego, a propósito.
   *
   * La respuesta correcta (salirte de la línea, ya) tiene medio segundo largo
   * para tomarse, así que el aviso no puede ser sutil: una línea gruesa que
   * marca POR DÓNDE va a pasar, parpadeando, más las patas plantadas. Es el
   * mismo criterio que la mecha de la dinamita en manos de un guardia
   * (entities/enemy.js): cuando la respuesta correcta es contraintuitiva o
   * urgente, el aviso se agranda.
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
    // Las patas clavadas en el piso: se plantó, no está caminando.
    r.rect(bo.x - 7, bo.y + 5, 3, 2, '#2a2118');
    r.rect(bo.x + 4, bo.y + 5, 3, 2, '#2a2118');
    if (parpadeo) r.text('!!', bo.x, bo.y - 20, '#ff8a4a');
  }

  // El aviso de que va a disparar: el mismo lenguaje que un guardia (se para
  // en seco y levanta el arma), pero el caño es más largo con el rifle. Eso
  // dice de un vistazo CUÁL de las dos armas te está apuntando, que es la
  // información con la que decidís si conviene acercarse o cortarle la vista.
  if (!cargando) {
    const conRifle = bo.armaActual === 'rifle';
    // Acechando lleva el arma BAJA: se ve corta, pegada al cuerpo. Todavía no
    // te está apuntando, y eso tiene que notarse.
    const gunLength = acechando ? 6
      : bo.aimTimer > 0 ? (conRifle ? 17 : 12)
      : (conRifle ? 13 : 9);
    r.line(
      bo.x, bo.y,
      bo.x + Math.cos(bo.facing) * gunLength,
      bo.y + Math.sin(bo.facing) * gunLength,
      bo.aimTimer > 0 ? '#e8dcc4' : '#2a2622'
    );
    if (bo.aimTimer > 0) {
      r.box(
        bo.x + Math.cos(bo.facing) * (gunLength + 2),
        bo.y + Math.sin(bo.facing) * (gunLength + 2),
        1, 1, '#fff6d0'
      );
    }
  }

  /**
   * --- EL CUERPO ---
   *
   * LA PRIMERA VERSIÓN ERA UN CUADRADO ROJO GRANDE con un sombrero encima, y
   * mirándola al lado de un guardia se leía exactamente así: un bloque, no una
   * persona. Es la misma lección que ya había costado aprender con la res de
   * la estampida (ver NOTAS-DISENO.md): *a este tamaño, lo único que separa
   * una figura de una caja es que NO SEA UN RECTÁNGULO.*
   *
   * Lo que lo arregla no es más detalle, es la SILUETA: se ensancha hacia
   * abajo (el poncho) y termina en dos puntas separadas, no en un borde
   * plano. Eso es lo que la vuelve reconocible de un vistazo aunque esté a
   * medio vagón y aunque el color esté cambiado por la furia o el aturdido.
   */
  const oscuro = sombra(bodyColor);

  // Los faldones del poncho, lo más ancho de la figura, colgando abiertos.
  r.rect(bo.x - 8, bo.y + 1, 16, 5, oscuro);
  // Y las dos puntas separadas: el borde de abajo NUNCA es una línea recta.
  r.rect(bo.x - 8, bo.y + 6, 5, 3, oscuro);
  r.rect(bo.x + 3, bo.y + 6, 5, 3, oscuro);

  // El torso, más angosto que el poncho: de ahí sale la forma de hombros.
  r.rect(bo.x - 5, bo.y - 5, 10, 7, bodyColor);

  // El sombrero más ancho del juego (el guardia blindado usa 14; éste, 18).
  r.rect(bo.x - 9, bo.y - 9, 18, 3, '#241c14');
  r.rect(bo.x - 3, bo.y - 12, 6, 3, '#241c14');

  // El rifle cruzado a la espalda cuando está con el revólver: es lo que dice
  // "este tipo tiene otra arma" antes de que la saque.
  if (bo.armaActual === 'revolver' && !cargando) {
    r.line(bo.x - 7, bo.y + 4, bo.x + 5, bo.y - 4, '#4a3a28');
  }

  // --- Cuánto le queda ---
  // Siempre visible, desde el primer cuadro y no recién al herirlo como a un
  // guardia: contra un jefe, saber cuánto falta ES la pelea. Sin esto no se
  // puede decidir si conviene seguir peleando o salir corriendo.
  /**
   * ANCHO FIJO, y el segmento se calcula a partir de él — no al revés.
   *
   * La primera versión hacía cada muesca de 5 px, lo cual funcionaba con 4 de
   * vida (23 px) pero con 8 se iba a 47 px: casi tres veces el ancho del tipo,
   * una barra flotando sobre medio vagón. Fijando el total en 26 px, la barra
   * mide siempre lo mismo tenga la vida que tenga, y lo único que cambia es
   * qué tan finas son las muescas.
   */
  /**
   * El paso va en PÍXELES ENTEROS, no en una fracción del ancho total.
   *
   * Con `26 / 8 = 3,25` las muescas caían en medios píxeles y el renderer las
   * redondeaba a su manera: se veían agrupadas de a 2-4-2 en vez de parejas.
   * A esta escala eso se lee como un error de dibujo, no como una barra. Con
   * el paso entero el ancho total varía un poco según la vida, y eso no
   * importa; que las muescas sean todas iguales, sí.
   */
  const paso = bo.maxHealth > 5 ? 3 : 6;
  const anchoSeg = paso - 1;
  const totalBarra = bo.maxHealth * paso - 1;
  for (let i = 0; i < bo.maxHealth; i++) {
    r.rect(
      Math.round(bo.x - totalBarra / 2) + i * paso, bo.y - 17, anchoSeg, 3,
      i < bo.health ? (bo.enFuria ? '#ff6a3a' : '#e0c44a') : '#3a2a1c'
    );
  }

  if (bo.fase === 'aturdido') {
    // Las estrellitas de siempre: es la señal de "pegale AHORA".
    const giro = bo.faseTimer * 9;
    for (let i = 0; i < 3; i++) {
      const a = giro + (i * Math.PI * 2) / 3;
      r.box(bo.x + Math.cos(a) * 8, bo.y - 22 + Math.sin(a) * 3, 1, 1, '#ffe066');
    }
  }
}

/** Un tono más oscuro del mismo color, para el poncho. */
function sombra(hex) {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const oscurecer = (c) => Math.max(0, Math.round(c * 0.62));
  const r = oscurecer((n >> 16) & 255);
  const g = oscurecer((n >> 8) & 255);
  const b = oscurecer(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
