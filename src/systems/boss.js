/**
 * CÓMO PIENSA UN MINI JEFE.
 *
 * Separado de entities/boss.js (qué es y cómo se dibuja) por la misma razón
 * que systems/ai.js está separado de entities/enemy.js.
 *
 * EN QUÉ SE PARECE A UN GUARDIA: reusa las piezas caras que ya estaban
 * resueltas y probadas — el buscador de rutas entre vagones (`viajarHacia`),
 * la línea de visión con cobertura (`canSeeFrom`) y la búsqueda de cobertura
 * (`findCoverPoint`). Escribir una segunda versión de cualquiera de esas tres
 * sería garantizar que se desincronicen la próxima vez que se toque una.
 *
 * EN QUÉ NO SE PARECE EN NADA, Y ES TODO EL DISEÑO:
 *
 *  1. NO TIENE SOSPECHA. Un guardia te va viendo; éste ya sabe. No hay barrita
 *     amarilla, no hay romper el contacto, no hay volver a patrullar. Perderlo
 *     de vista te da tiempo, nunca lo apaga.
 *
 *  2. TE RASTREA POR VAGÓN, NO POR PÍXEL. Sabe en cuál estás y va para allá;
 *     una vez adentro, para dispararte necesita verte de verdad, como
 *     cualquiera. Esa mitad es lo que impide que se sienta a telepatía:
 *     esconderte adentro del vagón SÍ funciona — lo que no funciona nunca es
 *     que se olvide de vos.
 *
 *  3. USA LA COBERTURA PARA ACERCARSE, NO PARA ESCONDERSE. Un guardia se
 *     parapeta y se queda a esperar que te asomes. Éste la usa como escalón
 *     para ganar terreno: se para atrás de algo, tira, y cuando te cubrís
 *     avanza al siguiente. Es la diferencia entre alguien que defiende un
 *     vagón y alguien que te viene a buscar.
 *
 *  4. TIENE UN MOVIMIENTO QUE NINGÚN GUARDIA TIENE: la embestida. Ver
 *     data/bosses.js para el porqué de cada número.
 */

import { CONFIG } from '../data/config.js';
import { distance, hasLineOfSight } from '../engine/collision.js';
import { canSeeFrom, viajarHacia, moveToward, turnTowards } from './ai.js';
import { findCoverPoint, findPeek } from './cover.js';
import { damagePlayer, isHidden, tumbar } from '../entities/player.js';

export function updateBoss(bo, dt, world) {
  bo.hitFlash = Math.max(0, bo.hitFlash - dt);
  if (!bo.alive) return;

  bo.invulnerable = Math.max(0, bo.invulnerable - dt);
  bo.cooldown = Math.max(0, bo.cooldown - dt);
  bo.embestidaCooldown = Math.max(0, bo.embestidaCooldown - dt);
  bo.faseTimer += dt;

  revisarFuria(bo, world);
  reaccionarAlGolpe(bo, dt);

  const player = world.player;

  /**
   * ¿Lo tenés a la vista? Se usa `useCone: false` a propósito, y es una de las
   * cosas que más lo distinguen de un guardia: no hay forma de ponerse a su
   * espalda. Un guardia mira para donde camina; un cazador que te está
   * buscando tiene la cabeza en 360°.
   *
   * Lo que SÍ lo tapa es lo mismo que a todos: una pared, un asiento, una
   * puerta cerrada, y estar parapetado del lado ciego (`canSeeFrom` respeta
   * la cobertura igual para él). Por eso esconderse sigue sirviendo.
   */
  /**
   * DESDE DÓNDE MIRA: si está parapetado, desde donde SE ASOMARÍA.
   *
   * Sin esto el sistema se comía la cola: `parapetarse` lo mete detrás de un
   * asiento —o sea, tapado por definición— y entonces "dejaba de verte", salía
   * de combate a los 0,7 s, volvía a cazar, se volvía a cubrir, y así en un
   * loop. Medido: se pasaba el 98% del tiempo pegado a una cobertura desde la
   * que nunca llegaba a asomarse (3%), o sea sin disparar casi nunca.
   *
   * Es la misma regla que ya usan los guardias (`probe` en `doCombat`,
   * systems/ai.js), y por el mismo motivo: cubrirse no puede significar
   * quedarse ciego, porque entonces cubrirse sería suicida para la IA.
   */
  const mirandoDesde = (bo.atCover && bo.coverPoint) ? posicionAsomado(bo) : bo;
  const teVe = player.alive && !player.enTecho &&
    canSeeFrom(
      mirandoDesde.x, mirandoDesde.y, bo.facing, player, world.map, false,
      bo.tipo.viewDistance
    );

  if (teVe) bo.lastSeen = { x: player.x, y: player.y };

  despertarloSiCorresponde(bo, world);

  switch (bo.fase) {
    case 'acecho':   faseAcecho(bo, dt, world); break;
    case 'aviso':    faseAviso(bo, dt, world); break;
    case 'carga':    faseCarga(bo, dt, world); break;
    case 'aturdido': faseAturdido(bo, dt); break;
    case 'combate':  faseCombate(bo, dt, world, teVe); break;
    default:         faseCaza(bo, dt, world, teVe); break;
  }
}

/**
 * ACECHO: te mide desde atrás y no hace nada más.
 *
 * No dispara —aunque su rifle llegaría desde acá— y no cierra la distancia.
 * Se queda a `acecho.distancia` del lado de la COLA, o sea entre vos y tu
 * caballo, que es donde va a estar cuando te decidas a volver.
 *
 * Lo que lo saca de acá está en `despertarloSiCorresponde`, que corre antes
 * que esto: que te pares a robar, que le quedes muy cerca, o que le tires.
 */
