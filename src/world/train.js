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
import { createDoor, trabarPuerta } from '../entities/door.js';
import { createCajon } from '../entities/cajon.js';
import { EXPLOSIVES } from '../data/explosives.js';
import { WAGONS, TRAMOS } from '../data/wagons.js';
import {
  TRAIN_TYPES, TIPO_TREN_POR_DEFECTO, DIFICULTADES, DIFICULTAD_POR_DEFECTO,
} from '../data/train.js';
import {
  CLIMA, CLIMA_POR_DEFECTO, sortearCuantasPuertasTrabadas, sortearVarianteGuardia,
} from '../data/modifiers.js';
import {
  PAQUETES, ESCONDITES, TILE_DE_ESCONDITE, CIVILES_QUE_SABEN,
} from '../data/paquetes.js';
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
 *   - el ESTADO DEL TREN (`redada`, data/modifiers.js): suma el mismo
 *     `aiOverrides` de "dura" que ya usa la dificultad, encima de lo que
 *     haya puesto la dificultad sorteada — un tren "tranquilo" con redada
 *     pelea como uno "dura", sin que su vida haya cambiado.
 *
 * Las tres se combinan si coinciden en el mismo tren, y son independientes
 * entre sí: nada le impide a un tren "dura" salir además con tormenta.
 *
 * 🐛 EL CLIMA NO VA ACÁ, Y ANTES ESTABA ACÁ, Y NO HACÍA NADA. `clima.hearMult`
 * multiplicaba `perfil.hearRadius`/`hearStepRadius` en este mismo perfil de
 * IA — pero nada en el juego LEE esos dos campos ahí. El alcance del oído no
 * es una habilidad de cada guardia (como sí lo son `spreadNear` o `aimTime`,
 * que `updateSuspicion`/`spreadAt` sí leen de `e.ai`): es una propiedad del
 * RUIDO en sí — el radio que se manda en cada `bus.emit('noise', {radius})`
 * — y ESE número siempre salía de `CONFIG.enemy.hearRadius` a secas, en cada
 * lugar donde se dispara o se pisa fuerte (systems/ai.js, entities/player.js,
 * systems/boss.js, systems/riders.js). Mismo patrón que `ruidoExtra`: ahora
 * vive en el TREN (ver el `return` de `buildTrain`, más abajo), y esos
 * lugares leen `world.train.hearRadius`/`hearStepRadius` en vez de la
 * constante. Sin este cambio, tormenta se sorteaba y no hacía nada.
 */
function construirPerfilIA(dificultad, tipoTren, estado) {
  const perfil = { ...CONFIG.enemy, ...(dificultad.aiOverrides || {}) };
  if (estado && estado.includes('redada')) {
    Object.assign(perfil, DIFICULTADES.dura.aiOverrides);
  }
  if (tipoTren.sospechaMult) {
    perfil.suspicionNear *= tipoTren.sospechaMult;
    perfil.suspicionFar *= tipoTren.sospechaMult;
  }
  return perfil;
}

/**
 * A VECES EL TREN NO TRAE LOS MISMOS VAGONES (Fase 6a, `sustituciones` en
 * data/train.js).
 *
 * Es lo primero de todo el plan de variedad que cambia DE QUÉ está hecho el
 * tren y no sólo quién viaja adentro. Hoy: la mitad de los trenes estándar
 * cambian el vagón de ganado por el de armas.
 *
 * SE APLICA ANTES DE BARAJAR, a propósito: así el vagón que entró queda
 * sujeto a las mismas reglas de posición que cualquier otro (el de armas
 * tiene `posicionMinima: 2` — nunca el primero, para que reponerse no sea
 * gratis apenas subís).
 *
 * Cambia UNA sola aparición por regla. Si algún día un tipo de tren llevara
 * tres vagones iguales, sustituir todos de golpe convertiría el sorteo en dos
 * trenes distintos en vez de en un tren con una sorpresa.
 */
function aplicarSustituciones(rng, tipoTren) {
  const composicion = [...tipoTren.composition];
  for (const s of tipoTren.sustituciones || []) {
    if (!rng.chance(s.chance || 0)) continue;
    const i = composicion.indexOf(s.de);
    if (i >= 0) composicion[i] = s.por;
  }
  return composicion;
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
 *   `posicionMaxima: { id: N }`     — ese vagón nunca más adentro que N. Hoy
 *                                    lo usa el de armas: **nunca el último**,
 *                                    porque el Dinamitero necesita un vecino
 *                                    al que entrar de los DOS lados.
 *   `posicionRelativa: { id: { respectoDe, hueco, chanceAntes } }`
 *                                  — ese vagón va SIEMPRE separado de otro por
 *                                    al menos `hueco` vagones, y `chanceAntes`
 *                                    decide de qué lado cae (0 = siempre más
 *                                    adentro). Si el otro no viaja en este
 *                                    tren, la regla no aplica.
 */
export function sortearComposicion(rng, tipoTren) {
  tipoTren = tipoTren || TRAIN_TYPES[TIPO_TREN_POR_DEFECTO];
  const composition = aplicarSustituciones(rng, tipoTren);
  const reglasMin = tipoTren.posicionMinima || {};
  const reglasMax = tipoTren.posicionMaxima || {};
  const reglasFija = tipoTren.posicionFija || {};
  const reglasRel = tipoTren.posicionRelativa || {};

  /**
   * DE QUÉ LADO CAE CADA REGLA RELATIVA — se sortea UNA VEZ por tren, acá
   * afuera, y no adentro del bucle de intentos.
   *
   * Si se tirara la moneda en cada intento, el lado MÁS FÁCIL DE CUMPLIR
   * ganaría casi siempre: el primer barajado que cumpla se acepta, y hay muchos
   * más órdenes que satisfacen "el blindado más adentro" que al revés (el
   * blindado no puede ir antes del vagón 3, así que para quedar DELANTE del de
   * armas necesita que el de armas esté en el 5 o el 6). Un 50/50 tirado
   * adentro del bucle habría dado algo como 90/10 sin que se notara.
   */
  const lados = {};
  for (const id of Object.keys(reglasRel)) {
    const r = reglasRel[id];
    lados[id] = rng.chance(r.chanceAntes || 0) ? 'antes' : 'despues';
  }

  const fijos = composition.filter((id) => reglasFija[id] !== undefined);
  const resto = composition.filter((id) => reglasFija[id] === undefined);

  function intentar(ladosDeEstaVuelta, intentos = INTENTOS) {
    for (let intento = 0; intento < intentos; intento++) {
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
        const maximo = reglasMax[id];
        return (minimo === undefined || i + 1 >= minimo)
          && (maximo === undefined || i + 1 <= maximo);
      }) && cumpleRelativas(resultado, reglasRel, ladosDeEstaVuelta);
      if (valida) return resultado;
    }
    return null;
  }

  /**
   * 🐛 Y SI EL LADO SORTEADO NO SE PUEDE CUMPLIR, SE PRUEBA EL OTRO — no se
   * devuelve la baraja sin mezclar.
   *
   * Los dos lados no son igual de fáciles. Para que el blindado caiga DELANTE
   * del de armas con un hueco, el de armas tiene que estar en el 5 o el 6 (el
   * blindado no puede ir antes del 3): son tres pares posibles contra seis del
   * otro lado, así que un barajado al azar acierta mucho menos seguido.
   *
   * Medido con el escape viejo (50 intentos y después la composición cruda):
   * **23 trenes de 9921 salían con el blindado y el de armas PEGADOS** — o sea
   * exactamente el defecto que esta regla existe para evitar, colándose por la
   * puerta de atrás. Y encima eran el tren menos mezclado posible, siempre el
   * mismo.
   *
   * Probar el otro lado le rompe el 50/50 en menos de medio por ciento de los
   * trenes, que es infinitamente mejor que un tren pegado y sin barajar.
   */
  const otros = {};
  for (const id of Object.keys(lados)) {
    otros[id] = lados[id] === 'antes' ? 'despues' : 'antes';
  }
  return intentar(lados) || intentar(otros) || [...composition];
}

