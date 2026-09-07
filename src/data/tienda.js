/**
 * QUÉ VENDE CADA LOCAL, Y CÓMO SE MIRA DE CERCA.
 *
 * La tienda no es una lista de botones: es **una escena donde ves la
 * mercadería**, el caballo en su pesebre o el revólver sobre el paño del
 * mostrador. Por eso este archivo no describe un menú, describe una vidriera:
 * qué se vende, con qué números se compara y cómo se dibuja cada cosa.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * UNA SOLA ESCENA PARA LAS DOS TIENDAS (`scenes/shopScene.js`), igual que hay
 * una sola escena para los cuatro interiores. Un caballo y un revólver no
 * tienen nada en común como objetos, pero la PREGUNTA es la misma —*¿este o
 * el que ya tengo?*— y eso es lo que la escena resuelve.
 *
 * Para que el código no sepa nunca si está mostrando un arma o un animal, cada
 * tienda trae sus propios accesos (`precio`, `tuyo`) y su propia lista de
 * barras. Agregar la cantina (compañeros) más adelante debería ser escribir una
 * entrada acá y nada más.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * LAS BARRAS: MÁS LLENO = MEJOR, SIEMPRE. Es la única regla que las hace
 * legibles de un vistazo. Por eso la recarga no muestra los segundos que tarda
 * (donde menos sería mejor) sino cuánto le sobra a un tope: una barra llena es
 * "se recarga rapidísimo", en las seis. La excepción está marcada con `malo` y
 * se dibuja en otro color — el RUIDO de un arma no es una virtud, es lo que
 * despierta el tren a tus espaldas.
 */

import { WEAPONS, DEFAULT_WEAPON } from './weapons.js';
import { HORSES, DEFAULT_HORSE } from './horse.js';
import { MELEE, DEFAULT_MELEE } from './melee.js';