function faseAcecho(bo, dt, world) {
  const player = world.player;
  const a = bo.tipo.acecho;

  /**
   * Se planta a `distancia` DEL LADO DE LA COLA, siempre — nunca te pasa de
   * largo para acecharte desde adelante. Si te movés hacia él, no retrocede
   * más allá del borde del tren: se queda ahí, y ahí lo alcanzás vos, que es
   * lo que dispara la pelea.
   */
  const objetivoX = Math.max(20, player.x - a.distancia);

  // Camina, no corre: a media velocidad. Que se lo vea moverse tranquilo es
  // justamente lo que hace que dé más miedo que si viniera al trote.
  moveToward(bo, objetivoX, player.y, bo.tipo.speed * 0.55, dt, world.map);

  // Siempre mirándote. No patrulla, no mira para otro lado: te mide.
  turnTowards(bo, Math.atan2(player.y - bo.y, player.x - bo.x), dt, 3);

  bo.armaActual = 'rifle';

  /**
   * EL SONIDO DEL ACECHO — la otra mitad del arreglo de `acecho.distancia`.
   *
   * *(Santi: "no sentí incomodidad alguna. Se podría añadir cosas como
   * ruidos de pisadas, la madera crujiendo")*
   *
   * Aunque ahora entra en cámara (ver data/bosses.js), un sprite silencioso a
   * 170px no genera tensión por sí solo — hace falta que se OIGA que hay
   * algo ahí atrás, sobre todo en los instantes en que la cámara lo saca de
   * cuadro por el suavizado. Suena cada 2-3 segundos, no en loop: un crujido
   * constante deja de notarse enseguida, uno intermitente sigue sorprendiendo.
   */
  bo.sonidoAcechoTimer -= dt;
  if (bo.sonidoAcechoTimer <= 0) {
    world.audio.play('acechando');
    bo.sonidoAcechoTimer = world.rng.range(2.0, 3.2);
  }
}

/**
 * ¿SE ACABÓ EL ACECHO?
 *
 * Tres cosas lo despiertan, y las tres son cosas que hacés VOS. Ninguna es un
 * temporizador: el acecho no se termina solo, se termina cuando le das un
 * motivo. Por eso quedarse quieto y callado es, por primera vez en el juego,
 * una forma de que un enemigo NO venga.
 */
function despertarloSiCorresponde(bo, world) {
  if (bo.fase !== 'acecho') return;

  const a = bo.tipo.acecho;
  const player = world.player;
  let motivo = null;

  // 1. Te paraste a robar. El disparador principal (ver data/bosses.js).
  if (a.atacaSiRobas && world.robando) motivo = 'robando';

  /**
   * 2. Le quedaste encima. Pide `faseTimer > 1.5` por un motivo concreto que
   *    apareció midiendo: el jefe sube por la COLA, y si vos todavía estás
   *    cerca de la cola (dejaste el caballo ahí y no avanzaste), no hay lugar
   *    físico para que nazca a `acecho.distancia` — nace pegado al borde del
   *    tren, o sea
   *    encima tuyo, y se despertaba EN EL PRIMER CUADRO. Medido: nunca llegaba
   *    a acechar ni un segundo.
   *
   *    Con el margen, esta condición pasa a significar lo que tenía que
   *    significar desde el principio: **te acercaste vos**, no "nació cerca".
   */
  else if (bo.faseTimer > 1.5 &&
           distance(bo.x, bo.y, player.x, player.y) < a.distanciaQueLoGatilla) {
    motivo = 'cerca';
  }

  // 3. Le disparaste. No se deja acechar de vuelta.
  else if (bo.health < bo.maxHealth) motivo = 'herido';

  if (!motivo) return;

  irA(bo, 'caza');
  world.audio.play('cock');
  world.camera.shake(1.6, 0.3);
  world.bus.emit('bossDespierta', { boss: bo, motivo });
}

/** Cambiar de fase en un solo lugar: así el timer nunca queda sin reiniciar. */
function irA(bo, fase) {
  bo.fase = fase;
  bo.faseTimer = 0;
}

/**
 * LA FURIA. Se dispara una sola vez, al cruzar la mitad de la vida.
 *
 * Lo único que cambia son los cooldowns (ver data/bosses.js): hace lo mismo,
 * más seguido. Los tiempos de AVISO no se tocan — un jefe que deja de
 * telegrafiar deja de ser justo, y este juego no tiene un solo peligro que no
 * se pueda ver venir.
 */
function revisarFuria(bo, world) {
  if (bo.enFuria || bo.health > bo.tipo.furia.mitad) return;

  bo.enFuria = true;
  bo.invulnerable = bo.tipo.furia.invulnerable;
  bo.embestidaCooldown = Math.min(bo.embestidaCooldown, 1.0);

  world.audio.play('scream');
  world.camera.shake(3.0, 0.4);
  world.bus.emit('bossEnraged', { boss: bo });
}

/**
 * ¿LE PEGASTE? ENTONCES TE EMBISTE.
 *
 * Se detecta comparando la vida contra el cuadro anterior en vez de engancharse
 * a `damageEnemy`, porque esa función es de la entidad y no ve el mundo — y
 * porque así funciona igual venga el golpe de donde venga: una bala, el
 * cuchillo o una dinamita.
 *
 * Es la respuesta al problema medido de que cuatro balazos seguidos son 1,2
 * segundos y ninguna IA sobrevive a eso (ver `cooldownTrasGolpe` en
 * data/bosses.js). No le sube la vida ni la puntería: le quita al jugador la
 * posibilidad de quedarse parado apretando el gatillo.
 *
 * No interrumpe una embestida en curso — sólo destraba la siguiente.
 */
function reaccionarAlGolpe(bo, dt) {
  bo.bajoFuegoTimer = Math.max(0, bo.bajoFuegoTimer - dt);

  if (bo.health >= bo.vidaPrevia) { bo.vidaPrevia = bo.health; return; }
  bo.vidaPrevia = bo.health;

  /**
   * QUE LE ACABÁS DE DISPARAR. Mientras esto sigue arriba de 0, si tiene que
   * acercarse lo hace cubriéndose (`avanzarConCobertura`); si se agota, corre
   * derecho. Es lo que separa "me estás tiroteando mientras me acerco" de
   * "me estás huyendo y no hay nada de qué cuidarse" — ver el porqué completo
   * donde se usa, en faseCombate.
   */
  bo.bajoFuegoTimer = 2.5;

  if (bo.fase === 'aviso' || bo.fase === 'carga' || bo.fase === 'aturdido') return;

  bo.embestidaCooldown = Math.min(
    bo.embestidaCooldown,
    bo.tipo.embestida.cooldownTrasGolpe
  );
}

