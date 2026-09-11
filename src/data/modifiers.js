/**
 * LOS MODIFICADORES — capas que se sortean por separado, encima de tipo de
 * tren y dificultad, y a veces se combinan solas.
 *
 * FASE 1 del plan que Santi dejó ordenado ("variedad de lo que pasa en los
 * trenes"): esto es sólo la ARQUITECTURA — dos ejes independientes, cada uno
 * con su propia lógica de sorteo — con 1-2 modificadores reales enchufados
 * para probar que combinan bien antes de apilarles contenido encima.
 *
 *   CLIMA           — pick-one, mismo patrón que TIPO DE TREN o DIFICULTAD
 *                      (data/train.js, `sortearPorPeso`): un tren no puede
 *                      tener tormenta Y despejado a la vez.
 *   ESTADO DEL TREN — lista COMBINABLE: cada flag se tira por separado
 *                      (rng.chance), así que un mismo tren puede salir con
 *                      dos o más a la vez, o ninguno.
 *
 * Por qué son dos mecanismos distintos y no uno solo: el clima es del CIELO
 * — nunca hay "un poco de tormenta y un poco de despejado" — pero el estado
 * del tren es de LA GENTE arriba, y no hay motivo para que una alerta ya
 * sonando excluya una redada.
 *
 * Con `peso: 0` (clima) o `chance: 0` (estado), una entrada queda en el
 * catálogo sin salir nunca en el sorteo — la misma llave-no-amputación que ya
 * usa `dura` en data/train.js. Acá sólo se prueba `alertaActivada` (estado) y
 * `tormenta` (clima), uno de cada eje; `redada` (con guardias extra, Fase 2
 * del plan) y el resto quedan como llave apagada.
 */

import { sortearPorPeso } from './train.js';
import { CONFIG } from './config.js';

export const CLIMA = {
  despejado: {
    id: 'despejado',
    peso: 80,
  },

  /**
   * TORMENTA — un multiplicador sobre cuánto se oye, nada más.
   *
   * *(del plan de Fase 2: "un multiplicador sobre hearRadius/hearStepRadius,
   * nada más — la separé de 'noche' a propósito, es mucho más barata")*
   *
   * Se aplica en `buildTrain` (world/train.js): el alcance del oído es una
   * propiedad del RUIDO y vive en el tren, no en cada guardia.
   *
   * 🔻 IBA PARA EL LADO CONTRARIO. Era `1.4` —o sea que con tormenta te oían un
   * 40% MÁS LEJOS— desde la Fase 1, y nunca se escribió por qué. La única
   * entrada posterior de las notas arregló la cañería (el multiplicador no se
   * estaba aplicando en ningún lado), no la dirección.
   *
   * *(Santi: "la tormenta debería hacer lo contrario. Debería hacer que los
   * guardias oigan menos al jugador")* — y es lo obvio apenas se dice en voz
   * alta: **la lluvia y los truenos TAPAN el ruido**. Que te delataran más era
   * al revés de lo que pasa afuera de la pantalla.
   *
   * Y CAMBIA LO QUE LA TORMENTA SIGNIFICA. Antes era "este tren es más
   * difícil"; ahora es "en este tren se entra callado". Como el clima **se ve
   * en el mapa antes de elegir la vía**, pasa de ser una lotería que sufrís a
   * una decisión que tomás: te esperás la lluvia para hacer el trabajo limpio.
   *
   * 0,55 con `hearRadius` 230 y `hearStepRadius` 58 deja el disparo en 127 px
   * (8 baldosas, contra 14) y las pisadas en 32 px (2 baldosas): **casi hay que
   * estar al lado tuyo para oírte caminar**.
   *
   * LO QUE NO TOCA, y es lo que lo mantiene acotado: a cuántos VAGONES despierta
   * un disparo. Eso es `noiseWagons` (del arma) y `ruidoExtra` (del tipo de
   * tren), aparte. Un tiro en una tormenta sigue despertando lo mismo — la
   * tormenta te ayuda a MOVERTE, no a tirotear.
   */
  tormenta: {
    id: 'tormenta',
    peso: 20,
    hearMult: 0.55,
    color: '#7a8a9c',
  },
};

