/**
 * Constructor del TREN.
 *
 * El tren es UN SOLO mapa largo hecho de tramos pegados uno al lado del otro:
 *
 *   [salida 8] [vagón 40] [enganche 3] [vagón 40] [enganche 3] ... [enganche 3]
 *
 * Los vagones miden todos 40 columnas, pero los tramos al aire libre no, así
 * que el armador trabaja con anchos variables y va acumulando dónde empieza
 * cada cosa.
 *
 * Que sea un solo mapa y no varios mapas separados es la decisión técnica más
 * importante de la fase 2: la visión, la línea de tiro, la cobertura, las
 * balas, la IA y la cámara ya sabían trabajar sobre "un mapa", así que todo eso
 * siguió funcionando sin tocar una línea. Y los guardias del vagón de al lado
 * existen de verdad: te oyen, te ven por el enganche y pueden venir caminando.
 */

import { CONFIG } from '../data/config.js';
import { createTilemap } from './tilemap.js';
import { createPlayer } from '../entities/player.js';
import { createEnemy } from '../entities/enemy.js';
import { createPassenger } from '../entities/passenger.js';
import { createLootable } from '../entities/lootable.js';
import { createDoor } from '../entities/door.js';
import { WAGONS, TRAMOS } from '../data/wagons.js';
import {
  TRAIN_TYPES, TIPO_TREN_POR_DEFECTO, DIFICULTADES, DIFICULTAD_POR_DEFECTO,
} from '../data/train.js';
import { guardHealth, GUARD_TYPES, DEFAULT_GUARD_TYPE } from '../data/guards.js';

const ALTO = 10;   // todos los tramos miden 10 filas

/** Para que en los datos se pueda escribir facing: 'left' en vez de un ángulo. */
const FACINGS = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

/**
 * EL PERFIL DE IA DE UN TREN.
 *
 * Cada guardia nace con su PROPIA copia de `CONFIG.enemy` (`e.ai`, ver
 * entities/enemy.js), igual patrón que ya usan con la vida vía
 * `guardHealth()`. Por defecto es una copia llana, así que un guardia sin
 * overrides se comporta exactamente igual que antes.
 *
 * Dos cosas la pueden tocar, y se combinan si coinciden en el mismo tren:
 *   - la DIFICULTAD (`dificultad.aiOverrides`, sólo la tiene "dura"): mejora
 *     puntería, tiempo de reacción, sospecha y frecuencia de asomada.
 *   - el TIPO DE TREN (`tipoTren.sospechaMult`, sólo lo tiene "veloz"):
 *     multiplica la velocidad de sospecha encima de lo que ya haya puesto
 *     la dificultad.
 */
function construirPerfilIA(dificultad, tipoTren) {
  const perfil = { ...CONFIG.enemy, ...(dificultad.aiOverrides || {}) };
  if (tipoTren.sospechaMult) {
    perfil.suspicionNear *= tipoTren.sospechaMult;
    perfil.suspicionFar *= tipoTren.sospechaMult;
  }
  return perfil;
}

/**
 * Mezcla la baraja de vagones de un tipo de tren, respetando sus reglas.
 * El índice 0 es el vagón 1 (el más cercano a la salida).
 *
 * Dos reglas posibles, y son distintas a propósito:
 *
 *   `posicionMinima: { id: N }`   — ese vagón puede caer en cualquier lado
 *                                    de N para adelante. Se sortea con el
 *                                    resto y se reintenta si no cumple.
 *   `posicionFija: { id: 'ultima' }` — ese vagón NUNCA se mezcla: se saca
 *                                    del mazo antes de barajar y se pone
 *                                    directamente en su lugar. (El tren
 *                                    veloz lo usa para el blindado: siempre
 *                                    pegado a la locomotora, no "3 o más
 *                                    adelante" como el estándar.)
 */