/** El cooldown del disparo, ya con la furia aplicada. */
function cadencia(bo, arma) {
  return arma.fireCooldown * (bo.enFuria ? bo.tipo.furia.disparoMult : 1);
}

/** Qué arma le toca a esta distancia. Ver `corteDeArma` en data/bosses.js. */
function armaPara(bo, dist) {
  return dist > bo.tipo.corteDeArma ? bo.tipo.rifle : bo.tipo.revolver;
}

// ------------------------------------------------------------------- rastreo

/**
 * A DÓNDE VA CUANDO NO TE VE: al centro del vagón donde estás.
 *
 * No es tu posición exacta, y la diferencia importa. Con tu `x` real, meterte
 * atrás de un asiento no serviría de nada: caminaría hasta pisarte. Con el
 * centro del vagón, llega hasta donde estás y ahí tiene que BUSCARTE — y ahí
 * es donde tu cobertura vuelve a valer algo.
 *
 * Cuando SÍ te ve, en cambio, va a donde estás: ya no hace falta rastrear
 * nada, te tiene enfrente.
 */
function rastrear(bo, world) {
  const train = world.train;
  const player = world.player;
  if (!train) return { x: player.x, y: player.y };

  const idx = train.wagonAt(player.x);
  bo.ultimoVagon = idx;
  const w = train.wagons[idx];
  if (!w) return { x: player.x, y: player.y };

  /**
   * Se apunta al borde del vagón que le queda más cerca, no al centro
   * geométrico: si apuntara al centro y vos estuvieras en la otra punta,
   * cruzaría medio vagón de más y se pasaría de largo, que se lee como que
   * no sabe lo que hace.
   */
  const destinoX = Math.max(w.x + 20, Math.min(w.x + w.width - 20, player.x));
  return { x: destinoX, y: player.y };
}

// --------------------------------------------------------------------- fases

/**
 * CAZA: no te ve. Va hacia tu vagón por el camino que haya, cruzando puertas
 * y vagones enteros si hace falta (`viajarHacia`, el mismo buscador de rutas
 * que usan los guardias que te persiguen).
 */
function faseCaza(bo, dt, world, teVe) {
  if (teVe) { irA(bo, 'combate'); return; }

  const destino = rastrear(bo, world);
  bo.destino = destino;
  const movido = viajarHacia(bo, dt, world, destino.x, destino.y, bo.tipo.speed);

  /**
   * ¿SE TRABÓ CONTRA UNA PUERTA CERRADA? LA EMBISTE. Blindada o trabada —
   * ver `puertaBlindadaEn` más abajo, que ahora entiende las dos.
   *
   * Esto hubo que agregarlo después de medirlo, y el motivo es una
   * interacción que no se veía venir: una puerta cerrada TAPA LA VISTA, así
   * que parado frente a ella el jefe nunca "te ve" — nunca entra en combate,
   * y la embestida (que sólo se disparaba en combate) no arrancaba jamás.
   * Medido: 20 s empujando la puerta sin romperla nunca.
   *
   * Y desde que el propio jefe traba el tren al despertar (`trabarPuertasDelTren`
   * en raidScene.js), esto pasó a ser doblemente necesario: sin esto se
   * encerraría a sí mismo con sus propias puertas.
   *
   * El arreglo es también el diseño correcto, y por eso vive acá y no en
   * `consideraEmbestir`: **no está embistiendo al jugador, está rompiendo lo
   * que le corta el paso.** Son dos usos distintos del mismo movimiento, y
   * este segundo es el que sostiene la promesa de que a este tipo no lo para
   * una puerta.
   *
   * Además usa el cooldown corto: la puerta no es una pelea, es un trámite.
   */
  const trabado = movido < 0.15;
  bo.stuckTimer = trabado ? bo.stuckTimer + dt : 0;

  if (bo.stuckTimer > 0.45 && bo.tipo.embestida.rompePuertaBlindada) {
    const haciaDestino = Math.atan2(destino.y - bo.y, destino.x - bo.x);
    const puerta = puertaBlindadaEn(
      world,
      bo.x + Math.cos(haciaDestino) * 22,
      bo.y + Math.sin(haciaDestino) * 22
    );
    if (puerta) {
      bo.facing = haciaDestino;
      bo.cargaDir = { x: Math.cos(haciaDestino), y: Math.sin(haciaDestino) };
      bo.stuckTimer = 0;
      irA(bo, 'aviso');
      world.audio.play('cover');
      world.bus.emit('bossEmbiste', { boss: bo, contraPuerta: true });
    }
  }
}

/**
 * COMBATE: te tiene a la vista.
 *
 * El orden de las decisiones es el diseño, no una casualidad:
 *
 *  1. ¿Podés embestir? Primero, porque es lo que castiga que te escondas.
 *  2. ¿Estás lejos? Entonces acercarse cubriéndose, tirando el rifle en el
 *     camino.
 *  3. ¿Estás cerca? Revólver, y no dejar que le saques distancia.
 */
