/**
 * 🐎 ESTILO NUEVO — EL CABALLO DE SANTI EN PUNTOS DE LA GRILLA.
 *
 * Los mapas viven en assets/caballoPuntos.js y salen de su hoja. Acá sólo se les
 * ponen los colores de la paleta de 48 y se guardan armados, como la gente. La
 * luz y la noche las hace engine/luz.js, igual que con todo lo demás.
 */
import { iluminar } from '../../engine/luz.js';
import * as CRIOLLO from '../../assets/caballoPuntos.js';
import * as MUSTANG from '../../assets/mustangPuntos.js';

/**
 * Los colores de cada letra. El Mustang es marrón rojizo *(Santi: "ponele colores rojizos")*,
 * sin los rojos puros de la paleta: con ellos "parece un caballo de fuego".
 */
const PELOS = {
  criollo: { l: 6, b: 5, s: 4, o: 0, n: 1 },
  mustang: { l: 12, b: 11, s: 47, o: 0, n: 39 },
};

/**
 * De noche no se oscurece con la luz: el pelo y las patas caían al mismo color del
 * suelo y el caballo se quedaba sin cola. Tiene sus colores, y el pelo se ve más
 * claro que la sombra, como con luz de luna. El contorno tampoco es el de día: es
 * del color exacto del suelo de noche, y las patas finitas, que son casi todo
 * contorno, desaparecían.
 */
const PELOS_NOCHE = {
  criollo: { l: 4, b: 33, s: 3, o: 1, n: 2 },
  mustang: { l: 47, b: 39, s: 32, o: 1, n: 2 },
};

const guardados = new Map();
/**
 * El dibujo armado. `fila`: la dirección. `cuadro`: de 0 a 7 al galope, `null` parado.
 * `grande`: el parado de campamento y pueblo. `chico`: el de lejos en el galope.
 */
export function lienzoCaballo({ fila, cuadro = null, grande = false, chico = false, pelaje = 'criollo' }, luz = 0) {
  const clave = fila + '|' + cuadro + '|' + (grande ? 1 : 0) + '|' + (chico ? 1 : 0) + '|' + pelaje + '|' + luz;
  let g = guardados.get(clave);
  if (g) return g;
  const M = pelaje === 'mustang' ? MUSTANG : CRIOLLO;
  const mapa = chico
    ? (cuadro !== null ? M.GALOPE_CHICO[fila][cuadro] : M.QUIETO_CHICO[fila])
    : cuadro !== null ? M.GALOPE[fila][cuadro] : (grande ? M.QUIETO_GRANDE : M.QUIETO)[fila];
  const noche = luz < 0;
  const C = (noche ? PELOS_NOCHE : PELOS)[pelaje] || (noche ? PELOS_NOCHE : PELOS).criollo;
  const ancho = mapa[0].length, alto = mapa.length;
  const indices = new Int16Array(ancho * alto).fill(-1);
  mapa.forEach((linea, y) => {
    for (let x = 0; x < ancho; x++) if (linea[x] !== '.') indices[y * ancho + x] = C[linea[x]];
  });
  const datos = iluminar({ ancho, alto, indices, campo: () => (noche ? 0 : luz) });
  g = document.createElement('canvas');
  g.width = ancho; g.height = alto;
  g.getContext('2d').putImageData(new ImageData(datos, ancho, alto), 0, 0);
  guardados.set(clave, g);
  return g;
}
