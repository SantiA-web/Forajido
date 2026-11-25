/**
 * 🍖 LA COMIDA, EN PORCIONES *(Santi, 2026-11-18: "ya no existiría el precio de la olla porque todo es por porciones de
 * comida. Una porción sale lo que salía una olla: 5. y venderlas es la mitad redondeada hacia arriba. El almacén está
 * en el pueblo. El que vende también puede vender en packs de porciones y esas cosas")*. Reemplaza a la olla
 * (`OLLA`, data/libreta.js), que queda apagada mientras esta llave esté prendida.
 *
 * Cada día que empieza, cada uno de la banda que está en el campamento (y James) come una porción de la despensa:
 * primero la que se vence antes. Si no alcanza, ese día no comen y cada uno anota una queja chica ("No hubo qué
 * comer"). La despensa se llena comprando en el almacén del pueblo y, desde la etapa de las tareas, cazando y pescando.
 *
 * Los mismos números que el simulador (simulador/banda3.js v15, `N.comida` y `N.caza`). Medido: el que cuida a la
 * banda termina con $1952 y sin perder a nadie el 93% de las veces (con la olla: $1599); la comida le alcanza el 100%
 * de los días en las cuatro regiones.
 */
export const COMIDA = {
  /** 🔑 La llave: con false vuelve la olla. */
  activo: true,

  /**
   * LA REGIÓN, por los golpes que llevas (el juego todavía no tiene los tramos del viaje; los mismos cortes que el
   * simulador): el desierto hasta el golpe 8, la pradera desde el 9, el bosque desde el 17 y la montaña desde el 25.
   */
  // (📖 🔁 Los golpes de cada región, de Santi *(2026-11-22)*: desierto 14, pradera 9, bosque 12, montaña 6. Antes, 8 cada una.)
  regionDesde: { pradera: 15, bosque: 24, montana: 36 },

  /** James también come *(Santi: "si es 8 por cabeza y son 4 por qué dice pagar 15?")*. */
  james: true,

  /** Con qué empieza la despensa en una partida nueva: tres días para los cuatro. */
  inicio: 12,

  /**
   * 🛒 EL ALMACÉN (en el pueblo). `precio`: una porción, por región *(Santi: "Sí, por región")*: en el desierto no
   * hay nada, en la pradera sobra, en la montaña todo sube a lomo de mula. Vender: la mitad, redondeada para abajo
   * *(🔁 Santi, 2026-11-18: "que se redondeé hacia abajo el precio de venta")*. Los `packs`, con su descuento: medido,
   * ahorran unos $30 por partida. Lo que se compra son provisiones secas: duran `duraProvision` días.
   */
  precio: { desierto: 6, pradera: 4, bosque: 5, montana: 8 },
  packs: [{ n: 5, descuento: 0.1 }, { n: 10, descuento: 0.15 }],
  duraProvision: 12,
  /** Cerrado de noche, como el establo y la armería. */
  soloDeDia: true,

  /**
   * Si la despensa alcanza para `avisaDias` días o menos, al empezar el día se avisa (una vez por cada vez que baja).
   */
  avisaDias: 1,

  /**
   * 🦌 LA CAZA *(Santi: "que no sea sí caza o no, sino que caza y cuánto caza (para cuántos días alcanza)")*. La usa la
   * etapa de las tareas. Por región: `chance` de traer algo y cuántas porciones (`min` a `max`); la carne dura `dura`
   * días. El desierto "alcanza apenas"; la pradera, más chance y mejor; el bosque, siempre y un poco mejor; la montaña
   * ("un bosque nevado y denso"), la menor chance y la mayor presa.
   * 🔁 *(Santi: "quiero que Rastreador deje mucha mejor recompensa que buena puntería, que buena puntería sea un
   * detallito")*: la puntería suma `punteria.chance` y `punteria.porciones`; el Rastreador (el que caza o uno que va con
   * él) suma `rastreador.chance` y la presa sale `rastreador.por` veces más grande. Por salida, en promedio:
   *
   *   | región   | sin nada | con puntería | con Rastreador |
   *   | desierto |   1,2    |     2,0      |      3,4       |
   *   | pradera  |   3,2    |     4,4      |      6,8       |
   *   | bosque   |   5      |     6        |      7,5       |
   *   | montaña  |   2,2    |     3,6      |      9,1       |
   *
   * El Cocinero sala lo cazado esa noche: dura `sala` veces más.
   */
  caza: {
    desierto: { chance: 0.4, min: 2, max: 4, dura: 3 },
    pradera: { chance: 0.7, min: 3, max: 6, dura: 4 },
    bosque: { chance: 1, min: 4, max: 6, dura: 4 },
    montana: { chance: 0.2, min: 8, max: 14, dura: 6 },
    punteria: { chance: 0.1, porciones: 1 },
    rastreador: { chance: 0.35, por: 1.5 },
    sala: 2,
  },

  /**
   * 🎣 LA PESCA *(Santi: "se va más días que la caza pero la recompensa es segura, varía cuánto pero siempre hay")*:
   * se va `dias` días y vuelve con `min` a `max` porciones (dura como la carne de la región). 🔁 *(Santi: "paciente sí
   * debería tener una recompensa notable e impulsivo una caída en la recompensa")*: el Paciente trae `paciente` veces
   * (unas 10,5 en vez de 7), el Impulsivo `impulsivo` veces (unas 4).
   */
  pesca: { dias: 2, min: 4, max: 10, paciente: 1.5, impulsivo: 0.6 },
};