function faseCombate(bo, dt, world, teVe) {
  const player = world.player;

  /**
   * Te perdió de vista. NO vuelve a patrullar ni se olvida: vuelve a rastrear,
   * que es su estado natural. Lo único que ganaste es tiempo.
   *
   * `sinVerte` es un contador propio y no `faseTimer`, y la diferencia era un
   * bug: `faseTimer` mide desde que ENTRÓ en combate, así que si llevaba diez
   * segundos peleando, el primer cuadro en que lo perdías de vista ya cumplía
   * la condición y abandonaba al instante. Ahora mide lo que tiene que medir:
   * cuánto hace que no te ve.
   */
  if (!teVe) {
    bo.sinVerte += dt;
    if (bo.sinVerte > 1.5) {
      irA(bo, 'caza');
      bo.coverPoint = null;
      bo.atCover = false;
      bo.peeking = false;

      /**
       * 🐛 LO DEVOLVEMOS AL CENTRO DEL PASILLO. Sin esto quedaba ENCAJADO.
       *
       * Encontrado con el pathfinding puro funcionando perfecto en aislado
       * (390px en 5s, exacto) pero la máquina de estados completa moviéndose
       * casi 0 en el mismo tiempo. La diferencia: `parapetarse` lo deja
       * parado en `coverPoint`, que suele estar contra un asiento (`y` lejos
       * de 80, el centro del pasillo). Al perderte de vista y volver a
       * `caza`, arrancaba a recalcular ruta desde ESA posición — pegado a
       * una fila de asientos, a veces con el propio hitbox superpuesto con
       * la baldosa sólida — y de ahí ni el buscador de rutas podía sacarlo.
       *
       * Se corrige en este instante preciso y no en otro lado a propósito:
       * es el único momento en que sabemos que NO te ve (`sinVerte > 1,5`),
       * así que el salto es invisible para vos. Volver al pasillo es lo que
       * ya hacía naturalmente cuando te perseguía por primera vez.
       */
      bo.y = CONFIG.techo.centroY;
      return;
    }
    if (bo.lastSeen && !bo.atCover) {
      moveToward(bo, bo.lastSeen.x, bo.lastSeen.y, bo.tipo.speed, dt, world.map);
    }
    return;
  }
  bo.sinVerte = 0;

  const dist = distance(bo.x, bo.y, player.x, player.y);
  turnTowards(bo, Math.atan2(player.y - bo.y, player.x - bo.x), dt, 11);

  if (consideraEmbestir(bo, world, dist)) return;

  const arma = armaPara(bo, dist);
  bo.armaActual = arma === bo.tipo.rifle ? 'rifle' : 'revolver';

  /**
   * ¿YA ESTÁ EN SU DISTANCIA? ENTONCES SE PARAPETA.
   *
   * Esto es lo que arregla "es MUY FÁCIL matarlo". Antes se quedaba disparando
   * parado en el medio del pasillo: un blanco grande y quieto que se come el
   * tambor entero sin que haya que hacer nada. Ahora, cuando no tiene que
   * avanzar ni retroceder, busca un asiento y sólo se expone al asomarse.
   *
   * No le sube la vida (sigue en 4): le sube cuántas de tus balas llegan a
   * tocarlo. Matarlo pasa a pedir flanquearlo o cazarlo aturdido — la mecánica
   * central del juego, que esta pelea no estaba usando.
   */
  const enSuDistancia = dist >= bo.tipo.corteDeArma &&
    dist <= bo.tipo.distanciaDeTrabajo;

  /**
   * SI YA ESTÁ DETRÁS DE ALGO, LO USA — esté a la distancia que esté.
   *
   * El `bo.atCover` de la condición es la parte que faltaba. Antes esto
   * preguntaba SÓLO por `enSuDistancia`, así que cuando venía acercándose y
   * se metía detrás de un asiento, la rama de abajo le borraba la cobertura
   * en el mismo cuadro (`atCover = false`) y volvía a salir al pasillo.
   * Cubrirse y avanzar se estaban peleando entre ellos.
   */
  if (enSuDistancia || bo.atCover) {
    parapetarse(bo, dt, world, player, arma, dist);
    return;
  }

  // Ni cubierto ni en su distancia: está yendo a algún lado.
  bo.peeking = false;

  disparar(bo, dt, world, arma, dist);

  /**
   * DÓNDE SE PARA. Tres zonas, y la tercera es la que lo hace un jefe:
   *
   *  - Más lejos que `distanciaDeTrabajo`: avanza cubriéndose. No está
   *    defendiendo un vagón, está cerrando distancia — es la diferencia más
   *    grande contra un guardia, que se planta en su cobertura y espera.
   *  - En la zona de trabajo: se queda y te trabaja a tiros.
   *  - **Más cerca que `alcanceMin`: RETROCEDE.** Se separa para tomar
   *    carrera. Sin esto se pegaba a ~54 px, donde la embestida no puede
   *    arrancar (necesita 60 de carrera) y el revólver casi no falla: medido,
   *    cero embestidas en 45 s y un jugador quieto muerto en 4,0 s. Ver
   *    `distanciaDeTrabajo` en data/bosses.js.
   *
   * Y le da al jugador una jugada propia: pegársele lo saca de su mejor
   * distancia, a cambio de comerse el revólver de cerca.
   */
  if (bo.aimTimer > 0) return;

  /**
   * SE SEPARA APENAS LE QUEDÁS ADENTRO DE `corteDeArma`, no recién cuando ya
   * no puede embestir. Es una diferencia de 30 px que cambió toda la pelea:
   *
   * Con el umbral en `alcanceMin` (60), después de cada embestida quedaba a
   * ~66 px y se quedaba ahí — o sea, permanentemente en zona de revólver, que
   * es justo su arma más letal. Medido: 64,7% de sus balas pegaban y mataba a
   * un jugador quieto en 4,1 s.
   *
   * Con el umbral en `corteDeArma` (90) vuelve solo a la distancia donde su
   * diseño dice que quiere pelear (el rifle). El revólver deja de ser su
   * estado natural y pasa a ser lo que saca cuando VOS le quedaste encima,
   * que es lo que el corte de arma quería decir desde el principio.
   */
  if (dist < bo.tipo.corteDeArma) {
    /**
     * SÓLO RETROCEDE SI ESTÁ BAJO FUEGO. Si no, te agarró — déjalo pelear.
     *
     * Encontrado en la misma vuelta que el problema de `avanzarConCobertura`:
     * esta retirada se pensó para cuando VOS te le acercás mientras le
     * disparás desde lejos (sacarlo de zona de revólver). Pero la condición
     * (`dist < corteDeArma`) no distingue esa situación de la contraria — que
     * ÉL te haya alcanzado a VOS después de perseguirte. En ese segundo caso,
     * retroceder es lo peor posible: justo cuando por fin te agarró, cede el
     * terreno que tanto le costó ganar. Medido: con esto activo, perseguir a
     * un jugador que huye sin dispararle nunca lo dejaba en ~26 px/s de
     * cierre efectivo — un tercio de su propia velocidad.
     *
     * Mismo candado que la cobertura: si no le disparaste hace poco, no hay
     * de qué cuidarse. Se queda donde está y pelea con el revólver — ya lo
     * está disparando arriba (`disparar`, unas líneas más arriba). Agarrarte
     * tiene que sentirse como que te agarró, no como que lo esquivaste solo.
     */
    if (bo.bajoFuegoTimer > 0) {
      const hacia = Math.atan2(bo.y - player.y, bo.x - player.x);
      moveToward(
        bo,
        bo.x + Math.cos(hacia) * 40,
        bo.y + Math.sin(hacia) * 40,
        bo.tipo.speed * 0.85, dt, world.map
      );
      turnTowards(bo, Math.atan2(player.y - bo.y, player.x - bo.x), dt, 11);
      bo.coverPoint = null;
    }
  } else if (dist > bo.tipo.distanciaDeTrabajo) {
    /**
     * ¿ESTÁ BAJO FUEGO, O SÓLO TE ESTÁ ALCANZANDO?
     *
     * Encontrado midiendo el arreglo de velocidad: igualar su número a
     * `CONFIG.player.speed` no alcanzaba, porque `avanzarConCobertura` no
     * corre en línea recta — va saltando de escondite en escondite, con
     * paradas para reubicarse. Esa cautela tiene sentido cuando le estás
     * disparando mientras se acerca (para eso se construyó, ver más abajo).
     * NO tiene sentido cuando estás huyendo y no hay un solo tiro en el aire:
     * ahí sólo lo frena por debajo de su propia velocidad, y la brecha crece
     * sola. Medido: ~66 px/s de brecha aunque las velocidades ya estaban
     * igualadas — a los pocos segundos de huida, inalcanzable.
     *
     * `bajoFuegoTimer` lo puso `reaccionarAlGolpe`, así que esto se reduce a
     * una pregunta simple: ¿le pegaste hace poco? Si sí, se cubre para
     * cerrar distancia sin regalarte un tiro limpio — el problema original
     * que `avanzarConCobertura` vino a resolver. Si no, no hay de qué
     * cuidarse: corre directo, a toda velocidad, como el que te viene
     * cazando de verdad.
     */
    if (bo.bajoFuegoTimer > 0) {
      avanzarConCobertura(bo, dt, world, player);
    } else if (dist > CONFIG.enemy.routeDistance) {
      viajarHacia(bo, dt, world, player.x, player.y, bo.tipo.speed);
    } else {
      moveToward(bo, player.x, player.y, bo.tipo.speed, dt, world.map);
    }
  }
}