/**
 * CUÁNTAS BARAJADAS SE LE DAN A UN LADO ANTES DE PROBAR EL OTRO. 250, y el
 * número está calculado, no elegido a ojo.
 *
 * 🐛 ERAN 50 Y LA PERILLA MENTÍA. Con `chanceAntes: 0.25` salía **20,2%**
 * medido sobre 60.000 sorteos. El motivo: del lado "antes" hay UNA SOLA
 * disposición válida (el de armas en el 5 y el blindado en el 3), o sea 24 de
 * los 720 órdenes posibles — 3,33% por barajada. La chance de fallar 50 veces
 * seguidas es 0,9667^50 = 18,4%, y esos trenes se iban al otro lado. La cuenta
 * daba exactamente la fuga observada.
 *
 * Con 250 la chance de fallar cae a 0,9667^250 = 0,02%, así que la perilla dice
 * lo que hace. Y no cuesta nada: el promedio real son ~30 barajadas de un array
 * de seis, y sólo para el cuarto de los trenes que sacan "antes".
 */
const INTENTOS = 250;

/**
 * ¿Este orden respeta las reglas de separación entre dos vagones?
 *
 * Hoy la usa una sola: **el blindado y el vagón de armas nunca viajan pegados,
 * y a cada tren le toca de qué lado cae** — mitad y mitad.
 *
 * *(Santi: "yo pondría que el blindado siempre se encuentre después del de
 * armas [...] si armas está en el vagón 3, el blindado va a estar en el
 * cinco")*, y después *("quiero añadir una probabilidad: que el vagón blindado
 * se encuentre antes que el de armas. 50% de probabilidad que se encuentre
 * después (actual) y 50% de probabilidades que se encuentre antes")*.
 *
 * EL LADO NO ES SIMÉTRICO, y sale de una regla vieja: el blindado nunca viaja
 * antes del vagón 3 (`posicionMinima`). Así que para caer DELANTE del de armas
 * y dejarle un hueco, el de armas tiene que estar en el 5 o en el 6. O sea que
 * la moneda no reparte posiciones parejas: reparte **qué mitad del tren ocupa
 * el vagón de armas**. Con "después" queda entre el 2 y el 4; con "antes",
 * en el 5 o el 6.
 *
 * Y eso devuelve lo que la primera versión de esta regla había sacado: el vagón
 * de armas volvió a poder aparecer al fondo del tren.
 *
 * SALIÓ DE UN PROBLEMA MEDIDO: cuando los dos caían pegados, la ronda del
 * Dinamitero se acortaba a 640 px en vez de ~1070 —el vagón blindado no cuenta
 * como vecino, su puerta de chapa no se empuja desde afuera— así que pasaba
 * 48-60% del tiempo adentro en vez de 33% y "esperá a que salga", que es la
 * jugada de todo el vagón, casi no existía. Pasaba en el 43% de los trenes con
 * vagón de armas.
 *
 * EL HUECO ES LO QUE LO ARREGLA, no el orden. Con la regla literal —blindado
 * después del de armas, sin más— quedaban pegados el 40% de las veces, apenas
 * mejor que el 44% de antes: "después" incluye "justo después". Con un vagón de
 * por medio, 0%.
 *
 * Si el vagón de armas no viaja (tres de cada cuatro trenes), la regla no
 * aplica y el blindado se sortea como siempre.
 *
 * @param lados  qué le tocó a cada regla en ESTE tren ('antes' | 'despues'),
 *   sorteado una sola vez en `sortearComposicion` — ver la nota de ahí.
 */
