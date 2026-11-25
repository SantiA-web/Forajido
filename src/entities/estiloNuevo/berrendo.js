/**
 * 🦌 ESTILO NUEVO — EL BERRENDO (como el venado: 3D de Blender pasado a puntos y retocado).
 *
 * Los mapas viven en assets/berrendoPuntos.js (los armó un programa: ver lo que dice ahí). Acá se les ponen los colores
 * de la paleta de 48 y se guardan armados, como el venado. De noche tiene sus propios colores.
 */
import { iluminar } from '../../engine/luz.js';
import { BERRENDO } from '../../assets/berrendoPuntos.js';

/** Los colores de cada letra (ver las letras en assets/berrendoPuntos.js). Pelo canela, blanco y negro. */
const PELO = { l: 7, b: 6, s: 5, d: 4, c: 17, k: 16, n: 1, h: 1, g: 1, o: 0 };
const PELO_NOCHE = { l: 5, b: 4, s: 3, d: 32, c: 15, k: 14, n: 0, h: 0, g: 0, o: 1 };

const guardados = new Map();
/**
 * El dibujo armado y sus datos. `tam`: 'grande' o 'chico'; `vista`: este, oeste, norte, sur; `pose`; `cuadro`.
 * 🧪 `fino`: sin el contorno de afuera (de un punto): lo pone después el borde fino de un píxel, como a la gente
 * *(Santi: "quiero ver como quedaría con el borde del pixel 1x1, como el del jugador")*. Los puntos oscuros de
 * adentro (entre las patas, la boca) quedan.
 */
export function dibujoBerrendo({ tam = 'grande', vista = 'este', pose = 'quieto', cuadro = 0, fino = false }, noche = false) {
  const clave = tam + vista + pose + cuadro + (noche ? 'n' : 'd') + (fino ? 'f' : '');
  let g = guardados.get(clave);
  if (g) return g;
  const D = mapaBerrendo(tam, vista, pose, cuadro);
  const C = noche ? PELO_NOCHE : PELO;
  const alto = D.m.length, ancho = D.m[0].length;
  const indices = new Int16Array(ancho * alto).fill(-1);
  const vacio = (x, y) => x < 0 || y < 0 || x >= ancho || y >= alto || D.m[y][x] === '.';
  const deAfuera = (x, y) => D.m[y][x] === 'o' && (vacio(x - 1, y) || vacio(x + 1, y) || vacio(x, y - 1) || vacio(x, y + 1));
  D.m.forEach((linea, y) => { for (let x = 0; x < ancho; x++) if (linea[x] !== '.' && !(fino && deAfuera(x, y))) indices[y * ancho + x] = C[linea[x]]; });
  const datos = iluminar({ ancho, alto, indices, campo: () => 0 });
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho; lienzo.height = alto;
  lienzo.getContext('2d').putImageData(new ImageData(datos, ancho, alto), 0, 0);
  g = { lienzo, ...D };
  guardados.set(clave, g);
  return g;
}

/** El mapa (sin armar): para el balazo, que mira punto por punto. */
export function mapaBerrendo(tam, vista, pose, cuadro = 0) {
  const P = BERRENDO[tam][vista][pose];
  return Array.isArray(P) ? P[cuadro % P.length] : P;
}
