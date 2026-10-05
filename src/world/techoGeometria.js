/**
 * 🧗 LA FORMA DEL TECHO: dónde se pisa, dónde está la curva y cómo se dibuja.
 *
 * Hay DOS medidas del mismo techo, y conviene no mezclarlas:
 *
 *  - LA DE ADENTRO (la "física"): de 0 al alto del mapa (160). Es la `y` del
 *    jugador arriba, y es la misma que la del vagón de abajo. Por eso los tiros
 *    a ciegas, el ruido y los guardias siguen funcionando sin cambiar nada:
 *    para ellos estás parado justo encima de donde estás.
 *
 *  - LA DIBUJADA: comprimida en `superficie.ancho` (88) desde
 *    `superficie.arriba` (-20). Es lo que ves. Debajo va la pared del costado.
 *
 * `yEnTecho` pasa de una a la otra. Todo lo que se dibuja ENCIMA del techo
 * mientras estás arriba (vos, las balas que suben, los carteles) pasa por acá.
 */

import { CONFIG } from '../data/config.js';

/** Las medidas del techo para un mapa de este alto. */
export function geoTecho(altoMapa) {
  const S = CONFIG.techo.superficie;
  const medio = altoMapa / 2;
  const lomo = (altoMapa * S.lomo) / 2;          // media anchura plana, adentro
  return {
    alto: altoMapa,
    medio,
    lomo,
    curva: medio - lomo,                           // lo que mide cada curva, adentro
    arriba: S.arriba,
    abajo: S.arriba + S.ancho,                     // el borde de acá, dibujado
    ancho: S.ancho,
    escala: S.ancho / altoMapa,                    // de adentro a dibujado
  };
}

/** De la `y` de adentro a la dibujada. */
export function yEnTecho(y, altoMapa) {
  const S = CONFIG.techo.superficie;
  return S.arriba + (y / altoMapa) * S.ancho;
}

/**
 * Cuánto estás metido en la curva: 0 en el lomo, 1 en el borde. Y de qué lado
 * (-1 el de allá, +1 el de acá, 0 en el lomo).
 */
export function enLaCurva(y, altoMapa) {
  const g = geoTecho(altoMapa);
  const d = Math.abs(y - g.medio) - g.lomo;
  if (d <= 0) return { lado: 0, hondo: 0 };
  return { lado: Math.sign(y - g.medio), hondo: Math.min(1, d / g.curva) };
}
