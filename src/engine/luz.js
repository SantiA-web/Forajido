/**
 * 💡 LA LUZ DEL ESTILO NUEVO: POR ESCALONES, COMO EL PIXEL ART DE VERDAD.
 *
 * *(Santi: "la iluminación sí quiero que se vea bien pixel art")*. Nada de
 * degradés ni transparencias: cada punto sube o baja uno o dos pasos por la
 * escala de su color (ver engine/paleta.js). En el borde entre dos escalones
 * va un TRAMADO (puntos alternados, con la matriz de Bayer), que es como los
 * juegos viejos hacían un borde suave sin tener más colores.
 *
 * LA NOCHE ES EL MISMO DIBUJO: un campo de luz más bajo, con los faroles
 * levantándolo alrededor. No hay que dibujar nada dos veces.
 *
 * El dibujo llega como ÍNDICES de la paleta (no colores), con dos marcas por
 * punto:
 *   emite   1 = da luz propia (el vidrio de un farol, un fogonazo): no se toca.
 *   pareja  1 = es de alguien (gente, animales): recibe la luz PAREJA, la del
 *           punto donde está parado, sin tramado. Con tramado se veía sucio.
 */
import { RGB, sombrear } from './paleta.js';

/** La matriz de Bayer de 4×4: el orden en que se prenden los puntos del tramado. */
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

/** El escalón de luz en (x, y) para un campo `f` (en pasos, con decimales). */
export function escalon(f, x, y) {
  return Math.floor(f + BAYER[y & 3][x & 3] / 16);
}

/**
 * ILUMINA UN DIBUJO DE ÍNDICES y devuelve los colores (para un ImageData).
 *
 * @param indices  Int16Array de ancho×alto (−1 = vacío, queda transparente)
 * @param marcas   Uint8Array: 1 emite, 2 pareja (ver arriba), 0 lo demás
 * @param campo    (x, y) => pasos de luz, con decimales
 * @param pies     (x, y) => [px, py]: para un punto "parejo", dónde se mide su luz
 */
export function iluminar({ ancho, alto, indices, marcas, campo, pies, salida }) {
  const out = salida || new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const k = y * ancho + x;
      let i = indices[k];
      const o = k * 4;
      if (i < 0) { out[o + 3] = 0; continue; }
      const m = marcas ? marcas[k] : 0;
      if (m === 2 && pies) {
        const [px, py] = pies(x, y);
        i = sombrear(i, Math.round(campo(px, py)));
      } else if (m !== 1) {
        i = sombrear(i, escalon(campo(x, y), x, y));
      }
      const c = RGB[i];
      out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
    }
  }
  return out;
}