export const CLIMA_POR_DEFECTO = 'despejado';

/** Qué clima le toca a un tren. Se sortea junto con el tipo (ver mapScene.js). */
export function sortearClima(rng) {
  return sortearPorPeso(CLIMA, rng);
}

/**
 * ESTADO DEL TREN — combinable. Cada entrada se tira por separado con su
 * propia `chance`; el resultado es la lista de las que salieron (puede ser
 * vacía, una sola, o varias a la vez).
 */
export const ESTADO_TREN = {
  /**
   * ALERTA YA ACTIVADA — el tren sube con la alarma sonando desde el primer
   * cuadro, antes de que dispares un tiro.
   *
   * Reusa el mismo camino que ya existe cuando te ven galopando y entrás con
   * `alarmaInicial` (rideScene.js / raidScene.js): acá sólo cambia DE DÓNDE
   * sale ese flag — del sorteo del tren, no de que te hayan visto.
   *
   * 🐛 SUBIDA DE 8% A 20% — Santi, después de un par de partidas: "quiero
   * subir las probabilidades de redada y alarma". Elegido sobre una tabla
   * de tres (15/20/30%).
   *
   * 🐛 Y BAJADA DE 20% A 10% — Santi, ya jugando la Fase 4/5: *"solo quiero
   * que bajes la probabilidad del 'ya estaban sobre aviso'"*. Con 20% te
   * tocaba uno de cada cinco asaltos, y es el modificador que más caro se
   * paga: te saca de entrada el trabajo limpio, la racha y todo el sigilo
   * del asalto, antes de que puedas hacer nada. Uno de cada diez lo deja
   * como lo que tiene que ser —la mala suerte del día, no una rutina— sin
   * apagarlo.
   */
  alertaActivada: {
    id: 'alertaActivada',
    chance: 0.10,
  },

  /**
   * REDADA — FASE 2 DEL PLAN. El tren viaja con más guardias Y pelean mejor,
   * a la vez. Se aplica en `construirPerfilIA` y en el armado de `enemies`
   * (world/train.js): mejor IA reusa el `aiOverrides` de "Alta vigilancia"
   * (dura, data/train.js) — no toca vida —, y "más guardias" duplica CADA
   * patrulla que ya existe en cada vagón, con la copia arrancando desde la
   * mitad de su propio recorrido para no pisarse con el original.
   *
   * EL BLINDADO QUEDA AFUERA. Ya tiene su tope de guardias (4, el techo del
   * juego) y sus propias reglas aparte (nunca sale de su vagón, dinamita
   * propia) — sumarle más ahí sería otro sistema, no éste.
   *
   * 🐛 SUBIDA DE 5% A 15%, Y AHORA CON PISO DE RECOMPENSA — Santi: "Redada
   * debería aparecer su chance cuando el jugador tiene más de 250 de
   * recompensa". Antes podía tocarte en tu primer asalto de la partida, sin
   * haber hecho nada todavía — ahora `bountyMinimo` lo apaga del todo
   * (`sortearEstadoTren` ni lo tira) hasta que `gameState.bounty` llegue a
   * ese número, y recién ahí entra en la bolsa con su chance normal. Como ya
   * no compite por espacio con las partidas tempranas, subirla de 5% a 15%
   * (sobre una tabla de tres: 10/15/20%) no lo vuelve injusto — lo vuelve
   * frecuente cuando de verdad puede pasar.
   */
  redada: {
    id: 'redada',
    chance: 0.15,
    bountyMinimo: 250,
  },

  /**
   * PUERTA BLOQUEADA — FASE 4 DEL PLAN. Una o más puertas de madera del tren
   * viajan TRABADAS desde el primer cuadro: empujarlas no las abre (ni vos ni
   * un guardia), hay que romperlas a tiros como a cualquier otra cosa que se
   * interponga.
   *
   * NO ES UN SISTEMA NUEVO, Y ÉSA ES LA GRACIA: `trabada` (entities/door.js)
   * ya existe desde que el Cazarrecompensas traba el tren al despertar —
   * con su tranca roja dibujada, su regla de "sólo se abre rompiéndola" y su
   * excepción para la blindada. Acá sólo cambia DE DÓNDE sale ese flag: del
   * sorteo del tren en vez de un jefe, exactamente igual que `alertaActivada`
   * reusa el camino de la alarma inicial en vez de inventar uno.
   *
   * DOS SORTEOS, NO UNO — *(Santi, eligiendo cómo: "es al azar. Pero no solo
   * en qué vagón, sino en cuántos")*. Éste decide SI el tren trae puertas
   * trabadas; `sortearCuantasPuertasTrabadas` (más abajo) decide cuántas, y
   * `buildTrain` (world/train.js) cuáles.
   *
   * LA BLINDADA NUNCA ENTRA: ya tiene su propia llave (la dinamita) y su
   * puerta no se empuja desde afuera ni estando abierta el resto del tren.
   * Trabarla no significaría nada.
   *
   * 15% es la banda que ya usan sus dos vecinas de este catálogo
   * (`alertaActivada` 20%, `redada` 15%) — primer valor, sin jugar todavía.
   */
  puertaBloqueada: {
    id: 'puertaBloqueada',
    chance: 0.15,
  },

  /** Fase 7 del plan. Llave apagada. */
  frenosDañados: {
    id: 'frenosDañados',
    chance: 0,
  },

  /** Fase 5 del plan, ligado a los paquetes de botín. Llave apagada. */
  listaAbierta: {
    id: 'listaAbierta',
    chance: 0,
  },
};

