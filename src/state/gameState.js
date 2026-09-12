/**
 * EL ESTADO DEL MUNDO.
 *
 * Este objeto es la columna vertebral del juego entero: todo lo que debe
 * sobrevivir a un asalto vive acá, y nada más. Es un objeto plano y
 * serializable, así que guardar la partida va a ser literalmente
 * JSON.stringify(gameState).
 *
 * Regla: nunca guardar funciones, posiciones de balas, enemigos vivos ni
 * nada temporal. Eso pertenece a la escena del asalto y se descarta.
 */

import { CONFIG } from '../data/config.js';
import { BOSSES } from '../data/bosses.js';

export const SAVE_VERSION = 1;

export function createNewGame() {
  return {
    version: SAVE_VERSION,

    // Economía
    money: 0,

    // Reputación: tres números distintos, a propósito.
    fame: 0,     // cuánto te conocen
    bounty: 0,   // cuánto pagan por tu cabeza
    honor: 0,    // cómo te ven (negativo = temido, positivo = respetado)

    /**
     * CUÁNTOS ASALTOS LIMPIOS SEGUIDOS llevás — escapaste, sin que sonara la
     * alarma. Ver `CONFIG.raid.rachaBonusPorNivel`: cada uno de más paga un
     * bonus creciente, y se corta con cualquier otra cosa (te agarraron, o
     * escapaste con la alarma ya sonando).
     */
    rachaLimpia: 0,

    /**
     * DE DÍA O DE NOCHE. Lo da vuelta dormir en la carpa del campamento, y
     * decide qué está abierto en el pueblo (ver CONFIG.hora).
     *
     * Arranca de NOCHE: el campamento se ve mejor así, y sobre todo hace que
     * lo primero que quieras hacer sea dormir — y ahí aprendés el sistema
     * solo, sin que nadie te lo explique.
     */
    esDeDia: false,

    // Progresión (todavía sin usar, pero el hueco ya está)
    weapon: 'colt',
    /**
     * El arma cuerpo a cuerpo. Arranca en la culata, que no es un objeto que
     * tengas: es NO tener nada y usar lo que ya llevás en la mano. Por eso este
     * campo nunca puede quedar vacío, y por eso la culata vale 0. Ver
     * data/melee.js.
     */
    melee: 'culata',
    skills: {},
    horse: null,
    gang: [],

    /**
     * LO QUE TENÉS, que no es lo mismo que lo que LLEVÁS PUESTO.
     *
     * *(pedido de Santi: "desde el cajón de armas del campamento el jugador
     * deberá equiparse como quiera. Y en el poste con el caballo, el caballo que
     * quiera. El jugador no debería ir hasta el pueblo para equipar lo que
     * quiere")*
     *
     * Hasta acá comprar ERA equipar y no existía la diferencia — el propio
     * comentario de scenes/shopScene.js decía "hoy no hay inventario de 'tengo
     * dos y uso uno'". Comprar el Smith te dejaba sin el Colt, y para volver a
     * él había que caminar hasta el pueblo, esperar a que fuera de día y pagarlo
     * de nuevo.
     *
     * Ahora la tienda te lo VENDE (entra acá y se equipa, que es lo que querías
     * al comprarlo) y el campamento te lo CAMBIA, gratis y a cualquier hora. La
     * tienda decide qué tenés; el cajón y el poste, qué llevás hoy.
     *
     * Los que arrancan puestos son los que no se compran: el Colt y el Criollo
     * valen 0 porque son con lo que empezás, y la culata directamente no es un
     * objeto — es no tener nada. Por eso están acá desde el primer cuadro.
     */
    owned: {
      weapon: ['colt'],
      melee: ['culata'],
      horse: ['criollo'],

      /**
       * LA MERCADERÍA SIN VENDER (ver data/objetos.js). A diferencia de las
       * otras tres listas, ésta no guarda ids de un catálogo sino los objetos
       * enteros: dos lingotes del mismo tipo pueden valer distinto, porque el
       * valor se sortea al armar el tren y viaja adentro de la cosa.
       *
       * Arranca vacía: no empezás la partida con nada para vender.
       */
      objetos: [],
    },

    // Historia: banderas y contadores para las consecuencias diferidas
    flags: {},
    raidCount: 0,

    stats: {
      raids: 0,
      escapes: 0,
      captures: 0,
      kills: 0,
      civilians: 0,
      bestLoot: 0,
    },

    lastRaid: null,
  };
}

export const gameState = createNewGame();

/** Vuelve a empezar de cero (útil mientras prototipamos). */
export function resetGame() {
  const fresh = createNewGame();
  for (const key of Object.keys(gameState)) delete gameState[key];
  Object.assign(gameState, fresh);
}

/**
 * Aplica el resultado de un asalto al estado del mundo.
 * Acá es donde, más adelante, van a engancharse fama, recompensa y honor.
 */