/**
 * AVISO: se plantó y va a embestir. Cero movimiento — eso es justamente lo que
 * lo hace leíble. Sigue girando MUY despacio hacia vos: lo suficiente para que
 * no se le pueda esquivar simplemente caminando de costado desde el primer
 * cuadro, y demasiado poco para que valga la pena quedarse a ver qué pasa.
 */
function faseAviso(bo, dt, world) {
  const player = world.player;
  const t = bo.tipo.embestida;

  turnTowards(bo, Math.atan2(player.y - bo.y, player.x - bo.x), dt, 1.4);
  bo.cargaDir = { x: Math.cos(bo.facing), y: Math.sin(bo.facing) };

  if (bo.faseTimer >= t.aviso) {
    irA(bo, 'carga');
    bo.cargaRecorrido = 0;
    bo.yaGolpeoEnEstaCarga = false;
    bo.cargaObjetivo = t.alcanceMax;
    world.audio.play('cock');
  }
}

/**
 * CARGA: sale disparado en línea recta. NO te persigue — la dirección quedó
 * fijada en el aviso. Es lo que convierte esquivarla en una decisión de
 * posición (leí para dónde encara y me salgo de ahí) en vez de una carrera
 * que no se puede ganar.
 */
function faseCarga(bo, dt, world) {
  const t = bo.tipo.embestida;
  const player = world.player;

  const paso = t.velocidad * dt;
  const antesX = bo.x;
  const antesY = bo.y;

  const solid = world.map.isSolidForMovementAt || world.map.isSolidAt;
  const nx = bo.x + bo.cargaDir.x * paso;
  const ny = bo.y + bo.cargaDir.y * paso;

  const choco = solid(nx, ny);

  /**
   * LA PUERTA DE CHAPA DEL BLINDADO SE LA LLEVA PUESTA. Es lo único además de
   * la dinamita que la abre — y queda rota para siempre, así que si lo llevás
   * hasta ahí te está abriendo el vagón más caro del tren. No es un regalo:
   * para cobrarlo hay que sobrevivir adentro.
   */
  if (choco && t.rompePuertaBlindada) {
    const puerta = puertaBlindadaEn(world, nx, ny);
    if (puerta) {
      puerta.broken = true;
      puerta.open = true;
      world.audio.play('explosion');
      world.camera.shake(4, 0.35);
      world.bus.emit('bossRompioPuerta', { x: puerta.x, y: puerta.y, door: puerta });
      world.bus.emit('noise', { x: puerta.x, y: puerta.y, radius: t.ruido });
    }
  }

  if (!choco) {
    bo.x = nx;
    bo.y = ny;
  }

  bo.cargaRecorrido += Math.hypot(bo.x - antesX, bo.y - antesY);

  // ¿Te agarró? Una sola vez por carga: que te pise dos veces el mismo
  // envión sería el mismo error que ya se corrigió con los barriles.
  if (!bo.yaGolpeoEnEstaCarga && player.alive &&
      distance(bo.x, bo.y, player.x, player.y) < bo.hw + player.hw + 3) {
    atropellar(bo, world);
  }

  const frenoSeco = choco && !puertaBlindadaEn(world, nx, ny);
  if (frenoSeco || bo.cargaRecorrido >= bo.cargaObjetivo) {
    /**
     * SI NO TE AGARRÓ, PAGA. Ésta es la ventana de castigo, y es el corazón
     * de toda la pelea: esquivar la embestida no te salva nomás, te REGALA el
     * mejor segundo del asalto. Si te agarró, en cambio, sigue como si nada —
     * el que quedó en el piso sos vos.
     */
    if (bo.yaGolpeoEnEstaCarga) {
      irA(bo, 'combate');
      bo.embestidaCooldown = cooldownEmbestida(bo);
    } else {
      irA(bo, 'aturdido');
      if (frenoSeco) {
        world.camera.shake(2.4, 0.25);
        world.bus.emit('noise', { x: bo.x, y: bo.y, radius: t.ruido });
      }
    }
  }
}