/**
 * Qué estados le tocan a un tren. Se sortea junto con el tipo (ver
 * mapScene.js). `bounty` es la recompensa que YA tenías al mirar el mapa
 * (`gameState.bounty`, la misma que ya deciden los jinetes y el mini jefe —
 * ver data/riders.js/bosses.js): entradas con `bountyMinimo` (como
 * `redada`) ni entran en el sorteo mientras no llegues a ese número. Es un
 * piso, no una rampa: por debajo, 0% de verdad — no un número chico.
 */
export function sortearEstadoTren(rng, bounty = 0) {
  return Object.values(ESTADO_TREN)
    .filter((e) => bounty >= (e.bountyMinimo || 0))
    .filter((e) => rng.chance(e.chance || 0))
    .map((e) => e.id);
}

/**
 * CUÁNTAS PUERTAS SE TRABAN, cuando `puertaBloqueada` salió sorteada.
 *
 * *(Santi: "es al azar. Pero no solo en qué vagón, sino en cuántos")* — la
 * cantidad es parte de la sorpresa, no una constante. Elegido sobre una tabla
 * de tres distribuciones: 70/20/10 da un promedio de 1,4 puertas trabadas, o
 * sea que la mayoría de las veces es UN obstáculo puntual y de vez en cuando
 * te toca un tren de verdad más cerrado.
 *
 * Nunca cero: si salió el modificador, algo tiene que haber trabado. El "no
 * pasa nada" ya lo cubre el 85% de las veces que este estado no sale.
 *
 * Es un peso, no un rango, para poder darle forma a la cola (que 3 sea raro y
 * 1 lo normal) — un `rng.int(1, 3)` los haría igual de probables.
 */
export const PUERTAS_TRABADAS = {
  una: { id: 'una', cantidad: 1, peso: 70 },
  dos: { id: 'dos', cantidad: 2, peso: 20 },
  tres: { id: 'tres', cantidad: 3, peso: 10 },
};

export function sortearCuantasPuertasTrabadas(rng) {
  return sortearPorPeso(PUERTAS_TRABADAS, rng).cantidad;
}