export function applyRaidResult(summary) {
  gameState.raidCount += 1;
  gameState.stats.raids += 1;
  gameState.stats.kills += summary.kills;
  gameState.stats.civilians += summary.civilians || 0;

  /**
   * `summary.money` ya no es sólo "lo que gané si escapé": desde el rescate
   * ("casi lo logro", ver `fraccionRescate` en raidScene.js) una captura
   * también puede traer algo, así que esto se suma SIEMPRE — 0 si te
   * agarraron lejos del caballo, el rescate si estabas cerca, o el botín
   * entero (con los bonos) si escapaste.
   */
  gameState.money += summary.money;

  /**
   * LA MERCADERÍA VA AL INVENTARIO, NO AL BOLSILLO (ver data/objetos.js).
   *
   * Es lo que hace que el tren de carga termine con una tarea pendiente en vez
   * de con una cifra: salís del asalto cargado de cosas y la plata aparece
   * recién cuando encontrás a quién vendérselas.
   *
   * Van a `owned` y no a un lugar nuevo porque `owned` ES el inventario desde
   * que existe la tienda — ahí ya viven las armas, los aceros y los caballos
   * que tenés sin llevar puestos. Un objeto es exactamente eso: algo que
   * tenés.
   */
  if (summary.objetos && summary.objetos.length) {
    gameState.owned.objetos.push(...summary.objetos);
  }

  if (summary.outcome === 'escaped') {
    gameState.stats.escapes += 1;
    if (summary.money > gameState.stats.bestLoot) {
      gameState.stats.bestLoot = summary.money;
    }
  } else {
    gameState.stats.captures += 1;
    // Fase 3: acá entra la prisión (pagar la recompensa o la horca).
  }

  /**
   * LA RACHA — `summary.racha` ya viene calculada de raidScene.js (ahí es
   * donde hacía falta para poder pagar el bonus de ESTE asalto). Acá sólo se
   * guarda como el nuevo valor: 0 la corta, cualquier otro número la sigue o
   * la arranca.
   */
  gameState.rachaLimpia = summary.racha || 0;

  // Se guarda en el summary (no sólo en gameState.bounty) para que la
  // pantalla de resultados pueda mostrar cuánto subió ESTE asalto sin
  // duplicar la fórmula.
  summary.bountyGain = bountyDelta(summary);
  gameState.bounty += summary.bountyGain;

  // Mismo patrón que `bountyGain`: se guarda en el summary para que la
  // pantalla lo muestre sin repetir la cuenta.
  summary.honorGain = honorDelta(summary);
  gameState.honor += summary.honorGain;

  aplicarPremioDelJefe(summary);

  gameState.lastRaid = summary;
}

/**
 * MATASTE AL CAZARRECOMPENSAS.
 *
 * Se aplica DESPUÉS de `bountyDelta` a propósito: el descuento se calcula
 * sobre la recompensa final del asalto, no sobre la que traías. Si fuera al
 * revés, matarlo y después armar un tiroteo te dejaría peor que no haberlo
 * matado, y eso invertiría el incentivo justo en el momento en que el jugador
 * más se está arriesgando.
 *
 * Y CUENTA AUNQUE TE CAPTUREN. No es botín —eso se pierde si no escapás— es
 * un hecho que ya pasó: el tipo está muerto. Que sea lo único que sobrevive a
 * una captura le da a la pelea un valor que ninguna otra cosa del asalto
 * tiene, y es lo que la hace valer la pena cuando ya sabés que no vas a salir.
 *
 * ES LA ÚNICA FORMA DE BAJAR LA RECOMPENSA SIN PASAR POR LA CÁRCEL, y ahí
 * está la decisión: escaparle es lo seguro, pero enfrentarlo es lo único que
 * te aleja de la horca sin entregarte.
 */
function aplicarPremioDelJefe(summary) {
  summary.bountyBajada = 0;
  summary.famaGanada = 0;
  if (!summary.jefeMuerto || !summary.jefeId) return;

  const jefe = BOSSES[summary.jefeId];
  if (!jefe) return;

  const bajada = Math.round(gameState.bounty * jefe.premio.bajaBountyFrac);
  gameState.bounty = Math.max(0, gameState.bounty - bajada);

  /**
   * Y ACÁ `fame` EMPIEZA A EXISTIR. Estaba en el estado desde la fase 1 y NADA
   * en todo el juego la movía nunca. El primer tipo que la mueve tenía que ser
   * éste: la fama es cuánto te conocen, y matar al que vino a cobrar tu cabeza
   * es exactamente la clase de cosa que se cuenta en una cantina.
   */
  gameState.fame += jefe.premio.sumaFama;

  summary.bountyBajada = bajada;
  summary.famaGanada = jefe.premio.sumaFama;
  // Para que la pantalla de resultados diga a QUIÉN mataste sin repetir el
  // catálogo. El Sheriff no baja recompensa (`bajaBountyFrac: 0`), así que esa
  // fila se oculta sola y queda sólo la fama.
  summary.jefeNombre = jefe.name;
}

