/**
 * De qué está hecho el tren.
 *
 * El tren se lee de DERECHA a IZQUIERDA en dificultad de escape: la plataforma
 * trasera está en la punta izquierda (ahí espera tu caballo) y la locomotora
 * queda a la derecha. El vagón 1 es el más cercano a la salida; el último, el
 * más lejano. Entre vagón y vagón hay un tramo de enganche al aire libre.
 *
 *      [🐴] [1]-[2]-[3]-[4]-[5]-[6]-  -->  locomotora
 *       salida                            (más adentro = más lejos de volver)
 *
 * Decisión de diseño importante: el botín NO mejora hacia adelante. Meterse
 * hasta el fondo no es "mejor", es una apuesta más cara: gastás caballo para
 * llegar y después tenés que desandar todo para bajarte. Desde afuera ves QUÉ
 * tipo de vagón es cada uno, pero no cuánto tiene adentro.
 *
 * ---------------------------------------------------------------------------
 * TIPOS DE TREN — un catálogo, igual patrón que WEAPONS o HORSES.
 *
 * Antes había un solo `TRAIN` fijo. Ahora cada ruta del mapa (`data/region.js`)
 * sortea, cada vez que la mirás, con QUÉ tren te vas a encontrar — y el tipo de
 * tren es una de las tres cosas que varían (las otras dos son la dificultad,
 * más abajo, y la composición de vagones de siempre).
 *
 * Cada entrada es una receta completa: de qué vagones está hecho, sus reglas
 * de mezcla, y —si le tocan— sus propias reglas de juego. La mayoría de los
 * campos son opcionales: si un tipo no los trae, se comporta como el estándar.
 *
 *   composition    la baraja de vagones (ids de `data/wagons.js`)
 *   posicionMinima { id: vagón mínimo } — ese vagón nunca antes de esa posición
 *   posicionFija   { id: 'ultima' } — ese vagón SIEMPRE ahí, nunca se mezcla
 *   sustituciones  [{ de, por, chance }] — a veces este tren cambia un vagón
 *                  por otro. Es la primera capa de variedad que toca DE QUÉ
 *                  está hecho el tren y no sólo quién viaja adentro (ver
 *                  `armas` en el estándar, más abajo)
 *   peso           cuántas fichas mete en la bolsa del sorteo (ver más abajo)
 *   raidDuration   segundos del asalto para este tren (si no está, usa
 *                  CONFIG.raid.duration)
 *   ruidoExtra     vagones que se suman al alcance de un disparo (encima de lo
 *                  que ya decide el arma — ver data/weapons.js `noiseWagons`)
 *   sospechaMult   multiplica qué tan rápido sospechan y gritan los guardias
 *                  de ESTE tren (ver CONFIG.enemy.suspicionNear/Far)
 *   rodantesCada   cada cuántos segundos se suelta un barril o un cajón adentro
 *                  del vagón (ver CONFIG.rodante). Sin este campo, ese tren no
 *                  suelta nada y el tren es sólo el escenario, como siempre.
 *   traqueteoCada  cada cuántos segundos el propio piso se vuelve traicionero
 *                  (ver CONFIG.traqueteo): balanceo con más dispersión para
 *                  todos, y tirones que empujan y sacuden la carga. Sin este
 *                  campo, ese tren nunca hace esto.
 *   estampida      si es true, los vagones de ganado traen tranqueras que se
 *                  pueden abrir para soltar la manada (ver CONFIG.estampida).
 *                  Sin esto, el mismo vagón es el pasillo de paso de siempre.
 *   pesaElBotin    si es true, con la alarma sonando la plata que llevás
 *                  encima te va frenando (ver CONFIG.peso). Sin esto, cargás
 *                  lo que quieras sin costo, como en toda la fase 2.
 *   modificadores  si es true, este tipo de tren participa del sorteo de
 *                  CLIMA y ESTADO DEL TREN (ver data/modifiers.js). Sin
 *                  esto, siempre sale despejado y sin ningún estado — es la
 *                  llave que decide QUÉ TIPOS entran en ese sorteo, no el
 *                  sorteo en sí.
 *
 *                  Por ahora sólo la tiene el estándar (pedido explícito de
 *                  Santi): el veloz y el de carga ya tienen su propia
 *                  identidad muy afinada (traqueteo, rodantes, estampida,
 *                  el botín que pesa) y sumarles capas encima todavía no se
 *                  probó — se abre a los otros tipos más adelante, cuando
 *                  haga falta, sin tocar la arquitectura del sorteo.
 */

