/**
 * 🦌 ESTILO NUEVO — EL VENADO DE PRUEBA (el camino "B": 3D de Blender pasado a puntos y retocado).
 *
 * Los mapas viven en assets/venadoPuntos.js (los armó un programa: ver lo que dice ahí). Acá se les ponen los colores
 * de la paleta de 48 y se guardan armados, como el caballo. De noche, como el caballo, tiene sus propios colores (con
 * la luz de siempre el pelo caía al color del suelo).
 */
import { iluminar } from '../../engine/luz.js';
import { VENADO } from '../../assets/venadoPuntos.js';

/** Los colores de cada letra (ver las letras en assets/venadoPuntos.js). Pelo gris pardo, el del venado bura. */
const PELO = { l: 36, b: 35, s: 34, d: 33, c: 38, k: 37, n: 3, h: 16, g: 15, o: 0 };
const PELO_NOCHE = { l: 34, b: 33, s: 32, d: 3, c: 15, k: 14, n: 1, h: 15, g: 14, o: 1 };

const guardados = new Map();
/**
 * El dibujo armado y sus datos. `tam`: 'grande' o 'chico'; `vista`: este, oeste, norte, sur; `pose`; `cuadro`.
 * 🧪 `fino`: sin el contorno de afuera (de un punto): lo pone después el borde fino de un píxel, como a la gente
 * *(Santi: "quiero ver como quedaría con el borde del pixel 1x1, como el del jugador")*. Los puntos oscuros de
 * adentro (entre las patas, la boca) quedan.
 */
export function dibujoVenado({ tam = 'grande', vista = 'este', pose = 'quieto', cuadro = 0, fino = false }, noche = false) {
  const clave = tam + vista + pose + cuadro + (noche ? 'n' : 'd') + (fino ? 'f' : '');
  let g = guardados.get(clave);
  if (g) return g;
  const D = mapaVenado(tam, vista, pose, cuadro);
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
export function mapaVenado(tam, vista, pose, cuadro = 0) {
  const P = VENADO[tam][vista][pose];
  return Array.isArray(P) ? P[cuadro % P.length] : P;
}