/**
 * VARIANTES DE GUARDIA — FASE 4 DEL PLAN. Quién viaja en el tren, no cómo
 * está el tren.
 *
 * TERCER EJE, con su propia forma de sortearse — y tiene que ser propia
 * porque es el primero que se juega POR GUARDIA y no por tren (CLIMA,
 * ESTADO_TREN) ni por vagón (COMPORTAMIENTOS_VAGON). Dos guardias del mismo
 * vagón pueden salir distintos, que es exactamente el punto: mirar un vagón
 * ya no te dice qué hay adentro.
 *
 * SON DOS PREGUNTAS SEPARADAS, y por eso hay dos funciones:
 *   1. `variantesPermitidas(bounty, honor)` — ¿qué variantes pueden aparecer
 *      HOY, en esta partida? Depende del estado del jugador, así que se
 *      calcula en `mapScene.js` (que sí conoce `gameState`) y viaja como
 *      dato hasta `buildTrain`, igual que `estado` o `comportamientos`.
 *      `world/train.js` nunca lee `gameState`: sólo arma mundos con lo que
 *      le pasan.
 *   2. `sortearVarianteGuardia(rng, permitidas)` — de las permitidas, ¿le
 *      toca alguna a ESTE guardia? Se juega una vez por guardia común, al
 *      armar el tren.
 *
 * EL BLINDADO Y EL SHERIFF QUEDAN AFUERA, como en redada y en los
 * comportamientos: sus guardias ya tienen tipo propio y reglas propias.
 */
export const VARIANTES_GUARDIA = {
  /**
   * EL PISTOLERO (data/guards.js) — *(Santi: "el Pistolero con la recompensa
   * y honor. Si el jugador tiene más de 300 de recompensa y honor negativo
   * superior a -10, entonces ahí empieza la probabilidad de aparición")*.
   *
   * LAS DOS CONDICIONES A LA VEZ, Y CUENTAN COSAS DISTINTAS: `bounty` es
   * cuánto pagan por tu cabeza (vale la pena contratar gente para cazarte) y
   * `honor` es cómo te ven (bien negativo = te tienen miedo, no van a
   * mandarte a cualquiera). Un forajido caro pero "correcto" no los ve; uno
   * sanguinario pero barato tampoco. Es el primer lugar del juego donde los
   * dos números tienen que dar a la vez para que pase algo.
   *
   * Es un PISO, no una rampa, igual que el `bountyMinimo` de `redada`: por
   * debajo es 0% de verdad — no un número chico.
   *
   * ⚠️ EN RESERVA (`chance: 0`) POR PEDIDO DE SANTI, después de jugarlo y de
   * los dos arreglos que salieron de ahí (la cadencia que no se aplicaba, y
   * el quedarse clavado con un compañero en la línea). *("Quiero que
   * conserves los datos del pistolero actual pero dejalo como en reserva
   * como hiciste con el dinamitero")* — el tipo está entero y medido en
   * data/guards.js; lo único apagado es que salga sorteado.
   *
   * SU VALOR ERA 20% por guardia común (la banda de `alertaActivada`): en un
   * tren estándar de ~11 guardias comunes, unos 2 pistoleros repartidos al
   * azar. Ése es el número al que hay que volver el día que se lo prenda, y
   * el gate de recompensa+honor sigue escrito abajo tal cual se acordó.
   */
  pistolero: {
    id: 'pistolero',
    chance: 0,          // en reserva. Valor con el que se probó: 0.20
    bountyMinimo: 300,
    honorMaximo: -10,
  },

  /**
   * EL DINAMITERO — YA ESTÁ EN EL JUEGO, PERO NO POR ACÁ. Fase 6a.
   *
   * Estaba anotado que el día que existiera el vagón de armas esta `chance`
   * subía de 0 a 0,20 (dinamiteros al azar por todo el tren estándar). Al
   * diseñar el vagón, Santi encontró el problema antes de construirlo: *"si
   * por lo menos uno de esos guardias es un dinamitero sería una catástrofe,
   * porque una sola dinamita lanzada acabaría con todo en el vagón"*. Y no
   * alcanzaba con sacarlo del vagón de armas — con 0,20 hay ~2 sueltos por
   * tren, y un dinamitero alertado camina hasta vos, esté donde esté.
   *
   * ASÍ QUE EL DINAMITERO PASÓ DE SER UNA ESTADÍSTICA A SER UN PERSONAJE:
   * hay UNO por tren con vagón de armas, y da vueltas entre ese vagón y sus
   * dos vecinos (ver `rondaDinamitero` en world/train.js). Está construido
   * ahí y no acá porque su lugar en el tren es parte de lo que es — la jugada
   * que propone (esperar a que salga del vagón) sólo existe si sabés dónde
   * anda, y con dos más repartidos al azar mirar dónde está dejaría de servir
   * para nada.
   *
   * ESTA LLAVE SIGUE EN 0, entonces, pero ya no está esperando nada: es una
   * segunda forma de meter dinamiteros al tren, por si alguna vez se quiere
   * además de la ronda. **0,20 sigue siendo el valor con el que se probó.**
   */
  dinamitero: {
    id: 'dinamitero',
    chance: 0,
  },
};

