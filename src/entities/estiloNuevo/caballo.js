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
  criollo: { l: 6, b: 5, s: 4, o: 0, n: 1, L: 6, B: 5, S: 4 },
  mustang: { l: 12, b: 11, s: 47, o: 0, n: 39, L: 12, B: 11, S: 47 },
  /**
   * 🆕 LOS OTROS DOS PELOS DEL CRIOLLO *(Santi: "quiero que el criollo tenga tres colores: el gateado que es el de
   * ahora, y agreguémosle el zaino y un intermedio entre ambos tonos, a esta mezcla entre ambos tonos agrégale una mancha
   * blanca en la cabeza, que sea como vertical")*. Los llevan los caballos de los jinetes de la ley (ver
   * `pelajeDeJinete`). El zaino: marrón oscuro parejo, con la crin y la cola negras. La mezcla: un escalón entre los
   * dos en la luz, la base y la sombra, y la mancha de la cara (las letras en mayúscula, L B S: en los otros pelos son
   * del color de abajo) en crema, más gris donde cae la sombra.
   */
  zaino: { l: 34, b: 33, s: 32, o: 0, n: 1, L: 34, B: 33, S: 32 },
  mezcla: { l: 5, b: 4, s: 3, o: 0, n: 1, L: 17, B: 17, S: 16 },
};

/**
 * De noche no se oscurece con la luz: el pelo y las patas caían al mismo color del
 * suelo y el caballo se quedaba sin cola. Tiene sus colores, y el pelo se ve más
 * claro que la sombra, como con luz de luna. El contorno tampoco es el de día: es
 * del color exacto del suelo de noche, y las patas finitas, que son casi todo
 * contorno, desaparecían.
 */
const PELOS_NOCHE = {
  criollo: { l: 4, b: 33, s: 3, o: 1, n: 2, L: 4, B: 33, S: 3 },
  mustang: { l: 47, b: 39, s: 32, o: 1, n: 2, L: 47, B: 39, S: 32 },
  zaino: { l: 33, b: 3, s: 32, o: 1, n: 2, L: 33, B: 3, S: 32 },
  mezcla: { l: 4, b: 3, s: 32, o: 1, n: 2, L: 25, B: 25, S: 24 },
};

/**
 * EL PELO DE CADA JINETE DE LA LEY, al azar *(Santi: "gateado 40%, zaino 35%, mezcla 25%")*. `r`: un número de 0 a 1.
 */
export function pelajeDeJinete(r) {
  return r < 0.4 ? 'criollo' : r < 0.75 ? 'zaino' : 'mezcla';
}

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