export const TRAIN_TYPES = {
  /** El tren de siempre. Ningún número fuera de lo común. */
  estandar: {
    id: 'estandar',
    name: 'Tren estándar',
    short: 'ESTÁNDAR',
    hint: 'Reparto parejo. Nada fuera de lo común.',
    pista: 'Carga pareja',
    composition: ['pasajeros', 'pasajeros', 'comedor', 'correo', 'ganado', 'blindado'],
    posicionMinima: { blindado: 3, armas: 2 },

    /**
     * EL BLINDADO VA SIEMPRE MÁS ADENTRO QUE EL VAGÓN DE ARMAS, con un vagón de
     * por medio. Ver `cumpleRelativas` en world/train.js para el problema que
     * arregla (la ronda del Dinamitero se rompía cuando caían pegados, en el
     * 43% de los trenes con vagón de armas) y por qué el hueco es lo que
     * importa y no el orden.
     *
     * El precio: el vagón de armas ya no puede caer en los vagones 5 ni 6 — con
     * seis vagones y un hueco de por medio, no queda lugar para el blindado
     * detrás. Queda repartido entre el 2, el 3 y el 4.
     */
    posicionRelativa: { blindado: { detrasDe: 'armas', hueco: 2 } },
    peso: 50,
    modificadores: true,

    /**
     * EL VAGÓN DE ARMAS — Fase 6a. Uno de cada cuatro trenes estándar cambia el
     * de ganado por el de armas (data/wagons.js).
     *
     * ES UN SORTEO Y NO UN CAMBIO FIJO, y es lo que hace que valga la pena:
     * la frase que abre todo este plan es *"conozco estos vagones, pero nunca
     * sé exactamente qué me voy a encontrar"*, y hasta ahora eso valía para
     * quién viajaba adentro (clima, estado, comportamientos, paquetes) pero
     * nunca para QUÉ VAGONES tiene el tren. Ahora también, y encima es lo
     * único de toda la familia que **se ve desde el galope**, antes de subir.
     *
     * REEMPLAZA AL GANADO Y NO SE SUMA COMO SÉPTIMO, elegido sobre una tabla
     * de tres: sumarlo alargaba el tren 33 columnas (528 px, unos 9 s de ida
     * al fondo y 18 s de ida y vuelta de un reloj de 145 — el 12%), y ese
     * número está afinado desde que se cerró la fase 2. Reemplazando, el tren
     * crece 6 columnas y el asalto dura lo mismo.
     *
     * Y AL GANADO Y NO A OTRO porque es el vagón de paso del estándar (un
     * guardia, una bolsa): es el único al que se le puede sacar el lugar sin
     * que se note un agujero. Como es sorteo, además, el ganado sigue
     * apareciendo casi siempre — con él siguen vivos el escondite "junto al
     * corral" de la caja fuerte oculta y el único vagón sin techo del tren.
     *
     * 🔻 BAJÓ DE 0,50 A 0,25 DESPUÉS DE JUGARLO *(Santi: "baja la probabilidad
     * de que aparezca este vagón a un 25%")*.
     *
     * El 50% era el primer número, elegido sin jugar. Y lo que cambió en el
     * medio es que este vagón dejó de afectar sólo a su propio pasillo: desde
     * que hay pólvora repartida por el tren entero cuando él aparece (ver
     * `cajonesExtra` en data/wagons.js), la mitad de los asaltos eran asaltos
     * con barriles por todos lados. A uno de cada cuatro vuelve a ser lo que
     * tenía que ser — algo que reconocés desde el galope y que te cambia el
     * plan del día, no el tren de siempre.
     */
    sustituciones: [{ de: 'ganado', por: 'armas', chance: 0.25 }],

    color: '#c9b68d',
  },

  /**
   * EL VELOZ — frenético, sin sigilo. Una apuesta distinta, no una versión
   * más difícil del estándar: los vagones son mucho más cortos (variantes
   * escritas a mano en `data/wagons.js`, no recortadas por código — la
   * geometría de cada vagón está afinada a mano y se rompe si se recorta
   * sola), así que el tren entero se cruza rápido... pero corre en tu contra.
   *
   * LO QUE CAMBIA respecto del estándar — y nada más: no mejora las armas de
   * los guardias ni les agrega dinamita fuera del blindado.
   *
   *   1. `ruidoExtra: 1` — un disparo se oye un vagón más lejos de lo que ya
   *      dice el arma (el Colt pasa de despertar 1 vagón a 2).
   *   2. `sospechaMult: 1.5` — sospechan y gritan un 50% más rápido.
   *   3. `raidDuration: 90` — ver la cuenta abajo, no es "menos tiempo" nomás.
   *   4. `rodantesCada: 3.8` — EL TREN COMO ENEMIGO. Cada tanto se suelta una
   *      TANDA de barriles y cajones que ruedan hacia la cola, y hay que
   *      leerlos y elegir: salirte del pasillo o gastarles balas (aguantan 3
   *      cada uno). Es lo que hace que este tren se sienta frenético de
   *      verdad, y no sólo apurado — apretar el reloj solo, probado jugando,
   *      daba tensión pero no vértigo. Vienen de a 2 o 3 y escalonados (ver
   *      `rafagaGap` en CONFIG.rodante): de a uno se esquivaban demasiado
   *      fácil, y con la tanda ya no alcanza con correrse y volver.
   *   5. `traqueteoCada: 10` — EL PISO TAMBIÉN. Cada tanto el vagón se
   *      bambolea (más dispersión, para todos) o el tren tironea (te empuja,
   *      y si acelera te sacude encima una tanda extra de barriles). Ver
   *      CONFIG.traqueteo para el porqué de cada número.
   *
   * Y el blindado va SIEMPRE al último vagón, pegado a la locomotora — no
   * "vagón 3 o más adelante" como el estándar, sino una posición FIJA. Por
   * eso usa `posicionFija` y no `posicionMinima`.
   *
   * SOBRE `raidDuration`: TRES VUELTAS, Y LAS TRES POR MEDIR ALGO DISTINTO.
   *
   * 1ª vuelta: 100s (-31% contra el estándar). Jugado, no se sintió
   * frenético — Santi: "no me pasa eso al jugarlo". La causa apareció
   * midiendo: el tren veloz mide un 55% de lo que mide el estándar (vagones
   * a la mitad), pero el reloj sólo había bajado a un 69%. Sobraba MÁS
   * tiempo por baldosa que en el estándar, no menos.
   *
   * 2ª vuelta: 70s, calculado para que el veloz exigiera más por píxel que
   * el estándar (0,040 s/px contra 0,045). Jugado, esto sí apretaba — pero
   * apretar el reloj solo, aislado, sólo da TENSIÓN. El vértigo de verdad
   * (`rodantesCada`, `traqueteoCada`, ver arriba) se construyó DESPUÉS de
   * fijar este número, y las dos cosas juntas comían más reloj del que 70s
   * tenía pensado — Santi, jugándolo esta vez: sólo pudo sacar $200 de un
   * tren que promedia ~$1400.
   *
   * 3ª vuelta: 90s. Y acá midió algo que vale la pena dejar anotado, porque
   * corrige una suposición: un piloto que junta TODO lo que puede sin pelear
   * (sortea barriles, roba, pero no hay un solo guardia armado) ya sacaba
   * ~50% del tren CON LOS 70s VIEJOS. O sea que el reloj solo no era el
   * cuello de botella — la plata que faltaba se fue peleando, no caminando.
   * Subir a 90s no arregla eso (nada de lo que hay en `raidDuration` puede);
   * lo que hace es dar colchón para que un combate que salió mal no te deje
   * sin nada, que es lo que se sentía jugando con 70.
   */
  veloz: {
    id: 'veloz',
    name: 'Tren veloz',
    short: 'VELOZ',
    hint: 'Corto y nervioso. Todo pasa rápido — vos y ellos.',
    pista: 'Poca carga, mucho apuro',
    composition: [
      'pasajeros_corto', 'pasajeros_corto', 'comedor_corto',
      'correo_corto', 'ganado_corto', 'blindado_corto',
    ],
    posicionFija: { blindado_corto: 'ultima' },
    peso: 30,
    raidDuration: 90,
    ruidoExtra: 1,
    sospechaMult: 1.5,
    rodantesCada: 3.8,
    traqueteoCada: 10,
    color: '#e0a13a',
  },

  /**
   * EL DE CARGA — el opuesto del veloz. Más vagones (8), la mayoría mercancía
   * y casi sin pasajeros, con MENOS guardias en total (no diluidos por más
   * vagones: genuinamente menos — ver `correo_liviano` en `data/wagons.js`,
   * un vagón de correo con un solo guardia y el botín repartido en bolsas en
   * vez de concentrado en una caja fuerte). Es la primera respuesta real al
   * problema medido y anotado en NOTAS-DISENO.md: el botín estaba demasiado
   * concentrado en blindado + correo.
   *
   * Ningún cambio de comportamiento: la única diferencia con el estándar es
   * DE QUÉ está hecho el tren y cuánto dura el asalto (un poco más, porque
   * hay más terreno que cubrir).
   */
  carga: {
    id: 'carga',
    name: 'Tren de carga',
    short: 'CARGA',
    hint: 'Mucha mercancía, poca gente. Repartido en vez de concentrado.',
    pista: 'Carga pesada y repartida',
    composition: [
      'correo_liviano', 'correo_liviano', 'correo_liviano',
      'ganado', 'ganado', 'ganado',
      'comedor', 'blindado',
    ],
    posicionMinima: { blindado: 3 },
    peso: 20,
    raidDuration: 165,

    /**
     * EL GANADO SE PUEDE SOLTAR. Es la identidad de este tren, y sale de algo
     * que ya tenía: es el único que lleva TRES vagones de ganado, que hasta
     * ahora eran pasillo decorado.
     *
     * Con esto el de carga deja de ser "el estándar pero más largo" y pasa a
     * ofrecer una pregunta propia: **¿podés limpiarlo entero sin que nadie
     * grite?** La estampida es lo que hace jugable esa pregunta —una forma de
     * abrir camino sin disparar— y `CONFIG.peso` es lo que la vuelve tensa,
     * porque acá el que despierta al tren se lo carga al hombro.
     */
    estampida: true,

    /**
     * Y ACÁ EL BOTÍN PESA — pero sólo después de que suene la alarma.
     *
     * Es la contracara de la estampida, y las dos juntas son la identidad del
     * tren: éste es el único donde el sigilo se puede jugar en serio, así que
     * es el único donde despertarlo tiene que costarte algo mientras seguís
     * adentro. Ver CONFIG.peso.
     *
     * En el estándar y en el veloz NO pesa: el estándar tiene su decisión en
     * los caminos y el veloz en el reflejo, y sumarles esto sería mudarle a
     * los tres la misma pregunta.
     */
    pesaElBotin: true,
    color: '#7a8f6b',
  },
};