export const TIENDAS = {
  // --------------------------------------------------------------- armería
  armeria: {
    titulo: 'ARMAS EN VENTA',
    /** A qué interior se vuelve al salir. */
    interior: 'armeria',
    /** Qué dibujo usa la escena: el mostrador con el paño, o el pesebre. */
    escenario: 'mostrador',

    catalogo: WEAPONS,
    items: ['colt', 'smith'],

    /** Cuál de todos es el que llevás puesto hoy. */
    tuyo: (st) => st.weapon || DEFAULT_WEAPON,
    precio: (it) => it.price,
    /**
     * `ranura` es DÓNDE SE GUARDA lo comprado (`gameState.owned.weapon`), y
     * `equipar` es qué llevás puesto. Antes eran lo mismo —comprar el Smith te
     * dejaba sin el Colt— y por eso volver atrás costaba caminar hasta el
     * pueblo y pagarlo de nuevo. Ahora la tienda decide qué TENÉS y el cajón del
     * campamento qué LLEVÁS hoy. Ver `owned` en state/gameState.js.
     */
    ranura: 'weapon',
    equipar: (st, itemId) => { st.weapon = itemId; },

    stats: [
      { etiqueta: 'DAÑO', valor: (a) => a.damage, max: 5 },
      { etiqueta: 'BALAS', valor: (a) => a.magazine, max: 8 },
      { etiqueta: 'CADENCIA', valor: (a) => 1 / a.fireRate, max: 5 },
      /**
       * Cuánto le SOBRA a un tope de 4 s: lleno = recarga instantánea.
       * El tope subió de 3 a 4 cuando la recarga del Colt subió a 3,0 —con
       * el tope viejo el Colt daba justo CERO, una barra vacía que se lee
       * como un bug y no como "es lento". Con 4, el Colt muestra un poco
       * (1/4) y el Smith bastante más (3/4): la diferencia real, visible.
       */
      { etiqueta: 'RECARGA', valor: (a) => 4 - a.reloadTime, max: 4 },
      // Lo mismo con la dispersión: lleno = clava donde apuntás.
      { etiqueta: 'PUNTERÍA', valor: (a) => 0.12 - a.spread, max: 0.12 },
      // La única que se lee al revés, y por eso va en rojo.
      { etiqueta: 'RUIDO', valor: (a) => a.noiseWagons, max: 3, malo: true },
    ],

    /** Cómo se dibuja cada una de cerca. Puro aspecto: no lo mira el juego. */
    look: {
      colt: { metal: '#8f99a6', brillo: '#c3ccd6', madera: '#7a5836', cano: 34, tambor: 'redondo' },
      smith: { metal: '#a3adb8', brillo: '#d2dae2', madera: '#5a4028', cano: 26, tambor: 'quiebre' },
    },
  },

  // ------------------------------------------------- armería, cuerpo a cuerpo
  /**
   * EL SEGUNDO RUBRO DE LA ARMERÍA. Mismo local, mismo armero, mismo mostrador
   * — otra vidriera.
   *
   * Es exactamente lo que este archivo prometía que iba a costar agregar un
   * rubro: una entrada acá y un renglón en el diálogo del armero
   * (`data/interiors.js`). No hizo falta tocar la escena de tienda, que sigue
   * sin saber si está mostrando un revólver, un caballo o un hacha.
   *
   * `equipar` escribe en `st.melee` en vez de `st.weapon`, y eso es todo lo que
   * hace falta para que sean dos ranuras distintas: podés llevar el Colt Y el
   * hacha, porque son dos preguntas separadas.
   */
  armeriaCuerpo: {
    titulo: 'ACERO EN VENTA',
    interior: 'armeria',
    escenario: 'mostrador',
    /**
     * El escenario (dónde estás parado) y la mercadería (qué mirás) son dos
     * cosas distintas. Éstas se venden sobre el MISMO mostrador que los
     * revólveres, pero un hacha no es un revólver con otras proporciones — es
     * otro objeto, y necesita su propio dibujo (`dibujarFilo`, shopScene.js).
     */
    mercaderia: 'filo',

    catalogo: MELEE,
    /**
     * LA CULATA NO ESTÁ EN LA LISTA, y no es un olvido: **no es un objeto que
     * se compre, es no tener nada**. Ponerla en el mostrador con un cartel de
     * $0 sería vender el hecho de tener manos.
     *
     * Rompe a propósito la regla de que "siempre está el tuyo en la lista para
     * comparar" (ver la cabecera de scenes/shopScene.js): esa regla existe para
     * que la pregunta sea *"¿es mejor que el que tengo?"*, y acá la respuesta ya
     * la da el precio — si estás mirando aceros es porque el puño no te alcanza.
     *
     * El hacha tampoco aparece todavía, pero por otro motivo y con otro
     * mecanismo: lleva `desbloqueo: 'bosque'` y la filtra `shopScene`.
     */
    items: ['cuchillo', 'hacha'],

    tuyo: (st) => st.melee || DEFAULT_MELEE,
    precio: (it) => it.price,
    ranura: 'melee',
    equipar: (st, itemId) => { st.melee = itemId; },

    /**
     * TRES BARRAS, y la del medio es la que cuenta la historia entera.
     *
     * `VELOCIDAD` va como "cuánto le sobra a un tope", igual que la RECARGA de
     * las armas de fuego, para que se respete la regla de oro de esta pantalla:
     * **más lleno = mejor, siempre**. Si mostrara los segundos del cooldown, el
     * hacha tendría la barra más llena por ser la más lenta.
     *
     * Y `DAÑO` deja a la culata en CERO a propósito. Una barra vacía acá no es
     * un bug: es la ficha diciendo la verdad —esta arma no mata— y es lo que
     * hace legible de un vistazo por qué las otras dos cuestan plata.
     *
     * 🐛 LA TERCERA BARRA DECÍA "SILENCIO" Y ERA MENTIRA. Las tres son
     * silenciosas por la espalda (usan el mismo `quietNoise`); lo que la culata
     * tiene de único es que **no mata**. Y no es una virtud decorativa: medido,
     * un guardia degollado con la alarma sonando te suma 15 de recompensa
     * (`bounty.pesoGuardia`) y uno noqueado suma CERO. La barra llena de la
     * culata es plata que no vas a pagar en la horca.
     */
    stats: [
      { etiqueta: 'DAÑO', valor: (a) => a.damage, max: 3 },
      { etiqueta: 'VELOCIDAD', valor: (a) => 1.6 - a.cooldown, max: 1.3 },
      { etiqueta: 'PIEDAD', valor: (a) => (a.noquea ? 1 : 0), max: 1 },
    ],

    look: {
      culata:   { metal: '#8f99a6', brillo: '#c3ccd6', madera: '#7a5836', cano: 20, tambor: 'redondo' },
      cuchillo: { metal: '#b8c0c8', brillo: '#e2e8ee', madera: '#6b4a2e', cano: 14, tambor: 'hoja' },
      hacha:    { metal: '#9aa4ae', brillo: '#ccd4dc', madera: '#5a4028', cano: 10, tambor: 'hacha' },
    },
  },

  // --------------------------------------------------------------- establo
  establo: {
    titulo: 'CABALLOS EN VENTA',
    interior: 'establo',
    escenario: 'pesebre',

    catalogo: HORSES,
    items: ['criollo', 'mustang'],

    tuyo: (st) => st.horse || DEFAULT_HORSE,
    precio: (it) => it.precio,
    ranura: 'horse',
    equipar: (st, itemId) => { st.horse = itemId; },

    /**
     * Sólo TRES barras, y las tres son las tres stats (ver data/horse.js
     * para las escalas 1-5). Con el Mustang ahora especializado en
     * velocidad y flojo en las otras dos, las tres barras SE VEN distintas
     * de un vistazo — antes, con velocidad y aguante iguales entre los dos
     * caballos, esas dos barras existían pero no decían nada.
     */
    stats: [
      /**
       * `max: 200` — subió de 140 cuando `sprintSpeed` pasó a ser una velocidad
       * ABSOLUTA en vez de relativa al tren (ver `trenVelocidad` en
       * data/horse.js). Con el tope viejo, los dos caballos llenaban la barra y
       * la comparación —que es todo el sentido de esta pantalla— desaparecía.
       */
      { etiqueta: 'VELOCIDAD', valor: (c) => c.sprintSpeed, max: 200 },
      { etiqueta: 'AGUANTE', valor: (c) => c.aguanteMax / c.aguanteGasto, max: 30 },
      { etiqueta: 'SALTO', valor: (c) => c.saltoPreciso, max: 20 },
    ],

    /**
     * UN SOLO COLOR POR CABALLO, y es a propósito.
     *
     * El brillo de arriba, la sombra de la panza y el tono apagado de las
     * patas del lado de allá NO se escriben acá: se calculan a partir del
     * pelo (ver `paleta` en shopScene.js). Un animal iluminado con seis
     * colores escritos a mano nace desafinado el día que se cambia uno, y
     * agregar un caballo tiene que ser elegir un color, no doce.
     *
     * `manchas` es el pelo del mustang: si está, el cuerpo se pinta con
     * parches de ESE color, sombreados igual que el resto.
     */
    look: {
      criollo: { pelo: '#6a4a33', crin: '#33241a', manchas: null },
      mustang: { pelo: '#cdb9a0', crin: '#4a3a2c', manchas: '#5c4531', fase: 4.5 },
    },
  },
};
