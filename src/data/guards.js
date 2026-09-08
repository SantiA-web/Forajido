/**
 * Tipos de guardia.
 *
 * La idea: la dificultad NO sube por un multiplicador escondido, sube porque
 * en el tren viaja gente distinta. Un guardia que el asalto pasado moría con
 * dos tiros y hoy necesita cuatro, sin haber cambiado de aspecto, se siente
 * como un error del juego. Un tipo con otra silueta se siente como progresión.
 *
 * Por eso cada tipo tiene que verse. Y hay una restricción importante para eso:
 *
 *   EL COLOR DEL CUERPO YA ESTÁ OCUPADO. Dice el ESTADO (gris = tranquilo,
 *   amarillo = sospecha, rojo = combate), que es la información más importante
 *   del juego momento a momento. Así que el tipo se distingue por la SILUETA,
 *   nunca por el color del cuerpo.
 *
 * El techo de vida es 4 y es un compromiso, no un detalle: el Rifle de Caza
 * saca 5, así que mata de un tiro a cualquier guardia del juego. Si algún día
 * aparece un tipo con 5 de vida, esa promesa se rompe en silencio.
 */

export const MAX_GUARD_HEALTH = 4;

export const GUARD_TYPES = {
  normal: {
    id: 'normal',
    name: 'Guardia',
    health: 2,
    look: 'normal',
  },

  blindado: {
    id: 'blindado',
    name: 'Guardia blindado',
    health: 3,
    look: 'placa',      // se le ve la placa en el pecho
  },

  /**
   * EL PISTOLERO — FASE 4 DEL PLAN ("variedad de lo que pasa en los trenes").
   *
   * *(Santi, definiéndolo: "gatillo velocísimo (tiene un revólver en cada
   * mano) y puntería floja. Se cubre poco, se suele parar en medio del
   * pasillo")*
   *
   * NO ES UN GUARDIA MÁS DURO: aguanta lo mismo que cualquiera (2, o 3 en un
   * tren escoltado). Lo que cambia es CÓMO pelea, y las tres cosas que lo
   * definen tiran para el mismo lado — es un tipo que no se cuida.
   *
   *   - Gatillo velocísimo: menos espera entre ráfagas, más balas por ráfaga
   *     y menos tiempo entre bala y bala. Los dos revólveres no son sólo
   *     dibujo: la razón por la que los tiros salen pegados es que hay dos
   *     caños alternándose.
   *   - Puntería floja: +40% de dispersión, cerca y lejos. Tira mucho más y
   *     acierta bastante menos — a distancia de pasillo largo, casi nada.
   *   - `evitaCobertura`: nunca busca dónde parapetarse (ver `needsCover` en
   *     systems/ai.js). Cae solo en la rama de "sin cobertura" que ya existía
   *     desde la fase 2: se acerca hasta unos 92px y ahí se planta a
   *     disparar, en el medio del pasillo. Ninguna conducta nueva — una vieja
   *     a la que nunca nadie llegaba a propósito.
   *
   * ES UN INTERCAMBIO, NO UN ESCALÓN. Te llena el pasillo de plomo, pero está
   * parado al descubierto con la vida de cualquiera: si le contestás rápido,
   * es el guardia más fácil de matar del tren. La dificultad no sube porque
   * el juego haga trampa, sube porque viaja gente distinta — la misma regla
   * que abre este archivo.
   *
   * Cuándo aparece: ver VARIANTES_GUARDIA en data/modifiers.js (pedido de
   * Santi — recompensa alta Y honor bien negativo: sos temido y buscado).
   */
  pistolero: {
    id: 'pistolero',
    name: 'Pistolero',
    health: 2,
    look: 'dosRevolveres',
    evitaCobertura: true,
    /**
     * 🐛 ESTOS NÚMEROS NO HACÍAN NADA HASTA QUE SE ARREGLÓ `tryFire`
     * (systems/ai.js), que leía la constante global en vez del perfil del
     * guardia. *(Santi, jugándolo: "no siento que dispare rápido
     * verdaderamente")* — medido: 1,40 balas/s contra 1,13 de un guardia
     * común, un 24% más en vez del doble largo que decía la ficha.
     *
     * Los valores de abajo son la SEGUNDA vuelta, ya con el arreglo puesto y
     * elegidos por Santi sobre una tabla de tres: ráfagas de 4 con 0,40 s de
     * espera. Da **2,8 balas por segundo contra 0,87** de un guardia común
     * (3,2×), en tandas largas — que es lo que se lee como "dos revólveres".
     */
    ai: {
      fireCooldown: 0.40,   // era 0.75
      burstSize: 4,         // era 2
      burstDelay: 0.16,     // era 0.28: dos caños alternándose
      spreadNear: 0.13,     // era 0.09  (+40%)
      spreadFar: 0.39,      // era 0.28  (+40%)
    },
  },

  /**
   * EL DINAMITERO — FASE 4 DEL PLAN, PERO TODAVÍA APAGADO.
   *
   * Un guardia común que además lleva un cartucho de dinamita y lo usa con
   * las mismas reglas que ya usan los cuatro del vagón blindado: sólo si te
   * tiene parapetado, a media distancia, con la mecha encendida a la vista
   * (`consideraTirarDinamita`, systems/ai.js). NO HIZO FALTA TOCAR UNA LÍNEA
   * DE LA IA: ese código nunca preguntó de qué vagón es el que la tira, sólo
   * si le queda dinamita encima.
   *
   * POR QUÉ NACE APAGADO — *(Santi: "El Dinamitero cuando aparece el vagón de
   * armas/dinamita")*. Ese vagón es de la Fase 6 del plan y todavía no
   * existe, así que su chance de aparición es 0 (ver VARIANTES_GUARDIA en
   * data/modifiers.js). Es la misma llave-no-amputación que ya usan "Alta
   * vigilancia" (`peso: 0`, data/train.js) y `frenosDañados`: el tipo está
   * entero y probado, esperando que exista el vagón del que tiene que bajar.
   */
  dinamitero: {
    id: 'dinamitero',
    name: 'Dinamitero',
    health: 2,
    look: 'bandolera',

    /**
     * DOS EN LA MANO, NO UNA — y son TODO lo que tiene.
     *
     * *(Santi, después de verlo construido: "el dinamitero NO tiene arma de
     * fuego. Él lanza únicamente dinamitas. Y lanza de a dos a la vez y se
     * tarda 5 segundos en volver a tener dos en la mano otra vez")*
     *
     * LO QUE ESTO CAMBIA NO ES UN NÚMERO, ES QUÉ CLASE DE ENEMIGO ES. Un
     * guardia con revólver que además tira dinamita es un guardia con un
     * extra; éste es un tipo con UNA sola herramienta, y de ahí sale todo lo
     * demás: tiene una distancia donde es peligrosísimo (62-150 px), una
     * donde no puede hacer nada (pegado, ver `retrocederParaTirar` en
     * systems/ai.js) y una ventana de cinco segundos, cada cinco segundos, en
     * la que está literalmente desarmado.
     *
     * Los dos cartuchos NO caen en el mismo lugar (ver `puntosDeTanda`): dos
     * juntos serían una dinamita más grande y no agregarían ninguna decisión.
     * Separados te cierran el pasillo de los dos lados, y ahí está la jugada.
     */
    dynamite: 2,

    /**
     * NO DISPARA NUNCA. Lo leen `tryFire` y los dos disparos a ciegas
     * (systems/ai.js): con esto puesto, ninguno de los tres llega a sacar el
     * arma — y no es que apunte y no dispare, directamente no lo intenta. Un
     * guardia que levanta el arma y no tira sería ilegible; el aviso de este
     * tipo es otro, la mecha encendida.
     */
    sinArmaDeFuego: true,

    /**
     * TAMPOCO SE CUBRE — y esto NO es una elección de sabor, es una
     * consecuencia forzada de lo de arriba, encontrada al construirlo.
     *
     * `consideraTirarDinamita` (systems/ai.js) exige línea de tiro DESDE EL
     * CUERPO del guardia, y con razón: `throwTarget` traza el vuelo del
     * cartucho desde ahí, así que si hay un asiento en el medio la dinamita
     * cae contra el asiento — a sus propios pies. O sea que un Dinamitero
     * parapetado no puede tirar. Y como ahora tampoco dispara, se quedaría
     * escondido detrás de un asiento el resto del asalto sin hacer
     * absolutamente nada.
     *
     * Con esto puesto cae en la rama de "sin cobertura" que ya usan el
     * Pistolero y el civil encubierto: se planta a unos 92 px, que está
     * cómodamente dentro de su rango útil (62-150). Y le queda la misma
     * válvula que al Pistolero — si te pierde de vista un rato
     * (`descubiertoBloqueoMax`), se cubre como cualquiera hasta volver a verte.
     *
     * Y es lo que el personaje ES: el que tira algo por el aire necesita el
     * pasillo libre. Parapetarse le tapa el tiro a él mismo.
     */
    evitaCobertura: true,
  },

  /**
   * EL CIVIL ENCUBIERTO — FASE 4 DEL PLAN. En lo que va del asalto fue un
   * pasajero como cualquier otro (entities/passenger.js): se lo podía rodear,
   * asustar, robar. Cuando se revela deja de ser un pasajero y pasa a ser
   * ESTO — un guardia de verdad, con la IA de combate de siempre.
   *
   * SIGUE VESTIDO DE CIVIL (`look: 'civil'`), y no es un detalle: lo que lo
   * hace distinto de todo el resto del tren es que ya no podés confiar en la
   * silueta de un pasajero. Si al revelarse se convirtiera en un guardia con
   * sombrero, la sorpresa duraría un asalto; así, dura para siempre.
   *
   * Aguanta lo mismo que un guardia común. Iba armado bajo el saco, no
   * blindado.
   *
   * NO SE CUBRE (`evitaCobertura`, el mismo flag del Pistolero), y por dos
   * motivos que dan lo mismo:
   *
   *  1. Es lo que el personaje es. Se acaba de parar de un asiento con el
   *     arma en la mano, a tres metros tuyos: no está buscando dónde
   *     parapetarse, se está jugando el todo por el todo. Y te deja la
   *     respuesta: está al descubierto, con dos de vida.
   *  2. 🐛 Y porque cubriéndose no funcionaba. Medido: nace entre las filas
   *     de asientos, el buscador de cobertura le daba un punto del OTRO lado
   *     de un bloque de asientos, y a menos de `routeDistance` (150px) la IA
   *     va en línea recta sin rodear — se quedaba empujando contra un
   *     respaldo, sin disparar un solo tiro en 15 segundos. El
   *     `stuckTimer > 1.2` que debería soltarlo tampoco saltaba, porque se
   *     movía unos píxeles arriba y abajo y lo reseteaba.
   *
   *     Eso último es un agujero VIEJO del sistema de cobertura, no algo que
   *     traiga este tipo: le pasaría a cualquier guardia que empiece a pelear
   *     metido entre asientos. No se veía porque todos los demás entran
   *     caminando por el pasillo desde lejos (y desde lejos sí calculan
   *     ruta). Queda anotado acá para el día que aparezca de nuevo.
   */
  encubierto: {
    id: 'encubierto',
    name: 'Civil encubierto',
    health: 2,
    look: 'civil',
    evitaCobertura: true,
  },

  /**
   * EL SHERIFF (data/bosses.js). Su tipo existe sobre todo para que se vea
   * distinto: la estrella en el pecho, lo único dorado del tren.
   *
   * OJO CON `health`: el Sheriff de verdad NO lo usa. Tiene su propia vida
   * fija (`vida: 3` en data/bosses.js) porque es un tipo con nombre y no puede
   * aguantar distinto según qué escolta le tocó sortear al tren. Este 2 queda
   * como el valor de referencia del tipo por si alguna vez aparece un sheriff
   * anónimo — y para que `guardHealth` nunca devuelva undefined.
   *
   * Lo peligroso de este tipo igual no es cuánto aguanta: es lo que le hace al
   * resto del tren mientras respira.
   */
  sheriff: {
    id: 'sheriff',
    name: 'El Sheriff',
    health: 2,
    look: 'estrella',
  },
};

export const DEFAULT_GUARD_TYPE = 'normal';

/**
 * La vida final de un guardia = la de su tipo + lo que sume la dificultad del
 * tren, con tope en MAX_GUARD_HEALTH.
 *
 * En un tren tranquilo: guardia común 2, blindado 3.
 * En un tren escoltado: guardia común 3, blindado 4.
 */
export function guardHealth(typeId, vidaExtra = 0) {
  const tipo = GUARD_TYPES[typeId] || GUARD_TYPES[DEFAULT_GUARD_TYPE];
  return Math.min(MAX_GUARD_HEALTH, tipo.health + vidaExtra);
}
