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
    /** Comprar y equipar son el mismo gesto: no hay más de un arma a la vez. */
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

  // --------------------------------------------------------------- establo
  establo: {
    titulo: 'CABALLOS EN VENTA',
    interior: 'establo',
    escenario: 'pesebre',

    catalogo: HORSES,
    items: ['criollo', 'mustang'],

    tuyo: (st) => st.horse || DEFAULT_HORSE,
    precio: (it) => it.precio,
    equipar: (st, itemId) => { st.horse = itemId; },

    /**
     * Sólo TRES barras, y las tres son las tres stats (ver data/horse.js
     * para las escalas 1-5). Con el Mustang ahora especializado en
     * velocidad y flojo en las otras dos, las tres barras SE VEN distintas
     * de un vistazo — antes, con velocidad y aguante iguales entre los dos
     * caballos, esas dos barras existían pero no decían nada.
     */
    stats: [
      { etiqueta: 'VELOCIDAD', valor: (c) => c.sprintSpeed, max: 140 },
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