function cumpleRelativas(orden, reglas, lados) {
  for (const id of Object.keys(reglas)) {
    const { respectoDe, hueco = 1 } = reglas[id];
    const i = orden.indexOf(id);
    const j = orden.indexOf(respectoDe);
    if (i < 0 || j < 0) continue;
    const separacion = lados[id] === 'antes' ? j - i : i - j;
    if (separacion < hueco) return false;
  }
  return true;
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
 * LA RONDA DEL DINAMITERO DEL VAGÓN DE ARMAS (Fase 6a).
 *
 * Devuelve por dónde camina (`path`, dos puntos que recorre de ida y vuelta),
 * dónde arranca (`startX`) y hasta dónde se lo deja llegar (`x0`/`x1`).
 *
 * DOS MEDIDAS DISTINTAS, Y ES LO IMPORTANTE DE ESTA FUNCIÓN:
 *
 *   la RONDA va de la mitad de un vecino a la mitad del otro. Media vuelta le
 *     lleva 1120 px, así que a 46 px/s la vuelta completa son ~49 s, de los
 *     cuales ~21 los pasa adentro del vagón de armas.
 *   el LÍMITE (`x0`/`x1`) abarca los tres vagones ENTEROS. Patrullando nunca
 *     llega ahí; peleando sí, y entonces el borde cae sobre una pared o una
 *     puerta y no sobre una línea invisible en el medio de un pasillo.
 *
 * UN VECINO BLINDADO NO CUENTA, y no es un caso raro: el blindado va del
 * vagón 3 para adelante y el de armas del 2 para adelante, así que se tocan
 * seguido. Su puerta es de chapa y no se empuja desde afuera —literalmente no
 * puede entrar— así que incluirlo sería mandarlo a empujar una pared. De ese
 * lado la ronda se queda adentro del vagón de armas.
 */
function rondaDinamitero(rng, tramoArmas, tramos, map) {
  const size = map.size;
  const vagones = tramos.filter((t) => t.tipo === 'vagon');
  const i = vagones.indexOf(tramoArmas);

  /**
   * ¿PUEDE ENTRAR EL DINAMITERO A ESTE VECINO?
   *
   * 🔻 SE PREGUNTABA POR EL TIPO DE GUARDIA (`guardType !== 'blindado'`) COMO
   * ATAJO PARA "vagón cerrado", Y EL ATAJO SE ROMPIÓ. El día que un vagón que
   * NO es el blindado llevara guardias blindados —el almacén, hoy— el atajo
   * decía "cerrado" de un vagón en el que se entra perfectamente, le acortaba
   * la vuelta y volvía a romper el "esperá a que salga". Justo el bug que ya
   * se arregló una vez.
   *
   * Ahora se pregunta por la propiedad de verdad: **si sus puertas son de
   * chapa**. Es lo único que de verdad lo frena — una puerta trabada no, porque
   * lleva la llave del tren (ver entities/door.js). Y es la misma marca que
   * decide qué puertas se crean blindadas, así que las dos cosas no pueden
   * volver a desincronizarse.
   */
  const abierto = (t) => !!t && !t.plantilla.puertasBlindadas;
  const antes = abierto(vagones[i - 1]) ? vagones[i - 1] : null;
  const despues = abierto(vagones[i + 1]) ? vagones[i + 1] : null;

  const centro = (t) => (t.colStart + t.cols / 2) * size;
  const xIzq = antes ? centro(antes) : (tramoArmas.colStart + 3) * size;
  const xDer = despues
    ? centro(despues)
    : (tramoArmas.colStart + tramoArmas.cols - 3) * size;

  // Los 6 px de margen son los mismos que usa el confinamiento del blindado:
  // lo justo para que no quede medio cuerpo metido en la pared.
  const izqTramo = antes || tramoArmas;
  const derTramo = despues || tramoArmas;

  const y = map.tileCenter(0, 4).y;
  /**
   * ARRANCA EN UN PUNTO CUALQUIERA DE SU VUELTA, PARA UN LADO CUALQUIERA.
   *
   * 🐛 Antes arrancaba SIEMPRE en el centro del vagón de armas y SIEMPRE hacia
   * adelante. Como nada más de su ronda es aleatorio, eso hacía que su vuelta
   * fuera idéntica en todos los asaltos: medido, estaba adentro del vagón en
   * los segundos 0-4, 26-36, 54-63 y 81-91, y dos asaltos distintos daban la
   * misma tira segundo por segundo. Y llegar al vagón de armas lleva 17,4 s
   * caminando derecho —más, peleando—, así que la llegada real caía siempre
   * sobre la misma ventana y el tipo estaba adentro SIEMPRE. La jugada del
   * vagón (esperar a que salga) no existía: no había nada que esperar.
   *
   * *(Santi, jugándolo: "habíamos decidido que el dinamitero no siempre estará
   * en su vagón, pero cada vez que hago un asalto lo encuentro ahí")*
   *
   * El comentario viejo decía que arrancar en el centro hacía que "la primera
   * vez que llegás esté ahí". No era cierto: a los 17 s ya había salido. Lo que
   * te lo ponía enfrente era su SEGUNDA pasada, o sea el ciclo, no el arranque.
   */
  const startX = rng.range(xIzq, xDer);
  // Hacia qué punta va. Si sale hacia el que tiene DETRÁS, camina la vuelta
  // entera para el otro lado: es lo que desfasa el ciclo de verdad.
  const haciaDerecha = rng.chance(0.5);
  return {
    path: [{ x: xIzq, y }, { x: xDer, y }],
    startX,
    pathIndex: haciaDerecha ? 1 : 0,
    facing: haciaDerecha ? FACINGS.right : FACINGS.left,
    y,
    x0: izqTramo.colStart * size + 6,
    x1: (derTramo.colStart + derTramo.cols) * size - 6,
  };
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
 * @param opciones     las CAPAS del tren (data/modifiers.js): `climaId`,
 *                     `estado` (lista), `comportamientos` (uno por vagón,
 *                     mismo orden que `composicion`) y `variantes` (qué tipos
 *                     de guardia pueden salir sorteados en este tren, ya
 *                     filtrados por recompensa y honor). Agrupadas en un objeto
 *                     y no como parámetros sueltos porque el plan de Santi
 *                     ("variedad de lo que pasa en los trenes") va a seguir
 *                     sumando capas nuevas acá — mejor un solo lugar que
 *                     crece, que una firma con quince posicionales.
 */
export function buildTrain(
  rng, caballoEn = 1, composicion = null, dificultadId = null, weaponId = undefined,
  tipoTrenId = null, meleeId = undefined, opciones = {}
) {
  const {
    climaId = null, estado = [], comportamientos = [], variantes = [],
    encubiertos = [], paquetes = [], cajaOculta = false,
  } = opciones;
  const tipoTren = TRAIN_TYPES[tipoTrenId] || TRAIN_TYPES[TIPO_TREN_POR_DEFECTO];
  composicion = composicion || sortearComposicion(rng, tipoTren);
  const dificultad = DIFICULTADES[dificultadId] || DIFICULTADES[DIFICULTAD_POR_DEFECTO];
  const clima = CLIMA[climaId] || CLIMA[CLIMA_POR_DEFECTO];
  const redada = estado.includes('redada');

  // El perfil de IA de CADA guardia de este tren. Por defecto es una copia
  // llana de CONFIG.enemy; una dificultad "dura" le suma sus overrides, una
  // redada le suma lo mismo por otra puerta, y un tren "veloz" además apura
  // la sospecha (sospechaMult) — las tres se combinan si coinciden. El clima
  // NO entra acá: ver la nota completa en `construirPerfilIA`.
  const perfilIA = construirPerfilIA(dificultad, tipoTren, estado);

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
  const doors = [];
  for (const t of tramos) {
    if (t.tipo !== 'vagon') continue;
    /**
     * 🐛 SE BUSCABA EL VAGÓN POR ID (`w.id === 'blindado'`), ASÍ QUE EL
     * BLINDADO CORTO DEL TREN VELOZ NUNCA TUVO PUERTAS DE CHAPA: eran de
     * madera y se abrían empujando, o sea que en ese tren al blindado se
     * entraba caminando. Nadie lo vio porque el veloz quedó en reserva antes
     * de que alguien probara esa puerta.
     *
     * Ahora lo dice la plantilla (`puertasBlindadas`), que es la misma marca
     * que usa la ronda del Dinamitero para saber dónde no puede entrar.
     */
    const esBlindado = !!t.plantilla.puertasBlindadas;

    const bordes = [
      { col: t.colStart, insideDir: 1 },              // la puerta de entrada
      { col: t.colStart + t.cols - 1, insideDir: -1 }, // la de salida
    ];
    for (const borde of bordes) {
      const centro = map.tileCenter(borde.col, 4);
      const pos = { x: centro.x, y: centro.y + map.size / 2 };
      const puerta = createDoor(pos.x, pos.y, {
        kind: esBlindado ? 'blindada' : 'normal',
        insideDir: borde.insideDir,
      });

      /**
       * VAGONES QUE VIAJAN CERRADOS CON LLAVE (`puertasTrabadas` en la
       * plantilla). Hoy: el almacén del tren de carga.
       *
       * *(Santi: "eliminar el vagón blindado del tren de carga y que las dos
       * puertas del almacén no sean blindadas, pero que estén cerradas")*
       *
       * NO ES UNA PUERTA BLINDADA Y ESA ES TODA LA GRACIA. La de chapa frena
       * las balas y sólo la abre la dinamita; ésta es madera: se rompe a tiros
       * como cualquier otra, y **eso hace ruido**. El precio de las dos cajas
       * fuertes del almacén dejó de ser "matar a los guardias que las cuidan"
       * (que en un tren de carga son pocos) y pasó a ser el precio de siempre
       * de este juego: **tiempo y exposición**. No podés entrar callado.
       *
       * REUSA ENTERO EL MECANISMO DE `puertaBloqueada` (ver más abajo), con
       * `true` = trabada de origen: nadie la trabó durante el asalto, viajaba
       * así. La diferencia es que aquélla es un sorteo del tren y ésta es una
       * propiedad del vagón.
       */
      /**
       * QUEDA CERRADO DE VERDAD: los cuatro guardias del almacén no pueden
       * salir, y nadie de afuera puede entrar a ayudarlos.
       *
       * Se probó darle una llave a toda la tripulación —por miedo a que un
       * vagón cerrado partiera el tren en dos— y **se descartó midiendo**: con
       * el almacén abierto el refuerzo más cercano llegó a 2.353 px del
       * jugador y trabado a 2.423, o sea 70 px de diferencia en 200 s. No lo
       * parte. Los guardias de adelante no vienen a buscarte desde que existe
       * la alarma, y los refuerzos de la locomotora ya tardaban eso.
       *
       * Y sellado es MEJOR para lo que este vagón tiene que ser: romper la
       * puerta te deja de una con los cuatro adentro, esperándote.
       */
      if (t.plantilla.puertasTrabadas) trabarPuerta(puerta, true);

      doors.push(puerta);
    }
  }

  /**
   * --- 3 ter. PUERTA(S) BLOQUEADA(S) — Fase 4, ver data/modifiers.js ---
   *
   * Una o más puertas de madera nacen trabadas. Reusa entero el mecanismo del
   * Cazarrecompensas (`trabarPuerta`): sigue siendo madera, la rompen las
   * mismas balas de siempre y se dibuja con la misma tranca roja. Lo único
   * distinto es que ya estaba así cuando subiste.
   *
   * AL AZAR EN CUÁL Y EN CUÁNTAS (pedido de Santi). Las candidatas son TODAS
   * las de madera del tren, sin distinguir vagón — si fuera siempre la del
   * correo se volvería una regla que se aprende, y esta fase entera existe
   * para que no se pueda saber de antemano qué te vas a encontrar.
   *
   * La blindada queda afuera: ya tiene su propia llave (la dinamita), y una
   * puerta que sólo se abre con explosivos no se puede trabar "más".
   */
  if (estado.includes('puertaBloqueada')) {
    const candidatas = doors.filter((d) => d.kind !== 'blindada');
    let cuantas = Math.min(sortearCuantasPuertasTrabadas(rng), candidatas.length);
    while (cuantas > 0) {
      const elegida = rng.pick(candidatas);
      candidatas.splice(candidatas.indexOf(elegida), 1);
      // `true` = trabada DE ORIGEN: matar al Cazarrecompensas no la abre (ver
      // `destrabarPuerta`, entities/door.js). Él no la trabó.
      trabarPuerta(elegida, true);
      cuantas--;
    }
  }

  // --- 4. Entidades, con las coordenadas ya corridas al lugar del tren ---
  const enemies = [];
  const passengers = [];
  const loot = [];
  const tranqueras = [];
  const cajones = [];
  const avisos = [];

  /**
   * ¿ESTE TREN LLEVA PÓLVORA REPARTIDA? Es la llave del sistema entero: sin
   * vagón de armas, ni un barril fuera de él — el tren es exactamente el de
   * siempre. Se pregunta por los TRAMOS ya sorteados y no por `composicion`,
   * porque las sustituciones (ganado → armas) ya se aplicaron acá.
   */
  const hayVagonDeArmas = tramos.some(
    (t) => t.tipo === 'vagon' && t.plantilla.id === 'armas');

  for (const t of tramos) {
    if (t.tipo !== 'vagon') continue;
    const p = t.plantilla;
    const off = t.colStart;
    const enTiles = ([c, r]) => map.tileCenter(c + off, r);

    // El tipo lo fija el vagón (el blindado viaja con guardias blindados) y se
    // puede pisar guardia por guardia si alguna vez hace falta.
    const tipoDelVagon = p.guardType || DEFAULT_GUARD_TYPE;

    /**
     * REDADA: duplica cada patrulla del vagón. El blindado queda afuera —
     * ver la nota completa en data/modifiers.js — así que esto sólo mira
     * `p.enemies` de un vagón común.
     *
     * La copia lleva `redadaExtra: true`, que más abajo decide desde dónde
     * arranca: no en el mismo punto que el original (se pisarían y
     * patrullarían pegados todo el asalto), sino desde la MITAD de su
     * propio recorrido, así los dos quedan desfasados de entrada.
     */
    const defsBase = p.enemies || [];
    const defs = (redada && tipoDelVagon !== 'blindado')
      ? defsBase.flatMap((def) => [def, { ...def, redadaExtra: true }])
      : defsBase;

    /**
     * COMPORTAMIENTO DE ESTE VAGÓN — Fase 3 del plan, ver data/modifiers.js.
     * `comportamientos[t.wagon - 1]` porque `comportamientos` es paralelo a
     * `composicion`, que arranca en el vagón 1 (índice 0).
     */
    const comportamiento = comportamientos[t.wagon - 1] || 'normal';

    // La puerta de entrada de ESTE vagón (lado cola) — mismo cálculo que ya
    // usa `puertaDeEntradaDe` en systems/ai.js para "alertaEnPuerta", así que
    // un guardia "vigilandoPuerta" nace exactamente donde ese sistema ya
    // sabe mandar a un guardia alertado.
    const puertaX = t.colStart * map.size + 10;
    const puertaY = enTiles([0, 4]).y;

    // La caja fuerte de este vagón, si tiene una (ver `elegibleCaja` en
    // mapScene.js — sin ella, `vigilandoCaja` ni sale sorteado acá).
    const caja = (p.loot || []).find((l) => l.type === 'strongbox');

    defs.forEach((def, idx) => {
      const path = (def.path || []).map(enTiles);
      const arranqueIndex = (def.redadaExtra && path.length > 1) ? Math.floor(path.length / 2) : 0;
      let pathFinal = path;
      let pathIndexFinal = arranqueIndex;
      let start = path[arranqueIndex] || enTiles([def.col ?? 4, def.row ?? 4]);
      let esConversando = false;
      let esVigilando = false;
      let facingFinal = FACINGS[def.facing] ?? Math.PI;

      if (comportamiento === 'vigilandoPuerta' && idx === 0) {
        /**
         * 🐛 ANTES TODOS los guardias del vagón se plantaban en la misma
         * puerta — Santi, jugándolo mentalmente: "no pueden haber varios
         * guardias cuidando una misma puerta [...] el/los que sobra/n que
         * hagan otra cosa". Ahora SÓLO EL PRIMERO (`idx === 0`) se planta,
         * `path: []`, mismo patrón "centinela" que ya usa el 4to guardia
         * del blindado. El resto (si el vagón tiene más de una patrulla)
         * ni entra a este `if`, así que cae al camino de siempre y sigue
         * su ronda normal — "otra cosa" es, para este primer paso, lo que
         * ya hacía antes de que existiera este comportamiento.
         */
        pathFinal = [];
        pathIndexFinal = 0;
        start = { x: puertaX, y: puertaY };
        /**
         * 🐛 MIRABA PARA CUALQUIER LADO. Heredaba la `facing` de su
         * patrulla original, que no tiene por qué apuntar hacia la puerta
         * una vez reposicionado acá — podía terminar de espaldas a lo que
         * se supone que vigila. `FACINGS.left`: la puerta de entrada está
         * del lado de la cola (menor x), así que mirar "para la izquierda"
         * es mirar hacia la pasarela por donde entra cualquiera.
         */
        facingFinal = FACINGS.left;
        esVigilando = true;
      } else if (comportamiento === 'conversando' && idx < 2) {
        // Sólo los DOS primeros — si el vagón tiene una tercera patrulla
        // (el correo), esa sigue su ronda de siempre.
        pathFinal = [];
        pathIndexFinal = 0;
        const base = (defsBase[0].path && defsBase[0].path.length)
          ? enTiles(defsBase[0].path[0])
          : enTiles([defsBase[0].col ?? 4, defsBase[0].row ?? 4]);
        /**
         * 🐛 SE EMPUJABAN TODO EL TIEMPO. Nacían a 9px, y el mínimo que el
         * juego permite entre dos guardias es `CONFIG.enemy.separation` (13):
         * arrancaban pisándose y quedaban clavados JUSTO en el límite donde
         * `separateEnemies` se enciende y se apaga.
         *
         * *(Santi, jugándolo: "hay veces que dos guardias parecen que están
         * hablando entre ellos, pero en realidad uno de esos guardias empuja
         * al otro o no sé qué pasa, pero es un bug")* — tenía razón, y era
         * peor de lo que se veía: medido en calma, cada uno recorría **94px
         * en 10 segundos** sin ir a ningún lado. Vibraban en el lugar.
         *
         * Ahora nacen a `separation + 5`, cómodamente afuera del radio de
         * empuje, y el número sale de CONFIG en vez de estar escrito a mano:
         * si algún día se toca `separation`, esto se acomoda solo en vez de
         * volver a desincronizarse en silencio.
         */
        const aire = CONFIG.enemy.separation + 5;
        start = { x: base.x + idx * aire, y: base.y };
        /**
         * 🐛 NO SE MIRABAN — Santi, jugando: "no parece que en realidad
         * conversan [...] no se están mirando de frente [...] es como si en
         * realidad estuvieran bugueados". Tenía razón: heredaban la
         * `facing` de sus patrullas originales, casi nunca de cara al otro.
         *
         * Los dos están alineados en x (`idx * 9` arriba): el de la
         * izquierda (`idx === 0`) mira a la derecha, el de la derecha mira
         * a la izquierda — enfrentados, siempre, sea cual sea su patrulla
         * de origen.
         */
        facingFinal = idx === 0 ? FACINGS.right : FACINGS.left;
        esConversando = true;
      } else if (comportamiento === 'vigilandoCaja' && idx === 0 && caja) {
        /**
         * VIGILANDO LA CAJA FUERTE — Santi: "recuerda que también hay un
         * tipo de estado que vigila una caja fuerte" (estaba en el diseño
         * original de esta fase: "vigilando lo que haya que vigilar ahí").
         *
         * Mismo patrón que vigilandoPuerta: sólo EL PRIMERO se planta
         * (`idx === 0`); el resto, si el vagón tiene más de una patrulla,
         * sigue su ronda de siempre. Se para al lado de la caja —no
         * ENCIMA, para no taparla ni estorbar el gesto de abrirla— y la
         * mira de frente.
         */
        const cajaPos = enTiles([caja.col, caja.row]);
        pathFinal = [];
        pathIndexFinal = 0;
        start = { x: cajaPos.x - 18, y: cajaPos.y };
        facingFinal = FACINGS.right;
        esVigilando = true;
      }

      /**
       * ¿ESTE GUARDIA ES UNA VARIANTE? — Fase 4, ver VARIANTES_GUARDIA en
       * data/modifiers.js. Se juega por guardia (dos del mismo vagón pueden
       * salir distintos), y sólo para los COMUNES: el blindado y cualquiera
       * que traiga su tipo escrito en los datos del vagón (el Sheriff) quedan
       * afuera, igual que quedan afuera de redada y de los comportamientos.
       *
       * `variantes` ya viene filtrada por recompensa y honor desde
       * `mapScene.js` — este archivo no sabe nada de `gameState`.
       *
       * Y UN VAGÓN PUEDE CERRARLE LA PUERTA A TODAS (`sinVariantes`, hoy el de
       * armas): ahí adentro un Dinamitero volaría los cajones en su primer
       * ataque y el vagón dejaría de tener juego. Ver la nota completa en
       * data/wagons.js.
       */
      const esComun = !def.guardType && !p.sinVariantes
        && tipoDelVagon === DEFAULT_GUARD_TYPE;
      const tipo = (esComun && sortearVarianteGuardia(rng, variantes))
        || def.guardType || tipoDelVagon;

      /**
       * Y SI LA VARIANTE PELEA DISTINTO, SU PERFIL DE IA ES OTRO.
       *
       * Hasta acá todos los guardias del tren compartían `perfilIA` — el
       * mismo objeto, por referencia. Un tipo con overrides propios
       * (`GUARD_TYPES[tipo].ai`, hoy sólo el Pistolero) necesita el suyo:
       * `perfilIA` con lo suyo encima. Los demás siguen compartiendo el de
       * siempre, sin copias al pedo.
       */
      const overridesDelTipo = (GUARD_TYPES[tipo] || {}).ai;
      const guard = createEnemy(start.x, start.y, {
        path: pathFinal,
        facing: facingFinal,
        // `def.dynamite` a secas (no `|| 0`): si el vagón no dice nada, decide
        // el TIPO — así el Dinamitero trae la suya sin que el vagón sepa nada
        // de él. Ver `createEnemy` en entities/enemy.js.
        dynamite: def.dynamite,
        type: tipo,
        health: guardHealth(tipo, dificultad.vidaExtra),
        ai: overridesDelTipo ? { ...perfilIA, ...overridesDelTipo } : perfilIA,
      });
      if (pathIndexFinal > 0) guard.pathIndex = pathIndexFinal;

      /**
       * SU PUESTO — el lugar al que vuelve si algo lo corre de ahí (ver
       * `volverAlPuesto`, systems/ai.js). Sólo lo tienen los que están
       * plantados por un comportamiento: sin ronda no había nada que los
       * devolviera, y el compañero que patrulla los iba empujando por el
       * pasillo hasta dejarlos a medio vagón de distancia.
       *
       * Guarda también hacia dónde miraban: un guardia que vuelve a su puesto
       * pero mirando para otro lado seguiría sin estar "en su puesto" — el que
       * conversa tiene que volver a mirar a su compañero, y el que vigila una
       * puerta, a la puerta.
       */
      if (pathFinal.length === 0) {
        guard.puesto = { x: start.x, y: start.y };
        guard.facingPuesto = facingFinal;
      }
      /**
       * DISTRAÍDOS ENTRE SÍ. `systems/ai.js` (`updateSuspicion`) multiplica
       * cuánto sospechan MIENTRAS `e.state === 'patrol'` si ven esto puesto
       * — no hace falta apagarlo al salir de `patrol`, ese chequeo ya lo
       * hace por sí solo.
       *
       * Y sólo el primero de los dos (`idx === 0`) es `charlaLider`: el que
       * de verdad muestra el texto sobre la cabeza (`actualizarCharla`,
       * systems/ai.js). El otro también está distraído, pero no habla — así
       * no titilan dos frases pegadas.
       */
      if (esConversando) {
        guard.conversando = true;
        guard.charlaLider = idx === 0;
        if (guard.charlaLider) guard.charlaTimer = rng.range(0.8, 2.2);
        /**
         * Y SE CONOCEN ENTRE ELLOS (`companeroCharla`, los dos apuntándose
         * mutuamente).
         *
         * *(pedido de Santi, jugándolo: "cuando los guardias están hablando y
         * uno se pone en amarillo, después de un segundo, el otro también se
         * tiene que poner en amarillo")* — y es lo que uno esperaría: si el
         * tipo con el que estás hablando corta la charla y se queda mirando
         * el pasillo, mirás para donde mira. Ver `contagiarCharla` en
         * systems/ai.js.
         *
         * Hasta ahora `conversando` era una marca suelta en cada uno: los dos
         * estaban distraídos, pero ninguno sabía con quién. Sin esta
         * referencia no había forma de avisarle al otro.
         */
        if (idx === 1) {
          const primero = enemies[enemies.length - 1];
          if (primero && primero.conversando) {
            guard.companeroCharla = primero;
            primero.companeroCharla = guard;
          }
        }
      }
      /**
       * VIGILANDO — a diferencia de `conversando`, esto no usa ningún reloj:
       * `drawEnemy` (entities/enemy.js) dibuja el estado "VIGILANDO" fijo,
       * todo el tiempo que `e.state === 'patrol'`, leyendo sólo esta marca.
       * Es la señal que le faltaba a este comportamiento — antes no había
       * forma de distinguirlo de un guardia cualquiera parado en su ronda.
       */
      if (esVigilando) guard.vigilaLider = true;
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
    });

    /**
     * ¿UNO DE LOS PASAJEROS DE ESTE VAGÓN NO ES UN PASAJERO? (Fase 4, ver
     * data/modifiers.js). El sorteo de SI el vagón lleva uno ya vino hecho
     * desde `mapScene.js` (`encubiertos`, paralelo a `composicion`); acá sólo
     * se decide CUÁL de ellos es, y eso tiene que pasar en el momento de
     * armar el tren para que cambie en cada asalto.
     */
    const pasajerosDelVagon = [];
    for (const def of p.passengers || []) {
      const pos = enTiles([def.col, def.row]);
      const pa = createPassenger(pos.x, pos.y, FACINGS[def.facing] ?? Math.PI);
      pa.wagon = t.wagon;
      passengers.push(pa);
      pasajerosDelVagon.push(pa);
      revisar(avisos, map, pos, `pasajero del ${p.name} (vagón ${t.wagon})`);
    }
    if (encubiertos[t.wagon - 1] && pasajerosDelVagon.length) {
      rng.pick(pasajerosDelVagon).encubierto = true;
    }

    /**
     * --- EL PAQUETE DE ESTE VAGÓN (Fase 5, ver data/paquetes.js) ---
     *
     * Un objetivo valioso metido en un vagón cualquiera, con su custodia. El
     * sorteo de CUÁL vino hecho desde `mapScene.js` (array paralelo a
     * `composicion`); acá se arma.
     *
     * Va DESPUÉS de los pasajeros porque los dos paquetes de hoy necesitan
     * uno: el rico ES un pasajero, y la caja oculta necesita quién la delate.
     * Y ANTES del botín normal del vagón, para que la caja escondida entre en
     * la misma lista `loot` que todo lo demás.
     */
    const paquete = PAQUETES[paquetes[t.wagon - 1]];
    if (paquete && pasajerosDelVagon.length) {
      const elegido = rng.pick(pasajerosDelVagon);

      /**
       * LOS PUNTOS DEL PASILLO de este vagón: el barrido que ya recorre un
       * guardia buscándote (`sweep`). Están verificados como pisables en
       * todos los vagones, así que sirven de "lugares donde una persona puede
       * estar parada" sin tener que inventar nada nuevo ni leer el tilemap.
       */
      const pasillo = (p.sweep || barridoDe(t.cols)).map(enTiles);

      if (paquete.id === 'pasajeroRico') {
        elegido.botin = { min: paquete.botinMin, max: paquete.botinMax };
        elegido.robTime = paquete.robTime;
      }

      /**
       * LOS GUARDAESPALDAS. Guardias de más, plantados (`path: []`, el mismo
       * patrón "centinela" que ya usan el cuarto del blindado y el que vigila
       * una puerta) al lado de lo que cuidan, mirando hacia el pasillo.
       *
       * Son la PISTA del paquete: un guardia parado al lado de un pasajero,
       * en un vagón de pasajeros, es raro de ver. El que mira antes de entrar
       * tiene cómo darse cuenta de que ahí hay algo.
       */
      const cuida = elegido;

      /**
       * DÓNDE SE PARA: en el PASILLO, pegado a lo que cuida.
       *
       * 🐛 DOS INTENTOS FALLIDOS ANTES DE ÉSTE, los dos encontrados midiendo:
       *  1. A 16px al costado del pasajero — pero los pasajeros viajan
       *     SENTADOS, así que ese costado es la butaca de al lado: 25 avisos
       *     de "colocado sobre un tile sólido" en 50 trenes. El mismo error
       *     que ya se había cometido con el civil encubierto al revelarse.
       *  2. En el punto del barrido (`sweep`) más cercano — ya nunca sólido,
       *     pero el barrido tiene POCOS puntos y muy separados: el
       *     guardaespaldas terminaba **hasta a 256px** de lo que cuidaba
       *     (62px de promedio). A esa distancia no custodia nada y, sobre
       *     todo, deja de ser la PISTA de que ahí hay algo.
       *
       * Ahora se busca a la altura del objetivo, en las dos filas del pasillo
       * (4 y 5), corriéndose de a poco hasta encontrar lugar. Es lo que uno
       * esperaría además: el que cuida a alguien no se sienta a su lado, se
       * queda parado en el pasillo, al lado del asiento.
       */
      const filaPasillo = enTiles([0, 4]).y;
      const puestoPara = (i) => {
        const base = 12 + i * 14;
        for (const dx of [base, -base, base + 10, -(base + 10)]) {
          for (const y of [filaPasillo, filaPasillo + map.size]) {
            const x = cuida.x + dx;
            if (!map.isSolidAt(x, y)) return { x, y };
          }
        }
        return null;
      };
      for (let i = 0; i < (paquete.guardaespaldas || 0); i++) {
        const puesto = puestoPara(i);
        if (!puesto) continue;
        const mira = puesto.x > cuida.x ? FACINGS.left : FACINGS.right;
        const guarda = createEnemy(puesto.x, puesto.y, {
          path: [],
          facing: mira,
          type: tipoDelVagon,
          health: guardHealth(tipoDelVagon, dificultad.vidaExtra),
          ai: perfilIA,
        });
        guarda.wagon = t.wagon;
        guarda.homePath = [];
        /**
         * "VIGILANDO" arriba de la cabeza — el mismo cartel que ya llevan los
         * que cuidan una puerta o una caja fuerte (Fase 3, `vigilaLider`).
         *
         * Mirando una captura del vagón en frío se vio que sin esto la pista
         * no existía: un guardaespaldas quieto en el pasillo, al lado de un
         * pasajero, se lee igual que cualquier otro guardia — la diferencia
         * (que no patrulla) sólo se nota mirándolo un rato largo. Con el
         * cartel, el vagón te dice "acá hay algo que cuidar" de un vistazo,
         * y sigue sin decirte QUÉ: eso lo tenés que ver vos.
         *
         * No hizo falta inventar una señal nueva: ya existía la palabra
         * exacta para esto.
         */
        guarda.vigilaLider = true;
        enemies.push(guarda);
        wagons[t.wagon].guardiasVivos++;
        revisar(avisos, map, guarda, `guardaespaldas del ${p.name} (vagón ${t.wagon})`);
      }
    }

    for (const def of p.loot || []) {
      const pos = enTiles([def.col, def.row]);
      const l = createLootable(pos.x, pos.y, def.type, rng);
      l.wagon = t.wagon;
      loot.push(l);
      revisar(avisos, map, pos, `botín del ${p.name} (vagón ${t.wagon})`);
    }

    /**
     * LOS BARRILES DE PÓLVORA — y son DOS reglas distintas, no una.
     *
     * 1. `p.cajones` depende sólo del VAGÓN: un vagón de armas lleva pólvora
     *    en cualquier tren que lo lleve a él. Es lo que el vagón ES.
     *
     * 2. `p.cajonesExtra` depende del TREN: los demás vagones sólo llevan
     *    pólvora **si en la composición hay un vagón de armas**. Es el mismo
     *    patrón que las tranqueras del ganado, que sólo existen en el tren de
     *    carga.
     *
     * *(Santi: "cuando hay un vagón de armas en el tren, no sólo ahí dentro
     * habrían barriles de dinamita, sino que afectaría a todo el tren [...]
     * puede haber en todos menos en el de pasajeros")*
     *
     * EL VAGÓN DE PASAJEROS QUEDA AFUERA SIN NINGÚN `if` CON SU NOMBRE: no
     * tiene `cajonesExtra` y listo. Cualquier vagón futuro entra o no entra
     * según si le escribís candidatas, igual que `sinVariantes`.
     *
     * Y SON CANDIDATAS, NO UNA LISTA FIJA: se sortean una o dos por vagón, así
     * que dos asaltos al mismo tipo de vagón no tienen la pólvora en el mismo
     * lugar. Es lo único de este sistema que cambia entre asalto y asalto.
     */
    const defsCajones = [...(p.cajones || [])];
    if (hayVagonDeArmas && p.cajonesExtra) {
      const candidatas = [...p.cajonesExtra];
      const cuantas = Math.min(candidatas.length, rng.int(1, 2));
      for (let i = 0; i < cuantas; i++) {
        defsCajones.push(candidatas.splice(rng.int(0, candidatas.length - 1), 1)[0]);
      }
    }

    for (const def of defsCajones) {
      const pos = enTiles([def.col, def.row]);
      /**
       * ¿TRAE UN CARTUCHO PARA LLEVARSE? Se juega barril por barril (ver
       * `chanceCartucho` en data/explosives.js). Todos explotan igual: esto
       * decide sólo si además te da algo.
       */
      const cj = createCajon(pos.x, pos.y,
        rng.chance(EXPLOSIVES.cajonPolvora.chanceCartucho));
      cj.wagon = t.wagon;
      cajones.push(cj);
      revisar(avisos, map, pos, `barril de pólvora del ${p.name} (vagón ${t.wagon})`);
    }

    // Y que ninguno le tape la ronda a un guardia de este vagón. Se revisa la
    // plantilla entera una sola vez, y sólo si de verdad le tocaron cajones.
    if (defsCajones.length) revisarRondas(avisos, p, `${p.name} (vagón ${t.wagon})`);

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

  /**
   * --- EL DINAMITERO QUE DA VUELTAS (Fase 6a) ---
   *
   * *(Santi: "haría que los tres guardias sean normales y haya un Dinamitero
   * dando vuelta por los vagones vecinos al de armas [...] una estrategia
   * sería esperar a que el dinamitero salga del vagón de armas")*
   *
   * ES LA PIEZA QUE HACE JUGABLE AL VAGÓN. La idea original era prender la
   * variante `dinamitero` (data/modifiers.js) y que le tocara a cualquiera;
   * el problema, visto antes de construir nada, es que un dinamitero PLANTADO
   * adentro vuela los tres cajones en su primer ataque, siempre. El peligro
   * sería total y constante, o sea ninguna decisión.
   *
   * Deambulando, en cambio, el peligro tiene POSICIÓN — y una posición se
   * puede mirar, cronometrar y aprovechar. Es lo primero del juego que se
   * resuelve esperando.
   *
   * UNO SOLO, Y SÓLO EN LOS TRENES QUE TRAEN EL VAGÓN. La variante suelta
   * sigue en 0 (ver VARIANTES_GUARDIA): si además hubiera dinamiteros al azar
   * por todo el tren, mirar dónde está éste dejaría de servir para nada.
   */
  const tramoArmas = tramos.find((t) => t.tipo === 'vagon' && t.plantilla.id === 'armas');
  if (tramoArmas) {
    const ronda = rondaDinamitero(rng, tramoArmas, tramos, map);
    const guard = createEnemy(ronda.startX, ronda.y, {
      path: ronda.path,
      facing: ronda.facing,
      type: 'dinamitero',
      health: guardHealth('dinamitero', dificultad.vidaExtra),
      /**
       * CAMINA A `enemy.speed` (46) Y NO A `patrolSpeed` (24), y es el único
       * número propio que tiene. No es que sea más rápido: es que su ronda es
       * de tres vagones y no de uno. A 24 px/s una vuelta completa le llevaría
       * 93 s de un asalto de ~120 reales — se leería como un tipo quieto, y
       * "esperar a que salga" sería esperar el asalto entero. A 46 la vuelta
       * son 49 s: pasa 21 s adentro del vagón de armas y 28 afuera, así que
       * en un solo asalto le ves el ritmo dos veces y media.
       *
       * El mismo patrón que ya usa la escolta del Sheriff, que también tiene
       * su `patrolSpeed` propio por tener que cubrir más terreno.
       */
      ai: { ...perfilIA, patrolSpeed: CONFIG.enemy.speed },
    });
    guard.pathIndex = ronda.pathIndex;
    /**
     * NO SALE DE ESOS TRES VAGONES, ni persiguiéndote. Es la misma regla que
     * ya tienen los del blindado (`confinado`, aplicada al final de cada
     * cuadro por `confinar` en systems/ai.js) y por un motivo parecido: éste
     * no es escolta del tren, es el tipo asignado a la pólvora. Si te
     * escapás tres vagones, deja de ser tu problema — y el vagón de armas
     * sigue siendo un LUGAR peligroso en vez de convertirse en un perseguidor
     * más.
     *
     * El confinamiento es más ancho que la ronda a propósito: patrulla de
     * mitad a mitad de los vecinos, pero peleando puede llegar hasta las
     * puntas de esos vagones. Así el límite cae siempre sobre un borde que se
     * ve (una pared, una puerta) y no sobre una línea invisible en el medio
     * de un pasillo.
     */
    guard.confinado = { x0: ronda.x0, x1: ronda.x1 };
    /**
     * `rondaLarga`: dos cosas que ningún otro guardia necesita.
     *  1. No se lo puede congelar por lejanía (ver `updateEnemies` en
     *     scenes/raidScene.js). Si se congelara, lo dejarías adentro del
     *     vagón, te irías a esperar afuera y seguiría adentro para siempre:
     *     la jugada entera se rompe.
     *  2. Si algo le corta el paso —una puerta trabada del sorteo, por
     *     ejemplo— se da vuelta en vez de quedarse empujando (ver `doPatrol`
     *     en systems/ai.js). Su ronda cruza puertas, y las de este tren no
     *     siempre se abren.
     */
    guard.rondaLarga = true;
    /**
     * LA LLAVE DEL TREN. Es guardia de a bordo: una puerta trabada del sorteo
     * (`puertaBloqueada`) no lo frena, la abre y sigue. Sin esto, una traba
     * que cayera sobre su recorrido lo dejaba rebotando adentro del vagón de
     * armas — 52% del tiempo adentro con una puerta, 70% con dos, contra el
     * 36% normal — y la jugada de esperar a que salga no existía.
     *
     * ABRIRLA NO LA DESTRABA: se cierra detrás suyo y sigue trabada para vos
     * (ver `updateDoor` en entities/door.js). Lo que te deja es la ventana de
     * 1,6 s del vaivén de siempre, si lo venías siguiendo.
     */
    guard.tieneLlave = true;
    /**
     * SU VAGÓN, PARA LA ALARMA, es el de armas — aunque en este momento esté
     * caminando por otro. Es una aproximación y se sabe: el alcance del ruido
     * se cuenta en vagones (`e.wagon`), así que mientras esté en un vecino la
     * cuenta se corre uno. Es el mismo vagón al que se le suma su vida, para
     * que el cartel de "vagón limpio" no mienta mientras él siga dando
     * vueltas por ahí.
     */
    guard.wagon = tramoArmas.wagon;
    guard.homePath = guard.path;
    enemies.push(guard);
    wagons[tramoArmas.wagon].guardiasVivos++;
    revisar(avisos, map, guard, 'el Dinamitero del vagón de armas');
  }

  /**
   * --- LA CAJA FUERTE OCULTA (Fase 5, segunda vuelta) ---
   *
   * *(Santi: "puede estar en cualquier vagón. Hay tres civiles por tren que
   * pueden revelarte la información de dónde está. Esos tres civiles no sí o
   * sí tienen que estar en el mismo vagón que la caja fuerte")*
   *
   * Se decide acá y no en el bucle de vagones porque es DEL TREN: primero se
   * elige en qué vagón se esconde, después dónde adentro de ese vagón, y
   * recién al final quiénes lo saben — que pueden viajar en cualquier otro.
   *
   * DÓNDE EXACTAMENTE: un tile pisable que esté pegado (arriba o abajo) al
   * mueble que nombra el escondite — la ventanilla, el asiento, la mesa, el
   * corral. Así lo que dice el pasajero y lo que ves al llegar son la misma
   * cosa. Va PEGADA y no ADENTRO del mueble por un motivo práctico: adentro
   * no habría forma de alcanzarla.
   */
  if (cajaOculta && passengers.length) {
    const posibles = tramos.filter((t) => t.tipo === 'vagon' && ESCONDITES[t.plantilla.id]);
    if (posibles.length) {
      const tramo = rng.pick(posibles);
      const plant = tramo.plantilla;
      const escondite = rng.pick(ESCONDITES[plant.id]);
      const mueble = TILE_DE_ESCONDITE[escondite];

      /**
       * 🐛 Y TIENE QUE PODER LLEGARSE CAMINANDO. No alcanza con que el tile
       * sea pisable y tenga el mueble al lado.
       *
       * *(Santi, jugándolo: "un civil me dijo que la caja oculta estaba junto
       * al corral del vagón 2. Fui al vagón de ganado y lo revisé y no
       * encontré ninguna caja")* — y tenía razón: la caja estaba ahí, pero
       * ENCERRADA. Los corrales del vagón de ganado son bloques huecos:
       *
       *     #..CCCCC..CCCCC..CCCCC.#
       *     #..C...C..C...C..C...C.#     ← suelo libre, rodeado de corral
       *     #..CCCCC..CCCCC..CCCCC.#
       *
       * El interior (donde viajan las reses) es suelo, y tiene 'C' arriba y
       * abajo, así que pasaba el filtro de "pegado al mueble" perfectamente.
       * Medido: **22 de 48 cajas que cayeron en el ganado quedaban
       * inalcanzables** — casi la mitad. En los demás vagones, ninguna: por
       * eso sólo aparecía ahí.
       *
       * `alcanzables` es un relleno por inundación que arranca en el PASILLO
       * (las filas 4 y 5, por donde se camina) y se expande por todo lo que
       * sea suelo. Un escondite sólo vale si el relleno llegó hasta él. Es
       * genérico: cualquier vagón futuro con un rincón cerrado queda cubierto
       * sin tener que acordarse de este caso.
       */
      const transitable = (ch) => ch === '.' || ch === '+' || ch === 'E';
      const alcanzables = new Set();
      const cola = [];
      for (const fila of [4, 5]) {
        for (let col = 0; col < plant.layout[fila].length; col++) {
          if (!transitable(plant.layout[fila][col])) continue;
          const k = col + ',' + fila;
          if (!alcanzables.has(k)) { alcanzables.add(k); cola.push([col, fila]); }
        }
      }
      while (cola.length) {
        const [col, row] = cola.pop();
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = col + dc, nr = row + dr;
          if (nr < 0 || nr >= plant.layout.length) continue;
          if (nc < 0 || nc >= plant.layout[nr].length) continue;
          const k = nc + ',' + nr;
          if (alcanzables.has(k) || !transitable(plant.layout[nr][nc])) continue;
          alcanzables.add(k); cola.push([nc, nr]);
        }
      }

      const puntos = [];
      for (let row = 1; row < plant.layout.length - 1; row++) {
        const fila = plant.layout[row];
        for (let col = 0; col < fila.length; col++) {
          if (fila[col] !== '.') continue;
          if (!alcanzables.has(col + ',' + row)) continue;
          if (plant.layout[row - 1][col] === mueble || plant.layout[row + 1][col] === mueble) {
            puntos.push({ col, row });
          }
        }
      }

      if (puntos.length) {
        const donde = rng.pick(puntos);
        const pos = map.tileCenter(donde.col + tramo.colStart, donde.row);
        const caja = createLootable(pos.x, pos.y, 'cajaOculta', rng);
        caja.wagon = tramo.wagon;
        caja.oculto = true;
        loot.push(caja);

        /**
         * LOS TRES QUE SABEN, elegidos entre TODOS los pasajeros del tren sin
         * mirar el vagón: los tres dicen lo mismo, y no hay nada que los
         * distinga de los otros diez. Se barajan y se toman los primeros —
         * si el tren tiene menos de tres pasajeros, saben los que haya.
         */
        const barajados = passengers.slice();
        for (let i = barajados.length - 1; i > 0; i--) {
          const j = rng.int(0, i);
          const tmp = barajados[i]; barajados[i] = barajados[j]; barajados[j] = tmp;
        }
        for (const pa of barajados.slice(0, CIVILES_QUE_SABEN)) {
          pa.sabeDeCaja = caja;
          pa.pistaCaja = { vagon: tramo.wagon, escondite };
        }
      }
    }
  }

  if (avisos.length) {
    console.warn('TREN: hay cosas mal colocadas:\n' + avisos.join('\n'));
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
  const player = createPlayer(entradaX, entrada.y, weaponId, meleeId);

  return {
    map,
    player,
    enemies,
    passengers,
    loot,
    doors,
    tranqueras,
    cajones,
    wagons,
    tramos,
    tipoPorColumna,
    plataformas,
    dificultad,
    tipoTren,
    clima,
    /**
     * EL PERFIL DE IA DE ESTE TREN, para el que nazca DESPUÉS de armarlo:
     * hoy, el civil encubierto al revelarse (ver `civilRevelado` en
     * scenes/raidScene.js). Sin esto tendría que pelear con `CONFIG.enemy` a
     * secas y sería el único del tren al que no le llegan la dificultad ni la
     * redada — un agujero silencioso justo en el guardia sorpresa.
     */
    perfilIA,
    raidDuration: tipoTren.raidDuration || CONFIG.raid.duration,
    ruidoExtra: tipoTren.ruidoExtra || 0,
    /**
     * CUÁNTO SE OYE EN ESTE TREN — un disparo (`hearRadius`) y tus propios
     * pasos (`hearStepRadius`). Por defecto son la constante de siempre
     * (`CONFIG.enemy.hearRadius/hearStepRadius`); una tormenta (data/
     * modifiers.js, `clima.hearMult`) los agranda. Mismo patrón que
     * `ruidoExtra`: quien hace ruido —el jugador, un guardia, el jefe, un
     * jinete— lee ESTO (`world.train.hearRadius`), no la constante a secas.
     */
    hearRadius: CONFIG.enemy.hearRadius * (clima.hearMult || 1),
    hearStepRadius: CONFIG.enemy.hearStepRadius * (clima.hearMult || 1),
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

/**
 * AVISA SI UN CAJÓN DE PÓLVORA LE TAPA LA RONDA A UN GUARDIA.
 *
 * Es hermano de `revisar`: el mismo tipo de error (poner algo donde no va) y la
 * misma respuesta (un aviso en la consola, no una excepción). Sale de un bug
 * real — un guardia del vagón de correo se pasaba el asalto empujando un barril
 * porque el barril estaba justo encima de un punto de su ronda (ver la nota de
 * `doPatrol` en systems/ai.js).
 *
 * EL GUARDIA YA NO SE TRABA —eso se arregló allá— pero **saltearse un waypoint
 * cada dos segundos y medio tampoco es la ronda que alguien dibujó**. Este
 * aviso es para que, cuando se escriba un vagón nuevo, el error se vea al
 * armar el tren en vez de descubrirse jugando meses después.
 *
 * CÓMO SE MIDE: el guardia camina en ejes y primero corrige X (ver
 * `moveAxisAligned`), así que entre dos puntos el recorrido real es el tramo
 * horizontal a la altura del punto de partida y después el vertical a la altura
 * del de llegada. Se cruza cada cajón contra esos dos tramos.
 */
function revisarRondas(avisos, plantilla, nombre) {
  const cajones = [...(plantilla.cajones || []), ...(plantilla.cajonesExtra || [])];
  if (!cajones.length) return;

  (plantilla.enemies || []).forEach((guardia, i) => {
    const ruta = guardia.path || [];
    for (let p = 0; p < ruta.length; p++) {
      const a = ruta[p], b = ruta[(p + 1) % ruta.length];
      for (const c of cajones) {
        const encimaDelPunto = a[0] === c.col && a[1] === c.row;
        const cruzaEnX = a[1] === c.row
          && c.col > Math.min(a[0], b[0]) && c.col < Math.max(a[0], b[0]);
        const cruzaEnY = b[0] === c.col
          && c.row > Math.min(a[1], b[1]) && c.row < Math.max(a[1], b[1]);
        if (!encimaDelPunto && !cruzaEnX && !cruzaEnY) continue;
        avisos.push(`  - ${nombre}: un cajón de pólvora (col ${c.col}, fila ${c.row}) `
          + (encimaDelPunto ? 'está ENCIMA de un punto' : 'cruza el tramo')
          + ` de la ronda del guardia ${i} (${a} -> ${b})`);
      }
    }
  });
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
 *
 * `vistaW`/`vistaH` — CUÁNTO MUNDO ENTRA EN LA PANTALLA, que no siempre es lo
 * mismo que el tamaño de la pantalla.
 *
 * 🐛 ANTES SE RECORTABA CON `r.width`/`r.height` A SECAS, y eso daba por
 * sentado en silencio que el dibujo va siempre a escala 1. Valía para el
 * asalto, y por eso nunca molestó — hasta que el galope estrenó zoom dinámico
 * (ver `zoomLejos` en data/horse.js): con la escena a 0,4 la pantalla muestra
 * 960 px de mundo, pero esta función seguía dibujando sólo los primeros 384 a
 * partir de `camX`. Como en el galope `camX` está bien detrás de la cola, esos
 * 384 px caían enteros en el vacío anterior al tren y **el tren no se dibujaba
 * nunca**.
 *
 * El síntoma era desconcertante: todas las mediciones daban al tren en la
 * posición correcta (la cola calculada en x=310 de pantalla) y aun así no se
 * veía. Sólo apareció mirando la escena ampliada con foto.ps1.
 *
 * Los parámetros son OPCIONALES y caen en el comportamiento de siempre, así que
 * el asalto —que dibuja a escala 1— no cambia en nada.
 */
export function drawTrain(r, train, colors, camX, camY, vistaW, vistaH) {
  const map = train.map;
  const size = map.size;
  const anchoVista = vistaW || r.width;
  const altoVista = vistaH || r.height;

  const colDesde = Math.max(0, Math.floor(camX / size) - 1);
  const colHasta = Math.min(map.cols - 1, Math.ceil((camX + anchoVista) / size) + 1);
  const filaDesde = Math.max(0, Math.floor(camY / size) - 1);
  const filaHasta = Math.min(map.rows - 1, Math.ceil((camY + altoVista) / size) + 1);

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
