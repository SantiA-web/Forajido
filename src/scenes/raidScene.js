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
import {
  updatePlayer, drawPlayer, golpearEnTecho, tumbar, dispersionActual,
} from '../entities/player.js';
import {
  createRodante, updateRodante, drawRodante, TIPOS_RODANTE,
} from '../entities/rodante.js';
import { updateCajon, drawCajon, vaciarCajon } from '../entities/cajon.js';
import { createEnemy, drawEnemy } from '../entities/enemy.js';
import { createBoss, drawBoss } from '../entities/boss.js';
import { updateBoss } from '../systems/boss.js';
import {
  updateSheriff, updateEscolta, actualizarAuraDelSheriff, apagarAura,
} from '../systems/sheriff.js';
import { jefeParaEsteAsalto, BOSSES } from '../data/bosses.js';
import { guardHealth } from '../data/guards.js';
import { robTimeDe } from '../data/paquetes.js';
import {
  updatePassenger, drawPassenger, panic, amenazado, sePuedeAmenazar,
} from '../entities/passenger.js';
import { createBullet, drawBullet } from '../entities/bullet.js';
import { createExplosive, drawExplosive } from '../entities/explosive.js';
import { EXPLOSIVES } from '../data/explosives.js';
import { drawRider } from '../entities/rider.js';
import { updateRiders, createRiderWatch } from '../systems/riders.js';
import { maxJinetesPara } from '../data/riders.js';
import { drawLootable, esCajaFuerte } from '../entities/lootable.js';
import {
  updateDoor, puertaTapaVision, drawDoor, trabarPuerta, destrabarPuerta, dañarPuerta,
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
  // Los cajones de pólvora del vagón de armas (Fase 6a, entities/cajon.js).
  let cajones;
  // La tormenta que se oye (CONFIG.tormenta). `cubiertoAntes` guarda el estado
  // anterior para tocar el volumen sólo cuando cambia, no cada cuadro.
  let hayTormenta, truenoTimer, cubiertoAntes;
  let traqueteoTimer, traqueteoFase, traqueteoFaseTimer, traqueteoVariante, traqueteoSwayX;
  let traqueteoVelMult = 1;
  let timeLeft, duracionInicial, collected, kills, civilians, amenazados, escapeProgress;
  /**
   * LO QUE LLEVÁS ENCIMA QUE NO ES PLATA (ver data/objetos.js). Va aparte de
   * `collected` a propósito: `collected` es el dinero, y sobre el dinero están
   * calculados el bono de trabajo limpio, la racha y el rescate. Meter los
   * objetos ahí habría movido tres fórmulas ya afinadas sin que nadie lo pida.
   */
  let objetos;
  let rendidosMatados, noqueadosRematados, noqueadosLimpios;
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
    // La mira dibujada reemplaza a la cruz del sistema: ver `mostrarCursorDelSistema`.
    mostrarCursorDelSistema(false);

    // `boardAt` sigue aceptándose porque es lo que usa la consola para saltear
    // la pantalla de abordaje, y ahora quiere decir lo mismo que caballoEn:
    // dónde dejaste el caballo es dónde subís.
    const caballoEn = params.caballoEn ?? params.boardAt ?? 1;
    train = buildTrain(
      rng, caballoEn, params.composicion || null, params.dificultad || null,
      gameState.weapon, params.tipoTren || null, gameState.melee,
      {
        climaId: params.clima || null,
        estado: params.estado || [],
        comportamientos: params.comportamientos || [],
        variantes: params.variantes || [],
        encubiertos: params.encubiertos || [],
        paquetes: params.paquetes || [],
        cajaOculta: !!params.cajaOculta,
      }
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

    cajones = train.cajones || [];

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
    objetos = [];
    kills = 0;
    civilians = 0;
    amenazados = 0;
    rendidosMatados = 0;
    noqueadosRematados = 0;
    noqueadosLimpios = 0;
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
      /**
       * LOS CAJONES DE PÓLVORA (Fase 6a). Los leen dos sistemas: `combat.js`
       * (las balas les pegan y los prenden) y `explosives.js` (una explosión
       * adentro del vagón los encadena). Va como getter, igual que los
       * barriles, porque la lista se reemplaza entera en cada `enter`.
       */
      get cajones() { return cajones; },
      /**
       * `F` EMPUJA UN CAJÓN SI TENÉS UNO AL LADO; SI NO, GOLPEA.
       *
       * Lo pregunta `updatePlayer` (entities/player.js) y devuelve si hubo
       * empujón, para no hacer las dos cosas con la misma tecla. Es el mismo
       * criterio que ya tiene `[E]`, que roba, amenaza, abre una tranquera o
       * escapa según qué tengas más cerca — un verbo, varias cosas, y el cartel
       * sobre la cabeza dice cuál.
       *
       * LA RUEDITA SIGUE SIENDO SIEMPRE EL CUCHILLO, a propósito: si querés
       * golpear a alguien parado al lado de un cajón, ése es el gesto. Las dos
       * teclas del cuerpo a cuerpo dejaron de ser idénticas y ésa es la
       * diferencia.
       */
      empujarCajon: () => {
        const c = cajonCerca(false);
        return c ? empujarCajon(c) : false;
      },
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
        /**
         * La trabada frena MIENTRAS ESTÉ CERRADA. El `!d.open` es nuevo y
         * antes no hacía falta: una trabada no se abría nunca, así que
         * preguntarlo habría sido preguntar por algo imposible. Ahora el
         * Dinamitero lleva la llave (`tieneLlave`, ver entities/door.js), y
         * sin esto la abría y se la comía igual — la puerta se veía abierta y
         * seguía siendo un muro, para él y para vos.
         *
         * Y ahí está la ventana que gana el que lo viene siguiendo: mientras
         * él la sostiene, y los 1,6 s del vaivén hasta que se cierra sola, esa
         * puerta se cruza. Después vuelve a ser pared.
         *
         * La blindada no mira `open` a propósito: es chapa y su única llave
         * sigue siendo la dinamita.
         */
        const frena = d.kind === 'blindada' || (d.trabada && !d.open);
        if (frena && !d.broken &&
            Math.abs(x - d.x) < d.hw && Math.abs(y - d.y) < d.hh) {
          return true;
        }
      }
      return false;
    };
    /**
     * LOS CAJONES DE PÓLVORA TAMBIÉN FRENAN EL PASO (Fase 6a).
     *
     * *(Santi, jugándolo: "los barriles también deberían tener colisión")*
     *
     * Antes se les caminaba por encima como a una bolsa, y eso les sacaba la
     * mitad de lo que son: ya frenaban balas —o sea que ya eran cobertura— pero
     * no se los podía usar para tapar un pasillo ni se sentían un bulto. Ahora
     * son las dos cosas a la vez.
     *
     * Va acá adentro y no en `map.isSolidAt` por el mismo motivo que las
     * puertas: `systems/cover.js` pregunta por `isSolidAt` para decidir contra
     * qué pegarse, y no queremos que el jugador se parapete contra una bomba
     * sin haberlo elegido. Frena el paso; para cubrirte, tenés que caminar.
     *
     * Y no entra el que va ROLANDO (ése ya no está en `cajones`): un bulto que
     * viene hacia vos tiene que poder pasarte por encima, no frenarse contra
     * tus pies.
     */
    const bloqueaCajon = (x, y) => {
      for (const c of cajones) {
        if (c.alive && Math.abs(x - c.x) < c.hw && Math.abs(y - c.y) < c.hh) return true;
      }
      return false;
    };
    map.isSolidForMovementAt = (x, y) =>
      map.isSolidAt(x, y) || bloqueaPuertaCerrada(x, y) || bloqueaCajon(x, y);

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
    arrancarTormenta();

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
     * Dos caminos posibles, y se leen distinto:
     *
     *  - `params.alarmaInicial`: te vieron desde una ventanilla mientras
     *    galopabas pegado al tren. Es el castigo más caro que tiene el juego
     *    y ni siquiera hace falta explicarlo: perdés el bono de trabajo
     *    limpio antes de haber robado nada, y encima empezás con los
     *    guardias de tu vagón y del de atrás caminando hacia vos. Es lo que
     *    le da peso al galope: adelantarte no sólo cuesta reloj y aguante,
     *    también te hace pasar al lado de más gente que puede verte.
     *  - `estado.includes('alertaActivada')`: no hiciste nada — este
     *    SERVICIO en particular ya venía sobre aviso antes de que subieras
     *    (data/modifiers.js). Mismo mecanismo, otro origen, y por eso el
     *    aviso en pantalla es distinto: no fue un error tuyo.
     */
    const estadoTren = params.estado || [];
    if (params.alarmaInicial || estadoTren.includes('alertaActivada')) {
      alarm.trigger(train.boardedAt);
      floaters.push({
        x: player.x, y: player.y - 32,
        text: params.alarmaInicial ? T.prompts.yaTeVieron : T.prompts.trenAlerta,
        life: 3.0, color: colors.enemyAlert,
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
      // Vida FIJA, no la del tipo + la dificultad del tren: es un tipo con
      // nombre y tiene que costar siempre lo mismo. Ver `vida` en data/bosses.js.
      health: tipo.vida,
      path: v.ronda,
      facing: Math.PI,
      ai: train.ai,
    });
    sheriff.wagon = idx;
    sheriff.esSheriff = true;
    sheriff.jefeTipo = tipo;
    sheriff.sheriffVelocidad = tipo.velocidadRepliegue;
    sheriff.auraTipo = tipo.auraDificultad;
    /**
     * DEFENSIVO: se cubre y dispara, pero no da un paso hacia vos (ver
     * `defensivo` en systems/ai.js). Es lo que le deja pelear sin volverse un
     * perseguidor, o sea sin pisarle la identidad al Cazarrecompensas.
     *
     * `grupoDefensa` los ata a él y a sus tres: es lo que hace que se turnen
     * para asomarse en vez de exponerse los cuatro juntos.
     */
    sheriff.defensivo = true;
    sheriff.grupoDefensa = sheriff;
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
       * PELEAN DEFENDIENDO, NO ATACANDO — pedido de Santi después de jugarlo.
       * `defensivo` les saca la parte de avanzar hacia el jugador (systems/
       * ai.js) y `grupoDefensa` los pone a turnarse las asomadas con el
       * Sheriff, así nunca están los cuatro expuestos a la vez.
       *
       * Y `ladoPreferido` alterna: el slot par se asoma por un lado y el
       * impar por el otro. Sin esto los tres probaban el mismo lado primero
       * (`findPeek` en systems/cover.js) y cubrían tres veces el mismo ángulo
       * — que es justo lo contrario de cubrirse entre ellos.
       */
      g.defensivo = true;
      g.grupoDefensa = sheriff;
      g.ladoPreferido = i % 2 === 0 ? 1 : -1;
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
  /**
   * EL LUGAR LIBRE MÁS CERCANO A UN PUNTO, para alguien del tamaño de un
   * guardia. Lo usa el civil encubierto al levantarse del asiento (ver
   * `civilRevelado`): prueba el punto mismo y después se va abriendo en
   * anillos, primero para arriba y para abajo — que es donde está el pasillo
   * en todos los vagones — y recién después a los costados.
   *
   * Si no encuentra nada (no debería pasar: el pasillo está siempre a un par
   * de píxeles), devuelve el punto original y que el motor se arregle, igual
   * que hacía antes.
   */
  function lugarLibreCerca(x, y) {
    const solido = map.isSolidForMovementAt || map.isSolidAt;
    const hw = CONFIG.enemy.hw, hh = CONFIG.enemy.hh;
    const libre = (px, py) =>
      !solido(px - hw, py - hh) && !solido(px + hw, py - hh) &&
      !solido(px - hw, py + hh) && !solido(px + hw, py + hh);

    /**
     * 🐛 NO ALCANZA CON QUE ENTRE: TIENE QUE PODER CAMINAR.
     *
     * La primera versión buscaba el primer lugar donde el guardia ENTRARA, y
     * eso lo dejaba parado en el hueco entre dos bloques de asientos —
     * medido con una grilla de solidez alrededor suyo:
     *
     *     ..###G.###.      ← el hueco donde estaba sentado
     *     .......P...      ← el pasillo, una fila más abajo
     *
     * Entraba perfecto y no era sólido, pero tenía asientos pegados a los dos
     * costados: su cobertura quedaba del otro lado de un bloque, `moveToward`
     * empujaba contra el respaldo y no avanzaba nunca. Ocho segundos en
     * combate, viendo al jugador, sin dar un paso ni un tiro.
     *
     * Por eso la condición de verdad es ésta: que haya lugar también a los
     * costados. Eso es, literalmente, la definición del pasillo.
     */
    const enPasillo = (px, py) => libre(px, py) && libre(px - 12, py) && libre(px + 12, py);

    // Se busca primero HACIA EL CENTRO del vagón, que es donde está el
    // pasillo en todos: los asientos van contra las dos paredes.
    const haciaElCentro = (map.height / 2) > y ? 1 : -1;
    const candidatos = [{ dx: 0, dy: 0 }];
    for (let r = 4; r <= 48; r += 4) {
      candidatos.push({ dx: 0, dy: r * haciaElCentro });
      candidatos.push({ dx: 0, dy: -r * haciaElCentro });
      for (const dx of [4, -4, 8, -8, 12, -12]) {
        candidatos.push({ dx, dy: r * haciaElCentro });
      }
    }

    for (const c of candidatos) if (enPasillo(x + c.dx, y + c.dy)) return { x: x + c.dx, y: y + c.dy };
    // Si no hay pasillo a mano (un vagón raro, un rincón), alcanza con entrar.
    for (const c of candidatos) if (libre(x + c.dx, y + c.dy)) return { x: x + c.dx, y: y + c.dy };
    return { x, y };
  }

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
    audio.quitarAmbiente('chapa');
    audio.quitarAmbiente('agua');
    audio.quitarAmbiente('viento');
    mostrarCursorDelSistema(true);
  }

  // ---------------------------------------------------------------- tormenta

  /**
   * LA TORMENTA QUE SE OYE — ver `CONFIG.tormenta` para el diseño de las tres
   * capas y por qué son tres.
   *
   * Sólo existe si a este tren le tocó tormenta. En un tren despejado no se
   * crea ninguna capa: no hay nada que apagar ni volumen que mover.
   */
  function arrancarTormenta() {
    hayTormenta = !!train.clima && train.clima.id === 'tormenta';
    truenoTimer = 0;
    cubiertoAntes = null;
    if (!hayTormenta) return;

    const t = CONFIG.tormenta;
    // La chapa: resonancia metálica alta. El `q` grande es lo que la hace
    // sonar a chapa y no a "ruido agudo" — una chapa bajo la lluvia CANTA.
    audio.ambiente('chapa',  { cutoff: 2900, q: 3.2, type: 'bandpass', gain: t.chapaAdentro });
    audio.ambiente('agua',   { cutoff: 1400, q: 0.7, type: 'highpass', gain: t.aguaAdentro });
    audio.ambiente('viento', { cutoff: 240,  q: 0.6, type: 'lowpass',  gain: t.vientoAdentro,
      respira: { profundidad: CONFIG.ambiente.vientoProfundidad, cada: CONFIG.ambiente.vientoCada } });

    // El primer trueno no cae en el segundo cero: arrancar con un estruendo
    // pisaría el cartel de "en qué vagón caíste".
    truenoTimer = t.truenoCada * 0.6;
  }

  /**
   * Cuánto te moja AHORA. Es el mismo `hayTechoEn` que usa el camino del techo:
   * da falso en los enganches y en el vagón de ganado, que va al aire libre.
   * Y arriba del tren estás afuera por definición, aunque haya chapa debajo.
   */
  function estasCubierto() {
    return !player.enTecho && hayTechoEn(player.x);
  }

  function updateTormenta(dt) {
    if (!hayTormenta) return;
    const t = CONFIG.tormenta;

    /**
     * El volumen sólo se toca cuando CAMBIA el estado, no cada cuadro: mandar
     * una rampa nueva sesenta veces por segundo cancela la anterior antes de
     * que llegue a destino, así que el sonido se quedaría clavado a mitad de
     * camino y el cruce no se oiría nunca.
     */
    const cubierto = estasCubierto();
    if (cubierto !== cubiertoAntes) {
      cubiertoAntes = cubierto;
      audio.volumen('chapa',  cubierto ? t.chapaAdentro  : t.chapaAfuera,  t.rampa);
      audio.volumen('agua',   cubierto ? t.aguaAdentro   : t.aguaAfuera,   t.rampa);
      audio.volumen('viento', cubierto ? t.vientoAdentro : t.vientoAfuera, t.rampa);
    }

    // El reloj del trueno va por `dt` y no por `setInterval`: así se para solo
    // cuando la escena se para, como todo lo demás del juego.
    truenoTimer -= dt;
    if (truenoTimer <= 0) {
      truenoTimer = t.truenoCada + rng.range(0, t.truenoVariacion);
      audio.play(rng.chance(t.chanceCerca) ? 'truenoCerca' : 'truenoLejos');
    }
  }

  /**
   * LA CRUZ DEL SISTEMA SE APAGA MIENTRAS DURA EL ASALTO.
   *
   * Hasta ahora la única mira del juego era `cursor: crosshair`, o sea el
   * cursor del sistema operativo (styles/main.css). Con la mira dibujada, los
   * dos encimados se leen como un error gráfico — y peor: la cruz no dice
   * nada, mientras que el círculo dice la dispersión real.
   *
   * Se apaga y se prende en `enter`/`exit` y no en el CSS porque el mapa de
   * rutas TAMBIÉN se maneja con el mouse (`scenes/mapScene.js`) y ahí la cruz
   * sí sirve: sos un tipo mirando un papel, no apuntando.
   */
  function mostrarCursorDelSistema(visible) {
    const canvas = renderer.canvas || (renderer.ctx && renderer.ctx.canvas);
    if (canvas) canvas.style.cursor = visible ? '' : 'none';
  }

  /** Los sistemas avisan por el bus; la escena reacciona. */
  function listen() {
    unsubscribers = [
      bus.on('impact', ({ x, y, kind }) => {
        const color = kind === 'flesh' ? colors.blood : '#c9b28a';
        spawnParticles(x, y, color, kind === 'flesh' ? 7 : 4);
        audio.play(kind === 'flesh' ? 'hitFlesh' : 'hitWall');
      }),

      bus.on('enemyKilled', ({ enemy, byPlayer, rendido, indefenso }) => {
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

        /**
         * PARA `honor` (ver `honorDelta`, state/gameState.js): distinguir un
         * remate de un degüello normal. Para melee viene en el propio evento
         * (`rendido`/`indefenso`, capturados antes de que systems/melee.js
         * mute el estado); para bala o dinamita nadie lo capturó, así que se
         * lee directo del enemigo — nada le tocó esos campos antes de morir.
         */
        if (byPlayer && enemy) {
          // Mismo criterio que systems/melee.js: si ya se estaba parando para
          // traicionarte, matarlo de un balazo tampoco es un remate indefenso.
          const eraRendido = rendido ?? (enemy.rendido && !enemy.traicionLevantando);
          const eraIndefenso = indefenso ?? enemy.inconsciente > 0;
          if (eraRendido) rendidosMatados++;
          else if (eraIndefenso) noqueadosRematados++;
        }

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

      /**
       * EL CIVIL ENCUBIERTO TERMINÓ DE SACAR EL ARMA (Fase 4, ver
       * `actualizarEncubierto` en entities/passenger.js).
       *
       * DEJA DE SER UN PASAJERO Y PASA A SER UN GUARDIA, literalmente: sale
       * de `passengers` y entra en `enemies`. No es un atajo — es lo que
       * hace que no haya que escribir ni una línea de IA nueva: de acá en
       * adelante pelea, se cubre, se rinde y muere con el mismo código que
       * cualquier otro guardia del tren.
       *
       * NO QUEDA UN CADÁVER NI NADA TIRADO donde estaba: el que se levantó y
       * el que está peleando son el mismo tipo, sólo que ahora vive en la
       * otra lista.
       *
       * Nace ya en `combat` y sabiendo dónde estás — te estuvo mirando la
       * espalda todo este tiempo, sería absurdo que tuviera que "descubrirte"
       * después de haberte apuntado.
       */
      bus.on('civilRevelado', ({ pasajero }) => {
        const i = passengers.indexOf(pasajero);
        if (i < 0) return;
        passengers.splice(i, 1);

        /**
         * 🐛 SE LEVANTA AL PASILLO, NO SE QUEDA EN EL ASIENTO.
         *
         * Nacía exactamente donde estaba el pasajero — y los pasajeros están
         * SENTADOS, o sea adentro de un tile sólido. Medido: el guardia
         * quedaba en `combat`, veía al jugador, elegía una cobertura y no se
         * movía ni un píxel en 8 segundos; nunca disparaba, porque el disparo
         * vive en las ramas de "ya llegué a cubrirme" o "no tengo cobertura",
         * y él estaba para siempre en la del medio. Un enemigo perfectamente
         * inofensivo, sin un solo error a la vista.
         *
         * `lugarLibreCerca` lo corre al primer lugar donde de verdad entre
         * (el pasillo está pegado a los asientos, arriba o abajo). Y es lo
         * que pasaría igual: el tipo se PARA para sacar el arma.
         */
        const sitio = lugarLibreCerca(pasajero.x, pasajero.y);
        const guardia = createEnemy(sitio.x, sitio.y, {
          type: 'encubierto',
          facing: pasajero.facing,
          path: [],
          health: guardHealth('encubierto', train.dificultad.vidaExtra),
          ai: train.perfilIA,
        });
        guardia.wagon = pasajero.wagon;
        guardia.homePath = [];
        guardia.state = 'combat';
        guardia.suspicion = 1;
        guardia.alertMark = 1;
        guardia.lastSeen = { x: player.x, y: player.y };
        enemies.push(guardia);

        if (train.wagons[pasajero.wagon]) train.wagons[pasajero.wagon].guardiasVivos++;

        camera.shake(CONFIG.feel.shakeHit, 0.18);
        // A −26 y no a −16: ahí abajo ya está el `!` de alerta que dibuja
        // `drawEnemy`, y mirando la captura se veían encimados. El cartel va
        // arriba del signo, no sobre él.
        floaters.push({
          x: guardia.x, y: guardia.y - 26,
          text: T.ambiente.encubierto, life: 1.8, color: colors.enemyAlert,
        });
      }),

      // Noqueo limpio (culata, por la espalda, a alguien que nunca te vio):
      // mueve `honor` un poco. Ver CONFIG.honor.noquearLimpio.
      bus.on('enemyKnockedOut', ({ limpio }) => {
        if (limpio) noqueadosLimpios++;
      }),

      /**
       * SE RINDIÓ. El único aviso: un texto flotante, igual que el resto de
       * los momentos que ya marcan floaters (el jefe, el sheriff). No hay
       * ícono nuevo en el HUD — es un momento raro, no algo que haya que
       * poder leer de un vistazo cada vez que pasa.
       */
      bus.on('enemySurrendered', ({ enemy }) => {
        audio.play('takedown');
        floaters.push({
          x: enemy.x, y: enemy.y - 14,
          text: T.prompts.seRinde, life: 2.2, color: colors.text,
        });
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
         * UN DISPARO TUYO: TU PROPIO VAGÓN ENTERO EN ROJO, Y EL DE CADA LADO
         * EN AMARILLO, BUSCÁNDOTE — SIEMPRE, suene o no la alarma todavía.
         *
         * *(pedido de Santi: "los guardias del vagón donde fue disparado
         * deberían estar en rojo, TODOS. Y los guardias del vagón pegado al
         * vagón donde fue el disparo en amarillo, buscando al jugador. Tanto
         * los guardias del vagón anterior como el del siguiente")*
         *
         * ANTES, un disparo sólo alertaba (amarillo) a quien estuviera a
         * `radius` píxeles — y en un vagón de hasta 640px eso podía dejar
         * afuera a la mitad de la gente que en los hechos te tendría que
         * haber oído. Ahora es determinístico, por VAGÓN, no por distancia:
         * no depende de en qué punto exacto del vagón estés parado.
         *
         * `alertCombat`/`alertTo` son las mismas funciones que ya usa
         * `spreadAlarm` más abajo — no hay estado nuevo. Las dos ya se
         * cuidan solas de no tocar a un guardia que ya está en combate, así
         * que no hace falta filtrar nada más acá.
         *
         * SÓLO PARA DISPAROS DE VERDAD (`wagons` sale del arma, ver
         * data/weapons.js — nunca es `undefined` en un tiro, incluido 0). La
         * dinamita ya tiene su propio "todo el tren se entera" en rojo
         * (`retumbaElTren`) y el cuerpo a cuerpo silencioso sigue silencioso
         * — esto no les suma ni les saca nada a esos dos.
         */
        /**
         * 🐛 Y LOS DE AL LADO SE QUEDAN EN SU VAGÓN — NO CRUZAN.
         *
         * *(Santi, jugándolo: "cuando disparo en un vagón, de repente hay
         * muchísimos guardias de otros vagones, eso no debería pasar")*
         *
         * Estaban recibiendo `alertTo`, que además de ponerlos amarillos les
         * pone como destino EL LUGAR DEL RUIDO — o sea que abandonaban su
         * vagón y se te venían encima. Medido con un tiroteo de 45 s: cruzaban
         * 2 o 3, y con los 3-4 de tu propio vagón el pico llegaba a 6 tipos
         * encima tuyo, todos por el mismo pasillo.
         *
         * `alertaEnGuardia` hace exactamente lo que hay que hacer y ya
         * existía (es lo que hacen los de ADELANTE cuando suena la alarma):
         * amarillo, `spooked` —ya no se vuelven a confiar— y `target` en su
         * propio puesto, así que se quedan donde están, despiertos y mirando.
         * Se enteran de que pasó algo sin que el tren entero se te venga
         * encima por un tiro.
         *
         * LO QUE NO CAMBIA, Y ES LO IMPORTANTE: cuando suena la ALARMA de
         * verdad, los de atrás SÍ te vienen a buscar, como siempre
         * (`spreadAlarm`, más abajo). Eso es el corazón de la retirada y no se
         * toca. La diferencia ahora es que un tiro suelto ya no vale lo mismo
         * que una alarma: hasta que te descubran de verdad, lo que pasa en un
         * vagón se queda en ese vagón.
         */
        if (fueTuyo && wagons !== undefined) {
          const centro = train.wagonAt(x);
          for (const e of enemies) {
            if (!e.alive || e.wagon === undefined || e.rendido || e.inconsciente > 0) continue;
            const delta = e.wagon - centro;
            if (delta === 0) alertCombat(e, x, y, world);
            else if (Math.abs(delta) === 1) {
              /**
               * 🐛 EL `alarm.active` NO ES UN DETALLE: sin él, este arreglo se
               * comía la retirada entera. Medido: con la alarma ya sonando,
               * cada disparo tuyo volvía a clavar a los vecinos en su vagón, y
               * dejaban de venir a buscarte — o sea que disparar te SACABA
               * perseguidores de encima, justo al revés de lo que tiene que
               * pasar. Con la alarma sonando siguen recibiendo `alertTo` de
               * siempre: se te vienen encima, como corresponde.
               */
              if (alarm.active) alertTo(e, x, y);
              else alertaEnGuardia(e);
            }
          }
        }

        /**
         * Y ADEMÁS, con la alarma YA sonando, el arma puede sumar TODAVÍA
         * más vagones por encima de los de arriba (`wagons`, `noiseWagons`
         * en data/weapons.js) — hoy el Colt y el Smith están en 0, así que
         * no suman nada más: el vagón propio y los dos de al lado, que ya
         * reaccionaron arriba, son todo lo que hacen. Queda para cuando
         * exista un arma más ruidosa (escopeta, rifle).
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
   * La alarma despierta a los guardias que YA ESTÁN en el tren.
   *
   * 🐛 ANTES, "de adelante" Y "de atrás" —dentro del mismo `radio`— quedaban
   * los dos en ROJO (distinta conducta: los de atrás te venían a buscar, los
   * de adelante se plantaban en su puerta a esperar, pero los dos armados y
   * en combate). Santi, después de ver que el vagón de al lado se ponía rojo
   * apenas alguien te veía y gritaba: "creí que habíamos dicho que no debería
   * pasar eso" — tenía razón: eso era justo lo que se acababa de decidir
   * distinto para un disparo suelto (vagón propio rojo, vecinos amarillo), y
   * este sistema —el de la alarma DE VERDAD, cuando alguien te ve y avisa—
   * seguía sin enterarse del cambio.
   *
   * AHORA ES LO MISMO CRITERIO EN LOS DOS SISTEMAS: sólo el vagón centro
   * (`delta === 0`, donde de verdad te vieron) queda en rojo, persiguiendo tu
   * última posición conocida. Todo lo demás dentro de `radio` —para
   * cualquiera de los dos lados— queda en AMARILLO, buscando, igual que ya
   * hace un disparo con sus vecinos. `alertaEnPuerta` (systems/ai.js, "se
   * plantan en su puerta, en rojo") queda sin ningún lugar que la llame —no
   * se borró por si hace falta reusarla en otro sistema más adelante, pero
   * hoy es código muerto.
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

      if (delta !== 0) {
        // Vecino, para cualquiera de los dos lados: amarillo, buscando — NO
        // rojo. Mismo criterio que ya usa un disparo con el vagón de al lado
        // (ver `bus.on('noise', ...)`, más arriba).
        alertTo(e, ultimoVisto.x, ultimoVisto.y);
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
      /**
       * EL CAJÓN DE PÓLVORA EMPUJADO TIENE SUS PROPIAS REGLAS (Fase 6a): a
       * veces cruza el enganche, rompe la puerta que se le cruza y atropella
       * guardias. Devuelve true si se terminó (se cayó del tren o explotó).
       */
      if (ro.tipo === 'polvora') {
        if (actualizarPolvora(ro)) { rodantes.splice(i, 1); continue; }
      } else {
        const seAcabo = ro.tipo === 'res'
          ? (ro.alcance <= 0 || chocaConElBlindado(ro))
          : (train.tramoAt(ro.x) !== 'vagon' || ro.x < player.x - 200);
        if (seAcabo) { rodantes.splice(i, 1); continue; }
      }

      // Una res atropella a los guardias que se le cruzan. Un barril no: pesa,
      // pero no viene corriendo con doscientos kilos de miedo encima. Un cajón
      // de pólvora empujado sí — es un arma, no decorado.
      if (ro.tipo === 'res' || ro.tipo === 'polvora') atropellarGuardias(ro);

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

  /**
   * EL CAJÓN DE PÓLVORA EMPUJADO, cuadro a cuadro. Devuelve true si se terminó.
   *
   * Tiene tres reglas propias que un barril del tren veloz no tiene, y las
   * tres salen de que **esto es un arma tuya y no una molestia del tren**.
   */
  function actualizarPolvora(ro) {
    const t = EXPLOSIVES.cajonPolvora;

    /**
     * 1. ROMPE LA PUERTA QUE SE LE CRUCE. *(Santi: "si el barril choca contra
     * una puerta, la romperá, a no ser que sea una puerta blindada")*
     *
     * De un golpe y no a fuerza de daño: son cien kilos de madera y pólvora
     * contra una hoja que aguanta tres balazos. `puertasRotas` evita contarla
     * dos veces mientras la cruza, igual que hacen las balas.
     */
    for (const d of doors) {
      if (d.broken || Math.abs(ro.x - d.x) >= d.hw + ro.hw) continue;
      if (d.kind === 'blindada') {
        /**
         * SALVO LA DE CHAPA, QUE LO FRENA. Y ahí queda, apoyado contra la
         * única puerta del tren que no se abre empujando — así que si venía
         * cargado, un tiro tuyo la vuela sin gastar tu propia dinamita.
         * Es la jugada más cara que habilita todo este sistema, y sale sola
         * de juntar dos reglas que ya existían.
         */
        ro.velocidad = 0;
        return false;
      }
      ro.puertasRotas = ro.puertasRotas || new Set();
      if (ro.puertasRotas.has(d)) continue;
      ro.puertasRotas.add(d);
      dañarPuerta(d, CONFIG.doors.health + 1);
      spawnParticles(d.x, d.y, '#7a5836', 10);
      audio.play('hitWall');
    }

    /**
     * 2. A VECES CRUZA EL ENGANCHE. Un barril suelto se cae al vacío en la
     * pasarela —esa regla hace del enganche el único refugio contra los
     * rodantes y no se toca— pero un cajón bien lanzado salta de vez en
     * cuando (`cruzaEnganche`, 30%). Se tira UNA vez por enganche.
     */
    if (train.tramoAt(ro.x) !== 'vagon') {
      if (ro.tiroEnganche === undefined) {
        ro.tiroEnganche = rng.chance(t.cruzaEnganche);
        if (ro.tiroEnganche) {
          floaters.push({
            x: ro.x, y: ro.y - 18,
            text: T.prompts.cajonCruza, life: 1.4, color: colors.dynamiteBand,
          });
        }
      }
      if (!ro.tiroEnganche) return true;      // se fue al vacío
    } else if (ro.tiroEnganche !== undefined) {
      ro.tiroEnganche = undefined;            // ya está en el vagón siguiente
    }

    // 3. Y se pierde si quedó muy atrás, como cualquier rodante.
    return ro.x < player.x - 400;
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

      /**
       * UN CAJÓN DE PÓLVORA NO MATA POR ATROPELLO, NUNCA.
       *
       * *(Santi: "si un barril rodando toca a un guardia no explota, sino que
       * lo tumba unos segundos")* — ni siquiera al que ya está en el piso. Es
       * lo que separa las dos formas de usarlo: si lo querés muerto, le
       * disparás al cajón; si sólo lo querés fuera del medio, lo empujás. Que
       * el empujón matara solo borraría esa diferencia, que es toda la libertad
       * que el arma agrega.
       */
      if (ro.tipo === 'polvora') {
        if (yaEstabaEnElPiso) continue;
        e.aturdidoPor = null;
        e.stagger = EXPLOSIVES.cajonPolvora.tumba;
        e.aimTimer = 0;
        e.burstLeft = 0;
        e.peeking = false;
        e.coverPoint = null;
        e.atCover = false;
        spawnParticles(e.x, e.y, '#c9b28a', 6);
        audio.play('hitWall');
        continue;
      }

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
   * LOS CAJONES DE PÓLVORA (Fase 6a, entities/cajon.js).
   *
   * Casi no tienen update: no se mueven ni piensan. Lo único que corre es el
   * destello del golpe, y sacar de la lista a los que ya se prendieron —
   * `prenderCajon` (systems/explosives.js) los marca `alive: false` y en ese
   * mismo momento nace el explosivo que los reemplaza.
   */
  function updateCajones(dt) {
    for (const c of cajones) updateCajon(c, dt);
    for (let i = cajones.length - 1; i >= 0; i--) {
      if (!cajones[i].alive) cajones.splice(i, 1);
    }
  }

  /**
   * El cajón de pólvora al alcance de la mano.
   *
   * `soloConCartucho`: para el `[E]` sólo cuentan los que tienen un cartucho
   * armado adentro — de la pólvora suelta no se saca nada, y de uno ya vaciado
   * tampoco. Para el `F` cuentan TODOS, porque cualquiera se empuja igual y
   * sigue sirviendo de ariete, tenga o no algo para vos.
   *
   * Antes el filtro era `cargado` y alcanzaba, porque tener pólvora y tener un
   * cartucho para llevarse eran la misma cosa. Dejaron de serlo cuando la
   * pólvora se repartió por todo el tren (ver `chanceCartucho`).
   */
  function cajonCerca(soloConCartucho = true) {
    let cerca = null;
    let mejor = CONFIG.loot.radius + 6;
    for (const c of cajones) {
      if (!c.alive || (soloConCartucho && !c.tieneCartucho)) continue;
      const d = distance(player.x, player.y, c.x, c.y);
      if (d < mejor) { mejor = d; cerca = c; }
    }
    return cerca;
  }

  /**
   * AGARRAR UN CARTUCHO — el único lugar del juego donde se repone algo.
   *
   * *(Santi: "si tenés dos de dinamita sólo podés llevarte una de los
   * cajones")* — o sea que el tope (`CONFIG.player.dynamiteMax`, 3) no es una
   * sugerencia: llegando lleno, este cajón no te sirve para nada COMO
   * reposición, y lo único que le queda es ser una bomba puesta en el mapa.
   * Ésa es la mitad de por qué el mismo objeto hace las dos cosas.
   *
   * EL CAJÓN NO DESAPARECE: QUEDA VACÍO.
   *
   * *(Santi, jugándolo: "una vez agarrada una dinamita de un barril, el barril
   * no desaparece [...] vos sacás la dinamita de un barril y ya no se puede
   * explotar, pero el barril sigue estando")*
   *
   * Antes se lo tragaba la tierra, y eso borraba de un saque tres cosas que el
   * cajón es además de una reposición: un bulto que frena balas, una cobertura
   * y algo que se puede empujar. Ahora **sacarle el cartucho es desactivar una
   * bomba**, y el mueble queda.
   *
   * Y le pone el techo que antes le faltaba: cada uno da UNA y queda vacío, así
   * que el vagón entrega cinco en total. Sin eso, no gastarse al agarrarlo lo
   * habría vuelto una fuente inagotable con sólo volver a pasar.
   */
  function agarrarCajon(c) {
    const t = EXPLOSIVES.cajonPolvora;
    player.dynamite = Math.min(CONFIG.player.dynamiteMax, player.dynamite + t.recarga);
    vaciarCajon(c);
    c.progreso = 0;

    floaters.push({
      x: c.x, y: c.y - 16,
      text: T.prompts.cartuchoTomado, life: 1.6, color: colors.dynamite,
    });
    spawnParticles(c.x, c.y, colors.dynamiteBand, 6);
    audio.play('loot');
  }

  /**
   * EMPUJAR UN CAJÓN — `F`, y sale rodando hacia la cola.
   *
   * *(Santi: "se debería poder empujarlos con F para que rueden hacia atrás y
   * así el jugador puede usar el barril como arma. Esto da más libertad a la
   * hora del asalto")*
   *
   * SIEMPRE HACIA LA COLA, NUNCA HACIA LA LOCOMOTORA, y no es una limitación
   * de comodidad: es la física que este juego ya tiene escrita desde el tren
   * veloz — el tren acelera, y lo que está suelto adentro se va para atrás. Por
   * eso `F` no es tanto "empujar" como **destrabar**: lo soltás y el tren hace
   * el resto, estés parado donde estés.
   *
   * Y por eso mismo tiene un costo que no hay que explicar: si estás del lado
   * de la cola, el cajón sale hacia vos. Tu propia arma no te distingue, igual
   * que la estampida del tren de carga.
   */
  function empujarCajon(c) {
    const i = cajones.indexOf(c);
    if (i >= 0) cajones.splice(i, 1);

    /**
     * 🐛 SALE AL PASILLO, NO RUEDA POR SU PROPIA FILA.
     *
     * Los cajones viven en las filas 3 y 6, al costado del corredor. Dejarlo
     * rodar por ahí parecía lo natural y estaba mal: **en el enganche esas
     * filas no existen** —son el vacío de afuera del tren— así que un cajón
     * que cruzaba al vagón vecino viajaba literalmente por el aire, y las
     * balas se le morían antes de llegar. Se descubrió probando la jugada de
     * volarle la puerta al blindado: el cajón llegaba, se frenaba contra la
     * chapa y era imposible dispararle.
     *
     * Empujado cae al corredor (fila 4 o 5, la que le quede más cerca), que es
     * la única franja que existe de punta a punta del tren. Y de paso es lo que
     * uno esperaría: lo destrabás de la pila y se va al pasillo.
     */
    const yCorredor = c.y < CONFIG.techo.centroY
      ? CONFIG.techo.centroY - map.size / 2      // fila 4
      : CONFIG.techo.centroY + map.size / 2;     // fila 5

    const ro = createRodante(c.x, yCorredor, 'polvora', rng, {
      cargado: c.cargado,
      tieneCartucho: c.tieneCartucho,
      vida: c.vida,
      hw: c.hw + 1, hh: c.hh + 2,
    });
    rodantes.push(ro);
    spawnParticles(c.x, c.y, '#c49b63', 5);
    audio.play('cover');
    return true;
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
    // Cuenta la plata Y los objetos: un lingote pesa en la espalda exactamente
    // igual que lo que vale, aunque todavía no sea plata. En el tren de carga,
    // que es el único donde esto se aplica, casi todo el peso son objetos.
    return Math.min(c.maximo, ((collected + valorObjetos()) / c.porCada) * c.penalizacion);
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
    updateTormenta(dt);
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
    updateCajones(dt);
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
      // El TOPE, no con cuántas saliste: desde la Fase 6a los dos números
      // dejaron de ser el mismo (los cajones del vagón de armas te dan una
      // más). El HUD dibuja un cartucho por cada lugar, así que el tercero se
      // ve vacío desde el primer segundo — es cómo el juego te cuenta, sin
      // escribirlo, que existe algo que lo llena.
      maxDynamite: CONFIG.player.dynamiteMax,
      fuseLit: player.fuse > 0,
      timeLeft,
      urgent: timeLeft <= CONFIG.raid.urgentAt,
      money: collected,
      // Cuántas cosas llevás encima y cuántas te entran. En el tren de carga es
      // lo que de verdad mirás; en el de pasajeros nunca hay ninguna y el HUD
      // no lo muestra.
      objetos: objetos.length,
      objetosMax: CONFIG.objetos.capacidad,
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

      /**
       * EL DINAMITERO DEL VAGÓN DE ARMAS TAMPOCO SE CONGELA (Fase 6a).
       *
       * Su ronda cruza tres vagones (`rondaLarga`, ver world/train.js) y toda
       * la jugada que el vagón propone es **esperar a que salga**. Si se
       * congelara por lejanía, lo dejarías adentro, te irías dos vagones a
       * esperar y seguiría adentro para siempre: la espera no terminaría
       * nunca y el vagón sería, simplemente, inentrable.
       *
       * Es el mismo motivo por el que corren siempre el Cazarrecompensas y el
       * Sheriff: lo único que se mueve por el tren aunque no lo estés mirando
       * no se puede apagar por no estar mirándolo.
       */
      const lejos = Math.abs(e.x - player.x) > cull;
      if (lejos && !e.rondaLarga && e.state !== 'combat' && e.state !== 'suspicious') continue;
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
    const cajon = (nearest || victima) ? null : cajonCerca();
    const tranquera = (nearest || victima || cajon) ? null : tranqueraCerca();

    /**
     * EL PROGRESO DE UNA CAJA FUERTE NO SE PIERDE.
     *
     * *(Santi, jugándolo: "si se interrumpe la abertura de la caja, cuando el
     * jugador quiera volver a abrirla, se reanudará desde dónde la dejó")*
     *
     * Antes, soltar la [E] un instante —porque te llegó un guardia, porque
     * tuviste que cubrirte— volvía el contador a cero, y con ocho segundos eso
     * significaba que en cualquier vagón despierto la caja era directamente
     * inabrible: cada intento empezaba de nuevo. El precio dejaba de ser
     * "ocho segundos" y pasaba a ser "ocho segundos SEGUIDOS", que es otra
     * cosa mucho más cara y que no se anuncia por ningún lado.
     *
     * Ahora se puede pagar en cuotas: forcejeás tres segundos, te sacan de
     * ahí, resolvés, volvés y seguís desde donde ibas. El tiempo total sigue
     * siendo el mismo — lo que cambia es que no se castiga dos veces por la
     * misma interrupción.
     *
     * SÓLO LAS CAJAS FUERTES. Las bolsas y las tranqueras se siguen
     * reiniciando: 0,6 y 0,9 segundos son gestos, no trabajos, y guardar el
     * progreso de algo que dura menos de un segundo no significaría nada —
     * salvo el efecto raro de ir acumulando medio segundo en cada bolsa que
     * rozás al pasar.
     */
    for (const l of loot) {
      if (esCajaFuerte(l)) continue;
      if (l !== nearest || !holding) l.progress = 0;
    }
    for (const pa of passengers) {
      if (pa !== victima || !holding) pa.robProgress = 0;
    }
    for (const tr of tranqueras) {
      if (tr !== tranquera || !holding) tr.progreso = 0;
    }
    // Los cajones se reinician como una bolsa y no como una caja fuerte: 0,6 s
    // es un gesto, no un trabajo, y guardar el progreso de algo que dura menos
    // de un segundo no significaría nada.
    for (const c of cajones) {
      if (c !== cajon || !holding) c.progreso = 0;
    }

    /**
     * EL CAJÓN DE PÓLVORA: el mismo [E] sostenido de siempre, y ahí está la
     * gracia. Este juego tiene UN verbo para todo lo que se agarra, así que
     * reponer dinamita no estrena ningún gesto — es el mismo que ya usás para
     * una bolsa, con otra recompensa.
     */
    if (cajon && holding) {
      /**
       * CON LA DINAMITA AL TOPE NO SE ABRE. No es una restricción caprichosa:
       * el cajón SE GASTA al abrirlo, así que dejar que un jugador lleno lo
       * consuma por +0 sería tirar a la basura la única bomba puesta del vagón
       * sin que él lo haya elegido. El cartel arriba de la cabeza ya avisa que
       * estás lleno (ver `drawPrompts`).
       */
      if (player.dynamite < CONFIG.player.dynamiteMax) {
        cajon.progreso += dt;
        if (cajon.progreso >= EXPLOSIVES.cajonPolvora.abrirHold) agarrarCajon(cajon);
        escapeProgress = 0;
        // Agarrar también es robar, para el que te mide desde atrás: te
        // quedaste quieto. Ver `acecho` en data/bosses.js.
        world.robando = true;
      }
      return;
    }

    // La tranquera del corral: el mismo [E] de siempre, sostenido.
    if (tranquera && holding) {
      tranquera.progreso += dt;
      if (tranquera.progreso >= CONFIG.estampida.abrirHold) abrirTranquera(tranquera);
      escapeProgress = 0;
      return;
    }

    if (nearest && holding) {
      /**
       * CON EL ARMA NO SE ABRE UNA CAJA FUERTE.
       *
       * *(Santi, jugándolo: "el jugador no podrá recargar ni disparar
       * mientras abre una. Si lo hace, la apertura de la caja fuerte se verá
       * interrumpida")*
       *
       * No es una restricción arbitraria: forzar una caja fuerte es un
       * trabajo de dos manos, y el juego ya venía diciendo lo mismo con el
       * cuerpo — estás quieto, de espaldas, sin poder cubrirte. Faltaba que
       * también te costara el arma.
       *
       * LO QUE ESTO CAMBIA DE VERDAD es que ya no se puede abrir una caja
       * "mientras tanto", contestando tiros de a ratos. Ahora hay que
       * resolver el vagón PRIMERO y después robar, que es exactamente el
       * orden que el juego premia en todo lo demás.
       *
       * Y no te castiga dos veces: la interrupción no borra el progreso (ver
       * más arriba), así que soltás el gatillo y seguís desde donde ibas.
       *
       * `input.mouse.down` en vez de "disparó de verdad": apretar el gatillo
       * sin balas también interrumpe. Quisiste disparar, soltaste la caja —
       * que la recámara estuviera vacía es problema tuyo.
       */
      /**
       * Y CON LAS MANOS LLENAS TAMPOCO SE ABRE. Mismo criterio exacto que el
       * cajón de pólvora de acá arriba: el botín se GASTA al abrirlo, así que
       * dejar que un jugador al tope lo consuma por nada sería tirarlo a la
       * basura sin que él lo haya elegido. El cartel sobre la cabeza avisa.
       *
       * Sólo aplica a los objetos: la plata siempre entra, no ocupa lugar.
       */
      const manosLlenas = !!nearest.objeto && objetos.length >= CONFIG.objetos.capacidad;
      const conElArmaOcupada = input.mouse.down || player.reloadTimer > 0;
      if (!conElArmaOcupada && !manosLlenas) {
        nearest.progress += dt;
        if (nearest.progress >= nearest.duration) takeLoot(nearest);
      }
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
      // `robTimeDe`: el pasajero rico tarda más en soltarlo todo (2,2 s
      // contra 1,4). Ver data/paquetes.js.
      if (victima.robProgress >= robTimeDe(victima)) robarPasajero(victima);
      escapeProgress = 0;
      // Amenazar también es robar: para el que te está midiendo desde atrás,
      // los dos son lo mismo — te quedaste quieto.
      world.robando = true;
      return;
    }

    if (!nearest && !victima && !cajon && !tranquera && isInsideZone(player, train.exitZone)) {
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
      /**
       * LA CAJA ESCONDIDA APARECE CUANDO LA TENÉS AL LADO (Fase 5).
       *
       * *(Santi, eligiendo entre tres formas: "la buscás vos — la pista es
       * sólo texto, la caja sigue invisible y aparece recién cuando estás al
       * lado, como cualquier botín al alcance de la mano")*
       *
       * Se descubre en el mismo radio en el que ya podrías agarrarla, así que
       * no hace falta ningún gesto nuevo: caminás por donde te dijeron, y
       * cuando pasás por encima está. Que también se pueda encontrar de pura
       * casualidad, sin haber amenazado a nadie, es a propósito — pero hay que
       * pasar justo por ahí, y el tren es largo.
       */
      const d = distance(player.x, player.y, l.x, l.y);
      if (l.oculto) {
        if (d < CONFIG.loot.radius) {
          l.oculto = false;
          floaters.push({
            x: l.x, y: l.y - 14,
            text: T.ambiente.cajaDelatada, life: 2.2, color: colors.strongbox,
          });
          spawnParticles(l.x, l.y, colors.strongbox, 6);
          audio.play('loot');
        } else {
          continue;
        }
      }
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
    // `pa.botin`: el pasajero RICO lleva lo suyo (Fase 5, data/paquetes.js).
    // Cualquier otro cae en los números de siempre.
    const rango = pa.botin || { min: c.robMin, max: c.robMax };
    const valor = rng.int(rango.min, rango.max);
    collected += valor;
    amenazados++;
    amenazado(pa);

    floaters.push({ x: pa.x, y: pa.y - 10, text: `+$${valor}`, life: 1.4, color: colors.bagLoot });
    spawnParticles(pa.x, pa.y, colors.bagLoot, 5);
    audio.play('loot');
    // Amenazar no hace ruido: el escándalo viene después, cuando grite.

    /**
     * Y SI ESTE SABÍA DÓNDE ESTABA LA CAJA, TE LO DICE (Fase 5, ver
     * `PAQUETES.cajaOculta` en data/paquetes.js).
     *
     * *(Santi, eligiendo entre tres formas de encontrarla: "te la delata un
     * pasajero al amenazarlo")*
     *
     * Es lo que le faltaba a amenazar. Hasta hoy era siempre la misma
     * cuenta —unos pesos ahora, un grito en cuatro segundos— y por eso,
     * pasado el primer asalto, saltear pasajeros era casi siempre lo
     * correcto. Ahora cualquiera de ellos puede ser el que abre la mejor
     * caja del tren, y no hay manera de saber cuál: la misma acción de
     * siempre, con una razón nueva.
     *
     * LO QUE TE LLEVÁS ES INFORMACIÓN, NO UNA MARCA. Te dice el vagón y
     * debajo de qué está — y nada más. La caja sigue invisible: hay que ir
     * hasta ahí y encontrarla. Es la única vez que el juego te da una
     * instrucción escrita, y se lo permite porque es una PERSONA hablándote,
     * no la interfaz explicándote.
     *
     * El cartel sale sobre el pasajero (acá sí: es lo que él está diciendo) y
     * dura más que un floater normal — tenés que llegar a leerlo mientras
     * seguís mirando el pasillo.
     */
    if (pa.sabeDeCaja && pa.sabeDeCaja.oculto && pa.pistaCaja) {
      const { vagon, escondite } = pa.pistaCaja;
      floaters.push({
        x: pa.x, y: pa.y - 22,
        text: T.ambiente.pistaCaja(vagon, T.ambiente.escondites[escondite]),
        life: 3.4, color: colors.strongbox,
      });
      audio.play('cock');
    }
  }

  /** Lo que valen juntas las cosas que llevás encima. */
  function valorObjetos() {
    return objetos.reduce((suma, o) => suma + o.valor, 0);
  }

  function takeLoot(l) {
    l.taken = true;
    l.progress = 0;

    /**
     * UN OBJETO NO SE COBRA ACÁ (ver data/objetos.js). Va a la espalda, no al
     * bolsillo: pesa igual que la plata mientras lo cargás, pero no es plata
     * hasta que encuentres a quién vendérselo.
     */
    if (l.objeto) objetos.push(l.objeto);
    else collected += l.value;

    /**
     * EL JACKPOT SE ANUNCIA RECIÉN ACÁ — nunca antes. La caja se veía
     * exactamente igual a cualquier otra hasta el segundo en que la abriste:
     * eso es lo que hace que sea una sorpresa y no una pista.
     */
    if (l.jackpot) {
      floaters.push({
        x: l.x, y: l.y - 10, text: T.prompts.jackpot(l.value), life: 2.6, color: '#ffd84a',
      });
      spawnParticles(l.x, l.y, '#ffd84a', 16);
      camera.shake(7, 0.5);
    } else if (l.objeto) {
      // Un objeto se anuncia por su NOMBRE y no por su precio: todavía no sabés
      // cuánto te van a pagar por él, y ésa es justamente la diferencia.
      floaters.push({
        x: l.x, y: l.y - 8, text: l.objeto.nombre, life: 1.8,
        color: l.objeto.nivel === 'raro' ? '#ffd84a' : colors.strongbox,
      });
      spawnParticles(l.x, l.y, l.objeto.nivel === 'raro' ? '#ffd84a' : colors.strongbox, 8);
      if (l.objeto.nivel === 'raro') camera.shake(5, 0.35);
    } else {
      floaters.push({ x: l.x, y: l.y - 8, text: `+$${l.value}`, life: 1.4, color: colors.bagLoot });
      spawnParticles(l.x, l.y, colors.bagLoot, 6);
    }
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

  /**
   * CUÁNTO SE RESCATA, según la distancia al caballo — ver CONFIG.raid.
   * rescateFraccionMax/Min. Cerca (`rescateDistanciaCerca` o menos) es el
   * techo; lejos (`rescateDistanciaLejos` o más) es el piso; en el medio,
   * interpola lineal.
   */
  function fraccionRescate(distancia) {
    const c = CONFIG.raid;
    if (distancia <= c.rescateDistanciaCerca) return c.rescateFraccionMax;
    if (distancia >= c.rescateDistanciaLejos) return c.rescateFraccionMin;
    const t = (distancia - c.rescateDistanciaCerca) / (c.rescateDistanciaLejos - c.rescateDistanciaCerca);
    return c.rescateFraccionMax + (c.rescateFraccionMin - c.rescateFraccionMax) * t;
  }

  function goToResults() {
    const leftBehind = loot
      .filter((l) => !l.taken)
      .reduce((sum, l) => sum + l.value, 0);

    // Trabajo limpio: escapar sin que suene la alarma paga el doble. Es lo que
    // hace que jugar callado compita con reventar la caja fuerte a los tiros.
    const escaped = outcome === 'escaped';
    const limpio = escaped && !alarm.active;
    const cleanBonus = limpio
      ? Math.round(collected * CONFIG.raid.cleanBonus)
      : 0;

    /**
     * LA RACHA — cada asalto LIMPIO seguido suma un bonus extra, aparte del
     * de `cleanBonus`. Se corta con cualquier cosa que no sea "escapaste sin
     * que sonara la alarma": te agarraron, o escapaste pero ya te habían
     * oído. `gameState.rachaLimpia` es la racha ANTES de este asalto; acá se
     * calcula la que vale para ESTE resultado — si lo extendés, el premio se
     * siente ya, no en el próximo. `applyRaidResult` guarda `summary.racha`
     * como el nuevo valor de la racha, la corte o la extienda.
     *
     * *(pedido de Santi: "avancemos con el tema de la racha sin alarma",
     * números elegidos por él: +8% por nivel, techo en +150%)*
     */
    const rachaAnterior = gameState.rachaLimpia;
    const racha = limpio ? rachaAnterior + 1 : 0;
    const rachaFraccion = Math.min(CONFIG.raid.rachaBonusTecho, racha * CONFIG.raid.rachaBonusPorNivel);
    const rachaBonus = limpio ? Math.round(collected * rachaFraccion) : 0;
    // Si la cortaste, cuánto llevabas — para que perderla se sienta, no sólo
    // que el número vuelva a cero en silencio.
    const rachaPerdida = !limpio && rachaAnterior > 0 ? rachaAnterior : 0;

    /**
     * EL RESCATE — "casi lo logro" en vez de todo o nada. Sólo aplica si NO
     * escapaste: mide qué tan cerca del caballo (`train.exitZone`) estabas en
     * el instante exacto de la captura, e interpola cuánto de lo juntado te
     * queda (`fraccionRescate`, más abajo). Morir a metros de la salida es un
     * CASI de verdad; morir en la otra punta del tren sigue siendo un
     * fracaso, con apenas un consuelo.
     */
    const centroSalida = train.exitZone.x + train.exitZone.width / 2;
    const distanciaAlCaballo = Math.abs(player.x - centroSalida);
    const rescate = escaped ? 0 : Math.round(collected * fraccionRescate(distanciaAlCaballo));

    /**
     * PERDONADO: se quedó `rendido` y VIVO hasta el final del asalto. No hace
     * falta ningún gesto explícito (ver la decisión con Santi) — si no lo
     * tocaste, contás como que lo dejaste ir.
     */
    const perdonados = enemies.filter((e) => e.alive && e.rendido).length;

    const summary = {
      outcome,
      money: escaped ? collected + cleanBonus + rachaBonus : rescate,
      collected,

      /**
       * LOS OBJETOS SÓLO SE CONSERVAN SI ESCAPÁS, y sin rescate parcial.
       *
       * La plata tiene el suyo (`rescate`: te agarran cerca del caballo y algo
       * salvás) porque unos billetes se esconden en la bota. Un lingote no: o
       * te lo llevaste o se lo quedaron ellos. Es la misma regla de siempre
       * —lo que se puede mostrar no se escribe— aplicada al bolsillo.
       */
      objetos: escaped ? objetos.slice() : [],
      valorObjetos: escaped ? valorObjetos() : 0,
      cleanBonus,
      racha,
      rachaBonus,
      rachaPerdida,
      rescate,
      leftBehind,
      kills,
      civilians,
      amenazados,
      perdonados,
      rendidosMatados,
      noqueadosRematados,
      noqueadosLimpios,
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

    // Los cajones de pólvora van antes que el botín y que la gente: son parte
    // del vagón, un bulto estibado — no algo tirado encima de todo.
    for (const c of cajones) if (visible(c)) drawCajon(r, c);

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

    drawPlayer(r, player, train.hearStepRadius);
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

    // La mira va ÚLTIMA: es lo único que no pertenece al mundo, y nada del
    // tren puede taparla. Va adentro del translate porque apunta a un punto
    // del mundo (world.aimX/aimY), no de la pantalla.
    drawMira(r);

    r.ctx.restore();
  }

  /**
   * LA MIRA — un círculo que describe el ARMA, no el punto donde apuntás.
   * Ver CONFIG.mira.distanciaReferencia para el porqué completo.
   *
   * La cuenta sigue siendo la del cono de tiro (`tan(dispersión) ×
   * distancia`), pero la distancia ya NO es "hasta donde señala el mouse":
   * es siempre `m.distanciaReferencia` (120px), fija. Por eso el balanceo del
   * tren veloz sigue abriendo el círculo en tu cara —eso describe el arma en
   * ESE instante, no cambió— pero apuntar lejos o cerca ya no lo hace, porque
   * el círculo dejó de ser una proyección del tiro puntual.
   *
   * No se dibuja en el techo: allá arriba no hay arma, sólo esquivar carteles.
   */
  function drawMira(r) {
    if (!player.alive || player.enTecho) return;

    const m = CONFIG.mira;
    const radio = Math.max(
      m.radioMin,
      Math.min(m.radioMax, Math.tan(dispersionActual(player, world)) * m.distanciaReferencia * m.escala)
    );

    /**
     * Rojo cuando el gatillo no va a hacer nada: recargando, tumbado en el
     * piso, o escondido detrás de la cobertura sin haberte asomado. Es la
     * misma pregunta que hace `updateWeapon` para dejarte disparar, así que no
     * puede desincronizarse con lo que de verdad pasa al hacer clic.
     */
    const puedeDisparar = player.reloadTimer <= 0 && player.tumbado <= 0 &&
      (!player.cover || player.peek >= CONFIG.player.peekShootAt);

    const color = !puedeDisparar ? m.colorBloqueado
      : player.apuntado > 0.55 ? m.colorApuntando
      : m.color;

    /**
     * SIN PUNTO EN EL CENTRO — a propósito, y no es un detalle estético. Ver
     * CONFIG.mira. Un punto fijo se lee como "la bala va a ir acá"; la
     * dispersión real es uniforme, así que el borde del anillo tiene tanto
     * derecho a recibir la bala como el medio. El círculo entero ES la
     * respuesta.
     */
    r.circle(world.aimX, world.aimY, radio, color, m.alpha);
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

    /**
     * EL CAJÓN TIENE DOS VERBOS, ASÍ QUE EL CARTEL TIENE DOS LÍNEAS — el mismo
     * caso que el poste del campamento, que es lo único que se atiende y se
     * monta. Arriba lo que hace la `[E]` (o por qué no hace nada), abajo el
     * `[F]` que siempre está disponible.
     *
     * SON TRES CASOS, y el cartel los separa sin que haya que mirar la franja:
     *   con cartucho  → la [E] y su barrita, más el empujón abajo.
     *   pólvora suelta → "nada que llevarse", pero SIGUE SIENDO UNA BOMBA, y
     *                    por eso lo dice con esas palabras y no callándose.
     *   ya vaciado     → sólo el empujón: no explota ni da nada.
     */
    const cajon = cajonCerca(false);
    if (cajon) {
      const lleno = player.dynamite >= CONFIG.player.dynamiteMax;
      if (cajon.cargado && !cajon.tieneCartucho) {
        r.text(T.prompts.cajonSinCartucho, player.x, player.y - 16, colors.textDim);
        r.text(T.prompts.empujarCajon, player.x, player.y + 16, colors.textDim);
      } else if (cajon.tieneCartucho) {
        r.text(lleno ? T.prompts.cartuchoLleno : T.prompts.cartucho,
          player.x, player.y - 16, lleno ? colors.textDim : colors.dynamiteBand);
        if (cajon.progreso > 0) {
          const w = 22;
          r.rect(player.x - w / 2, player.y - 12, w, 3, '#1a1512');
          r.rect(player.x - w / 2, player.y - 12,
            w * (cajon.progreso / EXPLOSIVES.cajonPolvora.abrirHold), 3, colors.dynamite);
        }
        r.text(T.prompts.empujarCajon, player.x, player.y + 16, colors.textDim);
      } else {
        r.text(T.prompts.empujarCajon, player.x, player.y - 16, colors.text);
      }
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
          w * (victima.robProgress / robTimeDe(victima)), 3, colors.bagLoot);
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
