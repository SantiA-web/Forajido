/**
 * EL CAMPAMENTO — el lugar donde empieza todo, y el primero que no es un asalto.
 *
 * Hasta acá el juego era un asalto suelto: arrancabas galopando y terminabas
 * en una pantalla de resultados que te devolvía al mismo galope. El
 * campamento es la primera pieza que hace que un asalto tenga un ANTES y un
 * DESPUÉS, y por eso es la puerta de entrada a la fase 3.
 *
 * POR QUÉ ES UN LUGAR Y NO UN MENÚ. Podría ser una lista de botones —
 * "comprar / dormir / elegir tren"— y funcionaría igual de bien mecánicamente.
 * Pero un menú no se habita: no tiene un caballo atado del que te acordás, ni
 * una fogata a la que volvés. Que haya que CAMINAR hasta el cartel para salir
 * a robar es lo que hace que salir a robar sea una decisión que tomás y no
 * una opción que elegís.
 *
 * CADA OBJETO ES EL PERCHERO DE UN SISTEMA QUE TODAVÍA NO EXISTE, y esa es la
 * razón de que estén estos cinco y no otros. Ninguno es decorado:
 *
 *   fogata  → descansar / pasar el tiempo / (más adelante) los compañeros
 *   poste   → los caballos, que ya son un catálogo (data/horse.js)
 *   carpa   → dormir y GUARDAR la partida
 *   cajón   → el inventario: armas, munición y dinamita
 *   cartel  → el mapa de rutas, que es lo que de verdad destraba la fase 3
 *
 * Mientras esos sistemas no existan, cada objeto contesta con lo que hoy sí
 * se puede saber (qué caballo tenés, con qué arma salís). Es a propósito:
 * un objeto que no hace nada enseña a ignorarlo, y después cuesta el doble
 * lograr que lo mires.
 */

import { CONFIG } from './config.js';

/**
 * Los números de este archivo son de la pantalla vieja (384×216) y se estiran
 * en proporción a la de hoy al final (ver `CONFIG.view`).
 */
const KX = CONFIG.view.width / CONFIG.vistaVieja.width;
const KY = CONFIG.view.height / CONFIG.vistaVieja.height;

export const CAMPAMENTO = {
  /** El centro del claro. Todo se dibuja alrededor de esto: el medio de la pantalla. */
  centro: { x: Math.round(192 * KX), y: Math.round(112 * KY) },

  /**
   * HASTA DÓNDE TE PODÉS ALEJAR.
   *
   * El límite es la luz de la fogata, no una pared invisible: más allá está
   * el desierto de noche, y el suelo se apaga antes de que llegues al borde.
   * Es la misma idea que sostiene el resto del juego — que la regla se vea en
   * la geometría y no haya que explicarla con un cartel.
   *
   * Y el radio es chico a propósito: el campamento tiene que entrar entero en
   * pantalla. Es un lugar para orientarse de un vistazo, no para explorar.
   */
  radio: Math.round(92 * Math.min(KX, KY)),

  /**
   * Los cinco objetos. `alcance` es a qué distancia se puede interactuar; son
   * generosos porque acá no hay ninguna presión de tiempo y pelearse con la
   * posición exacta sería una molestia gratuita.
   */
  objetos: [
    {
      id: 'fogata',
      x: 0, y: 14,          // relativo al centro
      alcance: 30,
    },
    {
      id: 'carpa',
      x: -78, y: -18,
      alcance: 32,
    },
    {
      id: 'cajon',
      // 🔁 Al fondo del campamento *(Santi: "llevala al fondo del campamento")*.
      x: -4, y: -62,
      alcance: 24,
    },
    {
      id: 'poste',
      x: 76, y: -14,
      alcance: 32,
    },
    {
      id: 'cartel',
      // 🔁 Estaba en (12, 62), justo delante de la fogata, y la tapaba. Se corrió a la derecha.
      x: 52, y: 50,
      alcance: 26,
    },
  ],
};

/**
 * 🏕️ LO QUE ESTÁ PARA QUE EL LUGAR PAREZCA HABITADO Y NO SE USA *(Santi eligió darle vida, 2026-11-08)*. Sólo en el estilo nuevo.
 * Va relativo al centro, ya en las medidas de hoy. `huella`: lo que ocupa en el piso (se choca con eso, igual que con los
 * objetos).
 */
export const DECORADO = [
  { id: 'tronco', x: -30, y: 15, huella: { x1: -6, x2: 6, y1: -15, y2: 15 } },
  { id: 'montura', x: 96, y: 12, huella: { x1: -12, x2: 12, y1: -3, y2: 3 } },
  { id: 'piedras', x: -68, y: 60, huella: { x1: -8, x2: 8, y1: -3, y2: 3 } },
  { id: 'piedras', x: 14, y: 76, huella: { x1: -8, x2: 8, y1: -3, y2: 3 } },
  { id: 'roca', x: -98, y: 40, huella: { x1: -10, x2: 10, y1: -4, y2: 4 } },
  { id: 'cactus', x: -30, y: -74, huella: { x1: -5, x2: 5, y1: -3, y2: 3 } },
  // (🌳 Bien atrás del caballo, separado: el tronco arranca detrás del lomo. La sombra de la copa le llega a las patas.)
  { id: 'algarrobo', x: 50, y: -44, huella: { x1: -6, x2: 6, y1: -3, y2: 2 } },
];
/** Dónde te sentás cuando apretás [E] en la fogata: arriba del tronco, relativo al centro. */
export const ASIENTO = { x: -30, y: 16 };

// Las distancias al centro, a la pantalla de hoy.
for (const o of CAMPAMENTO.objetos) {
  o.x = Math.round(o.x * KX);
  o.y = Math.round(o.y * KY);
}