/**
 * ¿Qué variantes pueden aparecer en esta partida? Filtra por el estado del
 * jugador (recompensa y honor) y saca las que están en 0. Se llama en
 * `mapScene.js`, cuando el tren cambia de tipo, con la misma foto de
 * `gameState` que ya decide si entra `redada`.
 */
export function variantesPermitidas(bounty = 0, honor = 0) {
  return Object.values(VARIANTES_GUARDIA)
    .filter((v) => (v.chance || 0) > 0)
    .filter((v) => bounty >= (v.bountyMinimo ?? 0))
    .filter((v) => honor <= (v.honorMaximo ?? Infinity))
    .map((v) => v.id);
}

/**
 * ¿Y a ESTE guardia le toca alguna? Devuelve el id del tipo, o `null` si
 * quedó siendo un guardia común.
 *
 * Se tiran en orden y gana la primera que salga: con una sola variante viva
 * hoy da igual, pero cuando haya dos o más el orden del catálogo pasa a ser
 * la prioridad. Está escrito así (y no como un sorteo por peso entre todas)
 * porque cada variante tiene su propia condición para existir: no compiten
 * por un mismo lugar, cada una se pregunta por separado si le toca.
 */
export function sortearVarianteGuardia(rng, permitidas = []) {
  for (const id of permitidas) {
    const v = VARIANTES_GUARDIA[id];
    if (v && rng.chance(v.chance || 0)) return id;
  }
  return null;
}

/**
 * EL CIVIL ENCUBIERTO — FASE 4 DEL PLAN. Uno de los pasajeros de un vagón no
 * es un pasajero: va armado, y espera a que le des la espalda.
 *
 * *(Santi, eligiendo el disparador entre tres: "al darle la espalda")* — no
 * al robarlo, no al pasarle cerca. Eso convierte en peligroso el gesto más
 * repetido del asalto: darte vuelta y seguir camino.
 *
 * CÓMO SE SORTEA. Una vez por VAGÓN con pasajeros, y como mucho uno por
 * vagón: cada pasajero "tira" su `CHANCE_CIVIL_ENCUBIERTO`, y si alguno sale,
 * ese vagón lleva uno (`sortearCivilEncubierto` hace esa cuenta de una:
 * 1 − (1−p)^n es exactamente "que al menos uno de los n saque").
 *
 * QUÉ DABA EN LA PRÁCTICA, con el tren estándar (4 + 4 + 5 pasajeros):
 *   vagón de 4 → 34,4%   vagón de 5 → 41,0%
 *   promedio: 1,1 encubiertos por tren, y ~2 de cada 3 trenes traen alguno
 *   (medido sobre 400 trenes: 1,07).
 *
 * POR QUÉ HAY UN TOPE POR VAGÓN: sin él, un vagón podía salir con tres, y
 * entonces robar pasajeros dejaría de ser una apuesta para ser una trampa.
 * Uno por vagón mantiene la duda ("¿cuál de estos cuatro?") sin volver
 * imposible la decisión.
 *
 * ⚠️ EN RESERVA (0) POR PEDIDO DE SANTI, junto con el Pistolero y el
 * Dinamitero: *("Haz lo mismo con el civil encubierto")*. Todo el sistema
 * queda construido y verificado —la revelación al darle la espalda, el aviso
 * de 1,1 s, la conversión a guardia, el tipo `encubierto` en data/guards.js—
 * y lo único apagado es que salga sorteado. **0,10 es el valor con el que se
 * probó**, y es el número al que hay que volver para prenderlo; el 74% de
 * trenes con alguno era, de hecho, lo primero a revisar cuando se juegue.
 */
