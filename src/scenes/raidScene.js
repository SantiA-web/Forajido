/**
 * LA ESCENA DEL ASALTO.
 *
 * Acá se junta todo: el tren, el jugador, los guardias, los pasajeros, las
 * balas, el botín, la alarma y el reloj. La escena coordina; la lógica pesada
 * vive en los sistemas.
 *
 * FASE 2. Ya no es un vagón: es un tren de siete (el furgón de cola más seis
 * robables). Eso cambia de dónde sale la tensión.
 *
 * Antes había dos relojes: el del tren y el de la alarma. Ahora hay un tercero,
 * y es el importante: LA DISTANCIA A LA SALIDA. Tu caballo está en el furgón de
 * cola, en la punta de atrás del tren, y es la única forma de bajarse. Cada
 * vagón que avanzás es un vagón que después vas a tener que desandar, con la
 * alarma sonando y con los refuerzos entrando por los dos lados. La pregunta
 * "¿un vagón más?" ya no la sostiene la alarma: la sostiene la geografía.
 */

import { CONFIG } from '../data/config.js';
import { T } from '../text/es.js';

import { createCamera } from '../engine/camera.js';
import { distance, moveAndCollide } from '../engine/collision.js';
import { drawParallax, drawSpeedLines } from '../engine/parallax.js';

import { buildTrain, drawTrain, isInsideZone } from '../world/train.js';
import { updatePlayer, drawPlayer, golpearEnTecho, tumbar } from '../entities/player.js';
import {
  createRodante, updateRodante, drawRodante, TIPOS_RODANTE,
} from '../entities/rodante.js';
import { createEnemy, drawEnemy } from '../entities/enemy.js';
import { createBoss, drawBoss } from '../entities/boss.js';
import { updateBoss } from '../systems/boss.js';
import {
  updateSheriff, updateEscolta, actualizarAuraDelSheriff, apagarAura,
} from '../systems/sheriff.js';
import { jefeParaEsteAsalto, BOSSES } from '../data/bosses.js';
import { guardHealth } from '../data/guards.js';
import {
  updatePassenger, drawPassenger, panic, amenazado, sePuedeAmenazar,
} from '../entities/passenger.js';
import { createBullet, drawBullet } from '../entities/bullet.js';
import { createExplosive, drawExplosive } from '../entities/explosive.js';
import { drawRider } from '../entities/rider.js';
import { updateRiders, createRiderWatch } from '../systems/riders.js';
import { maxJinetesPara } from '../data/riders.js';
import { drawLootable } from '../entities/lootable.js';
import {
  updateDoor, puertaTapaVision, drawDoor, trabarPuerta, destrabarPuerta,
} from '../entities/door.js';
import {
  updateEnemy, alertTo, alertCombat, alertaEnGuardia, separateEnemies,
} from '../systems/ai.js';
import { updateBullets } from '../systems/combat.js';
import { updateExplosives } from '../systems/explosives.js';
import { createAlertSystem } from '../systems/alert.js';
import { applyRaidResult, gameState } from '../state/gameState.js';