export const TIPO_TREN_POR_DEFECTO = 'estandar';

/**
 * DIFICULTAD DEL TREN.
 *
 * No es un nivel que sube solo con las partidas jugadas: es una propiedad DEL
 * TREN, independiente del tipo de tren (un Veloz puede viajar en Fácil o en
 * Alta, igual que el estándar). Cuando elegís qué vía asaltar en el mapa,
 * elegís esto también.
 *
 * `vidaExtra` se suma a la vida del tipo de guardia, con tope 4 (ver
 * data/guards.js): tranquilo → guardia común 2, blindado 3. escoltado y dura
 * → guardia común 3, blindado 4 (el tope).
 *
 * `aiOverrides`, sólo en `dura`: no toca la vida, mejora CÓMO pelean. Cada
 * guardia arma su propio perfil de IA al nacer (`construirPerfilIA` en
 * world/train.js), igual patrón que ya usan con la vida vía `guardHealth()` —
 * por eso `systems/ai.js` dejó de leer `CONFIG.enemy` a secas en las partes
 * que varían acá, y pasó a leer `e.ai` (que por defecto es una copia de
 * CONFIG.enemy, y en un guardia de un tren `dura` trae estos overrides).
 */
export const SORTEAR_DIFICULTAD = false;

export const DIFICULTADES = {
  tranquilo: {
    id: 'tranquilo',
    name: 'Ronda tranquila',
    short: 'FÁCIL',
    hint: 'Guardia común.',
    vidaExtra: 0,
    peso: 65,
    color: '#9fd8b8',
  },

  escoltado: {
    id: 'escoltado',
    name: 'Tren escoltado',
    short: 'MEDIA',
    hint: 'Viajan con gente dura.',
    vidaExtra: 1,
    peso: 35,
    color: '#e07a4a',
  },

  /**
   * ALTA — la misma vida que `escoltado` (guardia común 3, blindado 4, el
   * tope del juego), pero además saben pelear mejor. Los cuatro números
   * bajaron/subieron un 25-30% contra la línea de base de CONFIG.enemy:
   * dispersión -25% (pegan más), aimTime -30% (disparan antes), sospecha
   * +25% (te descubren más rápido), y se asoman un 30% más seguido
   * (coverHoldMin/Max más cortos).
   */
  dura: {
    id: 'dura',
    name: 'Alta vigilancia',
    short: 'ALTA',
    hint: 'Guardias más rápidos y certeros.',
    vidaExtra: 1,

    /**
     * PESO 0 = HOY NO SALE SORTEADA. Está construida y entera —
     * `aiOverrides` funciona, y todo el sistema de perfil de IA por guardia
     * existe justamente para ella— pero no entra en la bolsa todavía.
     *
     * Es una LLAVE, no una amputación: la misma decisión que se tomó en su
     * momento con `SORTEAR_DIFICULTAD`. Subirle el peso a un número mayor
     * que cero la devuelve al juego sin tocar una línea de código.
     */
    peso: 0,

    aiOverrides: {
      spreadNear: 0.068,
      spreadFar: 0.21,
      aimTime: 0.21,
      suspicionNear: 2.75,
      suspicionFar: 0.5625,
      coverHoldMin: 0.49,
      coverHoldMax: 1.12,
    },
    color: '#c94f3d',
  },
};