export const CHANCE_CIVIL_ENCUBIERTO = 0;

/**
 * A QUÉ DISTANCIA SE ANIMA. 64px son cuatro baldosas: tenés que haber estado
 * cerca de verdad, no cruzando el vagón por el otro pasillo. Es casi el mismo
 * número que `CONFIG.enemy.hearStepRadius` (58) — la distancia a la que este
 * juego ya considera que dos personas comparten un lugar.
 */
export const ENCUBIERTO_RADIO = 64;

/**
 * CUÁNTO ES "DARLE LA ESPALDA". Es el coseno del ángulo entre hacia dónde
 * APUNTÁS y dónde está él: −0,3 quiere decir que tiene que quedar bien detrás
 * de tu mira (más de 107° para cualquier lado), no apenas fuera de foco.
 *
 * Se mide contra la MIRA y no contra hacia dónde caminás, y es a propósito:
 * con mouse+WASD podés ir para un lado apuntando para el otro, y lo que lo
 * envalentona es que no le estés apuntando. Es la misma lectura que ya usa
 * `CONFIG.player.direccionAtras` (moverse "de espaldas" se mide contra la
 * mira, no contra el paso).
 */
export const ENCUBIERTO_COSENO = -0.3;

/**
 * Y TIENE QUE SOSTENERSE. 0,8 segundos seguidos dándole la espalda antes de
 * que se decida — mismo criterio que `rendicionSoloMinimo` (1,5) y
 * `traicionCheckCada` (3,0): en este juego nadie toma una decisión con un
 * solo cuadro a favor. Si te das vuelta antes, el reloj se corta y vuelve a
 * empezar de cero.
 */
export const ENCUBIERTO_ESPERA = 0.8;

/**
 * EL AVISO. 1,1 segundos sacando el arma, a la vista, antes de disparar —
 * EXACTAMENTE `CONFIG.enemy.traicionDuracion`, el tiempo que tarda un rendido
 * en pararse para traicionarte, y por el mismo motivo: es el único aviso que
 * hay, así que tiene que alcanzar para leerlo y reaccionar.
 *
 * Ningún peligro de este juego dispara sin que el cuerpo lo anuncie primero
 * (el guardia levanta el arma, el de la dinamita enciende la mecha, el
 * rendido se para). Éste no iba a ser la excepción: la sorpresa es QUIÉN es,
 * no que te mate sin que puedas hacer nada.
 */
export const ENCUBIERTO_DURACION = 1.1;

/**
 * ¿Este vagón lleva un civil encubierto? `n` = cuántos pasajeros tiene.
 *
 * Con la chance en 0 corta antes de tirar: además de ser más claro, no gasta
 * un número del `rng` — así prender o apagar esta llave no corre la secuencia
 * de todos los sorteos que vienen después.
 */
export function sortearCivilEncubierto(rng, n) {
  if (!n || CHANCE_CIVIL_ENCUBIERTO <= 0) return false;
  return rng.chance(1 - Math.pow(1 - CHANCE_CIVIL_ENCUBIERTO, n));
}