/** Aturdido: no piensa, no apunta, no dispara. Pegale. */
function faseAturdido(bo, dt) {
  if (bo.faseTimer >= bo.tipo.embestida.aturdidoAlFallar) {
    irA(bo, 'combate');
    bo.embestidaCooldown = cooldownEmbestida(bo);
  }
}

function cooldownEmbestida(bo) {
  return bo.enFuria ? bo.tipo.furia.embestidaCooldown : bo.tipo.embestida.cooldown;
}

// --------------------------------------------------------------- la embestida

/**
 * ¿ARRANCA UNA EMBESTIDA?
 *
 * Dos caminos para llegar acá, y el segundo es el importante:
 *
 *  - Se le cumplió el cooldown normal y estás a tiro de carga.
 *  - **Estás parapetado y no consigue dispararte.** Ahí no espera el cooldown
 *    entero (`cooldownSiEstasCubierto`): la embestida es justamente su
 *    respuesta a que te escondas. Es el mismo espíritu que la dinamita de los
 *    guardias del blindado — el jefe tiene una herramienta para castigar
 *    quedarse quieto detrás de un asiento, y por eso la cobertura contra él
 *    es un respiro y no una solución.
 */
function consideraEmbestir(bo, world, dist) {
  const t = bo.tipo.embestida;
  if (dist < t.alcanceMin || dist > t.alcanceMax) return false;
  if (bo.embestidaCooldown > 0) return false;

  /**
   * No embiste si hay una pared en el medio: la carga es en línea recta, así
   * que hacerlo sería salir corriendo a estrellarse contra un asiento. Se
   * pregunta por la geometría real del mapa (`tileBlocksSightAt`, el original
   * SIN puertas): las puertas no son un motivo para no cargar — las abre de
   * un envión, y la de chapa la rompe.
   */
  const bloquea = world.tileBlocksSightAt || world.map.blocksSightAt;
  if (!hasLineOfSight(bo.x, bo.y, world.player.x, world.player.y, bloquea)) return false;

  irA(bo, 'aviso');
  bo.cargaDir = { x: Math.cos(bo.facing), y: Math.sin(bo.facing) };
  bo.aimTimer = 0;
  bo.burstLeft = 0;
  world.audio.play('cover');
  world.bus.emit('bossEmbiste', { boss: bo });
  return true;
}

function atropellar(bo, world) {
  const t = bo.tipo.embestida;
  const player = world.player;

  bo.yaGolpeoEnEstaCarga = true;

  /**
   * TE TIRA AL PISO. Se reusa `tumbar()`, el mismo estado que ya te deja un
   * barril del tren veloz (entities/player.js): te suelta de la cobertura, te
   * manda despedido y te deja sin poder disparar, moverte ni cubrirte. No hizo
   * falta inventar nada — y significa que el jugador ya sabe leer lo que le
   * pasó, porque es exactamente el mismo porrazo que ya conoce.
   *
   * Va ANTES del daño a propósito: `tumbar` te suelta la cobertura, y
   * `damagePlayer` sólo aplica el envión si no estás cubierto. Al revés, el
   * empujón del golpe se perdía justo cuando el tipo te embistió de lleno.
   */
  const tumbo = tumbar(player, bo.x, world);
  if (tumbo) {
    // Su empujón es más largo que el de un barril, y en furia todavía más.
    const empuje = t.empuje * (bo.enFuria ? bo.tipo.furia.empujeMult : 1);
    player.knockX = bo.cargaDir.x * empuje;
    player.knockY = bo.cargaDir.y * empuje;
    // Y te levantás antes que de un barril (1,5 s): el suyo es un golpe seco,
    // no que te pase media tonelada de carga por encima.
    player.tumbado = t.tumbaAlJugador;
  }

  if (damagePlayer(player, t.danio, bo.x, bo.y)) {
    world.bus.emit('playerHit', { x: player.x, y: player.y });
    if (!player.alive) world.bus.emit('playerDown', {});
  }

  world.camera.shake(4.5, 0.4);
  world.audio.play('hitFlesh');
  world.bus.emit('noise', { x: bo.x, y: bo.y, radius: t.ruido });
}

/**
 * La puerta que lo está frenando en este punto, si hay alguna: la blindada, o
 * una trabada de las que él mismo cerró al despertar. No se encierra a sí
 * mismo — si el tren se cerró es cosa suya, así que la rompe igual que a la
 * de chapa.
 */
function puertaBlindadaEn(world, x, y) {
  if (!world.doors) return null;
  for (const d of world.doors) {
    if ((d.kind === 'blindada' || d.trabada) && !d.broken &&
        Math.abs(x - d.x) < d.hw && Math.abs(y - d.y) < d.hh) {
      return d;
    }
  }
  return null;
}

// ----------------------------------------------------------------- el disparo