/**
 * LA PRISIÓN: qué pasa cuando te agarran.
 *
 * Se llama UNA vez, al entrar a la escena de la cárcel, y devuelve el parte
 * de lo que pasó para que la pantalla lo cuente sin repetir la fórmula (el
 * mismo arreglo que ya se usó con `summary.bountyGain`).
 *
 * El orden importa y no es intercambiable:
 *
 *  1. **Primero la horca.** Si tu recompensa llegó al umbral, no hay fianza:
 *     sos demasiado buscado para que te suelten por dinero. Se pregunta ANTES
 *     de mirar la plata a propósito — si el dinero pudiera salvarte igual, la
 *     recompensa sería un precio y no una cuenta regresiva.
 *  2. **Después la fianza, cobrada con lo que tengas.** Pagás lo que puedas;
 *     lo que no, lo seguís debiendo.
 *
 * Ojo con el momento: `applyRaidResult` ya corrió, así que `bounty` incluye
 * la captura misma (`capturaFlat`). Es lo correcto — te agarraron, y eso
 * también es parte de lo que tienen contra vos.
 */
export function resolverPrision() {
  const deuda = gameState.bounty;

  if (deuda >= CONFIG.prision.umbralHorca) {
    return { horca: true, deuda, pagado: 0, restante: deuda, libre: false };
  }

  const pagado = Math.min(gameState.money, deuda);
  gameState.money -= pagado;
  gameState.bounty -= pagado;

  return {
    horca: false,
    deuda,
    pagado,
    restante: gameState.bounty,
    libre: gameState.bounty === 0,
  };
}

/** Cuánto te falta para que no haya fianza que valga. Lo usa el sheriff. */
export function faltaParaLaHorca(bounty = gameState.bounty) {
  return Math.max(0, CONFIG.prision.umbralHorca - bounty);
}

/**
 * Qué suma a `bounty`. Ver la nota "Qué sube la recompensa" en
 * NOTAS-DISENO.md — acá va el resumen de por qué cada línea está como está:
 *
 * - Sin alarma y sin captura, no suma nada: nadie sobrevivió para
 *   describirte, así que no hay a quién buscar. La plata NUNCA entra acá.
 * - Con la alarma sonando (escapaste o no), suma por cada guardia o civil
 *   muerto y por cada pasajero amenazado. `summary.kills` mezcla guardias del
 *   tren y jinetes de la ley a propósito: ambos son gente de la ley muerta,
 *   mismo peso. Amenazar pesa la mitad que matar a un guardia: es un delito
 *   real (queda un testigo) pero no es violencia.
 * - Si te capturan, suma el salto fijo APARTE de lo anterior — las dos cosas
 *   se acumulan si además sonó la alarma, porque "aparte de todo" significa
 *   sumado, no en lugar de.
 *
 * Por qué `amenazados` va con el mismo candado de `summary.alarm` que
 * guardias y civiles, aunque el testigo de una amenaza quede vivo: es la
 * misma regla pareja de todo el sistema, y en la práctica casi da igual —
 * el testigo grita solo a los `robPanicDelay` segundos salvo que lo mates o
 * te vayas del tren antes, así que amenazar ya casi siempre prende la alarma
 * por su cuenta.
 */
function bountyDelta(summary) {
  const { pesoGuardia, pesoCivil, pesoAmenaza, capturaFlat } = CONFIG.bounty;
  let delta = 0;

  if (summary.alarm) {
    delta += (summary.civilians || 0) * pesoCivil
      + summary.kills * pesoGuardia
      + (summary.amenazados || 0) * pesoAmenaza;
  }
  if (summary.outcome !== 'escaped') {
    delta += capturaFlat;
  }

  return delta;
}

/**
 * QUÉ MUEVE `honor`. A diferencia de `bounty`, no depende de si sonó la
 * alarma o te vieron: es sobre CÓMO actuaste, no sobre si te identificaron.
 * Ver el porqué de cada peso en CONFIG.honor.
 *
 * `civilians` y `kills` ya existen (los usa `bountyDelta`); `perdonados`,
 * `rendidosMatados`, `noqueadosRematados` y `noqueadosLimpios` los junta
 * raidScene.js sobre la marcha, con la misma info que ya tenía para todo lo
 * demás.
 */
function honorDelta(summary) {
  const h = CONFIG.honor;
  let delta = 0;

  delta += (summary.perdonados || 0) * h.perdonarRendido;
  delta += (summary.rendidosMatados || 0) * h.rematarRendido;
  delta += (summary.noqueadosRematados || 0) * h.rematarNoqueado;
  delta += (summary.noqueadosLimpios || 0) * h.noquearLimpio;
  delta += (summary.civilians || 0) * h.matarCivil;

  if (summary.outcome === 'escaped' && summary.kills === 0 && (summary.civilians || 0) === 0) {
    delta += h.asaltoSinSangre;
  }

  return delta;
}