export function createRaidScene(services) {
  const { renderer, input, bus, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;
  const camera = createCamera(renderer.width, renderer.height);

  let train, player, enemies, passengers, loot, map, doors;
  let bullets, explosives, riders, particles, floaters;
  let riderWatch;
  let techObstacles, techoBajarProgress, techoSpawnTimer;
  let rodantes, rodanteTimer, rodanteRafaga, rodanteRafagaTimer;
  let tranqueras, estampidas, estampidaSiguienteId;
  let traqueteoTimer, traqueteoFase, traqueteoFaseTimer, traqueteoVariante, traqueteoSwayX;
  let traqueteoVelMult = 1;
  let timeLeft, duracionInicial, collected, kills, civilians, amenazados, escapeProgress;
  let jefe, jefeMuerto, jefePendiente, jefeTimer;
  let sheriff, auraTimer, sheriffMuerto;
  let finished, endTimer, outcome;
  let wagonActual, wagonMasProfundo, ultimoVisto;
  let scroll = 0;
  let blastMarks = [];
  let world, alarm;
  let unsubscribers = [];

  // ---------------------------------------------------------------- entrar

  function enter(params = {}) {
    // `boardAt` sigue aceptándose porque es lo que usa la consola para saltear
    // la pantalla de abordaje, y ahora quiere decir lo mismo que caballoEn:
    // dónde dejaste el caballo es dónde subís.
    const caballoEn = params.caballoEn ?? params.boardAt ?? 1;
    train = buildTrain(
      rng, caballoEn, params.composicion || null, params.dificultad || null,
      gameState.weapon, params.tipoTren || null
    );
    map = train.map;
    player = train.player;
    enemies = train.enemies;
    passengers = train.passengers;
    loot = train.loot;
    doors = train.doors;

    bullets = [];
    explosives = [];
    riders = [];
    particles = [];
    floaters = [];
    blastMarks = [];
    techObstacles = [];
    techoBajarProgress = 0;
    techoSpawnTimer = CONFIG.techo.obstaculoCada;

    rodantes = [];
    rodanteTimer = train.rodantesCada || 0;
    rodanteRafaga = 0;
    rodanteRafagaTimer = 0;

    tranqueras = train.tranqueras || [];
    estampidas = [];
    estampidaSiguienteId = 0;

    traqueteoTimer = train.traqueteoCada || 0;
    traqueteoFase = null;
    traqueteoFaseTimer = 0;
    traqueteoVariante = null;
    traqueteoSwayX = 0;
    traqueteoVelMult = 1;

    /**
     * Adelantar el caballo se paga en reloj, y el precio es LITERAL: los
     * segundos que tardaste galopando hasta ahí. No hay descuento inventado por
     * enganche — llegar al tercero cuesta lo que cuesta llegar al tercero.
     *
     * Se deja un piso para que un asalto nunca arranque asfixiado por una
     * aproximación larga: hasta acá se puede cobrar, y ni un segundo más.
     */
    const cobrado = Math.min(params.tiempoGastado || 0, CONFIG.raid.maxCobroAproximacion);
    // `train.raidDuration`: el estándar usa CONFIG.raid.duration de siempre,
    // pero el veloz y el de carga traen el suyo propio (ver data/train.js).
    duracionInicial = train.raidDuration - cobrado;
    timeLeft = duracionInicial;
    collected = 0;
    kills = 0;
    civilians = 0;
    amenazados = 0;
    jefe = null;
    jefeMuerto = false;
    jefePendiente = null;
    jefeTimer = 0;
    sheriff = null;
    sheriffMuerto = false;
    auraTimer = 0;
    escapeProgress = 0;
    finished = false;
    endTimer = 0;
    outcome = null;

    wagonActual = train.boardedAt;
    wagonMasProfundo = train.boardedAt;
    ultimoVisto = { x: player.x, y: player.y };

    world = {
      map, player, enemies, passengers, bullets, explosives, riders, loot, doors,
      bus, rng, input, camera, audio,
      aimX: player.x, aimY: player.y,
      spawnBullet: (options) => bullets.push(createBullet(options)),
      spawnExplosive: (options) => explosives.push(createExplosive(options)),
      // El tren, para que `dispararACiegasPorTecho` (systems/ai.js) pueda
      // preguntar "¿este guardia está en el mismo vagón que el jugador?".
      train,
      // Los barriles sueltos: `systems/combat.js` los necesita para que tus
      // balas les peguen.
      get rodantes() { return rodantes; },
      // El sacudón del tren traicionero (CONFIG.traqueteo): cuánto se le suma
      // a la dispersión de CUALQUIERA que dispare mientras dura el efecto.
      // 0 el resto del tiempo, y siempre 0 si este tren no tiene el sistema.
      get dispersionExtra() {
        return traqueteoFase === 'efecto' ? CONFIG.traqueteo.dispersionExtra : 0;
      },
      // Sólo para depurar desde la consola: FORAJIDO.services.raid.techObstacles
      get techObstacles() { return techObstacles; },
      /**
       * ¿Ya gritó alguien? Es lo que hace que el Sheriff deje de patrullar y
       * salga hacia la locomotora (`systems/sheriff.js`). Va como getter y no
       * como valor porque `alarm` se crea después de este objeto.
       */
      get alarmaActiva() { return !!(alarm && alarm.active); },
    };

    /**
     * LAS PUERTAS TAPAN LA VISTA, NO LAS BALAS. Se engancha ACÁ, una sola vez,
     * envolviendo `map.blocksSightAt`: así todo el código que ya pregunta por
     * eso (los guardias, los jinetes, la cobertura) se vuelve consciente de las
     * puertas sin que haya que tocar una línea en esos sistemas.
     *
     * `world.tileBlocksSightAt` guarda el original SIN puertas: la IA lo usa
     * para distinguir "no te veo por una pared" de "no te veo por una puerta
     * cerrada", que son dos situaciones que se responden distinto (ver
     * `puedeDispararACiegasPorPuerta` en systems/ai.js).
     */
    world.tileBlocksSightAt = map.blocksSightAt;
    map.blocksSightAt = (x, y) => {
      if (world.tileBlocksSightAt(x, y)) return true;
      for (const d of doors) {
        if (puertaTapaVision(d) && Math.abs(x - d.x) < d.hw && Math.abs(y - d.y) < d.hh) {
          return true;
        }
      }
      return false;
    };

    /**
     * LA PUERTA BLINDADA, MIENTRAS SIGA ENTERA, ES UN MURO DE VERDAD.
     *
     * Las puertas normales NUNCA se enganchan acá: empujarlas ya las abre,
     * así que nunca frenan el paso (sólo la vista, arriba). La blindada es la
     * única excepción — bloquea de verdad, para los dos lados, hasta que la
     * dinamita la rompe (`volarPuerta`).
     *
     * OJO: esto es `isSolidForMovementAt`, NO `map.isSolidAt`. La primera
     * vuelta reemplazaba directamente `map.isSolidAt`, y eso rompía otra
     * cosa: el sistema de cobertura (`systems/cover.js`) TAMBIÉN pregunta por
     * `isSolidAt` para decidir "¿hay una pared al lado para pegarme?". La
     * puerta empezó a contar como pared, el jugador se pegaba solo contra
     * ella, y disparar de cubierto exige asomarse — asomarse al costado de
     * una puerta angosta flotando en el aire no tiene ningún sentido, así que
     * el resultado era "no se puede disparar a través". Separando las dos
     * preguntas ("¿me puedo mover para acá?" vs. "¿hay una pared para
     * cubrirme?"), la puerta sigue frenando el paso sin meterse en la
     * cobertura. Sólo los movimientos de verdad (jugador, guardias, la
     * dinamita volando) usan esto — `map.isSolidAt` queda intacto para
     * cobertura y para el buscador de rutas.
     */
    /**
     * Blindada y trabada frenan el paso por el mismo motivo, y por eso viven
     * en la misma función: las dos son "no se puede abrir empujando". La
     * trabada es de madera —la rompen las mismas balas de siempre— pero
     * mientras esté entera, frena igual que la de chapa.
     */
    const bloqueaPuertaCerrada = (x, y) => {
      for (const d of doors) {
        if ((d.kind === 'blindada' || d.trabada) && !d.broken &&
            Math.abs(x - d.x) < d.hw && Math.abs(y - d.y) < d.hh) {
          return true;
        }
      }
      return false;
    };
    map.isSolidForMovementAt = (x, y) => map.isSolidAt(x, y) || bloqueaPuertaCerrada(x, y);

    alarm = createAlertSystem({ bus, audio, spawnReinforcement, spreadAlarm });
    /**
     * El techo de jinetes de este asalto se fija ACÁ, con la recompensa que ya
     * traías al subir al tren — no lo que hagas durante este asalto. Ver
     * data/riders.js (maxJinetesPara) y NOTAS-DISENO.md, paso B.
     */
    riderWatch = createRiderWatch({ bus, audio, max: maxJinetesPara(gameState.bounty) });

    /**
     * ENTRAR POR EL TECHO. `caballoEn` ya dejó el caballo y la salida en el
     * lugar correcto (la plataforma de antes del vagón cuyo techo saltaste);
     * lo único que hace falta es no aparecer adentro del vagón como
     * siempre, sino arriba, en la franja del techo, en el x real donde
     * saltaste durante el galope.
     */
    if (params.enTecho) {
      player.enTecho = true;
      player.x = Math.max(8, Math.min(map.width - 8, params.techoX ?? player.x));
      player.y = CONFIG.techo.centroY;
      // Red de seguridad: si por lo que sea el punto de caída no tiene techo,
      // no arrancamos flotando en el aire — el chequeo del hueco te baja al
      // enganche en el primer cuadro, que es exactamente lo que corresponde.
    }

    camera.snap(player.x, player.y, map.bounds);
    listen();
    hud.show();
    audio.startAmbience();

    // Aviso de entrada: en qué vagón caíste y qué es.
    const v = train.wagons[train.boardedAt];
    floaters.push({
      x: player.x, y: player.y - 20,
      text: `${T.hud.wagon(train.boardedAt)} · ${v.short}`,
      life: 2.4, color: colors.text,
    });

    /**
     * ENTRAR CON LA ALARMA YA SONANDO.
     *
     * Pasa cuando te vieron desde una ventanilla mientras galopabas pegado al
     * tren. Es el castigo más caro que tiene el juego y ni siquiera hace falta
     * explicarlo: perdés el bono de trabajo limpio antes de haber robado nada,
     * y encima empezás con los guardias de tu vagón y del de atrás caminando
     * hacia vos.
     *
     * Es lo que le da peso al galope: adelantarte no sólo cuesta reloj y
     * aguante, también te hace pasar al lado de más gente que puede verte.
     */
    if (params.alarmaInicial) {
      alarm.trigger(train.boardedAt);
      floaters.push({
        x: player.x, y: player.y - 32,
        text: T.prompts.yaTeVieron, life: 3.0, color: colors.enemyAlert,
      });
    }

    /**
     * ENTRAR HERIDO. Si te agarraron a tiros mientras galopabas, la vida que
     * perdiste allá te la traés acá. En el galope no se puede morir (piso 1),
     * pero empezar un asalto con 1 de vida es durísimo, y ese es el punto: el
     * castigo por galopar pegado al tren es real sin ser terminal.
     */
    if (params.vidaInicial !== undefined) {
      player.health = Math.max(1, Math.min(player.maxHealth, params.vidaInicial));
    }

    /**
     * CAER A LOS TUMBOS. Un salto sucio no te lastima: hace ruido. Los guardias
     * del vagón donde caíste te oyeron entrar y vienen a mirar qué fue eso.
     *
     * Que el precio sea ruido y no daño es lo que hace que valga la pena
     * perfeccionar el salto aunque nunca te maten: engancha con el sigilo, que
     * es el sistema que de verdad decide cómo te va a ir adentro.
     */
    if (params.saltoSucio) {
      for (const e of enemies) {
        if (e.alive && e.wagon === train.boardedAt) alertTo(e, player.x, player.y);
      }
      floaters.push({
        x: player.x, y: player.y - 26,
        text: T.prompts.caisteMal, life: 2.4, color: colors.enemySus,
      });
    }

    /**
     * ¿SUBE ALGÚN MINI JEFE?
     *
     * Se pregunta acá, una sola vez, con la recompensa que YA traías (igual
     * que el techo de jinetes). Subir la recompensa robando durante este
     * asalto no hace aparecer a nadie a mitad de camino: lo que estás viviendo
     * es la consecuencia de los asaltos anteriores, no de éste.
     *
     * Las bandas no se superponen (600-899 el Sheriff al 40%, 900+ el
     * Cazarrecompensas siempre), así que de acá sale UNO o ninguno.
     */
    jefe = null;
    sheriff = null;
    jefePendiente = null;
    jefeTimer = 0;
    auraTimer = 0;

    // `train.tipoTren` es el OBJETO del catálogo (data/train.js), no el id.
    const elegido = params.jefeForzado
      ? BOSSES[params.jefeForzado]
      : jefeParaEsteAsalto(gameState.bounty, train.tipoTren.id, rng);

    if (elegido && elegido.spawnComo === 'guardia') {
      /**
       * EL SHERIFF YA VIAJA EN EL TREN — no sube más tarde como el
       * Cazarrecompensas, y la diferencia es de fondo: aquél viene POR VOS
       * (así que aparecer a mitad de camino tiene sentido), éste es parte de
       * la seguridad del tren y ya estaba ahí cuando subiste. Buscarlo desde
       * el minuto cero es parte del asalto.
       */
      spawnSheriff(elegido);
    } else if (elegido) {
      jefePendiente = elegido;
      /**
       * NO SUBE EN EL SEGUNDO 0: SE HACE ESPERAR (ver `acecho` en
       * data/bosses.js). El asalto arranca sin él, y para cuando aparece atrás
       * ya te metiste en el tren.
       *
       * El reloj es el del ASALTO y no uno propio, así que una aproximación
       * larga a caballo no le regala ni le quita tiempo: sube siempre al mismo
       * punto de tu reloj, hayas tardado lo que hayas tardado en subir vos.
       */
      jefeTimer = elegido.acecho.subeALos;
    }

    // Para depurar desde la consola: FORAJIDO.services.raid.player, .enemies, etc.
    services.raid = world;
    services.train = train;
  }

  /**
   * EL JEFE SUBE POR LA COLA, y eso no es un detalle de dónde ponerlo.
   *
   * Entra por donde entraste vos y aprieta hacia la locomotora, o sea que se
   * mete ENTRE vos y tu caballo. La moneda con la que este juego cobra todo
   * —la distancia hasta la salida— aplicada por primera vez a una persona: no
   * te quita vida ni reloj, te quita el camino de vuelta.
   *
   * Y NACE ACECHANDO, no persiguiendo: se queda atrás midiéndote, sin tirar
   * un solo tiro, hasta que le des un motivo (ver `acecho` en data/bosses.js).
   */
  function spawnJefe(tipo) {
    // Detrás del jugador, hacia la cola. Nunca antes del borde del tren.
    const x = Math.max(24, player.x - tipo.acecho.distancia);
    const y = CONFIG.techo.centroY;

    jefe = createBoss(x, y, tipo, { facing: 0 });
    enemies.push(jefe);

    floaters.push({
      x: player.x, y: player.y - 34,
      text: T.prompts.cazador, life: 3.4, color: tipo.color,
    });
    audio.play('whistle');
    camera.shake(2.0, 0.35);
  }

  /**
   * EL SHERIFF Y SUS TRES — ya viajaban en el tren cuando subiste.
   *
   * Se lo pone en un vagón del MEDIO hacia adelante, nunca en los dos
   * primeros: si naciera pegado a la cola, se replegaría medio tren de
   * corrido en cuanto suene la alarma y nunca lo alcanzarías. Poniéndolo al
   * fondo, cuando arranca a replegarse ya tiene poco terreno por delante —
   * lo alcanzás, pero para eso ya te metiste hasta ahí.
   */
  function spawnSheriff(tipo) {
    const primerVagon = Math.min(3, train.wagons.length - 1);
    const idx = rng.int(primerVagon, train.wagons.length - 1);
    const v = train.wagons[idx];
    if (!v) return;

    const x = v.x + v.width * 0.5;
    const y = CONFIG.techo.centroY;

    sheriff = createEnemy(x, y, {
      type: tipo.tipoDeGuardia,
      health: guardHealth(tipo.tipoDeGuardia, (train.dificultad ? train.dificultad.vidaExtra : 0)),
      path: v.ronda,
      facing: Math.PI,
      ai: train.ai,
    });
    sheriff.wagon = idx;
    sheriff.esSheriff = true;
    sheriff.jefeTipo = tipo;
    sheriff.sheriffVelocidad = tipo.velocidadRepliegue;
    sheriff.auraTipo = tipo.auraDificultad;
    enemies.push(sheriff);
    v.guardiasVivos++;

    /**
     * Los tres que no se le despegan. Nacen EN FILA por el pasillo (adelante,
     * atrás, al hombro) y no en círculo: el tren es un corredor de dos filas,
     * y un puesto fuera del pasillo es un guardia trabado contra un asiento
     * — ver `puestoDeEscolta` en systems/sheriff.js.
     */
    const puestos = [
      tipo.escolta.radio, -tipo.escolta.radio, tipo.escolta.radio * 2,
    ];
    for (let i = 0; i < tipo.escolta.cantidad; i++) {
      const g = createEnemy(
        x + puestos[i % puestos.length],
        y,
        { type: 'normal', health: guardHealth('normal', (train.dificultad ? train.dificultad.vidaExtra : 0)),
          facing: Math.PI, ai: train.ai }
      );
      g.wagon = idx;
      g.escoltaDe = sheriff;
      g.escoltaSlot = i;
      g.escoltaConfig = tipo.escolta;
      /**
       * Su propio perfil de IA con `patrolSpeed` al ritmo del Sheriff: a los
       * 24 px/s de una patrulla normal lo perderían en el primer vagón. Es
       * una COPIA (`{...}`) y no una mutación: `train.ai` lo comparten todos
       * los guardias del tren, así que tocarlo acá los afectaría a todos.
       */
      g.ai = { ...g.ai, patrolSpeed: tipo.velocidadRepliegue };
      enemies.push(g);
      v.guardiasVivos++;
    }
  }

  /**
   * SE DESPERTÓ: SE CIERRA EL TREN ENTERO — idea de Santi. Ninguna puerta de
   * madera se abre empujando mientras siga vivo y cazándote; hay que
   * romperlas, como a cualquier otra cosa que se interponga.
   *
   * TODAS, no sólo las que quedan atrás: encaja con que él aprieta desde la
   * cola hacia la locomotora, el tren entero se cierra con él adentro. Y es
   * más simple de sostener — una puerta no tiene por qué saber de qué lado
   * quedaste vos.
   *
   * La blindada no se toca: ya tenía su propia llave (la dinamita) desde
   * antes de que existiera esto, y ésta no la reemplaza.
   */
  function trabarPuertasDelTren() {
    for (const d of doors) trabarPuerta(d);
    floaters.push({
      x: player.x, y: player.y - 40,
      text: T.prompts.trenCerrado, life: 2.6, color: colors.enemyAlert,
    });
    audio.play('cover');
  }

  function destrabarPuertasDelTren() {
    for (const d of doors) destrabarPuerta(d);
  }

  function exit() {
    unsubscribers.forEach((off) => off());
    unsubscribers = [];
    audio.stopAmbience();
  }

  /** Los sistemas avisan por el bus; la escena reacciona. */
  function listen() {
    unsubscribers = [
      bus.on('impact', ({ x, y, kind }) => {
        const color = kind === 'flesh' ? colors.blood : '#c9b28a';
        spawnParticles(x, y, color, kind === 'flesh' ? 7 : 4);
        audio.play(kind === 'flesh' ? 'hitFlesh' : 'hitWall');
      }),

      bus.on('enemyKilled', ({ enemy, byPlayer }) => {
        /**
         * MATAR AL CAZARRECOMPENSAS NO CUENTA COMO UN MUERTO MÁS.
         *
         * Si contara, te SUBIRÍA la recompensa (`bounty.pesoGuardia`) — o sea
         * que matar al tipo que vino a cobrar tu cabeza te haría más buscado,
         * al mismo tiempo que su premio te la baja. Las dos cosas se
         * anularían entre sí y el jugador no tendría cómo entender por qué.
         * La respuesta a "¿qué gano matándolo?" ya es `premio`, y tiene que
         * ser la única.
         */
        if (enemy && enemy.esJefe) {
          // Muerto, por la mano que sea: se acabó la cacería, se acabó el
          // encierro. Las puertas rotas quedan rotas (no hay vuelta atrás
          // para ésas, como siempre), pero las que seguían enteras y
          // trabadas vuelven a abrirse gratis.
          destrabarPuertasDelTren();
          /**
           * EL PREMIO SE COBRA SÓLO SI LO MATASTE VOS (`byPlayer`).
           *
           * Apareció midiendo un asalto completo, y no se veía venir: con la
           * alarma sonando hay 17 guardias y 5 jinetes tirando, y las balas de
           * los guardias le pegan a otros guardias (systems/combat.js, regla
           * de la fase 1). En una corrida de 75 s el jefe murió **de fuego
           * amigo**, sin que el jugador le disparara una sola vez — y se
           * llevaba igual el −35% de recompensa y los +150 de fama.
           *
           * Cobrar por no haber hecho nada rompe lo único que hace de este
           * tipo una decisión: enfrentarlo tiene que ser la jugada cara. Que
           * muera igual está bien (deja de perseguirte, y eso ya es algo);
           * lo que no puede pasar es que la ley te perdone la cabeza porque
           * un guardia tuvo mala puntería.
           */
          jefeMuerto = jefeMuerto || !!byPlayer;
          camera.shake(5, 0.6);
          audio.play('kill');
          floaters.push({
            x: enemy.x, y: enemy.y - 26,
            text: byPlayer ? T.prompts.cazadorMuerto : T.prompts.cazadorCayo,
            life: 3.2,
            color: byPlayer ? '#ffd84a' : colors.textDim,
          });
          return;
        }

        /**
         * EL SHERIFF SÍ CUENTA COMO UN MUERTO MÁS (a diferencia del
         * Cazarrecompensas): es un hombre de la ley muerto durante un asalto
         * con la alarma sonando, el caso exacto que `bounty.pesoGuardia` cobra
         * desde siempre. Y no hay ningún premio que se le anule, porque el
         * suyo no toca la recompensa — sólo fama.
         *
         * Por eso este bloque NO hace `return`: sigue de largo al conteo
         * normal de abajo.
         */
        if (enemy && enemy.esSheriff) {
          // Se acaba el aura al instante: los guardias de su vagón vuelven a
          // pelear como siempre, y tu arma vuelve a sonar lo de siempre. Ese
          // alivio inmediato es el premio de verdad; la fama es el recuerdo.
          apagarAura(world);
          sheriffMuerto = sheriffMuerto || !!byPlayer;
          camera.shake(4, 0.5);
          floaters.push({
            x: enemy.x, y: enemy.y - 26,
            text: T.prompts.sheriffMuerto, life: 3.0, color: '#ffd84a',
          });
        }

        kills++;
        // Llevamos la cuenta por vagón: un vagón sin guardias vivos es un vagón
        // del que ya no puede salir nadie. Eso es lo que hace que limpiar un
        // vagón signifique algo.
        if (enemy && enemy.wagon !== undefined && train.wagons[enemy.wagon]) {
          train.wagons[enemy.wagon].guardiasVivos--;
        }
        camera.shake(CONFIG.feel.shakeKill, 0.16);
        audio.play('kill');
      }),

      bus.on('passengerKilled', () => {
        civilians++;
        audio.play('kill');
      }),

      bus.on('playerHit', () => {
        camera.shake(CONFIG.feel.shakeHit, 0.24);
        audio.play('playerHurt');
      }),

      bus.on('playerDown', () => endRaid('capturedDead')),

      // Un ruido (disparo, caja fuerte) hace que los guardias vayan a mirar
      // y que los pasajeros cercanos se descompongan.
      bus.on('noise', ({ x, y, radius, wagons, deJinete }) => {
        // Si el ruido salió de vos (tu disparo, la caja fuerte que estás
        // abriendo), acabás de delatar dónde estás. Los tiros de ellos no, y
        // los de los jinetes tampoco aunque caigan justo al lado tuyo: ellos
        // pueden estar tirándole al lugar donde te vieron hace diez segundos.
        const fueTuyo = !deJinete && distance(player.x, player.y, x, y) < 24;
        if (fueTuyo) marcarPosicion(x, y);

        /**
         * Tu disparo corre la alarma por el tren, y hasta dónde llega lo decide
         * EL ARMA. Sólo mientras la alarma ya está sonando: para que suene la
         * primera vez te tienen que ver, si no un solo tiro te arruinaría el
         * trabajo limpio y el sigilo dejaría de existir.
         */
        if (fueTuyo && wagons && alarm.active) {
          spreadAlarm(wagons, train.wagonAt(x));
        }

        for (const e of enemies) {
          if (distance(e.x, e.y, x, y) <= radius) alertTo(e, x, y);
        }
        for (const pa of passengers) {
          if (pa.alive && distance(pa.x, pa.y, x, y) < 150) panic(pa);
        }
      }),

      // Un pasajero gritó: los guardias van a ver qué pasa (todavía no te vieron).
      bus.on('scream', ({ x, y, radius }) => {
        for (const e of enemies) {
          if (distance(e.x, e.y, x, y) <= radius) alertTo(e, x, y);
        }
      }),

      /**
       * Un guardia te vio y avisó: se acabó el sigilo.
       *
       * El aviso ya no viaja por un círculo de píxeles: viaja POR VAGONES. El
       * que grita despierta a los de su vagón y a los de dos vagones para cada
       * lado. Un grito no se corta a la mitad de un vagón, y un tabique de
       * madera no aísla a nadie de un tiroteo.
       */
      bus.on('guardAlerted', ({ wagon }) => {
        // Te vieron: acá sí saben exactamente dónde estás.
        marcarPosicion(player.x, player.y);
        const centro = wagon ?? wagonActual;
        if (alarm.active) spreadAlarm(alarm.radius, centro);
        else alarm.trigger(centro);
      }),

      /**
       * La ley de afuera reacciona al quilombo, no a que estés adentro. Una
       * partida en silencio no la ve nunca. Escucha 'alarm' (lo emite
       * alarm.trigger) en vez de arrancar directo desde 'guardAlerted', para
       * cubrir TAMBIÉN el caso de entrar con la alarma ya sonando por haberte
       * visto desde una ventanilla mientras galopabas (`alarmaInicial`) — antes
       * ese camino prendía `alarm.active` pero nunca arrancaba el reloj de los
       * jinetes, y no debería haber una forma de que suene la alarma sin ellos.
       */
      bus.on('alarm', () => riderWatch.arrancar()),

      bus.on('riderSpawned', ({ side }) => {
        floaters.push({
          x: player.x, y: player.y - 26,
          text: T.prompts.riders, life: 2.4, color: '#ffb45c',
        });
        camera.shake(1.2, 0.2);
      }),

      bus.on('riderKilled', () => {
        kills++;
        camera.shake(CONFIG.feel.shakeKill, 0.16);
        audio.play('kill');
      }),

      /**
       * Dejó de medirte. El aviso es grande porque el cambio es grande: hasta
       * recién estaba parado atrás sin hacer nada, y a partir de ahora viene.
       */
      bus.on('bossDespierta', ({ boss }) => {
        floaters.push({
          x: player.x, y: player.y - 30,
          text: T.prompts.cazadorViene, life: 2.8, color: boss.tipo.color,
        });
        trabarPuertasDelTren();
      }),

      bus.on('sheriffSeRepliega', ({ sheriff: s }) => {
        floaters.push({
          x: s.x, y: s.y - 26,
          text: T.prompts.sheriffSeVa, life: 2.6, color: '#e8c34a',
        });
      }),

      bus.on('bossEnraged', ({ boss }) => {
        floaters.push({
          x: boss.x, y: boss.y - 30,
          text: T.prompts.cazadorFuria, life: 2.2, color: '#ff6a3a',
        });
      }),

      bus.on('playerCover', ({ entered }) => { if (entered) audio.play('cover'); }),

      // El estruendo: mucha tierra, un fogonazo y el aviso en pantalla.
      bus.on('explosion', ({ x, y, radius, porJugador, wagons }) => {
        spawnParticles(x, y, '#ffb45c', 26);
        spawnParticles(x, y, '#8a6a4a', 18);
        floaters.push({ x, y: y - 14, text: T.prompts.boom, life: 1.1, color: '#ffb45c' });
        // La onda expansiva se dibuja un instante para que se entienda el radio.
        blastMarks.push({ x, y, radius, life: 0.35 });
        if (porJugador) retumbaElTren(x, y, wagons);
      }),
    ];
  }

  /**
   * Los refuerzos entran por un enganche pegado al vagón donde estás.
   *
   * Que aparezcan en el vagón de al lado y no en la punta del tren no es una
   * comodidad técnica: un guardia que tiene que cruzar cuatro vagones para
   * llegar no es una amenaza, es un rumor. Alternamos de qué lado vienen:
   * los de adelante te empujan hacia la salida; los de atrás te la cortan.
   */
  /**
   * La alarma despierta a los guardias que YA ESTÁN en el tren, y NO en las dos
   * direcciones por igual.
   *
   * Los que se MOVILIZAN son los de atrás: el vagón donde sonó y hasta `radio`
   * vagones hacia la cola. Son los que te cortan el camino al caballo, y son
   * los únicos que abandonan su puesto. Si ya limpiaste esos vagones no viene
   * nadie, porque no queda nadie.
   *
   * Los de ADELANTE, dentro del mismo alcance, se enteran pero se quedan:
   * quedan despiertos esperándote en su vagón (ver alertaEnGuardia). Oyeron el
   * mismo tiro; lo que no hacen es perseguirte.
   *
   * `radio` no es una constante del juego: es CUÁNTO RUIDO HICISTE. Un grito
   * alcanza `CONFIG.alert.wagonRadius`; un disparo, lo que diga el arma.
   */
  /**
   * CUÁNTOS VAGONES MÁS DESPIERTA TU RUIDO PORQUE EL SHERIFF SIGUE VIVO.
   *
   * Un vagón más, encima de lo que ya dicen tu arma y el tipo de tren. No te
   * suma enemigos: **te los despierta más atrás**, o sea más lejos en tu
   * camino de vuelta — la misma moneda con la que el juego cobra el ruido
   * desde la fase 2 (ver `noiseWagons` en data/weapons.js).
   *
   * Es la pieza que hace que valga la pena matarlo aunque él no te dispare
   * nunca: no lo matás porque sea peligroso, lo matás porque hace que todo lo
   * demás sea peor.
   */
  function ruidoExtraDelSheriff() {
    if (!sheriff || !sheriff.alive) return 0;
    return sheriff.jefeTipo.ruidoExtraVagones || 0;
  }

  function spreadAlarm(radio, centro = wagonActual) {
    radio += ruidoExtraDelSheriff();
    let despertados = 0;
    for (const e of enemies) {
      if (!e.alive || e.wagon === undefined) continue;

      const delta = e.wagon - centro;   // >0 = está adelante; <0 = hacia la cola
      if (Math.abs(delta) > radio) continue;

      if (delta > 0) {
        alertaEnGuardia(e);   // adelante: se despierta, no se mueve
        continue;
      }

      if (e.state === 'combat') continue;
      // Van a tu ÚLTIMA POSICIÓN CONOCIDA, no a donde estás ahora. Si no, cada
      // vez que la alarma se propaga todo el tren sabría dónde estás parado,
      // que es adivinación y no se puede jugar en contra. Así, en cambio, se
      // puede: te vas de donde te vieron y los mandás al lugar equivocado.
      alertCombat(e, ultimoVisto.x, ultimoVisto.y, world);
      despertados++;
    }
    return despertados;
  }

  /**
   * UNA EXPLOSIÓN NO ES UN RUIDO MÁS: EL TREN SE ENTERA Y SE ENTERA EN ROJO.
   *
   * Todo el resto del juego reparte sospecha: un tiro, un grito o una caja
   * fuerte dejan a los que lo oyeron en AMARILLO, yendo a mirar. La dinamita
   * no. Vuela una puerta de chapa: los que la oyen no se preguntan si pasó
   * algo, ya saben que pasó, y quedan en COMBATE.
   *
   * Tres cosas pasan de una, y las tres son el precio de haber usado el
   * cartucho:
   *
   *  1. **Enciende la alarma sí o sí.** No hay forma de volar una puerta y
   *     seguir haciendo un trabajo limpio. (Antes se podía: si nadie te había
   *     visto, la alarma seguía apagada después del estruendo.)
   *  2. **Delata dónde estás.** Es la explosión más ruidosa del tren y salió
   *     de tus manos.
   *  3. **Deja a todos en rojo, hasta `wagons` vagones para cada lado.** Los
   *     de ATRÁS te vienen a buscar —son los que te cortan el camino al
   *     caballo— y los de ADELANTE entran en combate igual, pero apuntando a
   *     su propio puesto: rojos, esperándote, sin abandonar su vagón. Eso
   *     conserva la regla de siempre (*avanzar tiene que seguir teniendo
   *     sorpresa*) sin fingir que del otro lado de la pared no oyeron nada.
   *
   * EL CASO QUE LA MOTIVÓ: volar la puerta del blindado. Sus guardias quedan
   * en rojo del otro lado del boquete —y como están confinados a su vagón
   * (`confinar`, en systems/ai.js), rojo no significa que salgan— mientras
   * los del vagón de atrás, si no los mataste, te caen por la espalda.
   */
  function retumbaElTren(x, y, wagons = CONFIG.alert.wagonRadius) {
    const centro = train.wagonAt(x);
    if (centro === undefined || centro === null) return;

    marcarPosicion(x, y);
    if (!alarm.active) alarm.trigger(centro, wagons);

    for (const e of enemies) {
      if (!e.alive || e.wagon === undefined) continue;
      if (Math.abs(e.wagon - centro) > wagons) continue;
      // Los de atrás (y los del vagón donde reventó) vienen hacia el
      // estruendo; los de adelante se quedan clavados en su puesto.
      const viene = e.wagon <= centro;
      alertCombat(e, viene ? x : e.x, viene ? y : e.y, world);
    }
  }

  /** Dónde te vieron o te oyeron por última vez. Es lo único que saben. */
  function marcarPosicion(x, y) {
    ultimoVisto.x = x;
    ultimoVisto.y = y;
  }

  // -------------------------------------------------------------- el techo

  /**
   * ¿Hay techo pisable en este punto del tren?
   *
   * Dos motivos para que no lo haya, y los dos importan al jugar:
   *  - Estás sobre un ENGANCHE: entre vagón y vagón el techo se corta. Ese
   *    hueco es el que hay que saltar.
   *  - Estás sobre el VAGÓN DE GANADO, que va al aire libre y no tiene techo
   *    (`tieneTecho`, que sale de `sinTecho` en data/wagons.js). Si el ganado
   *    cayó en el medio del tren, el camino de arriba queda partido.
   */
  function hayTechoEn(x) {
    if (train.tramoAt(x) !== 'vagon') return false;
    const w = train.wagons[train.wagonAt(x)];
    return !!w && !w.esCola && w.tieneTecho;
  }

  /**
   * LO QUE TE VIENE DE FRENTE ARRIBA DEL TREN.
   *
   * No son piedras clavadas que se esquivan caminando —esa fue la primera
   * versión y estaba mal—: son carteles y gantries de la vía que aparecen
   * adelante (del lado de la locomotora) y te barren hacia la cola porque el
   * tren avanza. No se pueden rodear. Cada uno pide UNA cosa:
   *
   *  - `agachar`: viene alto. Te agachás (Shift) y te pasa por encima.
   *  - `saltar`: viene bajo. Lo saltás (Espacio) y le pasás por arriba.
   *
   * Hacer la otra, o no hacer nada, es comérselo. Ahí está el juego del
   * techo: no es puntería, es leer rápido y elegir con la mano correcta.
   */
  function updateTecho(dt) {
    const ct = CONFIG.techo;
    if (!player.enTecho) { techObstacles.length = 0; return; }

    // --- Aparecen adelante, cada tanto ---
    techoSpawnTimer -= dt;
    if (techoSpawnTimer <= 0) {
      techoSpawnTimer = ct.obstaculoCada * rng.range(0.75, 1.25);
      const x = player.x + ct.obstaculoAdelanto;
      if (hayTechoEn(x)) {
        techObstacles.push({
          x,
          tipo: rng.range(0, 1) > 0.5 ? 'agachar' : 'saltar',
          resuelto: false,
        });
      }
    }

    // --- Y te barren hacia la cola ---
    for (let i = techObstacles.length - 1; i >= 0; i--) {
      const ob = techObstacles[i];
      ob.x -= ct.obstaculoVel * dt;
      if (ob.x < player.x - 120) { techObstacles.splice(i, 1); continue; }

      if (ob.resuelto || Math.abs(ob.x - player.x) > ct.obstaculoAncho) continue;

      // Te alcanzó. ¿Estabas haciendo lo correcto?
      const zafó = ob.tipo === 'agachar' ? player.techoAgachado : player.techoSalto > 0;
      ob.resuelto = true;
      if (!zafó) chocarEnTecho(ob);
    }
  }

  /**
   * LO QUE SE SUELTA ADENTRO DEL VAGÓN — barriles y cajones.
   *
   * Es el mismo lenguaje que los carteles del techo: aparece, viene hacia vos,
   * y hay que leerlo y decidir rápido. La diferencia es que acá hay DOS
   * respuestas — salirte del pasillo o reventarlo a tiros — y por eso tiene
   * vida. Con el Colt (6 balas, 3,5s de recarga) gastarle dos es una decisión
   * de verdad, no un trámite.
   *
   * NACEN EN TU MISMO VAGÓN, hacia el lado de la locomotora, y NUNCA sin
   * `pistaMinima` píxeles de pista entre el barril y vos. Ese es el
   * compromiso que hace justo al sistema: en un vagón corto del tren veloz
   * (224px) un barril podría nacer prácticamente encima, y en este juego no
   * hay un solo peligro que no se pueda ver venir.
   */
  function updateRodantes(dt) {
    const c = CONFIG.rodante;

    // Arriba del techo esto no existe: los barriles ruedan por el pasillo.
    if (player.enTecho) { rodantes.length = 0; return; }

    /**
     * OJO CON EL ORDEN: el GENERADOR de barriles está apagado en los trenes
     * sin `rodantesCada`, pero el MOVIMIENTO de lo que ya rueda tiene que
     * correr siempre. Antes este `return` estaba arriba del todo y se llevaba
     * puestas las reses de la estampida en el tren de carga —que no genera
     * barriles— así que nacían y se quedaban clavadas en el aire, sin moverse
     * ni atropellar a nadie. Dos cosas distintas que compartían una llave.
     */
    if (train.rodantesCada) actualizarGeneradorDeBarriles(dt, c);

    moverRodantes(dt);
  }

  /**
   * EL RELOJ QUE DECIDE CUÁNDO CAE LA PRÓXIMA TANDA DE BARRILES.
   *
   * Vienen de a TANDAS, y los de una misma tanda salen ESCALONADOS. El timer
   * largo (`rodantesCada`) decide cuándo arranca una tanda; el corto
   * (`rafagaGap`) va soltando los de esa tanda uno tras otro. Salen todos del
   * mismo lugar —el frente del vagón— así que el escalonado en el tiempo se
   * convierte solo en separación en el espacio, sin calcular ninguna posición.
   *
   * Y cada uno pasa por su propio control de pista mínima en `soltarRodante`:
   * si para cuando le toca al tercero ya avanzaste demasiado y no queda lugar
   * para verlo venir, ese no sale. La tanda se corta sola antes que soltar
   * algo imposible de leer.
   */
  function actualizarGeneradorDeBarriles(dt, c) {
    /**
     * EL DESCANSO SE CUENTA DESDE QUE TERMINA UNA TANDA, NO DESDE QUE EMPIEZA.
     *
     * Antes `rodanteTimer` corría siempre, sin importar si la tanda anterior
     * ya había terminado de salir. Con mala suerte en el sorteo (un intervalo
     * corto justo después de una tanda de 3, que tarda casi un segundo en
     * salir completa) el descanso real caía a menos de 2 segundos — dos
     * tandas de tres pegadas, con apenas un respiro en el medio. Santi lo vio
     * jugando: "vinieron tres obstáculos seguidos, y luego otros tres al
     * ratito". Medido: pasaba en 16 de 224 tandas (7%), siempre por esta
     * misma cuenta mal armada.
     *
     * Ahora `rodanteTimer` sólo corre cuando NO hay una tanda en curso: el
     * descanso entre una y otra es siempre el sorteado, sin excepción.
     */
    if (rodanteRafaga > 0) {
      rodanteRafagaTimer -= dt;
      if (rodanteRafagaTimer <= 0) {
        soltarRodante();
        rodanteRafaga -= 1;
        rodanteRafagaTimer = c.rafagaGap * rng.range(0.85, 1.2);
      }
    } else {
      rodanteTimer -= dt;
      if (rodanteTimer <= 0) {
        rodanteTimer = train.rodantesCada * rng.range(0.75, 1.3);
        rodanteRafaga = rng.int(c.rafagaMin, c.rafagaMax);
        rodanteRafagaTimer = 0;
      }
    }
  }

  /**
   * Mover TODO lo que rueda o corre por el pasillo: barriles, cajones y las
   * reses de una estampida. Corre siempre, en cualquier tren — que un tren no
   * genere barriles no quiere decir que no pueda tener nada rodando.
   */
  function moverRodantes(dt) {
    for (let i = rodantes.length - 1; i >= 0; i--) {
      const ro = rodantes[i];

      if (!ro.alive) { romperRodante(ro); rodantes.splice(i, 1); continue; }

      updateRodante(ro, dt);

      /**
       * UN BARRIL SE CAE DEL TREN AL LLEGAR AL ENGANCHE. No se frena contra la
       * pared del vagón: se va al vacío. Por eso el enganche —que no tiene
       * cobertura y te deja servido a los jinetes de afuera— es el único lugar
       * donde esto no te alcanza. Un intercambio más, no un refugio.
       *
       * LAS RESES SÍ CRUZAN. Un animal a la carrera salta la pasarela; un
       * barril rodando se cae. Por eso la estampida se mide por `alcance` (los
       * píxeles que corre antes de perderse adelante) y no por el borde del
       * vagón: si se frenara en el primer enganche no serviría para nada.
       */
      const seAcabo = ro.tipo === 'res'
        ? (ro.alcance <= 0 || chocaConElBlindado(ro))
        : (train.tramoAt(ro.x) !== 'vagon' || ro.x < player.x - 200);
      if (seAcabo) { rodantes.splice(i, 1); continue; }

      // Una res atropella a los guardias que se le cruzan. Un barril no: pesa,
      // pero no viene corriendo con doscientos kilos de miedo encima.
      if (ro.tipo === 'res') atropellarGuardias(ro);

      // ¿Te llevó puesto? Sólo una vez por barril (o por res).
      if (ro.golpeo || player.tumbado > 0) continue;
      if (Math.abs(ro.x - player.x) > ro.hw + player.hw) continue;
      if (Math.abs(ro.y - player.y) > ro.hh + player.hh) continue;

      ro.golpeo = true;
      llevarsePuesto(ro);
    }
  }

  /**
   * La manada se lleva puesto a cualquier guardia que esté en el pasillo.
   *
   * Usa `stagger`, el mismo estado que ya deja aturdido al que golpeás cuerpo
   * a cuerpo — no hizo falta inventar nada: `systems/ai.js` ya sabe que un
   * guardia con stagger no piensa, no apunta y no dispara. Dura bastante más
   * que un golpe (1,3s contra 0,45): un puñetazo te sacude, media tonelada de
   * animal te tira al piso.
   */
  /**
   * LA MANADA SE ESTRELLA CONTRA EL BLINDADO Y NO PASA.
   *
   * Las reses cruzan los enganches —un animal a la carrera salta la pasarela—
   * pero el vagón blindado es la única puerta del tren que frena el PASO y las
   * BALAS, y sólo la abre la dinamita. Que la manada entrara ahí rompería la
   * regla más vieja del tren: **al blindado no se entra sin volar la puerta**.
   *
   * Se pregunta por `guardType` y no por el nombre del vagón para que valga
   * igual en el blindado largo y en el corto del tren veloz.
   */
  function chocaConElBlindado(ro) {
    const vagon = train.wagons[train.wagonAt(ro.x)];
    return !!vagon && vagon.guardType === 'blindado';
  }

  function atropellarGuardias(ro) {
    const c = CONFIG.estampida;
    ro.atropellados = ro.atropellados || new Set();

    for (const e of enemies) {
      if (!e.alive || ro.atropellados.has(e)) continue;
      if (Math.abs(ro.x - e.x) > ro.hw + e.hw) continue;
      if (Math.abs(ro.y - e.y) > ro.hh + e.hh) continue;

      ro.atropellados.add(e);

      /**
       * LO MATA LA SEGUNDA ESTAMPIDA, NO LA SEGUNDA RES.
       *
       * Una manada entera lo voltea UNA vez: las cinco reses del mismo tropel
       * son un solo evento, y que la segunda del montón lo rematara volvía
       * gratis lo que tiene que ser una jugada preparada.
       *
       * Lo que sí lo mata es que lo agarre OTRA estampida mientras todavía
       * está en el piso — o sea, que hayas ido a abrir una segunda tranquera a
       * tiempo. Por eso cada manada lleva su `estampidaId` y el guardia se
       * acuerda de cuál lo volteó (`aturdidoPor`).
       *
       * Muere en silencio —no dispara la alarma, igual que un degüello— pero
       * deja el cuerpo tirado, y de eso ya se encarga el sistema de cadáveres:
       * el guardia que lo encuentre queda marcado para el resto del asalto.
       */
      const yaEstabaEnElPiso = e.stagger > 0;
      const esOtraManada = e.aturdidoPor !== ro.estampidaId;

      if (c.matalAturdido && yaEstabaEnElPiso && esOtraManada) {
        e.alive = false;
        e.health = 0;
        spawnParticles(e.x, e.y, colors.blood, 10);
        bus.emit('enemyKilled', { enemy: e, byPlayer: true, silent: true });
        continue;
      }

      // Las demás reses de la MISMA manada le pasan por encima sin sumar nada:
      // ya está en el piso, y el reloj de los 3 segundos no se reinicia.
      if (yaEstabaEnElPiso) continue;

      e.aturdidoPor = ro.estampidaId;
      e.stagger = c.aturdeGuardia;
      e.aimTimer = 0;
      e.burstLeft = 0;
      e.peeking = false;
      e.coverPoint = null;
      e.atCover = false;
      spawnParticles(e.x, e.y, '#c9b28a', 6);
      audio.play('hitWall');
    }
  }

  /** Suelta uno en el vagón donde estás, del lado de la locomotora. */
  function soltarRodante() {
    const c = CONFIG.rodante;
    if (train.tramoAt(player.x) !== 'vagon') return;

    const vagon = train.wagons[train.wagonAt(player.x)];
    if (!vagon) return;

    // Nace en el borde de adelante del vagón, o a `adelanto` del jugador si el
    // vagón es largo — lo que quede más cerca.
    const tope = vagon.x + vagon.width - 10;
    const x = Math.min(player.x + c.adelanto, tope);

    // Sin pista suficiente no aparece: preferimos saltear el turno antes que
    // soltar algo imposible de leer.
    if (x - player.x < c.pistaMinima) return;

    rodantes.push(createRodante(x, map.height / 2, rng.pick(TIPOS_RODANTE), rng));
  }

  /**
   * Te llevó puesto.
   *
   * No saca vida (ver CONFIG.rodante): el precio es quedar segundo y medio en
   * el piso sin poder hacer nada, y el porrazo se oye — los guardias de
   * alrededor vienen a mirar qué fue ese estruendo.
   */
  function llevarsePuesto(ro) {
    if (!tumbar(player, ro.x, world)) return;

    floaters.push({
      x: player.x, y: player.y - 22,
      text: T.prompts.teLlevoPuesto, life: 1.6, color: colors.enemyAlert,
    });
    spawnParticles(player.x, player.y, '#c9b28a', 8);
    bus.emit('noise', { x: player.x, y: player.y, radius: CONFIG.rodante.ruidoGolpe });
  }

  /**
   * LA ESTAMPIDA — el ganado como herramienta.
   *
   * Es lo único del juego que VOS le hacés al tren, en vez de al revés. Y es
   * lo que hace jugable al sigilo en el tren de carga: hasta ahora "ir limpio"
   * sólo se podía EVITANDO pelear; esto es una forma de abrir camino sin
   * disparar un tiro.
   *
   * Dos tiempos, como todo lo peligroso de este juego: la tranquera se abre y
   * las reses se AMONTONAN (`arranque`) antes de salir. Ese momento es el
   * aviso — y tu ventana para meterte en un hueco entre corrales, porque la
   * manada no distingue a nadie y a vos también te lleva puesto.
   */
  function updateEstampidas(dt) {
    const c = CONFIG.estampida;

    for (let i = estampidas.length - 1; i >= 0; i--) {
      const es = estampidas[i];

      if (es.arranque > 0) {
        es.arranque -= dt;
        if (es.arranque <= 0) audio.play('estampida');
        continue;
      }

      es.gap -= dt;
      if (es.gap > 0) continue;

      es.gap = c.gap;
      es.faltan -= 1;

      const res = createRodante(es.x, map.height / 2, 'res', rng, {
        dir: 1,                    // hacia la locomotora: DELANTE tuyo, no hacia vos
        velocidad: c.velocidad * rng.range(0.92, 1.08),
        hw: 9, hh: 7,
        balea: false,              // es un bicho vivo, no se revienta a tiros
        alcance: c.alcance,
      });
      // Todas las reses de un mismo tropel comparten id: así el guardia sabe
      // si lo está pisando la manada que ya lo volteó o una nueva.
      res.estampidaId = es.id;
      rodantes.push(res);

      if (es.faltan <= 0) estampidas.splice(i, 1);
    }
  }

  /**
   * Abrir una tranquera: mantener [E] al lado, como la caja fuerte. El precio
   * es el mismo que el de ella — segundos quieto en el peor lugar del vagón.
   */
  function abrirTranquera(tr) {
    const c = CONFIG.estampida;
    tr.abierta = true;
    tr.progreso = 0;

    estampidas.push({
      id: ++estampidaSiguienteId,
      x: tr.x,
      faltan: c.reses,
      arranque: c.arranque,
      gap: 0,
    });

    floaters.push({
      x: tr.x, y: tr.y - 18,
      text: T.prompts.tranqueraAbierta, life: 1.8, color: colors.enemySus,
    });
    audio.play('tranquera');

    /**
     * HACE RUIDO, PERO NO ES UN TIRO. Los guardias de alrededor vienen a mirar
     * qué fue ese escándalo (`alertTo`, sospecha) — pero no se emite `wagons`,
     * así que no propaga la alarma ni la enciende. Ésa es toda la diferencia
     * entre una herramienta de sigilo y un atajo al tiroteo.
     */
    bus.emit('noise', { x: tr.x, y: tr.y, radius: c.ruido });
  }

  /** La tranquera cerrada al alcance de la mano, si este tren tiene. */
  function tranqueraCerca() {
    let cerca = null;
    let mejor = CONFIG.loot.radius + 6;
    for (const tr of tranqueras) {
      if (tr.abierta) continue;
      const d = distance(player.x, player.y, tr.x, tr.y);
      if (d < mejor) { mejor = d; cerca = tr; }
    }
    return cerca;
  }

  /**
   * EL PESO DE LO QUE LLEVÁS — y sólo después de que suene la alarma.
   *
   * Mientras nadie dio la voz, cargás lo que quieras y no pesa nada: un tren
   * limpio te lo podés llevar entero. Apenas suena, cada tanda de plata encima
   * te frena un poco, y lo que agarres a partir de ahí te frena más — así
   * "¿agarro uno más?" pasa a ser una pregunta que te hacés en CADA botín.
   *
   * Ver CONFIG.peso para el porqué de que el castigo sea velocidad y no otra
   * cosa: en este juego los errores se cobran en tiempo y exposición, nunca en
   * vida.
   */
  function lastreActual() {
    // Sólo pesa en los trenes que lo traen (hoy el de carga, ver data/train.js).
    // Es la contracara de su identidad: el tren donde el sigilo se puede jugar
    // en serio es el único donde despertarlo te lo cargás al hombro.
    if (!train.pesaElBotin || !alarm.active) return 0;
    const c = CONFIG.peso;
    return Math.min(c.maximo, (collected / c.porCada) * c.penalizacion);
  }

  /** Reventado a tiros: se hace astillas y deja de ser un problema. */
  function romperRodante(ro) {
    spawnParticles(ro.x, ro.y, ro.tipo === 'barril' ? '#8a5a34' : '#9c7a45', 14);
    audio.play('hitWall');
  }

  /**
   * EL TREN TRAICIONERO — balanceo y tirones.
   *
   * Tres tiempos, siempre los mismos: AVISO (balanceo chico, cero efecto),
   * EFECTO (el sacudón: dispersión de más y empujón, parejo para guardias y
   * jugador) y VUELVE (se asienta). Ver CONFIG.traqueteo para el porqué de
   * cada número.
   */
  function updateTraqueteo(dt) {
    const c = CONFIG.traqueteo;
    if (!train.traqueteoCada) return;

    if (!traqueteoFase) {
      traqueteoTimer -= dt;
      if (traqueteoTimer <= 0) {
        traqueteoTimer = train.traqueteoCada * rng.range(0.8, 1.25);
        traqueteoFase = 'aviso';
        traqueteoFaseTimer = c.avisoTiempo;
        traqueteoVariante = rng.chance(0.5) ? 'acelera' : 'frena';
        audio.play('trenCruje');
      }
      traqueteoSwayX = 0;
      return;
    }

    traqueteoFaseTimer -= dt;

    if (traqueteoFase === 'aviso') {
      // Un balanceo chico, todavía sin efecto: es tu ventana para prepararte.
      traqueteoSwayX = Math.sin(scroll * 14) * 1.6;
      if (traqueteoFaseTimer <= 0) {
        traqueteoFase = 'efecto';
        traqueteoFaseTimer = c.efectoTiempo;
        audio.play(traqueteoVariante === 'acelera' ? 'trenAcelera' : 'trenFrena');
        camera.shake(1.4, 0.15);
        floaters.push({
          x: player.x, y: player.y - 24,
          text: traqueteoVariante === 'acelera' ? T.prompts.trenAcelera : T.prompts.trenFrena,
          life: 1.4, color: colors.enemyAlert,
        });
        // ACELERA sacude la carga: una tanda extra de barriles, reusando el
        // mismo escalonado de siempre (rafagaGap) para que salgan uno por
        // uno y no todos pegados.
        //
        // Y esto CONSUME el ciclo normal de `rodanteTimer`, no lo apila: si
        // no, el sacudón agregaba su tanda y el reloj de siempre —que venía
        // corriendo de fondo, ajeno al sacudón— podía dispararse apenas
        // terminaba, dando el mismo "tres, huequito, tres" que se corrigió
        // arriba, pero por esta otra puerta.
        if (traqueteoVariante === 'acelera' && train.rodantesCada) {
          rodanteRafaga += CONFIG.rodante.barrilesExtra;
          if (rodanteRafagaTimer <= 0) rodanteRafagaTimer = 0.05;
          rodanteTimer = train.rodantesCada * rng.range(0.75, 1.3);
        }
      }
      return;
    }

    if (traqueteoFase === 'efecto') {
      traqueteoSwayX = Math.sin(scroll * 22) * 4.5;

      // El fondo acelera o frena a la vista: es el aviso más claro que hay,
      // y no hace falta explicarlo — ya sabés leer un fondo que vuela.
      const mult = traqueteoVariante === 'acelera' ? 1.6 : 0.4;
      const dir = traqueteoVariante === 'acelera' ? -1 : 1;   // acelera → cola
      const empuje = (c.empujePx / c.efectoTiempo) * dir * dt;

      empujarSiNoEstaACubierto(player, empuje);
      for (const e of enemies) if (e.alive) empujarSiNoEstaACubierto(e, empuje);

      traqueteoVelMult = mult;

      if (traqueteoFaseTimer <= 0) {
        traqueteoFase = 'volver';
        traqueteoFaseTimer = c.volverTiempo;
      }
      return;
    }

    // --- volver ---
    traqueteoSwayX = Math.sin(scroll * 14) * 1.6 * Math.max(0, traqueteoFaseTimer / c.volverTiempo);
    traqueteoVelMult = 1 + (traqueteoVelMult - 1) * Math.max(0, traqueteoFaseTimer / c.volverTiempo);
    if (traqueteoFaseTimer <= 0) {
      traqueteoFase = null;
      traqueteoSwayX = 0;
      traqueteoVelMult = 1;
    }
  }

  /**
   * A CUBIERTO NO TE ARRASTRA. Estar pegado a una pared es estar afianzado —
   * eso es lo que le da a la cobertura un valor nuevo durante el tirón.
   * Funciona igual para el jugador (`p.cover`) que para un guardia
   * parapetado (`e.atCover`).
   */
  function empujarSiNoEstaACubierto(entity, dx) {
    if (entity.cover || entity.atCover) return;
    // El techo es OTRO sistema de movimiento (no usa moveAndCollide contra
    // este tilemap — ver entities/player.js), así que si estás arriba el
    // empujón no te toca: ya tenés tu propio problema con los carteles.
    if (entity.enTecho) return;
    const solid = map.isSolidForMovementAt || map.isSolidAt;
    moveAndCollide(entity, dx, 0, solid);
  }

  /**
   * Te comiste un cartel.
   *
   * Te caés AHÍ MISMO, sobre el techo — no te teletransportás a ningún lado.
   * Perdés una vida y tardás en levantarte, pero lo verdaderamente caro es
   * otra cosa: el porrazo sobre la chapa suena tanto que los guardias de
   * abajo dejan de adivinar. `marcarPosicion` + `alertCombat` con tu posición
   * REAL es la diferencia entre "te oyeron por ahí" y "saben dónde estás".
   */
  function chocarEnTecho(ob) {
    if (!golpearEnTecho(player, ob.x, player.y, world)) return;

    floaters.push({
      x: player.x, y: player.y - 20,
      text: T.prompts.caisteDelTecho, life: 2.2, color: colors.enemyAlert,
    });
    camera.shake(CONFIG.feel.shakeHit, 0.3);

    // El ruido, para los que estén lejos y sólo lo oigan.
    bus.emit('noise', { x: player.x, y: player.y, radius: CONFIG.techo.obstaculoRuido });

    // Y la delación: los del vagón donde caíste saben exactamente dónde estás.
    marcarPosicion(player.x, player.y);
    const wagon = train.wagonAt(player.x);
    for (const e of enemies) {
      if (e.alive && e.wagon === wagon) alertCombat(e, player.x, player.y, world);
    }
    bus.emit('guardAlerted', { x: player.x, y: player.y, wagon });
  }

  /**
   * Pisaste donde no había techo: erraste el salto entre dos vagones, o
   * llegaste al ganado, que va al aire libre y no tiene techo.
   *
   * Caés a nivel del piso EN EL LUGAR donde estabas — un enganche casi
   * siempre, o adentro del ganado si era eso lo que tenías debajo (que es
   * exactamente donde aterrizarías: ese vagón no tiene nada arriba).
   *
   * No sale vida, y no hace falta: quedás al descubierto, a ras del suelo, y
   * con el ruido del golpe encima. El costo es de posición, no de salud.
   */
  function caerAlEnganche() {
    player.enTecho = false;
    player.techoSalto = 0;
    player.techoAgachado = false;
    player.y = CONFIG.techo.centroY;
    techObstacles.length = 0;

    floaters.push({
      x: player.x, y: player.y - 20,
      text: T.prompts.caisteAlEnganche, life: 2.0, color: colors.enemySus,
    });
    camera.shake(1.6, 0.2);
    audio.play('hitWall');
    bus.emit('noise', { x: player.x, y: player.y, radius: CONFIG.techo.obstaculoRuido });
  }

  /**
   * Lo único que entra al tren desde afuera: la gente de la locomotora.
   * Entra por la punta de adelante y camina hacia atrás buscándote. Nunca por
   * atrás, porque atrás está el aire libre y tu caballo.
   */
  function spawnReinforcement() {
    const spawn = train.puntaLocomotora;
    if (!spawn) return;

    // El último vagón (el que está pegado a la locomotora) — antes era un
    // "6" fijo, pero la cantidad de vagones ya no es siempre 6 (el tren de
    // carga trae 8). `train.wagons[0]` es la plataforma de salida, así que
    // el último robable es el último índice del array.
    const ultimoVagon = train.wagons.length - 1;

    const guard = createEnemy(spawn.x, spawn.y, {
      path: train.wagons[ultimoVagon].ronda,
      facing: Math.PI,
      ai: train.ai,
    });
    guard.wagon = ultimoVagon;
    enemies.push(guard);
    train.wagons[ultimoVagon].guardiasVivos++;
    alertCombat(guard, ultimoVisto.x, ultimoVisto.y, world);

    floaters.push({
      x: spawn.x, y: spawn.y - 12,
      text: T.prompts.reinforcementEngine,
      life: 2.2,
      color: '#ff8a5c',
    });
  }

  // -------------------------------------------------------------- actualizar

  function update(dt) {
    scroll += dt;

    if (finished) {
      updateEffects(dt);
      camera.update(dt, rng);
      endTimer -= dt;
      if (endTimer <= 0) goToResults();
      return;
    }

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endRaid('capturedTime');
      return;
    }

    // El apuntado usa la cámara SIN la sacudida: si no, el temblor te haría fallar.
    world.aimX = input.mouse.x + camera.x;
    world.aimY = input.mouse.y + camera.y;

    // El lastre se calcula ANTES de mover al jugador: es lo que decide a qué
    // velocidad camina este cuadro (ver `lastreActual` y CONFIG.peso).
    player.lastre = lastreActual();

    updatePlayer(player, dt, world);
    updateTecho(dt);
    updateEstampidas(dt);
    updateRodantes(dt);
    updateTraqueteo(dt);
    /**
     * ¿Quedaste sobre el vacío? Entre dos vagones, o sobre el ganado que no
     * tiene techo. En el AIRE no cuenta: eso es justamente saltar el hueco.
     * Se pregunta después de mover al jugador, y por eso el salto tiene que
     * durar lo suficiente para cruzar (`techo.saltoDuracion`/`saltoBoost`).
     */
    if (player.enTecho && player.techoSalto <= 0 && !hayTechoEn(player.x)) {
      caerAlEnganche();
    }
    updateJefe(dt);
    updateEnemies(dt);
    separateEnemies(enemies, map);
    for (const pa of passengers) updatePassenger(pa, dt, world);
    for (const d of doors) updateDoor(d, dt, world);
    updateBullets(bullets, dt, world);
    updateExplosives(explosives, dt, world);
    updateRiders(riders, dt, world);
    riderWatch.update(dt, world);
    alarm.update(dt);
    updateWagon();
    updateInteraction(dt);
    updateEffects(dt);

    camera.follow(player.x, player.y, map.bounds, dt);
    camera.update(dt, rng);

    hud.update({
      health: player.health,
      maxHealth: player.maxHealth,
      ammo: player.ammo,
      magazine: player.weapon.magazine,
      reloading: player.reloadTimer > 0,
      dynamite: player.dynamite,
      maxDynamite: CONFIG.player.dynamite,
      fuseLit: player.fuse > 0,
      timeLeft,
      urgent: timeLeft <= CONFIG.raid.urgentAt,
      money: collected,
      lastre: player.lastre,
      alarm: alarm.active,
      inCover: !!player.cover,
      sneaking: player.sneaking,
      wagon: wagonActual,
      wagonName: train.wagons[wagonActual].short,
      // Estando en un enganche no estás "en el vagón 2": estás afuera, entre
      // dos vagones. Decirlo importa, porque ahí no hay dónde cubrirse.
      afuera: train.tramoAt(player.x) !== 'vagon',
      enTecho: player.enTecho,
      // Cuántos vagones faltan para el caballo. Ya no es "en qué vagón estás",
      // porque el caballo puede estar en el medio del tren: ahora se puede
      // estar a dos vagones de la salida yendo para atrás.
      toExit: Math.abs(wagonActual - (train.caballoEn - 1)),
    });
  }

  /**
   * Los guardias que todavía patrullan y están a varios vagones no se
   * actualizan: no cambian nada de lo que ves. Los que ya te vieron sí, a
   * cualquier distancia, para que te puedan perseguir de un vagón a otro.
   */
  /** El reloj del cazarrecompensas: cuánto falta para que suba al tren. */
  function updateJefe(dt) {
    if (!jefePendiente) return;
    jefeTimer -= dt;
    if (jefeTimer > 0) return;

    const tipo = jefePendiente;
    jefePendiente = null;
    spawnJefe(tipo);
  }

  function updateEnemies(dt) {
    const cull = CONFIG.raid.cullPatrolDistance;
    for (const e of enemies) {
      /**
       * El mini jefe corre SIEMPRE, a cualquier distancia y sin pasar por el
       * culling: es lo único del tren que se está moviendo hacia vos aunque
       * esté cuatro vagones atrás. Congelarlo por lejanía sería congelar
       * justamente lo que lo hace un jefe.
       *
       * Y tiene su propia IA (systems/boss.js), no la de guardia. La
       * delegación vive acá y no adentro de `updateEnemy` a propósito: ai.js
       * y boss.js se importarían en círculo, y boss.js ya depende de ai.js
       * para reusarle el buscador de rutas y la línea de visión.
       */
      if (e.esJefe) { updateBoss(e, dt, world); continue; }

      /**
       * El Sheriff y su escolta corren SIEMPRE, sin culling: mientras se
       * repliegan están lejos por definición (para eso se repliegan), y
       * congelarlos por lejanía los dejaría clavados esperándote — que es
       * justo lo contrario de lo que hacen.
       */
      if (e.esSheriff) { updateSheriff(e, dt, world); continue; }
      if (e.escoltaDe) { updateEscolta(e, dt, world); continue; }

      const lejos = Math.abs(e.x - player.x) > cull;
      if (lejos && e.state !== 'combat' && e.state !== 'suspicious') continue;
      updateEnemy(e, dt, world);
    }

    /**
     * El aura del Sheriff (los de su vagón pelean mejor) se recalcula cada
     * 0,3 s y no cada cuadro: es un barrido por todos los guardias del tren y
     * no puede cambiar nada entre un cuadro y el siguiente.
     */
    if (sheriff) {
      auraTimer -= dt;
      if (auraTimer <= 0) {
        auraTimer = 0.3;
        actualizarAuraDelSheriff(sheriff, world);
      }
    }
  }

  /** En qué vagón está el jugador, y hasta dónde llegó a meterse. */
  function updateWagon() {
    const ahora = train.wagonAt(player.x);
    if (ahora === wagonActual) return;

    wagonActual = ahora;
    if (ahora > wagonMasProfundo) wagonMasProfundo = ahora;

    const v = train.wagons[ahora];
    const limpio = !v.esCola && v.guardiasVivos <= 0;
    floaters.push({
      x: player.x, y: player.y - 20,
      text: v.esCola ? T.prompts.cola : `${T.hud.wagon(ahora)} · ${v.short}`,
      life: 1.8,
      color: v.esCola ? colors.doorGlow : limpio ? '#9fd8b8' : colors.text,
    });
  }

  /**
   * Un único verbo, [E]: robar botín, amenazar a un pasajero o escapar.
   *
   * Que sea uno solo es deliberado. El juego ya te pide bastante con las dos
   * manos; agregar una tecla para cada cosa sería más "completo" y peor de
   * jugar. Lo que hace [E] depende de qué tengas más cerca, y el cartel sobre
   * tu cabeza siempre dice cuál de las tres va a pasar.
   */
  function updateInteraction(dt) {
    // Se apaga cada cuadro y lo prenden las ramas de abajo: si nadie lo
    // prende, no estás robando nada.
    world.robando = false;

    if (player.enTecho) { updateBajarTecho(dt); return; }

    const holding = input.isDown('KeyE') && player.alive;
    const nearest = nearestLoot();
    const victima = nearest ? null : nearestPassenger();
    const tranquera = (nearest || victima) ? null : tranqueraCerca();

    for (const l of loot) {
      if (l !== nearest || !holding) l.progress = 0;
    }
    for (const pa of passengers) {
      if (pa !== victima || !holding) pa.robProgress = 0;
    }
    for (const tr of tranqueras) {
      if (tr !== tranquera || !holding) tr.progreso = 0;
    }

    // La tranquera del corral: el mismo [E] de siempre, sostenido.
    if (tranquera && holding) {
      tranquera.progreso += dt;
      if (tranquera.progreso >= CONFIG.estampida.abrirHold) abrirTranquera(tranquera);
      escapeProgress = 0;
      return;
    }

    if (nearest && holding) {
      nearest.progress += dt;
      if (nearest.progress >= nearest.duration) takeLoot(nearest);
      escapeProgress = 0;
      /**
       * ROBAR LLAMA AL CAZARRECOMPENSAS (ver `acecho` en data/bosses.js).
       *
       * Es lo que lo saca de acecharte desde atrás. Hasta ahora robar sólo
       * costaba TIEMPO; ahora además lo llama, y por eso cada botín pasa de
       * "¿me alcanza el reloj?" a "¿me lo quiero traer encima ahora?". La
       * caja fuerte —6,5 s quieto y de espaldas— es donde más se siente.
       */
      world.robando = true;
      return;
    }

    // Amenazar: le sacás la plata y te queda un testigo con las manos arriba
    // que en unos segundos va a gritar.
    if (victima && holding) {
      victima.robProgress += dt;
      if (victima.robProgress >= CONFIG.passenger.robTime) robarPasajero(victima);
      escapeProgress = 0;
      // Amenazar también es robar: para el que te está midiendo desde atrás,
      // los dos son lo mismo — te quedaste quieto.
      world.robando = true;
      return;
    }

    if (!nearest && !victima && !tranquera && isInsideZone(player, train.exitZone)) {
      if (holding) {
        escapeProgress += dt;
        if (escapeProgress >= CONFIG.raid.escapeHold) endRaid('escaped');
      } else {
        escapeProgress = 0;
      }
    } else {
      escapeProgress = 0;
    }
  }

  /**
   * BAJAR DEL TECHO A PROPÓSITO. Es una acción simple —no reusa los grados
   * limpio/sucio/errado del salto: la destreza ya se jugó caminando el
   * techo, cobrarla dos veces por la misma maniobra no suma nada.
   *
   * Sólo se puede en un enganche (nunca directo adentro de un vagón: la
   * puerta sigue de por medio, igual que si hubieras entrado por abajo), y
   * en CUALQUIERA, no sólo el de donde subiste. En el enganche antes o
   * después del blindado no hay excepción especial que hacer: ese enganche
   * no es "adentro" de nada, así que la puerta blindada sigue rigiendo del
   * otro lado exactamente igual que siempre.
   */
  function updateBajarTecho(dt) {
    const holding = input.isDown('KeyE') && player.alive;
    const borde = bordeParaBajar();

    if (borde !== null && holding && player.techoSalto <= 0 && player.techoCaido <= 0) {
      techoBajarProgress += dt;
      if (techoBajarProgress >= CONFIG.techo.bajarHold) {
        player.enTecho = false;
        player.x = borde;
        player.y = CONFIG.techo.centroY;
        techObstacles.length = 0;
        techoBajarProgress = 0;
        audio.play('cover');
      }
    } else {
      techoBajarProgress = 0;
    }
  }

  /**
   * ¿Estás al borde de un techo, con un enganche justo al lado?
   *
   * Devuelve el x del enganche al que bajarías, o null. Hay que estar CERCA
   * DEL BORDE porque el enganche ya no tiene techo encima: no se puede estar
   * parado sobre uno estando arriba, se está al filo del vagón mirando el
   * hueco.
   *
   * Y ahí está la diferencia que importa: descolgarse a propósito
   * (mantener [E]) es silencioso; pisar el vacío por error es `caerAlEnganche`
   * — el mismo destino, pero con el estruendo y los guardias avisados. La
   * misma maniobra, hecha bien o hecha mal.
   */
  function bordeParaBajar() {
    if (!hayTechoEn(player.x)) return null;

    const idx = train.wagonAt(player.x);
    const w = train.wagons[idx];
    if (!w) return null;

    /**
     * Se mide contra el BORDE DEL VAGÓN, no contra el centro del enganche.
     * Los enganches no miden todos lo mismo (el del caballo es una columna
     * más ancho, ver `planificarTramos`), así que medir al centro daba una
     * ventana distinta en cada enganche — y encima invisible. El borde del
     * techo, en cambio, se ve.
     *
     * `plataformas[i]` es la que está JUSTO ANTES del vagón i: la de atrás
     * es la de este vagón, la de adelante es la del siguiente.
     */
    const alcance = CONFIG.techo.bajarAlcance;
    if (player.x - w.x < alcance && train.plataformas[idx]) {
      return train.plataformas[idx].x;
    }
    if ((w.x + w.width) - player.x < alcance && train.plataformas[idx + 1]) {
      return train.plataformas[idx + 1].x;
    }
    return null;
  }

  function nearestLoot() {
    let nearest = null;
    let nearestDist = CONFIG.loot.radius;
    for (const l of loot) {
      if (l.taken) continue;
      const d = distance(player.x, player.y, l.x, l.y);
      if (d < nearestDist) { nearestDist = d; nearest = l; }
    }
    return nearest;
  }

  /** El pasajero al alcance de la mano, si es que se le puede sacar algo. */
  function nearestPassenger() {
    let nearest = null;
    let nearestDist = CONFIG.loot.radius;
    for (const pa of passengers) {
      if (!sePuedeAmenazar(pa)) continue;
      const d = distance(player.x, player.y, pa.x, pa.y);
      if (d < nearestDist) { nearestDist = d; nearest = pa; }
    }
    return nearest;
  }

  function robarPasajero(pa) {
    const c = CONFIG.passenger;
    const valor = rng.int(c.robMin, c.robMax);
    collected += valor;
    amenazados++;
    amenazado(pa);

    floaters.push({ x: pa.x, y: pa.y - 10, text: `+$${valor}`, life: 1.4, color: colors.bagLoot });
    spawnParticles(pa.x, pa.y, colors.bagLoot, 5);
    audio.play('loot');
    // Amenazar no hace ruido: el escándalo viene después, cuando grite.
  }

  function takeLoot(l) {
    l.taken = true;
    l.progress = 0;
    collected += l.value;

    floaters.push({ x: l.x, y: l.y - 8, text: `+$${l.value}`, life: 1.4, color: colors.bagLoot });
    spawnParticles(l.x, l.y, colors.bagLoot, 6);
    audio.play(l.noisy ? 'strongbox' : 'loot');

    // La caja fuerte hace un ruido que se oye en el vagón entero y en los de
    // al lado. Ya no es "todo el mapa": el mapa ahora es un tren de 4500px.
    if (l.noisy) bus.emit('noise', { x: l.x, y: l.y, radius: 900 });
  }

  function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
    }

    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= 14 * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }

    for (let i = blastMarks.length - 1; i >= 0; i--) {
      blastMarks[i].life -= dt;
      if (blastMarks[i].life <= 0) blastMarks.splice(i, 1);
    }
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = rng.range(0, Math.PI * 2);
      const speed = rng.range(20, 70);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rng.range(0.2, 0.45),
        color,
      });
    }
  }

  // ---------------------------------------------------------------- terminar

  function endRaid(result) {
    if (finished) return;
    finished = true;
    outcome = result;
    endTimer = result === 'escaped' ? 0.5 : 1.2;
    camera.shake(2, 0.3);
    audio.play(result === 'escaped' ? 'escape' : 'captured');
  }

  function goToResults() {
    const leftBehind = loot
      .filter((l) => !l.taken)
      .reduce((sum, l) => sum + l.value, 0);

    // Trabajo limpio: escapar sin que suene la alarma paga el doble. Es lo que
    // hace que jugar callado compita con reventar la caja fuerte a los tiros.
    const escaped = outcome === 'escaped';
    const cleanBonus = escaped && !alarm.active
      ? Math.round(collected * CONFIG.raid.cleanBonus)
      : 0;

    const summary = {
      outcome,
      money: escaped ? collected + cleanBonus : 0,
      collected,
      cleanBonus,
      leftBehind,
      kills,
      civilians,
      amenazados,
      /**
       * Matarlo cuenta AUNQUE TE CAPTUREN. No es botín (que se pierde si no
       * escapás): es un hecho, y ya pasó. La recompensa que te saca de encima
       * te la ganaste peleando, no llevándotela en el bolsillo.
       */
      /**
       * De los dos mini jefes sólo puede haber UNO por asalto (sus bandas de
       * recompensa no se superponen — ver `jefeParaEsteAsalto`), así que un
       * solo par de campos alcanza para los dos.
       */
      jefeMuerto: jefeMuerto || sheriffMuerto,
      jefeId: jefe ? jefe.id : (sheriff ? sheriff.jefeTipo.id : null),
      alarm: alarm.active,
      timeUsed: duracionInicial - timeLeft,
      boardedAt: train.boardedAt,
      deepest: wagonMasProfundo,
      composition: train.wagons.slice(1).map((w) => w.short),
    };

    applyRaidResult(summary);
    scenes.goTo('results', summary);
  }

  // ---------------------------------------------------------------- dibujar

  function render(r) {
    drawOutside(r);

    r.ctx.save();
    // El balanceo del traqueteo se suma ACÁ, aparte de camera.renderX: es un
    // efecto visual encima de la cámara, no un movimiento real de la cámara
    // (world.aimX/aimY siguen usando camera.x limpio, así que el balanceo no
    // te desvía la puntería — sólo se ve).
    const swayX = camera.renderX + Math.round(traqueteoSwayX);
    r.ctx.translate(-swayX, -camera.renderY);

    drawTrain(r, train, colors, swayX, camera.renderY);

    for (const d of doors) if (visible(d)) drawDoor(r, d, colors);

    for (const tr of tranqueras) if (visible(tr)) dibujarTranquera(r, tr);

    for (const l of loot) if (visible(l)) drawLootable(r, l);

    for (const p of particles) {
      r.ctx.globalAlpha = Math.min(1, p.life * 3);
      r.box(p.x, p.y, 1, 1, p.color);
    }
    r.ctx.globalAlpha = 1;

    // El jefe se dibuja con lo suyo (tiene silueta propia); todo lo demás de
    // la lista `enemies` es un guardia común.
    const pintar = (e) => (e.esJefe ? drawBoss(r, e) : drawEnemy(r, e));

    for (const pa of passengers) if (!pa.alive && visible(pa)) drawPassenger(r, pa);
    for (const e of enemies) if (!e.alive && visible(e)) pintar(e);
    for (const pa of passengers) if (pa.alive && visible(pa)) drawPassenger(r, pa);
    for (const e of enemies) if (e.alive && visible(e)) pintar(e);

    // Los barriles van DESPUÉS de los guardias: son un bulto que rueda por el
    // pasillo y tiene que taparlos, igual que les tapa la línea de tiro.
    for (const ro of rodantes) if (visible(ro)) drawRodante(r, ro);

    // Los jinetes van afuera del tren, así que se dibujan antes que el jugador
    // pero después del vagón: quedan "detrás" de la pared, como corresponde.
    for (const rd of riders) drawRider(r, rd);

    // El techo tapa lo de abajo (guardias, botín, puertas) igual que a vos
    // te tapa a vos de ellos. Por eso se dibuja DESPUÉS de todo lo de
    // adentro y ANTES del jugador: lo cubre a todo eso, pero no a vos.
    drawTecho(r);

    drawPlayer(r, player);
    for (const b of bullets) drawBullet(r, b);
    for (const ex of explosives) drawExplosive(r, ex);

    // La onda expansiva, un instante después del estruendo.
    for (const m of blastMarks) {
      const t = 1 - m.life / 0.35;
      r.circle(m.x, m.y, m.radius * (0.4 + t * 0.9), '#ffd08a', 1 - t);
    }

    drawPrompts(r);

    for (const f of floaters) {
      r.ctx.globalAlpha = Math.min(1, f.life * 2);
      r.text(f.text, f.x, f.y, f.color);
    }
    r.ctx.globalAlpha = 1;

    r.ctx.restore();
  }

  /**
   * EL TECHO. Se dibujan TODOS los que entran en pantalla, no sólo el que
   * estás pisando, y eso no es un lujo: **el hueco entre dos techos es lo que
   * hay que saltar**, así que tenés que poder verlo venir. Un techo que
   * apareciera recién cuando lo pisás haría el salto imposible de calcular.
   *
   * Cada plancha tapa el vagón entero (por eso se dibuja después de guardias
   * y botín: arriba no ves lo de abajo, igual que ellos no te ven a vos) y
   * termina justo en el borde del vagón, dejando el enganche al descubierto.
   */
  function drawTecho(r) {
    if (!player.enTecho) return;
    const ct = CONFIG.techo;

    for (const w of train.wagons) {
      if (w.esCola || !w.tieneTecho) continue;
      if (w.x > camera.renderX + renderer.width + 20 || w.x + w.width < camera.renderX - 20) continue;

      r.rect(w.x, 0, w.width, map.height, colors.techo);
      r.rect(w.x, 0, w.width, 4, colors.techoBorde);
      r.rect(w.x, map.height - 4, w.width, 4, colors.techoBorde);

      // Los bordes de la franja pisable: son la baranda visual del "no te
      // vayas para el costado". El equilibrio es geometría, no un medidor.
      r.rect(w.x, ct.centroY - ct.ancho - 1, w.width, 1, colors.techoBorde);
      r.rect(w.x, ct.centroY + ct.ancho, w.width, 1, colors.techoBorde);

      // Las tablas, para que se lea el movimiento del tren bajo tus pies.
      for (let tx = w.x + 8; tx < w.x + w.width - 4; tx += 16) {
        r.rect(tx, ct.centroY - ct.ancho + 1, 1, ct.ancho * 2 - 2, colors.techoBorde);
      }
    }

    for (const ob of techObstacles) dibujarObstaculoTecho(r, ob);
  }

  /**
   * Los carteles que vienen. Tienen que gritar CUÁL de las dos cosas hay que
   * hacer, porque toda la mecánica es decidir rápido:
   *
   *  - `agachar` viene ALTO: se dibuja arriba, cruzando el techo entero, con
   *    una flecha para abajo. Te tenés que achicar.
   *  - `saltar` viene BAJO: un bulto pegado al piso del techo, con una flecha
   *    para arriba. Le tenés que pasar por encima.
   */
  function dibujarObstaculoTecho(r, ob) {
    const ct = CONFIG.techo;
    const y = ct.centroY;
    const w = ct.obstaculoAncho;

    if (ob.tipo === 'agachar') {
      // Un gantry: dos patas y un travesaño por encima de tu cabeza.
      r.rect(ob.x - w, y - ct.ancho - 4, w * 2, 4, colors.techoObstaculo);
      r.rect(ob.x - w, y - ct.ancho - 4, w * 2, 1, colors.textDim);
      r.rect(ob.x - w + 1, y - ct.ancho, 2, ct.ancho * 2, colors.techoObstaculo);
      r.rect(ob.x + w - 3, y - ct.ancho, 2, ct.ancho * 2, colors.techoObstaculo);
      if (!ob.resuelto) r.text('▼', ob.x, y - ct.ancho - 8, colors.enemySus);
    } else {
      // Un bulto bajo cruzando la franja: hay que saltarlo.
      r.rect(ob.x - w, y - 4, w * 2, 8, colors.techoObstaculo);
      r.rect(ob.x - w, y - 4, w * 2, 2, colors.textDim);
      if (!ob.resuelto) r.text('▲', ob.x, y - 12, colors.bagLoot);
    }
  }

  /** ¿Esto cae dentro de la pantalla? Con un tren de 4500px, casi nada lo hace. */
  function visible(entity) {
    return (
      entity.x > camera.renderX - 24 &&
      entity.x < camera.renderX + renderer.width + 24
    );
  }

  /**
   * El paisaje que pasa: es lo único que vende que el tren se mueve.
   *
   * Va en TRES capas a distinta velocidad. La de atrás casi no se mueve (son
   * los cerros, lejos) y la de adelante vuela (es el pasto al lado de la vía).
   * Esa diferencia es lo que da sensación de velocidad; una sola capa, por
   * rápida que vaya, se lee como un fondo que parpadea.
   */
  function drawOutside(r) {
    r.clear('#241b16');
    const P = CONFIG.parallax;

    /**
     * EL TIRÓN SE VE ACÁ, y es el aviso más claro que tiene todo el sistema:
     * el fondo acelera o frena DE VERDAD (`traqueteoVelMult`). No hace falta
     * explicarlo con texto — ya sabés leer un fondo que vuela más rápido o se
     * frena en seco, es el mismo lenguaje que ya usa toda la escena.
     */
    const vel = P.velocidad * traqueteoVelMult;

    // Arriba del tren y abajo, en espejo. El desfase entre los dos lados es a
    // propósito: si pasan sincronizados se lee como una grilla marchando.
    drawParallax(r, P.capas.map((c, i) => ({
      ...c, v: c.v * vel, y: i * 4,
    })), scroll, r.width);

    drawParallax(r, P.capas.map((c, i) => ({
      ...c, v: c.v * vel, y: r.height - 3 - i * 4,
    })), scroll * 1.08, r.width);

    // Rayas de velocidad en las dos franjas de afuera, nunca sobre el tren.
    drawSpeedLines(r, scroll, r.width, {
      ...P.rayas, velocidad: P.rayas.velocidad * vel,
      desde: 1, hasta: 22,
    });
    drawSpeedLines(r, scroll * 1.2, r.width, {
      ...P.rayas, velocidad: P.rayas.velocidad * vel,
      desde: r.height - 22, hasta: r.height - 1,
    });
  }

  /**
   * LA TRANQUERA DEL CORRAL.
   *
   * Cerrada es un pasador de hierro cruzado sobre la madera; abierta queda
   * colgando de un costado. Tiene que leerse de un vistazo cuál es cuál desde
   * el otro lado del vagón, porque decidir si te queda una a mano es parte de
   * cómo planeás el recorrido.
   */
  function dibujarTranquera(r, tr) {
    const arriba = tr.lado === 'arriba';
    const hacia = arriba ? -1 : 1;

    if (tr.abierta) {
      /**
       * ABIERTA: las dos hojas quedaron giradas contra los postes, y en el
       * medio queda el HUECO. Que se lea el hueco es lo importante — es lo que
       * dice "por acá ya salieron" de un vistazo, sin tener que acordarse.
       */
      r.rect(tr.x - 10, tr.y + hacia * 1, 3, hacia * 9 || 9, colors.railing);
      r.rect(tr.x + 7, tr.y + hacia * 1, 3, hacia * 9 || 9, colors.railing);
      return;
    }

    /**
     * CERRADA: dos travesaños de madera y el PASADOR DE HIERRO cruzado.
     *
     * El pasador es lo único metálico del vagón entero, y por eso es lo que la
     * hace visible entre tanta madera marrón: sin él, la tranquera se perdía
     * contra los corrales, que son del mismo color y la misma forma.
     */
    r.rect(tr.x - 10, tr.y + hacia * 1, 20, 2, colors.railingTop);
    r.rect(tr.x - 10, tr.y + hacia * 6, 20, 2, colors.railing);
    r.rect(tr.x - 10, tr.y + hacia * 1, 2, hacia * 7 || 7, colors.railing);
    r.rect(tr.x + 8, tr.y + hacia * 1, 2, hacia * 7 || 7, colors.railing);

    r.rect(tr.x - 6, tr.y + hacia * 3, 12, 3, colors.strongbox);
    r.rect(tr.x - 6, tr.y + hacia * 3, 12, 1, '#b6c0cc');
    r.box(tr.x + 4, tr.y + hacia * 4, 2, 2, '#b6c0cc');
  }

  function drawPrompts(r) {
    if (!player.alive || finished) return;

    if (player.enTecho) {
      if (bordeParaBajar() !== null) {
        r.text(T.prompts.bajar, player.x, player.y - 16, colors.doorGlow);
        if (techoBajarProgress > 0) {
          const w = 22;
          r.rect(player.x - w / 2, player.y - 12, w, 3, '#1a1512');
          r.rect(player.x - w / 2, player.y - 12,
            w * (techoBajarProgress / CONFIG.techo.bajarHold), 3, colors.doorGlow);
        }
      }
      // Las teclas cambian acá arriba, así que se recuerdan los primeros
      // segundos: nadie tiene por qué adivinar que Espacio dejó de agachar.
      if (scroll < 8) {
        r.text(T.prompts.techoAyuda, player.x, player.y + 22, colors.textDim);
      }
      return;
    }

    const nearest = nearestLoot();
    if (nearest) {
      r.text(T.prompts.loot(nearest.name), player.x, player.y - 16, colors.text);
      return;
    }

    const tranquera = tranqueraCerca();
    if (tranquera) {
      r.text(T.prompts.tranquera, player.x, player.y - 16, colors.enemySus);
      if (tranquera.progreso > 0) {
        const w = 22;
        r.rect(player.x - w / 2, player.y - 12, w, 3, '#1a1512');
        r.rect(player.x - w / 2, player.y - 12,
          w * (tranquera.progreso / CONFIG.estampida.abrirHold), 3, colors.enemySus);
      }
      return;
    }

    const victima = nearestPassenger();
    if (victima) {
      r.text(T.prompts.threaten, player.x, player.y - 16, colors.civilianRun);
      if (victima.robProgress > 0) {
        const w = 22;
        r.rect(player.x - w / 2, player.y - 12, w, 3, '#1a1512');
        r.rect(player.x - w / 2, player.y - 12,
          w * (victima.robProgress / CONFIG.passenger.robTime), 3, colors.bagLoot);
      }
      return;
    }

    if (isInsideZone(player, train.exitZone)) {
      r.text(T.prompts.escape, player.x, player.y - 16, colors.doorGlow);
      if (escapeProgress > 0) {
        const w = 22;
        r.rect(player.x - w / 2, player.y - 12, w, 3, '#1a1512');
        r.rect(
          player.x - w / 2, player.y - 12,
          w * (escapeProgress / CONFIG.raid.escapeHold), 3, colors.doorGlow
        );
      }
      return;
    }

    if (player.cover && player.peek < 0.2) {
      r.text(T.prompts.peek, player.x, player.y - 16, '#9fd8b8');
    }

    if (player.ammo === 0 && player.reloadTimer <= 0) {
      r.text(T.prompts.empty, player.x, player.y + 16, '#ff9a63');
    }
  }

  return { enter, exit, update, render };
}

/** Módulo que funciona bien con números negativos. */
function wrap(value, min, max) {
  const span = max - min;
  return ((((value - min) % span) + span) % span) + min;
}