/**
 * COMPORTAMIENTO DE GUARDIAS — FASE 3 DEL PLAN, primera mitad (conversando y
 * vigilando puerta; durmiendo queda para una segunda vuelta, "el más
 * particular de los tres" según el propio plan de Santi).
 *
 * A diferencia de CLIMA y ESTADO_TREN (que son del tren ENTERO), esto se
 * sortea UNA VEZ POR VAGÓN — pick-one, como clima, porque un vagón no puede
 * estar "conversando" Y "vigilando puerta" a la vez. `mapScene.js` arma un
 * array paralelo a `composicion` (`tren.comportamientos`), un valor por
 * vagón, con el mismo `tipoTren.modificadores` que ya gatea clima/estado.
 *
 *   normal          — patrulla como siempre. Nada cambia.
 *   conversando     — dos guardias del vagón se plantan juntos, quietos, y
 *                      mientras sigan en `patrol` sospechan más lento (un
 *                      multiplicador sobre suspicionNear/Far, mismo
 *                      mecanismo que ya usa `player.sneaking` con
 *                      `suspicionSneak`). Sólo entra en la bolsa si el vagón
 *                      tiene 2 o más patrullas — el comedor, con una sola,
 *                      queda afuera (ver `sortearComportamiento`).
 *   vigilandoPuerta — el/los guardia(s) del vagón nacen plantados junto a SU
 *                      puerta de entrada (mismo borde que ya usa
 *                      `alertaEnPuerta`, systems/ai.js) en vez de patrullar
 *                      — mismo patrón "centinela" (`path: []`) que ya usa el
 *                      4to guardia del blindado.
 *
 * El blindado queda afuera de este sorteo (como en redada): sus guardias
 * tienen sus propias reglas y no participan todavía.
 *
 * 40% normal / 30% conversando / 30% vigilandoPuerta — elegido por Santi
 * sobre una tabla de tres opciones. Más frecuente que clima/estado a
 * propósito: es lo primero que se nota jugando (posición y ritmo, no un
 * número escondido), así que tiene sentido que aparezca seguido. Primer
 * valor sin calibrar jugando, como el resto de este archivo.
 *
 * vigilandoCaja — Santi: "recuerda que también hay un tipo de estado que
 * vigila una caja fuerte" (ya estaba en el diseño original: "vigilando lo
 * que haya que vigilar ahí"). SÓLO entra en la bolsa si el vagón tiene una
 * caja fuerte de verdad (`sortearComportamiento`, más abajo): hoy el único
 * vagón común con una es el correo — el blindado también tiene, pero ya
 * está afuera de todo este sorteo (ver la nota de `redada` en ESTADO_TREN).
 *
 * 🐛 SUBIDO DE 30 A 40 — Santi preguntó "¿cuál es la probabilidad de que
 * haya un guardia custodiando la caja fuerte?" (11,5% en general, contando
 * que primero hace falta un tren estándar y que el correo salga con éste
 * comportamiento sobre los cuatro) y después pidió subirla "un poco".
 * Elegido sobre una tabla de tres (peso 40/50/60 → ~14,3/15,6/17,6%
 * general — verificado por consola, 200.000 tiradas: 14,33%). Con 40, la
 * bolsa del correo pasa a tener a `vigilandoCaja` ligeramente más alto que
 * conversando/vigilandoPuerta (40 contra 30 cada una): dentro de un vagón
 * con caja, ahora sale más seguido que cualquiera de las otras dos.
 */
export const COMPORTAMIENTOS_VAGON = {
  normal: { id: 'normal', peso: 40 },
  conversando: { id: 'conversando', peso: 30 },
  vigilandoPuerta: { id: 'vigilandoPuerta', peso: 30 },
  vigilandoCaja: { id: 'vigilandoCaja', peso: 40 },
};

/**
 * MULTIPLICADOR DE SOSPECHA MIENTRAS CONVERSAN. 0,45 — el mismo número que
 * `CONFIG.enemy.suspicionSneak` (vos agachado): no inventa un precio nuevo,
 * reusa el que el juego ya tiene escrito para "esto distrae". Se aplica en
 * `updateSuspicion` (systems/ai.js), sólo mientras `e.state === 'patrol'`:
 * en cuanto algo los saca de ahí (te vieron, oyeron algo), dejan de estar
 * distraídos solos, sin que haga falta resetear ningún flag a mano.
 */
export const CONVERSANDO_SUSPICION_MULT = 0.45;