function disparar(bo, dt, world, arma, dist) {
  const player = world.player;

  // Ya está apuntando: termina el gesto. Si te escondiste a tiempo, el tiro
  // sale igual y pasa de largo — esa es la ventana que te da el aviso.
  if (bo.aimTimer > 0) {
    bo.aimTimer -= dt;
    if (bo.aimTimer <= 0) soltarBala(bo, world, arma);
    return;
  }

  // Ráfaga en curso (sólo el revólver tiene más de un tiro).
  if (bo.burstLeft > 0) {
    bo.burstTimer -= dt;
    if (bo.burstTimer <= 0) soltarBala(bo, world, arma);
    return;
  }

  if (bo.cooldown > 0) return;
  if (dist > arma.range) return;
  if (isHidden(player)) return;

  bo.aimTimer = arma.aimTime;
  bo.aimDir = Math.atan2(player.y - bo.y, player.x - bo.x);
  bo.burstLeft = arma.burstSize;
  world.audio.play('cock');
}

function soltarBala(bo, world, arma) {
  const angulo = bo.aimDir + world.rng.spread(arma.spread + (world.dispersionExtra || 0));

  world.spawnBullet({
    x: bo.x + Math.cos(bo.facing) * 10,
    y: bo.y + Math.sin(bo.facing) * 10,
    angle: angulo,
    speed: arma.bulletSpeed,
    damage: bo.tipo.danioBala,
    range: arma.range,
    owner: 'enemy',
  });

  world.audio.play('enemyShot');
  world.camera.shake(0.6, 0.08);

  /**
   * SU RIFLE DESPIERTA MEDIO TREN. `noiseWagons: 2` contra el 1 del Colt: su
   * sola presencia te empeora el tren aunque no te pegue nunca, porque cada
   * tiro suyo le avisa a dos vagones para cada lado. Pelearlo a los tiros
   * tiene un costo que no es tu vida — es la gente que se despierta atrás
   * tuyo, entre vos y el caballo.
   */
  world.bus.emit('noise', {
    x: bo.x, y: bo.y,
    radius: CONFIG.enemy.hearRadius,
    wagons: arma.noiseWagons,
    deJefe: true,
  });

  bo.burstLeft -= 1;
  if (bo.burstLeft > 0) {
    bo.burstTimer = arma.burstDelay;
  } else {
    bo.cooldown = cadencia(bo, arma);
  }
}

// ---------------------------------------------------------------- cobertura

/** Dónde queda cuando se asoma. Mismo cálculo que usan los guardias. */
function posicionAsomado(bo) {
  return {
    x: bo.coverPoint.x + bo.peekAxis.x * bo.peekOffset * bo.peekSide,
    y: bo.coverPoint.y + bo.peekAxis.y * bo.peekOffset * bo.peekSide,
  };
}

/**
 * PARAPETARSE Y TIRAR ASOMÁNDOSE.
 *
 * El mismo ciclo que un guardia (`holdCoverAndFire` en systems/ai.js) —
 * escondido, se asoma, dispara, se vuelve a esconder— pero con sus propios
 * tiempos: se esconde menos y se asoma más seguido (ver `cobertura` en
 * data/bosses.js). No comparte la función con los guardias porque el jefe no
 * tiene ni sospecha, ni fuego de contención, ni compañeros a los que no
 * dispararles: la mitad de `holdCoverAndFire` no le aplica.
 *
 * La cobertura le sirve por GEOMETRÍA, igual que a todos: se mete detrás de
 * un asiento y tus balas mueren contra el asiento. No hay ninguna regla nueva
 * que diga "estando cubierto recibe menos daño" — eso sería el tipo de cosa
 * invisible que este juego no hace.
 */
function parapetarse(bo, dt, world, player, arma, dist) {
  const c = bo.tipo.cobertura;

  // --- ¿Necesita una cobertura nueva? ---
  bo.repositionTimer += dt;
  const necesita = !bo.coverPoint ||
    (bo.atCover && bo.repositionTimer > c.repositionAfter);

  if (necesita) {
    bo.repositionTimer = 0;
    const taken = [];
    for (const other of world.enemies) {
      if (other !== bo && other.alive && other.coverPoint) taken.push(other.coverPoint);
    }
    const spot = findCoverPoint(world.map, bo.x, bo.y, player.x, player.y, taken);

    if (!spot) {
      // Sin nada donde meterse (el pasillo pelado): pelea a campo abierto.
      bo.coverPoint = null;
      bo.atCover = false;
      disparar(bo, dt, world, arma, dist);
      return;
    }
    if (!bo.coverPoint || distance(spot.x, spot.y, bo.coverPoint.x, bo.coverPoint.y) > 8) {
      bo.coverPoint = spot;
      bo.atCover = false;
      bo.peeking = false;
    }
  }

  // --- Yendo hacia la cobertura ---
  if (bo.coverPoint && !bo.atCover) {
    const movido = moveToward(bo, bo.coverPoint.x, bo.coverPoint.y, bo.tipo.speed, dt, world.map);
    bo.stuckTimer = movido < 0.15 ? bo.stuckTimer + dt : 0;

    if (distance(bo.x, bo.y, bo.coverPoint.x, bo.coverPoint.y) < 6) {
      bo.atCover = true;
      bo.stuckTimer = 0;
      bo.holdTimer = world.rng.range(c.holdMin * 0.4, c.holdMax * 0.6);
      elegirAsomada(bo, world, player);
    } else if (bo.stuckTimer > 1.0) {
      bo.coverPoint = null;     // no llega: que pelee de frente
      bo.stuckTimer = 0;
    }
    return;
  }

  if (!bo.coverPoint) { disparar(bo, dt, world, arma, dist); return; }

  // --- Ya está detrás: alterna escondido / asomado ---
  const ancla = bo.peeking ? posicionAsomado(bo) : bo.coverPoint;
  moveToward(bo, ancla.x, ancla.y, bo.tipo.speed * 1.4, dt, world.map);
  turnTowards(bo, Math.atan2(player.y - bo.y, player.x - bo.x), dt, 10);

  if (bo.peeking) {
    disparar(bo, dt, world, arma, dist);
    // Terminó la ráfaga: se vuelve a meter.
    if (bo.burstLeft <= 0 && bo.aimTimer <= 0 && bo.cooldown > 0) {
      bo.peeking = false;
      bo.holdTimer = world.rng.range(c.holdMin, c.holdMax);

      /**
       * Y SI TODAVÍA ESTÁ LEJOS, SUELTA ESTA COBERTURA PARA BUSCAR LA
       * SIGUIENTE. Es lo que convierte "cubrirse" en "avanzar cubriéndose":
       * tira desde donde está, y en cuanto termina la ráfaga sale hacia
       * adelante. Sin esto se quedaría clavado a media distancia disparando
       * para siempre, que es un guardia, no un cazador.
       */
      if (dist > bo.tipo.distanciaDeTrabajo) {
        bo.coverPoint = null;
        bo.atCover = false;
      }
    }
    return;
  }

  bo.holdTimer -= dt;
  if (bo.holdTimer <= 0 && bo.cooldown <= 0) {
    // Si desde acá ya no hay ángulo, suelta la cobertura y busca otra.
    if (!elegirAsomada(bo, world, player)) return;
    bo.peeking = true;
  }
}

