/**
 * EL PUEBLO — donde se gasta lo que robaste.
 *
 * El campamento es tuyo y está vacío; el pueblo es de otros y está lleno. Esa
 * es toda la diferencia, y es a propósito: son los dos polos entre los que va
 * a vivir la fase 3. En el campamento decidís SI salir; en el pueblo decidís
 * CON QUÉ salir.
 *
 * POR QUÉ ES UNA CALLE Y NO OTRO CLARO. El campamento entra entero en pantalla
 * porque es un refugio y tiene que leerse de un vistazo. El pueblo, no: es más
 * ancho que la vista y hay que RECORRERLO, con la cámara siguiéndote como en
 * el tren. Que caminar la calle cueste unos segundos es lo que lo hace un
 * lugar y no un menú con fachadas dibujadas — la misma razón por la que en el
 * campamento hay que caminar hasta el cartel.
 *
 * ESTÁ CONSTRUIDO SIN NINGUNA TIENDA QUE FUNCIONE, y eso es deliberado
 * (pedido de Santi: "solo el sistema del pueblo, todavía sin uso real"). Se
 * arma primero el lugar, se camina, se ve si se siente un pueblo; recién
 * después se le cuelgan las transacciones. Al revés —construir la tienda y
 * después buscarle dónde ponerla— es como se termina con un menú disfrazado.
 *
 * Cada puerta es el perchero de un sistema ya diseñado en NOTAS-DISENO:
 *
 *   establo   → los caballos (data/horse.js ya es un catálogo)
 *   armería   → las ocho armas (data/weapons.js, diseñadas, falta la tienda)
 *   cantina   → los compañeros, y la gente con la que se habla
 *   sheriff   → tu recompensa, que YA se mueve de verdad (gameState.bounty)
 */

import { CONFIG } from './config.js';

export const PUEBLO = {
  /** Más ancho que la pantalla: hay que caminarlo. */
  ancho: 760,
  alto: CONFIG.view.height,

  /**
   * La línea por la que se camina. Las fachadas quedan arriba. Era 150 en la
   * pantalla vieja (216 de alto); se estira en proporción a la de hoy, y lo que
   * gana arriba es cielo.
   */
  calleY: Math.round(150 * CONFIG.view.height / CONFIG.vistaVieja.height),
  /** Cuánto te podés separar de esa línea hacia arriba y hacia abajo. */
  calleAncho: 26,

  /**
   * Dónde queda tu caballo atado. Es por donde llegaste y por donde te vas:
   * el mismo verbo (F, montar) en las dos puntas del viaje. Que volver sea
   * exactamente el gesto inverso de venir hace que no haya que explicarlo.
   */
  caballo: { x: 60 },

  /**
   * Las cuatro puertas. `x` es el centro de la fachada; el jugador interactúa
   * parándose debajo. Los alcances son generosos porque acá no hay ninguna
   * presión de tiempo.
   */
  edificios: [
    { id: 'establo', x: 170, ancho: 86, alto: 62, alcance: 40 },
    { id: 'armeria', x: 320, ancho: 78, alto: 70, alcance: 38 },
    { id: 'cantina', x: 470, ancho: 96, alto: 76, alcance: 44 },
    { id: 'sheriff', x: 630, ancho: 74, alto: 58, alcance: 36 },

    /**
     * LA CASA DE EMPEÑOS — el perista, donde se vende lo que sacaste del tren
     * de carga (ver data/perista.js).
     *
     * ES LA ÚLTIMA PUERTA DE LA CALLE, y las dos cosas que eso significa son a
     * propósito:
     *
     *  1. **Cuesta el pueblo entero.** Llegás con el caballo en el x=60 y esto
     *     está en el 715: vender es caminar la calle completa, y de paso pasás
     *     por delante de todo lo demás con la bolsa al hombro.
     *  2. **Queda pegada a la oficina del sheriff**, y ésa es la mejor cosa que
     *     tiene. El que te compra lo robado trabaja a dos puertas de la ley, y
     *     nadie dice nada. No hace falta escribirlo en ningún cartel: se lee
     *     caminando.
     *
     * Y ES LA MÁS CHICA Y LA MÁS BAJA de las cinco. Tampoco es un capricho: los
     * otros cuatro son negocios que quieren que entres. Éste no.
     */
    { id: 'perista', x: 715, ancho: 58, alto: 48, alcance: 34 },
  ],

  /**
   * LA GENTE. No hacen nada — caminan y tienen una frase — y sin embargo son
   * lo que separa "cuatro fachadas" de "un pueblo". Un lugar sin gente se lee
   * como un decorado, por muy bien dibujado que esté.
   *
   * `rango` es hasta dónde se aleja de su punto de partida, ida y vuelta. Que
   * cada uno tenga el suyo evita que caminen todos igual, que es lo que
   * delata a un maniquí.
   */
  gente: [
    { id: 'viejo',    x: 240, rango: 26, vel: 9,  alcance: 22 },
    { id: 'mujer',    x: 400, rango: 40, vel: 14, alcance: 22 },
    { id: 'borracho', x: 520, rango: 14, vel: 6,  alcance: 22 },
    { id: 'chico',    x: 590, rango: 58, vel: 22, alcance: 22 },
  ],
};
