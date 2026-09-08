/**
 * LOS PAQUETES DE UN VAGÓN — FASE 5 del plan "variedad de lo que pasa en los
 * trenes".
 *
 * Un paquete es UN OBJETIVO VALIOSO CON SU CUSTODIA, metido en un vagón
 * cualquiera. Es la primera capa de este plan que no cambia cómo se comporta
 * la gente del tren (eso fueron los comportamientos y las variantes de
 * guardia) sino QUÉ HAY para llevarse — y, sobre todo, dónde.
 *
 * LA IDEA, EN LAS PALABRAS DE SANTI: "paquetes que atan un objetivo a
 * guardias extra, en CUALQUIER vagón (ahí está la sorpresa)". Hasta ahora el
 * valor de un vagón estaba escrito en su tipo: el correo tenía la caja, el
 * comedor la gente, el blindado el premio gordo. Sabiendo el tipo de vagón
 * sabías qué te esperaba. Un paquete rompe eso: el vagón de pasajeros de
 * siempre puede ser, esta vez, el que más plata tiene arriba.
 *
 * CUARTO EJE DE SORTEO, y cada uno tiene su forma por un motivo:
 *   CLIMA               — del tren entero, pick-one (no hay medio nublado).
 *   ESTADO_TREN         — del tren entero, combinable.
 *   COMPORTAMIENTOS     — por vagón, pick-one (nadie conversa y vigila a la vez).
 *   VARIANTES_GUARDIA   — por guardia (dos del mismo vagón pueden diferir).
 *   PAQUETES (esto)     — por vagón, pick-one Y con chance: la mayoría de los
 *                          vagones no lleva ninguno. Es la diferencia con los
 *                          comportamientos, donde SIEMPRE sale algo (aunque
 *                          sea "normal"): un paquete es un hallazgo, no un
 *                          estado, y si apareciera en todos los vagones
 *                          dejaría de ser un hallazgo.
 */

import { CONFIG } from './config.js';

/**
 * CADA CUÁNTO UN VAGÓN ELEGIBLE LLEVA UN PAQUETE.
 *
 * 20% es la banda que ya usan `alertaActivada` y la que tenía el Pistolero:
 * en un tren estándar hay 3 vagones con pasajeros, así que sale ~0,6 paquetes
 * por tren — o sea que más o menos uno de cada dos asaltos trae uno. Bastante
 * para que valga la pena mirar, poco para que no se vuelva rutina.
 *
 * Primer valor, sin jugar todavía.
 */
export const CHANCE_PAQUETE = 0.20;

export const PAQUETES = {
  /**
   * EL PASAJERO RICO Y SU GUARDAESPALDAS.
   *
   * Uno de los pasajeros del vagón lleva encima varias veces lo que lleva
   * cualquiera — y viaja con un guardia plantado al lado que no patrulla:
   * está ahí para cuidarlo a él.
   *
   * LO QUE LO HACE UNA DECISIÓN Y NO UN REGALO: para sacarle la plata hay que
   * quedarse quieto MÁS TIEMPO que con un pasajero común (`robTime`), y a un
   * paso hay alguien mirando el pasillo. O sacás al guardaespaldas primero
   * —y eso cuesta ruido o un cuchillo bien puesto— o robás con él ahí.
   *
   * Y LA PISTA ES EL GUARDIA, no un cartel: un guardia plantado al lado de un
   * pasajero, en un vagón de pasajeros, es raro de ver. El que mira el vagón
   * antes de entrar tiene cómo darse cuenta.
   */
  pasajeroRico: {
    id: 'pasajeroRico',
    peso: 50,
    /** Necesita gente a bordo: sin pasajeros no hay a quién hacer rico. */
    necesitaPasajeros: true,
    /** Cuánto afloja. Un pasajero común da 25-70 (CONFIG.passenger.robMin/Max). */
    botinMin: 150,
    botinMax: 250,
    /** Y tarda más en soltarlo todo: 2,2 s contra los 1,4 de siempre. */
    robTime: 2.2,
    /** Cuántos guardias de más, plantados al lado (no patrullan). */
    guardaespaldas: 1,
  },

};

/**
 * ---------------------------------------------------------------------------
 * LA CAJA FUERTE OCULTA — segunda vuelta, y ahora es DEL TREN, no de un vagón
 * ---------------------------------------------------------------------------
 *
 * *(Santi, después de jugar la primera versión: "La caja fuerte oculta puede
 * estar en cualquier vagón. Hay tres civiles por tren que pueden revelarte la
 * información de dónde está la caja (si es que hay). Esos tres civiles no sí
 * o sí tienen que estar en el mismo vagón que la caja fuerte")*
 *
 * LA PRIMERA VERSIÓN LA ATABA A UN VAGÓN CON PASAJEROS, porque el que la
 * delataba tenía que estar ahí mismo — y eso la dejaba afuera del correo, del
 * ganado y de todo lo que no lleva gente, justo donde uno esconde una caja.
 * Ahora son dos cosas separadas: la caja va en CUALQUIER vagón (menos el
 * blindado, que ya tiene las suyas) y los tres que saben viajan donde les
 * toque.
 *
 * Y LO MÁS IMPORTANTE: LA PISTA DEJÓ DE SER UNA MARCA Y PASÓ A SER
 * INFORMACIÓN. Antes te la delataban y la caja aparecía dibujada, así que el
 * dato no se usaba: se miraba. Ahora te dicen VAGÓN y ESCONDITE —"vagón 3,
 * debajo de un asiento"— y la caja sigue invisible hasta que estés al lado.
 * Tenés que ir hasta ahí y buscarla, que es lo que convierte a un pasajero
 * amenazado en algo más que unos pesos.
 */