/**
 * Recalcula por qué lado asomarse (vos te movés). Devuelve false si desde esta
 * cobertura ya no hay tiro posible: ahí la abandona en vez de quedarse
 * trabado mirando una pared, igual que hacen los guardias.
 */
function elegirAsomada(bo, world, player) {
  const peek = findPeek(world.map, bo.coverPoint, player.x, player.y, bo.tipo.cobertura.peekSteps);
  if (!peek) {
    bo.coverPoint = null;
    bo.atCover = false;
    bo.peeking = false;
    bo.repositionTimer = 0;
    return false;
  }
  bo.peekAxis = peek.axis;
  bo.peekSide = peek.side;
  bo.peekOffset = peek.offset;
  return true;
}

// ---------------------------------------------------------------- movimiento

/**
 * AVANZAR CUBRIÉNDOSE.
 *
 * La cobertura acá no es un refugio, es un escalón. Busca una posición
 * cubierta que esté MÁS CERCA tuyo que donde está parado y va hacia ella; si
 * no hay ninguna que lo acerque, va derecho igual. Un guardia elige la mejor
 * cobertura disponible y se queda; éste sólo acepta las que le ganan terreno.
 *
 * Esa diferencia de una línea (`ganaTerreno`) es lo que hace que se lea como
 * un cazador y no como un guardia con más vida.
 */
function avanzarConCobertura(bo, dt, world, player) {
  bo.repositionTimer += dt;

  const necesita = !bo.coverPoint || bo.repositionTimer > 1.0;
  if (necesita) {
    bo.repositionTimer = 0;
    const taken = [];
    for (const other of world.enemies) {
      if (other !== bo && other.alive && other.coverPoint) taken.push(other.coverPoint);
    }
    const spot = findCoverPoint(world.map, bo.x, bo.y, player.x, player.y, taken);

    /**
     * ACEPTA CUALQUIER COBERTURA QUE NO LO ALEJE, no sólo las que le ganan
     * terreno claramente.
     *
     * La primera versión exigía que la cobertura estuviera 10 px más cerca
     * tuyo; como eso falla seguido, terminaba yendo DERECHO por el pasillo —
     * o sea, caminando de frente justo por donde estás apuntando. Medido: le
     * disparabas apenas lo veías y moría en 1,9 s con 4 balas, **sin llegar a
     * cubrirse una sola vez (0%)**. Ahí estaba el "es MUY FÁCIL matarlo".
     *
     * El diseño acordado de este tipo ya decía *"usa la cobertura para
     * acercarse, no para dispararte"* (NOTAS-DISENO.md, desde antes de que
     * existiera una línea de su código). Esto es cumplir eso: se acerca
     * saltando de cobertura en cobertura, no cruzando el pasillo a pecho
     * descubierto.
     */
    const miDist = distance(bo.x, bo.y, player.x, player.y);
    const sirve = spot && distance(spot.x, spot.y, player.x, player.y) <= miDist + 24;

    bo.coverPoint = sirve ? spot : null;
  }

  /**
   * Y CRUZA RÁPIDO LO DESCUBIERTO. Entre una cobertura y la siguiente va un
   * 35% más rápido: el tiempo que pasa expuesto es lo único que lo mata, así
   * que corre justamente ahí. Es lo que hace un tirador de verdad, y de paso
   * hace que se lo vea decidido en vez de paseando.
   */
  /**
   * Y CUANDO LLEGA A UNA, SE PARA EN ELLA.
   *
   * Ésta es la línea que faltaba. La versión anterior caminaba HACIA la
   * cobertura pero le pasaba de largo rumbo al jugador, así que en la práctica
   * nunca estaba cubierto: medido, 0% del tiempo, y moría en 1,9 s con cuatro
   * balazos seguidos.
   *
   * "Avanzar de cobertura en cobertura" significa PARARSE en cada una. Desde
   * ahí `parapetarse` toma el control: se asoma, tira, y recién después sale
   * hacia la siguiente.
   */
  if (bo.coverPoint && distance(bo.x, bo.y, bo.coverPoint.x, bo.coverPoint.y) < 7) {
    bo.atCover = true;
    bo.stuckTimer = 0;
    bo.holdTimer = world.rng.range(
      bo.tipo.cobertura.holdMin * 0.4,
      bo.tipo.cobertura.holdMax * 0.6
    );
    elegirAsomada(bo, world, player);
    return;
  }

  const objetivo = bo.coverPoint || player;
  const velocidad = bo.tipo.speed * (bo.coverPoint ? 1.35 : 1);
  const movido = moveToward(bo, objetivo.x, objetivo.y, velocidad, dt, world.map);

  // Trabado contra algo: soltar la cobertura y encarar derecho. Un jefe que se
  // queda pegado a un asiento deja de dar miedo al instante.
  bo.stuckTimer = movido < 0.15 ? bo.stuckTimer + dt : 0;
  if (bo.stuckTimer > 0.8) {
    bo.coverPoint = null;
    bo.stuckTimer = 0;
    viajarHacia(bo, dt, world, player.x, player.y, bo.tipo.speed);
  }
}
