/**
 * Catálogo de armas CUERPO A CUERPO. Mismo patrón que weapons.js y horse.js:
 * agregar una es agregar una entrada acá, y ningún sistema conoce los nombres
 * por dentro.
 *
 * *(idea de Santi: "podés golpear cuerpo a cuerpo con tu arma, pero los dejás
 * inconscientes, no muertos ni le sacás una vida. Pegar con el arma tiene que
 * ser muy rápido, pero no mortal. Luego podrías comprar el cuchillo: un poco
 * más lento que pegar con la culata, pero ya sacaría una vida. Y luego el
 * hacha: extremadamente lenta, pero elimina tres vidas")*
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LAS DOS SITUACIONES SIGUEN SIENDO LAS DE SIEMPRE, y ninguna se inventó acá:
 *
 *   POR LA ESPALDA, a alguien que no te vio → la ejecución silenciosa. Es el
 *   premio del sigilo y existe desde que existe el cuchillo. Lo que cambia
 *   ahora es el RESULTADO: con la culata queda inconsciente, con el filo
 *   queda muerto.
 *
 *   DE FRENTE → el forcejeo. Escandaloso, y ahí sí importa el daño.
 *
 * Y ES LA MISMA REGLA PARA LAS TRES, no un caso especial por arma: el arma
 * decide QUÉ tan fuerte y QUÉ tan rápido, no CÓMO funciona el sistema.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * POR QUÉ LA CULATA NO ES "EL ARMA MALA QUE VAS A REEMPLAZAR". Es gratis, es
 * la más rápida de las tres y sirve para lo mismo que el cuchillo: sacar a un
 * guardia del tablero sin un tiro. Lo que NO compra es el tiempo — el que
 * noqueaste se levanta. Comprar el filo no es comprar poder: es comprar que el
 * problema no vuelva. Es la misma economía que la armería de fuego, donde la
 * tienda "no te vende poder, te vende permiso para hacer ruido".
 */

export const MELEE = {
  /**
   * LA CULATA — con lo que ya tenés en la mano. No se compra: es no tener nada.
   *
   * `damage: 0` NO es un arma inútil. De frente aturde (`stagger`), que ya es
   * un respiro para huir o para el segundo golpe, y por la espalda hace lo
   * mismo que el cuchillo salvo que el tipo respira. Su virtud es la
   * VELOCIDAD: a 0,30 s entre golpes es el doble de rápida que el hacha... y
   * más rápida incluso que un tiro de Colt (0,40), que es lo que la vuelve la
   * respuesta correcta cuando alguien se te viene encima de golpe.
   */
  culata: {
    id: 'culata',
    name: 'Culata del arma',
    short: 'CULATA',
    hint: 'Lo que ya tenés en la mano. Rápida y silenciosa, pero no mata.',

    damage: 0,
    cooldown: 0.30,
    swingTime: 0.12,

    /**
     * LA LÍNEA QUE SEPARA A ESTA DE LAS OTRAS DOS: por la espalda deja
     * inconsciente en vez de matar. Ver `noqueoDuracion` en CONFIG.melee para
     * qué significa exactamente estar inconsciente.
     */
    noquea: true,

    price: 0,
  },

  /**
   * EL CUCHILLO — el que el juego tuvo siempre, ahora como una compra.
   *
   * Sus números son los que ya estaban en CONFIG.melee (daño 1, cooldown
   * 0,50), y eso es a propósito: **el arma que ya estaba jugada y afinada
   * queda igual**, y lo nuevo se construye alrededor. Si el cuchillo se
   * hubiera movido para "hacer lugar", habría que volver a validar todo el
   * cuerpo a cuerpo desde cero.
   *
   * Lo que compra por 450 no es daño: es que el guardia no se levante nunca
   * más. Un noqueo dura lo que dura; un degüello dura todo el asalto.
   */
  cuchillo: {
    id: 'cuchillo',
    name: 'Cuchillo de monte',
    short: 'CUCHILLO',
    hint: 'Un poco más lento que la culata. La diferencia es que no se levanta.',

    damage: 1,
    cooldown: 0.55,
    swingTime: 0.16,
    noquea: false,

    price: 450,
  },

  /**
   * EL HACHA — tres de daño, y por eso el arma más situacional del juego.
   *
   * TRES ES EL NÚMERO EXACTO QUE HACÍA FALTA, y no salió de la nada: los
   * guardias tienen 2 o 3 de vida (data/guards.js), así que el hacha **mata de
   * un solo golpe de frente a cualquier guardia común**, incluso en un tren
   * escoltado. Contra un blindado (3-4) lo deja a uno de caer. Es la única
   * arma del juego que resuelve un encuentro de frente sin disparar.
   *
   * Y EL PRECIO ES EL TIEMPO: 1,5 s entre golpes es una eternidad en un
   * pasillo — casi cuatro tiros de Colt, o el tiempo que tarda un guardia en
   * apuntarte y dispararte DOS veces (`aimTime` 0,30 + `fireCooldown` 0,75).
   * Errar un hachazo con alguien enfrente es quedar vendido, así que es un
   * arma para emboscar, no para pelear.
   */
  hacha: {
    id: 'hacha',
    name: 'Hacha de leñador',
    short: 'HACHA',
    hint: 'Lentísima. Pero al que le pega, no se levanta ni preguntando.',

    damage: 3,
    cooldown: 1.5,
    swingTime: 0.35,
    noquea: false,

    /**
     * ⚠️ PRECIO PROVISIONAL — Santi no lo fijó todavía.
     *
     * Cuando puso los otros tres (cuchillo 450, Smith 600, Mustang 1200) dejó
     * el hacha afuera a propósito, así que este número es una estimación mía y
     * hay que confirmarlo cuando exista la región del bosque.
     *
     * 900 sale de ordenarlo contra la escala nueva: **tiene que costar más que
     * el cuchillo** (450), porque hace todo lo que hace el cuchillo y además
     * resuelve un encuentro de frente — con 300, el arma fuerte salía más
     * barata que la débil. Y menos que el Mustang (1200), que sigue siendo la
     * compra grande del juego.
     */
    price: 900,

    /**
     * ⚠️ NO SE VENDE TODAVÍA — se desbloquea en la REGIÓN DEL BOSQUE.
     *
     * *(decisión de Santi: "el hacha todavía no la pongas en la tienda. Quiero
     * que se desbloquee en la región bosque")*
     *
     * El arma está COMPLETA y jugada: si le ponés `gameState.flags.bosque =
     * true` desde la consola, aparece en el mostrador del armero y funciona.
     * Esto no la amputa, la guarda — el mismo patrón que "Alta vigilancia" en
     * data/train.js, que está construida y apagada con `peso: 0`.
     *
     * Y tiene sentido que sea el bosque el que la traiga: un hacha de leñador
     * no se compra en la armería de un pueblo de llanura. La región es la que
     * la justifica, y hasta que exista el arma no tiene de dónde venir.
     *
     * Lo lee `shopScene.js` contra `gameState.flags`. Cualquier ítem de
     * cualquier catálogo puede usar este campo — no es del hacha, es del
     * sistema de tiendas.
     */
    desbloqueo: 'bosque',
  },
};

export const DEFAULT_MELEE = 'culata';

/** El arma cuerpo a cuerpo equipada, con la culata como piso: siempre hay una. */
export function meleeActual(gameState) {
  return MELEE[gameState.melee] || MELEE[DEFAULT_MELEE];
}