/**
 * EL CONO DE VISIÓN TAMBIÉN SE ANGOSTA MIENTRAS CONVERSAN.
 *
 * *(pedido de Santi, jugando: "no parece que en realidad conversan [...] no
 * se están mirando de frente [...] Deberían estar enfrentados al charlar y
 * el cono que tienen que hace que te puedan ver debería reducirse")*
 *
 * Mitad del cono normal (`CONFIG.enemy.viewAngle`, 0,95 rad de media
 * apertura) — no un número nuevo inventado, la misma proporción que ya usa
 * el juego para "esto lo distrae" (`spreadApuntado` del Colt/Smith es la
 * mitad de su dispersión sin apuntar). Un guardia mirando a su compañero en
 * vez de al pasillo tiene, literalmente, menos ojo puesto en vos.
 *
 * Primer valor sin calibrar jugando, como el resto de este archivo.
 */
export const CONVERSANDO_VIEW_ANGLE = CONFIG.enemy.viewAngle * 0.5;

/**
 * Y EL CONO TAMBIÉN LLEGA MENOS LEJOS.
 *
 * *(Santi, después de ver el cono angosto: "debería ser el cono más
 * corto")* — angosto (el ángulo) y corto (el alcance) son dos cosas
 * distintas, y hasta acá sólo se había tocado la primera. Misma
 * proporción de siempre: la mitad de `CONFIG.enemy.viewDistance` (118px).
 * Se aplica igual que `CONVERSANDO_VIEW_ANGLE`, como `viewDistance`
 * opcional de `canSeeFrom` (el mismo parámetro que ya usan los mini
 * jefes, sólo que para agrandar el cono en vez de achicarlo).
 */
export const CONVERSANDO_VIEW_DISTANCE = CONFIG.enemy.viewDistance * 0.5;

/**
 * CUÁNTO TARDA EL COMPAÑERO EN DARSE CUENTA.
 *
 * *(pedido de Santi, jugándolo: "cuando los guardias están hablando y uno se
 * pone en amarillo, después de un segundo, el otro también se tiene que
 * poner en amarillo")*
 *
 * Es lo que uno esperaría de dos personas hablando: si el que tenés enfrente
 * corta la frase por la mitad y se queda mirando el pasillo, mirás para donde
 * mira. Antes los dos estaban distraídos por separado y podía pasar que uno
 * te estuviera cazando mientras el otro seguía contando su historia —
 * exactamente el tipo de cosa que hace que se lean como muñecos y no como
 * dos tipos charlando.
 *
 * EL SEGUNDO DE DEMORA ES LA MITAD DE LA IDEA. Sin él, la pareja se
 * alertaría junta y en el mismo cuadro, que se ve como un interruptor. Con
 * él, se ve la CADENA: uno corta, y recién después el otro se da vuelta. Y
 * ese segundo es tuyo — es la ventana para resolver al primero antes de que
 * sean dos.
 *
 * Va acá y no en CONFIG porque es de esta capa (los comportamientos de la
 * Fase 3), igual que los otros tres números de `conversando`.
 */
export const CONVERSANDO_CONTAGIO = 1.0;

/**
 * Qué comportamiento le toca a UN vagón. `elegibleConversando` es si ese
 * vagón tiene 2+ patrullas; `elegibleCaja`, si tiene una caja fuerte de
 * verdad (`WAGONS[id].loot`, algún `type: 'strongbox'`). El que no cumple
 * sale con peso 0 esta vez, sin tocar el catálogo — mismo patrón que "alta
 * vigilancia" en 0.
 */
export function sortearComportamiento(rng, elegibleConversando, elegibleCaja) {
  if (elegibleConversando && elegibleCaja) return sortearPorPeso(COMPORTAMIENTOS_VAGON, rng).id;
  const ajustado = { ...COMPORTAMIENTOS_VAGON };
  if (!elegibleConversando) ajustado.conversando = { ...ajustado.conversando, peso: 0 };
  if (!elegibleCaja) ajustado.vigilandoCaja = { ...ajustado.vigilandoCaja, peso: 0 };
  return sortearPorPeso(ajustado, rng).id;
}