export function sortearComposicion(rng, tipoTren) {
  tipoTren = tipoTren || TRAIN_TYPES[TIPO_TREN_POR_DEFECTO];
  const composition = tipoTren.composition;
  const reglasMin = tipoTren.posicionMinima || {};
  const reglasFija = tipoTren.posicionFija || {};

  const fijos = composition.filter((id) => reglasFija[id] !== undefined);
  const resto = composition.filter((id) => reglasFija[id] === undefined);

  for (let intento = 0; intento < 50; intento++) {
    const baraja = [...resto];
    for (let i = baraja.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
    }

    const resultado = [...baraja];
    for (const id of fijos) {
      const regla = reglasFija[id];
      if (regla === 'ultima') resultado.push(id);
      else resultado.splice(Math.max(0, Math.min(resultado.length, regla)), 0, id);
    }

    const valida = resultado.every((id, i) => {
      const minimo = reglasMin[id];
      return minimo === undefined || i + 1 >= minimo;
    });
    if (valida) return resultado;
  }
  return [...composition];
}

/**
 * La ronda de barrido por defecto, calculada según el ancho del vagón.
 *
 * Antes era una constante `[[4,4],[35,4],[35,5],[4,5]]`, que asumía que todos
 * los vagones medían 40 columnas. Ahora que el de ganado mide 24, esa ronda se
 * saldría del mapa. Se calcula.
 */
function barridoDe(cols) {
  const fin = cols - 4;
  return [[3, 4], [fin, 4], [fin, 5], [3, 5]];
}

/**
 * DE QUÉ TRAMOS ESTÁ HECHO EL TREN Y DÓNDE EMPIEZA CADA UNO.
 *
 * Es la geometría del tren sin construir nada: sin guardias, sin botín y sin
 * mapa. Existe separada porque la escena del galope necesita saber dónde queda
 * cada enganche para que puedas saltar, y sería absurdo que para dibujar un
 * tren a lo lejos tuviera que instanciar trece guardias.
 *
 * @param caballoEn si es > 1, el enganche donde queda el caballo se hace UNA
 *   COLUMNA más ancho. No es un capricho: en tres columnas no entran las dos
 *   cosas que tienen que convivir ahí — la zona donde te bajás y el lugar donde
 *   aparecés, separados lo suficiente como para no terminar el asalto en el
 *   primer cuadro. Con la zona de una sola baldosa, el que llegaba corriendo se
 *   pasaba de largo antes de completar el segundo de [E], que bajo presión se
 *   siente a que el juego te falla.
 */
export function planificarTramos(composicion, caballoEn = 0) {
  const tramos = [];
  let col = 0;

  const agregar = (tipo, plantilla, wagon) => {
    const cols = plantilla.layout[0].length;
    tramos.push({ tipo, plantilla, wagon, colStart: col, cols });
    col += cols;
  };

  const engancheAncho = {
    id: TRAMOS.enganche.id,
    layout: TRAMOS.enganche.layout.map((fila) => fila + fila[fila.length - 1]),
  };

  agregar('salida', TRAMOS.salida, 0);
  composicion.forEach((id, i) => {
    agregar('vagon', WAGONS[id], i + 1);
    const esDelCaballo = i + 1 === caballoEn - 1;
    agregar('enganche', esDelCaballo ? engancheAncho : TRAMOS.enganche, i + 1);
  });

  return tramos;
}

/**
 * Dónde queda el centro de cada plataforma al aire libre, en píxeles.
 * `plataformas[i]` es la que está JUSTO ANTES del vagón i, o sea el punto donde
 * podés dejar el caballo para subir a ese vagón.
 */
export function plataformasDe(tramos, tileSize) {
  const plataformas = [];
  const centro = (t) => (t.colStart + t.cols / 2) * tileSize;
  plataformas[1] = (tramos[0].colStart + tramos[0].cols - 2) * tileSize;
  for (const t of tramos) {
    if (t.tipo === 'enganche') plataformas[t.wagon + 1] = centro(t);
  }
  return plataformas;
}