/** Cada cuánto un tren esconde una caja. Por TREN, no por vagón. */
export const CHANCE_CAJA_OCULTA = 0.25;

/**
 * CUÁNTA GENTE DEL TREN SABE DÓNDE ESTÁ. Los tres dicen lo mismo y se eligen
 * entre TODOS los pasajeros del tren, sin importar el vagón: tres chances
 * repartidas de enterarte, y ninguna forma de saber cuál de todos es.
 *
 * Tres y no uno porque con uno solo la caja sería casi inencontrable (hay
 * trece pasajeros en un tren estándar); tres y no cinco porque si la mitad
 * del tren sabe, amenazar deja de ser una apuesta.
 */
export const CIVILES_QUE_SABEN = 3;

/**
 * DÓNDE PUEDE ESTAR ESCONDIDA, SEGÚN QUÉ VAGÓN SEA.
 *
 * *(Santi: "puede estar 'debajo de una ventana' o 'debajo de un asiento' si
 * es que es de pasajeros, o 'debajo de una mesa' si es que es el comedor o el
 * vagón de correos. En el de ganado sólo dice 'está junto al corral'")*
 *
 * `tile` es el carácter del layout (data/wagons.js) al que la caja tiene que
 * quedar PEGADA: 'W' ventanilla, 'S' asiento, 'C' mesa/carga/corral. La caja
 * misma va siempre en un tile pisable al lado — si estuviera adentro del
 * mueble no habría forma de abrirla —, y así el lugar donde aparece siempre
 * coincide con lo que dijo el pasajero.
 *
 * El vagón blindado no está en la lista y por eso nunca la lleva: ya tiene
 * dos cajas fuertes propias y su propia llave.
 */
export const ESCONDITES = {
  pasajeros: ['ventana', 'asiento'],
  pasajeros_corto: ['ventana', 'asiento'],
  comedor: ['mesa'],
  comedor_corto: ['mesa'],
  correo: ['mesa'],
  correo_corto: ['mesa'],
  correo_liviano: ['mesa'],
  ganado: ['corral'],
  ganado_corto: ['corral'],
  /**
   * EL VAGÓN DE ARMAS (Fase 6a). Entra en la lista aunque no lleve caja fuerte
   * propia, y no es una contradicción: las cajas del catálogo de un vagón son
   * del VAGÓN, y ésta es del TREN — puede terminar en cualquiera menos el
   * blindado.
   *
   * Y es el mejor escondite que tiene el tren, por lo que cuesta cobrarlo: es
   * el único vagón donde la explosión que abre una caja fuerte puede llevarse
   * puesto todo lo demás.
   */
  armas: ['cajones'],
};

/** El carácter del layout al que se pega la caja en cada escondite. */
export const TILE_DE_ESCONDITE = {
  ventana: 'W',
  asiento: 'S',
  mesa: 'C',
  corral: 'C',
  cajones: 'C',
};

/**
 * ¿Qué paquete lleva este vagón? Devuelve el id, o `null` (lo más común).
 *
 * `elegible` es si el vagón tiene pasajeros: el único paquete que queda por
 * vagón (el pasajero rico) necesita gente a bordo.
 *
 * El sorteo es en dos pasos a propósito — primero SI hay paquete, después
 * CUÁL — para que agregar un paquete nuevo al catálogo no cambie cada cuánto
 * aparecen: sólo reparte distinto la misma bolsa.
 */
export function sortearPaquete(rng, tienePasajeros) {
  if (!rng.chance(CHANCE_PAQUETE)) return null;

  const posibles = Object.values(PAQUETES)
    .filter((p) => (p.peso || 0) > 0)
    .filter((p) => !p.necesitaPasajeros || tienePasajeros);
  if (!posibles.length) return null;

  const total = posibles.reduce((s, p) => s + p.peso, 0);
  let t = rng.range(0, total);
  for (const p of posibles) {
    t -= p.peso;
    if (t <= 0) return p.id;
  }
  return posibles[posibles.length - 1].id;
}

/**
 * CUÁNTO AFLOJA ESTE PASAJERO Y CUÁNTO TARDA.
 *
 * Una sola fuente de verdad para los dos lugares que lo necesitan: el reloj
 * del robo (scenes/raidScene.js) y la barra que lo dibuja. Un pasajero común
 * no tiene nada de esto puesto y cae en los números de siempre.
 */
export function robTimeDe(pa) {
  return pa.robTime || CONFIG.passenger.robTime;
}