export const DIFICULTAD_POR_DEFECTO = 'tranquilo';

/**
 * EL SORTEO, CON PESOS.
 *
 * `peso` es cuántas fichas mete cada entrada en la bolsa. No hace falta que
 * sumen 100 —el total se calcula solo— pero están escritos como porcentajes
 * porque así se leen de un vistazo:
 *
 *   Tipo de tren:  50% estándar · 30% veloz · 20% carga
 *   Dificultad:    65% fácil · 35% media  (alta está en 0: no sale)
 *
 * Con peso 0 una entrada queda fuera de la bolsa sin desaparecer del
 * catálogo, que es lo que permite tener algo construido y apagado.
 */
export function sortearPorPeso(catalogo, rng) {
  const entradas = Object.values(catalogo).filter((e) => (e.peso || 0) > 0);
  const total = entradas.reduce((suma, e) => suma + e.peso, 0);

  let tirada = rng.range(0, total);
  for (const e of entradas) {
    tirada -= e.peso;
    if (tirada <= 0) return e;
  }
  return entradas[entradas.length - 1];   // por redondeo, nunca debería llegar
}

/** Qué tipo de tren sale. Lo usa el mapa cada vez que un tren completa su vuelta. */
export function sortearTipoTren(rng) {
  return sortearPorPeso(TRAIN_TYPES, rng);
}

/** Qué tan escoltado viaja. Lo usa el mapa en cada parada del recorrido. */
export function sortearDificultad(rng) {
  return sortearPorPeso(DIFICULTADES, rng);
}