/**
 * Arma el tren entero.
 *
 * @param rng          generador de azar
 * @param caballoEn    dónde dejaste el caballo: 1 = la cola de siempre, 2 = el
 *                     enganche entre el vagón 1 y el 2, 3 = entre el 2 y el 3.
 *                     Ahí subís vos y ahí es la ÚNICA salida (no hay otra).
 * @param composicion  el orden de los vagones. Si no viene, se sortea acá.
 * @param dificultadId qué tan escoltado viaja el tren (data/train.js)
 * @param weaponId     con qué arma sale el jugador (data/weapons.js). Se
 *                     recibe como valor, no se importa `gameState` acá — este
 *                     archivo no sabe nada del estado de la partida, sólo
 *                     arma mundos con lo que le pasan.
 * @param tipoTrenId   de qué tipo es el tren (data/train.js: TRAIN_TYPES).
 *                     Decide de qué vagones está hecho (si no vino
 *                     `composicion`), cuánto dura el asalto, y si suma algo
 *                     al ruido o a la sospecha de sus guardias.
 */
export function buildTrain(
  rng, caballoEn = 1, composicion = null, dificultadId = null, weaponId = undefined, tipoTrenId = null
) {
  const tipoTren = TRAIN_TYPES[tipoTrenId] || TRAIN_TYPES[TIPO_TREN_POR_DEFECTO];
  composicion = composicion || sortearComposicion(rng, tipoTren);
  const dificultad = DIFICULTADES[dificultadId] || DIFICULTADES[DIFICULTAD_POR_DEFECTO];

  // El perfil de IA de CADA guardia de este tren. Por defecto es una copia
  // llana de CONFIG.enemy; una dificultad "dura" le suma sus overrides, y un
  // tren "veloz" además apura la sospecha (sospechaMult) encima de eso — las
  // dos cosas se combinan si coinciden.
  const perfilIA = construirPerfilIA(dificultad, tipoTren);

  // Hasta dónde llega el caballo. El tope está en config para poder subirlo
  // desde la consola cuando hace falta entrar a un vagón del fondo a probar
  // algo: FORAJIDO.config.caballo.maxAdelanto = 6
  const caballo = Math.max(1, Math.min(
    Math.min(CONFIG.caballo.maxAdelanto, composicion.length), caballoEn
  ));

  // --- 1. La lista de tramos, en orden, con dónde empieza cada uno ---
  const tramos = planificarTramos(composicion, caballo);

  // --- 2. Pegar los layouts fila por fila ---
  const layout = [];
  for (let row = 0; row < ALTO; row++) {
    layout.push(tramos.map((t) => t.plantilla.layout[row]).join(''));
  }

  /**
   * --- 2 bis. Poner la salida donde quedó el caballo ---
   *
   * La salida no es un lugar fijo del tren: es donde está el caballo. Acá se
   * pintan las casillas 'E' en la plataforma elegida y se le sacan a la cola si
   * el caballo no se quedó ahí. Todo lo demás (el dibujo, la zona de escape, el
   * cartel de [E] ESCAPAR) ya sabe trabajar con una 'E' y no se toca.
   *
   * Si el caballo quedó adelante, la cola sigue existiendo: es una plataforma
   * al aire libre como cualquier otra, pero sin nadie esperándote. Ir para allá
   * es caminar hacia un callejón sin salida, y esa es justamente la renuncia
   * que pagás por haberte adelantado.
   */
  const tramoDelCaballo = caballo === 1
    ? tramos[0]
    : tramos.find((t) => t.tipo === 'enganche' && t.wagon === caballo - 1);

  if (caballo > 1) {
    // La cola se queda sin caballo: sus 'E' vuelven a ser pasarela pelada.
    const cola = tramos[0];
    for (const row of [4, 5]) {
      layout[row] = pintar(layout[row], cola.colStart, cola.cols, (ch) => (ch === 'E' ? '+' : ch));
    }
    // Y el enganche pasa a ser la salida: las dos columnas de la izquierda.
    // Las otras dos quedan libres para aparecer ahí sin empezar el asalto
    // parado encima del caballo.
    for (const row of [4, 5]) {
      layout[row] = pintar(layout[row], tramoDelCaballo.colStart, 2, () => 'E');
    }
  }

  const map = createTilemap(layout);

  // --- 3. Metadatos de cada vagón ---
  // El índice 0 es la plataforma de salida; 1..6 son los vagones robables.
  const wagons = [{
    index: 0, id: 'salida', name: 'Plataforma trasera', short: 'SALIDA',
    hint: 'Tu caballo te espera acá.', esCola: true,
    x: 0, width: TRAMOS.salida.layout[0].length * map.size,
    guardiasVivos: 0,
  }];

  for (const t of tramos) {
    if (t.tipo !== 'vagon') continue;
    wagons.push({
      index: t.wagon,
      id: t.plantilla.id,
      name: t.plantilla.name,
      short: t.plantilla.short,
      hint: t.plantilla.hint,
      esCola: false,
      /**
       * ¿Se puede ver hacia adentro desde afuera? Sale del layout, no de una
       * lista escrita a mano: un vagón nuevo que lleve 'W' o 'H' queda expuesto
       * solo, sin tocar código. Lo usa el galope para saber si te pueden ver
       * pasar, y es lo que hace del blindado el único lugar ciego del tren.
       */
      tieneVentanillas: t.plantilla.layout.some((fila) => /[WH]/.test(fila)),

      /**
       * ¿Se puede caminar por arriba? El vagón de ganado va al aire libre
       * (barandas en vez de paredes), así que no tiene techo que pisar: el
       * camino de arriba se corta ahí. Sale de los datos (`sinTecho` en
       * wagons.js), no de una lista escrita a mano acá.
       */
      tieneTecho: !t.plantilla.sinTecho,
      colStart: t.colStart,
      x: t.colStart * map.size,
      width: t.cols * map.size,
      guardiasVivos: 0,
    });
  }

  // Para pintar la carga de cada vagón de un color distinto.
  const tipoPorColumna = new Array(map.cols);
  for (const t of tramos) {
    for (let c = t.colStart; c < t.colStart + t.cols; c++) tipoPorColumna[c] = t.plantilla.id;
  }

  /**
   * --- 3 bis. Las puertas: DOS por vagón, en SU propio borde ---
   *
   * No una compartida flotando en el medio del enganche — cada vagón tiene su
   * puerta de entrada y su puerta de salida, paradas justo en su propia pared.
   * Cruzar de un vagón al otro es: puerta del que dejás, la pasarela al aire
   * libre, puerta del que entrás — dos puertas, no una.
   *
   * Las dos del vagón blindado salen distintas — sólo se abren empujando
   * desde ADENTRO; desde afuera, sólo dinamita (`volarPuerta` en
   * systems/explosives.js).
   */
  const blindadoWagon = wagons.find((w) => w.id === 'blindado');
  const doors = [];
  for (const t of tramos) {
    if (t.tipo !== 'vagon') continue;
    const esBlindado = blindadoWagon && t.wagon === blindadoWagon.index;

    const bordes = [
      { col: t.colStart, insideDir: 1 },              // la puerta de entrada
      { col: t.colStart + t.cols - 1, insideDir: -1 }, // la de salida
    ];
    for (const borde of bordes) {
      const centro = map.tileCenter(borde.col, 4);
      const pos = { x: centro.x, y: centro.y + map.size / 2 };
      doors.push(createDoor(pos.x, pos.y, {
        kind: esBlindado ? 'blindada' : 'normal',
        insideDir: borde.insideDir,
      }));
    }
  }

  // --- 4. Entidades, con las coordenadas ya corridas al lugar del tren ---
  const enemies = [];
  const passengers = [];
  const loot = [];
  const tranqueras = [];
  const avisos = [];

  for (const t of tramos) {
    if (t.tipo !== 'vagon') continue;
    const p = t.plantilla;
    const off = t.colStart;
    const enTiles = ([c, r]) => map.tileCenter(c + off, r);

    // El tipo lo fija el vagón (el blindado viaja con guardias blindados) y se
    // puede pisar guardia por guardia si alguna vez hace falta.
    const tipoDelVagon = p.guardType || DEFAULT_GUARD_TYPE;

    for (const def of p.enemies || []) {
      const path = (def.path || []).map(enTiles);
      const start = path[0] || enTiles([def.col ?? 4, def.row ?? 4]);
      const tipo = def.guardType || tipoDelVagon;
      const guard = createEnemy(start.x, start.y, {
        path,
        facing: FACINGS[def.facing] ?? Math.PI,
        dynamite: def.dynamite || 0,
        type: tipo,
        health: guardHealth(tipo, dificultad.vidaExtra),
        ai: perfilIA,
      });
      guard.wagon = t.wagon;      // de qué vagón es: importa para la alarma
      guard.homePath = guard.path;

      /**
       * LOS GUARDIAS DEL BLINDADO NUNCA SALEN DE SU VAGÓN. Ni persiguiendo, ni
       * perdidos, ni por ningún otro motivo — es un guardia que no abandona el
       * puesto pase lo que pase. `systems/ai.js` (`confinar`) lo hace cumplir
       * al final de cada actualización, sin importar qué haya decidido el
       * resto de la IA ese cuadro: es la red de seguridad final, no una regla
       * que dependa de que cada camino de código se acuerde de respetarla.
       */
      if (tipo === 'blindado') {
        guard.confinado = { x0: t.colStart * map.size + 6, x1: (t.colStart + t.cols) * map.size - 6 };
      }

      enemies.push(guard);
      wagons[t.wagon].guardiasVivos++;
      revisar(avisos, map, start, `guardia del ${p.name} (vagón ${t.wagon})`);
    }

    for (const def of p.passengers || []) {
      const pos = enTiles([def.col, def.row]);
      const pa = createPassenger(pos.x, pos.y, FACINGS[def.facing] ?? Math.PI);
      pa.wagon = t.wagon;
      passengers.push(pa);
      revisar(avisos, map, pos, `pasajero del ${p.name} (vagón ${t.wagon})`);
    }

    for (const def of p.loot || []) {
      const pos = enTiles([def.col, def.row]);
      const l = createLootable(pos.x, pos.y, def.type, rng);
      l.wagon = t.wagon;
      loot.push(l);
      revisar(avisos, map, pos, `botín del ${p.name} (vagón ${t.wagon})`);
    }

    /**
     * LAS TRANQUERAS DE LOS CORRALES — sólo si este TIPO de tren las trae.
     *
     * El mismo vagón de ganado, en el tren estándar, no tiene ninguna: es el
     * pasillo de paso de siempre. En el de carga (`estampida: true`) se
     * pueden abrir y soltar la manada. Que dependa del tipo de tren y no del
     * vagón es lo que convierte al ganado en la identidad de UN tren, en vez
     * de una regla nueva para todo el juego.
     *
     * El `y` cae dentro del pasillo, no en el corral: es donde está el pasador
     * y desde donde lo alcanzás sin meterte entre los animales.
     */
    if (tipoTren.estampida) {
      for (const def of p.tranqueras || []) {
        const centro = map.tileCenter(def.col + off, def.lado === 'arriba' ? 4 : 5);
        tranqueras.push({
          x: centro.x,
          y: def.lado === 'arriba' ? centro.y - 4 : centro.y + 4,
          lado: def.lado,
          wagon: t.wagon,
          abierta: false,
          progreso: 0,
        });
      }
    }

    wagons[t.wagon].ronda = (p.sweep || barridoDe(t.cols)).map(enTiles);
    wagons[t.wagon].guardType = tipoDelVagon;
  }

  if (avisos.length) {
    console.warn('TREN: hay cosas colocadas sobre tiles sólidos:\n' + avisos.join('\n'));
  }

  // --- 5. Las plataformas al aire libre: por ahí se entra y se sale ---
  // plataformas[i] = la plataforma que está JUSTO ANTES del vagón i.
  // La del vagón 1 es la plataforma de salida (donde está el caballo), y hay
  // una de más al final: la punta de adelante, del lado de la locomotora.
  const plataformas = [];
  plataformas[1] = centroDe(map, tramos[0]);
  for (const t of tramos) {
    if (t.tipo === 'enganche') plataformas[t.wagon + 1] = centroDe(map, t);
  }

  /**
   * --- 6. El jugador entra por donde dejó el caballo ---
   *
   * Subir y bajar son el mismo lugar. No hay una decisión de "dónde subo" y
   * otra de "por dónde me bajo": es una sola, y se toma antes de arrancar
   * viendo nada más que los tipos de vagón.
   */
  const entrada = plataformas[caballo];
  // Un tile a la derecha del centro cuando el caballo quedó en un enganche, para
  // no aparecer adentro de la zona de escape y poder bajarse sin haber jugado.
  const entradaX = caballo === 1 ? entrada.x : entrada.x + map.size;
  const player = createPlayer(entradaX, entrada.y, weaponId);

  return {
    map,
    player,
    enemies,
    passengers,
    loot,
    doors,
    tranqueras,
    wagons,
    tramos,
    tipoPorColumna,
    plataformas,
    dificultad,
    tipoTren,
    raidDuration: tipoTren.raidDuration || CONFIG.raid.duration,
    ruidoExtra: tipoTren.ruidoExtra || 0,
    // 0 = este tren no suelta nada adentro (ver CONFIG.rodante).
    rodantesCada: tipoTren.rodantesCada || 0,
    // ¿En este tren el botín te frena cuando suena la alarma? (CONFIG.peso)
    pesaElBotin: !!tipoTren.pesaElBotin,
    // 0 = este tren nunca se pone traicionero (ver CONFIG.traqueteo).
    traqueteoCada: tipoTren.traqueteoCada || 0,
    // Para los refuerzos que entran DESPUÉS por la locomotora (raidScene.js,
    // `spawnReinforcement`): tienen que nacer con el mismo perfil que todos
    // los demás guardias de este tren, no con el de CONFIG.enemy a secas.
    ai: perfilIA,
    caballoEn: caballo,
    boardedAt: caballo,
    exitZone: findExitZone(map),
    totalLootValue: loot.reduce((sum, l) => sum + l.value, 0),

    /** ¿En qué vagón está este punto? 0 = la plataforma de salida. */
    wagonAt(x) {
      const c = Math.floor(x / map.size);
      for (let i = tramos.length - 1; i >= 0; i--) {
        if (c >= tramos[i].colStart) return tramos[i].wagon;
      }
      return 0;
    },

    /** ¿Está adentro de un vagón, o al aire libre en un enganche? */
    tramoAt(x) {
      const c = Math.floor(x / map.size);
      for (let i = tramos.length - 1; i >= 0; i--) {
        if (c >= tramos[i].colStart) return tramos[i].tipo;
      }
      return 'salida';
    },

    /** La plataforma de antes del vagón i (i = 1..length+1). */
    plataforma(i) {
      const j = Math.max(1, Math.min(plataformas.length - 1, i));
      return plataformas[j];
    },

    /** Por dónde entra la gente de la locomotora: la punta de adelante. */
    get puntaLocomotora() {
      return plataformas[plataformas.length - 1];
    },
  };
}

