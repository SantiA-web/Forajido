/**
 * EL PERISTA — el que te compra lo que sacaste del tren de carga.
 *
 * *(Santi: "habría que agregar un lugar en el pueblo medio informal, que es
 * dónde se venden estas cosas")*
 *
 * Acá viven SÓLO LAS REGLAS DE PRECIO. Dónde está el local es cosa de
 * data/town.js, cómo se ve adentro de data/interiors.js, y qué te dice de
 * text/es.js — igual patrón que la tienda.
 *
 * COMPRA EL LOTE ENTERO, DE UN GESTO, y es una decisión de diseño y no una
 * comodidad: hoy no existe ningún motivo para quedarse con un objeto en vez de
 * venderlo, así que una lista donde eliges cuáles vender sería fricción sin
 * ninguna decisión adentro. Un perista que te mira la bolsa y te tira UN número
 * es además mucho más de este mundo que una vidriera con precios.
 *
 * Y EL NÚMERO SE DESGLOSA al decirlo: cuánto vale la mercadería, cuánto te suma
 * o te resta que esté caliente, y cuánto tu nombre. Es la única forma de que
 * dos sistemas invisibles (la alarma de un asalto que ya terminó, y `honor`) se
 * vuelvan algo que se puede jugar en contra.
 */

import { CONFIG } from './config.js';

/**
 * MERCADERÍA CALIENTE — la que sacaste de un tren que llegó a dar la alarma.
 *
 * *(idea propia, aprobada por Santi como "opción A": el bono de trabajo limpio
 * no se podía aplicar a los objetos, porque se calcula sobre el dinero — y sin
 * él, salir limpio de un tren de carga no valía absolutamente nada)*
 *
 * ES EL BONO DE TRABAJO LIMPIO, DICHO EN EL IDIOMA DE ESTE TREN. Y usa EL MISMO
 * NÚMERO (`CONFIG.raid.cleanBonus`, +100%) a propósito: no es un sistema nuevo
 * con una perilla nueva, es el de siempre entrando por otra puerta. Si algún
 * día se mueve el bono del botín en plata, esto se mueve con él y las dos mitades
 * del juego siguen diciendo lo mismo.
 *
 * LO QUE CAMBIA ES CUÁNDO SE COBRA. El bono en plata lo ves en la pantalla de
 * resultados, tres segundos después del asalto. Éste te lo dice un tipo en una
 * trastienda, mirándote la bolsa, cuando ya no podés hacer nada al respecto.
 */
export function multiplicadorLimpio(caliente) {
  return caliente ? 1 : 1 + CONFIG.raid.cleanBonus;
}

/**
 * EL PESO DE TU NOMBRE — `honor` movido a plata.
 *
 * *(Santi: "mientras más Honor (buena persona) sea el jugador, más dinero le va
 * a pagar el perista. Y mientras más bajo sea el honor del jugador menos le va a
 * pagar", con estos escalones exactos)*
 *
 * POR QUÉ UN PERISTA —QUE ES UN DELINCUENTE— PAGA MEJOR AL QUE ES BUENA
 * PERSONA. Suena al revés y no lo es, si `honor` se lee como lo que de verdad
 * mide: **qué tan derecho sos**. Al que tiene fama de cumplir no lo estafan; al
 * que todos desprecian le ofrecen dos monedas, porque sabe que no tiene a quién
 * más venderle.
 *
 * ⚠️ Y QUEDA ANOTADO LO QUE ESTO DEJA DESBALANCEADO: con esto, el honor bajo es
 * **puro castigo**. Ya te costaba (menos guardias se rinden, ver
 * `rendicionPorHonor`) y ahora además te cuesta plata, sin que ser temido te dé
 * una sola cosa a cambio. El lugar natural para equilibrarlo, si algún día se
 * quiere, es al COMPRAR: al armero no le regateás igual si te tienen miedo.
 *
 * SON ESCALONES Y NO UNA RECTA, y eso es de Santi. Una recta (`honor × 0,002`)
 * habría sido más simple y peor: no se siente. Con escalones hay un momento en
 * que **cruzás** algo y el precio cambia de verdad, y eso se puede perseguir.
 *
 * LOS CUATRO ESCALONES SON ALCANZABLES, que es la condición para que existan.
 * Un asalto sin matar a nadie da +15 (`asaltoSinSangre`) y perdonar a un rendido
 * +12, así que el primero se cruza en un asalto y el último (100) en cuatro o
 * cinco. Para el otro lado va más rápido todavía: rematar a un rendido son −20
 * de una.
 */
export const ESCALONES_HONOR = [
  { desde: 100, ajuste: 0.20 },
  { desde:  60, ajuste: 0.15 },
  { desde:  40, ajuste: 0.08 },
  { desde:  15, ajuste: 0.03 },
];

/**
 * Devuelve la fracción que se suma (honor positivo) o se resta (negativo) al
 * precio. Entre −15 y 15, cero: el que todavía no es nadie cobra lo que vale la
 * mercadería y nada más.
 *
 * Es `>` y no `>=` porque así lo pidió Santi: "si PASÁS el honor 15".
 */
export function ajustePorHonor(honor = 0) {
  const magnitud = Math.abs(honor);
  const escalon = ESCALONES_HONOR.find((e) => magnitud > e.desde);
  if (!escalon) return 0;
  return honor > 0 ? escalon.ajuste : -escalon.ajuste;
}

/**
 * TASA EL LOTE ENTERO y devuelve el desglose, no sólo el total: lo que se puede
 * mostrar no se escribe, pero lo que NO se puede mostrar hay que decirlo, y
 * estos tres números no tienen ninguna otra forma de verse.
 *
 * El orden importa: el honor se aplica sobre el precio YA con el bono de limpio
 * adentro (o sea sobre lo que te iba a pagar), no sobre el valor de catálogo.
 * Tu nombre no cambia lo que vale un lingote — cambia lo que este tipo te
 * ofrece por él.
 */
export function tasarLote(objetos = [], honor = 0) {
  let base = 0;
  let conLimpio = 0;
  let calientes = 0;

  for (const o of objetos) {
    base += o.valor;
    conLimpio += o.valor * multiplicadorLimpio(o.caliente);
    if (o.caliente) calientes++;
  }

  conLimpio = Math.round(conLimpio);
  const fraccion = ajustePorHonor(honor);
  const porHonor = Math.round(conLimpio * fraccion);

  return {
    cantidad: objetos.length,
    base,
    /** Lo que suma que la mercadería no esté marcada. */
    bonoLimpio: conLimpio - base,
    calientes,
    /** La fracción de honor (puede ser negativa) y lo que significa en plata. */
    fraccionHonor: fraccion,
    porHonor,
    total: Math.max(0, conLimpio + porHonor),
  };
}
