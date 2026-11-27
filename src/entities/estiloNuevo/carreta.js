/**
 * 🛞 ESTILO NUEVO — LA CARRETA DE CARGA (etapa 4 del campo con vida; como el venado: 3D de Blender pasado a puntos).
 *
 * Los mapas viven en assets/carretaPuntos.js (los armó un programa: ver lo que dice ahí). Acá se les ponen los colores
 * de la paleta de 48 y se guardan armados, como el venado. De noche tiene sus propios colores. Sin caballos todavía (Santi: "los caballos... se los ponemos después").
 */
import { iluminar } from '../../engine/luz.js';
import { CARRETA } from '../../assets/carretaPuntos.js';
import { CARRETA_CARGA } from '../../assets/carretaCargaPuntos.js';
import { CARRETA_MINA } from '../../assets/carretaMinaPuntos.js';
import { CARRETA_MINAIDA } from '../../assets/carretaMinaidaPuntos.js';
import { CARRETA_DILIGENCIA } from '../../assets/carretaDiligenciaPuntos.js';

/** 🛞 Cada tipo, su dibujo *(Santi, 2026-11-26: "con la lona los colonos y sin la lona el de carga y la de mina")*. */
// (`minaIda`: la de la mina yendo a la mina, con la paga en el cofre y la caja vacía.)
const DE_TIPO = { colono: CARRETA, carga: CARRETA_CARGA, mina: CARRETA_MINA, minaIda: CARRETA_MINAIDA, diligencia: CARRETA_DILIGENCIA };

/** Los colores de cada letra (ver las letras en assets/carretaPuntos.js). Tablas gastadas, lona cruda y sucia (🔁 era casi blanca: desentonaba), hierro. */
const PELO = { l: 36, b: 35, s: 34, e: 33, f: 32, c: 16, k: 15, q: 14, w: 14, r: 35, t: 34, d: 33, h: 32, n: 31, a: 32, o: 0,
  // (los cajones de mercadería, de madera nueva; la pintura roja y el logo claro de la de la mina; el mineral, gris)
  u: 7, v: 6, p: 5, x: 10, y: 9, z: 8, g: 17, i: 25, j: 24, m: 23 };
// (🔁 De noche la lona iba a 23 y 31: con el velo de la noche encima quedaba una mancha azul oscura, más oscura que el
// suelo. La lona clara de noche se sigue viendo clara: un escalón más oscura que de día y el velo hace el resto.)
const PELO_NOCHE = { l: 35, b: 34, s: 33, e: 33, f: 32, c: 15, k: 14, q: 33, w: 33, r: 34, t: 33, d: 32, h: 3, n: 1, a: 1, o: 1,
  u: 6, v: 5, p: 4, x: 9, y: 8, z: 39, g: 16, i: 24, j: 23, m: 2 };

const guardados = new Map();
/**
 * El dibujo armado y sus datos. `tam`: 'grande' o 'chico'; `vista`: este, oeste, norte, sur y las diagonales (noreste, noroeste, sureste, suroeste); `pose`; `cuadro`.
 * `fino`: sin el contorno de afuera (lo pone el borde fino de un píxel, como a la gente y a los animales).
 */
export function dibujoCarreta({ tipo = 'colono', tam = 'grande', vista = 'este', pose = 'rueda', cuadro = 0, fino = false }, noche = false) {
  const clave = tipo + tam + vista + pose + cuadro + (noche ? 'n' : 'd') + (fino ? 'f' : '');
  let g = guardados.get(clave);
  if (g) return g;
  const D = mapaCarreta(tam, vista, pose, cuadro, tipo);
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
export function mapaCarreta(tam, vista, pose, cuadro = 0, tipo = 'colono') {
  const P = (DE_TIPO[tipo] || CARRETA)[tam][vista][pose];
  return Array.isArray(P) ? P[cuadro % P.length] : P;
}