/** Reescribe un pedazo de una fila del mapa, casilla por casilla. */
function pintar(fila, desde, cuantos, fn) {
  const chars = fila.split('');
  for (let c = desde; c < desde + cuantos; c++) chars[c] = fn(chars[c]);
  return chars.join('');
}

/** El centro pisable de un tramo al aire libre (las filas 4-5 son la pasarela). */
function centroDe(map, tramo) {
  const col = tramo.colStart + Math.floor(tramo.cols / 2);
  const centro = map.tileCenter(col, 4);
  // La plataforma de salida tiene las casillas 'E' a la izquierda: entramos por
  // la derecha, para no aparecer literalmente encima del caballo.
  if (tramo.tipo === 'salida') return map.tileCenter(tramo.colStart + tramo.cols - 2, 4);
  return centro;
}

/** Avisa (no rompe) si algo quedó colocado encima de una pared o un asiento. */
function revisar(avisos, map, pos, quien) {
  if (map.isSolidAt(pos.x, pos.y)) {
    const col = Math.floor(pos.x / map.size);
    const row = Math.floor(pos.y / map.size);
    avisos.push(`  - ${quien} está sobre un tile sólido (col ${col}, fila ${row})`);
  }
}

/** La zona de escape es el rectángulo que ocupan las salidas ('E'). */
function findExitZone(map) {
  const tiles = map.findTiles('E');
  if (tiles.length === 0) throw new Error('El tren no tiene salida ("E") en la plataforma trasera.');

  const cols = tiles.map((t) => t.col);
  const rows = tiles.map((t) => t.row);
  const size = map.size;

  return {
    x: Math.min(...cols) * size,
    y: Math.min(...rows) * size,
    width: (Math.max(...cols) - Math.min(...cols) + 1) * size + 6,
    height: (Math.max(...rows) - Math.min(...rows) + 1) * size,
  };
}

export function isInsideZone(entity, zone) {
  return (
    entity.x >= zone.x && entity.x <= zone.x + zone.width &&
    entity.y >= zone.y && entity.y <= zone.y + zone.height
  );
}

// ----------------------------------------------------------------- dibujo

/**
 * Dibuja el tren, pero SOLO las columnas que se ven.
 *
 * El tren son ~2700 tiles y en pantalla entran unas 24 columnas. Recortar al
 * rango visible es la diferencia entre que corra bien y que se arrastre.
 */
export function drawTrain(r, train, colors, camX, camY) {
  const map = train.map;
  const size = map.size;

  const colDesde = Math.max(0, Math.floor(camX / size) - 1);
  const colHasta = Math.min(map.cols - 1, Math.ceil((camX + r.width) / size) + 1);
  const filaDesde = Math.max(0, Math.floor(camY / size) - 1);
  const filaHasta = Math.min(map.rows - 1, Math.ceil((camY + r.height) / size) + 1);

  for (let row = filaDesde; row <= filaHasta; row++) {
    for (let col = colDesde; col <= colHasta; col++) {
      const tile = map.grid[row][col];
      const x = col * size;
      const y = row * size;

      switch (tile) {
        case 'X':
          // El vacío: no dibujamos nada y se ve el paisaje pasando por detrás.
          // Eso es lo que hace que los enganches se lean como "afuera".
          break;

        case '#':
          r.rect(x, y, size, size, colors.wall);
          r.rect(x, y, size, 4, colors.wallTop);
          break;

        case 'S':
          r.rect(x, y, size, size, colors.floor);
          r.rect(x + 1, y + 2, size - 2, size - 4, colors.seat);
          r.rect(x + 1, y + 2, size - 2, 3, colors.seatTop);
          break;

        case 'C': {
          // La carga se pinta según el vagón: las mesas del comedor, los
          // cajones del correo y las rejas del corral no se parecen en nada.
          const paleta = colors.cargo[train.tipoPorColumna[col]] || colors.cargo.default;
          r.rect(x, y, size, size, colors.floor);
          r.rect(x, y + 1, size, size - 2, paleta[0]);
          r.rect(x, y + 1, size, 3, paleta[1]);
          break;
        }

        case 'W':
          // Ventanilla: marco de pared con el vidrio en el medio. Tiene que
          // gritar "esto no es pared", porque por acá te entran las balas.
          r.rect(x, y, size, size, colors.wall);
          r.rect(x, y + 3, size, size - 6, colors.window);
          r.rect(x, y + 5, size, size - 10, colors.windowGlass);
          break;

        case 'H':
          // Baranda del vagón de ganado: al aire libre, se ve el paisaje pasar.
          r.rect(x, y + 5, size, 4, colors.railing);
          r.rect(x, y + 5, size, 1, colors.railingTop);
          r.rect(x + 2, y + 2, 2, 10, colors.railing);
          r.rect(x + 11, y + 2, 2, 10, colors.railing);
          break;

        case 'E':
          r.rect(x, y, size, size, colors.door);
          r.rect(x + 2, y + 2, size - 4, size - 4, colors.doorGlow);
          break;

        case '+':
          // La pasarela del enganche: chapa desnuda, con el vacío a los lados.
          r.rect(x, y, size, size, colors.coupling);
          r.rect(x, y, size, 2, colors.couplingEdge);
          r.rect(x, y + size - 2, size, 2, colors.couplingEdge);
          r.rect(x + 3, y + 5, 2, 6, colors.couplingEdge);
          r.rect(x + 11, y + 5, 2, 6, colors.couplingEdge);
          break;

        default:
          r.rect(x, y, size, size, (row + col) % 2 === 0 ? colors.floor : colors.floorAlt);
          r.rect(x, y + size - 1, size, 1, '#5b3d27');
      }
    }
  }
}
